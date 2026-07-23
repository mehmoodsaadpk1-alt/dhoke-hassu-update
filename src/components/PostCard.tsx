import React, { useState, useEffect, useRef } from 'react';
import { Heart, MessageCircle, Share2, Send, CheckCircle, Eye } from 'lucide-react';
import ClickableAvatar from './ClickableAvatar';
import TvsBadge from './TvsBadge';
import RichText from './RichText';
import MentionTextarea from './MentionTextarea';
import FeedCard from './FeedCard';
import { VideoPlayer } from './video/VideoPlayer';
import { analytics } from '../services/AnalyticsService';

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
}: PostCardProps) => {
  const isEn = currentLanguage === 'en';
  const [isExpanded, setIsExpanded] = useState(false);
  const [commentText, setCommentText] = useState('');

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

    return (
      <div className="bg-white">
        <div className="p-3 flex items-center gap-2 border-b border-slate-100">
          <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center shrink-0 overflow-hidden">
            {(entity.avatar || entity.profiles?.profile_photo) ? (
              <img src={entity.avatar || entity.profiles?.profile_photo} className="w-full h-full object-cover" />
            ) : (
              <span className="text-xs font-bold text-slate-500">{title.charAt(0)}</span>
            )}
          </div>
          <div>
            <h5 className="text-sm font-bold text-slate-900 leading-tight flex items-center gap-1">
              {title}
              {entity.verified && <CheckCircle className="w-3 h-3 text-blue-500" />}
            </h5>
            <p className="text-xs text-slate-500">{subtitle}</p>
          </div>
        </div>

        <div className="p-3">
          {content && <RichText text={content} className="text-sm text-slate-800 line-clamp-4 mb-2" />}
        </div>

        {image && !videoUrl && (
          <div className="w-full flex justify-center bg-slate-50 border-t border-slate-100">
            <div className="w-full relative">
              <img src={image} className="w-full object-cover max-h-[400px] block" />
            </div>
          </div>
        )}

        {videoUrl && (
          <div className="w-full flex justify-center bg-black border-t border-slate-900 relative">
            <div className="w-full relative h-[400px]">
              <VideoPlayer
                videoId={`shared-${entity.id}`}
                src={videoUrl}
                preloadType="metadata"
                className="w-full h-full object-contain block"
              />
              <div className="absolute bottom-2 end-2 flex items-center gap-1 bg-black/50 text-white px-2 py-1 rounded z-20"><Eye className="w-3 h-3"/> {entity.viewsCount ?? 0}</div>
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
            <span className="text-slate-500 font-medium ms-1 lowercase">{isEn ? 'shared' : 'نے شیئر کیا'}</span>
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
                    >
                      <ClickableAvatar
                        userId={comment.userId}
                        name={comment.author}
                        avatar={avatar}
                        size={32}
                        className="border border-slate-100 shrink-0"
                      />
                      <div className="space-y-0.5 flex-1">
                        <div className="flex items-center gap-1.5">
                          <h5 className="font-semibold text-sm text-slate-900 flex items-center gap-1">
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

                <div className="flex gap-2.5 items-end pt-2 border-t border-slate-100 mt-2">
                  <div className="w-[34px] h-[34px] rounded-full bg-slate-200 overflow-hidden shrink-0 mt-0.5">
                    <img src="https://ui-avatars.com/api/?name=User&background=random" className="w-full h-full object-cover opacity-80" alt="Avatar" />
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
          <div className="w-full flex justify-center mt-3 bg-slate-50 border-t border-b border-slate-100">
            <div
              onClick={() => {
                if (onImageClick) {
                  onImageClick(post.images && post.images.length > 0 ? post.images : [post.image]);
                }
              }}
              className="w-full max-w-[700px] relative cursor-pointer"
            >
              <img
                src={post.image}
                alt="Post content"
                className="w-full max-h-[500px] object-contain block"
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
            <div className="w-full flex justify-center mt-3 bg-black border-t border-b border-slate-900 relative">
              <div className="w-full max-w-[700px] relative aspect-[4/5] md:h-[500px]">
                <VideoPlayer
                  videoId={post.id}
                  src={post.videoUrl}
                  preloadType="metadata"
                  className="w-full h-full object-contain block"
                />
                <div className="absolute bottom-2 end-2 flex items-center gap-1 bg-black/50 text-white px-2 py-1 rounded z-20"><Eye className="w-3 h-3"/> {post.viewsCount ?? 0}</div>
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
