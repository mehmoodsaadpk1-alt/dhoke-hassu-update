import { videoService } from './VideoService';

interface ViewTrackingData {
  videoId: string;
  startTime: number;
  totalPlayTime: number;
  hasRecordedView: boolean;
  maxVisiblePercentage: number;
}

export type PlaybackEvent = 
  | 'play'
  | 'pause'
  | 'complete'
  | 'buffer'
  | 'replay'
  | 'fullscreen_enter'
  | 'fullscreen_exit'
  | 'mute'
  | 'unmute';

class VideoAnalyticsService {
  private sessionViews = new Set<string>();
  private activeTracking = new Map<string, ViewTrackingData>();

  /**
   * Initializes tracking for a video when it becomes active in the feed.
   */
  startTracking(videoId: string) {
    if (!this.activeTracking.has(videoId)) {
      this.activeTracking.set(videoId, {
        videoId,
        startTime: Date.now(),
        totalPlayTime: 0,
        hasRecordedView: this.sessionViews.has(videoId),
        maxVisiblePercentage: 0
      });
    }
  }

  /**
   * Cleans up tracking when a video is unmounted or skipped.
   */
  stopTracking(videoId: string) {
    this.activeTracking.delete(videoId);
  }

  /**
   * Reports a playback event to analytics.
   */
  reportEvent(videoId: string, event: PlaybackEvent, metadata?: any) {
    // In a real production app, this would queue events and batch send them to a telemetry endpoint.
    console.debug(`[Video Analytics] ${event} for ${videoId}`, metadata || '');
  }

  /**
   * Evaluates if a view should be recorded based on strict conditions.
   * - ≥70% visible
   * - ≥3 seconds playback
   * - One view per session
   * - Ignore repeated autoplay loops
   */
  evaluateViewEligibility(videoId: string, userId: string | undefined, visibilityRatio: number, currentPlayTime: number): boolean {
    const data = this.activeTracking.get(videoId);
    if (!data) return false;

    if (visibilityRatio > data.maxVisiblePercentage) {
      data.maxVisiblePercentage = visibilityRatio;
    }

    if (!data.hasRecordedView && visibilityRatio >= 0.70 && currentPlayTime >= 3.0) {
      this.recordView(videoId, userId);
      data.hasRecordedView = true;
      return true;
    }
    
    return false;
  }

  private recordView(videoId: string, userId?: string) {
    if (this.sessionViews.has(videoId)) return;

    this.sessionViews.add(videoId);
    
    // Call the actual DB service to increment view count
    videoService.recordView(videoId, userId).catch(e => {
      console.warn('Failed to record view in DB:', e);
      // Remove from session so it can be retried if needed, or leave it to prevent spam
      this.sessionViews.delete(videoId);
    });

    this.reportEvent(videoId, 'view_recorded');
  }
}

export const videoAnalyticsService = new VideoAnalyticsService();
