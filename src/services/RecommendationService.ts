import { videoService } from './VideoService';

export type RankingMode = 'Following' | 'Nearby' | 'Trending' | 'Recent';

export interface FeedOptions {
  limit?: number;
  offset?: number;
  userId?: string;
  mode?: RankingMode;
}

/**
 * Recommendation Engine Service
 * Pluggable architecture ready for ML ranking later.
 */
class RecommendationService {
  async getFeed(options: FeedOptions): Promise<any[]> {
    const limit = options.limit || 5;
    const offset = options.offset || 0;
    const mode = options.mode || 'Recent';
    const userId = options.userId;

    switch (mode) {
      case 'Trending':
        // For trending, we could sort by views/likes
        // Currently fallback to recent until DB materialized views exist
        return this.getRecentFeed(limit, offset, userId);
      case 'Following':
        // Needs a join with 'follows' table
        return this.getRecentFeed(limit, offset, userId);
      case 'Nearby':
        // Needs PostGIS or region matching
        return this.getRecentFeed(limit, offset, userId);
      case 'Recent':
      default:
        return this.getRecentFeed(limit, offset, userId);
    }
  }

  private async getRecentFeed(limit: number, offset: number, userId?: string) {
    // Currently delegates to the base VideoService, but insulates the UI from DB logic
    return videoService.getShortsFeed(limit, offset, userId);
  }
}

export const recommendationService = new RecommendationService();
