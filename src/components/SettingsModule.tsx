/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Compass } from 'lucide-react';
import { 

  dbGetCities, 
  dbGetAreas, 
  detectBrowserLocation, 
  findNearestArea 
} from '../utils/locationService';
import { Province, City, Area } from '../types';
import {
  User as UserIcon,
  Shield,
  Bell,
  Lock,
  Palette,
  Globe,
  HardDrive,
  Info,
  HelpCircle,
  Camera,
  Trash2,
  Monitor,
  Moon,
  Sun,
  RefreshCw,
  X,
  ChevronRight,
  ArrowLeft,
  CheckCircle,
  AlertTriangle,
  Smartphone,
  Plus,
  Send,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { Language, User, NotificationSettings } from '../types';

interface SettingsModuleProps {
  currentLanguage: Language;
  onLanguageChange: (lang: Language) => void;
  currentPath: string;
  navigate: (path: string, paramId?: string) => void;
  user: User;
  onUpdateUser: (updated: User) => void;
}

const LOCAL_STORAGE_KEY_SETTINGS = 'dhoke_hassu_connect_settings';

// Custom interface for all personalization states
interface PersonalizationSettings {
  privacy: {
    isPrivate: boolean;
    whoCanMessage: 'everyone' | 'verified' | 'none';
    whoCanViewPosts: 'everyone' | 'followers' | 'me';
    whoCanSeePhone: 'everyone' | 'followers' | 'me';
    blockedUsers: string[];
  };
  notifications: NotificationSettings;
  appearance: 'light' | 'dark' | 'system';
  storage: {
    cacheSizeMb: number;
    downloadedFiles: { id: string; name: string; size: string; date: string }[];
  };
}

const DEFAULT_PERSONALIZATION: PersonalizationSettings = {
  privacy: {
    isPrivate: false,
    whoCanMessage: 'everyone',
    whoCanViewPosts: 'everyone',
    whoCanSeePhone: 'followers',
    blockedUsers: ['Raja_Kabeer', 'Malik_Sajid']
  },
  notifications: {
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
      system: true
    },
    channels: {
      push: true,
      inApp: true,
      sound: true,
      vibration: false
    }
  },
  appearance: 'light',
  storage: {
    cacheSizeMb: 42.8,
    downloadedFiles: [
      { id: '1', name: 'Dhoke_Hassu_Map.pdf', size: '2.4 MB', date: '2026-06-28' },
      { id: '2', name: 'Rawalpindi_Tax_Guide.pdf', size: '1.8 MB', date: '2026-06-15' },
      { id: '3', name: 'Community_Bylaws_Urdu.pdf', size: '3.1 MB', date: '2026-07-01' }
    ]
  }
};

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150',
  'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&q=80&w=150',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=150',
  'https://images.unsplash.com/photo-1628157582853-a796fa650a6a?auto=format&fit=crop&q=80&w=150'
];

const COVER_PRESETS = [
  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&q=80&w=600'
];

