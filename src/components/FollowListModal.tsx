import React, { useState, useEffect, useCallback } from 'react';
import { X, Search, ShieldAlert, UserCheck, UserPlus, Clock, MoreVertical, Ban, BellOff } from 'lucide-react';
import { AppAvatar, AppButton, AppBadge } from './ui';
import OnlineIndicator from './OnlineIndicator';
import { supabase, dbGetFollowersList, dbGetFollowingList, dbGetFollowStatus, dbFollowUser, dbUnfollowUser, dbRemoveFollower, dbBlockUser } from '../utils/supabaseClient';
import { isEntityVerified } from '../utils/verification';
import { motion, AnimatePresence } from 'framer-motion';
import TvsBadge from './TvsBadge';

interface FollowListModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  viewerId: string;
  initialTab?: 'followers' | 'following';
  onNavigateToProfile: (userId: string) => void;
  isEn?: boolean;
  currentUser?: any;
}

export default function FollowListModal({ isOpen, onClose, userId, viewerId, initialTab = 'followers', onNavigateToProfile, isEn = true, currentUser }: FollowListModalProps) {
  const isSelf = userId === viewerId;

  const [activeTab, setActiveTab] = useState<'followers' | 'following'>(initialTab);
  const [search, setSearch] = useState('');
  
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isPrivateError, setIsPrivateError] = useState(false);
  const [followStatuses, setFollowStatuses] = useState<Record<string, string>>({});
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [mutualStatuses, setMutualStatuses] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  // Removed body overflow hidden to prevent scroll jump

  const loadData = useCallback(async () => {
    if (!isOpen || !userId || !viewerId) return;
    setIsLoading(true);
    setIsPrivateError(false);
    
    let res;
    if (activeTab === 'followers') {
      res = await dbGetFollowersList(userId, viewerId, search);
    } else {
      res = await dbGetFollowingList(userId, viewerId, search);
    }
    
    if (res.error === 'private') {
      setIsPrivateError(true);
      setUsers([]);
      setHasMore(false);
    } else {
      if (page === 0) setUsers(res.data || []);
      else setUsers(prev => [...prev, ...(res.data || [])]);
      
      setHasMore(res.hasMore || false);

      if (viewerId) {
        const newStatuses: Record<string, string> = { ...followStatuses };
        const newMutuals: Record<string, boolean> = { ...mutualStatuses };
        
        for (const item of (res.data || [])) {
          const targetId = activeTab === 'followers' ? item.follower_id : item.following_id;
          if (targetId !== viewerId) {
            newStatuses[targetId] = await dbGetFollowStatus(viewerId, targetId);
            const reverseStatus = await dbGetFollowStatus(targetId, viewerId);
            newMutuals[targetId] = reverseStatus === 'following';
          }
        }
        setFollowStatuses(newStatuses);
        setMutualStatuses(newMutuals);
      }
    }
    setIsLoading(false);
  }, [isOpen, userId, viewerId, activeTab, search, page]);

  useEffect(() => {
    // Debounce search
    const timer = setTimeout(() => {
      setPage(0);
      loadData();
    }, 300);
    return () => clearTimeout(timer);
  }, [search, loadData]);

  // Realtime subscription
  useEffect(() => {
    if (!isOpen || !supabase) return;
    const channel = supabase.channel('follow_modal_updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'followers' }, () => {
        loadData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_blocks' }, () => {
        loadData();
      })
      .subscribe();
      
    return () => { supabase.removeChannel(channel); };
  }, [isOpen, loadData]);

  const handleFollowAction = async (targetId: string, currentStatus: string) => {
    if (!viewerId) return;
    // optimistic update
    const newStatus = currentStatus === 'following' || currentStatus === 'requested' ? 'none' : 'requested';
    setFollowStatuses(prev => ({ ...prev, [targetId]: newStatus }));
    
    if (currentStatus === 'following' || currentStatus === 'requested') {
      await dbUnfollowUser(viewerId, targetId);
      setFollowStatuses(prev => ({ ...prev, [targetId]: 'none' }));
    } else {
      const res = await dbFollowUser(viewerId, targetId);
      if (res.success) setFollowStatuses(prev => ({ ...prev, [targetId]: res.status! }));
    }
  };

  const handleRemoveFollower = async (targetId: string) => {
    if (!isSelf || !window.confirm(isEn ? 'Remove this follower?' : 'اس فالوور کو ہٹائیں؟')) return;
    await dbRemoveFollower(targetId, viewerId);
    setUsers(prev => prev.filter(u => u.follower_id !== targetId));
  };
  
  const handleBlockUser = async (targetId: string) => {
    if (!window.confirm(isEn ? 'Block this user? They will not be able to interact with you.' : 'اس صارف کو بلاک کریں؟')) return;
    await dbBlockUser(viewerId, targetId);
    setUsers(prev => prev.filter(u => u.follower_id !== targetId && u.following_id !== targetId));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-start sm:items-center justify-center p-4 sm:p-0 bg-slate-900/60 backdrop-blur-sm overflow-hidden pt-10 sm:pt-0">
      <div className="absolute inset-0 bg-transparent" onClick={onClose} />
      <motion.div 
        initial={{ opacity: 0, y: 100, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 100, scale: 0.95 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="bg-white w-full max-w-md h-[85vh] sm:h-[75vh] rounded-2xl shadow-2xl flex flex-col relative z-10"
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <div className="w-8 h-1 rounded-full bg-slate-200 absolute -top-3 start-1/2 -translate-x-1/2 sm:hidden" />
          <h2 className="text-base font-black text-slate-900">
            {userId === viewerId ? (isEn ? 'Your Connections' : 'آپ کے رابطے') : (isEn ? 'Connections' : 'رابطے')}
          </h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex border-b border-slate-100 p-2 gap-2">
          <button 
            onClick={() => { setActiveTab('followers'); setSearch(''); }}
            className={`flex-1 py-2 text-sm font-bold rounded-2xl transition-all ${activeTab === 'followers' ? 'bg-emerald-50 text-emerald-600' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            {isEn ? 'Followers' : 'فالوورز'}
          </button>
          <button 
            onClick={() => { setActiveTab('following'); setSearch(''); }}
            className={`flex-1 py-2 text-sm font-bold rounded-2xl transition-all ${activeTab === 'following' ? 'bg-emerald-50 text-emerald-600' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            {isEn ? 'Following' : 'فالو کر رہے ہیں'}
          </button>
        </div>

        {!isPrivateError && (
          <div className="p-4 pb-2 border-b border-slate-100">
            <div className="relative">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={isEn ? 'Search users...' : 'صارفین تلاش کریں...'}
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-2xl ps-10 pe-4 py-2.5 focus:outline-none focus:border-blue-300 focus:bg-white transition-all font-medium"
              />
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {isPrivateError ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-3 opacity-70">
              <ShieldAlert className="w-12 h-12 text-slate-400" />
              <p className="text-sm font-bold text-slate-600">
                {isEn ? "This user's connections are private." : "اس صارف کے رابطے پرائیویٹ ہیں۔"}
              </p>
            </div>
          ) : isLoading && users.length === 0 ? (
            Array.from({length: 5}).map((_, i) => (
              <div key={i} className="flex items-center gap-3 animate-pulse">
                <div className="w-12 h-12 rounded-full bg-slate-100" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-32 bg-slate-100 rounded" />
                  <div className="h-3 w-20 bg-slate-100 rounded" />
                </div>
                <div className="w-20 h-8 bg-slate-100 rounded-2xl" />
              </div>
            ))
          ) : users.length === 0 ? (
            <div className="text-center text-sm font-bold text-slate-400 pt-10">
              {isEn ? 'No users found.' : 'کوئی صارف نہیں ملا۔'}
            </div>
          ) : (
            users.map(u => {
              const targetUser = u.profiles;
              if (!targetUser) return null;
              
              const targetId = activeTab === 'followers' ? u.follower_id : u.following_id;
              const fStatus = followStatuses[targetId] || 'none';
              const isTargetSelf = targetId === viewerId;

              return (
                <div key={u.id} className="flex items-center justify-between gap-3 group" dir="ltr">
                  <div 
                    className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer text-left"
                    onClick={() => {
                      onClose();
                      onNavigateToProfile(targetId);
                    }}
                  >
                    <OnlineIndicator userId={targetId} viewerId={viewerId}><AppAvatar src={targetUser.profile_photo} name={targetUser.full_name} size="md" /></OnlineIndicator>
                    <div className="flex-1 min-w-0 text-left">
                      <div className="flex items-center gap-1 justify-start">
                        <span className="text-sm font-bold text-slate-900 truncate">{targetUser.full_name}</span>
                        {isEntityVerified(targetUser.full_name) && <TvsBadge badgeType="green" />}
                      </div>
                      <div className="flex items-center gap-2 justify-start">
                        <span className="text-xs font-medium text-slate-500 truncate">@{targetUser.full_name?.toLowerCase().replace(/\s+/g, '')}</span>
                        {mutualStatuses[targetId] && !isTargetSelf && (
                          <span className="text-[9px] font-bold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-xl ms-1 whitespace-nowrap">
                            {isEn ? 'Follows You' : 'آپ کو فالو کرتا ہے'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {!isTargetSelf && !isSelf && (
                      <AppButton 
                        size="sm" 
                        variant={fStatus === 'none' ? 'primary' : 'outline'}
                        className={`h-8 px-3 text-[11px] ${fStatus !== 'none' ? 'border-slate-200 text-slate-700' : ''}`}
                        onClick={() => handleFollowAction(targetId, fStatus)}
                      >
                        {fStatus === 'following' ? (isEn ? 'Following' : 'فالو کر رہے ہیں') :
                         fStatus === 'requested' ? (isEn ? 'Requested' : 'درخواست بھیجی') :
                         (isEn ? 'Follow' : 'فالو کریں')}
                      </AppButton>
                    )}
                    
                    {isSelf && activeTab === 'followers' && (
                      <AppButton size="sm" variant="outline" className="h-8 text-[11px] border-slate-200 text-slate-600" onClick={() => handleRemoveFollower(targetId)}>
                        {isEn ? 'Remove' : 'ہٹائیں'}
                      </AppButton>
                    )}
                    
                    {isSelf && activeTab === 'following' && (
                      <AppButton size="sm" variant="outline" className="h-8 text-[11px] border-slate-200 text-slate-600" onClick={() => handleFollowAction(targetId, 'following')}>
                        {isEn ? 'Following' : 'فالو کر رہے ہیں'}
                      </AppButton>
                    )}

                    {!isTargetSelf && (
                      <button 
                        onClick={() => handleBlockUser(targetId)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                        title={isEn ? 'Block User' : 'بلاک کریں'}
                      >
                        <Ban className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
          {hasMore && !isLoading && (
            <div className="flex justify-center pt-2 pb-6">
              <AppButton variant="outline" size="sm" onClick={() => setPage(p => p + 1)}>
                {isEn ? 'Load More' : 'مزید دیکھیں'}
              </AppButton>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

