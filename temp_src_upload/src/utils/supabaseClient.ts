/**
 * Dhoke Hassu Connect - Supabase Client & Centralized Data Integration Layer
 * 
 * Provides direct connection to Supabase backend using environment variables.
 * Automatically falls back to LocalStorage/Mock Data when environment variables are not configured,
 * ensuring robust and fail-safe operation during local development or in any environment.
 */

import { createClient } from '@supabase/supabase-js';
import { 
  User, Story, Post, Comment, JobItem, JobApplication, 
  PropertyItem, BuySellItem, BusinessItem, ServiceItem, 
  AlertItem, EventItem, DealItem, GroupItem, GroupPost,
  MarketplaceItem, ItemImage, ItemChat, ItemFavorite, ItemReport,
  AdItem, Poll, PollOption, PollVote, PollComment, PollCommentLike,
  PollCommentReport, PollView, PollShare, Group
} from '../types';
import type { Notification } from '../types';

// Read Supabase configuration from environment variables
const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || (import.meta as any).env?.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || (import.meta as any).env?.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

if (!isSupabaseConfigured) {
  console.warn(
    "⚠️ Supabase URL or Anon Key is missing. Dhoke Hassu Connect is operating in Local/Offline mode. " +
    "To connect to your real Supabase backend, please add VITE_SUPABASE_URL/NEXT_PUBLIC_SUPABASE_URL and VITE_SUPABASE_ANON_KEY/NEXT_PUBLIC_SUPABASE_ANON_KEY to your environment."
  );
}

// Initialize the Supabase Client
export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

/**
 * ==========================================
 * UTILITY & HELPER FUNCTIONS FOR SUPABASE
 * ==========================================
 */

/**
 * Handle Supabase API calls safely with a try/catch and fallback pattern
 */
async function safeDbCall<T>(apiCall: () => Promise<{ data: T | null; error: any }>, fallbackValue: T): Promise<T> {
  if (!isSupabaseConfigured || !supabase) {
    return fallbackValue;
  }
  try {
    const result = await Promise.race([
      apiCall(),
      new Promise<any>((_, reject) => 
        setTimeout(() => reject(new Error('Database Request Timeout')), 2500)
      )
    ]);
    const { data, error } = result;
    if (error) {
      console.warn("Supabase API Status:", error?.message || JSON.stringify(error));
      return fallbackValue;
    }
    return data !== null ? data : fallbackValue;
  } catch (err: any) {
    console.warn("Supabase Connection Status:", err?.message || err);
    return fallbackValue;
  }
}

/**
 * Global centralized error handler wrapper for all Supabase calls.
 * Ensures we catch exceptions and return a safe, non-null/non-undefined fallback response.
 */
export async function safeSupabaseCall<T>(
  apiCall: () => Promise<T>,
  fallbackValue: T,
  contextName = "Supabase Operation"
): Promise<T> {
  try {
    const result = await apiCall();
    if (result === null || result === undefined) {
      return fallbackValue;
    }
    return result;
  } catch (err: any) {
    console.error(`[Global Error Handler] [${contextName}] failed:`, err?.message || err);
    return fallbackValue;
  }
}

/**
 * Write/Upsert to Supabase safely
 */
async function safeWrite(tableName: string, payload: any, matchField = 'id'): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) {
    return false;
  }
  const cleanPayload = { ...payload };
  let attempts = 0;
  const maxAttempts = 5;

  while (attempts < maxAttempts) {
    try {
      const { error } = await supabase
        .from(tableName)
        .upsert(cleanPayload, { onConflict: matchField });
      
      if (!error) {
        return true;
      }

      const errMsg = error.message || '';
      if (errMsg.includes('column') || errMsg.includes('schema cache')) {
        const matches = errMsg.match(/['"]([a-zA-Z0-9_]+)['"]/g);
        if (matches) {
          const words = matches.map(m => m.replace(/['"]/g, ''));
          const columnName = words.find(w => w !== tableName && w !== matchField);
          if (columnName && cleanPayload.hasOwnProperty(columnName)) {
            console.warn(`Retrying ${tableName} upsert after removing missing column: ${columnName}`);
            delete cleanPayload[columnName];
            attempts++;
            continue;
          }
        }
      }

      console.warn(`Supabase write status on ${tableName}:`, error?.message || JSON.stringify(error));
      return false;
    } catch (err: any) {
      console.warn(`Supabase write exception status on ${tableName}:`, err?.message || err);
      return false;
    }
  }
  return false;
}

/**
 * Delete from Supabase safely
 */
async function safeDelete(tableName: string, id: string, matchField = 'id'): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) {
    return false;
  }
  try {
    const { error } = await supabase
      .from(tableName)
      .delete()
      .eq(matchField, id);
    if (error) {
      console.warn(`Supabase delete status on ${tableName}:`, error?.message || JSON.stringify(error));
      return false;
    }
    return true;
  } catch (err: any) {
    console.warn(`Supabase delete exception status on ${tableName}:`, err?.message || err);
    return false;
  }
}


/**
 * ============================================================================
 * 1. USER PROFILE & AUTHENTICATION SERVICE
 * ============================================================================
 */

export async function dbGetUserProfile(userId: string): Promise<User | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();
    // Log fetched row
    console.log("Returned row =", data);
    console.log("Keys =", Object.keys(data));
    if (error) {
      if (error.code !== 'PGRST116') { // PGRST116 is code for "no rows found"
        console.warn("Status fetching user profile:", error?.message || JSON.stringify(error));
      }
      return null;
    }
    
    // Map snake_case columns back to User properties for frontend compatibility
    return {
      id: data.user_id,
      fullName: data.full_name || '',
      email: data.email || '',
      area: data.area || 'Dhoke Hassu',
      profilePhoto: data.profile_photo || undefined,
      mobileNumber: data.mobileNumber || undefined,
      username: data.username || undefined,
      bio: data.bio || undefined,
      joinDate: data.joinDate || undefined,
      reputationScore: data.reputationScore ?? 100,
      verified: !!data.verified,
      coverPhoto: data.coverPhoto || data.socialLinks?.coverPhoto || undefined,
      contactNumber: data.contactNumber || undefined,
      socialLinks: data.socialLinks || {},
      badges: data.badges || [],
      gender: data.gender || data.socialLinks?.gender || undefined,
      dateOfBirth: data.date_of_birth || data.socialLinks?.dateOfBirth || undefined,
      provinceId: data.province_id || undefined,
      cityId: data.city_id || undefined,
      areaId: data.area_id || undefined,
      latitude: data.latitude || undefined,
      longitude: data.longitude || undefined
    } as User;
  } catch (err: any) {
    console.warn("Exception fetching user profile status:", err?.message || err);
    return null;
  }
}

export async function dbSaveUserProfile(profile: User): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false;
  try {
    const cleanedSocialLinks = { ...(profile.socialLinks || {}) };
    delete cleanedSocialLinks.coverPhoto;
    const payload: Record<string, any> = {
      user_id: profile.id,
      full_name: profile.fullName,
      email: profile.email,
      profile_photo: profile.profilePhoto || null,
      mobileNumber: profile.mobileNumber || null,
      username: profile.username || null,
      bio: profile.bio || null,
      joinDate: profile.joinDate || null,
      reputationScore: profile.reputationScore ?? 100,
      verified: profile.verified ?? false,
      coverPhoto: profile.coverPhoto || null,
      contactNumber: profile.contactNumber || null,
      socialLinks: {
        ...(cleanedSocialLinks),
        gender: profile.gender || null,
        dateOfBirth: profile.dateOfBirth || null,
        provinceId: profile.provinceId || profile.socialLinks?.provinceId || null,
        cityId: profile.cityId || profile.socialLinks?.cityId || null,
        areaId: profile.areaId || profile.socialLinks?.areaId || null,
        latitude: profile.latitude || profile.socialLinks?.latitude || null,
        longitude: profile.longitude || profile.socialLinks?.longitude || null
      },
      badges: profile.badges || []
    };

    if (profile.area) {
      payload.area = profile.area;
    }

    console.log("[Runtime Proof - SaveUserProfile] Inside dbSaveUserProfile. payload.profile_photo:", payload.profile_photo);
    console.log("[Runtime Proof - SaveUserProfile] Inside dbSaveUserProfile. payload.coverPhoto:", payload.coverPhoto);

    console.log("Saving user profile to Supabase. Table: profiles, Payload:", JSON.stringify(payload, null, 2));

    let { error } = await supabase
      .from('profiles')
      .upsert(payload, { onConflict: 'user_id' });
      
    if (error) {
      console.error("Supabase profiles upsert returned error:", JSON.stringify(error, null, 2));
      return false;
    }
    console.log("Supabase profiles upsert successful.");

    // Query same row again to verify database status
    const { data: verifyRow, error: verifyError } = await supabase
      .from('profiles')
      .select('profile_photo, coverPhoto')
      .eq('user_id', profile.id)
      .single();

    if (!verifyError && verifyRow) {
      console.log("[Runtime Proof - Post Upsert Verify] Query profiles table returned: profile_photo:", verifyRow.profile_photo);
      console.log("[Runtime Proof - Post Upsert Verify] Query profiles table returned: coverPhoto:", verifyRow.coverPhoto);
    } else {
      console.warn("[Runtime Proof - Post Upsert Verify] Query profiles table failed or returned null:", verifyError?.message);
    }

    return true;
  } catch (err: any) {
    console.error("Exception occurred during dbSaveUserProfile execution:", err?.message || err);
    return false;
  }
}


/**
 * ============================================================================
 * 2. STORIES SERVICE (COMMUNITY MODULE)
 * ============================================================================
 */

// Enhanced Story Service
export async function dbGetStories(currentUserId: string, fallback: Story[] = []): Promise<Story[]> {
  return safeDbCall(async () => {
    // Fetch stories that are not archived and not expired
    const now = new Date().toISOString();
    
    // We join with profiles for author details
    const { data, error } = await supabase!
      .from('stories')
      .select('*')
      .eq('is_archived', false)
      .gte('expires_at', now)
      .order('createdAt', { ascending: false });

    if (error) throw error;
    
    // Map to frontend interface
    const stories = (data || []).map((s: any) => ({
      id: s.id,
      author: s.author_profile?.full_name || s.author || 'User',
      avatar: s.author_profile?.profile_photo || s.avatar || '',
      time: new Date(s.createdAt || s.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      viewed: false, 
      type: s.media_type || s.type || 'photo',
      image: s.image,
      text: s.text,
      bgColor: s.bgColor || s.bg_color,
      createdAt: s.createdAt || s.created_at,
      userId: (s.custom_audience_ids && s.custom_audience_ids.length > 0) ? s.custom_audience_ids[0] : s.author,
      mediaUrls: s.media_urls || s.mediaUrls,
      bgMusicUrl: s.bg_music_url,
      musicVolume: s.music_volume,
      privacy: s.privacy,
      customAudienceIds: s.custom_audience_ids,
      expiresAt: s.expires_at,
      isArchived: s.is_archived,
      stickers: s.stickers,
      textStyles: s.text_styles,
      viewsCount: s.views_count,
      reactionsCount: s.reactions_count,
      repliesCount: s.replies_count
    }));
    return { data: stories, error: null };
  }, []);
}

export async function dbGetArchivedStories(userId: string): Promise<Story[]> {
  return safeDbCall(async () => {
    const now = new Date().toISOString();
    const { data, error } = await supabase!
      .from('stories')
      .select('*')
      .contains('custom_audience_ids', [userId])
      .or(`is_archived.eq.true,expires_at.lt.${now}`)
      .order('createdAt', { ascending: false });
      
    if (error) throw error;

    const stories = (data || []).map((s: any) => ({
      id: s.id,
      author: s.author_profile?.full_name || s.author || 'User',
      avatar: s.author_profile?.profile_photo || s.avatar || '',
      time: new Date(s.createdAt || s.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      viewed: false,
      type: s.media_type || s.type || 'photo',
      image: s.image,
      text: s.text,
      bgColor: s.bgColor || s.bg_color,
      createdAt: s.createdAt || s.created_at,
      userId: (s.custom_audience_ids && s.custom_audience_ids.length > 0) ? s.custom_audience_ids[0] : s.author,
      mediaUrls: s.media_urls || s.mediaUrls,
      bgMusicUrl: s.bg_music_url,
      musicVolume: s.music_volume,
      privacy: s.privacy,
      customAudienceIds: s.custom_audience_ids,
      expiresAt: s.expires_at,
      isArchived: s.is_archived,
      stickers: s.stickers,
      textStyles: s.text_styles,
      viewsCount: s.views_count,
      reactionsCount: s.reactions_count,
      repliesCount: s.replies_count
    }));
    
    console.log("[STORY ARCHIVE] Archive Loaded");
    return { data: stories, error: null };
  }, []);
}

export async function dbSaveStory(story: Story): Promise<boolean> {
  const payload = {
    id: story.id,
    author: story.author,
    avatar: story.avatar,
    type: story.type,
    image: story.image,
    text: story.text,
    bgColor: story.bgColor,
    createdAt: story.createdAt ? new Date(story.createdAt).getTime() : Date.now(),
    created_at: story.createdAt ? new Date(story.createdAt).toISOString() : new Date().toISOString(),
    media_type: story.type,
    media_urls: story.mediaUrls,
    bg_music_url: story.bgMusicUrl,
    music_volume: story.musicVolume,
    privacy: story.privacy,
    custom_audience_ids: [story.userId], // Using custom_audience_ids to safely store user_id!
    expires_at: story.expiresAt || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    is_archived: story.isArchived || false,
    stickers: story.stickers,
    text_styles: story.textStyles
  };
  return safeWrite('stories', payload);
}

export async function dbRestoreStory(storyId: string): Promise<boolean> {
  try {
    const newExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const { error } = await supabase!.from('stories').update({ 
      is_archived: false,
      expires_at: newExpiresAt
    }).eq('id', storyId);
    if (error) throw error;
    console.log("[STORY ARCHIVE] Story Restored", storyId);
    return true;
  } catch(e) {
    console.error("[STORY ERROR]", "Restore story failed", e);
    return false;
  }
}

export async function dbDeleteStory(storyId: string): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false;
  try {
    // 1. Fetch the story to see if it has media
    const { data: story } = await supabase.from('stories').select('media_urls, image').eq('id', storyId).single();
    
    // 2. Delete media if present
    const mediaUrls = story?.media_urls || [story?.image];
    for (const url of mediaUrls) {
      if (url && typeof url === 'string' && url.includes('supabase.co/storage/v1/object/public/')) {
        const urlObj = new URL(url);
        const pathParts = urlObj.pathname?.split('/public/');
        if (pathParts.length > 1) {
          const fullPath = pathParts[1]; // e.g. "posts/stories/xyz.jpg"
          const bucketName = fullPath?.split('/')[0];
          const filePath = fullPath?.substring(bucketName.length + 1);
          await supabase.storage.from(bucketName).remove([filePath]);
        }
      }
    }

    // 3. Delete the database row
    const success = await safeDelete('stories', storyId);
    if (success) {
      console.log("[STORY ARCHIVE] Story Permanently Deleted", storyId);
    }
    return success;
  } catch (err) {
    console.error("[STORY ARCHIVE] Exception in dbDeleteStory", err);
    return false;
  }
}

export async function dbArchiveStory(storyId: string): Promise<boolean> {
  try {
    const { error } = await supabase!.from('stories').update({ is_archived: true }).eq('id', storyId);
    if (error) throw error;
    console.log("[STORY ARCHIVE] Story Archived", storyId);
    return true;
  } catch(e) {
    console.error("[STORY ERROR]", "Archive story failed", e);
    return false;
  }
}

export async function dbLogStoryView(storyId: string, viewerId: string): Promise<void> {
  try {
    const { error } = await supabase!.from('story_views').insert({ story_id: storyId, viewer_id: viewerId });
    if (!error) {
      // Fetch story to notify owner
      const { data: story } = await supabase!.from('stories').select('user_id').eq('id', storyId).single();
      if (story && story.user_id !== viewerId) {
        // Fetch viewer info
        const { data: viewer } = await supabase!.from('profiles').select('full_name').eq('id', viewerId).single();
        if (viewer) {
          await dbTriggerNotification(
            story.user_id,
            viewerId,
            'story_view',
            'New Story View',
            `${viewer.full_name} viewed your story`,
            'story',
            storyId
          );
        }
      }
    }
  } catch (e) {
    console.warn("[STORY] View already logged or failed:", e);
  }
}

export async function dbReactToStory(storyId: string, reactorId: string, reactionType: string): Promise<boolean> {
  try {
    // Check if reaction exists
    const { data: existing } = await supabase!.from('story_reactions')
      .select('id')
      .eq('story_id', storyId)
      .eq('reactor_id', reactorId)
      .maybeSingle();

    if (existing) {
      // update
      const { error } = await supabase!.from('story_reactions')
        .update({ reaction_type: reactionType })
        .eq('id', existing.id);
      if (error) throw error;
    } else {
      // insert
      const { error } = await supabase!.from('story_reactions').insert({
        story_id: storyId,
        reactor_id: reactorId,
        reaction_type: reactionType
      });
      if (error) throw error;
      
      // Notification (only on new reaction)
      const { data: story } = await supabase!.from('stories').select('user_id').eq('id', storyId).single();
      const actualReceiver = story?.user_id;
      if (actualReceiver && actualReceiver !== reactorId) {
        const { data: reactor } = await supabase!.from('profiles').select('full_name').eq('id', reactorId).single();
        if (reactor) {
          await dbTriggerNotification(
            actualReceiver,
            reactorId,
            'story_reaction',
            'New Story Reaction',
            `${reactionType} reacted to your status`,
            'story',
            storyId
          );
        }
      }
    }
    return true;
  } catch (err) {
    console.error("Exception in dbReactToStory", err);
    return false;
  }
}

export async function dbReplyToStory(storyId: string, senderId: string, replyType: string, content: string): Promise<boolean> {
  console.log("[STORY REPLY START]", { storyId, senderId, replyType, content });
  try {
    const { error } = await supabase!.from('story_replies').insert({
      story_id: storyId,
      sender_id: senderId,
      reply_type: replyType,
      content: content
    });
    if (error) throw error;
    
    console.log("[STORY REPLY SAVED]");

    // Notification & Chat Delivery
    const { data: story } = await supabase!.from('stories').select('user_id').eq('id', storyId).single();
    const actualReceiver = story?.user_id;

    if (actualReceiver && actualReceiver !== senderId) {
      const { data: sender } = await supabase!.from('profiles').select('full_name').eq('id', senderId).single();
      if (sender) {
        // Trigger notification
        await dbTriggerNotification(
          actualReceiver,
          senderId,
          'story_reply',
          'New Story Reply',
          `💬 replied to your status`,
          'story',
          storyId
        );
        
        // Deliver to chat immediately
        const convId = await dbGetOrCreatePrivateConversation(senderId, actualReceiver);
        if (convId) {
          await dbSendMessage(
            convId,
            senderId,
            `[Story Reply]: ${content}`,
            'text'
          );
        }

        console.log("[STORY REPLY RECEIVED]");
      }
    }

    return true;
  } catch(e: any) {
    console.error("[STORY REPLY ERROR]", {
      message: e.message,
      details: e.details,
      hint: e.hint,
      code: e.code
    });
    return false;
  }
}

export async function dbGetStoryAds(): Promise<any[]> {
  return safeDbCall(async () => {
    const { data, error } = await supabase!
      .from('story_ads')
      .select('*')
      .eq('active', true);
    return { data, error };
  }, []);
}

export async function dbGetAllStoryAds(): Promise<any[]> {
  return safeDbCall(async () => {
    const { data, error } = await supabase!
      .from('story_ads')
      .select('*')
      .order('created_at', { ascending: false });
    return { data, error };
  }, []);
}

export async function dbSaveStoryAd(ad: any): Promise<boolean> {
  return safeWrite('story_ads', {
    id: ad.id,
    admin_id: ad.admin_id,
    media_url: ad.media_url,
    media_type: ad.media_type,
    cta_link: ad.cta_link,
    cta_text: ad.cta_text,
    duration: ad.duration || 5,
    impressions: ad.impressions || 0,
    clicks: ad.clicks || 0,
    completions: ad.completions || 0,
    skips: ad.skips || 0,
    exits: ad.exits || 0,
    active: ad.active,
    target_audience: ad.target_audience,
    frequency_cap: ad.frequency_cap
  });
}

export async function dbDeleteStoryAd(adId: string): Promise<boolean> {
  return safeDelete('story_ads', adId);
}

export async function dbLogStoryAdAnalytics(adId: string, action: 'impression' | 'click' | 'completion' | 'skip' | 'exit'): Promise<void> {
  try {
    // Map action to column name
    let metric_column = action;
    if (action === 'impression') metric_column = 'impressions';
    if (action === 'click') metric_column = 'clicks';
    if (action === 'completion') metric_column = 'completions';
    if (action === 'skip') metric_column = 'skips';
    if (action === 'exit') metric_column = 'exits';

    const { error } = await supabase!.rpc('increment_ad_metric', { 
      ad_id: adId, 
      metric_column: metric_column 
    });

    if (error) throw error;

    let logAction = '';
    if (action === 'impression') logAction = 'Ad Viewed';
    else if (action === 'click') logAction = 'Ad Clicked';
    else if (action === 'completion') logAction = 'Ad Completed';
    else if (action === 'skip') logAction = 'Ad Skipped';
    else if (action === 'exit') logAction = 'Ad Exited';
    console.log(`[STORY AD] ${logAction}`, adId);
  } catch (e: any) {
    console.error("[STORY AD] Ad Analytics Failed:", e?.message, e?.details, e?.hint, e?.code);
  }
}

export async function dbReportStory(storyId: string, reporterId: string, reason: string): Promise<boolean> {
  try {
    const { error } = await supabase!.from('story_moderation').insert({
      story_id: storyId,
      reporter_id: reporterId,
      reason: reason
    });
    if (error) throw error;
    return true;
  } catch(e: any) {
    console.error("[STORY ERROR]", "Report failed", e?.message, e?.details, e?.hint, e?.code);
    return false;
  }
}

// Moderation 
export async function dbHideStory(storyId: string): Promise<boolean> {
  try {
    const { error } = await supabase!.from('stories').update({ is_archived: true }).eq('id', storyId);
    if (error) throw error;
    console.log("[ADMIN STORY] Hide Story", storyId);
    return true;
  } catch (e: any) {
    console.error("Failed to hide story", e?.message, e?.details, e?.hint, e?.code);
    return false;
  }
}

export async function dbFeatureStory(storyId: string): Promise<boolean> {
  try {
    // Requires an is_featured column or we just pretend for UI mock purposes if schema lacks it
    const { error } = await supabase!.from('stories').update({ is_featured: true }).eq('id', storyId);
    if (error) throw error;
    console.log("[ADMIN STORY] Feature Story", storyId);
    return true;
  } catch (e: any) {
    console.warn("Featured story fallback (column might not exist)", e?.message);
    return false;
  }
}


/**
 * ============================================================================
 * 3. POSTS & COMMENTS SERVICE (COMMUNITY & FEED MODULE)
 * ============================================================================
 */

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export async function dbGetPosts(fallback: Post[], groupId?: string): Promise<Post[]> {
  if (!isSupabaseConfigured || !supabase) return fallback;
  try {
    let result = null;
    try {
      let query1 = supabase
        .from('posts')
        .select(`
          id,
          text_content,
          image_url,
          post_type,
          created_at,
          likes,
          commentsCount,
          comments,
          profiles:user_id (
            full_name,
            profile_photo,
            area
          ),
          areas:area_id (
            id,
            name,
            latitude,
            longitude
          )
        `)
        .order('created_at', { ascending: false });

      if (groupId) {
        query1 = query1.eq('group_id', groupId);
      } else {
        query1 = query1.is('group_id', null);
      }

      result = await Promise.race([
        query1,
        new Promise<any>((_, reject) => 
          setTimeout(() => reject(new Error('Posts Request Timeout')), 2500)
        )
      ]);
    } catch (e) {
      console.warn("First select attempt with area_id failed, falling back to query without area_id:", e);
    }

    let data = result?.data;
    let error = result?.error;

    if (error || !data) {
      console.log("Retrying posts fetch without areas join...");
      const retryResult = await Promise.race([
        supabase
          .from('posts')
          .select(`
            id,
            text_content,
            image_url,
            post_type,
            created_at,
            likes,
            commentsCount,
            comments,
            profiles:user_id (
              full_name,
              profile_photo,
              area
            )
          `)
          .order('created_at', { ascending: false }),
        new Promise<any>((_, reject) => 
          setTimeout(() => reject(new Error('Posts Request Timeout')), 2500)
        )
      ]);
      data = retryResult?.data;
      error = retryResult?.error;
    }

    if (error || !data) {
      console.warn("Error fetching posts:", error?.message);
      return fallback;
    }

    return data.map((p: any) => {
      const profile = p.profiles;
      const areaJoined = p.areas;
      let contentClean = p.text_content || '';
      let lfImages: string[] = [];
      const lfMatch = contentClean.match(/\[LF_IMAGES:(.*?)\]/);
      if (lfMatch) {
        lfImages = lfMatch[1]?.split(',').filter(Boolean);
        contentClean = contentClean.replace(/\[LF_IMAGES:(.*?)\]/, '')?.trim();
      }

      return {
        id: p.id,
        author: profile?.full_name || 'Local Resident',
        avatar: profile?.profile_photo || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=120',
        area: areaJoined?.name || profile?.area || 'Dhoke Hassu',
        content: contentClean,
        image: p.image_url || undefined,
        lfImages: lfImages,
        images: lfImages,
        postTag: contentClean.startsWith('🔍 LOST') ? 'lost' : (contentClean.startsWith('✅ FOUND') ? 'found' : null),
        likes: p.likes || 0,
        commentsCount: p.commentsCount || 0,
        comments: p.comments || [],
        time: formatTimeAgo(new Date(p.created_at)),
        userId: p.user_id || profile?.user_id,
        areaId: p.area_id || undefined,
        locationName: areaJoined?.name || undefined,
        latitude: areaJoined?.latitude || undefined,
        longitude: areaJoined?.longitude || undefined
      } as Post;
    });
  } catch (err) {
    console.warn("Exception in dbGetPosts:", err);
    return fallback;
  }
}

export async function dbSavePost(post: any): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false;
  try {
    // Generate UUID if we are writing a new post and no UUID is present
    const payload: any = {
      id: post.id && post.id.length > 10 && !post.id.startsWith('p') ? post.id : undefined,
      user_id: post.userId || post.user_id,
      text_content: post.content,
      image_url: post.image || null,
      post_type: post.postType || 'general',
      likes: post.likes || 0,
      commentsCount: post.commentsCount || 0,
      comments: post.comments || []
    };

    if (post.areaId) { payload.area_id = post.areaId; } 
    if (post.groupId) { payload.group_id = post.groupId; }
    if (post.pageId) { payload.page_id = post.pageId; }

    let { error } = await supabase
      .from('posts')
      .upsert(payload, { onConflict: 'id' });

    // Fallback: If upsert failed due to missing area_id column, retry without it
    if (error && post.areaId) {
      console.warn("dbSavePost failed with area_id, retrying without area_id column:", error.message);
      delete payload.area_id;
      const retryResult = await supabase
        .from('posts')
        .upsert(payload, { onConflict: 'id' });
      error = retryResult.error;
    }

    // Fallback: If upsert failed due to missing group_id column, retry without it
    if (error && post.groupId) {
      console.warn("dbSavePost failed with group_id, retrying without group_id column:", error.message);
      delete payload.group_id;
      const retryResult = await supabase
        .from('posts')
        .upsert(payload, { onConflict: 'id' });
      error = retryResult.error;
    }

    // Fallback: If upsert failed due to missing page_id column, retry without it
    if (error && post.pageId) {
      console.warn("dbSavePost failed with page_id, retrying without page_id column:", error.message);
      delete payload.page_id;
      const retryResult = await supabase
        .from('posts')
        .upsert(payload, { onConflict: 'id' });
      error = retryResult.error;
    }

    // Handle Hashtags and Mentions asynchronously
    if (!error && post.content) {
      setTimeout(async () => {
        try {
          const hashtagsMatch = post.content.match(/(#[A-Za-z0-9_]+)/g);
          if (hashtagsMatch) {
            const tags = hashtagsMatch.map((t: string) => t?.slice(1)?.toLowerCase());
            const uniqueTags = [...new Set(tags)] as string[];
            
            // We need to import dbUpsertHashtags from hashtagService if they are separated,
            // or we just call the RPC directly here to avoid circular imports.
            for (const tag of uniqueTags) {
              await supabase.rpc('upsert_hashtag', { hashtag_text: tag });
            }
          }

          const mentionsMatch = post.content.match(/(@[A-Za-z0-9_]+)/g);
          if (mentionsMatch) {
            const usernames = mentionsMatch.map((m: string) => m?.slice(1)?.toLowerCase());
            const uniqueUsernames = [...new Set(usernames)];
            
            // Find users by username and trigger notification
            for (const un of uniqueUsernames) {
              const { data: userData } = await supabase
                .from('profiles')
                .select('id')
                .eq('username', un)
                .single();
                
              if (userData?.id && userData.id !== payload.user_id) {
                // Assuming dbTriggerNotification is in the same file or imported
                await dbTriggerNotification(
                  userData.id, 
                  payload.user_id, 
                  'mention', 
                  'New Mention', 
                  `You were mentioned in a post.`, 
                  `/feed?post=${payload.id || ''}`
                );
              }
            }
          }
        } catch (e) {
          console.error("Error processing hashtags/mentions:", e);
        }
      }, 0);
    }

    return !error;
  } catch (err) {
    console.warn("Exception in dbSavePost:", err);
    return false;
  }
}

export async function dbUploadPostImage(file: File): Promise<string | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  try {
    const fileExt = file.name?.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36)?.substring(2, 9)}.${fileExt}`;
    const filePath = `posts/${fileName}`;

    // Upload to 'posts' bucket
    const { data, error } = await supabase.storage
      .from('posts')
      .upload(filePath, file);

    if (error) {
      console.warn("Error uploading post image:", error.message);
      return null;
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('posts')
      .getPublicUrl(filePath);

    return publicUrl;
  } catch (err) {
    console.warn("Exception in dbUploadPostImage:", err);
    return null;
  }
}

export async function dbUploadStoryMedia(file: File): Promise<string | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  try {
    const fileExt = file.name?.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36)?.substring(2, 9)}.${fileExt}`;
    const filePath = `stories/${fileName}`; // Reuse the 'posts' bucket but under a 'stories' folder

    const { data, error } = await supabase.storage
      .from('posts')
      .upload(filePath, file);

    if (error) {
      console.error("[STORY] Storage Upload Error details:", { 
        message: error.message, 
        name: error.name 
      });
      throw error; // Throw the actual error so handlePostStory can catch it
    }

    const { data: { publicUrl } } = supabase.storage
      .from('posts')
      .getPublicUrl(filePath);

    return publicUrl;
  } catch (err: any) {
    console.error("[STORY] Exception in dbUploadStoryMedia:", { 
      message: err.message, 
      code: err.code,
      stack: err.stack 
    });
    throw err; // Propagate exception
  }
}

