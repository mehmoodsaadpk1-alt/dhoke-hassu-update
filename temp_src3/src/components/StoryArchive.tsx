import React, { useState, useEffect } from 'react';
import { X, Calendar, Search, RefreshCw, Trash2, Eye } from 'lucide-react';
import { Story } from '../types';
import { dbGetArchivedStories, dbRestoreStory, dbDeleteStory } from '../utils/supabaseClient';
import StoryViewer from './StoryViewer';

interface StoryArchiveProps {
  user: any;
  isEn: boolean;
  onClose: () => void;
}

export default function StoryArchive({ user, isEn, onClose }: StoryArchiveProps) {
  const [archivedStories, setArchivedStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [viewingStoryIdx, setViewingStoryIdx] = useState<number | null>(null);

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

  const handleRestore = async (storyId: string) => {
    const success = await dbRestoreStory(storyId);
    if (success) {
      setArchivedStories(prev => prev.filter(s => s.id !== storyId));
    }
  };

  const handleDelete = async (storyId: string) => {
    if (!window.confirm(isEn ? 'Permanently delete this story?' : 'کیا آپ اس کہانی کو مستقل طور پر حذف کرنا چاہتے ہیں؟')) return;
    const success = await dbDeleteStory(storyId);
    if (success) {
      setArchivedStories(prev => prev.filter(s => s.id !== storyId));
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    console.log("[STORY ARCHIVE] Archive Search");
  };

  const filteredStories = archivedStories.filter(story => {
    const matchSearch = (story.text || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchDate = filterMonth ? new Date(story.createdAt).toISOString().startsWith(filterMonth) : true;
    return matchSearch && matchDate;
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden shadow-2xl relative">
        <div className="p-4 border-b flex items-center justify-between bg-slate-50">
          <h2 className="text-xl font-bold text-slate-800">{isEn ? 'Story Archive' : 'اسٹوری آرکائیو'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition"><X className="w-5 h-5 text-slate-600" /></button>
        </div>

        <div className="p-4 border-b flex flex-col sm:flex-row gap-4 bg-white">
          <div className="relative flex-1">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder={isEn ? "Search archive..." : "تلاش کریں..."} 
              className="w-full pl-10 pr-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
          <div className="relative">
            <Calendar className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="month" 
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="pl-10 pr-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 bg-slate-50">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <span className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredStories.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-3">
              <Calendar className="w-16 h-16 opacity-50" />
              <p>{isEn ? 'No archived stories found.' : 'کوئی آرکائیو شدہ کہانی نہیں ملی۔'}</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {filteredStories.map((story, idx) => (
                <div key={story.id} className="group relative aspect-[9/16] bg-slate-800 rounded-xl overflow-hidden cursor-pointer shadow-sm hover:shadow-md transition">
                  <div className="absolute inset-0 z-10" onClick={() => setViewingStoryIdx(idx)} />
                  {story.type === 'photo' || story.type === 'video' ? (
                    <img src={story.image} alt="Story" className="w-full h-full object-cover" />
                  ) : (
                    <div className={`w-full h-full flex flex-col items-center justify-center p-2 text-center text-white ${story.bgColor || 'bg-gradient-to-br from-purple-500 to-indigo-500'}`}>
                      <p className="text-xs font-bold line-clamp-4">{story.text}</p>
                    </div>
                  )}

                  <div className="absolute top-0 left-0 right-0 p-2 bg-gradient-to-b from-black/60 to-transparent flex items-center justify-between text-white z-20 pointer-events-none">
                    <span className="text-[10px] font-medium">{new Date(story.createdAt).toLocaleDateString()}</span>
                    <div className="flex items-center gap-1"><Eye className="w-3 h-3" /><span className="text-[10px]">{story.viewsCount || 0}</span></div>
                  </div>

                  {/* Actions overlay */}
                  <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/80 to-transparent flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                    <button onClick={(e) => { e.stopPropagation(); handleRestore(story.id); }} className="p-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full shadow-lg" title="Restore Story">
                      <RefreshCw className="w-4 h-4" />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); handleDelete(story.id); }} className="p-2 bg-rose-500 hover:bg-rose-600 text-white rounded-full shadow-lg" title="Permanently Delete">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {viewingStoryIdx !== null && (
        <StoryViewer
          stories={filteredStories}
          initialIdx={viewingStoryIdx}
          onClose={() => setViewingStoryIdx(null)}
          viewerId={user?.id || ''}
        />
      )}
    </div>
  );
}
