-- ==============================================================================
-- ADMIN STORIES & HIGHLIGHTS RPC MIGRATIONS
-- Run this in your Supabase SQL Editor
-- ==============================================================================

-- 1. Create function for fetching admin stories efficiently with counts
CREATE OR REPLACE FUNCTION get_admin_stories_with_counts(
    page_offset INT DEFAULT 0,
    page_limit INT DEFAULT 50,
    search_query TEXT DEFAULT '',
    filter_status TEXT DEFAULT 'all',
    filter_type TEXT DEFAULT 'all',
    sort_by TEXT DEFAULT 'latest'
) RETURNS TABLE (
    id UUID,
    user_id UUID,
    author TEXT,
    avatar TEXT,
    type TEXT,
    text TEXT,
    image TEXT,
    media_urls TEXT[],
    created_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    is_archived BOOLEAN,
    views_count BIGINT,
    reactions_count BIGINT,
    replies_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id,
        s.user_id,
        COALESCE(p.full_name, s.author) as author,
        COALESCE(p.profile_photo, s.avatar) as avatar,
        s.type,
        s.text,
        s.image,
        s.media_urls,
        s.created_at,
        s.expires_at,
        s.is_archived,
        (SELECT COUNT(*) FROM story_views v WHERE v.story_id = s.id) as views_count,
        (SELECT COUNT(*) FROM story_reactions r WHERE r.story_id = s.id) as reactions_count,
        (SELECT COUNT(*) FROM story_replies sr WHERE sr.story_id = s.id) as replies_count
    FROM stories s
    LEFT JOIN profiles p ON s.user_id = p.user_id
    WHERE 
        (search_query = '' OR s.author ILIKE '%' || search_query || '%' OR p.full_name ILIKE '%' || search_query || '%')
        AND (filter_status = 'all' OR 
             (filter_status = 'active' AND s.is_archived = false AND s.expires_at > NOW()) OR 
             (filter_status = 'expired' AND (s.is_archived = true OR s.expires_at <= NOW())))
        AND (filter_type = 'all' OR s.type = filter_type)
    ORDER BY 
        CASE WHEN sort_by = 'latest' THEN s.created_at END DESC,
        CASE WHEN sort_by = 'oldest' THEN s.created_at END ASC,
        CASE WHEN sort_by = 'most_viewed' THEN (SELECT COUNT(*) FROM story_views v WHERE v.story_id = s.id) END DESC
    OFFSET page_offset
    LIMIT page_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;



-- 2. Create function for fetching admin highlights efficiently with counts
CREATE OR REPLACE FUNCTION get_admin_highlights_with_counts(
    page_offset INT DEFAULT 0,
    page_limit INT DEFAULT 50
) RETURNS TABLE (
    id UUID,
    user_id UUID,
    title TEXT,
    cover_image TEXT,
    created_at TIMESTAMPTZ,
    author TEXT,
    stories_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        h.id,
        h.user_id,
        h.title,
        h.cover_image,
        h.created_at,
        p.full_name as author,
        (SELECT COUNT(*) FROM story_highlight_items shi WHERE shi.highlight_id = h.id) as stories_count
    FROM story_highlights h
    LEFT JOIN profiles p ON h.user_id = p.user_id
    ORDER BY h.created_at DESC
    OFFSET page_offset
    LIMIT page_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
