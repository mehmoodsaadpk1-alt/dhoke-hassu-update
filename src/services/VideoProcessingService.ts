import type { FFmpeg } from '@ffmpeg/ffmpeg';
import type { CompressionResult } from '../utils/UploadSummaryLogger';

export interface ThumbnailResult {
  blob: Blob;
  duration: number;
  width: number;
  height: number;
}

export class VideoProcessingService {
  private ffmpeg: FFmpeg | null = null;
  private baseURL = 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.6/dist/esm';
  private initializationPromise: Promise<void> | null = null;
  private ffmpegLoadTimeMs: number = 0;

  private async initializeFFmpeg(): Promise<void> {
    const startTime = Date.now();
    let timerId: NodeJS.Timeout | undefined;

    const initPromise = (async () => {
      const { FFmpeg } = await import('@ffmpeg/ffmpeg');
      this.ffmpeg = new FFmpeg();
      this.ffmpeg.on('log', ({ message }) => console.log('FFmpeg log:', message));

      // We don't need toBlobURL because our worker is same-origin (provided via classWorkerURL)
      const coreURL = `${this.baseURL}/ffmpeg-core.js`;
      const wasmURL = `${this.baseURL}/ffmpeg-core.wasm`;

      // Explicitly load the worker URL to bypass Vite's dependency pre-bundling bug
      const workerURL = (await import('@ffmpeg/ffmpeg/worker?url')).default;

      await this.ffmpeg.load({ 
        coreURL, 
        wasmURL,
        classWorkerURL: workerURL
      });
    })();

    const timeoutPromise = new Promise<void>((_, reject) => {
      timerId = setTimeout(() => reject(new Error('FFmpeg initialization timeout')), 180000);
    });

    console.time('ffmpeg.init()');
    try {
      await Promise.race([initPromise, timeoutPromise]);
      this.ffmpegLoadTimeMs = Date.now() - startTime;
      console.log('Stage: FFmpeg loaded successfully');
    } finally {
      if (timerId) clearTimeout(timerId);
      console.timeEnd('ffmpeg.init()');
    }
  }

  /**
   * Generates a thumbnail locally using HTML5 Video and Canvas.
   * Also extracts basic video metadata (duration, width, height).
   */
  async generateThumbnail(file: File): Promise<ThumbnailResult> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const url = URL.createObjectURL(file);

      video.src = url;
      video.muted = true;
      video.playsInline = true;

      video.onloadeddata = () => {
        // Seek to 1 second, or 0.1 if video is shorter than 1 second
        video.currentTime = Math.min(1, video.duration > 0 ? video.duration / 2 : 0.1);
      };

