import React, { useRef, useState, useEffect } from 'react';

interface CustomVideoPlayerProps {
  url: string;
  poster?: string;
  autoPlay?: boolean;
  onDoubleTap?: () => void;
  className?: string;
}

export const CustomVideoPlayer: React.FC<CustomVideoPlayerProps> = ({ 
  url, 
  poster, 
  autoPlay = false, 
  onDoubleTap,
  className = ''
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [isMuted, setIsMuted] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Intersection Observer logic for auto play/pause would go here
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (autoPlay && videoRef.current) {
              videoRef.current.play().catch(e => console.log('Auto-play blocked:', e));
              setIsPlaying(true);
            }
          } else {
            if (videoRef.current) {
              videoRef.current.pause();
              setIsPlaying(false);
            }
          }
        });
      },
      { threshold: 0.6 }
    );

    if (videoRef.current) {
      observer.observe(videoRef.current);
    }

    return () => {
      if (videoRef.current) observer.unobserve(videoRef.current);
    };
  }, [autoPlay]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const current = videoRef.current.currentTime;
      const total = videoRef.current.duration;
      setProgress((current / total) * 100);
    }
  };

  return (
    <div className={`relative bg-black w-full h-full flex justify-center items-center overflow-hidden ${className}`}>
      <video
        ref={videoRef}
        src={url}
        poster={poster}
        muted={isMuted}
        playsInline
        loop
        onTimeUpdate={handleTimeUpdate}
        onClick={togglePlay}
        className="w-full h-full object-cover"
      />
      
      {/* Controls Overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent pointer-events-none flex flex-col justify-end">
        {/* Progress Bar */}
        <div className="w-full h-1 bg-white/30 rounded cursor-pointer pointer-events-auto mt-2">
          <div className="h-full bg-blue-500 rounded" style={{ width: `${progress}%` }}></div>
        </div>
        
        {/* Buttons */}
        <div className="flex justify-between items-center mt-2 pointer-events-auto">
          <button onClick={togglePlay} className="text-white">
            {isPlaying ? 'Pause' : 'Play'}
          </button>
          <button onClick={() => setIsMuted(!isMuted)} className="text-white">
            {isMuted ? 'Unmute' : 'Mute'}
          </button>
        </div>
      </div>
    </div>
  );
};
