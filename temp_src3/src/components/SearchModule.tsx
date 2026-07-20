/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  X, 
  Trash2, 
  ArrowLeft, 
  TrendingUp, 
  Clock, 
  Filter, 
  Check, 
  ChevronRight, 
  Rss, 
  User as UserIcon, 
  Users, 
  Calendar, 
  Store, 
  Briefcase, 
  ShoppingBag, 
  Wrench, 
  Home, 
  Tag, 
  AlertTriangle, 
  BarChart2, 
  Megaphone, 
  ShieldCheck,
  Heart,
  MessageCircle,
  Phone,
  MessageSquare,
  Gift
} from 'lucide-react';
import { 
  Language, 
  Post, 
  BusinessItem, 
  JobItem, 
  BuySellItem, 
  ServiceItem, 
  PropertyItem, 
  DealItem, 
  AlertItem, 
  GroupItem, 
  User,
  EventItem
} from '../types';
import { isEntityVerified } from '../utils/verification';
import {
  isSupabaseConfigured,
  dbGetPolls,
  dbSavePoll,
  dbGetPromotions,
  dbSavePromotion,
  dbGetActiveAds
} from '../utils/supabaseClient';
import AdBannerCard from './AdBannerCard';
import { AdItem } from '../types';
import { useAdRotator } from '../hooks/useAdRotator';

// Predefined local Poll item type
export interface PollItem {
  id: string;
  question: string;
  options: { text: string; votes: number }[];
  totalVotes: number;
  area: string;
  postedBy: string;
  postedTime: string;
  userVotedIdx?: number;
}

// Predefined local Promotion item type
export interface PromotionItem {
  id: string;
  title: string;
  businessName: string;
  description: string;
  image: string;
  area: string;
  postedTime: string;
  discountCode?: string;
  contact?: string;
}

interface SearchModuleProps {
  currentLanguage: Language;
  currentPath: string;
  navigate: (path: string, paramId?: string) => void;
  posts: Post[];
  businesses: BusinessItem[];
  jobs: JobItem[];
  marketplaceItems: BuySellItem[];
  services: ServiceItem[];
  alerts: AlertItem[];
  events: EventItem[];
  deals: DealItem[];
  groups: GroupItem[];
  properties: PropertyItem[];
  currentUser: User;
}

const SEARCH_TRANSLATIONS = {
  en: {
    searchPlaceholder: 'Search Dhoke Hassu Connect...',
    recent: 'Recent Searches',
    trending: 'Trending in Dhoke Hassu',
    clearAll: 'Clear All',
    noRecent: 'No recent searches yet',
    filters: 'Filters',
    all: 'All Results',
    posts: 'Community Posts',
    users: 'Residents & Users',
    groups: 'Local Groups',
    events: 'Events',
    businesses: 'Local Businesses',
    jobs: 'Jobs',
    marketplace: 'Buy & Sell',
    services: 'Local Experts',
    property: 'Properties',
    deals: 'Deals & Offers',
    alerts: 'Area Alerts',
    polls: 'Local Polls',
    promotions: 'Promotions',
    searchResult: 'Search Result',
    searchResults: 'Search Results',
    noResults: 'No results found',
    noResultsDesc: 'Try adjusting your keywords or category filter.',
    suggestions: 'Suggested Searches',
    typingSuggestions: 'Suggestions',
    loading: 'Searching local directory...',
    verifiedResident: 'Verified Resident',
    verifiedEntity: 'Verified',
    contactOwner: 'Contact Owner',
    directCall: 'Direct Call',
    chatSecurely: 'Secure Chat',
    voteCount: 'votes',
    voted: 'Voted',
    voteNow: 'Submit Vote',
    claimPromo: 'Claim Offer',
    promoCode: 'Coupon Code',
    backToSearch: 'Back to Search',
    viewDetails: 'View Details',
    viewInFeed: 'View in Community Feed'
  },
  ur: {
    searchPlaceholder: 'ڈھوک حسو کنیکٹ تلاش کریں...',
    recent: 'حالیہ تلاشیں',
    trending: 'ڈھوک حسو میں مقبول',
    clearAll: 'تمام مٹائیں',
    noRecent: 'کوئی حالیہ تلاش موجود نہیں',
    filters: 'فلٹرز',
    all: 'تمام نتائج',
    posts: 'کمیونٹی پوسٹس',
    users: 'شہری اور صارفین',
    groups: 'لوکل گروپس',
    events: 'تقریبات',
    businesses: 'مقامی کاروبار',
    jobs: 'ملازمتیں',
    marketplace: 'خرید و فروخت',
    services: 'ماہرین و سروسز',
    property: 'جائیدادیں',
    deals: 'ڈیلز اور آفرز',
    alerts: 'علاقائی الرٹس',
    polls: 'رائے دہی / پولز',
    promotions: 'اشتہارات',
    searchResult: 'تلاش کا نتیجہ',
    searchResults: 'تلاش کے نتائج',
    noResults: 'کوئی نتیجہ نہیں ملا',
    noResultsDesc: 'براہ کرم دوسرے الفاظ یا کیٹیگری کا استعمال کریں۔',
    suggestions: 'تجویز کردہ تلاشیں',
    typingSuggestions: 'تجویزیں',
    loading: 'لوکل ڈائریکٹری میں تلاش جاری ہے...',
    verifiedResident: 'تصدیق شدہ شہری',
    verifiedEntity: 'تصدیق شدہ',
    contactOwner: 'مالک سے رابطہ کریں',
    directCall: 'کال کریں',
    chatSecurely: 'محفوظ چیٹ',
    voteCount: 'ووٹ',
    voted: 'ووٹ دیا گیا',
    voteNow: 'ووٹ دیں',
    claimPromo: 'آفر حاصل کریں',
    promoCode: 'کوپن کوڈ',
    backToSearch: 'تلاش پر واپس',
    viewDetails: 'تفصیلات دیکھیں',
    viewInFeed: 'فیڈ میں دیکھیں'
  }
};

