import { supabase } from '../utils/supabaseClient';

export interface VideoComment {
  id: string;
  video_id: string;
  user_id: string;
  parent_id: string | null;
  content: string;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  profiles?: {
    full_name: string;
    profile_photo: string;
  };
  reaction_count?: number;
  has_liked?: boolean;
  reply_count?: number;
}

class VideoCommentsService {
  /**
   * Fetches top-level comments for a video
   */
  async getComments(videoId: string, userId?: string, limit = 20, offset = 0): Promise<VideoComment[]> {
    let query = supabase
      .from('video_comments')
      .select(`
        *,
        profiles (full_name, profile_photo)
      `)
      .eq('video_id', videoId)
      .eq('is_deleted', false)
      .is('parent_id', null)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, error } = await query;
    if (error) throw error;

    // Enhance with basic client-side fields (in a production app with huge scale, 
    // reaction counts should be a materialized view or function).
    return (data || []).map(comment => ({
      ...comment,
      reaction_count: 0, // Placeholder for simplicity
      has_liked: false,
      reply_count: 0
    }));
  }

  /**
   * Fetches replies for a specific comment
   */
  async getReplies(parentId: string, userId?: string): Promise<VideoComment[]> {
    const { data, error } = await supabase
      .from('video_comments')
      .select(`
        *,
        profiles (full_name, profile_photo)
      `)
      .eq('parent_id', parentId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  /**
   * Posts a new comment or reply
   */
  async postComment(videoId: string, userId: string, commentText: string, parentId?: string): Promise<VideoComment> {
    const { data, error } = await supabase
      .from('video_comments')
      .insert({
        video_id: videoId,
        user_id: userId,
        content: commentText.trim(),
        parent_id: parentId || null
      })
      .select(`*, profiles(full_name, profile_photo)`)
      .single();

    if (error) throw error;

    // Update comments_count on the videos table
    const { data: vdata } = await supabase.from('videos').select('comments_count').eq('id', videoId).single();
    const currentCount = vdata?.comments_count || 0;
    await supabase.from('videos').update({ comments_count: currentCount + 1 }).eq('id', videoId);

    return data;
  }

  /**
   * Hard deletes a comment and decrements the video's comment count
   */
  async deleteComment(commentId: string, userId: string, videoId: string): Promise<void> {
    const { error } = await supabase
      .from('video_comments')
      .delete()
      .eq('id', commentId)
      .eq('user_id', userId);

    if (error) throw error;

    // Decrement comments_count on the videos table
    const { data: vdata } = await supabase.from('videos').select('comments_count').eq('id', videoId).single();
    const currentCount = vdata?.comments_count || 0;
    await supabase.from('videos').update({ comments_count: Math.max(0, currentCount - 1) }).eq('id', videoId);
  }

  /**
   * Edits an existing comment
   */
  async editComment(commentId: string, userId: string, newText: string): Promise<void> {
    const { error } = await supabase
      .from('video_comments')
      .update({ content: newText.trim(), updated_at: new Date().toISOString() })
      .eq('id', commentId)
      .eq('user_id', userId);

    if (error) throw error;
  }
}

export const videoCommentsService = new VideoCommentsService();
