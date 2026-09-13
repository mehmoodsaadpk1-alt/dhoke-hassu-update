import React, { useState, useEffect } from 'react';
import { dbFollowUser, dbUnfollowUser, dbGetFollowStatus } from '../../utils/supabaseClient';
import { ShortsActions } from './ShortsActions';
import { VideoPlayer } from './VideoPlayer';
import { useVideoPreload } from '../../hooks/useVideoPreload';
import { CheckCircle2, Music, Hash, Eye, MoreVertical } from 'lucide-react';
import { analytics } from '../../services/AnalyticsService';
import { supabase } from '../../utils/supabaseClient';

const viewedVideosInSession = new Set<string>();

interface ShortsCardProps {
  video: any;
  isActive: boolean;
  isMuted: boolean;
  toggleMute: (forceValue?: boolean) => void;
  onLike: (videoId: string, like: boolean) => void;
  onComment: (videoId: string) => void;
  onShare: (videoId: string) => void;
  onSave: (videoId: string, save: boolean) => void;
  onFollow: (creatorId: string) => void;
  onReport: (videoId: string) => void;
  onDelete: (videoId: string) => void;
  index: number;
  activeIndex: number;
  currentUserId?: string;
}

export const ShortsCard: React.FC<ShortsCardProps> = React.memo(({
  video,
  isActive,
  isMuted,
  toggleMute,
  onLike,
  onComment,
  onShare,
  onSave,
  onFollow,
  onReport,
  onDelete,
  index,
  activeIndex,
  currentUserId
}) => {
  const [localLike, setLocalLike] = useState(!!video.hasLiked);
  const [localLikesCount, setLocalLikesCount] = useState(video.likes || 0);
  const [localCommentsCount, setLocalCommentsCount] = useState(video.comments_count || 0);
  const [localViewsCount, setLocalViewsCount] = useState(video.views || 0);
  const [isExpanded, setIsExpanded] = useState(false);
  const [followStatus, setFollowStatus] = useState<'following' | 'requested' | 'none' | 'blocked'>('none');
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const [showOptions, setShowOptions] = useState(false);

  // We optimize the video url here so the preloader fetches exactly what the player uses
  const optimizedUrl = React.useMemo(() => video.video_url, [video.video_url]);
  
  const { shouldMountVideo, preloadType } = useVideoPreload(optimizedUrl, index, activeIndex);

  useEffect(() => {
    setLocalLike(!!video.hasLiked);
  }, [video.hasLiked]);

  useEffect(() => {
    setLocalLikesCount(video.likes || 0);
  }, [video.likes]);

  useEffect(() => {
    setLocalViewsCount(video.views || 0);
  }, [video.views]);

  useEffect(() => {
    if (currentUserId && currentUserId !== video.user_id) {
      dbGetFollowStatus(currentUserId, video.user_id).then(setFollowStatus);
    }
  }, [currentUserId, video.user_id]);

  const handleFollowToggle = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!currentUserId || currentUserId === video.user_id || isFollowLoading) return;
    setIsFollowLoading(true);
    try {
      if (followStatus === 'following' || followStatus === 'requested') {
        const success = await dbUnfollowUser(currentUserId, video.user_id);
        if (success) {
          setFollowStatus('none');
          onFollow(video.user_id);
        }
      } else {
        const res = await dbFollowUser(currentUserId, video.user_id);
        if (res.success) {
          setFollowStatus(res.status || 'requested');
          onFollow(video.user_id);
        }
      }
    } catch (e) {
      console.error("Follow error:", e);
    } finally {
      setIsFollowLoading(false);
    }
  };


  const handleDoubleTap = () => {
    if (!localLike) {
      setLocalLike(true);
      setLocalLikesCount(prev => prev + 1);
      onLike(video.id, true);
    }
  };

  const caption = video.description || video.title || 'Dhoke Hassu Shorts';
  const showExpand = caption.length > 60;

  return (
    <div className="w-full h-full relative bg-black flex justify-center items-center overflow-hidden snap-start">
      
      {/* 
        Video Player Component 
        Handles intersection logic, memory cleanup, double-tap, and controls natively.
      */}
      {shouldMountVideo && (
        <VideoPlayer
          videoId={video.id}
          userId={currentUserId}
          src={video.video_url}
          poster={video.thumbnail_url}
          isActive={isActive}
          isMuted={isMuted}
          toggleMute={toggleMute}
          onDoubleTap={handleDoubleTap}
          preloadType={preloadType}
          onViewRecorded={() => {
            setLocalViewsCount(prev => prev + 1);
            if (!viewedVideosInSession.has(video.id)) {
              viewedVideosInSession.add(video.id);
              analytics.track("video_view", { entity_type: 'video',
                module: "videos",
                entity_id: video.id,
                metadata: {
                  source: "videos_feed"
                }
              });
            }
          }}
        />
      )}

      {/* Bottom Gradient overlay for text readability */}
      <div className="absolute bottom-0 start-0 end-0 h-1/2 bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none z-10"></div>

      {/* Info & Actions Container */}
      <div className="absolute bottom-0 left-0 right-0 p-4 pb-12 z-20 pointer-events-none" dir="ltr">
        
        {/* Left Info Section */}
        <div className="absolute bottom-12 left-4 right-16 text-white pointer-events-auto flex flex-col items-start text-left" dir="ltr">
          {/* Creator Info Header (Avatar + Name + Follow) */}
          <div className="flex items-center space-x-2 mb-2">
            {/* Avatar */}
            <div 
              className="w-9 h-9 rounded-full overflow-hidden bg-gray-800 flex-shrink-0 border border-white/20 shadow-md cursor-pointer"
              onClick={(e) => { 
                e.stopPropagation(); 
                if ((window as any).openUserProfile) {
                  (window as any).openUserProfile(video.profiles?.full_name || 'Creator', video.profiles?.profile_photo, video.user_id);
                }
              }}
            >
              {video.profiles?.profile_photo ? (
                <img src={video.profiles.profile_photo} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center font-bold text-sm text-white">
                  {video.profiles?.full_name?.charAt(0) || 'U'}
                </div>
              )}
            </div>

            {/* Username and Badge */}
            <div 
              className="flex items-center space-x-1 cursor-pointer hover:underline"
              onClick={(e) => { 
                e.stopPropagation(); 
                if ((window as any).openUserProfile) {
                  (window as any).openUserProfile(video.profiles?.full_name || 'Creator', video.profiles?.profile_photo, video.user_id);
                }
              }}
            >
              <span className="text-[15px] font-semibold drop-shadow-md">
                {video.profiles?.full_name || 'Creator'}
              </span>
              {video.profiles?.is_verified && <CheckCircle2 size={12} className="text-blue-400 fill-current" />}
            </div>

            {/* Follow Button */}
            {currentUserId !== video.user_id && followStatus !== 'blocked' && followStatus === 'none' && (
              <>
                <span className="text-white/70 text-xs px-1">•</span>
                <button 
                  onClick={handleFollowToggle}
                  disabled={isFollowLoading}
                  className="bg-transparent text-white border border-white/80 px-2.5 py-0.5 rounded-full text-xs font-semibold hover:bg-white/20 transition-colors shadow-sm"
                >
                  {isFollowLoading ? '...' : 'Follow'}
                </button>
              </>
            )}
          </div>

          {/* Caption */}
          <div>
            <h2 className="text-[15px] drop-shadow-md leading-snug font-normal text-white/95 line-clamp-3">
              {caption}
            </h2>
          </div>
        </div>

        {/* Right Actions Section */}
        <div className="absolute bottom-12 right-4 pointer-events-auto flex flex-col items-center space-y-4" dir="ltr">

          <ShortsActions
            videoId={video.id}
            creatorId={video.user_id}
            creatorName={video.profiles?.full_name || 'Creator'}
            creatorPhoto={video.profiles?.profile_photo}
            likesCount={localLikesCount}
            commentsCount={video.comments_count || 0}
            hasLikedInitially={localLike}
            hasSavedInitially={!!video.hasSaved}
            isOwner={currentUserId === video.user_id}
            onLike={(id, liked) => {
              setLocalLike(liked);
              setLocalLikesCount(prev => liked ? prev + 1 : Math.max(0, prev - 1));
              onLike(id, liked);
            }}
            onComment={onComment}
            onShare={onShare}
            onSave={onSave}
            onFollow={onFollow}
            onReport={onReport}
            onDelete={onDelete}
          />
        </div>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  return prevProps.isActive === nextProps.isActive &&
         prevProps.isMuted === nextProps.isMuted &&
         prevProps.index === nextProps.index &&
         prevProps.activeIndex === nextProps.activeIndex &&
         prevProps.video.id === nextProps.video.id &&
         prevProps.video.comments_count === nextProps.video.comments_count &&
         prevProps.video.hasSaved === nextProps.video.hasSaved;
});

ShortsCard.displayName = 'ShortsCard';
