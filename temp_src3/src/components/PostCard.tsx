import React, { useState } from 'react';
import { Heart, MessageCircle, Share2, Send } from 'lucide-react';
import ClickableAvatar from './ClickableAvatar';
import TvsBadge from './TvsBadge';
import RichText from './RichText';
import MentionTextarea from './MentionTextarea';

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
}

export default function PostCard({
  post,
  isLiked,
  likeCount,
  onLike,
  onComment,
  isEntityVerified,
  getTvsBadgeType,
  onImageClick,
  currentLanguage = 'en',
}: PostCardProps) {
  const isEn = currentLanguage === 'en';
  const [isExpanded, setIsExpanded] = useState(false);
  const [commentText, setCommentText] = useState('');

  const handleAddComment = () => {
    if (!commentText.trim()) return;
    onComment(post.id, commentText);
    setCommentText('');
  };

  const t = {
    like: isEn ? 'Like' : 'پتہ',
    comment: isEn ? 'Comment' : 'تبصرہ',
    share: isEn ? 'Share' : 'شیئر',
  };

  return (
    <div
      className={`bg-white rounded-2xl border p-5 shadow-sm space-y-4 ${
        post.postTag === 'lost'
          ? 'border-red-200 bg-red-50/20'
          : post.postTag === 'found'
          ? 'border-emerald-200 bg-emerald-50/20'
          : 'border-slate-200/60'
      }`}
    >
      {/* Lost & Found Tag Badge */}
      {post.postTag && (
        <div
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black ${
            post.postTag === 'lost'
              ? 'bg-red-100 text-red-700 border border-red-200'
              : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
          }`}
        >
          {post.postTag === 'lost' ? '🔍 LOST ITEM' : '✅ FOUND ITEM'}
        </div>
      )}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <ClickableAvatar
            userId={post.userId}
            name={post.author}
            avatar={post.avatar}
            size={36}
            className="border border-slate-100"
          />
          <div>
            <div className="flex items-center gap-1.5">
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1">
                <ClickableAvatar
                  userId={post.userId}
                  name={post.author}
                  showName={true}
                  nameClassName="font-bold text-slate-900 text-sm"
                />
                {isEntityVerified(post.author) && (
                  <TvsBadge badgeType={getTvsBadgeType(post.author)} />
                )}
              </h4>
              <span className="text-[10px] text-slate-400">•</span>
              {post.latitude && post.longitude ? (
                <a
                  href={`https://www.google.com/maps?q=${post.latitude},${post.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] bg-blue-50 hover:bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded font-bold flex items-center gap-0.5 transition-colors no-underline"
                  title={isEn ? 'Open in Google Maps' : 'گوگل میپس پر کھولیں'}
                >
                  <span>📍</span>
                  <span>{post.area}</span>
                </a>
              ) : (
                <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-semibold">
                  {post.area}
                </span>
              )}
            </div>
            <p className="text-[10px] text-slate-400">{post.time}</p>
          </div>
        </div>
        <button
          onClick={() => alert(isEn ? 'Post reported.' : 'رپورٹ ہو گئی')}
          className="text-xs text-slate-400 hover:text-red-500 cursor-pointer"
        >
          ⚠️
        </button>
      </div>

      <RichText content={post.content} className="text-sm text-slate-800 leading-relaxed block" />

      {post.image && (
        <div
          onClick={() => {
            if (onImageClick) {
              onImageClick(post.images && post.images.length > 0 ? post.images : [post.image]);
            }
          }}
          className="rounded-xl overflow-hidden bg-slate-50 relative cursor-pointer group border border-slate-100"
        >
          <img
            src={post.image}
            alt="Post content"
            className="w-full h-auto object-contain block transition-transform group-hover:scale-[1.01]"
          />
          {post.images && post.images.length > 1 && (
            <div className="absolute bottom-3 right-3 bg-black/70 backdrop-blur-xs text-white text-[10px] font-black px-2.5 py-1.5 rounded-xl border border-white/20 flex items-center gap-1">
              <span>🖼️</span>
              <span>
                +{post.images.length - 1} {isEn ? 'Photos' : 'تصاویر'}
              </span>
            </div>
          )}
        </div>
      )}

      <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs text-slate-500 font-semibold">
        <button
          onClick={() => onLike(post.id)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
            isLiked ? 'text-red-500 bg-red-50/50' : 'hover:bg-slate-50'
          }`}
        >
          <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
          <span>
            {likeCount} {t.like}
          </span>
        </button>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
            isExpanded ? 'text-blue-600 bg-blue-50/80' : 'hover:bg-slate-50'
          }`}
        >
          <MessageCircle className="w-4 h-4" />
          <span>
            {post.commentsCount} {t.comment}
          </span>
        </button>

        <button
          onClick={() => alert('Link copied')}
          className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
        >
          <Share2 className="w-4 h-4" />
          <span>{t.share}</span>
        </button>
      </div>

      {/* Expanded Comments Section */}
      {isExpanded && (
        <div className="pt-4 border-t border-slate-100 space-y-4">
          <div className="space-y-3">
            {(post.comments || []).map((comment: any) => (
              <div
                key={comment.id}
                className="flex gap-3 items-start text-xs text-slate-800 bg-slate-50 p-3 rounded-xl"
              >
                <ClickableAvatar
                  userId={comment.userId}
                  name={comment.author}
                  avatar={comment.avatar}
                  size={28}
                  className="border border-slate-100 shrink-0"
                />
                <div className="space-y-0.5 flex-1">
                  <div className="flex items-center gap-1">
                    <h5 className="font-extrabold text-slate-900 flex items-center gap-1">
                      <ClickableAvatar
                        userId={comment.userId}
                        name={comment.author}
                        showName={true}
                        nameClassName="font-extrabold text-slate-900"
                      />
                      {isEntityVerified(comment.author) && (
                        <TvsBadge badgeType={getTvsBadgeType(comment.author)} />
                      )}
                    </h5>
                    <span className="text-[9px] text-slate-400">•</span>
                    <span className="text-[9px] text-slate-400">{comment.time}</span>
                  </div>
                    <RichText content={comment.content} className="text-slate-700 leading-relaxed font-semibold block" />
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-2 items-center pt-1.5">
            <MentionTextarea
              value={commentText}
              onChange={(val) => setCommentText(val)}
              placeholder={isEn ? 'Write a comment...' : 'اپنی رائے لکھیں...'}
              className="flex-1 px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all font-semibold"
              rows={1}
            />
            <button
              onClick={handleAddComment}
              className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all cursor-pointer border-0 shadow-xs flex items-center justify-center"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