const SETTINGS_TRANSLATIONS = {
  en: {
    settingsTitle: 'Settings & Personalization',
    settingsSubtitle: 'Manage your Dhoke Hassu Connect account, privacy, appearance, and alerts.',
    saveBtn: 'Save Changes',
    saving: 'Saving...',
    savedSuccess: 'Settings updated successfully!',
    cancelBtn: 'Cancel',
    backToHome: 'Back to Settings',
    activeSessions: 'Active Sessions',
    revokeBtn: 'Revoke',
    sessionRevoked: 'Session terminated successfully.',
    
    // Sidebar Tabs
    tabAccount: 'Account Settings',
    tabPrivacy: 'Privacy & Blocking',
    tabNotifications: 'Notification Preferences',
    tabSecurity: 'Security & Sessions',
    tabAppearance: 'Appearance & Theme',
    tabLanguage: 'Language Preference',
    tabStorage: 'Data & Storage',
    tabAbout: 'About Application',
    tabHelp: 'Help & Support',

    // Sidebar Descriptions
    descAccount: 'Update profile info, photos, and contact credentials.',
    descPrivacy: 'Control profile visibility, messaging permissions, and blocked users.',
    descNotifications: 'Select notification triggers and channel modes.',
    descSecurity: 'Reset passwords, revoke active sessions, and secure login.',
    descAppearance: 'Switch between Light, Dark, and System modes.',
    descLanguage: 'Switch the application language (English/Urdu).',
    descStorage: 'Clear caching details and manage offline documents.',
    descAbout: 'Legal policies, terms, application specifications.',
    descHelp: 'Frequently asked questions, feedback, and issue reporting.',

    // Account Details
    editProfile: 'Edit Profile Information',
    fullName: 'Full Name',
    username: 'Username',
    bioLabel: 'Bio / Status Message',
    emailLabel: 'Email Address',
    phoneLabel: 'Phone Number',
    zoneLabel: 'Local Area / Zone',
    avatarSelect: 'Choose Profile Avatar',
    coverSelect: 'Choose Cover Background',
    profilePlaceholder: 'Enter your bio...',
    customUrl: 'Or enter custom image URL',
    
    // Privacy Details
    profileVisibility: 'Profile Visibility',
    privateProfile: 'Private Profile',
    privateDesc: 'When private, only users you follow can view your full details and activity feed.',
    whoCanMessage: 'Who can message me',
    whoCanMessageDesc: 'Select who is permitted to send you direct chat invitations.',
    whoCanViewPosts: 'Who can view my posts',
    whoCanSeePhone: 'Who can see my phone number',
    blockedUsersTitle: 'Blocked Accounts',
    blockedDesc: 'Blocked accounts cannot view your listings, message you, or find your comments.',
    noBlocked: 'No blocked users.',
    unblockBtn: 'Unblock',
    blockPlaceholder: 'Enter username to block...',
    blockBtn: 'Block User',
    everyone: 'Everyone',
    verifiedOnly: 'Verified Residents Only',
    followersOnly: 'Followers Only',
    onlyMe: 'Only Me',

    // Notifications
    notificationCategories: 'Notification Categories',
    categoriesDesc: 'Choose which community updates trigger notifications.',
    notificationChannels: 'Delivery Channels',
    channelsDesc: 'Choose where and how alerts are delivered.',
    catCommunity: 'Community Posts & Activity',
    catChat: 'Direct Chats & Messages',
    catEvents: 'Local Event Announcements',
    catBusinesses: 'Business Updates & Reviews',
    catJobs: 'Employment Listings & Recruits',
    catMarketplace: 'Buy & Sell Listings',
    catServices: 'Service Recommendations',
    catProperty: 'Property Postings & Real Estate',
    catDeals: 'Trending Deals & Discounts',
    catAlerts: 'Critical Area Alerts',
    catGroups: 'Community Groups Activity',
    catPolls: 'Opinion Polls & Feedback Requests',
    catPromotions: 'Promotions & Special Offfers',
    catVerification: 'Verification Progress',
    catSystem: 'System & Security Alerts',
    
    channelPush: 'Push Notifications',
    channelInApp: 'In-App Message Badge',
    channelSound: 'Sound Alerts',
    channelVibration: 'Device Vibration',

    // Security Details
    changePassword: 'Change Account Password',
    currPassword: 'Current Password',
    newPassword: 'New Password',
    confirmPassword: 'Confirm New Password',
    passMismatch: 'New passwords do not match!',
    passShort: 'Password must be at least 6 characters.',
    passChanged: 'Password updated successfully!',
    logoutAll: 'Log Out of All Devices',
    logoutAllDesc: 'This will invalidate active tokens on all other mobile devices or browsers.',
    logoutAllBtn: 'Log Out Everywhere',
    logoutAllSuccess: 'Logged out of all other sessions.',
    deviceTitle: 'Authorized Devices',

    // Appearance Details
    themeSelection: 'Theme Selection',
    themeDesc: 'Select your preferred visual style for the app.',
    themeLight: 'Light Mode',
    themeDark: 'Dark Mode',
    themeSystem: 'System Default',
    themeActive: 'Active',

    // Language Details
    appLang: 'Application Language',
    langDesc: 'Adjust the global language instantly. This updates all menus, announcements, and buttons.',
    enLabel: 'English (In-App)',
    urLabel: 'اردو (درون ایپ)',

    // Storage Details
    cacheTitle: 'Cache & Files Management',
    cacheDesc: 'Speed up storage and free up space on your device.',
    clearCacheBtn: 'Clear Cache Files',
    cacheCleared: 'Cache successfully cleared!',
    cacheSizeText: 'Used Offline Cache space:',
    downloadsTitle: 'Downloaded Files & Local Guides',
    noDownloads: 'No locally downloaded files.',
    deleteFileBtn: 'Remove File',

    // About
    appVer: 'Application Version',
    verDetails: 'v2.4.0-Stable (Production)',
    privacyPolicy: 'Privacy Policy',
    termsAndConditions: 'Terms & Conditions',
    contactSupport: 'Contact Engineering Support',
    supportDesc: 'If you have any platform issues, reach out to the Dhoke Hassu District Portal team.',
    supportBtn: 'Send Email',

    // Help & Support
    faqTitle: 'Frequently Asked Questions',
    faq1Q: 'How do I get the Verified Resident Blue Badge?',
    faq1A: 'Go to the Verification Center from the profile header. Submit your CNIC or utility bill matching your Dhoke Hassu address. Admins review submissions within 24 hours.',
    faq2Q: 'Is my phone number visible to everyone?',
    faq2A: 'No! By default, your phone number is only visible to your followers. You can completely hide it by setting "Who can see my phone number" to "Only Me" in the Privacy tab.',
    faq3Q: 'How do I list my shop or business?',
    faq3A: 'Go to the Business module, click "Register Business" and input your trade license, images, and description. Verifying your business gives it higher visibility.',
    faq4Q: 'Can I post property rentals or sales?',
    faq4A: 'Yes! The Property Module allows you to post rooms, plots, or shops for rent or sale in Rawalpindi.',
    
    reportProblem: 'Report a Technical Problem',
    problemPlaceholder: 'Describe the issue you are experiencing...',
    submitProblem: 'Submit Ticket',
    ticketSubmitted: 'Technical support ticket submitted! Reference: #DHC-',
    
    feedbackTitle: 'Send Portal Feedback',
    feedbackPlaceholder: 'How can we improve Dhoke Hassu Connect?',
    submitFeedback: 'Submit Feedback',
    feedbackSuccess: 'Thank you for your feedback! It helps us improve Dhoke Hassu Connect.',

    // Active session presets
    sessCurrent: 'Current Session',
    sessLastActive: 'Last Active',
    sessRevokeConfirm: 'Are you sure you want to revoke this session?'
  },
  ur: {
    settingsTitle: 'ترتیبات اور ذاتی نوعیت',
    settingsSubtitle: 'اپنے ڈھوک حسو کنیکٹ اکاؤنٹ، رازداری، شکل اور الرٹس کا انتظام کریں۔',
    saveBtn: 'تبدیلیاں محفوظ کریں',
    saving: 'محفوظ ہو رہا ہے...',
    savedSuccess: 'ترتیبات کامیابی سے اپ ڈیٹ ہو گئیں!',
    cancelBtn: 'منسوخ کریں',
    backToHome: 'ترتیبات پر واپس',
    activeSessions: 'فعال سیشنز',
    revokeBtn: 'منسوخ کریں',
    sessionRevoked: 'سیشن کامیابی کے ساتھ منقطع ہو گیا۔',

    // Sidebar Tabs
    tabAccount: 'اکاؤنٹ کی ترتیبات',
    tabPrivacy: 'رازداری اور بلاکنگ',
    tabNotifications: 'اطلاعات کی ترجیحات',
    tabSecurity: 'سیکیورٹی اور سیشنز',
    tabAppearance: 'شکل اور تھیم',
    tabLanguage: 'زبان کی ترجیح',
    tabStorage: 'ڈیٹا اور اسٹوریج',
    tabAbout: 'درخواست کے بارے میں',
    tabHelp: 'مدد اور سپورٹ',

    // Sidebar Descriptions
    descAccount: 'پروفائل کی معلومات، تصاویر اور رابطے کی تفصیلات اپ ڈیٹ کریں۔',
    descPrivacy: 'پروفائل کی نمائش، پیغامات بھیجنے کی اجازت اور بلاک شدہ صارفین کو کنٹرول کریں۔',
    descNotifications: 'اطلاعات کے محرکات اور ترسیل کے طریقے منتخب کریں۔',
    descSecurity: 'پاس ورڈ تبدیل کریں، فعال سیشنز ختم کریں، اور لاگ ان محفوظ کریں۔',
    descAppearance: 'روشن، تاریک، اور سسٹم تھیم کے درمیان سوئچ کریں۔',
    descLanguage: 'ایپلیکیشن کی زبان تبدیل کریں (انگلش/اردو)۔',
    descStorage: 'عارضی فائلیں (کیش) صاف کریں اور آف لائن دستاویزات کا انتظام کریں۔',
    descAbout: 'قانونی پالیسیاں، شرائط، اور درخواست کی تفصیلات۔',
    descHelp: 'اکثر پوچھے گئے سوالات، آراء اور مسائل کی رپورٹنگ۔',

    // Account Details
    editProfile: 'پروفائل کی معلومات تبدیل کریں',
    fullName: 'پورا نام',
    username: 'یوزر نیم',
    bioLabel: 'بائیو / اسٹیٹس کا پیغام',
    emailLabel: 'ای میل ایڈریس',
    phoneLabel: 'موبائل نمبر',
    zoneLabel: 'علاقہ / زون',
    avatarSelect: 'پروفائل تصویر منتخب کریں',
    coverSelect: 'کور امیج منتخب کریں',
    profilePlaceholder: 'اپنے بارے میں کچھ لکھیں...',
    customUrl: 'یا حسب ضرورت تصویر کا یو آر ایل درج کریں',

    // Privacy Details
    profileVisibility: 'پروفائل کی رازداری',
    privateProfile: 'پرائیویٹ پروفائل',
    privateDesc: 'پرائیویٹ ہونے پر، صرف وہ صارفین جنہیں آپ فالو کرتے ہیں آپ کی تفصیلات دیکھ سکتے ہیں۔',
    whoCanMessage: 'مجھ سے کون رابطہ کر سکتا ہے',
    whoCanMessageDesc: 'منتخب کریں کہ کون آپ کو براہ راست چیٹ کے دعوت نامے بھیج سکتا ہے۔',
    whoCanViewPosts: 'میری پوسٹس کون دیکھ سکتا ہے',
    whoCanSeePhone: 'میرا فون نمبر کون دیکھ سکتا ہے',
    blockedUsersTitle: 'بلاک شدہ اکاؤنٹس',
    blockedDesc: 'بلاک شدہ صارفین آپ کی لسٹنگز، پیغامات، یا تبصرے نہیں دیکھ سکتے۔',
    noBlocked: 'کوئی بلاک شدہ صارف نہیں ہے۔',
    unblockBtn: 'بلاک ختم کریں',
    blockPlaceholder: 'بلاک کرنے کے لیے یوزر نیم درج کریں...',
    blockBtn: 'صارف بلاک کریں',
    everyone: 'ہر کوئی',
    verifiedOnly: 'صرف تصدیق شدہ رہائشی',
    followersOnly: 'صرف فالورز',
    onlyMe: 'صرف میں',

    // Notifications
    notificationCategories: 'اطلاعات کے زمرے',
    categoriesDesc: 'کمیونٹی کی سرگرمیوں کا انتخاب کریں جن پر اطلاعات موصول ہونی چاہئیں۔',
    notificationChannels: 'وصول کرنے کے ذرائع',
    channelsDesc: 'منتخب کریں کہ الرٹس کہاں اور کیسے موصول ہوں۔',
    catCommunity: 'کمیونٹی پوسٹس اور سرگرمی',
    catChat: 'براہ راست چیٹس اور پیغامات',
    catEvents: 'مقامی تقریبات کے اعلانات',
    catBusinesses: 'کاروبار کی تفصیلات اور جائزے',
    catJobs: 'ملازمت کی تفصیلات اور بھرتیاں',
    catMarketplace: 'خرید و فروخت کی اشیاء',
    catServices: 'سروسز کی سفارشات',
    catProperty: 'جائیداد اور رئیل اسٹیٹ پوسٹس',
    catDeals: 'ڈیلز اور ڈسکاؤنٹس',
    catAlerts: 'اہم علاقائی الرٹس',
    catGroups: 'کمیونٹی گروپس کی سرگرمی',
    catPolls: 'رائے عامہ کے سروے',
    catPromotions: 'پروموشنز اور خصوصی آفرز',
    catVerification: 'تصدیق کا عمل',
    catSystem: 'سسٹم اور سیکیورٹی الرٹس',

    channelPush: 'پش نوٹیفکیشنز',
    channelInApp: 'درون ایپ بیج',
    channelSound: 'آواز کے الرٹس',
    channelVibration: 'وائبریشن',

    // Security Details
    changePassword: 'اکاؤنٹ کا پاس ورڈ تبدیل کریں',
    currPassword: 'موجودہ پاس ورڈ',
    newPassword: 'نیا پاس ورڈ',
    confirmPassword: 'نئے پاس ورڈ کی تصدیق کریں',
    passMismatch: 'نئے پاس ورڈز آپس میں نہیں ملتے!',
    passShort: 'پاس ورڈ کم از کم 6 ہندسوں کا ہونا چاہیے۔',
    passChanged: 'پاس ورڈ کامیابی سے تبدیل ہو گیا!',
    logoutAll: 'تمام آلات سے لاگ آؤٹ کریں',
    logoutAllDesc: 'یہ دوسرے تمام موبائل فونز یا براؤزرز پر آپ کے لاگ ان سیشنز کو منقطع کر دے گا۔',
    logoutAllBtn: 'ہر جگہ سے لاگ آؤٹ کریں',
    logoutAllSuccess: 'دوسرے تمام سیشنز سے کامیابی سے لاگ آؤٹ ہو گیا۔',
    deviceTitle: 'مجاز آلات',

    // Appearance Details
    themeSelection: 'تھیم کا انتخاب',
    themeDesc: 'ایپ کے لیے اپنا پسندیدہ تھیم منتخب کریں۔',
    themeLight: 'لائٹ موڈ (روشن)',
    themeDark: 'ڈارک موڈ (تاریک)',
    themeSystem: 'سسٹم ڈیفالٹ',
    themeActive: 'فعال',

    // Language Details
    appLang: 'ایپ کی زبان',
    langDesc: 'درون ایپ زبان کو فوری تبدیل کریں۔ یہ تمام مینیوز، اعلانات اور بٹنز کو اپ ڈیٹ کرے گا۔',
    enLabel: 'انگلش (English)',
    urLabel: 'اردو (Urdu)',

    // Storage Details
    cacheTitle: 'کیش اور فائلوں کا انتظام',
    cacheDesc: 'اسٹوریج کو تیز کریں اور اپنے آلے پر جگہ خالی کریں۔',
    clearCacheBtn: 'کیش فائلیں صاف کریں',
    cacheCleared: 'کیش کامیابی سے صاف ہو گیا!',
    cacheSizeText: 'آف لائن کیش جگہ استعمال شدہ:',
    downloadsTitle: 'ڈاؤن لوڈ کردہ فائلیں اور مقامی گائیڈز',
    noDownloads: 'کوئی فائل ڈاؤن لوڈ نہیں کی گئی۔',
    deleteFileBtn: 'فائل حذف کریں',

    // About
    appVer: 'ایپ کا ورژن',
    verDetails: 'v2.4.0-Stable (پروڈکشن)',
    privacyPolicy: 'رازداری کی پالیسی',
    termsAndConditions: 'شرائط و ضوابط',
    contactSupport: 'انجینئرنگ سپورٹ سے رابطہ کریں',
    supportDesc: 'اگر آپ کو پلیٹ فارم میں کوئی مسئلہ درپیش ہے تو ڈھوک حسو ڈسٹرکٹ پورٹل ٹیم سے رابطہ کریں۔',
    supportBtn: 'ای میل بھیجیں',

    // Help & Support
    faqTitle: 'اکثر پوچھے گئے سوالات',
    faq1Q: 'میں تصدیق شدہ نیلا بیج کیسے حاصل کر سکتا ہوں؟',
    faq1A: 'پروفائل ہیڈر سے تصدیقی مرکز پر جائیں۔ ڈھوک حسو کے پتے سے مماثل اپنا شناختی کارڈ یا یوٹیلیٹی بل جمع کروائیں۔ ایڈمنز 24 گھنٹوں میں اس کا جائزہ لیتے ہیں۔',
    faq2Q: 'کیا میرا فون نمبر سب کو نظر آتا ہے؟',
    faq2A: 'نہیں! پہلے سے طے شدہ طور پر، آپ کا فون نمبر صرف آپ کے فالوورز کو نظر آتا ہے۔ آپ ترتیبات میں رازداری کے ٹیب سے اسے مکمل طور پر چھپا سکتے ہیں۔',
    faq3Q: 'میں اپنی دکان یا کاروبار کو کیسے درج کروں؟',
    faq3A: 'بزنس ماڈیول پر جائیں، "کاروبار رجسٹر کریں" پر کلک کریں اور اپنا ٹریڈ لائسنس، تصاویر اور تفصیل درج کریں۔',
    faq4Q: 'کیا میں جائیداد کرایہ پر یا فروخت کے لیے پوسٹ کر سکتا ہوں؟',
    faq4A: 'جی ہاں! جائیداد ماڈیول آپ کو راولپنڈی میں کرایہ یا فروخت کے لیے کمرے، پلاٹ یا دکانیں پوسٹ کرنے کی اجازت دیتا ہے۔',

    reportProblem: 'تکنیکی مسئلہ رپورٹ کریں',
    problemPlaceholder: 'درپیش تکنیکی مسئلے کی تفصیل لکھیں...',
    submitProblem: 'ٹکٹ جمع کروائیں',
    ticketSubmitted: 'تکنیکی سپورٹ ٹکٹ کامیابی سے جمع ہو گیا! حوالہ نمبر: #DHC-',

    feedbackTitle: 'پورٹل کے بارے میں اپنی رائے بھیجیں',
    feedbackPlaceholder: 'ہم ڈھوک حسو کنیکٹ کو کیسے بہتر بنا سکتے ہیں؟',
    submitFeedback: 'رائے بھیجیں',
    feedbackSuccess: 'آپ کی رائے کا شکریہ! یہ ہمیں ڈھوک حسو کنیکٹ کو بہتر بنانے میں مدد دیتا ہے۔',

    sessCurrent: 'موجودہ سیشن',
    sessLastActive: 'آخری بار فعال',
    sessRevokeConfirm: 'کیا آپ واقعی اس سیشن کو منقطع کرنا چاہتے ہیں؟'
  }
};

