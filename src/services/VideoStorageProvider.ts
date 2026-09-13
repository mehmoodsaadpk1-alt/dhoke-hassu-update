import { supabase } from '../utils/supabaseClient';
import { uploadToB2, deleteFromB2 } from '../utils/b2Storage';

/**
 * Storage Abstraction Layer for Video Files.
 * Ensures the application is not tightly coupled to Supabase Storage.
 * Later, this can be swapped to Cloudflare R2, Bunny CDN, or AWS S3
 * without touching business logic or UI components.
 */

const VIDEO_BUCKET = 'dh_videos';

export interface StorageUploadResult {
  url: string;
  path: string;
  error?: Error;
}

class VideoStorageProvider {
  /**
   * Uploads an optimized video file to storage
   */
  async uploadVideo(userId: string, file: File, onProgress?: (progress: number) => void): Promise<StorageUploadResult> {
    try {
      const path = `watch/${userId}/video_${Date.now()}`;
      if (onProgress) onProgress(10); // Simulated start progress
      const url = await uploadToB2(file, path);
      if (!url) throw new Error("B2 video upload failed");
      
      if (onProgress) onProgress(100);
      return {
        path: url,
        url: url
      };
    } catch (err: any) {
      return { url: '', path: '', error: err };
    }
  }

  /**
   * Uploads a generated thumbnail image
   */
  async uploadThumbnail(userId: string, file: File, onProgress?: (progress: number) => void): Promise<StorageUploadResult> {
    try {
      const path = `watch/${userId}/thumb_${Date.now()}`;
      if (onProgress) onProgress(10); // Simulated start progress
      const url = await uploadToB2(file, path);
      if (!url) throw new Error("B2 thumbnail upload failed");
      
      if (onProgress) onProgress(100);
      return {
        path: url,
        url: url
      };
    } catch (err: any) {
      return { url: '', path: '', error: err };
    }
  }

  /**
   * Deletes a video file from storage
   */
  async deleteVideo(path: string): Promise<boolean> {
    return await deleteFromB2(path);
  }

  /**
   * Deletes a thumbnail file from storage
   */
  async deleteThumbnail(path: string): Promise<boolean> {
    return await deleteFromB2(path);
  }

  /**
   * Generates the absolute URL for a stored file
   */
  getVideoUrl(path: string): string {
    if (path.startsWith('http')) return path; // Already absolute
    const { data } = supabase.storage.from(VIDEO_BUCKET).getPublicUrl(path);
    return data.publicUrl;
  }

  /**
   * Deletes a file from storage.
   * Required for rolling back uploads if database insert fails.
   */
  async deleteFile(path: string): Promise<void> {
    await deleteFromB2(path);
  }
}

export const videoStorageProvider = new VideoStorageProvider();
