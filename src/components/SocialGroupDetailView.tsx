import React, { useState, useEffect, useCallback } from 'react';
import {
  Users, ArrowLeft, MapPin, Shield,
  Settings, UserPlus, Clock, MessageSquare, Lock, EyeOff
} from 'lucide-react';
import { Group, User } from '../types';
import type { Post } from '../types';
import { AppTabs, AppButton } from './ui';
import { dbTriggerNotification, dbNotifyGroupAdmins, dbCheckGroupMembership, dbJoinGroup, dbLeaveGroup, dbGetPosts, dbSavePost, dbAddPostComment, dbTogglePostLike, dbGetUserPostLikes, dbGetPostLikeCounts, dbGetUserGroupRole } from '../utils/supabaseClient';
import PostComposer from './PostComposer';
import PostCard from './PostCard';
import GroupManagementPanel from './GroupManagementPanel';

interface SocialGroupDetailViewProps {
  group: Group;
  currentUser: User;
  currentLanguage: 'en' | 'ur';
  posts?: any[];
  onBack: () => void;
  onRefresh?: () => void;
  onShareRequest?: (type: string, id: string, preview?: any) => void;
  initialTab?: string;
}

export default function SocialGroupDetailView({
  group,
  currentUser,
  currentLanguage,
  onBack,
  onRefresh,
  onShareRequest,
  initialTab
}: SocialGroupDetailViewProps) {
  const isEn = currentLanguage === 'en';
  const [activeTab, setActiveTab] = useState(initialTab === 'manage_requests' ? 'feed' : (initialTab || 'feed'));
  const [isManaging, setIsManaging] = useState(initialTab === 'manage_requests' || initialTab === 'manage');
  const [hasJoined, setHasJoined] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [groupPosts, setGroupPosts] = useState<Post[]>([]);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});

  const isOwner = group.owner_id === currentUser?.id;
  const canPost = hasJoined || isOwner;
  const canView = canPost || group.visibility === 'public';

  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [isCheckingMembership, setIsCheckingMembership] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);

  const isAdminOrOwner = isOwner || userRole === 'Admin' || userRole === 'Owner';

  const fetchGroupPosts = useCallback(async () => {
    setIsLoadingPosts(true);
    try {
      const posts = await dbGetPosts([], group.id);
      setGroupPosts(posts);
      // Initialize like counts from the posts table (fallback)
      const fallbackCounts: Record<string, number> = {};
      posts.forEach(p => { fallbackCounts[p.id] = p.likes; });
      setLikeCounts(fallbackCounts);
      // Load real DB like counts and user's liked posts
      const postIds = posts.map(p => p.id);
      const userId = currentUser?.user_id || currentUser?.id;
      const [dbCounts, userLikedSet] = await Promise.all([
        dbGetPostLikeCounts(postIds),
        userId ? dbGetUserPostLikes(userId) : Promise.resolve(new Set<string>())
      ]);
      if (Object.keys(dbCounts).length > 0) setLikeCounts(dbCounts);
      setLikedPosts(userLikedSet);
    } catch (err) {
      console.error('Error fetching group posts:', err);
    } finally {
      setIsLoadingPosts(false);
    }
  }, [group.id, currentUser]);

  useEffect(() => {
    fetchGroupPosts();
  }, [fetchGroupPosts]);

  useEffect(() => {
    async function checkMembership() {
      if (!currentUser?.id) {
        setIsCheckingMembership(false);
        return;
      }
      if (isOwner) {
        setHasJoined(true);
        setUserRole('Owner');
        setIsCheckingMembership(false);
        return;
      }
      const [isMember, membership] = await Promise.all([
        dbCheckGroupMembership(group.id, currentUser.id),
        dbGetUserGroupRole(group.id, currentUser.id)
      ]);
      setHasJoined(isMember && membership?.status !== 'Pending');
      setIsPending(membership?.status === 'Pending');
      setUserRole(membership?.role || null);
      setIsCheckingMembership(false);
    }
    checkMembership();
  }, [group.id, currentUser?.id, isOwner]);

  const handleJoin = async () => {
    if (!currentUser?.id) return;
    setIsJoining(true);
    const isPrivate = group.visibility === 'Private';
    const status = isPrivate ? 'Pending' : 'Approved';
    const success = await dbJoinGroup(group.id, currentUser.id, status);
    if (success) {
      if (isPrivate) {
        setIsPending(true);
        // Notify admins about the join request
        await dbNotifyGroupAdmins(
          group.id,
          currentUser.id,
          'group_join_request',
          isEn ? 'New Join Request' : 'شمولیت کی نئی درخواست',
          isEn
            ? `👤 ${currentUser.fullName || 'A user'} requested to join 🏘 ${group.name}`
            : `👤 ${currentUser.fullName || 'ایک صارف'} نے 🏘 ${group.name} میں شامل ہونے کی درخواست کی ہے۔`,
          'social-groups/manage',
          group.id
        );
      } else {
        setHasJoined(true);
        if (!isOwner) {
          await dbNotifyGroupAdmins(
            group.id,
            currentUser.id,
            'system',
            isEn ? 'New Group Member' : 'گروپ کا نیا ممبر',
            isEn
              ? `${currentUser.fullName || 'A user'} has joined your group "${group.name}".`
              : `${currentUser.fullName || 'ایک صارف'} نے آپ کے گروپ "${group.name}" میں شمولیت اختیار کی ہے۔`,
            'social-groups',
            group.id
          );
        }
      }
    } else {
      alert(isEn ? 'Failed to join group.' : 'گروپ میں شامل ہونے میں ناکامی۔');
    }
    setIsJoining(false);
  };

  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);

  const handleLeave = async () => {
    if (!currentUser?.id) return;
    const success = await dbLeaveGroup(group.id, currentUser.id);
    if (success) {
      setHasJoined(false);
      setShowLeaveConfirm(false);
      // Optimistically decrement count
      if (group.members_count) {
        group.members_count = Math.max(0, group.members_count - 1);
      }
    } else {
      alert(isEn ? 'Failed to leave group.' : 'گروپ چھوڑنے میں ناکامی۔');
    }
  };

  const handlePostCreated = async (newPost: Post) => {
    try {
      // PostComposer already saves the post to the DB.
      // We only need to add it to the local state so it appears immediately.
      setGroupPosts(prev => [newPost, ...prev]);
      setLikeCounts(prev => ({ ...prev, [newPost.id]: 0 }));
    } catch (err) {
      console.error("Failed to update local group posts:", err);
    }
  };

  const handleLike = async (postId: string) => {
    const isLiked = likedPosts.has(postId);
    // Optimistic update
    setLikedPosts(prev => {
      const next = new Set(prev);
      if (isLiked) next.delete(postId); else next.add(postId);
      return next;
    });
    setLikeCounts(prev => ({ ...prev, [postId]: (prev[postId] || 0) + (isLiked ? -1 : 1) }));

    const userId = currentUser?.user_id || currentUser?.id;
    if (!userId) return;
    const { liked, likeCount } = await dbTogglePostLike(postId, userId);
    // Sync with DB
    setLikedPosts(prev => { const next = new Set(prev); liked ? next.add(postId) : next.delete(postId); return next; });
    setLikeCounts(prev => ({ ...prev, [postId]: likeCount }));
  };

  const handleComment = async (postId: string, commentText: string) => {
    const newComment = {
      id: `c-${Date.now()}`,
      author: currentUser?.fullName || 'Member',
      avatar:
        currentUser?.profilePhoto ||
        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=120',
      content: commentText,
      time: 'Just now',
      userId: currentUser?.id,
    };
    setGroupPosts(prev =>
      prev.map(p => {
        if (p.id !== postId) return p;
        return {
          ...p,
          comments: [...(p.comments || []), newComment],
          commentsCount: (p.commentsCount || 0) + 1,
        };
      })
    );
    await dbAddPostComment(postId, newComment);
  };

  const isEntityVerified = (_name: string) => false;
  const getTvsBadgeType = (_name: string): 'gold' | 'blue' | 'gray' => 'gray';

  const tabs = [
    { id: 'feed', label: isEn ? 'Feed' : 'فیڈ' },
    { id: 'about', label: isEn ? 'About' : 'تفصیل' },
    { id: 'members', label: isEn ? 'Members' : 'ممبران' },
  ];

  // Build a user object compatible with PostComposer's flexible prop type
  const composerUser = currentUser
    ? {
        id: currentUser.id,
        fullName: currentUser.fullName,
        profilePhoto: currentUser.profilePhoto,
        area: currentUser.area,
      }
    : undefined;

  if (isManaging) {
    return (
      <GroupManagementPanel 
        group={group} 
        currentUser={currentUser} 
        isEn={isEn} 
        onBack={() => setIsManaging(false)} 
        initialTab={initialTab === 'manage_requests' ? 'requests' : 'info'}
      />
    );
  }

  return (
    <div className="animate-fadeIn max-w-4xl mx-auto space-y-6">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-slate-500 hover:text-emerald-600 transition-colors font-semibold bg-white px-4 py-2 rounded-2xl shadow-sm border border-slate-200 w-fit"
      >
        <ArrowLeft className="w-4 h-4" />
        {isEn ? 'Back to Groups' : 'واپس گروپس پر جائیں'}
      </button>

      {/* Header Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Cover Image */}
        <div className="h-48 md:h-64 bg-slate-100 relative">
          {group.cover_url ? (
            <img src={group.cover_url} alt={group.name} className="w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-r from-emerald-500 to-emerald-600">
              <Users className="w-16 h-16 text-white/20" />
            </div>
          )}
          {/* Privacy Badge */}
          <div className="absolute top-4 end-4 bg-black/50 backdrop-blur-md text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5">
            {group.visibility === 'Public' && <Globe className="w-3.5 h-3.5" />}
            {group.visibility === 'Private' && <Lock className="w-3.5 h-3.5" />}
            {group.visibility === 'Hidden' && <EyeOff className="w-3.5 h-3.5" />}
            <span>{group.visibility}</span>
          </div>
        </div>

        <div className="px-6 pb-6 relative">
          {/* Logo & Actions row */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 -mt-12 md:-mt-16 mb-4">
            <div className="flex items-end gap-4">
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-2xl border-4 border-white bg-white shadow-md overflow-hidden shrink-0 z-10">
                {(group as any).logo_url ? (
                  <img src={(group as any).logo_url} alt={group.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                    <Users className="w-10 h-10 text-slate-300" />
                  </div>
                )}
              </div>
              <div className="pb-2 hidden md:block">
                <h1 className="text-2xl font-black text-slate-900">{group.name}</h1>
                <p className="text-sm font-semibold text-slate-500 mt-1 flex items-center gap-4">
                  <span className="flex items-center gap-1.5">
                    <Shield className="w-4 h-4 text-emerald-500" /> {group.category}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-slate-400" /> {group.members_count || 1}{' '}
                    {isEn ? 'Members' : 'ممبران'}
                  </span>
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 z-10 relative">
              {isAdminOrOwner ? (
                <AppButton variant="outline" className="flex items-center gap-2" onClick={() => setIsManaging(true)}>
                  <Settings className="w-4 h-4" />
                  {isEn ? 'Manage Group' : 'گروپ کا انتظام'}
                </AppButton>
              ) : (
                <div className="relative">
                  <AppButton
                    variant={hasJoined || isPending ? 'outline' : 'primary'}
                    onClick={() => hasJoined ? setShowLeaveConfirm(true) : !isPending ? handleJoin() : undefined}
                    disabled={isJoining || isPending}
                    className="flex items-center gap-2"
                  >
                    {isJoining
                      ? isEn ? 'Requesting...' : 'درخواست بھیج رہا ہے...'
                      : isPending
                      ? isEn ? 'Requested' : 'درخواست بھیجی گئی'
                      : hasJoined
                      ? isEn ? '✓ Joined' : '✓ شامل ہیں'
                      : (
                          <>
                            <UserPlus className="w-4 h-4" />
                            {group.visibility === 'Private' ? (isEn ? 'Request to Join' : 'شمولیت کی درخواست کریں') : (isEn ? 'Join' : 'شامل ہوں')}
                          </>
                        )}
                  </AppButton>
                  {showLeaveConfirm && (
                    <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-100 p-3 z-50 animate-in slide-in-from-top-2">
                      <p className="text-sm font-bold text-slate-800 mb-2">{isEn ? 'Leave Group?' : 'گروپ چھوڑیں؟'}</p>
                      <div className="flex gap-2">
                        <button onClick={() => setShowLeaveConfirm(false)} className="flex-1 px-2 py-1.5 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors">
                          {isEn ? 'Cancel' : 'منسوخ'}
                        </button>
                        <button onClick={handleLeave} className="flex-1 px-2 py-1.5 rounded-lg text-xs font-bold bg-red-50 hover:bg-red-100 text-red-600 transition-colors">
                          {isEn ? 'Leave' : 'چھوڑیں'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Mobile Title */}
          <div className="md:hidden mb-6 mt-2">
            <h1 className="text-xl font-black text-slate-900 leading-tight">{group.name}</h1>
            <p className="text-sm font-semibold text-slate-500 mt-2 flex flex-wrap items-center gap-4">
              <span className="flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-emerald-500" /> {group.category}
              </span>
              <span className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-slate-400" /> {group.members_count || 1}{' '}
                {isEn ? 'Members' : 'ممبران'}
              </span>
            </p>
          </div>

          {/* Navigation Tabs */}
          <div className="border-t border-slate-100 pt-2 mt-2">
            <AppTabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {/* ─── FEED TAB ─── */}
        {activeTab === 'feed' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              {/* Post Composer — only for members/owners */}
              {canPost ? (
                <PostComposer
                  groupId={group.id}
                  onPostCreated={handlePostCreated}
                  locationName={group.name}
                  currentUser={composerUser}
                  currentLanguage={currentLanguage}
                />
              ) : (
                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm text-center space-y-3">
                  <Lock className="w-8 h-8 text-slate-300 mx-auto" />
                  <h3 className="font-bold text-slate-800">
                    {isEn ? 'Join to participate' : 'حصہ لینے کے لیے شامل ہوں'}
                  </h3>
                  <p className="text-sm text-slate-500">
                    {isEn
                      ? 'You must be a member to post in this group.'
                      : 'پوسٹ کرنے کے لیے آپ کا ممبر ہونا ضروری ہے۔'}
                  </p>
                  <AppButton
                    variant="primary"
                    onClick={handleJoin}
                    disabled={isJoining}
                    className="mx-auto flex items-center gap-2"
                  >
                    <UserPlus className="w-4 h-4" />
                    {isJoining
                      ? isEn ? 'Joining...' : 'شامل ہو رہا ہے...'
                      : isEn ? 'Join Now' : 'ابھی شامل ہوں'}
                  </AppButton>
                </div>
              )}

              {/* Feed Posts */}
              {canView ? (
                isLoadingPosts ? (
                  <div className="space-y-4">
                    {[1, 2].map(i => (
                      <div
                        key={i}
                        className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm animate-pulse space-y-3"
                      >
                        <div className="flex gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-100 shrink-0" />
                          <div className="space-y-2 flex-1">
                            <div className="h-3 bg-slate-100 rounded w-1/3" />
                            <div className="h-2.5 bg-slate-100 rounded w-1/4" />
                          </div>
                        </div>
                        <div className="h-3 bg-slate-100 rounded w-full" />
                        <div className="h-3 bg-slate-100 rounded w-3/4" />
                      </div>
                    ))}
                  </div>
                ) : groupPosts.length > 0 ? (
                  <div className="space-y-4">
                    {groupPosts.map(post => (
                      <PostCard
                        key={post.id}
                        post={post}
                        currentUser={currentUser}
                        isLiked={likedPosts.has(post.id)}
                        likeCount={likeCounts[post.id] ?? post.likes}
                        onLike={handleLike}
                        onComment={handleComment}
                        onShareRequest={group.privacy === 'Public' ? onShareRequest : () => {
                          alert(isEn ? "This post can't be shared because it belongs to a private group." : "یہ پوسٹ شیئر نہیں کی جا سکتی کیونکہ یہ پرائیویٹ گروپ کی ہے۔");
                        }}
                        isEntityVerified={isEntityVerified}
                        getTvsBadgeType={getTvsBadgeType}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl p-12 border border-slate-200 shadow-sm text-center">
                    <MessageSquare className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-slate-800">
                      {isEn ? 'No posts yet' : 'ابھی تک کوئی پوسٹ نہیں'}
                    </h3>
                    <p className="text-slate-500 mt-1">
                      {canPost
                        ? isEn ? 'Be the first to post in this group!' : 'اس گروپ میں پہلی پوسٹ کریں!'
                        : isEn ? 'Join this group to see posts.' : 'پوسٹس دیکھنے کے لیے گروپ میں شامل ہوں۔'}
                    </p>
                  </div>
                )
              ) : (
                <div className="bg-white rounded-2xl p-10 border border-slate-200 shadow-sm text-center">
                  <Lock className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                  <h3 className="text-lg font-bold text-slate-800">{isEn ? 'Private Group' : 'نجی گروپ'}</h3>
                  <p className="text-sm text-slate-500 mt-1">
                    {isEn ? 'Join this group to view its feed.' : 'فیڈ دیکھنے کے لیے گروپ میں شامل ہوں۔'}
                  </p>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                <h3 className="font-bold text-slate-900 mb-3">
                  {isEn ? 'About this group' : 'گروپ کے بارے میں'}
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed mb-4">{group.description}</p>

                <div className="space-y-3 text-sm font-medium text-slate-600">
                  {group.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-slate-400" />
                      {group.location}
                    </div>
                  )}
                  {group.visibility && (
                    <div className="flex items-center gap-2">
                      {group.visibility === 'Public' ? (
                        <Globe className="w-4 h-4 text-slate-400" />
                      ) : (
                        <Lock className="w-4 h-4 text-slate-400" />
                      )}
                      <span>{group.visibility}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-400" />
                    {isEn ? 'Created' : 'بنایا گیا'}:{' '}
                    {new Date(group.created_at || Date.now()).toLocaleDateString()}
                  </div>
                </div>

                {group.tags && group.tags.length > 0 && (
                  <div className="mt-5 pt-5 border-t border-slate-100">
                    <div className="flex flex-wrap gap-2">
                      {group.tags.map(tag => (
                        <span
                          key={tag}
                          className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-xl text-xs font-semibold"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Stats card */}
              <div className="bg-gradient-to-br from-emerald-50 to-emerald-50 rounded-2xl p-5 border border-emerald-100">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-black text-emerald-600">{group.members_count || 1}</div>
                    <div className="text-xs font-semibold text-slate-500 mt-1">
                      {isEn ? 'Members' : 'ممبران'}
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-black text-emerald-600">{groupPosts.length}</div>
                    <div className="text-xs font-semibold text-slate-500 mt-1">
                      {isEn ? 'Posts' : 'پوسٹس'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── ABOUT TAB ─── */}
        {activeTab === 'about' && (
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">{isEn ? 'Description' : 'تفصیل'}</h3>
              <p className="text-slate-700 leading-relaxed">
                {group.description || (isEn ? 'No description provided.' : 'کوئی تفصیل نہیں۔')}
              </p>
            </div>

            {group.rules && (
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">
                  {isEn ? 'Group Rules' : 'گروپ کے اصول'}
                </h3>
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                  <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{group.rules}</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 bg-slate-50 rounded-2xl p-4 border border-slate-100">
                <Clock className="w-5 h-5 text-indigo-400 shrink-0" />
                <div>
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                    {isEn ? 'Created' : 'تاریخِ تخلیق'}
                  </div>
                  <div className="font-bold text-slate-700 mt-0.5">
                    {new Date(group.created_at || Date.now()).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── MEMBERS TAB ─── */}
        {activeTab === 'members' && (
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-4">
              {isEn ? 'Members' : 'ممبران'} ({group.members_count || 1})
            </h3>
            <div className="flex items-center gap-3 p-3 hover:bg-slate-50 rounded-2xl transition-colors" dir="ltr">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold text-lg shrink-0">
                {currentUser?.fullName ? currentUser.fullName[0]?.toUpperCase() : 'U'}
              </div>
              <div className="flex-1 text-left">
                <div className="font-bold text-slate-900 justify-start flex">
                  {isOwner ? currentUser?.fullName : 'Group Owner'}
                </div>
                <div className="text-xs font-semibold text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-full w-fit mt-0.5">
                  {isEn ? 'Owner' : 'مالک'}
                </div>
              </div>
            </div>
            {(group.members_count || 1) === 1 && (
              <p className="text-center text-slate-400 text-sm mt-6 pb-2">
                {isEn
                  ? 'No other members yet. Share this group to invite others!'
                  : 'ابھی کوئی اور ممبر نہیں۔ دوسروں کو مدعو کریں!'}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// SVG Globe icon (not available in this lucide-react version)
function Globe({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      <path d="M2 12h20" />
    </svg>
  );
}

