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
  width?: number;
  height?: number;
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
  visibility?: string;
  hashtags?: string[];
  location?: any;
  module_context?: any;
  monetization_meta?: any;
}

export interface VideoComment {
  id: string;
  user_id: string;
  video_id: string;
  content: string;
  created_at: string;
  profiles?: {
    full_name: string;
    profile_photo?: string;
  };
}

export type UploadStage = 'Queued' | 'Compressing' | 'Uploading' | 'Generating Thumbnail' | 'Saving Database' | 'Completed' | 'Failed' | 'Cancelled';

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

  // --- PHASE 2 SHORTS METHODS ---

  /**
   * Fetches the infinite Shorts feed
   */
  async getShortsFeed(limit = 5, offset = 0, currentUserId?: string) {
    // We only select required fields to optimize payload size
    const { data, error } = await supabase
      .from('videos')
      .select('id, user_id, title, description, video_url, thumbnail_url, duration, views, likes, comments_count, shares, created_at, profiles:user_id(full_name, profile_photo)')
      .eq('type', 'short')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    
    // For a fully optimized approach, we would use a Postgres RPC or join to get "hasLiked"
    // Since we're keeping it simple and pagination is small (limit=5), we can fetch likes here
    // if currentUserId is provided.
    let enrichedData = data;
    if (currentUserId && data && data.length > 0) {
      const videoIds = data.map(v => v.id);
      const { data: likesData } = await supabase
        .from('video_likes')
        .select('video_id')
        .eq('user_id', currentUserId)
        .in('video_id', videoIds);

      const { data: savesData } = await supabase
        .from('video_saves')
        .select('video_id')
        .eq('user_id', currentUserId)
        .in('video_id', videoIds);

      const likedIds = new Set(likesData?.map(l => l.video_id) || []);
      const savedIds = new Set(savesData?.map(s => s.video_id) || []);

      enrichedData = data.map(v => ({
        ...v,
        hasLiked: likedIds.has(v.id),
        hasSaved: savedIds.has(v.id)
      }));
    }

    return enrichedData;
  }

  async likeVideo(videoId: string, userId: string) {
    const { data: existing } = await supabase.from('video_likes').select('video_id').match({ video_id: videoId, user_id: userId }).maybeSingle();
    
    if (!existing) {
      const { error } = await supabase.from('video_likes').insert({ video_id: videoId, user_id: userId });
      if (error) throw error;
      
      // Manually increment the likes column since we don't have a DB trigger
      const { data: video } = await supabase.from('videos').select('likes').eq('id', videoId).single();
      if (video) {
        await supabase.from('videos').update({ likes: (video.likes || 0) + 1 }).eq('id', videoId);
      }
    }
  }

  async unlikeVideo(videoId: string, userId: string) {
    const { data: existing } = await supabase.from('video_likes').select('video_id').match({ video_id: videoId, user_id: userId }).maybeSingle();
    
    if (existing) {
      const { error } = await supabase.from('video_likes').delete().match({ video_id: videoId, user_id: userId });
      if (error) throw error;

      // Manually decrement the likes column since we don't have a DB trigger
      const { data: video } = await supabase.from('videos').select('likes').eq('id', videoId).single();
      if (video) {
        await supabase.from('videos').update({ likes: Math.max(0, (video.likes || 0) - 1) }).eq('id', videoId);
      }
    }
  }

  async addComment(videoId: string, userId: string, content: string) {
    const { data, error } = await supabase
      .from('video_comments')
      .insert({ video_id: videoId, user_id: userId, content })
      .select('*, profiles(full_name, profile_photo)')
      .single();
    if (error) throw error;
    return data as VideoComment;
  }

  async getComments(videoId: string, limit = 20, offset = 0) {
    const { data, error } = await supabase
      .from('video_comments')
      .select('*, profiles(full_name, profile_photo)')
      .eq('video_id', videoId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    if (error) throw error;
    return data as VideoComment[];
  }

  async saveVideo(videoId: string, userId: string) {
    const { error } = await supabase.from('video_saves').insert({ video_id: videoId, user_id: userId });
    if (error) throw error;
  }

  async unsaveVideo(videoId: string, userId: string) {
    const { error } = await supabase.from('video_saves').delete().match({ video_id: videoId, user_id: userId });
    if (error) throw error;
  }

  async recordView(videoId: string, userId?: string) {
    // Only record one view per session/user ideally.
    const { error } = await supabase.from('video_views').insert({ 
      video_id: videoId, 
      user_id: userId || null 
    });
    
    // Ignore duplicate key errors (PGRST116 or 23505) which enforce 1 view per user per video
    if (error) {
      if (error.code !== '23505') throw error;
      return; // Already viewed, do not increment master counter again
    }
    
    // Manually increment views column
    const { data: video } = await supabase.from('videos').select('views').eq('id', videoId).single();
    if (video) {
      await supabase.from('videos').update({ views: (video.views || 0) + 1 }).eq('id', videoId);
    }
  }

  async reportVideo(videoId: string, userId: string, reason: string) {
    // We'll reuse the item_reports or similar, or just log it for now.
    // Since we didn't create a video_reports table in Milestone 1, we log or use a generic RPC.
    console.log(`Video ${videoId} reported by ${userId} for: ${reason}`);
    // Future: insert into video_reports
  }
}

export const videoService = new VideoService();
