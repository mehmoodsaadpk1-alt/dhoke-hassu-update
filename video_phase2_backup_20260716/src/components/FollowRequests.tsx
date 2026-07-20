import React, { useState, useEffect } from 'react';
import { AppAvatar, AppButton } from './ui';
import { dbGetFollowRequests, dbAcceptFollowRequest, dbRejectFollowRequest } from '../utils/supabaseClient';
import { ArrowLeft, UserCheck, X } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function FollowRequests({ currentUser, onBack }: { currentUser: any, onBack: () => void }) {
  const { language } = useLanguage();
  const isEn = language === 'en';
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    setLoading(true);
    const data = await dbGetFollowRequests(currentUser.id);
    setRequests(data);
    setLoading(false);
  };

  const handleAccept = async (followerId: string) => {
    setRequests(prev => prev.filter(r => r.follower_id !== followerId));
    await dbAcceptFollowRequest(followerId, currentUser.id);
  };

  const handleReject = async (followerId: string) => {
    setRequests(prev => prev.filter(r => r.follower_id !== followerId));
    await dbRejectFollowRequest(followerId, currentUser.id);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900 absolute inset-0 z-50 animate-fade-in pb-20">
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-4 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate-700 dark:text-slate-200" />
          </button>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            {isEn ? "Follow Requests" : "فالو کی درخواستیں"}
          </h2>
        </div>
      </div>

      <div className="p-4 flex-1 overflow-y-auto">
        {loading ? (
          <div className="text-center text-slate-500 py-10">Loading...</div>
        ) : requests.length === 0 ? (
          <div className="text-center text-slate-500 py-10">
            {isEn ? "No pending follow requests." : "کوئی زیر التوا درخواست نہیں ہے۔"}
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map(req => {
              const p = req.profiles;
              return (
                <div key={req.id} className="flex items-center justify-between bg-white dark:bg-slate-800 p-3 rounded-xl shadow-sm">
                  <div className="flex items-center gap-3">
                    <AppAvatar name={p?.full_name ?? "Unknown User"} avatar={p?.profile_photo ?? undefined} size="md" />
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">{p?.full_name ?? "Unknown User"}</p>
                      <p className="text-xs text-slate-500">Requested to follow you</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <AppButton variant="primary" size="sm" onClick={() => handleAccept(req.follower_id)}>
                      <UserCheck className="w-4 h-4 mr-1" />
                      {isEn ? "Accept" : "قبول کریں"}
                    </AppButton>
                    <AppButton variant="outline" size="sm" onClick={() => handleReject(req.follower_id)}>
                      <X className="w-4 h-4" />
                    </AppButton>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
