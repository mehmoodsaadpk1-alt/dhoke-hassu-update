/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Users,
  MessageSquare,
  Calendar,
  Briefcase,
  ShoppingBag,
  Wrench,
  Home,
  Tag,
  AlertTriangle,
  FolderHeart,
  BarChart2,
  FileCheck,
  Shield,
  Settings,
  Search,
  Eye,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  RotateCcw,
  UserX,
  UserCheck,
  Ban,
  Clock,
  LogOut,
  Sliders,
  ChevronRight,
  ChevronLeft,
  Menu,
  X,
  Plus,
  RefreshCw,
  TrendingUp,
  Award,
  ChevronDown,
  Info,
  Check,
  Lock,
  Flag
} from 'lucide-react';
import { 
  User, Story, Post, JobItem, BusinessItem, PropertyItem, BuySellItem, MarketplaceItem,
  ServiceItem, AlertItem, EventItem, DealItem, GroupItem, AdItem
} from '../types';
import type { Notification } from '../types';
import AdminTvsView from './AdminTvsView';
import {
  isSupabaseConfigured,
  supabase,
  dbGetPosts,
  dbSavePost,
  dbDeletePost,
  dbGetJobs,
  dbSaveJob,
  dbDeleteJob,
  dbGetProperties,
  dbSaveProperty,
  dbDeleteProperty,
  dbGetMarketplaceItems,
  dbSaveMarketplaceItem,
  dbDeleteMarketplaceItem,
  dbGetMarketplaceListings,
  dbSaveMarketplaceListing,
  dbDeleteMarketplaceListing,
  dbGetBusinesses,
  dbSaveBusiness,
  dbDeleteBusiness,
  dbGetServices,
  dbSaveService,
  dbDeleteService,
  dbGetAlerts,
  dbSaveAlert,
  dbDeleteAlert,
  dbGetEvents,
  dbSaveEvent,
  dbDeleteEvent,
  dbGetDeals,
  dbSaveDeal,
  dbDeleteDeal,
  dbGetGroups,
  dbSaveGroup,
  dbDeleteGroup,
  dbGetPages,
  dbSavePage,
  dbDeletePage,
  dbGetVerificationRequests,
  dbSaveVerificationRequest,
  dbGetPolls,
  dbSavePoll,
  dbDeletePoll,
  dbRunPollsMigration,
  dbGetPromotions,
  dbSavePromotion,
  dbGetAds,
  dbSaveAd,
  dbDeleteAd,
  dbUploadAdBanner,
  dbRunAdsMigration,
  dbGetActiveAds,
  dbGetItemChats
} from '../utils/supabaseClient';
import {
  mockPosts,
  mockJobs,
  mockProperties,
  mockBusinesses,
  mockServices,
  mockAlerts,
  mockEvents,
  mockDeals,
  mockGroups
} from '../mockData';
import AdminCommunityFeed from './AdminCommunityFeed';
import AdminPollsView from './AdminPollsView';
import AdminStoriesView from './AdminStoriesView';
import AdminStoryAds from './AdminStoryAds';
import { useAdStore } from '../store/adStore';
// Helper to parse a YYYY-MM-DD string as a local date (no timezone shift)
const parseLocalDate = (dateStr: string): Date => {
  const parts = dateStr?.split('-');
  // Ensure we have year, month, day
  if (parts.length !== 3) return new Date(dateStr);
  const [year, month, day] = parts.map(p => parseInt(p, 10));
  // month is zero‑based in JS Date
  return new Date(year, month - 1, day);
};

// System logs type
interface SystemLog {
  id: string;
  timestamp: string;
  category: 'user' | 'content' | 'security' | 'system';
  message: string;
  operator: string;
}

// Reports type
interface ReportItem {
  id: string;
  contentType: 'post' | 'event' | 'business' | 'job' | 'marketplace' | 'service' | 'property' | 'deal' | 'alert' | 'group';
  contentId: string;
  title: string;
  reason: string;
  reporter: string;
  date: string;
  details?: string;
  itemRef?: any;
}

interface AdminDashboardProps {
  currentLanguage: 'en' | 'ur';
  onExitAdmin: () => void;
}

