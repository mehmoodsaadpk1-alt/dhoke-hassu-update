import React, { useState, useRef, useEffect } from 'react';
import { Camera, Image as ImageIcon, X, Type, Palette, Send, Settings, Check, Download } from 'lucide-react';
import { dbSaveStory, dbUploadStoryMedia, supabase } from '../utils/supabaseClient';
import { Story } from '../types';

interface StoryCreatorProps {
  user: any;
  isEn: boolean;
  onClose: () => void;
  onComplete: (story?: any) => void;
}

export default function StoryCreator({ user, isEn, onClose, onComplete }: StoryCreatorProps) {
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'photo' | 'video' | 'text'>('text');
  
  const [text, setText] = useState('');
  const [bgColor, setBgColor] = useState('bg-gradient-to-br from-emerald-500 to-emerald-600');
  const [textColor, setTextColor] = useState('text-white');
  const [fontFamily, setFontFamily] = useState('font-sans');
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
    console.log("[STORY] Validation Passed", { mediaType, textLength: text.length });
    setIsUploading(true);
    console.log("[STORY] Upload Started");

    try {
      setIsUploading(true);
      let validUserId = user?.id || crypto.randomUUID();
      // Force UUID for userId if Supabase is active
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser?.id) {
        validUserId = authUser.id;
      } else if (!/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(validUserId)) {
        validUserId = crypto.randomUUID(); // Fallback to a valid UUID if user.id was a display name
      }

      let mediaUrls: string[] = [];
      let finalUrl = '';
      
      if ((mediaType === 'photo' || mediaType === 'video') && mediaFile) {
        console.log("[STORY] Upload Started", mediaFile.name);
        const uploadedUrl = await dbUploadStoryMedia(mediaFile);
        if (!uploadedUrl) {
          throw new Error("Failed to upload image to storage.");
        }
        console.log("[STORY] Upload Success", "Media uploaded to storage:", uploadedUrl);
        
        finalUrl = uploadedUrl;
        mediaUrls = [finalUrl];
        console.log("[STORY] Public URL Generated", finalUrl);
      }

      const newStory: Story = {
        id: crypto.randomUUID(),
        userId: validUserId,
        author: user?.fullName || user?.user_metadata?.full_name || 'User',
        avatar: user?.profilePhoto || user?.avatar || user?.user_metadata?.avatar_url || '',
        time: new Date().toLocaleTimeString(),
        viewed: false,
        type: mediaType,
        text: text,
        bgColor: mediaType === 'text' ? bgColor : undefined,
        textStyles: mediaType === 'text' ? { color: textColor, font: fontFamily } : undefined,
        image: finalUrl || undefined,
        mediaUrls: mediaUrls.length > 0 ? mediaUrls : undefined,
        privacy: privacy,
        createdAt: Date.now(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        isArchived: false,
      };

      console.log("[STORY] Database Insert Started", newStory);
      const success = await dbSaveStory(newStory);
      if (success) {
        console.log("[STORY] Database Insert Success", newStory.id);
        onComplete(newStory);
      } else {
        throw new Error("dbSaveStory returned false. Database insert failed.");
      }
    } catch (err: any) {
      console.error("[STORY] Upload Failed", {
        message: err.message,
        details: err.details,
        hint: err.hint,
        code: err.code,
        stack: err.stack
      });
      alert(isEn ? `Upload failed: ${err.message}` : `سٹوری اپلوڈ ناکام: ${err.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col md:flex-row animate-fade-in">
      {/* Sidebar Controls */}
      <div className="w-full md:w-80 bg-gray-900 text-white flex flex-col h-[40vh] md:h-full border-e border-gray-800 p-4">
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
                  className={`w-full flex items-center justify-between p-3 rounded-2xl border ${privacy === opt ? 'border-emerald-500 bg-emerald-500/10 text-blue-400' : 'border-gray-700 bg-gray-800 text-gray-300'}`}
                >
                  <span className="capitalize">{opt.replace('_', ' ')}</span>
                  {privacy === opt && <Check className="w-4 h-4" />}
                </button>
              ))}
            </div>
            <button onClick={() => setShowSettings(false)} className="mt-4 w-full py-2 bg-gray-800 rounded-xl">Done</button>
          </div>
        ) : (
          <div className="flex-1 flex flex-col gap-4">
            <div className="flex gap-2">
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 flex flex-col items-center justify-center p-4 bg-gray-800 rounded-2xl hover:bg-gray-700 transition"
              >
                <div className="w-12 h-12 bg-emerald-500/20 text-blue-400 rounded-full flex items-center justify-center mb-2">
                  <ImageIcon className="w-6 h-6" />
                </div>
                <span className="text-sm font-medium">Photo / Video</span>
              </button>
              <button 
                onClick={handleCreateTextStory}
                className="flex-1 flex flex-col items-center justify-center p-4 bg-gray-800 rounded-2xl hover:bg-gray-700 transition"
              >
                <div className="w-12 h-12 bg-emerald-500/20 text-purple-400 rounded-full flex items-center justify-center mb-2">
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
              <div className="mt-4 space-y-4">
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Background Color</label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      'bg-gradient-to-br from-emerald-500 to-emerald-600',
                      'bg-gradient-to-br from-emerald-500 to-rose-500',
                      'bg-gradient-to-br from-orange-400 to-red-500',
                      'bg-gradient-to-br from-emerald-400 to-emerald-500',
                      'bg-gray-900'
                    ].map((bg, idx) => (
                      <button
                        key={bg}
                        onClick={() => setBgColor(bg)}
                        className={`w-10 h-10 rounded-full ${bg} ${bgColor === bg ? 'ring-2 ring-white ring-offset-2 ring-offset-gray-900' : ''}`}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Text Color</label>
                  <div className="flex flex-wrap gap-2">
                    {['text-white', 'text-black', 'text-yellow-400', 'text-emerald-500', 'text-emerald-400'].map(tc => (
                      <button 
                        key={tc} 
                        onClick={() => setTextColor(tc)} 
                        className={`w-8 h-8 rounded-full border border-gray-600 bg-gray-800 flex items-center justify-center ${textColor === tc ? 'ring-2 ring-emerald-500' : ''}`}
                      >
                        <span className={`text-xs font-bold ${tc}`}>A</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Font Style</label>
                  <div className="flex flex-wrap gap-2">
                    {['font-sans', 'font-serif', 'font-mono'].map(ff => (
                      <button 
                        key={ff} 
                        onClick={() => setFontFamily(ff)} 
                        className={`px-3 py-1 rounded-full border border-gray-600 bg-gray-800 text-sm ${ff} ${fontFamily === ff ? 'ring-2 ring-emerald-500 text-white' : 'text-gray-300'}`}
                      >
                        Aa
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <button 
          onClick={() => {
            console.log("[STORY] Share Clicked");
            handlePostStory();
          }}
          disabled={isUploading || (mediaType === 'text' && text?.trim().length === 0) || (mediaType !== 'text' && !mediaFile)}
          className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-2xl font-bold flex items-center justify-center gap-2 mt-4"
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
              onChange={(e) => {
                setText(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = e.target.scrollHeight + 'px';
              }}
              rows={1}
              placeholder={isEn ? "Start typing..." : "کچھ لکھیں..."}
              className={`w-full max-w-[90%] bg-transparent text-center text-3xl font-bold p-4 resize-none focus:outline-none placeholder-white/50 overflow-hidden outline-none ${textColor} ${fontFamily}`}
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

