import React, { useState } from 'react';
import { ThumbsUp, X, CheckCircle, Search, User as UserIcon, Loader2 } from 'lucide-react';
import { PostLikeUser } from '../utils/supabaseClient';

interface LikeHoverTooltipProps {
  likesCount: number;
  likedUsers: PostLikeUser[] | null;
  isLoading: boolean;
  onOpenModal: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  isEn?: boolean;
}

export const LikeHoverTooltip: React.FC<LikeHoverTooltipProps> = ({
  likesCount,
  likedUsers,
  isLoading,
  onOpenModal,
  onMouseEnter,
  onMouseLeave,
  isEn = true
}) => {
  const users = likedUsers || [];
  const displayUsers = users.slice(0, 10);
  const extraCount = Math.max(0, (likesCount > 0 ? likesCount : users.length) - displayUsers.length);

  return (
    <div
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={(e) => {
        e.stopPropagation();
        onOpenModal();
      }}
      className="absolute bottom-full mb-2 start-1/2 -translate-x-1/2 z-[60] w-64 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200/80 p-3 text-slate-800 animate-in fade-in zoom-in-95 duration-150 cursor-pointer select-none ring-1 ring-slate-900/5"
      dir="ltr"
    >
      {/* Tooltip Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2">
        <div className="flex items-center gap-1.5 font-bold text-xs text-slate-700">
          <div className="w-5 h-5 rounded-full bg-[#1877F2] flex items-center justify-center text-white">
            <ThumbsUp className="w-3 h-3 fill-current" />
          </div>
          <span>{isEn ? 'Likes' : 'لائیکس'}</span>
        </div>
        <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-blue-50 text-[#1877F2]">
          {likesCount}
        </span>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-4 text-slate-400 gap-2 text-xs font-semibold">
          <Loader2 className="w-4 h-4 animate-spin text-[#1877F2]" />
          <span>{isEn ? 'Loading...' : 'لوڈ ہو رہا ہے...'}</span>
        </div>
      ) : users.length === 0 ? (
        <div className="py-3 text-center text-xs font-semibold text-slate-400">
          {isEn ? 'No likes yet.' : 'ابھی تک کوئی لائیک نہیں۔'}
        </div>
      ) : (
        <div className="space-y-1.5">
          {displayUsers.map((u, idx) => (
            <div
              key={u.userId || idx}
              className="flex items-center gap-2 py-1 px-1.5 rounded-lg hover:bg-slate-100/80 transition-colors"
            >
              <div className="w-7 h-7 rounded-full bg-slate-200 overflow-hidden shrink-0 border border-slate-200">
                {u.avatarUrl ? (
                  <img
                    src={u.avatarUrl}
                    alt={u.fullName}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold text-xs bg-slate-100">
                    {u.fullName?.charAt(0).toUpperCase() || <UserIcon className="w-3.5 h-3.5" />}
                  </div>
                )}
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-xs font-bold text-slate-800 truncate flex items-center gap-1">
                  {u.fullName}
                  {u.verified && <CheckCircle className="w-3 h-3 text-[#1877F2] shrink-0 fill-current" />}
                </span>
                {u.username && (
                  <span className="text-[10px] text-slate-400 truncate">@{u.username}</span>
                )}
              </div>
            </div>
          ))}

          {extraCount > 0 && (
            <div className="pt-1.5 border-t border-slate-100 text-center text-[11px] font-bold text-[#1877F2] hover:underline">
              +{extraCount} {isEn ? 'others' : 'دیگر'}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

interface LikeUsersModalProps {
  isOpen: boolean;
  onClose: () => void;
  likesCount: number;
  likedUsers: PostLikeUser[];
  isLoading: boolean;
  isEn?: boolean;
}

export const LikeUsersModal: React.FC<LikeUsersModalProps> = ({
  isOpen,
  onClose,
  likesCount,
  likedUsers,
  isLoading,
  isEn = true
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const filteredUsers = likedUsers.filter(u => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      u.fullName.toLowerCase().includes(q) ||
      (u.username && u.username.toLowerCase().includes(q))
    );
  });

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
      dir="ltr"
    >
      <div
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-[#1877F2] flex items-center justify-center text-white shadow-sm">
              <ThumbsUp className="w-4 h-4 fill-current" />
            </div>
            <h3 className="font-extrabold text-base text-slate-900">
              {isEn ? 'Likes' : 'لائیکس'}
            </h3>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-[#1877F2]">
              {likesCount}
            </span>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-200/60 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Bar */}
        {likedUsers.length > 5 && (
          <div className="px-4 py-2 border-b border-slate-100 bg-white">
            <div className="relative flex items-center">
              <Search className="w-4 h-4 text-slate-400 absolute start-3 pointer-events-none" />
              <input
                type="text"
                placeholder={isEn ? 'Search people...' : 'لوگوں کو تلاش کریں...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full ps-9 pe-4 py-2 text-xs font-medium bg-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1877F2]/30 text-slate-800"
              />
            </div>
          </div>
        )}

        {/* User List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-1">
          {isLoading ? (
            <div className="py-12 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-[#1877F2]" />
              <span className="text-xs font-semibold">{isEn ? 'Loading people...' : 'لوڈ ہو رہا ہے...'}</span>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm font-semibold">
              {searchQuery
                ? (isEn ? 'No matching people found.' : 'کوئی ملاپ نہیں ملا۔')
                : (isEn ? 'No likes yet.' : 'ابھی تک کوئی لائیک نہیں۔')}
            </div>
          ) : (
            filteredUsers.map((u, idx) => (
              <div
                key={u.userId || idx}
                onClick={() => {
                  if (u.userId) {
                    window.history.pushState({}, '', `/profile/${u.userId}`);
                    window.dispatchEvent(new Event('popstate'));
                    onClose();
                  }
                }}
                className="flex items-center gap-3 p-2.5 rounded-2xl hover:bg-slate-50 transition-colors cursor-pointer group"
              >
                <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden shrink-0 border border-slate-200 group-hover:scale-105 transition-transform">
                  {u.avatarUrl ? (
                    <img
                      src={u.avatarUrl}
                      alt={u.fullName}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold text-sm bg-slate-100">
                      {u.fullName?.charAt(0).toUpperCase() || <UserIcon className="w-5 h-5" />}
                    </div>
                  )}
                </div>

                <div className="flex flex-col min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold text-slate-900 truncate group-hover:text-[#1877F2] transition-colors">
                      {u.fullName}
                    </span>
                    {u.verified && (
                      <CheckCircle className="w-4 h-4 text-[#1877F2] shrink-0 fill-current" />
                    )}
                  </div>
                  {u.username && (
                    <span className="text-xs text-slate-400 truncate">@{u.username}</span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
