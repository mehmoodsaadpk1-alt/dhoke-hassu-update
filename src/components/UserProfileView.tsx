import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  MapPin,
  Calendar,
  MessageSquare,
  ShieldCheck,
  Award,
  Briefcase,
  Store,
  Building2,
  Share2,
  Phone,
  Globe,
  Facebook,
  Twitter,
  Linkedin,
  User as UserIcon,
  Heart,
  Flag
} from 'lucide-react';
import { Language, User, Post, JobItem, BusinessItem, BuySellItem, ServiceItem } from '../types';
import { isEntityVerified } from '../utils/verification';
import { AppAvatar, AppButton, AppBadge, AppTabs } from './ui';
import { UserPlus, UserCheck, Clock, MoreVertical, ShieldAlert } from 'lucide-react';
import { dbGetFollowStatus, dbFollowUser, dbUnfollowUser, dbRemoveFollower, dbBlockUser } from '../utils/supabaseClient';
import { supabase, isSupabaseConfigured } from '../utils/supabaseClient';
import HighlightsBar from './HighlightsBar';
import HighlightCreator from './HighlightCreator';
import StoryArchive from './StoryArchive';
import FollowListModal from './FollowListModal';
import OnlineIndicator from './OnlineIndicator';

interface UserProfileViewProps {
  /** The userId of the user being viewed (UUID or fallback name) */
  userId: string;
  /** Fallback name if fetching by ID fails or is not a UUID */
  fallbackName?: string;
  /** Fallback avatar if fetching by ID fails or is not a UUID */
  fallbackAvatar?: string;
  /** Current language */
  currentLanguage: Language;
  /** Navigate function from AppShell */
  navigate: (path: string, paramId?: string) => void;
  /** All posts (to filter by this user) */
  posts: Post[];
  /** All jobs */
  jobs: JobItem[];
  /** All businesses */
  businesses: BusinessItem[];
  /** All marketplace items */
  marketplaceItems: BuySellItem[];
  /** All services */
  services: ServiceItem[];
  /** The logged-in user (for "Message" button) */
  currentUser: User;
}