      video.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("Video failed to load for thumbnail generation"));
      };

      video.onseeked = () => {
        if (!ctx) {
          reject(new Error("Canvas context is not available"));
          URL.revokeObjectURL(url);
          return;
        }

        // Target size: preserve aspect ratio, max width 600px
        const maxWidth = 600;
        const ratio = video.videoWidth / video.videoHeight;
        canvas.width = Math.min(maxWidth, video.videoWidth);
        canvas.height = canvas.width / ratio;

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        canvas.toBlob((blob) => {
          URL.revokeObjectURL(url); // Clean up memory
          if (blob) {
            resolve({
              blob,
              duration: video.duration,
              width: video.videoWidth,
              height: video.videoHeight
            });
          } else {
            reject(new Error("Thumbnail generation failed"));
          }
        }, 'image/jpeg', 0.8);
      };

      video.onerror = (e) => {
        URL.revokeObjectURL(url);
        reject(new Error("Failed to load video for thumbnail generation"));
      };

      video.load();
    });
  }

  /**
   * Compresses video using FFmpeg if size exceeds 20MB.
   * Target: MP4, H.264, AAC, Max 720p, Max 30FPS, 2Mbps
   * 
   * @param originalFile - The uploaded native File object
   * @param onProgress - Callback for FFmpeg progress (0-100)
   * @returns CompressionResult object encapsulating metrics and final file
   */
  async compressVideo(originalFile: File, onProgress: (progress: number) => void): Promise<CompressionResult> {
    const buildResult = (
      processedFile: File,
      compressionUsed: boolean,
      fallbackReason: string | undefined,
      compressionTimeMs: number
    ): CompressionResult => {
      const originalSize = originalFile.size;
      const processedSize = processedFile.size;
      return {
        originalFile,
        processedFile,
        compressionUsed,
        originalSize,
        processedSize,
        bytesSaved: originalSize - processedSize,
        compressionRatio: originalSize / processedSize,
        compressionTimeMs,
        fallbackReason,
        ffmpegInitialized: !!this.ffmpeg,
        ffmpegLoadTimeMs: 0, // Simplified for brevity as it's hard to track async globally
      };
    };

    // 1. Compress videos larger than 100MB.
    // 2. Videos smaller than 100MB should upload without compression.
    if (originalFile.size < 100 * 1024 * 1024) {
      return buildResult(originalFile, false, "File too small (< 100MB)", 0);
    }

    // Safely fallback on low memory devices (less than 2GB RAM usually returns 1)
    const deviceMemory = (navigator as any).deviceMemory || 4;
    if (deviceMemory < 2) {
      console.warn("Video compression unavailable. Uploading original video. (Low Memory)");
      return buildResult(originalFile, false, "Low memory (< 2GB RAM)", 0);
    }

    const startTime = Date.now();
    try {
      console.log('Stage: compression started');
      
      // 1. Initialize and Load FFmpeg with Lock
      if (!this.initializationPromise) {
        console.log('Stage: FFmpeg initialization started');
        this.initializationPromise = this.initializeFFmpeg().catch((err) => {
          this.initializationPromise = null;
          if (this.ffmpeg) {
            try { this.ffmpeg.terminate(); } catch (e) {}
            this.ffmpeg = null;
          }
          throw err;
        });
      } else {
        console.log('Stage: Waiting for existing FFmpeg initialization');
      }

      await this.initializationPromise;

      // Re-bind progress event for this specific compression run
      this.ffmpeg.on('progress', ({ progress, time }) => {
        // progress is usually 0.0 to 1.0
        onProgress(Math.min(100, Math.round(progress * 100)));
      });

      const { fetchFile } = await import('@ffmpeg/util');

      // Unique file names in case of concurrent executions
      const uniqueId = Date.now() + Math.random().toString(36).substring(7);
      const inputName = `input_${uniqueId}${originalFile.name.substring(originalFile.name.lastIndexOf('.'))}`;
      const outputName = `output_${uniqueId}.mp4`;

      // 2. Write file to virtual MEMFS
      console.time('writeFile()');
      await this.ffmpeg.writeFile(inputName, await fetchFile(originalFile));
      console.timeEnd('writeFile()');
      console.log('Stage: input file written');

      // 3. Execute FFmpeg Command with 3-minute timeout
      console.log('Stage: Compression started');
      console.log('Stage: ffmpeg command started');
      console.time('exec()');
      
      const execPromise = this.ffmpeg.exec([
        '-i', inputName,                  // Input file
        '-vf', "scale='-2:720'",          // Max 720p height, maintain aspect ratio
        '-c:v', 'libx264',                // Video codec: H.264
        '-preset', 'ultrafast',           // Preset: ultrafast (highly optimized for speed)
        '-tune', 'fastdecode',            // Tune: fastdecode (faster decoding and encoding)
        '-crf', '30',                     // Use CRF-based encoding (CRF 30)
        '-c:a', 'aac',                    // Audio codec: AAC
        '-b:a', '96k',                    // Audio bitrate: 96k
        '-r', '30',                       // Maximum FPS: 30
        outputName                        // Output file
      ]);

      const execTimeoutPromise = new Promise<void>((_, reject) => {
        setTimeout(() => reject(new Error('FFmpeg compression timeout (3 minutes)')), 3 * 60 * 1000);
      });

      // Race the execution against the 3-minute timeout
      await Promise.race([execPromise, execTimeoutPromise]);
      
      console.timeEnd('exec()');
      console.log('Stage: ffmpeg command completed');

      // 4. Read output
      console.time('readFile()');
      const fileData = await this.ffmpeg.readFile(outputName);
      console.timeEnd('readFile()');
      console.log('Stage: output file generated');
      
      const data = new Uint8Array(fileData as ArrayBuffer);
      const outputBlob = new Blob([data.buffer], { type: 'video/mp4' });
      
      // Convert Blob directly to File object
      const outputFile = new File([outputBlob], originalFile.name, {
        type: originalFile.type,
        lastModified: Date.now()
      });

      console.log('Stage: Compression completed');

      // 5. Memory Cleanup
      await this.ffmpeg.deleteFile(inputName);
      await this.ffmpeg.deleteFile(outputName);
      // We explicitly DO NOT terminate the ffmpeg worker so it can be reused.
      console.log('Stage: Cleanup completed');

      return buildResult(outputFile, true, undefined, Date.now() - startTime);
    } catch (err) {
      console.warn("Video compression unavailable. Uploading original video.", err);
      // If compression failed during execution, we don't necessarily kill the worker,
      // but if initialization failed, it's already handled by the catch block on initializeFFmpeg.
      let errReason = (err as Error)?.message || 'Unknown FFmpeg Error';
      return buildResult(originalFile, false, `FFmpeg Error: ${errReason}`, Date.now() - startTime);
    }
  }
}

export const videoProcessingService = new VideoProcessingService();
