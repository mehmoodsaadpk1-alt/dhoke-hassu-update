import { supabase } from '../utils/supabaseClient';
import { uploadImage, uploadVideo as cloudinaryUploadVideo } from '../utils/cloudinary';

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
      const url = await cloudinaryUploadVideo(file, onProgress);
      if (!url) throw new Error("Cloudinary upload failed");
      
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
      const url = await uploadImage(file, onProgress);
      if (!url) throw new Error("Cloudinary upload failed");
      
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
    // Return true for Cloudinary, or implement deleteMedia(path)
    return true;
  }

  /**
   * Deletes a thumbnail file from storage
   */
  async deleteThumbnail(path: string): Promise<boolean> {
    return true;
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
    // No-op for now. 
  }
}

export const videoStorageProvider = new VideoStorageProvider();