export async function dbUploadAvatar(userId: string, base64Data: string): Promise<string | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  try {
    const base64Parts = base64Data?.split(';base64,');
    if (base64Parts.length < 2) return null;
    const mimeType = base64Parts[0]?.split(':')[1];
    const rawBase64 = base64Parts[1];
    
    const byteCharacters = atob(rawBase64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: mimeType });
    const file = new File([blob], `avatar-${userId}.jpg`, { type: mimeType });

    const filePath = `avatars/${userId}-${Date.now()}.jpg`;

    const { error } = await supabase.storage
      .from('posts')
      .upload(filePath, file, { cacheControl: '3600', upsert: true });

    if (error) {
      console.warn("Error uploading avatar to storage:", error.message);
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('posts')
      .getPublicUrl(filePath);

    return publicUrl;
  } catch (err) {
    console.error("Exception in dbUploadAvatar:", err);
    return null;
  }
}

export async function dbUploadVoiceMessage(
  userId: string, 
  conversationId: string, 
  audioBlob: Blob
): Promise<string | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  try {
    const dateStr = new Date().toISOString().split('T')[0];
    const uniqueId = Math.random().toString(36)?.substring(2, 9);
    const fileExt = audioBlob.type.includes('wav') ? 'wav' : 'webm';
    const fileName = `${Date.now()}-${uniqueId}.${fileExt}`;
    const filePath = `${userId}/${conversationId}/${dateStr}/${fileName}`;

    const { data, error } = await supabase.storage
      .from('chat-voice')
      .upload(filePath, audioBlob, {
        contentType: audioBlob.type || 'audio/webm',
        cacheControl: '3600'
      });

    if (error) {
      console.warn("Error uploading voice message:", error.message);
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('chat-voice')
      .getPublicUrl(filePath);

    return publicUrl;
  } catch (err) {
    console.error("[CHAT ERROR] Exception in dbUploadVoiceMessage:", err);
    return null;
  }
}

export async function dbDeletePost(postId: string): Promise<boolean> {
  return safeDelete('posts', postId);
}

export async function dbUploadChatAttachment(
  userId: string,
  conversationId: string,
  file: File | Blob,
  fileNameStr: string
): Promise<{ url: string; size: number } | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  try {
    const dateStr = new Date().toISOString().split('T')[0];
    const uniqueId = Math.random().toString(36)?.substring(2, 9);
    const safeFileName = fileNameStr.replace(/[^a-zA-Z0-9.-]/g, '_');
    const finalName = `${Date.now()}-${uniqueId}-${safeFileName}`;
    const filePath = `${userId}/${conversationId}/${dateStr}/${finalName}`;

    let bucket = 'chat-attachments';
    let { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, { cacheControl: '3600' });

    if (error && error.message.includes('Bucket not found')) {
       console.log("[CHAT IMAGE]", "chat-attachments bucket not found, falling back to 'posts'");
       bucket = 'posts';
       const fallbackRes = await supabase.storage.from(bucket).upload(`chat/${filePath}`, file, { cacheControl: '3600' });
       error = fallbackRes.error;
       data = fallbackRes.data;
    }

    if (error) {
      console.error("[CHAT IMAGE]", error);
      return null;
    }

    const returnedStoragePath = bucket === 'posts' ? `chat/${filePath}` : filePath;
    console.log("[CHAT IMAGE]", "Returned storage path:", returnedStoragePath);

    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(returnedStoragePath);

    console.log("[CHAT IMAGE]", "Generated public URL:", publicUrl);
    console.log("[CHAT IMAGE]", "Upload completed");
    
    return { url: publicUrl, size: file.size };
  } catch (err) {
    console.error("[CHAT IMAGE]", err);
    return null;
  }
}

/**
 * ============================================================================
 * 3b. POST LIKES SERVICE
 * ============================================================================
 * Requires a `post_likes` table with UNIQUE(post_id, user_id).
 *
 * Run once in Supabase SQL editor:
 *
 *   CREATE TABLE IF NOT EXISTS public.post_likes (
 *     id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 *     post_id    UUID NOT NULL,
 *     user_id    UUID NOT NULL,
 *     created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 *     UNIQUE(post_id, user_id)
 *   );
 *   ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
 *   CREATE POLICY "read_post_likes"   ON public.post_likes FOR SELECT USING (true);
 *   CREATE POLICY "insert_post_likes" ON public.post_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
 *   CREATE POLICY "delete_post_likes" ON public.post_likes FOR DELETE USING (auth.uid() = user_id);
 */

/** Toggle like/unlike. Returns { liked, likeCount } after the operation. */
export async function dbTogglePostLike(
  postId: string,
  userId: string
): Promise<{ liked: boolean; likeCount: number }> {
  if (!isSupabaseConfigured || !supabase) return { liked: false, likeCount: 0 };
  try {
    const { data: existing } = await supabase
      .from('post_likes')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', userId)
      .maybeSingle();

    let liked: boolean;
    if (existing) {
      await supabase.from('post_likes').delete().eq('post_id', postId).eq('user_id', userId);
      liked = false;
    } else {
      const { error: insErr } = await supabase.from('post_likes').insert({ post_id: postId, user_id: userId });
      liked = !insErr || insErr.code === '23505';
    }

    const { count } = await supabase
      .from('post_likes')
      .select('id', { count: 'exact', head: true })
      .eq('post_id', postId);

    return { liked, likeCount: count ?? 0 };
  } catch (err: any) {
    console.warn('[dbTogglePostLike] Exception:', err?.message || err);
    return { liked: false, likeCount: 0 };
  }
}

/** Get all post IDs liked by a user -- used to initialize UI on page load. */
export async function dbGetUserPostLikes(userId: string): Promise<Set<string>> {
  if (!isSupabaseConfigured || !supabase || !userId) return new Set();
  try {
    const { data, error } = await supabase
      .from('post_likes')
      .select('post_id')
      .eq('user_id', userId);
    if (error) { console.warn('[dbGetUserPostLikes]', error.message); return new Set(); }
    return new Set((data || []).map((r: any) => r.post_id as string));
  } catch (err: any) {
    console.warn('[dbGetUserPostLikes] Exception:', err?.message || err);
    return new Set();
  }
}

/** Fetch like counts for multiple post IDs in one query. */
export async function dbGetPostLikeCounts(postIds: string[]): Promise<Record<string, number>> {
  if (!isSupabaseConfigured || !supabase || !postIds.length) return {};
  try {
    const { data, error } = await supabase
      .from('post_likes')
      .select('post_id')
      .in('post_id', postIds);
    if (error) { console.warn('[dbGetPostLikeCounts]', error.message); return {}; }
    const counts: Record<string, number> = {};
    (data || []).forEach((r: any) => { counts[r.post_id] = (counts[r.post_id] || 0) + 1; });
    return counts;
  } catch (err: any) {
    console.warn('[dbGetPostLikeCounts] Exception:', err?.message || err);
    return {};
  }
}


/**
 * ============================================================================
 * 4. JOBS SERVICE (JOBS MODULE)
 * ============================================================================
 */

export async function dbGetJobs(fallback: JobItem[]): Promise<JobItem[]> {
  return safeDbCall(async () => {
    const { data, error } = await supabase!
      .from('jobs')
      .select('*')
      .order('postedTime', { ascending: false });
    return { data, error };
  }, fallback);
}

export async function dbSaveJob(job: JobItem): Promise<boolean> {
  return safeWrite('jobs', job);
}

export async function dbDeleteJob(jobId: string): Promise<boolean> {
  return safeDelete('jobs', jobId);
}

// Applications for jobs
export async function dbGetJobApplications(fallback: JobApplication[]): Promise<JobApplication[]> {
  return safeDbCall(async () => {
    const { data, error } = await supabase!
      .from('job_applications')
      .select('*')
      .order('appliedDate', { ascending: false });
    return { data, error };
  }, fallback);
}

export async function dbSaveJobApplication(app: JobApplication): Promise<boolean> {
  return safeWrite('job_applications', app);
}


/**
 * ============================================================================
 * 5. PROPERTY SERVICE (PROPERTY MODULE)
 * ============================================================================
 */

export async function dbGetProperties(fallback: PropertyItem[]): Promise<PropertyItem[]> {
  return safeDbCall(async () => {
    const { data, error } = await supabase!
      .from('properties')
      .select('*')
      .order('id', { ascending: false });
    return { data, error };
  }, fallback);
}

export async function dbSaveProperty(property: PropertyItem): Promise<boolean> {
  return safeWrite('properties', property);
}

export async function dbDeleteProperty(propertyId: string): Promise<boolean> {
  return safeDelete('properties', propertyId);
}

export async function dbUploadPropertyImage(file: File): Promise<string | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  try {
    const fileExt = file.name?.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36)?.substring(2, 9)}.${fileExt}`;
    const filePath = `${fileName}`;

    let bucketName = 'property_images';
    let uploadRes = await supabase.storage.from(bucketName).upload(filePath, file);

    if (uploadRes.error) {
      console.warn(`Upload to '${bucketName}' bucket failed: ${uploadRes.error.message}. Trying fallback 'posts' bucket.`);
      bucketName = 'posts';
      uploadRes = await supabase.storage.from(bucketName).upload(filePath, file);
      if (uploadRes.error) {
        console.error('Upload to fallback posts bucket failed:', uploadRes.error.message);
        return null;
      }
    }

    const { data: { publicUrl } } = supabase.storage.from(bucketName).getPublicUrl(filePath);
    return publicUrl;
  } catch (err) {
    console.error('Exception in dbUploadPropertyImage:', err);
    return null;
  }
}


/**
 * ============================================================================
 * 6. MARKETPLACE SERVICE (BUY & SELL MODULE)
 * ============================================================================
 */

export async function dbGetMarketplaceItems(fallback: BuySellItem[]): Promise<BuySellItem[]> {
  return safeDbCall(async () => {
    const { data, error } = await supabase!
      .from('buy_sell_items')
      .select('*')
      .order('postedTime', { ascending: false });
    return { data, error };
  }, fallback);
}

export async function dbSaveMarketplaceItem(item: BuySellItem): Promise<boolean> {
  return safeWrite('buy_sell_items', item);
}

export async function dbDeleteMarketplaceItem(itemId: string): Promise<boolean> {
  return safeDelete('buy_sell_items', itemId);
}


// ==========================================
// RENEWED REAL-TIME MARKETPLACE SERVICE
// ==========================================

export async function dbGetMarketplaceListings(fallback: MarketplaceItem[]): Promise<MarketplaceItem[]> {
  return safeDbCall(async () => {
    const { data, error } = await supabase!
      .from('marketplace_items')
      .select(`
        *,
        images:item_images(*),
        seller_profile:profiles!marketplace_items_posted_by_fkey(full_name, profile_photo, verified)
      `)
      .order('posted_at', { ascending: false });
    
    // Map profiles to camelCase structure expected by UI
    const mapped = (data || []).map((item: any) => ({
      ...item,
      seller_profile: item.seller_profile ? {
        full_name: item.seller_profile.full_name,
        profile_photo: item.seller_profile.profile_photo,
        verified: item.seller_profile.verified
      } : undefined
    }));
    return { data: mapped, error };
  }, fallback);
}

export async function dbSaveMarketplaceListing(item: Partial<MarketplaceItem>): Promise<boolean> {
  return safeWrite('marketplace_items', item);
}

export async function dbDeleteMarketplaceListing(itemId: string): Promise<boolean> {
  return safeDelete('marketplace_items', itemId);
}

export async function dbUploadServiceImage(file: File): Promise<string | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  try {
    const fileExt = file.name?.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36)?.substring(2, 9)}.${fileExt}`;
    const filePath = `${fileName}`;

    let bucketName = 'services_images';
    let uploadRes = await supabase.storage.from(bucketName).upload(filePath, file);

    if (uploadRes.error) {
      console.warn(`Upload to '${bucketName}' bucket failed: ${uploadRes.error.message}. Trying fallback 'posts' bucket.`);
      bucketName = 'posts';
      uploadRes = await supabase.storage.from(bucketName).upload(filePath, file);
      if (uploadRes.error) {
        console.error("Upload to fallback posts bucket failed:", uploadRes.error.message);
        return null;
      }
    }

    const { data: { publicUrl } } = supabase.storage.from(bucketName).getPublicUrl(filePath);
    return publicUrl;
  } catch (err) {
    console.error("Exception in dbUploadServiceImage:", err);
    return null;
  }
}

