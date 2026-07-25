import React, { useState, useEffect } from 'react';
import { 
  dbGetAdminStories, 
  dbGetAdminHighlights, 
  dbDeleteStoryPermanent, 
  dbDeleteHighlight 
} from '../utils/supabaseClient';
import { deleteMedia } from '../utils/cloudinary';
import { 
  Eye, RefreshCw, Trash2, Calendar, LayoutGrid, Search, 
  Filter, ChevronLeft, ChevronRight, PlayCircle, Image as ImageIcon,
  MessageSquare, Heart, Clock, MoreVertical
} from 'lucide-react';
import StoryViewer from './StoryViewer';

interface AdminStoriesViewProps {
  currentLanguage: string;
}

type TabType = 'stories' | 'highlights';

export default function AdminStoriesView({ currentLanguage }: AdminStoriesViewProps) {
  const isEn = currentLanguage === 'en';
  
  const [activeTab, setActiveTab] = useState<TabType>('stories');
  
  // Data States
  const [stories, setStories] = useState<any[]>([]);
  const [highlights, setHighlights] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Pagination & Filters (Stories)
  const [page, setPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // all, active, expired
  const [filterType, setFilterType] = useState('all'); // all, photo, video, text
  const [sortBy, setSortBy] = useState('latest'); // latest, oldest, most_viewed
  const [hasMoreStories, setHasMoreStories] = useState(true);

  // Pagination (Highlights)
  const [hlPage, setHlPage] = useState(0);
  const [hasMoreHighlights, setHasMoreHighlights] = useState(true);

  // Viewer State
  const [viewerStoryIdx, setViewerStoryIdx] = useState<number | null>(null);
  const [viewerStories, setViewerStories] = useState<any[]>([]);

  const PAGE_LIMIT = 50;

  useEffect(() => {
    if (activeTab === 'stories') {
      fetchStories(0, true);
    } else {
      fetchHighlights(0, true);
    }
  }, [activeTab, filterStatus, filterType, sortBy]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (activeTab === 'stories') fetchStories(0, true);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchStories = async (pageIndex: number, reset: boolean = false) => {
    setLoading(true);
    const offset = pageIndex * PAGE_LIMIT;
    const data = await dbGetAdminStories(offset, PAGE_LIMIT, searchQuery, filterStatus, filterType, sortBy);
    
    if (reset) {
      setStories(data);
    } else {
      setStories(prev => [...prev, ...data]);
    }
    
    setHasMoreStories(data.length === PAGE_LIMIT);
    setPage(pageIndex);
    setLoading(false);
  };

  const fetchHighlights = async (pageIndex: number, reset: boolean = false) => {
    setLoading(true);
    const offset = pageIndex * PAGE_LIMIT;
    const data = await dbGetAdminHighlights(offset, PAGE_LIMIT);
    
    if (reset) {
      setHighlights(data);
    } else {
      setHighlights(prev => [...prev, ...data]);
    }
    
    setHasMoreHighlights(data.length === PAGE_LIMIT);
    setHlPage(pageIndex);
    setLoading(false);
  };

  const extractPublicId = (url: string) => {
    try {
      if (!url) return null;
      const parts = url.split('/');
      const filename = parts[parts.length - 1];
      return filename.split('.')[0];
    } catch (e) {
      return null;
    }
  };

  const handleDeleteStory = async (story: any) => {
    if (!window.confirm("Permanently delete this story and its media? This cannot be undone.")) return;
    
    // 1. Delete from Supabase
    const success = await dbDeleteStoryPermanent(story.id);
    
    // 2. Delete from Cloudinary if media exists
    if (success && story.image) {
      const publicId = extractPublicId(story.image);
      const isVideo = story.type === 'video' || story.image.includes('/video/upload/');
      if (publicId) {
        await deleteMedia(publicId, isVideo ? 'video' : 'image');
      }
    }

    // 3. Update UI
    if (success) {
      setStories(prev => prev.filter(s => s.id !== story.id));
    } else {
      alert("Failed to delete story from database.");
    }
  };

  const handleDeleteHighlight = async (highlight: any) => {
    if (!window.confirm("Permanently delete this highlight? All contained stories will lose their highlight association.")) return;
    
    const success = await dbDeleteHighlight(highlight.id);
    
    if (success && highlight.cover_image) {
       const publicId = extractPublicId(highlight.cover_image);
       if (publicId) await deleteMedia(publicId, 'image');
    }

    if (success) {
      setHighlights(prev => prev.filter(h => h.id !== highlight.id));
    } else {
      alert("Failed to delete highlight.");
    }
  };

  const handleViewHighlight = async (highlight: any) => {
    setLoading(true);
    const { supabase } = await import('../utils/supabaseClient');
    if (supabase) {
      try {
        // Query 1: Get story_ids
        const { data: itemData, error: itemError } = await supabase
          .from('story_highlight_items')
          .select('story_id')
          .eq('highlight_id', highlight.id);
          
        if (itemError) throw itemError;
        
        if (itemData && itemData.length > 0) {
          const storyIds = itemData.map(d => d.story_id);
          
          // Query 2: Get stories
          const { data: storiesData, error: storiesError } = await supabase
            .from('stories')
            .select('*')
            .in('id', storyIds);
            
          if (storiesError) throw storiesError;
          
          if (storiesData) {
            const mappedStories = storiesData.map((s: any) => ({
              ...s,
              id: s.id,
              author: s.author || 'User',
              avatar: s.avatar || '',
              type: s.media_type || s.type,
              image: s.image,
              text: s.text,
              bgColor: s.bgColor,
              createdAt: s.createdAt,
              userId: s.userId
            }));
            
            setViewerStories(mappedStories);
            setViewerStoryIdx(0);
          }
        }
      } catch (err) {
        console.error('Failed to load highlight stories:', err);
      }
    }
    setLoading(false);
  };

  const isVideoUrl = (url?: string) => !!url?.match(/\.(mp4|webm|mov)$/i) || !!url?.includes('/video/upload/');

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-4 border-b border-slate-200">
        <button 
          onClick={() => setActiveTab('stories')}
          className={`pb-3 px-4 font-bold transition flex items-center gap-2 ${activeTab === 'stories' ? 'text-emerald-600 border-b-2 border-emerald-600' : 'text-slate-500 hover:text-slate-800'}`}
        >
          <Calendar className="w-5 h-5" /> Stories
        </button>
        <button 
          onClick={() => setActiveTab('highlights')}
          className={`pb-3 px-4 font-bold transition flex items-center gap-2 ${activeTab === 'highlights' ? 'text-emerald-600 border-b-2 border-emerald-600' : 'text-slate-500 hover:text-slate-800'}`}
        >
          <LayoutGrid className="w-5 h-5" /> Highlights
        </button>
      </div>

      {activeTab === 'stories' && (
        <div className="space-y-6 bg-white rounded-3xl p-6 border border-slate-200/60 shadow-sm">
          {/* Toolbar */}
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-64">
              <Search className="w-4 h-4 absolute start-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search by user name..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full ps-9 pe-4 py-2 bg-slate-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div className="flex flex-wrap gap-2 w-full md:w-auto">
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="bg-slate-100 px-3 py-2 rounded-2xl text-sm outline-none">
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="expired">Expired</option>
              </select>
              <select value={filterType} onChange={e => setFilterType(e.target.value)} className="bg-slate-100 px-3 py-2 rounded-2xl text-sm outline-none">
                <option value="all">All Types</option>
                <option value="photo">Photo</option>
                <option value="video">Video</option>
                <option value="text">Text</option>
              </select>
              <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="bg-slate-100 px-3 py-2 rounded-2xl text-sm outline-none">
                <option value="latest">Latest</option>
                <option value="oldest">Oldest</option>
                <option value="most_viewed">Most Viewed</option>
              </select>
            </div>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {stories.map((story, idx) => (
              <div key={story.id} className="group relative aspect-[9/16] bg-slate-800 rounded-2xl overflow-hidden shadow-sm border border-slate-200">
                {/* Media preview */}
                {story.type === 'text' ? (
                  <div className="w-full h-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center p-4">
                    <p className="text-white text-[10px] text-center font-bold">{story.text}</p>
                  </div>
                ) : (
                  <img 
                    src={story.image} 
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500" 
                    onError={(e) => { (e.target as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="500"><rect width="300" height="500" fill="%23f1f5f9"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="14" fill="%2394a3b8">Media Error</text></svg>' }}
                  />
                )}
                
                {/* Type Icon */}
                <div className="absolute top-2 start-2 bg-black/60 rounded-full p-1.5 backdrop-blur-md">
                  {story.type === 'video' || isVideoUrl(story.image) ? (
                    <PlayCircle className="w-3 h-3 text-white" />
                  ) : story.type === 'photo' ? (
                    <ImageIcon className="w-3 h-3 text-white" />
                  ) : (
                    <div className="w-3 h-3 text-white flex items-center justify-center font-serif text-[10px]">T</div>
                  )}
                </div>

                {/* Expiry Badge */}
                {new Date(story.expires_at) <= new Date() && (
                  <div className="absolute top-2 end-2 bg-rose-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">
                    Expired
                  </div>
                )}

                {/* Author Info */}
                <div className="absolute bottom-0 inset-x-0 p-3 pt-8 bg-gradient-to-t from-black/80 to-transparent flex flex-col gap-1 text-white">
                  <div className="flex items-center gap-2">
                    {story.avatar ? (
                      <img src={story.avatar} className="w-5 h-5 rounded-full object-cover bg-slate-100" />
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-slate-600 flex items-center justify-center text-[10px] text-white font-bold">
                        {story.author?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                    )}
                    <span className="text-[11px] font-bold truncate">{story.author}</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-300">
                    <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {story.views_count}</span>
                    <span className="flex items-center gap-1"><Heart className="w-3 h-3" /> {story.reactions_count}</span>
                    <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" /> {story.replies_count}</span>
                  </div>
                </div>

                {/* Overlay Actions */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3">
                  <button onClick={() => { setViewerStories(stories); setViewerStoryIdx(idx); }} className="bg-white text-slate-900 px-4 py-2 rounded-2xl text-xs font-bold w-32 flex items-center justify-center gap-2 hover:bg-slate-100 transition shadow-lg">
                    <Eye className="w-4 h-4" /> View
                  </button>
                  <button onClick={() => handleDeleteStory(story)} className="bg-rose-500 text-white px-4 py-2 rounded-2xl text-xs font-bold w-32 flex items-center justify-center gap-2 hover:bg-rose-600 transition shadow-lg">
                    <Trash2 className="w-4 h-4" /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          {loading && <div className="text-center py-4 text-slate-500">Loading stories...</div>}
          
          {!loading && stories.length === 0 && (
            <div className="text-center py-12 text-slate-500 bg-slate-50 rounded-2xl">
              No stories found matching your criteria.
            </div>
          )}

          {!loading && hasMoreStories && (
            <div className="flex justify-center mt-6">
              <button onClick={() => fetchStories(page + 1, false)} className="px-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl transition">
                Load More
              </button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'highlights' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200/60 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-start text-sm">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="p-4 rounded-tl-xl">Highlight</th>
                  <th className="p-4">Owner</th>
                  <th className="p-4">Stories Count</th>
                  <th className="p-4">Created At</th>
                  <th className="p-4 rounded-tr-xl text-end">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {highlights.map(hl => (
                  <tr key={hl.id} className="hover:bg-slate-50/50 transition">
                    <td className="p-4">
                      <div className="flex items-center gap-4">
                        {hl.cover_image ? (
                          <img src={hl.cover_image} className="w-12 h-12 rounded-full object-cover shadow-sm bg-slate-100" />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold shadow-sm">
                            {hl.title?.charAt(0)?.toUpperCase() || 'H'}
                          </div>
                        )}
                        <span className="font-bold text-slate-800 text-base">{hl.title}</span>
                      </div>
                    </td>
                    <td className="p-4 text-slate-600 font-medium">{hl.author}</td>
                    <td className="p-4 text-slate-600">
                      <span className="bg-slate-100 px-3 py-1 rounded-full text-xs font-bold">{hl.stories_count} items</span>
                    </td>
                    <td className="p-4 text-slate-500">{new Date(hl.created_at).toLocaleDateString()}</td>
                    <td className="p-4 text-end">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => handleViewHighlight(hl)} className="p-2 text-emerald-500 hover:bg-emerald-50 rounded-2xl transition" title="View Highlight">
                          <Eye className="w-5 h-5" />
                        </button>
                        <button onClick={() => handleDeleteHighlight(hl)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-2xl transition" title="Delete Highlight">
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {loading && <div className="text-center py-4 text-slate-500">Loading highlights...</div>}
          {!loading && highlights.length === 0 && (
            <div className="text-center py-12 text-slate-500 bg-slate-50 rounded-2xl mt-4">
              No highlights found.
            </div>
          )}
          {!loading && hasMoreHighlights && (
            <div className="flex justify-center mt-6">
              <button onClick={() => fetchHighlights(hlPage + 1, false)} className="px-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl transition">
                Load More
              </button>
            </div>
          )}
        </div>
      )}

      {/* Story Viewer Modal */}
      {viewerStoryIdx !== null && viewerStories.length > 0 && (
        <StoryViewer
          stories={viewerStories}
          initialIdx={viewerStoryIdx}
          onClose={() => { setViewerStoryIdx(null); setViewerStories([]); }}
          viewerId="admin"
          currentLanguage={currentLanguage}
          isAdminMode={true}
          onDeleteStory={async (storyId) => {
            const story = viewerStories.find(s => s.id === storyId);
            if (story) await handleDeleteStory(story);
            if (activeTab === 'highlights') {
               setViewerStories(prev => prev.filter(s => s.id !== storyId));
               if (viewerStories.length <= 1) setViewerStoryIdx(null);
            }
          }}
        />
      )}
    </div>
  );
}

