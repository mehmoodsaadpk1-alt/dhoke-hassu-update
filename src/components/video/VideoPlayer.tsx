import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize, PictureInPicture, Heart, AlertCircle, RefreshCw } from 'lucide-react';
import { videoAnalyticsService } from '../../services/VideoAnalyticsService';
import { getOptimizedVideoUrl } from '../../utils/cloudinary';
import { videoCacheService } from '../../services/VideoCacheService';
import { analytics } from '../../services/AnalyticsService';

interface VideoSessionAnalytics {
  hasStarted: boolean;
  milestones: Set<number>;
  hasCompleted: boolean;
  accumulatedSeconds: number;
}
const globalVideoAnalytics = new Map<string, VideoSessionAnalytics>();

const getAnalyticsState = (videoId: string) => {
  if (!globalVideoAnalytics.has(videoId)) {
    globalVideoAnalytics.set(videoId, {
      hasStarted: false,
      milestones: new Set(),
      hasCompleted: false,
      accumulatedSeconds: 0
    });
  }
  return globalVideoAnalytics.get(videoId)!;
};

interface VideoPlayerProps {
  videoId: string;
  userId?: string;
  src: string;
  poster?: string;
  isActive?: boolean;
  isMuted?: boolean;
  toggleMute?: (forceValue?: boolean) => void;
  onDoubleTap?: () => void;
  preloadType?: 'none' | 'metadata' | 'auto';
  className?: string;
  onViewRecorded?: () => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = React.memo(({
  videoId,
  userId,
  src,
  poster,
  isActive,
  isMuted,
  toggleMute,
  onDoubleTap,
  preloadType = 'metadata',
  className = "",
  onViewRecorded
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressContainerRef = useRef<HTMLDivElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [progress, setProgress] = useState(0);
  const [bufferProgress, setBufferProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  // isFullscreen state removed
  const [showHeart, setShowHeart] = useState(false);
  const [showControls, setShowControls] = useState(true);
  
  const [hasError, setHasError] = useState(false);
  const optimizedInitialSrc = useMemo(() => getOptimizedVideoUrl(src), [src]);
  const [cachedUrl, setCachedUrl] = useState<string>(optimizedInitialSrc);
  const [activeSrc, setActiveSrc] = useState<string>('');
  const [visibilityRatio, setVisibilityRatio] = useState(0);

  const localPlaySession = useRef({
    lastPlayTime: 0,
    isPlaying: false
  });

  // Internal mute state for standalone usage (like in FeedCard)
  const [internalMuted, setInternalMuted] = useState<boolean>(() => {
    const saved = sessionStorage.getItem('watch_feed_muted');
    return saved !== null ? JSON.parse(saved) : true;
  });

  const effectiveMuted = isMuted !== undefined ? isMuted : internalMuted;

  const lastTapRef = useRef<number>(0);
  const [isHardwareCapable, setIsHardwareCapable] = useState(false);

  useEffect(() => {
    // Determine if we can safely use a secondary live video for blurred backgrounds
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    const isSaveData = connection?.saveData === true;
    const effectiveType = connection?.effectiveType || '4g';
    const isSlowNetwork = effectiveType === '2g' || effectiveType === '3g';
    
    // Check device memory (in GB, typical low end is < 4)
    const deviceMemory = (navigator as any).deviceMemory || 4;
    const isLowMemory = deviceMemory < 4;

    setIsHardwareCapable(!isSaveData && !isSlowNetwork && !isLowMemory);
  }, []);

  // Initialize Cached URL
  useEffect(() => {
    let mounted = true;
    
    videoCacheService.getCachedVideoUrl(optimizedInitialSrc).then(url => {
      console.log('--- Video Playback Flow Trace ---');
      console.log('Original URL:', src);
      console.log('Optimized URL:', optimizedInitialSrc);
      console.log('Final URL assigned to <video>:', url);
      if (mounted) setCachedUrl(url);
    });

    return () => { mounted = false; };
  }, [src, optimizedInitialSrc]);

  // Analytics Tracking Session
  useEffect(() => {
    const effectivelyActive = isActive !== undefined ? isActive : visibilityRatio > 0.5;
    if (effectivelyActive) {
      videoAnalyticsService.startTracking(videoId);
    } else {
      videoAnalyticsService.stopTracking(videoId);
    }
    return () => videoAnalyticsService.stopTracking(videoId);
  }, [isActive, visibilityRatio, videoId]);

  // Local Visibility Observer (For accurate 70% view tracking)
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setVisibilityRatio(entry.intersectionRatio);
      },
      { threshold: [0, 0.3, 0.7, 1.0] }
    );
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Memory and Network Resource Release
  useEffect(() => {
    const isVisible = visibilityRatio > 0 || (isActive === true);
    if (isVisible && cachedUrl) {
      setActiveSrc(cachedUrl);
    } else {
      setActiveSrc('');
      if (videoRef.current) {
        if (!videoRef.current.paused) videoRef.current.pause();
        videoRef.current.removeAttribute('src');
        videoRef.current.load();
      }
    }
  }, [visibilityRatio, isActive, cachedUrl]);

  // Global Play Lock (Ensure only 1 video plays globally)
  useEffect(() => {
    const handleGlobalPlay = (e: Event) => {
      const target = e.target as HTMLVideoElement;
      if (videoRef.current && target !== videoRef.current && !videoRef.current.paused) {
        videoRef.current.pause();
      }
    };
    document.addEventListener('play', handleGlobalPlay, true);
    return () => document.removeEventListener('play', handleGlobalPlay, true);
  }, []);

  // View Eligibility Loop
  useEffect(() => {
    const effectivelyActive = isActive !== undefined ? isActive : visibilityRatio > 0.5;
    if (effectivelyActive && isPlaying) {
      const recorded = videoAnalyticsService.evaluateViewEligibility(videoId, userId, visibilityRatio, currentTime);
      if (recorded && onViewRecorded) {
        onViewRecorded();
      }
    }
  }, [currentTime, isActive, isPlaying, visibilityRatio, videoId, userId, onViewRecorded]);

  // Strict Sync for Mute State (Crucial for iOS/Safari where React prop 'muted' can lose sync)
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = effectiveMuted;
    }
  }, [effectiveMuted]);

  // Playback Control Logic
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const effectivelyActive = isActive !== undefined ? isActive : visibilityRatio > 0.5;

    if (effectivelyActive && !hasError) {
      // Only attempt autoplay if we are not already playing
      if (video.paused) {
        video.muted = effectiveMuted;
        
        const playPromise = video.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => setIsPlaying(true))
            .catch((error) => {
              console.log("Auto-play prevented", error);
              setIsPlaying(false);
              
              // If we were trying to play unmuted and it failed, the browser likely requires muted autoplay
              if (effectiveMuted === false) {
                console.log("Retrying playback muted due to autoplay policy...");
                video.muted = true;
                
                if (toggleMute) toggleMute(true);
                else {
                  setInternalMuted(true);
                  sessionStorage.setItem('watch_feed_muted', JSON.stringify(true));
                }
                
                video.play()
                  .then(() => setIsPlaying(true))
                  .catch(e => console.log("Still failed to play after muting", e));
              }
            });
        }
      }
    } else {
      if (!video.paused) {
        video.pause();
      }
      setIsPlaying(false);
    }
  }, [isActive, visibilityRatio, hasError]);

  // Memory Cleanup
  useEffect(() => {
    return () => {
      const video = videoRef.current;
      if (video) {
        video.pause();
        video.removeAttribute('src');
        video.load();
      }
    };
  }, []);

  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Video Event Listeners
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      if (video.duration) {
        const pct = (video.currentTime / video.duration) * 100;
        setProgress(pct);

        const state = getAnalyticsState(videoId);
        
        const milestones = [25, 50, 75];
        milestones.forEach(m => {
          if (pct >= m && !state.milestones.has(m)) {
            state.milestones.add(m);
            analytics.track(`video_watch_${m}`, { entity_type: 'video',
              module: "videos",
              entity_id: videoId
            });
          }
        });

        if (pct >= 95 && !state.hasCompleted) {
          state.hasCompleted = true;
          analytics.track("video_completed", { entity_type: 'video',
            module: "videos",
            entity_id: videoId
          });
        }
      }
    };

    const handleProgress = () => {
      if (video.buffered.length > 0) {
        const bufferedEnd = video.buffered.end(video.buffered.length - 1);
        setBufferProgress((bufferedEnd / video.duration) * 100);
      }
    };

    const reportWatchTime = (videoDuration: number) => {
      if (!localPlaySession.current.isPlaying) return;
      const now = Date.now();
      const delta = (now - localPlaySession.current.lastPlayTime) / 1000;
      localPlaySession.current.lastPlayTime = now;
      
      if (delta > 0) {
        const state = getAnalyticsState(videoId);
        const prevAccumulated = state.accumulatedSeconds;
        state.accumulatedSeconds += delta;
        
        const prevBucket = Math.floor(prevAccumulated / 5);
        const currBucket = Math.floor(state.accumulatedSeconds / 5);
        
        if (currBucket > prevBucket) {
          analytics.track("video_watch_time", { entity_type: 'video',
            module: "videos",
            entity_id: videoId,
            metadata: {
              seconds_watched: Math.floor(state.accumulatedSeconds),
              duration: Math.floor(videoDuration || 0)
            }
          });
        }
      }
    };

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
    };

    const handleWaiting = () => {
      setIsBuffering(true);
      videoAnalyticsService.reportEvent(videoId, 'buffer');
      reportWatchTime(video.duration);
      localPlaySession.current.isPlaying = false;
    };
    const handlePlaying = () => {
      setIsBuffering(false);
      setIsPlaying(true);
      videoAnalyticsService.reportEvent(videoId, 'play');

      const state = getAnalyticsState(videoId);
      if (!state.hasStarted) {
        state.hasStarted = true;
        analytics.track("video_watch_start", { entity_type: 'video',
          module: "videos",
          entity_id: videoId
        });
      }
      localPlaySession.current.lastPlayTime = Date.now();
      localPlaySession.current.isPlaying = true;
    };
    const handlePause = () => {
      setIsPlaying(false);
      videoAnalyticsService.reportEvent(videoId, 'pause');
      reportWatchTime(video.duration);
      localPlaySession.current.isPlaying = false;
    };
    
    const handleEnded = () => {
      setIsPlaying(false);
      videoAnalyticsService.reportEvent(videoId, 'complete');
      // Background Cache
      videoCacheService.cacheCompletedVideo(cachedUrl).catch(console.error);
      reportWatchTime(video.duration);
      localPlaySession.current.isPlaying = false;
    };

    const handleError = () => {
      setHasError(true);
      setIsPlaying(false);
      setIsBuffering(false);
      reportWatchTime(video.duration);
      localPlaySession.current.isPlaying = false;
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('progress', handleProgress);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('playing', handlePlaying);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('error', handleError);

    return () => {
      reportWatchTime(video.duration);
      localPlaySession.current.isPlaying = false;
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('progress', handleProgress);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('playing', handlePlaying);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('error', handleError);
    };
  }, [videoId, src]);

  const handleRetry = (e: React.MouseEvent) => {
    e.stopPropagation();
    setHasError(false);
    if (videoRef.current) {
      videoRef.current.load();
      if (isActive) {
        videoRef.current.play().catch(console.error);
      }
    }
  };

  // Keyboard Accessibility
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isActive || !videoRef.current) return;
      const video = videoRef.current;

      switch(e.key.toLowerCase()) {
        case ' ':
          e.preventDefault();
          togglePlay();
          break;
        case 'm':
          e.preventDefault();
          handleMuteToggle();
          break;
        {/* Keyboard shortcut 'f' for fullscreen removed */}
        case 'arrowright':
          e.preventDefault();
          video.currentTime = Math.min(video.currentTime + 5, video.duration);
          break;
        case 'arrowleft':
          e.preventDefault();
          video.currentTime = Math.max(video.currentTime - 5, 0);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isActive, isPlaying, effectiveMuted, toggleMute]);

  const handleMuteToggle = (forceValue?: boolean) => {
    if (toggleMute) {
      toggleMute(forceValue);
    } else {
      setInternalMuted(prev => {
        const next = forceValue !== undefined ? forceValue : !prev;
        sessionStorage.setItem('watch_feed_muted', JSON.stringify(next));
        return next;
      });
    }
    videoAnalyticsService.reportEvent(videoId, effectiveMuted ? 'unmute' : 'mute');
  };

  const handleContainerClick = (e: React.MouseEvent) => {
    if (hasError) return;
    
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;

    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      // Double Tap
      triggerHeartAnimation();
      if (onDoubleTap) onDoubleTap();
    } else {
      // Single Tap - toggle play state like TikTok instead of just controls
      togglePlay();
      setShowControls(true); // Ensure controls remain visible when toggled
    }
    lastTapRef.current = now;
  };

  const triggerHeartAnimation = () => {
    setShowHeart(true);
    setTimeout(() => setShowHeart(false), 800);
  };

  const togglePlay = () => {
    if (!videoRef.current || hasError) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      // If we are at the end, it's a replay
      if (videoRef.current.currentTime >= videoRef.current.duration) {
        videoAnalyticsService.reportEvent(videoId, 'replay');
      }
      videoRef.current.play().catch(e => console.log(e));
    }
  };

        {/* toggleFullscreen logic removed */}

  const togglePiP = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    if (document.pictureInPictureElement) {
      await document.exitPictureInPicture();
    } else {
      await videoRef.current.requestPictureInPicture().catch(console.error);
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (!videoRef.current || !progressContainerRef.current) return;
    
    const rect = progressContainerRef.current.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    const newTime = pos * duration;
    videoRef.current.currentTime = newTime;
  };

  return (
    <div 
      ref={containerRef} 
      className={`relative w-full h-full bg-black overflow-hidden group ${className}`}
      onClick={handleContainerClick}
    >
      {/* 1. Blurred Background Layer (Hardware Capable + Active) */}
      {!hasError && (isActive !== undefined ? isActive : visibilityRatio > 0.5) && isHardwareCapable && (
        <video
          src={cachedUrl}
          className="absolute inset-0 w-full h-full object-cover blur-3xl opacity-40 scale-110 pointer-events-none transform-gpu"
          autoPlay
          muted
          loop
          playsInline
        />
      )}

      {/* 2. Blurred Background Layer (Fallback / Inactive / Save-Data) */}
      {(!(isActive !== undefined ? isActive : visibilityRatio > 0.5) || !isHardwareCapable) && poster && (
        <div 
          className="absolute inset-0 w-full h-full bg-cover bg-center blur-3xl opacity-40 scale-110 pointer-events-none transform-gpu"
          style={{ backgroundImage: `url(${poster})` }}
        />
      )}

      {/* 3. Main Video (object-cover) */}
      {!hasError && (
        <video
          ref={videoRef}
          src={activeSrc || undefined}
          poster={poster}
          preload={preloadType}
          className="absolute inset-0 w-full h-full object-contain z-10 block"
          loop={true} // TikTok style looping
          playsInline
          muted={effectiveMuted}
          autoPlay={isActive !== undefined ? isActive : visibilityRatio > 0.5}
        />
      )}

      {/* Error State Overlay */}
      {hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black z-40">
          <AlertCircle size={48} className="text-red-500 mb-4" />
          <p className="text-white mb-4 text-center px-4">Network error. Unable to load video.</p>
          <button 
            onClick={handleRetry}
            className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-full transition-colors"
          >
            <RefreshCw size={20} />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* Center Buffer & Play Overlay */}
      {!hasError && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
          {isBuffering && isPlaying ? (
            <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin shadow-xl"></div>
          ) : effectiveMuted ? (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                handleMuteToggle(false);
              }}
              className="px-6 py-3 bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center pointer-events-auto text-white hover:bg-black/70 transition-all transform hover:scale-105 animate-pulse shadow-lg"
              aria-label="Tap to Unmute"
            >
              <VolumeX size={24} className="me-2" />
              <span className="font-bold text-sm tracking-wide">Tap to Unmute</span>
            </button>
          ) : null}
        </div>
      )}

      {/* Double Tap Heart Animation */}
      {showHeart && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30 animate-in zoom-in fade-in duration-200 fill-mode-forwards">
          <Heart size={100} className="text-red-500 fill-current animate-pulse opacity-80" />
        </div>
      )}

      {/* Top Right Controls */}
      <div className={`absolute top-4 end-4 z-30 flex flex-col space-y-4 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              handleMuteToggle();
            }}
            className="p-2 bg-black/40 backdrop-blur-md rounded-full text-white hover:bg-black/60 transition"
          >
            {effectiveMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
          </button>
        
        {document.pictureInPictureEnabled && (
          <button 
            onClick={togglePiP}
            className="bg-black/40 p-2 rounded-full backdrop-blur-sm text-white hover:bg-black/60 transition-colors md:flex hidden"
            aria-label="Picture in Picture"
          >
            <PictureInPicture size={20} />
          </button>
        )}
        
        {/* Fullscreen button removed */}
      </div>

      {/* Bottom Overlay - Progress & Time */}
      <div className={`absolute bottom-0 start-0 end-0 z-20 transition-opacity duration-300 pointer-events-auto ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className="flex justify-between items-center px-4 mb-2 text-xs text-white font-medium drop-shadow-md pointer-events-none">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
        
        {/* Progress Bar Container */}
        <div 
          ref={progressContainerRef}
          className="w-full h-1.5 md:h-1 bg-white/20 cursor-pointer relative group-hover:h-2 transition-all duration-200"
          onClick={handleSeek}
        >
          {/* Buffer Bar */}
          <div 
            className="absolute top-0 start-0 h-full bg-white/40 pointer-events-none transition-all duration-200"
            style={{ width: `${bufferProgress}%` }}
          />
          {/* Active Progress Bar */}
          <div 
            className="absolute top-0 start-0 h-full bg-red-500 pointer-events-none transition-all duration-75"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  return prevProps.videoId === nextProps.videoId &&
         prevProps.src === nextProps.src &&
         prevProps.isActive === nextProps.isActive &&
         prevProps.isMuted === nextProps.isMuted &&
         prevProps.poster === nextProps.poster;
});

VideoPlayer.displayName = 'VideoPlayer';

