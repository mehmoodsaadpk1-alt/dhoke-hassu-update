import { videoProcessingService } from './VideoProcessingService';
import { videoStorageProvider, StorageUploadResult } from './VideoStorageProvider';
import { videoService, VideoMetadata, UploadStage } from './VideoService';
import { UploadSummaryLogger, CompressionResult } from '../utils/UploadSummaryLogger';

export interface UploadParams {
  userId: string;
  file: File;
  title: string;
  description: string;
  type?: 'short' | 'video';
  signal?: AbortSignal;
  onProgress?: (progress: number) => void;
  onStageChange?: (stage: UploadStage) => void;
}

const COMPRESSION_THRESHOLD = 20 * 1024 * 1024; // 20MB

// Temporary workaround: Disable video compression until FFmpeg initialization is fixed.
// Change this to true to re-enable compression without any further code changes.
const ENABLE_VIDEO_COMPRESSION = true;

export class VideoUploadService {
  /**
   * Orchestrates the entire video upload pipeline transactionally.
   * Rollbacks storage automatically if the DB insert fails.
   */
  async processAndUpload(params: UploadParams): Promise<void> {
    const { userId, file, title, description, type = 'short', signal, onProgress, onStageChange } = params;

    let uploadedThumbPath: string | null = null;
    let uploadedVideoPath: string | null = null;

    const checkAbort = () => {
      if (signal?.aborted) {
        throw new Error("Upload cancelled by user");
      }
    };

    try {
      checkAbort();
      onStageChange?.('Preparing video');
      onProgress?.(0);

      console.log(`[VideoUploadService] Starting upload pipeline for: ${file.name}`);
      console.log(`[VideoUploadService] Original File Size: ${(file.size / (1024 * 1024)).toFixed(2)} MB`);

      // 1. Generate Thumbnail and Extract Metadata
      const { blob: thumbnailBlob, duration, width, height } = await videoProcessingService.generateThumbnail(file);
      const thumbnailFile = new File([thumbnailBlob], `thumb_${Date.now()}.jpg`, { type: 'image/jpeg' });
      
      checkAbort();

      // 2. Conditional Compression
      let compressionResult;
      
      if (ENABLE_VIDEO_COMPRESSION && file.size > COMPRESSION_THRESHOLD) {
        onStageChange?.('Compressing video');
        compressionResult = await videoProcessingService.compressVideo(file, (p) => {
          checkAbort();
          onProgress?.(p);
        });
      } else {
        const fallbackReason = !ENABLE_VIDEO_COMPRESSION ? 'Compression disabled globally' : 'File too small (< 20MB)';
        compressionResult = {
          originalFile: file,
          processedFile: file,
          compressionUsed: false,
          originalSize: file.size,
          processedSize: file.size,
          bytesSaved: 0,
          compressionRatio: 1,
          compressionTimeMs: 0,
          fallbackReason,
          ffmpegInitialized: false,
          ffmpegLoadTimeMs: 0
        };
      }

      checkAbort();
      onStageChange?.('Uploading'); 
      onProgress?.(0);

      // 3. Upload Thumbnail
      const thumbResult = await videoStorageProvider.uploadThumbnail(userId, thumbnailFile);
      if (thumbResult.error) throw thumbResult.error;
      uploadedThumbPath = thumbResult.path;

      checkAbort();

      // 4. Upload Video
      const videoResult = await videoStorageProvider.uploadVideo(userId, compressionResult.processedFile, (p) => {
        checkAbort();
        onProgress?.(p);
      });
      if (videoResult.error) throw videoResult.error;
      uploadedVideoPath = videoResult.path;

      checkAbort();
      onStageChange?.('Saving Database');
      onProgress?.(95);

      // 5. Save to Database
      const meta: VideoMetadata = {
        user_id: userId,
        type,
        title,
        description,
        video_url: videoResult.url,
        thumbnail_url: thumbResult.url,
        duration: Math.round(duration),
        width: Math.round(width),
        height: Math.round(height),
        size: compressionResult.processedSize,
        encoding_status: 'completed',
        compression_ratio: Number(compressionResult.compressionRatio.toFixed(2)),
        mime_type: compressionResult.processedFile.type || 'video/mp4',
        visibility: 'public'
      };
      
      await videoService.createVideoRecord(meta);

      UploadSummaryLogger.printSummary(compressionResult as CompressionResult, videoResult.url);

      onStageChange?.('Completed');
      onProgress?.(100);

    } catch (err: any) {
      console.error('Video Upload Pipeline Failed:', err);
      
      // Automatic Rollback
      if (uploadedThumbPath) {
        await videoStorageProvider.deleteFile(uploadedThumbPath).catch(console.error);
      }
      if (uploadedVideoPath) {
        await videoStorageProvider.deleteFile(uploadedVideoPath).catch(console.error);
      }

      throw err; // Propagate to UI
    }
  }
}

export const videoUploadService = new VideoUploadService();
