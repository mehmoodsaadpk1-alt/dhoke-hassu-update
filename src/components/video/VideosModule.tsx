import React, { useEffect, useState, useRef, useCallback } from 'react';
import { recommendationService } from '../../services/RecommendationService';
import { ShortsFeed } from './ShortsFeed';
import { VideoUploadStudio } from './VideoUploadStudio';

interface VideosModuleProps {
  userId: string;
}

export const VideosModule: React.FC<VideosModuleProps> = ({ userId }) => {
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  
  const loadingRef = useRef(false);

  const fetchFeed = useCallback(async (isRefresh = false) => {
    if (loadingRef.current || (!hasMore && !isRefresh)) return;
    
    loadingRef.current = true;
    if (isRefresh) {
      setError(null);
    } else if (videos.length === 0) {
      setLoading(true);
      setError(null);
    }

    try {
      const offset = isRefresh ? 0 : videos.length;
      
      const newVideos = await recommendationService.getFeed({
        limit: 5,
        offset: offset,
        userId: userId,
        mode: 'Recent'
      });
      
      if (isRefresh) {
        setVideos(newVideos);
      } else {
        setVideos(prev => [...prev, ...newVideos]);
      }
      
      setHasMore(newVideos.length === 5);
    } catch (err: any) {
      console.error("Failed to fetch shorts:", err);
      setError(err?.message || "Failed to load videos");
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, [videos.length, hasMore, userId]);

  useEffect(() => {
    fetchFeed(true);
  }, [userId]);

  useEffect(() => {
    // Add class to hide global mobile UI elements when in Watch tab
    document.body.classList.add('watch-mode-active');
    return () => {
      document.body.classList.remove('watch-mode-active');
    };
  }, []);

  return (
    <div className="videos-module-root relative flex flex-col bg-black">
      {/* Absolute Header Overlay */}
      {!showUpload && (
        <div className="absolute top-0 left-0 right-0 z-40 p-4 pt-6 flex justify-between items-center bg-gradient-to-b from-black/80 via-black/40 to-transparent pointer-events-none">
          <h1 className="text-2xl font-bold text-white drop-shadow-md">Shorts</h1>
          <button 
            onClick={() => setShowUpload(true)}
            className="pointer-events-auto bg-white/20 backdrop-blur-md text-white px-4 py-2 rounded-full font-semibold hover:bg-white/30 transition shadow-lg border border-white/30"
          >
            Upload
          </button>
        </div>
      )}

      {showUpload ? (
        <div className="w-full h-full bg-slate-50 overflow-y-auto">
          <div className="p-4 border-b flex justify-between items-center sticky top-0 bg-white z-10 shadow-sm">
            <h1 className="text-xl font-bold">Upload Studio</h1>
            <button 
              onClick={() => setShowUpload(false)}
              className="text-gray-600 hover:text-black font-semibold px-4 py-2"
            >
              Cancel
            </button>
          </div>
          <div className="p-4 max-w-3xl mx-auto">
            <VideoUploadStudio 
              userId={userId} 
              onComplete={() => {
                setShowUpload(false);
                fetchFeed(true);
              }} 
            />
          </div>
        </div>
      ) : (
        <ShortsFeed
          videos={videos}
          loading={loading}
          error={error}
          hasMore={hasMore}
          onLoadMore={() => fetchFeed(false)}
          onRefresh={() => fetchFeed(true)}
          onVideoDeleted={(id) => setVideos(prev => prev.filter(v => v.id !== id))}
          currentUserId={userId}
        />
      )}
    </div>
  );
};
