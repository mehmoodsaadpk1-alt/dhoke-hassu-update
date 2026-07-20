import { dbTrackAdImpression, dbTrackAdClick, dbTrackAdView } from './supabaseClient';

// Cache to prevent duplicate tracking during the same page view session
const trackedImpressions = new Set<string>();
const trackedViews = new Set<string>();

// Broadcast helper for real-time UI updates
export function broadcastAnalyticsUpdate(adId: string, type: 'impression' | 'view' | 'click') {
  window.dispatchEvent(new CustomEvent('ad-analytics-update', {
    detail: { adId, type }
  }));
}

/**
 * Reusable Advertisement Analytics Service
 */
export const adAnalytics = {
  /**
   * Tracks an impression immediately when the ad is rendered/visible
   */
  async recordImpression(adId: string): Promise<void> {
    if (!adId || trackedImpressions.has(adId)) return;
    
    // Mark as tracked locally to prevent duplicate requests
    trackedImpressions.add(adId);

    try {
      await dbTrackAdImpression(adId);
      broadcastAnalyticsUpdate(adId, 'impression');
    } catch (err) {
      console.error(`Failed to record impression for ad ${adId}:`, err);
    }
  },

  /**
   * Tracks a view when the ad remains visible for at least 2 seconds
   */
  async recordView(adId: string): Promise<void> {
    if (!adId || trackedViews.has(adId)) return;

    // Mark as tracked locally to prevent duplicate requests
    trackedViews.add(adId);

    try {
      await dbTrackAdView(adId);
      broadcastAnalyticsUpdate(adId, 'view');
    } catch (err) {
      console.error(`Failed to record view for ad ${adId}:`, err);
    }
  },

  /**
   * Tracks a click when the user clicks the CTA, opens the ad, or opens the lightbox viewer
   */
  async recordClick(adId: string): Promise<void> {
    if (!adId) return;

    try {
      await dbTrackAdClick(adId);
      broadcastAnalyticsUpdate(adId, 'click');
    } catch (err) {
      console.error(`Failed to record click for ad ${adId}:`, err);
    }
  },

  /**
   * Helper to track image zoom engagement (analytics event)
   */
  trackZoomEngagement(adId: string, title: string): void {
    console.log(`[Analytics] Image zoom engagement recorded for ad: ${title} (ID: ${adId})`);
    // Broadcast for engagement updates
    broadcastAnalyticsUpdate(adId, 'view');
  }
};
