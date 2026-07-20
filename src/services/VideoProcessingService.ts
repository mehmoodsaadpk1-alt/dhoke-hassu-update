import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

export interface ThumbnailResult {
  blob: Blob;
  duration: number;
  width: number;
  height: number;
}

export class VideoProcessingService {
  private ffmpeg: FFmpeg | null = null;
  private baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';

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
   * Compresses a video using single-threaded ffmpeg.wasm.
   * Target: MP4, H.264, AAC, Max 720p, Max 30FPS, 2Mbps
   */
  async compressVideo(file: File, onProgress: (progress: number) => void): Promise<Blob> {
    if (!this.ffmpeg) {
      this.ffmpeg = new FFmpeg();
    }

    try {
      // 1. Load single-threaded FFmpeg dynamically
      if (!this.ffmpeg.loaded) {
        await this.ffmpeg.load({
          coreURL: await toBlobURL(`${this.baseURL}/ffmpeg-core.js`, 'text/javascript'),
          wasmURL: await toBlobURL(`${this.baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
        });
      }

      this.ffmpeg.on('progress', ({ progress }) => {
        onProgress(Math.min(100, Math.round(progress * 100)));
      });

      const inputName = 'input_video' + file.name.substring(file.name.lastIndexOf('.'));
      const outputName = 'output.mp4';

      // 2. Write file to virtual MEMFS
      await this.ffmpeg.writeFile(inputName, await fetchFile(file));

      // 3. Execute FFmpeg Command
      // -c:v libx264: H.264 encoding
      // -c:a aac: AAC audio
      // -vf scale='min(1280,iw)':min'(720,ih)': max 720p, preserve aspect ratio, no upscale
      // -r 30: max 30 FPS
      // -b:v 2M: Target bitrate 2Mbps
      // -preset fast: Balance between speed and compression
      // -movflags +faststart: Web optimization (moov atom at front)
      await this.ffmpeg.exec([
        '-i', inputName,
        '-c:v', 'libx264',
        '-c:a', 'aac',
        '-vf', "scale='min(1280,iw)':min'(720,ih)'",
        '-r', '30',
        '-b:v', '2M',
        '-preset', 'fast',
        '-movflags', '+faststart',
        outputName
      ]);

      // 4. Read output
      const fileData = await this.ffmpeg.readFile(outputName);
      const data = new Uint8Array(fileData as ArrayBuffer);
      const outputBlob = new Blob([data.buffer], { type: 'video/mp4' });

      // 5. Memory Cleanup
      await this.ffmpeg.deleteFile(inputName);
      await this.ffmpeg.deleteFile(outputName);
      this.ffmpeg.terminate(); // Kill the worker completely to free RAM
      this.ffmpeg = null; // Ensure fresh instance next time

      return outputBlob;
    } catch (err) {
      // Emergency Cleanup
      if (this.ffmpeg) {
        this.ffmpeg.terminate();
        this.ffmpeg = null;
      }
      throw err;
    }
  }
}

export const videoProcessingService = new VideoProcessingService();
