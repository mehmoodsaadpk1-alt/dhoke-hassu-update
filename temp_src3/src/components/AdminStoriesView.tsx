import React, { useState, useEffect } from 'react';
import { supabase, dbRestoreStory, dbDeleteStory } from '../utils/supabaseClient';
import { Eye, RefreshCw, Trash2, Calendar, LayoutGrid } from 'lucide-react';
import { Story, StoryHighlight } from '../types';

interface AdminStoriesViewProps {
  currentLanguage: string;
}

export default function AdminStoriesView({ currentLanguage }: AdminStoriesViewProps) {
  const isEn = currentLanguage === 'en';
  const [allStories, setAllStories] = useState<Story[]>([]);
  const [highlights, setHighlights] = useState<StoryHighlight[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch all stories for moderation
      const { data: sData } = await supabase
        .from('stories')
        .select('*, author_profile:profiles!stories_userId_fkey(full_name)')
        .order('createdAt', { ascending: false });

      // Fetch all highlights
      const { data: hData } = await supabase
        .from('story_highlights')
        .select('*, user_profile:profiles!story_highlights_user_id_fkey(full_name)')
        .order('created_at', { ascending: false });

      if (sData) {
        setAllStories(sData.map((s: any) => ({
          ...s,
          author: s.author_profile?.full_name || s.author
        })));
      }
      if (hData) setHighlights(hData);
    } catch (e) {
      console.warn("Failed to fetch stories for admin", e);
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (id: string) => {
    const success = await dbRestoreStory(id);
    if (success) {
      setAllStories(prev => prev.map(s => s.id === id ? { ...s, isArchived: false } : s));
    }
  };

  const handleDeleteStory = async (id: string) => {
    if (!window.confirm("Permanently delete this story?")) return;
    const success = await dbDeleteStory(id);
    if (success) {
      setAllStories(prev => prev.filter(s => s.id !== id));
    }
  };

  const handleHideStory = async (id: string) => {
    if (!window.confirm("Hide this story from feeds?")) return;
    const { dbHideStory } = await import('../utils/supabaseClient');
    const success = await dbHideStory(id);
    if (success) {
      setAllStories(prev => prev.map(s => s.id === id ? { ...s, isArchived: true } : s));
    }
  };

  const handleFeatureStory = async (id: string) => {
    const { dbFeatureStory } = await import('../utils/supabaseClient');
    const success = await dbFeatureStory(id);
    if (success) {
      alert("Story Featured!");
    }
  };

  const handleWarnUser = (userId: string) => {
    alert("Warning sent to user: " + userId);
    // In production, this would hit dbTriggerNotification
  };

  const handleBanStory = async (id: string, userId: string) => {
    if (!window.confirm("Ban this story and issue a strike?")) return;
    const { dbHideStory } = await import('../utils/supabaseClient');
    await dbHideStory(id);
    setAllStories(prev => prev.map(s => s.id === id ? { ...s, isArchived: true } : s));
    handleWarnUser(userId);
  };

  const handleDeleteHighlight = async (id: string) => {
    if (!window.confirm("Permanently delete this highlight?")) return;
    try {
      // Deleting highlight will cascade delete items due to FK
      const { error } = await supabase.from('story_highlights').delete().eq('id', id);
      if (error) throw error;
      setHighlights(prev => prev.filter(h => h.id !== id));
      console.log("[HIGHLIGHT] Deleted", id);
    } catch(e) {
      console.error("Failed to delete highlight", e);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Loading stories...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Highlights Section */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/60 shadow-sm">
        <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
          <LayoutGrid className="w-5 h-5 text-blue-500" />
          {isEn ? 'User Highlights' : 'صارف کی نمایاں'}
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="p-3 rounded-tl-xl">{isEn ? 'Highlight' : 'نمایاں'}</th>
                <th className="p-3">{isEn ? 'User' : 'صارف'}</th>
                <th className="p-3">{isEn ? 'Created' : 'بنائی گئی'}</th>
                <th className="p-3 rounded-tr-xl text-right">{isEn ? 'Actions' : 'ایکشنز'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {highlights.length === 0 ? (
                <tr><td colSpan={4} className="p-4 text-center text-slate-500">No highlights found.</td></tr>
              ) : highlights.map(hl => (
                <tr key={hl.id} className="hover:bg-slate-50/50">
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <img src={hl.cover_image || 'https://via.placeholder.com/150'} className="w-10 h-10 rounded-full object-cover bg-slate-200" />
                      <span className="font-bold text-slate-800">{hl.title}</span>
                    </div>
                  </td>
                  <td className="p-3 font-medium text-slate-600">{(hl as any).user_profile?.full_name || 'Unknown'}</td>
                  <td className="p-3 text-slate-500">{new Date(hl.created_at).toLocaleDateString()}</td>
                  <td className="p-3 text-right">
                    <button onClick={() => handleDeleteHighlight(hl.id)} className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition" title="Delete">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stories Moderation Section */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/60 shadow-sm">
        <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-indigo-500" />
          {isEn ? 'All Stories (Moderation)' : 'تمام کہانیاں (اعتدال)'}
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {allStories.length === 0 ? (
            <p className="col-span-full text-slate-500 text-center py-4">No stories found.</p>
          ) : allStories.map(story => (
            <div key={story.id} className="group relative aspect-[9/16] bg-slate-800 rounded-xl overflow-hidden shadow-sm border-2 border-transparent hover:border-blue-500 transition-colors">
              {story.type === 'photo' || story.type === 'video' ? (
                <img src={story.image} className={`w-full h-full object-cover ${story.isArchived ? 'opacity-50 grayscale' : ''}`} />
              ) : (
                <div className={`w-full h-full p-2 text-white text-[10px] font-bold flex flex-col items-center justify-center text-center ${story.isArchived ? 'opacity-50 grayscale' : ''} ${story.bgColor || 'bg-gradient-to-br from-purple-500 to-indigo-500'}`}>
                  {story.text}
                </div>
              )}
              {story.isArchived && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="bg-black/80 text-white text-[10px] font-bold px-2 py-1 rounded">HIDDEN</span>
                </div>
              )}
              <div className="absolute top-0 inset-x-0 p-2 bg-gradient-to-b from-black/60 to-transparent flex justify-between text-white text-[9px] font-bold">
                <span>{(story as any).author}</span>
              </div>
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-2 transition-opacity">
                {!story.isArchived ? (
                  <>
                    <button onClick={() => handleHideStory(story.id)} className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded shadow-lg text-[10px] font-bold w-3/4">Hide Story</button>
                    <button onClick={() => handleFeatureStory(story.id)} className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded shadow-lg text-[10px] font-bold w-3/4">Feature</button>
                    <button onClick={() => handleBanStory(story.id, story.userId || '')} className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded shadow-lg text-[10px] font-bold w-3/4">Ban & Warn</button>
                  </>
                ) : (
                  <>
                    <button onClick={() => handleRestore(story.id)} className="p-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full shadow-lg" title="Restore to feed">
                      <RefreshCw className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDeleteStory(story.id)} className="p-2 bg-rose-500 hover:bg-rose-600 text-white rounded-full shadow-lg" title="Permanently Delete">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
              <div className="absolute bottom-0 inset-x-0 p-2 bg-gradient-to-t from-black/60 to-transparent flex justify-between text-white text-[9px]">
                <span className="flex items-center gap-1"><Eye className="w-3 h-3"/> {story.viewsCount || 0}</span>
                <span>{new Date(story.createdAt || Date.now()).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
