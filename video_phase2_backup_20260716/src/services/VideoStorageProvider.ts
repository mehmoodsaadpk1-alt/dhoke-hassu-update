import { supabase } from '../utils/supabaseClient';

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
      const ext = file.name.split('.').pop();
      const fileName = `videos/${userId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
      
      const { data, error } = await supabase.storage
        .from(VIDEO_BUCKET)
        .upload(fileName, file, {
          cacheControl: '31536000',
          upsert: false
        });

      if (error) throw error;
      
      return {
        path: data.path,
        url: this.getVideoUrl(data.path)
      };
    } catch (err: any) {
      return { url: '', path: '', error: err };
    }
  }

  /**
   * Uploads a generated thumbnail image
   */
  async uploadThumbnail(userId: string, file: File): Promise<StorageUploadResult> {
    try {
      const ext = file.name.split('.').pop() || 'jpg';
      const fileName = `thumbnails/${userId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
      
      const { data, error } = await supabase.storage
        .from(VIDEO_BUCKET)
        .upload(fileName, file, {
          cacheControl: '31536000',
          upsert: false
        });

      if (error) throw error;
      
      return {
        path: data.path,
        url: this.getVideoUrl(data.path) // Supabase uses the same base URL structure
      };
    } catch (err: any) {
      return { url: '', path: '', error: err };
    }
  }

  /**
   * Deletes a video file from storage
   */
  async deleteVideo(path: string): Promise<boolean> {
    try {
      const { error } = await supabase.storage.from(VIDEO_BUCKET).remove([path]);
      if (error) throw error;
      return true;
    } catch (err) {
      console.error("StorageProvider: Failed to delete video", err);
      return false;
    }
  }

  /**
   * Deletes a thumbnail file from storage
   */
  async deleteThumbnail(path: string): Promise<boolean> {
    try {
      const { error } = await supabase.storage.from(VIDEO_BUCKET).remove([path]);
      if (error) throw error;
      return true;
    } catch (err) {
      console.error("StorageProvider: Failed to delete thumbnail", err);
      return false;
    }
  }

  /**
   * Generates the absolute URL for a stored file
   */
  getVideoUrl(path: string): string {
    if (path.startsWith('http')) return path; // Already absolute
    const { data } = supabase.storage.from(VIDEO_BUCKET).getPublicUrl(path);
    return data.publicUrl;
  }
}

export const videoStorageProvider = new VideoStorageProvider();
