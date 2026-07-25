import React, { useState, useEffect } from 'react';
import { Plus, ChevronRight } from 'lucide-react';
import { StoryHighlight, Story } from '../types';
import { supabase } from '../utils/supabaseClient';
import StoryViewer from './StoryViewer';

interface HighlightsBarProps {
  userId: string;
  isSelf: boolean;
  isEn: boolean;
  onCreateNew?: () => void;
}

export default function HighlightsBar({ userId, isSelf, isEn, onCreateNew }: HighlightsBarProps) {
  const [highlights, setHighlights] = useState<StoryHighlight[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewingHighlightIdx, setViewingHighlightIdx] = useState<number | null>(null);

  useEffect(() => {
    loadHighlights();
  }, [userId]);

  const loadHighlights = async () => {
    if (!userId) return;
    try {
      const { data, error } = await supabase
        .from('story_highlights')
        .select(`
          *,
          story_highlight_items (
            story_id,
            stories (*)
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const formatted = (data || []).map(h => ({
        id: h.id,
        user_id: h.user_id,
        title: h.title,
        cover_image: h.cover_image,
        created_at: h.created_at,
        stories: h.story_highlight_items.map((i: any) => ({
          ...i.stories,
          id: i.stories.id,
          author: i.stories.author || 'User',
          avatar: i.stories.avatar || '',
          type: i.stories.media_type || i.stories.type,
          image: i.stories.image,
          text: i.stories.text,
          bgColor: i.stories.bgColor,
          createdAt: i.stories.createdAt,
          userId: i.stories.userId
        }))
      }));
      
      setHighlights(formatted);
    } catch (e) {
      console.warn("Failed to load highlights", e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="animate-pulse h-24 bg-slate-100 rounded-2xl mx-4" />;
  if (!isSelf && highlights.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-4 overflow-hidden">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-slate-800 text-sm">{isEn ? 'Highlights' : 'نمایاں'}</h3>
      </div>
      
      <div className="flex items-start gap-4 overflow-x-auto no-scrollbar pb-2">
        {isSelf && (
          <div className="flex flex-col items-center gap-2 shrink-0">
            <button 
              onClick={onCreateNew}
              className="w-16 h-16 rounded-full border-2 border-dashed border-slate-300 hover:border-emerald-500 hover:bg-emerald-50 flex items-center justify-center transition"
            >
              <Plus className="w-6 h-6 text-slate-400" />
            </button>
            <span className="text-[10px] font-bold text-slate-600">{isEn ? 'New' : 'نیا'}</span>
          </div>
        )}

        {highlights.map((hl, idx) => (
          <div key={hl.id} className="flex flex-col items-center gap-2 shrink-0 cursor-pointer group">
            <div 
              className="w-16 h-16 rounded-full border-2 border-slate-200 p-0.5 group-hover:border-slate-400 transition"
              onClick={() => {
                if (hl.stories && hl.stories.length > 0) {
                  setViewingHighlightIdx(idx);
                  console.log("[HIGHLIGHT] Viewed", hl.id);
                } else {
                  alert("Highlight is empty.");
                }
              }}
            >
              <img 
                src={hl.cover_image || hl.stories?.[0]?.image || 'https://via.placeholder.com/150'} 
                alt={hl.title} 
                className="w-full h-full rounded-full object-cover bg-slate-100" 
              />
            </div>
            <span className="text-[10px] font-bold text-slate-800 max-w-[64px] truncate">{hl.title}</span>
          </div>
        ))}
      </div>

      {viewingHighlightIdx !== null && highlights[viewingHighlightIdx]?.stories && (
        <StoryViewer
          stories={highlights[viewingHighlightIdx].stories!}
          initialIdx={0}
          onClose={() => setViewingHighlightIdx(null)}
          viewerId={userId}
        />
      )}
    </div>
  );
}

