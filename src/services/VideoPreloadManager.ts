import { videoCacheService } from './VideoCacheService';

class PreloadManager {
  private activeControllers = new Map<string, AbortController>();
  private queue: string[] = [];
  private activeCount = 0;
  private readonly MAX_CONCURRENT = 2;

  async preload(url: string) {
    if (!url || this.activeControllers.has(url)) return;
    
    // Quick cache check
    if (typeof caches !== 'undefined') {
      try {
        const cache = await caches.open('dh_video_cache_v1');
        const exists = await cache.match(url);
        if (exists) return; // Already cached, no need to preload
      } catch (e) {
        // Ignore cache errors
      }
    }

    if (this.activeCount >= this.MAX_CONCURRENT) {
      if (!this.queue.includes(url)) {
        this.queue.push(url);
      }
      return;
    }

    this.executeFetch(url);
  }

  private async executeFetch(url: string) {
    this.activeCount++;
    const controller = new AbortController();
    this.activeControllers.set(url, controller);

    try {
      await videoCacheService.cacheCompletedVideo(url, undefined, controller.signal);
    } catch (err) {
      // AbortError or network error, ignore
    } finally {
      this.activeControllers.delete(url);
      this.activeCount--;
      this.processQueue();
    }
  }

  private processQueue() {
    if (this.activeCount < this.MAX_CONCURRENT && this.queue.length > 0) {
      const nextUrl = this.queue.shift();
      if (nextUrl) {
        this.executeFetch(nextUrl);
      }
    }
  }

  cancel(url: string) {
    // Remove from queue if waiting
    const index = this.queue.indexOf(url);
    if (index > -1) {
      this.queue.splice(index, 1);
    }
    
    // Abort active fetch if running
    const controller = this.activeControllers.get(url);
    if (controller) {
      controller.abort();
      this.activeControllers.delete(url);
    }
  }

  cancelAll() {
    this.queue = [];
    this.activeControllers.forEach(controller => controller.abort());
    this.activeControllers.clear();
    this.activeCount = 0;
  }
}

export const videoPreloadManager = new PreloadManager();