// Local Mock Users list synthesized with distinct residents
const MOCK_USERS_DATA: User[] = [
  {
    fullName: 'Chaudhary Kamran',
    mobileNumber: '0300-1112222',
    area: 'Dhoke Hassu',
    username: 'kamran_chaudhary',
    bio: 'Social Activist & Union Council Committee Member. Here to help resolve Dhoke Hassu area issues.',
    joinDate: 'March 2024',
    reputationScore: 98,
    verified: true,
    profilePhoto: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=120'
  },
  {
    fullName: 'Ayesha Siddiqui',
    mobileNumber: '0333-1234567',
    area: 'Satellite Town',
    username: 'ayesha_siddiqui',
    bio: 'Health volunteer and administrator of Al-Khidmat Foundation youth wing.',
    joinDate: 'January 2024',
    reputationScore: 95,
    verified: true,
    profilePhoto: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=120'
  },
  {
    fullName: 'Waseem Akram',
    mobileNumber: '0321-7654321',
    area: 'Dhoke Khabba',
    username: 'waseem_akram',
    bio: 'Cricket enthusiast and tape-ball organizer. Works in computer hardware repairs.',
    joinDate: 'February 2024',
    reputationScore: 84,
    verified: false,
    profilePhoto: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&q=80&w=120'
  },
  {
    fullName: 'Malik Shakeel',
    mobileNumber: '0321-5551234',
    area: 'Dhoke Hassu',
    username: 'shakeel_tailor',
    bio: 'Owner of Rawal Boutique & Stitching Center. Specialist in bespoke ladies design suits.',
    joinDate: 'May 2024',
    reputationScore: 90,
    verified: true,
    profilePhoto: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=120'
  },
  {
    fullName: 'Zia-ur-Rehman',
    mobileNumber: '0345-9998888',
    area: 'Dhoke Hassu',
    username: 'zia_president',
    bio: 'Union Council UC-1 President. Always listening to community concerns to elevate Dhoke Hassu infrastructure.',
    joinDate: 'December 2023',
    reputationScore: 120,
    verified: true,
    profilePhoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120'
  }
];

