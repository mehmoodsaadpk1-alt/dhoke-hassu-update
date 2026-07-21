import { supabase } from '../utils/supabaseClient';

export interface AnalyticsOverviewMetric {
  metric: string;
  total: number;
}

export interface AnalyticsModulePerformance {
  module: string;
  total_events: number;
}

export interface AnalyticsDailyTrend {
  date: string;
  total_events: number;
}

export interface DashboardAnalyticsResponse {
  overview: AnalyticsOverviewMetric[] | null;
  module_performance: AnalyticsModulePerformance[] | null;
  daily_trend: AnalyticsDailyTrend[] | null;
}

export interface TopPost {
  post_id: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  engagement_score: number;
}

export interface TopVideo {
  video_id: string;
  views: number;
  watch_time_seconds: number;
  completion_rate: number;
  likes: number;
  comments: number;
  shares: number;
  engagement_score: number;
}

export interface TopUser {
  user_id: string;
  total_activity: number;
  posts_created: number;
  comments: number;
  messages: number;
  videos_uploaded: number;
  marketplace_activity: number;
  engagement_score: number;
}

export interface LeaderboardDailyResult {
  aggregation_date: string;
  top_posts: TopPost[] | null;
  top_videos: TopVideo[] | null;
  top_users: TopUser[] | null;
}

export interface LeaderboardsResponse {
  top_posts: TopPost[];
  top_videos: TopVideo[];
  top_users: TopUser[];
}

export interface AnalyticsInsight {
  type: 'growth' | 'warning' | 'opportunity' | 'trend';
  title: string;
  description: string;
  metric?: string;
  priority: 'high' | 'medium' | 'low';
}

export interface UserBehaviorAnalytics {
  dau: number | null;
  wau: number | null;
  mau: number | null;
  retention: any | null;
  churn: any | null;
  funnels: any | null;
}

export interface CreatorContentPerformance {
  total_posts: number | null;
  total_videos: number | null;
  total_views: number | null;
  total_engagement: number | null;
  engagement_rate: number | null;
}

export interface CreatorReachAnalytics {
  reach: number | null;
  views_trend: any | null;
  audience_growth: number | null;
}

export interface CreatorAnalyticsData {
  performance: CreatorContentPerformance;
  reach: CreatorReachAnalytics;
  best_posting_time: { days: string[] | null, hours: string[] | null };
  insights: string[];
}

export interface BusinessCategoryStats {
  listings: number | null;
  views: number | null;
  contact_rate: number | null;
}

export interface BusinessAdsStats {
  impressions: number | null;
  clicks: number | null;
  ctr: number | null;
}

export interface BusinessFunnel {
  conversion_rate: number | null;
}

export interface BusinessAnalyticsData {
  marketplace: BusinessCategoryStats;
  jobs: BusinessCategoryStats;
  services: BusinessCategoryStats;
  ads: BusinessAdsStats;
  funnel: BusinessFunnel;
  insights: string[];
}

export interface RealtimeAnalyticsData {
  live_users: number | null;
  new_posts: number | null;
  new_videos: number | null;
  new_listings: number | null;
  active_chats: number | null;
  recent_activity: any[];
}

export interface PredictiveForecast {
  type: 'growth' | 'decline' | 'trend' | 'opportunity';
  title: string;
  description: string;
  confidence: 'high' | 'medium' | 'low';
}

export interface PredictiveAnalyticsData {
  growth_forecast: PredictiveForecast | null;
  content_forecast: PredictiveForecast | null;
  business_forecast: PredictiveForecast | null;
  activity_forecast: PredictiveForecast | null;
}