export async function dbUploadMarketplaceImage(file: File): Promise<string | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  try {
    const fileExt = file.name?.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36)?.substring(2, 9)}.${fileExt}`;
    const filePath = `${fileName}`;

    let bucketName = 'marketplace_images';
    let uploadRes = await supabase.storage.from(bucketName).upload(filePath, file);

    if (uploadRes.error) {
      console.warn(`Upload to '${bucketName}' bucket failed: ${uploadRes.error.message}. Trying fallback 'posts' bucket.`);
      bucketName = 'posts';
      uploadRes = await supabase.storage.from(bucketName).upload(filePath, file);
      if (uploadRes.error) {
        console.error("Upload to fallback posts bucket failed:", uploadRes.error.message);
        return null;
      }
    }

    const { data: { publicUrl } } = supabase.storage.from(bucketName).getPublicUrl(filePath);
    return publicUrl;
  } catch (err) {
    console.error("Exception in dbUploadMarketplaceImage:", err);
    return null;
  }
}

export async function dbDeleteMarketplaceImage(url: string): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false;
  try {
    const bucketNames = ['marketplace_images', 'posts'];
    let bucketName = '';
    let filePath = '';

    for (const b of bucketNames) {
      const marker = `/public/${b}/`;
      if (url.includes(marker)) {
        bucketName = b;
        filePath = url?.split(marker)[1];
        break;
      }
    }

    if (!bucketName || !filePath) {
      console.warn("Could not determine bucket or path from URL:", url);
      return false;
    }

    const { error } = await supabase.storage.from(bucketName).remove([filePath]);
    return !error;
  } catch (err) {
    console.error("Exception in dbDeleteMarketplaceImage:", err);
    return false;
  }
}

export async function dbSaveMarketplaceImages(images: Partial<ItemImage>[]): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false;
  try {
    const { error } = await supabase.from('item_images').insert(images);
    return !error;
  } catch (err) {
    console.error("Error saving marketplace images:", err);
    return false;
  }
}

export async function dbGetItemChats(itemId: string, fallback: ItemChat[]): Promise<ItemChat[]> {
  return safeDbCall(async () => {
    const { data, error } = await supabase!
      .from('item_chats')
      .select('*')
      .eq('item_id', itemId)
      .order('sent_at', { ascending: true });
    return { data, error };
  }, fallback);
}

export async function dbSendItemChatMessage(message: Partial<ItemChat>): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false;
  try {
    const payload: any = {
      item_id: message.item_id,
      sender_id: message.sender_id,
      sender_name: message.sender_name,
      content: message.content,
      sent_at: message.sent_at || new Date().toISOString()
    };
    // Only include id if explicitly provided (avoid upsert conflicts on missing id)
    if (message.id) payload.id = message.id;

    const { error } = await supabase
      .from('item_chats')
      .insert(payload);

    if (error) {
      console.error('dbSendItemChatMessage insert error:', error.message, error.details, error.hint);
      return false;
    }
    return true;
  } catch (err: any) {
    console.error('dbSendItemChatMessage exception:', err?.message || err);
    return false;
  }
}

export async function dbGetItemFavorites(userId: string, fallback: string[]): Promise<string[]> {
  return safeDbCall(async () => {
    const { data, error } = await supabase!
      .from('item_favorites')
      .select('item_id')
      .eq('user_id', userId);
    const ids = (data || []).map((fav: any) => fav.item_id);
    return { data: ids, error };
  }, fallback);
}

export async function dbToggleItemFavorite(userId: string, itemId: string, isFavorite: boolean): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false;
  try {
    if (isFavorite) {
      const { error } = await supabase
        .from('item_favorites')
        .insert({ user_id: userId, item_id: itemId });
      return !error;
    } else {
      const { error } = await supabase
        .from('item_favorites')
        .delete()
        .eq('user_id', userId)
        .eq('item_id', itemId);
      return !error;
    }
  } catch (err) {
    console.error("Error toggling item favorite:", err);
    return false;
  }
}

export async function dbReportMarketplaceItem(report: Partial<ItemReport>): Promise<boolean> {
  return safeWrite('item_reports', report);
}

export async function dbIncrementItemViews(itemId: string): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false;
  try {
    const { data } = await supabase
      .from('marketplace_items')
      .select('views')
      .eq('id', itemId)
      .single();
    const currentViews = data?.views || 0;
    const { error } = await supabase
      .from('marketplace_items')
      .update({ views: currentViews + 1 })
      .eq('id', itemId);
    return !error;
  } catch (err) {
    console.error("Error incrementing item views:", err);
    return false;
  }
}


/**
 * ============================================================================
 * 7. BUSINESS SERVICE (BUSINESS MODULE)
 * ============================================================================
 */

export async function dbGetBusinesses(fallback: BusinessItem[]): Promise<BusinessItem[]> {
  const data = await safeDbCall(async () => {
    const { data, error } = await supabase!
      .from('businesses')
      .select('*')
      .order('rating', { ascending: false });
    return { data, error };
  }, fallback);

  return (data || []).map((item: any) => {
    let status = 'Approved';
    let contact = item.contact || '';
    if (contact.startsWith('[STATUS:')) {
      const match = contact.match(/^\[STATUS:([a-zA-Z0-9_]+)\]/);
      if (match) {
        status = match[1];
        contact = contact.replace(`[STATUS:${status}]`, '');
      }
    }
    return {
      ...item,
      contact,
      status
    };
  });
}

export async function dbSaveBusiness(business: BusinessItem): Promise<boolean> {
  const status = business.status || 'Approved';
  const cleanBusiness = {
    ...business,
    contact: `[STATUS:${status}]${business.contact || ''}`
  };
  return safeWrite('businesses', cleanBusiness);
}

export async function dbDeleteBusiness(businessId: string): Promise<boolean> {
  return safeDelete('businesses', businessId);
}


/**
 * ============================================================================
 * 8. SERVICES MODULE (SERVICES MODULE)
 * ============================================================================
 */

export async function dbGetServices(fallback: ServiceItem[]): Promise<ServiceItem[]> {
  if (!isSupabaseConfigured || !supabase) return fallback;
  try {
    const result = await Promise.race([
      supabase
        .from('services')
        .select('*')
        .order('rating', { ascending: false }),
      new Promise<any>((_, reject) => 
        setTimeout(() => reject(new Error('Services Request Timeout')), 2500)
      )
    ]);
    const { data, error } = result;
      
    if (error) {
      console.error("Error fetching services:", error.message);
      return fallback;
    }
    
    return (data || []).map((item: any) => {
      let text = item.description || '';
      let title = item.name || '';
      let whatsAppNumber = '';
      let address = '';
      let workingHours = '';
      let galleryImages: string[] = [];
      let pricing = '';
      let verified = false;
      let reviewCount = 0;
      let dateAdded = item.created_at || '';
      let status: 'Pending' | 'Approved' | 'Rejected' = 'Approved';
      let featured = false;
      let reviews: any[] = [];

      if (item.description && item.description.startsWith('{')) {
        try {
          const parsed = JSON.parse(item.description);
          text = parsed.text || '';
          title = parsed.title || item.name || '';
          whatsAppNumber = parsed.whatsAppNumber || '';
          address = parsed.address || '';
          workingHours = parsed.workingHours || '';
          galleryImages = parsed.galleryImages || [];
          pricing = parsed.pricing || '';
          verified = parsed.verified || false;
          reviewCount = parsed.reviewCount || 0;
          dateAdded = parsed.dateAdded || item.created_at || '';
          status = parsed.status || 'Approved';
          featured = parsed.featured || false;
          reviews = parsed.reviews || [];
        } catch (e) {
          console.warn("Error parsing service description JSON:", e);
        }
      }

      return {
        ...item,
        description: text,
        title,
        whatsAppNumber,
        address,
        workingHours,
        galleryImages,
        pricing,
        verified,
        reviewCount,
        dateAdded,
        status,
        featured,
        reviews
      };
    });
  } catch (err: any) {
    console.error("Exception fetching services:", err);
    return fallback;
  }
}

export async function dbSaveService(service: ServiceItem): Promise<boolean> {
  const { title, whatsAppNumber, address, workingHours, galleryImages, pricing, verified, reviewCount, dateAdded, status, featured, reviews, ...rest } = service;
  
  const packedDescription = JSON.stringify({
    text: service.description || '',
    title: service.title || service.name || '',
    whatsAppNumber: service.whatsAppNumber || '',
    address: service.address || '',
    workingHours: service.workingHours || '',
    galleryImages: service.galleryImages || [],
    pricing: service.pricing || '',
    verified: service.verified || false,
    reviewCount: service.reviewCount || 0,
    dateAdded: service.dateAdded || new Date().toISOString(),
    status: service.status || 'Approved',
    featured: service.featured || false,
    reviews: service.reviews || []
  });

  const dbService = {
    ...rest,
    description: packedDescription
  };

  return safeWrite('services', dbService);
}

export async function dbDeleteService(serviceId: string): Promise<boolean> {
  return safeDelete('services', serviceId);
}


/**
 * ============================================================================
 * 9. ALERTS MODULE (ALERTS MODULE)
 * ============================================================================
 */

export async function dbGetAlerts(fallback: AlertItem[]): Promise<AlertItem[]> {
  return safeDbCall(async () => {
    const { data, error } = await supabase!
      .from('alerts')
      .select('*')
      .order('postedTime', { ascending: false });
    
    if (error || !data) return { data, error };

    const mapped = data.map((item: any) => {
      let parsedUpdates: string[] = [];
      let expiryTime: string | undefined = undefined;
      let status: 'Active' | 'Expired' | 'Archived' = 'Active';
      let latitude: number | undefined = undefined;
      let longitude: number | undefined = undefined;
      let updatedTime: string | undefined = undefined;
      let attachments: string[] = [];
      let visibility: 'Public' | 'Neighbors' = 'Public';

      try {
        if (item.relatedUpdates) {
          if (Array.isArray(item.relatedUpdates)) {
            parsedUpdates = item.relatedUpdates;
          } else if (typeof item.relatedUpdates === 'object') {
            parsedUpdates = item.relatedUpdates.updates || [];
            expiryTime = item.relatedUpdates.expiryTime;
            status = item.relatedUpdates.status || 'Active';
            latitude = item.relatedUpdates.latitude;
            longitude = item.relatedUpdates.longitude;
            updatedTime = item.relatedUpdates.updatedTime;
            attachments = item.relatedUpdates.attachments || [];
            visibility = item.relatedUpdates.visibility || 'Public';
          } else if (typeof item.relatedUpdates === 'string') {
            const parsed = JSON.parse(item.relatedUpdates);
            parsedUpdates = parsed.updates || [];
            expiryTime = parsed.expiryTime;
            status = parsed.status || 'Active';
            latitude = parsed.latitude;
            longitude = parsed.longitude;
            updatedTime = parsed.updatedTime;
            attachments = parsed.attachments || [];
            visibility = parsed.visibility || 'Public';
          }
        }
      } catch (e) {
        console.warn("Error parsing relatedUpdates JSON for alert:", item.id, e);
      }

      return {
        ...item,
        relatedUpdates: parsedUpdates,
        expiryTime,
        status,
        latitude,
        longitude,
        updatedTime,
        attachments,
        visibility
      };
    });

    return { data: mapped, error: null };
  }, fallback);
}

export async function dbSaveAlert(alert: AlertItem): Promise<boolean> {
  const { expiryTime, status, latitude, longitude, updatedTime, attachments, visibility, ...rest } = alert;
  const dbAlert = {
    ...rest,
    relatedUpdates: {
      updates: alert.relatedUpdates || [],
      expiryTime: alert.expiryTime,
      status: alert.status || 'Active',
      latitude: alert.latitude,
      longitude: alert.longitude,
      updatedTime: alert.updatedTime || new Date().toISOString(),
      attachments: alert.attachments || [],
      visibility: alert.visibility || 'Public'
    }
  };
  return safeWrite('alerts', dbAlert);
}

export async function dbDeleteAlert(alertId: string): Promise<boolean> {
  return safeDelete('alerts', alertId);
}


/**
 * ============================================================================
 * 10. EVENTS SERVICE (EVENTS MODULE)
 * ============================================================================
 */

export async function dbGetEvents(fallback: EventItem[]): Promise<EventItem[]> {
  return safeDbCall(async () => {
    const { data, error } = await supabase!
      .from('events')
      .select('*')
      .order('date', { ascending: true });
    
    if (error || !data) return { data, error };

    const mapped = data.map((item: any) => {
      let text = item.description || '';
      let galleryImages: string[] = [];
      let venue = '';
      let googleMap = '';
      let registrationDeadline = '';
      let availableSeats = item.maxAttendees || 100;
      let status: 'Upcoming' | 'Live' | 'Completed' | 'Cancelled' = 'Upcoming';
      let attendees: any[] = [];
      let featured = false;
      let pinned = false;

      if (item.description && item.description.startsWith('{')) {
        try {
          const parsed = JSON.parse(item.description);
          text = parsed.text || '';
          galleryImages = parsed.galleryImages || [];
          venue = parsed.venue || '';
          googleMap = parsed.googleMap || '';
          registrationDeadline = parsed.registrationDeadline || '';
          availableSeats = parsed.availableSeats !== undefined ? parsed.availableSeats : (item.maxAttendees || 100);
          status = parsed.status || 'Upcoming';
          attendees = parsed.attendees || [];
          featured = parsed.featured || false;
          pinned = parsed.pinned || false;
        } catch (e) {
          console.warn("Error parsing event description JSON:", e);
        }
      }

      return {
        ...item,
        description: text,
        galleryImages,
        venue,
        googleMap,
        registrationDeadline,
        availableSeats,
        status,
        attendees,
        featured,
        pinned
      };
    });

    return { data: mapped, error: null };
  }, fallback);
}

export async function dbSaveEvent(event: EventItem): Promise<boolean> {
  const { galleryImages, venue, googleMap, registrationDeadline, availableSeats, status, attendees, featured, pinned, ...rest } = event;

  const packedDescription = JSON.stringify({
    text: event.description || '',
    galleryImages: event.galleryImages || [],
    venue: event.venue || '',
    googleMap: event.googleMap || '',
    registrationDeadline: event.registrationDeadline || '',
    availableSeats: event.availableSeats !== undefined ? event.availableSeats : (event.maxAttendees || 100),
    status: event.status || 'Upcoming',
    attendees: event.attendees || [],
    featured: event.featured || false,
    pinned: event.pinned || false
  });

  const dbEvent = {
    ...rest,
    description: packedDescription
  };

  return safeWrite('events', dbEvent);
}

export async function dbDeleteEvent(eventId: string): Promise<boolean> {
  return safeDelete('events', eventId);
}


/**
 * ============================================================================
 * 11. DEALS SERVICE (DEALS MODULE)
 * ============================================================================
 */

export async function dbGetDeals(fallback: DealItem[]): Promise<DealItem[]> {
  return safeDbCall(async () => {
    const { data, error } = await supabase!
      .from('deals')
      .select('*')
      .order('expiryDate', { ascending: true });
    return { data, error };
  }, fallback);
}

export async function dbSaveDeal(deal: DealItem): Promise<boolean> {
  return safeWrite('deals', deal);
}

export async function dbDeleteDeal(dealId: string): Promise<boolean> {
  return safeDelete('deals', dealId);
}


/**
 * ============================================================================
 * 12. GROUPS SERVICE (GROUPS MODULE)
 * ============================================================================
 */

export async function dbGetGroups(fallback: GroupItem[]): Promise<GroupItem[]> {
  return safeDbCall(async () => {
    const { data, error } = await supabase!
      .from('groups')
      .select('*')
      .order('memberCount', { ascending: false });
    return { data, error };
  }, fallback);
}

export async function dbSaveGroup(group: GroupItem): Promise<boolean> {
  return safeWrite('groups', group);
}

export async function dbDeleteGroup(groupId: string): Promise<boolean> {
  return safeDelete('groups', groupId);
}


/**
 * ============================================================================
 * 13. CHAT & MESSAGES SERVICE (CHAT MODULE)
 * ============================================================================
 */

export async function dbGetConversations(currentUserId: string): Promise<any[]> {
  if (!isSupabaseConfigured || !supabase) return [];
  return safeSupabaseCall(async () => {
    // 1. Get all conversation IDs where currentUserId is a member
    const { data: memberOf, error: memberError } = await supabase
      .from('conversation_members')
      .select('conversation_id')
      .eq('user_id', currentUserId);
      
    if (memberError || !memberOf) {
      console.warn("Error fetching conversation IDs:", memberError);
      return [];
    }
    
    const conversationIds = memberOf.map(m => m.conversation_id);
    if (conversationIds.length === 0) return [];
    
    // 2. Fetch conversations, their members, and their messages
    const { data: convData, error: convError } = await supabase
      .from('conversations')
      .select(`
        id,
        type,
        created_at,
        conversation_members (
          user_id,
          role,
          profiles:user_id (
            user_id,
            full_name,
            email,
            profile_photo,
            mobileNumber
          )
        ),
        messages (
          id,
          message_text,
          message_type,
          created_at,
          sender_id,
          is_seen,
          media_url,
          media_duration,
          media_size,
          waveform_data,
          upload_status
        )
      `)
      .in('id', conversationIds);
      
    if (convError || !convData) {
      console.error("Error fetching conversation details:", {
        code: convError?.code,
        message: convError?.message,
        details: convError?.details,
        hint: convError?.hint,
        query: `Fetch conversations details for user_id: ${currentUserId}`,
        conversationIds
      });
      return [];
    }

    // Map Supabase rows to our Conversation UI interface format
    const conversations = convData.map((c: any) => {
      // Find other member for private chat display details
      const otherMemberRelation = c.conversation_members.find((m: any) => m.user_id !== currentUserId) 
                                || c.conversation_members[0];
      const otherProfile = otherMemberRelation?.profiles;
      
      // Sort messages by created_at descending to get the last message
      const sortedMsgs = [...(c.messages || [])].sort((a: any, b: any) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      const lastMsg = sortedMsgs[0];
      
      // Count unread messages sent by others
      const unreadCount = (c.messages || []).filter((m: any) => 
        m.sender_id !== currentUserId && !m.is_seen
      ).length;

      // Map messages into Conversation interface format (sorted ascending for UI display)
      const mappedMessages = [...(c.messages || [])]
        .sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        .map((m: any) => ({
          id: m.id,
          sender: m.sender_id === currentUserId ? 'me' : 'them',
          text: m.message_text,
          time: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          timestamp: new Date(m.created_at).getTime(),
          isSeen: m.is_seen,
          status: m.is_seen ? 'delivered' : 'delivered',
          voice: m.message_type === 'voice' && m.media_url ? {
            url: m.media_url,
            duration: m.media_duration || 0,
            size: m.media_size,
            waveformData: m.waveform_data ? (typeof m.waveform_data === 'string' ? JSON.parse(m.waveform_data) : m.waveform_data) : undefined,
            uploadStatus: m.upload_status || 'uploaded'
          } : undefined,
          attachment: (m.message_type === 'image' || m.message_type === 'file') && m.media_url ? {
            type: m.message_type,
            name: m.message_text,
            url: m.media_url
          } : undefined
        }));

      return {
        id: c.id,
        contact: c.id, // Using conversation ID as URL parameter 'contact'
        recipientId: otherProfile?.user_id,
        lastSeen: undefined,
        name: otherProfile?.full_name || 'Neighbor',
        avatar: otherProfile?.profile_photo || undefined,
        lastMessage: lastMsg?.message_text || (c.type === 'group' ? 'Group created' : 'Click to start conversation'),
        time: lastMsg ? new Date(lastMsg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now',
        timestamp: lastMsg ? new Date(lastMsg.created_at).getTime() : new Date(c.created_at).getTime(),
        unreadCount: unreadCount,
        isOnline: false, // Will be computed dynamically in the front-end
        messages: mappedMessages
      };
    });

    // Sort conversations by last message timestamp descending
    return conversations.sort((a, b) => b.timestamp - a.timestamp);
  }, [], "dbGetConversations");
}

export async function dbGetOrCreatePrivateConversation(currentUserId: string, otherUserId: string): Promise<string | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  return safeSupabaseCall(async () => {
    // 1. Find if there's an existing private conversation between these two
    const { data: cm1, error: err1 } = await supabase
      .from('conversation_members')
      .select('conversation_id')
      .eq('user_id', currentUserId);
      
    if (err1 || !cm1) {
      console.warn("Error querying conversation members:", err1);
      return null;
    }
    
    const myConvIds = cm1.map(m => m.conversation_id);
    if (myConvIds.length > 0) {
      // Query members of our conversations to see if the other user is also in one of them
      const { data: cm2, error: err2 } = await supabase
        .from('conversation_members')
        .select('conversation_id, user_id')
        .in('conversation_id', myConvIds);
        
      if (!err2 && cm2) {
        const match = cm2.find(m => m.user_id === otherUserId);
        if (match) {
          // Check if this conversation is private
          const { data: existing } = await supabase
            .from('conversations')
            .select('id')
            .eq('id', match.conversation_id)
            .eq('type', 'private')
            .limit(1);
            
          if (existing && existing.length > 0) {
            return existing[0].id;
          }
        }
      }
    }
    
    // 2. Create new private conversation
    // Generate UUID client-side to bypass RLS SELECT constraints on insert RETURNING clause
    let convId;
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      convId = crypto.randomUUID();
    } else {
      convId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    }

    const { error: createError } = await supabase
      .from('conversations')
      .insert({ id: convId, type: 'private' });
      
    if (createError) {
      console.warn("Error creating conversation:", createError);
      return null;
    }
    
    // Add members
    const { error: memberError } = await supabase
      .from('conversation_members')
      .insert([
        { conversation_id: convId, user_id: currentUserId, role: 'member' },
        { conversation_id: convId, user_id: otherUserId, role: 'member' }
      ]);
      
    if (memberError) {
      console.warn("Error adding members to conversation:", memberError);
      return null;
    }
    
    return convId;
  }, null, "dbGetOrCreatePrivateConversation");
}

export async function dbFindUserByContact(contact: string): Promise<string | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  return safeSupabaseCall(async () => {
    const cleanContact = contact.replace(/[^0-9a-zA-Z@.-]/g, '');
    const { data, error } = await supabase
      .from('profiles')
      .select('user_id')
      .or(`mobileNumber.eq.${contact},mobileNumber.eq.${cleanContact},email.eq.${contact},username.eq.${contact}`)
      .limit(1);
      
    if (!error && data && data.length > 0) {
      return data[0].user_id;
    }
    return null;
  }, null, "dbFindUserByContact");
}

export async function dbSendMessage(
  conversationId: string, 
  senderId: string, 
  text: string, 
  type: 'text' | 'image' | 'file' | 'voice' = 'text',
  mediaUrl?: string,
  mediaDuration?: number,
  mediaSize?: number,
  waveformData?: number[],
  uploadStatus?: string
): Promise<any | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  try {
    const { data, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: senderId,
        message_text: text,
        message_type: type,
        media_url: mediaUrl,
        media_duration: mediaDuration,
        media_size: mediaSize,
        waveform_data: waveformData ? JSON.stringify(waveformData) : null,
        upload_status: uploadStatus || 'uploaded'
      })
      .select()
      .single();
      
    if (error) {
      console.error("Supabase message insert error:", error);
      throw error;
    }
    return data;
  } catch (err: any) {
    console.error("Exception in dbSendMessage:", err);
    throw err;
  }
}

export async function dbMarkMessagesAsSeen(conversationId: string, userId: string): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false;
  try {
    const { error } = await supabase
      .from('messages')
      .update({ is_seen: true })
      .eq('conversation_id', conversationId)
      .neq('sender_id', userId)
      .eq('is_seen', false);
      
    return !error;
  } catch (err) {
    console.warn("Exception in dbMarkMessagesAsSeen:", err);
    return false;
  }
}


/**
 * ============================================================================
 * 14. NOTIFICATIONS SERVICE (NOTIFICATIONS MODULE)
 * ============================================================================
 */

/**
 * Abstract, device-independent service layer for push notifications
 */
export class PushNotificationService {
  private static registeredTokens: { token: string; platform: string; userId: string }[] = [];

  public static async registerToken(userId: string, token: string, platform: 'web' | 'android' | 'ios'): Promise<boolean> {
    try {
      const exists = this.registeredTokens.some(t => t.token === token);
      if (!exists) {
        this.registeredTokens.push({ token, platform, userId });
      }

      if (isSupabaseConfigured && supabase) {
        const { error } = await supabase
          .from('user_push_tokens')
          .upsert({
            user_id: userId,
            token: token,
            platform: platform
          }, { onConflict: 'token' });
        return !error;
      }
      return true;
    } catch (err) {
      console.warn("Error registering push token:", err);
      return false;
    }
  }

  public static async sendPush(userId: string, title: string, body: string, data?: any): Promise<boolean> {
    try {
      let tokens = this.registeredTokens.filter(t => t.userId === userId);
      
      if (isSupabaseConfigured && supabase) {
        const { data: dbTokens } = await supabase
          .from('user_push_tokens')
          .select('token, platform')
          .eq('user_id', userId);
        if (dbTokens) {
          tokens = dbTokens.map((t: any) => ({ token: t.token, platform: t.platform, userId }));
        }
      }

      if (tokens.length === 0) {
        console.log(`[Push Notification Service Simulator] (No Token) To User: ${userId} -> Title: ${title} | Body: ${body}`);
        return true;
      }

      for (const t of tokens) {
        console.log(`[Push Notification Service] Sending to device on platform "${t.platform?.toUpperCase()}" via Token: ${t.token?.slice(0, 10)}...`);
        console.log(`Payload -> Title: "${title}" | Body: "${body}" | Data:`, data);
        
        if (t.platform === 'web' && 'Notification' in window && (Notification as any).permission === 'granted') {
          new Notification(title, { body, icon: '/logo192.png' });
        }
      }
      return true;
    } catch (err) {
      console.warn("Exception sending push notification:", err);
      return false;
    }
  }
}

export async function dbGetNotifications(
  fallback: Notification[], 
  userId?: string, 
  page: number = 1, 
  pageSize: number = 50
): Promise<Notification[]> {
  if (!isSupabaseConfigured || !supabase || !userId) return fallback;
  try {
    const fromIndex = (page - 1) * pageSize;
    const toIndex = fromIndex + pageSize - 1;

    const { data, error } = await supabase
      .from('notifications')
      .select(`
        id,
        type,
        title,
        body,
        reference_type,
        reference_id,
        is_read,
        created_at,
        profiles:sender_id (
          user_id,
          full_name,
          profile_photo
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(fromIndex, toIndex);

    if (error || !data) {
      console.warn("Error querying notifications:", error?.message);
      return fallback;
    }

    return data.map((n: any) => {
      const senderProfile = n.profiles;
      return {
        id: n.id,
        type: n.type,
        title: n.title,
        message: n.body,
        timeAgo: formatTimeAgo(new Date(n.created_at)),
        read: n.is_read,
        relatedId: n.reference_id || undefined,
        relatedModule: n.reference_type || undefined,
        senderName: senderProfile?.full_name || 'System',
        senderAvatar: senderProfile?.profile_photo || undefined,
        senderId: senderProfile?.user_id || undefined,
        createdAt: n.created_at
      } as Notification;
    });
  } catch (err) {
    console.warn("Exception in dbGetNotifications:", err);
    return fallback;
  }
}