export default function SettingsModule({
  currentLanguage,
  onLanguageChange,
  currentPath,
  navigate,
  user,
  onUpdateUser
}: SettingsModuleProps) {
  const t = SETTINGS_TRANSLATIONS[currentLanguage];
  const isUr = currentLanguage === 'ur';

  // State initialization from localstorage or default presets
  const [personalization, setPersonalization] = useState<PersonalizationSettings>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY_SETTINGS);
      return saved ? JSON.parse(saved) : DEFAULT_PERSONALIZATION;
    } catch {
      return DEFAULT_PERSONALIZATION;
    }
  });

  // Save changes to localStorage whenever personalization updates
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY_SETTINGS, JSON.stringify(personalization));
  }, [personalization]);

  // Account editing states
  const [fullName, setFullName] = useState(user.fullName || '');
  const [username, setUsername] = useState(user.username || '');
  const [bio, setBio] = useState(user.bio || '');
  const [email, setEmail] = useState(user.email || '');
  const [phone, setPhone] = useState(user.mobileNumber || '');
  const [area, setArea] = useState(user.area || 'Dhoke Hassu');
  const [profilePhoto, setProfilePhoto] = useState(user.profilePhoto || AVATAR_PRESETS[0]);
  const [coverPhoto, setCoverPhoto] = useState(user.coverPhoto || COVER_PRESETS[0]);
  const [customPhotoUrl, setCustomPhotoUrl] = useState('');
  const [customCoverUrl, setCustomCoverUrl] = useState('');

  // Location-related states
    const [provinceId, setProvinceId] = useState(user.provinceId || '');
  const [cityId, setCityId] = useState(user.cityId || '');
  const [areaId, setAreaId] = useState(user.areaId || '');
  const [latitude, setLatitude] = useState<number | undefined>(user.latitude);
  const [longitude, setLongitude] = useState<number | undefined>(user.longitude);

    const [provincesList, setProvincesList] = useState<Province[]>([]);
  const [citiesList, setCitiesList] = useState<City[]>([]);
  const [areasList, setAreasList] = useState<Area[]>([]);
  const [loadingGPS, setLoadingGPS] = useState(false);

  // Sync edit states when user changes
  useEffect(() => {
    setFullName(user.fullName || '');
    setUsername(user.username || '');
    setBio(user.bio || '');
    setEmail(user.email || '');
    setPhone(user.mobileNumber || '');
    setArea(user.area || 'Dhoke Hassu');
    setProfilePhoto(user.profilePhoto || AVATAR_PRESETS[0]);
    setCoverPhoto(user.coverPhoto || COVER_PRESETS[0]);
        setProvinceId(user.provinceId || '');
    setCityId(user.cityId || '');
    setAreaId(user.areaId || '');
    setLatitude(user.latitude);
    setLongitude(user.longitude);
  }, [user]);

  // Load locations
  

  useEffect(() => {
    async function loadProvinces() {
      const list = await dbGetProvinces();
      setProvincesList(list);
    }
    loadProvinces();
  }, []);

  useEffect(() => {
    if (!provinceId) return;
    async function loadCities() {
      const list = await dbGetCities(provinceId);
      setCitiesList(list);
    }
    loadCities();
  }, [provinceId]);

  useEffect(() => {
    if (!cityId) return;
    async function loadAreas() {
      const list = await dbGetAreas(cityId);
      setAreasList(list);
    }
    loadAreas();
  }, [cityId]);

  // Password reset states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Active Sessions mockup state (users can revoke them)
  const [sessions, setSessions] = useState([
    { id: 'sess-1', device: 'Infinix Hot 30 (Dhoke Hassu)', ip: '182.180.125.4', isCurrent: true, date: 'Active Now' },
    { id: 'sess-2', device: 'Chrome Browser (Rawalpindi)', ip: '39.40.112.54', isCurrent: false, date: '2026-07-02 11:24 AM' },
    { id: 'sess-3', device: 'Samsung Galaxy A32 (Islamabad)', ip: '110.37.210.12', isCurrent: false, date: '2026-06-30 08:15 PM' }
  ]);

  // Blocking state helper
  const [blockInput, setBlockInput] = useState('');

  // Support inquiries & issues
  const [technicalProblem, setTechnicalProblem] = useState('');
  const [portalFeedback, setPortalFeedback] = useState('');

  // Success & error alert states
  const [successToast, setSuccessToast] = useState('');
  const [errorToast, setErrorToast] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ticketReference, setTicketReference] = useState('');

  const triggerSuccess = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(''), 4000);
  };

  const triggerError = (msg: string) => {
    setErrorToast(msg);
    setTimeout(() => setErrorToast(''), 4000);
  };

  // Synchronize component state if user object changes
  useEffect(() => {
    if (user) {
      setFullName(user.fullName || '');
      setUsername(user.username || '');
      setBio(user.bio || '');
      setEmail(user.email || '');
      setPhone(user.mobileNumber || '');
      setArea(user.area || 'Dhoke Hassu');
      if (user.profilePhoto) setProfilePhoto(user.profilePhoto);
      if (user.coverPhoto) setCoverPhoto(user.coverPhoto);
    }
  }, [user]);

  // 1. Save Account Profile Changes
  const handleSaveAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName?.trim()) {
      triggerError(isUr ? 'پورا نام درج کرنا لازمی ہے!' : 'Full Name is required!');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      const selectedAreaName = areasList.find(a => a.id === areaId)?.name || area;

      const updatedUser: User = {
        ...user,
        fullName,
        username: username?.trim(),
        bio: bio?.trim(),
        email: email?.trim(),
        mobileNumber: phone?.trim(),
        area: selectedAreaName,
        profilePhoto,
        coverPhoto,
                provinceId,
        cityId,
        areaId,
        latitude,
        longitude
      };
      
      onUpdateUser(updatedUser);
      setIsSubmitting(false);
      triggerSuccess(t.savedSuccess);
    }, 800);
  };

  // 2. Change Password Simulation
  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      triggerError(isUr ? 'موجودہ پاس ورڈ درج کریں' : 'Please enter your current password');
      return;
    }
    if (newPassword.length < 6) {
      triggerError(t.passShort);
      return;
    }
    if (newPassword !== confirmPassword) {
      triggerError(t.passMismatch);
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setIsSubmitting(false);
      triggerSuccess(t.passChanged);
    }, 1000);
  };

  // 3. Block user
  const handleBlockUser = (e: React.FormEvent) => {
    e.preventDefault();
    const userToBlock = blockInput?.trim().replace('@', '');
    if (!userToBlock) return;

    if (personalization.privacy.blockedUsers.includes(userToBlock)) {
      triggerError(isUr ? 'یہ صارف پہلے سے بلاک ہے!' : 'User is already blocked!');
      return;
    }

    setPersonalization(prev => ({
      ...prev,
      privacy: {
        ...prev.privacy,
        blockedUsers: [...prev.privacy.blockedUsers, userToBlock]
      }
    }));
    setBlockInput('');
    triggerSuccess(isUr ? `@${userToBlock} کو بلاک کر دیا گیا ہے` : `@${userToBlock} has been blocked.`);
  };

  // 4. Unblock user
  const handleUnblockUser = (uName: string) => {
    setPersonalization(prev => ({
      ...prev,
      privacy: {
        ...prev.privacy,
        blockedUsers: prev.privacy.blockedUsers.filter(u => u !== uName)
      }
    }));
    triggerSuccess(isUr ? `@${uName} کو بلاک لسٹ سے ہٹا دیا گیا ہے` : `@${uName} has been unblocked.`);
  };

  // 5. Revoke session
  const handleRevokeSession = (id: string, deviceName: string) => {
    if (window.confirm(isUr ? `کیا آپ واقعی اس آلہ (${deviceName}) کو منقطع کرنا چاہتے ہیں؟` : `Are you sure you want to revoke access for ${deviceName}?`)) {
      setSessions(prev => prev.filter(s => s.id !== id));
      triggerSuccess(t.sessionRevoked);
    }
  };

  // 6. Logout all other devices
  const handleLogoutAllOtherDevices = () => {
    if (window.confirm(isUr ? 'کیا آپ دوسرے تمام سیشنز سے لاگ آؤٹ کرنا چاہتے ہیں؟' : 'Are you sure you want to log out from all other devices?')) {
      setSessions(prev => prev.filter(s => s.isCurrent));
      triggerSuccess(t.logoutAllSuccess);
    }
  };

  // 7. Clear storage cache simulation
  const handleClearCache = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setPersonalization(prev => ({
        ...prev,
        storage: {
          ...prev.storage,
          cacheSizeMb: 0
        }
      }));
      setIsSubmitting(false);
      triggerSuccess(t.cacheCleared);
    }, 1500);
  };

  // 8. Delete offline file
  const handleDeleteFile = (id: string, fileName: string) => {
    setPersonalization(prev => ({
      ...prev,
      storage: {
        ...prev.storage,
        downloadedFiles: prev.storage.downloadedFiles.filter(f => f.id !== id)
      }
    }));
    triggerSuccess(isUr ? `${fileName} کو ہٹا دیا گیا ہے` : `${fileName} was deleted.`);
  };

  // 9. Report Problem Ticket Submission
  const handleReportProblem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!technicalProblem?.trim()) return;

    setIsSubmitting(true);
    const refId = Math.floor(1000 + Math.random() * 9000);
    setTimeout(() => {
      setTicketReference(refId.toString());
      setTechnicalProblem('');
      setIsSubmitting(false);
      triggerSuccess(`${t.ticketSubmitted}${refId}`);
    }, 1200);
  };

  // 10. Submit Feedback
  const handleSubmitFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (!portalFeedback?.trim()) return;

    setIsSubmitting(true);
    setTimeout(() => {
      setPortalFeedback('');
      setIsSubmitting(false);
      triggerSuccess(t.feedbackSuccess);
    }, 1000);
  };

  // Active sub-route determination based on currentPath
  const getSubRoute = () => {
    if (currentPath.endsWith('/account')) return 'account';
    if (currentPath.endsWith('/privacy')) return 'privacy';
    if (currentPath.endsWith('/notifications')) return 'notifications';
    if (currentPath.endsWith('/security')) return 'security';
    if (currentPath.endsWith('/preferences') || currentPath.endsWith('/appearance')) return 'appearance';
    if (currentPath.endsWith('/language')) return 'language';
    if (currentPath.endsWith('/storage') || currentPath.endsWith('/data')) return 'storage';
    if (currentPath.endsWith('/about')) return 'about';
    if (currentPath.endsWith('/help')) return 'help';
    return 'home';
  };

  const activeSubRoute = getSubRoute();

  // Helper list of categories for Settings Menu with custom icons and paths
  const SETTINGS_SECTIONS = [
    { id: 'account', label: t.tabAccount, desc: t.descAccount, icon: UserIcon, path: '/settings/account', color: 'bg-blue-50 text-blue-600' },
    { id: 'privacy', label: t.tabPrivacy, desc: t.descPrivacy, icon: Shield, path: '/settings/privacy', color: 'bg-emerald-50 text-emerald-600' },
    { id: 'notifications', label: t.tabNotifications, desc: t.descNotifications, icon: Bell, path: '/settings/notifications', color: 'bg-amber-50 text-amber-600' },
    { id: 'security', label: t.tabSecurity, desc: t.descSecurity, icon: Lock, path: '/settings/security', color: 'bg-indigo-50 text-indigo-600' },
    { id: 'appearance', label: t.tabAppearance, desc: t.descAppearance, icon: Palette, path: '/settings/preferences', color: 'bg-pink-50 text-pink-600' },
    { id: 'language', label: t.tabLanguage, desc: t.descLanguage, icon: Globe, path: '/settings/language', color: 'bg-purple-50 text-purple-600' },
    { id: 'storage', label: t.tabStorage, desc: t.descStorage, icon: HardDrive, path: '/settings/storage', color: 'bg-teal-50 text-teal-600' },
    { id: 'about', label: t.tabAbout, desc: t.descAbout, icon: Info, path: '/settings/about', color: 'bg-slate-100 text-slate-700' },
    { id: 'help', label: t.tabHelp, desc: t.descHelp, icon: HelpCircle, path: '/settings/help', color: 'bg-sky-50 text-sky-600' }
  ];

  // Quick Action category selector for responsive view
  const renderSettingsSidebar = () => {
    return (
      <div className="space-y-2">
        {SETTINGS_SECTIONS.map((section) => {
          const isActive = activeSubRoute === section.id;
          return (
            <button
              key={section.id}
              onClick={() => navigate(section.path)}
              className={`w-full flex items-center gap-3.5 p-3.5 rounded-2xl transition-all text-start cursor-pointer border ${
                isActive
                  ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-500/10'
                  : 'bg-white hover:bg-slate-50 border-slate-200/50 text-slate-800'
              }`}
            >
              <div className={`w-9.5 h-9.5 rounded-xl flex items-center justify-center shrink-0 ${
                isActive ? 'bg-white/20 text-white' : section.color
              }`}>
                <section.icon className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-xs font-black tracking-tight ${isActive ? 'text-white' : 'text-slate-900'}`}>
                  {section.label}
                </p>
                <p className={`text-[10px] truncate mt-0.5 font-bold ${isActive ? 'text-blue-100' : 'text-slate-400'}`}>
                  {section.desc}
                </p>
              </div>
              <ChevronRight className={`w-4 h-4 shrink-0 transition-transform ${
                isActive ? 'text-white translate-x-0.5' : 'text-slate-300'
              }`} />
            </button>
          );
        })}
      </div>
    );
  };

  // Sub-modules Renderer
  const renderActiveSection = () => {
    switch (activeSubRoute) {
      case 'account':
        return (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-slate-200/60 p-5 sm:p-7 shadow-xs space-y-7"
          >
            <div>
              <h2 className="text-base font-black text-slate-950 flex items-center gap-2">
                <UserIcon className="w-5 h-5 text-blue-600 stroke-[2.2]" />
                {t.editProfile}
              </h2>
              <p className="text-[11px] text-slate-400 font-bold mt-1 uppercase tracking-wider">
                Dhoke Hassu Connect Profile Directory
              </p>
            </div>

            {/* Profile and Cover Photo Editor */}
            <div className="space-y-4">
              <label className="block text-xs font-bold text-slate-700">{t.coverSelect}</label>
              
              {/* Cover Photo Frame */}
              <div className="relative h-32 rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                <img src={coverPhoto} alt="Cover" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/25 flex items-center justify-center">
                  <div className="flex gap-2">
                    {COVER_PRESETS.map((p, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCoverPhoto(p)}
                        className={`w-7 h-7 rounded-lg border-2 overflow-hidden cursor-pointer ${
                          coverPhoto === p ? 'border-white scale-110' : 'border-transparent opacity-80'
                        }`}
                      >
                        <img src={p} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Profile Photo Avatar selection */}
              <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
                <div className="relative">
                  <img
                    src={profilePhoto}
                    alt="Avatar"
                    className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-md ring-4 ring-slate-100"
                  />
                  <div className="absolute -bottom-1 -end-1 bg-blue-600 text-white p-1 rounded-full shadow border border-white">
                    <Camera className="w-3.5 h-3.5" />
                  </div>
                </div>
                
                <div className="flex-1 space-y-2 text-center sm:text-start">
                  <span className="text-xs font-bold text-slate-700">{t.avatarSelect}</span>
                  <div className="flex flex-wrap justify-center sm:justify-start gap-1.5">
                    {AVATAR_PRESETS.map((p, idx) => (
                      <button
                        key={idx}
                        onClick={() => setProfilePhoto(p)}
                        className={`w-8 h-8 rounded-full overflow-hidden border-2 cursor-pointer ${
                          profilePhoto === p ? 'border-blue-600 scale-105 shadow-sm' : 'border-transparent'
                        }`}
                      >
                        <img src={p} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Account Information Form Fields */}
            <form onSubmit={handleSaveAccount} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">{t.fullName}</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600 focus:bg-white transition-all"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">{t.username}</label>
                  <div className="relative">
                    <span className="absolute start-3.5 top-2.5 text-xs text-slate-400 font-bold">@</span>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                      className="w-full text-xs ps-7 pe-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600 focus:bg-white transition-all"
                      placeholder="username"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">{t.emailLabel}</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600 focus:bg-white transition-all"
                    placeholder="name@domain.com"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">{t.phoneLabel}</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
                    className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600 focus:bg-white transition-all"
                    placeholder="03xxxxxxxxx"
                  />
                </div>
              </div>

              {/* Cascading Location Selectors */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">{currentLanguage === 'en' ? 'Country' : 'ملک'} *</label>
                  <select
                    onChange={(e) => {
                      setCountryId(e.target.value);
                      setProvinceId('');
                      setCityId('');
                      setAreaId('');
                    }}
                    className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600 focus:bg-white transition-all cursor-pointer font-bold"
                  >
                                                          </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">{currentLanguage === 'en' ? 'Province / State' : 'صوبہ / ریاست'} *</label>
                  <select
                    value={provinceId}
                    onChange={(e) => {
                      setProvinceId(e.target.value);
                      setCityId('');
                      setAreaId('');
                    }}
                    className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600 focus:bg-white transition-all cursor-pointer font-bold disabled:opacity-50"
                  >
                    <option value="" disabled>{currentLanguage === 'en' ? 'Select Province' : 'صوبہ منتخب کریں'}</option>
                    {provincesList.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">{currentLanguage === 'en' ? 'City' : 'شہر'} *</label>
                  <select
                    value={cityId}
                    onChange={(e) => {
                      setCityId(e.target.value);
                      setAreaId('');
                    }}
                    disabled={!provinceId}
                    className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600 focus:bg-white transition-all cursor-pointer font-bold disabled:opacity-50"
                  >
                    <option value="" disabled>{currentLanguage === 'en' ? 'Select City' : 'شہر منتخب کریں'}</option>
                    {citiesList.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">{currentLanguage === 'en' ? 'Area / Locality' : 'علاقہ / محلہ'} *</label>
                  <select
                    value={areaId}
                    onChange={(e) => setAreaId(e.target.value)}
                    disabled={!cityId}
                    className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600 focus:bg-white transition-all cursor-pointer font-bold disabled:opacity-50"
                  >
                    <option value="" disabled>{currentLanguage === 'en' ? 'Select Area' : 'علاقہ منتخب کریں'}</option>
                    {areasList.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                </div>
              </div>

              {/* Optional GPS auto-detection button */}
              <div className="bg-slate-50 p-4 border border-slate-100 rounded-2xl flex flex-col items-center gap-2">
                <span className="text-[10px] uppercase font-black tracking-wider text-slate-400">
                  ⚡ {currentLanguage === 'en' ? 'GPS Coordinates (Optional)' : 'جی پی ایس مقامات (اختیاری)'}
                </span>
                <button
                  type="button"
                  onClick={async () => {
                    setLoadingGPS(true);
                    const coords = await detectBrowserLocation();
                    if (coords) {
                      setLatitude(coords.latitude);
                      setLongitude(coords.longitude);
                      if (cityId) {
                        const nearest = await findNearestArea(coords.latitude, coords.longitude, cityId);
                        if (nearest) {
                          setAreaId(nearest.id);
                        }
                      }
                    }
                    setLoadingGPS(false);
                  }}
                  className="flex items-center gap-2 py-2 px-4 text-xs font-black bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-all cursor-pointer shadow-xs"
                >
                  <Compass className={`w-4 h-4 text-blue-500 ${loadingGPS ? 'animate-spin' : ''}`} />
                  <span>{currentLanguage === 'en' ? 'Detect Location GPS' : 'جی پی ایس لوکیشن معلوم کریں'}</span>
                </button>
                {latitude !== undefined && longitude !== undefined && (
                  <span className="text-[10px] text-emerald-600 font-bold">
                    📍 Lat: {latitude.toFixed(5)}, Lng: {longitude.toFixed(5)}
                  </span>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">{t.bioLabel}</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600 focus:bg-white transition-all resize-none"
                  placeholder={t.profilePlaceholder}
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => navigate('/settings')}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  {t.cancelBtn}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-[#2563eb] hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm hover:shadow flex items-center gap-2 cursor-pointer"
                >
                  {isSubmitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  {t.saveBtn}
                </button>
              </div>
            </form>
          </motion.div>
        );

      case 'privacy':
        return (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-slate-200/60 p-5 sm:p-7 shadow-xs space-y-7"
          >
            <div>
              <h2 className="text-base font-black text-slate-950 flex items-center gap-2">
                <Shield className="w-5 h-5 text-emerald-600 stroke-[2.2]" />
                {t.tabPrivacy}
              </h2>
              <p className="text-[11px] text-slate-400 font-bold mt-1 uppercase tracking-wider">
                Dhoke Hassu Security & Encryption Protocols
              </p>
            </div>

            {/* Profile visibility toggler */}
            <div className="p-4 bg-slate-50 border border-slate-200/50 rounded-xl space-y-3.5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-black text-slate-900">{t.privateProfile}</h3>
                  <p className="text-[10px] text-slate-400 font-bold mt-0.5">
                    {isUr ? 'لوگوں کے لیے آپ کا پروفائل مخفی رکھیں' : 'Hide your profile activity from public view.'}
                  </p>
                </div>
                <button
                  onClick={() => setPersonalization(prev => ({
                    ...prev,
                    privacy: { ...prev.privacy, isPrivate: !prev.privacy.isPrivate }
                  }))}
                  className={`w-11 h-6 rounded-full p-1 transition-colors ${
                    personalization.privacy.isPrivate ? 'bg-emerald-500' : 'bg-slate-200'
                  }`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full transition-transform shadow ${
                    personalization.privacy.isPrivate ? 'translate-x-5' : 'translate-x-0'
                  }`} />
                </button>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                {t.privateDesc}
              </p>
            </div>

            {/* Visibility Settings Dropdowns */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">{t.whoCanMessage}</label>
                <p className="text-[10px] text-slate-400 font-bold mb-2">{t.whoCanMessageDesc}</p>
                <select
                  value={personalization.privacy.whoCanMessage}
                  onChange={(e: any) => setPersonalization(prev => ({
                    ...prev,
                    privacy: { ...prev.privacy, whoCanMessage: e.target.value }
                  }))}
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer font-bold"
                >
                  <option value="everyone">{t.everyone}</option>
                  <option value="verified">{t.verifiedOnly}</option>
                  <option value="none">{isUr ? 'کوئی بھی نہیں' : 'No One'}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">{t.whoCanViewPosts}</label>
                <select
                  value={personalization.privacy.whoCanViewPosts}
                  onChange={(e: any) => setPersonalization(prev => ({
                    ...prev,
                    privacy: { ...prev.privacy, whoCanViewPosts: e.target.value }
                  }))}
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer font-bold"
                >
                  <option value="everyone">{t.everyone}</option>
                  <option value="followers">{t.followersOnly}</option>
                  <option value="me">{t.onlyMe}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">{t.whoCanSeePhone}</label>
                <select
                  value={personalization.privacy.whoCanSeePhone}
                  onChange={(e: any) => setPersonalization(prev => ({
                    ...prev,
                    privacy: { ...prev.privacy, whoCanSeePhone: e.target.value }
                  }))}
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer font-bold"
                >
                  <option value="everyone">{t.everyone}</option>
                  <option value="followers">{t.followersOnly}</option>
                  <option value="me">{t.onlyMe}</option>
                </select>
              </div>
            </div>

            {/* Blocked Users Section */}
            <div className="border-t border-slate-100 pt-6 space-y-4">
              <div>
                <h3 className="text-xs font-black text-slate-900">{t.blockedUsersTitle}</h3>
                <p className="text-[10px] text-slate-400 font-bold mt-0.5">{t.blockedDesc}</p>
              </div>

              <form onSubmit={handleBlockUser} className="flex gap-2">
                <input
                  type="text"
                  value={blockInput}
                  onChange={(e) => setBlockInput(e.target.value)}
                  placeholder={t.blockPlaceholder}
                  className="flex-1 text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:bg-white"
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-sm shrink-0"
                >
                  {t.blockBtn}
                </button>
              </form>

              <div className="space-y-2">
                {personalization.privacy.blockedUsers.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-2">{t.noBlocked}</p>
                ) : (
                  personalization.privacy.blockedUsers.map((blockedUser) => (
                    <div
                      key={blockedUser}
                      className="flex items-center justify-between p-3 border border-slate-100 rounded-xl hover:bg-slate-50/50"
                    >
                      <span className="text-xs font-bold text-slate-700">@{blockedUser}</span>
                      <button
                        onClick={() => handleUnblockUser(blockedUser)}
                        className="px-3 py-1 text-[10px] font-bold text-red-600 hover:text-white hover:bg-red-500 rounded-lg border border-red-100 hover:border-red-500 transition-all cursor-pointer"
                      >
                        {t.unblockBtn}
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        );

      case 'notifications':
        return (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-slate-200/60 p-5 sm:p-7 shadow-xs space-y-7"
          >
            <div>
              <h2 className="text-base font-black text-slate-950 flex items-center gap-2">
                <Bell className="w-5 h-5 text-amber-500 stroke-[2.2]" />
                {t.tabNotifications}
              </h2>
              <p className="text-[11px] text-slate-400 font-bold mt-1 uppercase tracking-wider">
                Dhoke Hassu Direct Alert Dispatcher
              </p>
            </div>

            {/* Notification Delivery Channels */}
            <div className="space-y-4">
              <div>
                <h3 className="text-xs font-black text-slate-900">{t.notificationChannels}</h3>
                <p className="text-[10px] text-slate-400 font-bold mt-0.5">{t.channelsDesc}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {([
                  { key: 'push', label: t.channelPush },
                  { key: 'inApp', label: t.channelInApp },
                  { key: 'sound', label: t.channelSound },
                  { key: 'vibration', label: t.channelVibration }
                ] as const).map((channel) => {
                  const val = personalization.notifications.channels[channel.key];
                  return (
                    <button
                      key={channel.key}
                      onClick={() => setPersonalization(prev => ({
                        ...prev,
                        notifications: {
                          ...prev.notifications,
                          channels: { ...prev.notifications.channels, [channel.key]: !val }
                        }
                      }))}
                      className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer text-start transition-all ${
                        val ? 'bg-amber-50/40 border-amber-200/60' : 'bg-white border-slate-200/40'
                      }`}
                    >
                      <span className="text-xs font-bold text-slate-700">{channel.label}</span>
                      <div className={`w-8 h-4 rounded-full p-0.5 transition-colors ${
                        val ? 'bg-amber-500' : 'bg-slate-200'
                      }`}>
                        <div className={`w-3 h-3 bg-white rounded-full transition-transform ${
                          val ? 'translate-x-4' : 'translate-x-0'
                        }`} />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Notification Categories list */}
            <div className="border-t border-slate-100 pt-6 space-y-4">
              <div>
                <h3 className="text-xs font-black text-slate-900">{t.notificationCategories}</h3>
                <p className="text-[10px] text-slate-400 font-bold mt-0.5">{t.categoriesDesc}</p>
              </div>

              <div className="space-y-2 max-h-[350px] overflow-y-auto pe-1 no-scrollbar">
                {([
                  { key: 'community', label: t.catCommunity },
                  { key: 'chat', label: t.catChat },
                  { key: 'events', label: t.catEvents },
                  { key: 'businesses', label: t.catBusinesses },
                  { key: 'jobs', label: t.catJobs },
                  { key: 'marketplace', label: t.catMarketplace },
                  { key: 'services', label: t.catServices },
                  { key: 'property', label: t.catProperty },
                  { key: 'deals', label: t.catDeals },
                  { key: 'alerts', label: t.catAlerts },
                  { key: 'followers', label: t.catGroups },
                  { key: 'system', label: t.catSystem }
                ] as const).map((cat) => {
                  const val = personalization.notifications.categories[cat.key];
                  return (
                    <div
                      key={cat.key}
                      className="flex items-center justify-between p-3 border-b border-slate-100/75 last:border-0"
                    >
                      <span className="text-xs font-bold text-slate-700">{cat.label}</span>
                      <button
                        onClick={() => setPersonalization(prev => ({
                          ...prev,
                          notifications: {
                            ...prev.notifications,
                            categories: { ...prev.notifications.categories, [cat.key]: !val }
                          }
                        }))}
                        className={`w-9 h-5 rounded-full p-0.5 transition-colors cursor-pointer ${
                          val ? 'bg-amber-500' : 'bg-slate-200'
                        }`}
                      >
                        <div className={`w-4 h-4 bg-white rounded-full transition-transform ${
                          val ? 'translate-x-4' : 'translate-x-0'
                        }`} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        );

      case 'security':
        return (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-slate-200/60 p-5 sm:p-7 shadow-xs space-y-7"
          >
            <div>
              <h2 className="text-base font-black text-slate-950 flex items-center gap-2">
                <Lock className="w-5 h-5 text-indigo-600 stroke-[2.2]" />
                {t.tabSecurity}
              </h2>
              <p className="text-[11px] text-slate-400 font-bold mt-1 uppercase tracking-wider">
                Dhoke Hassu Portal Lockout Protocols
              </p>
            </div>

            {/* Change password form */}
            <form onSubmit={handleChangePassword} className="space-y-4">
              <h3 className="text-xs font-black text-slate-900">{t.changePassword}</h3>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">{t.currPassword}</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                    placeholder="••••••••"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">{t.newPassword}</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                      placeholder="••••••••"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">{t.confirmPassword}</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-[#2563eb] hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer"
                >
                  {isUr ? 'پاس ورڈ تبدیل کریں' : 'Update Password'}
                </button>
              </div>
            </form>

            {/* Devices & active sessions */}
            <div className="border-t border-slate-100 pt-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-xs font-black text-slate-900">{t.deviceTitle}</h3>
                  <p className="text-[10px] text-slate-400 font-bold mt-0.5">
                    {isUr ? 'آلات جو آپ کے اکاؤنٹ میں لاگ ان ہیں' : 'Devices authorized to access your profile.'}
                  </p>
                </div>
                {sessions.length > 1 && (
                  <button
                    onClick={handleLogoutAllOtherDevices}
                    className="px-3.5 py-2 text-red-600 hover:text-white hover:bg-red-600 rounded-xl border border-red-100 hover:border-red-600 text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm shrink-0"
                  >
                    {t.logoutAllBtn}
                  </button>
                )}
              </div>

              <div className="space-y-3.5">
                {sessions.map((sess) => (
                  <div
                    key={sess.id}
                    className="flex items-start justify-between p-4 border border-slate-100 rounded-xl hover:bg-slate-50/40"
                  >
                    <div className="flex gap-3">
                      <div className="p-2 bg-slate-100 rounded-xl text-slate-600 mt-0.5">
                        <Smartphone className="w-5 h-5 stroke-[2.2]" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-black text-slate-800">{sess.device}</p>
                          {sess.isCurrent && (
                            <span className="text-[9px] bg-green-50 text-green-600 border border-green-100 px-1.5 py-0.5 rounded-full font-black uppercase">
                              {t.sessCurrent}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400 font-bold mt-1">
                          IP: {sess.ip} • {sess.date}
                        </p>
                      </div>
                    </div>

                    {!sess.isCurrent && (
                      <button
                        onClick={() => handleRevokeSession(sess.id, sess.device)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        title={t.revokeBtn}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        );

      case 'appearance':
        return (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-slate-200/60 p-5 sm:p-7 shadow-xs space-y-7"
          >
            <div>
              <h2 className="text-base font-black text-slate-950 flex items-center gap-2">
                <Palette className="w-5 h-5 text-pink-500 stroke-[2.2]" />
                {t.tabAppearance}
              </h2>
              <p className="text-[11px] text-slate-400 font-bold mt-1 uppercase tracking-wider">
                Personalization Layout Customizer
              </p>
            </div>

            {/* Preset selectors */}
            <div className="space-y-4">
              <div>
                <h3 className="text-xs font-black text-slate-900">{t.themeSelection}</h3>
                <p className="text-[10px] text-slate-400 font-bold mt-0.5">{t.themeDesc}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { mode: 'light', label: t.themeLight, icon: Sun, desc: 'Optimized for day-time clarity.', bg: 'bg-white text-slate-800 border-slate-200 ring-slate-100' },
                  { mode: 'dark', label: t.themeDark, icon: Moon, desc: 'Restful night interface.', bg: 'bg-slate-900 text-slate-100 border-slate-800 ring-slate-900/50' },
                  { mode: 'system', label: t.themeSystem, icon: Monitor, desc: 'Syncs with system settings.', bg: 'bg-slate-50 text-slate-800 border-slate-200 ring-slate-200/50' }
                ].map((item) => {
                  const active = personalization.appearance === item.mode;
                  return (
                    <button
                      key={item.mode}
                      onClick={() => {
                        setPersonalization(prev => ({ ...prev, appearance: item.mode as any }));
                        triggerSuccess(isUr ? 'تھیم تبدیل کر دی گئی ہے' : 'Appearance theme saved!');
                        
                        // Actually apply the style
                        if (item.mode === 'dark') {
                          document.documentElement.classList.add('dark');
                        } else {
                          document.documentElement.classList.remove('dark');
                        }
                      }}
                      className={`flex flex-col p-4 rounded-xl border text-start cursor-pointer transition-all ${
                        active
                          ? 'border-blue-600 ring-4 ring-blue-50'
                          : 'border-slate-200/60 hover:bg-slate-50/50'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-3 ${item.bg}`}>
                        <item.icon className="w-4.5 h-4.5" />
                      </div>
                      
                      <p className="text-xs font-black text-slate-800 flex items-center justify-between w-full">
                        {item.label}
                        {active && (
                          <span className="text-[8px] bg-blue-50 text-blue-600 border border-blue-100 px-1.5 py-0.5 rounded-full font-black uppercase">
                            {t.themeActive}
                          </span>
                        )}
                      </p>
                      
                      <p className="text-[10px] text-slate-400 font-bold mt-1.5">
                        {item.desc}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        );

      case 'language':
        return (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-slate-200/60 p-5 sm:p-7 shadow-xs space-y-7"
          >
            <div>
              <h2 className="text-base font-black text-slate-950 flex items-center gap-2">
                <Globe className="w-5 h-5 text-purple-600 stroke-[2.2]" />
                {t.tabLanguage}
              </h2>
              <p className="text-[11px] text-slate-400 font-bold mt-1 uppercase tracking-wider">
                Bilingual Regional Dialects & UI
              </p>
            </div>

            {/* Language selectors */}
            <div className="space-y-4">
              <div>
                <h3 className="text-xs font-black text-slate-900">{t.appLang}</h3>
                <p className="text-[10px] text-slate-400 font-bold mt-0.5">{t.langDesc}</p>
              </div>

              <div className="space-y-2.5">
                {[
                  { code: 'en', label: t.enLabel, sub: 'Default English localization with Standard Rawalpindi terminology.', flag: '🇬🇧' },
                  { code: 'ur', label: t.urLabel, sub: 'مقامی اردو ترجمہ اور مکمل دائیں سے بائیں (RTL) مدد کے ساتھ۔', flag: '🇵🇰' }
                ].map((lang) => {
                  const active = currentLanguage === lang.code;
                  return (
                    <button
                      key={lang.code}
                      onClick={() => {
                        onLanguageChange(lang.code as Language);
                        triggerSuccess(lang.code === 'ur' ? 'زبان تبدیل ہو گئی ہے!' : 'Language updated to English!');
                      }}
                      className={`w-full flex items-center justify-between p-4 rounded-xl border text-start cursor-pointer transition-all ${
                        active
                          ? 'border-purple-500 bg-purple-50/10 shadow-sm'
                          : 'border-slate-200/60 hover:bg-slate-50/50'
                      }`}
                    >
                      <div className="flex gap-3 items-center">
                        <span className="text-2xl shrink-0">{lang.flag}</span>
                        <div>
                          <p className="text-xs font-black text-slate-800">{lang.label}</p>
                          <p className="text-[10px] text-slate-400 font-bold mt-0.5">{lang.sub}</p>
                        </div>
                      </div>
                      
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        active ? 'border-purple-600 bg-purple-600 text-white' : 'border-slate-300'
                      }`}>
                        {active && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        );

      case 'storage':
        return (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-slate-200/60 p-5 sm:p-7 shadow-xs space-y-7"
          >
            <div>
              <h2 className="text-base font-black text-slate-950 flex items-center gap-2">
                <HardDrive className="w-5 h-5 text-teal-600 stroke-[2.2]" />
                {t.tabStorage}
              </h2>
              <p className="text-[11px] text-slate-400 font-bold mt-1 uppercase tracking-wider">
                Dhoke Hassu App Data Allocations
              </p>
            </div>

            {/* Offline Cache sizes */}
            <div className="p-4 bg-slate-50 border border-slate-200/50 rounded-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-xs font-black text-slate-900">{t.cacheTitle}</h3>
                  <p className="text-[10px] text-slate-400 font-bold mt-0.5">{t.cacheDesc}</p>
                </div>
                {personalization.storage.cacheSizeMb > 0 && (
                  <button
                    onClick={handleClearCache}
                    className="px-3.5 py-2 bg-red-50 hover:bg-red-600 text-red-600 hover:text-white border border-red-100 hover:border-red-600 text-xs font-black rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-xs shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    {t.clearCacheBtn}
                  </button>
                )}
              </div>

              {/* Cache size meter */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-600">
                  <span>{t.cacheSizeText}</span>
                  <span className="font-mono text-xs text-teal-600 font-black">{personalization.storage.cacheSizeMb.toFixed(1)} MB</span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-teal-500 h-full transition-all duration-500"
                    style={{ width: `${Math.min(100, (personalization.storage.cacheSizeMb / 100) * 100)}%` }}
                  />
                </div>
                <p className="text-[10px] text-slate-400 font-bold">
                  {isUr ? 'اسٹوریج کو خالی کرنے سے تصاویر کو دوبارہ لوڈ کرنا پڑ سکتا ہے۔' : 'Clearing cache will free up device memory but images will reload next time.'}
                </p>
              </div>
            </div>

            {/* Downloaded Guides list */}
            <div className="space-y-4">
              <div>
                <h3 className="text-xs font-black text-slate-900">{t.downloadsTitle}</h3>
                <p className="text-[10px] text-slate-400 font-bold mt-0.5">
                  {isUr ? 'آف لائن پڑھنے کے لیے فائلیں' : 'Files saved locally for quick viewing.'}
                </p>
              </div>

              <div className="space-y-2">
                {personalization.storage.downloadedFiles.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-2">{t.noDownloads}</p>
                ) : (
                  personalization.storage.downloadedFiles.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center justify-between p-3 border border-slate-100 rounded-xl hover:bg-slate-50/50"
                    >
                      <div>
                        <p className="text-xs font-black text-slate-700">{file.name}</p>
                        <p className="text-[10px] text-slate-400 font-bold mt-0.5">
                          Size: {file.size} • Downloaded: {file.date}
                        </p>
                      </div>
                      
                      <button
                        onClick={() => handleDeleteFile(file.id, file.name)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        title={t.deleteFileBtn}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        );

      case 'about':
        return (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-slate-200/60 p-5 sm:p-7 shadow-xs space-y-7"
          >
            <div>
              <h2 className="text-base font-black text-slate-950 flex items-center gap-2">
                <Info className="w-5 h-5 text-slate-700 stroke-[2.2]" />
                {t.tabAbout}
              </h2>
              <p className="text-[11px] text-slate-400 font-bold mt-1 uppercase tracking-wider">
                District Rawalpindi Portal specifications
              </p>
            </div>

            {/* Specifications Card */}
            <div className="p-4 bg-slate-50 border border-slate-200/50 rounded-xl space-y-3.5">
              <div className="flex justify-between items-center border-b border-slate-200 pb-2.5">
                <span className="text-xs font-bold text-slate-600">{t.appVer}</span>
                <span className="text-xs font-mono font-black text-slate-800">{t.verDetails}</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-200 pb-2.5">
                <span className="text-xs font-bold text-slate-600">{isUr ? 'مقام' : 'Coverage Location'}</span>
                <span className="text-xs font-bold text-slate-800">📍 Dhoke Hassu, Rawalpindi, Pakistan</span>
              </div>
              <div className="flex justify-between items-center pb-0">
                <span className="text-xs font-bold text-slate-600">{isUr ? 'لائسنس' : 'Platform License'}</span>
                <span className="text-xs font-mono font-black text-slate-800">Apache 2.0 Open Source</span>
              </div>
            </div>

            {/* Legal Documents */}
            <div className="space-y-3">
              <h3 className="text-xs font-black text-slate-900">{isUr ? 'قانونی اور شرائط' : 'Legal & Policies'}</h3>
              
              <div className="space-y-2">
                {[
                  { name: t.privacyPolicy, url: '#privacy' },
                  { name: t.termsAndConditions, url: '#terms' }
                ].map((doc, idx) => (
                  <button
                    key={idx}
                    onClick={() => triggerSuccess(isUr ? `${doc.name} کا لنک کھولا جا رہا ہے` : `Navigating to ${doc.name}...`)}
                    className="w-full flex items-center justify-between p-3.5 border border-slate-150 rounded-xl hover:bg-slate-50/50 text-start cursor-pointer"
                  >
                    <span className="text-xs font-bold text-slate-700">{doc.name}</span>
                    <ExternalLink className="w-4 h-4 text-slate-400" />
                  </button>
                ))}
              </div>
            </div>

            {/* Engineering Support details */}
            <div className="border-t border-slate-100 pt-6 space-y-4">
              <div>
                <h3 className="text-xs font-black text-slate-900">{t.contactSupport}</h3>
                <p className="text-[10px] text-slate-400 font-bold mt-0.5">{t.supportDesc}</p>
              </div>

              <div className="p-4 bg-blue-50/40 border border-blue-100 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="text-xs text-slate-700 space-y-1">
                  <p className="font-bold">📧 rawalpindi.support@punjab.gov.pk</p>
                  <p className="text-[10px] text-slate-400 font-semibold">Response hours: 9 AM - 5 PM (Mon - Fri)</p>
                </div>
                <button
                  onClick={() => window.open('mailto:rawalpindi.support@punjab.gov.pk')}
                  className="px-4 py-2 bg-[#2563eb] hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
                >
                  {t.supportBtn}
                </button>
              </div>
            </div>
          </motion.div>
        );

      case 'help':
        return (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-slate-200/60 p-5 sm:p-7 shadow-xs space-y-7"
          >
            <div>
              <h2 className="text-base font-black text-slate-950 flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-sky-500 stroke-[2.2]" />
                {t.tabHelp}
              </h2>
              <p className="text-[11px] text-slate-400 font-bold mt-1 uppercase tracking-wider">
                Dhoke Hassu Direct Assistance Hotline
              </p>
            </div>

            {/* FAQ Accordion */}
            <div className="space-y-4">
              <h3 className="text-xs font-black text-slate-900">{t.faqTitle}</h3>
              
              <div className="space-y-2.5">
                {[
                  { q: t.faq1Q, a: t.faq1A },
                  { q: t.faq2Q, a: t.faq2A },
                  { q: t.faq3Q, a: t.faq3A },
                  { q: t.faq4Q, a: t.faq4A }
                ].map((faq, idx) => (
                  <div key={idx} className="p-4 border border-slate-100 rounded-xl bg-slate-50/30">
                    <p className="text-xs font-black text-slate-800 flex items-start gap-2">
                      <span className="text-blue-600 font-extrabold">Q:</span>
                      {faq.q}
                    </p>
                    <p className="text-[11px] text-slate-500 leading-relaxed font-medium mt-1.5 ps-4 border-s-2 border-slate-200">
                      {faq.a}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Issue Reporting Form */}
            <div className="border-t border-slate-100 pt-6 space-y-4">
              <h3 className="text-xs font-black text-slate-900">{t.reportProblem}</h3>

              <form onSubmit={handleReportProblem} className="space-y-3">
                <textarea
                  value={technicalProblem}
                  onChange={(e) => setTechnicalProblem(e.target.value)}
                  rows={3}
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600 focus:bg-white resize-none"
                  placeholder={t.problemPlaceholder}
                />
                
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isSubmitting || !technicalProblem?.trim()}
                    className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    {isSubmitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                    <Send className="w-3.5 h-3.5" />
                    {t.submitProblem}
                  </button>
                </div>
              </form>
            </div>

            {/* Portal Feedback Form */}
            <div className="border-t border-slate-100 pt-6 space-y-4">
              <h3 className="text-xs font-black text-slate-900">{t.feedbackTitle}</h3>

              <form onSubmit={handleSubmitFeedback} className="space-y-3">
                <textarea
                  value={portalFeedback}
                  onChange={(e) => setPortalFeedback(e.target.value)}
                  rows={3}
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600 focus:bg-white resize-none"
                  placeholder={t.feedbackPlaceholder}
                />
                
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isSubmitting || !portalFeedback?.trim()}
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    {isSubmitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                    <Sparkles className="w-3.5 h-3.5" />
                    {t.submitFeedback}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        );

      default:
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
            <div className="space-y-4">
              <div className="p-4 bg-white border border-slate-200/60 rounded-2xl shadow-xs space-y-3">
                <div className="flex items-center gap-3">
                  <img
                    src={user.profilePhoto || AVATAR_PRESETS[0]}
                    alt={user.fullName}
                    className="w-12 h-12 rounded-full object-cover border border-slate-200"
                  />
                  <div>
                    <h2 className="text-sm font-black text-slate-900 leading-tight">
                      {user.fullName}
                    </h2>
                    <p className="text-[10px] text-slate-400 font-bold mt-0.5">
                      {user.username ? `@${user.username}` : user.mobileNumber} • {user.area || 'Dhoke Hassu'}
                    </p>
                  </div>
                </div>
                
                {user.bio && (
                  <p className="text-xs text-slate-500 font-medium bg-slate-50 p-2.5 rounded-xl italic">
                    "{user.bio}"
                  </p>
                )}

                <button
                  onClick={() => navigate('/settings/account')}
                  className="w-full py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-600 text-xs font-black rounded-xl transition-colors cursor-pointer text-center"
                >
                  {isUr ? 'پروفائل کی معلومات تبدیل کریں' : 'Edit Profile Info'}
                </button>
              </div>

              {/* Status metrics card */}
              <div className="bg-white border border-slate-200/60 rounded-2xl p-4 shadow-xs space-y-3.5">
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                  ⚡ {isUr ? 'حفاظتی خلاصہ' : 'Security Status'}
                </h3>
                
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-600">
                    <span>{isUr ? 'حفاظتی بیج' : 'Verified Resident Status'}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-black uppercase border ${
                      user.verified
                        ? 'bg-blue-50 text-blue-600 border-blue-100'
                        : 'bg-amber-50 text-amber-600 border-amber-100'
                    }`}>
                      {user.verified ? (isUr ? 'تصدیق شدہ' : 'Verified') : (isUr ? 'غیر تصدیق شدہ' : 'Not Verified')}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs font-bold text-slate-600">
                    <span>{isUr ? 'پروفائل کی رازداری' : 'Profile Visibility'}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-black uppercase bg-slate-100 text-slate-600 border border-slate-200">
                      {personalization.privacy.isPrivate ? (isUr ? 'پرائیویٹ' : 'Private') : (isUr ? 'پبلک' : 'Public')}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs font-bold text-slate-600">
                    <span>{isUr ? 'فعال سیشنز' : 'Active Authorized Sessions'}</span>
                    <span className="font-mono text-xs text-slate-700 font-black">{sessions.length}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* List of subsettings categories on right side for desktop bento */}
            <div className="md:col-span-1">
              {renderSettingsSidebar()}
            </div>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6 relative">
      {/* Absolute alert banner for success/error notifications */}
      <AnimatePresence>
        {successToast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-20 end-4 sm:end-6 bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-lg border border-emerald-500 z-50 flex items-center gap-2.5 max-w-sm text-xs font-bold"
          >
            <CheckCircle className="w-5 h-5 shrink-0" />
            <p>{successToast}</p>
          </motion.div>
        )}

        {errorToast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-20 end-4 sm:end-6 bg-red-600 text-white px-4 py-3 rounded-xl shadow-lg border border-red-500 z-50 flex items-center gap-2.5 max-w-sm text-xs font-bold"
          >
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <p>{errorToast}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Settings Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            {activeSubRoute !== 'home' && (
              <button
                onClick={() => navigate('/settings')}
                className="p-1.5 hover:bg-slate-200 bg-slate-100 text-slate-700 rounded-lg transition-colors cursor-pointer"
                title={t.backToHome}
              >
                <ArrowLeft className="w-4.5 h-4.5 stroke-[2.2]" />
              </button>
            )}
            <h1 className="text-xl font-black text-slate-950 tracking-tight">
              {activeSubRoute === 'home' ? t.settingsTitle : t[`tab${activeSubRoute?.charAt(0)?.toUpperCase() + activeSubRoute?.slice(1)}` as keyof typeof t] || t.settingsTitle}
            </h1>
          </div>
          <p className="text-[11px] sm:text-xs text-slate-500 font-medium mt-1">
            {activeSubRoute === 'home' ? t.settingsSubtitle : isUr ? 'ڈھوک حسو کنیکٹ سمارٹ ترتیبات اور پیرامیٹرز' : 'Configure your local Rawalpindi district settings & values.'}
          </p>
        </div>

        {/* Back to Home Quick Action */}
        <button
          onClick={() => navigate('/home')}
          className="px-4 py-2 bg-slate-200/70 hover:bg-slate-200 text-slate-700 text-xs font-extrabold rounded-xl transition-all shadow-xs border border-slate-300/30 cursor-pointer shrink-0"
        >
          {isUr ? '← پورٹل ڈیش بورڈ' : '← Portal Dashboard'}
        </button>
      </div>

      {/* Responsive layout distribution */}
      {activeSubRoute === 'home' ? (
        // Settings index page
        renderActiveSection()
      ) : (
        // Settings detail sections with side bar for fast switching on tablet+
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <div className="hidden lg:block lg:col-span-1 space-y-4">
            <div className="bg-white p-4 border border-slate-200/50 rounded-2xl shadow-xs">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-3.5 px-1">
                ⚙️ {isUr ? 'ترتیبات کا مینو' : 'Quick Settings Navigator'}
              </h3>
              {renderSettingsSidebar()}
            </div>
          </div>
          
          <div className="lg:col-span-2">
            {renderActiveSection()}
          </div>
        </div>
      )}
    </div>
  );
}