// Predefined Trending search keywords
const TRENDING_KEYWORDS = [
  'Water supply issue',
  'Siddique Sweets',
  'Cricket night tournament',
  'Room for rent',
  'Tailor master job',
  'Electrician',
  'Medical Camp Sunday',
  'CNIC Lost wallet'
];
export default function SearchModule({
  currentLanguage,
  currentPath,
  navigate,
  posts,
  businesses,
  jobs,
  marketplaceItems,
  services,
  alerts,
  events,
  deals,
  groups,
  properties,
  currentUser
}: SearchModuleProps) {
const pollsBannerMap = useAdRotator('Polls & Opinions', 1, 1, 'Banner');
  const pollsAdMap = useAdRotator('Polls & Opinions', 200, 5, 'Feed');
  const t = SEARCH_TRANSLATIONS[currentLanguage];
  const isEn = currentLanguage === 'en';

  const inputRef = useRef<HTMLInputElement | null>(null);

  // Search input and status states
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('dh_recent_searches');
      return saved ? JSON.parse(saved) : ['Water supply', 'Siddique Sweets', 'Tailor master'];
    } catch {
      return ['Water supply', 'Siddique Sweets', 'Tailor master'];
    }
  });

  const [isLoading, setIsLoading] = useState(false);

  // Legacy ad load removed – ads are handled via useAdRotator hook

  const [votedPolls, setVotedPolls] = useState<Record<string, number>>({});

  // Local Polls and Promotions state to allow interactive votes
  const [localPolls, setLocalPolls] = useState<PollItem[]>([
    {
      id: 'poll-1',
      question: isEn 
        ? 'Should we establish a computer and IT skills lab for youngsters in Union Council 1?' 
        : 'کیا ہمیں یونین کونسل 1 میں نوجوانوں کے لیے کمپیوٹر اور آئی ٹی اسکلز لیب قائم کرنی چاہیے؟',
      options: isEn 
        ? [
            { text: 'Yes, definitely needed', votes: 124 },
            { text: 'No, priority should be water pipes', votes: 43 },
            { text: 'Need private partnership', votes: 18 }
          ]
        : [
            { text: 'جی ہاں، بالکل ضرورت ہے', votes: 124 },
            { text: 'نہیں، پانی کے پائپ ہماری پہلی ترجیح ہونی چاہیے', votes: 43 },
            { text: 'نجی شراکت داری کی ضرورت ہے', votes: 18 }
          ],
      totalVotes: 185,
      area: 'Dhoke Hassu',
      postedBy: 'Zia-ur-Rehman (UC-1 President)',
      postedTime: '2 days ago'
    },
    {
      id: 'poll-2',
      question: isEn 
        ? 'Which street needs primary asphalt resurfacing next month?' 
        : 'اگلے مہینے کس گلی میں بنیادی پختہ سڑک کی تعمیر ہونی چاہیے؟',
      options: isEn 
        ? [
            { text: 'Street 4 (Near Ghausia Mosque)', votes: 89 },
            { text: 'Main Ghausia Abad Bazaar Link', votes: 61 },
            { text: 'Junction near Pirwadhai Metro', votes: 34 }
          ]
        : [
            { text: 'گلی نمبر 4 (غوثیہ مسجد کے قریب)', votes: 89 },
            { text: 'مین غوثیہ آباد بازار لنک', votes: 61 },
            { text: 'پیرودھائی میٹرو کے قریب جنکشن', votes: 34 }
          ],
      totalVotes: 184,
      area: 'Dhoke Hassu Zone 1',
      postedBy: 'Chaudhary Kamran',
      postedTime: '4 days ago'
    }
  ]);

  const [localPromotions, setLocalPromotions] = useState<PromotionItem[]>([
    {
      id: 'promo-1',
      title: isEn 
        ? 'Siddique Sweets Special Jalebi Festival!' 
        : 'صدیق سویٹس کا خاص جلیبی میلہ!',
      businessName: 'Siddique Sweets & Bakers',
      description: isEn 
        ? 'Get 250g Free delicious hot crispy Jalebi on buying 1kg of pure desi ghee Jalebi today. Show this screen coupon to claim!' 
        : 'آج 1 کلو خالص دیسی گھی والی جلیبی خریدنے پر پاؤ کلو لذیذ گرم جلیبی بالکل مفت حاصل کریں۔ کلیم کرنے کے لیے یہ سکرین کوپن دکھائیں!',
      image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=600',
      area: 'Dhoke Hassu Main Road',
      postedTime: 'Just now',
      discountCode: 'DESIGHEE250',
      contact: '0300-5556667'
    },
    {
      id: 'promo-2',
      title: isEn 
        ? 'Rawal Boutique Ladies Lawn Stitching Flat 20% Discount' 
        : 'راول بوٹیک لیڈیز لان سلائی فلیٹ 20 فیصد رعایت',
      businessName: 'Rawal Boutique & Stitching Center',
      description: isEn 
        ? 'Pre-book your stitching orders this week and enjoy a flat 20% discount on customized boutique-style design tailors. Call now.' 
        : 'اس ہفتے اپنے سلائی کے آرڈرز پہلے سے بک کروائیں اور درزی کے بہترین ڈیزائنز پر فلیٹ 20 فیصد ڈسکاؤنٹ حاصل کریں۔ ابھی کال کریں۔',
      image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=600',
      area: 'Dhoke Hassu Street 4',
      postedTime: '3 hours ago',
      discountCode: 'STITCH20',
      contact: '0321-5551234'
    }
  ]);

  // Load polls and promotions from Supabase if configured
  useEffect(() => {
    if (!isSupabaseConfigured) return;

    async function loadPollsAndPromotions() {
      try {
        const fetchedPolls = await dbGetPolls([]);
        if (fetchedPolls.length > 0) {
          setLocalPolls(fetchedPolls);
        } else {
          for (const p of localPolls) {
            await dbSavePoll(p);
          }
        }

        const fetchedPromos = await dbGetPromotions([]);
        if (fetchedPromos.length > 0) {
          setLocalPromotions(fetchedPromos);
        } else {
          for (const pr of localPromotions) {
            await dbSavePromotion(pr);
          }
        }
      } catch (err) {
        console.warn("Status loading polls & promotions from Supabase:", err);
      }
    }

    loadPollsAndPromotions();
  }, []);

  // Selected Result Detail Modal State
  const [selectedItemDetail, setSelectedItemDetail] = useState<{
    type: string;
    data: any;
  } | null>(null);

  // Autofocus input on search view mount
  useEffect(() => {
    if (currentPath === '/search' && inputRef.current) {
      inputRef.current.focus();
    }
  }, [currentPath]);

  // Sync recent searches to localStorage
  const saveRecentSearches = (updated: string[]) => {
    setRecentSearches(updated);
    try {
      localStorage.setItem('dh_recent_searches', JSON.stringify(updated));
    } catch (e) {
      console.warn("Could not save recent searches:", e);
    }
  };

  const handleAddSearchWord = (word: string) => {
    const trimmed = word.trim();
    if (!trimmed) return;
    const filtered = recentSearches.filter(s => s.toLowerCase() !== trimmed.toLowerCase());
    const updated = [trimmed, ...filtered].slice(0, 8); // Keep last 8 searches
    saveRecentSearches(updated);
  };

  const handleDeleteSearchWord = (word: string) => {
    const updated = recentSearches.filter(s => s !== word);
    saveRecentSearches(updated);
  };

  const handleClearAllHistory = () => {
    saveRecentSearches([]);
  };

  // Compile all users (including current profile)
  const allUsers = [...MOCK_USERS_DATA, currentUser];

  // Map results uniformly to search structure
  interface UniformSearchResult {
    id: string;
    title: string;
    category: string; // Key filter
    categoryLabel: string;
    area: string;
    description: string;
    date: string;
    image?: string;
    rawType: string; // Underlying system type
    rawData: any;
  }

  const getUniformResults = (): UniformSearchResult[] => {
    const list: UniformSearchResult[] = [];

    // 1. Community Posts
    posts.forEach(p => {
      list.push({
        id: p.id,
        title: p.author,
        category: 'posts',
        categoryLabel: isEn ? 'Community Post' : 'کمیونٹی پوسٹ',
        area: p.area || 'Dhoke Hassu',
        description: p.content,
        date: p.time,
        image: p.image || p.avatar,
        rawType: 'post',
        rawData: p
      });
    });

    // 2. Users
    allUsers.forEach((u, idx) => {
      list.push({
        id: `user-${idx}-${u.fullName}`,
        title: u.fullName,
        category: 'users',
        categoryLabel: isEn ? 'Resident Profile' : 'شہری پروفائل',
        area: u.area || 'Dhoke Hassu',
        description: u.bio || (isEn ? 'Resident member of Dhoke Hassu Connect portal' : 'ڈھوک حسو کنیکٹ پورٹل کے معزز رکن'),
        date: u.joinDate || 'Joined 2024',
        image: u.profilePhoto,
        rawType: 'user',
        rawData: u
      });
    });

    // 3. Groups
    groups.forEach(g => {
      list.push({
        id: g.id,
        title: g.name,
        category: 'groups',
        categoryLabel: isEn ? 'Community Group' : 'کمیونٹی گروپ',
        area: g.area || 'Dhoke Hassu',
        description: g.description,
        date: `${g.memberCount} ${isEn ? 'members' : 'اراکین'}`,
        image: g.coverImage,
        rawType: 'group',
        rawData: g
      });
    });

    // 4. Events
    events.forEach(e => {
      list.push({
        id: e.id,
        title: e.title,
        category: 'events',
        categoryLabel: isEn ? 'Upcoming Event' : 'آنے والی تقریب',
        area: e.area || 'Dhoke Hassu',
        description: e.description,
        date: `${e.date} • ${e.startTime}`,
        image: e.coverImage,
        rawType: 'event',
        rawData: e
      });
    });

    // 5. Businesses
    businesses.forEach(b => {
      list.push({
        id: b.id,
        title: b.name,
        category: 'businesses',
        categoryLabel: isEn ? 'Local Shop / Business' : 'مقامی دکان / کاروبار',
        area: b.area || 'Dhoke Hassu',
        description: b.description || b.shortDescription || '',
        date: `${isEn ? 'Rating' : 'درجہ بندی'}: ⭐ ${b.rating}`,
        image: b.image || b.logo,
        rawType: 'business',
        rawData: b
      });
    });

    // 6. Jobs
    jobs.forEach(j => {
      list.push({
        id: j.id,
        title: j.title,
        category: 'jobs',
        categoryLabel: isEn ? 'Job Listing' : 'ملازمت کا اشتہار',
        area: j.area || 'Dhoke Hassu',
        description: `${j.company} - ${j.description || ''}`,
        date: `${isEn ? 'Salary' : 'تنخواہ'}: ${j.salary}`,
        image: j.image,
        rawType: 'job',
        rawData: j
      });
    });

    // 7. Marketplace
    marketplaceItems.forEach(m => {
      list.push({
        id: m.id,
        title: m.title,
        category: 'marketplace',
        categoryLabel: isEn ? 'Buy & Sell Item' : 'خرید و فروخت کی اشیاء',
        area: m.area || 'Dhoke Hassu',
        description: m.description || '',
        date: `${isEn ? 'Price' : 'قیمت'}: ${m.price}`,
        image: m.image,
        rawType: 'marketplace',
        rawData: m
      });
    });

    // 8. Services
    services.forEach(s => {
      const nameTitle = s.title ? `${s.title} (${s.name})` : s.name;
      list.push({
        id: s.id,
        title: nameTitle,
        category: 'services',
        categoryLabel: isEn ? 'Service Provider' : 'ماہر سروس فراہم کنندہ',
        area: s.area || 'Dhoke Hassu',
        description: s.description || '',
        date: `${isEn ? 'Experience' : 'تجربہ'}: ${s.experience} | ⭐ ${s.rating}`,
        image: s.image,
        rawType: 'service',
        rawData: s
      });
    });

    // 9. Property
    properties.forEach(pr => {
      list.push({
        id: pr.id,
        title: pr.title,
        category: 'property',
        categoryLabel: `${pr.purpose === 'Rent' ? (isEn ? 'For Rent' : 'برائے کرایہ') : (isEn ? 'For Sale' : 'برائے فروخت')} - ${pr.type}`,
        area: pr.area || 'Dhoke Hassu',
        description: pr.description || '',
        date: `${isEn ? 'Price' : 'قیمت'}: ${pr.price}`,
        image: pr.images?.[0],
        rawType: 'property',
        rawData: pr
      });
    });

    // 10. Deals
    deals.forEach(d => {
      list.push({
        id: d.id,
        title: d.title,
        category: 'deals',
        categoryLabel: isEn ? 'Deal & Discount' : 'ڈیل اور ڈسکاؤنٹ',
        area: d.area || 'Dhoke Hassu',
        description: `${d.businessName}: ${d.description}`,
        date: `${isEn ? 'Offer' : 'آفر'}: ${d.discountText}`,
        image: d.images?.[0],
        rawType: 'deal',
        rawData: d
      });
    });

    // 11. Alerts
    alerts.forEach(al => {
      list.push({
        id: al.id,
        title: al.title,
        category: 'alerts',
        categoryLabel: `${isEn ? 'Emergency Alert' : 'ہنگامی الرٹ'} (${al.severity})`,
        area: al.area || 'Dhoke Hassu',
        description: al.description,
        date: al.postedTime,
        image: al.image,
        rawType: 'alert',
        rawData: al
      });
    });

    // 12. Polls (Local interactive)
    localPolls.forEach(p => {
      list.push({
        id: p.id,
        title: p.question,
        category: 'polls',
        categoryLabel: isEn ? 'Local Poll' : 'لوکل پول رائے دہی',
        area: p.area || 'Dhoke Hassu',
        description: isEn 
          ? `Local Area Poll with ${p.totalVotes} responses. Tap to view or participate.` 
          : `لوکل پول باقاعدہ رائے دہی، کل ووٹ: ${p.totalVotes}۔ تفصیلات دیکھنے کے لیے کلک کریں۔`,
        date: p.postedTime,
        rawType: 'poll',
        rawData: p
      });
    });

    // 13. Promotions (Local interactive)
    localPromotions.forEach(pr => {
      list.push({
        id: pr.id,
        title: pr.title,
        category: 'promotions',
        categoryLabel: isEn ? 'Sponsor Promotion' : 'اسپانسر شدہ اشتہار',
        area: pr.area || 'Dhoke Hassu',
        description: pr.description,
        date: pr.postedTime,
        image: pr.image,
        rawType: 'promotion',
        rawData: pr
      });
    });

    return list;
  };

  // Dynamic filter lists
  const filterTabs = [
    { id: 'all', label: t.all },
    { id: 'posts', label: t.posts },
    { id: 'users', label: t.users },
    { id: 'groups', label: t.groups },
    { id: 'events', label: t.events },
    { id: 'businesses', label: t.businesses },
    { id: 'jobs', label: t.jobs },
    { id: 'marketplace', label: t.marketplace },
    { id: 'services', label: t.services },
    { id: 'property', label: t.property },
    { id: 'deals', label: t.deals },
    { id: 'alerts', label: t.alerts },
    { id: 'polls', label: t.polls },
    { id: 'promotions', label: t.promotions }
  ];

  // Perform filtering and searching
  const rawResults = getUniformResults();
  
  const matchesSearch = (item: UniformSearchResult, searchStr: string): boolean => {
    if (!searchStr) return false;
    const lower = searchStr.toLowerCase();
    
    return (
      item.title?.toLowerCase().includes(lower) ||
      item.description?.toLowerCase().includes(lower) ||
      item.area?.toLowerCase().includes(lower) ||
      item.categoryLabel?.toLowerCase().includes(lower) ||
      (item.rawData?.company && item.rawData.company.toLowerCase().includes(lower)) ||
      (item.rawData?.ownerName && item.rawData.ownerName.toLowerCase().includes(lower)) ||
      (item.rawData?.sellerName && item.rawData.sellerName.toLowerCase().includes(lower)) ||
      (item.rawData?.name && item.rawData.name.toLowerCase().includes(lower)) ||
      (item.rawData?.postedBy && item.rawData.postedBy.toLowerCase().includes(lower)) ||
      (item.rawData?.businessName && item.rawData.businessName.toLowerCase().includes(lower))
    );
  };

  const filteredResults = rawResults.filter(item => {
    // Category match
    if (activeFilter !== 'all' && item.category !== activeFilter) {
      return false;
    }
    // Search query match
    if (query.trim()) {
      return matchesSearch(item, query);
    }
    return false; // If no query is entered, don't show search results cards (show main UI search suggestions)
  });


  // Typing suggestions list (first 5 unique matches)
  const typingSuggestions = query.trim() 
    ? rawResults
        .filter(item => matchesSearch(item, query))
        .map(item => {
          // Extract matching word or short title
          if (item.title && item.title.toLowerCase().includes(query.toLowerCase())) {
            return item.title;
          }
          if (item.rawData?.company && item.rawData.company.toLowerCase().includes(query.toLowerCase())) {
            return item.rawData.company;
          }
          return item.title;
        })
        .filter((value, index, self) => self.indexOf(value) === index)
        .slice(0, 5)
    : [];

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    handleAddSearchWord(query);
    
    // Smooth fast fake directory loading
    setTimeout(() => {
      setIsLoading(false);
      navigate(`/search/results?q=${encodeURIComponent(query)}`);
    }, 450);
  };

  // Perform quick click on recent search / trending search
  const handleSelectPredefinedSearch = (keyword: string) => {
    setQuery(keyword);
    setIsLoading(true);
    handleAddSearchWord(keyword);

    setTimeout(() => {
      setIsLoading(false);
      navigate(`/search/results?q=${encodeURIComponent(keyword)}`);
    }, 400);
  };

  // Handle clicking a search result (existing detail page or details modal)
  const handleResultClick = (item: UniformSearchResult) => {
    // Open existing detail page if mapped in AppShell
    if (item.rawType === 'group') {
      navigate('/groups/detail', item.rawData.id);
    } else if (item.rawType === 'event') {
      navigate('/events/detail', item.rawData.id);
    } else if (item.rawType === 'business') {
      navigate('/business/detail', item.rawData.id);
    } else if (item.rawType === 'job') {
      navigate('/jobs/detail', item.rawData.id);
    } else if (item.rawType === 'marketplace') {
      navigate('/marketplace/detail', item.rawData.id);
    } else if (item.rawType === 'service') {
      navigate('/services/detail', item.rawData.id);
    } else if (item.rawType === 'property') {
      navigate('/property/detail', item.rawData.id);
    } else if (item.rawType === 'deal') {
      navigate('/deals/detail', item.rawData.id);
    } else if (item.rawType === 'alert') {
      navigate('/alerts/detail', item.rawData.id);
    } else if (item.rawType === 'user') {
      if ((window as any).openUserProfile) {
        (window as any).openUserProfile(item.rawData.fullName || item.title, item.rawData.profilePhoto || item.image);
      }
    } else {
      // For Post, Poll, Promotion, open a customized high-fidelity modal in this view!
      setSelectedItemDetail({
        type: item.rawType,
        data: item.rawData
      });
    }
  };

  const handleVotePoll = (pollId: string, optionIdx: number) => {
    setVotedPolls(prev => ({
      ...prev,
      [pollId]: optionIdx
    }));

    setLocalPolls(prev => prev.map(p => {
      if (p.id === pollId) {
        const updatedOptions = p.options.map((opt, oIdx) => {
          if (oIdx === optionIdx) {
            return { ...opt, votes: opt.votes + 1 };
          }
          return opt;
        });
        const updated = {
          ...p,
          options: updatedOptions,
          totalVotes: p.totalVotes + 1,
          userVotedIdx: optionIdx
        };
        dbSavePoll(updated);
        return updated;
      }
      return p;
    }));

    // If modal is open, also sync modal data
    if (selectedItemDetail && selectedItemDetail.type === 'poll' && selectedItemDetail.data.id === pollId) {
      setSelectedItemDetail(prev => {
        if (!prev) return null;
        const currentPoll = prev.data;
        const updatedOptions = currentPoll.options.map((opt: any, oIdx: number) => {
          if (oIdx === optionIdx) {
            return { ...opt, votes: opt.votes + 1 };
          }
          return opt;
        });
        return {
          ...prev,
          data: {
            ...currentPoll,
            options: updatedOptions,
            totalVotes: currentPoll.totalVotes + 1,
            userVotedIdx: optionIdx
          }
        };
      });
    }
  };

  // Helper icons for categories in results
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'posts': return <Rss className="w-3.5 h-3.5 text-teal-600" />;
      case 'users': return <UserIcon className="w-3.5 h-3.5 text-slate-600" />;
      case 'groups': return <Users className="w-3.5 h-3.5 text-blue-600" />;
      case 'events': return <Calendar className="w-3.5 h-3.5 text-emerald-600" />;
      case 'businesses': return <Store className="w-3.5 h-3.5 text-violet-600" />;
      case 'jobs': return <Briefcase className="w-3.5 h-3.5 text-orange-600" />;
      case 'marketplace': return <ShoppingBag className="w-3.5 h-3.5 text-amber-600" />;
      case 'services': return <Wrench className="w-3.5 h-3.5 text-cyan-600" />;
      case 'property': return <Home className="w-3.5 h-3.5 text-pink-600" />;
      case 'deals': return <Tag className="w-3.5 h-3.5 text-rose-600" />;
      case 'alerts': return <AlertTriangle className="w-3.5 h-3.5 text-red-600" />;
      case 'polls': return <BarChart2 className="w-3.5 h-3.5 text-indigo-600" />;
      case 'promotions': return <Megaphone className="w-3.5 h-3.5 text-yellow-600" />;
      default: return <Search className="w-3.5 h-3.5 text-slate-500" />;
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-4 space-y-6 animate-fade-in" id="global-search-container">
      {/* Top Banner Ad Segment */}
      {pollsBannerMap[0] && (
        <div className="mb-6">
          <AdBannerCard ad={pollsBannerMap[0]} />
        </div>
      )}

      
      {/* SEARCH HEADER BAR */}
      <form onSubmit={handleSearchSubmit} className="relative flex items-center gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm" id="global-search-form">
        <button 
          type="button" 
          onClick={() => {
            if (currentPath === '/search/results') {
              navigate('/search');
            } else {
              navigate('/home');
            }
          }}
          className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-500 transition-colors"
          title={t.backToSearch}
        >
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>

        <div className="relative flex-1">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              if (currentPath === '/search/results') {
                navigate('/search'); // Pull back to live suggestions page if they start typing again
              }
            }}
            placeholder={t.searchPlaceholder}
            className="w-full bg-transparent border-none text-slate-900 focus:outline-none text-sm placeholder-slate-400 font-medium py-1.5 pl-2 pr-8"
            id="global-search-input"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                if (inputRef.current) inputRef.current.focus();
              }}
              className="absolute inset-y-0 right-0 pr-2 flex items-center text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-extrabold shadow-sm hover:shadow-md transition-all shrink-0 flex items-center gap-1.5"
          id="global-search-submit-btn"
        >
          <Search className="w-3.5 h-3.5" />
          <span>{isEn ? 'Search' : 'تلاش کریں'}</span>
        </button>
      </form>

      {/* RENDER VIEW 1: LIVE SEARCH INPUT SUGGESTIONS / TRENDING / RECENT HISTORY */}
      {currentPath === '/search' && (
        <div className="space-y-6" id="search-suggestions-container">
          
          {/* LIVE TYPING SUGGESTIONS DROPDOWN */}
          {query.trim().length > 0 && typingSuggestions.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-3 space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider px-2 block">
                🔍 {t.typingSuggestions}
              </span>
              {typingSuggestions.map((suggestion, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectPredefinedSearch(suggestion)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-800 text-sm font-bold hover:bg-slate-50 rounded-xl text-left cursor-pointer transition-colors"
                >
                  <Search className="w-3.5 h-3.5 text-slate-400" />
                  <span>{suggestion}</span>
                </button>
              ))}
            </div>
          )}

          {/* RECENT SEARCHES PANEL */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4" id="recent-searches-box">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-blue-600" />
                {t.recent}
              </h3>
              {recentSearches.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearAllHistory}
                  className="text-[10px] font-extrabold text-red-500 hover:text-red-600 transition-colors cursor-pointer uppercase tracking-wider"
                >
                  {t.clearAll}
                </button>
              )}
            </div>

            {recentSearches.length === 0 ? (
              <p className="text-xs text-slate-400 font-medium py-3 text-center">
                {t.noRecent}
              </p>
            ) : (
              <div className="space-y-2">
                {recentSearches.map((keyword, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between px-3 py-2 bg-slate-50 rounded-xl border border-slate-100 hover:bg-slate-100/80 transition-colors"
                  >
                    <button
                      type="button"
                      onClick={() => handleSelectPredefinedSearch(keyword)}
                      className="flex-1 flex items-center gap-2 text-slate-800 text-xs font-bold text-left cursor-pointer"
                    >
                      <span>{keyword}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteSearchWord(keyword)}
                      className="p-1 text-slate-400 hover:text-red-500 rounded-lg transition-colors cursor-pointer"
                      title={isEn ? 'Delete' : 'حذف کریں'}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* TRENDING SEARCHES PANEL */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4" id="trending-searches-box">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              {t.trending}
            </h3>
            
            <div className="flex flex-wrap gap-2.5">
              {TRENDING_KEYWORDS.map((keyword, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleSelectPredefinedSearch(keyword)}
                  className="px-3.5 py-2 bg-blue-50/60 hover:bg-blue-100/80 text-blue-700 border border-blue-100/40 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <span>🔥</span>
                  <span>{keyword}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* RENDER VIEW 2: SEARCH RESULTS WITH ADVANCED FILTERS */}
      {currentPath === '/search/results' && (
        <div className="space-y-5" id="search-results-viewport">
          
          {/* FILTER CHIPS ROW */}
          <div className="space-y-2.5">
            <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider flex items-center gap-1.5 px-1">
              <Filter className="w-3 h-3 text-slate-500" />
              {t.filters}
            </span>
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none select-none" id="search-filter-chips">
              {filterTabs.map((tab) => {
                const isActive = activeFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveFilter(tab.id)}
                    className={`px-4 py-2 text-xs font-extrabold rounded-xl border shrink-0 transition-all cursor-pointer shadow-2xs flex items-center gap-1.5 ${
                      isActive 
                        ? 'bg-blue-600 text-white border-blue-600' 
                        : 'bg-white text-slate-700 border-slate-200/80 hover:bg-slate-50'
                    }`}
                  >
                    {isActive && <Check className="w-3 h-3 text-white" />}
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* SKELETON LOADING STATE */}
          {isLoading ? (
            <div className="space-y-3" id="search-results-loading">
              <div className="text-center py-8 text-xs text-slate-500 font-extrabold animate-pulse">
                ⏳ {t.loading}
              </div>
              {[1, 2, 3].map(n => (
                <div key={n} className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3 shadow-2xs animate-pulse">
                  <div className="flex gap-3">
                    <div className="w-12 h-12 bg-slate-100 rounded-xl shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="w-1/3 h-4 bg-slate-100 rounded" />
                      <div className="w-2/3 h-3 bg-slate-100 rounded" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <>
              {/* RESULTS QUANTITY SUMMARY */}
              <div className="flex justify-between items-center text-xs text-slate-500 px-1">
                <span>
                  🔍 {filteredResults.length} {filteredResults.length === 1 ? t.searchResult : t.searchResults} for "<strong>{query}</strong>"
                </span>
                <span className="font-mono text-[10px] uppercase font-black bg-slate-100 px-2 py-0.5 rounded-lg">
                  {filterTabs.find(tab => tab.id === activeFilter)?.label}
                </span>
              </div>

              {/* EMPTY STATE */}
              {filteredResults.length === 0 ? (
                <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-xs space-y-4" id="search-empty-state">
                  <div className="text-5xl">🔎</div>
                  <h3 className="text-base font-black text-slate-800">{t.noResults}</h3>
                  <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">{t.noResultsDesc}</p>
                  
                  {/* Quick fallback suggestions */}
                  <div className="pt-4 border-t border-slate-100 max-w-md mx-auto">
                    <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block mb-2">{t.suggestions}</span>
                    <div className="flex flex-wrap justify-center gap-1.5">
                      {['Water', 'Sweets', 'Cricket', 'Tailor', 'Doctor'].map((term, i) => (
                        <button
                          key={i}
                          onClick={() => {
                            setQuery(term);
                            handleSearchSubmit();
                          }}
                          className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                        >
                          {term}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                /* RESULT CARDS LIST */
                <div className="space-y-3" id="search-results-list">
                  {(() => {
                    const elements = [];
                    for (let i = 0; i < filteredResults.length; i++) {
                      const item = filteredResults[i];
                      const verified = isEntityVerified(item.title);
                      const ad = pollsAdMap[i];

                      elements.push(
                        <div
                          key={item.id}
                          onClick={() => handleResultClick(item)}
                          className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs hover:shadow-xs transition-all flex gap-3.5 items-start cursor-pointer group active:scale-[0.99]"
                        >
                          {/* THUMBNAIL */}
                          {item.image ? (
                            <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-100 border border-slate-100 shrink-0 shadow-2xs">
                              <img 
                                src={item.image} 
                                alt={item.title} 
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-250"
                                referrerPolicy="no-referrer"
                              />
                            </div>
                          ) : (
                            <div className="w-14 h-14 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-black text-lg shrink-0 border border-blue-100/60 uppercase">
                              {item.title.charAt(0)}
                            </div>
                          )}

                          {/* CONTENT DETAILS */}
                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex flex-wrap items-center gap-1.5">
                              {/* CATEGORY IDENTIFIER BADGE */}
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-700 rounded-lg text-[9px] font-black uppercase tracking-wider">
                                {getCategoryIcon(item.category)}
                                <span>{item.categoryLabel}</span>
                              </span>

                              {/* AREA TAG */}
                              <span className="text-[9px] bg-slate-50 text-slate-500 font-bold px-1.5 py-0.5 rounded border border-slate-100">
                                📍 {item.area}
                              </span>
                            </div>

                            <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-1 group-hover:text-blue-600 transition-colors line-clamp-1">
                              <span>{item.title}</span>
                              {verified && (
                                <span className="inline-flex items-center justify-center bg-[#2563eb] text-white rounded-full p-0.5 shrink-0" title="Verified" style={{ width: '13px', height: '13px' }}>
                                  <svg className="w-2 h-2 stroke-white fill-none" viewBox="0 0 24 24" style={{ strokeWidth: 4 }}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                  </svg>
                                </span>
                              )}
                            </h3>

                            {/* SHORT DESCRIPTION DESCRIPTION */}
                            <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                              {item.description}
                            </p>

                            {/* DATE / OTHER ATTRIBUTE SUBROW */}
                            <div className="flex justify-between items-center pt-1.5 text-[10px] text-slate-400 font-semibold font-mono">
                              <span>{item.date}</span>
                              <span className="text-blue-600 font-bold hover:underline flex items-center gap-0.5">
                                {t.viewDetails}
                                <ChevronRight className="w-3 h-3" />
                              </span>
                            </div>
                          </div>
                        </div>
                      );

                      // Inject Polls & Opinions active ad via rotation (polls tab only)
                      if (ad && activeFilter === 'polls') {
                        elements.push(
                          <div key={`ad-polls-${i}-${ad.id}`} className="my-2">
                            <AdBannerCard ad={ad} />
                          </div>
                        );
                      }
                    }
                    return elements;
                  })()}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* DETAIL MODAL FOR RESIDENT PROFILES, POSTS, POLLS, PROMOTIONS */}
      {selectedItemDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in" id="search-item-detail-modal">
          <div className="bg-white rounded-3xl border border-slate-200/80 w-full max-w-md shadow-2xl overflow-hidden relative animate-scale-up">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 p-4 bg-slate-50">
              <span className="text-[10px] font-black uppercase tracking-wider bg-blue-100 text-blue-700 px-2.5 py-1 rounded-lg">
                {selectedItemDetail.type === 'post' && (isEn ? 'Community Post' : 'کمیونٹی پوسٹ')}
                {selectedItemDetail.type === 'user' && (isEn ? 'Resident Profile' : 'شہری پروفائل')}
                {selectedItemDetail.type === 'poll' && (isEn ? 'Local Area Poll' : 'لوکل پول رائے دہی')}
                {selectedItemDetail.type === 'promotion' && (isEn ? 'Sponsor Promotion' : 'اسپانسر اشتہار')}
              </span>
              <button
                onClick={() => setSelectedItemDetail(null)}
                className="p-1.5 hover:bg-slate-200 text-slate-500 hover:text-slate-700 rounded-xl transition-all cursor-pointer"
                title={isEn ? 'Close' : 'بند کریں'}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 max-h-[70vh] overflow-y-auto space-y-5">
              
              {/* 1. COMMUNITY POST MODAL */}
              {selectedItemDetail.type === 'post' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <img 
                      src={selectedItemDetail.data.avatar} 
                      alt={selectedItemDetail.data.author} 
                      className="w-10 h-10 rounded-full object-cover border border-slate-100 cursor-pointer hover:ring-2 hover:ring-blue-400 hover:ring-offset-1 transition-all"
                      referrerPolicy="no-referrer"
                      data-profile-name={selectedItemDetail.data.author}
                      data-profile-avatar={selectedItemDetail.data.avatar}
                    />
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-1">
                        <span
                          className="cursor-pointer hover:text-blue-600 hover:underline transition-colors"
                          data-profile-name={selectedItemDetail.data.author}
                          data-profile-avatar={selectedItemDetail.data.avatar}
                        >
                          {selectedItemDetail.data.author}
                        </span>
                        {isEntityVerified(selectedItemDetail.data.author) && (
                          <span className="inline-flex items-center justify-center bg-[#2563eb] text-white rounded-full p-0.5 shrink-0" title="Verified Resident" style={{ width: '13px', height: '13px' }}>
                            <svg className="w-2 h-2 stroke-white fill-none" viewBox="0 0 24 24" style={{ strokeWidth: 4 }}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          </span>
                        )}
                      </h4>
                      <p className="text-[10px] text-slate-400 font-mono">
                        📍 {selectedItemDetail.data.area} • {selectedItemDetail.data.time}
                      </p>
                    </div>
                  </div>

                  <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
                    {selectedItemDetail.data.content}
                  </p>

                  {selectedItemDetail.data.image && (
                    <div className="rounded-xl overflow-hidden max-h-52 bg-slate-50 border border-slate-100 shadow-2xs">
                      <img 
                        src={selectedItemDetail.data.image} 
                        alt="Post attachment" 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  )}

                  <div className="flex items-center gap-4 pt-3 border-t border-slate-100 text-xs text-slate-500 font-bold">
                    <div className="flex items-center gap-1.5 text-rose-500">
                      <Heart className="w-4 h-4 fill-rose-100 text-rose-500" />
                      <span>{selectedItemDetail.data.likes} {isEn ? 'Likes' : 'پسند'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-600">
                      <MessageCircle className="w-4 h-4" />
                      <span>{selectedItemDetail.data.commentsCount} {isEn ? 'Comments' : 'تبصرے'}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedItemDetail(null);
                      navigate('/feed');
                    }}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Rss className="w-4 h-4" />
                    <span>{t.viewInFeed}</span>
                  </button>
                </div>
              )}

              {/* 2. USER PROFILE CARD MODAL */}
              {selectedItemDetail.type === 'user' && (
                <div className="space-y-4 text-center">
                  <div className="flex flex-col items-center space-y-2">
                    {selectedItemDetail.data.profilePhoto ? (
                      <img 
                        src={selectedItemDetail.data.profilePhoto} 
                        alt={selectedItemDetail.data.fullName} 
                        className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-md ring-1 ring-slate-100"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-blue-50 text-blue-600 border border-blue-100/60 flex items-center justify-center font-black text-3xl shadow-sm uppercase">
                        {selectedItemDetail.data.fullName.charAt(0)}
                      </div>
                    )}
                    
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-base flex items-center justify-center gap-1">
                        <span>{selectedItemDetail.data.fullName}</span>
                        {(selectedItemDetail.data.verified || isEntityVerified(selectedItemDetail.data.fullName)) && (
                          <span className="inline-flex items-center justify-center bg-green-500 text-white rounded-full p-0.5 shrink-0 shadow-xs" title={t.verifiedResident} style={{ width: '15px', height: '15px' }}>
                            <svg className="w-2 h-2 stroke-white fill-none" viewBox="0 0 24 24" style={{ strokeWidth: 4 }}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          </span>
                        )}
                      </h4>
                      {selectedItemDetail.data.username && (
                        <p className="text-xs text-slate-400 font-medium font-mono">@{selectedItemDetail.data.username}</p>
                      )}
                    </div>

                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-black uppercase tracking-wider">
                      📍 {selectedItemDetail.data.area || 'Dhoke Hassu'}
                    </span>
                  </div>

                  {selectedItemDetail.data.bio && (
                    <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100/60 leading-relaxed italic">
                      "{selectedItemDetail.data.bio}"
                    </p>
                  )}

                  <div className="grid grid-cols-2 gap-2 text-center pt-2">
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <span className="block text-[9px] uppercase font-black tracking-wider text-slate-400">{isEn ? 'Reputation Score' : 'مقام سکور'}</span>
                      <span className="text-sm font-black text-emerald-600">⭐ {selectedItemDetail.data.reputationScore || 90}</span>
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <span className="block text-[9px] uppercase font-black tracking-wider text-slate-400">{isEn ? 'Portal Member' : 'پورٹل ممبر منذ'}</span>
                      <span className="text-xs font-black text-slate-700">{selectedItemDetail.data.joinDate || 'Since 2024'}</span>
                    </div>
                  </div>

                  {selectedItemDetail.data.mobileNumber && (
                    <div className="flex gap-2.5 pt-2">
                      <a
                        href={`tel:${selectedItemDetail.data.mobileNumber}`}
                        className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-1.5"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>{t.directCall}</span>
                      </a>
                      <button
                        onClick={() => {
                          setSelectedItemDetail(null);
                          // Simulated chat action trigger in window
                          if ((window as any).openChat) {
                            (window as any).openChat(selectedItemDetail.data.mobileNumber, selectedItemDetail.data.fullName, selectedItemDetail.data.profilePhoto || '');
                          } else {
                            navigate('/chat');
                          }
                        }}
                        className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>{t.chatSecurely}</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* 3. LOCAL AREA POLL MODAL WITH LIVE VOTING */}
              {selectedItemDetail.type === 'poll' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs bg-indigo-50 text-indigo-700 border border-indigo-100 px-2 py-0.5 rounded-lg font-bold">
                      📊 UC-1 {isEn ? 'Citizen Poll' : 'عوامی سروے'}
                    </span>
                    <span className="text-[10px] text-slate-400 font-semibold">• {selectedItemDetail.data.postedTime}</span>
                  </div>

                  <h3 className="font-extrabold text-slate-900 text-base leading-snug">
                    {selectedItemDetail.data.question}
                  </h3>

                  <div className="space-y-2.5 pt-2">
                    {selectedItemDetail.data.options.map((option: any, index: number) => {
                      const userVotedIdx = selectedItemDetail.data.userVotedIdx;
                      const hasVoted = userVotedIdx !== undefined;
                      const isSelected = userVotedIdx === index;
                      const percent = selectedItemDetail.data.totalVotes > 0 
                        ? Math.round((option.votes / selectedItemDetail.data.totalVotes) * 100) 
                        : 0;

                      return (
                        <div key={index} className="relative">
                          {hasVoted ? (
                            /* VOTED PROGRESS BAR */
                            <div className={`w-full p-3.5 rounded-xl border transition-all text-xs flex justify-between items-center relative overflow-hidden ${
                              isSelected 
                                ? 'bg-indigo-50 border-indigo-300 text-indigo-900 font-bold' 
                                : 'bg-slate-50 border-slate-200 text-slate-700'
                            }`}>
                              {/* Background fill */}
                              <div 
                                className={`absolute left-0 top-0 bottom-0 transition-all duration-500 ${isSelected ? 'bg-indigo-200/40' : 'bg-slate-200/30'}`}
                                style={{ width: `${percent}%` }}
                              />
                              
                              <span className="relative z-10 flex items-center gap-1.5 truncate max-w-[80%]">
                                {isSelected && <span className="text-indigo-600">✓</span>}
                                <span>{option.text}</span>
                              </span>
                              
                              <span className="relative z-10 font-bold shrink-0">
                                {percent}% ({option.votes} {t.voteCount})
                              </span>
                            </div>
                          ) : (
                            /* ACTIVE VOTING BUTTON */
                            <button
                              onClick={() => handleVotePoll(selectedItemDetail.data.id, index)}
                              className="w-full text-left p-3.5 rounded-xl border border-slate-200/80 hover:bg-indigo-50 hover:border-indigo-200 text-slate-800 text-xs font-bold transition-all cursor-pointer hover:text-indigo-900"
                            >
                              {option.text}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold pt-2 border-t border-slate-100">
                    <span>✍️ {isEn ? 'By' : 'بذریعہ'}: {selectedItemDetail.data.postedBy}</span>
                    <span>🗳️ {selectedItemDetail.data.totalVotes} {isEn ? 'total responses' : 'کل آراء'}</span>
                  </div>
                </div>
              )}

              {/* 4. SPONSOR PROMOTION MODAL WITH CLAIM ACTION */}
              {selectedItemDetail.type === 'promotion' && (
                <div className="space-y-4">
                  <div className="rounded-2xl overflow-hidden max-h-52 bg-slate-50 border border-slate-100 shadow-sm relative">
                    <img 
                      src={selectedItemDetail.data.image} 
                      alt={selectedItemDetail.data.title} 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-3 left-3 bg-yellow-500 text-slate-900 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md shadow-sm">
                      ⚡ SPONSORED
                    </div>
                  </div>

                  <div>
                    <h3 className="font-extrabold text-slate-900 text-base leading-tight">
                      {selectedItemDetail.data.title}
                    </h3>
                    <p className="text-[10px] text-slate-400 font-mono mt-1">
                      🏬 {selectedItemDetail.data.businessName} • 📍 {selectedItemDetail.data.area}
                    </p>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                    {selectedItemDetail.data.description}
                  </p>

                  {selectedItemDetail.data.discountCode && (
                    <div className="bg-dashed border border-blue-300 bg-blue-50/50 p-3 rounded-xl text-center space-y-1">
                      <span className="block text-[9px] uppercase font-black text-blue-500 tracking-wider">
                        🎫 {t.promoCode}
                      </span>
                      <strong className="text-base font-mono text-blue-800 tracking-widest uppercase">
                        {selectedItemDetail.data.discountCode}
                      </strong>
                    </div>
                  )}

                  {selectedItemDetail.data.contact && (
                    <div className="flex gap-2 pt-2">
                      <a
                        href={`tel:${selectedItemDetail.data.contact}`}
                        className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-1.5"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>{t.directCall}</span>
                      </a>
                      <button
                        onClick={() => {
                          alert(isEn ? 'Promo code successfully claimed and recorded on your profile!' : 'کوپن کوڈ کامیابی کے ساتھ آپ کی پروفائل پر محفوظ کر لیا گیا ہے!');
                          setSelectedItemDetail(null);
                        }}
                        className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Gift className="w-4 h-4" />
                        <span>{t.claimPromo}</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