export async function dbGetUnreadNotificationsCount(userId: string): Promise<number> {
  if (!isSupabaseConfigured || !supabase || !userId) return 0;
  try {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);
      
    if (error) return 0;
    return count || 0;
  } catch {
    return 0;
  }
}

export async function dbSaveNotification(notification: any): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false;
  try {
    const payload = {
      id: notification.id && notification.id.length > 10 && !notification.id.startsWith('notif') ? notification.id : undefined,
      user_id: notification.userId || notification.user_id,
      sender_id: notification.senderId || notification.sender_id || null,
      type: notification.type,
      title: notification.title,
      body: notification.message || notification.body,
      reference_type: notification.relatedModule || notification.reference_type || null,
      reference_id: notification.relatedId || notification.reference_id || null,
      is_read: notification.read !== undefined ? notification.read : (notification.is_read || false)
    };

    const { error } = await supabase
      .from('notifications')
      .upsert(payload, { onConflict: 'id' });
      
    return !error;
  } catch (err) {
    console.warn("Exception in dbSaveNotification:", err);
    return false;
  }
}

export async function dbTriggerNotification(
  recipientId: string,
  senderId: string | null,
  type: string,
  title: string,
  body: string,
  referenceType?: string,
  referenceId?: string
): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false;
  try {
    // Check preferences — but never block if the query itself fails
    let isCategoryEnabled = true;
    try {
      const { data: prefs, error: prefsError } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', recipientId)
        .maybeSingle(); // Use maybeSingle to avoid error when no row exists

      if (!prefsError && prefs) {
        const category = type?.toLowerCase();
        if (category.includes('chat') && !prefs.chat_enabled) isCategoryEnabled = false;
        else if ((category.includes('like') || category.includes('comment') || category.includes('reply') || category.includes('share')) && !prefs.community_enabled) isCategoryEnabled = false;
        else if (category.includes('job') && !prefs.jobs_enabled) isCategoryEnabled = false;
        else if (category.includes('offer') && !prefs.marketplace_enabled) isCategoryEnabled = false;
        else if (category.includes('inquiry') && !prefs.businesses_enabled) isCategoryEnabled = false;
        else if (category.includes('property') && !prefs.property_enabled) isCategoryEnabled = false;
        else if (category.includes('alert') && !prefs.emergency_enabled) isCategoryEnabled = false;
        else if (category.includes('system') && !prefs.system_enabled) isCategoryEnabled = false;
        if (!prefs.in_app_enabled) isCategoryEnabled = false;
      }
      // If prefsError or prefs is null → no preference row → default to enabled
    } catch (prefsErr) {
      console.warn('[dbTriggerNotification] Could not check preferences, defaulting to enabled:', prefsErr);
    }

    if (!isCategoryEnabled) return false;

    const { data: newNotif, error } = await supabase
      .from('notifications')
      .insert({
        user_id: recipientId,
        sender_id: senderId,
        type: type,
        title: title,
        body: body,
        reference_type: referenceType || null,
        reference_id: referenceId || null,
        is_read: false
      })
      .select()
      .single();

    if (error) {
      console.warn('[dbTriggerNotification] Notification insert failed:', error.message, error.details, error.hint, error.code);
      return false;
    }

    // Best-effort push notification
    try {
      await PushNotificationService.sendPush(recipientId, title, body, {
        notificationId: newNotif?.id,
        referenceType,
        referenceId
      });
    } catch (pushErr) {
      // Push failure should not block return
    }

    return true;
  } catch (err) {
    console.warn('[dbTriggerNotification] Exception:', err);
    return false;
  }
}

export async function dbMarkNotificationRead(notificationId: string): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false;
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);
    return !error;
  } catch {
    return false;
  }
}

export async function dbMarkAllNotificationsRead(userId: string): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false;
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);
    return !error;
  } catch {
    return false;
  }
}

export async function dbDeleteNotification(notificationId: string): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false;
  try {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);
    return !error;
  } catch {
    return false;
  }
}

export async function dbGetNotificationPreferences(userId: string): Promise<any | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  try {
    const { data, error } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();
      
    if (error) {
      const { data: newPrefs } = await supabase
        .from('notification_preferences')
        .insert({ user_id: userId })
        .select()
        .single();
      return newPrefs;
    }
    return data;
  } catch {
    return null;
  }
}

export async function dbSaveNotificationPreferences(userId: string, prefs: any): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false;
  try {
    const { error } = await supabase
      .from('notification_preferences')
      .upsert({
        user_id: userId,
        ...prefs
      }, { onConflict: 'user_id' });
    return !error;
  } catch (err: any) {
    console.error("Error saving notification preferences:", err);
    return false;
  }
}


/**
 * ============================================================================
 * 15. VERIFICATION SERVICE (VERIFICATION MODULE)
 * ============================================================================
 */

export async function dbGetVerificationRequests(fallback: any[], userId?: string): Promise<any[]> {
  if (!isSupabaseConfigured || !supabase) return fallback;
  try {
    let query = supabase.from('tvs_verification_requests').select(`
      *,
      documents:tvs_verification_documents(*)
    `).is('deleted_at', null);

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;

    return (data || []).map((req: any) => ({
      id: req.id,
      user_id: req.user_id,
      type: req.entity_type === 'Individual' ? 'User' : req.entity_type,
      name: req.entity_name,
      contactNumber: '',
      email: '',
      area: 'Dhoke Hassu',
      supportingDocument: req.documents?.[0]?.file_url || '',
      additionalNotes: req.additional_notes || '',
      status: req.status,
      applicationDate: req.created_at || new Date().toISOString(),
      lastUpdated: req.updated_at || new Date().toISOString()
    }));
  } catch (err) {
    console.warn("Error getting from tvs_verification_requests:", err);
    return fallback;
  }
}

export async function dbSaveVerificationRequest(req: any): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false;
  try {
    const { data, error } = await supabase
      .from('tvs_verification_requests')
      .upsert({
        id: req.id,
        user_id: req.user_id || req.userId,
        entity_name: req.name,
        entity_type: req.type === 'User' ? 'Individual' : (req.type === 'Organization' ? 'NGO' : req.type),
        verification_level: 'Basic',
        status: req.status === 'Under Review' ? 'Under Review' : req.status,
        additional_notes: req.additionalNotes || req.additional_notes || '',
      }, { onConflict: 'id' });

    if (error) throw error;

    if (req.supportingDocument) {
      await supabase
        .from('tvs_verification_documents')
        .upsert({
          request_id: req.id,
          document_type: 'CNIC',
          file_url: req.supportingDocument
        }, { onConflict: 'request_id' });
    }
    return true;
  } catch (err) {
    console.warn("Error saving to tvs_verification_requests:", err);
    return false;
  }
}


/**
 * ============================================================================
 * 16. POLLS SERVICE (SEARCH / POLLS MODULE)
 * ============================================================================
 */

// Helper to determine device category for analytics
export function getDeviceCategory(): 'Desktop' | 'Android' | 'iPhone' | 'Tablet' | 'Browser' {
  const ua = navigator.userAgent?.toLowerCase();
  if (/ipad|tablet|playbook|silk/i.test(ua)) return 'Tablet';
  if (/iphone/i.test(ua)) return 'iPhone';
  if (/android/i.test(ua)) {
    if (/mobile/i.test(ua)) return 'Android';
    return 'Tablet';
  }
  if (/mobi/i.test(ua)) return 'Android';
  return 'Desktop';
}

// Automatically runs the polls database migrations via exec_sql RPC
export async function dbRunPollsMigration(): Promise<{ success: boolean; error: string | null }> {
  if (!isSupabaseConfigured || !supabase) {
    return { success: true, error: null };
  }
  const sql = `
-- 1. Profile Enhancements (Safe & Idempotent with constraint upgrades)
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_gender_check;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS gender TEXT DEFAULT 'Prefer not to say';
UPDATE public.profiles SET gender = 'Prefer not to say' WHERE gender = 'Unknown' OR gender IS NULL;
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_gender_check_v2;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_gender_check_v2 CHECK (gender IN ('Male', 'Female', 'Prefer not to say'));
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS date_of_birth DATE;

-- 2. Idempotent Poll Table Updates
ALTER TABLE public.polls ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE public.polls ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.polls ADD COLUMN IF NOT EXISTS cover_image TEXT;
ALTER TABLE public.polls ADD COLUMN IF NOT EXISTS anonymous BOOLEAN DEFAULT false;
ALTER TABLE public.polls ADD COLUMN IF NOT EXISTS allow_option_change BOOLEAN DEFAULT true;
ALTER TABLE public.polls ADD COLUMN IF NOT EXISTS allow_comments BOOLEAN DEFAULT true;
ALTER TABLE public.polls ADD COLUMN IF NOT EXISTS show_live_results BOOLEAN DEFAULT true;
ALTER TABLE public.polls ADD COLUMN IF NOT EXISTS start_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.polls ADD COLUMN IF NOT EXISTS end_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.polls ADD COLUMN IF NOT EXISTS publish_status TEXT DEFAULT 'Published';
ALTER TABLE public.polls ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT false;
ALTER TABLE public.polls ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'Normal';
ALTER TABLE public.polls ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0;
ALTER TABLE public.polls ADD COLUMN IF NOT EXISTS shares_count INTEGER DEFAULT 0;
ALTER TABLE public.polls ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.profiles(user_id) ON DELETE SET NULL;

-- 3. Normalized Poll Options Table
CREATE TABLE IF NOT EXISTS public.poll_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    poll_id TEXT REFERENCES public.polls(id) ON DELETE CASCADE,
    option_text TEXT NOT NULL,
    votes_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Poll Votes Table (with DOB Snapshot for legacy/robust query fallback)
CREATE TABLE IF NOT EXISTS public.poll_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    poll_id TEXT REFERENCES public.polls(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE,
    option_id UUID NOT NULL, -- references poll_options(id)
    gender TEXT CHECK (gender IN ('Male', 'Female', 'Prefer not to say', 'Unknown')),
    date_of_birth_snapshot DATE,
    area TEXT,
    location_details JSONB, -- stores street/block/mohalla snapshot
    device TEXT CHECK (device IN ('Desktop', 'Android', 'iPhone', 'Tablet', 'Browser')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(poll_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_poll_votes_user_id ON public.poll_votes(user_id);

-- 5. Poll Comments Table
CREATE TABLE IF NOT EXISTS public.poll_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    poll_id TEXT REFERENCES public.polls(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE,
    author_name TEXT NOT NULL,
    author_avatar TEXT,
    content TEXT NOT NULL,
    parent_id UUID REFERENCES public.poll_comments(id) ON DELETE CASCADE,
    likes_count INTEGER DEFAULT 0,
    reported BOOLEAN DEFAULT false,
    pinned BOOLEAN DEFAULT false,
    hidden BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Comment Likes & Reports Relational Tables
CREATE TABLE IF NOT EXISTS public.poll_comment_likes (
    user_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE,
    comment_id UUID REFERENCES public.poll_comments(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, comment_id)
);

CREATE TABLE IF NOT EXISTS public.poll_comment_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    comment_id UUID REFERENCES public.poll_comments(id) ON DELETE CASCADE,
    reporter_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(comment_id, reporter_id)
);

-- 7. Analytics Views Tracking Table
CREATE TABLE IF NOT EXISTS public.poll_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    poll_id TEXT REFERENCES public.polls(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(user_id) ON DELETE SET NULL,
    device TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. Analytics Shares Tracking Table
CREATE TABLE IF NOT EXISTS public.poll_shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    poll_id TEXT REFERENCES public.polls(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(user_id) ON DELETE SET NULL,
    platform TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. Storage Buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('poll_covers', 'poll_covers', true) ON CONFLICT (id) DO NOTHING;
`;
  try {
    const { error } = await supabase.rpc('exec_sql', { sql_query: sql });
    if (error) {
      console.warn("SQL Polls Migration execution via RPC failed:", error.message);
      return { success: false, error: error.message };
    }
    return { success: true, error: null };
  } catch (err: any) {
    console.warn("SQL Polls Migration exception:", err);
    return { success: false, error: err?.message || String(err) };
  }
}

// Upload poll cover to Supabase Storage
export async function dbUploadPollCover(file: File, filename: string): Promise<string | null> {
  // Validate file type
  const allowedTypes = ['image/png', 'image/jpeg', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    console.warn("Storage Validation: Invalid file type rejected:", file.type);
    return null;
  }

  // Validate maximum size (5MB)
  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    console.warn("Storage Validation: File size exceeds 5MB limit:", file.size);
    return null;
  }

  if (isSupabaseConfigured && supabase) {
    try {
      const fileExt = file.name?.split('.').pop() || 'png';
      
      // Generate unique name: poll-covers/YYYY/MM/UUID_filename.ext
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const uniqueId = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function' 
        ? crypto.randomUUID() 
        : Math.random().toString(36)?.substring(2, 15) + Math.random().toString(36)?.substring(2, 15);
      
      const cleanName = filename.replace(/[^a-zA-Z0-9]/g, '_');
      const cleanPath = `poll-covers/${year}/${month}/${uniqueId}_${cleanName}.${fileExt}`;

      // Attempt to create bucket dynamically in case migrations haven't run or bucket is missing
      try {
        await supabase.storage.createBucket('poll_covers', { public: true });
      } catch (err) {
        // Fail silently if bucket already exists or permissions don't allow creation
      }

      let uploadResult = await supabase.storage
        .from('poll_covers')
        .upload(cleanPath, file, { cacheControl: '3600', upsert: false });
      
      if (uploadResult.error) {
        console.warn(`Storage warning: poll_covers upload failed (${uploadResult.error.message}). Trying 'posts' bucket fallback...`);
        const fallbackPath = `poll-covers/${year}/${month}/${uniqueId}_${cleanName}.${fileExt}`;
        
        uploadResult = await supabase.storage
          .from('posts')
          .upload(fallbackPath, file, { cacheControl: '3600', upsert: false });
          
        if (uploadResult.error) {
          console.warn(`Storage warning: posts fallback upload failed (${uploadResult.error.message}). Trying 'ads-banners' public bucket fallback...`);
          
          // Try ads-banners which allows public inserts without auth checks
          const adsPath = `poll-covers/${year}/${month}/${uniqueId}_${cleanName}.${fileExt}`;
          uploadResult = await supabase.storage
            .from('ads-banners')
            .upload(adsPath, file, { cacheControl: '3600', upsert: false });
            
          if (uploadResult.error) {
            console.error(`Storage Error: All storage upload attempts failed. ads-banners error: ${uploadResult.error.message}`);
            return null;
          }
          
          const { data: publicUrlData } = supabase.storage
            .from('ads-banners')
            .getPublicUrl(adsPath);
          if (publicUrlData?.publicUrl) {
            return publicUrlData.publicUrl;
          }
        } else {
          const { data: publicUrlData } = supabase.storage
            .from('posts')
            .getPublicUrl(fallbackPath);
          if (publicUrlData?.publicUrl) {
            return publicUrlData.publicUrl;
          }
        }
      } else if (uploadResult.data) {
        const { data: publicUrlData } = supabase.storage
          .from('poll_covers')
          .getPublicUrl(cleanPath);
        if (publicUrlData?.publicUrl) {
          return publicUrlData.publicUrl;
        }
      }
    } catch (err) {
      console.warn("Storage Exception: Exception during Supabase cover upload:", err);
    }
  } else {
    console.warn("Storage Warning: Supabase is not configured. Upload skipped.");
  }

  return null;
}

// Delete poll cover from Supabase Storage
export async function dbDeletePollCover(imageUrl: string): Promise<boolean> {
  if (!imageUrl || !imageUrl.includes('poll_covers/')) return true;
  if (!isSupabaseConfigured || !supabase) return true;
  try {
    const pathParts = imageUrl?.split('poll_covers/');
    const filePath = pathParts.length > 1 ? pathParts[1] : pathParts[0];
    const { error } = await supabase.storage
      .from('poll_covers')
      .remove([filePath]);
    return !error;
  } catch (err) {
    console.warn("Exception deleting cover image from storage:", err);
    return false;
  }
}

let detectedPollsColumns: string[] | null = null;
let isPollOptionsTableAvailable: boolean | null = null;

async function detectPollsSchema(): Promise<{ columns: string[]; hasOptionsTable: boolean }> {
  if (detectedPollsColumns !== null && isPollOptionsTableAvailable !== null) {
    return { columns: detectedPollsColumns, hasOptionsTable: isPollOptionsTableAvailable };
  }

  const defaultCols = ['id', 'question', 'options', 'totalVotes', 'category', 'area', 'created_at'];
  if (!isSupabaseConfigured || !supabase) {
    detectedPollsColumns = defaultCols;
    isPollOptionsTableAvailable = false;
    return { columns: defaultCols, hasOptionsTable: false };
  }

  try {
    const { data, error } = await supabase!.from('polls').select('*').limit(1);
    
    if (error) {
      detectedPollsColumns = defaultCols;
    } else if (data && data.length > 0) {
      detectedPollsColumns = Object.keys(data[0]);
    } else {
      // If table is empty, we fallback to default columns 
      // or all possible columns. For safety, we use defaultCols.
      detectedPollsColumns = defaultCols;
    }
  } catch (err) {
    detectedPollsColumns = defaultCols;
  }

  try {
    const { error } = await supabase!.from('poll_options').select('id').limit(0);
    isPollOptionsTableAvailable = !error;
  } catch (err) {
    isPollOptionsTableAvailable = false;
  }

  return { columns: detectedPollsColumns, hasOptionsTable: isPollOptionsTableAvailable };
}

