import React from 'react';
import { MoreHorizontal, Heart, MessageCircle, Share2 } from 'lucide-react';
import ClickableAvatar from './ClickableAvatar';
import TvsBadge from './TvsBadge';

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
  
  commentsSection
}: FeedCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200 w-full max-w-full relative">
      <div className="flex items-start justify-between p-4 pb-3">
        <div className="flex items-center gap-3">
          <ClickableAvatar
            userId={authorId}
            name={authorName}
            avatar={authorAvatar}
            size={40}
            className="border border-slate-100 shrink-0"
          />
          <div>
            <div className="flex items-center gap-1.5">
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1">
                <ClickableAvatar
                  userId={authorId}
                  name={authorName}
                  nameOnly={true}
                  nameClassName="font-bold text-slate-900 text-sm"
                />
                {isVerified && tvsBadgeType && (
                  <TvsBadge badgeType={tvsBadgeType as any} />
                )}
              </h4>
              {badge}
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              {timestamp}
              {location && <span className="ml-1.5 inline-flex items-center gap-0.5"><span className="text-[10px]">📍</span> {location}</span>}
            </p>
          </div>
        </div>
        
        <button className="text-slate-400 hover:text-slate-600 transition-colors p-1 cursor-pointer">
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>
      
      <div className="w-full">
        {children}
      </div>

      {showActions && (
        <div className="flex items-center justify-between px-2 py-2 border-t border-slate-100 w-full">
          <button
            onClick={onLike}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[13px] font-bold transition-colors cursor-pointer ${
              isLiked ? 'text-red-500 bg-red-50/50' : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <Heart className={`w-[18px] h-[18px] ${isLiked ? 'fill-red-500' : ''}`} />
            <span>Like {likesCount > 0 ? `(${likesCount})` : ''}</span>
          </button>
          
          <button
            onClick={onCommentToggle}
            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[13px] font-bold text-slate-500 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <MessageCircle className="w-[18px] h-[18px]" />
            <span>Comment {commentsCount > 0 ? `(${commentsCount})` : ''}</span>
          </button>
          
          <button
            onClick={onShare}
            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[13px] font-bold text-slate-500 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <Share2 className="w-[18px] h-[18px]" />
            <span>Share {sharesCount ? `(${sharesCount})` : ''}</span>
          </button>
        </div>
      )}

      {commentsSection && (
        <div className="px-4 pb-4 border-t border-slate-100 pt-3">
          {commentsSection}
        </div>
      )}
    </div>
  );
}
