import { useEffect } from 'react';
import { useNetworkAwareness } from './useNetworkAwareness';
import { videoPreloadManager } from '../services/VideoPreloadManager';

interface PreloadStatus {
  shouldMountVideo: boolean;
  preloadType: 'none' | 'metadata' | 'auto';
}

/**
 * Hook to determine if a video should be mounted and how it should preload.
 * - Enforces max 2 concurrent preloads via VideoPreloadManager.
 * - Prevents memory leaks by unmounting far away videos.
 * - Respects network constraints (Save Data).
 * - Preloads the next 2 videos explicitly.
 */
export const useVideoPreload = (url: string | null, itemIndex: number, activeIndex: number): PreloadStatus => {
  const { isSlowConnection, isSaveData } = useNetworkAwareness();

  useEffect(() => {
    if (!url || isSaveData || isSlowConnection) return;

    // Preload next 2 videos
    const isNextTwo = itemIndex > activeIndex && itemIndex <= activeIndex + 2;
    
    if (isNextTwo) {
      videoPreloadManager.preload(url);
    } else {
      videoPreloadManager.cancel(url);
    }

    // Cleanup pending request on unmount
    return () => {
      videoPreloadManager.cancel(url);
    };
  }, [url, itemIndex, activeIndex, isSaveData, isSlowConnection]);

  // If memory/network is highly constrained, only mount the exact active video
  if (isSaveData) {
    return {
      shouldMountVideo: itemIndex === activeIndex,
      preloadType: 'none'
    };
  }

  // Normal behavior: mount previous, active, and next video (1 ahead, 1 behind)
  const shouldMountVideo = itemIndex >= activeIndex - 1 && itemIndex <= activeIndex + 1;
  
  // Active video loads fully. Next/prev videos should rely on our custom preloader or 'none' to avoid duplicate network calls natively.
  let preloadType: 'none' | 'metadata' | 'auto' = 'none';
  if (itemIndex === activeIndex) {
    preloadType = 'auto';
  } else {
    // Only metadata for adjacent ones so they can calculate aspect ratios quickly, 
    // full video fetch is handled by VideoPreloadManager in the background.
    preloadType = 'metadata';
  }

  return {
    shouldMountVideo,
    preloadType
  };
};
