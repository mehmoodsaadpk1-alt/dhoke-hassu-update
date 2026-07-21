import React, { useState, useMemo } from 'react';
import { 
  Eye, EyeOff, Trash2, Pin, MessageSquare, Heart, AlertTriangle, 
  Search, Filter, Image as ImageIcon, Video as VideoIcon, User as UserIcon,
  X, RefreshCw
} from 'lucide-react';
import { Post, User } from '../types';
import PostCard from './PostCard';
import { dbDeletePost, dbUpdatePostStatus, dbTogglePostPin } from '../utils/supabaseClient';

interface AdminCommunityFeedProps {
  posts: Post[];
  onUpdatePosts: (updated: Post[]) => void;
  currentLanguage: 'en' | 'ur';
  users: User[];
}

export default function AdminCommunityFeed({ posts, onUpdatePosts, currentLanguage, users }: AdminCommunityFeedProps) {
  const isEn = currentLanguage === 'en';
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All'); // All, Active, Hidden, Deleted
  const [filterMedia, setFilterMedia] = useState('All'); // All, Media Only
  const [filterReported, setFilterReported] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  // Derive filtered posts
  const filteredPosts = useMemo(() => {
    return posts.filter(post => {
      // 1. Status Filter
      if (filterStatus !== 'All') {
        const postStatus = post.status || 'active';
        if (filterStatus === 'Active' && postStatus !== 'active') return false;
        if (filterStatus === 'Hidden' && postStatus !== 'hidden') return false;
        if (filterStatus === 'Deleted' && postStatus !== 'deleted') return false;
      }

      // 2. Reported Filter
      if (filterReported && (!post.reportCount || post.reportCount === 0)) return false;

      // 3. Media Filter
      if (filterMedia === 'Media Only') {
        const hasMedia = post.image || post.videoUrl || (post.images && post.images.length > 0);
        if (!hasMedia) return false;
      }

      // 4. Search Filter
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchesContent = post.content?.toLowerCase().includes(term);
        const matchesAuthor = post.author?.toLowerCase().includes(term);
        if (!matchesContent && !matchesAuthor) return false;
      }

      return true;
    }).sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return new Date(b.time).getTime() - new Date(a.time).getTime();
    });
  }, [posts, filterStatus, filterReported, filterMedia, searchTerm]);

  // Pagination
  const totalPages = Math.ceil(filteredPosts.length / itemsPerPage) || 1;
  const paginatedPosts = filteredPosts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleUpdateStatus = async (post: Post, newStatus: 'active' | 'hidden' | 'deleted') => {
    const originalStatus = post.status;
    const updated = posts.map(p => p.id === post.id ? { ...p, status: newStatus } : p);
    onUpdatePosts(updated);
    
    if (newStatus === 'deleted') {
      const success = await dbDeletePost(post.id);
      if (!success) {
        onUpdatePosts(posts.map(p => p.id === post.id ? { ...p, status: originalStatus } : p));
        alert(isEn ? 'Failed to delete post from database.' : 'ڈیٹا بیس سے پوسٹ حذف کرنے میں ناکام۔');
      }
    } else {
      const success = await dbUpdatePostStatus(post.id, newStatus);
      if (!success) {
        onUpdatePosts(posts.map(p => p.id === post.id ? { ...p, status: originalStatus } : p));
        alert(isEn ? 'Failed to update post status in database.' : 'ڈیٹا بیس میں پوسٹ کا اسٹیٹس اپ ڈیٹ کرنے میں ناکام۔');
      }
    }
  };

  const handleTogglePin = async (post: Post) => {
    const originalPinned = post.pinned;
    const updated = posts.map(p => p.id === post.id ? { ...p, pinned: !p.pinned } : p);
    onUpdatePosts(updated);
    
    const success = await dbTogglePostPin(post.id, !originalPinned);
    if (!success) {
      onUpdatePosts(posts.map(p => p.id === post.id ? { ...p, pinned: originalPinned } : p));
      alert(isEn ? 'Failed to pin/unpin post in database.' : 'ڈیٹا بیس میں پوسٹ پن کرنے میں ناکام۔');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900">{isEn ? 'Community Feed Moderation' : 'کمیونٹی فیڈ ماڈریشن'}</h2>
          <p className="text-xs font-semibold text-slate-500 mt-1">
            {isEn ? 'Monitor and manage user posts across the platform.' : 'پلیٹ فارم پر صارف کی پوسٹس کی نگرانی اور انتظام کریں۔'}
          </p>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-4 items-center">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute start-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder={isEn ? 'Search by author or content...' : 'مصنف یا مواد کے لحاظ سے تلاش کریں...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full ps-9 pe-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-700 outline-none cursor-pointer"
            >
              <option value="All">All Status</option>
              <option value="Active">Active</option>
              <option value="Hidden">Hidden</option>
              <option value="Deleted">Deleted</option>
            </select>
          </div>

          <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl">
            <select
              value={filterMedia}
              onChange={(e) => setFilterMedia(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-700 outline-none cursor-pointer"
            >
              <option value="All">All Content</option>
              <option value="Media Only">Media Only</option>
            </select>
          </div>

          <label className="flex items-center gap-2 cursor-pointer bg-red-50 text-red-700 px-3 py-2 rounded-xl border border-red-100">
            <input 
              type="checkbox"
              checked={filterReported}
              onChange={(e) => setFilterReported(e.target.checked)}
              className="rounded border-red-300 text-red-600 focus:ring-red-500"
            />
            <AlertTriangle className="w-3.5 h-3.5" />
            <span className="text-[11px] font-black uppercase tracking-wider">Reported</span>
          </label>
        </div>
      </div>

      {/* Posts Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden animate-fadeIn">
        {filteredPosts.length === 0 ? (
          <div className="p-16 text-center text-slate-400 space-y-3">
            <MessageSquare className="w-10 h-10 mx-auto text-slate-300" />
            <p className="text-xs font-semibold">No posts found matching criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-start border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                  <th className="py-3.5 px-6">Author</th>
                  <th className="py-3.5 px-6">Content Snippet</th>
                  <th className="py-3.5 px-6">Metrics</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6 text-end">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700 font-semibold">
                {paginatedPosts.map((post) => {
                  const status = post.status || 'active';
                  const hasMedia = post.image || post.videoUrl || (post.images && post.images.length > 0);
                  
                  return (
                    <tr key={post.id} className={`hover:bg-slate-50/50 ${status === 'deleted' ? 'opacity-60' : ''}`}>
                      <td className="py-3 px-6">
                        <div className="flex items-center gap-3">
                          {post.avatar ? (
                            <img src={post.avatar} alt="Avatar" className="w-8 h-8 rounded-full object-cover" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center">
                              <UserIcon className="w-4 h-4 text-slate-400" />
                            </div>
                          )}
                          <div>
                            <p className="font-bold text-slate-900">{post.author}</p>
                            <p className="text-[10px] text-slate-500">{new Date(post.time).toLocaleString()}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-6 max-w-[200px]">
                        <div className="flex items-start gap-2">
                          {hasMedia && (
                            <div className="flex-shrink-0 mt-0.5">
                              {post.videoUrl ? <VideoIcon className="w-3.5 h-3.5 text-blue-500" /> : <ImageIcon className="w-3.5 h-3.5 text-green-500" />}
                            </div>
                          )}
                          <p className="truncate text-slate-600" title={post.content}>{post.content || 'No text content'}</p>
                        </div>
                        {post.area && (
                          <span className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded mt-1 inline-block">
                            {post.area}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-6">
                        <div className="flex items-center gap-3 text-[11px] font-bold">
                          <span className="flex items-center gap-1 text-rose-500">
                            <Heart className="w-3 h-3" /> {post.likes}
                          </span>
                          <span className="flex items-center gap-1 text-blue-500">
                            <MessageSquare className="w-3 h-3" /> {post.commentsCount}
                          </span>
                          {(post.reportCount && post.reportCount > 0) ? (
                            <span className="flex items-center gap-1 text-red-600 bg-red-50 px-1.5 rounded">
                              <AlertTriangle className="w-3 h-3" /> {post.reportCount}
                            </span>
                          ) : null}
                        </div>
                      </td>
                      <td className="py-3 px-6">
                        <div className="flex flex-col items-start gap-1">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                            status === 'active' ? 'bg-green-50 text-green-700' :
                            status === 'hidden' ? 'bg-amber-50 text-amber-700' :
                            'bg-red-50 text-red-700'
                          }`}>
                            {status}
                          </span>
                          {post.pinned && (
                            <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-indigo-50 text-indigo-700 flex items-center gap-1">
                              <Pin className="w-2.5 h-2.5" /> Pinned
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-6 text-end space-x-1 whitespace-nowrap">
                        <button
                          onClick={() => setSelectedPost(post)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border-none bg-transparent cursor-pointer"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        
                        <button
                          onClick={() => handleTogglePin(post)}
                          className={`p-1.5 rounded-lg transition-colors border-none bg-transparent cursor-pointer ${post.pinned ? 'text-indigo-600 bg-indigo-50' : 'text-slate-400 hover:bg-slate-50'}`}
                          title={post.pinned ? "Unpin" : "Pin Post"}
                        >
                          <Pin className="w-4 h-4" />
                        </button>

                        {status === 'active' ? (
                          <button
                            onClick={() => handleUpdateStatus(post, 'hidden')}
                            className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors border-none bg-transparent cursor-pointer"
                            title="Hide Post"
                          >
                            <EyeOff className="w-4 h-4" />
                          </button>
                        ) : status === 'hidden' ? (
                          <button
                            onClick={() => handleUpdateStatus(post, 'active')}
                            className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors border-none bg-transparent cursor-pointer"
                            title="Unhide Post"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleUpdateStatus(post, 'active')}
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors border-none bg-transparent cursor-pointer"
                            title="Restore Post"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </button>
                        )}

                        {status !== 'deleted' && (
                          <button
                            onClick={() => {
                              if(window.confirm('Are you sure you want to mark this post as deleted?')) {
                                handleUpdateStatus(post, 'deleted');
                              }
                            }}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors border-none bg-transparent cursor-pointer"
                            title="Delete Post"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        
        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
              Page {currentPage} of {totalPages}
            </span>
            <div className="flex gap-1">
              {Array.from({ length: totalPages }).map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentPage(idx + 1)}
                  className={`w-7 h-7 rounded-lg text-xs font-bold transition-colors border-none cursor-pointer ${
                    currentPage === idx + 1 
                      ? 'bg-indigo-600 text-white' 
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {idx + 1}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Post Detail Modal */}
      {selectedPost && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-xl flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
              <h3 className="text-sm font-black text-slate-900">Post Details</h3>
              <button 
                onClick={() => setSelectedPost(null)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors border-none cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto bg-slate-50 flex-1">
              {/* We render PostCard in a readonly-like manner or just standard */}
              <div className="pointer-events-none">
                <PostCard 
                  post={selectedPost} 
                  isLiked={false}
                  likeCount={selectedPost.likes || 0}
                  onLike={() => {}} 
                  onComment={() => {}} 
                  isEntityVerified={() => false}
                  getTvsBadgeType={() => 'gray'}
                  currentLanguage={isEn ? 'en' : 'ur'}
                />
              </div>
              <div className="mt-4 p-4 bg-white rounded-2xl border border-slate-200">
                <h4 className="text-xs font-black text-slate-900 mb-2 uppercase tracking-wider">Moderation Details</h4>
                <div className="space-y-2 text-xs font-semibold text-slate-600">
                  <p>Status: <span className="text-slate-900 font-bold uppercase">{selectedPost.status || 'active'}</span></p>
                  <p>Reports: <span className="text-red-600 font-bold">{selectedPost.reportCount || 0}</span></p>
                  <p>Pinned: <span className="text-slate-900 font-bold">{selectedPost.pinned ? 'Yes' : 'No'}</span></p>
                  <p>Post ID: <span className="text-slate-400 font-mono text-[10px]">{selectedPost.id}</span></p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
