import React, { useState, useEffect, useRef, useCallback } from 'react';
import { dbGetShorts, dbToggleLike } from '../../utils/supabaseClient';
import { videoService } from '../../services/VideoService';
import { analytics } from '../../services/AnalyticsService';
import { ShortsCard } from './ShortsCard';
import { ShortsLoader } from './ShortsLoader';
import { ShortsComments } from './ShortsComments';
import { ShortsShare } from './ShortsShare';
import { Video } from 'lucide-react';

interface ShortsFeedProps {
  onBack?: () => void;
  videos: any[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  onLoadMore: () => void;
  onRefresh: () => void;
  onVideoDeleted?: (videoId: string) => void;
  onVideoSavedToggle?: (videoId: string, isSaved: boolean) => void;
  currentUserId?: string;
}

export const ShortsFeed: React.FC<ShortsFeedProps> = ({ 
  onBack,
  videos,
  loading,
  error,
  hasMore,
  onLoadMore,
  onRefresh,
  onVideoDeleted,
  onVideoSavedToggle,
  currentUserId
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isMuted, setIsMuted] = useState<boolean>(() => {
    const saved = sessionStorage.getItem('watch_feed_muted');
    return saved !== null ? JSON.parse(saved) : true;
  });
  
  // Sheet States
  const [activeCommentVideo, setActiveCommentVideo] = useState<string | null>(null);
  const [activeShareVideo, setActiveShareVideo] = useState<string | null>(null);
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({});

  const containerRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // ─── TikTok-style IntersectionObserver ──────────────────────────────────────
  // Threshold 0.85: video is only "active" when 85% visible — no mid-swipe firing
  useEffect(() => {
    const container = containerRef.current;
    if (!container || videos.length === 0) return;

    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.85) {
            const index = Number(entry.target.getAttribute('data-index'));
            if (!isNaN(index)) {
              setActiveIndex(index);
              // Prefetch more when near the end
              if (index >= videos.length - 2 && hasMore && !loading) {
                onLoadMore();
              }
            }
          }
        });
      },
      {
        root: container,
        rootMargin: '0px',
        threshold: [0, 0.85, 1.0],
      }
    );

    const cards = container.querySelectorAll('.shorts-snap-item');
    cards.forEach((card) => observerRef.current?.observe(card));

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [videos.length, hasMore, loading]);

  // Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't scroll if a sheet is open or user is typing in an input
      if (activeCommentVideo || activeShareVideo) return;
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

      const container = containerRef.current;
      if (!container) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        const nextIndex = Math.min(activeIndex + 1, videos.length - 1);
        const card = container.querySelector(`[data-index="${nextIndex}"]`);
        if (card) card.scrollIntoView({ behavior: 'smooth' });
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const prevIndex = Math.max(activeIndex - 1, 0);
        const card = container.querySelector(`[data-index="${prevIndex}"]`);
        if (card) card.scrollIntoView({ behavior: 'smooth' });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeIndex, videos.length, activeCommentVideo, activeShareVideo]);

  // Interaction Handlers
  const handleLike = useCallback(async (videoId: string, like: boolean) => {
    if (!currentUserId) {
      alert("Please login to like");
      throw new Error("User not logged in");
    }
    await videoService[like ? 'likeVideo' : 'unlikeVideo'](videoId, currentUserId);
    analytics.track(like ? "video_like" : "video_unlike", { entity_type: 'video',
      module: "videos",
      entity_id: videoId
    });
  }, [currentUserId]);

  const handleSave = useCallback(async (videoId: string, save: boolean) => {
    if (!currentUserId) {
      alert("Please login to save");
      throw new Error("User not logged in");
    }
    await videoService[save ? 'saveVideo' : 'unsaveVideo'](videoId, currentUserId);
  }, [currentUserId]);

  const handleComment = useCallback((videoId: string) => {
    setActiveCommentVideo(videoId);
  }, []);

  const handleCommentAdded = useCallback((videoId: string) => {
    setCommentCounts(prev => {
      const existing = prev[videoId] !== undefined ? prev[videoId] : (videos.find(v => v.id === videoId)?.comments_count || 0);
      return { ...prev, [videoId]: existing + 1 };
    });
  }, [videos]);

  const handleCommentDeleted = useCallback((videoId: string) => {
    setCommentCounts(prev => {
      const existing = prev[videoId] !== undefined ? prev[videoId] : (videos.find(v => v.id === videoId)?.comments_count || 0);
      return { ...prev, [videoId]: Math.max(0, existing - 1) };
    });
  }, [videos]);

  const handleShare = useCallback((videoId: string) => {
    setActiveShareVideo(videoId);
  }, []);

  const handleFollow = useCallback((creatorId: string) => {
    console.log("Follow creator", creatorId);
  }, []);

  const handleReport = useCallback((videoId: string) => {
    if (!currentUserId) return;
    videoService.reportVideo(videoId, currentUserId, "Inappropriate content");
    alert("Video reported to moderation team.");
  }, [currentUserId]);

  const handleDelete = useCallback(async (videoId: string) => {
    if (window.confirm("Are you sure you want to delete this video?")) {
      try {
        await videoService.deleteVideo(videoId);
        if (onVideoDeleted) {
          onVideoDeleted(videoId);
        }
      } catch (err) {
        console.error("Error deleting video:", err);
        alert("Failed to delete video. Please try again.");
      }
    }
  }, [onVideoDeleted]);
  
  const toggleMute = useCallback((forceValue?: boolean) => {
    setIsMuted(prev => {
      const next = forceValue !== undefined ? forceValue : !prev;
      sessionStorage.setItem('watch_feed_muted', JSON.stringify(next));
      return next;
    });
  }, []);

  if (loading && videos.length === 0) {
    return <div className="h-full w-full bg-black"><ShortsLoader /></div>;
  }

  if (error && videos.length === 0) {
    return (
      <div className="h-full w-full bg-black flex flex-col items-center justify-center text-white p-6 text-center">
        <Video size={48} className="text-gray-600 mb-4" />
        <h2 className="text-xl font-bold mb-2">Something went wrong</h2>
        <p className="text-gray-400 mb-6">{error}</p>
        <button 
          onClick={() => onRefresh()}
          className="bg-red-600 hover:bg-red-700 px-6 py-2 rounded-full font-semibold transition-colors"
        >
          Tap to Retry
        </button>
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="h-full w-full bg-black flex flex-col items-center justify-center text-white p-6 text-center">
        <Video size={48} className="text-gray-600 mb-4" />
        <h2 className="text-xl font-bold mb-2">No Shorts Yet</h2>
        <p className="text-gray-400 mb-6">Check back later for new videos from your community.</p>
        <button 
          onClick={() => onRefresh()}
          className="bg-gray-800 hover:bg-gray-700 px-6 py-2 rounded-full font-semibold transition-colors"
        >
          Refresh Feed
        </button>
      </div>
    );
  }

  return (
    <div className="shorts-feed-root relative">
      {onBack && (
        <button
          onClick={onBack}
          className="absolute top-4 start-4 z-30 p-2 bg-black/40 rounded-full text-white backdrop-blur-sm"
        >
          &larr;
        </button>
      )}

      {/*
        ─── SNAP SCROLL CONTAINER ─────────────────────────────────────────────
        Uses CSS classes defined in index.css for maximum cross-browser support.
        scroll-snap-type: y mandatory forces ONE video per swipe.
        overscroll-behavior: contain stops rubber-band leaking to body on iOS.
        scroll-snap-stop: always on each child prevents fast-flick multi-skip.
      */}
      <div
        ref={containerRef}
        className="shorts-scroll-container"
      >
        {videos.map((video, index) => {
          // Virtualization: only mount prev, current, next
          const isNearActive = Math.abs(activeIndex - index) <= 1;
          const isActive = activeIndex === index;

          return (
            <div
              key={video.id}
              data-index={index}
              data-id={video.id}
              className="shorts-snap-item"
            >
              {isNearActive ? (
                <ShortsCard
                  video={{
                    ...video,
                    comments_count: commentCounts[video.id] !== undefined
                      ? commentCounts[video.id]
                      : video.comments_count
                  }}
                  isActive={isActive}
                  isMuted={isMuted}
                  toggleMute={toggleMute}
                  onLike={handleLike}
                  onComment={handleComment}
                  onShare={handleShare}
                  onSave={handleSave}
                  onFollow={handleFollow}
                  onReport={handleReport}
                  onDelete={handleDelete}
                  index={index}
                  activeIndex={activeIndex}
                  currentUserId={currentUserId}
                />
              ) : (
                // Placeholder maintains snap height so positions stay correct
                <div className="w-full h-full bg-black" />
              )}
            </div>
          );
        })}

        {loading && (
          <div className="w-full h-20 flex items-center justify-center bg-black">
            <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Sheet Overlays - outside scroll container so they don't affect snapping */}
      <ShortsComments
        videoId={activeCommentVideo}
        isOpen={!!activeCommentVideo}
        onClose={() => setActiveCommentVideo(null)}
        currentUserId={currentUserId}
        onCommentAdded={handleCommentAdded}
        onCommentDeleted={handleCommentDeleted}
      />

      <ShortsShare
        videoId={activeShareVideo}
        isOpen={!!activeShareVideo}
        onClose={() => setActiveShareVideo(null)}
      />
    </div>
  );
};