const analyticsCache = new Map<string, { data: any, timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export class AnalyticsDashboardService {
  /**
   * Fetches the total number of registered users from the profiles table.
   * @returns Total user count
   */
  static async fetchTotalUsers(): Promise<number> {
    const cacheKey = 'total_registered_users';
    const cached = analyticsCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }

    try {
      const { count, error } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.error('Error fetching total users count:', error);
        return 0; // Fallback gracefully
      }

      const total = count || 0;
      analyticsCache.set(cacheKey, { data: total, timestamp: Date.now() });
      return total;
    } catch (err) {
      console.error('Fetch total users failed:', err);
      return 0; // Fallback gracefully
    }
  }

  /**
   * Fetches the total number of uploaded videos from the videos table.
   * @returns Total video count
   */
  static async fetchTotalVideos(): Promise<number> {
    const cacheKey = 'total_uploaded_videos';
    const cached = analyticsCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }

    try {
      const { count, error } = await supabase
        .from('videos')
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.error('Error fetching total videos count:', error);
        return 0; // Fallback gracefully
      }

      const total = count || 0;
      analyticsCache.set(cacheKey, { data: total, timestamp: Date.now() });
      return total;
    } catch (err) {
      console.error('Fetch total videos failed:', err);
      return 0; // Fallback gracefully
    }
  }

  /**
   * Fetches the aggregated dashboard analytics via Supabase RPC.
   * This avoids pulling millions of raw rows to the client.
   * 
   * @param startDate YYYY-MM-DD
   * @param endDate YYYY-MM-DD
   * @returns DashboardAnalyticsResponse
   */
  static async fetchDashboardData(startDate: string, endDate: string): Promise<DashboardAnalyticsResponse> {
    const cacheKey = `dashboard_${startDate}_${endDate}`;
    const cached = analyticsCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }

    try {
      const { data, error } = await supabase.rpc('get_dashboard_analytics', {
        start_date: startDate,
        end_date: endDate
      });

      if (error) {
        console.error('Error fetching dashboard analytics:', error);
        throw new Error(error.message);
      }

      const result = data || {};
      result.overview = result.overview || [];
      result.module_performance = result.module_performance || [];
      result.daily_trend = result.daily_trend || [];
      
      analyticsCache.set(cacheKey, { data: result, timestamp: Date.now() });
      return result as DashboardAnalyticsResponse;
    } catch (err: any) {
      console.error('Analytics dashboard fetch failed:', err);
      throw new Error('Failed to load dashboard data. Please try again.');
    }
  }

  /**
   * Fetches the aggregated dashboard leaderboards via Supabase RPC.
   * Returns the most recent day's valid leaderboard data within the date range.
   * 
   * @param startDate YYYY-MM-DD
   * @param endDate YYYY-MM-DD
   * @returns LeaderboardsResponse
   */
  static async fetchLeaderboards(startDate: string, endDate: string): Promise<LeaderboardsResponse> {
    const cacheKey = `leaderboards_${startDate}_${endDate}`;
    const cached = analyticsCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }

    try {
      const { data, error } = await supabase.rpc('get_dashboard_leaderboards', {
        p_start: startDate,
        p_end: endDate
      });

      if (error) {
        console.error('Error fetching dashboard leaderboards:', error);
        throw new Error(error.message);
      }

      let finalResult: LeaderboardsResponse = { top_posts: [], top_videos: [], top_users: [] };

      if (data && data.length > 0) {
        const results = data as LeaderboardDailyResult[];
        results.sort((a, b) => new Date(b.aggregation_date).getTime() - new Date(a.aggregation_date).getTime());
        
        for (const day of results) {
          if ((day.top_posts && day.top_posts.length > 0) || 
              (day.top_videos && day.top_videos.length > 0) || 
              (day.top_users && day.top_users.length > 0)) {
            finalResult = {
              top_posts: day.top_posts || [],
              top_videos: day.top_videos || [],
              top_users: day.top_users || []
            };
            break;
          }
        }
      }

      analyticsCache.set(cacheKey, { data: finalResult, timestamp: Date.now() });
      return finalResult;
    } catch (err: any) {
      console.error('Leaderboards fetch failed:', err);
      // Fail gracefully for leaderboards to prevent dashboard breaking
      return { top_posts: [], top_videos: [], top_users: [] };
    }
  }

  /**
   * Automatically generates meaningful business insights based on period-over-period data.
   */
  static generateInsights(current: DashboardAnalyticsResponse | null, previous: DashboardAnalyticsResponse | null): AnalyticsInsight[] {
    const insights: AnalyticsInsight[] = [];
    if (!current || !previous) return insights;

    const getMetric = (metricName: string, source: DashboardAnalyticsResponse) => {
      const item = source.overview?.find(o => o.metric === metricName);
      return item ? item.total : 0;
    };

    const calculateGrowth = (currentVal: number, previousVal: number) => {
      if (previousVal === 0 && currentVal === 0) return 0;
      if (previousVal === 0) return 100;
      return ((currentVal - previousVal) / previousVal) * 100;
    };

    const formatMetric = (pct: number) => `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`;

    // 1. User Growth
    const currentUsers = getMetric('active_users', current);
    const prevUsers = getMetric('active_users', previous);
    const userGrowth = calculateGrowth(currentUsers, prevUsers);

    if (userGrowth > 5) {
      insights.push({
        type: 'growth',
        title: 'User growth is improving',
        description: 'Active users have increased compared to the previous period.',
        metric: formatMetric(userGrowth),
        priority: 'high'
      });
    } else if (userGrowth < -5) {
      insights.push({
        type: 'warning',
        title: 'Active users declined',
        description: 'Fewer users were active compared to the previous period.',
        metric: formatMetric(userGrowth),
        priority: 'high'
      });
    }

    // 2. Video Engagement
    const currentVideos = getMetric('video_view', current);
    const prevVideos = getMetric('video_view', previous);
    const videoGrowth = calculateGrowth(currentVideos, prevVideos);

    if (videoGrowth < -10) {
      insights.push({
        type: 'warning',
        title: 'Video engagement dropped',
        description: 'Video views have decreased.',
        metric: formatMetric(videoGrowth),
        priority: 'medium'
      });
    } else if (videoGrowth > 10) {
      insights.push({
        type: 'trend',
        title: 'Video content is popular',
        description: 'Video views are trending upward.',
        metric: formatMetric(videoGrowth),
        priority: 'medium'
      });
    }

    // 3. Marketplace Activity
    // Actually the metric might be listing_create, let's use that.
    const currentMarket = getMetric('listing_create', current);
    const prevMarket = getMetric('listing_create', previous);
    const marketGrowth = calculateGrowth(currentMarket, prevMarket);

    if (marketGrowth > 10) {
      insights.push({
        type: 'opportunity',
        title: 'Marketplace activity is trending upward',
        description: 'Users are creating more marketplace listings.',
        metric: formatMetric(marketGrowth),
        priority: 'medium'
      });
    } else if (marketGrowth < -10) {
      insights.push({
        type: 'trend',
        title: 'Marketplace listings slowing down',
        description: 'Listing creation has dropped compared to the last period.',
        metric: formatMetric(marketGrowth),
        priority: 'low'
      });
    }

    // 4. Community Posting
    const currentPosts = getMetric('post_create', current);
    const prevPosts = getMetric('post_create', previous);
    const postGrowth = calculateGrowth(currentPosts, prevPosts);

    if (postGrowth < -10) {
      insights.push({
        type: 'warning',
        title: 'Community activity needs attention',
        description: 'Post creation rate has dropped noticeably.',
        metric: formatMetric(postGrowth),
        priority: 'high'
      });
    } else if (postGrowth > 10) {
      insights.push({
        type: 'growth',
        title: 'Community engagement is high',
        description: 'Users are creating more posts than before.',
        metric: formatMetric(postGrowth),
        priority: 'low'
      });
    }

    // If no specific insights triggered but data exists, provide a baseline insight
    if (insights.length === 0) {
      insights.push({
        type: 'trend',
        title: 'Stable platform metrics',
        description: 'Platform activity is relatively stable with no major fluctuations.',
        priority: 'low'
      });
    }

    return insights;
  }

  /**
   * Fetches advanced user behavior analytics.
   * Currently, most of these metrics require user-level aggregation 
   * which is not available via the pre-aggregated daily_analytics table.
   * Returns null for metrics that require future backend support.
   */
  static async fetchUserBehaviorAnalytics(startDate: string, endDate: string): Promise<UserBehaviorAnalytics> {
    // In the future, this would call a new RPC like `get_user_behavior_analytics`
    // For now, we return nulls to trigger the professional Data Limitation UI state.
    
    return {
      dau: null, // DAU can be approximated from existing overview if needed by the component
      wau: null,
      mau: null,
      retention: null,
      churn: null,
      funnels: null
    };
  }

  /**
   * Phase 14: Creator Analytics
   * Fetches the specific creator's performance data. 
   * Currently, returns nulls because event-level and user-specific aggregation RPCs don't exist yet.
   */
  static async fetchCreatorAnalytics(userId: string | null, startDate: string, endDate: string): Promise<CreatorAnalyticsData> {
    const data: CreatorAnalyticsData = {
      performance: {
        total_posts: null,
        total_videos: null,
        total_views: null,
        total_engagement: null,
        engagement_rate: null
      },
      reach: {
        reach: null,
        views_trend: null,
        audience_growth: null
      },
      best_posting_time: {
        days: null,
        hours: null
      },
      insights: []
    };
    
    data.insights = this.calculateCreatorInsights(data.performance, data.reach);
    return data;
  }

  static calculateEngagementRate(interactions: number, views: number): number {
    if (views === 0) return 0;
    return (interactions / views) * 100;
  }

  static calculateCreatorInsights(performance: CreatorContentPerformance, reach: CreatorReachAnalytics): string[] {
    const insights: string[] = [];
    if (performance.total_posts === null || performance.total_views === null) {
      insights.push("Requires additional event-level timing data and creator backend support.");
      return insights;
    }
    // Future rule-based insights go here
    return insights;
  }

  /**
   * Phase 16: Real-Time Analytics
   * Sets up a subscription to listen for live platform events.
   * Currently, analytics_events is restricted by RLS (no SELECT policy),
   * meaning the frontend cannot subscribe to changes safely.
   */
  static subscribeToRealtimeAnalytics(callback: (payload: any) => void): { unsubscribe: () => void } {
    // In the future:
    // const channel = supabase.channel('realtime_analytics')
    //   .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'analytics_events' }, callback)
    //   .subscribe();
    // return { unsubscribe: () => { supabase.removeChannel(channel); } };

    return { unsubscribe: () => {} };
  }

  /**
   * Phase 15: Business Analytics
   * Fetches marketplace, jobs, services, and ads analytics.
   * Returns nulls because module-level tracking aggregates aren't built yet.
   */
  static async fetchBusinessAnalytics(startDate: string, endDate: string): Promise<BusinessAnalyticsData> {
    const data: BusinessAnalyticsData = {
      marketplace: { listings: null, views: null, contact_rate: null },
      jobs: { listings: null, views: null, contact_rate: null },
      services: { listings: null, views: null, contact_rate: null },
      ads: { impressions: null, clicks: null, ctr: null },
      funnel: { conversion_rate: null },
      insights: []
    };
    
    data.insights = this.calculateBusinessInsights(data);
    return data;
  }

  static calculateConversionRate(conversions: number, total: number): number {
    if (total === 0) return 0;
    return (conversions / total) * 100;
  }

  static calculateBusinessInsights(data: BusinessAnalyticsData): string[] {
    const insights: string[] = [];
    insights.push("Requires event-level business tracking and backend aggregation support.");
    return insights;
  }

  /**
   * Phase 17: Predictive Analytics
   * Analyzes historical trends without external APIs
   */
  static generatePredictions(curr: DashboardAnalyticsResponse | null, prev: DashboardAnalyticsResponse | null): PredictiveAnalyticsData {
    const data: PredictiveAnalyticsData = {
      growth_forecast: null,
      content_forecast: null,
      business_forecast: null,
      activity_forecast: null
    };

    if (!curr || !prev || !curr.overview || !prev.overview || curr.overview.length === 0 || prev.overview.length === 0) {
      return data;
    }

    data.growth_forecast = this.analyzeHistoricalTrends('active_users', curr, prev);
    data.content_forecast = this.analyzeHistoricalTrends('post_create', curr, prev);
    data.business_forecast = this.analyzeHistoricalTrends('listing_create', curr, prev);
    data.activity_forecast = this.analyzeHistoricalTrends('post_like', curr, prev);

    return data;
  }

  static analyzeHistoricalTrends(metricKey: string, curr: DashboardAnalyticsResponse, prev: DashboardAnalyticsResponse): PredictiveForecast | null {
    const currVal = curr.overview.find(m => m.metric === metricKey)?.total || 0;
    const prevVal = prev.overview.find(m => m.metric === metricKey)?.total || 0;

    // If historical data is insufficient: Do NOT generate predictions
    if (currVal === 0 && prevVal === 0) {
      return null;
    }

    const diff = currVal - prevVal;
    const pct = prevVal > 0 ? (diff / prevVal) * 100 : 100;
    
    let confidence: 'high' | 'medium' | 'low' = 'low';
    if (Math.abs(pct) > 20 && prevVal > 50) confidence = 'high';
    else if (Math.abs(pct) > 5 && prevVal > 10) confidence = 'medium';

    const formattedMetric = metricKey.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase());

    if (diff > 0) {
      return {
        type: 'growth',
        title: `${formattedMetric} is increasing`,
        description: `Projected activity increase based on recent ${Math.abs(Math.round(pct))}% upward trend.`,
        confidence
      };
    } else if (diff < 0) {
      return {
        type: 'decline',
        title: `${formattedMetric} is declining`,
        description: `Recent activity shows a ${Math.abs(Math.round(pct))}% downward momentum.`,
        confidence
      };
    } else {
      return {
        type: 'trend',
        title: `${formattedMetric} is stable`,
        description: "Activity remains consistent with historical averages.",
        confidence
      };
    }
  }
}
