import React, { useState, useRef, useEffect } from 'react';
import { Camera, Image as ImageIcon, X, Type, Palette, Send, Settings, Check, Download } from 'lucide-react';
import { dbSaveStory, dbUploadStoryMedia } from '../utils/supabaseClient';
import { Story } from '../types';

interface StoryCreatorProps {
  user: any;
  isEn: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export default function StoryCreator({ user, isEn, onClose, onComplete }: StoryCreatorProps) {
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'photo' | 'video' | 'text'>('text');
  
  const [text, setText] = useState('');
  const [bgColor, setBgColor] = useState('bg-gradient-to-br from-blue-500 to-purple-600');
  const [isUploading, setIsUploading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  const [privacy, setPrivacy] = useState<'public' | 'friends' | 'only_me'>('public');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setMediaFile(file);
      
      const type = file.type.startsWith('video/') ? 'video' : 'photo';
      setMediaType(type);
      
      const url = URL.createObjectURL(file);
      setMediaPreview(url);
      console.log("[STORY] File Selected", { name: file.name, type: file.type, size: file.size });
    }
  };

  const handleCreateTextStory = () => {
    setMediaType('text');
    setMediaFile(null);
    setMediaPreview(null);
  };

  const handlePostStory = async () => {
    if (!user?.id) return;
    
    setIsUploading(true);
    console.log("[STORY] Upload Started", { mediaType, textLength: text.length });

    try {
      let mediaUrls: string[] = [];
      let finalUrl = '';
      
      if (mediaFile) {
        console.log("[STORY] Upload Progress", "Uploading media to Supabase...");
        const uploadedUrl = await dbUploadStoryMedia(mediaFile);
        if (!uploadedUrl) {
          throw new Error("Storage upload failed, returned null URL.");
        }
        finalUrl = uploadedUrl;
        mediaUrls = [finalUrl];
        console.log("[STORY] Upload Success", "Media uploaded to storage:", finalUrl);
      }

      const newStory: Story = {
        id: crypto.randomUUID(),
        userId: user.id,
        author: user.user_metadata?.full_name || 'User',
        avatar: user.user_metadata?.avatar_url || '',
        time: new Date().toLocaleTimeString(),
        viewed: false,
        type: mediaType,
        text: text,
        bgColor: mediaType === 'text' ? bgColor : undefined,
        image: mediaType === 'photo' ? finalUrl : undefined,
        mediaUrls: mediaUrls.length > 0 ? mediaUrls : undefined,
        privacy: privacy,
        createdAt: Date.now(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        isArchived: false,
      };

      const success = await dbSaveStory(newStory);
      if (success) {
        console.log("[STORY] Database Insert Success", newStory.id);
        onComplete();
      } else {
        throw new Error("dbSaveStory returned false. Database insert failed.");
      }
    } catch (err: any) {
      console.error("[STORY] Upload Failed", {
        message: err.message,
        details: err.details,
        hint: err.hint,
        code: err.code
      });
      alert(isEn ? `Upload failed: ${err.message}` : `اپ لوڈ ناکام ہو گیا: ${err.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col md:flex-row animate-fade-in">
      {/* Sidebar Controls */}
      <div className="w-full md:w-80 bg-gray-900 text-white flex flex-col h-[40vh] md:h-full border-r border-gray-800 p-4">
        <div className="flex items-center justify-between mb-6">
          <button onClick={onClose} className="p-2 bg-gray-800 rounded-full hover:bg-gray-700 transition">
            <X className="w-5 h-5" />
          </button>
          <h2 className="text-lg font-semibold">{isEn ? 'Create Story' : 'سٹوری بنائیں'}</h2>
          <button onClick={() => setShowSettings(!showSettings)} className="p-2 bg-gray-800 rounded-full hover:bg-gray-700 transition">
            <Settings className="w-5 h-5" />
          </button>
        </div>

        {showSettings ? (
          <div className="flex-1 space-y-4">
            <h3 className="font-medium text-gray-400 uppercase text-xs">Story Privacy</h3>
            <div className="space-y-2">
              {['public', 'friends', 'only_me'].map((opt) => (
                <button
                  key={opt}
                  onClick={() => setPrivacy(opt as any)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl border ${privacy === opt ? 'border-blue-500 bg-blue-500/10 text-blue-400' : 'border-gray-700 bg-gray-800 text-gray-300'}`}
                >
                  <span className="capitalize">{opt.replace('_', ' ')}</span>
                  {privacy === opt && <Check className="w-4 h-4" />}
                </button>
              ))}
            </div>
            <button onClick={() => setShowSettings(false)} className="mt-4 w-full py-2 bg-gray-800 rounded-lg">Done</button>
          </div>
        ) : (
          <div className="flex-1 flex flex-col gap-4">
            <div className="flex gap-2">
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 flex flex-col items-center justify-center p-4 bg-gray-800 rounded-2xl hover:bg-gray-700 transition"
              >
                <div className="w-12 h-12 bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center mb-2">
                  <ImageIcon className="w-6 h-6" />
                </div>
                <span className="text-sm font-medium">Photo / Video</span>
              </button>
              <button 
                onClick={handleCreateTextStory}
                className="flex-1 flex flex-col items-center justify-center p-4 bg-gray-800 rounded-2xl hover:bg-gray-700 transition"
              >
                <div className="w-12 h-12 bg-purple-500/20 text-purple-400 rounded-full flex items-center justify-center mb-2">
                  <Type className="w-6 h-6" />
                </div>
                <span className="text-sm font-medium">Text</span>
              </button>
            </div>

            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept="image/*,video/*"
              className="hidden" 
            />

            {mediaType === 'text' && (
              <div className="mt-4">
                <label className="text-sm text-gray-400 mb-2 block">Background Color</label>
                <div className="flex flex-wrap gap-2">
                  {[
                    'bg-gradient-to-br from-blue-500 to-purple-600',
                    'bg-gradient-to-br from-pink-500 to-rose-500',
                    'bg-gradient-to-br from-orange-400 to-red-500',
                    'bg-gradient-to-br from-emerald-400 to-cyan-500',
                    'bg-gray-900'
                  ].map((bg, idx) => (
                    <button
                      key={idx}
                      onClick={() => setBgColor(bg)}
                      className={`w-10 h-10 rounded-full ${bg} ${bgColor === bg ? 'ring-2 ring-white ring-offset-2 ring-offset-gray-900' : ''}`}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <button 
          onClick={handlePostStory}
          disabled={isUploading || (mediaType === 'text' && !text.trim()) || (mediaType !== 'text' && !mediaFile)}
          className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold flex items-center justify-center gap-2 mt-4"
        >
          {isUploading ? (
            <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <Send className="w-5 h-5" />
              {isEn ? 'Share to Story' : 'سٹوری شیئر کریں'}
            </>
          )}
        </button>
      </div>

      {/* Editor Preview Area */}
      <div className="flex-1 flex items-center justify-center bg-gray-950 p-4 h-[60vh] md:h-full relative overflow-hidden">
        <div className={`relative w-full max-w-md aspect-[9/16] rounded-2xl overflow-hidden shadow-2xl flex items-center justify-center ${mediaType === 'text' ? bgColor : 'bg-black'}`}>
          {mediaType === 'text' && (
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={isEn ? "Start typing..." : "کچھ لکھیں..."}
              className="w-full h-full bg-transparent text-white text-center text-3xl font-bold p-8 resize-none focus:outline-none placeholder-white/50"
            />
          )}

          {mediaType === 'photo' && mediaPreview && (
            <img src={mediaPreview} alt="Preview" className="w-full h-full object-contain" />
          )}

          {mediaType === 'video' && mediaPreview && (
            <video ref={videoRef} src={mediaPreview} controls className="w-full h-full object-contain" />
          )}

          {!mediaPreview && mediaType !== 'text' && (
            <div className="text-gray-500 flex flex-col items-center">
              <ImageIcon className="w-16 h-16 mb-4 opacity-50" />
              <p>Select media to preview</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
