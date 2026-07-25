import React, { useState, useEffect, useRef } from 'react';
import { Heart, MessageCircle, Share2, Send, CheckCircle, Eye, Users } from 'lucide-react';
import ClickableAvatar from './ClickableAvatar';
import TvsBadge from './TvsBadge';
import RichText from './RichText';
import MentionTextarea from './MentionTextarea';
import FeedCard from './FeedCard';
import { VideoPlayer } from './video/VideoPlayer';
import { analytics } from '../services/AnalyticsService';
import { supabase, dbGetUserProfile, dbCheckGroupMembership, dbJoinGroup, dbLeaveGroup } from '../utils/supabaseClient';

const viewedPostsInSession = new Set<string>();

interface PostCardProps {

  post: any;
  isLiked: boolean;
  likeCount: number;
  onLike: (postId: string) => void;
  onComment: (postId: string, commentText: string) => void;
  isEntityVerified: (authorName: string) => boolean;
  getTvsBadgeType: (authorName: string) => 'gold' | 'blue' | 'gray';
  onImageClick?: (images: string[]) => void;
  /** 'en' | 'ur'. Defaults to 'en' */
  currentLanguage?: 'en' | 'ur';
  onShareRequest?: (type: string, id: string, preview?: any) => void;
  currentUser?: any;
}

