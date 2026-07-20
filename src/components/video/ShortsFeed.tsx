import React, { useState, useEffect, useRef, useCallback } from 'react';
import { recommendationService } from '../../services/RecommendationService';
import { videoService } from '../../services/VideoService';
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
  currentUserId
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  
  // Sheet States
  const [activeCommentVideo, setActiveCommentVideo] = useState<string | null>(null);
  const [activeShareVideo, setActiveShareVideo] = useState<string | null>(null);
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({});

  const containerRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Setup Intersection Observer for Infinite Scroll and Active Video Detection
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const options = {
      root: container,
      rootMargin: '0px',
      threshold: 0.5 // Video is active when 50% is visible
    };

    observerRef.current = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const index = Number(entry.target.getAttribute('data-index'));
          setActiveIndex(index);
          
          // Fetch more if we're near the end (e.g., 2 videos away)
          if (index >= videos.length - 2 && hasMore && !loading) {
            onLoadMore();
          }
        }
      });
    }, options);

    const cards = container.querySelectorAll('.shorts-card-container');
    cards.forEach(card => observerRef.current?.observe(card));

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [videos, hasMore, currentUserId]);

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
  
  const toggleMute = useCallback(() => {
    setIsMuted(prev => !prev);
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
    <div className="relative h-full w-full bg-black">
      {onBack && (
        <button 
          onClick={onBack}
          className="absolute top-4 left-4 z-30 p-2 bg-black/40 rounded-full text-white backdrop-blur-sm"
        >
          &larr;
        </button>
      )}

      {/* Infinite Scroll Container */}
      <div 
        ref={containerRef}
        className="h-full w-full overflow-y-scroll snap-y snap-mandatory scrollbar-hide bg-black relative"
        style={{ scrollBehavior: 'smooth' }}
      >
        {videos.map((video, index) => {
          // VIRTUALIZATION: Keep only prev, current, next mounted!
          const isNearActive = Math.abs(activeIndex - index) <= 1;
          const isActive = activeIndex === index;

          return (
            <div 
              key={video.id} 
              data-index={index}
              data-id={video.id}
              className="shorts-card-container w-full h-full snap-start relative"
            >
              {isNearActive ? (
                <ShortsCard
                  video={{ ...video, comments_count: commentCounts[video.id] !== undefined ? commentCounts[video.id] : video.comments_count }}
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
                // Keep the structural height to maintain scroll positions cleanly
                <div className="w-full h-full bg-black"></div>
              )}
            </div>
          );
        })}
        {loading && (
          <div className="w-full h-32 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </div>

      {/* Overlays */}
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