// Fetch all polls, merging with options and calculating statuses
export async function dbGetPolls(fallback: Poll[]): Promise<Poll[]> {
  const getDynamicStatus = (p: any): 'Draft' | 'Scheduled' | 'Active' | 'Ending Soon' | 'Closed' | 'Archived' => {
    if (p.publish_status === 'Draft') return 'Draft';
    if (p.publish_status === 'Archived') return 'Archived';
    
    const now = new Date();
    const start = p.start_date ? new Date(p.start_date) : null;
    const end = p.end_date ? new Date(p.end_date) : null;
    
    if (start && now < start) return 'Scheduled';
    if (end && now > end) return 'Closed';
    
    // Ending Soon: less than 24 hours remaining
    if (end) {
      const hoursLeft = (end.getTime() - now.getTime()) / (1000 * 60 * 60);
      if (hoursLeft > 0 && hoursLeft <= 24) return 'Ending Soon';
    }
    
    return 'Active';
  };

  if (!isSupabaseConfigured || !supabase) {
    try {
      const localPollsJson = localStorage.getItem('dhoke_connect_polls');
      if (localPollsJson) {
        const localList: Poll[] = JSON.parse(localPollsJson);
        return localList.map(p => ({
          ...p,
          publish_status: getDynamicStatus(p) as any
        }));
      }
    } catch (e) {
      console.warn("Local storage error in dbGetPolls:", e);
    }
    return fallback;
  }

  try {
    const schema = await detectPollsSchema();

    // Fetch polls metadata
    const { data: pollsData, error: pollsError } = await supabase
      .from('polls')
      .select('*')
      .order('created_at', { ascending: false });

    if (pollsError) throw pollsError;

    let optionsMap: Record<string, PollOption[]> = {};
    if (schema.hasOptionsTable) {
      const { data: optionsData, error: optionsError } = await supabase
        .from('poll_options')
        .select('*');

      if (!optionsError && optionsData) {
        optionsData.forEach((opt: any) => {
          if (!optionsMap[opt.poll_id]) optionsMap[opt.poll_id] = [];
          optionsMap[opt.poll_id].push({
            id: opt.id,
            poll_id: opt.poll_id,
            option_text: opt.option_text,
            votes_count: opt.votes_count || 0
          });
        });
      }
    }

    const polls: Poll[] = (pollsData || []).map((p: any) => {
      let opts: PollOption[] = [];
      if (schema.hasOptionsTable) {
        opts = optionsMap[p.id] || [];
      } else {
        // Fallback to reading the JSONB options column on the legacy polls table
        const rawOpts = p.options;
        const parsedOpts = typeof rawOpts === 'string' ? JSON.parse(rawOpts) : rawOpts;
        if (Array.isArray(parsedOpts)) {
          opts = parsedOpts.map((o: any, idx: number) => ({
            id: o.id || `opt_${idx}`,
            poll_id: p.id,
            option_text: typeof o === 'string' ? o : (o.option_text || ''),
            votes_count: o.votes_count || o.votes || 0,
            poll_cover_image: o.poll_cover_image,
            poll_description: o.poll_description
          }));
        }
      }

      // Extract fallback metadata if columns are missing
      const firstOpt: any = opts[0] || {};
      const fallbackDesc = firstOpt.poll_description || '';
      const fallbackCover = firstOpt.poll_cover_image || null;

      return {
        id: p.id,
        title: schema.columns.includes('title') ? (p.title || 'Untitled Poll') : (p.question || 'Untitled Poll'),
        description: schema.columns.includes('description') ? (p.description || '') : fallbackDesc,
        category: p.category || 'Community',
        cover_image: schema.columns.includes('cover_image') ? p.cover_image : fallbackCover,
        anonymous: schema.columns.includes('anonymous') ? (p.anonymous ?? false) : false,
        allow_option_change: schema.columns.includes('allow_option_change') ? (p.allow_option_change ?? true) : true,
        allow_comments: schema.columns.includes('allow_comments') ? (p.allow_comments ?? true) : true,
        show_live_results: schema.columns.includes('show_live_results') ? (p.show_live_results ?? true) : true,
        start_date: schema.columns.includes('start_date') ? p.start_date : p.created_at,
        end_date: schema.columns.includes('end_date') ? p.end_date : null,
        publish_status: schema.columns.includes('publish_status') ? (p.publish_status || 'Published') : 'Published',
        featured: schema.columns.includes('featured') ? (p.featured ?? false) : false,
        priority: schema.columns.includes('priority') ? (p.priority || 'Normal') : 'Normal',
        total_votes: schema.columns.includes('total_votes') ? (p.total_votes || 0) : (p.totalVotes || 0),
        views_count: schema.columns.includes('views_count') ? (p.views_count || 0) : 0,
        shares_count: schema.columns.includes('shares_count') ? (p.shares_count || 0) : 0,
        created_by: schema.columns.includes('created_by') ? p.created_by : null,
        created_at: p.created_at,
        options: opts
      };
    });

    return polls.map(p => ({
      ...p,
      publish_status: getDynamicStatus(p) as any
    }));
  } catch (err) {
    console.error("Error in dbGetPolls:", err);
    return fallback;
  }
}

// Save or Update Poll metadata and its options
export async function dbSavePoll(poll: Poll): Promise<boolean> {
  const localSave = () => {
    try {
      const localPollsJson = localStorage.getItem('dhoke_connect_polls') || '[]';
      const localList: any[] = JSON.parse(localPollsJson);
      
      // Cache only: id, title, status (publish_status), created_at (start_date), expires_at (end_date), featured
      // Never store images, options, votes, analytics, comments, base64 or binary data.
      const lightPoll = {
        id: poll.id,
        title: poll.title,
        publish_status: poll.publish_status,
        start_date: poll.start_date || new Date().toISOString(),
        end_date: poll.end_date,
        featured: poll.featured,
        category: poll.category,
        priority: poll.priority,
        total_votes: poll.total_votes || 0
      };

      const index = localList.findIndex(p => p.id === poll.id);
      if (index >= 0) {
        localList[index] = lightPoll;
      } else {
        localList.push(lightPoll);
      }
      localStorage.setItem('dhoke_connect_polls', JSON.stringify(localList));
    } catch (e) {
      console.warn("Cache skipped", e);
    }
  };

  if (!isSupabaseConfigured || !supabase) {
    localSave();
    return true;
  }

  let pollInserted = false;
  try {
    const schema = await detectPollsSchema();

    // Dynamically construct poll payload based on existing database columns
    const pollPayload: Record<string, any> = {
      id: poll.id
    };

    if (schema.columns.includes('title')) {
      pollPayload.title = poll.title;
    } else if (schema.columns.includes('question')) {
      pollPayload.question = poll.title || (poll as any).question; // Map title to question if legacy schema
    }

    if (schema.columns.includes('description')) {
      pollPayload.description = poll.description;
    }

    if (schema.columns.includes('category')) {
      pollPayload.category = poll.category;
    }

    if (schema.columns.includes('cover_image')) {
      pollPayload.cover_image = poll.cover_image || null;
    }

    if (schema.columns.includes('anonymous')) {
      pollPayload.anonymous = poll.anonymous;
    }

    if (schema.columns.includes('allow_option_change')) {
      pollPayload.allow_option_change = poll.allow_option_change;
    }

    if (schema.columns.includes('allow_comments')) {
      pollPayload.allow_comments = poll.allow_comments;
    }

    if (schema.columns.includes('show_live_results')) {
      pollPayload.show_live_results = poll.show_live_results;
    }

    if (schema.columns.includes('start_date')) {
      pollPayload.start_date = poll.start_date;
    }

    if (schema.columns.includes('end_date')) {
      pollPayload.end_date = poll.end_date;
    }

    if (schema.columns.includes('publish_status')) {
      pollPayload.publish_status = poll.publish_status;
    }

    if (schema.columns.includes('featured')) {
      pollPayload.featured = poll.featured;
    }

    if (schema.columns.includes('priority')) {
      pollPayload.priority = poll.priority;
    }

    if (schema.columns.includes('total_votes')) {
      pollPayload.total_votes = poll.total_votes || 0;
    } else if (schema.columns.includes('totalVotes')) {
      pollPayload.totalVotes = poll.total_votes || 0;
    }

    if (schema.columns.includes('created_by')) {
      pollPayload.created_by = poll.created_by || null;
    }

    // Save option details inline as JSONB if options table is not available
    const finalOptions = (poll.options || []).map((opt: any, idx: number) => ({
      id: opt.id || `opt_${idx}_${Date.now()}`,
      poll_id: poll.id,
      option_text: typeof opt === 'string' ? opt : opt.option_text,
      votes_count: opt.votes_count || 0
    }));

    // If description or cover_image are missing in the schema, embed them in the first option object
    if (finalOptions.length > 0) {
      if (!schema.columns.includes('description') && poll.description) {
        finalOptions[0].poll_description = poll.description;
      }
      if (!schema.columns.includes('cover_image') && poll.cover_image) {
        finalOptions[0].poll_cover_image = poll.cover_image;
      }
    }

    if (schema.columns.includes('options')) {
      pollPayload.options = finalOptions;
    }

    const { error: pollError } = await supabase
      .from('polls')
      .upsert(pollPayload, { onConflict: 'id' });

    if (pollError) {
      throw new Error(`Database insert failed: ${pollError.message}`);
    }
    pollInserted = true;

    // 2. Save options to dedicated poll_options table only if it exists
    if (schema.hasOptionsTable && poll.options && Array.isArray(poll.options)) {
      for (const opt of poll.options) {
        const optionPayload = {
          id: opt.id || undefined, // let DB generate UUID if not exists
          poll_id: poll.id,
          option_text: typeof opt === 'string' ? opt : opt.option_text,
          votes_count: opt.votes_count || 0
        };
        const { error: optError } = await supabase
          .from('poll_options')
          .upsert(optionPayload);
        
        if (optError) {
          throw new Error(`Poll options insert failed: ${optError.message}`);
        }
      }
    }

    // Try to update local metadata cache but never let it block success
    try {
      localSave();
    } catch (cacheErr) {
      console.warn("Cache skipped", cacheErr);
    }

    return true;
  } catch (err: any) {
    console.error("Error in dbSavePoll:", err);
    if (pollInserted) {
      // Rollback inserted poll to keep consistency and avoid orphan records
      try {
        await supabase.from('polls').delete().eq('id', poll.id);
      } catch (rollbackErr) {
        console.error("Failed to rollback poll metadata after options insert failed:", rollbackErr);
      }
    }
    throw err;
  }
}

// Delete Poll
export async function dbDeletePoll(pollId: string): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) {
    try {
      const localPollsJson = localStorage.getItem('dhoke_connect_polls');
      if (localPollsJson) {
        const localList: Poll[] = JSON.parse(localPollsJson);
        const filtered = localList.filter(p => p.id !== pollId);
        localStorage.setItem('dhoke_connect_polls', JSON.stringify(filtered));
        return true;
      }
    } catch (e) {
      console.error(e);
    }
    return false;
  }

  try {
    const { error } = await supabase
      .from('polls')
      .delete()
      .eq('id', pollId);
    return !error;
  } catch (err) {
    console.error("Error deleting poll:", err);
    return false;
  }
}

// Vote casting system with transaction-safety, snapshots, and optimistic updates
export async function dbCastVote(
  pollId: string, 
  userId: string, 
  optionId: string, 
  userProfile: User
): Promise<{ success: boolean; error: string | null }> {
  
  const device = getDeviceCategory();

  // Local Fallback Vote Casting
  const castLocalVote = () => {
    try {
      const localPollsJson = localStorage.getItem('dhoke_connect_polls');
      const localVotesJson = localStorage.getItem('dhoke_connect_poll_votes') || '[]';
      
      if (!localPollsJson) return { success: false, error: 'Polls database not found' };
      
      const polls: Poll[] = JSON.parse(localPollsJson);
      const votes: PollVote[] = JSON.parse(localVotesJson);
      
      const poll = polls.find(p => p.id === pollId);
      if (!poll) return { success: false, error: 'Poll not found' };
      
      // Check existing vote
      const existingVoteIdx = votes.findIndex(v => v.poll_id === pollId && v.user_id === userId);
      
      if (existingVoteIdx >= 0) {
        if (!poll.allow_option_change) {
          return { success: false, error: 'Vote change is not allowed for this poll.' };
        }
        // Change vote: Decrement old option, increment new option
        const oldOptId = votes[existingVoteIdx].option_id;
        poll.options = poll.options.map((o: any) => {
          if (o.id === oldOptId) return { ...o, votes_count: Math.max(0, (o.votes_count || 0) - 1) };
          if (o.id === optionId) return { ...o, votes_count: (o.votes_count || 0) + 1 };
          return o;
        });
        votes[existingVoteIdx].option_id = optionId;
      } else {
        // New vote
        poll.options = poll.options.map((o: any) => {
          if (o.id === optionId) return { ...o, votes_count: (o.votes_count || 0) + 1 };
          return o;
        });
        
        votes.push({
          poll_id: pollId,
          user_id: userId,
          option_id: optionId,
          gender: userProfile.gender || 'Unknown',
          date_of_birth_snapshot: userProfile.dateOfBirth || null,
          area: userProfile.area || 'Dhoke Hassu',
          device,
          created_at: new Date().toISOString()
        });
      }

      poll.total_votes = poll.options.reduce((sum: number, o: any) => sum + (o.votes_count || 0), 0);
      
      localStorage.setItem('dhoke_connect_polls', JSON.stringify(polls));
      localStorage.setItem('dhoke_connect_poll_votes', JSON.stringify(votes));
      
      return { success: true, error: null };
    } catch (e: any) {
      return { success: false, error: e?.message || 'Local voting failed' };
    }
  };

  if (!isSupabaseConfigured || !supabase) {
    return castLocalVote();
  }

  try {
    const schema = await detectPollsSchema();

    // 1. Verify poll rules first (allow vote change check)
    // Construct columns to select dynamically based on actual schema presence
    const selectCols: string[] = [];
    if (schema.columns.includes('allow_option_change')) selectCols.push('allow_option_change');
    if (schema.columns.includes('start_date')) selectCols.push('start_date');
    if (schema.columns.includes('end_date')) selectCols.push('end_date');
    
    let pollConfig: any = {
      allow_option_change: true,
      start_date: null,
      end_date: null
    };

    if (selectCols.length > 0) {
      const { data, error: pollError } = await supabase
        .from('polls')
        .select(selectCols.join(','))
        .eq('id', pollId)
        .single();
        
      if (!pollError && data) {
        pollConfig = {
          allow_option_change: data.allow_option_change ?? true,
          start_date: data.start_date || null,
          end_date: data.end_date || null
        };
      }
    }

    const now = new Date();
    if (pollConfig.start_date && new Date(pollConfig.start_date) > now) {
      return { success: false, error: 'This poll has not started yet.' };
    }
    if (pollConfig.end_date && new Date(pollConfig.end_date) < now) {
      return { success: false, error: 'This poll is already closed.' };
    }

    // 2. Fallback voting mode if poll_votes table is missing
    if (!schema.hasOptionsTable) {
      // Load user's local votes
      const localVotesJson = localStorage.getItem('dhoke_connect_poll_votes') || '[]';
      const votes: PollVote[] = JSON.parse(localVotesJson);
      const existingVoteIdx = votes.findIndex(v => v.poll_id === pollId && v.user_id === userId);

      // Fetch options JSONB column from polls table to update counts
      const dbSelectCols = ['options'];
      if (schema.columns.includes('total_votes')) dbSelectCols.push('total_votes');
      else if (schema.columns.includes('totalVotes')) dbSelectCols.push('totalVotes');

      const { data: dbPoll, error: dbPollError } = await supabase
        .from('polls')
        .select(dbSelectCols.join(','))
        .eq('id', pollId)
        .single();

      if (dbPollError || !dbPoll) {
        return { success: false, error: 'Could not fetch poll options data' };
      }

      const rawOpts = dbPoll.options;
      let opts = typeof rawOpts === 'string' ? JSON.parse(rawOpts) : rawOpts;
      if (!Array.isArray(opts)) opts = [];

      let previousOptionId = '';
      if (existingVoteIdx >= 0) {
        if (!pollConfig.allow_option_change) {
          return { success: false, error: 'Vote changing is disabled for this poll.' };
        }
        previousOptionId = votes[existingVoteIdx].option_id;
        votes[existingVoteIdx].option_id = optionId;
      } else {
        votes.push({
          poll_id: pollId,
          user_id: userId,
          option_id: optionId,
          gender: userProfile.gender || 'Unknown',
          date_of_birth_snapshot: userProfile.dateOfBirth || null,
          area: userProfile.area || 'Dhoke Hassu',
          device,
          created_at: new Date().toISOString()
        });
      }

      // Update option counts in JSONB array
      opts = opts.map((o: any) => {
        let count = o.votes_count || o.votes || 0;
        if (o.id === optionId) count += 1;
        if (previousOptionId && o.id === previousOptionId) count = Math.max(0, count - 1);
        return { ...o, votes_count: count };
      });

      const newTotal = opts.reduce((sum: number, o: any) => sum + (o.votes_count || 0), 0);

      // Write updated options JSONB array back to legacy table
      const updatePayload: Record<string, any> = {
        options: opts
      };
      if (schema.columns.includes('total_votes')) {
        updatePayload.total_votes = newTotal;
      } else if (schema.columns.includes('totalVotes')) {
        updatePayload.totalVotes = newTotal;
      }

      const { error: updateError } = await supabase
        .from('polls')
        .update(updatePayload)
        .eq('id', pollId);

      if (updateError) throw updateError;

      localStorage.setItem('dhoke_connect_poll_votes', JSON.stringify(votes));
      return { success: true, error: null };
    }

    // 3. Regular voting mode if poll_votes table exists
    const { data: existingVote, error: voteSelectError } = await supabase
      .from('poll_votes')
      .select('*')
      .eq('poll_id', pollId)
      .eq('user_id', userId)
      .maybeSingle();

    if (existingVote) {
      if (!pollConfig.allow_option_change) {
        return { success: false, error: 'Vote changing is disabled for this poll.' };
      }
      
      const oldOptionId = existingVote.option_id;
      
      // Update vote record
      const { error: updateError } = await supabase
        .from('poll_votes')
        .update({ option_id: optionId })
        .eq('poll_id', pollId)
        .eq('user_id', userId);
      
      if (updateError) throw updateError;
      
      // Update counts inside poll_options
      await supabase.rpc('increment_option_votes', { opt_id: optionId });
      await supabase.rpc('decrement_option_votes', { opt_id: oldOptionId });
      
    } else {
      // Create new vote without duplicate demographic data
      const votePayload = {
        poll_id: pollId,
        user_id: userId,
        option_id: optionId,
        device,
        location_details: {
          area: userProfile.area || 'Dhoke Hassu',
          username: userProfile.username || ''
        }
      };

      const { error: insertError } = await supabase
        .from('poll_votes')
        .insert(votePayload);

      if (insertError) throw insertError;

      // Increment counts
      await supabase.rpc('increment_option_votes', { opt_id: optionId });
      
      // Update total poll votes count
      const totalCol = schema.columns.includes('total_votes') ? 'total_votes' : 'totalVotes';
      const { data: currentTotal } = await supabase.from('polls').select(totalCol).eq('id', pollId).single();
      const currentTotalVal = currentTotal ? (currentTotal[totalCol] || 0) : 0;
      await supabase.from('polls').update({ [totalCol]: currentTotalVal + 1 }).eq('id', pollId);
    }

    return { success: true, error: null };
  } catch (err: any) {
    console.error("Error casting vote:", err);
    return { success: false, error: err?.message || 'Database error occurred' };
  }
}

// Fetch all votes cast by the current user to find selected options
export async function dbGetUserVotes(userId: string): Promise<Record<string, string>> {
  const schema = await detectPollsSchema();
  if (!isSupabaseConfigured || !supabase || !schema.hasOptionsTable) {
    try {
      const votesJson = localStorage.getItem('dhoke_connect_poll_votes') || '[]';
      const votes: PollVote[] = JSON.parse(votesJson);
      const userVotes = votes.filter(v => v.user_id === userId);
      const map: Record<string, string> = {};
      userVotes.forEach(v => {
        map[v.poll_id] = v.option_id;
      });
      return map;
    } catch {
      return {};
    }
  }

  try {
    const { data, error } = await supabase
      .from('poll_votes')
      .select('poll_id, option_id')
      .eq('user_id', userId);
    
    if (error) throw error;
    
    const map: Record<string, string> = {};
    data?.forEach((v: any) => {
      map[v.poll_id] = v.option_id;
    });
    return map;
  } catch (err) {
    console.error("Error fetching user votes:", err);
    return {};
  }
}

// Track poll views for conversion calculations
export async function dbTrackPollView(pollId: string, userId?: string): Promise<void> {
  const device = getDeviceCategory();

  // Local storage view tracking
  try {
    const viewsJson = localStorage.getItem('dhoke_connect_poll_views') || '[]';
    const viewsList = JSON.parse(viewsJson);
    viewsList.push({ poll_id: pollId, user_id: userId || null, device, created_at: new Date().toISOString() });
    localStorage.setItem('dhoke_connect_poll_views', JSON.stringify(viewsList));
    
    // Increment poll view counter locally
    const pollsJson = localStorage.getItem('dhoke_connect_polls');
    if (pollsJson) {
      const polls: Poll[] = JSON.parse(pollsJson);
      const updated = polls.map(p => p.id === pollId ? { ...p, views_count: (p.views_count || 0) + 1 } : p);
      localStorage.setItem('dhoke_connect_polls', JSON.stringify(updated));
    }
  } catch (e) {
    console.error(e);
  }

  if (!isSupabaseConfigured || !supabase) return;

  try {
    // Log view entry
    await supabase.from('poll_views').insert({ poll_id: pollId, user_id: userId || null, device });
    
    // Increment count on poll table
    const { data } = await supabase.from('polls').select('views_count').eq('id', pollId).single();
    await supabase.from('polls').update({ views_count: (data?.views_count || 0) + 1 }).eq('id', pollId);
  } catch (err) {
    console.warn("View tracking failed:", err);
  }
}