const PostCardComponent = ({
  post,
  isLiked,
  likeCount,
  onLike,
  onComment,
  isEntityVerified,
  getTvsBadgeType,
  onImageClick,
  currentLanguage = 'en',
  onShareRequest,
  currentUser
}: PostCardProps) => {
  const isEn = currentLanguage === 'en';
  const [isExpanded, setIsExpanded] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [currentUserData, setCurrentUserData] = useState<{avatar?: string, name?: string} | null>(null);

  // Group membership state for shared group posts
  const [isMember, setIsMember] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [localMemberCount, setLocalMemberCount] = useState<number | null>(null);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data } = await supabase.auth.getUser();
        if (data?.user) {
          const profile = await dbGetUserProfile(data.user.id);
          setCurrentUserData({
            name: profile?.fullName || data.user.user_metadata?.fullName || 'User',
            avatar: profile?.profilePhoto || profile?.avatar || data.user.user_metadata?.avatar_url
          });
        }
      } catch (e) {}
    };
    fetchUser();
  }, []);

  const handleAddComment = () => {
    if (!commentText?.trim()) return;
    onComment(post.id, commentText);
    setCommentText('');
  };

  const postRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!post?.id || viewedPostsInSession.has(post.id)) return;

    let viewTimer: NodeJS.Timeout;
    let isCurrentlyVisible = false;

    const observer = new IntersectionObserver((entries) => {
      const [entry] = entries;
      
      if (entry.isIntersecting) {
        if (!isCurrentlyVisible) {
          isCurrentlyVisible = true;
          viewTimer = setTimeout(() => {
            if (isCurrentlyVisible && !viewedPostsInSession.has(post.id)) {
              viewedPostsInSession.add(post.id);
              analytics.track("post_view", { entity_type: 'post',
                module: "feed",
                entity_id: post.id,
                metadata: {
                  view_duration: 3,
                  source: "feed"
                }
              });
            }
          }, 3000);
        }
      } else {
        isCurrentlyVisible = false;
        if (viewTimer) clearTimeout(viewTimer);
      }
    }, {
      threshold: 0.5
    });

    if (postRef.current) {
      observer.observe(postRef.current);
    }

    return () => {
      if (viewTimer) clearTimeout(viewTimer);
      observer.disconnect();
    };
  }, [post?.id]);

  const t = {
    like: isEn ? 'Like' : 'پسند',
    comment: isEn ? 'Comment' : 'تبصرہ',
    share: isEn ? 'Share' : 'شیئر',
  };

  const renderSharedEntity = () => {
    const entity = post.sharedOriginalEntity;
    if (!entity) return <div className="p-4 text-sm text-slate-500 bg-slate-100">{isEn ? 'Original post is unavailable.' : 'اصل پوسٹ دستیاب نہیں ہے۔'}</div>;
    const type = post.sharedEntityType || post.postType || 'general';
    
    // Very simple polymorphic renderer to avoid recursive infinite loops
    let title = '';
    let subtitle = '';
    let image = '';
    let videoUrl = '';
    let content = '';

    if (type === 'post' || type === 'poll' || type === 'alert' || type === 'share' || type === 'general') {
      // Prefer the profile's full name for the original author (e.g., Saad Mehmood)
      const profileName = Array.isArray(entity.profiles) ? entity.profiles[0]?.full_name : entity.profiles?.full_name;
        title = profileName || entity.author || 'User';
        subtitle = entity.time || (entity.created_at ? new Date(entity.created_at).toLocaleDateString() : '');
        content = entity.content || entity.text_content || '';
        image = entity.image || entity.image_url || '';
        videoUrl = entity.videoUrl || entity.video_url || '';
    } else {
      title = entity.title || entity.name || 'Shared Content';
      subtitle = type.charAt(0).toUpperCase() + type.slice(1);
      content = entity.description || entity.company || '';
      image = entity.image || entity.coverImage || entity.images?.[0] || '';
      videoUrl = entity.videoUrl || entity.video_url || '';
    }

    const isSharedGroup = post.postType === 'share' && !!entity.groups;
    const groupData = isSharedGroup ? (Array.isArray(entity.groups) ? entity.groups[0] : entity.groups) : null;
    
    // Check membership on mount if it's a shared group post
    useEffect(() => {
      let isMounted = true;
      if (groupData && currentUser && currentUser.id) {
        dbCheckGroupMembership(groupData.id, currentUser.id).then(member => {
          if (isMounted) setIsMember(member);
        });
      }
      return () => { isMounted = false; };
    }, [groupData?.id, currentUser?.id]);

    const handleJoinGroup = async () => {
      if (!currentUser || !groupData) return;
      setIsJoining(true);
      const success = await dbJoinGroup(groupData.id, currentUser.id);
      if (success) {
        setIsMember(true);
        setLocalMemberCount(prev => (prev !== null ? prev + 1 : ((groupData.group_members?.[0]?.count || 0) + 1)));
      } else {
        alert(isEn ? 'Failed to join group.' : 'گروپ میں شامل ہونے میں ناکامی۔');
      }
      setIsJoining(false);
    };

    const handleLeaveGroup = async () => {
      if (!currentUser || !groupData) return;
      setIsJoining(true);
      const success = await dbLeaveGroup(groupData.id, currentUser.id);
      if (success) {
        setIsMember(false);
        setLocalMemberCount(prev => (prev !== null ? Math.max(0, prev - 1) : Math.max(0, (groupData.group_members?.[0]?.count || 0) - 1)));
      } else {
        alert(isEn ? 'Failed to leave group.' : 'گروپ چھوڑنے میں ناکامی۔');
      }
      setIsJoining(false);
      setShowLeaveConfirm(false);
    };

    const handleGroupClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      if (groupData?.id) {
        window.history.pushState({}, '', `/groups/${groupData.id}`);
        window.dispatchEvent(new Event('popstate'));
      }
    };

    return (
      <div className="bg-white">
        {groupData && (
          <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-3 bg-slate-50/50 relative" dir="ltr">
            <div className="flex items-center gap-3 overflow-hidden cursor-pointer group" onClick={handleGroupClick}>
              <div className="w-12 h-12 rounded-xl bg-slate-200 flex flex-col items-center justify-center shrink-0 overflow-hidden shadow-sm border border-slate-200 group-hover:ring-2 ring-emerald-500 transition-all">
                {(groupData.coverImage || groupData.logo_url || groupData.cover_url) ? (
                  <img src={groupData.coverImage || groupData.logo_url || groupData.cover_url} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                ) : (
                  <span className="text-xl font-bold text-slate-400">🏘</span>
                )}
              </div>
              <div className="flex flex-col overflow-hidden text-left">
                <h4 className="text-[15px] font-black text-slate-900 truncate flex items-center gap-1 justify-start group-hover:text-emerald-600 transition-colors">{groupData.name}</h4>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mt-0.5 justify-start">
                  <span className="flex items-center gap-1"><Users className="w-3 h-3"/> {localMemberCount !== null ? localMemberCount : (groupData.group_members?.[0]?.count || 0)} {isEn ? 'Members' : 'ممبران'}</span>
                  <span>•</span>
                  <span>{groupData.privacy === 'Public' ? (isEn ? 'Public Group' : 'پبلک گروپ') : (isEn ? 'Private Group' : 'پرائیویٹ گروپ')}</span>
                </div>
              </div>
            </div>
            
            {(!isMember && currentUser) ? (
              <button
                onClick={(e) => { e.stopPropagation(); handleJoinGroup(); }}
                disabled={isJoining}
                className="shrink-0 px-4 py-1.5 rounded-full bg-emerald-100 text-emerald-700 font-bold text-xs hover:bg-emerald-200 transition-colors flex items-center gap-1.5"
              >
                {isJoining ? (isEn ? 'Joining...' : 'شامل ہو رہا ہے...') : (isEn ? 'Join' : 'شامل ہوں')}
              </button>
            ) : (currentUser ? (
              <button
                onClick={(e) => { e.stopPropagation(); setShowLeaveConfirm(true); }}
                disabled={isJoining}
                className="shrink-0 px-3 py-1.5 rounded-full bg-slate-100 text-slate-600 font-bold text-xs flex items-center gap-1 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                {isEn ? 'Joined' : 'شامل ہو گئے'}
              </button>
            ) : null)}

            {/* Leave Confirmation Modal */}
            {showLeaveConfirm && (
              <div className="absolute end-4 top-14 bg-white rounded-xl shadow-lg border border-slate-100 p-4 z-10 w-64 animate-in fade-in zoom-in-95" dir={isEn ? 'ltr' : 'rtl'}>
                <h4 className="font-bold text-slate-900 mb-1">{isEn ? 'Leave Group?' : 'گروپ چھوڑیں؟'}</h4>
                <p className="text-xs text-slate-500 mb-4">{isEn ? 'Are you sure you want to leave this group?' : 'کیا آپ واقعی اس گروپ کو چھوڑنا چاہتے ہیں؟'}</p>
                <div className="flex items-center justify-end gap-2">
                  <button 
                    onClick={(e) => { e.stopPropagation(); setShowLeaveConfirm(false); }}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    {isEn ? 'Cancel' : 'منسوخ کریں'}
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleLeaveGroup(); }}
                    disabled={isJoining}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                  >
                    {isEn ? 'Leave Group' : 'گروپ چھوڑیں'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="p-3 flex items-center gap-3 border-b border-slate-100" dir="ltr">
          <ClickableAvatar
            userId={entity.author_id || entity.user_id || title}
            name={title}
            avatar={entity.avatar || entity.profiles?.profile_photo}
            size={36}
            className="shrink-0 ring-1 ring-slate-100 shadow-xs"
          />
          <div className="text-left flex-1">
            <h5 className="text-sm font-bold text-slate-900 leading-tight flex items-center gap-1 justify-start">
              <ClickableAvatar
                userId={entity.author_id || entity.user_id || title}
                name={title}
                nameOnly={true}
                nameClassName="text-sm font-bold text-slate-900 leading-tight hover:underline cursor-pointer"
              />
              {entity.verified && <CheckCircle className="w-3.5 h-3.5 text-blue-500 fill-blue-500/10" />}
            </h5>
            <p className="text-[11px] font-medium text-slate-500 mt-0.5 text-left">{subtitle}</p>
          </div>
        </div>

        <div className="px-4 pb-4 pt-1 text-right font-['Noto_Sans_Arabic']" dir="rtl">
          {title && <h3 className="font-bold text-slate-900 text-lg mb-2">{title}</h3>}
          {content && <RichText text={content} className="text-[15px] font-medium text-slate-800 mb-2 leading-relaxed whitespace-pre-wrap" />}
        </div>

        {image && !videoUrl && (
          <div className="w-full flex justify-center px-4 pb-4 pt-1 bg-white">
            <div className="w-fit max-w-full relative overflow-hidden rounded-[24px] shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-[#E5E7EB] dark:border-white/10 md:hover:shadow-[0_12px_40px_rgba(0,0,0,0.15)] transition-all duration-300 group bg-slate-50">
              <img src={image} className="max-w-full max-h-[500px] w-auto h-auto object-contain block transition-transform duration-300 ease-out md:group-hover:scale-[1.02]" />
            </div>
          </div>
        )}

        {videoUrl && (
          <div className="w-full flex justify-center px-4 pb-4 pt-1 bg-white">
            <div className="w-full relative h-[350px] sm:h-[400px] bg-black overflow-hidden rounded-[24px] shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-[#E5E7EB] dark:border-white/10 md:hover:shadow-[0_12px_40px_rgba(0,0,0,0.15)] transition-all duration-300 group">
              <VideoPlayer
                videoId={`shared-${entity.id}`}
                src={videoUrl}
                preloadType="metadata"
                className="w-full h-full object-contain block"
              />
              <div className="absolute bottom-3 end-3 flex items-center gap-1.5 bg-black/60 backdrop-blur-md text-white px-3 py-1.5 rounded-[12px] z-20 text-[11px] font-bold shadow-sm border border-white/10"><Eye className="w-3.5 h-3.5"/> {entity.viewsCount ?? 0}</div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div ref={postRef}>
      <FeedCard
        id={post.id}
        authorId={post.userId}
        authorName={post.author}
        authorAvatar={post.avatar}
        timestamp={post.time}
        location={post.area}
        isVerified={isEntityVerified(post.author)}
        tvsBadgeType={getTvsBadgeType(post.author)}
        badge={
          post.postType === 'share' ? (
            <div className="flex flex-col text-slate-500 font-medium ms-1 text-[13px] leading-snug">
              <span className="lowercase">{isEn ? 'shared a post' : 'نے ایک پوسٹ شیئر کی'}</span>
              {post.sharedOriginalEntity?.groups && (
                <span className="text-[11px] text-slate-400">
                  {isEn ? 'from ' : 'سے '}
                  <span className="font-bold text-slate-600">{Array.isArray(post.sharedOriginalEntity.groups) ? post.sharedOriginalEntity.groups[0]?.name : post.sharedOriginalEntity.groups.name}</span>
                </span>
              )}
            </div>
          ) : post.postTag && (
            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black ${post.postTag === 'lost' ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-emerald-100 text-emerald-700 border border-emerald-200'}`}>
              {post.postTag === 'lost' ? '🔍 LOST ITEM' : '✅ FOUND ITEM'}
            </div>
          )
        }
        isLiked={isLiked}
        likesCount={likeCount}
        commentsCount={post.commentsCount || (post.comments || []).length}
        sharesCount={post.sharesCount || post.shares || 0}
        onLike={() => onLike(post.id)}
        onCommentToggle={() => setIsExpanded(!isExpanded)}
        onShare={() => {
            if (onShareRequest) {
              onShareRequest(
                post.postType === 'share' && post.sharedEntityType ? post.sharedEntityType : (post.postType || 'post'), 
                post.postType === 'share' && post.sharedEntityId ? post.sharedEntityId : post.id, 
                post.content ? (
                  <div className="p-3 bg-white">
                    <p className="text-sm font-bold text-slate-800">{post.author}</p>
                    <p className="text-xs text-slate-600 line-clamp-2">{post.content}</p>
                  </div>
                ) : undefined
              );
            } else {
              alert('Share unavailable');
            }
          }}
        commentsSection={
          isExpanded && (
            <div className="space-y-4">
              <div className="space-y-3">
                {(post.comments || []).map((comment: any) => {
                  const avatar = comment.user?.profilePhoto || comment.user?.photo || comment.user?.avatar || comment.author?.profilePhoto || comment.author?.avatar || comment.avatar;
                  return (
                    <div
                      key={comment.id || Math.random().toString()}
                      className="flex gap-3 items-start text-slate-800 bg-slate-50 p-3 rounded-xl"
                      dir="ltr"
                    >
                      <ClickableAvatar
                        userId={comment.userId}
                        name={comment.author}
                        avatar={avatar}
                        size={32}
                        className="border border-slate-100 shrink-0"
                      />
                      <div className="space-y-0.5 flex-1 text-left">
                        <div className="flex items-center gap-1.5 justify-start">
                          <h5 className="font-semibold text-sm text-slate-900 flex items-center gap-1 justify-start">
                            <ClickableAvatar
                              userId={comment.userId}
                              name={comment.author}
                              nameOnly={true}
                              nameClassName="font-semibold text-sm text-slate-900"
                            />
                            {isEntityVerified(comment.author) && (
                              <TvsBadge badgeType={getTvsBadgeType(comment.author)} />
                            )}
                          </h5>
                          <span className="text-xs text-slate-400">•</span>
                          <span className="text-xs text-slate-500">{comment.time}</span>
                        </div>
                        <RichText content={comment.content} className="text-sm text-slate-700 leading-relaxed font-normal block" />
                      </div>
                    </div>
                  );
                })}
              </div>

                <div className="flex gap-2.5 items-end pt-2 border-t border-slate-100 mt-2" dir="ltr">
                  <div className="w-[34px] h-[34px] rounded-full bg-slate-200 overflow-hidden shrink-0 mt-0.5 border border-slate-100 shadow-sm">
                    <img 
                      src={currentUserData?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUserData?.name || 'User')}&background=random`} 
                      className="w-full h-full object-cover" 
                      alt="Avatar" 
                    />
                  </div>
                  <div className="flex-1 relative bg-slate-100 rounded-[20px] flex items-end overflow-hidden transition-colors focus-within:bg-slate-200/70 border border-transparent focus-within:border-slate-300">
                    <MentionTextarea
                      value={commentText}
                      onChange={(val) => setCommentText(val)}
                      placeholder={isEn ? 'Write a comment...' : 'تبصرہ کریں...'}
                      className="w-full ps-4 pe-10 py-2.5 text-[14px] bg-transparent border-0 focus:ring-0 focus:outline-none transition-all font-medium leading-tight resize-none m-0 min-h-[40px] text-slate-800"
                      rows={Math.max(1, Math.min(4, commentText.split('\n').length))}
                    />
                    <button
                      onClick={handleAddComment}
                      disabled={!commentText.trim()}
                      className={`absolute end-1 bottom-1 p-1.5 rounded-full transition-all flex items-center justify-center ${commentText.trim() ? 'bg-blue-600 text-white cursor-pointer hover:bg-blue-700 hover:scale-105 active:scale-95' : 'bg-transparent text-slate-400 cursor-default'}`}
                    >
                      <Send className="w-4 h-4 ms-0.5" />
                    </button>
                  </div>
                </div>
            </div>
          )
        }
      >
        <div className="px-4 pb-3 pt-1">
          {post.postType === 'share' && post.sharedCaption && (
            <RichText content={post.sharedCaption} className="text-sm text-slate-800 leading-relaxed block mb-3" />
          )}
          {post.postType !== 'share' && post.content && (
            <RichText content={post.content} className="text-sm text-slate-800 leading-relaxed block" />
          )}
        </div>
        
        {post.postType === 'share' && post.sharedOriginalEntity && (
          <div className="mx-4 mb-3 border border-slate-200 rounded-2xl overflow-hidden bg-slate-50 relative cursor-pointer hover:border-blue-300 transition-colors">
            {renderSharedEntity()}
          </div>
        )}

        {post.postType !== 'share' && post.image && (
          <div className="w-full flex justify-center mt-3 mb-2 px-4">
            <div
              onClick={() => {
                if (onImageClick) {
                  onImageClick(post.images && post.images.length > 0 ? post.images : [post.image]);
                }
              }}
              className="w-fit max-w-full relative cursor-pointer overflow-hidden rounded-[24px] shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-[#E5E7EB] dark:border-white/10 md:hover:shadow-[0_12px_40px_rgba(0,0,0,0.15)] transition-all duration-300 group bg-slate-50"
            >
              <img
                src={post.image}
                alt="Post content"
                className="max-w-full max-h-[500px] w-auto h-auto object-contain block transition-transform duration-300 ease-out md:group-hover:scale-[1.02] animate-[fadeIn_0.5s_ease-out]"
              />
              {post.images && post.images.length > 1 && (
                <div className="absolute bottom-3 end-3 bg-black/70 backdrop-blur-xs text-white text-[10px] font-black px-2.5 py-1.5 rounded-xl border border-white/20 flex items-center gap-1">
                  <span>📸</span>
                  <span>
                    +{post.images.length - 1} {isEn ? 'Photos' : 'مزید تصاویر'}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {post.videoUrl && (
            <div className="w-full flex justify-center mt-3 mb-2 px-4">
              <div className="w-full max-w-[700px] relative h-[350px] sm:h-[450px] bg-black overflow-hidden rounded-[24px] shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-[#E5E7EB] dark:border-white/10 md:hover:shadow-[0_12px_40px_rgba(0,0,0,0.15)] transition-all duration-300 group">
                <VideoPlayer
                  videoId={post.id}
                  src={post.videoUrl}
                  preloadType="metadata"
                  className="w-full h-full object-contain block"
                />
                <div className="absolute bottom-3 end-3 flex items-center gap-1.5 bg-black/60 backdrop-blur-md text-white px-3 py-1.5 rounded-[12px] z-20 text-[11px] font-bold shadow-sm border border-white/10"><Eye className="w-3.5 h-3.5"/> {post.viewsCount ?? 0}</div>
              </div>
            </div>
          )}
      </FeedCard>
    </div>
  );
};

export default React.memo(PostCardComponent, (prevProps, nextProps) => {
  return prevProps.post.id === nextProps.post.id &&
         prevProps.isLiked === nextProps.isLiked &&
         prevProps.likeCount === nextProps.likeCount &&
         prevProps.currentLanguage === nextProps.currentLanguage &&
         (prevProps.post.commentsCount === nextProps.post.commentsCount || 
          (prevProps.post.comments?.length === nextProps.post.comments?.length)) &&
         prevProps.post.viewsCount === nextProps.post.viewsCount;
});
