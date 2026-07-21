/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Bell,
  Settings,
  Check,
  CheckCheck,
  Trash2,
  ArrowLeft,
  Sparkles,
  Clock,
  Heart,
  MessageSquare,
  Briefcase,
  Store,
  Home,
  ShoppingBag,
  Wrench,
  AlertTriangle,
  UserCheck,
  Calendar,
  Tag,
  Shield,
  Volume2,
  VolumeX,
  Smartphone,
  ChevronRight,
  Info,
  Loader2
} from 'lucide-react';
import { Notification, NotificationSettings, Language } from '../types';
import {
  isSupabaseConfigured,
  supabase,
  dbGetNotifications,
  dbSaveNotification,
  dbMarkNotificationRead,
  dbMarkAllNotificationsRead,
  dbDeleteNotification,
  dbGetNotificationPreferences,
  dbSaveNotificationPreferences,
  dbGetUnreadNotificationsCount,
  dbDeleteNotificationsByCategory,
  dbClearAllNotifications
} from '../utils/supabaseClient';
import { User } from '../types';
import ClickableAvatar from './ClickableAvatar';

interface NotificationsModuleProps {
  currentLanguage: Language;
  currentPath: string;
  navigate: (path: string, paramId?: string) => void;
  onUpdateUnreadCount?: (count: number) => void;
  currentUser: User;
}

// Pre-seeded initial notifications representing realistic neighborhood scenarios in Dhoke Hassu
const INITIAL_NOTIFICATIONS: Notification[] = [
  {
    id: 'notif-1',
    type: 'alert',
    title: 'Gas Outage Alert | گیس بندش الرٹ',
    message: 'Sui Northern Gas reported a temporary maintenance shutdown in Dhoke Hassu Sector A tomorrow from 9:00 AM to 1:00 PM.',
    timeAgo: '2 hours ago',
    read: false,
    relatedId: 'alert-1',
    relatedModule: '/alerts',
    senderName: 'SNGPL Admin',
    senderAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=120'
  },
  {
    id: 'notif-2',
    type: 'like',
    title: 'Zainab liked your post | زینب نے آپ کی پوسٹ پسند کی',
    message: 'Liked your community update regarding solid waste container cleanup near Dhoke Hassu Ground.',
    timeAgo: '4 hours ago',
    read: false,
    relatedId: 'post-1',
    relatedModule: 'feed',
    senderName: 'Zainab Bibi',
    senderAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=120'
  },
  {
    id: 'notif-3',
    type: 'comment',
    title: 'Sajid commented on your event | ساجد کا تبصرہ',
    message: '"Is there any entry ticket or registration required for the local sports gala?"',
    timeAgo: '5 hours ago',
    read: false,
    relatedId: 'event-1',
    relatedModule: '/events',
    senderName: 'Sajid Khan',
    senderAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120'
  },
  {
    id: 'notif-4',
    type: 'job',
    title: 'New Job in Dhoke Hassu | نئی نوکری کا موقع',
    message: 'Bashir Hardware is hiring a part-time delivery rider. PKR 25,000 + Fuel allowance.',
    timeAgo: '12 hours ago',
    read: true,
    relatedId: 'job-1',
    relatedModule: '/jobs',
    senderName: 'Chaudhary Bashir',
    senderAvatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&q=80&w=120'
  },
  {
    id: 'notif-5',
    type: 'business',
    title: 'New Business Registered | نیا کاروبار رجسٹرڈ',
    message: '"Rawalpindi Autos" is now registered in the directory. Visit them near Dhoke Hassu Chowk.',
    timeAgo: '1 day ago',
    read: true,
    relatedId: 'bus-1',
    relatedModule: '/business',
    senderName: 'Rawalpindi Autos',
    senderAvatar: 'https://images.unsplash.com/photo-1621274790572-7c325d6bc67f?auto=format&fit=crop&q=80&w=120'
  },
  {
    id: 'notif-6',
    type: 'follower',
    title: 'Amina started following you | امنہ نے آپ کو فالو کیا',
    message: 'Amina Begum began following your community listings and activity.',
    timeAgo: '2 days ago',
    read: true,
    relatedId: 'user-amina',
    relatedModule: 'profile',
    senderName: 'Amina Begum',
    senderAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=120'
  },
  {
    id: 'notif-7',
    type: 'system',
    title: 'Welcome to Dhoke Hassu Connect! | خوش آمدید',
    message: 'Your profile is active. Stay connected with local jobs, services, alerts, and community reports.',
    timeAgo: '3 days ago',
    read: true,
    relatedId: 'welcome',
    relatedModule: 'home',
    senderName: 'Dhoke Hassu Connect',
    senderAvatar: ''
  }
];

const DEFAULT_SETTINGS: NotificationSettings = {
  categories: {
    community: true,
    chat: true,
    events: true,
    jobs: true,
    businesses: true,
    marketplace: true,
    services: true,
    property: true,
    deals: true,
    alerts: true,
    followers: true,
    system: true,
  },
  channels: {
    push: true,
    inApp: true,
    sound: true,
    vibration: false,
  },
};