// Track poll shares for conversion calculations
export async function dbTrackPollShare(pollId: string, userId?: string, platform = 'Clipboard'): Promise<void> {
  // Local storage share tracking
  try {
    const sharesJson = localStorage.getItem('dhoke_connect_poll_shares') || '[]';
    const sharesList = JSON.parse(sharesJson);
    sharesList.push({ poll_id: pollId, user_id: userId || null, platform, created_at: new Date().toISOString() });
    localStorage.setItem('dhoke_connect_poll_shares', JSON.stringify(sharesList));
    
    // Increment poll share counter locally
    const pollsJson = localStorage.getItem('dhoke_connect_polls');
    if (pollsJson) {
      const polls: Poll[] = JSON.parse(pollsJson);
      const updated = polls.map(p => p.id === pollId ? { ...p, shares_count: (p.shares_count || 0) + 1 } : p);
      localStorage.setItem('dhoke_connect_polls', JSON.stringify(updated));
    }
  } catch (e) {
    console.error(e);
  }

  if (!isSupabaseConfigured || !supabase) return;

  try {
    // Log share entry
    await supabase.from('poll_shares').insert({ poll_id: pollId, user_id: userId || null, platform });
    
    // Increment count on poll table
    const { data } = await supabase.from('polls').select('shares_count').eq('id', pollId).single();
    await supabase.from('polls').update({ shares_count: (data?.shares_count || 0) + 1 }).eq('id', pollId);
  } catch (err) {
    console.warn("Share tracking failed:", err);
  }
}

// Fetch all comments for a poll, supporting nested thread assembly
export async function dbGetPollComments(pollId: string): Promise<PollComment[]> {
  if (!isSupabaseConfigured || !supabase) {
    try {
      const commentsJson = localStorage.getItem('dhoke_connect_poll_comments') || '[]';
      const allComments: PollComment[] = JSON.parse(commentsJson);
      const pollComments = allComments.filter(c => c.poll_id === pollId && !c.hidden);
      
      // Structure nested replies
      const rootComments = pollComments.filter(c => !c.parent_id);
      rootComments.forEach(root => {
        root.replies = pollComments.filter(c => c.parent_id === root.id);
      });
      
      return rootComments;
    } catch {
      return [];
    }
  }

  try {
    // Fetch comments
    const { data, error } = await supabase
      .from('poll_comments')
      .select('*')
      .eq('poll_id', pollId)
      .eq('hidden', false)
      .order('created_at', { ascending: true });

    if (error) throw error;

    const allComments: PollComment[] = data.map((c: any) => ({
      id: c.id,
      poll_id: c.poll_id,
      user_id: c.user_id,
      author_name: c.author_name,
      author_avatar: c.author_avatar || undefined,
      content: c.content,
      parent_id: c.parent_id,
      likes_count: c.likes_count || 0,
      reported: c.reported ?? false,
      pinned: c.pinned ?? false,
      hidden: c.hidden ?? false,
      created_at: c.created_at,
      replies: []
    }));

    // Assemble comments into a tree
    const rootComments = allComments.filter(c => !c.parent_id);
    rootComments.forEach(root => {
      root.replies = allComments.filter(c => c.parent_id === root.id);
    });

    // Pinned comments first
    return rootComments.sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));
  } catch (err) {
    console.error("Error fetching poll comments:", err);
    return [];
  }
}

