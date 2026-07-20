import { supabase } from '../utils/supabaseClient';
import { videoStorageProvider } from './VideoStorageProvider';

export type VideoType = 'video' | 'short' | 'live_stream';

export interface VideoMetadata {
  id?: string;
  user_id: string;
  type: VideoType;
  title?: string;
  description?: string;
  video_url: string;
  thumbnail_url?: string;
  duration?: number;
  size?: number;
  encoding_status?: string;
  processing_started_at?: string;
  processing_completed_at?: string;
  compression_ratio?: number;
  mime_type?: string;
  views?: number;
  likes?: number;
  comments_count?: number;
  shares?: number;
  privacy?: string;
  hashtags?: string[];
  location?: any;
  module_context?: any;
  monetization_meta?: any;
}

export type UploadStage = 'Queued' | 'Compressing' | 'Uploading' | 'Generating Thumbnail' | 'Completed' | 'Failed' | 'Cancelled';

class VideoService {
  /**
   * Fetches videos with pagination and optional type filter
   */
  async getVideos(type?: VideoType, limit = 10, offset = 0) {
    let query = supabase.from('videos').select('*, profiles:user_id(*)').order('created_at', { ascending: false }).range(offset, offset + limit - 1);
    if (type) {
      query = query.eq('type', type);
    }
    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  /**
   * Creates a new video record in the database
   */
  async createVideoRecord(videoData: VideoMetadata) {
    const { data, error } = await supabase.from('videos').insert(videoData).select().single();
    if (error) throw error;
    return data;
  }

  /**
   * Deletes a video entirely (Storage + DB)
   */
  async deleteVideo(videoId: string) {
    // 1. Fetch record to get storage paths
    const { data: video, error: fetchError } = await supabase.from('videos').select('video_url, thumbnail_url').eq('id', videoId).single();
    if (fetchError) throw fetchError;

    // 2. Extract paths from URLs (assuming standard supabase structure for now)
    // In a real generic abstraction, the DB might store paths alongside URLs.
    // For now, extract path from Supabase public URL structure:
    const extractPath = (url: string) => {
      if (!url) return null;
      const parts = url.split('/dh_videos/');
      return parts.length > 1 ? parts[1] : null;
    };

    const videoPath = extractPath(video.video_url);
    const thumbnailPath = extractPath(video.thumbnail_url || '');

    // 3. Delete from Storage
    if (videoPath) await videoStorageProvider.deleteVideo(videoPath);
    if (thumbnailPath) await videoStorageProvider.deleteThumbnail(thumbnailPath);

    // 4. Delete from DB
    const { error: deleteError } = await supabase.from('videos').delete().eq('id', videoId);
    if (deleteError) throw deleteError;

    return true;
  }
}

export const videoService = new VideoService();
