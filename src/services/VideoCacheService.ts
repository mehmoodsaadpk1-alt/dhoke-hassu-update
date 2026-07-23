export interface CacheConfig {
  maxSizeMB: number;
  maxItemSizeMB: number;
}

/**
 * Independent Cache Service for video assets.
 * Now optimized to rely purely on native HTTP Disk Caching.
 * Eliminates Cache API bloat and memory leaks from ObjectURLs,
 * while natively supporting HTTP Range Requests (scrubbing).
 */
export class VideoCacheService {
  private config: CacheConfig;

  constructor(config: CacheConfig = { maxSizeMB: 50, maxItemSizeMB: 20 }) {
    this.config = config;
  }

  /**
   * Caches a completely watched video in the background by natively fetching it
   * into the browser's HTTP Disk Cache.
   */
  async cacheCompletedVideo(url: string, size?: number, signal?: AbortSignal): Promise<void> {
    if (!url.startsWith('http')) return;

    // Fast-fail if size is known and exceeds limit
    if (size && size > this.config.maxItemSizeMB * 1024 * 1024) return;

    try {
      // Fetch silently in background with force-cache to ensure it hits disk natively
      await fetch(url, { signal, cache: 'force-cache' });
    } catch (err) {
      console.warn('Failed to cache video background:', err);
    }
  }

  /**
   * Generates URL to use for the video element.
   * By returning the original URL natively, the <video> tag natively hits
   * the browser's HTTP disk cache and supports 206 Partial Content range requests.
   */
  async getCachedVideoUrl(originalUrl: string): Promise<string> {
    return originalUrl;
  }
}

export const videoCacheService = new VideoCacheService();
