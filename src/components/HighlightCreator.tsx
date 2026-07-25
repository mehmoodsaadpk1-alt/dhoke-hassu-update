import React, { useState, useEffect } from 'react';
import { X, Check, Search, Image as ImageIcon } from 'lucide-react';
import { Story } from '../types';
import { dbGetArchivedStories, supabase } from '../utils/supabaseClient';

interface HighlightCreatorProps {
  user: any;
  isEn: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export default function HighlightCreator({ user, isEn, onClose, onComplete }: HighlightCreatorProps) {
  const [archivedStories, setArchivedStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStoryIds, setSelectedStoryIds] = useState<Set<string>>(new Set());
  const [title, setTitle] = useState('');
  const [step, setStep] = useState<1 | 2>(1); // 1: Select stories, 2: Details
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadArchive();
  }, [user]);

  const loadArchive = async () => {
    if (!user?.id) return;
    setLoading(true);
    const { data } = await dbGetArchivedStories(user.id);
    setArchivedStories(data || []);
    setLoading(false);
  };

  const toggleStory = (id: string) => {
    const next = new Set(selectedStoryIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedStoryIds(next);
  };

  const handleSave = async () => {
    if (!title?.trim() || selectedStoryIds.size === 0) return;
    setIsSaving(true);
    
    try {
      const selectedArr = Array.from(selectedStoryIds);
      const firstStory = archivedStories.find(s => s.id === selectedArr[0]);
      
      const { data: highlight, error: hError } = await supabase
        .from('story_highlights')
        .insert({
          user_id: user.id,
          title: title?.trim(),
          cover_image: firstStory?.image || null
        })
        .select()
        .single();
        
      if (hError) throw hError;

      const itemsToInsert = selectedArr.map((sId, idx) => ({
        highlight_id: highlight.id,
        story_id: sId,
        order_index: idx
      }));

      const { error: iError } = await supabase.from('story_highlight_items').insert(itemsToInsert);
      if (iError) throw iError;

      console.log("[HIGHLIGHT] Created", highlight.id);
      onComplete();
    } catch (e) {
      console.error("[STORY ERROR] Failed to create highlight", e);
      alert("Failed to create highlight");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-lg h-[80vh] flex flex-col overflow-hidden shadow-2xl relative">
        <div className="p-4 border-b flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-4">
            <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition"><X className="w-5 h-5 text-slate-600" /></button>
            <h2 className="text-xl font-bold text-slate-800">
              {step === 1 ? (isEn ? 'Select Stories' : 'کہانیاں منتخب کریں') : (isEn ? 'Highlight Details' : 'تفصیلات')}
            </h2>
          </div>
          {step === 1 && (
            <button 
              disabled={selectedStoryIds.size === 0}
              onClick={() => setStep(2)}
              className="px-4 py-1.5 bg-emerald-600 text-white text-sm font-bold rounded-full disabled:opacity-50"
            >
              {isEn ? 'Next' : 'اگلا'}
            </button>
          )}
          {step === 2 && (
            <button 
              disabled={!title?.trim() || isSaving}
              onClick={handleSave}
              className="px-4 py-1.5 bg-emerald-600 text-white text-sm font-bold rounded-full disabled:opacity-50 flex items-center gap-2"
            >
              {isSaving && <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              {isEn ? 'Done' : 'ہو گیا'}
            </button>
          )}
        </div>

        {step === 1 ? (
          <div className="flex-1 overflow-y-auto p-4 bg-slate-50">
            {loading ? (
              <div className="flex justify-center mt-10">
                <span className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : archivedStories.length === 0 ? (
              <div className="text-center mt-10 text-slate-500">
                {isEn ? 'No archived stories available.' : 'کوئی آرکائیو شدہ کہانی دستیاب نہیں ہے۔'}
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {archivedStories.map(story => {
                  const isSelected = selectedStoryIds.has(story.id);
                  return (
                    <div 
                      key={story.id} 
                      onClick={() => toggleStory(story.id)}
                      className={`relative aspect-[9/16] bg-slate-800 rounded-2xl overflow-hidden cursor-pointer transition-all ${isSelected ? 'ring-4 ring-emerald-500 scale-95' : 'hover:opacity-90'}`}
                    >
                      {story.type === 'photo' || story.type === 'video' ? (
                        <img src={story.image} className="w-full h-full object-cover" />
                      ) : (
                        <div className={`w-full h-full p-2 text-white text-[10px] font-bold text-center flex items-center justify-center ${story.bgColor || 'bg-gradient-to-br from-emerald-500 to-emerald-500'}`}>
                          {story.text}
                        </div>
                      )}
                      
                      {isSelected && (
                        <div className="absolute inset-0 bg-emerald-500/20 flex flex-col items-end p-2">
                          <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center text-white border-2 border-white">
                            <Check className="w-3 h-3" />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 p-6 space-y-6">
            <div className="flex flex-col items-center gap-4">
              <div className="w-24 h-24 rounded-full border-2 border-slate-200 overflow-hidden bg-slate-100 flex items-center justify-center">
                {/* Find first selected story image for cover preview */}
                {(() => {
                  const firstSelected = archivedStories.find(s => s.id === Array.from(selectedStoryIds)[0]);
                  if (firstSelected?.image) {
                    return <img src={firstSelected.image} className="w-full h-full object-cover" />;
                  }
                  return <ImageIcon className="w-8 h-8 text-slate-400" />;
                })()}
              </div>
              <p className="text-xs text-emerald-600 font-bold cursor-pointer hover:underline">{isEn ? 'Edit Cover' : 'کوَر تبدیل کریں'}</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">{isEn ? 'Highlight Name' : 'نمایاں کا نام'}</label>
              <input 
                type="text" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={isEn ? "E.g. Travel, Events..." : "نام لکھیں..."} 
                className="w-full px-4 py-3 border border-slate-300 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none text-lg font-bold"
                autoFocus
              />
            </div>
            
            <p className="text-xs text-slate-500 text-center">
              {isEn ? `${selectedStoryIds.size} stories selected` : `${selectedStoryIds.size} کہانیاں منتخب ہوئیں`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

