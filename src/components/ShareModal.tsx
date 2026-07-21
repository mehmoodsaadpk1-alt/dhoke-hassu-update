import React, { useState } from 'react';
import { X, Globe, Users, Lock, Link, PlusCircle, Send, CheckCircle } from 'lucide-react';
import ClickableAvatar from './ClickableAvatar';
import { dbCreateSharePost, dbCreateShareStory } from '../utils/supabaseClient';

export type ShareEntityType = 'post' | 'job' | 'property' | 'event' | 'marketplace' | 'service' | 'poll' | 'alert';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: any;
  entityType: ShareEntityType;
  entityId: string;
  entityPreview?: React.ReactNode;
  currentLanguage?: 'en' | 'ur';
  onShareComplete?: () => void;
}

export default function ShareModal({
  isOpen,
  onClose,
  currentUser,
  entityType,
  entityId,
  entityPreview,
  currentLanguage = 'en',
  onShareComplete
}: ShareModalProps) {
  const isEn = currentLanguage === 'en';
  const [caption, setCaption] = useState('');
  const [privacy, setPrivacy] = useState<'public' | 'friends' | 'only_me'>('public');
  const [isSharing, setIsSharing] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => {
      setToast(null);
      if (msg !== (isEn ? 'Link copied successfully.' : 'لنک کاپی ہو گیا۔')) {
        onClose();
        if (onShareComplete) onShareComplete();
      }
    }, 2000);
  };

  const getEntityUrl = () => {
    const origin = window.location.origin;
    switch (entityType) {
      case 'post': return `${origin}/community/post/${entityId}`;
      case 'job': return `${origin}/jobs/detail?id=${entityId}`;
      case 'property': return `${origin}/property/detail?id=${entityId}`;
      case 'event': return `${origin}/events/detail?id=${entityId}`;
      case 'marketplace': return `${origin}/marketplace/detail?id=${entityId}`;
      case 'service': return `${origin}/services/detail?id=${entityId}`;
      case 'poll': return `${origin}/community/poll/${entityId}`;
      case 'alert': return `${origin}/alerts/detail?id=${entityId}`;
      default: return `${origin}/community/post/${entityId}`;
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(getEntityUrl());
    showToast(isEn ? 'Link copied successfully.' : 'لنک کاپی ہو گیا۔');
  };

  const handleShareToCommunity = async () => {
    if (!currentUser) return;
    setIsSharing(true);
    try {
      await dbCreateSharePost({
        userId: currentUser.id || currentUser.user_id,
        entityType,
        entityId,
        caption,
        privacy
      });
      showToast(isEn ? 'Shared to Community Feed.' : 'کمیونٹی فیڈ پر شیئر ہو گیا۔');
    } catch (e) {
      console.error(e);
      alert(isEn ? 'Failed to share. Please try again.' : 'شیئر کرنے میں مسئلہ۔ دوبارہ کوشش کریں۔');
    } finally {
      setIsSharing(false);
    }
  };

  const handleShareToStory = async () => {
    if (!currentUser) return;
    setIsSharing(true);
    try {
      await dbCreateShareStory({
        userId: currentUser.id || currentUser.user_id,
        entityType,
        entityId,
        caption,
        author: currentUser.full_name || currentUser.username || 'User',
        avatar: currentUser.profile_photo || currentUser.avatar || ''
      });
      showToast(isEn ? 'Shared to your Story.' : 'آپ کی سٹوری پر شیئر ہو گیا۔');
    } catch (e) {
      console.error(e);
      alert(isEn ? 'Failed to share to story.' : 'سٹوری پر شیئر کرنے میں مسئلہ۔');
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/50">
          <h2 className="text-lg font-black text-slate-800 tracking-tight">
            {isEn ? 'Share' : 'شیئر کریں'}
          </h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-200 text-slate-500 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto">
          {/* User & Privacy */}
          <div className="flex items-start gap-3 mb-4">
            <ClickableAvatar 
              userId={currentUser?.id} 
              name={currentUser?.full_name || 'User'} 
              avatar={currentUser?.profile_photo} 
              size={48} 
              className="shrink-0 ring-2 ring-white shadow-sm"
            />
            <div>
              <h3 className="font-bold text-slate-900 text-[15px]">{currentUser?.full_name || 'User'}</h3>
              <div className="mt-1 flex items-center gap-2">
                <select 
                  value={privacy}
                  onChange={(e) => setPrivacy(e.target.value as any)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-2 py-1.5 rounded-lg border-0 outline-none cursor-pointer flex items-center appearance-none"
                >
                  <option value="public">🌐 {isEn ? 'Public' : 'عوام'}</option>
                  <option value="friends">👥 {isEn ? 'Friends' : 'دوست'}</option>
                  <option value="only_me">🔒 {isEn ? 'Only me' : 'صرف میں'}</option>
                </select>
              </div>
            </div>
          </div>

          {/* Caption Input */}
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder={isEn ? 'Say something about this...' : 'اس کے بارے میں کچھ کہیں...'}
            className="w-full text-lg border-0 focus:ring-0 resize-none placeholder:text-slate-400 bg-transparent mb-4 outline-none"
            rows={3}
            autoFocus
          />

          {/* Entity Preview */}
          {entityPreview && (
            <div className="border border-slate-200 rounded-xl overflow-hidden mb-6 bg-slate-50 pointer-events-none select-none opacity-90 scale-[0.98] origin-top max-h-[300px]">
              <div className="scale-[0.8] origin-top-left w-[125%] h-[125%]">
                {entityPreview}
              </div>
            </div>
          )}

          {/* Share Options List */}
          <div className="space-y-2 mt-4">
            <button 
              onClick={handleShareToCommunity}
              disabled={isSharing}
              className="w-full flex items-center justify-between p-4 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl transition-colors cursor-pointer border border-blue-100 disabled:opacity-50"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-sm">
                  <Send className="w-5 h-5 ms-0.5" />
                </div>
                <div className="text-start">
                  <h4 className="font-bold text-sm">{isEn ? 'Share Now' : 'ابھی شیئر کریں'}</h4>
                  <p className="text-xs text-blue-600/80 font-medium">{isEn ? 'Post to Community Feed' : 'کمیونٹی فیڈ پر پوسٹ کریں'}</p>
                </div>
              </div>
            </button>

            <button 
              onClick={handleShareToStory}
              disabled={isSharing}
              className="w-full flex items-center justify-between p-4 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-xl transition-colors cursor-pointer border border-purple-100 disabled:opacity-50"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-600 text-white rounded-full flex items-center justify-center shadow-sm">
                  <PlusCircle className="w-5 h-5" />
                </div>
                <div className="text-start">
                  <h4 className="font-bold text-sm">{isEn ? 'Share to Story' : 'سٹوری پر شیئر کریں'}</h4>
                  <p className="text-xs text-purple-600/80 font-medium">{isEn ? 'Add to your daily story' : 'اپنی روزمرہ سٹوری میں شامل کریں'}</p>
                </div>
              </div>
            </button>

            <button 
              onClick={handleCopyLink}
              className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl transition-colors cursor-pointer border border-slate-200"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-200 text-slate-600 rounded-full flex items-center justify-center shadow-sm">
                  <Link className="w-5 h-5" />
                </div>
                <div className="text-start">
                  <h4 className="font-bold text-sm">{isEn ? 'Copy Link' : 'لنک کاپی کریں'}</h4>
                  <p className="text-xs text-slate-500 font-medium">{isEn ? 'Copy link to clipboard' : 'لنک کلپ بورڈ میں کاپی کریں'}</p>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Toast Alert Notification */}
      {toast && (
        <div className="fixed bottom-6 start-1/2 -translate-x-1/2 z-[110] bg-slate-900 text-white px-6 py-3.5 rounded-full shadow-2xl flex items-center gap-2 border border-slate-800 text-sm font-bold animate-in slide-in-from-bottom-5">
          <CheckCircle className="w-4 h-4 text-emerald-500" />
          <span>{toast}</span>
        </div>
      )}
    </div>
  );
}