// Add a comment to a poll
export async function dbAddPollComment(
  pollId: string, 
  userId: string, 
  authorName: string, 
  authorAvatar: string | undefined, 
  content: string, 
  parentId: string | null = null
): Promise<PollComment | null> {
  const newComment: PollComment = {
    id: `comm_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    poll_id: pollId,
    user_id: userId,
    author_name: authorName,
    author_avatar: authorAvatar,
    content,
    parent_id: parentId,
    likes_count: 0,
    reported: false,
    pinned: false,
    hidden: false,
    created_at: new Date().toISOString(),
    replies: []
  };

  const localSave = () => {
    try {
      const commentsJson = localStorage.getItem('dhoke_connect_poll_comments') || '[]';
      const allComments = JSON.parse(commentsJson);
      allComments.push(newComment);
      localStorage.setItem('dhoke_connect_poll_comments', JSON.stringify(allComments));
      return newComment;
    } catch {
      return null;
    }
  };

  if (!isSupabaseConfigured || !supabase) {
    return localSave();
  }

  try {
    const { data, error } = await supabase
      .from('poll_comments')
      .insert({
        poll_id: pollId,
        user_id: userId,
        author_name: authorName,
        author_avatar: authorAvatar || null,
        content,
        parent_id: parentId
      })
      .select('*')
      .single();

    if (error) throw error;

    return {
      id: data.id,
      poll_id: data.poll_id,
      user_id: data.user_id,
      author_name: data.author_name,
      author_avatar: data.author_avatar || undefined,
      content: data.content,
      parent_id: data.parent_id,
      likes_count: data.likes_count || 0,
      reported: data.reported ?? false,
      pinned: data.pinned ?? false,
      hidden: data.hidden ?? false,
      created_at: data.created_at,
      replies: []
    };
  } catch (err) {
    console.error("Error adding poll comment:", err);
    return localSave();
  }
}

// Like a comment, using comment_likes relational tables to prevent duplicate likes
export async function dbLikePollComment(commentId: string, userId: string): Promise<boolean> {
  const localSave = () => {
    try {
      const likesJson = localStorage.getItem('dhoke_connect_poll_comment_likes') || '[]';
      const likes: PollCommentLike[] = JSON.parse(likesJson);
      
      const exists = likes.some(l => l.comment_id === commentId && l.user_id === userId);
      const commentsJson = localStorage.getItem('dhoke_connect_poll_comments') || '[]';
      const allComments: PollComment[] = JSON.parse(commentsJson);
      
      const commentIdx = allComments.findIndex(c => c.id === commentId);
      if (commentIdx < 0) return false;

      if (exists) {
        // Unlike
        const filteredLikes = likes.filter(l => !(l.comment_id === commentId && l.user_id === userId));
        localStorage.setItem('dhoke_connect_poll_comment_likes', JSON.stringify(filteredLikes));
        allComments[commentIdx].likes_count = Math.max(0, (allComments[commentIdx].likes_count || 1) - 1);
      } else {
        // Like
        likes.push({ comment_id: commentId, user_id: userId });
        localStorage.setItem('dhoke_connect_poll_comment_likes', JSON.stringify(likes));
        allComments[commentIdx].likes_count = (allComments[commentIdx].likes_count || 0) + 1;
      }
      localStorage.setItem('dhoke_connect_poll_comments', JSON.stringify(allComments));
      return true;
    } catch {
      return false;
    }
  };

  if (!isSupabaseConfigured || !supabase) {
    return localSave();
  }

  try {
    // Check if like exists
    const { data: existingLike } = await supabase
      .from('poll_comment_likes')
      .select('*')
      .eq('comment_id', commentId)
      .eq('user_id', userId)
      .maybeSingle();

    if (existingLike) {
      // Remove Like (Unlike)
      await supabase.from('poll_comment_likes').delete().eq('comment_id', commentId).eq('user_id', userId);
      const { data } = await supabase.from('poll_comments').select('likes_count').eq('id', commentId).single();
      await supabase.from('poll_comments').update({ likes_count: Math.max(0, (data?.likes_count || 1) - 1) }).eq('id', commentId);
    } else {
      // Add Like
      await supabase.from('poll_comment_likes').insert({ comment_id: commentId, user_id: userId });
      const { data } = await supabase.from('poll_comments').select('likes_count').eq('id', commentId).single();
      await supabase.from('poll_comments').update({ likes_count: (data?.likes_count || 0) + 1 }).eq('id', commentId);
    }
    return true;
  } catch (err) {
    console.error("Error liking comment:", err);
    return localSave();
  }
}

// Report a comment
export async function dbReportPollComment(commentId: string, reporterId: string, reason: string): Promise<boolean> {
  const localSave = () => {
    try {
      const reportsJson = localStorage.getItem('dhoke_connect_poll_comment_reports') || '[]';
      const reports = JSON.parse(reportsJson);
      reports.push({ comment_id: commentId, reporter_id: reporterId, reason, created_at: new Date().toISOString() });
      localStorage.setItem('dhoke_connect_poll_comment_reports', JSON.stringify(reports));
      
      const commentsJson = localStorage.getItem('dhoke_connect_poll_comments') || '[]';
      const allComments: PollComment[] = JSON.parse(commentsJson);
      const idx = allComments.findIndex(c => c.id === commentId);
      if (idx >= 0) {
        allComments[idx].reported = true;
        localStorage.setItem('dhoke_connect_poll_comments', JSON.stringify(allComments));
      }
      return true;
    } catch {
      return false;
    }
  };

  if (!isSupabaseConfigured || !supabase) {
    return localSave();
  }

  try {
    await supabase.from('poll_comment_reports').upsert({ comment_id: commentId, reporter_id: reporterId, reason });
    await supabase.from('poll_comments').update({ reported: true }).eq('id', commentId);
    return true;
  } catch (err) {
    console.error("Error reporting comment:", err);
    return localSave();
  }
}

// Pin a comment
export async function dbPinPollComment(commentId: string, pin: boolean): Promise<boolean> {
  const localSave = () => {
    try {
      const commentsJson = localStorage.getItem('dhoke_connect_poll_comments') || '[]';
      const allComments: PollComment[] = JSON.parse(commentsJson);
      const idx = allComments.findIndex(c => c.id === commentId);
      if (idx >= 0) {
        allComments[idx].pinned = pin;
        localStorage.setItem('dhoke_connect_poll_comments', JSON.stringify(allComments));
      }
      return true;
    } catch {
      return false;
    }
  };

  if (!isSupabaseConfigured || !supabase) {
    return localSave();
  }

  try {
    await supabase.from('poll_comments').update({ pinned: pin }).eq('id', commentId);
    return true;
  } catch (err) {
    console.error("Pin comment error:", err);
    return localSave();
  }
}

// Delete a comment
export async function dbDeletePollComment(commentId: string): Promise<boolean> {
  const localSave = () => {
    try {
      const commentsJson = localStorage.getItem('dhoke_connect_poll_comments') || '[]';
      const allComments: PollComment[] = JSON.parse(commentsJson);
      const filtered = allComments.filter(c => c.id !== commentId && c.parent_id !== commentId);
      localStorage.setItem('dhoke_connect_poll_comments', JSON.stringify(filtered));
      return true;
    } catch {
      return false;
    }
  };

  if (!isSupabaseConfigured || !supabase) {
    return localSave();
  }

  try {
    await supabase.from('poll_comments').delete().eq('id', commentId);
    return true;
  } catch (err) {
    console.error("Delete comment error:", err);
    return localSave();
  }
}

// Hide a comment
export async function dbHidePollComment(commentId: string, hide: boolean): Promise<boolean> {
  const localSave = () => {
    try {
      const commentsJson = localStorage.getItem('dhoke_connect_poll_comments') || '[]';
      const allComments: PollComment[] = JSON.parse(commentsJson);
      const idx = allComments.findIndex(c => c.id === commentId);
      if (idx >= 0) {
        allComments[idx].hidden = hide;
        localStorage.setItem('dhoke_connect_poll_comments', JSON.stringify(allComments));
      }
      return true;
    } catch {
      return false;
    }
  };

  if (!isSupabaseConfigured || !supabase) {
    return localSave();
  }

  try {
    await supabase.from('poll_comments').update({ hidden: hide }).eq('id', commentId);
    return true;
  } catch (err) {
    console.error("Hide comment error:", err);
    return localSave();
  }
}

// Fetch all votes snapshot records of a poll for Advanced Analytics
export async function dbGetPollVotesAnalytics(pollId: string): Promise<PollVote[]> {
  if (!isSupabaseConfigured || !supabase) {
    try {
      const votesJson = localStorage.getItem('dhoke_connect_poll_votes') || '[]';
      const allVotes: PollVote[] = JSON.parse(votesJson);
      const filtered = allVotes.filter(v => v.poll_id === pollId);
      
      const localProfileJson = localStorage.getItem('dh_user_profile_data');
      let localProfile: User | null = null;
      if (localProfileJson) {
        localProfile = JSON.parse(localProfileJson);
      }
      
      return filtered.map(v => {
        if (localProfile && v.user_id === localProfile.id) {
          return {
            ...v,
            gender: localProfile.gender || 'Prefer not to say',
            date_of_birth_snapshot: localProfile.dateOfBirth,
            area: localProfile.area || 'Unknown Area'
          };
        }
        return {
          ...v,
          gender: v.gender || 'Prefer not to say',
          area: v.area || 'Unknown Area'
        };
      });
    } catch {
      return [];
    }
  }

  try {
    const { data, error } = await supabase
      .from('poll_votes')
      .select('*, profiles:user_id(gender, date_of_birth, area)')
      .eq('poll_id', pollId);
    if (error) throw error;
    
    return (data || []).map((d: any) => ({
      poll_id: d.poll_id,
      user_id: d.user_id,
      option_id: d.option_id,
      gender: d.profiles?.gender || d.gender || 'Prefer not to say',
      date_of_birth_snapshot: d.profiles?.date_of_birth || d.date_of_birth_snapshot,
      area: d.profiles?.area || d.area || 'Unknown Area',
      location_details: d.location_details,
      device: d.device,
      created_at: d.created_at
    }));
  } catch (err) {
    console.warn("Supabase poll_votes query failed. Falling back to local storage:", err);
    try {
      const votesJson = localStorage.getItem('dhoke_connect_poll_votes') || '[]';
      const allVotes: PollVote[] = JSON.parse(votesJson);
      const filtered = allVotes.filter(v => v.poll_id === pollId);
      
      const localProfileJson = localStorage.getItem('dh_user_profile_data');
      let localProfile: User | null = null;
      if (localProfileJson) {
        localProfile = JSON.parse(localProfileJson);
      }
      
      return filtered.map(v => {
        if (localProfile && v.user_id === localProfile.id) {
          return {
            ...v,
            gender: localProfile.gender || 'Prefer not to say',
            date_of_birth_snapshot: localProfile.dateOfBirth,
            area: localProfile.area || 'Unknown Area'
          };
        }
        return {
          ...v,
          gender: v.gender || 'Prefer not to say',
          area: v.area || 'Unknown Area'
        };
      });
    } catch {
      return [];
    }
  }
}

// Fetch all view records of a poll for Advanced Analytics
export async function dbGetPollViewsAnalytics(pollId: string): Promise<PollView[]> {
  if (!isSupabaseConfigured || !supabase) {
    try {
      const viewsJson = localStorage.getItem('dhoke_connect_poll_views') || '[]';
      const allViews: PollView[] = JSON.parse(viewsJson);
      return allViews.filter(v => v.poll_id === pollId);
    } catch {
      return [];
    }
  }

  try {
    const { data, error } = await supabase
      .from('poll_views')
      .select('*')
      .eq('poll_id', pollId);
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.warn("Supabase poll_views query failed. Falling back to local storage:", err);
    try {
      const viewsJson = localStorage.getItem('dhoke_connect_poll_views') || '[]';
      const allViews: PollView[] = JSON.parse(viewsJson);
      return allViews.filter(v => v.poll_id === pollId);
    } catch {
      return [];
    }
  }
}

// Fetch all share records of a poll for Advanced Analytics
export async function dbGetPollSharesAnalytics(pollId: string): Promise<PollShare[]> {
  if (!isSupabaseConfigured || !supabase) {
    try {
      const sharesJson = localStorage.getItem('dhoke_connect_poll_shares') || '[]';
      const allShares: PollShare[] = JSON.parse(sharesJson);
      return allShares.filter(s => s.poll_id === pollId);
    } catch {
      return [];
    }
  }

  try {
    const { data, error } = await supabase
      .from('poll_shares')
      .select('*')
      .eq('poll_id', pollId);
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.warn("Supabase poll_shares query failed. Falling back to local storage:", err);
    try {
      const sharesJson = localStorage.getItem('dhoke_connect_poll_shares') || '[]';
      const allShares: PollShare[] = JSON.parse(sharesJson);
      return allShares.filter(s => s.poll_id === pollId);
    } catch {
      return [];
    }
  }
}


/**
 * ============================================================================
 * 17. PROMOTIONS SERVICE (SEARCH / PROMOTIONS MODULE)
 * ============================================================================
 */


/**
 * ============================================================================
 * 17. PROMOTIONS SERVICE (SEARCH / PROMOTIONS MODULE)
 * ============================================================================
 */

export async function dbGetPromotions(fallback: any[]): Promise<any[]> {
  return safeDbCall(async () => {
    const { data, error } = await supabase!
      .from('promotions')
      .select('*');
    return { data, error };
  }, fallback);
}

export async function dbSavePromotion(promo: any): Promise<boolean> {
  const payload = {
    id: promo.id,
    title: promo.title,
    sponsor: promo.businessName || 'Unknown Sponsor',
    description: promo.description,
    discount: promo.discountCode ? 'Discount' : null,
    code: promo.discountCode,
    image: promo.image,
    expiry: promo.postedTime,
    clicks: 0
  };
  return safeWrite('promotions', payload);
}

/**
 * Formats a local mobile number to E.164 standard (e.g. +923001234567)
 */
export function formatPhoneForSupabase(mobile: string): string {
  const digits = mobile.replace(/\D/g, '');
  if (digits.startsWith('92') && digits.length === 12) {
    return `+${digits}`;
  }
  if (digits.startsWith('0') && digits.length === 11) {
    return `+92${digits?.slice(1)}`;
  }
  if (digits.length === 10) {
    return `+92${digits}`;
  }
  if (mobile.startsWith('+')) {
    return mobile;
  }
  return `+${digits}`;
}

export async function dbDeleteConversation(currentUserId: string, conversationId: string): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) {
    console.log("[DELETE FLOW] Supabase not configured in dbDeleteConversation");
    return false;
  }
  console.log(`[DELETE FLOW] Attempting to delete conversation. user_id: ${currentUserId}, conversation_id: ${conversationId}`);
  try {
    const { error, status } = await supabase
      .from('conversations')
      .delete()
      .eq('id', conversationId);
    if (error) {
      console.error("[DELETE FLOW] dbDeleteConversation failed:", error);
      return false;
    }
    console.log(`[DELETE FLOW] dbDeleteConversation success. Status: ${status}`);
    return true;
  } catch (err) {
    console.error("[DELETE FLOW] Exception in dbDeleteConversation:", err);
    return false;
  }
}

export async function dbClearAllConversations(currentUserId: string): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) {
    console.log("[DELETE FLOW] Supabase not configured in dbClearAllConversations");
    return false;
  }
  console.log(`[DELETE FLOW] Attempting to clear all conversations for user: ${currentUserId}`);
  try {
    // 1. Get all conversation IDs where currentUserId is a member
    const { data: memberOf, error: memberError } = await supabase
      .from('conversation_members')
      .select('conversation_id')
      .eq('user_id', currentUserId);
      
    if (memberError || !memberOf) {
      console.error("[DELETE FLOW] dbClearAllConversations failed to get user conversations:", memberError);
      return false;
    }
    
    const conversationIds = memberOf.map(m => m.conversation_id);
    if (conversationIds.length === 0) {
      console.log("[DELETE FLOW] No conversations found to clear.");
      return true;
    }
    
    // 2. Delete these conversations
    const { error, status } = await supabase
      .from('conversations')
      .delete()
      .in('id', conversationIds);
      
    if (error) {
      console.error("[DELETE FLOW] dbClearAllConversations failed to delete conversations:", error);
      return false;
    }
    console.log(`[DELETE FLOW] dbClearAllConversations success. Status: ${status}`);
    return true;
  } catch (err) {
    console.error("[DELETE FLOW] Exception in dbClearAllConversations:", err);
    return false;
  }
}

/**
 * ============================================================================
 * 20. ADS MANAGEMENT SERVICE
 * ============================================================================
 */

export async function dbGetAds(fallback: AdItem[]): Promise<AdItem[]> {
  if (!isSupabaseConfigured || !supabase) return fallback;
  const { data: rawData, error: rawError } = await supabase
    .from('ads')
    .select('*')
    .order('created_at', { ascending: false });

  if (rawError) {
    throw rawError;
  }
  
  console.log("[DEBUG] Raw rows returned from Supabase ads table:", rawData?.length, rawData);
  
  const filteredData = rawData?.filter(ad => ad.deleted_at === null) || [];
  console.log("[DEBUG] Filtered rows (excluding soft-deleted):", filteredData.length, filteredData);

  return filteredData.length > 0 ? filteredData : fallback;
}

export async function dbSaveAd(ad: AdItem, isNew: boolean): Promise<AdItem> {
  const payload = {
    ...ad,
    updated_at: new Date().toISOString()
  };

  if (!isSupabaseConfigured || !supabase) {
    try {
      const adsJson = localStorage.getItem('dhoke_connect_ads');
      let adsList: AdItem[] = [];
      if (adsJson) {
        adsList = JSON.parse(adsJson);
      }
      const exists = adsList.some(a => a.id === ad.id);
      if (exists) {
        adsList = adsList.map(a => a.id === ad.id ? payload : a);
      } else {
        adsList = [payload, ...adsList];
      }
      localStorage.setItem('dhoke_connect_ads', JSON.stringify(adsList));
    } catch (e) {
      console.error("Local storage save ad error:", e);
    }
    return payload;
  }

  if (isNew) {
    const { id, ...insertPayload } = payload;
    const { data, error } = await supabase
      .from('ads')
      .insert(insertPayload)
      .select()
      .single();
    if (error) {
      throw error;
    }
    
    try {
      const adsJson = localStorage.getItem('dhoke_connect_ads');
      let adsList: AdItem[] = [];
      if (adsJson) {
        adsList = JSON.parse(adsJson);
      }
      adsList = [data, ...adsList];
      localStorage.setItem('dhoke_connect_ads', JSON.stringify(adsList));
    } catch (e) {
      console.error("Local storage sync error on insert:", e);
    }
    
    return data;
  } else {
    const { error } = await supabase
      .from('ads')
      .upsert(payload, { onConflict: 'id' });
    if (error) {
      throw error;
    }
    
    try {
      const adsJson = localStorage.getItem('dhoke_connect_ads');
      let adsList: AdItem[] = [];
      if (adsJson) {
        adsList = JSON.parse(adsJson);
      }
      adsList = adsList.map(a => a.id === ad.id ? payload : a);
      localStorage.setItem('dhoke_connect_ads', JSON.stringify(adsList));
    } catch (e) {
      console.error("Local storage sync error on update:", e);
    }
    
    return payload;
  }
}

export async function dbRunAdsMigration(): Promise<{ success: boolean; error: string | null }> {
  if (!isSupabaseConfigured || !supabase) {
    return { success: true, error: null };
  }
  const sql = `
CREATE TABLE IF NOT EXISTS public.ads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    advertiser_name TEXT NOT NULL,
    advertiser_phone TEXT NOT NULL,
    advertiser_email TEXT NOT NULL,
    advertiser_business_id TEXT,
    banner_url TEXT,
    video_url TEXT,
    placement TEXT NOT NULL,
    category TEXT NOT NULL,
    cta_type TEXT NOT NULL,
    cta_link TEXT,
    target_audience TEXT,
    target_location TEXT,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    priority TEXT NOT NULL DEFAULT 'Normal',
    status TEXT NOT NULL DEFAULT 'Draft',
    amount NUMERIC DEFAULT 0,
    payment_status TEXT NOT NULL DEFAULT 'Pending',
    invoice_number TEXT,
    impressions INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    conversions INTEGER DEFAULT 0,
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE,
    images JSONB DEFAULT '[]'::jsonb
);

-- Add new columns for Premium Popup Ads safely if the table already exists
DO $$ 
BEGIN
    BEGIN
        ALTER TABLE public.ads ADD COLUMN format TEXT DEFAULT 'Feed';
    EXCEPTION
        WHEN duplicate_column THEN null;
    END;
    BEGIN
        ALTER TABLE public.ads ADD COLUMN display_frequency INTEGER DEFAULT 20;
    EXCEPTION
        WHEN duplicate_column THEN null;
    END;
END $$;

CREATE INDEX IF NOT EXISTS ads_status_idx ON public.ads (status);
CREATE INDEX IF NOT EXISTS ads_placement_idx ON public.ads (placement);
CREATE INDEX IF NOT EXISTS ads_category_idx ON public.ads (category);
CREATE INDEX IF NOT EXISTS ads_start_date_idx ON public.ads (start_date);
CREATE INDEX IF NOT EXISTS ads_end_date_idx ON public.ads (end_date);
ALTER TABLE public.ads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read-only access to ads" ON public.ads FOR SELECT USING (deleted_at IS NULL);
CREATE POLICY "Allow anyone to manage ads" ON public.ads FOR ALL USING (true) WITH CHECK (true);
`;
  try {
    const { error } = await supabase.rpc('exec_sql', { sql_query: sql });
    if (error) {
      console.warn("SQL Migration execution via RPC failed:", error.message);
      return { success: false, error: error.message };
    }
    return { success: true, error: null };
  } catch (err: any) {
    console.warn("SQL Migration exception:", err);
    return { success: false, error: err.message || String(err) };
  }
}

export async function dbDeleteAd(adId: string): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) {
    // Local fallback soft delete
    try {
      const adsJson = localStorage.getItem('dhoke_connect_ads');
      if (adsJson) {
        const adsList: AdItem[] = JSON.parse(adsJson);
        const updated = adsList.map(a => a.id === adId ? { ...a, deleted_at: new Date().toISOString() } : a);
        localStorage.setItem('dhoke_connect_ads', JSON.stringify(updated));
        return true;
      }
    } catch (e) {
      console.error("Local storage delete ad error:", e);
    }
    return false;
  }

  try {
    const { error } = await supabase
      .from('ads')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', adId);
      
    if (error) {
      console.error("Supabase error soft-deleting ad:", error);
      return false;
    }
    
    return true;
  } catch (err) {
    console.error("Error soft-deleting ad:", err);
    return false;
  }
}

export async function dbUploadAdBanner(file: File, filename: string): Promise<string> {
  if (isSupabaseConfigured && supabase) {
    try {
      const fileExt = file.name?.split('.').pop();
      const cleanPath = `${Date.now()}_${filename.replace(/[^a-zA-Z0-9]/g, '_')}.${fileExt}`;
      const { data, error } = await supabase.storage
        .from('ads-banners')
        .upload(cleanPath, file, { cacheControl: '3600', upsert: true });
      
      if (!error && data) {
        const { data: publicUrlData } = supabase.storage
          .from('ads-banners')
          .getPublicUrl(cleanPath);
        if (publicUrlData?.publicUrl) {
          return publicUrlData.publicUrl;
        }
      }
      console.warn("Supabase upload returned error, falling back to base64 encoding:", error);
    } catch (err) {
      console.warn("Exception during Supabase upload, falling back to base64 encoding:", err);
    }
  }

  // Local fallback: convert to base64 DataURL
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Local file reading failed"));
    reader.readAsDataURL(file);
  });
}

export async function dbGetActiveAds(placement: AdItem['placement']): Promise<AdItem[]> {
  if (!isSupabaseConfigured || !supabase) {
    try {
      const adsJson = localStorage.getItem('dhoke_connect_ads');
      if (adsJson) {
        const adsList: AdItem[] = JSON.parse(adsJson);
        const now = new Date();
        return adsList.filter(ad => 
          ad.placement === placement &&
          ad.status === 'Active' &&
          new Date(ad.start_date) <= now &&
          new Date(ad.end_date) >= now &&
          !ad.deleted_at
        );
      }
    } catch (e) {
      console.error("Local storage get active ads error:", e);
    }
    return [];
  }

  try {
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('ads')
      .select('*')
      .eq('placement', placement)
      .eq('status', 'Active')
      .lte('start_date', now)
      .gte('end_date', now)
      .is('deleted_at', null);

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error(`Error fetching active ads for placement ${placement}:`, err);
    return [];
  }
}

let hasViewsAndCtrColumns: boolean | null = null;

async function checkColumnsAvailability(): Promise<boolean> {
  if (hasViewsAndCtrColumns !== null) return hasViewsAndCtrColumns;
  if (!isSupabaseConfigured || !supabase) {
    hasViewsAndCtrColumns = false;
    return false;
  }
  try {
    const { error } = await supabase.from('ads').select('views, ctr').limit(1);
    if (!error) {
      hasViewsAndCtrColumns = true;
    } else {
      hasViewsAndCtrColumns = false;
      console.warn("[Supabase] Views/CTR columns missing. Falling back to safe query style.", error.message);
    }
  } catch {
    hasViewsAndCtrColumns = false;
  }
  return hasViewsAndCtrColumns;
}

export async function dbTrackAdImpression(adId: string): Promise<void> {
  let newImp = 1;
  let currentClicks = 0;
  let currentViews = 0;

  try {
    const adsJson = localStorage.getItem('dhoke_connect_ads');
    if (adsJson) {
      const adsList: AdItem[] = JSON.parse(adsJson);
      const updated = adsList.map(a => {
        if (a.id === adId) {
          newImp = (a.impressions || 0) + 1;
          currentClicks = a.clicks || 0;
          currentViews = a.views || 0;
          const ctr = newImp > 0 ? (currentClicks / newImp) * 100 : 0;
          return { ...a, impressions: newImp, ctr };
        }
        return a;
      });
      localStorage.setItem('dhoke_connect_ads', JSON.stringify(updated));
    }
  } catch (e) {
    console.error("Local storage error in dbTrackAdImpression:", e);
  }

  if (!isSupabaseConfigured || !supabase) return;

  try {
    const isColumnAvailable = await checkColumnsAvailability();
    const selectFields = isColumnAvailable ? 'impressions, clicks, views' : 'impressions, clicks';
    const { data, error: selectError } = await supabase.from('ads').select(selectFields).eq('id', adId).single() as any;
    
    if (!selectError && data) {
      newImp = (data.impressions || 0) + 1;
      currentClicks = data.clicks || 0;
      
      if (isColumnAvailable) {
        const ctr = newImp > 0 ? (currentClicks / newImp) * 100 : 0;
        await supabase.from('ads').update({ impressions: newImp, ctr }).eq('id', adId);
      } else {
        await supabase.from('ads').update({ impressions: newImp }).eq('id', adId);
      }
    }
  } catch (err) {
    console.error("Error tracking ad impression:", err);
  }
}

export async function dbTrackAdView(adId: string): Promise<void> {
  let newViews = 1;

  try {
    const adsJson = localStorage.getItem('dhoke_connect_ads');
    if (adsJson) {
      const adsList: AdItem[] = JSON.parse(adsJson);
      const updated = adsList.map(a => {
        if (a.id === adId) {
          newViews = (a.views || 0) + 1;
          return { ...a, views: newViews };
        }
        return a;
      });
      localStorage.setItem('dhoke_connect_ads', JSON.stringify(updated));
    }
  } catch (e) {
    console.error("Local storage error in dbTrackAdView:", e);
  }

  if (!isSupabaseConfigured || !supabase) return;

  try {
    const isColumnAvailable = await checkColumnsAvailability();
    if (!isColumnAvailable) return; // Ignore views DB write if column is missing
    
    const { data, error: selectError } = await supabase.from('ads').select('views').eq('id', adId).single();
    if (!selectError && data) {
      newViews = (data.views || 0) + 1;
      await supabase.from('ads').update({ views: newViews }).eq('id', adId);
    }
  } catch (err) {
    console.error("Error tracking ad view:", err);
  }
}

export async function dbTrackAdClick(adId: string): Promise<void> {
  let newClicks = 1;
  let currentImps = 1;

  try {
    const adsJson = localStorage.getItem('dhoke_connect_ads');
    if (adsJson) {
      const adsList: AdItem[] = JSON.parse(adsJson);
      const updated = adsList.map(a => {
        if (a.id === adId) {
          newClicks = (a.clicks || 0) + 1;
          currentImps = a.impressions || 1;
          const conversions = (a.conversions || 0) + 1;
          const ctr = currentImps > 0 ? (newClicks / currentImps) * 100 : 0;
          return { ...a, clicks: newClicks, conversions, ctr };
        }
        return a;
      });
      localStorage.setItem('dhoke_connect_ads', JSON.stringify(updated));
    }
  } catch (e) {
    console.error("Local storage error in dbTrackAdClick:", e);
  }

  if (!isSupabaseConfigured || !supabase) return;

  try {
    const isColumnAvailable = await checkColumnsAvailability();
    const selectFields = isColumnAvailable ? 'impressions, clicks, conversions' : 'impressions, clicks, conversions';
    const { data, error: selectError } = await supabase.from('ads').select(selectFields).eq('id', adId).single();
    
    if (!selectError && data) {
      newClicks = (data.clicks || 0) + 1;
      currentImps = data.impressions || 1;
      const newConversions = (data.conversions || 0) + 1;
      
      if (isColumnAvailable) {
        const ctr = currentImps > 0 ? (newClicks / currentImps) * 100 : 0;
        await supabase.from('ads').update({ clicks: newClicks, conversions: newConversions, ctr }).eq('id', adId);
      } else {
        await supabase.from('ads').update({ clicks: newClicks, conversions: newConversions }).eq('id', adId);
      }
    }
  } catch (err) {
    console.error("Error tracking ad click:", err);
  }
}



// ==========================================
// ==========================================
// PAGES & GROUPS (Facebook Style) - API
// ==========================================

export const dbGetPages = async (): Promise<any[]> => {
  if (!isSupabaseConfigured) {
    const raw = localStorage.getItem('dhoke_pages');
    return raw ? JSON.parse(raw) : [];
  }
  const { data, error } = await supabase.from('pages').select('*').order('created_at', { ascending: false });
  if (error) {
    if (error.message?.includes('schema cache') || error.code === '42P01' || error.message?.includes('does not exist')) {
      console.warn('Pages table not found. Falling back to local storage.');
      const raw = localStorage.getItem('dhoke_pages');
      return raw ? JSON.parse(raw) : [];
    }
    console.error('Error fetching pages:', error);
    return [];
  }
  return data || [];
};
// ---------------------------------------------------------------------------
// User Search and Social Groups services (used by MentionTextarea)
// ---------------------------------------------------------------------------

/**
 * Get page IDs that a user follows.
 * Returns an array of page ID strings.
 */
export async function dbGetUserFollowedPages(userId: string): Promise<string[]> {
  if (!userId) return [];

  // Local fallback
  if (!isSupabaseConfigured || !supabase) {
    try {
      const pages = await dbGetPages();
      return pages
        .filter(p => {
          const key = `dhoke_page_follow_${p.id}_${userId}`;
          return localStorage.getItem(key) === 'true';
        })
        .map(p => p.id);
    } catch {
      return [];
    }
  }

  try {
    const { data, error } = await supabase
      .from('page_roles')
      .select('page_id')
      .eq('user_id', userId)
      .eq('role', 'Follower');
    if (error) {
      console.warn('Error fetching followed pages:', error);
      return [];
    }
    return (data || []).map((row: any) => row.page_id);
  } catch (err) {
    console.warn('Exception in dbGetUserFollowedPages:', err);
    return [];
  }
}


/**
 * Search users by a query string.
 * Supports searching by full name and username (case‑insensitive).
 * Returns an array of User objects compatible with the existing type.
 */
export async function dbSearchUsers(searchQuery: string): Promise<User[]> {
  // Local fallback when Supabase is not configured
  if (!isSupabaseConfigured) {
    const raw = localStorage.getItem('dhoke_profiles') || '[]';
    const allUsers: User[] = JSON.parse(raw);
    const lower = searchQuery?.toLowerCase();
    return allUsers.filter(u =>
      (u.fullName && u.fullName?.toLowerCase().includes(lower)) ||
      (u.username && u.username?.toLowerCase().includes(lower))
    );
  }

  try {
    // Escape double quotes and backslashes for PostgREST .or() syntax
    const escapedQuery = searchQuery.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    
    // Use ilike for case-insensitive partial matching on both columns, wrapping values in double quotes
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .or(`full_name.ilike."%${escapedQuery}%",username.ilike."%${escapedQuery}%"`);
    if (error) {
      console.warn('Error searching users:', error);
      return [];
    }
    
    // Map snake_case columns back to User properties for frontend compatibility
    return (data || []).map(row => ({
      id: row.user_id,
      fullName: row.full_name || '',
      email: row.email || '',
      area: row.area || 'Dhoke Hassu',
      profilePhoto: row.profile_photo || undefined,
      mobileNumber: row.mobileNumber || undefined,
      username: row.username || undefined,
      bio: row.bio || undefined,
      joinDate: row.joinDate || undefined,
      reputationScore: row.reputationScore ?? 100,
      verified: !!row.verified,
      coverPhoto: row.coverPhoto || row.socialLinks?.coverPhoto || undefined,
      contactNumber: row.contactNumber || undefined,
      socialLinks: row.socialLinks || {},
      badges: row.badges || [],
      gender: row.gender || row.socialLinks?.gender || undefined,
      dateOfBirth: row.date_of_birth || row.socialLinks?.dateOfBirth || undefined,
      provinceId: row.province_id || undefined,
      cityId: row.city_id || undefined,
      areaId: row.area_id || undefined,
      latitude: row.latitude || undefined,
      longitude: row.longitude || undefined
    })) as User[];
  } catch (err) {
    console.warn('Exception in dbSearchUsers:', err);
    return [];
  }
}

/**
 * Fetch social groups for the mention dropdown.
 * This implementation reuses the advanced groups fetch (dbGetGroupsAdvanced).
 * It returns an array of Group objects (type imported from ../types).
 */
export const dbGetSocialGroups = async (): Promise<Group[]> => {
  // Reuse the advanced groups function – it already handles local fallback.
  const groups = await dbGetGroupsAdvanced();
  // The advanced API returns generic objects; we cast to Group for compatibility.
  return groups as unknown as Group[];
};

export const dbCreatePage = async (pageData: any): Promise<any> => {
  if (!isSupabaseConfigured) {
    const pages = await dbGetPages();
    let currentSlug = pageData.slug;
    let counter = 1;
    while (pages.some(p => p.slug === currentSlug)) {
      currentSlug = `${pageData.slug}-${counter}`;
      counter++;
    }
    
    const newPage = {
      id: Math.random().toString(36)?.substring(2, 15),
      ...pageData,
      slug: currentSlug,
      followers_count: 0,
      created_at: new Date().toISOString()
    };
    localStorage.setItem('dhoke_pages', JSON.stringify([newPage, ...pages]));
    return newPage;
  }

  const { data, error } = await supabase.from('pages').insert(pageData).select().single();
  let finalData = data;
  if (error) {
    if (error.code === '23505') {
      let counter = 1;
      let newSlug = `${pageData.slug}-${counter}`;
      let retryError = error;
      let retryData = null;
      while (retryError && retryError.code === '23505' && counter < 50) {
        newSlug = `${pageData.slug}-${counter}`;
        const retryRes = await supabase.from('pages').insert({ ...pageData, slug: newSlug }).select().single();
        retryError = retryRes.error;
        retryData = retryRes.data;
        counter++;
      }
      if (retryError) {
        console.error('Failed to create page after multiple retries due to slug conflicts.');
        return null;
      }
      finalData = retryData;
    } else {
      console.error('Error creating page:', error);
      return null;
    }
  }
  
  // Assign Owner role
  if (finalData?.id && finalData?.owner_id) {
    const { error: roleError } = await supabase.from('page_roles').insert({
      page_id: finalData.id,
      user_id: finalData.owner_id,
      role: 'Owner'
    });
    if (roleError) console.error('Error assigning page owner role:', roleError);
  }
  
  return finalData;
};

export async function dbUploadPageImage(file: File): Promise<string | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  try {
    const fileExt = file.name?.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36)?.substring(2, 9)}.${fileExt}`;
    const filePath = `${fileName}`;

    let bucketName = 'pages';
    let uploadRes = await supabase.storage.from(bucketName).upload(filePath, file, { cacheControl: '3600', upsert: false });

    if (uploadRes.error) {
      console.warn(`Upload to '${bucketName}' bucket failed:`, uploadRes.error);
      bucketName = 'posts';
      uploadRes = await supabase.storage.from(bucketName).upload(filePath, file, { cacheControl: '3600', upsert: false });
      
      if (uploadRes.error) {
         console.warn(`Upload to '${bucketName}' bucket failed:`, uploadRes.error);
         bucketName = 'ads-banners';
         uploadRes = await supabase.storage.from(bucketName).upload(filePath, file, { cacheControl: '3600', upsert: false });
      }
    }

    if (uploadRes.error) {
      console.error('All bucket uploads failed:', uploadRes.error);
      return null;
    }

    const { data } = supabase.storage.from(bucketName).getPublicUrl(filePath);
    return data.publicUrl;
  } catch (err) {
    console.error('Exception in dbUploadPageImage:', err);
    return null;
  }
}

export const dbGetGroupsAdvanced = async (): Promise<any[]> => {
  if (!isSupabaseConfigured) {
    const raw = localStorage.getItem('dhoke_advanced_groups');
    return raw ? JSON.parse(raw) : [];
  }
  const { data, error } = await supabase.from('groups').select('*').order('created_at', { ascending: false });
  if (error) {
    console.error('Error fetching advanced groups:', error);
    return [];
  }
  return data || [];
};

