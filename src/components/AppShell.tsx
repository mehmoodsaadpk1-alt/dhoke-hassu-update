/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Users,
  Home as HomeIcon, 
  Rss, 
  MessageSquare, 
  User as UserIcon, 
  Globe, 
  LogOut, 
  Briefcase, 
  Building2, 
  ShoppingBag, 
  Store, 
  Heart, 
  MessageCircle, 
  Share2, 
  Send, 
  Search, 
  MapPin, 
  Phone, 
  Calendar, 
  ShieldCheck, 
  PlusCircle, 
  X,
  Plus,
  Wrench,
  Bell,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Tag,
  Camera,
  Smile,
  Image as ImageIcon,
  Video,
  Trash2,
  Settings,
  AlertTriangle,
  Clock,
  Award,
  Upload,
  CheckCircle
} from 'lucide-react';
import { Language, NavigationTab, User, Post, JobItem, BusinessItem, PropertyItem, BuySellItem, ServiceItem, AlertItem, EventItem, DealItem, Story, Comment, GroupItem, AdItem, Poll, PollOption } from '../types';
import { translations } from '../translations';
import { 
  mockStories, 
  mockPosts, 
  mockJobs, 
  mockProperties, 
  mockBuySell, 
  mockBusinesses,
  mockServices,
  mockAlerts,
  mockEvents,
  mockDeals,
  mockGroups
} from '../mockData';
import PremiumAdPopup from './PremiumAdPopup';
import { usePremiumPopup } from '../hooks/usePremiumPopup';
import JobsModule from './JobsModule';
import BusinessModule from './BusinessModule';
import PropertyModule from './PropertyModule';
import MarketplaceModule from './MarketplaceModule';
import ChatModule from './ChatModule';
import ServicesModule from './ServicesModule';
import AlertsModule, { isUserAdminOrModerator } from './AlertsModule';
import EventsModule from './EventsModule';
import DealsModule from './DealsModule';
import PollsModule from './PollsModule';
import PagesModule from './PagesModule';
import SocialGroupsModule from './SocialGroupsModule';
import ProfileModule from './ProfileModule';
import UserProfileView from './UserProfileView';
import { ErrorBoundary } from './ErrorBoundary';
import ClickableAvatar from './ClickableAvatar';
import GroupsModule from './GroupsModule';
import NotificationsModule from './NotificationsModule';
import VerificationModule from './VerificationModule';
import SearchModule from './SearchModule';
import SettingsModule from './SettingsModule';
import TrendingHashtags from './TrendingHashtags';
import HashtagFeed from './HashtagFeed';
import { isEntityVerified } from '../utils/verification';
import { tvsGetActiveBadges } from '../utils/tvs';
import StoryCreator from './StoryCreator';
import StoryViewer from './StoryViewer';
import TvsBadge from './TvsBadge';
import TvsApplicationModal from './TvsApplicationModal';
import TvsPublicVerify from './TvsPublicVerify';
import { AppAvatar, AppButton, AppCard, AppBadge, AppTabs, AppTextarea, AppInput } from './ui';
import {
  isSupabaseConfigured,
  supabase,
  dbGetUserProfile,
  dbSaveUserProfile,
  dbGetStories,
  dbGetAllStoryAds,
  dbSaveStory,
  dbDeleteStory,
  dbGetPosts,
  dbSavePost,
  dbUploadPostImage,
  dbUploadPostVideo,
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
  dbGetUnreadNotificationsCount,
  dbGetNotifications,
  dbMarkNotificationRead,
  dbMarkAllNotificationsRead,
  dbGetActiveAds,
  dbGetPolls,
  dbCastVote,
  dbGetUserVotes,
  dbUploadAvatar,
  dbTogglePostLike,
  dbGetUserPostLikes,
  dbGetPostLikeCounts
} from '../utils/supabaseClient';
import { detectBrowserLocation, findNearestArea, STATIC_AREAS } from '../utils/locationService';
import AdBannerCard from './AdBannerCard';
import PostComposer from './PostComposer';
import PostCard from './PostCard';
import AdminStoryAds from './AdminStoryAds';
import AdImageViewer from './AdImageViewer';
import FeedCard from './FeedCard';
import ShareModal, { ShareEntityType } from './ShareModal';
import { adAnalytics } from '../utils/adAnalytics';
import { useAdRotator } from '../hooks/useAdRotator';
import { VideosModule } from './video/VideosModule';

const getTvsBadgeType = (author: string): 'Individual' | 'Business' | 'Government' | 'Healthcare' | 'NGO' | 'Emergency' | 'Leader' => {
  if (!author) return 'Individual';
  const name = author?.toLowerCase();
  if (name.includes('sweets') || name.includes('connect') || name.includes('store') || name.includes('shop')) return 'Business';
  if (name.includes('president') || name.includes('leader') || name.includes('chairman')) return 'Leader';
  if (name.includes('police') || name.includes('rescue') || name.includes('fire') || name.includes('emergency')) return 'Emergency';
  if (name.includes('hospital') || name.includes('doctor') || name.includes('health') || name.includes('clinic')) return 'Healthcare';
  if (name.includes('ngo') || name.includes('foundation') || name.includes('trust')) return 'NGO';
  if (name.includes('municipal') || name.includes('government') || name.includes('ministry')) return 'Government';
  return 'Individual';
};



const NAV_ITEMS_CONFIG = [
  {
    id: 'home',
    labelEn: 'Home',
    labelUr: 'ہوم',
    path: '/home',
    icon: HomeIcon,
    bgClass: 'bg-blue-50 text-blue-600 hover:bg-blue-100/80',
    activeBgClass: 'bg-blue-600 text-white shadow-md shadow-blue-500/20',
    activeTextClass: 'text-blue-600 font-extrabold',
    isActive: (path: string, activeTab: string) => activeTab === 'home' && !path.startsWith('/jobs') && !path.startsWith('/business') && !path.startsWith('/businesses') && !path.startsWith('/property') && !path.startsWith('/marketplace') && !path.startsWith('/services') && !path.startsWith('/alerts') && !path.startsWith('/events') && !path.startsWith('/deals') && !path.startsWith('/polls'),
  },
  {
    id: 'feed',
    labelEn: 'Community',
    labelUr: 'کمیونٹی',
    path: '/feed',
    icon: Rss,
    bgClass: 'bg-teal-50 text-teal-600 hover:bg-teal-100/80',
    activeBgClass: 'bg-teal-600 text-white shadow-md shadow-teal-500/20',
    activeTextClass: 'text-teal-600 font-extrabold',
    isActive: (path: string, activeTab: string) => activeTab === 'feed',
  },
  {
    id: 'videos',
    labelEn: 'Watch',
    labelUr: 'ویڈیوز',
    path: '/videos',
    icon: Video,
    bgClass: 'bg-red-50 text-red-600 hover:bg-red-100/80',
    activeBgClass: 'bg-red-600 text-white shadow-md shadow-red-500/20',
    activeTextClass: 'text-red-600 font-extrabold',
    isActive: (path: string, activeTab: string) => activeTab === 'videos',
  },
  {
    id: 'jobs',
    labelEn: 'Jobs',
    labelUr: 'ملازمتیں',
    path: '/jobs',
    icon: Briefcase,
    bgClass: 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100/80',
    activeBgClass: 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20',
    activeTextClass: 'text-emerald-600 font-extrabold',
    isActive: (path: string) => path.startsWith('/jobs'),
  },
  {
    id: 'property',
    labelEn: 'Property',
    labelUr: 'مکانات',
    path: '/property',
    icon: Building2,
    bgClass: 'bg-orange-50 text-orange-600 hover:bg-orange-100/80',
    activeBgClass: 'bg-orange-500 text-white shadow-md shadow-orange-500/20',
    activeTextClass: 'text-orange-600 font-extrabold',
    isActive: (path: string) => path.startsWith('/property'),
  },
  {
    id: 'marketplace',
    labelEn: 'Buy & Sell',
    labelUr: 'خرید و فروخت',
    path: '/marketplace',
    icon: ShoppingBag,
    bgClass: 'bg-purple-50 text-purple-600 hover:bg-purple-100/80',
    activeBgClass: 'bg-purple-600 text-white shadow-md shadow-purple-500/20',
    activeTextClass: 'text-purple-600 font-extrabold',
    isActive: (path: string) => path.startsWith('/marketplace'),
  },
  {
    id: 'services',
    labelEn: 'Services',
    labelUr: 'سروسز',
    path: '/services',
    icon: Wrench,
    bgClass: 'bg-cyan-50 text-cyan-600 hover:bg-cyan-100/80',
    activeBgClass: 'bg-cyan-600 text-white shadow-md shadow-cyan-500/20',
    activeTextClass: 'text-cyan-600 font-extrabold',
    isActive: (path: string) => path.startsWith('/services'),
  },
  {
    id: 'business',
    labelEn: 'Business',
    labelUr: 'کاروبار',
    path: '/business',
    icon: Store,
    bgClass: 'bg-amber-50 text-amber-600 hover:bg-amber-100/80',
    activeBgClass: 'bg-amber-500 text-white shadow-md shadow-amber-500/20',
    activeTextClass: 'text-amber-600 font-extrabold',
    isActive: (path: string) => path.startsWith('/business') || path.startsWith('/businesses'),
  },
  {
    id: 'alerts',
    labelEn: 'Alerts',
    labelUr: 'الرٹس',
    path: '/alerts',
    icon: Bell,
    bgClass: 'bg-red-50 text-red-600 hover:bg-red-100/80',
    activeBgClass: 'bg-red-600 text-white shadow-md shadow-red-500/20',
    activeTextClass: 'text-red-600 font-extrabold',
    isActive: (path: string) => path.startsWith('/alerts'),
  },
  {
    id: 'events',
    labelEn: 'Events',
    labelUr: 'تقریبات',
    path: '/events',
    icon: Calendar,
    bgClass: 'bg-blue-50 text-blue-600 hover:bg-blue-100/80',
    activeBgClass: 'bg-blue-600 text-white shadow-md shadow-blue-500/20',
    activeTextClass: 'text-blue-600 font-extrabold',
    isActive: (path: string) => path.startsWith('/events'),
  },
  {
    id: 'deals',
    labelEn: 'Deals & Offers',
    labelUr: 'ڈیلز اور آفرز',
    path: '/deals',
    icon: Tag,
    bgClass: 'bg-green-50 text-green-600 hover:bg-green-100/80',
    activeBgClass: 'bg-green-600 text-white shadow-md shadow-green-500/20',
    activeTextClass: 'text-green-600 font-extrabold',
    isActive: (path: string) => path.startsWith('/deals'),
  },
  {
    id: 'polls',
    labelEn: 'Polls & Opinion',
    labelUr: 'رائے عامہ سروے',
    path: '/polls',
    icon: Clock,
    bgClass: 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100/80',
    activeBgClass: 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20',
    activeTextClass: 'text-indigo-600 font-extrabold',
    isActive: (path: string) => path.startsWith('/polls'),
  },
  {
    id: 'pages',
    labelEn: 'Pages',
    labelUr: 'صفحات',
    path: '/pages',
    icon: Building2, // Reusing Building2
    bgClass: 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100/80',
    activeBgClass: 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20',
    activeTextClass: 'text-indigo-600 font-extrabold',
    isActive: (path: string) => path.startsWith('/pages'),
  },
  {
    id: 'social-groups',
    labelEn: 'Groups',
    labelUr: 'گروپس',
    path: '/social-groups',
    icon: Users,
    bgClass: 'bg-blue-50 text-blue-600 hover:bg-blue-100/80',
    activeBgClass: 'bg-blue-600 text-white shadow-md shadow-blue-500/20',
    activeTextClass: 'text-blue-600 font-extrabold',
    isActive: (path: string) => path.startsWith('/social-groups'),
  },
  {
    id: 'chat',
    labelEn: 'Chat',
    labelUr: 'چیٹ',
    path: '/chat',
    icon: MessageSquare,
    bgClass: 'bg-pink-50 text-pink-600 hover:bg-pink-100/80',
    activeBgClass: 'bg-pink-600 text-white shadow-md shadow-pink-500/20',
    activeTextClass: 'text-pink-600 font-extrabold',
    isActive: (path: string, activeTab: string) => activeTab === 'chat',
    hasBadge: true,
  },
  {
    id: 'profile',
    labelEn: 'Profile',
    labelUr: 'پروفائل',
    path: '/profile',
    icon: UserIcon,
    bgClass: 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100/80',
    activeBgClass: 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20',
    activeTextClass: 'text-indigo-600 font-extrabold',
    isActive: (path: string, activeTab: string) => activeTab === 'profile',
  }
];

interface DesktopSidebarProps {
  currentPath: string;
  activeTab: string;
  currentLanguage: Language;
  t: any;
  user: User;
  onLogout: () => void;
  navigate: (path: string, state?: any) => void;
  unreadChatCount: number;
}

export function DesktopSidebar({
  currentPath,
  activeTab,
  currentLanguage,
  t,
  user,
  onLogout,
  navigate,
  unreadChatCount,
}: DesktopSidebarProps) {
  return (
    <aside 
      id="desktop-sidebar"
      className="hidden md:flex flex-col fixed top-0 left-0 bottom-0 w-[72px] lg:w-[240px] bg-white border-r border-slate-200 z-50 h-screen shadow-sm shrink-0 transition-all duration-300"
    >
      {/* Brand Logo & Slogan Area */}
      <div className="p-4 lg:p-5 border-b border-slate-100 flex items-center justify-center lg:justify-start gap-3.5 shrink-0 h-20">
        <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-md shrink-0 transition-transform hover:scale-105 duration-200">
          <svg className="w-5.5 h-5.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
        <div className="hidden lg:block truncate min-w-0">
          <h1 className="text-base font-black text-slate-950 tracking-tight leading-none uppercase">
            {t.appName}
          </h1>
          <p className="text-[10px] text-slate-500 mt-1.5 truncate font-extrabold uppercase tracking-wider">
            📍 {user.area || 'Dhoke Hassu'}
          </p>
        </div>
      </div>

      {/* Sidebar Scrollable Nav List */}
      <div className="flex-1 overflow-y-auto py-5 px-1.5 lg:px-3 space-y-2 no-scrollbar flex flex-col items-center lg:items-stretch">
        {NAV_ITEMS_CONFIG.map((item) => {
          const active = item.isActive(currentPath, activeTab);
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center justify-center lg:justify-start gap-3 p-2 rounded-xl transition-all duration-200 group relative cursor-pointer ${
                active 
                  ? 'bg-blue-50/80 border-l-4 border-blue-600 pl-1 lg:pl-1.5 font-bold shadow-xs' 
                  : 'hover:bg-slate-50'
              }`}
              id={`sidebar-btn-${item.id}`}
              title={currentLanguage === 'en' ? item.labelEn : item.labelUr}
            >
              {/* Soft background circle for icon with colorful design */}
              <div 
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 shrink-0 ${
                  active 
                    ? `${item.activeBgClass}` 
                    : `${item.bgClass} group-hover:scale-105 group-hover:shadow-md`
                }`}
              >
                <item.icon className="w-5 h-5 stroke-[2.2]" />
              </div>

              {/* Text Label */}
              <div className="hidden lg:flex flex-col min-w-0 text-left">
                <span className={`text-xs transition-colors font-semibold leading-tight ${
                  active 
                    ? 'text-blue-600 font-extrabold' 
                    : 'text-slate-600 font-bold group-hover:text-slate-950'
                }`}>
                  {currentLanguage === 'en' ? item.labelEn : item.labelUr}
                </span>
              </div>

              {/* Badge for Chat */}
              {item.id === 'chat' ? (
                unreadChatCount > 0 && (
                  <span className="absolute right-1 lg:right-4 top-1 lg:top-auto px-1.5 py-0.5 bg-red-500 text-white text-[9px] font-black rounded-full leading-none flex items-center justify-center min-w-[14px]">
                    {unreadChatCount}
                  </span>
                )
              ) : item.hasBadge && (
                <span className="absolute right-2 lg:right-3 top-2 lg:top-auto w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              )}
            </button>
          );
        })}

        {/* Sidebar Post a Job CTA */}
        <div className="hidden lg:block pt-3 border-t border-slate-100 mt-2">
          <button
            onClick={() => navigate('/jobs/post')}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer border-0"
          >
            <PlusCircle className="w-4 h-4 text-white" />
            <span>{currentLanguage === 'en' ? 'Post a Job' : 'نوکری پوسٹ کریں'}</span>
          </button>
        </div>
      </div>

      {/* Sidebar Footer with Logged In User details */}
      <div className="p-3 lg:p-4 border-t border-slate-100 shrink-0 bg-slate-50/30 flex flex-col items-center lg:items-stretch">
        <div className="space-y-3.5 w-full">
          <div 
            onClick={() => navigate('/profile')}
            className="flex items-center justify-center lg:justify-start gap-3 pl-0 lg:pl-1 cursor-pointer hover:bg-slate-100/75 p-1.5 rounded-2xl transition-all group"
            title={currentLanguage === 'en' ? 'View Profile' : 'پروفائل دیکھیں'}
          >
            {user.profilePhoto ? (
              <img 
                src={user.profilePhoto} 
                alt={user.fullName} 
                className="w-10 h-10 rounded-full object-cover border border-slate-200 shadow-xs shrink-0 group-hover:scale-105 transition-transform" 
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-sm border border-indigo-100 shrink-0">
                {(user.fullName || '')?.substring(0, 2)?.toUpperCase()}
              </div>
            )}
            <div className="hidden lg:block text-left min-w-0">
              <p className="text-xs font-black text-slate-800 leading-tight truncate group-hover:text-blue-600 transition-colors">
                {user.fullName}
              </p>
              <p className="text-[10px] font-bold text-slate-400 truncate">
                {user.username ? `@${user.username}` : (user.email || user.mobileNumber || '')}
              </p>
            </div>
          </div>
          
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2.5 px-2 lg:px-4 py-2.5 text-xs font-black text-red-600 hover:text-white hover:bg-red-600 rounded-xl border border-red-100 hover:border-red-600 transition-all duration-200 cursor-pointer shadow-sm hover:shadow"
            title={currentLanguage === 'en' ? 'Sign Out' : 'لاگ آؤٹ'}
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span className="hidden lg:inline">{currentLanguage === 'en' ? 'Sign Out' : 'لاگ آؤٹ'}</span>
          </button>
        </div>
      </div>
    </aside>
  );
}

interface MobileBottomNavProps {
  currentPath: string;
  activeTab: string;
  currentLanguage: Language;
  navigate: (path: string, state?: any) => void;
  unreadChatCount: number;
}