const SIMULATION_TEMPLATES = [
  {
    type: 'alert',
    titleEn: 'Severe Weather Warning',
    titleUr: 'خراب موسم کی وارننگ',
    messageEn: 'Rawalpindi Met Dept predicts heavy rainfall and potential localized flooding tonight.',
    messageUr: 'محکمہ موسمیات کی راولپنڈی میں آج رات تیز بارش اور ندی نالوں میں طغیانی کی پیشگوئی۔',
    senderName: 'Met Department',
    senderAvatar: 'https://images.unsplash.com/photo-1504608524841-42fe6f032b4b?auto=format&fit=crop&q=80&w=120',
    relatedModule: '/alerts'
  },
  {
    type: 'comment',
    titleEn: 'Arsalan replied to your thread',
    titleUr: 'ارسلان نے آپ کی تھریڈ کا جواب دیا',
    messageEn: '"Thank you for sharing this! It was extremely helpful for the residents of Dhoke Khabba."',
    messageUr: '"یہ معلومات شیئر کرنے کا بہت شکریہ! یہ بہت فائدہ مند ثابت ہوئی۔"',
    senderName: 'Arsalan Mahmood',
    senderAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120',
    relatedModule: 'feed'
  },
  {
    type: 'deal',
    titleEn: 'New Exclusive Deal Posted',
    titleUr: 'نئی خصوصی ڈیل پوسٹ ہوئی',
    messageEn: 'Get 30% discount on sanitary items and bathroom fittings at Bashir Hardware today only.',
    messageUr: 'بشیر ہارڈ ویئر پر آج سینیٹری کے سامان پر 30 فیصد رعایت حاصل کریں۔',
    senderName: 'Bashir Hardware',
    senderAvatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&q=80&w=120',
    relatedModule: '/deals'
  },
  {
    type: 'chat',
    titleEn: 'New Chat Message',
    titleUr: 'نیا چیٹ پیغام',
    messageEn: '"Are you still interested in buying the plumbing service tools? Let me know."',
    messageUr: '"کیا آپ پلمبنگ کے اوزار خریدنے میں دلچسپی رکھتے ہیں؟ مجھے بتائیں۔"',
    senderName: 'Yasir Ali',
    senderAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=120',
    relatedModule: 'chat'
  }
];

