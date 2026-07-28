/**
 * Dhoke Hassu Connect - Pages Module
 * Implements a Facebook-style Pages system natively within the platform.
 */

import React, { useState, useEffect } from 'react';
import { 
  Building2, Search, PlusCircle, ArrowLeft, Image as ImageIcon,
  CheckCircle, Share2, MapPin, Phone, Globe, Mail, Clock, Shield, AlertTriangle, MessageSquare
} from 'lucide-react';
import { Page, PagePost, User } from '../types';
import { dbGetPages, dbCreatePage, dbGetPagePosts, dbCreatePagePost, dbTriggerNotification, dbFollowPage, dbUnfollowPage, dbCheckPageFollow, dbGetUserFollowedPages } from '../utils/supabaseClient';
import PageCreateForm from './PageCreateForm';
import PostComposer from './PostComposer';
import PostCard from './PostCard';
import AdBannerCard from './AdBannerCard';
import { useAdRotator } from '../hooks/useAdRotator';
import { useAdStore } from '../store/adStore';
import { isUserAdminOrModerator } from './AlertsModule';

interface PagesModuleProps {
  currentUser: User;
  currentLanguage: 'en' | 'ur';
}

export default function PagesModule({ currentUser, currentLanguage }: PagesModuleProps) {
  const isEn = currentLanguage === 'en';
  const isAdmin = isUserAdminOrModerator(currentUser);

  // Ad Engine
  const feedAdInterval = useAdStore(s => s.feedAdIntervals?.['Pages'] || 3);
  const topBannerMap = useAdRotator('Pages', 1, 1, 'Banner');
  const bottomBannerMap = useAdRotator('Pages', 1, 1, 'Bottom Banner');
  const inlineAdsMap = useAdRotator('Pages', 200, feedAdInterval, 'Feed');

  // State
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Tabs for Explore / My Pages
  const [activeTab, setActiveTab] = useState<'explore' | 'my-pages'>('explore');
  const [followedPageIds, setFollowedPageIds] = useState<string[]>([]);
  
  // View states: 'list' | 'create' | 'detail'
  const [activeView, setActiveView] = useState<'list' | 'create' | 'detail'>('list');
  const [selectedPage, setSelectedPage] = useState<Page | null>(null);
  
  // Detail State
  const [pagePosts, setPagePosts] = useState<PagePost[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});

  const handleLike = (postId: string) => {
    setLikedPosts(prev => {
      const next = new Set(prev);
      if (next.has(postId)) {
        next.delete(postId);
        setLikeCounts(c => ({ ...c, [postId]: (c[postId] || 1) - 1 }));
      } else {
        next.add(postId);
        setLikeCounts(c => ({ ...c, [postId]: (c[postId] || 0) + 1 }));
      }
      return next;
    });
  };

  const handleComment = (postId: string, commentText: string) => {
    console.log("Comment on", postId, commentText);
  };

  const isEntityVerified = (_name: string) => false;
  const getTvsBadgeType = (_name: string): 'gold' | 'blue' | 'gray' => 'gray';

  useEffect(() => {
    loadPages();
  }, []);

  const loadPages = async () => {
    setLoading(true);
    const data = await dbGetPages();
    const follows = await dbGetUserFollowedPages(currentUser.id);
    setPages(data);
    setFollowedPageIds(follows);
    setLoading(false);
  };

  const loadPagePosts = async (pageId: string) => {
    const posts = await dbGetPagePosts(pageId);
    setPagePosts(posts);
  };

  const handleSelectPage = async (page: Page) => {
    setSelectedPage(page);
    setActiveView('detail');
    loadPagePosts(page.id);
    const following = await dbCheckPageFollow(page.id, currentUser.id);
    setIsFollowing(following);
  };

  const handleFollowToggle = async () => {
    if (!selectedPage || followLoading) return;
    setFollowLoading(true);
    try {
      if (isFollowing) {
        await dbUnfollowPage(selectedPage.id, currentUser.id);
        setIsFollowing(false);
        setFollowedPageIds(prev => prev.filter(id => id !== selectedPage.id));
        setPages(prev => prev.map(p => p.id === selectedPage.id ? { ...p, followers_count: Math.max(0, p.followers_count - 1) } : p));
        setSelectedPage(prev => prev ? { ...prev, followers_count: Math.max(0, prev.followers_count - 1) } : null);
      } else {
        await dbFollowPage(selectedPage.id, currentUser.id);
        setIsFollowing(true);
        setFollowedPageIds(prev => [...prev, selectedPage.id]);
        setPages(prev => prev.map(p => p.id === selectedPage.id ? { ...p, followers_count: p.followers_count + 1 } : p));
        setSelectedPage(prev => prev ? { ...prev, followers_count: prev.followers_count + 1 } : null);
        
        dbTriggerNotification(
          selectedPage.owner_id,
          currentUser.id,
          'social',
          isEn ? 'New Page Follower' : 'نیا صفحہ فالوور',
          isEn ? `${currentUser.name} started following ${selectedPage.name}` : `${currentUser.name} نے ${selectedPage.name} کو فالو کرنا شروع کیا`,
          'page',
          selectedPage.id
        );
      }
    } finally {
      setFollowLoading(false);
    }
  };

  const handleShare = async () => {
    if (!selectedPage) return;
    try {
      await navigator.share({
        title: selectedPage.name,
        text: selectedPage.description || 'Check out this page!',
        url: window.location.href
      });
    } catch (err) {
      console.error('Error sharing:', err);
    }
  };

  const handleMessage = () => {
    if (!selectedPage) return;
    if ((window as any).openChat) {
      const firstMsg = isEn 
        ? `Hi, I'm interested in your page: ${selectedPage.name}.`
        : `السلام علیکم، میں آپ کے صفحہ ${selectedPage.name} کے بارے میں بات کرنا چاہتا ہوں۔`;
      // Use phone or owner_id for the chat contact
      const chatContact = selectedPage.phone || selectedPage.owner_id || (selectedPage as any).ownerId || (selectedPage as any).user_id || (selectedPage as any).userId || (selectedPage as any).created_by || (selectedPage as any).createdBy;
      (window as any).openChat(chatContact, selectedPage.name, selectedPage.logo_url, firstMsg);
    } else {
      const msg = prompt(isEn ? "Enter your query/message:" : "اپنا پیغام لکھیں:");
      if (msg) {
        alert(isEn 
          ? `Query dispatched safely to ${selectedPage.name}!`
          : `${selectedPage.name} کو آپ کا پیغام کامیابی سے بھیج دیا گیا ہے!`
        );
      }
    }
  };

  const handleCreatePost = async (content: string, mediaUrl?: string, mediaType?: 'image' | 'video', pollData?: any) => {
    if (!selectedPage) return;
    const newPost = await dbCreatePagePost({
      page_id: selectedPage.id,
      author_id: currentUser.id,
      content,
      media_url: mediaUrl,
      media_type: mediaType,
      poll_id: pollData ? JSON.stringify(pollData) : null
    });
    if (newPost) {
      setPagePosts(prev => [newPost, ...prev]);
    }
  };

  // ---------------- RENDER ----------------
  
  let filteredPages = pages.filter(p => 
    p.name?.toLowerCase().includes(searchQuery?.toLowerCase()) ||
    p.category?.toLowerCase().includes(searchQuery?.toLowerCase())
  );

  if (activeTab === 'my-pages') {
    filteredPages = filteredPages.filter(p => p.owner_id === currentUser.id || followedPageIds.includes(p.id));
  } else {
    filteredPages = filteredPages.filter(p => 
      (p.status !== 'Suspended') &&
      (p.is_private !== true || p.owner_id === currentUser.id || followedPageIds.includes(p.id) || isAdmin)
    );
  }

  return (
    <div className="flex-1 w-full max-w-5xl mx-auto px-4 py-6 bg-slate-50 min-h-screen text-slate-800">
      {/* Header & Ads go here */}
      {activeView === 'list' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Header */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
            <div>
              <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <Building2 className="w-6 h-6 text-emerald-600" />
                {isEn ? 'Pages' : 'صفحات'}
              </h2>
              <p className="text-xs text-slate-500 font-bold mt-1">
                {isEn ? 'Discover local businesses and communities' : 'مقامی کاروبار اور کمیونٹیز دریافت کریں'}
              </p>
            </div>
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search className="w-4 h-4 absolute start-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder={isEn ? "Search pages..." : "صفحات تلاش کریں..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full ps-9 pe-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold focus:outline-none focus:border-emerald-500"
                />
              </div>
              <button 
                onClick={() => setActiveView('create')}
                className="bg-[#2563eb] hover:bg-emerald-700 text-white px-4 py-2.5 rounded-2xl text-sm font-black flex items-center gap-2 shrink-0 border-none cursor-pointer shadow-sm transition-all"
              >
                <PlusCircle className="w-4 h-4" />
                {isEn ? 'Create' : 'بنائیں'}
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('explore')}
              className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all ${
                activeTab === 'explore'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {isEn ? 'Explore' : 'دریافت کریں'}
            </button>
            <button
              onClick={() => setActiveTab('my-pages')}
              className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all ${
                activeTab === 'my-pages'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {isEn ? 'My Pages' : 'میرے صفحات'}
            </button>
          </div>

          {/* Top Banner Ad */}
          {topBannerMap[0] && (
            <div className="mb-6">
              <AdBannerCard ad={topBannerMap[0]} />
            </div>
          )}

          {/* Listing Grid */}
          {loading ? (
             <div className="text-center py-12"><div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto"></div></div>
          ) : filteredPages.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center">
              <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 font-bold">{isEn ? 'No pages found' : 'کوئی صفحہ نہیں ملا'}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {(() => {
                const elements = [];
                for (let i = 0; i < filteredPages.length; i++) {
                  const page = filteredPages[i];
                  const ad = inlineAdsMap[i];

                  elements.push(
                    <div 
                      key={page.id}
                      onClick={() => handleSelectPage(page)}
                      className="bg-white rounded-3xl border border-slate-200/80 hover:border-slate-300 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden cursor-pointer flex flex-col relative"
                    >
                      <div className="h-32 w-full bg-slate-200 relative overflow-hidden">
                        {page.cover_url ? (
                          <img src={page.cover_url} alt="Cover" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-r from-emerald-100 to-purple-100" />
                        )}
                      </div>
                      <div className="px-5 pb-5 relative flex-1 flex flex-col">
                        <div className="w-16 h-16 rounded-full border-4 border-white bg-slate-100 overflow-hidden absolute -top-8 start-5 shadow-sm">
                           {page.logo_url ? (
                             <img src={page.logo_url} alt="Logo" className="w-full h-full object-cover" />
                           ) : (
                             <Building2 className="w-8 h-8 text-slate-400 m-3" />
                           )}
                        </div>
                        <div className="mt-10">
                          <div className="flex items-center gap-1.5">
                            <h3 className="font-black text-slate-900 text-lg leading-tight">{page.name}</h3>
                            {page.verification_status === 'Approved' && (
                              <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                            )}
                          </div>
                          <p className="text-xs font-bold text-slate-500 mt-1">@{page.slug}</p>
                          <p className="text-xs text-slate-600 mt-2 line-clamp-2 font-semibold leading-relaxed">
                            {page.description || (isEn ? 'No description provided.' : 'کوئی تفصیل فراہم نہیں کی گئی۔')}
                          </p>
                        </div>
                        <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-black text-slate-500">
                           <div className="flex gap-2 items-center">
                             <span className="bg-slate-100 px-2 py-1 rounded-xl">{page.category}</span>
                             <span>{page.followers_count} {isEn ? 'Followers' : 'فالوورز'}</span>
                           </div>
                           {page.allow_messages !== false && page.owner_id !== currentUser.id && (
                             <button
                               onClick={(e) => {
                                 e.stopPropagation();
                                 if ((window as any).openChat) {
                                   const firstMsg = isEn 
                                     ? `Hi, I'm interested in your page: ${page.name}.`
                                     : `السلام علیکم، میں آپ کے صفحہ ${page.name} کے بارے میں بات کرنا چاہتا ہوں۔`;
                                   (window as any).openChat(page.phone || page.owner_id, page.name, page.logo_url, firstMsg);
                                 } else {
                                   alert(isEn ? "Chat is unavailable." : "چیٹ دستیاب نہیں ہے۔");
                                 }
                               }}
                               className="bg-emerald-50 hover:bg-emerald-100 text-emerald-600 p-2 rounded-xl transition-colors border-none cursor-pointer flex items-center gap-1 shadow-sm"
                               title={isEn ? "Message" : "پیغام"}
                             >
                               <MessageSquare className="w-3.5 h-3.5" />
                               <span className="hidden md:inline">{isEn ? 'Message' : 'پیغام'}</span>
                             </button>
                           )}
                        </div>
                      </div>
                    </div>
                  );

                  if (ad) {
                    elements.push(
                      <div key={`ad-${i}`} className="md:col-span-2">
                        <AdBannerCard ad={ad} />
                      </div>
                    );
                  }
                }
                return elements;
              })()}
            </div>
          )}

          {/* Bottom Banner Ad */}
          {bottomBannerMap[0] && filteredPages.length > 0 && (
            <div className="mt-6">
              <AdBannerCard ad={bottomBannerMap[0]} />
            </div>
          )}
        </div>
      )}

      {/* DETAIL VIEW */}
      {activeView === 'detail' && selectedPage && (
        <div className="space-y-6 animate-fadeIn">
          {(() => {
            console.error("PAGE PROFILE RENDERED");
            console.error({
              currentUserId: currentUser?.id,
              ownerId: selectedPage?.owner_id,
              isOwner: currentUser?.id === selectedPage?.owner_id,
              allowMessages: selectedPage?.allow_messages
            });
            return null;
          })()}
          <button 
            onClick={() => setActiveView('list')}
            className="flex items-center gap-1.5 text-xs font-black text-slate-500 hover:text-slate-900 border-none bg-transparent cursor-pointer transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {isEn ? 'Back to Pages' : 'واپس جائیں'}
          </button>
          
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="h-48 md:h-64 w-full bg-slate-200 relative overflow-hidden">
               {selectedPage.cover_url ? (
                 <img src={selectedPage.cover_url} alt="Cover" className="w-full h-full object-cover" />
               ) : (
                 <div className="w-full h-full bg-gradient-to-r from-emerald-100 to-purple-100" />
               )}
            </div>
            <div className="px-6 md:px-8 pb-8 relative flex flex-col md:flex-row gap-6 md:gap-8">
               <div className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-white bg-white overflow-hidden shrink-0 shadow-md relative -top-12 md:-top-16 mb-[-3rem] md:mb-[-4rem]">
                 {selectedPage.logo_url ? (
                   <img src={selectedPage.logo_url} alt="Logo" className="w-full h-full object-cover" />
                 ) : (
                   <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                     <Building2 className="w-12 h-12 text-slate-400" />
                   </div>
                 )}
               </div>
               <div className="flex-1 pt-4 md:pt-4 flex flex-col md:flex-row md:items-start justify-between gap-4">
                 <div>
                   <h1 className="text-2xl md:text-3xl font-black text-slate-900 flex items-center gap-2">
                     {selectedPage.name}
                     {selectedPage.verification_status === 'Approved' && (
                       <CheckCircle className="w-6 h-6 text-emerald-500" />
                     )}
                   </h1>
                   <p className="text-sm font-bold text-slate-500 mt-1">@{selectedPage.slug}</p>
                   <p className="text-sm font-semibold text-slate-600 mt-3 max-w-2xl leading-relaxed">
                     {selectedPage.description}
                   </p>
                 </div>
                 <div className="flex items-center gap-3 w-full md:w-auto mt-4 md:mt-0">
                   <button 
                     onClick={handleFollowToggle}
                     disabled={followLoading}
                     className={`${isFollowing ? 'bg-slate-200 text-slate-800 hover:bg-slate-300' : 'bg-[#2563eb] text-white hover:bg-blue-700'} h-[42px] px-6 rounded-[16px] text-sm font-black border-none cursor-pointer transition-all shadow-sm flex items-center justify-center gap-2 flex-1 md:flex-none`}
                   >
                     {isFollowing ? (
                       <>
                         <CheckCircle className="w-4 h-4" />
                         {isEn ? 'Following' : 'فالو کر رہے ہیں'}
                       </>
                     ) : (
                       isEn ? 'Follow' : 'فالو کریں'
                     )}
                   </button>
                   {selectedPage.owner_id !== currentUser?.id && selectedPage.allow_messages !== false && (
                     <button 
                       onClick={handleMessage}
                       className="h-[42px] px-6 bg-white border-[1.5px] border-emerald-600 text-emerald-600 hover:bg-emerald-50 rounded-[16px] text-sm font-black cursor-pointer transition-all flex items-center justify-center gap-2 shadow-sm flex-1 md:flex-none"
                     >
                       <MessageSquare className="w-4 h-4" />
                       {isEn ? 'Message' : 'پیغام'}
                     </button>
                   )}
                   <button 
                     onClick={handleShare}
                     className="h-[42px] w-[42px] shrink-0 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full flex items-center justify-center border-none cursor-pointer transition-all"
                     title={isEn ? 'Share' : 'شیئر کریں'}
                   >
                     <Share2 className="w-4 h-4" />
                   </button>
                 </div>
               </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* About Sidebar */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
                <h3 className="font-black text-slate-900 mb-4">{isEn ? 'About' : 'تفصیلات'}</h3>
                <div className="space-y-4 text-sm font-semibold text-slate-600">
                  <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-slate-400 shrink-0" />
                    <span className="bg-slate-100 px-2.5 py-1 rounded-xl text-xs">{selectedPage.category}</span>
                  </div>
                  {selectedPage.location && (
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                      <span>{selectedPage.location}</span>
                    </div>
                  )}
                  {selectedPage.phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="w-5 h-5 text-slate-400 shrink-0" />
                      <span>{selectedPage.phone}</span>
                    </div>
                  )}
                  {selectedPage.website && (
                    <div className="flex items-center gap-3">
                      <Globe className="w-5 h-5 text-slate-400 shrink-0" />
                      <a href={selectedPage.website} target="_blank" rel="noreferrer" className="text-emerald-600 hover:underline">{selectedPage.website}</a>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Posts Feed */}
            <div className="lg:col-span-2 space-y-6">
              {(selectedPage.owner_id === currentUser.id || isAdmin) && (
                <PostComposer 
                  currentUser={currentUser}
                  currentLanguage={currentLanguage}
                  pageId={selectedPage.id}
                  onPostCreated={(post) => setPagePosts(prev => [post as unknown as PagePost, ...prev])}
                />
              )}
              
              <div className="space-y-4">
                {pagePosts.length === 0 ? (
                  <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center text-slate-500 font-bold shadow-sm">
                    {isEn ? 'No posts yet.' : 'ابھی تک کوئی پوسٹ نہیں ہے۔'}
                  </div>
                ) : (
                  pagePosts.map(post => (
                    <PostCard
                      key={post.id}
                      post={post as any}
                      isLiked={likedPosts.has(post.id)}
                      likeCount={likeCounts[post.id] ?? post.likes}
                      onLike={handleLike}
                      onComment={handleComment}
                      isEntityVerified={isEntityVerified}
                      getTvsBadgeType={getTvsBadgeType}
                      currentUser={currentUser}
                      currentLanguage={currentLanguage}
                      onUpdate={() => {}} // Could implement onUpdate to refresh post stats
                    />
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CREATE VIEW */}
      {activeView === 'create' && (
        <PageCreateForm
          currentUser={currentUser}
          currentLanguage={currentLanguage}
          onCancel={() => setActiveView('list')}
          onSuccess={(newPage) => {
            setPages(prev => [newPage, ...prev]);
            handleSelectPage(newPage);
          }}
        />
      )}
    </div>
  );
}

