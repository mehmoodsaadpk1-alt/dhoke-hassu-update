import { videoProcessingService } from './VideoProcessingService';
import { videoStorageProvider, StorageUploadResult } from './VideoStorageProvider';
import { videoService, VideoMetadata, UploadStage } from './VideoService';

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

const COMPRESSION_THRESHOLD = 30 * 1024 * 1024; // 30MB

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
      onStageChange?.('Generating Thumbnail');
      onProgress?.(5);

      // 1. Generate Thumbnail and Extract Metadata
      const { blob: thumbnailBlob, duration, width, height } = await videoProcessingService.generateThumbnail(file);
      const thumbnailFile = new File([thumbnailBlob], `thumb_${Date.now()}.jpg`, { type: 'image/jpeg' });
      
      checkAbort();
      onProgress?.(15);

      // 2. Conditional Compression
      let videoToUpload: File | Blob = file;
      let finalSize = file.size;
      let compressionRatio = 1;

      if (file.size > COMPRESSION_THRESHOLD) {
        onStageChange?.('Compressing');
        videoToUpload = await videoProcessingService.compressVideo(file, (p) => {
          checkAbort();
          onProgress?.(15 + (p * 0.60)); // 15% to 75%
        });
        finalSize = videoToUpload.size;
        compressionRatio = file.size / finalSize;
      }

      checkAbort();
      onStageChange?.('Uploading'); // We can treat Uploading Thumbnail and Uploading Video generally as 'Uploading' or specific.
      onProgress?.(75);

      // 3. Upload Thumbnail
      const thumbResult = await videoStorageProvider.uploadThumbnail(userId, thumbnailFile);
      if (thumbResult.error) throw thumbResult.error;
      uploadedThumbPath = thumbResult.path;

      checkAbort();

      // 4. Upload Video
      const videoResult = await videoStorageProvider.uploadVideo(userId, videoToUpload as File, (p) => {
        checkAbort();
        onProgress?.(75 + (p * 0.20)); // 75% to 95%
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
        size: finalSize,
        encoding_status: 'completed',
        compression_ratio: Number(compressionRatio.toFixed(2)),
        mime_type: videoToUpload.type || 'video/mp4',
        visibility: 'public'
      };
      
      await videoService.createVideoRecord(meta);

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
