import React, { useState, useEffect } from 'react';
import { Heart, MessageCircle, Share2, Bookmark, MoreVertical, Plus } from 'lucide-react';

interface ShortsActionsProps {
  videoId: string;
  creatorId: string;
  creatorName: string;
  creatorPhoto?: string;
  likesCount: number;
  commentsCount: number;
  hasLikedInitially: boolean;
  hasSavedInitially: boolean;
  isOwner?: boolean;
  onLike: (videoId: string, like: boolean) => Promise<void> | void;
  onComment: (videoId: string) => void;
  onShare: (videoId: string) => void;
  onSave: (videoId: string, save: boolean) => Promise<void> | void;
  onFollow: (creatorId: string) => void;
  onReport: (videoId: string) => void;
  onDelete?: (videoId: string) => void;
}

export const ShortsActions: React.FC<ShortsActionsProps> = React.memo(({
  videoId,
  creatorId,
  creatorPhoto,
  likesCount,
  commentsCount,
  hasLikedInitially,
  hasSavedInitially,
  isOwner,
  onLike,
  onComment,
  onShare,
  onSave,
  onFollow,
  onReport,
  onDelete
}) => {
  const [hasSaved, setHasSaved] = useState(hasSavedInitially);
  const [showOptions, setShowOptions] = useState(false);

  const handleLikeClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const newLikedState = !hasLikedInitially;
    
    // We call onLike and let ShortsCard handle the optimistic state updates
    try {
      await onLike(videoId, newLikedState);
    } catch (err) {
      showToast("Action failed. Reverting.");
      // Revert logic should be in ShortsCard if it fails, but onLike catches its own errors usually.
    }
  };

  const handleSaveClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const newSavedState = !hasSaved;
    setHasSaved(newSavedState);
    
    try {
      await onSave(videoId, newSavedState);
    } catch (err) {
      // Rollback
      setHasSaved(!newSavedState);
      showToast("Action failed. Reverting.");
    }
  };

  const showToast = (message: string) => {
    // Basic toast implementation for stabilization
    const toast = document.createElement('div');
    toast.className = 'fixed bottom-24 start-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-4 py-2 rounded shadow-xl z-50 transition-opacity';
    toast.innerText = message;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 300);
    }, 2000);
  };

  const formatCount = (count: number) => {
    if (count >= 1000000) return (count / 1000000).toFixed(1) + 'M';
    if (count >= 1000) return (count / 1000).toFixed(1) + 'K';
    return count.toString();
  };

  return (
    <div className="flex flex-col items-center space-y-3 pb-0">
      {/* Like Button */}
      <button onClick={handleLikeClick} className="flex flex-col items-center group transition-transform active:scale-90">
        <div className={`bg-black/40 p-2 rounded-full backdrop-blur-sm border border-white/10 shadow-lg ${hasLikedInitially ? 'text-red-500' : 'text-white'}`}>
          <Heart size={24} fill={hasLikedInitially ? 'currentColor' : 'none'} />
        </div>
        <span className="text-white text-xs font-bold drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] mt-1">{formatCount(likesCount)}</span>
      </button>

      {/* Comment Button */}
      <button onClick={(e) => { e.stopPropagation(); onComment(videoId); }} className="flex flex-col items-center group transition-transform active:scale-90">
        <div className="bg-black/40 p-2 rounded-full text-white backdrop-blur-sm border border-white/10 shadow-lg">
          <MessageCircle size={24} />
        </div>
        <span className="text-white text-xs font-bold drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] mt-1">{formatCount(commentsCount)}</span>
      </button>

      {/* Save Button (Instagram style) */}
      <button onClick={handleSaveClick} className="flex flex-col items-center group transition-transform active:scale-90">
        <div className={`bg-black/40 p-2 rounded-full backdrop-blur-sm border border-white/10 shadow-lg ${hasSaved ? 'text-yellow-400' : 'text-white'}`}>
          <Bookmark size={24} fill={hasSaved ? 'currentColor' : 'none'} />
        </div>
        <span className="text-white text-xs font-bold drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] mt-1">{hasSaved ? 'Saved' : 'Save'}</span>
      </button>

      {/* Share Button */}
      <button onClick={(e) => { e.stopPropagation(); onShare(videoId); }} className="flex flex-col items-center group transition-transform active:scale-90">
        <div className="bg-black/40 p-2 rounded-full text-white backdrop-blur-sm border border-white/10 shadow-lg">
          <Share2 size={24} />
        </div>
        <span className="text-white text-xs font-bold drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] mt-1">Share</span>
      </button>

      {/* More Options */}
      <div className="relative">
        <button onClick={(e) => { e.stopPropagation(); setShowOptions(!showOptions); }} className="bg-black/40 p-2 rounded-full text-white backdrop-blur-sm border border-white/10 shadow-lg transition-transform active:scale-90">
          <MoreVertical size={24} />
        </button>
        
        {showOptions && (
          <div className="absolute end-14 bottom-0 bg-gray-900/95 backdrop-blur-sm border border-gray-700 rounded-lg shadow-xl w-40 overflow-hidden z-50 animate-in fade-in slide-in-from-end-4 duration-200">
            {isOwner && onDelete && (
              <button 
                className="w-full text-start px-4 py-3 text-red-500 hover:bg-gray-800 text-sm font-bold transition-colors border-b border-gray-700"
                onClick={(e) => { e.stopPropagation(); onDelete(videoId); setShowOptions(false); }}
              >
                Delete Video
              </button>
            )}
            <button 
              className="w-full text-start px-4 py-3 text-red-400 hover:bg-gray-800 text-sm font-medium transition-colors"
              onClick={(e) => { e.stopPropagation(); onReport(videoId); setShowOptions(false); }}
            >
              Report Video
            </button>
            <button 
              className="w-full text-start px-4 py-3 text-white hover:bg-gray-800 text-sm font-medium transition-colors"
              onClick={(e) => { e.stopPropagation(); setShowOptions(false); }}
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
});

ShortsActions.displayName = 'ShortsActions';
