import React, { useState, useEffect } from 'react';
import { dbFollowUser, dbUnfollowUser, dbGetFollowStatus } from '../../utils/supabaseClient';
import { ShortsActions } from './ShortsActions';
import { VideoPlayer } from './VideoPlayer';
import { useVideoPreload } from '../../hooks/useVideoPreload';
import { CheckCircle2, Music, Hash, Eye, MoreVertical } from 'lucide-react';
import { analytics } from '../../services/AnalyticsService';
import { getOptimizedVideoUrl } from '../../utils/cloudinary';

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
  const optimizedUrl = React.useMemo(() => getOptimizedVideoUrl(video.video_url), [video.video_url]);
  
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
          {/* Caption */}
          <div className="mb-1">
            <h2 className="text-xl font-bold drop-shadow-md leading-tight">
              {caption}
            </h2>
          </div>
          
          {/* Username */}
          <div 
            className="flex items-center space-x-1 cursor-pointer hover:underline"
            onClick={(e) => { 
              e.stopPropagation(); 
              if ((window as any).openUserProfile) {
                (window as any).openUserProfile(video.profiles?.full_name || 'Creator', video.profiles?.profile_photo, video.user_id);
              }
            }}
          >
            <span className="text-sm font-medium drop-shadow-md">
              {video.profiles?.full_name || 'Creator'}
            </span>
            {video.profiles?.is_verified && <CheckCircle2 size={12} className="text-blue-400 fill-current" />}
          </div>
        </div>

        {/* Right Actions Section */}
        <div className="absolute bottom-12 right-4 pointer-events-auto flex flex-col items-center space-y-4" dir="ltr">
          
          {/* Avatar and Follow Button */}
          <div className="relative mb-2 flex flex-col items-center">
            <div 
              className="w-12 h-12 rounded-full overflow-hidden border-2 border-white bg-gray-800 cursor-pointer shadow-lg"
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
                <div className="w-full h-full flex items-center justify-center font-bold text-lg text-white">
                  {video.profiles?.full_name?.charAt(0) || 'U'}
                </div>
              )}
            </div>
            {currentUserId !== video.user_id && followStatus !== 'blocked' && followStatus === 'none' && (
              <button 
                onClick={handleFollowToggle}
                disabled={isFollowLoading}
                className="absolute -bottom-3 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full border-2 border-white shadow-md z-10 hover:bg-red-700 transition-colors"
                style={{ transform: 'translateY(2px)' }}
              >
                {isFollowLoading ? '...' : 'فالو'}
              </button>
            )}
          </div>

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
