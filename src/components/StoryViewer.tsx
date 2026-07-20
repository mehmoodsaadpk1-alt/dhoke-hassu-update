import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, MoreHorizontal, Pause, Eye, RotateCcw, Trash2, MessageCircle, Heart, ThumbsUp, Smile } from 'lucide-react';
import { Story } from '../types';
import { AppAvatar } from './ui';
import { dbLogStoryView, dbReactToStory, dbReplyToStory, dbLogStoryAdAnalytics, dbDeleteStory, supabase, dbGetStoryInsights, StoryInsights, StoryInsightView, StoryInsightReaction, StoryInsightReply } from '../utils/supabaseClient';

interface StoryViewerProps {
  stories: Story[];
  initialIdx: number;
  onClose: () => void;
  viewerId: string;
  onDeleteStory?: (storyId: string) => void;
  navigate?: (path: string, state?: any) => void;
}

export default function StoryViewer({ stories, initialIdx, onClose, viewerId, onDeleteStory, navigate }: StoryViewerProps) {
  const [currentIdx, setCurrentIdx] = useState(initialIdx);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [mediaError, setMediaError] = useState(false);
  const [reactionCounts, setReactionCounts] = useState<{ [storyId: string]: number }>({});
  const [insightsOpen, setInsightsOpen] = useState(false);
  const [insights, setInsights] = useState<StoryInsights>({ views: [], reactions: [], replies: [] });
  const [activeTab, setActiveTab] = useState<'views'|'reactions'|'replies'>('views');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressInterval = useRef<NodeJS.Timeout | null>(null);
  const storyDuration = 5000; // 5 seconds per story
  
  const touchStartY = useRef<number | null>(null);

  const currentStory = stories[currentIdx];
  if (!currentStory) return null;

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
  const handleDeleteStory = async () => {
    if (confirm("Are you sure you want to delete this story? / کیا آپ واقعی یہ کہانی حذف کرنا چاہتے ہیں؟")) {
      setIsPaused(true);
      const success = await dbDeleteStory(currentStory.id);
      if (success) {
        if (onDeleteStory) onDeleteStory(currentStory.id);
        alert("Story deleted successfully!");
        
        // If it's the last story, close
        if (stories.length <= 1) {
          onClose();
        } else {
          // If there's a next story, go to next, else close because we were at the end
          if (currentIdx < stories.length - 1) {
            setProgress(0);
            setIsPaused(false);
            // We stay at currentIdx but the parent will slice the array, so the NEXT story shifts into currentIdx
          } else {
            onClose();
          }
        }
      } else {
        alert("Failed to delete story.");
        setIsPaused(false);
      }
    }
  };

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

  // View Logging and Reaction Fetching
  useEffect(() => {
    setMediaError(false); // Reset error state on story change
    if (currentStory && viewerId) {
      if (currentStory.isAd) {
        dbLogStoryAdAnalytics(currentStory.id, 'impression');
      } else if (currentStory.userId !== viewerId) {
        dbLogStoryView(currentStory.id, viewerId);
        console.log("[STORY VIEWER] Story Viewed", currentStory.id);
      }

      // Fetch current reaction count
      if (supabase) {
        supabase.from('story_reactions')
          .select('id', { count: 'exact', head: true })
          .eq('story_id', currentStory.id)
          .then(({ count, error }) => {
            if (!error && count !== null) {
              setReactionCounts(prev => ({ ...prev, [currentStory.id]: count }));
            }
          });
      }
    }
  }, [currentStory, viewerId]);

  // Realtime subscription for reactions & insights
  useEffect(() => {
    if (!supabase) return;
    const channel = supabase.channel('public:story_realtime_events')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'story_reactions' }, (payload) => {
        const storyId = payload.new ? (payload.new as any).story_id : payload.old ? (payload.old as any).story_id : null;
        if (storyId) {
           supabase.from('story_reactions')
            .select('id', { count: 'exact', head: true })
            .eq('story_id', storyId)
            .then(({ count, error }) => {
              if (!error && count !== null) {
                setReactionCounts(prev => ({ ...prev, [storyId]: count }));
              }
            });
           // Refresh insights if owner
           if (currentStory && currentStory.userId === viewerId && storyId === currentStory.id) {
             dbGetStoryInsights(storyId).then(setInsights);
           }
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'story_views' }, (payload) => {
        const storyId = payload.new ? (payload.new as any).story_id : null;
        if (storyId && currentStory && currentStory.userId === viewerId && storyId === currentStory.id) {
          dbGetStoryInsights(storyId).then(setInsights);
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'story_replies' }, (payload) => {
        const storyId = payload.new ? (payload.new as any).story_id : null;
        if (storyId && currentStory && currentStory.userId === viewerId && storyId === currentStory.id) {
          dbGetStoryInsights(storyId).then(setInsights);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentStory, viewerId]);

  // Fetch insights when owner views their own story or opens the sheet
  useEffect(() => {
    if (currentStory && currentStory.userId === viewerId) {
      dbGetStoryInsights(currentStory.id).then(setInsights);
    }
  }, [currentStory, viewerId]);

  // Progress Bar Timer
  useEffect(() => {
    if (isPaused || insightsOpen) {
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

  const handleCtaClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentStory) return;
    
    dbLogStoryAdAnalytics(currentStory.id, 'click');
    
    const ctaType = currentStory.ctaType || 'Website';
    const ctaValue = currentStory.ctaValue || currentStory.ctaLink || '';
    
    if (!ctaValue) return;

    if (ctaType === 'Website') {
      window.open(ctaValue, '_blank');
    } else if (ctaType === 'WhatsApp') {
      const cleaned = ctaValue.replace(/[^\d+]/g, '');
      window.open(`https://wa.me/${cleaned}`, '_blank');
    } else if (ctaType === 'Phone') {
      window.location.href = `tel:${ctaValue}`;
    } else if (ctaType === 'Email') {
      window.location.href = `mailto:${ctaValue}`;
    } else if (ctaType === 'Internal') {
      if (navigate) {
        onClose(); // Close the story viewer first
        navigate(ctaValue);
      } else {
        console.warn('Navigation not available for internal CTA');
      }
    }
  };

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
            <AppAvatar avatar={currentStory.avatar} name={currentStory.author ?? "Unknown User"} size={10} className="border border-white/20" />
            <div>
              <p className="text-white font-bold text-sm text-shadow-sm">{currentStory.author}</p>
              <p className="text-white/80 text-[10px] text-shadow-sm font-medium">{currentStory.time}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {currentStory.userId === viewerId && (
              <button onClick={handleDeleteStory} className="text-white/90 hover:text-red-400 transition cursor-pointer" title="Delete Story">
                <Trash2 className="w-5 h-5 drop-shadow-md" />
              </button>
            )}
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
                  <h2 className={`text-3xl md:text-4xl font-bold text-center leading-tight drop-shadow-md whitespace-pre-wrap ${currentStory.textStyles?.color || 'text-white'} ${currentStory.textStyles?.font || 'font-sans'}`}>
                    {currentStory.text}
                  </h2>
                </div>
              )}

              {currentStory.type === 'share' && (
                <div className={`w-full h-full flex items-center justify-center p-8 ${currentStory.bgColor || 'bg-gradient-to-br from-indigo-500 to-blue-600'}`}>
                  <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-6 shadow-2xl w-full max-w-sm text-center border border-white/20">
                    <div className="flex items-center justify-center gap-2 text-sm font-bold text-indigo-600 mb-4 uppercase tracking-wider">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                      </div>
                      Shared {(() => {
                      try {
                        const parsed = JSON.parse(currentStory.text?.replace('[SHARE_DATA]', '') || '{}');
                        return parsed.entityType || 'post';
                      } catch { return 'post'; }
                    })()}
                    </div>
                    <h2 className="text-xl md:text-2xl font-extrabold text-slate-800 leading-tight mb-6 whitespace-pre-wrap">
                      {(() => {
                        try {
                          const parsed = JSON.parse(currentStory.text?.replace('[SHARE_DATA]', '') || '{}');
                          return parsed.caption || 'Check this out!';
                        } catch { return currentStory.text; }
                      })()}
                    </h2>
                    <div className="bg-slate-50 rounded-2xl p-4 text-sm text-slate-500 font-medium border border-slate-100 shadow-inner flex items-center justify-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                      Tap to view original content
                    </div>
                  </div>
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
                     console.log(`[STORY VIEWER] Sending reaction... selected status_id: ${currentStory.id}, sender_id: ${viewerId}, emoji: ${emoji}`);
                     // Optimistic update
                     setReactionCounts(prev => ({ ...prev, [currentStory.id]: (prev[currentStory.id] || 0) + 1 }));
                     
                     const success = await dbReactToStory(currentStory.id, viewerId, emoji);
                     if (success) {
                       console.log(`[STORY VIEWER] Reaction insert result: SUCCESS.`);
                       alert(`Reaction ${emoji} sent to ${currentStory.author}!`);
                     } else {
                       console.error(`[STORY VIEWER] Reaction insert result: FAILED`);
                       alert("Failed to send reaction. Please try again.");
                       // Revert optimistic update
                       setReactionCounts(prev => ({ ...prev, [currentStory.id]: Math.max(0, (prev[currentStory.id] || 1) - 1) }));
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
              <button 
                onClick={handleCtaClick}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3.5 px-4 rounded-xl text-center shadow-lg transition animate-pulse-soft"
              >
                {currentStory.ctaText || 'Learn More'}
              </button>
            ) : currentStory.userId === viewerId ? (
              <div 
                onClick={(e) => {
                  e.stopPropagation();
                  setInsightsOpen(true);
                  setIsPaused(true);
                }}
                className="flex items-center justify-between w-full bg-black/40 rounded-full px-4 py-2 backdrop-blur-md border border-white/10 cursor-pointer hover:bg-black/60 transition"
              >
                 <div className="flex items-center gap-2 text-white/90">
                   <Eye className="w-4 h-4" />
                   <span className="text-xs font-semibold">{insights.views.length || currentStory.viewsCount || 0} Views</span>
                 </div>
                 <div className="flex items-center gap-4 text-xs font-semibold text-white/70">
                   <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-md transition">
                    <Heart className="w-3.5 h-3.5" />
                    <span>{insights.reactions.length || reactionCounts[currentStory.id] || 0}</span>
                   </div>
                   <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-md transition">
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>{insights.replies.length || currentStory.repliesCount || 0}</span>
                   </div>
                 </div>
              </div>
            ) : (
              <input 
                type="text" 
                placeholder="Reply to story..." 
                className="flex-1 bg-black/40 border border-white/20 text-white rounded-full px-4 py-2.5 text-sm backdrop-blur-md focus:outline-none focus:border-white/50 placeholder-white/70 shadow-inner"
                onKeyDown={async (e) => {
                  if (e.key === 'Enter' && e.currentTarget.value?.trim()) {
                    const text = e.currentTarget.value?.trim();
                    const inputElement = e.currentTarget;
                    inputElement.value = 'Sending...';
                    inputElement.disabled = true;
                    
                    console.log(`[STORY VIEWER] Sending reply... selected status_id: ${currentStory.id}, sender_id: ${viewerId}`);
                    const success = await dbReplyToStory(currentStory.id, viewerId, 'text', text);
                    
                    inputElement.disabled = false;
                    if (success) {
                      inputElement.value = '';
                      console.log(`[STORY VIEWER] Reply insert result: SUCCESS`);
                      alert("Reply sent successfully!");
                    } else {
                      inputElement.value = text;
                      console.error(`[STORY VIEWER] Reply insert result: FAILED`);
                      alert("Failed to send reply. Please try again.");
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

      {/* WhatsApp-Style Insights Bottom Sheet */}
      {insightsOpen && currentStory.userId === viewerId && (
        <div 
          className="absolute inset-x-0 bottom-0 top-[20%] md:top-[30%] bg-[#1a1a1a] rounded-t-3xl z-50 flex flex-col shadow-[0_-10px_40px_rgba(0,0,0,0.5)] animate-slide-up overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Drag Handle & Header */}
          <div className="w-full flex flex-col items-center pt-3 pb-2 border-b border-white/10 sticky top-0 bg-[#1a1a1a] z-10">
            <div 
              className="w-12 h-1.5 bg-white/30 rounded-full mb-3 cursor-pointer"
              onClick={() => {
                setInsightsOpen(false);
                setIsPaused(false);
              }}
            />
            <div className="flex items-center justify-around w-full px-4 mt-2">
              <button 
                onClick={() => setActiveTab('views')}
                className={`flex flex-col items-center pb-2 px-4 transition-colors ${activeTab === 'views' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-white/50 hover:text-white/80'}`}
              >
                <Eye className="w-5 h-5 mb-1" />
                <span className="text-xs font-bold">{insights.views.length} Views</span>
              </button>
              <button 
                onClick={() => setActiveTab('reactions')}
                className={`flex flex-col items-center pb-2 px-4 transition-colors ${activeTab === 'reactions' ? 'text-red-500 border-b-2 border-red-500' : 'text-white/50 hover:text-white/80'}`}
              >
                <Heart className="w-5 h-5 mb-1" />
                <span className="text-xs font-bold">{insights.reactions.length} Reactions</span>
              </button>
              <button 
                onClick={() => setActiveTab('replies')}
                className={`flex flex-col items-center pb-2 px-4 transition-colors ${activeTab === 'replies' ? 'text-green-500 border-b-2 border-green-500' : 'text-white/50 hover:text-white/80'}`}
              >
                <MessageCircle className="w-5 h-5 mb-1" />
                <span className="text-xs font-bold">{insights.replies.length} Replies</span>
              </button>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto px-4 py-4 custom-scrollbar">
            {activeTab === 'views' && (
              <div className="flex flex-col gap-4">
                {insights.views.length === 0 ? (
                  <div className="text-center text-white/50 py-10 text-sm">No one has viewed your status yet.</div>
                ) : (
                  insights.views.map(v => (
                    <div key={v.viewer_id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <AppAvatar avatar={v.profiles?.avatar_url} name={v.profiles?.full_name ?? "Unknown User"} size={12} className="border border-white/10" />
                        <div className="flex flex-col">
                          <span className="text-white font-semibold text-sm flex items-center gap-2">
                            {v.profiles?.full_name || 'User'}
                            {v.profiles?.is_online && <span className="w-2 h-2 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.8)]" />}
                          </span>
                        </div>
                      </div>
                      <span className="text-white/50 text-xs">
                        {new Date(v.viewed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'reactions' && (
              <div className="flex flex-col gap-4">
                {insights.reactions.length === 0 ? (
                  <div className="text-center text-white/50 py-10 text-sm">No reactions yet.</div>
                ) : (
                  insights.reactions.map((r, i) => (
                    <div key={r.reactor_id + i} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <AppAvatar avatar={r.profiles?.avatar_url} name={r.profiles?.full_name ?? "Unknown User"} size={12} className="border border-white/10" />
                        <span className="text-white font-semibold text-sm">{r.profiles?.full_name || 'User'}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-2xl animate-bounce-soft drop-shadow-md">{r.reaction_type}</span>
                        <span className="text-white/50 text-xs w-16 text-right">
                          {new Date(r.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'replies' && (
              <div className="flex flex-col gap-4">
                {insights.replies.length === 0 ? (
                  <div className="text-center text-white/50 py-10 text-sm">No replies yet.</div>
                ) : (
                  insights.replies.map(r => (
                    <div 
                      key={r.id} 
                      className="flex items-start justify-between bg-white/5 rounded-xl p-3 cursor-pointer hover:bg-white/10 transition group"
                      onClick={() => {
                         // Initiate chat - requires router or app-level navigation.
                         // For now, prompt or rely on parent component if there's a callback.
                         alert(`Opening chat with ${r.profiles?.full_name || 'User'}...`);
                      }}
                    >
                      <div className="flex items-start gap-3 flex-1">
                        <AppAvatar avatar={r.profiles?.avatar_url} name={r.profiles?.full_name ?? "Unknown User"} size={12} className="border border-white/10 mt-0.5" />
                        <div className="flex flex-col flex-1">
                          <span className="text-white font-semibold text-sm">{r.profiles?.full_name || 'User'}</span>
                          <span className="text-white/80 text-sm mt-1 bg-black/20 p-2 rounded-lg rounded-tl-none break-words">
                            {r.content}
                          </span>
                        </div>
                      </div>
                      <span className="text-white/40 text-[10px] whitespace-nowrap ml-3">
                        {new Date(r.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
