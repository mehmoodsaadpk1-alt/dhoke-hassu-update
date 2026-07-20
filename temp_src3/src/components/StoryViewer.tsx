import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, MoreHorizontal, Pause, Play, Eye, RotateCcw } from 'lucide-react';
import { Story } from '../types';
import { AppAvatar } from './ui';
import { dbLogStoryView, dbReactToStory, dbReplyToStory, dbLogStoryAdAnalytics } from '../utils/supabaseClient';

interface StoryViewerProps {
  stories: Story[];
  initialIdx: number;
  onClose: () => void;
  viewerId: string;
}

export default function StoryViewer({ stories, initialIdx, onClose, viewerId }: StoryViewerProps) {
  const [currentIdx, setCurrentIdx] = useState(initialIdx);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [mediaError, setMediaError] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressInterval = useRef<NodeJS.Timeout | null>(null);
  const storyDuration = 5000; // 5 seconds per story
  
  const touchStartY = useRef<number | null>(null);

  const currentStory = stories[currentIdx];

  useEffect(() => {
    console.log("[STORY VIEWER] Opened", { storyId: currentStory?.id });
    return () => {
      console.log("[STORY VIEWER] Closed");
    };
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === ' ') {
        setIsPaused(p => !p);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIdx, stories.length]);

  // Swipe logic
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartY.current === null) return;
    const touchEndY = e.changedTouches[0].clientY;
    const diff = touchEndY - touchStartY.current;
    
    // Swipe down
    if (diff > 50) {
      handleClose();
    }
    touchStartY.current = null;
  };

  // Preload next story
  useEffect(() => {
    if (currentIdx < stories.length - 1) {
      const nextStory = stories[currentIdx + 1];
      if (nextStory.type === 'photo' && nextStory.image) {
        console.log("[STORY VIEWER] Preload Started", nextStory.id);
        const img = new Image();
        img.src = nextStory.image;
        img.onload = () => console.log("[STORY VIEWER] Preload Success", nextStory.id);
        img.onerror = () => console.log("[STORY VIEWER] Preload Failed", nextStory.id);
      }
    }
  }, [currentIdx, stories]);

  // View Logging
  useEffect(() => {
    setMediaError(false); // Reset error state on story change
    if (currentStory && viewerId) {
      if (currentStory.isAd) {
        dbLogStoryAdAnalytics(currentStory.id, 'impression');
      } else if (currentStory.userId !== viewerId) {
        dbLogStoryView(currentStory.id, viewerId);
        console.log("[STORY VIEWER] Story Viewed", currentStory.id);
      }
    }
  }, [currentStory, viewerId]);

  // Progress Bar Timer
  useEffect(() => {
    if (isPaused) {
      if (progressInterval.current) clearInterval(progressInterval.current);
      if (videoRef.current) videoRef.current.pause();
      return;
    }

    if (currentStory?.type === 'video' && videoRef.current) {
      videoRef.current.play().catch(e => {
        console.warn("Video auto-play prevented:", e);
        setMediaError(true);
      });
      return;
    }

    // Don't auto-advance if media failed
    if (mediaError) {
      if (progressInterval.current) clearInterval(progressInterval.current);
      return;
    }

    const intervalTime = 50; 
    const step = (intervalTime / storyDuration) * 100;

    progressInterval.current = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          console.log("[STORY VIEWER] Story Completed", currentStory.id);
          handleNext(true);
          return 0;
        }
        return prev + step;
      });
    }, intervalTime);

    return () => {
      if (progressInterval.current) clearInterval(progressInterval.current);
    };
  }, [currentIdx, isPaused, currentStory, mediaError]);

  const handleNext = (isAuto = false) => {
    if (currentStory?.isAd) {
      dbLogStoryAdAnalytics(currentStory.id, isAuto ? 'completion' : 'skip');
    }
    
    if (currentIdx < stories.length - 1) {
      console.log("[STORY VIEWER] Next Story");
      setCurrentIdx(currentIdx + 1);
      setProgress(0);
    } else {
      handleClose();
    }
  };

  const handlePrev = () => {
    if (currentStory?.isAd) {
      dbLogStoryAdAnalytics(currentStory.id, 'skip');
    }
    if (currentIdx > 0) {
      console.log("[STORY VIEWER] Previous Story");
      setCurrentIdx(currentIdx - 1);
      setProgress(0);
    } else {
      setProgress(0);
    }
  };

  const handleClose = () => {
    if (currentStory?.isAd) {
      dbLogStoryAdAnalytics(currentStory.id, 'exit');
    }
    onClose();
  };

  const handleVideoTimeUpdate = () => {
    if (videoRef.current) {
      const p = (videoRef.current.currentTime / videoRef.current.duration) * 100;
      setProgress(p);
    }
  };

  const handleVideoEnded = () => {
    console.log("[STORY VIEWER] Story Completed", currentStory.id);
    handleNext(true);
  };

  if (!currentStory) return null;

  return (
    <div 
      className="fixed inset-0 z-50 bg-black flex items-center justify-center animate-fade-in select-none"
      id="story-viewer-fullscreen"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="relative w-full max-w-md h-full md:h-[90vh] md:rounded-2xl overflow-hidden bg-gray-900 shadow-2xl flex flex-col">
        
        {/* Progress Bars */}
        <div className="absolute top-0 left-0 right-0 z-20 flex gap-1 px-2 pt-4">
          {stories.map((s, idx) => (
            <div key={s.id} className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden backdrop-blur-sm">
              <div 
                className="h-full bg-white transition-all duration-75 ease-linear"
                style={{ 
                  width: idx === currentIdx ? `${progress}%` : (idx < currentIdx ? '100%' : '0%') 
                }}
              />
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="absolute top-6 left-0 right-0 z-20 px-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AppAvatar src={currentStory.avatar} fallback={currentStory.author} size={10} className="border border-white/20" />
            <div>
              <p className="text-white font-bold text-sm text-shadow-sm">{currentStory.author}</p>
              <p className="text-white/80 text-[10px] text-shadow-sm font-medium">{currentStory.time}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="text-white/90 hover:text-white transition cursor-pointer">
              <MoreHorizontal className="w-5 h-5" />
            </button>
            <button onClick={handleClose} className="text-white/90 hover:text-white transition cursor-pointer">
              <X className="w-6 h-6 drop-shadow-md" />
            </button>
          </div>
        </div>

        {/* Tap/Hold Navigation Areas */}
        <div 
          className="absolute inset-0 z-10 flex"
          onPointerDown={() => {
            console.log("[STORY VIEWER] Pause");
            setIsPaused(true);
          }}
          onPointerUp={() => {
            console.log("[STORY VIEWER] Resume");
            setIsPaused(false);
          }}
          onPointerLeave={() => setIsPaused(false)}
        >
          <div className="w-1/3 h-full cursor-w-resize" onClick={(e) => { e.stopPropagation(); handlePrev(); }} />
          <div className="w-2/3 h-full cursor-e-resize" onClick={(e) => { e.stopPropagation(); handleNext(); }} />
        </div>

        {/* Media Content */}
        <div className="flex-1 w-full h-full relative bg-black flex items-center justify-center">
          {mediaError ? (
            <div className="flex flex-col items-center gap-4 z-20 pointer-events-auto">
              <p className="text-white font-bold text-sm">Media Failed to Load</p>
              <button 
                onClick={() => setMediaError(false)} 
                className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-full text-white font-bold flex items-center gap-2 transition"
              >
                <RotateCcw className="w-4 h-4" /> Retry
              </button>
            </div>
          ) : (
            <>
              {currentStory.type === 'photo' && currentStory.image && (
                <img 
                  src={currentStory.image} 
                  className="w-full h-full object-cover" 
                  alt="Story" 
                  onError={() => setMediaError(true)}
                />
              )}

              {currentStory.type === 'video' && currentStory.image && (
                <video 
                  ref={videoRef}
                  src={currentStory.image} 
                  className="w-full h-full object-cover" 
                  autoPlay 
                  playsInline
                  onTimeUpdate={handleVideoTimeUpdate}
                  onEnded={handleVideoEnded}
                  onError={() => setMediaError(true)}
                />
              )}

              {currentStory.type === 'text' && (
                <div className={`w-full h-full flex items-center justify-center p-8 ${currentStory.bgColor || 'bg-gradient-to-br from-purple-500 to-indigo-600'}`}>
                  <h2 className="text-white text-3xl md:text-4xl font-bold text-center leading-tight drop-shadow-md whitespace-pre-wrap">
                    {currentStory.text}
                  </h2>
                </div>
              )}
            </>
          )}

          {/* Pause Indicator */}
          {isPaused && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/40 rounded-full p-4 backdrop-blur-md pointer-events-none animate-fade-in">
              <Pause className="w-8 h-8 text-white" />
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="absolute bottom-0 left-0 right-0 z-20 p-4 bg-gradient-to-t from-black/80 to-transparent flex flex-col gap-3 pointer-events-auto">
          
          {/* Reactions Tray (Phase 4) */}
          {currentStory.userId !== viewerId && !currentStory.isAd && (
            <div className="flex items-center justify-between gap-2 bg-black/40 rounded-full px-2 py-1.5 backdrop-blur-md border border-white/10 w-full overflow-x-auto no-scrollbar">
               {['👍', '❤️', '😂', '😮', '😢', '😡'].map(emoji => (
                 <button 
                   key={emoji}
                   className="text-2xl hover:scale-125 transition-transform cursor-pointer px-1"
                   onClick={async (e) => {
                     e.stopPropagation();
                     console.log(`[STORY] Reaction sent: ${emoji}`);
                     const success = await dbReactToStory(currentStory.id, viewerId, emoji);
                     if (success) {
                       console.log(`[STORY VIEWER] Reaction Success: ${emoji}`);
                       // Add a tiny floating animation or toast here later if needed
                     } else {
                       console.error(`[STORY VIEWER] Reaction Failed: ${emoji}`);
                     }
                   }}
                 >
                   {emoji}
                 </button>
               ))}
            </div>
          )}

          <div className="flex flex-col gap-2 w-full">
            {currentStory.isAd ? (
              <a 
                href={currentStory.ctaLink || '#'} 
                target="_blank" 
                rel="noopener noreferrer"
                onClick={(e) => {
                  e.stopPropagation();
                  dbLogStoryAdAnalytics(currentStory.id, 'click');
                }}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3.5 px-4 rounded-xl text-center shadow-lg transition animate-pulse-soft"
              >
                {currentStory.ctaText || 'Learn More'}
              </a>
            ) : currentStory.userId === viewerId ? (
              <div className="flex items-center justify-between w-full bg-black/40 rounded-full px-4 py-2 backdrop-blur-md border border-white/10 cursor-pointer hover:bg-black/60 transition">
                 <div className="flex items-center gap-2 text-white/90">
                   <Eye className="w-4 h-4" />
                   <span className="text-xs font-semibold">{currentStory.viewsCount || 0} Views</span>
                 </div>
                 <div className="flex items-center gap-4 text-xs font-semibold text-white/70">
                   <span>{currentStory.reactionsCount || 0} Reactions</span>
                   <span>{currentStory.repliesCount || 0} Replies</span>
                 </div>
              </div>
            ) : (
              <input 
                type="text" 
                placeholder="Reply to story..." 
                className="flex-1 bg-black/40 border border-white/20 text-white rounded-full px-4 py-2.5 text-sm backdrop-blur-md focus:outline-none focus:border-white/50 placeholder-white/70 shadow-inner"
                onKeyDown={async (e) => {
                  if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                    const text = e.currentTarget.value.trim();
                    e.currentTarget.value = '';
                    console.log(`[STORY] Reply sent: ${text}`);
                    const success = await dbReplyToStory(currentStory.id, viewerId, 'text', text);
                    if (success) {
                      console.log(`[STORY VIEWER] Reply Success: ${text}`);
                    } else {
                      console.error(`[STORY VIEWER] Reply Failed`);
                    }
                  }
                }}
                onClick={(e) => e.stopPropagation()}
              />
            )}
          </div>
        </div>
      </div>

      {/* Desktop Navigation Arrows outside container */}
      <div className="hidden md:flex absolute inset-y-0 left-0 right-0 w-full max-w-3xl mx-auto items-center justify-between pointer-events-none px-4">
        <button 
          onClick={(e) => { e.stopPropagation(); handlePrev(); }}
          disabled={currentIdx === 0}
          className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white pointer-events-auto hover:bg-white/30 disabled:opacity-0 transition-all shadow-lg cursor-pointer"
        >
          <ChevronLeft className="w-8 h-8" />
        </button>
        <button 
          onClick={(e) => { e.stopPropagation(); handleNext(); }}
          className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white pointer-events-auto hover:bg-white/30 transition-all shadow-lg cursor-pointer"
        >
          <ChevronRight className="w-8 h-8" />
        </button>
      </div>
    </div>
  );
}
