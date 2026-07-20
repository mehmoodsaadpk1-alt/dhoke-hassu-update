import { useNetworkAwareness } from './useNetworkAwareness';

interface PreloadStatus {
  shouldMountVideo: boolean;
  preloadType: 'none' | 'metadata' | 'auto';
}

/**
 * Hook to determine if a video should be mounted and how it should preload.
 * - Prevents memory leaks by unmounting far away videos.
 * - Respects network constraints (Save Data).
 * - Only preloads max 1 video ahead.
 */
export const useVideoPreload = (itemIndex: number, activeIndex: number): PreloadStatus => {
  const { isSlowConnection, isSaveData } = useNetworkAwareness();

  // If memory/network is highly constrained, only mount the exact active video
  if (isSaveData) {
    return {
      shouldMountVideo: itemIndex === activeIndex,
      preloadType: 'none'
    };
  }

  // Normal behavior: mount previous, active, and next video (1 ahead, 1 behind)
  const shouldMountVideo = itemIndex >= activeIndex - 1 && itemIndex <= activeIndex + 1;
  
  // Active video loads fully, next/prev videos load metadata only, others load nothing
  let preloadType: 'none' | 'metadata' | 'auto' = 'none';
  if (itemIndex === activeIndex) {
    preloadType = 'auto';
  } else if ((itemIndex === activeIndex + 1 || itemIndex === activeIndex - 1) && !isSlowConnection) {
    preloadType = 'metadata';
  }

  return {
    shouldMountVideo,
    preloadType
  };
};
