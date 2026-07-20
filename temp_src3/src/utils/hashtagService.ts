// Create a new file for hashtag logic and export it to avoid merge conflicts on a 4000+ line file
import { supabase, isSupabaseConfigured } from './supabaseClient';

export interface Hashtag {
  id: string;
  tag: string;
  count: number;
  is_blocked: boolean;
}

export const dbUpsertHashtags = async (tags: string[]): Promise<void> => {
  if (!isSupabaseConfigured || !supabase || tags.length === 0) return;
  
  try {
    // Supabase RPC call to the function we created in migration
    for (const tag of tags) {
      await supabase.rpc('upsert_hashtag', { hashtag_text: tag });
    }
  } catch (error) {
    console.error("Error upserting hashtags:", error);
  }
};

export const dbGetTrendingHashtags = async (limit: number = 5): Promise<Hashtag[]> => {
  if (!isSupabaseConfigured || !supabase) return [];
  try {
    const { data, error } = await supabase
      .from('hashtags')
      .select('*')
      .eq('is_blocked', false)
      .order('count', { ascending: false })
      .order('last_used_at', { ascending: false })
      .limit(limit);
      
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching trending hashtags:", error);
    return [];
  }
};

export const dbSearchHashtags = async (query: string): Promise<Hashtag[]> => {
  if (!isSupabaseConfigured || !supabase || !query) return [];
  try {
    const { data, error } = await supabase
      .from('hashtags')
      .select('*')
      .ilike('tag', `%${query}%`)
      .eq('is_blocked', false)
      .order('count', { ascending: false })
      .limit(10);
      
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error searching hashtags:", error);
    return [];
  }
};