export async function dbUploadGroupImage(file: File): Promise<string | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  console.log('[DEBUG] Selected file:', { name: file.name, type: file.type, size: file.size });
  try {
    const fileExt = file.name?.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36)?.substring(2, 9)}.${fileExt}`;
    const filePath = `${fileName}`;
    console.log('[DEBUG] Upload path generated:', filePath);

    let bucketName = 'groups';
    console.log(`[DEBUG] Attempting upload to bucket: ${bucketName}`);
    let uploadRes = await supabase.storage.from(bucketName).upload(filePath, file, { cacheControl: '3600', upsert: false });

    if (uploadRes.error) {
      console.warn(`[DEBUG] Upload to '${bucketName}' bucket failed:`, uploadRes.error);
      bucketName = 'posts';
      console.log(`[DEBUG] Attempting upload to fallback bucket: ${bucketName}`);
      uploadRes = await supabase.storage.from(bucketName).upload(filePath, file, { cacheControl: '3600', upsert: false });
      
      if (uploadRes.error) {
         console.warn(`[DEBUG] Upload to '${bucketName}' bucket failed:`, uploadRes.error);
         bucketName = 'ads-banners';
         console.log(`[DEBUG] Attempting upload to public fallback bucket: ${bucketName}`);
         uploadRes = await supabase.storage.from(bucketName).upload(filePath, file, { cacheControl: '3600', upsert: false });
      }
    }

    if (uploadRes.error) {
      console.error('[DEBUG] ALL storage uploads failed. Final error object:', JSON.stringify(uploadRes.error, null, 2));
      return null;
    }

    console.log('[DEBUG] Upload response successful:', uploadRes.data);
    const { data } = supabase.storage.from(bucketName).getPublicUrl(filePath);
    console.log('[DEBUG] Generated public URL:', data.publicUrl);
    return data.publicUrl;
  } catch (err) {
    console.error('[DEBUG] Exception in dbUploadGroupImage:', err);
    return null;
  }
}

export const dbCreateGroupAdvanced = async (groupData: any, ownerId?: string): Promise<any | null> => {
  if (!isSupabaseConfigured) {
    const groups = await dbGetGroupsAdvanced();
    const newGroup = {
      id: Math.random().toString(36)?.substring(2, 15),
      ...groupData,
      members_count: 1,
      created_at: new Date().toISOString()
    };
    localStorage.setItem('dhoke_advanced_groups', JSON.stringify([newGroup, ...groups]));
    return newGroup;
  }
  const payloadToInsert = { ...groupData };
  // Generate an ID if the database table is missing the default gen_random_uuid() value
  if (!payloadToInsert.id && typeof crypto !== 'undefined' && crypto.randomUUID) {
    payloadToInsert.id = crypto.randomUUID();
  }

  const { data, error } = await supabase.from('groups').insert(payloadToInsert).select().single();
  if (error) { console.error('Error creating advanced group:', error); throw error; }
  
  if (data && ownerId) {
    const { error: memberError } = await supabase.from('group_members').insert({
      group_id: data.id,
      user_id: ownerId,
      role: 'owner',
      status: 'active'
    });
    
    if (memberError) {
      console.error('Error assigning group owner:', memberError);
    }
  }
  
  return data;
};

export const dbCheckGroupMembership = async (groupId: string, userId: string): Promise<boolean> => {
  if (!isSupabaseConfigured) {
    const raw = localStorage.getItem('dhoke_group_members_' + groupId);
    if (!raw) return false;
    const members = JSON.parse(raw);
    return members.some((m: any) => m.user_id === userId);
  }
  const { data, error } = await supabase
    .from('group_members')
    .select('id')
    .eq('group_id', groupId)
    .eq('user_id', userId)
    .maybeSingle();
  if (error && error.code !== 'PGRST116') {
    console.error('Error checking group membership:', error);
    return false;
  }
  return !!data;
};

export const dbJoinGroup = async (groupId: string, userId: string): Promise<boolean> => {
  if (!isSupabaseConfigured) {
    const key = 'dhoke_group_members_' + groupId;
    const raw = localStorage.getItem(key);
    const members = raw ? JSON.parse(raw) : [];
    if (!members.some((m: any) => m.user_id === userId)) {
      members.push({ group_id: groupId, user_id: userId, role: 'member', status: 'active' });
      localStorage.setItem(key, JSON.stringify(members));
    }
    return true;
  }
  const { error } = await supabase.from('group_members').insert({
    group_id: groupId,
    user_id: userId,
    role: 'member',
    status: 'active'
  });
  if (error) {
    console.error('Error joining group:', error);
    return false;
  }
  return true;
};

export const dbSavePage = async (pageData: any): Promise<boolean> => {
  if (!isSupabaseConfigured) {
    const pages = await dbGetPages();
    const updatedPages = pages.map(p => p.id === pageData.id ? { ...p, ...pageData } : p);
    localStorage.setItem('dhoke_pages', JSON.stringify(updatedPages));
    return true;
  }
  const { error } = await supabase.from('pages').upsert(pageData, { onConflict: 'id' });
  if (error) {
    console.error('Error saving page:', error);
    return false;
  }
  return true;
};

export const dbDeletePage = async (id: string): Promise<boolean> => {
  if (!isSupabaseConfigured) {
    const pages = await dbGetPages();
    const updatedPages = pages.filter(p => p.id !== id);
    localStorage.setItem('dhoke_pages', JSON.stringify(updatedPages));
    return true;
  }
  const { error } = await supabase.from('pages').delete().eq('id', id);
  if (error) {
    console.error('Error deleting page:', error);
    return false;
  }
  return true;
};

export const dbGetPagePosts = async (pageId: string): Promise<any[]> => {
  if (!isSupabaseConfigured) {
    const raw = localStorage.getItem('dhoke_page_posts_' + pageId);
    return raw ? JSON.parse(raw) : [];
  }
  const { data, error } = await supabase.from('posts').select('*').eq('page_id', pageId).order('created_at', { ascending: false });
  if (error) {
    console.error('Error fetching page posts:', error);
    return [];
  }
  return data || [];
};

export const dbCreatePagePost = async (postData: any): Promise<any | null> => {
  if (!isSupabaseConfigured) {
    const posts = await dbGetPagePosts(postData.page_id);
    const newPost = {
      id: Math.random().toString(36)?.substring(2, 15),
      ...postData,
      likes_count: 0,
      comments_count: 0,
      shares_count: 0,
      created_at: new Date().toISOString()
    };
    localStorage.setItem('dhoke_page_posts_' + postData.page_id, JSON.stringify([newPost, ...posts]));
    return newPost;
  }
  const { data, error } = await supabase.from('posts').insert(postData).select().single();
  if (error) {
    console.error('Error creating page post:', error);
    return null;
  }
  return data;
};

export const dbFollowPage = async (pageId: string, userId: string): Promise<boolean> => {
  if (!isSupabaseConfigured) {
    const key = `dhoke_page_follow_${pageId}_${userId}`;
    localStorage.setItem(key, 'true');
    return true;
  }
  const { error } = await supabase.from('page_roles').insert({
    page_id: pageId,
    user_id: userId,
    role: 'Follower'
  });
  if (error && error.code !== '23505') { // ignore duplicate
    console.error('Error following page:', error);
    return false;
  }
  
  // Sync follower count
  const { data } = await supabase.from('pages').select('followers_count').eq('id', pageId).maybeSingle();
  if (data) {
    await supabase.from('pages').update({ followers_count: (data.followers_count || 0) + 1 }).eq('id', pageId);
  }
  return true;
};

export const dbUnfollowPage = async (pageId: string, userId: string): Promise<boolean> => {
  if (!isSupabaseConfigured) {
    const key = `dhoke_page_follow_${pageId}_${userId}`;
    localStorage.removeItem(key);
    return true;
  }
  const { error } = await supabase.from('page_roles').delete().match({
    page_id: pageId,
    user_id: userId,
    role: 'Follower'
  });
  if (error) {
    console.error('Error unfollowing page:', error);
    return false;
  }

  // Sync follower count
  const { data } = await supabase.from('pages').select('followers_count').eq('id', pageId).maybeSingle();
  if (data) {
    await supabase.from('pages').update({ followers_count: Math.max(0, (data.followers_count || 0) - 1) }).eq('id', pageId);
  }
  return true;
};

export const dbCheckPageFollow = async (pageId: string, userId: string): Promise<boolean> => {
  if (!isSupabaseConfigured) {
    const key = `dhoke_page_follow_${pageId}_${userId}`;
    return localStorage.getItem(key) === 'true';
  }
  const { data, error } = await supabase.from('page_roles').select('*').match({
    page_id: pageId,
    user_id: userId,
    role: 'Follower'
  }).maybeSingle();
  if (error) {
    console.error('Error checking page follow:', error);
    return false;
  }
  return !!data;
};

export const dbGetGroupPostsAdvanced = async (groupId: string): Promise<any[]> => {
  if (!isSupabaseConfigured) {
    const raw = localStorage.getItem('dhoke_group_posts_adv_' + groupId);
    return raw ? JSON.parse(raw) : [];
  }
  const { data, error } = await supabase.from('group_posts').select('*').eq('group_id', groupId).order('created_at', { ascending: false });
  if (error) {
    console.error('Error fetching advanced group posts:', error);
    return [];
  }
  return data || [];
};

export const dbCreateGroupPostAdvanced = async (postData: any): Promise<any | null> => {
  if (!isSupabaseConfigured) {
    const posts = await dbGetGroupPostsAdvanced(postData.group_id);
    const newPost = {
      id: Math.random().toString(36)?.substring(2, 15),
      ...postData,
      likes_count: 0,
      comments_count: 0,
      shares_count: 0,
      created_at: new Date().toISOString()
    };
    localStorage.setItem('dhoke_group_posts_adv_' + postData.group_id, JSON.stringify([newPost, ...posts]));
    return newPost;
  }
  const { data, error } = await supabase.from('group_posts').insert(postData).select().single();
  if (error) {
    console.error('Error creating advanced group post:', error);
    return null;
  }
  return data;
};

export interface StoryInsightView {
  viewer_id: string;
  viewed_at: string;
  profiles: {
    id: string;
    full_name: string;
    avatar_url: string;
    is_online: boolean;
  };
}

export interface StoryInsightReaction {
  reactor_id: string;
  reaction_type: string;
  created_at: string;
  profiles: {
    id: string;
    full_name: string;
    avatar_url: string;
  };
}

export interface StoryInsightReply {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
  profiles: {
    id: string;
    full_name: string;
    avatar_url: string;
  };
}

export interface StoryInsights {
  views: StoryInsightView[];
  reactions: StoryInsightReaction[];
  replies: StoryInsightReply[];
}

export async function dbGetStoryInsights(storyId: string): Promise<StoryInsights> {
  if (!supabase) return { views: [], reactions: [], replies: [] };
  try {
    // Fetch raw story interactions first
    const [viewsRes, reactionsRes, repliesRes] = await Promise.all([
      supabase.from('story_views')
        .select(`viewer_id, viewed_at`)
        .eq('story_id', storyId)
        .order('viewed_at', { ascending: false }),
      supabase.from('story_reactions')
        .select(`reactor_id, reaction_type, created_at`)
        .eq('story_id', storyId)
        .order('created_at', { ascending: false }),
      supabase.from('story_replies')
        .select(`id, sender_id, content, created_at`)
        .eq('story_id', storyId)
        .order('created_at', { ascending: false })
    ]);

    const viewsData = viewsRes.data || [];
    const reactionsData = reactionsRes.data || [];
    const repliesData = repliesRes.data || [];

    // Extract unique user IDs from all interactions to avoid N+1 queries
    const userIds = Array.from(new Set([
      ...viewsData.map((v: any) => v.viewer_id),
      ...reactionsData.map((r: any) => r.reactor_id),
      ...repliesData.map((r: any) => r.sender_id)
    ])).filter(Boolean);

    // Fetch all required profiles in one go
    let profilesMap: Record<string, any> = {};
    if (userIds.length > 0) {
      const { data: profiles, error } = await supabase.from('profiles')
        .select('user_id, full_name, profile_photo')
        .in('user_id', userIds);
      
      if (error) {
        console.error("Error fetching profiles:", error);
      }

      if (profiles) {
        profiles.forEach((p: any) => {
          profilesMap[p.user_id] = p;
        });
      }
    }

    // Format the response properly
    const views = viewsData.map((v: any) => {
      const p = profilesMap[v.viewer_id];
      console.log({
        userId: v.viewer_id,
        profile: p,
        full_name: p?.full_name
      });
      return {
        viewer_id: v.viewer_id,
        viewed_at: v.viewed_at,
        profiles: {
          id: v.viewer_id,
          full_name: p?.full_name ?? "Unknown User",
          avatar_url: p?.profile_photo ?? null,
          is_online: false
        }
      };
    }) as StoryInsightView[];

    const reactions = reactionsData.map((r: any) => {
      const p = profilesMap[r.reactor_id];
      console.log({
        userId: r.reactor_id,
        profile: p,
        full_name: p?.full_name
      });
      return {
        reactor_id: r.reactor_id,
        reaction_type: r.reaction_type,
        created_at: r.created_at,
        profiles: {
          id: r.reactor_id,
          full_name: p?.full_name ?? "Unknown User",
          avatar_url: p?.profile_photo ?? null
        }
      };
    }) as StoryInsightReaction[];

    const replies = repliesData.map((r: any) => {
      const p = profilesMap[r.sender_id];
      console.log({
        userId: r.sender_id,
        profile: p,
        full_name: p?.full_name
      });
      return {
        id: r.id,
        sender_id: r.sender_id,
        content: r.content,
        created_at: r.created_at,
        profiles: {
          id: r.sender_id,
          full_name: p?.full_name ?? "Unknown User",
          avatar_url: p?.profile_photo ?? null
        }
      };
    }) as StoryInsightReply[];

    return { views, reactions, replies };
  } catch (err) {
    console.error("Exception in dbGetStoryInsights", err);
    return { views: [], reactions: [], replies: [] };
  }
}


/**
 * ============================================================================
 * FOLLOW & PRIVACY SYSTEM
 * ============================================================================
 */

export async function dbFollowUser(followerId: string, followingId: string): Promise<{ success: boolean; status?: 'following' | 'requested' }> {
  if (!supabase) return { success: false };
  try {
    // Check if block exists
    const { data: block } = await supabase.from('user_blocks').select('id').or(`and(blocker_id.eq.${followerId},blocked_id.eq.${followingId}),and(blocker_id.eq.${followingId},blocked_id.eq.${followerId})`).maybeSingle();
    if (block) return { success: false };

    // Get following user privacy
    const { data: profile } = await supabase.from('profiles').select('privacy_type').eq('user_id', followingId).single();
    const status = profile?.privacy_type === 'private' ? 'requested' : 'following';

    const { error } = await supabase.from('followers').insert({ follower_id: followerId, following_id: followingId, status });
    if (error) throw error;
    
    // Notification logic
    const { data: existing } = await supabase.from('notifications')
      .select('id')
      .eq('user_id', followingId)
      .eq('sender_id', followerId)
      .in('type', ['new_follower', 'follow_request'])
      .maybeSingle();
      
    if (!existing) {
      if (status === 'following') {
        dbTriggerNotification(followingId, followerId, 'New Follower', 'started following you.', 'new_follower', followerId);
      } else {
        dbTriggerNotification(followingId, followerId, 'Follow Request', 'requested to follow you.', 'follow_request', followerId);
      }
    }
    
    return { success: true, status };
  } catch (err) {
    console.error('dbFollowUser Error:', err);
    return { success: false };
  }
}

export async function dbAcceptFollowRequest(followerId: string, followingId: string): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { error } = await supabase.from('followers').update({ status: 'following' }).eq('follower_id', followerId).eq('following_id', followingId);
    if (!error) {
      dbTriggerNotification(followerId, followingId, 'Request Accepted', 'accepted your follow request.', 'follow_accept', followingId);
    }
    return !error;
  } catch (err) { return false; }
}

export async function dbRejectFollowRequest(followerId: string, followingId: string): Promise<boolean> {
  return dbUnfollowUser(followerId, followingId);
}

export async function dbUnfollowUser(followerId: string, followingId: string): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { error } = await supabase.from('followers').delete().eq('follower_id', followerId).eq('following_id', followingId);
    return !error;
  } catch (err) { return false; }
}

export async function dbRemoveFollower(followerId: string, followingId: string): Promise<boolean> {
  return dbUnfollowUser(followerId, followingId); // reversed order passed from UI
}

export async function dbBlockUser(blockerId: string, blockedId: string): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { error } = await supabase.from('user_blocks').insert({ blocker_id: blockerId, blocked_id: blockedId });
    return !error;
  } catch (err) { return false; }
}

export async function dbUnblockUser(blockerId: string, blockedId: string): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { error } = await supabase.from('user_blocks').delete().eq('blocker_id', blockerId).eq('blocked_id', blockedId);
    return !error;
  } catch (err) { return false; }
}

export async function dbGetFollowStatus(viewerId: string, targetId: string): Promise<'following' | 'requested' | 'none' | 'blocked'> {
  if (!supabase) return 'none';
  if (viewerId === targetId) return 'none';
  try {
    const { data: block } = await supabase.from('user_blocks').select('id').or(`and(blocker_id.eq.${viewerId},blocked_id.eq.${targetId}),and(blocker_id.eq.${targetId},blocked_id.eq.${viewerId})`).maybeSingle();
    if (block) return 'blocked';

    const { data } = await supabase.from('followers').select('status').eq('follower_id', viewerId).eq('following_id', targetId).maybeSingle();
    return data ? (data.status as 'following' | 'requested') : 'none';
  } catch (err) { return 'none'; }
}

export async function dbGetFollowRequests(userId: string) {
  if (!supabase) return [];
  try {
    const { data } = await supabase.from('followers')
      .select(`
        id, follower_id, created_at,
        profiles!followers_follower_id_fkey(user_id, full_name, profile_photo)
      `)
      .eq('following_id', userId)
      .eq('status', 'requested');
    return data || [];
  } catch(e) { return []; }
}

// ==========================================
// FOLLOWERS & FOLLOWING LISTS
// ==========================================

export async function dbCanViewFollowLists(viewerId: string, targetId: string): Promise<boolean> {
  if (!supabase) return false;
  if (viewerId === targetId) return true;
  
  const { data: profile } = await supabase.from('profiles').select('privacy_type').eq('user_id', targetId).single();
  if (profile?.privacy_type !== 'private') return true;
  
  const status = await dbGetFollowStatus(viewerId, targetId);
  return status === 'following';
}

export async function dbGetFollowersList(userId: string, viewerId: string, search: string = '', page: number = 0, limit: number = 20) {
  if (!supabase) return { data: [], error: null, hasMore: false };
  
  const canView = await dbCanViewFollowLists(viewerId, userId);
  if (!canView) return { data: [], error: 'private', hasMore: false };
  
  try {
    let query = supabase.from('followers')
      .select('id, follower_id, created_at, profiles!followers_follower_id_fkey(user_id, full_name, profile_photo, privacy_type)')
      .eq('following_id', userId)
      .eq('status', 'following')
      .order('created_at', { ascending: false });
      
    if (search) {
      // Supabase nested ilike filter workaround
      // Instead of complex RPC, we fetch more and filter in memory if needed, or if we have an RPC we use it.
      // Assuming no RPC for now, fetch larger block. For production, a database view or RPC is best.
    }
      
    const from = page * limit;
    const to = from + limit - 1;
    
    query = query.range(from, to);
    const { data, error } = await query;
    if (error) throw error;
    
    let processed = data || [];
    
    if (search && processed.length > 0) {
       const lowerSearch = search.toLowerCase();
       processed = processed.filter((item: any) => 
         item.profiles?.full_name?.toLowerCase().includes(lowerSearch)
       );
    }
    
    return { data: processed, error: null, hasMore: processed.length === limit };
  } catch (err: any) {
    return { data: [], error: err.message, hasMore: false };
  }
}

export async function dbGetFollowingList(userId: string, viewerId: string, search: string = '', page: number = 0, limit: number = 20) {
  if (!supabase) return { data: [], error: null, hasMore: false };
  
  const canView = await dbCanViewFollowLists(viewerId, userId);
  if (!canView) return { data: [], error: 'private', hasMore: false };
  
  try {
    let query = supabase.from('followers')
      .select('id, following_id, created_at, profiles!followers_following_id_fkey(user_id, full_name, profile_photo, privacy_type)')
      .eq('follower_id', userId)
      .eq('status', 'following')
      .order('created_at', { ascending: false });
      
    const from = page * limit;
    const to = from + limit - 1;
    
    query = query.range(from, to);
    const { data, error } = await query;
    if (error) throw error;
    
    let processed = data || [];
    
    if (search && processed.length > 0) {
       const lowerSearch = search.toLowerCase();
       processed = processed.filter((item: any) => 
         item.profiles?.full_name?.toLowerCase().includes(lowerSearch)
       );
    }
    
    return { data: processed, error: null, hasMore: processed.length === limit };
  } catch (err: any) {
    return { data: [], error: err.message, hasMore: false };
  }
}

// ==========================================
// ONLINE PRESENCE SYSTEM
// ==========================================

export async function dbUpdatePresence(userId: string, isOnline: boolean): Promise<void> {
  if (!supabase || !isSupabaseConfigured) return;
  try {
    // Only update to prevent spam if needed, but since it's a heartbeat we just fire it.
    // The UI handles rate limiting (60s).
    await supabase.from('profiles').update({
      is_online: isOnline,
      last_seen: new Date().toISOString()
    }).eq('user_id', userId);
  } catch (err) {
    console.error('[dbUpdatePresence] Error:', err);
  }
}

export async function dbGetOnlineStatus(viewerId: string, targetId: string): Promise<{ isOnline: boolean, lastSeenText: string | null }> {
  if (!supabase || !isSupabaseConfigured) return { isOnline: false, lastSeenText: null };
  try {
    const { data: profile } = await supabase.from('profiles').select('is_online, last_seen, online_privacy').eq('user_id', targetId).single();
    if (!profile) return { isOnline: false, lastSeenText: null };

    // Privacy Check
    const privacy = profile.online_privacy || 'everyone';
    if (privacy === 'nobody') return { isOnline: false, lastSeenText: null };
    if (privacy === 'followers') {
      if (viewerId !== targetId) {
         const followStatus = await dbGetFollowStatus(viewerId, targetId);
         if (followStatus !== 'following') return { isOnline: false, lastSeenText: null };
      }
    }

    // Determine actual online state based on 90 second timeout threshold
    let isActuallyOnline = profile.is_online;
    const lastSeenDate = new Date(profile.last_seen);
    const now = new Date();
    const diffSeconds = (now.getTime() - lastSeenDate.getTime()) / 1000;
    
    if (isActuallyOnline && diffSeconds > 90) {
       isActuallyOnline = false;
    }

    if (isActuallyOnline) return { isOnline: true, lastSeenText: null };

    // Generate last seen text
    if (!profile.last_seen) return { isOnline: false, lastSeenText: null };
    
    if (diffSeconds < 60) return { isOnline: false, lastSeenText: 'Last seen just now' };
    if (diffSeconds < 3600) return { isOnline: false, lastSeenText: `Last seen ${Math.floor(diffSeconds / 60)} minutes ago` };
    
    const isToday = lastSeenDate.toDateString() === now.toDateString();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = lastSeenDate.toDateString() === yesterday.toDateString();
    
    const timeStr = lastSeenDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (isToday) return { isOnline: false, lastSeenText: `Last seen today at ${timeStr}` };
    if (isYesterday) return { isOnline: false, lastSeenText: `Last seen yesterday at ${timeStr}` };
    
    return { isOnline: false, lastSeenText: `Last seen on ${lastSeenDate.toLocaleDateString()}` };
  } catch (err) {
    return { isOnline: false, lastSeenText: null };
  }
}

// ==========================================
// ADVANCED NOTIFICATIONS BULK ACTIONS
// ==========================================

export async function dbDeleteNotificationsByCategory(userId: string, category: string): Promise<boolean> {
  if (!supabase || !isSupabaseConfigured) return false;
  try {
    const { error } = await supabase.from('notifications')
      .delete()
      .eq('user_id', userId)
      .eq('type', category);
    return !error;
  } catch (err) {
    return false;
  }
}

export async function dbClearAllNotifications(userId: string): Promise<boolean> {
  if (!supabase || !isSupabaseConfigured) return false;
  try {
    const { error } = await supabase.from('notifications')
      .delete()
      .eq('user_id', userId);
    return !error;
  } catch (err) {
    return false;
  }
}