export function MobileBottomNav({
  currentPath,
  activeTab,
  currentLanguage,
  navigate,
  unreadChatCount,
}: MobileBottomNavProps) {
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  // Directly shown items: Home, Community (feed), Events (events), Alerts (alerts), Chat (chat)
  const DIRECT_IDS = ['home', 'feed', 'events', 'alerts', 'chat'];

  // Sort them exactly in the requested order
  const directItems = DIRECT_IDS.map(id => NAV_ITEMS_CONFIG.find(item => item.id === id)).filter(Boolean);
  
  // All remaining navigation items go into the More drawer
  const remainingItems = NAV_ITEMS_CONFIG.filter(item => !DIRECT_IDS.includes(item.id));

  // Determine if any item inside the "More" drawer is currently active
  const isAnyRemainingActive = remainingItems.some(item => item.isActive(currentPath, activeTab));
  const isMoreActive = isAnyRemainingActive || isMoreOpen;

  return (
    <>
      <nav 
        id="mobile-bottom-navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200/80 py-2 px-1 flex justify-around items-center z-40 shadow-2xl overflow-x-hidden"
      >
        {/* Render Direct items */}
        {directItems.map((item) => {
          if (!item) return null;
          const active = item.isActive(currentPath, activeTab);
          return (
            <button
              key={item.id}
              onClick={() => {
                navigate(item.path);
                setIsMoreOpen(false);
              }}
              className={`flex-1 flex flex-col items-center justify-center min-w-0 transition-all duration-200 relative ${
                active ? 'scale-105' : 'opacity-80 hover:opacity-100'
              }`}
              id={`mobile-nav-btn-${item.id}`}
            >
              {/* Soft background circle with active glow */}
              <div 
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 ${
                  active 
                    ? `${item.activeBgClass}` 
                    : `${item.bgClass}`
                }`}
              >
                <item.icon className="w-5.5 h-5.5 stroke-[2.2]" />
              </div>

              {/* Text Label */}
              <span className={`text-[8px] mt-1 tracking-tighter text-center truncate w-full ${
                active ? 'text-slate-950 font-black' : 'text-slate-500 font-extrabold'
              }`}>
                {currentLanguage === 'en' ? item.labelEn?.split(' ')[0] : item.labelUr}
              </span>

              {/* Badge */}
              {item.id === 'chat' ? (
                unreadChatCount > 0 && (
                  <span className="absolute top-0 right-[20%] px-1 py-0.5 bg-red-500 text-white text-[8px] font-black rounded-full leading-none flex items-center justify-center min-w-[12px] shadow-sm">
                    {unreadChatCount}
                  </span>
                )
              ) : item.hasBadge && (
                <span className="absolute top-0 right-[20%] w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
              )}
            </button>
          );
        })}

        {/* Render "More" button */}
        <button
          onClick={() => setIsMoreOpen(!isMoreOpen)}
          className={`flex-1 flex flex-col items-center justify-center min-w-0 transition-all duration-200 relative ${
            isMoreActive ? 'scale-105' : 'opacity-80 hover:opacity-100'
          }`}
          id="mobile-nav-btn-more"
        >
          {/* Icon */}
          <div 
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 ${
              isMoreActive 
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' 
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100/80'
            }`}
          >
            <MoreHorizontal className="w-5.5 h-5.5 stroke-[2.2]" />
          </div>

          {/* Text Label */}
          <span className={`text-[8px] mt-1 tracking-tighter text-center truncate w-full ${
            isMoreActive ? 'text-slate-950 font-black' : 'text-slate-500 font-extrabold'
          }`}>
            {currentLanguage === 'en' ? 'More' : 'مزید'}
          </span>
        </button>
      </nav>

      {/* Slide-Up Drawer Overlay */}
      {isMoreOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 animate-fade-in md:hidden"
          onClick={() => setIsMoreOpen(false)}
          id="more-drawer-backdrop"
        />
      )}

      {/* Slide-Up Drawer Bottom Sheet */}
      <div 
        className={`fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl border-t border-slate-200/80 z-50 p-6 pb-10 transition-transform duration-300 ease-out shadow-2xl md:hidden ${
          isMoreOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
        id="more-drawer-panel"
      >
        {/* Top Handle / Pull indicator */}
        <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-5" />

        {/* Header Title with Close */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
            {currentLanguage === 'en' ? 'More Modules' : 'مزید آپشنز'}
          </h3>
          <button 
            onClick={() => setIsMoreOpen(false)}
            className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer border-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modular Items Grid */}
        <div className="grid grid-cols-3 gap-y-6 gap-x-4">
          {remainingItems.map((item) => {
            if (!item) return null;
            const active = item.isActive(currentPath, activeTab);
            return (
              <button
                key={item.id}
                onClick={() => {
                  navigate(item.path);
                  setIsMoreOpen(false);
                }}
                className={`flex flex-col items-center justify-center min-w-0 transition-all duration-200 relative ${
                  active ? 'scale-105' : 'hover:scale-102'
                }`}
                id={`drawer-nav-btn-${item.id}`}
              >
                {/* Icon Circle Wrapper */}
                <div 
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 shadow-xs mb-2 ${
                    active 
                      ? `${item.activeBgClass}` 
                      : `${item.bgClass}`
                  }`}
                >
                  <item.icon className="w-6 h-6 stroke-[2.2]" />
                </div>

                {/* Under-icon Text Label */}
                <span className={`text-[10px] tracking-tight text-center truncate w-full px-1 ${
                  active ? 'text-slate-950 font-black' : 'text-slate-500 font-extrabold'
                }`}>
                  {currentLanguage === 'en' ? item.labelEn : item.labelUr}
                </span>

                {/* Badges for items inside drawer if applicable */}
                {item.hasBadge && (
                  <span className="absolute top-0 right-[25%] w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}

interface AppShellProps {
  user: User;
  onLogout: () => void;
  currentLanguage: Language;
  onLanguageChange: (lang: Language) => void;
  onUpdateUser?: (updatedUser: User) => void;
}

export default function AppShell({
  user,
  onLogout,
  currentLanguage,
  onLanguageChange,
  onUpdateUser
}: AppShellProps) {
  console.log('AppShell rendered');
  const t = translations[currentLanguage];
  
  const { activePopupAd, closePopup, triggerPopupCheck } = usePremiumPopup();

  // Initialize ad rotation state globally for the feeds rendered within AppShell
  const homeBannerMap = useAdRotator('Home Feed', 1, 1, 'Banner');
  const homeAdMap = useAdRotator('Home Feed', 200, 5, 'Feed');
  const homeSectionsAdMap = useAdRotator('Home Feed', 10, 2, 'Feed');
  const communityBannerMap = useAdRotator('Community Feed', 1, 1, 'Banner');
  const communityAdMap = useAdRotator('Community Feed', 200, 5, 'Feed');

  const [activeCarouselAds, setActiveCarouselAds] = useState<AdItem[]>([]);
  const [activeHomeAds, setActiveHomeAds] = useState<AdItem[]>([]);
  const [activeCommunityAds, setActiveCommunityAds] = useState<AdItem[]>([]);

  const selectActiveAd = (adsList: AdItem[]): AdItem | null => {
    if (adsList.length === 0) return null;
    const priorityWeight = { 'Premium': 4, 'High': 3, 'Normal': 2, 'Low': 1 };
    const sorted = [...adsList].sort((a, b) => (priorityWeight[b.priority] || 0) - (priorityWeight[a.priority] || 0));
    const maxPriority = sorted[0].priority;
    const highestPriorityAds = sorted.filter(a => a.priority === maxPriority);
    const randomIndex = Math.floor(Math.random() * highestPriorityAds.length);
    return highestPriorityAds[randomIndex];
  };


  // Trigger popup check on app launch / window focus
  useEffect(() => {
    triggerPopupCheck();
    
    const handleFocus = () => {
      triggerPopupCheck();
    };
    
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [triggerPopupCheck]);


  const handleNavigateToModule = (module: string, itemId: string) => {
    if (module === 'business') {
      setSelectedBusinessId(itemId || mockBusinesses[0]?.id || null);
      setCurrentPath(`/business/detail?businessId=${itemId}`);
    } else if (module === 'marketplace') {
      setSelectedMarketplaceItemId(itemId || mockBuySell[0]?.id || null);
      setCurrentPath(`/marketplace/detail?id=${itemId}`);
    } else if (module === 'property') {
      setSelectedPropertyId(itemId || mockProperties[0]?.id || null);
      setCurrentPath(`/property/detail?propertyId=${itemId}`);
    } else if (module === 'jobs') {
      setSelectedJobId(itemId || mockJobs[0]?.id || null);
      setCurrentPath(`/jobs/detail?id=${itemId}`);
    }
  };

  const scrollSlider = (id: string, direction: 'left' | 'right') => {
    const el = document.getElementById(id);
    if (el) {
      const scrollAmt = direction === 'left' ? -340 : 340;
      el.scrollBy({ left: scrollAmt, behavior: 'smooth' });
    }
  };

  const [profileData, setProfileData] = React.useState<User>(() => {
    // Core identity ALWAYS comes from the authenticated Supabase user.
    // We never trust localStorage for id / fullName / email / area / profilePhoto
    // because it may contain stale data from a previous or different session.
    const authBase: User = {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      mobileNumber: user.mobileNumber,
      area: user.area,
      profilePhoto: user.profilePhoto,
      gender: user.gender,
      dateOfBirth: user.dateOfBirth,
      reputationScore: user.reputationScore ?? 100,
      verified: user.verified || isEntityVerified(user.fullName) || false,
      coverPhoto: user.coverPhoto,
    };

    try {
      const saved = localStorage.getItem('dh_user_profile_data');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Only merge extended fields if the stored record belongs to THIS authenticated user.
        // If the id doesn't match (stale data from a different account), ignore localStorage entirely.
        if (parsed.id === user.id || parsed.email === user.email) {
          return {
            ...authBase,
            // Extended profile fields that the user can edit
            username: user.username || parsed.username || undefined,
            bio: user.bio || parsed.bio || undefined,
            joinDate: user.joinDate || parsed.joinDate || undefined,
            reputationScore: (user.reputationScore ?? parsed.reputationScore) ?? authBase.reputationScore,
            verified: (user.verified ?? parsed.verified ?? authBase.verified) || isEntityVerified(authBase.fullName) || false,
            coverPhoto: user.coverPhoto || parsed.coverPhoto || undefined,
            contactNumber: user.contactNumber || parsed.contactNumber || undefined,
            socialLinks: user.socialLinks || parsed.socialLinks || undefined,
            badges: user.badges || parsed.badges || undefined,
            profilePhoto: user.profilePhoto || parsed.profilePhoto || authBase.profilePhoto,
            gender: user.gender || parsed.gender || authBase.gender,
            dateOfBirth: user.dateOfBirth || parsed.dateOfBirth || authBase.dateOfBirth,
          };
        }
        // Stale data from a different user — clear it now
        localStorage.removeItem('dh_user_profile_data');
      }
    } catch {
      localStorage.removeItem('dh_user_profile_data');
    }

    return authBase;
  });

  // Keep core identity fields in sync whenever the Supabase user prop is updated
  React.useEffect(() => {
    console.log("[AppShell Sync User Prop] Before Sync profileData state:", JSON.stringify(profileData, null, 2));
    console.log("[AppShell Sync User Prop] Received User Prop payload:", JSON.stringify(user, null, 2));
    
    setProfileData(prev => {
      const merged = {
        ...prev,
        id: user.id || prev.id,
        email: user.email || prev.email,
        fullName: user.fullName || prev.fullName,
        mobileNumber: user.mobileNumber || prev.mobileNumber,
        area: user.area || prev.area,
        profilePhoto: user.profilePhoto || prev.profilePhoto,
        gender: user.gender || prev.gender,
        dateOfBirth: user.dateOfBirth || prev.dateOfBirth,
        coverPhoto: user.coverPhoto || prev.coverPhoto,

        provinceId: user.provinceId || prev.provinceId,
        cityId: user.cityId || prev.cityId,
        areaId: user.areaId || prev.areaId,
        latitude: user.latitude !== undefined ? user.latitude : prev.latitude,
        longitude: user.longitude !== undefined ? user.longitude : prev.longitude,
        followers_count: user.followers_count !== undefined ? user.followers_count : prev.followers_count,
        following_count: user.following_count !== undefined ? user.following_count : prev.following_count,
        socialLinks: {
          ...(prev.socialLinks || {}),
          ...(user.socialLinks || {})
        }
      };
      console.log("[AppShell Sync User Prop] Merged Profile Result state:", JSON.stringify(merged, null, 2));
      return merged;
    });
  }, [user?.id, user?.fullName, user?.profilePhoto, user?.provinceId, user?.cityId, user?.areaId, user?.area]);

  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState<number>(() => {
    if (isSupabaseConfigured && user?.id) {
      // If a Supabase user session exists, do not initialize from cached localStorage
      // to avoid flashing a stale badge value. It will be fetched from Supabase.
      return 0;
    }
    try {
      const stored = localStorage.getItem('dh_notifications_list');
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.filter((n: any) => !n.read).length;
      }
    } catch {}
    return 3;
  });
  const [bellNotifications, setBellNotifications] = useState<any[]>([]);
  const [isNotifDropdownOpen, setIsNotifDropdownOpen] = useState(false);

  // Load & subscribe to notifications for the global badge & preview dropdown
  React.useEffect(() => {
    if (!profileData?.id || !isSupabaseConfigured || !supabase) return;

    async function loadNotificationsCount() {
      const count = await dbGetUnreadNotificationsCount(profileData.id!);
      setUnreadNotificationsCount(count);

      const fetched = await dbGetNotifications([], profileData.id!, 1, 5);
      setBellNotifications(fetched);
    }
    loadNotificationsCount();

    const channel = supabase
      .channel(`appshell:notifications:${profileData.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${profileData.id}`
      }, async (payload) => {
        setUnreadNotificationsCount(prev => prev + 1);

        let senderName = 'System';
        let senderAvatar = undefined;
        if (payload.new.sender_id) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, profile_photo')
            .eq('user_id', payload.new.sender_id)
            .single();
          if (profile) {
            senderName = profile.full_name;
            senderAvatar = profile.profile_photo;
          }
        }

        const newNotif = {
          id: payload.new.id,
          type: payload.new.type,
          title: payload.new.title,
          message: payload.new.body,
          timeAgo: 'Just now',
          read: payload.new.is_read,
          relatedId: payload.new.reference_id || undefined,
          relatedModule: payload.new.reference_type || undefined,
          senderName,
          senderAvatar,
          createdAt: payload.new.created_at
        };

        setBellNotifications(prev => [newNotif, ...prev?.slice(0, 4)]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profileData?.id]);

  // Seller's personal broadcast channel — receives instant inquiries from buyers
  // Uses Supabase Broadcast (websocket only, no table replication required).
  React.useEffect(() => {
    if (!profileData?.id || !isSupabaseConfigured || !supabase) return;

    const sellerBroadcastChannel = supabase
      .channel(`marketplace:seller:${profileData.id}`)
      .on('broadcast', { event: 'new_inquiry' }, (payload) => {
        const msg = payload.payload as any;
        if (!msg) return;

        const localNotif = {
          id: `inquiry-${Date.now()}`,
          type: 'chat',
          title: '💬 New Inquiry on Your Listing',
          message: `${msg.sender_name || 'Someone'} asked about "${msg.item_title || 'your listing'}": "${String(msg.content || '')?.slice(0, 80)}"`,
          timeAgo: 'Just now',
          read: false,
          relatedId: msg.conversation_id || msg.item_id,
          relatedModule: 'chat',
          senderName: msg.sender_name || 'Buyer',
          senderAvatar: undefined,
          senderId: msg.sender_id,
          createdAt: msg.sent_at || new Date().toISOString()
        };
        setUnreadNotificationsCount(prev => prev + 1);
        setBellNotifications(prev => [localNotif, ...prev?.slice(0, 4)]);
      })
      .subscribe((status) => {
        console.log('[AppShell] Seller broadcast channel status:', status);
      });

    return () => {
      supabase.removeChannel(sellerBroadcastChannel);
    };
  }, [profileData?.id]);

  const [activeTab, setActiveTab] = useState<NavigationTab>(() => {
    const path = window.location.pathname;
    if (path === '/home' || path === '/') return 'home';
    if (path === '/feed') return 'feed';
    if (path.startsWith('/chat')) return 'chat';
    if (path.startsWith('/videos')) return 'videos';
    if (path.startsWith('/profile')) return 'profile';
    return '' as any;
  });

  useEffect(() => {
    async function fetchModuleAds() {
      try {
        if (activeTab === 'home') {
          const carousel = await dbGetActiveAds('Banner Carousel');
          setActiveCarouselAds(carousel.filter(ad => ad.format !== 'Popup'));
          const homeFeed = await dbGetActiveAds('Home Feed');
          setActiveHomeAds(homeFeed.filter(ad => ad.format !== 'Popup'));
          // Splash ads are now fetched globally via useAdStore
        } else if (activeTab === 'feed') {
          const community = await dbGetActiveAds('Community Feed');
          setActiveCommunityAds(community.filter(ad => ad.format !== 'Popup'));
        }
      } catch (err) {
        console.error("Error loading active ads inside AppShell:", err);
      }
    }
    fetchModuleAds();
  }, [activeTab]);
  
  // SPA routing state
  const [currentPath, setCurrentPath] = useState<string>(() => {
    const path = window.location.pathname;
    if (path === '/' || path === '') return '/home';
    return path;
  });

  const [jobs, setJobs] = useState<JobItem[]>(mockJobs);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('id') || (mockJobs[0]?.id || null);
  });

  const [businesses, setBusinesses] = useState<BusinessItem[]>([]);
  const [selectedBusinessId, setSelectedBusinessId] = useState<string | null>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('businessId') || null;
  });

  const [properties, setProperties] = useState<PropertyItem[]>(mockProperties);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('propertyId') || (mockProperties[0]?.id || null);
  });

  const handleReportProperty = (id: string) => {
    setProperties(prev => prev.map(p => p.id === id ? { ...p, reported: true } : p));
  };

  const handleToggleAvailability = (id: string) => {
    setProperties(prev => prev.map(p => p.id === id ? { ...p, unavailable: !p.unavailable } : p));
  };

  const [marketplaceItems, setMarketplaceItems] = useState<BuySellItem[]>(mockBuySell);
  const [selectedMarketplaceItemId, setSelectedMarketplaceItemId] = useState<string | null>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('itemId') || (mockBuySell[0]?.id || null);
  });

  const [services, setServices] = useState<ServiceItem[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('serviceId') || null;
  });

  const [alerts, setAlerts] = useState<AlertItem[]>([]);

  React.useEffect(() => {
    localStorage.setItem('dhoke_connect_alerts', JSON.stringify(alerts));
  }, [alerts]);

  const [selectedAlertId, setSelectedAlertId] = useState<string | null>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('alertId') || (mockAlerts[0]?.id || null);
  });

  const [events, setEvents] = useState<EventItem[]>(() => {
    try {
      const saved = localStorage.getItem('dhoke_connect_events');
      return saved ? JSON.parse(saved) : mockEvents;
    } catch {
      return mockEvents;
    }
  });

  const [selectedEventId, setSelectedEventId] = useState<string | null>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('eventId') || (mockEvents[0]?.id || null);
  });

  React.useEffect(() => {
    localStorage.setItem('dhoke_connect_events', JSON.stringify(events));
  }, [events]);

  const [deals, setDeals] = useState<DealItem[]>(() => {
    try {
      const saved = localStorage.getItem('dhoke_connect_deals');
      return saved ? JSON.parse(saved) : mockDeals;
    } catch {
      return mockDeals;
    }
  });

  const [selectedDealId, setSelectedDealId] = useState<string | null>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('dealId') || (mockDeals[0]?.id || null);
  });

  React.useEffect(() => {
    localStorage.setItem('dhoke_connect_deals', JSON.stringify(deals));
  }, [deals]);

  const [groups, setGroups] = useState<GroupItem[]>(() => {
    try {
      const saved = localStorage.getItem('dhoke_connect_groups');
      return saved ? JSON.parse(saved) : mockGroups;
    } catch {
      return mockGroups;
    }
  });

  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('groupId') || (mockGroups[0]?.id || null);
  });

  React.useEffect(() => {
    localStorage.setItem('dhoke_connect_groups', JSON.stringify(groups));
  }, [groups]);

  // Navigate helper
  const navigate = (path: string, paramId?: string) => {
    let url = path;
    if (path === '/jobs/detail' && paramId) {
      url = `/jobs/detail?id=${paramId}`;
      setSelectedJobId(paramId);
    } else if ((path === '/business/detail' || path === '/businesses/detail') && paramId) {
      url = `${path}?businessId=${paramId}`;
      setSelectedBusinessId(paramId);
    } else if (path === '/property/detail' && paramId) {
      url = `/property/detail?propertyId=${paramId}`;
      setSelectedPropertyId(paramId);
    } else if (path === '/marketplace/detail' && paramId) {
      url = `/marketplace/detail?itemId=${paramId}`;
      setSelectedMarketplaceItemId(paramId);
    } else if (path.startsWith('/marketplace/chat') && paramId) {
      url = `${path}?itemId=${paramId}`;
      setSelectedMarketplaceItemId(paramId);
    } else if (path === '/services/detail' && paramId) {
      url = `/services/detail?serviceId=${paramId}`;
      setSelectedServiceId(paramId);
    } else if (path === '/alerts/detail' && paramId) {
      url = `/alerts/detail?alertId=${paramId}`;
      setSelectedAlertId(paramId);
    } else if (path === '/events/detail' && paramId) {
      url = `/events/detail?eventId=${paramId}`;
      setSelectedEventId(paramId);
    } else if (path === '/deals/detail' && paramId) {
      url = `/deals/detail?dealId=${paramId}`;
      setSelectedDealId(paramId);
    } else if (path === '/groups/detail' && paramId) {
      url = `/groups/detail?groupId=${paramId}`;
      setSelectedGroupId(paramId);
    } else if (path === '/groups/manage' && paramId) {
      url = `/groups/manage?groupId=${paramId}`;
      setSelectedGroupId(paramId);
    }
    window.history.pushState({}, '', url);
    setCurrentPath(path);
    triggerPopupCheck();

    // Sync highlighted tab
    if (path === '/home') {
      setActiveTab('home');
    } else if (path === '/feed') {
      setActiveTab('feed');
    } else if (path.startsWith('/chat')) {
      setActiveTab('chat');
    } else if (path.startsWith('/videos')) {
      setActiveTab('videos');
    } else if (path.startsWith('/profile')) {
      setActiveTab('profile');
    } else {
      setActiveTab('' as any);
    }
    setQuickAction(null);
  };

  // Sync state on popstate
  React.useEffect(() => {
    (window as any).openUserProfile = (name: string, avatar?: string, userId?: string) => {
      let targetName = name;
      let targetAvatar = avatar;
      if (name === 'You' || name === 'You (Owner)' || name.startsWith('You ')) {
        targetName = profileData.fullName;
        targetAvatar = profileData.profilePhoto;
      }
      const targetId = userId || targetName;
      const url = `/profile/${encodeURIComponent(targetId)}?name=${encodeURIComponent(targetName)}${targetAvatar ? `&avatar=${encodeURIComponent(targetAvatar)}` : ''}`;
      window.history.pushState({}, '', url);
      window.dispatchEvent(new Event('popstate'));
    };

    const handleProfileClick = (e: MouseEvent) => {
      let target = e.target as HTMLElement | null;
      while (target) {
        const name = target.getAttribute('data-profile-name');
        if (name) {
          e.stopPropagation();
          e.preventDefault();
          const avatar = target.getAttribute('data-profile-avatar') || '';
          const userId = target.getAttribute('data-profile-id') || '';
          (window as any).openUserProfile(name, avatar, userId);
          return;
        }
        target = target.parentElement;
      }
    };
    document.addEventListener('click', handleProfileClick, true);

    const handlePopState = () => {
      const path = window.location.pathname;
      setCurrentPath(path);
      const params = new URLSearchParams(window.location.search);
      const id = params.get('id');
      if (id) {
        setSelectedJobId(id);
      }
      const busId = params.get('businessId');
      if (busId) {
        setSelectedBusinessId(busId);
      }
      const propId = params.get('propertyId');
      if (propId) {
        setSelectedPropertyId(propId);
      }
      const itId = params.get('itemId');
      if (itId) {
        setSelectedMarketplaceItemId(itId);
      }
      const servId = params.get('serviceId');
      if (servId) {
        setSelectedServiceId(servId);
      }
      const alId = params.get('alertId');
      if (alId) {
        setSelectedAlertId(alId);
      }
      const dealId = params.get('dealId');
      if (dealId) {
        setSelectedDealId(dealId);
      }
      const grpId = params.get('groupId');
      if (grpId) {
        setSelectedGroupId(grpId);
      }
      
      if (path === '/home' || path === '/') {
        setActiveTab('home');
      } else if (path === '/feed') {
        setActiveTab('feed');
      } else if (path.startsWith('/chat')) {
        setActiveTab('chat');
      } else if (path.startsWith('/videos')) {
        setActiveTab('videos');
      } else if (path.startsWith('/profile')) {
        setActiveTab('profile');
      } else {
        setActiveTab('' as any);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      document.removeEventListener('click', handleProfileClick, true);
    };
  }, []);

  const [unreadChatCount, setUnreadChatCount] = useState<number>(() => {
    // When Supabase is configured (authenticated session), always start from 0.
    // ChatModule will dispatch the real unread count via 'unread-count-changed' once loaded.
    // Only use localStorage cache when Supabase is NOT configured (offline / unauthenticated mode).
    if (isSupabaseConfigured) {
      return 0;
    }
    try {
      const saved = localStorage.getItem('dhoke_connect_chats');
      if (saved) {
        const conversations = JSON.parse(saved);
        return conversations.reduce((acc: number, c: any) => acc + (c.unreadCount || 0), 0);
      }
    } catch (e) {}
    return 0;
  });

  React.useEffect(() => {
    const handleUnreadChange = (e: Event) => {
      const count = (e as CustomEvent).detail;
      setUnreadChatCount(count);
    };
    window.addEventListener('unread-count-changed', handleUnreadChange);
    return () => window.removeEventListener('unread-count-changed', handleUnreadChange);
  }, []);

  const [quickAction, setQuickAction] = useState<string | null>(null); // To view specific category list

  // Persistent Stories state (No local caching to prevent deleted data leaking)
  const [stories, setStories] = useState<Story[]>([]);
  const [storyAds, setStoryAds] = useState<any[]>([]);

  React.useEffect(() => {
    localStorage.removeItem('dh_stories_list_v2'); // Force clear old cache
  }, []);

  // Status Composer states
  const [composerText, setComposerText] = useState('');
  const [composerImage, setComposerImage] = useState<File | null>(null);
  const [composerImagePreview, setComposerImagePreview] = useState<string | null>(null);
  const [composerVideo, setComposerVideo] = useState<File | null>(null);
  const [composerVideoPreview, setComposerVideoPreview] = useState<string | null>(null);
  const [composerPostType, setComposerPostType] = useState<'status' | 'reminder' | 'general'>('general');
  const [isSubmittingPost, setIsSubmittingPost] = useState(false);
  const [composerLocation, setComposerLocation] = useState<string | null>(null);
  const [composerAreaId, setComposerAreaId] = useState<string | null>(null);
  const [composerLatitude, setComposerLatitude] = useState<number | null>(null);
  const [composerLongitude, setComposerLongitude] = useState<number | null>(null);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);

  // Upload Progress States
  const [composerUploadStage, setComposerUploadStage] = useState<'None' | 'Processing' | 'Uploading' | 'Saving Database' | 'Completed' | 'Failed'>('None');
  const [composerUploadProgress, setComposerUploadProgress] = useState(0);
  const [composerUploadError, setComposerUploadError] = useState('');

  // Lost & Found quick-post states
  const [showLostFoundComposer, setShowLostFoundComposer] = useState(false);
  const [lfPostType, setLfPostType] = useState<'lost' | 'found'>('lost');
  const [lfTitle, setLfTitle] = useState('');
  const [lfDescription, setLfDescription] = useState('');
  const [lfContact, setLfContact] = useState('');
  const [lfLocation, setLfLocation] = useState('');
  const [lfIsSubmitting, setLfIsSubmitting] = useState(false);
  const [lfImages, setLfImages] = useState<File[]>([]);
  const [lfPreviews, setLfPreviews] = useState<string[]>([]);
  const [lfUploadStatus, setLfUploadStatus] = useState<string>('');
  const [activeGalleryImages, setActiveGalleryImages] = useState<string[] | null>(null);
  const [activeGalleryIndex, setActiveGalleryIndex] = useState<number>(0);

  // Elevated Polls and user votes states
  const [polls, setPolls] = useState<Poll[]>([]);
  const [userVotes, setUserVotes] = useState<Record<string, string>>({});

  const cleanPostImagesMetadata = (p: Post): Post => {
    let contentClean = p.content || '';
    let lfImages: string[] = p.images || [];
    const lfMatch = contentClean.match(/\[LF_IMAGES:(.*?)\]/);
    if (lfMatch) {
      lfImages = lfMatch[1]?.split(',').filter(Boolean);
      contentClean = contentClean.replace(/\[LF_IMAGES:(.*?)\]/, '')?.trim();
    }
    return {
      ...p,
      content: contentClean,
      images: lfImages,
      lfImages: lfImages,
      postTag: p.postTag || (contentClean.startsWith('🔍 LOST') ? 'lost' : (contentClean.startsWith('✅ FOUND') ? 'found' : null))
    };
  };

  // Persistent & seedable Posts state with comments
  // Persistent Posts state (No local caching to prevent deleted data leaking)
  const [posts, setPosts] = useState<Post[]>([]);

  React.useEffect(() => {
    localStorage.removeItem('dh_posts_list_v2'); // Force clear old cache
  }, []);

  // Centralized Supabase integration and state synchronization
  const [dbLoading, setDbLoading] = useState(isSupabaseConfigured);

  React.useEffect(() => {
    if (!isSupabaseConfigured) return;

    async function loadData() {
      try {
        // Load Profile
        if (profileData.id) {
          console.log("[AppShell Init] Loading profile from Supabase for user:", profileData.id);
          const profile = await dbGetUserProfile(profileData.id);
          console.log("[AppShell Init] Fetched DB profile payload:", JSON.stringify(profile, null, 2));
          if (profile) {
            setProfileData(profile);
            if (onUpdateUser) {
              console.log("[AppShell Init] Syncing loaded profile to parent state.");
              onUpdateUser(profile);
            }
          } else {
            console.log("[AppShell Init] Profile not found. Attempting to repair and create default profile.");
            const fallbackProfile: User = {
              ...user,
              id: profileData.id,
              fullName: user.fullName || user.email?.split('@')[0] || 'Unknown User',
              email: user.email || '',
              area: user.area || 'Dhoke Hassu',
              reputationScore: 100,
              verified: false,
              socialLinks: {},
              badges: []
            };
            
            const saveSuccess = await dbSaveUserProfile(fallbackProfile);
            if (saveSuccess) {
              console.log("[AppShell Init] Profile repair successful.");
              setProfileData(fallbackProfile);
              if (onUpdateUser) {
                onUpdateUser(fallbackProfile);
              }
            } else {
              console.error("[AppShell Init] Profile repair failed. Logging out.");
              localStorage.removeItem('dh_user_profile_data');
              if (onLogout) {
                onLogout();
              }
            }
          }
        }

        // Load Stories & Ads
        const [fetchedStories, fetchedAds] = await Promise.all([
          dbGetStories(user.id || '', []),
          dbGetAllStoryAds()
        ]);

        let finalStories = fetchedStories.length > 0 ? [...fetchedStories] : [...stories];

        if (fetchedAds && fetchedAds.length > 0) {
          const mappedAds = fetchedAds.filter((a: any) => a.active).map((a: any) => ({
            id: a.id,
            author: 'Sponsored',
            avatar: 'https://via.placeholder.com/150?text=Ad',
            time: 'Sponsored',
            viewed: false,
            type: a.media_type,
            image: a.media_url,
            isAd: true,
            ctaLink: a.cta_link,
            ctaType: a.cta_type || 'Website',
            ctaValue: a.cta_value || a.cta_link || '',
            ctaText: a.cta_text,
            duration: a.duration,
            createdAt: Date.now()
          }));
          setStoryAds(mappedAds);
        } else {
          setStoryAds([]);
        }

        if (fetchedStories.length === 0) {
          for (const s of stories) {
            await dbSaveStory(s);
          }
        }
        
        setStories(finalStories);

        // Load Posts
        const fetchedPosts = await dbGetPosts([]);
        if (fetchedPosts.length > 0) {
          setPosts(fetchedPosts);
        } else {
          for (const p of posts) {
            await dbSavePost(p);
          }
        }

        // Load like state from DB
        try {
          const postIds = (fetchedPosts.length > 0 ? fetchedPosts : posts).map(p => p.id);
          const targetUserId = profileData?.user_id || profileData?.id;
          const [userLikedSet, likeCounts] = await Promise.all([
            targetUserId ? dbGetUserPostLikes(targetUserId) : Promise.resolve(new Set<string>()),
            dbGetPostLikeCounts(postIds)
          ]);
          // Convert Set to boolean map
          const likedMap: Record<string, boolean> = {};
          userLikedSet.forEach(id => { likedMap[id] = true; });
          setLikedPosts(likedMap);
          setPostLikes(likeCounts);
        } catch (err) {
          console.warn('[Like init] Could not load like state:', err);
        }

        // Load Polls and User Votes
        try {
          const fetchedPolls = await dbGetPolls([]);
          setPolls(fetchedPolls);
          const targetUserId = profileData.user_id || profileData.id;
          if (targetUserId) {
            const votes = await dbGetUserVotes(targetUserId);
            setUserVotes(votes);
          }
        } catch (err) {
          console.warn("Could not load polls or votes on initialization:", err);
        }

        // Load Jobs
        const fetchedJobs = await dbGetJobs([]);
        if (fetchedJobs.length > 0) {
          setJobs(fetchedJobs);
        } else {
          for (const j of jobs) {
            await dbSaveJob(j);
          }
        }

        // Load Properties
        const fetchedProperties = await dbGetProperties([]);
        if (fetchedProperties.length > 0) {
          setProperties(fetchedProperties);
        } else {
          for (const p of properties) {
            await dbSaveProperty(p);
          }
        }

        // Load Marketplace Items
        const fetchedMarketplace = await dbGetMarketplaceItems([]);
        if (fetchedMarketplace.length > 0) {
          setMarketplaceItems(fetchedMarketplace);
        } else {
          for (const m of marketplaceItems) {
            await dbSaveMarketplaceItem(m);
          }
        }

        const isSeeded = localStorage.getItem('dh_connect_mock_data_seeded') === 'true';

        // Load Businesses
        const fetchedBusinesses = await dbGetBusinesses([]);
        if (fetchedBusinesses.length > 0 || isSeeded) {
          setBusinesses(fetchedBusinesses);
        } else {
          for (const b of mockBusinesses) {
            await dbSaveBusiness(b);
          }
          const refetched = await dbGetBusinesses([]);
          setBusinesses(refetched.length > 0 ? refetched : mockBusinesses);
        }

        // Load Services
        const fetchedServices = await dbGetServices([]);
        if (fetchedServices.length > 0 || isSeeded) {
          setServices(fetchedServices);
        } else {
          for (const s of mockServices) {
            await dbSaveService(s);
          }
          const refetched = await dbGetServices([]);
          setServices(refetched.length > 0 ? refetched : mockServices);
        }

        const fetchedAlerts = await dbGetAlerts([]);
        const hasMockAlerts = fetchedAlerts.some(a => a.id.startsWith('a'));
        if (!hasMockAlerts && !isSeeded) {
          for (const a of mockAlerts) {
            await dbSaveAlert(a);
          }
          const refetchedAlerts = await dbGetAlerts([]);
          setAlerts(refetchedAlerts.length > 0 ? refetchedAlerts : mockAlerts);
        } else {
          setAlerts(fetchedAlerts);
        }

        // Load Events
        const fetchedEvents = await dbGetEvents([]);
        if (fetchedEvents.length > 0 || isSeeded) {
          setEvents(fetchedEvents);
        } else {
          for (const e of events) {
            await dbSaveEvent(e);
          }
          const refetched = await dbGetEvents([]);
          setEvents(refetched.length > 0 ? refetched : events);
        }

        // Load Deals
        const fetchedDeals = await dbGetDeals([]);
        if (fetchedDeals.length > 0 || isSeeded) {
          setDeals(fetchedDeals);
        } else {
          for (const d of deals) {
            await dbSaveDeal(d);
          }
          const refetched = await dbGetDeals([]);
          setDeals(refetched.length > 0 ? refetched : deals);
        }

        // Load Groups
        const fetchedGroups = await dbGetGroups([]);
        if (fetchedGroups.length > 0 || isSeeded) {
          setGroups(fetchedGroups);
        } else {
          for (const g of groups) {
            await dbSaveGroup(g);
          }
          const refetched = await dbGetGroups([]);
          setGroups(refetched.length > 0 ? refetched : groups);
        }

        localStorage.setItem('dh_connect_mock_data_seeded', 'true');

      } catch (err) {
        console.warn("Status synchronizing with Supabase database:", err);
      } finally {
        setDbLoading(false);
      }
    }

    loadData();
  }, []);

  // Local storage / offline polls and votes loading hook
  React.useEffect(() => {
    if (!isSupabaseConfigured) {
      dbGetPolls([]).then(fetched => {
        setPolls(fetched);
      });
      const targetUserId = profileData.user_id || profileData.id;
      if (targetUserId) {
        dbGetUserVotes(targetUserId).then(votes => {
          setUserVotes(votes);
        });
      }
    }
  }, [profileData.id, profileData.user_id]);

  const [isTvsModalOpen, setIsTvsModalOpen] = useState(false);
  const [newPostText, setNewPostText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // States for interactive UI details (Stories Viewing)
  const [viewingStoryIdx, setViewingStoryIdx] = useState<number | null>(null);

  const groupedUserStories = React.useMemo(() => {
    const map = new Map<string, Story[]>();
    stories.forEach(story => {
      if (!map.has(story.userId)) map.set(story.userId, []);
      map.get(story.userId)!.push(story);
    });
    
    // Sort users by the latest story createdAt descending
    const sortedGroups = Array.from(map.values()).sort((a, b) => {
      const aLatest = Math.max(...a.map(s => new Date(s.createdAt).getTime()));
      const bLatest = Math.max(...b.map(s => new Date(s.createdAt).getTime()));
      return bLatest - aLatest;
    }).map(userStories => {
      // Sort stories within user chronologically ascending
      return userStories.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    });

    if (storyAds.length > 0) {
      const result: Story[][] = [];
      let adIndex = 0;
      const ADS_INTERVAL = 1; // Inject 1 ad after every N user groups

      for (let i = 0; i < sortedGroups.length; i++) {
        // 1. Push the normal user's stories
        result.push(sortedGroups[i]);
        
        // 2. Inject ONE ad if we've hit the interval and have ads remaining
        if ((i + 1) % ADS_INTERVAL === 0 && adIndex < storyAds.length) {
          result.push([storyAds[adIndex]]);
          adIndex++;
        }
      }
      
      // We explicitly DO NOT use a while loop here. 
      // If there are leftover ads, they are discarded for this cycle
      // preventing consecutive back-to-back ads at the end.
      return result;
    }
    
    return sortedGroups;
  }, [stories, storyAds]);

  const flatGroupedStories = React.useMemo(() => groupedUserStories.flat(), [groupedUserStories]);
  const [storyTimer, setStoryTimer] = useState(0);
  const [isStoryPaused, setIsStoryPaused] = useState(false);

  // States for Add Story Modal
  const [showAddStoryModal, setShowAddStoryModal] = useState(false);
  const [storyType, setStoryType] = useState<'photo' | 'text'>('photo');
  const [storyPhoto, setStoryPhoto] = useState<string | null>(null);
  const [storyCaption, setStoryCaption] = useState('');
  const [storyTextContent, setStoryTextContent] = useState('');
  const [storyBg, setStoryBg] = useState('from-purple-600 to-pink-500');
  const [storyCamActive, setStoryCamActive] = useState(false);
  const storyVideoRef = React.useRef<HTMLVideoElement | null>(null);
  const storyStreamRef = React.useRef<MediaStream | null>(null);

  // States for Post Composer (Multiple Photos & Camera & Emojis)
  const [composerAttachedPhotos, setComposerAttachedPhotos] = useState<string[]>([]);
  const [composerCamActive, setComposerCamActive] = useState(false);
  const [showEmojiTray, setShowEmojiTray] = useState(false);
  const composerVideoRef = React.useRef<HTMLVideoElement | null>(null);
  const composerStreamRef = React.useRef<MediaStream | null>(null);

  // Active expanded comments section by Post ID
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});

  // Share Modal State
  const [shareModalData, setShareModalData] = useState<{isOpen: boolean; entityType: ShareEntityType; entityId: string; preview?: React.ReactNode}>({
    isOpen: false,
    entityType: 'post',
    entityId: ''
  });

  // Like state — populated from DB after posts load
  const [likedPosts, setLikedPosts] = useState<Record<string, boolean>>({});
  const [postLikes, setPostLikes] = useState<Record<string, number>>({});

  // Supabase CRUD Event Handlers
  const handleAddJob = async (newJob: JobItem) => {
    setJobs(prev => [newJob, ...prev]);
    await dbSaveJob(newJob);
  };

  const handleAddBusiness = async (newBus: BusinessItem) => {
    setBusinesses(prev => {
      const exists = prev.some(x => x.id === newBus.id);
      if (exists) {
        return prev.map(x => x.id === newBus.id ? newBus : x);
      }
      return [newBus, ...prev];
    });
    await dbSaveBusiness(newBus);
  };

  const handleShareBusinessToCommunity = async (business: BusinessItem) => {
    const shareText = currentLanguage === 'en'
      ? `📢 Check out this local business: *${business.name}*!\n\n📍 Address: ${business.address}\n📞 Contact: ${business.contact}\n\n${business.description}`
      : `📢 ہمارے محلے کا کاروبار ملاحظہ کریں: *${business.name}*!\n\n📍 پتہ: ${business.address}\n📞 رابطہ نمبر: ${business.contact}\n\n${business.description}`;

    const newPost: Post = {
      id: `p-share-${Date.now()}`,
      author: profileData.fullName,
      avatar: profileData.profilePhoto,
      time: 'Just now',
      area: profileData?.area || 'Dhoke Hassu',
      content: shareText,
      image: business.image || business.coverImage || undefined,
      likes: 0,
      commentsCount: 0,
      comments: []
    };

    await dbSavePost(newPost);
    setPosts(prev => [newPost, ...prev]);

    alert(currentLanguage === 'en' 
      ? 'Business shared to community feed successfully!' 
      : 'کاروبار کمیونٹی فیڈ پر کامیابی سے شیئر ہو گیا ہے!'
    );
  };

  const handleAddProperty = async (newProp: PropertyItem) => {
    setProperties(prev => [newProp, ...prev]);
    await dbSaveProperty(newProp);
  };

  const handleAddMarketplaceItem = async (newItem: BuySellItem) => {
    setMarketplaceItems(prev => [newItem, ...prev]);
    await dbSaveMarketplaceItem(newItem);
  };

  const handleAddService = async (newService: ServiceItem) => {
    setServices(prev => [newService, ...prev]);
    await dbSaveService(newService);
  };

  const handleUpdateServices = async (updatedServices: ServiceItem[]) => {
    setServices(updatedServices);
    if (isSupabaseConfigured) {
      // Clean delete removed services in DB
      const currentIds = updatedServices.map(s => s.id);
      const toDelete = services.filter(s => !currentIds.includes(s.id));
      for (const s of toDelete) {
        await dbDeleteService(s.id);
      }
      for (const s of updatedServices) {
        await dbSaveService(s);
      }
    }
  };

  const handleAddAlert = async (newAlert: AlertItem) => {
    setAlerts(prev => [newAlert, ...prev]);
    await dbSaveAlert(newAlert);
  };

  const handleUpdateAlerts = async (updatedAlerts: AlertItem[]) => {
    setAlerts(updatedAlerts);
    if (isSupabaseConfigured) {
      for (const a of updatedAlerts) {
        await dbSaveAlert(a);
      }
    }
  };

  const handleAddEvent = async (newEvent: EventItem) => {
    setEvents(prev => [newEvent, ...prev]);
    await dbSaveEvent(newEvent);
  };

  const handleUpdateEvents = async (updatedEvents: EventItem[]) => {
    setEvents(updatedEvents);
    if (isSupabaseConfigured) {
      // Clean delete removed events in DB
      const currentIds = updatedEvents.map(e => e.id);
      const toDelete = events.filter(e => !currentIds.includes(e.id));
      for (const e of toDelete) {
        await dbDeleteEvent(e.id);
      }
      for (const e of updatedEvents) {
        await dbSaveEvent(e);
      }
    }
  };

  const handleAddDeal = async (newDeal: DealItem) => {
    setDeals(prev => [newDeal, ...prev]);
    await dbSaveDeal(newDeal);
  };

  const handleUpdateGroups = async (updatedGroups: GroupItem[]) => {
    setGroups(updatedGroups);
    if (isSupabaseConfigured) {
      for (const g of updatedGroups) {
        await dbSaveGroup(g);
      }
    }
  };

  const handleUpdateUser = React.useCallback(async (updatedUser: User) => {
    let finalUser = { ...updatedUser };
    
    // Cover photo logs
    console.log("[Runtime Proof - CoverPhoto] current value on updatedUser:", updatedUser.coverPhoto);

    if (updatedUser.profilePhoto && updatedUser.profilePhoto.startsWith('data:')) {
      console.log("[Runtime Proof - ProfilePhoto] Before dbUploadAvatar. updatedUser.profilePhoto length:", updatedUser.profilePhoto.length, "Starts with:", updatedUser.profilePhoto?.substring(0, 30));
      const uploadedUrl = await dbUploadAvatar(updatedUser.id, updatedUser.profilePhoto);
      console.log("[Runtime Proof - ProfilePhoto] Immediately after dbUploadAvatar. uploadedUrl:", uploadedUrl);
      if (uploadedUrl) {
        finalUser.profilePhoto = uploadedUrl;
        console.log("[Runtime Proof - ProfilePhoto] Immediately after finalUser.profilePhoto = uploadedUrl. Value:", finalUser.profilePhoto);
      }
    }
    
    console.log("[Runtime Proof - ProfilePhoto] Immediately before dbSaveUserProfile. finalUser.profilePhoto:", finalUser.profilePhoto);
    console.log("[Runtime Proof - CoverPhoto] Immediately before dbSaveUserProfile. finalUser.coverPhoto:", finalUser.coverPhoto);

    console.log("Supabase Profile Update Request Payload:", JSON.stringify(finalUser, null, 2));
    const saveSuccess = await dbSaveUserProfile(finalUser);
    console.log("Supabase Profile Update Save Success Status:", saveSuccess);

    if (isSupabaseConfigured) {
      const freshProfile = await dbGetUserProfile(updatedUser.id);
      console.log("Supabase Profile Refetched Response Profile Data:", JSON.stringify(freshProfile, null, 2));
      if (freshProfile) {
        finalUser = freshProfile;
      }
    }

    setProfileData(finalUser);
    localStorage.setItem('dh_user_profile_data', JSON.stringify(finalUser));
    if (onUpdateUser) {
      onUpdateUser(finalUser);
    }
  }, [onUpdateUser]);

  // Stories Cam controllers
  const startStoryCam = async () => {
    try {
      setStoryCamActive(true);
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 480, height: 640, facingMode: 'user' } });
      storyStreamRef.current = stream;
      if (storyVideoRef.current) storyVideoRef.current.srcObject = stream;
    } catch {
      setStoryCamActive(false);
      alert(currentLanguage === 'en' ? "Camera access unavailable." : "کیمرہ تک رسائی ممکن نہیں ہے۔");
    }
  };

  const stopStoryCam = () => {
    if (storyStreamRef.current) {
      storyStreamRef.current.getTracks().forEach(t => t.stop());
      storyStreamRef.current = null;
    }
    setStoryCamActive(false);
  };

  const captureStoryPhoto = () => {
    if (storyVideoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = 480;
      canvas.height = 640;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(storyVideoRef.current, 0, 0, canvas.width, canvas.height);
        setStoryPhoto(canvas.toDataURL('image/jpeg'));
        stopStoryCam();
      }
    }
  };

  // Composer Cam controllers
  const startComposerCam = async () => {
    try {
      setComposerCamActive(true);
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480, facingMode: 'user' } });
      composerStreamRef.current = stream;
      if (composerVideoRef.current) composerVideoRef.current.srcObject = stream;
    } catch {
      setComposerCamActive(false);
      alert(currentLanguage === 'en' ? "Camera access unavailable." : "کیمرہ تک رسائی ممکن نہیں ہے۔");
    }
  };

  const stopComposerCam = () => {
    if (composerStreamRef.current) {
      composerStreamRef.current.getTracks().forEach(t => t.stop());
      composerStreamRef.current = null;
    }
    setComposerCamActive(false);
  };

  const captureComposerPhoto = () => {
    if (composerVideoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = 640;
      canvas.height = 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(composerVideoRef.current, 0, 0, canvas.width, canvas.height);
        const imgUrl = canvas.toDataURL('image/jpeg');
        setComposerAttachedPhotos(prev => [...prev, imgUrl]);
        stopComposerCam();
      }
    }
  };

  // Handle addition of a story
  const handleAddStory = (e: React.FormEvent) => {
    e.preventDefault();
    if (storyType === 'photo' && !storyPhoto) {
      alert(currentLanguage === 'en' ? 'Please select or capture a photo first!' : 'براہ کرم پہلے ایک تصویر اپلوڈ یا کیپچر کریں!');
      return;
    }
    if (storyType === 'text' && !storyTextContent?.trim()) {
      alert(currentLanguage === 'en' ? 'Please enter some text status!' : 'براہ کرم اسٹیٹس کا مواد درج کریں!');
      return;
    }

    const newStory: Story = {
      id: `story-${Date.now()}`,
      author: profileData.fullName,
      avatar: profileData.profilePhoto,
      time: 'Just now',
      viewed: false,
      type: storyType,
      image: storyType === 'photo' ? (storyPhoto || undefined) : undefined,
      text: storyType === 'text' ? storyTextContent : (storyCaption || undefined),
      bgColor: storyType === 'text' ? storyBg : undefined,
      createdAt: Date.now(),
      userId: profileData.id || profileData.user_id || 'anonymous'
    };

    setStories([newStory, ...stories]);
    setShowAddStoryModal(false);
    setStoryPhoto(null);
    setStoryCaption('');
    setStoryTextContent('');
    stopStoryCam();
    alert(currentLanguage === 'en' ? 'Story published successfully!' : 'اسٹیٹس کامیابی سے اپلوڈ ہو گیا!');
  };

  // Handle creation of a new post locally
  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostText?.trim() && composerAttachedPhotos.length === 0) {
      alert(t.postRequired);
      return;
    }

    const newPost: Post = {
      id: `p-new-${Date.now()}`,
      author: profileData.fullName,
      avatar: profileData.profilePhoto,
      time: 'Just now',
      area: profileData?.area,
      content: newPostText,
      image: composerAttachedPhotos.length > 0 ? composerAttachedPhotos[0] : undefined,
      images: composerAttachedPhotos.length > 1 ? composerAttachedPhotos : undefined,
      likes: 0,
      commentsCount: 0,
      comments: []
    };

    setPosts([newPost, ...posts]);
    setNewPostText('');
    setComposerAttachedPhotos([]);
    setShowEmojiTray(false);
    stopComposerCam();
    alert(t.postSuccess);
  };

  /**
   * Toggle like/unlike for a post.
   * - Optimistic UI update happens immediately.
   * - DB write runs async; on success the count from DB replaces the optimistic value.
   * - If the user is not in Supabase mode, the UI still reflects the toggle (session-only).
   */
  const handleLikePost = async (postId: string) => {
    const currentlyLiked = !!likedPosts[postId];
    const currentCount = postLikes[postId] ?? 0;

    // Optimistic update — instant UI response
    setLikedPosts(prev => ({ ...prev, [postId]: !currentlyLiked }));
    setPostLikes(prev => ({
      ...prev,
      [postId]: currentlyLiked ? Math.max(0, currentCount - 1) : currentCount + 1,
    }));

    const userId = profileData?.user_id || profileData?.id;
    if (!userId) return; // not logged in

    const { liked, likeCount } = await dbTogglePostLike(postId, userId);

    // Sync with actual DB count
    setLikedPosts(prev => ({ ...prev, [postId]: liked }));
    setPostLikes(prev => ({ ...prev, [postId]: likeCount }));
  };

  const handleInlineVote = async (pollId: string, optionId: string) => {
    const targetUserId = profileData.user_id || profileData.id;
    if (!targetUserId) {
      alert(currentLanguage === 'en' ? 'Please log in to vote.' : 'براہ کرم ووٹ ڈالنے کے لئے لاگ ان کریں۔');
      return;
    }

    const previousVote = userVotes[pollId];
    if (previousVote && previousVote === optionId) return; // same option

    const targetPoll = polls.find(p => p.id === pollId);
    if (!targetPoll) return;

    if (targetPoll.publish_status === 'Closed') {
      alert(currentLanguage === 'en' ? 'This poll is closed.' : 'یہ سروے بند ہو چکا ہے۔');
      return;
    }

    // Optimistic Update
    const updatedPolls = polls.map(p => {
      if (p.id !== pollId) return p;

      const newOptions = (p.options || []).map((o: any) => {
        let count = o.votes_count || 0;
        if (o.id === optionId) count += 1;
        if (previousVote && o.id === previousVote) count = Math.max(0, count - 1);
        return { ...o, votes_count: count };
      });

      const total = newOptions.reduce((acc, curr) => acc + (curr.votes_count || 0), 0);

      return {
        ...p,
        options: newOptions,
        total_votes: total
      };
    });

    setPolls(updatedPolls);
    setUserVotes(prev => ({ ...prev, [pollId]: optionId }));

    // Cast vote on database
    const res = await dbCastVote(pollId, targetUserId, optionId, profileData);
    if (!res.success) {
      alert(res.error || 'Voting failed');
      // Revert states if failed
      setPolls(polls);
      if (previousVote) {
        setUserVotes(prev => ({ ...prev, [pollId]: previousVote }));
      } else {
        setUserVotes(prev => {
          const next = { ...prev };
          delete next[pollId];
          return next;
        });
      }
    }
  };

  const handleInlineChangeVote = (pollId: string) => {
    setUserVotes(prev => {
      const next = { ...prev };
      delete next[pollId];
      return next;
    });
  };

  const handleCommentAdd = (postId: string, commentText?: string) => {
    const text = commentText || commentInputs[postId] || '';
    if (!text?.trim()) return;

    const newComment: Comment = {
      id: `comment-${Date.now()}`,
      author: profileData.fullName,
      avatar: profileData.profilePhoto,
      content: text,
      time: 'Just now'
    };

    setPosts(prevPosts => prevPosts.map(post => {
      if (post.id === postId) {
        const commentsList = post.comments || [];
        return {
          ...post,
          comments: [...commentsList, newComment],
          commentsCount: commentsList.length + 1
        };
      }
      return post;
    }));

    setCommentInputs(prev => ({ ...prev, [postId]: '' }));
  };

  const renderPost = (post: any) => {
    const isLiked = !!likedPosts[post.id];
    const count = (postLikes[post.id] ?? post.likes) || 0;
    
    return (
      <PostCard
        key={post.id}
        post={post}
        isLiked={isLiked}
        likeCount={count}
        currentLanguage={currentLanguage}
        onLike={handleLikePost}
        onComment={(postId, text) => handleCommentAdd(postId, text)}
        isEntityVerified={isEntityVerified}
        getTvsBadgeType={getTvsBadgeType}
          onShareRequest={(type, id, preview) => setShareModalData({ isOpen: true, entityType: type as ShareEntityType, entityId: id, preview })}
          onImageClick={(images) => {
           setViewerImages(images);
           setShowImageViewer(true);
        }}
      />
    );
  };

  // Quick category list components (placeholder routes shown dynamically inside Home tab or Feed tab)
  const renderCategoryList = () => {
    if (!quickAction) return null;

    let items: any[] = [];
    let title = '';
    let iconColor = 'text-primary';
    let bgColor = 'bg-blue-50';

    if (quickAction === 'jobs') {
      items = mockJobs;
      title = t.jobs;
      iconColor = 'text-blue-600';
      bgColor = 'bg-blue-50';
    } else if (quickAction === 'property') {
      items = mockProperties;
      title = t.property;
      iconColor = 'text-indigo-600';
      bgColor = 'bg-indigo-50';
    } else if (quickAction === 'buy-sell') {
      items = mockBuySell;
      title = t.buySell;
      iconColor = 'text-green-600';
      bgColor = 'bg-green-50';
    } else if (quickAction === 'business') {
      items = mockBusinesses;
      title = t.business;
      iconColor = 'text-purple-600';
      bgColor = 'bg-purple-50';
    }

    // Filter items by search query if any
    const filteredItems = items.filter(item => {
      const searchLower = searchQuery?.toLowerCase();
      if (quickAction === 'jobs') {
        return item.title?.toLowerCase().includes(searchLower) || item.company?.toLowerCase().includes(searchLower);
      } else if (quickAction === 'property') {
        return item.title?.toLowerCase().includes(searchLower) || item.location?.toLowerCase().includes(searchLower);
      } else if (quickAction === 'buy-sell') {
        return item.title?.toLowerCase().includes(searchLower) || item.condition?.toLowerCase().includes(searchLower);
      } else {
        return item.name?.toLowerCase().includes(searchLower) || item.category?.toLowerCase().includes(searchLower);
      }
    });

    return (
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm mb-6 animate-fade-in">
        <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-6">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${bgColor}`}>
              {quickAction === 'jobs' && <Briefcase className={`w-5 h-5 ${iconColor}`} />}
              {quickAction === 'property' && <Building2 className={`w-5 h-5 ${iconColor}`} />}
              {quickAction === 'buy-sell' && <ShoppingBag className={`w-5 h-5 ${iconColor}`} />}
              {quickAction === 'business' && <Store className={`w-5 h-5 ${iconColor}`} />}
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-950 flex items-center gap-2">
                {title} <span className="text-xs font-normal text-slate-500">({translations[currentLanguage][quickAction + 'Subtitle']})</span>
              </h3>
              <p className="text-xs text-slate-500">
                {currentLanguage === 'en' ? 'Showing local community classifieds' : 'کمیونٹی کے مقامی کلاسیفائیڈز دکھائے جا رہے ہیں'}
              </p>
            </div>
          </div>
          <button 
            onClick={() => { setQuickAction(null); setSearchQuery(''); }}
            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Category Search bar */}
        <div className="relative mb-6">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.searchPlaceholder}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-primary focus:bg-white transition-all duration-200"
          />
        </div>

        {/* Listing items */}
        {filteredItems.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-sm text-slate-400">
              {currentLanguage === 'en' ? 'No items matched your search.' : 'آپ کی تلاش کے مطابق کوئی اشتہار نہیں ملا۔'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredItems.map((item) => (
              <div key={item.id} className="p-4 border border-slate-100 rounded-xl hover:border-slate-300 hover:shadow-md transition-all duration-200 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <h4 className="font-bold text-slate-900 text-sm md:text-base leading-tight">
                      {item.title || item.name}
                    </h4>
                    {item.price && (
                      <span className="text-xs font-bold px-2 py-1 bg-green-50 text-green-700 border border-green-200 rounded-lg shrink-0">
                        {item.price}
                      </span>
                    )}
                    {item.salary && (
                      <span className="text-xs font-bold px-2 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg shrink-0">
                        {item.salary}
                      </span>
                    )}
                  </div>

                  {/* Visual preview if it is buy and sell */}
                  {item.image && (
                    <div className="my-3 rounded-lg overflow-hidden h-36 bg-slate-100">
                      <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                    </div>
                  )}

                  <div className="space-y-1.5 text-xs text-slate-600 mb-4">
                    {item.company && <p>🏢 <strong>{item.company}</strong> • <span className="text-slate-400">{item.type}</span></p>}
                    {item.location && <p>📍 {item.location}</p>}
                    {item.category && <p>🏷️ {item.category} • ⭐ {item.rating}</p>}
                    {item.address && <p>🏠 {item.address}</p>}
                    {item.condition && <p>✨ {currentLanguage === 'en' ? 'Condition' : 'حالت'}: {item.condition}</p>}
                    {item.postedBy && <p>👤 {currentLanguage === 'en' ? 'Posted by' : 'پوسٹ کنندہ'}: {item.postedBy}</p>}
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-3 border-t border-slate-100 mt-2">
                  <a 
                    href={`tel:${item.contact}`}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-action hover:bg-action-dark text-white text-xs font-semibold rounded-lg shadow-sm transition-all duration-150"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    {currentLanguage === 'en' ? 'Call Now' : 'کال کریں'}
                  </a>
                  <button 
                    onClick={() => alert(currentLanguage === 'en' ? 'Listing details saved successfully!' : 'اشتہار کامیابی سے محفوظ کر لیا گیا ہے!')}
                    className="py-2 px-3 border border-slate-200 hover:bg-slate-50 text-slate-500 rounded-lg text-xs font-semibold transition-colors"
                  >
                    {currentLanguage === 'en' ? 'Save' : 'محفوظ کریں'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Timer effect for Story / Status auto-play with progress bar
  React.useEffect(() => {
    if (viewingStoryIdx === null || isStoryPaused) return;

    const interval = setInterval(() => {
      setStoryTimer(prev => {
        if (prev >= 100) {
          if (viewingStoryIdx < flatGroupedStories.length - 1) {
            setViewingStoryIdx(viewingStoryIdx + 1);
            return 0;
          } else {
            setViewingStoryIdx(null);
            return 0;
          }
        }
        return prev + 2; // 50 ticks of 100ms = 5000ms (5 seconds)
      });
    }, 100);

    return () => clearInterval(interval);
  }, [viewingStoryIdx, isStoryPaused, flatGroupedStories.length]);

  const handleComposerImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setComposerImage(file);
      setComposerImagePreview(URL.createObjectURL(file));
      setComposerVideo(null);
      setComposerVideoPreview(null);
    }
  };

  const handleComposerVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 50 * 1024 * 1024) {
        alert(currentLanguage === 'en' ? 'Video size must be less than 50MB.' : 'ویڈیو کا سائز 50MB سے کم ہونا چاہیے۔');
        return;
      }
      setComposerVideo(file);
      setComposerVideoPreview(URL.createObjectURL(file));
      setComposerImage(null);
      setComposerImagePreview(null);
    }
  };

  const handleDetectLocation = async () => {
    if (composerLocation !== null) {
      setComposerLocation(null);
      setComposerAreaId(null);
      setComposerLatitude(null);
      setComposerLongitude(null);
      return;
    }

    setIsDetectingLocation(true);
    try {
      const coords = await detectBrowserLocation();
      if (coords) {
        setComposerLatitude(coords.latitude);
        setComposerLongitude(coords.longitude);
        
        // Find nearest matching area in rawalpindi city
        const nearest = await findNearestArea(coords.latitude, coords.longitude, 'city-rwp-1');
        if (nearest) {
          setComposerAreaId(nearest.id);
          setComposerLocation(nearest.name);
        } else {
          setComposerLocation('Dhoke Hassu');
          setComposerAreaId('area-dh-1');
        }
      } else {
        // Silent fallback: use profile area or default "Dhoke Hassu"
        const defaultAreaName = profileData?.area || 'Dhoke Hassu';
        const matched = STATIC_AREAS.find(a => a.name === defaultAreaName) || STATIC_AREAS[0];
        setComposerLocation(matched.name);
        setComposerAreaId(matched.id);
        setComposerLatitude(matched.latitude || null);
        setComposerLongitude(matched.longitude || null);
      }
    } catch (err) {
      console.warn("Error in handleDetectLocation:", err);
      const defaultAreaName = profileData?.area || 'Dhoke Hassu';
      const matched = STATIC_AREAS.find(a => a.name === defaultAreaName) || STATIC_AREAS[0];
      setComposerLocation(matched.name);
      setComposerAreaId(matched.id);
    } finally {
      setIsDetectingLocation(false);
    }
  };

  const handleCreateComposerPost = async () => {
    if (!composerText?.trim() && !composerImage && !composerVideo) return;
    setIsSubmittingPost(true);
    setComposerUploadError('');
    setComposerUploadProgress(0);
    
    // Start progress UI if there is a video
    if (composerVideo) {
      setComposerUploadStage('Processing');
    }

    try {
      let imageUrl = null;
      if (composerImage) {
        imageUrl = await dbUploadPostImage(composerImage);
      }

      let videoUrl = null;
      if (composerVideo) {
        setComposerUploadStage('Uploading');
        videoUrl = await dbUploadPostVideo(composerVideo, (progress) => {
          // Progress from 1 to 100
          setComposerUploadProgress(Math.max(1, Math.round(progress)));
        });
      }

      if (composerVideo) setComposerUploadStage('Saving Database');

      const postContent = composerLocation ? `${composerText}\n\n📍 ${composerLocation}` : composerText;

      const newPostPayload = {
        id: `p-${Date.now()}`,
        user_id: user.id || 'anonymous',
        userId: user.id,
        content: postContent,
        image: imageUrl || undefined,
        videoUrl: videoUrl || undefined,
        postType: composerPostType,
        likes: 0,
        commentsCount: 0,
        comments: [],
        areaId: composerAreaId || undefined,
        locationName: composerLocation || undefined,
        latitude: composerLatitude || undefined,
        longitude: composerLongitude || undefined
      };

      const success = await dbSavePost(newPostPayload);
      if (success || !isSupabaseConfigured) {
        const localNewPost: Post = {
          id: newPostPayload.id,
          author: user.fullName || 'Neighbor',
          avatar: profileData.profilePhoto || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=120',
          area: composerLocation || user.area || 'Dhoke Hassu',
          content: postContent,
          image: imageUrl || undefined,
          videoUrl: videoUrl || undefined,
          likes: 0,
          commentsCount: 0,
          comments: [],
          time: 'Just now',
          userId: user.id,
          areaId: composerAreaId || undefined,
          locationName: composerLocation || undefined,
          latitude: composerLatitude || undefined,
          longitude: composerLongitude || undefined
        };
        
        setPosts(prev => [localNewPost, ...prev]);
        
        if (composerVideo) {
          setComposerUploadStage('Completed');
          setComposerUploadProgress(100);
          // Wait briefly so user sees 'Upload Complete!' then reset
          setTimeout(() => {
            setComposerUploadStage('None');
            resetComposerState();
          }, 1500);
        } else {
          resetComposerState();
        }
      } else {
        throw new Error(currentLanguage === 'en' ? 'Failed to publish post. Please try again.' : 'پوسٹ کرنے میں خرابی۔ دوبارہ کوشش کریں۔');
      }
    } catch (err: any) {
      console.error("Error creating post:", err);
      if (composerVideo) {
        setComposerUploadStage('Failed');
        setComposerUploadError(err.message || 'An error occurred during upload.');
      } else {
        alert(err.message || 'Error creating post');
      }
    } finally {
      setIsSubmittingPost(false);
    }
  };

  const resetComposerState = () => {
    setComposerText('');
    setComposerImage(null);
    setComposerImagePreview(null);
    setComposerVideo(null);
    setComposerVideoPreview(null);
    setComposerPostType('general');
    setComposerLocation(null);
    setComposerAreaId(null);
    setComposerLatitude(null);
    setComposerLongitude(null);
  };

  const handleLfFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (lfImages.length + files.length > 5) {
      alert(currentLanguage === 'en' ? 'Maximum 5 images allowed.' : 'زیادہ سے زیادہ 5 تصویریں اپ لوڈ کرنے کی اجازت ہے۔');
      return;
    }

    const validFiles: File[] = [];
    const newPreviews: string[] = [];

    for (const file of files) {
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        alert(currentLanguage === 'en' ? 'Unsupported file type.' : 'غیر تعاون یافتہ فائل کی قسم۔');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        alert(currentLanguage === 'en' ? 'Image size exceeds 5 MB.' : 'تصویر کا سائز 5 MB سے زیادہ ہے۔');
        return;
      }

      validFiles.push(file);
      newPreviews.push(URL.createObjectURL(file));
    }

    setLfImages(prev => [...prev, ...validFiles]);
    setLfPreviews(prev => [...prev, ...newPreviews]);
  };

  const handleLfRemoveImage = (index: number) => {
    setLfImages(prev => prev.filter((_, i) => i !== index));
    setLfPreviews(prev => prev.filter((_, i) => i !== index));
  };

  // Handle posting a Lost & Found status to the community feed
  const handleLostFoundPost = async () => {
    if (!lfTitle?.trim() || !lfDescription?.trim()) {
      alert(currentLanguage === 'en' ? 'Please fill in item name and description.' : 'براہ کرم چیز کا نام اور تفصیل لکھیں۔');
      return;
    }
    setLfIsSubmitting(true);
    setLfUploadStatus(currentLanguage === 'en' ? 'Uploading photos...' : 'تصاویر اپ لوڈ ہو رہی ہیں...');

    try {
      const uploadedUrls: string[] = [];
      const { dbUploadPostImage } = await import('../utils/supabaseClient');

      for (let i = 0; i < lfImages.length; i++) {
        const file = lfImages[i];
        let attempt = 0;
        let success = false;
        let url = null;

        while (attempt < 2 && !success) {
          try {
            url = await dbUploadPostImage(file);
            if (url) {
              success = true;
            }
          } catch (e) {
            console.error(`Upload attempt ${attempt + 1} failed for ${file.name}:`, e);
          }
          attempt++;
        }

        if (success && url) {
          uploadedUrls.push(url);
        } else {
          alert(currentLanguage === 'en' ? `Failed to upload image: ${file.name}` : `تصویر اپ لوڈ کرنے میں ناکامی: ${file.name}`);
          setLfIsSubmitting(false);
          setLfUploadStatus('');
          return;
        }
      }

      const tag = lfPostType === 'lost' ? '🔍 LOST' : '✅ FOUND';
      let content = `${tag}: ${lfTitle}\n\n${lfDescription}${lfLocation ? `\n\n📍 Location: ${lfLocation}` : ''}${lfContact ? `\n📞 Contact: ${lfContact}` : ''}`;
      if (uploadedUrls.length > 0) {
        content += `\n[LF_IMAGES:${uploadedUrls.join(',')}]`;
      }

      const newPost: Post = {
        id: `lf-${Date.now()}`,
        author: profileData.fullName,
        avatar: profileData.profilePhoto || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=120',
        time: 'Just now',
        area: profileData?.area || 'Dhoke Hassu',
        content: content,
        image: uploadedUrls[0] || undefined,
        lfImages: uploadedUrls,
        images: uploadedUrls,
        likes: 0,
        commentsCount: 0,
        comments: [],
        postTag: lfPostType,
        contactDetails: lfContact || undefined,
        itemLocation: lfLocation || undefined,
      };

      await dbSavePost(newPost);
      setPosts(prev => [cleanPostImagesMetadata(newPost), ...prev]);

      setLfTitle('');
      setLfDescription('');
      setLfContact('');
      setLfLocation('');
      setLfImages([]);
      setLfPreviews([]);
      setLfPostType('lost');
      setShowLostFoundComposer(false);
      
      alert(currentLanguage === 'en'
        ? `Your ${lfPostType === 'lost' ? 'Lost Item' : 'Found Item'} report has been posted to the community feed!`
        : `آپ کی ${lfPostType === 'lost' ? 'گم شدہ' : 'ملی ہوئی'} چیز کی اطلاع کمیونٹی فیڈ میں شائع ہو گئی!`
      );
    } catch (err) {
      console.error("Error creating Lost & Found post:", err);
      alert('Error creating report');
    } finally {
      setLfIsSubmitting(false);
      setLfUploadStatus('');
    }
  };

  const renderLostFoundComposer = () => {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm mb-6 overflow-hidden" id="lost-found-quick-post-section">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-xl shrink-0">
              🔍
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">
                {currentLanguage === 'en' ? 'Lost & Found' : 'گم شدہ اور ملی ہوئی اشیاء'}
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {currentLanguage === 'en' ? 'Report a lost or found item to neighbors' : 'ہمسایوں کو گم یا ملی ہوئی چیز کی اطلاع دیں'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowLostFoundComposer(!showLostFoundComposer)}
            className={`px-4 py-2 text-xs font-black rounded-xl transition-all cursor-pointer border-0 flex items-center gap-1.5 ${showLostFoundComposer ? 'bg-slate-200 text-slate-700' : 'bg-amber-500 hover:bg-amber-600 text-white shadow-sm'}`}
            id="lost-found-toggle-btn"
          >
            {showLostFoundComposer ? (
              <><X className="w-3.5 h-3.5" />{currentLanguage === 'en' ? 'Close' : 'بند کریں'}</>
            ) : (
              <><Plus className="w-3.5 h-3.5" />{currentLanguage === 'en' ? 'Post Report' : 'اطلاع دیں'}</>
            )}
          </button>
        </div>

        {/* Expandable Form */}
        {showLostFoundComposer && (
          <div className="p-5 space-y-4 animate-fade-in" id="lost-found-form">
            {/* Lost / Found Toggle */}
            <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
              <button
                type="button"
                onClick={() => setLfPostType('lost')}
                className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${lfPostType === 'lost' ? 'bg-red-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                id="lf-type-lost-btn"
              >
                🔍 {currentLanguage === 'en' ? 'I Lost Something' : 'کچھ گم ہو گیا'}
              </button>
              <button
                type="button"
                onClick={() => setLfPostType('found')}
                className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${lfPostType === 'found' ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                id="lf-type-found-btn"
              >
                ✅ {currentLanguage === 'en' ? 'I Found Something' : 'کچھ مل گیا'}
              </button>
            </div>

            {/* Item Name */}
            <div className="space-y-1">
              <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider">
                {currentLanguage === 'en' ? 'Item Name *' : 'چیز کا نام *'}
              </label>
              <input
                type="text"
                value={lfTitle}
                onChange={(e) => setLfTitle(e.target.value)}
                placeholder={currentLanguage === 'en' ? (lfPostType === 'lost' ? 'e.g. Black wallet, Blue bicycle...' : 'e.g. Found keys, Found phone...') : (lfPostType === 'lost' ? 'مثلاً: کالا بٹوہ، نیلی سائیکل...' : 'مثلاً: چابیاں ملی، موبائل ملا...')}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400 transition-all"
                id="lf-title-input"
              />
            </div>

            {/* Photos */}
            <div className="space-y-2">
              <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider block">
                {currentLanguage === 'en' ? 'Photos' : 'تصاویر'}
              </label>
              
              <div className="flex flex-col gap-2">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleLfFileChange}
                  className="hidden"
                  id="lf-photos-upload-input"
                  disabled={lfIsSubmitting}
                />
                
                <label
                  htmlFor="lf-photos-upload-input"
                  className={`flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed rounded-2xl transition-all cursor-pointer ${
                    lfIsSubmitting
                      ? 'bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed'
                      : 'bg-amber-50/20 border-amber-200 hover:bg-amber-50/50 text-amber-805'
                  }`}
                >
                  <Upload className="w-6 h-6 text-amber-600" />
                  <span className="text-xs font-black">
                    {currentLanguage === 'en' ? 'Upload Photos' : 'تصاویر اپ لوڈ کریں'}
                  </span>
                  <span className="text-[10px] text-slate-400 font-semibold">
                    {currentLanguage === 'en' 
                      ? 'Upload clear photos of the lost or found item. Maximum 5 photos.'
                      : 'گم شدہ یا ملی ہوئی چیز کی واضح تصاویر اپ لوڈ کریں۔ زیادہ سے زیادہ 5 تصاویر۔'}
                  </span>
                </label>

                {lfUploadStatus && (
                  <p className="text-[10px] font-bold text-amber-650 animate-pulse">
                    ⏳ {lfUploadStatus}
                  </p>
                )}

                {/* Previews responsive grid */}
                {lfPreviews.length > 0 && (
                  <div className="grid grid-cols-5 gap-2 mt-2" id="lf-photos-preview-grid">
                    {lfPreviews.map((url, index) => (
                      <div key={index} className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 bg-slate-50 group">
                        <img src={url} alt="preview" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => handleLfRemoveImage(index)}
                          className="absolute top-1 right-1 p-1 bg-black/60 hover:bg-black text-white rounded-full transition-all cursor-pointer border-0"
                          title="Remove"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                        <div className="absolute bottom-1 left-1 bg-emerald-500/90 text-white text-[8px] font-black px-1 py-0.5 rounded shadow-xs">
                          ✓ success
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1">
              <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider">
                {currentLanguage === 'en' ? 'Description *' : 'تفصیل *'}
              </label>
              <textarea
                value={lfDescription}
                onChange={(e) => setLfDescription(e.target.value)}
                placeholder={currentLanguage === 'en' ? 'Describe the item, color, size, brand, when & where...' : 'چیز کی تفصیل، رنگ، سائز، برانڈ، کب اور کہاں...'}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400 transition-all resize-none min-h-[80px]"
                rows={3}
                id="lf-description-input"
              />
            </div>

            {/* Location & Contact */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider">
                  📍 {currentLanguage === 'en' ? 'Location' : 'مقام'}
                </label>
                <input
                  type="text"
                  value={lfLocation}
                  onChange={(e) => setLfLocation(e.target.value)}
                  placeholder={currentLanguage === 'en' ? 'e.g. Near main gate, Block B...' : 'مثلاً: مین گیٹ کے قریب، بلاک بی...'}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400 transition-all"
                  id="lf-location-input"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider">
                  📞 {currentLanguage === 'en' ? 'Contact' : 'رابطہ'}
                </label>
                <input
                  type="tel"
                  value={lfContact}
                  onChange={(e) => setLfContact(e.target.value)}
                  placeholder={currentLanguage === 'en' ? 'Phone or WhatsApp number' : 'فون یا واٹس ایپ نمبر'}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400 transition-all"
                  id="lf-contact-input"
                />
              </div>
            </div>

            {/* Submit */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowLostFoundComposer(false)}
                className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-black rounded-xl transition-all cursor-pointer border-0"
              >
                {currentLanguage === 'en' ? 'Cancel' : 'منسوخ کریں'}
              </button>
              <button
                type="button"
                onClick={handleLostFoundPost}
                disabled={lfIsSubmitting || !lfTitle?.trim() || !lfDescription?.trim()}
                className={`flex-1 py-2.5 px-4 text-white text-xs font-black rounded-xl transition-all cursor-pointer border-0 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed ${lfPostType === 'lost' ? 'bg-red-500 hover:bg-red-600' : 'bg-emerald-500 hover:bg-emerald-600'}`}
                id="lf-submit-btn"
              >
                {lfIsSubmitting
                  ? (currentLanguage === 'en' ? 'Posting...' : 'شائع ہو رہا ہے...')
                  : lfPostType === 'lost'
                    ? (currentLanguage === 'en' ? '🔍 Post Lost Report' : '🔍 گمشدگی کی اطلاع دیں')
                    : (currentLanguage === 'en' ? '✅ Post Found Report' : '✅ ملنے کی اطلاع دیں')
                }
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderStoriesBar = () => {
    return (
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/60 mb-6" id="stories-bar-container">
        <div className="flex gap-4 overflow-x-auto pb-2 scroll-smooth no-scrollbar snap-x snap-mandatory">
          {/* Add Story Button */}
          <div 
            onClick={() => setShowAddStoryModal(true)}
            className="flex flex-col items-center gap-1.5 shrink-0 cursor-pointer group"
          >
            <div className="relative w-14 h-14 rounded-full p-0.5 bg-slate-100 group-hover:bg-slate-200 transition-colors">
              <div className="w-full h-full rounded-full bg-slate-50 border-2 border-white flex items-center justify-center">
                <Plus className="w-6 h-6 text-slate-400 group-hover:text-blue-500 transition-colors" />
              </div>
            </div>
            <span className="text-[10px] font-semibold text-slate-600 truncate w-16 text-center group-hover:text-slate-900">
              {currentLanguage === 'en' ? 'Add Story' : 'سٹوری شامل کریں'}
            </span>
          </div>

          {/* Stories List */}
          {groupedUserStories.filter(group => !group[0].isAd).map((userStories) => {
            const firstUnseen = userStories.find(s => !s.viewed) || userStories[0];
            const flatIdx = flatGroupedStories.indexOf(firstUnseen);
            const ringStory = userStories[0];
            
            return (
              <div 
                key={ringStory.userId} 
                onClick={() => setViewingStoryIdx(flatIdx)}
                className="flex flex-col items-center gap-1.5 shrink-0 cursor-pointer group snap-start"
              >
                <div className={`relative w-14 h-14 rounded-full p-[2px] ${userStories.every(s => s.viewed) ? 'bg-slate-300' : 'bg-gradient-to-tr from-blue-500 via-pink-500 to-amber-500'} group-hover:scale-105 transition-transform duration-200`}>
                  <img 
                    src={ringStory.avatar} 
                    alt={ringStory.author}
                    className="w-full h-full rounded-full object-cover border-2 border-white"
                  />
                </div>
                <span className="text-[10px] font-semibold text-slate-700 truncate w-16 text-center group-hover:text-slate-900">
                  {ringStory.author?.split(' ')[0]}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderHeroSection = () => {

    const hours = new Date().getHours();
    let greeting = 'Good morning';
    if (hours >= 12 && hours < 17) {
      greeting = 'Good afternoon';
    } else if (hours >= 17) {
      greeting = 'Good evening';
    }
    
    // Date formatting
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const todayStr = new Date().toLocaleDateString(currentLanguage === 'en' ? 'en-US' : 'ur-PK', options);

    return (
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-lg p-6 shadow-md flex flex-col md:flex-row justify-between items-center gap-6 mb-6">
        <div className="absolute inset-0 bg-black/10" />
        <div className="relative flex items-center gap-4.5">
          <AppAvatar
            name={user.fullName ?? "Unknown User"}
            avatar={profileData.profilePhoto}
            size="lg"
            isVerified={true}
            clickable={false}
            className="border-2 border-white/60 shadow-lg"
          />
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-blue-200/90 block">
              📍 {user.area || 'Dhoke Hassu'} Resident Portal
            </span>
            <h2 className="text-h2 font-black leading-tight flex items-center gap-1.5 mt-0.5">
              {currentLanguage === 'en' ? `${greeting}, ${user.fullName}!` : `السلام علیکم، ${user.fullName}!`}
            </h2>
            <p className="text-xs text-blue-100 font-semibold mt-1">
              {todayStr}
            </p>
          </div>
        </div>
        <div className="relative shrink-0 flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md text-white border border-white/20 rounded-xl text-xs font-black shadow-xs">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>{currentLanguage === 'en' ? 'Verified Citizen' : 'تصدیق شدہ شہری'}</span>
        </div>
      </div>
    );
  };

  const renderQuickActions = () => {
    const actionItems = [
      { id: 'post', titleEn: 'Create Post', titleUr: 'پوسٹ لکھیں', descEn: 'Share an update', descUr: 'اپڈیٹ شیئر کریں', icon: Send, path: '/feed', color: 'text-blue-500 bg-blue-50/50 hover:bg-blue-50' },
      { id: 'lostfound', titleEn: 'Lost & Found', titleUr: 'گم شدہ / ملا', descEn: 'Report lost or found', descUr: 'گم یا ملی چیز کی اطلاع', icon: Search, path: '#', color: 'text-amber-500 bg-amber-50/50 hover:bg-amber-50' },
      { id: 'polls', titleEn: 'Polls & Opinion', titleUr: 'رائے عامہ سروے', descEn: 'Participate & vote', descUr: 'رائے دیں اور ووٹ ڈالیں', icon: Clock, path: '/polls', color: 'text-indigo-500 bg-indigo-50/50 hover:bg-indigo-50' },
      { id: 'marketplace', titleEn: 'Marketplace', titleUr: 'مارکیٹ', descEn: 'Buy & sell items', descUr: 'خرید و فروخت', icon: ShoppingBag, path: '/marketplace', color: 'text-purple-500 bg-purple-50/50 hover:bg-purple-50' },
      { id: 'jobs', titleEn: 'Local Jobs', titleUr: 'ملازمتیں', descEn: 'Find job vacancies', descUr: 'ملازمت تلاش کریں', icon: Briefcase, path: '/jobs', color: 'text-emerald-500 bg-emerald-50/50 hover:bg-emerald-50' },
      { id: 'property', titleEn: 'Properties', titleUr: 'پراپرٹی', descEn: 'Rent or buy homes', descUr: 'گھر یا دکان کرایہ پر', icon: Building2, path: '/property', color: 'text-orange-500 bg-orange-50/50 hover:bg-orange-50' },
      { id: 'business', titleEn: 'Businesses', titleUr: 'کاروبار', descEn: 'Local business list', descUr: 'کاروبار دیکھیں', icon: Store, path: '/business', color: 'text-amber-500 bg-amber-50/50 hover:bg-amber-50' },
      { id: 'events', titleEn: 'Events', titleUr: 'تقاریب', descEn: 'Neighborhood activities', descUr: 'سرگرمیاں اور تقاریب', icon: Calendar, path: '/events', color: 'text-rose-500 bg-rose-50/50 hover:bg-rose-50' },
      { id: 'emergency', titleEn: 'Emergency', titleUr: 'ایمرجنسی', descEn: 'Report urgent alert', descUr: 'فوری اطلاع دیں', icon: AlertTriangle, path: '/alerts', color: 'text-red-500 bg-red-50/50 hover:bg-red-50' },
      { id: 'services', titleEn: 'Services', titleUr: 'سروسز', descEn: 'Find local helpers', descUr: 'مددگار تلاش کریں', icon: Wrench, path: '/services', color: 'text-cyan-500 bg-cyan-50/50 hover:bg-cyan-50' },
    ];

    return (
      <div className="bg-white rounded-md border border-slate-200/60 p-5 shadow-xs mb-6">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-4">
          ⚡ {currentLanguage === 'en' ? 'Quick Actions' : 'فوری روابط'}
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          {actionItems.map((item) => {
            const Icon = item.icon;
            return (
              <AppCard 
                key={item.id} 
                variant="interactive" 
                onClick={() => {
                  if (item.id === 'post') {
                    setActiveTab('feed');
                  } else if (item.id === 'lostfound') {
                    setShowLostFoundComposer(true);
                    // Scroll to the LF section
                    setTimeout(() => {
                      document.getElementById('lost-found-quick-post-section')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }, 100);
                  } else {
                    navigate(item.path);
                  }

                }}
                className="p-3.5 flex flex-col items-center justify-center text-center transition-all duration-200 hover:-translate-y-1 active:scale-[0.98] select-none"
              >
                <div className={`p-2.5 rounded-full shrink-0 ${item.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <h4 className="text-xs font-extrabold text-slate-800 mt-2 truncate">
                  {currentLanguage === 'en' ? item.titleEn : item.titleUr}
                </h4>
                <p className="text-[10px] text-slate-400 font-semibold mt-0.5 leading-none">
                  {currentLanguage === 'en' ? item.descEn : item.descUr}
                </p>
              </AppCard>
            );
          })}
        </div>
      </div>
    );
  };

  const renderCommunityStats = () => {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-sm space-y-4">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">
          📈 {currentLanguage === 'en' ? 'Community Statistics' : 'برادری کے اعداد و شمار'}
        </h3>
        
        <div className="grid grid-cols-2 gap-3.5">
          <div className="p-3.5 bg-blue-50/50 border border-blue-100 rounded-2xl space-y-1 text-center hover:bg-blue-50 transition-all">
            <span className="text-[10px] font-bold text-blue-600 block">{currentLanguage === 'en' ? 'Total Vacancies' : 'کل نوکریاں'}</span>
            <span className="text-xl font-black text-slate-900 block">{jobs.length}</span>
          </div>
          <div className="p-3.5 bg-purple-50/50 border border-purple-100 rounded-2xl space-y-1 text-center hover:bg-purple-50 transition-all">
            <span className="text-[10px] font-bold text-purple-600 block">{currentLanguage === 'en' ? 'Local Shops' : 'مقامی کاروبار'}</span>
            <span className="text-xl font-black text-slate-900 block">{businesses.length}</span>
          </div>
          <div className="p-3.5 bg-orange-50/50 border border-orange-100 rounded-2xl space-y-1 text-center hover:bg-orange-50 transition-all">
            <span className="text-[10px] font-bold text-orange-600 block">{currentLanguage === 'en' ? 'Properties' : 'پراپرٹیز'}</span>
            <span className="text-xl font-black text-slate-900 block">{properties.length}</span>
          </div>
          <div className="p-3.5 bg-rose-50/50 border border-rose-100 rounded-2xl space-y-1 text-center hover:bg-rose-50 transition-all">
            <span className="text-[10px] font-bold text-rose-600 block">{currentLanguage === 'en' ? 'Active Events' : 'تقاریب'}</span>
            <span className="text-xl font-black text-slate-900 block">{mockEvents.length}</span>
          </div>
        </div>
      </div>
    );
  };

  const renderTrendingSidebarDeals = () => {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-sm space-y-4">
        <div className="flex justify-between items-center border-b border-slate-100 pb-2">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">
            🔥 {currentLanguage === 'en' ? 'Trending Deals' : 'ٹرینڈنگ ڈیلز'}
          </h3>
          <button onClick={() => navigate('/deals')} className="text-[10px] font-black text-blue-600 hover:underline cursor-pointer border-0 bg-transparent">
            {currentLanguage === 'en' ? 'All' : 'تمام'}
          </button>
        </div>

        <div className="space-y-3">
          {deals?.slice(0, 3).map((deal) => {
            const displayImg = deal.images && deal.images.length > 0 ? deal.images[0] : 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&q=80&w=400';
            return (
              <div 
                key={deal.id} 
                onClick={() => navigate('/deals/detail', deal.id)}
                className="p-3 flex gap-3 hover:-translate-y-0.5 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-all duration-200 cursor-pointer shadow-xs"
              >
                <img src={displayImg} alt="" className="w-12 h-12 rounded-lg object-cover border border-slate-200 shrink-0 shadow-inner" />
                <div className="min-w-0 flex-1 space-y-1">
                  <h4 className="text-xs font-extrabold text-slate-800 truncate leading-tight">{deal.title}</h4>
                  <p className="text-[10px] text-slate-400 font-semibold truncate font-bold">🏢 {deal.businessName}</p>
                  <span className="inline-block text-[9px] font-black text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded font-bold">
                    {deal.discountText}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderStatusComposer = () => {
    return (
      <div className="bg-white rounded-md border border-slate-200/60 p-4 mb-6 shadow-xs space-y-4" id="premium-status-composer">
        <div className="flex gap-3">
          <AppAvatar
            name={profileData.fullName ?? "Unknown User"}
            avatar={profileData.profilePhoto}
            size="md"
            clickable={false}
          />
          <div className="flex-1">
            <AppTextarea
              value={composerText}
              onChange={(e) => setComposerText(e.target.value)}
              placeholder={currentLanguage === 'en' ? "What's on your mind today, neighbor?" : "پڑوسی، آج آپ کے دل میں کیا ہے؟"}
              className="w-full text-sm text-slate-800 placeholder-slate-400 bg-slate-50 border border-slate-200/60 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/60 resize-none transition-all duration-150 min-h-[70px]"
            />
          </div>
        </div>

        {composerImagePreview && (
          <div className="relative ml-12 rounded-xl overflow-hidden border border-slate-100 bg-slate-50 mb-3">
            <img src={composerImagePreview} alt="Selected upload" className="w-full h-auto object-contain block" />
            <button 
              onClick={() => {
                setComposerImage(null);
                setComposerImagePreview(null);
              }}
              className="absolute top-2 right-2 bg-slate-900/80 hover:bg-slate-900 text-white p-1.5 rounded-full transition-colors cursor-pointer z-10"
              title="Remove image"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {composerVideoPreview && (
          <div className="relative ml-12 rounded-xl overflow-hidden border border-slate-100 bg-slate-50 mb-3">
            <video src={composerVideoPreview} controls preload="metadata" className="w-full h-auto max-h-[400px] object-contain block bg-black/5" />
            <button 
              onClick={() => {
                setComposerVideo(null);
                setComposerVideoPreview(null);
              }}
              className="absolute top-2 right-2 bg-slate-900/80 hover:bg-slate-900 text-white p-1.5 rounded-full transition-colors cursor-pointer z-10"
              title="Remove video"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {composerLocation !== null && (
          <div className="flex items-center ml-12 mb-3 max-w-[240px]" id="composer-location-input-container">
            <div className="relative flex-1 flex items-center">
              <MapPin className="absolute left-3 w-4 h-4 text-blue-500 shrink-0" />
              <select
                value={composerLocation}
                onChange={(e) => {
                  const areaName = e.target.value;
                  setComposerLocation(areaName);
                  const matched = STATIC_AREAS.find(a => a.name === areaName);
                  if (matched) {
                    setComposerAreaId(matched.id);
                    setComposerLatitude(matched.latitude);
                    setComposerLongitude(matched.longitude);
                  }
                }}
                className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 border border-slate-200/80 rounded-xl text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all font-semibold appearance-none"
                id="composer-location-input"
              >
                {STATIC_AREAS.map((a) => (
                  <option key={a.id} value={a.name}>
                    {a.name}
                  </option>
                ))}
              </select>
              <button 
                onClick={() => {
                  setComposerLocation(null);
                  setComposerAreaId(null);
                  setComposerLatitude(null);
                  setComposerLongitude(null);
                }}
                className="absolute right-2.5 p-1 hover:bg-slate-200 text-slate-450 hover:text-slate-650 rounded-full transition-colors border-0 bg-transparent cursor-pointer flex items-center justify-center"
                title="Remove location"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl text-xs font-bold cursor-pointer transition-colors border border-slate-200/40">
              <Camera className="w-4 h-4 text-emerald-500" />
              <span>📷 {currentLanguage === 'en' ? 'Photo' : 'تصویر'}</span>
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleComposerImageChange} 
                className="hidden" 
              />
            </label>
            
            {/* Video Upload Button */}
            <label className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl text-xs font-bold cursor-pointer transition-colors border border-slate-200/40">
              <span className="text-sm">🎥</span>
              <span>{currentLanguage === 'en' ? 'Video' : 'ویڈیو'}</span>
              <input 
                type="file" 
                accept="video/*" 
                onChange={handleComposerVideoChange} 
                className="hidden" 
                onClick={(e) => {
                  // Ensure clicking the input clears the value so onChange fires even for the same file
                  (e.target as HTMLInputElement).value = '';
                }}
              />
            </label>
            <button 
              type="button" 
              onClick={handleDetectLocation}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                composerLocation !== null ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              📍 <span>{composerLocation || (currentLanguage === 'en' ? 'Location' : 'مقام')}</span>
            </button>
          </div>
          <button 
            type="submit" 
            onClick={handleCreateComposerPost}
            disabled={!composerText.trim() && !composerImagePreview && !composerVideoPreview}
            className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {currentLanguage === 'en' ? 'Post' : 'پوسٹ کریں'}
          </button>
        </div>
      </div>
    );
  };



  const renderPostComposer = (groupId?: string) => {
    return (
      <PostComposer
        currentUser={profileData}
        currentLanguage={currentLanguage}
        newPostText={newPostText}
        setNewPostText={setNewPostText}
        composerAttachedPhotos={composerAttachedPhotos}
        setComposerAttachedPhotos={setComposerAttachedPhotos}
        postUploading={postUploading}
        handleCreatePost={() => {
          if (groupId) {
            handleCreatePost(groupId);
          } else {
            handleCreatePost();
          }
        }}
        showEmojiTray={showEmojiTray}
        setShowEmojiTray={setShowEmojiTray}
      />
    );
  };

  const renderAddStoryModal = () => {
    if (!showAddStoryModal) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 sm:p-0">
        <div className="absolute inset-0" onClick={() => { stopStoryCam(); setShowAddStoryModal(false); }} />
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl max-w-md w-full overflow-hidden flex flex-col max-h-[90vh]">
          {/* Header */}
          <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div>
              <h3 className="font-black text-slate-900 text-base">
                {currentLanguage === 'en' ? 'Create New Status / Story' : 'نیا اسٹیٹس / کہانی بنائیں'}
              </h3>
              <p className="text-[11px] text-slate-500">
                {currentLanguage === 'en' ? 'Share a photo or text update with neighbors' : 'ہمسایوں کے ساتھ تصویر یا ٹیکسٹ شیئر کریں'}
              </p>
            </div>
            <button 
              type="button"
              onClick={() => {
                stopStoryCam();
                setShowAddStoryModal(false);
              }}
              className="p-1.5 hover:bg-slate-200 text-slate-400 hover:text-slate-700 rounded-lg transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleAddStory} className="p-6 space-y-5 overflow-y-auto flex-1">
            {/* Tabs to select Photo vs Text */}
            <div className="flex bg-slate-100 p-1 rounded-2xl">
              <button
                type="button"
                onClick={() => {
                  setStoryType('photo');
                  stopStoryCam();
                }}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${storyType === 'photo' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
              >
                📸 {currentLanguage === 'en' ? 'Photo Story' : 'تصویر اسٹیٹس'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setStoryType('text');
                  stopStoryCam();
                }}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${storyType === 'text' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
              >
                ✍️ {currentLanguage === 'en' ? 'Text Status' : 'ٹیکسٹ اسٹیٹس'}
              </button>
            </div>

            {storyType === 'photo' ? (
              /* Photo Story Form */
              <div className="space-y-4">
                {/* Photo Preview / Capture interface */}
                {!storyPhoto ? (
                  <div className="w-full">
                    {storyCamActive ? (
                      <div className="relative aspect-[3/4] w-full max-w-[240px] mx-auto rounded-2xl overflow-hidden bg-black border border-slate-200">
                        <video 
                          ref={storyVideoRef} 
                          autoPlay 
                          playsInline 
                          className="w-full h-full object-cover scale-x-[-1]" 
                        />
                        <div className="absolute bottom-3 left-0 right-0 flex justify-center">
                          <button
                            type="button"
                            onClick={captureStoryPhoto}
                            className="bg-red-500 hover:bg-red-600 text-white text-xs font-bold py-2 px-4 rounded-full shadow-lg flex items-center gap-1 transition-all cursor-pointer"
                          >
                            <Camera className="w-4 h-4" />
                            <span>{currentLanguage === 'en' ? 'Take Photo' : 'تصویر لیں'}</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="aspect-[3/4] w-full max-w-[240px] mx-auto rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center p-4 text-center gap-3">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-full">
                          <Camera className="w-6 h-6" />
                        </div>
                        <p className="text-[11px] font-bold text-slate-700">
                          {currentLanguage === 'en' ? 'No Photo Selected' : 'کوئی تصویر منتخب نہیں ہے'}
                        </p>
                      </div>
                    )}

                    <div className="flex gap-3 w-full mt-4">
                      {/* File select */}
                      <label className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-4 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all text-xs font-bold text-slate-700 cursor-pointer shadow-xs">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = () => setStoryPhoto(reader.result as string);
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                        <span>📁 {currentLanguage === 'en' ? 'Upload Photo' : 'اپلوڈ کریں'}</span>
                      </label>

                      {/* Webcam select */}
                      {storyCamActive ? (
                        <button
                          type="button"
                          onClick={stopStoryCam}
                          className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                        >
                          ❌ {currentLanguage === 'en' ? 'Stop' : 'بند کریں'}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={startStoryCam}
                          className="flex-1 py-2.5 px-4 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <Video className="w-3.5 h-3.5" />
                          <span>{currentLanguage === 'en' ? 'Use Camera' : 'کیمرہ'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  /* Photo Chosen preview */
                  <div className="space-y-3">
                    <div className="relative aspect-[3/4] w-full max-w-[240px] mx-auto rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shadow-md">
                      <img src={storyPhoto} alt="Story Attachment" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setStoryPhoto(null)}
                        className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black/80 text-white rounded-full transition-all cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">
                        {currentLanguage === 'en' ? 'Caption (Optional)' : 'کیپشن (اختیاری)'}
                      </label>
                      <input
                        type="text"
                        value={storyCaption}
                        onChange={(e) => setStoryCaption(e.target.value)}
                        placeholder={currentLanguage === 'en' ? "Write a short caption..." : "مختصر تفصیل لکھیں..."}
                        className="w-full bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-100 border border-slate-200 rounded-xl py-2 px-3 text-xs font-medium focus:outline-none transition-all"
                      />
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Text Status Story Form */
              <div className="space-y-4">
                {/* Text Status Editor Preview block */}
                <div className={`aspect-[3/4] w-full max-w-[240px] mx-auto rounded-2xl bg-gradient-to-br ${storyBg} flex flex-col items-center justify-center p-4 shadow-md text-center text-white relative`}>
                  <p className="text-sm font-black tracking-wide leading-relaxed break-words whitespace-pre-wrap max-w-full">
                    {storyTextContent || (currentLanguage === 'en' ? 'Type status text...' : 'اسٹیٹس لکھیں...')}
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">
                      {currentLanguage === 'en' ? 'Your Status Message' : 'اسٹیٹس کا پیغام'}
                    </label>
                    <textarea
                      value={storyTextContent}
                      onChange={(e) => setStoryTextContent(e.target.value)}
                      placeholder={currentLanguage === 'en' ? "What is on your mind?" : "آپ کے دماغ میں کیا ہے؟"}
                      className="w-full bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-100 border border-slate-200 rounded-xl py-2 px-3 text-xs font-medium focus:outline-none transition-all resize-none h-20"
                    />
                  </div>

                  {/* Gradient Background Presets selection */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">
                      {currentLanguage === 'en' ? 'Select Background Gradient' : 'پس منظر کا انتخاب کریں'}
                    </label>
                    <div className="flex gap-2.5 overflow-x-auto pb-1">
                      {[
                        'from-purple-600 to-pink-500',
                        'from-blue-600 to-cyan-500',
                        'from-orange-500 to-yellow-500',
                        'from-emerald-600 to-teal-500',
                        'from-slate-800 to-slate-900',
                        'from-red-600 to-pink-600'
                      ].map((grad) => (
                        <button
                          key={grad}
                          type="button"
                          onClick={() => setStoryBg(grad)}
                          className={`w-8 h-8 rounded-full bg-gradient-to-br ${grad} shrink-0 transition-all cursor-pointer ${storyBg === grad ? 'scale-110 ring-2 ring-blue-500 ring-offset-2' : 'hover:scale-105'}`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="pt-4 border-t border-slate-100 flex gap-3">
              <button
                type="button"
                onClick={() => {
                  stopStoryCam();
                  setShowAddStoryModal(false);
                }}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                {currentLanguage === 'en' ? 'Cancel' : 'منسوخ کریں'}
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 bg-[#2563eb] hover:bg-blue-600 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
              >
                🚀 {currentLanguage === 'en' ? 'Publish' : 'شائع کریں'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const renderStoryViewerModal = () => {
    if (viewingStoryIdx === null) return null;
    const story = flatGroupedStories[viewingStoryIdx];
    if (!story) return null;

    const currentUserStories = groupedUserStories.find(group => 
      story.isAd ? group[0].id === story.id : group[0].userId === story.userId
    ) || [story];

    return (
      <div className="fixed inset-0 bg-slate-950 z-50 flex items-center justify-center p-0 sm:p-4 select-none" id="story-viewer-modal">
        {/* Backdrop overlay */}
        <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setViewingStoryIdx(null)} />

        {/* Content Container */}
        <div className="relative bg-slate-900 w-full sm:max-w-md aspect-[9/16] sm:rounded-3xl overflow-hidden shadow-2xl flex flex-col justify-between z-10">
          
          {/* Progress Indicators and Top info bar */}
          <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/80 to-transparent z-20 space-y-3">
            {/* Progress Bars */}
            <div className="flex gap-1.5 w-full">
              {currentUserStories.map((_, sIdx) => {
                const globalIdx = flatGroupedStories.indexOf(currentUserStories[sIdx]);
                let fill = 0;
                if (globalIdx < viewingStoryIdx) fill = 100;
                else if (globalIdx === viewingStoryIdx) fill = storyTimer;

                return (
                  <div key={sIdx} className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-white transition-all duration-100 ease-linear" 
                      style={{ width: `${fill}%` }} 
                    />
                  </div>
                );
              })}
            </div>

            {/* Author and Controls info */}
            <div className="flex items-center justify-between text-white">
              <div 
                className="flex items-center gap-3 cursor-pointer"
                onClick={() => {
                  setViewingStoryIdx(null);
                  const resolvedId = story.userId || story.author;
                  const url = `/profile/${encodeURIComponent(resolvedId)}?name=${encodeURIComponent(story.author)}${story.avatar ? `&avatar=${encodeURIComponent(story.avatar)}` : ''}`;
                  window.history.pushState({}, '', url);
                  window.dispatchEvent(new Event('popstate'));
                }}
              >
                <img 
                  src={story.avatar} 
                  alt={story.author} 
                  className="w-9 h-9 rounded-full object-cover border-2 border-white shadow-md hover:scale-105 transition-transform" 
                />
                <div>
                  <h4 className="font-extrabold text-xs hover:underline">{story.author}</h4>
                  <p className="text-[9px] text-white/70">{story.time}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Play/Pause */}
                <button
                  onClick={() => setIsStoryPaused(!isStoryPaused)}
                  className="p-1.5 bg-white/10 hover:bg-white/20 rounded-full transition-all text-white text-xs cursor-pointer"
                  title={isStoryPaused ? 'Resume' : 'Pause'}
                >
                  {isStoryPaused ? '▶️' : '⏸️'}
                </button>
                {/* Close */}
                <button
                  onClick={() => setViewingStoryIdx(null)}
                  className="p-1.5 bg-white/10 hover:bg-white/20 rounded-full transition-all text-white text-xs cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Left/Right click trigger zones to go back / forward */}
          <div className="absolute inset-x-0 top-16 bottom-16 flex z-10">
            {/* Left Zone (Back) */}
            <button
              onClick={() => {
                if (viewingStoryIdx > 0) {
                  setViewingStoryIdx(viewingStoryIdx - 1);
                  setStoryTimer(0);
                }
              }}
              className="flex-1 h-full cursor-west-resize bg-transparent text-left outline-none"
              style={{ width: '30%' }}
            />
            {/* Pause Zone (Hold/Center) */}
            <div 
              className="h-full" 
              style={{ width: '40%' }}
              onMouseDown={() => setIsStoryPaused(true)}
              onMouseUp={() => setIsStoryPaused(false)}
              onTouchStart={() => setIsStoryPaused(true)}
              onTouchEnd={() => setIsStoryPaused(false)}
            />
            {/* Right Zone (Next) */}
            <button
              onClick={() => {
                if (viewingStoryIdx < flatGroupedStories.length - 1) {
                  setViewingStoryIdx(viewingStoryIdx + 1);
                  setStoryTimer(0);
                } else {
                  setViewingStoryIdx(null);
                }
              }}
              className="flex-1 h-full cursor-east-resize bg-transparent text-right outline-none"
              style={{ width: '30%' }}
            />
          </div>

          {/* Center Stage Render */}
          <div className="flex-1 flex items-center justify-center bg-slate-950 relative h-full">
            {story.type === 'text' ? (
              <div className={`w-full h-full bg-gradient-to-br ${story.bgColor || 'from-purple-600 to-pink-500'} flex items-center justify-center p-8 text-center`}>
                <h3 className="text-xl sm:text-2xl font-black text-white tracking-wide leading-relaxed drop-shadow-md select-text break-words max-w-full">
                  {story.text}
                </h3>
              </div>
            ) : story.type === 'video' || story.videoUrl || story.video_url || (story.mediaUrls && story.mediaUrls[0]?.match(/\.(mp4|webm|mov)$/i)) ? (
              <div className="w-full h-full relative">
                <video 
                  src={story.videoUrl || story.video_url || story.mediaUrls?.[0] || story.image} 
                  autoPlay
                  playsInline
                  loop
                  muted={false}
                  className="w-full h-full object-cover select-none pointer-events-none" 
                />
                {story.text && (
                  <div className="absolute bottom-6 left-4 right-4 bg-black/40 backdrop-blur-md p-4 rounded-2xl border border-white/10 text-center text-white z-20">
                    <p className="text-xs font-bold leading-relaxed">{story.text}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="w-full h-full relative">
                <img 
                  src={story.image || story.avatar || story.mediaUrls?.[0]} 
                  alt="Story visual" 
                  className="w-full h-full object-cover select-none pointer-events-none" 
                />
                {story.text && (
                  <div className="absolute bottom-6 left-4 right-4 bg-black/40 backdrop-blur-md p-4 rounded-2xl border border-white/10 text-center text-white z-20">
                    <p className="text-xs font-bold leading-relaxed">{story.text}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Previous & Next Arrow controls for desktops */}
          <div className="absolute inset-y-1/2 left-4 right-4 flex justify-between z-20 pointer-events-none">
            <button
              disabled={viewingStoryIdx === 0}
              onClick={(e) => {
                e.stopPropagation();
                setViewingStoryIdx(viewingStoryIdx - 1);
                setStoryTimer(0);
              }}
              className="w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center pointer-events-auto transition-all disabled:opacity-20 cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              disabled={viewingStoryIdx === flatGroupedStories.length - 1}
              onClick={(e) => {
                e.stopPropagation();
                setViewingStoryIdx(viewingStoryIdx + 1);
                setStoryTimer(0);
              }}
              className="w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center pointer-events-auto transition-all disabled:opacity-20 cursor-pointer"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    );
  };

    const renderShareModal = () => {
    return (
      <ShareModal
        isOpen={shareModalData.isOpen}
        onClose={() => setShareModalData(prev => ({ ...prev, isOpen: false }))}
        currentUser={profileData}
        entityType={shareModalData.entityType}
        entityId={shareModalData.entityId}
        entityPreview={shareModalData.preview}
        currentLanguage={currentLanguage}
        onShareComplete={() => setShareModalData(prev => ({ ...prev, isOpen: false }))}
      />
    );
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-slate-50/50 font-sans relative">
      {/* Splash Banner migrated to global PremiumAdPopup component overlay */}

      {/* 1. DESKTOP SIDEBAR */}
      <DesktopSidebar
        currentPath={currentPath}
        activeTab={activeTab}
        currentLanguage={currentLanguage}
        t={t}
        user={profileData}
        onLogout={onLogout}
        navigate={navigate}
        unreadChatCount={unreadChatCount}
      />

      {/* 2. MAIN CONTAINER (Header + Scrollable Main Content on the right) */}
      <div className="h-full flex flex-col min-w-0 overflow-hidden relative ml-0 md:ml-[72px] lg:ml-[240px] transition-all duration-300">
        
        {/* MOBILE & DESKTOP HEADER */}
        <header className={`bg-white border-b border-slate-200/80 shrink-0 h-16 items-center justify-between px-4 sm:px-6 z-40 ${activeTab === 'videos' ? 'hidden md:flex' : 'flex'}`}>
          <div className="w-full flex items-center justify-between gap-4">
            
            {/* Brand Logo & Slogan (Only visible on Mobile since Desktop has it in sidebar) */}
            <div className="flex items-center gap-2.5 lg:hidden">
              <div className="p-2 bg-primary text-white rounded-xl shadow-sm">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <h1 className="text-base font-extrabold text-slate-950 tracking-tight leading-none uppercase">
                  {t.appName}
                </h1>
                <button
                  onClick={() => navigate('/settings')}
                  className="text-[10px] text-blue-600 hover:underline mt-1 font-bold border-0 bg-transparent p-0 cursor-pointer flex items-center gap-0.5"
                  title="Change Location"
                >
                  📍 {user.area || 'Dhoke Hassu'}
                </button>
              </div>
            </div>

            {/* Desktop header title / metadata */}
            <div className="hidden lg:flex items-center gap-2.5">
              <button
                onClick={() => navigate('/settings')}
                className="text-xs bg-blue-50 text-blue-600 hover:bg-blue-105 border border-blue-100 font-extrabold px-3 py-1 rounded-full uppercase cursor-pointer transition-all"
                title="Change Location"
              >
                📍 {user.area || 'Dhoke Hassu'} Connected
              </button>
              <span className="text-[11px] text-slate-400 font-semibold font-mono">
                🇵🇰 {currentLanguage === 'en' ? 'Rawalpindi Public Portal' : 'راولپنڈی پبلک پورٹل'}
              </span>
            </div>

            {/* Actions: Bilingual Switcher + Quick Actions */}
            <div className="flex items-center gap-2.5 ml-auto">
              {/* Bilingual Switcher */}
              <button
                onClick={() => onLanguageChange(currentLanguage === 'en' ? 'ur' : 'en')}
                className="h-10 px-3 flex items-center justify-center gap-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs rounded-xl font-bold transition-all duration-150 shrink-0 cursor-pointer border border-slate-200"
              >
                <Globe className="w-4 h-4 text-blue-600" />
                <span>{t.languageToggle}</span>
              </button>

              {/* Global Search Button */}
              <button
                onClick={() => navigate('/search')}
                className="w-10 h-10 flex items-center justify-center bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-blue-600 rounded-xl transition-all cursor-pointer border border-slate-200 shrink-0 relative"
                title={currentLanguage === 'en' ? 'Search' : 'تلاش کریں'}
                id="header-global-search-btn"
              >
                <Search className="w-4.5 h-4.5" />
              </button>



              {/* Notification Bell with Badge */}
              <div className="relative">
                <button
                  onClick={() => setIsNotifDropdownOpen(!isNotifDropdownOpen)}
                  className="w-10 h-10 flex items-center justify-center bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-blue-600 rounded-xl transition-all cursor-pointer border border-slate-200 shrink-0 relative"
                  title={currentLanguage === 'en' ? 'Notifications' : 'اطلاعات'}
                  id="header-notifications-bell-btn"
                >
                  <Bell className="w-4.5 h-4.5" />
                  {unreadNotificationsCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-black rounded-full leading-none w-4.5 h-4.5 flex items-center justify-center border border-white animate-pulse">
                      {unreadNotificationsCount}
                    </span>
                  )}
                </button>

                {isNotifDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl border border-slate-200 shadow-xl z-50 overflow-hidden py-1">
                    <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100">
                      <span className="text-xs font-black text-slate-800">{currentLanguage === 'en' ? 'Notifications' : 'اطلاعات'}</span>
                      {unreadNotificationsCount > 0 && (
                        <button
                          onClick={async () => {
                            setUnreadNotificationsCount(0);
                            setBellNotifications(prev => prev.map(n => ({ ...n, read: true })));
                            if (isSupabaseConfigured && profileData?.id) {
                              await dbMarkAllNotificationsRead(profileData.id);
                            }
                          }}
                          className="text-[10px] font-extrabold text-blue-600 border-0 bg-transparent cursor-pointer"
                        >
                          {currentLanguage === 'en' ? 'Mark all read' : 'سب کو پڑھا ہوا کریں'}
                        </button>
                      )}
                    </div>

                    <div className="max-h-64 overflow-y-auto divide-y divide-slate-50">
                      {bellNotifications.length === 0 ? (
                        <div className="px-4 py-6 text-center text-xs text-slate-400 font-semibold">
                          {currentLanguage === 'en' ? 'No notifications yet' : 'کوئی نئی اطلاع نہیں ہے'}
                        </div>
                      ) : (
                        bellNotifications.map((notif) => (
                          <div 
                            key={notif.id}
                            onClick={async () => {
                              setIsNotifDropdownOpen(false);
                              setBellNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n));
                              setUnreadNotificationsCount(prev => Math.max(0, prev - 1));
                              
                              if (isSupabaseConfigured) {
                                await dbMarkNotificationRead(notif.id);
                              }

                              if (notif.relatedModule === 'chat' && notif.relatedId) {
                                if ((window as any).openChat) {
                                  (window as any).openChat(notif.relatedId, notif.senderName || 'System', notif.senderAvatar);
                                } else {
                                  navigate('/chat');
                                }
                              } else if (notif.relatedModule) {
                                const path = notif.relatedModule.startsWith('/') ? notif.relatedModule : '/' + notif.relatedModule;
                                navigate(path, notif.relatedId);
                              }
                            }}
                            className={`p-3 flex gap-2.5 items-start hover:bg-slate-50 cursor-pointer transition-colors ${!notif.read ? 'bg-blue-50/10' : ''}`}
                          >
                            <ClickableAvatar 
                              userId={notif.senderId}
                              name={notif.senderName || 'System'}
                              avatar={notif.senderAvatar}
                              size={32}
                              className="shrink-0 border"
                            />
                            <div className="flex-1 min-w-0 space-y-0.5">
                              <h5 className={`text-[11px] text-slate-800 leading-snug truncate ${!notif.read ? 'font-black' : 'font-semibold'}`}>
                                {notif.title}
                              </h5>
                              <p className="text-[10px] text-slate-400 truncate leading-normal">
                                {notif.message}
                              </p>
                              <span className="text-[8px] text-slate-400 font-bold block">{notif.timeAgo}</span>
                            </div>
                            {!notif.read && (
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0 mt-1.5" />
                            )}
                          </div>
                        ))
                      )}
                    </div>

                    <button
                      onClick={() => {
                        setIsNotifDropdownOpen(false);
                        navigate('/notifications');
                      }}
                      className="w-full text-center py-2 text-[10px] font-black text-slate-500 hover:text-blue-600 border-t border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      {currentLanguage === 'en' ? 'See all notifications' : 'تمام اطلاعات دیکھیں'}
                    </button>
                  </div>
                )}
              </div>

              {/* Settings Gear Button */}
              <button
                onClick={() => navigate('/settings')}
                className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-blue-600 rounded-xl transition-all cursor-pointer border border-slate-200/40 shrink-0 flex items-center justify-center relative shadow-xs"
                title={currentLanguage === 'en' ? 'Settings' : 'ترتیبات'}
                id="header-settings-btn"
              >
                <Settings className="w-4 h-4" />
              </button>

              {/* User Avatar Quick Access */}
              <button
                onClick={() => navigate('/profile')}
                className="p-1 hover:bg-slate-100 rounded-xl transition-all cursor-pointer border border-slate-200/40 shrink-0 flex items-center gap-1"
                title={currentLanguage === 'en' ? 'View Profile' : 'پروفائل دیکھیں'}
                id="header-profile-quick-btn"
              >
                <img 
                  src={profileData?.profilePhoto || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=120'} 
                  alt={user.fullName} 
                  className="w-7 h-7 rounded-full object-cover border border-slate-200 shadow-xs" 
                />
              </button>

              {/* Mobile Logout Button */}
              <button 
                onClick={onLogout}
                title="Logout"
                className="lg:hidden p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl border border-slate-200/50 transition-all cursor-pointer shrink-0"
              >
                <LogOut className="w-4.5 h-4.5" />
              </button>
            </div>
          </div>
        </header>

        {/* MAIN CENTER CONTENT STAGE - SCROLLS SEPARATELY */}
        <main className={`flex-1 overflow-y-auto overflow-x-hidden max-w-full w-full bg-slate-50/30 ${activeTab === 'videos' ? 'p-0 md:px-6 md:py-6 md:pb-12' : activeTab === 'chat' ? 'px-0 pt-0 pb-16 md:px-6 md:py-6 md:pb-12' : 'px-4 sm:px-6 py-6 pb-24 md:pb-12'}`}>
          
          {/* Welcome/Banner component visible at top of Feed */}
          {activeTab === 'feed' && !quickAction && (
            <div className="bg-white rounded-2xl border border-slate-200/60 p-5 sm:p-6 mb-6 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-950 flex items-center gap-2">
                  {t.welcomeBack}, {user.fullName}! 👋
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  📍 {currentLanguage === 'en' ? `You are active in ${user.area}` : `آپ ${user.area} کے رہائشی زون میں ایکٹیو ہیں`} • {currentLanguage === 'en' ? 'Stay updated with your neighbors.' : 'اپنے پڑوسیوں کے ساتھ باخبر رہیں۔'}
                </p>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 border border-green-100 rounded-xl text-xs font-semibold shrink-0">
                <span className="w-2 h-2 rounded-full bg-action animate-ping" />
                {t.verifiedResident}
              </div>
            </div>
          )}

          {activeTab === 'home' && !quickAction && renderHeroSection()}

          {/* Banner Carousel Ads */}
          {activeTab === 'home' && !quickAction && activeCarouselAds.length > 0 && (() => {
            const adToShow = selectActiveAd(activeCarouselAds);
            if (!adToShow) return null;
            return (
              <div className="mb-6">
                <AdBannerCard ad={adToShow} onNavigateToModule={handleNavigateToModule} />
              </div>
            );
          })()}

          {activeTab === 'home' && !quickAction && renderQuickActions()}

          {/* Stories bar visible at top of Feed */}
          {activeTab === 'feed' && !quickAction && renderStoriesBar()}

          {/* Render category list if quick action is clicked */}
          {activeTab === 'home' && quickAction && renderCategoryList()}

          {/* TAB 1: HOME */}
          {activeTab === 'home' && !quickAction && !currentPath.startsWith('/jobs') && !currentPath.startsWith('/business') && !currentPath.startsWith('/property') && !currentPath.startsWith('/groups') && !currentPath.startsWith('/search') && !currentPath.startsWith('/settings') && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              {/* Main Column */}
              <div className="lg:col-span-2 space-y-6">
                {renderStoriesBar()}
                {renderStatusComposer()}
                {renderLostFoundComposer()}

                {/* Home Feed Ads – rotated through all active ads */}
                {activeHomeAds.length > 0 && (() => {
                  const ad = homeAdMap[0] ?? activeHomeAds[0];
                  if (!ad) return null;
                  return <AdBannerCard ad={ad} onNavigateToModule={handleNavigateToModule} />;
                })()}

              {/* JOBS PREVIEW HEADER */}
              <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-4 mt-6" id="home-jobs-preview-header">
                <div>
                  <h3 className="text-sm font-black text-slate-900 flex items-center gap-1.5 uppercase tracking-wider">
                    💼 {currentLanguage === 'en' ? 'Latest Job Opportunities' : 'ملازمت کے تازہ ترین مواقع'}
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {currentLanguage === 'en' ? 'Recent vacancies posted within your neighborhood' : 'آپ کے پڑوس میں پوسٹ کی گئی حالیہ آسامیاں'}
                  </p>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => scrollSlider('home-jobs-preview-grid', 'left')}
                    className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all cursor-pointer border-0 flex items-center justify-center"
                    aria-label="Scroll Left"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => scrollSlider('home-jobs-preview-grid', 'right')}
                    className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all cursor-pointer border-0 flex items-center justify-center"
                    aria-label="Scroll Right"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => navigate('/jobs')}
                    className="text-xs font-extrabold text-white bg-blue-600 hover:bg-blue-700 shadow-sm hover:shadow px-3.5 py-2 rounded-xl transition-all cursor-pointer border-0"
                    id="home-view-all-jobs-btn"
                  >
                    {currentLanguage === 'en' ? 'View All →' : 'تمام دیکھیں ←'}
                  </button>
                </div>
              </div>

              {/* JOBS PREVIEW CARDS (Max 5 Jobs) - Horizontal Slider */}
              <div className="flex gap-6 overflow-x-auto pb-4 pt-1 snap-x scroll-smooth scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent" id="home-jobs-preview-grid">
                {jobs?.slice(0, 5).map((job) => (
                  <div
                    key={job.id}
                    className="bg-white rounded-2xl border border-slate-200/60 p-5 hover:border-blue-300 hover:shadow-lg transition-all duration-200 flex flex-col justify-between shadow-sm relative overflow-hidden w-[290px] sm:w-[320px] md:w-[350px] shrink-0 snap-start"
                    id={`preview-job-card-${job.id}`}
                  >
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <span className="inline-flex items-center text-[10px] font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
                          {job.category || 'Other'}
                        </span>
                        <h4 
                          onClick={() => navigate('/jobs/detail', job.id)}
                          className="font-bold text-slate-900 text-base hover:text-blue-600 cursor-pointer transition-colors leading-snug line-clamp-1"
                        >
                          {job.title}
                        </h4>
                        <p className="text-[12px] text-slate-600 font-bold flex items-center gap-1.5 mt-1">
                          🏢 {job.company}
                        </p>
                      </div>

                      {/* Info elements */}
                      <div className="space-y-2 border-t border-slate-50 pt-3 text-xs text-slate-600">
                        <p className="flex items-center gap-1.5 font-bold text-blue-700 bg-blue-50/50 px-2.5 py-1 rounded-lg w-fit">
                          💰 <span className="truncate">{job.salary}</span>
                        </p>
                        <p className="flex items-center gap-1.5 text-xs text-slate-500 pl-0.5">
                          📍 {job.area || 'Dhoke Hassu'}
                        </p>
                        <p className="flex items-center gap-1.5 text-[11px] text-slate-400 pl-0.5">
                          🕒 {job.postedTime || '1 day ago'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-4 border-t border-slate-100 mt-4">
                      <button
                        onClick={() => {
                          alert(currentLanguage === 'en' 
                            ? `Contacting ${job.postedBy} at ${job.contact}`
                            : `${job.postedBy} سے اس نمبر پر رابطہ کریں: ${job.contact}`
                          );
                          window.open(`tel:${job.contact}`);
                        }}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer border-0"
                        id={`preview-job-apply-btn-${job.id}`}
                      >
                        <Phone className="w-3.5 h-3.5" />
                        {currentLanguage === 'en' ? 'Apply Now' : 'رابطہ کریں'}
                      </button>
                      
                      <button
                        onClick={() => navigate('/jobs/detail', job.id)}
                        className="py-2 px-3.5 border border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                        id={`preview-job-detail-btn-${job.id}`}
                      >
                        {currentLanguage === 'en' ? 'Details' : 'تفصیل'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* View All Button at bottom */}
              <div className="text-center pt-2" id="home-view-all-bottom-container">
                <button
                  onClick={() => navigate('/jobs')}
                  className="inline-flex items-center justify-center gap-2 py-3 px-8 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm rounded-2xl shadow-md hover:shadow-lg transition-all cursor-pointer font-bold"
                  id="home-view-all-jobs-bottom-btn"
                >
                  {currentLanguage === 'en' ? 'View All Jobs in Dhoke Hassu' : 'ڈھوک حسو کی تمام نوکریاں دیکھیں'}
                </button>
              </div>

              {/* FEATURED BUSINESSES SECTION */}
              <div className="space-y-6 pt-6 border-t border-slate-100">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3" id="home-business-preview-header">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5 uppercase tracking-wider">
                      🏪 {currentLanguage === 'en' ? 'Featured Local Businesses' : 'نمایاں مقامی کاروبار'}
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {currentLanguage === 'en' ? 'Highly recommended shops and services in Dhoke Hassu' : 'ڈھوک حسو میں سب سے زیادہ تجویز کردہ دکانیں اور خدمات'}
                    </p>
                  </div>
                  
                  <button
                    onClick={() => navigate('/businesses')}
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-xl transition-all cursor-pointer font-bold"
                    id="home-view-all-business-btn"
                  >
                    {currentLanguage === 'en' ? 'View All →' : 'تمام دیکھیں ←'}
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4" id="home-business-preview-grid">
                  {businesses.filter(b => b.featured)?.slice(0, 5).map((bus) => (
                    <div
                      key={bus.id}
                      className="bg-white rounded-2xl border border-slate-200/60 p-3 hover:border-blue-300 hover:shadow-md transition-all duration-200 flex flex-col justify-between shadow-sm relative overflow-hidden"
                      id={`preview-business-card-${bus.id}`}
                    >
                      <div className="space-y-2.5">
                        <div className="relative w-full h-24 bg-slate-100 rounded-lg overflow-hidden">
                          <img 
                            src={bus.image || 'https://images.unsplash.com/photo-1528698827591-e19ccd7bc23d?auto=format&fit=crop&q=80&w=400'} 
                            alt={bus.name} 
                            className="w-full h-full object-cover"
                          />
                          <span className="absolute bottom-1.5 right-1.5 bg-black/75 text-white text-[8px] font-extrabold px-1 py-0.5 rounded flex items-center gap-0.5 backdrop-blur-xs">
                            ⭐ {bus.rating.toFixed(1)}
                          </span>
                        </div>

                        <div className="space-y-1">
                          <span className="inline-flex items-center text-[8px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">
                            {bus.category}
                          </span>
                          <h4 
                            onClick={() => navigate('/businesses/detail', bus.id)}
                            className="font-extrabold text-slate-900 text-xs hover:text-blue-600 cursor-pointer transition-colors leading-tight line-clamp-1"
                          >
                            {bus.name}
                          </h4>
                          <p className="text-[9px] text-slate-500 font-semibold flex items-center gap-0.5 truncate">
                            📍 {bus.area || bus.address}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 pt-2 border-t border-slate-100 mt-3">
                        <button
                          onClick={() => {
                            alert(currentLanguage === 'en' 
                              ? `Contacting ${bus.name} at ${bus.contact}`
                              : `${bus.name} سے اس نمبر پر رابطہ کریں: ${bus.contact}`
                            );
                            window.open(`tel:${bus.contact}`);
                          }}
                          className="flex-1 flex items-center justify-center gap-1 py-1 px-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[9px] font-bold rounded-lg shadow-sm transition-all cursor-pointer border-0"
                          id={`preview-bus-call-btn-${bus.id}`}
                        >
                          <Phone className="w-2.5 h-2.5" />
                          {currentLanguage === 'en' ? 'Call' : 'رابطہ کریں'}
                        </button>
                        
                        <button
                          onClick={() => navigate('/businesses/detail', bus.id)}
                          className="py-1 px-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg text-[9px] font-semibold transition-all cursor-pointer font-bold"
                          id={`preview-bus-detail-btn-${bus.id}`}
                        >
                          {currentLanguage === 'en' ? 'Details' : 'تفصیل'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="text-center pt-2" id="home-business-view-all-bottom-container">
                  <button
                    onClick={() => navigate('/businesses')}
                    className="inline-flex items-center justify-center gap-2 py-3 px-8 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm rounded-2xl shadow-md hover:shadow-lg transition-all cursor-pointer font-bold"
                    id="home-view-all-business-bottom-btn"
                  >
                    {currentLanguage === 'en' ? 'View All Businesses in Dhoke Hassu' : 'ڈھوک حسو کے تمام کاروبار دیکھیں'}
                  </button>
                </div>
              </div>

              {/* PROPERTY HIGHLIGHTS SECTION (FEATURED PROPERTIES) */}
              <div className="space-y-6 pt-6 border-t border-slate-100" id="home-property-highlights-section">
                
              {/* INJECTED SECTION AD 0 */}
              {homeSectionsAdMap[1] && (
                <div className="py-2 border-t border-slate-100">
                  <AdBannerCard ad={homeSectionsAdMap[1]} onNavigateToModule={handleNavigateToModule} />
                </div>
              )}

              <div className="flex items-center justify-between border-b border-slate-100 pb-3" id="home-property-preview-header">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5 uppercase tracking-wider">
                      🏠 {currentLanguage === 'en' ? 'Featured Properties' : 'منتخب جائیدادیں'}
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {currentLanguage === 'en' ? 'Latest verified top properties and homes in Dhoke Hassu' : 'ڈھوک حسو میں حالیہ تصدیق شدہ بہترین جائیدادیں اور مکانات'}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => scrollSlider('home-property-preview-grid', 'left')}
                      className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all cursor-pointer border-0 flex items-center justify-center"
                      aria-label="Scroll Left"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => scrollSlider('home-property-preview-grid', 'right')}
                      className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all cursor-pointer border-0 flex items-center justify-center"
                      aria-label="Scroll Right"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => navigate('/property')}
                      className="text-xs font-extrabold text-white bg-blue-600 hover:bg-blue-700 shadow-sm hover:shadow px-3.5 py-2 rounded-xl transition-all cursor-pointer border-0"
                      id="home-view-all-property-btn"
                    >
                      {currentLanguage === 'en' ? 'View All →' : 'تمام دیکھیں ←'}
                    </button>
                  </div>
                </div>

                <div className="flex gap-6 overflow-x-auto pb-4 pt-1 snap-x scroll-smooth scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent" id="home-property-preview-grid">
                  {properties?.slice(0, 5).map((prop) => {
                    const hasImages = prop.images && prop.images.length > 0;
                    const displayImg = hasImages ? prop.images![0] : 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&q=80&w=400';
                    return (
                      <div
                        key={prop.id}
                        className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden hover:border-blue-300 hover:shadow-lg transition-all duration-200 flex flex-col justify-between shadow-sm relative group w-[290px] sm:w-[320px] md:w-[350px] shrink-0 snap-start"
                        id={`home-preview-property-card-${prop.id}`}
                      >
                        <div className="relative aspect-video bg-slate-100 overflow-hidden">
                          <img 
                            src={displayImg} 
                            alt={prop.title} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <span className="absolute top-2.5 left-2.5 bg-black/75 text-white text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider backdrop-blur-xs">
                            {prop.purpose === 'Rent' ? (currentLanguage === 'en' ? 'Rent' : 'کرایہ') : (currentLanguage === 'en' ? 'Sale' : 'فروخت')}
                          </span>
                          <div className="absolute bottom-2 left-2 bg-blue-600 text-white text-xs font-black px-2.5 py-1 rounded-lg shadow-sm">
                            {prop.price}
                          </div>
                        </div>

                        <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                          <div className="space-y-1.5">
                            <span className="inline-flex items-center text-[10px] font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
                              {prop.type}
                            </span>
                            <h4 
                              onClick={() => navigate('/property/detail', prop.id)}
                              className="font-bold text-slate-900 text-sm hover:text-blue-600 cursor-pointer transition-colors leading-snug line-clamp-2"
                            >
                              {prop.title}
                            </h4>
                            <p className="text-xs text-slate-500 font-semibold flex items-center gap-1.5">
                              📍 {prop.location}
                            </p>
                          </div>

                          <div className="flex items-center gap-2 pt-2.5 border-t border-slate-100">
                            <button
                              onClick={() => {
                                alert(currentLanguage === 'en' 
                                  ? `Dialing owner at ${prop.contact}`
                                  : `مالک سے اس نمبر پر رابطہ کریں: ${prop.contact}`
                                );
                                window.open(`tel:${prop.contact}`);
                              }}
                              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer border-0"
                              id={`home-preview-prop-call-btn-${prop.id}`}
                            >
                              <Phone className="w-3.5 h-3.5" />
                              {currentLanguage === 'en' ? 'Call' : 'رابطہ'}
                            </button>
                            
                            <button
                              onClick={() => navigate('/property/detail', prop.id)}
                              className="py-1.5 px-3 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-semibold transition-all cursor-pointer font-bold"
                              id={`home-preview-prop-detail-btn-${prop.id}`}
                            >
                              {currentLanguage === 'en' ? 'Details' : 'تفصیل'}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="text-center pt-2" id="home-property-view-all-bottom-container">
                  <button
                    onClick={() => navigate('/property')}
                    className="inline-flex items-center justify-center gap-2 py-3 px-8 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm rounded-2xl shadow-md hover:shadow-lg transition-all cursor-pointer font-bold border-0"
                    id="home-view-all-property-bottom-btn"
                  >
                    {currentLanguage === 'en' ? 'View All Properties in Dhoke Hassu' : 'ڈھوک حسو کی تمام جائیدادیں دیکھیں'}
                  </button>
                </div>
              </div>

              {/* TRENDING DEALS SECTION */}
              <div className="space-y-6 pt-6 border-t border-slate-100" id="home-trending-deals-section">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3" id="home-deals-preview-header">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5 uppercase tracking-wider">
                      🔥 {currentLanguage === 'en' ? 'Trending Deals & Offers' : 'ڈیلز اور آفرز'}
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {currentLanguage === 'en' ? 'Latest money-saving discounts and commercial offers in Dhoke Hassu' : 'ڈھوک حسو میں حالیہ بچت ڈسکاؤنٹس اور کاروباری آفرز'}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => scrollSlider('home-deals-preview-grid', 'left')}
                      className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all cursor-pointer border-0 flex items-center justify-center"
                      aria-label="Scroll Left"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => scrollSlider('home-deals-preview-grid', 'right')}
                      className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all cursor-pointer border-0 flex items-center justify-center"
                      aria-label="Scroll Right"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => navigate('/deals')}
                      className="text-xs font-extrabold text-white bg-blue-600 hover:bg-blue-700 shadow-sm hover:shadow px-3.5 py-2 rounded-xl transition-all cursor-pointer border-0"
                      id="home-view-all-deals-btn"
                    >
                      {currentLanguage === 'en' ? 'View All →' : 'تمام دیکھیں ←'}
                    </button>
                  </div>
                </div>

                <div className="flex gap-6 overflow-x-auto pb-4 pt-1 snap-x scroll-smooth scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent" id="home-deals-preview-grid">
                  {deals?.slice(0, 5).map((deal) => {
                    const displayImg = deal.images && deal.images.length > 0 ? deal.images[0] : 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&q=80&w=400';
                    return (
                      <div
                        key={deal.id}
                        className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden hover:border-blue-300 hover:shadow-lg transition-all duration-200 flex flex-col justify-between shadow-sm relative group w-[290px] sm:w-[320px] md:w-[350px] shrink-0 snap-start"
                        id={`home-preview-deal-card-${deal.id}`}
                      >
                        <div className="relative aspect-video bg-slate-100 overflow-hidden">
                          <img 
                            src={displayImg} 
                            alt={deal.title} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <span className="absolute top-2.5 left-2.5 bg-green-600 text-white text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider backdrop-blur-xs">
                            {deal.category}
                          </span>
                          <div className="absolute bottom-2 left-2 bg-emerald-500 text-white text-xs font-black px-2.5 py-1 rounded-lg shadow-sm">
                            {deal.discountText}
                          </div>
                        </div>

                        <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                          <div className="space-y-1.5">
                            <span className="inline-flex items-center text-[10px] font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
                              🏢 {deal.businessName}
                            </span>
                            <h4 
                              onClick={() => navigate('/deals/detail', deal.id)}
                              className="font-bold text-slate-900 text-sm hover:text-blue-600 cursor-pointer transition-colors leading-snug line-clamp-2"
                            >
                              {deal.title}
                            </h4>
                            <p className="text-xs text-slate-500 font-semibold flex items-center gap-1.5">
                              📍 {deal.area}
                            </p>
                          </div>

                          <div className="flex items-center gap-2 pt-2.5 border-t border-slate-100">
                            <button
                              onClick={() => {
                                alert(currentLanguage === 'en' 
                                  ? `Dialing store at ${deal.contact}`
                                  : `کاروبار سے اس نمبر پر رابطہ کریں: ${deal.contact}`
                                );
                                window.open(`tel:${deal.contact}`);
                              }}
                              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer border-0"
                              id={`home-preview-deal-call-btn-${deal.id}`}
                            >
                              <Phone className="w-3.5 h-3.5" />
                              {currentLanguage === 'en' ? 'Call' : 'رابطہ'}
                            </button>
                            
                            <button
                              onClick={() => navigate('/deals/detail', deal.id)}
                              className="py-1.5 px-3 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-semibold transition-all cursor-pointer font-bold"
                              id={`home-preview-deal-detail-btn-${deal.id}`}
                            >
                              {currentLanguage === 'en' ? 'Details' : 'تفصیل'}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="text-center pt-2" id="home-deals-view-all-bottom-container">
                  <button
                    onClick={() => navigate('/deals')}
                    className="inline-flex items-center justify-center gap-2 py-3 px-8 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm rounded-2xl shadow-md hover:shadow-lg transition-all cursor-pointer font-bold border-0"
                    id="home-view-all-deals-bottom-btn"
                  >
                    {currentLanguage === 'en' ? 'View All Trending Deals & Coupons' : 'ڈھوک حسو کے تمام کوپنز دیکھیں'}
                  </button>
                </div>
              </div>
{/* MARKETPLACE HIGHLIGHTS SECTION */}
              <div className="space-y-6 pt-6 border-t border-slate-100" id="home-marketplace-highlights-section">
                
              {/* INJECTED SECTION AD 1 */}
              {homeSectionsAdMap[3] && (
                <div className="py-2 border-t border-slate-100">
                  <AdBannerCard ad={homeSectionsAdMap[3]} onNavigateToModule={handleNavigateToModule} />
                </div>
              )}

              <div className="flex items-center justify-between border-b border-slate-100 pb-3" id="home-marketplace-preview-header">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5 uppercase tracking-wider">
                      🛍️ {currentLanguage === 'en' ? 'Buy & Sell Deals' : 'خرید و فروخت کے سودے'}
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {currentLanguage === 'en' ? 'Top bargain items listed recently in Dhoke Hassu' : 'ڈھوک حسو میں حال ہی میں شامل کی گئی بہترین اشیاء'}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => scrollSlider('home-marketplace-preview-grid', 'left')}
                      className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all cursor-pointer border-0 flex items-center justify-center"
                      aria-label="Scroll Left"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => scrollSlider('home-marketplace-preview-grid', 'right')}
                      className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all cursor-pointer border-0 flex items-center justify-center"
                      aria-label="Scroll Right"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => navigate('/marketplace')}
                      className="text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-xl transition-all cursor-pointer font-bold"
                      id="home-view-all-marketplace-btn"
                    >
                      {currentLanguage === 'en' ? 'View All →' : 'تمام دیکھیں ←'}
                    </button>
                  </div>
                </div>

                <div className="flex gap-6 overflow-x-auto pb-4 pt-1 snap-x scroll-smooth scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent" id="home-marketplace-preview-grid">
                  {marketplaceItems?.slice(0, 5).map((item) => {
                    return (
                      <div
                        key={item.id}
                        onClick={() => navigate('/marketplace/detail', item.id)}
                        className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden hover:border-[#2563eb]/60 hover:shadow-md transition-all duration-200 flex flex-col justify-between shadow-sm relative group cursor-pointer w-[290px] sm:w-[320px] md:w-[350px] shrink-0 snap-start"
                        id={`home-preview-marketplace-card-${item.id}`}
                      >
                        <div className="relative aspect-video bg-slate-100 overflow-hidden">
                          <img 
                            src={item.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=400'} 
                            alt={item.title} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            referrerPolicy="no-referrer"
                          />
                          <span className="absolute top-2.5 left-2.5 bg-[#2563eb] text-white text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                            {item.category}
                          </span>
                          <div className="absolute bottom-2 left-2 bg-[#22c55e] text-white text-[10px] font-black px-2 py-1 rounded-lg shadow-sm">
                            {item.price}
                          </div>
                        </div>

                        <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                          <div className="space-y-1.5">
                            <h4 className="font-extrabold text-slate-900 text-xs hover:text-[#2563eb] cursor-pointer transition-colors leading-tight line-clamp-1">
                              {item.title}
                            </h4>
                            <div className="flex items-center justify-between text-[10px] text-slate-500 font-semibold mt-0.5">
                              <span>👤 {item.sellerName}</span>
                              <span>📍 {item.area}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 pt-2.5 border-t border-slate-100">
                            <button
                              onClick={(e) => {
                                  e.stopPropagation();
                                  if ((window as any).openChat) {
                                    (window as any).openChat(item.contact, item.sellerName, '');
                                  } else {
                                    alert(currentLanguage === 'en' 
                                      ? `Opening simulated secure chat with ${item.sellerName}`
                                      : `فروخت کنندہ کے ساتھ گفتگو شروع کریں`
                                    );
                                  }
                              }}
                              className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 bg-[#2563eb] hover:bg-blue-600 text-white text-[10px] font-bold rounded-lg shadow-sm transition-all cursor-pointer border-0"
                              id={`home-preview-market-chat-btn-${item.id}`}
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                              {currentLanguage === 'en' ? 'Chat' : 'چیٹ'}
                            </button>
                            
                            <button
                              onClick={() => navigate('/marketplace/detail', item.id)}
                              className="py-1.5 px-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg text-[10px] font-semibold transition-all cursor-pointer font-bold"
                              id={`home-preview-market-detail-btn-${item.id}`}
                            >
                              {currentLanguage === 'en' ? 'View' : 'دیکھیں'}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="text-center pt-2 pb-4" id="home-marketplace-view-all-bottom-container">
                  <button
                    onClick={() => navigate('/marketplace')}
                    className="inline-flex items-center justify-center gap-2 py-3 px-8 bg-[#2563eb] hover:bg-blue-600 text-white font-extrabold text-sm rounded-2xl shadow-md hover:shadow-lg transition-all cursor-pointer font-bold"
                    id="home-view-all-marketplace-bottom-btn"
                  >
                    {currentLanguage === 'en' ? 'Browse Buy & Sell Deals' : 'خرید و فروخت کے سودے براؤز کریں'}
                  </button>
                </div>
              </div>

              {/* LOCAL SERVICES HIGHLIGHTS SECTION */}
              <div className="space-y-6 pt-6 border-t border-slate-100" id="home-services-highlights-section">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3" id="home-services-preview-header">
                  <div>
                    <h3 className="text-sm font-black text-slate-900 flex items-center gap-1.5 uppercase tracking-wider">
                      🛠️ {currentLanguage === 'en' ? 'Popular Services' : 'مقبول سروسز'}
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {currentLanguage === 'en' ? 'Latest verified top services and experts in Dhoke Hassu' : 'ڈھوک حسو میں حالیہ تصدیق شدہ بہترین سروسز اور ماہرین'}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => scrollSlider('home-services-preview-grid', 'left')}
                      className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all cursor-pointer border-0 flex items-center justify-center"
                      aria-label="Scroll Left"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => scrollSlider('home-services-preview-grid', 'right')}
                      className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all cursor-pointer border-0 flex items-center justify-center"
                      aria-label="Scroll Right"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => navigate('/services')}
                      className="text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-xl transition-all cursor-pointer font-bold"
                      id="home-view-all-services-btn"
                    >
                      {currentLanguage === 'en' ? 'View All →' : 'تمام دیکھیں ←'}
                    </button>
                  </div>
                </div>

                <div className="flex gap-6 overflow-x-auto pb-4 pt-1 snap-x scroll-smooth scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent" id="home-services-preview-grid">
                  {services?.slice(0, 5).map((item) => {
                    const isAvailable = item.availability === 'Available';
                    return (
                      <div
                        key={item.id}
                        onClick={() => navigate('/services/detail', item.id)}
                        className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden hover:border-[#2563eb]/60 hover:shadow-md transition-all duration-200 flex flex-col justify-between shadow-sm relative group cursor-pointer w-[240px] sm:w-[260px] md:w-[280px] shrink-0 snap-start"
                        id={`home-preview-service-card-${item.id}`}
                      >
                        <div className="relative aspect-video bg-slate-100 overflow-hidden">
                          <img 
                            src={item.image || 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?auto=format&fit=crop&q=80&w=400'} 
                            alt={item.name} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            referrerPolicy="no-referrer"
                          />
                          <span className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider shadow-sm flex items-center gap-1 ${
                            isAvailable ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
                          }`}>
                            {isAvailable ? (currentLanguage === 'en' ? 'Available' : 'دستیاب') : (currentLanguage === 'en' ? 'Busy' : 'مصروف')}
                          </span>
                          <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-xs text-white text-[8px] font-bold px-1.5 py-0.5 rounded-md">
                            🎓 {item.experience}
                          </div>
                        </div>

                        <div className="p-3.5 space-y-2 flex-1 flex flex-col justify-between font-sans">
                          <div className="space-y-1">
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-[8px] font-black text-[#2563eb] bg-blue-50 px-1.5 py-0.5 rounded-md uppercase tracking-wide truncate max-w-[70px]">
                                {item.category}
                              </span>
                              <span className="text-[9px] font-black text-amber-500 flex items-center shrink-0">★ {item.rating.toFixed(1)}</span>
                            </div>
                            
                            <h4 className="font-extrabold text-slate-950 text-xs hover:text-[#2563eb] cursor-pointer transition-colors leading-tight line-clamp-1">
                              {item.title || item.category}
                            </h4>

                            <p className="text-[10px] text-slate-500 font-bold truncate">
                              👤 {item.name}
                            </p>
                            
                            <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed font-medium">
                              {item.description}
                            </p>
                          </div>

                          <div className="flex items-center gap-1.5 pt-2.5 border-t border-slate-100">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate('/services/detail', item.id);
                              }}
                              className="flex-1 py-1 px-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-[9px] font-black rounded-lg transition-all cursor-pointer"
                              id={`home-preview-service-view-btn-${item.id}`}
                            >
                              {currentLanguage === 'en' ? 'View' : 'دیکھیں'}
                            </button>
                            
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate('/services/detail', item.id);
                              }}
                              className="flex-1 py-1 px-1 bg-blue-600 hover:bg-blue-700 text-white text-[9px] font-black rounded-lg shadow-xs transition-all cursor-pointer border-0"
                              id={`home-preview-service-book-btn-${item.id}`}
                            >
                              {currentLanguage === 'en' ? 'Book' : 'بکنگ'}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="text-center pt-2 pb-4" id="home-services-view-all-bottom-container">
                  <button
                    onClick={() => navigate('/services')}
                    className="inline-flex items-center justify-center gap-2 py-3 px-8 bg-[#2563eb] hover:bg-blue-600 text-white font-extrabold text-sm rounded-2xl shadow-md hover:shadow-lg transition-all cursor-pointer font-bold border-0"
                    id="home-view-all-services-bottom-btn"
                  >
                    {currentLanguage === 'en' ? 'View All Local Experts' : 'تمام مقامی ماہرین کی لسٹ دیکھیں'}
                  </button>
                </div>
              </div>

              
              {/* INJECTED SECTION AD 2 */}
              {homeSectionsAdMap[5] && (
                <div className="py-2 border-t border-slate-100">
                  <AdBannerCard ad={homeSectionsAdMap[5]} onNavigateToModule={handleNavigateToModule} />
                </div>
              )}

              {/* AREA ALERTS PREVIEW SECTION */}
              <div className="space-y-6 pt-6 border-t border-slate-100" id="home-alerts-preview-section">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3" id="home-alerts-preview-header">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5 uppercase tracking-wider">
                      🚨 {currentLanguage === 'en' ? 'Area Alerts' : 'علاقائی الرٹس'}
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {currentLanguage === 'en' ? 'Stay updated with critical neighborhood alerts in Dhoke Hassu' : 'ڈھوک حسو میں اہم علاقائی مسائل اور ہنگامی حالات سے باخبر رہیں'}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => scrollSlider('home-alerts-preview-grid', 'left')}
                      className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all cursor-pointer border-0 flex items-center justify-center"
                      aria-label="Scroll Left"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => scrollSlider('home-alerts-preview-grid', 'right')}
                      className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all cursor-pointer border-0 flex items-center justify-center"
                      aria-label="Scroll Right"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => navigate('/alerts')}
                      className="text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-xl transition-all cursor-pointer font-bold"
                      id="home-view-all-alerts-btn"
                    >
                      {currentLanguage === 'en' ? 'View All →' : 'تمام دیکھیں ←'}
                    </button>
                  </div>
                </div>

                <div className="flex gap-6 overflow-x-auto pb-4 pt-1 snap-x scroll-smooth scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent" id="home-alerts-preview-grid">
                  {alerts.filter(item => item.status !== 'Pending' && item.status !== 'Rejected')?.slice(0, 5).map((item) => {
                    const isCritical = item.priority === 'Critical' || item.severity === 'Urgent';
                    const isHigh = item.priority === 'High';
                    const isNormal = item.priority === 'Normal' || (!isCritical && !isHigh);

                    const severityColor = isCritical ? 'bg-red-500' : isHigh ? 'bg-amber-500' : 'bg-blue-500';
                    const severityBg = isCritical 
                      ? 'bg-red-50 text-red-700 border-red-150' 
                      : isHigh 
                      ? 'bg-amber-50 text-amber-700 border-amber-100' 
                      : 'bg-blue-50 text-blue-700 border-blue-100';

                    return (
                      <div
                        key={item.id}
                        onClick={() => navigate('/alerts/detail', item.id)}
                        className={`bg-white rounded-2xl p-4 hover:shadow-md transition-all duration-200 flex flex-col justify-between shadow-sm relative group cursor-pointer w-[240px] sm:w-[260px] md:w-[280px] shrink-0 snap-start ${
                          isCritical 
                            ? 'border-2 border-red-500 hover:border-red-600 shadow-red-50/50' 
                            : 'border border-slate-200/60 hover:border-[#2563eb]/60'
                        }`}
                        id={`home-preview-alert-card-${item.id}`}
                      >
                        <div className="space-y-2.5">
                          <div className="flex items-center justify-between">
                            <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider border flex items-center gap-1 ${severityBg}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${severityColor} ${isCritical ? 'animate-ping' : 'animate-pulse'}`} />
                              {currentLanguage === 'en' 
                                ? (item.priority || item.severity) 
                                : (isCritical ? 'انتہائی اہم' : isHigh ? 'اہم' : 'معمولی')}
                            </span>
                            <span className="text-[9px] font-extrabold text-[#2563eb]">
                              #{item.category}
                            </span>
                          </div>

                          <h4 className={`font-extrabold text-xs line-clamp-2 leading-tight transition-colors ${
                            isCritical ? 'text-red-700 group-hover:text-red-800' : 'text-slate-900 group-hover:text-[#2563eb]'
                          }`}>
                            {item.title}
                          </h4>

                          <p className="text-[10px] text-slate-500 line-clamp-2">
                            {item.description}
                          </p>
                        </div>

                        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[9px] text-slate-400 font-bold font-mono">
                          <span className="flex items-center gap-1 text-slate-600 font-sans truncate">
                            📍 {item.area}
                          </span>
                          <span className="shrink-0">
                            ⏱️ {item.postedTime}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="text-center pt-2 pb-4" id="home-alerts-view-all-bottom-container">
                  <button
                    onClick={() => navigate('/alerts')}
                    className="inline-flex items-center justify-center gap-2 py-3 px-8 bg-[#2563eb] hover:bg-blue-600 text-white font-extrabold text-sm rounded-2xl shadow-md hover:shadow-lg transition-all cursor-pointer font-bold"
                    id="home-view-all-alerts-bottom-btn"
                  >
                    {currentLanguage === 'en' ? 'View All Active Alerts' : 'تمام فعال الرٹس دیکھیں'}
                  </button>
                </div>
              </div>

              {/* UPCOMING EVENTS HIGHLIGHTS SECTION */}
              <div className="space-y-6 pt-6 border-t border-slate-100" id="home-events-highlights-section">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3" id="home-events-preview-header">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5 uppercase tracking-wider">
                      📅 {currentLanguage === 'en' ? 'Upcoming Local Events' : 'آنے والی مقامی تقریبات'}
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {currentLanguage === 'en' ? 'Sports, festivals, religious, and IT workshops in Dhoke Hassu' : 'ڈھوک حسو میں کھیل، تہوار، مذہبی اجتماعات اور آئی ٹی ورکشاپس'}
                    </p>
                  </div>
                  
                  <button
                    onClick={() => navigate('/events')}
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-xl transition-all cursor-pointer font-bold"
                    id="home-view-all-events-btn"
                  >
                    {currentLanguage === 'en' ? 'View All →' : 'تمام دیکھیں ←'}
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4" id="home-events-preview-grid">
                  {events?.slice(0, 3).map((item) => {
                    return (
                      <div
                        key={item.id}
                        onClick={() => navigate('/events/detail', item.id)}
                        className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden hover:border-[#2563eb]/60 hover:shadow-md transition-all duration-200 flex flex-col justify-between shadow-sm relative group cursor-pointer"
                        id={`home-preview-event-card-${item.id}`}
                      >
                        <div className="relative aspect-video bg-slate-100 overflow-hidden">
                          <img 
                            src={item.coverImage} 
                            alt={item.title} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            referrerPolicy="no-referrer"
                          />
                          <span className="absolute top-2.5 left-2.5 bg-[#2563eb]/90 text-white text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                            {item.category}
                          </span>
                          <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-xs text-white text-[9px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                            📅 {item.date}
                          </div>
                        </div>

                        <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                          <div className="space-y-1.5 font-sans">
                            <h4 className="font-extrabold text-slate-900 text-xs hover:text-[#2563eb] cursor-pointer transition-colors leading-tight line-clamp-1">
                              {item.title}
                            </h4>
                            <div className="flex items-center justify-between text-[10px] text-slate-500 font-semibold mt-0.5">
                              <span>👤 {item.organizerName}</span>
                              <span>📍 {item.area}</span>
                            </div>
                            <p className="text-[10px] text-slate-500 line-clamp-2 leading-relaxed mt-1">
                              {item.description}
                            </p>
                          </div>

                          <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 pt-2 border-t border-slate-100">
                            <span>⏱️ {item.startTime}</span>
                            <span className="text-emerald-600 font-extrabold font-mono">🔥 {item.interestedCount} Interested</span>
                          </div>

                          <div className="flex items-center gap-2 pt-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate('/events/detail', item.id);
                              }}
                              className="flex-1 py-1.5 px-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-[10px] font-bold rounded-lg transition-all cursor-pointer"
                              id={`home-preview-event-view-btn-${item.id}`}
                            >
                              {currentLanguage === 'en' ? 'View' : 'دیکھیں'}
                            </button>
                            
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate('/events/detail', item.id);
                              }}
                              className="flex-1 py-1.5 px-2 bg-[#2563eb] hover:bg-blue-600 text-white text-[10px] font-bold rounded-lg shadow-sm transition-all cursor-pointer border-0"
                              id={`home-preview-event-rsvp-btn-${item.id}`}
                            >
                              {currentLanguage === 'en' ? 'RSVP' : 'شرکت'}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="text-center pt-2 pb-4" id="home-events-view-all-bottom-container">
                  <button
                    onClick={() => navigate('/events')}
                    className="inline-flex items-center justify-center gap-2 py-3 px-8 bg-[#2563eb] hover:bg-blue-600 text-white font-extrabold text-sm rounded-2xl shadow-md hover:shadow-lg transition-all cursor-pointer font-bold"
                    id="home-view-all-events-bottom-btn"
                  >
                    {currentLanguage === 'en' ? 'View All Local Events' : 'تمام مقامی تقریبات دیکھیں'}
                  </button>
                </div>
              </div>

              {/* SUGGESTED GROUPS SECTION */}
              <div className="space-y-4 mt-8 pt-6 border-t border-slate-200/60" id="home-suggested-groups-section">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5 uppercase tracking-wider">
                      👥 {currentLanguage === 'en' ? 'Suggested Groups' : 'تجویز کردہ کمیونٹی گروپس'}
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {currentLanguage === 'en' ? 'Connect with your neighborhood community groups' : 'اپنے پڑوس کے لوکل کمیونٹی گروپس میں شامل ہوں'}
                    </p>
                  </div>
                  
                  <button
                    onClick={() => navigate('/groups')}
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-xl transition-all cursor-pointer font-bold border-0"
                    id="home-view-all-groups-btn"
                  >
                    {currentLanguage === 'en' ? 'View All →' : 'تمام دیکھیں ←'}
                  </button>
                </div>

                
              {/* INJECTED SECTION AD 3 */}
              {homeSectionsAdMap[7] && (
                <div className="py-2 border-t border-slate-100">
                  <AdBannerCard ad={homeSectionsAdMap[7]} onNavigateToModule={handleNavigateToModule} />
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4" id="home-groups-preview-grid">
                  {groups?.slice(0, 5).map((group) => {
                    const isMember = group.members.includes(profileData.fullName);
                    const isRequested = group.requests?.includes(profileData.fullName);
                    const localCatsUr = {
                      'Neighborhood': 'پڑوس / محلہ',
                      'Business': 'کاروبار',
                      'Education': 'تعلیم',
                      'Sports': 'کھیل',
                      'Religious': 'مذہبی',
                      'Volunteers': 'رضاکار',
                      'Buy & Sell': 'خرید و فروخت',
                      'Other': 'دیگر'
                    };
                    const catLabel = currentLanguage === 'ur' ? (localCatsUr[group.category as keyof typeof localCatsUr] || group.category) : group.category;

                    return (
                      <div
                        key={group.id}
                        className="bg-white rounded-2xl border border-slate-200/60 p-4 hover:border-blue-300 hover:shadow-md transition-all duration-200 flex flex-col justify-between shadow-sm relative overflow-hidden cursor-pointer"
                        id={`preview-group-card-${group.id}`}
                        onClick={() => {
                          setSelectedGroupId(group.id);
                          navigate('/groups/detail', group.id);
                        }}
                      >
                        <div className="space-y-2">
                          <div className="relative h-24 rounded-lg overflow-hidden bg-slate-100">
                            <img src={group.coverImage} alt={group.name} className="w-full h-full object-cover" />
                            <span className="absolute bottom-1.5 left-1.5 text-[8px] bg-slate-900/80 text-white px-2 py-0.5 rounded font-black">
                              {catLabel}
                            </span>
                          </div>

                          <div className="space-y-1">
                            <h4 className="font-bold text-slate-900 text-xs hover:text-blue-600 transition-colors line-clamp-1 leading-tight">
                              {group.name}
                            </h4>
                            <p className="text-[10px] text-slate-500 font-medium flex items-center gap-0.5 truncate">
                              📍 {group.area}
                            </p>
                            <p className="text-[9px] text-slate-400 font-bold flex items-center gap-1">
                              👥 {group.memberCount} {currentLanguage === 'en' ? 'members' : 'ممبرز'}
                            </p>
                          </div>
                        </div>

                        <div className="pt-3 border-t border-slate-100 mt-3 flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const updatedGroups = groups.map(g => {
                                if (g.id === group.id) {
                                  if (isMember) {
                                    const newMembers = g.members.filter(m => m !== profileData.fullName);
                                    return {
                                      ...g,
                                      members: newMembers,
                                      memberCount: Math.max(0, g.memberCount - 1)
                                    };
                                  } else if (isRequested) {
                                    return {
                                      ...g,
                                      requests: g.requests?.filter(r => r !== profileData.fullName) || []
                                    };
                                  } else {
                                    if (g.privacy === 'Private') {
                                      const currentReqs = g.requests || [];
                                      return { ...g, requests: [...currentReqs, profileData.fullName] };
                                    } else {
                                      return {
                                        ...g,
                                        members: [...g.members, profileData.fullName],
                                        memberCount: g.memberCount + 1
                                      };
                                    }
                                  }
                                }
                                return g;
                              });
                              setGroups(updatedGroups);

                              if (isMember) {
                                alert(currentLanguage === 'en' ? `Left "${group.name}".` : 'گروپ چھوڑ دیا۔');
                              } else if (group.privacy === 'Private') {
                                alert(currentLanguage === 'en' ? 'Join request sent!' : 'درخواست بھیج دی گئی ہے۔');
                              } else {
                                alert(currentLanguage === 'en' ? `Joined "${group.name}"!` : 'شامل ہو گئے!');
                              }
                            }}
                            className={`w-full py-1.5 px-2 text-[10px] font-bold rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer border-0 ${
                              isMember 
                                ? 'bg-slate-100 hover:bg-slate-200 text-slate-700' 
                                : isRequested 
                                ? 'bg-amber-50 text-amber-700' 
                                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs'
                            }`}
                          >
                            {isMember ? (
                              <span>{currentLanguage === 'en' ? 'Joined' : 'شامل ہیں'}</span>
                            ) : isRequested ? (
                              <span>{currentLanguage === 'en' ? 'Pending' : 'زیر التوا'}</span>
                            ) : (
                              <span>{currentLanguage === 'en' ? 'Join' : 'شامل ہوں'}</span>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="text-center pt-2 pb-4" id="home-groups-view-all-bottom-container">
                  <button
                    onClick={() => navigate('/groups')}
                    className="inline-flex items-center justify-center gap-2 py-3 px-8 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-2xl shadow-md hover:shadow-lg transition-all cursor-pointer font-bold border-0"
                    id="home-view-all-groups-bottom-btn"
                  >
                    {currentLanguage === 'en' ? 'View All Community Groups' : 'تمام کمیونٹی گروپس دیکھیں'}
                  </button>
                </div>
              </div>
            </div>

            {/* Sidebar Column */}
              <div className="space-y-6">
                {renderCommunityStats()}
                {renderTrendingSidebarDeals()}
              </div>
            </div>
          )}

          {/* JOBS MODULE RENDERER */}
          {currentPath.startsWith('/jobs') && (
            <JobsModule
              jobs={jobs}
              onAddJob={handleAddJob}
              currentLanguage={currentLanguage}
              onNavigateToPost={() => navigate('/jobs/post')}
              onNavigateToList={() => navigate('/jobs')}
              onNavigateToDetail={(jobId) => navigate('/jobs/detail', jobId)}
              onNavigateToApplications={() => navigate('/jobs/applications')}
              selectedJobId={selectedJobId}
              activeView={
                currentPath === '/jobs/post'
                  ? 'post'
                  : currentPath === '/jobs/detail'
                  ? 'detail'
                  : currentPath === '/jobs/applications'
                  ? 'applications'
                  : 'list'
              }
            />
          )}

          {/* BUSINESS MODULE RENDERER */}
          {(currentPath.startsWith('/business') || currentPath.startsWith('/businesses')) && (
            <BusinessModule
              businesses={businesses}
              onAddBusiness={handleAddBusiness}
              onShareToCommunity={handleShareBusinessToCommunity}
              currentUser={profileData}
              currentLanguage={currentLanguage}
              onNavigateToCreate={() => navigate('/businesses/create')}
              onNavigateToList={() => navigate('/businesses')}
              onNavigateToDetail={(busId) => navigate('/businesses/detail', busId)}
              selectedBusinessId={selectedBusinessId}
              activeView={
                currentPath.includes('/create')
                  ? 'create'
                  : currentPath.includes('/detail')
                  ? 'detail'
                  : 'list'
              }
            />
          )}

          {/* PROPERTY MODULE RENDERER */}
          {currentPath.startsWith('/property') && (
            <PropertyModule
              properties={properties}
              onAddProperty={handleAddProperty}
              currentLanguage={currentLanguage}
              onNavigateToCreate={() => navigate('/property/create')}
              onNavigateToList={() => navigate('/property')}
              onNavigateToDetail={(propId) => navigate('/property/detail', propId)}
              onNavigateToSaved={() => navigate('/property/saved')}
              selectedPropertyId={selectedPropertyId}
              activeView={
                currentPath === '/property/create'
                  ? 'create'
                  : currentPath === '/property/detail'
                  ? 'detail'
                  : currentPath === '/property/saved'
                  ? 'saved'
                  : 'list'
              }
              onReportProperty={handleReportProperty}
              onToggleAvailability={handleToggleAvailability}
            />
          )}

          {/* MARKETPLACE MODULE RENDERER */}
          {currentPath.startsWith('/marketplace') && (
            <ErrorBoundary moduleName="Marketplace">
              <MarketplaceModule
              currentUser={profileData}
              currentLanguage={currentLanguage}
              currentPath={currentPath}
              navigate={navigate}
              selectedItemId={selectedMarketplaceItemId}
            />
            </ErrorBoundary>
          )}

          {/* SERVICES MODULE RENDERER */}
          {currentPath.startsWith('/services') && (
            <ServicesModule
              items={services}
              onAddItem={handleAddService}
              onUpdateServices={handleUpdateServices}
              currentUser={profileData}
              currentLanguage={currentLanguage}
              onNavigateToCreate={() => navigate('/services/create')}
              onNavigateToList={() => navigate('/services')}
              onNavigateToDetail={(itemId) => navigate('/services/detail', itemId)}
              onNavigateToBookings={() => navigate('/services/bookings')}
              selectedItemId={selectedServiceId}
              activeView={
                currentPath === '/services/create'
                  ? 'create'
                  : currentPath === '/services/detail'
                  ? 'detail'
                  : currentPath === '/services/bookings'
                  ? 'bookings'
                  : 'list'
              }
            />
          )}

          {/* ALERTS MODULE RENDERER */}
          {currentPath.startsWith('/alerts') && (
            <AlertsModule
              items={alerts}
              onAddAlert={handleAddAlert}
              onUpdateAlerts={handleUpdateAlerts}
              currentLanguage={currentLanguage}
              onNavigateToCreate={() => navigate('/alerts/create')}
              onNavigateToList={() => navigate('/alerts')}
              onNavigateToHistory={() => navigate('/alerts/history')}
              onNavigateToDetail={(itemId) => navigate('/alerts/detail', itemId)}
              selectedItemId={selectedAlertId}
              currentUser={profileData}
              activeView={
                currentPath === '/alerts/create'
                  ? 'create'
                  : currentPath === '/alerts/detail'
                  ? 'detail'
                  : currentPath === '/alerts/history'
                  ? 'history'
                  : 'list'
              }
            />
          )}

          {/* EVENTS MODULE RENDERER */}
          {currentPath.startsWith('/events') && (
            <EventsModule
              events={events}
              onAddEvent={handleAddEvent}
              onUpdateEvents={handleUpdateEvents}
              currentUser={profileData}
              currentLanguage={currentLanguage}
              onNavigateToCreate={() => navigate('/events/create')}
              onNavigateToList={() => navigate('/events')}
              onNavigateToDetail={(eventId) => navigate('/events/detail', eventId)}
              selectedEventId={selectedEventId}
              activeView={
                currentPath === '/events/create'
                  ? 'create'
                  : currentPath === '/events/detail'
                  ? 'detail'
                  : 'list'
              }
            />
          )}

          {/* DEALS MODULE RENDERER */}
          {currentPath.startsWith('/deals') && (
            <DealsModule
              deals={deals}
              onAddDeal={handleAddDeal}
              currentLanguage={currentLanguage}
              onNavigateToCreate={() => navigate('/deals/create')}
              onNavigateToList={() => navigate('/deals')}
              onNavigateToDetail={(dealId) => navigate('/deals/detail', dealId)}
              onNavigateToSaved={() => navigate('/deals/saved')}
              selectedDealId={selectedDealId}
              activeView={
                currentPath === '/deals/create'
                  ? 'create'
                  : currentPath === '/deals/detail'
                  ? 'detail'
                  : currentPath === '/deals/saved'
                  ? 'saved'
                  : 'list'
              }
            />
          )}

          {/* PAGES MODULE RENDERER */}
          {currentPath.startsWith('/pages') && (
            <PagesModule
              currentUser={profileData}
              currentLanguage={currentLanguage}
            />
          )}

          {/* HASHTAG FEED RENDERER */}
          {currentPath.startsWith('/hashtag/') && (
            <HashtagFeed currentLanguage={currentLanguage} />
          )}

          {/* SOCIAL GROUPS MODULE RENDERER */}
          {currentPath.startsWith('/social-groups') && (
            <SocialGroupsModule
              currentUser={profileData}
              currentLanguage={currentLanguage}
            />
          )}

          {/* POLLS & OPINION MODULE RENDERER */}
          {currentPath.startsWith('/polls') && (
            <PollsModule
              currentUser={profileData}
              currentLanguage={currentLanguage}
              polls={polls.filter(p => !p.area || p.area?.toLowerCase() === (profileData?.area || 'Dhoke Hassu')?.toLowerCase())}
              setPolls={setPolls}
              userVotes={userVotes}
              setUserVotes={setUserVotes}
            />
          )}

          {/* GROUPS MODULE RENDERER */}
          {currentPath.startsWith('/groups') && (
            <ErrorBoundary moduleName="Groups">
              <GroupsModule
              groups={groups}
              onUpdateGroups={handleUpdateGroups}
              currentUser={profileData}
              currentLanguage={currentLanguage}
              currentPath={currentPath}
              onNavigate={navigate}
              selectedGroupId={selectedGroupId}
              onSelectGroupId={setSelectedGroupId}
            />
            </ErrorBoundary>
          )}

          {/* TAB 2: FEED */}
          {activeTab === 'feed' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900">
                  📢 {t.feed}
                </h2>
                <span className="text-xs text-slate-500">
                  📍 {user.area} Zone
                </span>
              </div>
              
              {/* Community Feed Top Banner Ad */}
              {communityBannerMap[0] && (
                <div className="mb-4">
                  <AdBannerCard ad={communityBannerMap[0]} onNavigateToModule={handleNavigateToModule} />
                </div>
              )}

              {/* Progress Overlay for Video Uploads */}
              {composerUploadStage !== 'None' && (
                <div className="fixed inset-0 z-[999] bg-white/90 backdrop-blur-sm flex items-center justify-center p-4">
                  <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-sm w-full border border-slate-100 text-center">
                    {composerUploadStage === 'Completed' ? (
                      <div className="flex flex-col items-center animate-in zoom-in duration-300">
                        <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
                        <h3 className="font-bold text-xl text-slate-800">Upload Complete!</h3>
                        <p className="text-sm text-slate-500 mt-2">Your video is now live on the feed.</p>
                      </div>
                    ) : composerUploadStage === 'Failed' ? (
                      <div className="flex flex-col items-center animate-in zoom-in duration-300">
                        <AlertTriangle className="w-16 h-16 text-red-500 mb-4" />
                        <h3 className="font-bold text-xl text-slate-800">Upload Failed</h3>
                        <p className="text-sm text-red-500 mt-2">{composerUploadError}</p>
                        <div className="mt-6 flex gap-3 w-full">
                          <button 
                            onClick={() => setComposerUploadStage('None')}
                            className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition-colors"
                          >
                            Cancel
                          </button>
                          <button 
                            onClick={handleCreateComposerPost}
                            className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors"
                          >
                            Retry
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <div className="relative inline-flex items-center justify-center mb-6">
                          <svg className="w-24 h-24 transform -rotate-90">
                            <circle className="text-slate-100" strokeWidth="8" stroke="currentColor" fill="transparent" r="40" cx="48" cy="48" />
                            <circle 
                              className="text-blue-600 transition-all duration-300 ease-out" 
                              strokeWidth="8" 
                              strokeDasharray={251.2} 
                              strokeDashoffset={251.2 - (251.2 * composerUploadProgress) / 100} 
                              strokeLinecap="round" 
                              stroke="currentColor" 
                              fill="transparent" 
                              r="40" 
                              cx="48" 
                              cy="48" 
                            />
                          </svg>
                          <div className="absolute text-lg font-bold text-slate-700">{composerUploadProgress}%</div>
                        </div>
                        <h3 className="font-bold text-lg text-slate-800">{composerUploadStage}</h3>
                        <p className="text-sm text-slate-500 mt-1">
                          {composerUploadStage === 'Processing' ? 'Processing video...' : 
                           composerUploadStage === 'Saving Database' ? 'Finalizing post...' : 
                           'Uploading to secure storage...'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Feed lists only */}
              <div className="space-y-4">
                {(() => {
                  const elements = [];
                  
                  const visiblePolls = polls.filter(poll => {
                    if (poll.publish_status === 'Draft') return false;
                    if (poll.start_date && new Date(poll.start_date) > new Date()) return false;
                    return true;
                  });

                  const userArea = profileData?.area || 'Dhoke Hassu';
                  const filteredPosts = posts.filter(p => 
                    !p.area || 
                    p.area?.toLowerCase() === userArea?.toLowerCase() || 
                    p.postTag === 'lost' || 
                    p.postTag === 'found' ||
                    (p.content && (p.content.startsWith('🔍 LOST') || p.content.startsWith('✅ FOUND')))
                  );
                  const filteredPolls = visiblePolls.filter(p => !p.area || p.area?.toLowerCase() === userArea?.toLowerCase());
                   const visibleAlerts = alerts.filter(item => item.status !== 'Pending' && item.status !== 'Rejected');
                  const adminCheck = isUserAdminOrModerator(profileData);
                  const filteredAlerts = visibleAlerts.filter(a => {
                    const isOwner = profileData && (a.postedBy === profileData.fullName);
                    const matchesLoc = !a.area || a.area?.toLowerCase().includes(userArea?.toLowerCase()) || userArea?.toLowerCase().includes(a.area?.toLowerCase());
                    return matchesLoc || isOwner || adminCheck;
                  });

                  const feedItems = [
                    ...filteredPosts.map(p => ({
                      ...p,
                      feedType: 'post' as const,
                      sortDate: new Date(p.created_at || p.timestamp || Date.now())
                    })),
                    ...filteredPolls.map(p => ({
                      ...p,
                      feedType: 'poll' as const,
                      sortDate: new Date(p.created_at || Date.now())
                    })),
                    ...filteredAlerts.map(a => ({
                      ...a,
                      feedType: 'alert' as const,
                      sortDate: new Date(a.created_at || a.postedTime || Date.now())
                    }))
                  ].sort((a, b) => b.sortDate.getTime() - a.sortDate.getTime());

                  for (let i = 0; i < feedItems.length; i++) {
                    const item = feedItems[i];
                    
                    if (item.feedType === 'post') {
                      elements.push(renderPost(item));

                    } else if (item.feedType === 'alert') {
                      const alertItem = item as any;
                      const isCritical = alertItem.priority === 'Critical' || alertItem.severity === 'Urgent';
                      const isHigh = alertItem.priority === 'High';
                      const severityColor = isCritical ? 'bg-red-500' : isHigh ? 'bg-amber-500' : 'bg-blue-500';
                      const severityBg = isCritical 
                        ? 'bg-red-50 text-red-700 border-red-150' 
                        : isHigh 
                        ? 'bg-amber-50 text-amber-700 border-amber-100' 
                        : 'bg-blue-50 text-blue-700 border-blue-100';

                      elements.push(
                        <FeedCard
                          key={alertItem.id}
                          id={alertItem.id}
                          authorName={alertItem.postedBy || 'Admin'}
                          timestamp={alertItem.postedTime || ''}
                          location={alertItem.area}
                          badge={
                            <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider border flex items-center gap-1 ${severityBg}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${severityColor} ${isCritical ? 'animate-ping' : 'animate-pulse'}`} />
                              {currentLanguage === 'en' ? (alertItem.priority || alertItem.severity) : (isCritical ? 'انتہائی اہم' : isHigh ? 'اہم' : 'معمولی')}
                            </span>
                          }
                          showActions={false}
                        >
                          <div 
                            className="px-4 pb-3 cursor-pointer" 
                            onClick={() => navigate('/alerts/detail', alertItem.id)}
                          >
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-lg">🚨 {currentLanguage === 'en' ? 'Critical Alert' : 'اہم علاقائی الرٹ'}</span>
                              <span className="text-[10px] bg-red-50 text-red-650 px-1.5 py-0.5 rounded font-black uppercase">
                                #{alertItem.category}
                              </span>
                            </div>
                            <div className="space-y-1">
                              <h3 className={`font-black text-sm leading-snug ${isCritical ? 'text-red-700' : 'text-slate-900'}`}>
                                {alertItem.title}
                              </h3>
                              <p className="text-xs text-slate-600 leading-relaxed">
                                {alertItem.description}
                              </p>
                            </div>
                          </div>

                          {alertItem.image && (
                            <div 
                              className="w-full flex justify-center mt-3 bg-slate-50 border-t border-b border-slate-100 cursor-pointer" 
                              onClick={() => navigate('/alerts/detail', alertItem.id)}
                            >
                              <div className="w-full max-w-[700px] relative">
                                <img src={alertItem.image} alt={alertItem.title} className="w-full rounded-xl max-h-[500px] object-contain block" />
                              </div>
                            </div>
                          )}
                        </FeedCard>
                      );
                    } else {
                      const poll = item as any;
                      const hasVoted = !!userVotes[poll.id];
                      const activeOptionText = (poll.options || []).find((o: any) => o.id === userVotes[poll.id])?.option_text;
                      const totalOptionVotes = (poll.options || []).reduce((sum: number, o: any) => sum + (o.votes_count || 0), 0);
                      const isClosed = poll.publish_status === 'Closed' || (poll.end_date && new Date(poll.end_date) < new Date());

                      elements.push(
                        <FeedCard
                          key={poll.id}
                          id={poll.id}
                          authorName={currentLanguage === 'en' ? 'Community Opinion Poll' : 'سروے اور رائے عامہ'}
                          timestamp={
                            isClosed 
                              ? (currentLanguage === 'en' ? 'Poll Closed' : 'سروے بند ہو گیا') 
                              : (poll.end_date 
                                  ? (currentLanguage === 'en' 
                                      ? `Expires in ${Math.max(1, Math.round((new Date(poll.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))}d` 
                                      : `اختتام ${Math.max(1, Math.round((new Date(poll.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))} دنوں میں`) 
                                  : (currentLanguage === 'en' ? 'No Expiry' : 'کوئی آخری تاریخ نہیں'))
                          }
                          badge={
                            <span className="text-[9px] bg-indigo-50 text-indigo-700 font-black px-1.5 py-0.5 rounded uppercase">
                              {poll.category}
                            </span>
                          }
                          showActions={false}
                        >
                          <div className="px-4 pb-3">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                {poll.featured && (
                                  <span className="px-2 py-0.5 bg-amber-500 text-white text-[9px] font-black uppercase rounded-md tracking-wider">
                                    {currentLanguage === 'en' ? 'Featured' : 'اہم'}
                                  </span>
                                )}
                                {isClosed && (
                                  <span className="px-2 py-0.5 bg-red-100 text-red-700 text-[9px] font-black uppercase rounded-md tracking-wider">
                                    {currentLanguage === 'en' ? 'Closed' : 'بند'}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="space-y-1">
                              <h3 className="font-black text-slate-900 text-sm leading-snug">{poll.title}</h3>
                              {poll.description && (
                                <p className="text-xs text-slate-500 font-medium leading-relaxed whitespace-pre-wrap">{poll.description}</p>
                              )}
                            </div>
                          </div>

                          {poll.cover_image && (
                            <div className="w-full flex justify-center mt-3 bg-slate-50 border-t border-b border-slate-100">
                              <div className="w-full max-w-[700px] relative">
                                <img src={poll.cover_image} alt={poll.title} className="w-full rounded-xl max-h-[500px] object-contain block" />
                              </div>
                            </div>
                          )}

                          <div className="w-full flex justify-center">
                            <div className="w-full max-w-[700px] px-4 pt-3 pb-3">
                              <div className="space-y-2.5">
                                {hasVoted || isClosed ? (
                                  (poll.options || []).map((opt: any, idx: number) => {
                                    const votes = opt.votes_count || 0;
                                    const pct = totalOptionVotes > 0 ? Math.round((votes / totalOptionVotes) * 100) : 0;
                                    const isUserChoice = userVotes[poll.id] === opt.id;
                                    return (
                                      <div key={opt.id || idx} className="w-full bg-slate-50 border border-slate-200/60 rounded-xl overflow-hidden relative h-10 flex items-center justify-between px-4 font-bold text-xs">
                                        <div 
                                          className={`absolute left-0 top-0 bottom-0 transition-all duration-500 ${isUserChoice ? 'bg-green-500/10 border-r border-green-500/30' : 'bg-indigo-500/10 border-r border-indigo-500/30'}`} 
                                          style={{ width: `${pct}%` }} 
                                        />
                                        <span className="relative z-10 flex items-center gap-1.5 text-slate-700">
                                          {isUserChoice && <span className="text-green-600 font-black">✓</span>}
                                          {opt.option_text}
                                        </span>
                                        <span className="relative z-10 font-mono text-slate-500">
                                          {votes} {votes === 1 ? 'vote' : 'votes'} ({pct}%)
                                        </span>
                                      </div>
                                    );
                                  })
                                ) : (
                                  (poll.options || []).map((opt: any, idx: number) => (
                                    <button
                                      key={opt.id || idx}
                                      onClick={() => handleInlineVote(poll.id, opt.id)}
                                      className="w-full h-10 px-4 bg-white hover:bg-indigo-50/30 text-slate-700 hover:text-indigo-700 text-xs font-bold rounded-xl text-left border border-slate-200 hover:border-indigo-500/50 transition-all cursor-pointer shadow-2xs flex items-center justify-between"
                                    >
                                      <span>{opt.option_text}</span>
                                      <span className="w-4 h-4 rounded-full border border-slate-350 flex items-center justify-center shrink-0" />
                                    </button>
                                  ))
                                )}
                              </div>

                              <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100 text-[10px] font-bold text-slate-400">
                                <div className="flex items-center gap-3">
                                  <span>{totalOptionVotes} {currentLanguage === 'en' ? 'Total Votes' : 'کل ووٹ'}</span>
                                  {hasVoted && poll.allow_option_change && !isClosed && (
                                    <button onClick={() => handleInlineChangeVote(poll.id)} className="text-[10px] text-indigo-650 hover:text-indigo-750 font-black uppercase cursor-pointer border-none bg-transparent hover:underline">
                                      {currentLanguage === 'en' ? 'Change Vote' : 'ووٹ تبدیل کریں'}
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </FeedCard>
                      );
                    }

                    // Inject Community Feed active ads via proper rotation
                    (() => {
                      const ad = communityAdMap[i];
                      if (ad) {
                        elements.push(
                          <div key={`ad-feed-${i}-${ad.id}`} className="my-4">
                            <AdBannerCard ad={ad} onNavigateToModule={handleNavigateToModule} />
                          </div>
                        );
                      }
                    })()
                  }

                  return elements;
                })()}
              </div>
            </div>
          )}
          {/* TAB 3: CHAT */}
          {activeTab === 'chat' && (
            <ChatModule
              user={user}
              currentLanguage={currentLanguage}
              currentPath={currentPath}
              navigate={navigate}
            />
          )}

          {/* TAB 4: VIDEOS */}
          {activeTab === 'videos' && (
            <VideosModule
              userId={user.id}
            />
          )}

          {/* TAB 5: PROFILE */}
          {activeTab === 'profile' && (currentPath === '/profile' || currentPath === '/profile/edit') && (
            <ProfileModule
              user={profileData}
              onUpdateUser={handleUpdateUser}
              currentLanguage={currentLanguage}
              currentPath={currentPath}
              navigate={navigate}
              posts={posts}
              events={events}
              marketplaceItems={marketplaceItems}
              businesses={businesses}
              jobs={jobs}
              services={services}
              alerts={alerts}
              deals={deals}
            />
          )}

          {currentPath.startsWith('/profile/') && currentPath !== '/profile' && currentPath !== '/profile/edit' && (
            <UserProfileView
              userId={currentPath?.substring('/profile/'.length)}
              fallbackName={new URLSearchParams(window.location.search).get('name') || ''}
              fallbackAvatar={new URLSearchParams(window.location.search).get('avatar') || undefined}
              currentLanguage={currentLanguage}
              navigate={navigate}
              posts={posts}
              jobs={jobs}
              businesses={businesses}
              marketplaceItems={marketplaceItems}
              services={services}
              currentUser={profileData}
            />
          )}

          {currentPath.startsWith('/verify') && (() => {
            const certId = currentPath?.split('/').pop() || '';
            return (
              <TvsPublicVerify 
                certificateId={certId}
                currentLanguage={currentLanguage}
                onClose={() => navigate('/feed')}
              />
            );
          })()}

          {/* NOTIFICATIONS MODULE RENDERER */}
          {currentPath.startsWith('/notifications') && (
            <NotificationsModule
              currentLanguage={currentLanguage}
              currentPath={currentPath}
              navigate={navigate}
              onUpdateUnreadCount={(count) => setUnreadNotificationsCount(count)}
              currentUser={profileData}
            />
          )}

          {/* VERIFICATION MODULE RENDERER */}
          {currentPath.startsWith('/verification') && (
            <VerificationModule
              currentLanguage={currentLanguage}
              currentPath={currentPath}
              navigate={navigate}
              currentUser={profileData}
              onUpdateUser={handleUpdateUser}
            />
          )}

          {/* GLOBAL SEARCH MODULE RENDERER */}
          {(currentPath.startsWith('/search') || currentPath.startsWith('/search/results')) && (
            <SearchModule
              currentLanguage={currentLanguage}
              currentPath={currentPath}
              navigate={navigate}
              posts={posts}
              businesses={businesses}
              jobs={jobs}
              marketplaceItems={marketplaceItems}
              services={services}
              alerts={alerts}
              events={events}
              deals={deals}
              groups={groups}
              properties={properties}
              currentUser={profileData}
            />
          )}

          {/* SETTINGS & PERSONALIZATION MODULE RENDERER */}
          {currentPath.startsWith('/settings') && (
            <SettingsModule
              currentLanguage={currentLanguage}
              onLanguageChange={onLanguageChange}
              currentPath={currentPath}
              navigate={navigate}
              user={profileData}
              onUpdateUser={handleUpdateUser}
            />
          )}

        </main>
      </div>

      {/* 3. MOBILE BOTTOM NAVIGATION */}
      <MobileBottomNav
        currentPath={currentPath}
        activeTab={activeTab}
        currentLanguage={currentLanguage}
        navigate={navigate}
        unreadChatCount={unreadChatCount}
      />

      {/* 4. STORY AND MODAL VIEWERS */}
      {showAddStoryModal && (
        <StoryCreator
          user={user}
          currentUser={profileData}
          onClose={() => setShowAddStoryModal(false)}
          onComplete={(newStory) => {
            const normalizedStory = {
              ...newStory,
              author: newStory.author || profileData.fullName,
              avatar: newStory.avatar || profileData.profilePhoto,
            };
            setStories(prev => [normalizedStory, ...prev]);
            console.log("[STORY] Feed Updated", normalizedStory.id);
            setShowAddStoryModal(false);
          }}
        />
      )}

      {viewingStoryIdx !== null && (
        <StoryViewer
          stories={flatGroupedStories}
          initialIdx={viewingStoryIdx}
          onClose={() => setViewingStoryIdx(null)}
          viewerId={user.id || profileData?.id || ''}
          onDeleteStory={(deletedStoryId) => {
            setStories(prev => prev.filter(s => s.id !== deletedStoryId));
          }}
          navigate={navigate}
        />
      )}
      {renderShareModal()}

      {/* Trust & Verification System (TVS) Modal */}
      <TvsApplicationModal
        currentUser={profileData}
        currentLanguage={currentLanguage}
        isOpen={isTvsModalOpen}
        onClose={() => setIsTvsModalOpen(false)}
        onSuccess={(certId) => {
          // Trigger system notification
          dbTriggerNotification(
            profileData.user_id || profileData.id,
            null,
            'Verification',
            'Verification Request Submitted',
            `Your TVS verification request ${certId} has been registered and assigned to a verification officer.`
          );
        }}
      />

      {/* Premium Photo Gallery Modal */}
      {activeGalleryImages && activeGalleryImages.length > 0 && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <button
            onClick={() => setActiveGalleryImages(null)}
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all border-0 cursor-pointer shadow-lg z-50"
            title="Close"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Previous Button */}
          {activeGalleryImages.length > 1 && (
            <button
              onClick={() => setActiveGalleryIndex(prev => (prev > 0 ? prev - 1 : activeGalleryImages.length - 1))}
              className="absolute left-4 p-3 bg-white/10 hover:bg-white/25 text-white rounded-full transition-all border-0 cursor-pointer z-50"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}

          {/* Active Image Stage with zoom style */}
          <div className="relative max-w-3xl max-h-[80vh] flex flex-col items-center justify-center gap-4">
            <img 
              src={activeGalleryImages[activeGalleryIndex]} 
              alt="Gallery Item" 
              className="max-w-full max-h-[70vh] object-contain rounded-2xl shadow-2xl transition-all duration-300"
            />
            
            {/* Dots indicator */}
            {activeGalleryImages.length > 1 && (
              <div className="flex gap-2">
                {activeGalleryImages.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveGalleryIndex(idx)}
                    className={`w-2.5 h-2.5 rounded-full transition-all border-0 cursor-pointer ${idx === activeGalleryIndex ? 'bg-amber-500 scale-125' : 'bg-white/40'}`}
                  />
                ))}
              </div>
            )}
            
            {/* Image counter text */}
            <span className="text-white/60 text-xs font-black">
              {activeGalleryIndex + 1} / {activeGalleryImages.length}
            </span>
          </div>

          {/* Next Button */}
          {activeGalleryImages.length > 1 && (
            <button
              onClick={() => setActiveGalleryIndex(prev => (prev < activeGalleryImages.length - 1 ? prev + 1 : 0))}
              className="absolute right-4 p-3 bg-white/10 hover:bg-white/25 text-white rounded-full transition-all border-0 cursor-pointer z-50"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}
        </div>
      )}

      {/* Premium Popup Advertisement */}
      {activePopupAd && (
        <PremiumAdPopup ad={activePopupAd} onClose={closePopup} onNavigateToModule={handleNavigateToModule} />
      )}
    </div>
  );
}