export default function NotificationsModule({
  currentLanguage,
  currentPath,
  navigate,
  onUpdateUnreadCount,
  currentUser
}: NotificationsModuleProps) {
  const [activeFilter, setActiveFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'unread' | 'followers' | 'messages' | 'stories' | 'marketplace' | 'community' | 'system'>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Load notifications with persistence
  const [notifications, setNotifications] = useState<Notification[]>(() => {
    try {
      const stored = localStorage.getItem('dh_notifications_list');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {}
    return INITIAL_NOTIFICATIONS;
  });

  // Load settings with persistence
  const [settings, setSettings] = useState<NotificationSettings>(() => {
    try {
      const stored = localStorage.getItem('dh_notifications_settings');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {}
    return DEFAULT_SETTINGS;
  });

  // Sync notifications to localStorage & report unread count
  useEffect(() => {
    localStorage.setItem('dh_notifications_list', JSON.stringify(notifications));
    const unreadCount = notifications.filter(n => !n.read).length;
    if (onUpdateUnreadCount) {
      onUpdateUnreadCount(unreadCount);
    }
  }, [notifications]);

  // Sync Settings to localStorage and Supabase preferences
  const updateSettingsInDb = async (newSettings: NotificationSettings) => {
    localStorage.setItem('dh_notifications_settings', JSON.stringify(newSettings));
    if (!isSupabaseConfigured || !currentUser?.id) return;
    const dbPrefs = {
      chat_enabled: newSettings.categories.chat,
      community_enabled: newSettings.categories.community,
      jobs_enabled: newSettings.categories.jobs,
      marketplace_enabled: newSettings.categories.marketplace,
      businesses_enabled: newSettings.categories.businesses,
      property_enabled: newSettings.categories.property,
      emergency_enabled: newSettings.categories.alerts,
      system_enabled: newSettings.categories.system,
      push_enabled: newSettings.channels.push,
      in_app_enabled: newSettings.channels.inApp,
      sound_enabled: newSettings.channels.sound,
      vibration_enabled: newSettings.channels.vibration
    };
    await dbSaveNotificationPreferences(currentUser.id!, dbPrefs);
  };

  // Load initial notifications & user preferences from Supabase on mount/user change
  useEffect(() => {
    if (!currentUser?.id) return;

    async function loadPreferencesAndNotifs() {
      if (isSupabaseConfigured) {
        // 1. Fetch Preferences
        const prefs = await dbGetNotificationPreferences(currentUser.id!);
        if (prefs) {
          const loadedSettings = {
            categories: {
              community: prefs.community_enabled,
              chat: prefs.chat_enabled,
              events: prefs.events_enabled ?? true,
              jobs: prefs.jobs_enabled,
              businesses: prefs.businesses_enabled,
              marketplace: prefs.marketplace_enabled,
              services: prefs.services_enabled ?? true,
              property: prefs.property_enabled,
              deals: prefs.deals_enabled ?? true,
              alerts: prefs.emergency_enabled,
              followers: prefs.followers_enabled ?? true,
              system: prefs.system_enabled,
            },
            channels: {
              push: prefs.push_enabled,
              inApp: prefs.in_app_enabled,
              sound: prefs.sound_enabled ?? true,
              vibration: prefs.vibration_enabled ?? false,
            }
          };
          setSettings(loadedSettings);
          localStorage.setItem('dh_notifications_settings', JSON.stringify(loadedSettings));
        }

        // 2. Fetch Notifications (Page 1)
        const fetched = await dbGetNotifications([], currentUser.id!, 1, 50);
        if (fetched.length > 0) {
          setNotifications(fetched);
        }
      }
    }
    loadPreferencesAndNotifs();
  }, [currentUser?.id]);

  // Subscribe to realtime notifications insertions
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase || !currentUser?.id) return;

    const channel = supabase
      .channel(`notifications:${currentUser.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${currentUser.id}`
      }, async (payload) => {
        const newNotif = payload.new;
        
        let senderName = 'System';
        let senderAvatar = undefined;
        if (newNotif.sender_id) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, profile_photo')
            .eq('user_id', newNotif.sender_id)
            .single();
          if (profile) {
            senderName = profile.full_name;
            senderAvatar = profile.profile_photo;
          }
        }

        const mappedNotif: Notification = {
          id: newNotif.id,
          type: newNotif.type,
          title: newNotif.title,
          message: newNotif.body,
          timeAgo: 'Just now',
          read: newNotif.is_read,
          relatedId: newNotif.reference_id || undefined,
          relatedModule: newNotif.reference_type || undefined,
          senderName,
          senderAvatar,
          createdAt: newNotif.created_at
        };

        if (mappedNotif.type === 'ad' || mappedNotif.type === 'sponsored') {
          // Skip adding ad notifications to the list
          return;
        }
        setNotifications(prev => [mappedNotif, ...prev]);

        if (settings.channels.sound) {
          try {
            const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-200.wav');
            audio.play();
          } catch {}
        }

        setToastMessage(newNotif.title);
        setTimeout(() => setToastMessage(null), 4000);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser?.id, settings.channels.sound]);

  // Load more notifications for pagination
  const loadMoreNotifications = async () => {
    if (!currentUser?.id || !isSupabaseConfigured) return;
    const nextPage = page + 1;
    const fetched = await dbGetNotifications([], currentUser.id!, nextPage, 20);
    if (fetched.length > 0) {
      setNotifications(prev => [...prev, ...fetched]);
      setPage(nextPage);
    } else {
      setHasMore(false);
    }
  };

  // Handle fake load times on filter change for high fidelity polish
  const handleFilterChange = (filter: 'all' | 'unread' | 'read') => {
    setIsLoading(true);
    setActiveFilter(filter);
    const timer = setTimeout(() => setIsLoading(false), 250);
    return () => clearTimeout(timer);
  };

  // Filtered Notifications based on selection
  const filteredNotifications = useMemo(() => {
    return notifications.filter(notif => {
      // Exclude advertisement notifications globally
      if (notif.type === 'ad' || notif.type === 'sponsored') {
        return false;
      }
      
      // 1. Category Filter Tags
      const category = notif.type?.toLowerCase();
      if (categoryFilter !== 'all') {
        if (categoryFilter === 'chat' && !category.includes('chat')) return false;
        if (categoryFilter === 'community' && !(category.includes('like') || category.includes('comment') || category.includes('reply') || category.includes('post') || category.includes('follower'))) return false;
        if (categoryFilter === 'jobs' && !category.includes('job')) return false;
        if (categoryFilter === 'marketplace' && !(category.includes('marketplace') || category.includes('offer'))) return false;
        if (categoryFilter === 'businesses' && !(category.includes('business') || category.includes('service') || category.includes('inquiry'))) return false;
        if (categoryFilter === 'property' && !category.includes('property')) return false;
        if (categoryFilter === 'emergency' && !category.includes('alert')) return false;
        if (categoryFilter === 'system' && !category.includes('system')) return false;
      }

      // 2. Filter out types based on settings categories
      const categoryMap: Record<string, keyof typeof settings.categories> = {
        post: 'community',
        comment: 'community',
        reply: 'community',
        like: 'community',
        follower: 'followers',
        chat: 'chat',
        event: 'events',
        business: 'businesses',
        job: 'jobs',
        marketplace: 'marketplace',
        service: 'services',
        property: 'property',
        deal: 'deals',
        alert: 'alerts',
        system: 'system'
      };

      const mappedCategory = categoryMap[notif.type] || 'system';
      if (!settings.categories[mappedCategory]) {
        return false;
      }

      if (activeFilter === 'unread') return !notif.read;
      if (activeFilter === 'read') return notif.read;
      return true;
    });
  }, [notifications, activeFilter, categoryFilter, settings]);

  // Group notifications into Today, Yesterday, Earlier
  const groupedNotifications = useMemo(() => {
    const today: Notification[] = [];
    const yesterday: Notification[] = [];
    const earlier: Notification[] = [];

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const yesterdayStart = todayStart - 24 * 60 * 60 * 1000;

    filteredNotifications.forEach(notif => {
      const date = notif.createdAt ? new Date(notif.createdAt).getTime() : Date.now() - 3 * 24 * 60 * 60 * 1000;
      
      if (date >= todayStart) {
        today.push(notif);
      } else if (date >= yesterdayStart) {
        yesterday.push(notif);
      } else {
        earlier.push(notif);
      }
    });

    return { today, yesterday, earlier };
  }, [filteredNotifications]);

  // Helper translations dictionary
  const t = {
    en: {
      header: "Notifications",
      settings: "Notification Settings",
      all: "All",
      unread: "Unread",
      read: "Read",
      markAllRead: "Mark All as Read",
      clearRead: "Clear Read",
      emptyStateTitle: "No notifications found",
      emptyStateDesc: "When local activities, replies, or urgent neighborhood alerts occur, they will show up here.",
      settingsSubtitle: "Manage your alerts, reminders, and delivery channels",
      backBtn: "Back",
      categoriesGroup: "Notification Preferences",
      channelsGroup: "Delivery Methods",
      communityToggle: "Community Posts & Comments",
      chatToggle: "Chat & Direct Messages",
      eventsToggle: "Neighborhood Events",
      jobsToggle: "Jobs & Opportunities",
      businessesToggle: "Local Business Updates",
      marketplaceToggle: "Marketplace listings",
      servicesToggle: "Home Services & Bookings",
      propertyToggle: "Property & Rental Updates",
      dealsToggle: "Discounts & Exclusive Deals",
      alertsToggle: "Urgent Local Emergency Alerts",
      followersToggle: "New Followers & Social Actions",
      systemToggle: "System & Welcome Updates",
      pushToggle: "Push Notifications",
      inAppToggle: "In-App Banners",
      soundToggle: "Notification Sound",
      vibrateToggle: "Vibrate on Mobile",
      simulateTitle: "Simulate Live Events",
      simulateDesc: "Trigger mock real-time events to see notifications and indicators update immediately!",
      triggerBtn: "Trigger Live Event",
      toastTitle: "Notification Received!",
      deleteBtn: "Delete",
      markRead: "Mark Read",
      markUnread: "Mark Unread",
      toastMuted: "Notification stored quietly (Muted by channels settings)"
    },
    ur: {
      header: "اطلاعات",
      settings: "اطلاعات کی ترتیبات",
      all: "تمام",
      unread: "ان پڑھی",
      read: "پڑھی ہوئی",
      markAllRead: "سب کو پڑھا ہوا نشان زد کریں",
      clearRead: "پڑھی ہوئی صاف کریں",
      emptyStateTitle: "کوئی اطلاع نہیں ہے",
      emptyStateDesc: "جب بھی کوئی علاقائی سرگرمی، تبصرے یا اہم الرٹ ہوگا، وہ یہاں نظر آئے گا۔",
      settingsSubtitle: "اپنے الرٹس، یاد دہانیوں اور پہنچ کے ذرائع کو منظم کریں",
      backBtn: "واپس جائیں",
      categoriesGroup: "اطلاع کی ترجیحات",
      channelsGroup: "پہنچانے کے ذرائع",
      communityToggle: "کمیونٹی پوسٹس اور تبصرے",
      chatToggle: "چیٹ اور نجی پیغامات",
      eventsToggle: "مقامی تقریبات اور ایونٹس",
      jobsToggle: "ملازمتیں اور مواقع",
      businessesToggle: "مقامی کاروبار کی اپ ڈیٹس",
      marketplaceToggle: "خرید و فروخت کے اشتہارات",
      servicesToggle: "سروسز اور بکنگ کی معلومات",
      propertyToggle: "پراپرٹی اور کرایہ کی اپ ڈیٹس",
      dealsToggle: "رعایت اور ڈیلز",
      alertsToggle: "ہنگامی علاقائی الرٹس",
      followersToggle: "نئے فالوورز اور سماجی لنکس",
      systemToggle: "سسٹم اور ویلکم پیغامات",
      pushToggle: "پش نوٹیفکیشن",
      inAppToggle: "ان-ایپ بینرز",
      soundToggle: "اطلاع کی آواز",
      vibrateToggle: "موبائل وائبریشن",
      simulateTitle: "لائیو نوٹیفکیشن نقل کریں",
      simulateDesc: "فوری طور پر معلومات اور انڈیکیٹرز کو اپ ڈیٹ ہوتے دیکھنے کے لیے لائیو نوٹیفکیشن کا بٹن دبائیں!",
      triggerBtn: "لائیو ایونٹ سمیلیٹ کریں",
      toastTitle: "نئی اطلاع موصول ہوئی!",
      deleteBtn: "حذف کریں",
      markRead: "پڑھی ہوئی کریں",
      markUnread: "ان پڑھی کریں",
      toastMuted: "اطلاع خاموشی سے محفوظ ہو گئی (ترتیبات کی وجہ سے آواز بند ہے)"
    }
  }[currentLanguage];

  // Map type to layout visual metadata
  const getTypeBadge = (type: string) => {
    const defaultStyle = {
      icon: <Bell className="w-4 h-4 text-slate-500" />,
      color: 'bg-slate-100 border-slate-200 text-slate-700',
      labelEn: 'System',
      labelUr: 'سسٹم'
    };

    const config: Record<string, typeof defaultStyle> = {
      post: {
        icon: <Sparkles className="w-4 h-4 text-blue-600" />,
        color: 'bg-blue-50 border-blue-200 text-blue-800',
        labelEn: 'Community',
        labelUr: 'کمیونٹی'
      },
      comment: {
        icon: <MessageSquare className="w-4 h-4 text-indigo-600" />,
        color: 'bg-indigo-50 border-indigo-200 text-indigo-800',
        labelEn: 'Comment',
        labelUr: 'تبصرہ'
      },
      reply: {
        icon: <MessageSquare className="w-4 h-4 text-violet-600" />,
        color: 'bg-violet-50 border-violet-200 text-violet-800',
        labelEn: 'Reply',
        labelUr: 'جواب'
      },
      like: {
        icon: <Heart className="w-4 h-4 text-rose-500 fill-current" />,
        color: 'bg-rose-50 border-rose-200 text-rose-800',
        labelEn: 'Reaction',
        labelUr: 'پسند'
      },
      follower: {
        icon: <UserCheck className="w-4 h-4 text-teal-600" />,
        color: 'bg-teal-50 border-teal-200 text-teal-800',
        labelEn: 'Follower',
        labelUr: 'فالوور'
      },
      chat: {
        icon: <MessageSquare className="w-4 h-4 text-green-600" />,
        color: 'bg-green-50 border-green-200 text-green-800',
        labelEn: 'Chat',
        labelUr: 'چیٹ'
      },
      event: {
        icon: <Calendar className="w-4 h-4 text-purple-600" />,
        color: 'bg-purple-50 border-purple-200 text-purple-800',
        labelEn: 'Event',
        labelUr: 'تقریب'
      },
      business: {
        icon: <Store className="w-4 h-4 text-cyan-600" />,
        color: 'bg-cyan-50 border-cyan-200 text-cyan-800',
        labelEn: 'Business',
        labelUr: 'کاروبار'
      },
      job: {
        icon: <Briefcase className="w-4 h-4 text-amber-600" />,
        color: 'bg-amber-50 border-amber-200 text-amber-800',
        labelEn: 'Job',
        labelUr: 'ملازمت'
      },
      marketplace: {
        icon: <ShoppingBag className="w-4 h-4 text-pink-600" />,
        color: 'bg-pink-50 border-pink-200 text-pink-800',
        labelEn: 'Buy & Sell',
        labelUr: 'خرید و فروخت'
      },
      service: {
        icon: <Wrench className="w-4 h-4 text-emerald-600" />,
        color: 'bg-emerald-50 border-emerald-200 text-emerald-800',
        labelEn: 'Service',
        labelUr: 'خدمات'
      },
      property: {
        icon: <Home className="w-4 h-4 text-orange-600" />,
        color: 'bg-orange-50 border-orange-200 text-orange-800',
        labelEn: 'Property',
        labelUr: 'پراپرٹی'
      },
      deal: {
        icon: <Tag className="w-4 h-4 text-lime-600" />,
        color: 'bg-lime-50 border-lime-200 text-lime-800',
        labelEn: 'Deal',
        labelUr: 'ڈیل'
      },
      alert: {
        icon: <AlertTriangle className="w-4 h-4 text-red-600" />,
        color: 'bg-red-50 border-red-200 text-red-800',
        labelEn: 'Alert',
        labelUr: 'الرٹ'
      },
      system: {
        icon: <Shield className="w-4 h-4 text-violet-600" />,
        color: 'bg-violet-50 border-violet-100 text-violet-800',
        labelEn: 'System',
        labelUr: 'سسٹم'
      }
    };

    return config[type] || defaultStyle;
  };

  // Mark all notifications as read
  const handleMarkAllAsRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    if (isSupabaseConfigured && currentUser?.id) {
      await dbMarkAllNotificationsRead(currentUser.id);
    }
  };

  // Clear read notifications
  const handleClearRead = async () => {
    const readIds = notifications.filter(n => n.read).map(n => n.id);
    setNotifications(prev => prev.filter(n => !n.read));
    if (isSupabaseConfigured) {
      for (const id of readIds) {
        await dbDeleteNotification(id);
      }
    }
  };

  // Toggle single read/unread status
  const handleToggleRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: !n.read } : n));
    if (isSupabaseConfigured) {
      await dbMarkNotificationRead(id);
    }
  };

  // Delete a single notification
  const handleDeleteNotification = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotifications(prev => prev.filter(n => n.id !== id));
    if (isSupabaseConfigured) {
      await dbDeleteNotification(id);
    }
  };

  // Click card to open related module (Deep Linking)
  const handleNotificationClick = async (notif: Notification) => {
    // Mark as read first
    setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n));
    if (isSupabaseConfigured) {
      await dbMarkNotificationRead(notif.id);
    }
    
    // Deep Linking routing
    if (notif.relatedModule === 'chat' && notif.relatedId) {
      if ((window as any).openChat) {
        const contactParam = notif.senderId || notif.relatedId;
        (window as any).openChat(contactParam, notif.senderName || 'System', notif.senderAvatar);
      } else {
        navigate('/chat');
      }
      return;
    }

    if (notif.relatedModule) {
      const modulePath = notif.relatedModule.startsWith('/') ? notif.relatedModule : '/' + notif.relatedModule;
      navigate(modulePath as any, notif.relatedId);
    }
  };

  // Simulate receiving a live notification in real-time
  const triggerSimulation = () => {
    // Select a random simulation template
    const template = SIMULATION_TEMPLATES[Math.floor(Math.random() * SIMULATION_TEMPLATES.length)];
    
    const newNotif: Notification = {
      id: `sim-${Date.now()}`,
      type: template.type,
      title: `${template.titleEn} | ${template.titleUr}`,
      message: currentLanguage === 'en' ? template.messageEn : template.messageUr,
      timeAgo: 'Just now',
      read: false,
      relatedId: 'sim-id',
      relatedModule: template.relatedModule,
      senderName: template.senderName,
      senderAvatar: template.senderAvatar
    };

    // Prevent duplicates by checking title
    if (notifications.some(n => n.title === newNotif.title && n.message === newNotif.message)) {
      return;
    }

    setNotifications(prev => [newNotif, ...prev]);

    // Handle sound simulated or visual toast if allowed
    if (settings.channels.inApp) {
      setToastMessage(currentLanguage === 'en' ? template.messageEn : template.messageUr);
      setTimeout(() => setToastMessage(null), 4000);
    } else {
      setToastMessage(t.toastMuted);
      setTimeout(() => setToastMessage(null), 2500);
    }

    if (settings.channels.sound) {
      try {
        // Simple client web-audio generator for sound effects
        const context = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = context.createOscillator();
        const gain = context.createGain();
        osc.connect(gain);
        gain.connect(context.destination);
        osc.frequency.setValueAtTime(587.33, context.currentTime); // D5 note
        osc.frequency.setValueAtTime(880, context.currentTime + 0.1); // A5 note
        gain.gain.setValueAtTime(0.08, context.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.35);
        osc.start();
        osc.stop(context.currentTime + 0.35);
      } catch (e) {
        console.log("Audio not supported or blocked by permissions", e);
      }
    }

    if (settings.channels.vibration && navigator.vibrate) {
      navigator.vibrate([100, 50, 100]);
    }
  };

  // Render settings page subview
  if (currentPath === '/notifications/settings') {
    return (
      <div className="max-w-3xl mx-auto space-y-6 pb-12 animate-fade-in" id="notifications-settings-container">
        {/* Back navigation */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/notifications')}
            className="p-2 bg-white hover:bg-slate-100 text-slate-700 rounded-xl border border-slate-200 transition-all cursor-pointer shadow-xs"
            id="notif-settings-back-btn"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-xl font-black text-slate-900 leading-tight">
              {t.settings}
            </h2>
            <p className="text-xs text-slate-500">
              {t.settingsSubtitle}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200/70 shadow-sm p-6 sm:p-8 space-y-8" id="notif-settings-card">
          {/* Preferences Categories */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <span className="text-lg">📢</span>
              <h3 className="font-black text-slate-800 text-sm uppercase tracking-wider">
                {t.categoriesGroup}
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.keys(settings.categories).map((catKey) => {
                const label = {
                  community: t.communityToggle,
                  chat: t.chatToggle,
                  events: t.eventsToggle,
                  jobs: t.jobsToggle,
                  businesses: t.businessesToggle,
                  marketplace: t.marketplaceToggle,
                  services: t.servicesToggle,
                  property: t.propertyToggle,
                  deals: t.dealsToggle,
                  alerts: t.alertsToggle,
                  followers: t.followersToggle,
                  system: t.systemToggle,
                }[catKey as keyof typeof settings.categories] || catKey;

                const isChecked = settings.categories[catKey as keyof typeof settings.categories];

                return (
                  <label 
                    key={catKey}
                    className="flex items-center justify-between p-3.5 bg-slate-50/50 hover:bg-slate-100/50 rounded-2xl border border-slate-200/40 transition-colors cursor-pointer"
                  >
                    <span className="text-xs font-bold text-slate-700">{label}</span>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {
                        const newSettings = {
                          ...settings,
                          categories: {
                            ...settings.categories,
                            [catKey]: !isChecked
                          }
                        };
                        setSettings(newSettings);
                        updateSettingsInDb(newSettings);
                      }}
                      className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 accent-blue-600 cursor-pointer"
                    />
                  </label>
                );
              })}
            </div>
          </div>

          {/* Preferences Channels */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <span className="text-lg">⚙️</span>
              <h3 className="font-black text-slate-800 text-sm uppercase tracking-wider">
                {t.channelsGroup}
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Push notifications */}
              <label className="flex items-center justify-between p-3.5 bg-slate-50/50 hover:bg-slate-100/50 rounded-2xl border border-slate-200/40 transition-colors cursor-pointer">
                <div className="flex items-center gap-2.5">
                  <Smartphone className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-bold text-slate-700">{t.pushToggle}</span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.channels.push}
                  onChange={() => {
                    const newSettings = {
                      ...settings,
                      channels: { ...settings.channels, push: !settings.channels.push }
                    };
                    setSettings(newSettings);
                    updateSettingsInDb(newSettings);
                  }}
                  className="w-4 h-4 text-blue-600 border-slate-300 rounded accent-blue-600 cursor-pointer"
                />
              </label>

              {/* In App banner notifications */}
              <label className="flex items-center justify-between p-3.5 bg-slate-50/50 hover:bg-slate-100/50 rounded-2xl border border-slate-200/40 transition-colors cursor-pointer">
                <div className="flex items-center gap-2.5">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  <span className="text-xs font-bold text-slate-700">{t.inAppToggle}</span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.channels.inApp}
                  onChange={() => {
                    const newSettings = {
                      ...settings,
                      channels: { ...settings.channels, inApp: !settings.channels.inApp }
                    };
                    setSettings(newSettings);
                    updateSettingsInDb(newSettings);
                  }}
                  className="w-4 h-4 text-blue-600 border-slate-300 rounded accent-blue-600 cursor-pointer"
                />
              </label>

              {/* Sound */}
              <label className="flex items-center justify-between p-3.5 bg-slate-50/50 hover:bg-slate-100/50 rounded-2xl border border-slate-200/40 transition-colors cursor-pointer">
                <div className="flex items-center gap-2.5">
                  {settings.channels.sound ? <Volume2 className="w-4 h-4 text-emerald-600" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
                  <span className="text-xs font-bold text-slate-700">{t.soundToggle}</span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.channels.sound}
                  onChange={() => {
                    const newSettings = {
                      ...settings,
                      channels: { ...settings.channels, sound: !settings.channels.sound }
                    };
                    setSettings(newSettings);
                    updateSettingsInDb(newSettings);
                  }}
                  className="w-4 h-4 text-blue-600 border-slate-300 rounded accent-blue-600 cursor-pointer"
                />
              </label>

              {/* Vibration */}
              <label className="flex items-center justify-between p-3.5 bg-slate-50/50 hover:bg-slate-100/50 rounded-2xl border border-slate-200/40 transition-colors cursor-pointer">
                <div className="flex items-center gap-2.5">
                  <Smartphone className="w-4 h-4 text-orange-500 animate-bounce" />
                  <span className="text-xs font-bold text-slate-700">{t.vibrateToggle}</span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.channels.vibration}
                  onChange={() => {
                    const newSettings = {
                      ...settings,
                      channels: { ...settings.channels, vibration: !settings.channels.vibration }
                    };
                    setSettings(newSettings);
                    updateSettingsInDb(newSettings);
                  }}
                  className="w-4 h-4 text-blue-600 border-slate-300 rounded accent-blue-600 cursor-pointer"
                />
              </label>
            </div>
          </div>

          {/* Disclaimer section */}
          <div className="bg-blue-50/50 rounded-2xl border border-blue-100 p-4 flex gap-3 text-xs leading-relaxed text-blue-800 font-medium">
            <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <p>
              {currentLanguage === 'en' 
                ? 'Preferences are preserved on this browser instantly. Real-time system notifications and urgent alerts are localized to your area zone coordinates.' 
                : 'آپ کی تمام ترجیحات اسی براؤزر پر محفوظ رہیں گی۔ ہنگامی اور علاقائی الرٹس آپ کے مخصوص رہائشی زون کے مطابق فراہم کیے جاتے ہیں۔'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const renderNotificationCard = (notif: Notification) => {
    const badge = getTypeBadge(notif.type);
    return (
      <motion.div
        key={notif.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, x: -50 }}
        transition={{ duration: 0.2 }}
        onClick={() => handleNotificationClick(notif)}
        className={`bg-white rounded-2xl border transition-all hover:border-slate-300 p-4 flex gap-3.5 relative overflow-hidden group cursor-pointer shadow-xs hover:shadow-sm ${
          !notif.read ? 'border-s-4 border-s-blue-600 bg-blue-50/5' : 'border-slate-200/60'
        }`}
      >
        {/* Unread indicator dot */}
        {!notif.read && (
          <span className="absolute top-4 end-4 w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
        )}

        {/* Sender avatar or default icon with badge overlay */}
        <div className="relative shrink-0 select-none">
          <ClickableAvatar 
            userId={notif.senderId}
            name={notif.senderName || 'System'}
            avatar={notif.senderAvatar}
            size={40}
            className="shadow-inner"
          />
          {/* Small Type Icon Overlay on Avatar */}
          <span className={`absolute -bottom-1 -end-1 p-1 rounded-full border border-white shadow-xs ${badge.color}`}>
            {badge.icon}
          </span>
        </div>

        {/* Notification content text */}
        <div className="flex-1 min-w-0 space-y-1 pe-4">
          <div className="flex flex-wrap items-center gap-2">
            {/* Module Label badge */}
            <span className={`text-[8.5px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md border ${badge.color}`}>
              {currentLanguage === 'en' ? badge.labelEn : badge.labelUr}
            </span>

            <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span>{notif.timeAgo}</span>
            </span>
          </div>

          {/* Title */}
          <h4 className={`text-xs text-slate-900 leading-snug break-words ${!notif.read ? 'font-black' : 'font-bold'}`}>
            {notif.title}
          </h4>

          {/* Message body */}
          <p className="text-[11px] text-slate-500 leading-normal font-semibold">
            {notif.message}
          </p>

          {/* Hover action items */}
          <div className="flex items-center gap-3 pt-2.5 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="text-[10px] text-blue-600 font-extrabold flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
              <span>{currentLanguage === 'en' ? 'Open Details' : 'تفصیلات دیکھیں'}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </span>

            <button
              onClick={(e) => handleToggleRead(notif.id, e)}
              className="py-1 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-[9px] font-bold border-0 cursor-pointer"
            >
              {notif.read ? t.markUnread : t.markRead}
            </button>

            <button
              onClick={(e) => handleDeleteNotification(notif.id, e)}
              className="py-1 px-2 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg text-[9px] border-0 cursor-pointer"
              title={t.deleteBtn}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </motion.div>
    );
  };

  // MAIN NOTIFICATIONS FEED
  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12 animate-fade-in relative" id="notifications-module-main">
      {/* Real-time Simulated Toast Banner */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-6 start-1/2 -translate-x-1/2 z-50 bg-blue-600 text-white py-3 px-5 rounded-2xl shadow-xl border border-white/15 max-w-sm sm:max-w-md w-full flex items-center gap-3"
            id="notifications-toast"
          >
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
              <Bell className="w-4 h-4 text-white animate-ring" />
            </div>
            <div className="flex-1 min-w-0">
              <h5 className="text-xs font-extrabold uppercase tracking-wide opacity-90">{t.toastTitle}</h5>
              <p className="text-xs truncate font-bold">{toastMessage}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 1. Header with Settings & Simulator trigger */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Bell className="w-6 h-6 text-blue-600" />
            {t.header}
          </h2>
          <p className="text-xs text-slate-500 font-semibold">
            {currentLanguage === 'en' ? 'Stay updated with local listings, peer actions and municipal alerts' : 'مقامی ملازمتوں، خرید و فروخت، الرٹس اور دیگر معلومات کے الرٹس حاصل کریں'}
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Real-time simulation trigger */}
          <button
            onClick={triggerSimulation}
            className="flex-1 sm:flex-initial py-2 px-3.5 bg-green-600 hover:bg-green-700 text-white font-extrabold text-[11px] uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm border-0"
            title={t.simulateDesc}
            id="simulate-notification-btn"
          >
            <Sparkles className="w-3.5 h-3.5 text-white animate-pulse" />
            <span>{t.triggerBtn}</span>
          </button>

          {/* Settings button */}
          <button
            onClick={() => navigate('/notifications/settings' as any)}
            className="p-2 bg-white hover:bg-slate-50 text-slate-700 rounded-xl border border-slate-200 transition-all cursor-pointer shadow-xs flex items-center gap-1"
            title={t.settings}
            id="notifications-settings-btn"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Quick Simulator Info Card */}
      <div className="bg-slate-50 border border-slate-200/50 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="space-y-0.5">
          <h4 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-green-600" />
            {t.simulateTitle}
          </h4>
          <p className="text-[10px] text-slate-500 leading-normal max-w-xl font-medium">
            {t.simulateDesc}
          </p>
        </div>
        <button
          onClick={triggerSimulation}
          className="py-1.5 px-3 bg-white hover:bg-green-50 text-green-700 hover:text-green-800 border border-green-200 text-[10px] font-black uppercase rounded-lg transition-all cursor-pointer self-start md:self-center shrink-0 shadow-xs"
        >
          {currentLanguage === 'en' ? 'Simulate Random Event' : 'نیا لائیو الرٹ بنائیں'}
        </button>
      </div>

      {/* 3. Filter tabs & Bulk Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 bg-white p-2.5 rounded-2xl border border-slate-200/60 shadow-xs">
        {/* Filters */}
        <div className="flex gap-1.5 bg-slate-100/80 p-1 rounded-xl">
          {(['all', 'unread', 'read'] as const).map((filter) => {
            const label = filter === 'all' ? t.all : filter === 'unread' ? t.unread : t.read;
            const isActive = activeFilter === filter;
            const count = filter === 'all' ? notifications.length :
                          filter === 'unread' ? notifications.filter(n => !n.read).length :
                          notifications.filter(n => n.read).length;

            return (
              <button
                key={filter}
                onClick={() => handleFilterChange(filter)}
                className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${isActive ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'}`}
              >
                <span>{label}</span>
                {count > 0 && (
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold font-mono ${isActive ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Bulk actions */}
        <div className="flex gap-2">
          {notifications.some(n => !n.read) && (
            <button
              onClick={handleMarkAllAsRead}
              className="flex-1 sm:flex-initial py-1.5 px-3 hover:bg-slate-50 text-blue-600 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 border-0 bg-transparent"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>{t.markAllRead}</span>
            </button>
          )}

          {notifications.some(n => n.read) && (
            <button
              onClick={handleClearRead}
              className="flex-1 sm:flex-initial py-1.5 px-3 hover:bg-slate-50 text-slate-500 hover:text-red-600 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 border-0 bg-transparent"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{t.clearRead}</span>
            </button>
          )}
        </div>
      </div>

      {/* Category Tags Filter Row */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {[
          { key: 'all', en: 'All', ur: 'تمام' },
          { key: 'chat', en: 'Chat', ur: 'چیٹ' },
          { key: 'community', en: 'Community', ur: 'کمیونٹی' },
          { key: 'jobs', en: 'Jobs', ur: 'ملازمتیں' },
          { key: 'marketplace', en: 'Marketplace', ur: 'خرید و فروخت' },
          { key: 'businesses', en: 'Businesses', ur: 'کاروبار' },
          { key: 'property', en: 'Property', ur: 'پراپرٹی' },
          { key: 'emergency', en: 'Emergency', ur: 'ہنگامی' },
          { key: 'system', en: 'System', ur: 'سسٹم' }
        ].map((cat) => {
          const isActive = categoryFilter === cat.key;
          return (
            <button
              key={cat.key}
              onClick={() => setCategoryFilter(cat.key as any)}
              className={`py-1.5 px-3.5 rounded-full text-[11px] font-black transition-all cursor-pointer whitespace-nowrap border ${
                isActive 
                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs' 
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {currentLanguage === 'en' ? cat.en : cat.ur}
            </button>
          );
        })}
      </div>

      {/* 4. Notifications Feed List */}
      <div className="space-y-4" id="notifications-feed-list-container">
        {isLoading ? (
          // Beautiful Shimmer Loaders
          <div className="space-y-3 animate-pulse">
            {[1, 2, 3].map((idx) => (
              <div key={idx} className="bg-white rounded-2xl border border-slate-200/50 p-4 flex gap-4">
                <div className="w-10 h-10 rounded-full bg-slate-200 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-200 rounded-md w-1/3" />
                  <div className="h-3 bg-slate-200 rounded-md w-5/6" />
                  <div className="h-3 bg-slate-200 rounded-md w-1/4" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredNotifications.length === 0 ? (
          // Empty State
          <div className="bg-white rounded-3xl border border-slate-200/60 p-10 text-center space-y-4 shadow-sm" id="notif-empty-state">
            <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
              <Bell className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h3 className="font-black text-slate-900 text-sm">
                {t.emptyStateTitle}
              </h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                {t.emptyStateDesc}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Today Group */}
            {groupedNotifications.today.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ps-1 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{currentLanguage === 'en' ? 'Today' : 'آج'}</span>
                </h3>
                <div className="space-y-3">
                  <AnimatePresence initial={false}>
                    {groupedNotifications.today.map(notif => renderNotificationCard(notif))}
                  </AnimatePresence>
                </div>
              </div>
            )}

            {/* Yesterday Group */}
            {groupedNotifications.yesterday.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ps-1 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{currentLanguage === 'en' ? 'Yesterday' : 'کل'}</span>
                </h3>
                <div className="space-y-3">
                  <AnimatePresence initial={false}>
                    {groupedNotifications.yesterday.map(notif => renderNotificationCard(notif))}
                  </AnimatePresence>
                </div>
              </div>
            )}

            {/* Earlier Group */}
            {groupedNotifications.earlier.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ps-1 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{currentLanguage === 'en' ? 'Earlier' : 'پہلے'}</span>
                </h3>
                <div className="space-y-3">
                  <AnimatePresence initial={false}>
                    {groupedNotifications.earlier.map(notif => renderNotificationCard(notif))}
                  </AnimatePresence>
                </div>
              </div>
            )}

            {/* Pagination Loader button */}
            {hasMore && isSupabaseConfigured && (
              <div className="text-center pt-2">
                <button
                  onClick={loadMoreNotifications}
                  className="py-2.5 px-6 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-extrabold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  {currentLanguage === 'en' ? 'Load More' : 'مزید لوڈ کریں'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Disclaimers & Security stamp */}
      <div className="bg-white rounded-2xl border border-slate-200/50 p-4 text-center text-[10px] text-slate-400 font-bold shadow-xs">
        🛡️ {currentLanguage === 'en' 
          ? 'Notification preferences and logs are fully synchronized using secure Supabase Relational RLS schemas.' 
          : 'اطلاعات کی ترسیل اور ترجیحات آپ کی حفاظت کی خاطر محفوظ سپابیس ریلیشنل سکیمہ کے ساتھ سنکرونائز کی جاتی ہے۔'}
      </div>
    </div>
  );
}