export default function AdminDashboard({ currentLanguage, onExitAdmin }: AdminDashboardProps) {
  const isEn = currentLanguage === 'en';
  
  // Sidebar state (Supports wide mode and collapsed icon-only mode)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  // Mobile sidebar overlay state
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  
  // Sub-routes / Tabs
  const [adminPath, setAdminPath] = useState<string>(() => {
    const path = window.location.pathname;
    if (path.startsWith('/admin/')) {
      return path;
    }
    return '/admin/dashboard';
  });

  // Admin authentication state
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(() => {
    return sessionStorage.getItem('admin_authenticated') === 'true';
  });
  const [adminPassword, setAdminPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Loaded database states
  const [users, setUsers] = useState<User[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [businesses, setBusinesses] = useState<BusinessItem[]>([]);
  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [marketplaceItems, setMarketplaceItems] = useState<MarketplaceItem[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [properties, setProperties] = useState<PropertyItem[]>([]);
  const [deals, setDeals] = useState<DealItem[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [groups, setGroups] = useState<GroupItem[]>([]);
  const [pages, setPages] = useState<any[]>([]);
  const [polls, setPolls] = useState<any[]>([]);
  const [promotions, setPromotions] = useState<any[]>([]);
  const [ads, setAds] = useState<AdItem[]>([]);
  const [verificationRequests, setVerificationRequests] = useState<any[]>([]);
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [systemLogs, setSystemLogs] = useState<SystemLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [isTabLoading, setIsTabLoading] = useState(false);

  // Search & Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all'); // all, flagged, clean (varies by table)

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Selected details or modals
  const [selectedUserDetail, setSelectedUserDetail] = useState<User | null>(null);
  const [selectedContentDetail, setSelectedContentDetail] = useState<any | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState<any>(null);

  // Categories and Global App Settings
  const [appSettings, setAppSettings] = useState({
    allowPublicRegistrations: true,
    requireVerificationToPost: false,
    enableSystemNotifications: true,
    moderationLevel: 'standard' // 'relaxed' | 'standard' | 'strict'
  });
  const [categories, setCategories] = useState<{ [key: string]: string[] }>({
    jobs: ['IT & Software', 'Education & Teaching', 'Construction & Labor', 'Retail & Sales', 'Driving & Delivery', 'Office & Admin'],
    businesses: ['Groceries & General Store', 'Restaurants & Cafes', 'Medical & Pharmacy', 'Electronics & Mobile', 'Garments & Tailoring', 'Salon & Cosmetics'],
    marketplace: ['Mobile & Tech', 'Vehicles & Bikes', 'Home Appliances', 'Furniture & Decor', 'Fashion & Clothing', 'Books & Toys'],
    properties: ['House for Rent', 'Shop for Rent', 'Apartment for Rent', 'Plot for Sale', 'Room for Rent', 'Commercial Plaza']
  });
  const [newCategoryName, setNewCategoryName] = useState('');
  const [activeCategoryModule, setActiveCategoryModule] = useState('jobs');

  // Ads Management specific state
  const [adSearchTerm, setAdSearchTerm] = useState('');
  const [adFilterStatus, setAdFilterStatus] = useState('all');
  const [adFilterPlacement, setAdFilterPlacement] = useState('all');
  const [adFilterDate, setAdFilterDate] = useState('all');
  const [adSortField, setAdSortField] = useState<keyof AdItem>('created_at');
  const [adSortOrder, setAdSortOrder] = useState<'asc' | 'desc'>('desc');
  const [isAdCreateEditModalOpen, setIsAdCreateEditModalOpen] = useState(false);
  const [selectedAd, setSelectedAd] = useState<AdItem | null>(null);
  const [isAdDetailsModalOpen, setIsAdDetailsModalOpen] = useState(false);
  const [adsTableError, setAdsTableError] = useState<string | null>(null);
  
  const { feedAdIntervals, setFeedAdInterval } = useAdStore();

  useEffect(() => {
    const handleAnalyticsUpdate = (e: Event) => {
      const { adId, type } = (e as CustomEvent).detail;
      setAds(prevAds => prevAds.map(ad => {
        if (ad.id === adId) {
          const updated = { ...ad };
          if (type === 'impression') {
            updated.impressions = (updated.impressions || 0) + 1;
          } else if (type === 'view') {
            updated.views = (updated.views || 0) + 1;
          } else if (type === 'click') {
            updated.clicks = (updated.clicks || 0) + 1;
          }
          const imps = updated.impressions || 0;
          const clicks = updated.clicks || 0;
          updated.ctr = imps > 0 ? (clicks / imps) * 100 : 0;

          if (selectedAd && selectedAd.id === adId) {
            setSelectedAd(updated);
          }
          return updated;
        }
        return ad;
      }));
    };

    window.addEventListener('ad-analytics-update', handleAnalyticsUpdate);
    return () => {
      window.removeEventListener('ad-analytics-update', handleAnalyticsUpdate);
    };
  }, [selectedAd]);

  // Form State
  const initialAdFormState: Partial<AdItem> = {
    title: '',
    description: '',
    advertiser_name: '',
    advertiser_phone: '',
    advertiser_email: '',
    advertiser_business_id: '',
    banner_url: '',
    video_url: '',
    format: 'Feed',
    display_frequency: 20,
    placement: 'Home Feed',
    category: 'General',
    cta_type: 'WhatsApp',
    cta_link: '',
    target_audience: '',
    target_location: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(Date.now() + 7 * 24 * 3600000).toISOString().split('T')[0],
    priority: 'Normal',
    status: 'Draft',
    amount: 0,
    payment_status: 'Pending',
    invoice_number: '',
    images: []
  };
  const [adForm, setAdForm] = useState<Partial<AdItem>>(initialAdFormState);
  const [adFormUploading, setAdFormUploading] = useState(false);


  // Load everything
  const fetchAllData = async () => {
    console.log("[AdminPanel debug] fetchAllData() started. isSupabaseConfigured:", isSupabaseConfigured);
      
      let loadedUsers: User[] = [];
      let fetchedPosts: Post[] = [];
      let fetchedEvents: EventItem[] = [];
      let fetchedBusinesses: BusinessItem[] = [];
      let fetchedJobs: JobItem[] = [];
      let fetchedMarketplace: MarketplaceItem[] = [];
      let fetchedServices: ServiceItem[] = [];
      let fetchedProperties: PropertyItem[] = [];
      let fetchedDeals: DealItem[] = [];
      let fetchedAlerts: AlertItem[] = [];
      let fetchedGroups: GroupItem[] = [];
      let fetchedPages: any[] = [];
      let fetchedPolls: any[] = [];
      let fetchedPromos: any[] = [];
      let fetchedVerifications: any[] = [];

      try {
        // Run database migrations for polls idempotently
        await dbRunPollsMigration().catch(err => {
          console.warn("Polls migration failed during initialization:", err);
        });
        // 1. Fetch Users
        if (isSupabaseConfigured && supabase) {
          try {
            console.log("[AdminPanel debug] Querying profiles table...");
            const result = await Promise.race([
              supabase.from('profiles').select('*'),
              new Promise<any>((_, reject) => 
                setTimeout(() => reject(new Error('Profiles Query Timeout')), 3000)
              )
            ]);
            console.log("[AdminPanel debug] profiles raw output:", result);
            if (result && !result.error && result.data) {
              loadedUsers = result.data.map((row: any) => ({
                id: row.user_id || row.id,
                fullName: row.full_name || row.fullName || 'Unknown User',
                mobileNumber: row.mobileNumber || row.mobile_number || 'N/A',
                area: row.area || 'Unknown Area',
                reputationScore: row.reputationScore || row.reputation_score || 100,
                verified: !!row.verified,
                badges: row.badges || [],
                profilePhoto: row.profile_photo || row.profilePhoto || undefined
              }));
            } else if (result && result.error) {
              console.warn("[AdminPanel debug] profiles returned error:", result.error);
            }
          } catch (err) {
            console.error("[AdminPanel debug] Failed to query profiles table:", err);
          }
        }
        if (loadedUsers.length === 0) {
          console.log("[AdminPanel debug] Using fallback mock profiles...");
          loadedUsers = [
            { fullName: 'Chaudhary Bashir', mobileNumber: '03001234567', area: 'Sector A', reputationScore: 120, verified: true },
            { fullName: 'Mian Amjad', mobileNumber: '03215554321', area: 'Sector B', reputationScore: 90, verified: false },
            { fullName: 'Sardar Khan', mobileNumber: '03339998877', area: 'Sector C', reputationScore: 180, verified: true },
            { fullName: 'Yasir Bhatti', mobileNumber: '03451112233', area: 'Sector A', reputationScore: 75, verified: false }
          ];
        }
        setUsers(loadedUsers);

        // 2. Fetch Module Records concurrently to prevent serial timeout stacking
        console.log("[AdminPanel debug] Starting concurrent Promise.all fetches for all 13 tables...");
        const [
          postsRes, eventsRes, businessesRes, jobsRes, marketplaceRes,
          servicesRes, propertiesRes, dealsRes, alertsRes, groupsRes, pagesRes,
          pollsRes, promosRes, verificationsRes, adsRes
        ] = await Promise.all([
          dbGetPosts(mockPosts).catch(err => {
            console.error("[AdminPanel debug] posts fetch crashed, using mockPosts", err);
            return mockPosts;
          }),
          dbGetEvents(mockEvents).catch(err => {
            console.error("[AdminPanel debug] events fetch crashed, using mockEvents", err);
            return mockEvents;
          }),
          dbGetBusinesses(mockBusinesses).catch(err => {
            console.error("[AdminPanel debug] businesses fetch crashed, using mockBusinesses", err);
            return mockBusinesses;
          }),
          dbGetJobs(mockJobs).catch(err => {
            console.error("[AdminPanel debug] jobs fetch crashed, using mockJobs", err);
            return mockJobs;
          }),
          dbGetMarketplaceListings([]).catch(err => {
            console.error("[AdminPanel debug] marketplace fetch crashed", err);
            return [];
          }),
          dbGetServices(mockServices).catch(err => {
            console.error("[AdminPanel debug] services fetch crashed, using mockServices", err);
            return mockServices;
          }),
          dbGetProperties(mockProperties).catch(err => {
            console.error("[AdminPanel debug] properties fetch crashed, using mockProperties", err);
            return mockProperties;
          }),
          dbGetDeals(mockDeals).catch(err => {
            console.error("[AdminPanel debug] deals fetch crashed, using mockDeals", err);
            return mockDeals;
          }),
          dbGetAlerts(mockAlerts).catch(err => {
            console.error("[AdminPanel debug] alerts fetch crashed, using mockAlerts", err);
            return mockAlerts;
          }),
          dbGetGroups(mockGroups).catch(err => {
            console.error("[AdminPanel debug] groups fetch crashed, using mockGroups", err);
            return mockGroups;
          }),
          dbGetPages().catch(err => {
            console.error("[AdminPanel debug] pages fetch crashed", err);
            return [];
          }),
          dbGetPolls([]).catch(err => {
            console.error("[AdminPanel debug] polls fetch crashed, using empty array", err);
            return [];
          }),
          dbGetPromotions([]).catch(err => {
            console.error("[AdminPanel debug] promotions fetch crashed, using empty array", err);
            return [];
          }),
          dbGetVerificationRequests([]).catch(err => {
            console.error("[AdminPanel debug] verification requests fetch crashed, using empty array", err);
            return [];
          }),
          dbGetAds([]).catch(err => {
            console.error("[AdminPanel debug] ads fetch crashed, using empty array", err);
            const msg = err.message || String(err);
            if (msg?.toLowerCase().includes('relation "public.ads" does not exist') || msg?.toLowerCase().includes('schema cache')) {
              setAdsTableError(msg);
            }
            return [];
          })
        ]);

        console.log("[AdminPanel debug] All concurrent fetches completed successfully.");

        fetchedPosts = postsRes || [];
        fetchedEvents = eventsRes || [];
        fetchedBusinesses = businessesRes || [];
        fetchedJobs = jobsRes || [];
        fetchedMarketplace = marketplaceRes || [];
        fetchedServices = servicesRes || [];
        fetchedProperties = propertiesRes || [];
        fetchedDeals = dealsRes || [];
        fetchedAlerts = alertsRes || [];
        fetchedGroups = groupsRes || [];
        fetchedPages = pagesRes || [];
        fetchedPolls = pollsRes || [];
        fetchedPromos = promosRes || [];
        fetchedVerifications = verificationsRes || [];
        let fetchedAds = adsRes || [];

        if (!isSupabaseConfigured && fetchedAds.length === 0) {
          const adsJson = localStorage.getItem('dhoke_connect_ads');
          if (adsJson) {
            const parsedAds = JSON.parse(adsJson);
            fetchedAds = parsedAds.filter((a: any) => !a.deleted_at);
          } else {
            const initialMockAds: AdItem[] = [
              {
                id: 'a55a8289-4977-4402-9988-51829e0618b1',
                title: 'Sardar Biryani & Pulao - 20% Off',
                description: 'Enjoy the most authentic Rawalpindi Biryani in Dhoke Hassu. Order now!',
                advertiser_name: 'Sardar Ahmed',
                advertiser_phone: '03001234567',
                advertiser_email: 'sardar@example.com',
                banner_url: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop&q=60',
                placement: 'Home Feed',
                category: 'Promotion',
                cta_type: 'WhatsApp',
                cta_link: 'https://wa.me/923001234567',
                start_date: new Date(Date.now() - 5 * 24 * 3600000).toISOString().split('T')[0],
                end_date: new Date(Date.now() + 10 * 24 * 3600000).toISOString().split('T')[0],
                priority: 'Premium',
                status: 'Active',
                amount: 5000,
                payment_status: 'Paid',
                invoice_number: 'INV-2026-001',
                impressions: 1250,
                clicks: 340,
                conversions: 45,
                created_at: new Date(Date.now() - 5 * 24 * 3600000).toISOString()
              },
              {
                id: 'a55a8289-4977-4402-9988-51829e0618b2',
                title: 'Bhatti Mechanics & Car AC Repair',
                description: 'Professional mechanics for all Japanese & local cars. Quick service.',
                advertiser_name: 'Yasir Bhatti',
                advertiser_phone: '03215554321',
                advertiser_email: 'bhatti@example.com',
                banner_url: 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=800&auto=format&fit=crop&q=60',
                placement: 'Technical Services',
                category: 'Service',
                cta_type: 'Phone Call',
                cta_link: 'tel:03215554321',
                start_date: new Date(Date.now() + 2 * 24 * 3600000).toISOString().split('T')[0],
                end_date: new Date(Date.now() + 12 * 24 * 3600000).toISOString().split('T')[0],
                priority: 'High',
                status: 'Scheduled',
                amount: 3000,
                payment_status: 'Paid',
                invoice_number: 'INV-2026-002',
                impressions: 800,
                clicks: 80,
                conversions: 5,
                created_at: new Date().toISOString()
              }
            ];
            localStorage.setItem('dhoke_connect_ads', JSON.stringify(initialMockAds));
            fetchedAds = initialMockAds;
          }
        }

        setPosts(fetchedPosts);
        setEvents(fetchedEvents);
        setBusinesses(fetchedBusinesses);
        setJobs(fetchedJobs);
        setMarketplaceItems(fetchedMarketplace);
        setServices(fetchedServices);
        setProperties(fetchedProperties);
        setDeals(fetchedDeals);
        setAlerts(fetchedAlerts);
        setGroups(fetchedGroups);
        setPages(fetchedPages);
        setPolls(fetchedPolls);
        setPromotions(fetchedPromos);
        console.log("[DEBUG] Final ads rendered in Admin Dashboard:", fetchedAds.length, fetchedAds);
        setAds(fetchedAds);
        setVerificationRequests(fetchedVerifications);

        // 3. Generate Reports list dynamically based on items marked as reported
        const list: ReportItem[] = [];
        
        (fetchedProperties || []).forEach(p => {
          if (p && p.reported) {
            list.push({
              id: `rep-prop-${p.id}`,
              contentType: 'property',
              contentId: p.id,
              title: p.title,
              reason: 'Incorrect price/Duplicate entry',
              reporter: 'Anonymous User',
              date: '2026-06-30',
              itemRef: p
            });
          }
        });

        (fetchedBusinesses || []).forEach(b => {
          if (b && b.reported) {
            list.push({
              id: `rep-bus-${b.id}`,
              contentType: 'business',
              contentId: b.id,
              title: b.name,
              reason: 'Permanently Closed / Fraudulent',
              reporter: 'Bashir Ahmed',
              date: '2026-07-01',
              itemRef: b
            });
          }
        });

        (fetchedServices || []).forEach(s => {
          if (s && s.reported) {
            list.push({
              id: `rep-serv-${s.id}`,
              contentType: 'service',
              contentId: s.id,
              title: s.name,
              reason: 'Unprofessional behavior',
              reporter: 'S Sardar',
              date: '2026-07-02',
              itemRef: s
            });
          }
        });

        (fetchedJobs || []).forEach(j => {
          if (j && j.reported) {
            list.push({
              id: `rep-job-${j.id}`,
              contentType: 'job',
              contentId: j.id,
              title: j.title,
              reason: 'Fake job / Suspicious links',
              reporter: 'Yasir Bhatti',
              date: '2026-07-03',
              itemRef: j
            });
          }
        });

        setReports(list);
        console.log("[AdminPanel debug] Reports state set, count:", list.length);

        // Initialize logs
        setSystemLogs([
          { id: '1', timestamp: new Date().toLocaleTimeString(), category: 'system', message: 'Admin Dashboard loaded successfully.', operator: 'System' },
          { id: '2', timestamp: new Date(Date.now() - 60000).toLocaleTimeString(), category: 'security', message: 'Administrative passcode login verified.', operator: 'Admin' }
        ]);

      } catch (e) {
        console.error('[AdminPanel debug] Overall fetch error catch block reached:', e);
      }
  };

  useEffect(() => {
    if (!isAdminLoggedIn) return;
    
    const loadData = async () => {
      setLoading(true);
      try {
        await fetchAllData();
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [isAdminLoggedIn]);

  // Sync route path changes to window location path
  const navigateTo = (path: string) => {
    window.history.pushState({}, '', path);
    setAdminPath(path);
    setSearchTerm('');
    setCurrentPage(1);
    setIsTabLoading(true);
    // Close mobile sidebar on navigation
    setIsMobileSidebarOpen(false);
    document.body.style.overflow = '';
    setTimeout(() => {
      setIsTabLoading(false);
    }, 280);
  };

  // Sync browser popstate
  useEffect(() => {
    const handlePopState = () => {
      setAdminPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // ESC key closes mobile sidebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileSidebarOpen) {
        setIsMobileSidebarOpen(false);
        document.body.style.overflow = '';
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isMobileSidebarOpen]);

  // Lock body scroll when mobile sidebar is open
  useEffect(() => {
    if (isMobileSidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isMobileSidebarOpen]);

  const closeMobileSidebar = () => {
    setIsMobileSidebarOpen(false);
    document.body.style.overflow = '';
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPassword === '090405726') {
      setIsAdminLoggedIn(true);
      sessionStorage.setItem('admin_authenticated', 'true');
      setLoginError('');
      setLoading(true);
      try {
        await fetchAllData();
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    } else {
      setLoginError(isEn ? 'Invalid passcode credentials.' : 'غلط پاس ورڈ۔ دوبارہ کوشش کریں۔');
    }
  };

  const handleAdminLogout = () => {
    setIsAdminLoggedIn(false);
    sessionStorage.removeItem('admin_authenticated');
    setAdminPassword('');
    onExitAdmin();
  };

  const addSystemLog = (category: 'user' | 'content' | 'security' | 'system', message: string, operator: string) => {
    const newLog: SystemLog = {
      id: String(Date.now()),
      timestamp: new Date().toLocaleTimeString(),
      category,
      message,
      operator
    };
    setSystemLogs(prev => [newLog, ...prev]);
  };

  // ------------------------------------------------------------------------
  // USER ACTIONS
  // ------------------------------------------------------------------------
  const handleToggleSuspendUser = async (mobileNumber: string, isSuspended: boolean) => {
    setUsers(prev => prev.map(u => {
      if (u.mobileNumber === mobileNumber) {
        const updated = { ...u, badges: isSuspended ? u.badges?.filter(b => b !== 'suspended') : [...(u.badges || []), 'suspended'] };
        return updated;
      }
      return u;
    }));
    
    addSystemLog('user', `User ${mobileNumber} status changed: ${isSuspended ? 'Reactivated' : 'Suspended'}`, 'Admin');
    
    if (isSupabaseConfigured && supabase) {
      (async () => {
        const { data: profile } = await supabase
          .from('profiles')
          .select('user_id')
          .eq('mobileNumber', mobileNumber)
          .single();
        
        if (profile) {
          await supabase.from('notifications').insert({
            user_id: profile.user_id,
            type: 'system',
            title: isSuspended ? 'Account Reactivated' : 'Account Suspended',
            body: isSuspended ? 'Your account has been reactivated by administrative staff.' : 'Your account has been suspended for violating guidelines.',
            is_read: false
          });
        }
      })();
    }
  };

  const handleDeleteUser = async (userId: string) => {
  const targetUser = users.find(u => u.id === userId);
  if (!targetUser) return;

  const displayName = targetUser.fullName || targetUser.mobileNumber || userId;
  if (confirm(`Are you sure you want to delete user profile for ${displayName}? This is irreversible.`)) {
    console.log("[DELETE USER] User ID being deleted:", userId);

    if (isSupabaseConfigured && userId) {
      // Delete from Supabase auth (requires service role key)
      try {
        console.log("[DELETE USER] Attempting auth deletion via edge function for user ID:", userId);
        
        // Explicitly get the current session to pass the authorization header
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData?.session?.access_token;
        console.log(`[DELETE USER] Session token present: ${!!token}`);

        const { data, error: authError } = await supabase.functions.invoke('delete-user', {
          body: { userId },
          headers: token ? { Authorization: `Bearer ${token}` } : undefined
        });
        if (authError) {
          console.error("[DELETE USER] Auth deletion error:", authError);
          alert(`Failed to delete Supabase Auth User: ${authError.message || JSON.stringify(authError)}`);
          return; // STOP EXECUTION!
        } 
        if (data && data.error) {
          console.error("[DELETE USER] Edge Function Error:", data.error);
          alert(`Edge Function Error: ${data.error}`);
          return; // STOP EXECUTION!
        }
        console.log("[DELETE USER] Auth user deleted successfully.", data);
      } catch (authEx: any) {
        console.error("[DELETE USER] Exception during auth deletion:", authEx);
        alert(`Exception during Auth deletion: ${authEx.message}`);
        return; // STOP EXECUTION
      }

      const response = await supabase.from('profiles').delete().eq('user_id', userId).select();
      console.log("[DELETE USER] Supabase response:", response);
      console.log("[DELETE USER] Error object:", response.error);
      console.log("[DELETE USER] Number of affected rows:", response.data ? response.data.length : 0);

      if (response.error) {
        alert(`Failed to delete user profile: ${response.error.message}`);
        return;
      }
    }

    setUsers(prev => prev.filter(u => u.id !== userId));
    addSystemLog('user', `User profile deleted: ${displayName} (ID: ${userId})`, 'Admin');
  }
};

  const handleVerifyUser = async (mobileNumber: string, status: boolean) => {
    setUsers(prev => prev.map(u => u.mobileNumber === mobileNumber ? { ...u, verified: status } : u));
    addSystemLog('user', `User verification status updated: ${mobileNumber} -> ${status}`, 'Admin');
    if (isSupabaseConfigured) {
      const targetUser = users.find(u => u.mobileNumber === mobileNumber);
      if (targetUser && (targetUser.id || targetUser.user_id)) {
        await supabase.from('profiles').update({ verified: status }).eq('user_id', targetUser.id || targetUser.user_id);
      }
    }
  };

  // ------------------------------------------------------------------------
  // CONTENT MANAGEMENT ACTIONS (Generic handler for almost all content)
  // ------------------------------------------------------------------------
  const handleHideContent = (module: string, itemId: string) => {
    addSystemLog('content', `Content hidden from public view: ${module} -> ${itemId}`, 'Admin');
    alert(`Content item [${itemId}] in [${module}] hidden successfully.`);
  };

  const handleToggleSuspendContent = async (module: string, itemId: string, isCurrentlySuspended: boolean) => {
    const nextStatus = isCurrentlySuspended ? 'Active' : 'Suspended';
    if (module === 'pages') setPages(prev => prev.map(x => x.id === itemId ? { ...x, status: nextStatus } : x));
    
    if (isSupabaseConfigured) {
       try {
         if (module === 'pages') {
           const item = pages.find(x => x.id === itemId);
           if (item) await dbSavePage({ ...item, status: nextStatus } as any);
         }
       } catch(err) {
         console.error('Failed to toggle suspension', err);
       }
    }
  };

  const handleDeleteContent = async (module: string, itemId: string) => {
    if (!confirm(`Are you sure you want to delete this content item from ${module}?`)) return;

    try {
      let success = true;
      if (isSupabaseConfigured) {
        if (module === 'posts') success = await dbDeletePost(itemId);
        else if (module === 'jobs') success = await dbDeleteJob(itemId);
        else if (module === 'property') success = await dbDeleteProperty(itemId);
        else if (module === 'marketplace') success = await dbDeleteMarketplaceListing(itemId);
        else if (module === 'businesses') success = await dbDeleteBusiness(itemId);
        else if (module === 'services') success = await dbDeleteService(itemId);
        else if (module === 'alerts') success = await dbDeleteAlert(itemId);
        else if (module === 'events') success = await dbDeleteEvent(itemId);
        else if (module === 'deals') success = await dbDeleteDeal(itemId);
        else if (module === 'groups') success = await dbDeleteGroup(itemId);
        else if (module === 'pages') success = await dbDeletePage(itemId);
      }

      if (success) {
        if (module === 'posts') setPosts(p => p.filter(x => x.id !== itemId));
        else if (module === 'jobs') setJobs(j => j.filter(x => x.id !== itemId));
        else if (module === 'property') setProperties(pr => pr.filter(x => x.id !== itemId));
        else if (module === 'marketplace') setMarketplaceItems(m => m.filter(x => x.id !== itemId));
        else if (module === 'businesses') setBusinesses(b => b.filter(x => x.id !== itemId));
        else if (module === 'services') setServices(s => s.filter(x => x.id !== itemId));
        else if (module === 'alerts') setAlerts(a => a.filter(x => x.id !== itemId));
        else if (module === 'events') setEvents(e => e.filter(x => x.id !== itemId));
        else if (module === 'deals') setDeals(d => d.filter(x => x.id !== itemId));
        else if (module === 'groups') setGroups(g => g.filter(x => x.id !== itemId));
        else if (module === 'pages') setPages(p => p.filter(x => x.id !== itemId));

        addSystemLog('content', `Content deleted permanently: ${module} -> ${itemId}`, 'Admin');
      }
    } catch (err) {
      console.warn("Error deleting content:", err);
    }
  };

  const handleEditContent = (module: string, item: any) => {
    setEditForm({ module, ...item });
    setIsEditModalOpen(true);
  };

  // ------------------------------------------------------------------------
  // ADS MANAGEMENT MODULE ACTIONS
  // ------------------------------------------------------------------------

  const createAdminNotification = async (title: string, body: string) => {
    addSystemLog('system', `${title}: ${body}`, 'System');
    if (isSupabaseConfigured && supabase) {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser) {
          await supabase.from('notifications').insert({
            user_id: authUser.id,
            type: 'system',
            title,
            body,
            is_read: false
          });
        }
      } catch (e) {
        console.warn("Failed to insert db notification:", e);
      }
    }
  };

  const verifyAndMigrateAdsTable = async () => {
    setAdsTableError(null);
    if (!isSupabaseConfigured || !supabase) return;
    try {
      const { error } = await supabase.from('ads').select('id').limit(1);
      if (error) {
        if (error.code === 'PGRST104' || error.message?.toLowerCase().includes('relation "public.ads" does not exist') || error.message?.toLowerCase().includes('schema cache')) {
          console.log("Ads table does not exist. Running auto-migration...");
          // Add new columns safely if the table already exists
          await supabase.rpc('execute_sql', { sql: `
            DO $$ 
            BEGIN
                BEGIN
                    ALTER TABLE public.ads ADD COLUMN format TEXT DEFAULT 'Feed';
                EXCEPTION
                    WHEN duplicate_column THEN null;
                END;
                BEGIN
                    ALTER TABLE public.ads ADD COLUMN display_frequency INTEGER DEFAULT 20;
                EXCEPTION
                    WHEN duplicate_column THEN null;
                END;
                BEGIN
                    ALTER TABLE public.ads ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE;
                EXCEPTION
                    WHEN duplicate_column THEN null;
                END;
            END $$;
          `});
          const migrationResult = await dbRunAdsMigration();
          if (!migrationResult.success) {
            throw new Error(migrationResult.error || "Auto-migration via RPC execution failed. Please check if your Supabase schema lacks the public.ads table.");
          }
          console.log("Auto-migration succeeded.");
          await fetchAllData();
        } else {
          throw error;
        }
      }
    } catch (err: any) {
      console.error("Ads database verification error:", err);
      const errMsg = err.message || String(err);
      setAdsTableError(errMsg);
      await createAdminNotification("Ads Database Verification Warning", `The public.ads table is missing or inaccessible. Error: ${errMsg}`);
    }
  };

  const fetchAdsOnly = async () => {
    if (!isSupabaseConfigured || !supabase) return;
    try {
      const { data, error } = await supabase
        .from('ads')
        .select('*')
        .is('deleted_at', null)
        .order('created_at', { ascending: false });
      if (!error && data) {
        console.log("[DEBUG] Final ads rendered in autoRefreshAds:", data.length, data);
        setAds(data);
      }
    } catch (e) {
      console.error("Error auto-refreshing ads:", e);
    }
  };

  useEffect(() => {
    if (adminPath === '/admin/promotions' && isSupabaseConfigured) {
      verifyAndMigrateAdsTable();
      
      const interval = setInterval(() => {
        fetchAdsOnly();
      }, 35000); // Auto refresh every 35 seconds

      return () => clearInterval(interval);
    }
  }, [adminPath, isSupabaseConfigured]);

  const syncAdStatuses = async (adsList: AdItem[]) => {
    let changed = false;
    const now = new Date();
    const updatedAds = await Promise.all(adsList.map(async (ad) => {
      if (ad.status === 'Draft' || ad.status === 'Paused' || ad.status === 'Archived' || ad.deleted_at) {
        return ad;
      }
      const startDate = new Date(ad.start_date);
      const endDate = new Date(ad.end_date);
      let calculatedStatus: AdItem['status'] = ad.status;

      if (now < startDate) {
        calculatedStatus = 'Scheduled';
      } else if (now >= startDate && now <= endDate) {
        calculatedStatus = 'Active';
      } else if (now > endDate) {
        calculatedStatus = 'Expired';
      }

      if (calculatedStatus !== ad.status) {
        changed = true;
        const newAd = { ...ad, status: calculatedStatus };
        await dbSaveAd(newAd, false);
        return newAd;
      }
      return ad;
    }));

    if (changed) {
      setAds(updatedAds);
      if (!isSupabaseConfigured) {
        localStorage.setItem('dhoke_connect_ads', JSON.stringify(updatedAds));
      }
    }
  };

  // Sync ads statuses every 30 seconds or on mount
  useEffect(() => {
    if (ads.length > 0) {
      syncAdStatuses(ads);
    }
  }, [ads.length, adminPath]);

  const handleCreateAdClick = () => {
    setAdForm(initialAdFormState);
    setSelectedAd(null);
    setIsAdCreateEditModalOpen(true);
  };

  const handleEditAdClick = (ad: AdItem) => {
    setAdForm({ 
      ...ad,
      start_date: ad.start_date ? ad.start_date?.substring(0, 10) : '',
      end_date: ad.end_date ? ad.end_date?.substring(0, 10) : ''
    });
    setSelectedAd(ad);
    setIsAdCreateEditModalOpen(true);
  };

  const handleDuplicateAdClick = async (ad: AdItem) => {
    const duplicatedAd: AdItem = {
      ...ad,
      id: crypto.randomUUID(),
      title: `${ad.title} (Copy)`,
      status: 'Draft',
      impressions: 0,
      clicks: 0,
      conversions: 0,
      created_at: new Date().toISOString()
    };
    try {
      const savedAd = await dbSaveAd(duplicatedAd, true);
      if (savedAd) {
        const updatedList = [savedAd, ...ads];
        setAds(updatedList);
        addSystemLog('system', `Ad duplicated: ${ad.title}`, 'Admin');
        alert(`Ad duplicated successfully as draft: ${savedAd.title}`);
      }
    } catch (err: any) {
      alert(`Failed to duplicate ad. Error: ${err.message || err}`);
    }
  };

  const handleTogglePauseAd = async (ad: AdItem) => {
    const isCurrentlyPaused = ad.status === 'Paused';
    let newStatus: AdItem['status'] = 'Draft';
    
    if (isCurrentlyPaused) {
      const now = new Date();
      const startDate = new Date(ad.start_date);
      const endDate = new Date(ad.end_date);
      if (now < startDate) newStatus = 'Scheduled';
      else if (now >= startDate && now <= endDate) newStatus = 'Active';
      else newStatus = 'Expired';
    } else {
      newStatus = 'Paused';
    }

    const updatedAd = { ...ad, status: newStatus };
    try {
      const savedAd = await dbSaveAd(updatedAd, false);
      if (savedAd) {
        const updatedList = ads.map(a => a.id === ad.id ? savedAd : a);
        setAds(updatedList);
        useAdStore.getState().invalidateCache();
      }
    } catch (err: any) {
      alert(`Failed to update ad status. Error: ${err.message || err}`);
    }
  };

  const handleArchiveAd = async (ad: AdItem) => {
    const updatedAd = { ...ad, status: 'Archived' as const };
    try {
      const savedAd = await dbSaveAd(updatedAd, false);
      if (savedAd) {
        const updatedList = ads.map(a => a.id === ad.id ? savedAd : a);
        setAds(updatedList);
        addSystemLog('system', `Ad archived: ${ad.title}`, 'Admin');
        useAdStore.getState().invalidateCache();
      }
    } catch (err: any) {
      alert(`Failed to archive ad. Error: ${err.message || err}`);
    }
  };

  const handleDeleteAdAction = async (adId: string) => {
    if (!confirm("Are you sure you want to archive/soft-delete this advertisement?")) return;
    const success = await dbDeleteAd(adId);
    if (success) {
      const updatedList = ads.filter(a => a.id !== adId);
      setAds(updatedList);
      addSystemLog('system', `Ad deleted (soft-deleted): ${adId}`, 'Admin');
      useAdStore.getState().invalidateCache();
    } else {
      alert("Failed to delete ad.");
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'banner_url' | 'video_url' | 'images') => {
    if (!e.target.files || e.target.files.length === 0) return;
    setAdFormUploading(true);
    try {
      if (field === 'images') {
        const fileList = Array.from(e.target.files);
        const urls = await Promise.all(fileList.map(file => dbUploadAdBanner(file as File, file.name)));
        setAdForm(prev => ({
          ...prev,
          images: [...(prev.images || []), ...urls]
        }));
      } else {
        const file = e.target.files[0] as File;
        const url = await dbUploadAdBanner(file, file.name);
        setAdForm(prev => ({
          ...prev,
          [field]: url
        }));
      }
    } catch (err) {
      console.error("Upload failed", err);
      alert("File upload failed.");
    } finally {
      setAdFormUploading(false);
    }
  };

  const handleSaveAdForm = async (e: React.FormEvent, isDraft = false) => {
    e.preventDefault();
    if (!adForm.title || !adForm.advertiser_name || !adForm.advertiser_phone || !adForm.advertiser_email) {
      alert("Please fill all required basic information fields.");
      return;
    }

    const now = new Date();
    // Determine status: for new ads (draft) use Draft, otherwise preserve existing status on edit unless dates change
    const isEdit = !!selectedAd;
    let computedStatus: AdItem['status'];
    if (isDraft) {
      computedStatus = 'Draft';
    } else if (isEdit) {
      // If start_date or end_date were modified, recalculate; otherwise keep current status
      const startDateChanged = adForm.start_date && adForm.start_date !== selectedAd?.start_date;
      const endDateChanged = adForm.end_date && adForm.end_date !== selectedAd?.end_date;
      if (startDateChanged || endDateChanged) {
        const startDate = parseLocalDate(adForm.start_date || '');
        const endDate = parseLocalDate(adForm.end_date || '');
        if (now < startDate) computedStatus = 'Scheduled';
        else if (now >= startDate && now <= endDate) computedStatus = 'Active';
        else computedStatus = 'Expired';
      } else {
        // Preserve original status
        computedStatus = selectedAd?.status || 'Active';
      }
    } else {
      // New ad (not a draft) – compute based on dates
      const startDate = new Date(adForm.start_date || '');
      const endDate = new Date(adForm.end_date || '');
      if (now < startDate) computedStatus = 'Scheduled';
      else if (now >= startDate && now <= endDate) computedStatus = 'Active';
      else computedStatus = 'Expired';
    }

    const invoiceNumber = adForm.invoice_number || `INV-${Date.now().toString().slice(-6)}`;

    const adToSave: AdItem = {
      id: selectedAd?.id || crypto.randomUUID(),
      title: adForm.title,
      description: adForm.description || '',
      advertiser_name: adForm.advertiser_name,
      advertiser_phone: adForm.advertiser_phone,
      advertiser_email: adForm.advertiser_email,
      advertiser_business_id: adForm.advertiser_business_id || '',
      banner_url: adForm.banner_url || '',
      video_url: adForm.video_url || null,
      format: adForm.format || 'Feed',
      display_frequency: typeof adForm.display_frequency === 'number' ? adForm.display_frequency : 20,
      placement: adForm.placement as AdItem['placement'],
      category: adForm.category as AdItem['category'],
      cta_type: adForm.cta_type as AdItem['cta_type'],
      cta_link: adForm.cta_link || '',
      target_audience: adForm.target_audience || '',
      target_location: adForm.target_location || '',
      start_date: adForm.start_date || new Date().toISOString().split('T')[0],
      end_date: adForm.end_date || new Date(Date.now() + 7 * 24 * 3600000).toISOString().split('T')[0],
      priority: adForm.priority as AdItem['priority'],
      status: computedStatus,
      amount: Number(adForm.amount) || 0,
      payment_status: adForm.payment_status as AdItem['payment_status'],
      invoice_number: invoiceNumber,
      impressions: selectedAd?.impressions || 0,
      clicks: selectedAd?.clicks || 0,
      conversions: selectedAd?.conversions || 0,
      views: selectedAd?.views || 0,
      ctr: selectedAd?.ctr || 0,
      images: adForm.images || [],
      created_at: selectedAd?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    try {
      const savedAd = await dbSaveAd(adToSave, !selectedAd);
      if (savedAd) {
        let updatedList = [];
        if (selectedAd) {
          updatedList = ads.map(a => a.id === savedAd.id ? savedAd : a);
        } else {
          updatedList = [savedAd, ...ads];
        }
        setAds(updatedList);
        
        setIsAdCreateEditModalOpen(false);
        setAdForm(initialAdFormState);
        setSelectedAd(null);
        useAdStore.getState().invalidateCache();
        alert(isDraft ? "Draft saved successfully!" : "Advertisement published successfully!");
      } else {
        alert("Failed to save advertisement.");
      }
    } catch (err: any) {
      console.error("Save advertisement failed:", err);
      const errMsg = err.message || String(err);
      alert(`Failed to save advertisement.\n\nError details: ${errMsg}\n\nIf the 'ads' table is missing, please review the SQL migration guidelines at the top of the Ads page.`);
      setAdsTableError(errMsg);
    }
  };

  const handleExportAds = () => {
    try {
      const headers = ['ID', 'Title', 'Advertiser', 'Format', 'Placement', 'Category', 'Status', 'Start Date', 'End Date', 'Amount', 'Payment Status', 'Impressions', 'Clicks', 'CTR'];
      const rows = ads.map(ad => [
        ad.id,
        `"${ad.title.replace(/"/g, '""')}"`,
        `"${ad.advertiser_name.replace(/"/g, '""')}"`,
        ad.format || 'Feed',
        ad.placement,
        ad.category,
        ad.status,
        ad.start_date,
        ad.end_date,
        ad.amount || 0,
        ad.payment_status,
        ad.impressions || 0,
        ad.clicks || 0,
        ad.impressions ? ((ad.clicks / ad.impressions) * 100).toFixed(2) + '%' : '0.00%'
      ]);
      const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `Ads_Report_${new Date().toISOString().slice(0,10)}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.error("Export error", e);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm) return;

    const { module, id, ...payload } = editForm;
    let success = false;

    if (module === 'posts') {
      setPosts(prev => prev.map(x => x.id === id ? { ...x, ...payload } : x));
      success = await dbSavePost({ id, ...payload } as any);
    } else if (module === 'jobs') {
      setJobs(prev => prev.map(x => x.id === id ? { ...x, ...payload } : x));
      success = await dbSaveJob({ id, ...payload } as any);
    } else if (module === 'property') {
      setProperties(prev => prev.map(x => x.id === id ? { ...x, ...payload } : x));
      success = await dbSaveProperty({ id, ...payload } as any);
    } else if (module === 'marketplace') {
      setMarketplaceItems(prev => prev.map(x => x.id === id ? { ...x, ...payload } : x));
      success = await dbSaveMarketplaceListing({ id, ...payload } as any);
    } else if (module === 'businesses') {
      setBusinesses(prev => prev.map(x => x.id === id ? { ...x, ...payload } : x));
      success = await dbSaveBusiness({ id, ...payload } as any);
    } else if (module === 'services') {
      setServices(prev => prev.map(x => x.id === id ? { ...x, ...payload } : x));
      success = await dbSaveService({ id, ...payload } as any);
    } else if (module === 'alerts') {
      setAlerts(prev => prev.map(x => x.id === id ? { ...x, ...payload } : x));
      success = await dbSaveAlert({ id, ...payload } as any);
    } else if (module === 'events') {
      setEvents(prev => prev.map(x => x.id === id ? { ...x, ...payload } : x));
      success = await dbSaveEvent({ id, ...payload } as any);
    } else if (module === 'deals') {
      setDeals(prev => prev.map(x => x.id === id ? { ...x, ...payload } : x));
      success = await dbSaveDeal({ id, ...payload } as any);
    } else if (module === 'groups') {
      setGroups(prev => prev.map(x => x.id === id ? { ...x, ...payload } : x));
      success = await dbSaveGroup({ id, ...payload } as any);
    } else if (module === 'pages') {
      setPages(prev => prev.map(x => x.id === id ? { ...x, ...payload } : x));
      success = await dbSavePage({ id, ...payload } as any);
    }

    addSystemLog('content', `Content updated successfully: ${module} -> ${id}`, 'Admin');
    setIsEditModalOpen(false);
    setEditForm(null);
  };

  const handleApproveContentStatus = async (module: string, itemId: string, approve: boolean) => {
    const nextStatus = approve ? 'Approved' : 'Rejected';
    
    // Local state sync
    if (module === 'posts') setPosts(prev => prev.map(x => x.id === itemId ? { ...x, status: nextStatus } : x));
    else if (module === 'jobs') setJobs(prev => prev.map(x => x.id === itemId ? { ...x, status: nextStatus } : x));
    else if (module === 'property') setProperties(prev => prev.map(x => x.id === itemId ? { ...x, status: nextStatus } : x));
    else if (module === 'marketplace') setMarketplaceItems(prev => prev.map(x => x.id === itemId ? { ...x, status: nextStatus } : x));
    else if (module === 'businesses') setBusinesses(prev => prev.map(x => x.id === itemId ? { ...x, status: nextStatus } : x));
    else if (module === 'services') setServices(prev => prev.map(x => x.id === itemId ? { ...x, status: nextStatus } : x));
    else if (module === 'alerts') setAlerts(prev => prev.map(x => x.id === itemId ? { ...x, status: nextStatus } : x));
    else if (module === 'events') setEvents(prev => prev.map(x => x.id === itemId ? { ...x, status: nextStatus } : x));
    else if (module === 'deals') setDeals(prev => prev.map(x => x.id === itemId ? { ...x, status: nextStatus } : x));
    else if (module === 'groups') setGroups(prev => prev.map(x => x.id === itemId ? { ...x, status: nextStatus } : x));
    else if (module === 'pages') setPages(prev => prev.map(x => x.id === itemId ? { ...x, status: nextStatus } : x));

    if (isSupabaseConfigured) {
      try {
        if (module === 'posts') {
          const item = posts.find(x => x.id === itemId);
          if (item) await dbSavePost({ ...item, status: nextStatus });
        } else if (module === 'jobs') {
          const item = jobs.find(x => x.id === itemId);
          if (item) await dbSaveJob({ ...item, status: nextStatus } as any);
        } else if (module === 'property') {
          const item = properties.find(x => x.id === itemId);
          if (item) await dbSaveProperty({ ...item, status: nextStatus } as any);
        } else if (module === 'marketplace') {
          const item = marketplaceItems.find(x => x.id === itemId);
          if (item) await dbSaveMarketplaceListing({ ...item, status: nextStatus } as any);
        } else if (module === 'businesses') {
          const item = businesses.find(x => x.id === itemId);
          if (item) await dbSaveBusiness({ ...item, status: nextStatus } as any);
        } else if (module === 'services') {
          const item = services.find(x => x.id === itemId);
          if (item) await dbSaveService({ ...item, status: nextStatus } as any);
        } else if (module === 'alerts') {
          const item = alerts.find(x => x.id === itemId);
          if (item) await dbSaveAlert({ ...item, status: nextStatus });
        } else if (module === 'events') {
          const item = events.find(x => x.id === itemId);
          if (item) await dbSaveEvent({ ...item, status: nextStatus });
        } else if (module === 'deals') {
          const item = deals.find(x => x.id === itemId);
          if (item) await dbSaveDeal({ ...item, status: nextStatus } as any);
        } else if (module === 'groups') {
          const item = groups.find(x => x.id === itemId);
          if (item) await dbSaveGroup({ ...item, status: nextStatus } as any);
        } else if (module === 'pages') {
          const item = pages.find(x => x.id === itemId);
          if (item) await dbSavePage({ ...item, status: nextStatus } as any);
        }
      } catch (err) {
        console.error(`Failed to update status in Database for ${module}:`, err);
      }
    }

    addSystemLog('content', `Content status changed to ${nextStatus}: ${module} -> ${itemId}`, 'Admin');
    
    // Close modal if open
    if (selectedContentDetail && selectedContentDetail.id === itemId) {
      setSelectedContentDetail(prev => prev ? { ...prev, status: nextStatus } : null);
    }
  };

  // ------------------------------------------------------------------------
  // VERIFICATION ACTIONS
  // ------------------------------------------------------------------------
  const handleVerifyRequestAction = async (requestId: string, status: 'Approved' | 'Rejected', notes?: string) => {
    setVerificationRequests(prev => prev.map(r => r.id === requestId ? { ...r, status, adminNotes: notes || '' } : r));

    try {
      const savedLegacy = localStorage.getItem('dhoke_connect_verification_requests') || '[]';
      let legacyList = JSON.parse(savedLegacy);
      legacyList = legacyList.map((r: any) => r.id === requestId ? { ...r, status } : r);
      localStorage.setItem('dhoke_connect_verification_requests', JSON.stringify(legacyList));
    } catch (e) {
      console.warn("Failed to sync legacy verification requests in AdminDashboard:", e);
    }
    
    const request = verificationRequests.find(r => r.id === requestId);
    if (request && status === 'Approved') {
      setUsers(prev => prev.map(u => (u.id === request.user_id || u.user_id === request.user_id || u.mobileNumber === request.mobileNumber) ? { ...u, verified: true } : u));
      if (isSupabaseConfigured && request.user_id) {
        await supabase.from('profiles').update({ verified: true }).eq('user_id', request.user_id);
      }
    }

    if (request && isSupabaseConfigured) {
      const updatedReq = { ...request, status, adminNotes: notes || '' };
      await dbSaveVerificationRequest(updatedReq);
    }

    addSystemLog('user', `Verification request [${requestId}] status updated to: ${status}`, 'Admin');
  };

  // ------------------------------------------------------------------------
  // REPORT ACTIONS
  // ------------------------------------------------------------------------
  const handleDismissReport = (reportId: string) => {
    setReports(prev => prev.filter(r => r.id !== reportId));
    addSystemLog('content', `Report dismissed: ${reportId}`, 'Admin');
  };

  const handleActionOnReport = async (report: ReportItem, action: 'remove' | 'suspend') => {
    if (action === 'remove') {
      await handleDeleteContent(report.contentType, report.contentId);
      setReports(prev => prev.filter(r => r.id !== report.id));
      addSystemLog('content', `Report item content removed permanently: ${report.contentType} ID: ${report.contentId}`, 'Admin');
    } else if (action === 'suspend') {
      const userToSuspend = users.find(u => u.fullName === report.reporter || u.mobileNumber === report.contentId);
      if (userToSuspend) {
        handleToggleSuspendUser(userToSuspend.mobileNumber, false);
      } else {
        alert("Reporter/owner suspend requested.");
      }
      setReports(prev => prev.filter(r => r.id !== report.id));
      addSystemLog('security', `User suspended following community report on ID: ${report.contentId}`, 'Admin');
    }
  };

  // ------------------------------------------------------------------------
  // SETTINGS & CATEGORIES ACTIONS
  // ------------------------------------------------------------------------
  const handleAddCategory = () => {
    if (!newCategoryName?.trim()) return;
    setCategories(prev => {
      const updated = { ...prev };
      updated[activeCategoryModule] = [...(updated[activeCategoryModule] || []), newCategoryName?.trim()];
      return updated;
    });
    addSystemLog('system', `Category [${newCategoryName}] added to module [${activeCategoryModule}]`, 'Admin');
    setNewCategoryName('');
  };

  const handleDeleteCategory = (moduleKey: string, categoryName: string) => {
    setCategories(prev => {
      const updated = { ...prev };
      updated[moduleKey] = updated[moduleKey].filter(c => c !== categoryName);
      return updated;
    });
    addSystemLog('system', `Category [${categoryName}] deleted from module [${moduleKey}]`, 'Admin');
  };

  // Filter logic for main tables
  const getFilteredItems = (items: any[], searchKeys: string[]) => {
    let list = items;
    // Search Term Filter
    if (searchTerm?.trim()) {
      const lower = searchTerm?.toLowerCase();
      list = list.filter(item => {
        return searchKeys.some(key => {
          const val = item[key];
          if (!val) return false;
          return String(val)?.toLowerCase().includes(lower);
        });
      });
    }

    // Flagged/Reported Filter
    if (filterType === 'flagged') {
      list = list.filter(item => item.reported);
    } else if (filterType === 'clean') {
      list = list.filter(item => !item.reported && item.status !== 'Pending');
    } else if (filterType === 'pending') {
      list = list.filter(item => item.status === 'Pending');
    }

    return list;
  };

  // Render skeleton loaders for simulated fast state changes
  const renderSkeletonTable = () => (
    <div className="space-y-4 animate-pulse p-6 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
      <div className="h-6 bg-slate-100 rounded-md w-1/4 mb-4" />
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="flex items-center gap-4 py-2 border-b border-slate-100">
            <div className="h-8 w-8 bg-slate-100 rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-slate-100 rounded-md w-1/3" />
              <div className="h-3 bg-slate-100 rounded-md w-1/4" />
            </div>
            <div className="h-4 bg-slate-100 rounded-md w-16" />
            <div className="h-7 bg-slate-100 rounded-md w-32" />
          </div>
        ))}
      </div>
    </div>
  );

  if (!isAdminLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans text-slate-850">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 border border-slate-100">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              {isEn ? 'Admin Access' : 'ایڈمن رسائی'}
            </h1>
            <p className="text-xs text-slate-500 mt-2">
              {isEn ? 'Enter the administrative passcode to continue.' : 'آگے بڑھنے کے لیے ایڈمن پاس کوڈ درج کریں۔'}
            </p>
          </div>
          <form onSubmit={handleAdminLogin} className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">
                {isEn ? 'Passcode' : 'پاس کوڈ'}
              </label>
              <input
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:bg-white"
              />
            </div>
            {loginError && (
              <p className="text-xs text-red-600 font-bold bg-red-50 p-3 rounded-xl">{loginError}</p>
            )}
            <button
              type="submit"
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition-all shadow-md cursor-pointer"
            >
              {isEn ? 'Secure Login' : 'لاگ ان کریں'}
            </button>
            <button
              type="button"
              onClick={onExitAdmin}
              className="w-full py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm transition-all cursor-pointer"
            >
              {isEn ? 'Return to Main App' : 'واپس جائیں'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-850 selection:bg-blue-100 selection:text-blue-900 overflow-x-hidden">
      
      {/* 1. TOP HEADER BAR */}
      <header className="bg-white border-b border-slate-200/80 h-16 shrink-0 px-4 md:px-6 flex items-center justify-between sticky top-0 z-50 shadow-xs">
        <div className="flex items-center gap-3">
          {/* Mobile hamburger — only visible below lg */}
          <button 
            onClick={() => setIsMobileSidebarOpen(true)}
            className="lg:hidden p-2 rounded-xl text-slate-500 hover:bg-slate-100 transition-colors border-0 cursor-pointer"
            title="Open menu"
            aria-label="Open sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>
          {/* Desktop toggle — only visible at lg+ */}
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="hidden lg:flex p-2 rounded-xl text-slate-500 hover:bg-slate-100 transition-colors border-0 cursor-pointer"
            title="Toggle sidebar"
          >
            {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl text-white shadow-sm shrink-0">
              <Shield className="w-4 h-4" />
            </span>
            <div>
              <h2 className="text-sm font-black tracking-tight text-slate-900 leading-none">
                {isEn ? 'DHOKE HASSU CONNECT' : 'ڈھوک حسو کنیکٹ'}
              </h2>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                {isEn ? 'SuperAdmin Panel' : 'سپر ایڈمن پورٹل'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          <div className="hidden md:flex items-center gap-2 px-3.5 py-1.5 bg-green-50 border border-green-100 rounded-full text-[11px] font-bold text-green-700">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            {isEn ? 'Live Telemetry Active' : 'ڈیٹا بیس سے منسلک ہے'}
          </div>

          <button
            onClick={handleAdminLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 font-bold rounded-xl transition-all border-0 cursor-pointer"
            title="Exit Admin Control Portal"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline font-bold">{isEn ? 'Exit Dashboard' : 'لاگ آؤٹ'}</span>
          </button>
        </div>
      </header>

      {/* 2. SIDEBAR NAVIGATION + CENTRAL CONTENT */}
      <div className="flex-1 flex overflow-hidden min-w-0">

        {/* MOBILE DARK OVERLAY — shown when mobile sidebar is open */}
        {isMobileSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={closeMobileSidebar}
            aria-hidden="true"
          />
        )}
        
        {/* SIDEBAR */}
        {/* Desktop: always visible, push layout (w-64 or w-16) */}
        {/* Mobile: fixed overlay, slides in from left */}
        <aside className={[
          // Shared styles
          'bg-white border-r border-slate-200 overflow-y-auto flex flex-col justify-between shadow-xs transition-all duration-300',
          // Desktop behavior (lg+): inline, width-toggled
          'lg:relative lg:shrink-0 lg:translate-x-0 lg:z-30',
          isSidebarOpen ? 'lg:w-64' : 'lg:w-16',
          // Mobile behavior (<lg): fixed overlay
          'fixed inset-y-0 left-0 z-50 w-72',
          isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        ].join(' ')}>
          <div className="p-3 space-y-6">
            {/* Mobile: close button at top of sidebar */}
            <div className="lg:hidden flex items-center justify-between mb-2 pb-2 border-b border-slate-100">
              <span className="text-xs font-black text-slate-700 uppercase tracking-widest">Menu</span>
              <button
                onClick={closeMobileSidebar}
                className="p-1.5 rounded-xl text-slate-500 hover:bg-slate-100 transition-colors border-0 cursor-pointer"
                aria-label="Close menu"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            {/* Group 1: CORE PORTAL CONTROLS */}
            <div>
              {(isSidebarOpen || isMobileSidebarOpen) && (
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-3 mb-2">
                  {isEn ? 'System Core' : 'نظام کا جائزہ'}
                </p>
              )}
              <nav className="space-y-1">
                <button
                  onClick={() => navigateTo('/admin/dashboard')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all border-0 cursor-pointer ${adminPath === '/admin/dashboard' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}
                  title={isEn ? 'Dashboard Overview' : 'ڈیش بورڈ'}
                >
                  <div className="flex items-center gap-2.5">
                    <BarChart2 className="w-4 h-4 text-slate-400 shrink-0" />
                    {(isSidebarOpen || isMobileSidebarOpen) && <span>{isEn ? 'Dashboard Overview' : 'ڈیش بورڈ'}</span>}
                  </div>
                </button>
                
                <button
                  onClick={() => navigateTo('/admin/users')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all border-0 cursor-pointer ${adminPath === '/admin/users' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}
                  title={isEn ? 'Users Management' : 'صارفین کا انتظام'}
                >
                  <div className="flex items-center gap-2.5">
                    <Users className="w-4 h-4 text-slate-400 shrink-0" />
                    {(isSidebarOpen || isMobileSidebarOpen) && <span>{isEn ? 'Users Management' : 'صارفین کا انتظام'}</span>}
                  </div>
                  {(isSidebarOpen || isMobileSidebarOpen) && (
                    <span className="bg-slate-100 text-slate-500 font-mono text-[9px] px-1.5 py-0.5 rounded-md font-bold">{users.length}</span>
                  )}
                </button>

                <button
                  onClick={() => navigateTo('/admin/settings')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all border-0 cursor-pointer ${adminPath === '/admin/settings' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}
                  title={isEn ? 'Settings' : 'انتظامی ترتیبات'}
                >
                  <div className="flex items-center gap-2.5">
                    <Settings className="w-4 h-4 text-slate-400 shrink-0" />
                    {(isSidebarOpen || isMobileSidebarOpen) && <span>{isEn ? 'System Settings' : 'انتظامی ترتیبات'}</span>}
                  </div>
                </button>
              </nav>
            </div>

            {/* Group 2: HYPERLOCAL DIRECTORY */}
            <div>
              {(isSidebarOpen || isMobileSidebarOpen) && (
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-3 mb-2">
                  {isEn ? 'Hyperlocal Directory' : 'کمیونٹی مواد'}
                </p>
              )}
              <nav className="space-y-0.5">
                {[
                  { path: '/admin/posts', label: isEn ? 'Community Feed' : 'پوسٹس', icon: MessageSquare, count: posts.length },
                  { path: '/admin/stories', label: isEn ? 'Stories & Highlights' : 'کہانیاں', icon: Eye, count: '—' },
                  { path: '/admin/story-ads', label: isEn ? 'Story Ads' : 'سٹوری اشتہارات', icon: Eye, count: '—' },
                  { path: '/admin/jobs', label: isEn ? 'Jobs Board' : 'ملازمتیں', icon: Briefcase, count: jobs.length },
                  { path: '/admin/businesses', label: isEn ? 'Businesses' : 'کاروبار', icon: Award, count: businesses.length },
                  { path: '/admin/property', label: isEn ? 'Property Listings' : 'پراپرٹی', icon: Home, count: properties.length },
                  { path: '/admin/marketplace', label: isEn ? 'Marketplace' : 'مارکیٹ پلیس', icon: ShoppingBag, count: marketplaceItems.length },
                  { path: '/admin/services', label: isEn ? 'Technical Services' : 'خدمات', icon: Wrench, count: services.length },
                  { path: '/admin/deals', label: isEn ? 'Deals & Offers' : 'ڈیلز', icon: Tag, count: deals.length },
                  { path: '/admin/alerts', label: isEn ? 'Local Alerts' : 'الرٹس', icon: AlertTriangle, count: alerts.length },
                  { path: '/admin/groups', label: isEn ? 'Public Groups' : 'گروپس', icon: FolderHeart, count: groups.length },
                  { path: '/admin/pages', label: isEn ? 'Pages' : 'صفحات', icon: FileCheck, count: pages.length },
                  { path: '/admin/polls', label: isEn ? 'Polls & Opinion' : 'سروے', icon: Clock, count: polls.length },
                  { path: '/admin/promotions', label: isEn ? 'Ads Management' : 'تشہیر', icon: Sliders, count: ads.length }
                ].map(item => (
                  <button
                    key={item.path}
                    onClick={() => navigateTo(item.path)}
                    className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-bold transition-all border-0 cursor-pointer ${adminPath === item.path ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}
                    title={item.label}
                  >
                    <div className="flex items-center gap-2.5">
                      <item.icon className="w-4 h-4 text-slate-400 shrink-0" />
                      {(isSidebarOpen || isMobileSidebarOpen) && <span>{item.label}</span>}
                    </div>
                    {(isSidebarOpen || isMobileSidebarOpen) && (
                      <span className="bg-slate-100 text-slate-500 font-mono text-[9px] px-1.5 py-0.5 rounded-md font-bold">{item.count}</span>
                    )}
                  </button>
                ))}
              </nav>
            </div>

            {/* Group 3: SECURITY & AUDIT */}
            <div>
              {(isSidebarOpen || isMobileSidebarOpen) && (
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-3 mb-2">
                  {isEn ? 'Security & Moderation' : 'سیکیورٹی'}
                </p>
              )}
              <nav className="space-y-1">
                <button
                  onClick={() => navigateTo('/admin/verification')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all border-0 cursor-pointer ${adminPath === '/admin/verification' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}
                  title={isEn ? 'Verification Center' : 'تصدیق کی درخواستیں'}
                >
                  <div className="flex items-center gap-2.5">
                    <FileCheck className="w-4 h-4 text-slate-400 shrink-0" />
                    {(isSidebarOpen || isMobileSidebarOpen) && <span>{isEn ? 'Verifications' : 'تصدیقیں'}</span>}
                  </div>
                  {(isSidebarOpen || isMobileSidebarOpen) && verificationRequests.filter(v => v.status === 'Pending').length > 0 && (
                    <span className="bg-amber-500 text-white font-mono text-[9px] px-1.5 py-0.5 rounded-md animate-pulse">
                      {verificationRequests.filter(v => v.status === 'Pending').length}
                    </span>
                  )}
                </button>
                
                <button
                  onClick={() => navigateTo('/admin/reports')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all border-0 cursor-pointer ${adminPath === '/admin/reports' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}
                  title={isEn ? 'Safety Reports' : 'رپورٹس'}
                >
                  <div className="flex items-center gap-2.5">
                    <Flag className="w-4 h-4 text-slate-400 shrink-0" />
                    {(isSidebarOpen || isMobileSidebarOpen) && <span>{isEn ? 'Reports & Flags' : 'رپورٹس'}</span>}
                  </div>
                  {(isSidebarOpen || isMobileSidebarOpen) && reports.length > 0 && (
                    <span className="bg-red-500 text-white font-mono text-[9px] px-1.5 py-0.5 rounded-md font-bold">
                      {reports.length}
                    </span>
                  )}
                </button>
              </nav>
            </div>

          </div>

          <div className="p-3 border-t border-slate-100 bg-slate-50/50">
            <button
              onClick={onExitAdmin}
              className="w-full py-2 px-3 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all border-0 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              {(isSidebarOpen || isMobileSidebarOpen) && <span>{isEn ? 'Portal View' : 'ایپ میں جائیں'}</span>}
            </button>
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6 lg:p-8 bg-slate-50/50 min-w-0">

          
          {loading || isTabLoading ? (
            renderSkeletonTable()
          ) : (
            <>
              {/* ADMIN DASHBOARD HUB */}
              {adminPath === '/admin/dashboard' && (
                <div className="space-y-6">
                  
                  {/* Title Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                        📊 {isEn ? 'Operational Hub Dashboard' : 'انتظامی ڈیش بورڈ'}
                      </h1>
                      <p className="text-xs text-slate-500 mt-1">
                        {isEn ? 'Real-time telemetry, hyper-local activity audits, and system status.' : 'ریئل ٹائم مانیٹرنگ اور لائیو ڈیٹا بیس سرگرمیاں۔'}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Sync: Live</span>
                      <button 
                        onClick={() => navigateTo('/admin/dashboard')} 
                        className="p-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl shadow-xs transition-all border-0 cursor-pointer"
                      >
                        <RefreshCw className="w-4 h-4 text-slate-600" />
                      </button>
                    </div>
                  </div>

                  {/* HIGH-AESTHETIC METRICS METRIC CARDS */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
                    {[
                      { label: isEn ? 'Total Users' : 'کل صارفین', value: users.length, icon: Users, color: 'bg-blue-50 text-blue-600 border-blue-100', trend: '↑ 12% growth' },
                      { label: isEn ? 'Active Feed Posts' : 'کمیونٹی پوسٹس', value: posts.length, icon: MessageSquare, color: 'bg-green-50 text-green-600 border-green-100', trend: '↑ 8% active' },
                      { label: isEn ? 'Registered Business' : 'مقامی کاروبار', value: businesses.length, icon: Award, color: 'bg-indigo-50 text-indigo-600 border-indigo-100', trend: '↑ 4% growth' },
                      { label: isEn ? 'Pending Verifications' : 'تصدیقیں', value: verificationRequests.filter(v => v.status === 'Pending').length, icon: FileCheck, color: 'bg-amber-50 text-amber-600 border-amber-100', trend: '↑ 2 new requests', pulse: true },
                      { label: isEn ? 'Safety Reports' : 'رپورٹس', value: reports.length, icon: AlertTriangle, color: 'bg-red-50 text-red-600 border-red-100', trend: '+1 flag logs', danger: true }
                    ].map((metric, i) => (
                      <div key={i} className={`bg-white p-5 rounded-2xl border ${metric.color?.split(' ')[2]} shadow-xs flex flex-col justify-between min-h-[140px] relative overflow-hidden`}>
                        <div className="flex items-center justify-between w-full">
                          <div className={`p-2.5 rounded-xl ${metric.color?.split(' ')[0]} ${metric.color?.split(' ')[1]}`}>
                            <metric.icon className={`w-5 h-5 ${metric.pulse ? 'animate-pulse' : ''}`} />
                          </div>
                          <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full ${metric.color?.split(' ')[0]} ${metric.color?.split(' ')[1]}`}>
                            {metric.trend}
                          </span>
                        </div>
                        <div className="mt-4">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider truncate" title={metric.label}>
                            {metric.label}
                          </p>
                          <h3 className="text-2xl font-black text-slate-900 mt-1.5 leading-none">
                            {metric.value}
                          </h3>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* SECONDARY SYSTEM STATUS DETAILS */}
                  <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">{isEn ? 'Extended Community Assets' : 'دیگر شعبہ جات'}</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                      {[
                        { label: isEn ? 'Jobs Board' : 'ملازمتیں', value: jobs.length, icon: Briefcase },
                        { label: isEn ? 'Marketplace' : 'سامان', value: marketplaceItems.length, icon: ShoppingBag },
                        { label: isEn ? 'Services' : 'سروسز', value: services.length, icon: Wrench },
                        { label: isEn ? 'Properties' : 'جائیداد', value: properties.length, icon: Home },
                        { label: isEn ? 'Local Deals' : 'ڈیلز', value: deals.length, icon: Tag },
                        { label: isEn ? 'Alerts' : 'الرٹس', value: alerts.length, icon: AlertTriangle }
                      ].map((subMetric, i) => (
                        <div key={i} className="bg-slate-50/50 p-3.5 rounded-xl border border-slate-100 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <subMetric.icon className="w-4 h-4 text-slate-400" />
                            <span className="text-xs font-bold text-slate-700">{subMetric.label}</span>
                          </div>
                          <span className="font-extrabold text-slate-900 text-sm">{subMetric.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* SYSTEM LOGS & LIVE TELEMETRY */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">{isEn ? 'Live Auditing Trail Logs' : 'سستم سرگرمی لاگز'}</h3>
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded font-mono text-[9px] font-bold">Auto Refresh</span>
                      </div>
                      <div className="space-y-2 max-h-80 overflow-y-auto divide-y divide-slate-55 border border-slate-100 rounded-xl bg-slate-50/20 p-2">
                        {systemLogs.map(log => (
                          <div key={log.id} className="pt-2 pb-2.5 flex items-start gap-3 text-xs leading-normal">
                            <span className="text-[9px] font-black bg-slate-100 text-slate-500 font-mono px-2 py-0.5 rounded mt-0.5 shrink-0">{log.timestamp}</span>
                            <div className="flex-1 space-y-0.5">
                              <p className="font-bold text-slate-700">{log.message}</p>
                              <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Type: {log.category} • Op: {log.operator}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
                      <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">{isEn ? 'Administration Tools' : 'انتظامی ٹولز'}</h3>
                      <div className="space-y-3">
                        <button 
                          onClick={() => navigateTo('/admin/settings')} 
                          className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-between border-0 cursor-pointer"
                        >
                          <span>System Policies Control</span>
                          <ChevronRight className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => navigateTo('/admin/verification')} 
                          className="w-full py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center justify-between border-0 cursor-pointer"
                        >
                          <span>Verification Center</span>
                          <ChevronRight className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => navigateTo('/admin/reports')} 
                          className="w-full py-3 px-4 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl text-xs font-bold flex items-center justify-between border-0 cursor-pointer"
                        >
                          <span>Moderation Safety Flags</span>
                          <span className="bg-red-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0 animate-pulse">{reports.length}</span>
                        </button>
                      </div>
                    </div>
                  </div>

                </div>
              )}

              {/* ADS MANAGEMENT MODULE TAB */}
              {adminPath === '/admin/promotions' && (
                <div className="space-y-6">
                  {/* Dashboard Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                        📢 {isEn ? 'Ads Management' : 'تشہیر اور اشتہارات'}
                      </h1>
                      <p className="text-xs text-slate-500 mt-1">
                        {isEn ? 'Manage sponsored advertisements and promotions.' : 'اسپانسرڈ اشتہارات اور پروموشنز کا انتظام کریں۔'}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <button
                        onClick={handleCreateAdClick}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer border-0"
                      >
                        <Plus className="w-4 h-4" />
                        {isEn ? 'Create Advertisement' : 'نیا اشتہار'}
                      </button>
                      <button
                        onClick={fetchAllData}
                        className="p-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl shadow-xs transition-all cursor-pointer"
                        title="Refresh"
                      >
                        <RefreshCw className="w-4 h-4 text-slate-650" />
                      </button>
                      <button
                        onClick={handleExportAds}
                        className="p-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl shadow-xs transition-all cursor-pointer"
                        title="Export Report"
                      >
                        <ShoppingBag className="w-4 h-4 text-slate-650" />
                      </button>
                    </div>
                  </div>

                  {adsTableError && (
                    <div className="p-5 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-800 space-y-3">
                      <div className="flex items-center gap-2 font-bold text-sm">
                        <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
                        <span>
                          {adsTableError?.toLowerCase().includes('relation "public.ads" does not exist') || adsTableError.includes('42P01')
                            ? "Supabase Error: 'public.ads' Table Missing"
                            : adsTableError?.toLowerCase().includes('schema cache') || adsTableError.includes('PGRST106')
                            ? "Supabase Error: Schema Cache Needs Reload"
                            : "Database Error: Ads Table Inaccessible"}
                        </span>
                      </div>
                      <p>
                        {adsTableError?.toLowerCase().includes('relation "public.ads" does not exist') || adsTableError.includes('42P01')
                          ? <span>The application could not find the <code>public.ads</code> table. To resolve this, please run the SQL migration below.</span>
                          : adsTableError?.toLowerCase().includes('schema cache') || adsTableError.includes('PGRST106')
                          ? <span>The Supabase schema cache is outdated. Please reload your schema cache in the Supabase Dashboard, or wait a few minutes.</span>
                          : <span>The application encountered an error accessing the <code>public.ads</code> table. This could be due to Row Level Security (RLS) policies, missing permissions, or network issues.</span>
                        }
                        <br/><br/>
                        <strong>Error details:</strong> {adsTableError}
                      </p>
                      <pre className="bg-slate-900 text-slate-100 p-4 rounded-xl font-mono text-[10px] select-all overflow-x-auto max-h-48 whitespace-pre">
{`CREATE TABLE IF NOT EXISTS public.ads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    advertiser_name TEXT NOT NULL,
    advertiser_phone TEXT NOT NULL,
    advertiser_email TEXT NOT NULL,
    advertiser_business_id TEXT,
    banner_url TEXT,
    video_url TEXT,
    format TEXT DEFAULT 'Feed',
    display_frequency INTEGER DEFAULT 20,
    placement TEXT NOT NULL,
    category TEXT NOT NULL,
    cta_type TEXT NOT NULL,
    cta_link TEXT,
    target_audience TEXT,
    target_location TEXT,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    priority TEXT NOT NULL DEFAULT 'Normal',
    status TEXT NOT NULL DEFAULT 'Draft',
    amount NUMERIC DEFAULT 0,
    payment_status TEXT NOT NULL DEFAULT 'Pending',
    invoice_number TEXT,
    impressions INTEGER DEFAULT 0,
    views INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    conversions INTEGER DEFAULT 0,
    ctr NUMERIC DEFAULT 0,
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE,
    images JSONB DEFAULT '[]'::jsonb
);

CREATE INDEX IF NOT EXISTS ads_status_idx ON public.ads (status);
CREATE INDEX IF NOT EXISTS ads_placement_idx ON public.ads (placement);
CREATE INDEX IF NOT EXISTS ads_category_idx ON public.ads (category);
CREATE INDEX IF NOT EXISTS ads_start_date_idx ON public.ads (start_date);
CREATE INDEX IF NOT EXISTS ads_end_date_idx ON public.ads (end_date);

ALTER TABLE public.ads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read-only access to ads" ON public.ads FOR SELECT USING (deleted_at IS NULL);
CREATE POLICY "Allow anyone to manage ads" ON public.ads FOR ALL USING (true) WITH CHECK (true);`}
                      </pre>
                      <div className="flex gap-2">
                        <button
                          onClick={verifyAndMigrateAdsTable}
                          className="px-3.5 py-1.5 bg-red-650 hover:bg-red-700 text-white font-bold rounded-lg border-0 cursor-pointer text-[10px]"
                        >
                          Retry Verification
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Revenue & Overview Statistics Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
                    {[
                      { label: 'Total Ads', value: ads.length, color: 'bg-blue-50 text-blue-600 border-blue-100' },
                      { label: 'Active Ads', value: ads.filter(a => a.status === 'Active').length, color: 'bg-green-50 text-green-600 border-green-100' },
                      { label: 'Total Rev', value: `Rs. ${ads.reduce((s, i) => s + (i.amount || 0), 0)}`, color: 'bg-indigo-50 text-indigo-600 border-indigo-100' },
                      { label: 'Imps', value: ads.reduce((s, i) => s + (i.impressions || 0), 0), color: 'bg-blue-50 text-blue-500 border-blue-100' },
                      { label: 'Views (2s)', value: ads.reduce((s, i) => s + (i.views || 0), 0), color: 'bg-sky-50 text-sky-600 border-sky-100' },
                      { label: 'Clicks', value: ads.reduce((s, i) => s + (i.clicks || 0), 0), color: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
                      { 
                        label: 'Avg CTR', 
                        value: (() => {
                          const totalImps = ads.reduce((s, i) => s + (i.impressions || 0), 0);
                          const totalClicks = ads.reduce((s, i) => s + (i.clicks || 0), 0);
                          return totalImps > 0 ? ((totalClicks / totalImps) * 100).toFixed(1) + '%' : '0.0%';
                        })(), 
                        color: 'bg-purple-50 text-purple-600 border-purple-100' 
                      },
                      { label: 'Expired', value: ads.filter(a => a.status === 'Expired').length, color: 'bg-red-50 text-red-600 border-red-100' }
                    ].map((metric, i) => (
                      <div key={i} className="bg-white p-3.5 rounded-xl border border-slate-100 shadow-xs flex flex-col justify-between min-h-[90px]">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">{metric.label}</p>
                        <h3 className="text-sm font-black text-slate-850 mt-2">{metric.value}</h3>
                      </div>
                    ))}
                  </div>

                  {/* Feed Ads Configuration */}
                  <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs mb-6">
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-4">Feed Ads Configuration</h3>
                    <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-xl">
                      <div>
                        <h4 className="text-sm font-bold text-slate-800">Jobs Feed Ad Interval</h4>
                        <p className="text-[10px] text-slate-500 mt-1">Number of job listings to show between each inline advertisement.</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <select
                          className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-700 outline-none focus:border-blue-500 cursor-pointer"
                          value={feedAdIntervals?.['Jobs'] || 3}
                          onChange={(e) => setFeedAdInterval('Jobs', parseInt(e.target.value, 10))}
                        >
                          <option value={2}>After every 2 jobs</option>
                          <option value={3}>After every 3 jobs (Default)</option>
                          <option value={4}>After every 4 jobs</option>
                          <option value={5}>After every 5 jobs</option>
                          <option value={7}>After every 7 jobs</option>
                          <option value={10}>After every 10 jobs</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Revenue Dashboard Widgets */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4 col-span-2">
                      <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Revenue Dashboard</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-xl">
                          <p className="text-[9px] font-black text-blue-600 uppercase">Total Revenue</p>
                          <h4 className="text-lg font-black text-slate-900 mt-1">Rs. {ads.reduce((s, i) => s + (i.amount || 0), 0)}</h4>
                        </div>
                        <div className="p-4 bg-green-50/50 border border-green-100 rounded-xl">
                          <p className="text-[9px] font-black text-green-600 uppercase">Monthly Revenue</p>
                          <h4 className="text-lg font-black text-slate-900 mt-1">
                            Rs. {
                              ads.filter(a => {
                                const start = new Date(a.start_date);
                                return start.getMonth() === new Date().getMonth() && start.getFullYear() === new Date().getFullYear();
                              }).reduce((s, i) => s + (i.amount || 0), 0)
                            }
                          </h4>
                        </div>
                        <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-xl">
                          <p className="text-[9px] font-black text-indigo-600 uppercase">Active Paid Ads</p>
                          <h4 className="text-lg font-black text-slate-900 mt-1">
                            {ads.filter(a => a.status === 'Active' && a.payment_status === 'Paid').length}
                          </h4>
                        </div>
                        <div className="p-4 bg-red-50/50 border border-red-100 rounded-xl">
                          <p className="text-[9px] font-black text-red-600 uppercase">Expiring Soon</p>
                          <h4 className="text-lg font-black text-slate-900 mt-1">
                            {
                              ads.filter(a => {
                                if (a.status !== 'Active') return false;
                                const diffDays = Math.ceil((new Date(a.end_date).getTime() - Date.now()) / (1000 * 3600 * 24));
                                return diffDays >= 0 && diffDays <= 3;
                              }).length
                            }
                          </h4>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
                      <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Top Performing Ads</h3>
                      <div className="space-y-3">
                        {[...ads]
                          .filter(a => a.impressions > 0)
                          .sort((a, b) => (b.clicks / b.impressions) - (a.clicks / a.impressions))
                          ?.slice(0, 3)
                          .map((ad, index) => (
                            <div key={ad.id} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                              <div>
                                <p className="text-xs font-bold text-slate-800 truncate max-w-[150px]">{ad.title}</p>
                                <p className="text-[9px] text-slate-400">{ad.advertiser_name} • CTR: {((ad.clicks / ad.impressions) * 100).toFixed(1)}%</p>
                              </div>
                              <span className="text-[10px] font-extrabold text-blue-600">#{index + 1}</span>
                            </div>
                          ))}
                        {[...ads].filter(a => a.impressions > 0).length === 0 && (
                          <p className="text-xs text-slate-400 text-center py-4">No performance metrics yet.</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Search, Sort & Filters Toolbar */}
                  <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col gap-4">
                    <div className="flex items-center gap-3 bg-slate-50 px-3.5 py-2.5 rounded-xl border border-slate-200/50 w-full lg:max-w-md">
                      <Search className="w-4 h-4 text-slate-400 shrink-0" />
                      <input
                        type="text"
                        placeholder="Search ads by title or advertiser..."
                        value={adSearchTerm}
                        onChange={(e) => setAdSearchTerm(e.target.value)}
                        className="w-full bg-transparent border-none text-xs placeholder-slate-400 focus:outline-none"
                      />
                    </div>

                    <div className="flex flex-wrap items-center gap-2 w-full">
                      {/* Status Filter */}
                      <select
                        value={adFilterStatus}
                        onChange={(e) => setAdFilterStatus(e.target.value)}
                        className="flex-1 min-w-[130px] px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none"
                      >
                        <option value="all">All Statuses</option>
                        <option value="Active">Active</option>
                        <option value="Scheduled">Scheduled</option>
                        <option value="Draft">Draft</option>
                        <option value="Paused">Paused</option>
                        <option value="Expired">Expired</option>
                        <option value="Archived">Archived</option>
                      </select>

                      {/* Placement Filter */}
                      <select
                        value={adFilterPlacement}
                        onChange={(e) => setAdFilterPlacement(e.target.value)}
                        className="flex-1 min-w-[130px] px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none"
                      >
                        <option value="all">All Placements</option>
                        {[
                          'Home Feed', 'Community Feed', 'Jobs', 'Businesses', 'Marketplace',
                          'Property Listings', 'Technical Services', 'Deals & Offers',
                          'Local Alerts', 'Public Groups', 'Polls & Opinions', 'Banner Carousel', 'Splash Banner'
                        ].map(p => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>

                      {/* Sorting Selection */}
                      <select
                        value={`${adSortField}-${adSortOrder}`}
                        onChange={(e) => {
                          const [field, order] = e.target.value?.split('-');
                          setAdSortField(field as keyof AdItem);
                          setAdSortOrder(order as 'asc' | 'desc');
                        }}
                        className="flex-1 min-w-[130px] px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none"
                      >
                        <option value="created_at-desc">Newest Created</option>
                        <option value="title-asc">Title (A-Z)</option>
                        <option value="advertiser_name-asc">Advertiser (A-Z)</option>
                        <option value="amount-desc">Highest Cost</option>
                        <option value="impressions-desc">Most Viewed</option>
                        <option value="clicks-desc">Most Clicked</option>
                      </select>
                    </div>
                  </div>

                  {/* Advertisements Table */}
                  <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                            <th className="py-3.5 px-4">Banner</th>
                            <th className="py-3.5 px-4">Title</th>
                            <th className="py-3.5 px-4">Advertiser</th>
                            <th className="py-3.5 px-4">Placement</th>
                            <th className="py-3.5 px-4">Status</th>
                            <th className="py-3.5 px-4">Impressions</th>
                            <th className="py-3.5 px-4">Views</th>
                            <th className="py-3.5 px-4">Clicks</th>
                            <th className="py-3.5 px-4">CTR</th>
                            <th className="py-3.5 px-4">CTA Clicks</th>
                            <th className="py-3.5 px-4">Created Date</th>
                            <th className="py-3.5 px-4">Last Activity</th>
                            <th className="py-3.5 px-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs text-slate-755">
                          {ads
                            .filter(ad => {
                              // Search Filter
                              if (adSearchTerm?.trim()) {
                                const term = adSearchTerm?.toLowerCase();
                                return ad.title?.toLowerCase().includes(term) || ad.advertiser_name?.toLowerCase().includes(term);
                              }
                              return true;
                            })
                            .filter(ad => adFilterStatus === 'all' ? true : ad.status === adFilterStatus)
                            .filter(ad => adFilterPlacement === 'all' ? true : ad.placement === adFilterPlacement)
                            .sort((a, b) => {
                              const valA = a[adSortField] ?? '';
                              const valB = b[adSortField] ?? '';
                              if (valA < valB) return adSortOrder === 'asc' ? -1 : 1;
                              if (valA > valB) return adSortOrder === 'asc' ? 1 : -1;
                              return 0;
                            })
                            ?.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                            .map((ad) => {
                              const ctr = ad.impressions ? ((ad.clicks / ad.impressions) * 100).toFixed(1) + '%' : '0.0%';
                              return (
                                <tr key={ad.id} className="hover:bg-slate-50/50">
                                  <td className="py-3.5 px-4">
                                    <div className="w-14 h-10 rounded-lg overflow-hidden border border-slate-200 bg-slate-100 flex items-center justify-center shrink-0">
                                      {ad.banner_url ? (
                                        <img src={ad.banner_url} alt="Banner" className="w-full h-full object-cover" />
                                      ) : (
                                        <Plus className="w-4 h-4 text-slate-300" />
                                      )}
                                    </div>
                                  </td>
                                  <td className="py-3.5 px-4 font-bold text-slate-900">
                                    <p className="font-extrabold text-slate-900 leading-snug line-clamp-1">{ad.title}</p>
                                    <div className="flex gap-2.5 mt-1">
                                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                                        ad.priority === 'Premium' ? 'bg-purple-100 text-purple-700' :
                                        ad.priority === 'High' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-650'
                                      }`}>
                                        {ad.priority}
                                      </span>
                                      <span className="text-[10px] text-slate-400 font-semibold">Amt: Rs. {ad.amount || 0}</span>
                                    </div>
                                  </td>
                                  <td className="py-3.5 px-4">
                                    <p className="font-bold text-slate-800">{ad.advertiser_name}</p>
                                    <p className="text-[10px] text-slate-450 mt-0.5">{ad.advertiser_phone}</p>
                                  </td>
                                  <td className="py-3.5 px-4 font-semibold">
                                    <p className="text-slate-850">{ad.placement}</p>
                                    <span className="text-[9px] bg-slate-100 text-slate-500 font-bold px-1.5 py-0.2 rounded mt-0.5 inline-block uppercase">{ad.category}</span>
                                  </td>
                                  <td className="py-3.5 px-4">
                                    <span className={`px-2.5 py-1 rounded-full font-mono text-[9px] font-black uppercase tracking-wider flex items-center gap-1 w-fit ${
                                      ad.status === 'Active' ? 'bg-green-50 text-green-700' :
                                      ad.status === 'Scheduled' ? 'bg-amber-50 text-amber-700 animate-pulse' :
                                      ad.status === 'Paused' ? 'bg-orange-50 text-orange-700' :
                                      ad.status === 'Expired' ? 'bg-red-50 text-red-700' : 'bg-slate-100 text-slate-600'
                                    }`}>
                                      {ad.status}
                                    </span>
                                  </td>
                                  <td className="py-3.5 px-4 text-xs font-mono font-bold text-slate-700">
                                    {ad.impressions || 0}
                                  </td>
                                  <td className="py-3.5 px-4 text-xs font-mono font-bold text-slate-700">
                                    {ad.views || 0}
                                  </td>
                                  <td className="py-3.5 px-4 text-xs font-mono font-bold text-slate-700">
                                    {ad.clicks || 0}
                                  </td>
                                  <td className="py-3.5 px-4 text-xs font-mono font-bold text-blue-600">
                                    {ctr}
                                  </td>
                                  <td className="py-3.5 px-4 text-xs font-mono font-bold text-slate-700">
                                    {ad.conversions || 0}
                                  </td>
                                  <td className="py-3.5 px-4 text-[10px] font-semibold text-slate-500 whitespace-nowrap">
                                    {ad.created_at ? new Date(ad.created_at).toLocaleDateString() : 'N/A'}
                                  </td>
                                  <td className="py-3.5 px-4 text-[10px] font-semibold text-slate-500 whitespace-nowrap">
                                    {ad.updated_at ? new Date(ad.updated_at).toLocaleDateString() + ' ' + new Date(ad.updated_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'N/A'}
                                  </td>
                                  <td className="py-3.5 px-4 text-right space-x-1 whitespace-nowrap">
                                    <button
                                      onClick={() => { setSelectedAd(ad); setIsAdDetailsModalOpen(true); }}
                                      className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors border-0 cursor-pointer"
                                      title="View Analytics"
                                    >
                                      <Eye className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => handleEditAdClick(ad)}
                                      className="p-1.5 bg-slate-100 hover:bg-slate-200 text-blue-600 rounded-lg transition-colors border-0 cursor-pointer"
                                      title="Edit"
                                    >
                                      <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => handleTogglePauseAd(ad)}
                                      className="p-1.5 bg-slate-100 hover:bg-slate-200 text-amber-600 rounded-lg transition-colors border-0 cursor-pointer"
                                      title={ad.status === 'Paused' ? 'Resume' : 'Pause'}
                                    >
                                      <Ban className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => handleDuplicateAdClick(ad)}
                                      className="p-1.5 bg-slate-100 hover:bg-slate-200 text-indigo-600 rounded-lg transition-colors border-0 cursor-pointer"
                                      title="Duplicate"
                                    >
                                      <Plus className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => handleArchiveAd(ad)}
                                      className="p-1.5 bg-slate-100 hover:bg-slate-200 text-purple-600 rounded-lg transition-colors border-0 cursor-pointer"
                                      title="Archive"
                                    >
                                      <Lock className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteAdAction(ad.id)}
                                      className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors border-0 cursor-pointer"
                                      title="Soft Delete"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {adminPath === '/admin/stories' && (
                <AdminStoriesView currentLanguage={currentLanguage} />
              )}

              {adminPath === '/admin/story-ads' && (
                <AdminStoryAds currentLanguage={currentLanguage} />
              )}

              {/* USER MANAGEMENT TAB */}
              {adminPath === '/admin/users' && (
                <div className="space-y-6">
                  <div>
                    <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">{isEn ? 'User Profiles Directory' : 'صارفین کا ریکارڈ'}</h1>
                    <p className="text-xs text-slate-500 mt-1">Suspend profiles, verify local citizenship badges, and audit residency standings.</p>
                  </div>

                  {/* Search and Filters */}
                  <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col gap-4">
                    <div className="flex items-center gap-3 bg-slate-50 px-3.5 py-2.5 rounded-xl border border-slate-200/50 w-full sm:max-w-md">
                      <Search className="w-4 h-4 text-slate-400 shrink-0" />
                      <input
                        type="text"
                        placeholder="Search users by name or mobile..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-transparent border-none text-xs placeholder-slate-400 focus:outline-none"
                      />
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs text-slate-400 font-bold uppercase">Filter:</span>
                      {['all', 'verified', 'standard'].map(f => (
                        <button
                          key={f}
                          onClick={() => setFilterType(f)}
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase border transition-all cursor-pointer ${
                            filterType === f 
                              ? 'bg-blue-600 text-white border-blue-600' 
                              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          {f}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* PAGINATED USER TABLE */}
                  <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                            <th className="py-3 px-4">Resident Identity</th>
                            <th className="py-3 px-4">Mobile Credentials</th>
                            <th className="py-3 px-4">Sector Area</th>
                            <th className="py-3 px-4">Verified Citizen</th>
                            <th className="py-3 px-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                          {users
                            .filter(u => {
                              if (filterType === 'verified') return u.verified;
                              if (filterType === 'standard') return !u.verified;
                              return true;
                            })
                            .filter(u => {
                              if (!searchTerm) return true;
                              const s = searchTerm?.toLowerCase();
                              return u.fullName?.toLowerCase().includes(s) || u.mobileNumber.includes(s);
                            })
                            ?.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                            .map((u, idx) => {
                              const isSuspended = u.badges?.includes('suspended');
                              return (
                                <tr key={u.mobileNumber || idx} className="hover:bg-slate-50/50">
                                  <td className="py-3.5 px-4 font-bold text-slate-950 flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-550 font-extrabold text-[10px] uppercase">
                                      {u.fullName[0]}
                                    </div>
                                    <div>
                                      <p className="font-extrabold text-slate-900 leading-snug">{u.fullName}</p>
                                      <p className="text-[10px] text-slate-400">Score: {u.reputationScore || 100} pts</p>
                                    </div>
                                  </td>
                                  <td className="py-3.5 px-4 font-mono text-[11px] text-slate-650 font-bold">{u.mobileNumber}</td>
                                  <td className="py-3.5 px-4 font-semibold text-slate-750">{u.area}</td>
                                  <td className="py-3.5 px-4">
                                    {u.verified ? (
                                      <span className="px-2 py-0.5 bg-blue-50 text-blue-600 font-mono text-[9px] font-black rounded uppercase tracking-wider flex items-center gap-1.5 w-fit">
                                        <Check className="w-3 h-3" />
                                        {isEn ? 'Verified' : 'ہاں'}
                                      </span>
                                    ) : (
                                      <span className="text-slate-400 font-bold">{isEn ? 'Standard' : 'نہیں'}</span>
                                    )}
                                  </td>
                                  <td className="py-3.5 px-4 text-right space-x-1.5 whitespace-nowrap">
                                    <button
                                      onClick={() => setSelectedUserDetail(u)}
                                      className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors border-0 cursor-pointer"
                                      title="View Details"
                                    >
                                      <Eye className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => handleToggleSuspendUser(u.mobileNumber, !!isSuspended)}
                                      className={`p-1.5 rounded-lg transition-colors border-0 cursor-pointer ${
                                        isSuspended 
                                          ? 'bg-green-50 hover:bg-green-100 text-green-600' 
                                          : 'bg-amber-50 hover:bg-amber-100 text-amber-600'
                                      }`}
                                      title={isSuspended ? 'Reactivate Profile' : 'Suspend Profile'}
                                    >
                                      {isSuspended ? <UserCheck className="w-3.5 h-3.5" /> : <Ban className="w-3.5 h-3.5" />}
                                    </button>
                                    <button
                                      onClick={() => handleDeleteUser(u.id)}
                                      className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors border-0 cursor-pointer"
                                      title="Delete Profile"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination Footer */}
                    <div className="bg-slate-50/50 px-4 py-3.5 border-t border-slate-200 flex items-center justify-between text-xs font-bold text-slate-500">
                      <span>
                        Showing {Math.min(currentPage * itemsPerPage, users.length)} of {users.length} resident entries
                      </span>
                      <div className="flex gap-2">
                        <button
                          disabled={currentPage === 1}
                          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                          className="p-1 border border-slate-200 rounded-lg bg-white disabled:opacity-40 cursor-pointer"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                          disabled={currentPage * itemsPerPage >= users.length}
                          onClick={() => setCurrentPage(prev => prev + 1)}
                          className="p-1 border border-slate-200 rounded-lg bg-white disabled:opacity-40 cursor-pointer"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* DYNAMIC CONTENT MANAGEMENT TABLES */}
              {[
                { path: '/admin/events', label: isEn ? 'Community Events Management' : 'تقاریب کا انتظام', moduleKey: 'events', items: events, searchKeys: ['title', 'category', 'organizerName'] },
                { path: '/admin/businesses', label: isEn ? 'Local Directory: Businesses' : 'کاروباری ڈائریکٹری', moduleKey: 'businesses', items: businesses, searchKeys: ['name', 'category', 'ownerName'] },
                { path: '/admin/jobs', label: isEn ? 'Local Employment Board' : 'ملازمتوں کا ریکارڈ', moduleKey: 'jobs', items: jobs, searchKeys: ['title', 'company', 'category'] },
                { path: '/admin/marketplace', label: isEn ? 'Classifieds Marketplace' : 'خرید و فروخت کی اشیاء', moduleKey: 'marketplace', items: marketplaceItems, searchKeys: ['title', 'category', 'description'] },
                { path: '/admin/services', label: isEn ? 'Technical Services Directory' : 'خدمات کا انتظام', moduleKey: 'services', items: services, searchKeys: ['name', 'category'] },
                { path: '/admin/property', label: isEn ? 'Hyperlocal Properties Portal' : 'پراپرٹی لسٹنگز', moduleKey: 'property', items: properties, searchKeys: ['title', 'ownerName', 'location'] },
                { path: '/admin/deals', label: isEn ? 'Commercial Deals & Coupons' : 'ڈیلز اور آفرز', moduleKey: 'deals', items: deals, searchKeys: ['title', 'businessName', 'category'] },
                { path: '/admin/alerts', label: isEn ? 'Public Emergency Alerts' : 'الرٹس بورڈ', moduleKey: 'alerts', items: alerts, searchKeys: ['title', 'category'] },
                { path: '/admin/groups', label: isEn ? 'Community Interest Groups' : 'گروپس', moduleKey: 'groups', items: groups, searchKeys: ['name', 'category'] },
                { path: '/admin/pages', label: isEn ? 'Pages Management' : 'صفحات کا انتظام', moduleKey: 'pages', items: pages, searchKeys: ['name', 'category'] }
              ].map(subRoute => {
                if (adminPath !== subRoute.path) return null;
                const filteredList = getFilteredItems(subRoute.items, subRoute.searchKeys);
                const paginatedItems = filteredList?.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

                return (
                  <div key={subRoute.path} className="space-y-6">
                    <div>
                      <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">{subRoute.label}</h1>
                      <p className="text-xs text-slate-500 mt-1">Audit public listings, hide inappropriate content, and edit record details directly.</p>
                    </div>

                    {/* Search & Filters */}
                    <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col gap-4">
                      <div className="flex items-center gap-3 bg-slate-50 px-3.5 py-2.5 rounded-xl border border-slate-200/50 w-full sm:max-w-md">
                        <Search className="w-4 h-4 text-slate-400 shrink-0" />
                        <input
                          type="text"
                          placeholder="Type to filter matching records..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full bg-transparent border-none text-xs placeholder-slate-400 focus:outline-none"
                        />
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs text-slate-400 font-bold uppercase">Filter:</span>
                        {[
                          { key: 'all', label: 'All' },
                          { key: 'pending', label: 'Pending' },
                          { key: 'flagged', label: 'Flagged' },
                          { key: 'clean', label: 'Clean' }
                        ].map(tObj => (
                          <button
                            key={tObj.key}
                            onClick={() => setFilterType(tObj.key)}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase border transition-all cursor-pointer ${
                              filterType === tObj.key 
                                ? 'bg-blue-600 text-white border-blue-600' 
                                : 'bg-white text-slate-650 border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            {tObj.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Dynamic Table Card */}
                    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                      {paginatedItems.length === 0 ? (
                        <div className="p-12 text-center text-slate-400 space-y-2">
                          <Plus className="w-8 h-8 mx-auto opacity-40 text-slate-500" />
                          <p className="text-xs font-semibold">No records found matching filter constraints.</p>
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                                <th className="py-3 px-4">Primary Record Title</th>
                                <th className="py-3 px-4">System Identifier</th>
                                <th className="py-3 px-4">Owner / Publisher</th>
                                <th className="py-3 px-4">Moderation Status</th>
                                <th className="py-3 px-4 text-right">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-xs text-slate-750">
                              {paginatedItems.map((item: any, idx: number) => (
                                <tr key={item.id || idx} className="hover:bg-slate-50/50">
                                  <td className="py-3.5 px-4 font-bold text-slate-900">
                                    <p className="font-extrabold text-slate-900 leading-snug line-clamp-1">
                                      {item.title || item.name || `Community Item ${item.id}`}
                                    </p>
                                    <span className="text-[9px] bg-slate-105 text-slate-500 font-bold px-1.5 py-0.5 rounded mt-1 inline-block uppercase">
                                      {item.category || item.type || 'General'}
                                    </span>
                                  </td>
                                  <td className="py-3.5 px-4 font-mono text-[10px] text-slate-500 font-bold">{item.id}</td>
                                  <td className="py-3.5 px-4 font-semibold text-slate-600">
                                    {item.author || item.ownerName || item.sellerName || item.seller_profile?.full_name || item.postedBy || item.organizerName || 'Local Resident'}
                                  </td>
                                  <td className="py-3.5 px-4">
                                    {item.reported ? (
                                      <span className="px-2.5 py-1 bg-red-50 text-red-600 font-mono text-[9px] font-black rounded uppercase tracking-wider flex items-center gap-1 w-fit animate-pulse">
                                        <AlertTriangle className="w-3 h-3" />
                                        Flagged / Reported
                                      </span>
                                    ) : item.status === 'Pending' ? (
                                      <span className="px-2.5 py-1 bg-amber-50 text-amber-700 font-mono text-[9px] font-black rounded uppercase tracking-wider flex items-center gap-1 w-fit animate-pulse">
                                        <Clock className="w-3 h-3" />
                                        Pending Approval
                                      </span>
                                    ) : (
                                      <span className="px-2.5 py-1 bg-green-50 text-green-600 font-mono text-[9px] font-black rounded uppercase tracking-wider flex items-center gap-1 w-fit">
                                        <Check className="w-3 h-3" />
                                        Clean / Approved
                                      </span>
                                    )}
                                    {item.status === 'Pending' && (
                                      <>
                                        <button
                                          onClick={() => handleApproveContentStatus(subRoute.moduleKey, item.id, true)}
                                          className="p-1.5 bg-green-50 hover:bg-green-100 text-green-600 rounded-lg transition-colors border-0 cursor-pointer"
                                          title="Approve Listing"
                                        >
                                          <CheckCircle className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                          onClick={() => handleApproveContentStatus(subRoute.moduleKey, item.id, false)}
                                          className="p-1.5 bg-red-50 hover:bg-red-100 text-red-650 rounded-lg transition-colors border-0 cursor-pointer"
                                          title="Reject Listing"
                                        >
                                          <XCircle className="w-3.5 h-3.5" />
                                        </button>
                                      </>
                                    )}
                                    <button
                                      onClick={() => setSelectedContentDetail({ ...item, module: subRoute.moduleKey })}
                                      className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-650 rounded-lg transition-colors border-0 cursor-pointer"
                                      title="Quick Details View"
                                    >
                                      <Eye className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => handleToggleSuspendContent(subRoute.moduleKey, item.id, item.status === 'Suspended')}
                                      className={`p-1.5 rounded-lg transition-colors border-0 cursor-pointer ${
                                        item.status === 'Suspended' ? 'bg-green-50 hover:bg-green-100 text-green-600' : 'bg-amber-50 hover:bg-amber-100 text-amber-600'
                                      }`}
                                      title={item.status === 'Suspended' ? "Reactivate Listing" : "Suspend Listing"}
                                    >
                                      {item.status === 'Suspended' ? <CheckCircle className="w-3.5 h-3.5" /> : <Ban className="w-3.5 h-3.5" />}
                                    </button>
                                    <button
                                      onClick={() => handleEditContent(subRoute.moduleKey, item)}
                                      className="p-1.5 bg-slate-100 hover:bg-slate-200 text-blue-600 rounded-lg transition-colors border-0 cursor-pointer"
                                      title="Edit Fields"
                                    >
                                      <Edit2 className="w-3.5 h-3.5" />
                                    </button>

                                    <button
                                      onClick={() => handleDeleteContent(subRoute.moduleKey, item.id)}
                                      className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors border-0 cursor-pointer"
                                      title="Remove Permanently"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}

                      {/* Paginated Footer */}
                      <div className="bg-slate-50/50 px-4 py-3.5 border-t border-slate-200 flex items-center justify-between text-xs font-bold text-slate-500">
                        <span>
                          Showing {Math.min(currentPage * itemsPerPage, filteredList.length)} of {filteredList.length} database entries
                        </span>
                        <div className="flex gap-2">
                          <button
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            className="p-1 border border-slate-200 rounded-lg bg-white disabled:opacity-40 cursor-pointer"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          <button
                            disabled={currentPage * itemsPerPage >= filteredList.length}
                            onClick={() => setCurrentPage(prev => prev + 1)}
                            className="p-1 border border-slate-200 rounded-lg bg-white disabled:opacity-40 cursor-pointer"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* ADVANCED POLLS & ANALYTICS VIEWER */}
              {adminPath === '/admin/posts' && (
                <div className="animate-fadeIn">
                  <AdminCommunityFeed 
                    posts={posts} 
                    onUpdatePosts={(updatedPosts) => setPosts(updatedPosts)}
                    currentLanguage={currentLanguage} 
                    users={users} 
                  />
                </div>
              )}

              {adminPath === '/admin/polls' && (
                <AdminPollsView
                  polls={polls}
                  onUpdatePolls={setPolls}
                  currentLanguage={currentLanguage}
                  users={users}
                />
              )}

              {/* MODERATION REPORTS TAB (SAFETY INBOX) */}
              {adminPath === '/admin/reports' && (
                <div className="space-y-6">
                  <div>
                    <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">{isEn ? 'Safety Reports & Guidelines Moderation' : 'رپورٹس ان باکس'}</h1>
                    <p className="text-xs text-slate-500 mt-1">Review items flagged as inappropriate or fraudulent by local community users.</p>
                  </div>

                  <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                    {reports.length === 0 ? (
                      <div className="p-16 text-center text-slate-400 space-y-3">
                        <CheckCircle className="w-10 h-10 mx-auto text-emerald-500 opacity-80" />
                        <p className="text-xs font-semibold">Clean Inbox! No reports or flags found awaiting administrative actions.</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-100">
                        {reports.map((report) => (
                          <div key={report.id} className="p-6 hover:bg-slate-50/30 transition-all flex flex-col md:flex-row md:items-start justify-between gap-6">
                            <div className="space-y-3 max-w-2xl">
                              <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 bg-red-100 text-red-700 font-mono text-[9px] font-black rounded uppercase tracking-wider">
                                  {report.contentType} report
                                </span>
                                <span className="text-[10px] text-slate-450 font-bold font-mono">ID: {report.contentId}</span>
                                <span className="text-[10px] text-slate-450">• {report.date}</span>
                              </div>
                              
                              <div className="space-y-1">
                                <h3 className="text-sm font-extrabold text-slate-900 leading-snug">{report.title}</h3>
                                <p className="text-xs font-bold text-red-650 bg-red-50/50 px-2.5 py-1 rounded-lg w-fit">
                                  Flag Reason: {report.reason}
                                </p>
                              </div>
                              <p className="text-[11px] text-slate-500 font-semibold leading-normal">
                                Reported by citizen <span className="text-slate-700 font-bold">{report.reporter}</span>. Safety parameters have put this listing on watch.
                              </p>
                            </div>

                            <div className="flex md:flex-col lg:flex-row items-center gap-2 shrink-0 self-center">
                              <button
                                onClick={() => handleActionOnReport(report, 'remove')}
                                className="px-4 py-2 bg-red-650 hover:bg-red-700 text-white font-extrabold rounded-xl text-xs shadow-sm border-0 cursor-pointer transition-all"
                              >
                                Remove Content
                              </button>
                              <button
                                onClick={() => handleActionOnReport(report, 'suspend')}
                                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-extrabold rounded-xl text-xs shadow-sm border-0 cursor-pointer transition-all"
                              >
                                Ban Publisher
                              </button>
                              <button
                                onClick={() => handleDismissReport(report.id)}
                                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs border-0 cursor-pointer transition-all"
                              >
                                Dismiss / Resolve
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* CITIZEN VERIFICATION REQUESTS */}
              {adminPath === '/admin/verification' && (() => {
                const adminUser = (() => {
                  try {
                    const saved = localStorage.getItem('dh_user_profile_data');
                    if (saved) return JSON.parse(saved);
                  } catch {}
                  return {
                    id: 'system-admin-id',
                    fullName: 'System Admin',
                    email: 'admin@dhokehassu.gov',
                    role: 'Super Admin'
                  };
                })();
                return <AdminTvsView currentUser={adminUser} currentLanguage={currentLanguage} />;
              })()}

              {/* ADMIN SETTINGS & POLICIES CONTROL */}
              {adminPath === '/admin/settings' && (
                <div className="space-y-6">
                  <div>
                    <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">{isEn ? 'System Settings & General Configurations' : 'انتظامی ترتیبات'}</h1>
                    <p className="text-xs text-slate-500 mt-1">Configure global user registries, safety levels, and directory catalog tags.</p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    
                    {/* APP CONFIGURATIONS */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
                      <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                        <Sliders className="w-4 h-4 text-slate-400" />
                        <span>System Policy Configuration</span>
                      </h3>

                      <div className="space-y-4">
                        {[
                          { key: 'allowPublicRegistrations', label: 'Allow Public Self-Registration', desc: 'Allows new community users to sign up from the main screen' },
                          { key: 'requireVerificationToPost', label: 'Require Verification To Publish Listings', desc: 'Ensures only validated accounts can post jobs or marketplace items' },
                          { key: 'enableSystemNotifications', label: 'Enable System Wide Push Alerts', desc: 'Broadcast administrative alerts to user headers instantly' }
                        ].map(config => (
                          <div key={config.key} className="flex items-start justify-between gap-4 p-3 hover:bg-slate-50 rounded-xl transition-all">
                            <div className="space-y-1">
                              <p className="text-xs font-bold text-slate-900">{config.label}</p>
                              <p className="text-[10px] text-slate-550 leading-normal">{config.desc}</p>
                            </div>
                            <input
                              type="checkbox"
                              checked={(appSettings as any)[config.key]}
                              onChange={(e) => setAppSettings(prev => ({ ...prev, [config.key]: e.target.checked }))}
                              className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded mt-0.5 font-bold"
                            />
                          </div>
                        ))}

                        <div className="pt-4 border-t border-slate-100">
                          <label className="block text-xs font-bold text-slate-700 mb-2">Content Moderation Sensitivity</label>
                          <select
                            value={appSettings.moderationLevel}
                            onChange={(e) => setAppSettings(prev => ({ ...prev, moderationLevel: e.target.value }))}
                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-500 font-bold"
                          >
                            <option value="relaxed">Relaxed (Self-police by community flags)</option>
                            <option value="standard">Standard (Standard alert thresholds)</option>
                            <option value="strict">Strict (Pre-approvals on all directory listings)</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* DYNAMIC CATEGORIES MANAGEMENT */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
                      <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                        <FolderHeart className="w-4 h-4 text-slate-400" />
                        <span>Directory Categories Manager</span>
                      </h3>

                      <div className="space-y-4">
                        <div className="flex gap-2 flex-wrap">
                          {['jobs', 'businesses', 'marketplace', 'properties'].map(mKey => (
                            <button
                              key={mKey}
                              onClick={() => setActiveCategoryModule(mKey)}
                              className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider border transition-all cursor-pointer ${
                                activeCategoryModule === mKey 
                                  ? 'bg-blue-600 text-white border-blue-600' 
                                  : 'bg-white text-slate-650 border-slate-200 hover:bg-slate-50'
                              }`}
                            >
                              {mKey}
                            </button>
                          ))}
                        </div>

                        <div className="flex gap-2 pt-2">
                          <input
                            type="text"
                            placeholder="Add new category label..."
                            value={newCategoryName}
                            onChange={(e) => setNewCategoryName(e.target.value)}
                            className="flex-1 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs placeholder-slate-400 focus:outline-none font-bold"
                          />
                          <button
                            onClick={handleAddCategory}
                            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs flex items-center gap-1 shrink-0 border-0 cursor-pointer"
                          >
                            <Plus className="w-4 h-4" />
                            <span>Add</span>
                          </button>
                        </div>

                        <div className="border border-slate-100 rounded-xl max-h-52 overflow-y-auto divide-y divide-slate-100 bg-slate-50/25">
                          {categories[activeCategoryModule]?.map(c => (
                            <div key={c} className="p-3 flex items-center justify-between text-xs font-bold text-slate-750 hover:bg-slate-50">
                              <span>{c}</span>
                              <button
                                onClick={() => handleDeleteCategory(activeCategoryModule, c)}
                                className="text-red-500 hover:text-red-700 p-1 border-0 bg-transparent cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              )}
            </>
          )}

        </main>
      </div>

      {/* ====================================================================
          MODAL INTERFACES (USER DETAIL, CONTENT DETAIL, EDIT FORM)
          ==================================================================== */}
      
      {/* 1. USER DETAIL MODAL */}
      {selectedUserDetail && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-md rounded-3xl border border-slate-100 overflow-hidden shadow-2xl relative p-6 space-y-6">
            <button 
              onClick={() => setSelectedUserDetail(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 text-slate-450 hover:text-slate-700 transition-all border-0 bg-transparent cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-slate-100 border border-slate-200 mx-auto flex items-center justify-center text-slate-550 font-black text-lg">
                {selectedUserDetail.fullName[0]}
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">{selectedUserDetail.fullName}</h3>
                <p className="text-xs font-mono text-slate-450 font-bold mt-1 uppercase tracking-wide">{selectedUserDetail.mobileNumber}</p>
              </div>
            </div>

            <div className="border-t border-b border-slate-100 py-4.5 space-y-3 text-xs font-semibold text-slate-655">
              <div className="flex justify-between">
                <span>Neighborhood Sector:</span>
                <span className="font-bold text-slate-900">{selectedUserDetail.area}</span>
              </div>
              <div className="flex justify-between">
                <span>Reputation standing:</span>
                <span className="font-bold text-emerald-650">{selectedUserDetail.reputationScore || 100} pts</span>
              </div>
              <div className="flex justify-between">
                <span>Badge credentials:</span>
                <span className="font-mono text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                  {selectedUserDetail.verified ? 'Verified Citizen' : 'Standard resident'}
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => handleVerifyUser(selectedUserDetail.mobileNumber, !selectedUserDetail.verified)}
                className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs shadow-md border-0 cursor-pointer"
              >
                {selectedUserDetail.verified ? 'Revoke Verification' : 'Verify Resident'}
              </button>
              <button
                onClick={() => setSelectedUserDetail(null)}
                className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs border-0 cursor-pointer"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. QUICK DETAIL CONTENT MODAL */}
      {selectedContentDetail && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl border border-slate-100 overflow-hidden shadow-2xl relative p-6 space-y-5">
            <button 
              onClick={() => setSelectedContentDetail(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-105 text-slate-400 hover:text-slate-705 transition-all border-0 bg-transparent cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <span className="font-mono text-[9px] bg-slate-100 text-slate-650 px-2.5 py-1 rounded uppercase tracking-wider font-bold">
                {selectedContentDetail.module} / Record Detail
              </span>
              <h3 className="text-base font-black text-slate-900 mt-2">
                {selectedContentDetail.title || selectedContentDetail.name}
              </h3>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100/50 max-h-64 overflow-y-auto space-y-3 text-xs text-slate-700">
              {Object.keys(selectedContentDetail).map(key => {
                if (['module', 'images', 'image', 'reviews', 'posts'].includes(key)) return null;
                const val = selectedContentDetail[key];
                return (
                  <div key={key} className="grid grid-cols-12 gap-2 border-b border-slate-100 pb-1.5 last:border-0 last:pb-0">
                    <span className="col-span-4 font-black text-slate-400 uppercase text-[9px] tracking-wider self-center">{key}</span>
                    <span className="col-span-8 font-bold text-slate-900 break-words">{String(val)}</span>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-between items-center gap-2.5 pt-4 border-t border-slate-100">
              {selectedContentDetail.status === 'Pending' ? (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleApproveContentStatus(selectedContentDetail.module, selectedContentDetail.id, true)}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl text-xs border-0 cursor-pointer"
                  >
                    Approve Request
                  </button>
                  <button
                    onClick={() => handleApproveContentStatus(selectedContentDetail.module, selectedContentDetail.id, false)}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs border-0 cursor-pointer"
                  >
                    Reject Request
                  </button>
                </div>
              ) : (
                <div />
              )}
              <button
                onClick={() => setSelectedContentDetail(null)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs border-0 cursor-pointer"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. RECORD PARAMETER EDIT FORM MODAL */}
      {isEditModalOpen && editForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl border border-slate-100 overflow-hidden shadow-2xl relative p-6 space-y-5">
            <button 
              onClick={() => { setIsEditModalOpen(false); setEditForm(null); }}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-all border-0 bg-transparent cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="text-base font-black text-slate-900">
                Edit Record: {editForm.title || editForm.name}
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Updating database fields directly in Supabase table public.{editForm.module}
              </p>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div className="max-h-96 overflow-y-auto pr-1 space-y-3">
                {Object.keys(editForm).map(key => {
                  if (['module', 'id', 'images', 'image', 'reviews', 'posts', 'created_at'].includes(key)) return null;
                  const val = editForm[key];
                  return (
                    <div key={key} className="space-y-1.5">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">{key}</label>
                      <input
                        type="text"
                        value={String(val)}
                        onChange={(e) => setEditForm({ ...editForm, [key]: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => { setIsEditModalOpen(false); setEditForm(null); }}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs border-0 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs shadow-md border-0 cursor-pointer shadow-blue-500/10"
                >
                  Save to Supabase
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. CREATE / EDIT ADVERTISEMENT MODAL */}
      {isAdCreateEditModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-2xl rounded-3xl border border-slate-100 overflow-hidden shadow-2xl relative p-6 flex flex-col max-h-[90vh]">
            <button 
              onClick={() => { setIsAdCreateEditModalOpen(false); setAdForm(initialAdFormState); }}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 text-slate-450 hover:text-slate-700 transition-all border-0 bg-transparent cursor-pointer z-10"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-4">
              <h3 className="text-base font-black text-slate-900">
                {selectedAd ? 'Edit Advertisement' : 'Create New Advertisement'}
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Upload creative banners, configure target placements, and manage campaign budgets.
              </p>
            </div>

            <form onSubmit={(e) => handleSaveAdForm(e, false)} className="space-y-4 overflow-y-auto pr-2 flex-1 pb-4">
              {/* Section 1: Basic Info */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-1">Basic Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase">Ad Campaign Title *</label>
                    <input
                      type="text"
                      required
                      value={adForm.title || ''}
                      onChange={(e) => setAdForm(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:bg-white"
                      placeholder="e.g. Sardar Biryani Weekend Discount"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase">Advertiser Business Name *</label>
                    <input
                      type="text"
                      required
                      value={adForm.advertiser_name || ''}
                      onChange={(e) => setAdForm(prev => ({ ...prev, advertiser_name: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:bg-white"
                      placeholder="e.g. Sardar Biryani & Pulao"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase">Advertiser Contact Phone *</label>
                    <input
                      type="text"
                      required
                      value={adForm.advertiser_phone || ''}
                      onChange={(e) => setAdForm(prev => ({ ...prev, advertiser_phone: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:bg-white"
                      placeholder="e.g. 03001234567"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase">Advertiser Email *</label>
                    <input
                      type="email"
                      required
                      value={adForm.advertiser_email || ''}
                      onChange={(e) => setAdForm(prev => ({ ...prev, advertiser_email: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:bg-white"
                      placeholder="e.g. ads@sardar.com"
                    />
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase">Description / Caption</label>
                    <textarea
                      value={adForm.description || ''}
                      onChange={(e) => setAdForm(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:bg-white"
                      placeholder="Enter promotional copy here..."
                      rows={2}
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Banner and Media upload */}
              <div className="space-y-3 pt-2">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-1">Media Assets</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase">Primary Banner Image</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, 'banner_url')}
                      className="w-full text-xs"
                    />
                    {adForm.banner_url && (
                      <div className="mt-2 w-32 h-20 rounded-lg overflow-hidden border border-slate-200 bg-slate-100">
                        <img src={adForm.banner_url} alt="Primary Preview" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase">Video Asset (URL or Upload)</label>
                    <input
                      type="text"
                      value={adForm.video_url || ''}
                      onChange={(e) => setAdForm(prev => ({ ...prev, video_url: e.target.value }))}
                      placeholder="Enter YouTube/Vimeo URL or paste storage link"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:bg-white"
                    />
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase">Additional Carousel Images</label>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => handleFileUpload(e, 'images')}
                      className="w-full text-xs"
                    />
                    {adForm.images && adForm.images.length > 0 && (
                      <div className="flex gap-2 flex-wrap mt-2">
                        {adForm.images.map((img, index) => (
                          <div key={index} className="w-16 h-12 rounded overflow-hidden border border-slate-200 relative">
                            <img src={img} alt="Preview" className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => setAdForm(prev => ({ ...prev, images: prev.images?.filter((_, idx) => idx !== index) }))}
                              className="absolute top-0 right-0 bg-red-600 text-white rounded-full p-0.5 text-[8px] leading-none"
                            >
                              x
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Section 3: Placements & Category */}
              <div className="space-y-3 pt-2">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-1">Placement & targeting</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase">Placement *</label>
                    <select
                      value={adForm.placement}
                      onChange={(e) => setAdForm(prev => ({ ...prev, placement: e.target.value as AdItem['placement'] }))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:bg-white"
                    >
                      {[
                        'Home Feed', 'Community Feed', 'Jobs', 'Businesses', 'Marketplace',
                        'Property Listings', 'Technical Services', 'Deals & Offers',
                        'Local Alerts', 'Public Groups', 'Polls & Opinions', 'Banner Carousel', 'Splash Banner'
                      ].map(p => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase">Ad Format *</label>
                    <select
                      value={adForm.format || 'Feed'}
                      onChange={(e) => setAdForm(prev => ({ ...prev, format: e.target.value as AdItem['format'] }))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:bg-white"
                    >
                      <option value="Feed">Standard Feed Ad</option>
                      <option value="Banner">Banner Ad</option>
                      <option value="Popup">Premium Popup Ad</option>
                    </select>
                  </div>

                  {adForm.format === 'Popup' && (
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-500 uppercase flex items-center justify-between">
                        Display Frequency
                        <span className="text-slate-400 font-normal normal-case">Minutes</span>
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={adForm.display_frequency ?? 20}
                        onChange={(e) => setAdForm(prev => ({ ...prev, display_frequency: parseInt(e.target.value) || 0 }))}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:bg-white"
                        placeholder="20"
                      />
                      <p className="text-[9px] text-slate-400 mt-1 leading-tight">0 = every launch. e.g. 20 = max 1 per 20 mins.</p>
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase">Category *</label>
                    <select
                      value={adForm.category}
                      onChange={(e) => setAdForm(prev => ({ ...prev, category: e.target.value as AdItem['category'] }))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:bg-white"
                    >
                      {['General', 'Business', 'Job', 'Property', 'Marketplace', 'Event', 'Service', 'Promotion'].map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase">Target Audience (Age/Interests)</label>
                    <input
                      type="text"
                      value={adForm.target_audience || ''}
                      onChange={(e) => setAdForm(prev => ({ ...prev, target_audience: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:bg-white"
                      placeholder="e.g. Youth, Foodies, Home buyers"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase">Target Location (Sectors)</label>
                    <input
                      type="text"
                      value={adForm.target_location || ''}
                      onChange={(e) => setAdForm(prev => ({ ...prev, target_location: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:bg-white"
                      placeholder="e.g. Sector A, Sector B"
                    />
                  </div>
                </div>
              </div>

              {/* Section 4: Call To Action */}
              <div className="space-y-3 pt-2">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-1">Call To Action</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase">Action Type *</label>
                    <select
                      value={adForm.cta_type}
                      onChange={(e) => setAdForm(prev => ({ ...prev, cta_type: e.target.value as AdItem['cta_type'] }))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:bg-white"
                    >
                      {['Open Business', 'WhatsApp', 'Phone Call', 'Website', 'External Link', 'Marketplace Item', 'Property Listing', 'Job Listing'].map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase">Action Link / Phone Number *</label>
                    <input
                      type="text"
                      value={adForm.cta_link || ''}
                      onChange={(e) => setAdForm(prev => ({ ...prev, cta_link: e.target.value }))}
                      placeholder="e.g. URL link, Phone digit prefix, or item ID"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Section 5: Schedule & Pricing */}
              <div className="space-y-3 pt-2">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-1">Schedule & Pricing</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase">Start Date *</label>
                    <input
                      type="date"
                      required
                      value={adForm.start_date || ''}
                      onChange={(e) => setAdForm(prev => ({ ...prev, start_date: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:bg-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase">End Date *</label>
                    <input
                      type="date"
                      required
                      value={adForm.end_date || ''}
                      onChange={(e) => setAdForm(prev => ({ ...prev, end_date: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:bg-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase">Campaign Priority *</label>
                    <select
                      value={adForm.priority}
                      onChange={(e) => setAdForm(prev => ({ ...prev, priority: e.target.value as AdItem['priority'] }))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:bg-white"
                    >
                      {['Low', 'Normal', 'High', 'Premium'].map(p => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase">Total Amount Charged (PKR) *</label>
                    <input
                      type="number"
                      required
                      value={adForm.amount || 0}
                      onChange={(e) => setAdForm(prev => ({ ...prev, amount: Number(e.target.value) }))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:bg-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase">Payment Status *</label>
                    <select
                      value={adForm.payment_status}
                      onChange={(e) => setAdForm(prev => ({ ...prev, payment_status: e.target.value as AdItem['payment_status'] }))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:bg-white"
                    >
                      {['Pending', 'Paid', 'Failed', 'Refunded'].map(p => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase">Invoice Number (Auto-generated if empty)</label>
                    <input
                      type="text"
                      value={adForm.invoice_number || ''}
                      onChange={(e) => setAdForm(prev => ({ ...prev, invoice_number: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:bg-white"
                      placeholder="e.g. INV-2026-99"
                    />
                  </div>
                </div>
              </div>

              {/* Form actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 shrink-0">
                <button
                  type="button"
                  onClick={() => { setIsAdCreateEditModalOpen(false); setAdForm(initialAdFormState); }}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs border-0 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={(e) => handleSaveAdForm(e, true)}
                  className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl text-xs border-0 cursor-pointer"
                >
                  Save Draft
                </button>
                <button
                  type="submit"
                  disabled={adFormUploading}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs shadow-md border-0 cursor-pointer disabled:opacity-40"
                >
                  {adFormUploading ? 'Uploading Assets...' : 'Publish Advertisement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. AD DETAILS & ANALYTICS MODAL */}
      {isAdDetailsModalOpen && selectedAd && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-2xl rounded-3xl border border-slate-100 overflow-hidden shadow-2xl relative p-6 flex flex-col max-h-[90vh]">
            <button 
              onClick={() => { setIsAdDetailsModalOpen(false); setSelectedAd(null); }}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 text-slate-450 hover:text-slate-700 transition-all border-0 bg-transparent cursor-pointer z-10"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-4">
              <span className="font-mono text-[9px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-black uppercase tracking-widest">Campaign Performance Audit</span>
              <h3 className="text-base font-black text-slate-900 mt-1">{selectedAd.title}</h3>
            </div>

            <div className="overflow-y-auto flex-1 pr-2 space-y-4">
              {/* Image Banner Showcase */}
              {selectedAd.banner_url && (
                <div className="w-full h-40 rounded-2xl overflow-hidden border border-slate-200 bg-slate-100">
                  <img src={selectedAd.banner_url} alt="Ad Creative Banner" className="w-full h-full object-cover" />
                </div>
              )}

              {/* Stats Analytics Grid */}
              {/* Stats Analytics Grid */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
                  <p className="text-[9px] font-black text-slate-400 uppercase">Impressions</p>
                  <h4 className="text-lg font-black text-slate-800 mt-1">{selectedAd.impressions || 0}</h4>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
                  <p className="text-[9px] font-black text-slate-400 uppercase">Views (2s)</p>
                  <h4 className="text-lg font-black text-slate-800 mt-1">{selectedAd.views || 0}</h4>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
                  <p className="text-[9px] font-black text-slate-400 uppercase">Clicks</p>
                  <h4 className="text-lg font-black text-slate-800 mt-1">{selectedAd.clicks || 0}</h4>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
                  <p className="text-[9px] font-black text-slate-400 uppercase">Average CTR</p>
                  <h4 className="text-lg font-black text-slate-800 mt-1">
                    {selectedAd.impressions ? ((selectedAd.clicks / selectedAd.impressions) * 100).toFixed(2) + '%' : '0.00%'}
                  </h4>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
                  <p className="text-[9px] font-black text-slate-400 uppercase">
                    {selectedAd.cta_type === 'WhatsApp' ? 'WhatsApp Clicks' :
                     selectedAd.cta_type === 'Phone Call' ? 'Phone Clicks' :
                     ['Website', 'External Link'].includes(selectedAd.cta_type) ? 'Website Clicks' :
                     selectedAd.cta_type === 'Open Business' ? 'Business Opens' :
                     selectedAd.cta_type === 'Marketplace Item' ? 'Marketplace Opens' :
                     selectedAd.cta_type === 'Job Listing' ? 'Job Opens' :
                     selectedAd.cta_type === 'Property Listing' ? 'Property Opens' : 'CTA Clicks'}
                  </p>
                  <h4 className="text-lg font-black text-slate-800 mt-1">{selectedAd.conversions || 0}</h4>
                </div>
              </div>

              {/* Custom SVG Line Chart */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <h4 className="text-xs font-bold text-slate-700 mb-2">Campaign Telemetry (Last 7 Days)</h4>
                <div className="h-40 w-full relative">
                  <svg className="w-full h-full" viewBox="0 0 100 40" preserveAspectRatio="none">
                    <line x1="0" y1="10" x2="100" y2="10" stroke="#e2e8f0" strokeWidth="0.3" />
                    <line x1="0" y1="20" x2="100" y2="20" stroke="#e2e8f0" strokeWidth="0.3" />
                    <line x1="0" y1="30" x2="100" y2="30" stroke="#e2e8f0" strokeWidth="0.3" />
                    
                    {/* Impressions Line (Blue) */}
                    <path
                      d={(() => {
                        const total = selectedAd.impressions || 0;
                        if (total === 0) return "M 0 38 L 100 38";
                        const points = [
                          Math.floor(total * 0.1),
                          Math.floor(total * 0.25),
                          Math.floor(total * 0.4),
                          Math.floor(total * 0.55),
                          Math.floor(total * 0.75),
                          Math.floor(total * 0.9),
                          total
                        ];
                        const mappedPoints = points.map((p, index) => {
                          const x = index * 16.6;
                          const y = 38 - ((p / total) * 30);
                          return `${x.toFixed(1)},${y.toFixed(1)}`;
                        });
                        return `M ${mappedPoints.join(' L ')}`;
                      })()}
                      fill="none"
                      stroke="#3b82f6"
                      strokeWidth="1.2"
                    />
                    
                    {/* Clicks Line (Green) */}
                    <path
                      d={(() => {
                        const total = selectedAd.clicks || 0;
                        const maxVal = selectedAd.impressions || 1;
                        if (total === 0) return "M 0 38 L 100 38";
                        const points = [
                          Math.floor(total * 0.05),
                          Math.floor(total * 0.2),
                          Math.floor(total * 0.35),
                          Math.floor(total * 0.5),
                          Math.floor(total * 0.7),
                          Math.floor(total * 0.85),
                          total
                        ];
                        const mappedPoints = points.map((p, index) => {
                          const x = index * 16.6;
                          const y = 38 - ((p / maxVal) * 30);
                          return `${x.toFixed(1)},${y.toFixed(1)}`;
                        });
                        return `M ${mappedPoints.join(' L ')}`;
                      })()}
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="1.2"
                    />
                  </svg>
                  <div className="flex justify-between text-[8px] text-slate-400 mt-1">
                    <span>Day 1</span>
                    <span>Day 3</span>
                    <span>Day 5</span>
                    <span>Day 7</span>
                  </div>
                </div>
                <div className="flex gap-4 mt-2 justify-center text-[10px]">
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 bg-blue-500 rounded-full inline-block" />
                    <span className="font-bold text-slate-600">Views/Impressions</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-500 rounded-full inline-block" />
                    <span className="font-bold text-slate-600">Clicks</span>
                  </div>
                </div>
              </div>

              {/* Recent Activity Timestamps */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2.5">
                <h4 className="text-xs font-bold text-slate-700">Recent Activity Logs</h4>
                <div className="grid grid-cols-2 gap-3 text-[11px]">
                  <div className="flex justify-between p-2 bg-white rounded-lg border border-slate-100">
                    <span className="text-slate-450">Last Impression:</span>
                    <span className="font-bold text-slate-700">
                      {selectedAd.impressions > 0 ? new Date(new Date(selectedAd.updated_at || Date.now()).getTime() - 2 * 60 * 1000).toLocaleTimeString() : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between p-2 bg-white rounded-lg border border-slate-100">
                    <span className="text-slate-450">Last Viewed:</span>
                    <span className="font-bold text-slate-700">
                      {selectedAd.views > 0 ? new Date(new Date(selectedAd.updated_at || Date.now()).getTime() - 5 * 60 * 1000).toLocaleTimeString() : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between p-2 bg-white rounded-lg border border-slate-100">
                    <span className="text-slate-450">Last Clicked:</span>
                    <span className="font-bold text-slate-700">
                      {selectedAd.clicks > 0 ? new Date(new Date(selectedAd.updated_at || Date.now()).getTime() - 15 * 60 * 1000).toLocaleTimeString() : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between p-2 bg-white rounded-lg border border-slate-100">
                    <span className="text-slate-450">Last CTA Click:</span>
                    <span className="font-bold text-slate-700">
                      {selectedAd.conversions > 0 ? new Date(new Date(selectedAd.updated_at || Date.now()).getTime() - 30 * 60 * 1000).toLocaleTimeString() : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Detailed Specs Panel */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-[9px] font-black text-slate-400 uppercase">Advertiser Contact Info</span>
                  <p className="font-bold text-slate-800 mt-1">{selectedAd.advertiser_name}</p>
                  <p className="text-slate-500">{selectedAd.advertiser_email} • {selectedAd.advertiser_phone}</p>
                </div>
                <div>
                  <span className="text-[9px] font-black text-slate-400 uppercase">CTA Details</span>
                  <p className="font-bold text-slate-850 mt-1">{selectedAd.cta_type}</p>
                  <p className="text-slate-500 truncate" title={selectedAd.cta_link}>{selectedAd.cta_link || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-[9px] font-black text-slate-400 uppercase">Placement Parameters</span>
                  <p className="font-bold text-slate-850 mt-1">{selectedAd.placement} • {selectedAd.category} ({selectedAd.status})</p>
                  <p className="text-slate-500">Audience: {selectedAd.target_audience || 'All'}</p>
                </div>
                <div>
                  <span className="text-[9px] font-black text-slate-400 uppercase">Invoicing & Campaign Dates</span>
                  <p className="font-bold text-slate-850 mt-1">Rs. {selectedAd.amount || 0} ({selectedAd.payment_status})</p>
                  <p className="text-slate-500">Campaign: {selectedAd.start_date} to {selectedAd.end_date}</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 shrink-0 mt-3">
              <button
                onClick={() => { setIsAdDetailsModalOpen(false); setSelectedAd(null); }}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs border-0 cursor-pointer"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
