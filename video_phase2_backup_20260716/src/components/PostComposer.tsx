import React, { useState, useRef } from 'react';
import { Camera, Image as ImageIcon, Smile, X, Send } from 'lucide-react';
import { dbUploadPostImage, dbSavePost } from '../utils/supabaseClient';
import type { Post } from '../types';
import MentionTextarea from './MentionTextarea';

const COMMON_EMOJIS = ['😀','😂','🥰','😍','😎','🤔','😭','🔥','❤️','👍','🎉','✨','🙏','💪','😊','🤩','😏','🥳','💯','🎊','🌟','💫','🤣','😅','😢','💀','😴','🤗','😌','🫶'];

function EmojiPicker({ onEmojiSelect }: { onEmojiSelect: (emoji: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1 p-2 max-w-[200px]">
      {COMMON_EMOJIS.map((e) => (
        <button
          key={e}
          type="button"
          onClick={() => onEmojiSelect(e)}
          className="text-lg hover:scale-125 transition-transform cursor-pointer"
        >
          {e}
        </button>
      ))}
    </div>
  );
}

interface PostComposerProps {
  groupId?: string;
  pageId?: string;
  onPostCreated: (post: Post) => void;
  areaId?: string;
  locationName?: string;
  latitude?: number;
  longitude?: number;
  /** The current user object passed from the parent */
  currentUser?: {
    id?: string;
    fullName?: string;
    full_name?: string;
    profilePhoto?: string;
    profile_image_url?: string;
    area?: string;
  };
  /** 'en' | 'ur' */
  currentLanguage?: 'en' | 'ur';
}

export default function PostComposer({
  groupId,
  pageId,
  onPostCreated,
  areaId,
  locationName,
  latitude,
  longitude,
  currentUser,
  currentLanguage = 'en',
}: PostComposerProps) {
  const isEn = currentLanguage === 'en';

  // Resolve user fields gracefully for both User shape variants
  const userId = currentUser?.id;
  const userName = currentUser?.fullName || currentUser?.full_name || (isEn ? 'Neighbor' : 'پڑوسی');
  const userAvatar =
    currentUser?.profilePhoto ||
    currentUser?.profile_image_url ||
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=120';
  const userArea = currentUser?.area;

  const [newPostText, setNewPostText] = useState('');
  const [composerAttachedPhotos, setComposerAttachedPhotos] = useState<string[]>([]);
  const [composerCamActive, setComposerCamActive] = useState(false);
  const [showEmojiTray, setShowEmojiTray] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const composerVideoRef = useRef<HTMLVideoElement>(null);
  const composerFileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleEmojiSelect = (emoji: string) => {
    if (textareaRef.current) {
      const textarea = textareaRef.current;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = newPostText;
      const newText = text?.substring(0, start) + emoji + text?.substring(end);
      setNewPostText(newText);
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + emoji.length;
        textarea.focus();
      }, 0);
    } else {
      setNewPostText(prev => prev + emoji);
    }
  };

  const t = {
    postRequired: isEn ? 'Please enter some text or attach a photo.' : 'کچھ لکھیں یا تصویر شامل کریں۔',
    postSuccess: isEn ? 'Post created successfully!' : 'پوسٹ کامیابی سے بنائی گئی!',
  };

  const startComposerCam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      if (composerVideoRef.current) {
        composerVideoRef.current.srcObject = stream;
      }
      setComposerCamActive(true);
      setShowEmojiTray(false);
    } catch (err) {
      console.error('Camera access denied', err);
      alert(isEn ? 'Camera access denied' : 'کیمرہ تک رسائی سے انکار کیا گیا');
    }
  };

  const stopComposerCam = () => {
    if (composerVideoRef.current && composerVideoRef.current.srcObject) {
      const tracks = (composerVideoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
      composerVideoRef.current.srcObject = null;
    }
    setComposerCamActive(false);
  };

  const captureComposerPhoto = () => {
    if (composerVideoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = composerVideoRef.current.videoWidth;
      canvas.height = composerVideoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(composerVideoRef.current, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        setComposerAttachedPhotos(prev => [...prev, dataUrl]);
        stopComposerCam();
      }
    }
  };

  const handleCreatePost = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newPostText?.trim() && composerAttachedPhotos.length === 0) {
      alert(t.postRequired);
      return;
    }

    setIsSubmitting(true);
    try {
      let imageUrl = '';
      if (composerAttachedPhotos.length > 0) {
        if (composerAttachedPhotos[0].startsWith('data:image')) {
          const res = await fetch(composerAttachedPhotos[0]);
          const blob = await res.blob();
          const file = new File([blob], `post-${Date.now()}.jpg`, { type: 'image/jpeg' });
          imageUrl = (await dbUploadPostImage(file)) || '';
        } else {
          imageUrl = composerAttachedPhotos[0];
        }
      }

      const postContent = newPostText?.trim();
      const newPostPayload: any = {
        id: `p-new-${Date.now()}`,
        content: postContent,
        image: imageUrl || undefined,
        likes: 0,
        commentsCount: 0,
        comments: [],
        userId,
        areaId: areaId || undefined,
        groupId: groupId || undefined,
        pageId: pageId || undefined,
      };

      const success = await dbSavePost(newPostPayload);
      if (success !== false) {
        const localNewPost: Post = {
          id: newPostPayload.id,
          author: userName,
          avatar: userAvatar,
          area: locationName || userArea || 'Community',
          content: postContent,
          image: imageUrl || undefined,
          likes: 0,
          commentsCount: 0,
          comments: [],
          time: 'Just now',
          userId,
          areaId: areaId || undefined,
          locationName: locationName || undefined,
          latitude: latitude || undefined,
          longitude: longitude || undefined,
          groupId: groupId || undefined,
          pageId: pageId || undefined,
        };

        onPostCreated(localNewPost);
        setNewPostText('');
        setComposerAttachedPhotos([]);
        setShowEmojiTray(false);
        stopComposerCam();
      } else {
        alert(isEn ? 'Failed to create post. Please try again.' : 'پوسٹ بنانے میں ناکامی۔ دوبارہ کوشش کریں۔');
      }
    } catch (err) {
      console.error('Error creating post:', err);
      alert(isEn ? 'Error creating post' : 'پوسٹ بناتے وقت خرابی');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/60 p-4 mb-6 shadow-sm space-y-4" id="facebook-post-composer">
      <div className="flex gap-3">
        <img
          src={userAvatar}
          alt={userName}
          className="w-10 h-10 rounded-full object-cover border border-slate-100 shrink-0"
        />
        <div className="flex-1 space-y-3 relative">
          <MentionTextarea
            value={newPostText}
            onChange={(val) => setNewPostText(val)}
            placeholder={isEn ? 'What are you feeling today?' : 'آپ کیا سوچ رہے ہیں؟'}
            className="w-full bg-slate-50 hover:bg-slate-100/70 focus:bg-white focus:ring-2 focus:ring-blue-100 border-0 rounded-2xl py-2.5 px-4 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none transition-all resize-none min-h-[60px]"
            rows={2}
          />

          {composerAttachedPhotos.length > 0 && (
            <div className="grid grid-cols-3 gap-2 pt-1">
              {composerAttachedPhotos.map((photo, pIdx) => (
                <div key={pIdx} className="relative aspect-video rounded-xl overflow-hidden border border-slate-200 bg-slate-100 group">
                  <img src={photo} alt="Attachment" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setComposerAttachedPhotos(prev => prev.filter((_, i) => i !== pIdx))}
                    className="absolute top-1.5 right-1.5 p-1 bg-black/60 hover:bg-black/80 text-white rounded-full transition-all cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {composerCamActive && (
            <div className="relative aspect-video w-full max-w-sm rounded-2xl overflow-hidden bg-black border border-slate-200 mx-auto">
              <video
                ref={composerVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover scale-x-[-1]"
              />
              <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2">
                <button
                  type="button"
                  onClick={captureComposerPhoto}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold py-1.5 px-3.5 rounded-full shadow-lg flex items-center gap-1 transition-all cursor-pointer"
                >
                  <Camera className="w-3.5 h-3.5" /> {isEn ? 'Capture' : 'تصویر لیں'}
                </button>
                <button
                  type="button"
                  onClick={stopComposerCam}
                  className="bg-slate-800 hover:bg-slate-900 text-white text-[11px] font-bold py-1.5 px-3.5 rounded-full shadow-lg transition-all cursor-pointer"
                >
                  {isEn ? 'Cancel' : 'منسوخ کریں'}
                </button>
              </div>
            </div>
          )}

          {showEmojiTray && (
            <div className="bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden z-10 animate-fade-in-up origin-top absolute mt-2">
              <EmojiPicker onEmojiSelect={handleEmojiSelect} />
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <div className="flex gap-2 sm:gap-4">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                ref={composerFileInputRef}
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                      if (ev.target?.result) {
                        setComposerAttachedPhotos(prev => [...prev, ev.target!.result as string]);
                      }
                    };
                    reader.readAsDataURL(e.target.files[0]);
                  }
                }}
              />
              <label
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-slate-50 transition-all cursor-pointer text-slate-500"
                onClick={() => composerFileInputRef.current?.click()}
              >
                <ImageIcon className="w-4 h-4 text-emerald-500" />
                <span className="text-[11px] font-bold text-slate-600 hidden sm:inline">
                  {isEn ? 'Photo' : 'تصویر'}
                </span>
              </label>

              <button
                type="button"
                onClick={() => {
                  if (composerCamActive) stopComposerCam();
                  else startComposerCam();
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer ${composerCamActive ? 'bg-red-50 text-red-600' : 'hover:bg-slate-50 text-slate-500'}`}
              >
                <Camera className="w-4 h-4 text-blue-500" />
                <span className="text-[11px] font-bold text-slate-600 hidden sm:inline">
                  {isEn ? 'Camera' : 'کیمرہ'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setShowEmojiTray(!showEmojiTray)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer ${showEmojiTray ? 'bg-amber-50 text-amber-600' : 'hover:bg-slate-50 text-slate-500'}`}
              >
                <Smile className="w-4 h-4 text-amber-500" />
                <span className="text-[11px] font-bold text-slate-600 hidden sm:inline">
                  {isEn ? 'Emoji' : 'ایموجی'}
                </span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleCreatePost}
              disabled={(!newPostText?.trim() && composerAttachedPhotos.length === 0) || isSubmitting}
              className="px-4 py-1.5 bg-[#2563eb] hover:bg-blue-600 text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {isEn ? 'Posting...' : 'پوسٹ ہو رہا ہے...'}
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  {isEn ? 'Post' : 'پوسٹ کریں'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
