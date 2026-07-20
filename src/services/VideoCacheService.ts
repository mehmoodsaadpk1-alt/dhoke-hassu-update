export interface CacheConfig {
  maxSizeMB: number;
  maxItemSizeMB: number;
}

const CACHE_NAME = 'dh_video_cache_v1';
const CACHE_INDEX_KEY = 'dh_video_cache_index';

interface CacheIndexItem {
  url: string;
  size: number;
  timestamp: number;
}

/**
 * Independent LRU Cache Service for video assets.
 * Operates purely in the background so it never blocks playback.
 */
export class VideoCacheService {
  private config: CacheConfig;
  private isSupported: boolean;

  constructor(config: CacheConfig = { maxSizeMB: 50, maxItemSizeMB: 20 }) {
    this.config = config;
    this.isSupported = typeof caches !== 'undefined';
  }

  /**
   * Caches a completely watched video in the background.
   */
  async cacheCompletedVideo(url: string, size?: number): Promise<void> {
    if (!this.isSupported || !url.startsWith('http')) return;

    // Fast-fail if size is known and exceeds limit
    if (size && size > this.config.maxItemSizeMB * 1024 * 1024) return;

    try {
      const cache = await caches.open(CACHE_NAME);
      const exists = await cache.match(url);
      if (exists) {
        // Just update timestamp in LRU index
        await this.updateIndex(url, size || 0);
        return;
      }

      // Fetch silently in background with low priority if possible
      const response = await fetch(url, { cache: 'no-store' }); // Get fresh to cache it
      
      const contentLength = response.headers.get('content-length');
      const actualSize = contentLength ? parseInt(contentLength, 10) : (size || 0);

      if (actualSize > this.config.maxItemSizeMB * 1024 * 1024) {
        return; // Too large to cache
      }

      await cache.put(url, response.clone());
      await this.updateIndex(url, actualSize);
      await this.enforceLRU();
    } catch (err) {
      console.warn('Failed to cache video background:', err);
    }
  }

  /**
   * Generates URL to use for the video element.
   * If it's cached, we can technically serve it from the cache, 
   * but to let native range requests work perfectly, we just return the URL 
   * and rely on the Service Worker (if implemented) or browser HTTP cache.
   * In this simplified direct Cache API usage, we can create an ObjectURL if it's fully cached.
   */
  async getCachedVideoUrl(originalUrl: string): Promise<string> {
    if (!this.isSupported) return originalUrl;

    try {
      const cache = await caches.open(CACHE_NAME);
      const response = await cache.match(originalUrl);
      if (response) {
        // Return object URL for instant load without network
        const blob = await response.blob();
        return URL.createObjectURL(blob);
      }
    } catch (err) {
      console.warn('Failed to retrieve cached video:', err);
    }
    
    return originalUrl;
  }

  private async getIndex(): Promise<CacheIndexItem[]> {
    try {
      const indexStr = localStorage.getItem(CACHE_INDEX_KEY);
      return indexStr ? JSON.parse(indexStr) : [];
    } catch {
      return [];
    }
  }

  private async saveIndex(index: CacheIndexItem[]) {
    localStorage.setItem(CACHE_INDEX_KEY, JSON.stringify(index));
  }

  private async updateIndex(url: string, size: number) {
    const index = await this.getIndex();
    const existing = index.findIndex(i => i.url === url);
    if (existing >= 0) {
      index.splice(existing, 1);
    }
    index.push({ url, size, timestamp: Date.now() });
    await this.saveIndex(index);
  }

  private async enforceLRU() {
    if (!this.isSupported) return;
    
    let index = await this.getIndex();
    let currentTotalSize = index.reduce((acc, item) => acc + item.size, 0);
    const maxSize = this.config.maxSizeMB * 1024 * 1024;

    if (currentTotalSize <= maxSize) return;

    // Sort by oldest first
    index.sort((a, b) => a.timestamp - b.timestamp);
    const cache = await caches.open(CACHE_NAME);

    while (currentTotalSize > maxSize && index.length > 0) {
      const oldest = index.shift();
      if (oldest) {
        await cache.delete(oldest.url);
        currentTotalSize -= oldest.size;
      }
    }

    await this.saveIndex(index);
  }
}

export const videoCacheService = new VideoCacheService();
