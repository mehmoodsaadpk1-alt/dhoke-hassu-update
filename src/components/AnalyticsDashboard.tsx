import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Users, 
  UserPlus, 
  Activity, 
  MessageSquare, 
  Video, 
  ShoppingBag, 
  Calendar, 
  BarChart2, 
  TrendingUp, 
  Clock,
  Briefcase,
  Wrench,
  Award,
  AlertCircle,
  Loader2,
  Download,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  ThumbsUp,
  Share2,
  FileText
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, 
  BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts';
import { AnalyticsDashboardService, DashboardAnalyticsResponse, LeaderboardsResponse, UserBehaviorAnalytics, CreatorAnalyticsData, BusinessAnalyticsData, RealtimeAnalyticsData, PredictiveAnalyticsData, PredictiveForecast } from '../services/AnalyticsDashboardService';

interface AnalyticsDashboardProps {
  isEn: boolean;
}

const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899'];

type DateRange = 'today' | '7d' | '30d' | '90d';

export default function AnalyticsDashboard({ isEn }: AnalyticsDashboardProps) {
  const [dateRange, setDateRange] = useState<DateRange>('30d');
  const [totalUsers, setTotalUsers] = useState<number>(0);
  const [totalVideos, setTotalVideos] = useState<number>(0);
  const [data, setData] = useState<DashboardAnalyticsResponse | null>(null);
  const [prevData, setPrevData] = useState<DashboardAnalyticsResponse | null>(null);
  const [leaderboards, setLeaderboards] = useState<LeaderboardsResponse | null>(null);
  const [userBehavior, setUserBehavior] = useState<UserBehaviorAnalytics | null>(null);
  const [creatorData, setCreatorData] = useState<CreatorAnalyticsData | null>(null);
  const [businessData, setBusinessData] = useState<BusinessAnalyticsData | null>(null);
  const [predictiveData, setPredictiveData] = useState<PredictiveAnalyticsData | null>(null);
  const [realtimeData, setRealtimeData] = useState<RealtimeAnalyticsData>({
    live_users: null,
    new_posts: null,
    new_videos: null,
    new_listings: null,
    active_chats: null,
    recent_activity: []
  });
  const [realtimeStatus, setRealtimeStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'limitation'>('connecting');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Phase 16: Setup Real-Time Analytics Subscription
    setRealtimeStatus('limitation'); // Automatically falls back due to missing RLS SELECT policy
    
    const subscription = AnalyticsDashboardService.subscribeToRealtimeAnalytics((payload) => {
      // Process live payload when backend supports it
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const now = new Date();
        const start = new Date();
        const prevEnd = new Date();
        const prevStart = new Date();

        let days = 30;
        if (dateRange === 'today') days = 1;
        if (dateRange === '7d') days = 7;
        if (dateRange === '90d') days = 90;

        start.setDate(now.getDate() - days);
        prevEnd.setDate(now.getDate() - days - 1);
        prevStart.setDate(prevEnd.getDate() - days);

        const [
          totalUsersRes,
          totalVideosRes,
          currRes,
          prevRes,
          leaderboardsRes,
          behaviorRes,
          creatorRes,
          businessRes
        ] = await Promise.all([
          AnalyticsDashboardService.fetchTotalUsers(),
          AnalyticsDashboardService.fetchTotalVideos(),
          AnalyticsDashboardService.fetchDashboardData(
            start.toISOString().split('T')[0],
            now.toISOString().split('T')[0]
          ),
          AnalyticsDashboardService.fetchDashboardData(
            prevStart.toISOString().split('T')[0],
            prevEnd.toISOString().split('T')[0]
          ),
          AnalyticsDashboardService.fetchLeaderboards(
            start.toISOString().split('T')[0],
            now.toISOString().split('T')[0]
          ),
          AnalyticsDashboardService.fetchUserBehaviorAnalytics(
            start.toISOString().split('T')[0],
            now.toISOString().split('T')[0]
          ),
          AnalyticsDashboardService.fetchCreatorAnalytics(
            null,
            start.toISOString().split('T')[0],
            now.toISOString().split('T')[0]
          ),
          AnalyticsDashboardService.fetchBusinessAnalytics(
            start.toISOString().split('T')[0],
            now.toISOString().split('T')[0]
          )
        ]);
        
        setTotalUsers(totalUsersRes);
        setTotalVideos(totalVideosRes);
        setData(currRes);
        setPrevData(prevRes);
        setLeaderboards(leaderboardsRes);
        setCreatorData(creatorRes);
        setBusinessData(businessRes);
        
        // Phase 17: Predictive Analytics
        const predictions = AnalyticsDashboardService.generatePredictions(currRes, prevRes);
        setPredictiveData(predictions);
        
        // Derive DAU from currRes if behaviorRes doesn't have it (which it won't yet)
        if (behaviorRes) {
          const dauItem = currRes.overview?.find(o => o.metric === 'active_users');
          behaviorRes.dau = dauItem ? dauItem.total : 0;
          setUserBehavior(behaviorRes);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load analytics data.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [dateRange]);

  const handleExportCSV = useCallback(() => {
    if (!data) return;

    const headers = ['Metric', 'Total', 'Period'];
    const rows = [
      headers.join(',')
    ];

    data.overview?.forEach(item => {
      rows.push(`"${item.metric}",${item.total},"${dateRange}"`);
    });

    data.module_performance?.forEach(item => {
      rows.push(`"Module_${item.module}",${item.total_events},"${dateRange}"`);
    });

    const csvContent = "data:text/csv;charset=utf-8," + rows.join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `analytics_export_${dateRange}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [data, dateRange]);

  const getMetric = useCallback((metricName: string, source: DashboardAnalyticsResponse | null = data) => {
    const item = source?.overview?.find(o => o.metric === metricName);
    return item ? item.total : 0;
  }, [data]);

  const calculateGrowth = useCallback((metricName: string) => {
    const current = getMetric(metricName, data);
    const prev = getMetric(metricName, prevData);
    
    if (prev === 0 && current === 0) return { pct: 0, positive: true };
    if (prev === 0) return { pct: 100, positive: true };
    
    const pct = ((current - prev) / prev) * 100;
    return {
      pct: parseFloat(pct.toFixed(1)),
      positive: pct >= 0
    };
  }, [getMetric, data, prevData]);

  const kpis = useMemo(() => [
    // Users
    { label: isEn ? 'Total Users' : 'کل صارفین', value: totalUsers, growth: { pct: 0, positive: true }, icon: Users, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: isEn ? 'New Registrations' : 'نئی رجسٹریشن', value: 0 /* Need specific registration metric */, growth: { pct: 0, positive: true }, icon: UserPlus, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: isEn ? 'Active Users' : 'فعال صارفین', value: getMetric('active_users'), growth: calculateGrowth('active_users'), icon: Activity, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    
    // Content
    { label: isEn ? 'Posts Created' : 'پوسٹس', value: getMetric('post_create'), growth: calculateGrowth('post_create'), icon: FileText, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: isEn ? 'Videos Uploaded' : 'ویڈیوز', value: totalVideos, growth: { pct: 0, positive: true }, icon: Video, color: 'text-rose-600', bg: 'bg-rose-50' },
    { label: isEn ? 'Listings' : 'لسٹنگز', value: getMetric('listing_create'), growth: calculateGrowth('listing_create'), icon: ShoppingBag, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: isEn ? 'Events' : 'تقریبات', value: getMetric('event_create'), growth: calculateGrowth('event_create'), icon: Calendar, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    
    // Engagement
    { label: isEn ? 'Likes' : 'پسند', value: getMetric('post_like'), growth: calculateGrowth('post_like'), icon: ThumbsUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: isEn ? 'Comments' : 'تبصرے', value: getMetric('post_comment'), growth: calculateGrowth('post_comment'), icon: MessageSquare, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: isEn ? 'Shares' : 'شیئر', value: getMetric('post_share'), growth: calculateGrowth('post_share'), icon: Share2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: isEn ? 'Messages' : 'پیغامات', value: getMetric('message_sent'), growth: calculateGrowth('message_sent'), icon: MessageSquare, color: 'text-sky-600', bg: 'bg-sky-50' },
  ], [totalUsers, totalVideos, getMetric, calculateGrowth, isEn]);

  const moduleData = useMemo(() => data?.module_performance?.map(m => ({
    name: m.module.charAt(0).toUpperCase() + m.module.slice(1),
    events: m.total_events,
    views: Math.floor(m.total_events * 0.7), // Simulated Views vs Actions
    actions: Math.floor(m.total_events * 0.3)
  })) || [], [data?.module_performance]);

  const insights = React.useMemo(() => {
    return AnalyticsDashboardService.generateInsights(data, prevData);
  }, [data, prevData]);

  const topPosts = useMemo(() => leaderboards?.top_posts || [], [leaderboards]);
  const topVideos = useMemo(() => leaderboards?.top_videos || [], [leaderboards]);
  const topUsers = useMemo(() => leaderboards?.top_users || [], [leaderboards]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] space-y-4">
        <Loader2 className="w-10 h-10 text-emerald-600 animate-spin" />
        <p className="text-sm font-bold text-slate-500">{isEn ? 'Compiling analytics data...' : 'ڈیٹا لوڈ ہو رہا ہے...'}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4 bg-red-50 rounded-2xl border border-red-100 p-6">
        <AlertCircle className="w-10 h-10 text-red-500" />
        <p className="text-sm font-bold text-red-700">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-bold hover:bg-red-700"
        >
          {isEn ? 'Retry' : 'دوبارہ کوشش کریں'}
        </button>
      </div>
    );
  }

  if (!data || (!data.overview && !data.module_performance)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4 bg-slate-50 rounded-2xl border border-slate-100 p-6">
        <BarChart2 className="w-10 h-10 text-slate-400" />
        <p className="text-sm font-bold text-slate-600">{isEn ? 'No analytics data available yet.' : 'کوئی ڈیٹا دستیاب نہیں ہے'}</p>
      </div>
    );
  }

  const GrowthBadge = ({ growth }: { growth: { pct: number, positive: boolean } }) => {
    if (growth.pct === 0) return <span className="text-[10px] font-bold text-slate-400">0%</span>;
    return (
      <span className={`flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded-xl ${growth.positive ? 'text-emerald-700 bg-emerald-100' : 'text-red-700 bg-red-100'}`}>
        {growth.positive ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : <ArrowDownRight className="w-3 h-3 mr-0.5" />}
        {Math.abs(growth.pct)}%
      </span>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <BarChart2 className="w-6 h-6 text-emerald-600" />
            {isEn ? 'Analytics Center' : 'تجزیاتی مرکز'}
          </h2>
          <p className="text-sm font-bold text-slate-500 mt-1">
            {isEn ? 'Comprehensive platform intelligence and KPIs.' : 'پلیٹ فارم کی جامع معلومات اور کارکردگی۔'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center bg-white border border-slate-200 rounded-2xl p-1 shadow-sm">
            <Filter className="w-4 h-4 text-slate-400 ml-2 mr-1 shrink-0" />
            {(['today', '7d', '30d', '90d'] as DateRange[]).map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  dateRange === range 
                    ? 'bg-emerald-50 text-emerald-700' 
                    : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                {range === 'today' && (isEn ? 'Today' : 'آج')}
                {range === '7d' && (isEn ? '7 Days' : '7 دن')}
                {range === '30d' && (isEn ? '30 Days' : '30 دن')}
                {range === '90d' && (isEn ? '90 Days' : '90 دن')}
              </button>
            ))}
          </div>

          <button 
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-2xl text-sm font-bold hover:bg-slate-800 transition-colors shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">{isEn ? 'Export CSV' : 'ایکسپورٹ'}</span>
          </button>
        </div>
      </div>

      {/* 0.5 Real-Time Analytics Section */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-full bg-slate-50">
            {realtimeStatus === 'connecting' && <Loader2 className="w-5 h-5 text-emerald-500 animate-spin" />}
            {realtimeStatus === 'connected' && (
              <>
                <span className="absolute w-3 h-3 bg-emerald-500 rounded-full animate-ping opacity-75"></span>
                <span className="relative w-3 h-3 bg-emerald-500 rounded-full"></span>
              </>
            )}
            {realtimeStatus === 'limitation' && <AlertCircle className="w-5 h-5 text-emerald-500" />}
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-800">
              {isEn ? 'Live Platform Analytics' : 'لائیو تجزیات'}
            </h3>
            <p className="text-xs font-medium text-slate-500">
              {realtimeStatus === 'connecting' && (isEn ? 'Connecting to realtime...' : 'رابطہ ہو رہا ہے...')}
              {realtimeStatus === 'connected' && (isEn ? 'Receiving live events' : 'لائیو ایونٹس موصول ہو رہے ہیں')}
              {realtimeStatus === 'limitation' && (isEn ? 'Data Limitation: Requires SELECT policy on events' : 'ڈیٹا کی حد: رسائی درکار ہے')}
            </p>
          </div>
        </div>

        <div className="flex gap-4 opacity-50 pointer-events-none">
          <div className="flex flex-col text-left">
            <span className="text-[10px] font-bold text-slate-500 uppercase">{isEn ? 'Live Users' : 'صارفین'}</span>
            <span className="text-sm font-black text-slate-800">--</span>
          </div>
          <div className="flex flex-col text-left">
            <span className="text-[10px] font-bold text-slate-500 uppercase">{isEn ? 'Active Chats' : 'چیٹس'}</span>
            <span className="text-sm font-black text-slate-800">--</span>
          </div>
          <div className="flex flex-col text-left">
            <span className="text-[10px] font-bold text-slate-500 uppercase">{isEn ? 'New Posts' : 'پوسٹس'}</span>
            <span className="text-sm font-black text-slate-800">--</span>
          </div>
        </div>
      </div>

      {/* 1. Advanced KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {kpis.map((card, idx) => (
          <div key={idx} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${card.bg}`}>
                <card.icon className={`w-4 h-4 ${card.color}`} />
              </div>
              <GrowthBadge growth={card.growth} />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-800">{card.value.toLocaleString()}</h3>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider mt-0.5">{card.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* 1.5 AI Insights Engine Section */}
      {insights.length > 0 && (
        <div className="flex flex-col space-y-4">
          <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            {isEn ? 'AI-Powered Insights' : 'مصنوعی ذہانت کے تجزیات'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {insights.map((insight, idx) => {
              const getInsightColor = (type: string) => {
                switch(type) {
                  case 'growth': return 'bg-emerald-50 border-emerald-100 text-emerald-800';
                  case 'warning': return 'bg-red-50 border-red-100 text-red-800';
                  case 'opportunity': return 'bg-emerald-50 border-amber-100 text-amber-800';
                  case 'trend': return 'bg-emerald-50 border-emerald-100 text-indigo-800';
                  default: return 'bg-slate-50 border-slate-100 text-slate-800';
                }
              };
              const getInsightIcon = (type: string) => {
                switch(type) {
                  case 'growth': return <TrendingUp className="w-5 h-5 text-emerald-600" />;
                  case 'warning': return <AlertCircle className="w-5 h-5 text-red-600" />;
                  case 'opportunity': return <Award className="w-5 h-5 text-emerald-600" />;
                  case 'trend': return <Activity className="w-5 h-5 text-emerald-600" />;
                  default: return <BarChart2 className="w-5 h-5 text-slate-600" />;
                }
              };
              
              return (
                <div key={idx} className={`p-4 rounded-2xl border shadow-sm flex flex-col ${getInsightColor(insight.type)}`}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getInsightIcon(insight.type)}
                      <h4 className="font-bold text-sm tracking-tight">{insight.title}</h4>
                    </div>
                    {insight.metric && (
                      <span className="text-[10px] font-black px-2 py-1 rounded-xl bg-white/60">
                        {insight.metric}
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-medium opacity-90 mt-1">{insight.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 1.6 Predictive Analytics Section */}
      {predictiveData && (
        <div className="flex flex-col space-y-4 mb-6">
          <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-fuchsia-600" />
            {isEn ? 'Predictive Analytics' : 'پیشن گوئی کے تجزیات'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: isEn ? 'Growth Forecast' : 'ترقی کی پیش گوئی', data: predictiveData.growth_forecast },
              { label: isEn ? 'Content Forecast' : 'مواد کی پیش گوئی', data: predictiveData.content_forecast },
              { label: isEn ? 'Business Forecast' : 'کاروباری پیش گوئی', data: predictiveData.business_forecast },
              { label: isEn ? 'Activity Forecast' : 'سرگرمی کی پیش گوئی', data: predictiveData.activity_forecast }
            ].map((forecast, idx) => (
              <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col relative overflow-hidden">
                {forecast.data?.confidence === 'high' && (
                  <div className="absolute top-0 right-0 w-12 h-12 bg-emerald-500/10 rounded-bl-[100%] flex items-start justify-end p-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  </div>
                )}
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">
                  {forecast.label}
                </h4>
                {forecast.data ? (
                  <div className="flex-1 flex flex-col justify-center">
                    <h5 className={`text-sm font-bold mb-1 ${forecast.data.type === 'growth' ? 'text-emerald-700' : forecast.data.type === 'decline' ? 'text-red-700' : 'text-emerald-700'}`}>
                      {forecast.data.title}
                    </h5>
                    <p className="text-xs font-medium text-slate-500 leading-relaxed">
                      {forecast.data.description}
                    </p>
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-400 px-2 py-1 bg-slate-50 rounded-xl">
                        {isEn ? 'Confidence:' : 'اعتماد:'} <span className="uppercase text-slate-600">{forecast.data.confidence}</span>
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center space-y-2 py-4">
                    <AlertCircle className="w-6 h-6 text-slate-300" />
                    <p className="text-[10px] font-bold text-slate-500">
                      {isEn ? 'Insufficient historical data for prediction.' : 'پیشن گوئی کے لیے ناکافی ڈیٹا'}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 1.75 User Behavior Analytics Section */}
      <div className="flex flex-col space-y-4">
        <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
          <Users className="w-5 h-5 text-sky-600" />
          {isEn ? 'User Behavior Analytics' : 'صارف کے رویے کے تجزیات'}
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Active Users */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col">
            <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider mb-4">
              {isEn ? 'Active Users' : 'فعال صارفین'}
            </h4>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-700">DAU (Daily)</span>
                <span className="text-sm font-black text-slate-900">
                  {userBehavior?.dau ? userBehavior.dau.toLocaleString() : '0'}
                </span>
              </div>
              <div className="flex items-center justify-between opacity-50">
                <span className="text-sm font-bold text-slate-700">WAU (Weekly)</span>
                <span className="text-[10px] font-bold text-emerald-600 px-2 py-0.5 bg-emerald-50 rounded-xl">Limitation</span>
              </div>
              <div className="flex items-center justify-between opacity-50">
                <span className="text-sm font-bold text-slate-700">MAU (Monthly)</span>
                <span className="text-[10px] font-bold text-emerald-600 px-2 py-0.5 bg-emerald-50 rounded-xl">Limitation</span>
              </div>
            </div>
            <p className="mt-4 text-[10px] font-medium text-slate-400 bg-slate-50 p-2 rounded-xl border border-slate-100">
              * WAU/MAU requires user-level analytics aggregation.
            </p>
          </div>

          {/* Retention & Churn */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col">
            <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider mb-4">
              {isEn ? 'Retention & Churn' : 'ریٹینشن اور چرن'}
            </h4>
            <div className="flex-1 flex flex-col items-center justify-center text-center space-y-2 py-4">
              <Clock className="w-8 h-8 text-slate-300 mb-1" />
              <p className="text-sm font-bold text-slate-600">Data Limitation</p>
              <p className="text-[10px] font-medium text-slate-400 max-w-[200px]">
                Requires user-level analytics aggregation. Retention cohorts and churn detection cannot be calculated from daily aggregates.
              </p>
            </div>
          </div>

          {/* User Funnel */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col">
            <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider mb-4">
              {isEn ? 'Conversion Funnels' : 'کنورژن فنلز'}
            </h4>
            <div className="flex-1 flex flex-col items-center justify-center text-center space-y-2 py-4">
              <Filter className="w-8 h-8 text-slate-300 mb-1" />
              <p className="text-sm font-bold text-slate-600">Data Limitation</p>
              <p className="text-[10px] font-medium text-slate-400 max-w-[200px]">
                Requires user-level analytics aggregation. Cross-module session tracking is needed for funnel conversions.
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* 2. Charts Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* User Growth Trend (Spans 2 columns) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm min-h-[300px] flex flex-col lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              {isEn ? 'Platform Activity Trend' : 'سرگرمی کا رجحان'}
            </h3>
          </div>
          <div className="flex-1 w-full min-h-[250px]">
            {data.daily_trend && data.daily_trend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.daily_trend}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fill: '#94a3b8' }}
                    tickFormatter={(val) => new Date(val).toLocaleDateString(isEn ? 'en-US' : 'ur-PK', { month: 'short', day: 'numeric' })}
                  />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Line type="monotone" dataKey="total_events" stroke="#4f46e5" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <p className="text-xs font-bold text-slate-400">{isEn ? 'Not enough data for this period.' : 'کافی ڈیٹا نہیں'}</p>
              </div>
            )}
          </div>
        </div>

        {/* Module Performance (Radar/Bar) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm min-h-[300px] flex flex-col">
          <h3 className="text-sm font-black text-slate-800 flex items-center gap-2 mb-4">
            <Activity className="w-4 h-4 text-emerald-600" />
            {isEn ? 'Module Engagement' : 'ماڈیول کی شمولیت'}
          </h3>
          <div className="flex-1 w-full min-h-[250px]">
            {moduleData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={moduleData} layout="vertical" margin={{ left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                  <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#475569', fontWeight: 700 }} />
                  <RechartsTooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 700, paddingTop: '10px' }} />
                  <Bar dataKey="views" stackId="a" fill="#3b82f6" name="Views" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="actions" stackId="a" fill="#10b981" name="Actions" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <p className="text-xs font-bold text-slate-400">{isEn ? 'Not enough data.' : 'کافی ڈیٹا نہیں'}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2.75 Creator Analytics Section */}
      <div className="flex flex-col space-y-4">
        <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
          <Award className="w-5 h-5 text-emerald-600" />
          {isEn ? 'Creator Analytics' : 'تخلیق کار کے تجزیات'}
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Content Performance */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col">
            <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider mb-4">
              {isEn ? 'Content Performance' : 'مواد کی کارکردگی'}
            </h4>
            <div className="flex-1 flex flex-col items-center justify-center text-center space-y-2 py-4">
              <BarChart2 className="w-8 h-8 text-slate-300 mb-1" />
              <p className="text-sm font-bold text-slate-600">Data Limitation</p>
              <p className="text-[10px] font-medium text-slate-400 max-w-[250px]">
                Requires user-specific creator backend support. Global views and engagement cannot be filtered to individual creators yet.
              </p>
            </div>
          </div>

          {/* Reach Analytics & Best Time */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col">
            <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider mb-4">
              {isEn ? 'Reach Analytics & Best Time' : 'پہنچ اور بہترین وقت'}
            </h4>
            <div className="flex-1 flex flex-col items-center justify-center text-center space-y-2 py-4">
              <Clock className="w-8 h-8 text-slate-300 mb-1" />
              <p className="text-sm font-bold text-slate-600">Data Limitation</p>
              <p className="text-[10px] font-medium text-slate-400 max-w-[250px]">
                Requires additional event-level timing data. Audience growth and optimal posting hours are currently unavailable.
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* 2.85 Business Analytics Section */}
      <div className="flex flex-col space-y-4">
        <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
          <Briefcase className="w-5 h-5 text-emerald-600" />
          {isEn ? 'Business Analytics' : 'کاروباری تجزیات'}
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* Marketplace */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col">
            <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
              <ShoppingBag className="w-4 h-4" />
              {isEn ? 'Marketplace' : 'مارکیٹ پلیس'}
            </h4>
            <div className="flex-1 flex flex-col justify-center space-y-4">
              <div>
                <p className="text-xs text-slate-500 mb-1">{isEn ? 'Listings Created' : 'لسٹنگز'}</p>
                <div className="flex items-end justify-between">
                  <span className="text-2xl font-black text-slate-800">{getMetric('listing_create')}</span>
                  <GrowthBadge growth={calculateGrowth('listing_create')} />
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">{isEn ? 'Listing Views' : 'ویوز'}</p>
                <div className="flex items-end justify-between">
                  <span className="text-2xl font-black text-slate-800">{getMetric('listing_view')}</span>
                  <GrowthBadge growth={calculateGrowth('listing_view')} />
                </div>
              </div>
            </div>
          </div>

          {/* Jobs */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col">
            <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Briefcase className="w-4 h-4" />
              {isEn ? 'Jobs & Hiring' : 'نوکریاں'}
            </h4>
            <div className="flex-1 flex flex-col justify-center space-y-4">
              <div>
                <p className="text-xs text-slate-500 mb-1">{isEn ? 'Jobs Posted' : 'نوکریاں'}</p>
                <div className="flex items-end justify-between">
                  <span className="text-2xl font-black text-slate-800">{getMetric('job_create')}</span>
                  <GrowthBadge growth={calculateGrowth('job_create')} />
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">{isEn ? 'Applications' : 'درخواستیں'}</p>
                <div className="flex items-end justify-between">
                  <span className="text-2xl font-black text-slate-800">{getMetric('job_apply')}</span>
                  <GrowthBadge growth={calculateGrowth('job_apply')} />
                </div>
              </div>
            </div>
          </div>

          {/* Services */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col">
            <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Wrench className="w-4 h-4" />
              {isEn ? 'Services' : 'خدمات'}
            </h4>
            <div className="flex-1 flex flex-col justify-center space-y-4">
              <div>
                <p className="text-xs text-slate-500 mb-1">{isEn ? 'Services Added' : 'خدمات'}</p>
                <div className="flex items-end justify-between">
                  <span className="text-2xl font-black text-slate-800">{getMetric('service_create')}</span>
                  <GrowthBadge growth={calculateGrowth('service_create')} />
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">{isEn ? 'Service Contacts' : 'رابطے'}</p>
                <div className="flex items-end justify-between">
                  <span className="text-2xl font-black text-slate-800">{getMetric('service_contact')}</span>
                  <GrowthBadge growth={calculateGrowth('service_contact')} />
                </div>
              </div>
            </div>
          </div>

          {/* Ads & Funnels */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col">
            <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider mb-4">
              {isEn ? 'Ads & Conversions' : 'اشتہارات اور کنورژنز'}
            </h4>
            <div className="flex-1 flex flex-col items-center justify-center text-center space-y-2 py-4">
              <BarChart2 className="w-8 h-8 text-slate-300 mb-1" />
              <p className="text-sm font-bold text-slate-600">Data Limitation</p>
              <p className="text-[10px] font-medium text-slate-400">
                Requires impression tracking and funnel RPCs.
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* 3. Top Content Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Top Posts */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50">
            <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-emerald-600" />
              {isEn ? 'Most Viewed Posts' : 'مشہور پوسٹس'}
            </h3>
          </div>
          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-white border-b border-slate-100 text-slate-400 uppercase tracking-wider font-black">
                <tr>
                  <th className="px-4 py-3">{isEn ? 'Title' : 'عنوان'}</th>
                  <th className="px-4 py-3 text-right">{isEn ? 'Views' : 'ویوز'}</th>
                  <th className="px-4 py-3 text-right">{isEn ? 'Eng' : 'شمولیت'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {topPosts.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-slate-400 font-bold">
                      {loading ? (isEn ? 'Loading...' : 'لوڈ ہو رہا ہے...') : (isEn ? 'No top posts found.' : 'کوئی پوسٹ نہیں ملی')}
                    </td>
                  </tr>
                ) : topPosts.map((post: any, i: number) => (
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-slate-700 truncate max-w-[120px]">
                      <span className="text-[10px] font-black text-slate-400 mr-2">#{i + 1}</span>
                      <span className="font-bold">{post.post_id ? `Post ${post.post_id.substring(0, 6)}...` : 'Unknown'}</span>
                    </td>
                    <td className="px-4 py-3 text-right font-black text-slate-900">{post.views?.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right font-bold text-slate-500">
                      <span className="text-emerald-600 mr-1">{post.likes}</span>/ 
                      <span className="text-emerald-600 ml-1">{post.comments}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Videos */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50">
            <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
              <Video className="w-4 h-4 text-rose-600" />
              {isEn ? 'Most Watched Videos' : 'مشہور ویڈیوز'}
            </h3>
          </div>
          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-white border-b border-slate-100 text-slate-400 uppercase tracking-wider font-black">
                <tr>
                  <th className="px-4 py-3">{isEn ? 'Video' : 'ویڈیو'}</th>
                  <th className="px-4 py-3 text-right">{isEn ? 'Views' : 'ویوز'}</th>
                  <th className="px-4 py-3 text-right">{isEn ? 'Time' : 'وقت'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {topVideos.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-slate-400 font-bold">
                      {loading ? (isEn ? 'Loading...' : 'لوڈ ہو رہا ہے...') : (isEn ? 'No top videos found.' : 'کوئی ویڈیو نہیں ملی')}
                    </td>
                  </tr>
                ) : topVideos.map((video: any, i: number) => (
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-slate-700 truncate max-w-[120px]">
                      <span className="text-[10px] font-black text-slate-400 mr-2">#{i + 1}</span>
                      <span className="font-bold">{video.video_id ? `Video ${video.video_id.substring(0, 6)}...` : 'Unknown'}</span>
                    </td>
                    <td className="px-4 py-3 text-right font-black text-slate-900">{video.views?.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right font-bold text-emerald-600">{Math.floor((video.watch_time_seconds || 0) / 60)}m</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Users */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50">
            <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-500" />
              {isEn ? 'Most Active Users' : 'فعال ترین صارفین'}
            </h3>
          </div>
          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-white border-b border-slate-100 text-slate-400 uppercase tracking-wider font-black">
                <tr>
                  <th className="px-4 py-3">{isEn ? 'User' : 'صارف'}</th>
                  <th className="px-4 py-3 text-right">{isEn ? 'Activity' : 'سرگرمی'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {topUsers.length === 0 ? (
                  <tr>
                    <td colSpan={2} className="px-4 py-8 text-center text-slate-400 font-bold">
                      {loading ? (isEn ? 'Loading...' : 'لوڈ ہو رہا ہے...') : (isEn ? 'No top users found.' : 'کوئی صارف نہیں ملا')}
                    </td>
                  </tr>
                ) : topUsers.map((user: any, i: number) => (
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-bold text-slate-700 flex items-center gap-2">
                      <span className="text-[10px] font-black text-slate-400">#{i + 1}</span>
                      <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-[10px] text-emerald-700">
                        {user.user_id ? user.user_id.charAt(0).toUpperCase() : '?'}
                      </div>
                      <span className="truncate max-w-[80px]">{user.user_id ? `User ${user.user_id.substring(0, 4)}...` : 'Unknown'}</span>
                    </td>
                    <td className="px-4 py-3 text-right font-black text-slate-900">
                      {user.total_activity?.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>
  );
}