export default function UserProfileView({
  userId,
  fallbackName = '',
  fallbackAvatar,
  currentLanguage,
  navigate,
  posts,
  jobs,
  businesses,
  marketplaceItems,
  services,
  currentUser,
}: UserProfileViewProps) {
  const isEn = currentLanguage === 'en';
  const [activeTab, setActiveTab] = useState<'posts' | 'listings' | 'about'>('posts');
  
  // Is it a UUID?
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);
  const viewingName = isUuid ? (fallbackName || 'Loading...') : decodeURIComponent(userId);
  const viewingAvatar = fallbackAvatar;

  const isVerified = isEntityVerified(viewingName);
  
  
  const handleFollowToggle = async () => {
    if (!profile?.id || isSelf) return;
    setIsFollowLoading(true);
    if (followStatus === 'following' || followStatus === 'requested') {
      const success = await dbUnfollowUser(currentUser.id, profile.id);
      if (success) {
        setFollowStatus('none');
        if (followStatus === 'following') setFollowersCount(c => Math.max(0, c - 1));
      }
    } else {
      const res = await dbFollowUser(currentUser.id, profile.id);
      if (res.success) {
        setFollowStatus(res.status || 'requested');
        if (res.status === 'following') setFollowersCount(c => c + 1);
      }
    }
    setIsFollowLoading(false);
  };

  const handleBlock = async () => {
    if (!profile?.id || isSelf) return;
    if (window.confirm(isEn ? 'Block this user? They will not be able to interact with you.' : 'اس صارف کو بلاک کریں؟')) {
      await dbBlockUser(currentUser.id, profile.id);
      setFollowStatus('blocked');
    }
  };

  // Is this the logged-in user's own profile?
  const isSelf = userId === currentUser.id || viewingName === currentUser.fullName;

  const [profile, setProfile] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const [showArchive, setShowArchive] = useState(false);
  const [showHighlightCreator, setShowHighlightCreator] = useState(false);
  const [followStatus, setFollowStatus] = useState<'following' | 'requested' | 'none' | 'blocked'>('none');
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [showFollowModal, setShowFollowModal] = useState(false);
  const [activeFollowTab, setActiveFollowTab] = useState<'followers'|'following'>('followers');
  const [isFollowLoading, setIsFollowLoading] = useState(false);

  // Filter content by this user dynamically based on the resolved profileName
  const profileName = profile?.fullName || viewingName;
  const profileAvatar = profile?.profilePhoto || viewingAvatar;
  const profileCover = profile?.coverPhoto;
  const profileArea = profile?.area || 'Dhoke Hassu';
  const profileReputation = profile?.reputationScore ?? 100;
  const profileJoinDate = profile?.joinDate || 'August 2024';
  const profileUsername = profile?.username;

  const userPosts = posts.filter(p => p.author === profileName || (p.userId && p.userId === userId));
  const userJobs = jobs.filter(j => j.postedBy === profileName);
  const userBusinesses = businesses.filter(b => b.ownerName === profileName || b.contact === profileName);
  const userMarketplace = marketplaceItems.filter(m => m.sellerName === profileName);
  const userServices = services.filter(s => s.name === profileName || s.contact === profileName);

  const totalListings = userJobs.length + userBusinesses.length + userMarketplace.length + userServices.length;

  const handleBack = () => {
    window.history.back();
  };

  const handleMessage = () => {
    if ((window as any).openChat) {
      (window as any).openChat(userId || profileName, profileName, profileAvatar || '');
    } else {
      const url = `/chat/detail?contact=${encodeURIComponent(userId || profileName)}&name=${encodeURIComponent(profileName)}${profileAvatar ? `&avatar=${encodeURIComponent(profileAvatar)}` : ''}`;
      navigate(url);
    }
  };

  // Generate a consistent "member since" based on name hash
  const memberSince = React.useMemo(() => {
    let hash = 0;
    for (let i = 0; i < profileName.length; i++) {
      hash = ((hash << 5) - hash) + profileName.charCodeAt(i);
      hash |= 0;
    }
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const urMonths = ['جنوری', 'فروری', 'مارچ', 'اپریل', 'مئی', 'جون', 'جولائی', 'اگست', 'ستمبر', 'اکتوبر', 'نومبر', 'دسمبر'];
    const monthIdx = Math.abs(hash) % 12;
    const year = 2023 + (Math.abs(hash) % 3);
    return isEn ? `${months[monthIdx]} ${year}` : `${urMonths[monthIdx]} ${year}`;
  }, [profileName, isEn]);

  // Generate a reputation score from name
  const reputationScore = React.useMemo(() => {
    let hash = 0;
    for (let i = 0; i < profileName.length; i++) {
      hash = ((hash << 5) - hash) + profileName.charCodeAt(i);
    }
    return 50 + (Math.abs(hash) % 200);
  }, [profileName]);

  const badges = React.useMemo(() => {
    const all = [
      { id: 'active', labelEn: 'Active Member', labelUr: 'فعال رکن', emoji: '🌟' },
      { id: 'helpful', labelEn: 'Helpful', labelUr: 'مددگار', emoji: '🤝' },
      { id: 'trusted', labelEn: 'Trusted', labelUr: 'قابل اعتماد', emoji: '🛡️' },
    ];
    if (isVerified) {
      all.unshift({ id: 'verified', labelEn: 'Verified', labelUr: 'تصدیق شدہ', emoji: '✅' });
    }
    return all;
  }, [isVerified]);

  useEffect(() => {
    let active = true;

    // Generate fallback/mock profile first
    const mockProfile: User = {
      id: userId || 'mock-user-id',
      fullName: viewingName,
      email: `${viewingName?.toLowerCase().replace(/\s+/g, '')}@example.com`,
      area: 'Dhoke Hassu',
      joinDate: memberSince,
      reputationScore: reputationScore,
      verified: isVerified,
      profilePhoto: viewingAvatar,
      badges: badges.map(b => b.id)
    };

    if (!isSupabaseConfigured || !supabase) {
      setProfile(mockProfile);
      setIsLoading(false);
      return;
    }

    async function fetchProfile() {
      try {
        setIsLoading(true);
        setError(null);

        let query = supabase!.from('profiles').select('*');
        if (isUuid) {
          query = query.eq('user_id', userId);
        } else {
          query = query.ilike('full_name', viewingName);
        }

        const { data, error: fetchErr } = await query.limit(1);

        if (!active) return;

        if (fetchErr) {
          throw fetchErr;
        }

        if (data && data.length > 0) {
          const dbProf = data[0];
          setProfile({
            id: dbProf.user_id,
            fullName: dbProf.full_name,
            email: dbProf.email,
            area: dbProf.area || 'Dhoke Hassu',
            mobileNumber: dbProf.mobileNumber || undefined,
            username: dbProf.username || undefined,
            bio: dbProf.bio || undefined,
            joinDate: dbProf.joinDate || new Date(dbProf.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
            reputationScore: dbProf.reputationScore ?? 100,
            verified: dbProf.verified ?? false,
            profilePhoto: dbProf.profile_photo || undefined,
            coverPhoto: dbProf.coverPhoto || undefined,
            contactNumber: dbProf.contactNumber || undefined,
            socialLinks: dbProf.socialLinks || undefined,
            badges: dbProf.badges || []
          });
          setFollowersCount(dbProf.followers_count || 0);
          setFollowingCount(dbProf.following_count || 0);
          if (currentUser?.id && currentUser.id !== dbProf.user_id) {
            dbGetFollowStatus(currentUser.id, dbProf.user_id).then(setFollowStatus);
          }
          setIsLoading(false);
        } else {
          // If viewing self, fall back to currentUser state, else use the mockProfile
          if (viewingName === currentUser.fullName || userId === currentUser.id) {
            setProfile(currentUser);
          } else {
            setProfile(mockProfile);
          }
          setIsLoading(false);
        }
      } catch (err: any) {
        console.warn("Error fetching profile from Supabase:", err);
        if (active) {
          if (retryCount < 2) {
            setRetryCount(prev => prev + 1);
            setTimeout(fetchProfile, 500); // retry after 500ms
          } else {
            // Still fall back to mock profile instead of leaving a blank screen
            setProfile(mockProfile);
            setIsLoading(false);
          }
        }
      }
    }

    fetchProfile();
    return () => {
      active = false;
    };
  }, [userId, viewingName, retryCount]);

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto space-y-5 animate-pulse py-12 text-center">
        <div className="w-20 h-20 bg-slate-200 rounded-full mx-auto" />
        <div className="h-4 bg-slate-200 rounded w-1/3 mx-auto mt-4" />
        <div className="h-3 bg-slate-200 rounded w-1/2 mx-auto mt-2" />
        <p className="text-xs text-slate-400 font-semibold mt-4">
          {isEn ? 'Loading profile details...' : 'پروفائل کی تفصیلات لوڈ ہو رہی ہیں...'}
        </p>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="max-w-3xl mx-auto py-12 text-center space-y-4">
        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto text-2xl font-bold">
          ⚠️
        </div>
        <h2 className="text-lg font-black text-slate-800">
          {isEn ? 'User Not Found' : 'صارف نہیں ملا'}
        </h2>
        <p className="text-sm text-slate-500 max-w-md mx-auto">
          {error 
            ? (isEn ? `Failed to load profile: ${error}` : `پروفائل لوڈ کرنے میں خرابی: ${error}`)
            : (isEn ? `No public profile matches the name "${viewingName}".` : `نام "${viewingName}" کے ساتھ کوئی پروفائل نہیں ملا۔`)}
        </p>
        <button
          onClick={handleBack}
          className="px-5 py-2.5 bg-emerald-600 text-white text-xs font-bold rounded-2xl hover:bg-emerald-700 transition-colors border-0 cursor-pointer shadow-sm"
        >
          {isEn ? 'Go Back' : 'واپس جائیں'}
        </button>
      </div>
    );
  }



  return (
    <div className="max-w-3xl mx-auto space-y-5 animate-fade-in">
      {/* Back Button */}
      <button
        onClick={handleBack}
        className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer group mb-2"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        <span className="text-xs font-bold">{isEn ? 'Back' : 'واپس'}</span>
      </button>

      {/* Profile Header Card */}
      <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm overflow-hidden">
        {/* Cover Photo */}
        <div className="h-36 md:h-48 bg-gradient-to-br from-emerald-500 via-emerald-500 to-emerald-600 relative overflow-hidden">
          {profileCover && (
            <img src={profileCover} alt="" className="w-full h-full object-cover" />
          )}
          <div className="absolute inset-0 bg-black/10" />
          <div className="absolute bottom-0 start-0 end-0 h-20 bg-gradient-to-t from-black/30 to-transparent" />
        </div>

        {/* Avatar + Info */}
        <div className="px-5 pb-5 relative">
          <div className="flex flex-col items-start gap-3">
            {/* Avatar */}
            <div className="-mt-12 sm:-mt-16 relative z-10">
              <AppAvatar
                name={profileName ?? "Unknown User"}
                avatar={profileAvatar}
                size="xl"
                isVerified={isVerified}
                clickable={false}
                className="border-4 border-white shadow-lg"
              />
            </div>

            {/* Name & Meta */}
            <div className="w-full">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-black text-slate-950">{profileName}</h1>
                {isVerified && (
                  <AppBadge variant="primary">
                    <ShieldCheck className="w-3 h-3 text-primary shrink-0" />
                    <span>{isEn ? 'Verified' : 'تصدیق شدہ'}</span>
                  </AppBadge>
                )}
              </div>
              {profileUsername && (
                <p className="text-sm font-bold text-slate-500 mt-0.5">
                  @{profileUsername}
                </p>
              )}
              <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500 font-semibold flex-wrap">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> {profileArea}, Rawalpindi
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> {isEn ? `Member since ${profileJoinDate}` : `ممبر از ${profileJoinDate}`}
                </span>
              </div>

              {/* Followers / Following Counts */}
              <div className="flex items-center gap-6 mt-4">
                <button 
                  onClick={() => { setActiveFollowTab('followers'); setShowFollowModal(true); }}
                  className="flex flex-col hover:opacity-80 transition-opacity text-start bg-transparent border-none cursor-pointer p-0"
                >
                  <span className="text-lg font-black text-slate-900 leading-none">{followersCount}</span>
                  <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500 mt-1">{isEn ? 'Followers' : 'فالوورز'}</span>
                </button>
                <button 
                  onClick={() => { setActiveFollowTab('following'); setShowFollowModal(true); }}
                  className="flex flex-col hover:opacity-80 transition-opacity text-start bg-transparent border-none cursor-pointer p-0"
                >
                  <span className="text-lg font-black text-slate-900 leading-none">{followingCount}</span>
                  <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500 mt-1">{isEn ? 'Following' : 'فالوونگ'}</span>
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 mt-4">
                {!isSelf && followStatus === 'blocked' ? (
                  <AppButton disabled variant="outline" size="sm" className="text-red-500 border-red-500">
                    <ShieldAlert className="w-4 h-4 me-1" /> {isEn ? 'Blocked' : 'بلاک شدہ'}
                  </AppButton>
                ) : !isSelf ? (
                  <>
                    <AppButton
                      onClick={handleFollowToggle}
                      loading={isFollowLoading}
                      variant={followStatus === 'none' ? 'primary' : 'outline'}
                      size="sm"
                      className={followStatus !== 'none' ? 'border-slate-300 text-slate-700' : ''}
                      leftIcon={
                        followStatus === 'following' ? <UserCheck className="w-3.5 h-3.5" /> :
                        followStatus === 'requested' ? <Clock className="w-3.5 h-3.5" /> :
                        <UserPlus className="w-3.5 h-3.5" />
                      }
                    >
                      {followStatus === 'following' ? (isEn ? 'Following' : 'فالو کر رہے ہیں') :
                       followStatus === 'requested' ? (isEn ? 'Requested' : 'درخواست بھیجی') :
                       (isEn ? 'Follow' : 'فالو کریں')}
                    </AppButton>
                    <AppButton
                      onClick={handleMessage}
                      size="sm"
                      variant="outline"
                      leftIcon={<MessageSquare className="w-3.5 h-3.5" />}
                    >
                      {isEn ? 'Message' : 'پیغام'}
                    </AppButton>
                    <button onClick={handleBlock} className="p-1.5 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-500">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </>
                ) : null}
                {isSelf && (
                  <AppButton
                    onClick={() => setShowArchive(true)}
                    variant="outline"
                    size="sm"
                    className="text-slate-600 hover:bg-slate-50 border-slate-200"
                  >
                    {isEn ? 'Story Archive' : 'سٹوری آرکائیو'}
                  </AppButton>
                )}
                <AppButton
                  onClick={() => {
                    navigator.clipboard?.writeText(window.location.href);
                    alert(isEn ? 'Profile link copied!' : 'پروفائل لنک کاپی ہو گیا!');
                  }}
                  variant="outline"
                  size="sm"
                  leftIcon={<Share2 className="w-3.5 h-3.5" />}
                >
                  {isEn ? 'Share' : 'شیئر'}
                </AppButton>
                {!isSelf && (
                  <AppButton
                    onClick={() => alert(isEn ? 'User reported' : 'رپورٹ ہو گئی')}
                    variant="outline"
                    size="sm"
                    className="text-slate-500 hover:text-red-600 hover:bg-red-50"
                  >
                    <Flag className="w-3.5 h-3.5" />
                  </AppButton>
                )}
                {isSelf && (
                  <AppButton
                    onClick={() => setShowArchive(true)}
                    variant="outline"
                    size="sm"
                    className="text-slate-600 hover:bg-slate-50 border-slate-200"
                  >
                    {isEn ? 'Story Archive' : 'اسٹوری آرکائیو'}
                  </AppButton>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Highlights Bar */}
      <HighlightsBar 
        userId={profile?.id || ''} 
        isSelf={isSelf} 
        isEn={isEn} 
        onCreateNew={() => setShowHighlightCreator(true)} 
      />

      {/* Stats Bar */}
      <div className="grid grid-cols-4 bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
        {[
          { labelEn: 'Posts', labelUr: 'پوسٹس', value: userPosts.length },
          { labelEn: 'Reputation', labelUr: 'ساکھ', value: profileReputation },
          { labelEn: 'Listings', labelUr: 'فہرست', value: totalListings },
          { labelEn: 'Badges', labelUr: 'بیجز', value: badges.length },
        ].map((stat, idx) => (
          <div key={idx} className="text-center py-3 border-e border-slate-100 last:border-e-0">
            <p className="text-lg font-black text-slate-900">{stat.value}</p>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              {isEn ? stat.labelEn : stat.labelUr}
            </p>
          </div>
        ))}
      </div>

      {/* Badges */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-4">
        <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider mb-3">
          🏆 {isEn ? 'Badges & Achievements' : 'بیجز اور اعزازات'}
        </h3>
        <div className="flex flex-wrap gap-2">
          {badges.map((badge) => (
            <span
              key={badge.id}
              className="inline-flex items-center gap-1.5 bg-slate-50 border border-slate-200 text-slate-700 px-3 py-1.5 rounded-full text-[11px] font-bold"
            >
              {badge.emoji} {isEn ? badge.labelEn : badge.labelUr}
            </span>
          ))}
        </div>
      </div>

      {/* Content Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
        <AppTabs
          tabs={[
            { id: 'posts', label: isEn ? 'Posts' : 'پوسٹس', count: userPosts.length },
            { id: 'listings', label: isEn ? 'Listings' : 'فہرست', count: totalListings },
            { id: 'about', label: isEn ? 'About' : 'تعارف' },
          ]}
          activeTab={activeTab}
          onChange={(tabId) => setActiveTab(tabId as any)}
        />

        <div className="p-4 space-y-4 min-h-[200px]">
          {/* Posts Tab */}
          {activeTab === 'posts' && (
            userPosts.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs font-semibold">
                📝 {isEn ? 'No posts yet' : 'ابھی تک کوئی پوسٹ نہیں'}
              </div>
            ) : (
              userPosts.map(post => (
                <div key={post.id} className="bg-slate-50 rounded-2xl p-4 space-y-2 border border-slate-100">
                  <p className="text-sm text-slate-800 font-medium leading-relaxed">{post.content}</p>
                  {post.image && (
                    <img src={post.image} alt="" className="rounded-xl h-auto object-contain w-full block" />
                  )}
                  <div className="flex items-center gap-4 text-[10px] text-slate-400 font-semibold pt-1">
                    <span className="flex items-center gap-1"><Heart className="w-3 h-3" /> {post.likes}</span>
                    <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" /> {post.commentsCount}</span>
                    <span>{post.time}</span>
                  </div>
                </div>
              ))
            )
          )}

          {/* Listings Tab */}
          {activeTab === 'listings' && (
            totalListings === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs font-semibold">
                📦 {isEn ? 'No listings yet' : 'ابھی تک کوئی فہرست نہیں'}
              </div>
            ) : (
              <div className="space-y-3">
                {userJobs.map(job => (
                  <div
                    key={job.id}
                    onClick={() => navigate('/jobs/detail', job.id)}
                    className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100 hover:border-slate-300 cursor-pointer transition-all"
                  >
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <Briefcase className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h5 className="text-xs font-bold text-slate-900 truncate">{job.title}</h5>
                      <p className="text-[10px] text-slate-400 font-semibold">{job.company} • {job.salary}</p>
                    </div>
                  </div>
                ))}
                {userBusinesses.map(biz => (
                  <div
                    key={biz.id}
                    onClick={() => navigate('/business/detail', biz.id)}
                    className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100 hover:border-slate-300 cursor-pointer transition-all"
                  >
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <Store className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h5 className="text-xs font-bold text-slate-900 truncate">{biz.name}</h5>
                      <p className="text-[10px] text-slate-400 font-semibold">{biz.category}</p>
                    </div>
                  </div>
                ))}
                {userMarketplace.map(item => (
                  <div
                    key={item.id}
                    onClick={() => navigate('/marketplace/detail', item.id)}
                    className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100 hover:border-slate-300 cursor-pointer transition-all"
                  >
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h5 className="text-xs font-bold text-slate-900 truncate">{item.title}</h5>
                      <p className="text-[10px] text-slate-400 font-semibold">{item.price}</p>
                    </div>
                  </div>
                ))}
                {userServices.map(svc => (
                  <div
                    key={svc.id}
                    onClick={() => navigate('/services/detail', svc.id)}
                    className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100 hover:border-slate-300 cursor-pointer transition-all"
                  >
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <Globe className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h5 className="text-xs font-bold text-slate-900 truncate">{svc.name}</h5>
                      <p className="text-[10px] text-slate-400 font-semibold">{svc.category}</p>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}

          {/* About Tab */}
          {activeTab === 'about' && (
            <div className="space-y-4">
              {profile.bio && (
                <div className="space-y-3">
                  <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">
                    📝 {isEn ? 'Bio' : 'تعارف'}
                  </h4>
                  <p className="text-sm text-slate-600 font-medium leading-relaxed whitespace-pre-line">
                    {profile.bio}
                  </p>
                </div>
              )}
              <div className="space-y-3">
                <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">
                  📍 {isEn ? 'Location' : 'مقام'}
                </h4>
                <p className="text-sm text-slate-600 font-medium flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-slate-400" /> {profileArea}, Rawalpindi
                </p>
              </div>
              <div className="space-y-3">
                <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">
                  📅 {isEn ? 'Joined' : 'شامل ہوئے'}
                </h4>
                <p className="text-sm text-slate-600 font-medium flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-400" /> {profileJoinDate}
                </p>
              </div>
              <div className="space-y-3">
                <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">
                  ⭐ {isEn ? 'Reputation Score' : 'ساکھ کا سکور'}
                </h4>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-slate-100 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full transition-all"
                      style={{ width: `${Math.min(profileReputation / 3, 100)}%` }}
                    />
                  </div>
                  <span className="text-xs font-black text-slate-700">{profileReputation}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {showArchive && (
        <StoryArchive
          user={profile || { id: viewingName }}
          isEn={isEn}
          onClose={() => setShowArchive(false)}
        />
      )}

      {showHighlightCreator && (
        <HighlightCreator
          user={profile || { id: viewingName }}
          isEn={isEn}
          onClose={() => setShowHighlightCreator(false)}
          onComplete={() => {
            setShowHighlightCreator(false);
            // Optionally we could trigger a refresh of HighlightsBar here by changing a key or state,
            // but closing and reopening profile also works for now.
            window.location.reload();
          }}
        />
      )}

      {showFollowModal && (
        <FollowListModal
          isOpen={true}
          userId={profile?.id || viewingName}
          viewerId={currentUser?.id}
          isEn={isEn}
          onClose={() => setShowFollowModal(false)}
          initialTab={activeFollowTab}
          currentUser={currentUser}
          onNavigateToProfile={() => setShowFollowModal(false)}
        />
      )}
    </div>
  );
}

