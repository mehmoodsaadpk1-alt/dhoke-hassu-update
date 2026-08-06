import React, { useState, useRef, useEffect } from 'react';
import { MoreHorizontal, ThumbsUp, MessageCircle, Share2 } from 'lucide-react';
import ClickableAvatar from './ClickableAvatar';
import TvsBadge from './TvsBadge';
import { LikeHoverTooltip, LikeUsersModal } from './LikeHoverPopup';
import { dbGetPostLikes, PostLikeUser } from '../utils/supabaseClient';

interface FeedCardProps {
  id: string;
  authorId?: string;
  authorName: string;
  authorAvatar?: string;
  timestamp: string;
  location?: string;
  isVerified?: boolean;
  tvsBadgeType?: string;
  badge?: React.ReactNode;
  children: React.ReactNode; 
  
  showActions?: boolean;
  isLiked?: boolean;
  likesCount?: number;
  commentsCount?: number;
  sharesCount?: number;
  onLike?: () => void;
  onCommentToggle?: () => void;
  onShare?: () => void;
  
  commentsSection?: React.ReactNode;
  currentLanguage?: 'en' | 'ur';
}

export default function FeedCard({
  id,
  authorId,
  authorName,
  authorAvatar,
  timestamp,
  location,
  isVerified,
  tvsBadgeType,
  badge,
  children,
  
  showActions = true,
  isLiked = false,
  likesCount = 0,
  commentsCount = 0,
  sharesCount = 0,
  onLike,
  onCommentToggle,
  onShare,
  
  commentsSection,
  currentLanguage = 'ur'
}: FeedCardProps) {
  const isEn = currentLanguage === 'en';

  const [showTooltip, setShowTooltip] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [likedUsers, setLikedUsers] = useState<PostLikeUser[] | null>(null);
  const [isLoadingLikes, setIsLoadingLikes] = useState(false);

  const hoverTimerRef = useRef<NodeJS.Timeout | null>(null);
  const leaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const cacheRef = useRef<PostLikeUser[] | null>(null);

  // Invalidate cache when post ID, like status or like count changes
  useEffect(() => {
    cacheRef.current = null;
    setLikedUsers(null);
  }, [id, isLiked, likesCount]);

  const loadLikes = async () => {
    if (cacheRef.current !== null) {
      setLikedUsers(cacheRef.current);
      return;
    }
    setIsLoadingLikes(true);
    const users = await dbGetPostLikes(id);
    cacheRef.current = users;
    setLikedUsers(users);
    setIsLoadingLikes(false);
  };

  const handleMouseEnter = () => {
    if (leaveTimerRef.current) clearTimeout(leaveTimerRef.current);
    hoverTimerRef.current = setTimeout(() => {
      setShowTooltip(true);
      loadLikes();
    }, 250);
  };

  const handleMouseLeave = () => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    leaveTimerRef.current = setTimeout(() => {
      setShowTooltip(false);
    }, 200);
  };

  const handleLikeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    cacheRef.current = null;
    setLikedUsers(null);
    if (onLike) onLike();
  };

  const handleCountClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowTooltip(false);
    setIsModalOpen(true);
    loadLikes();
  };

  return (
    <div className="bg-white rounded-[24px] shadow-sm hover:shadow-md border border-slate-100 transition-all duration-300 w-full max-w-full relative font-['Noto_Sans_Arabic'] mb-4" dir={isEn ? 'ltr' : 'rtl'}>
      <div className="flex items-start justify-between p-4 pb-3" dir="ltr">
        <div className="flex items-center gap-3 text-left">
          <ClickableAvatar
            userId={authorId}
            name={authorName}
            avatar={authorAvatar}
            size={44}
            className="border-2 border-slate-50 shrink-0"
          />
          <div className="text-left">
            <div className="flex items-center gap-1.5 justify-start">
              <h4 className="font-bold text-slate-900 text-[15px] flex items-center gap-1">
                <ClickableAvatar
                  userId={authorId}
                  name={authorName}
                  nameOnly={true}
                  nameClassName="font-bold text-slate-900 text-[15px]"
                />
                {isVerified && tvsBadgeType && (
                  <TvsBadge badgeType={tvsBadgeType as any} />
                )}
              </h4>
              {badge}
            </div>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5 opacity-80 text-left">
              {timestamp}
              {location && <span className="ms-1.5 inline-flex items-center gap-0.5"><span className="text-[10px]">📍</span> {location}</span>}
            </p>
          </div>
        </div>
        
        <button className="text-slate-400 hover:text-slate-600 transition-colors p-1 cursor-pointer mt-1">
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>
      
      <div className={`w-full overflow-hidden ${isEn ? 'text-left' : 'text-right'}`} dir={isEn ? 'ltr' : 'rtl'}>
        {children}
      </div>

      {showActions && (
        <div className="flex items-center justify-center gap-2 sm:gap-4 md:gap-6 px-4 py-2 border-t border-slate-100 w-full bg-white relative rounded-b-[24px]">
          
          {/* Like Button & Hover Container */}
          <div
            className="relative"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            {showTooltip && (
              <LikeHoverTooltip
                likesCount={likesCount}
                likedUsers={likedUsers}
                isLoading={isLoadingLikes}
                onOpenModal={() => {
                  setShowTooltip(false);
                  setIsModalOpen(true);
                  loadLikes();
                }}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                isEn={isEn}
              />
            )}

            <div className="flex items-center">
              <button
                onClick={handleLikeClick}
                className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-[13px] font-bold transition-all cursor-pointer ${
                  isLiked ? 'text-[#1877F2] bg-blue-50/50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                }`}
              >
                <ThumbsUp className={`w-[18px] h-[18px] ${isLiked ? 'fill-current' : ''}`} />
                <span>{isEn ? 'Like' : 'لائیک'}</span>
              </button>

              {likesCount > 0 && (
                <button
                  onClick={handleCountClick}
                  className="text-[11px] font-semibold text-slate-500 hover:text-[#1877F2] hover:underline px-1 py-2 cursor-pointer transition-colors"
                >
                  ({likesCount})
                </button>
              )}
            </div>
          </div>
          
          <button
            onClick={onCommentToggle}
            className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-[13px] font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-all cursor-pointer"
          >
            <MessageCircle className="w-[18px] h-[18px]" />
            <span>{isEn ? 'Comment' : 'کمنٹ'}</span>
            {commentsCount > 0 && <span className="text-[11px] font-semibold ms-1 opacity-80">({commentsCount})</span>}
          </button>
          
          <button
            onClick={onShare}
            className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-[13px] font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-all cursor-pointer"
          >
            <Share2 className="w-[18px] h-[18px] -scale-x-100" />
            <span>{isEn ? 'Share' : 'شیئر'}</span>
            {sharesCount > 0 && <span className="text-[11px] font-semibold ms-1 opacity-80">({sharesCount})</span>}
          </button>
        </div>
      )}

      {/* Full Likes Modal */}
      <LikeUsersModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        likesCount={likesCount}
        likedUsers={likedUsers || []}
        isLoading={isLoadingLikes}
        isEn={isEn}
      />

      {commentsSection && (
        <div className="px-4 pb-4 border-t border-slate-100 pt-3">
          {commentsSection}
        </div>
      )}
    </div>
  );
}
