import React, { useState, useEffect } from 'react';
import { BottomSheet } from '../ui/BottomSheet';
import { videoCommentsService, VideoComment } from '../../services/VideoCommentsService';
import { Send, Heart, MoreVertical } from 'lucide-react';
import { analytics } from '../../services/AnalyticsService';

interface ShortsCommentsProps {
  videoId: string | null;
  isOpen: boolean;
  onClose: () => void;
  currentUserId?: string;
  onCommentAdded?: (videoId: string) => void;
  onCommentDeleted?: (videoId: string) => void;
}

export const ShortsComments: React.FC<ShortsCommentsProps> = ({ videoId, isOpen, onClose, currentUserId, onCommentAdded, onCommentDeleted }) => {
  const [comments, setComments] = useState<VideoComment[]>([]);
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState('');
  
  // Basic infinite scroll state
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);

  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [activeOptionsId, setActiveOptionsId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && videoId) {
      loadComments(0);
    } else {
      setComments([]);
      setOffset(0);
      setHasMore(true);
      setEditingCommentId(null);
      setActiveOptionsId(null);
    }
  }, [isOpen, videoId]);

  const loadComments = async (newOffset: number) => {
    if (!videoId) return;
    setLoading(true);
    try {
      const data = await videoCommentsService.getComments(videoId, currentUserId, 20, newOffset);
      if (newOffset === 0) {
        setComments(data);
      } else {
        setComments(prev => [...prev, ...data]);
      }
      setHasMore(data.length === 20);
      setOffset(newOffset);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handlePost = async () => {
    if (!text.trim() || !videoId || !currentUserId) return;
    try {
      const newComment = await videoCommentsService.postComment(videoId, currentUserId, text);
      analytics.track("video_comment", { entity_type: 'video',
        module: "videos",
        entity_id: videoId,
        metadata: {
            comment_length: text.length
        }
      });
      setComments([newComment, ...comments]);
      setText('');
      if (onCommentAdded) onCommentAdded(videoId);
    } catch (e) {
      console.error("Failed to post comment", e);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!currentUserId || !videoId) return;
    if (window.confirm("Are you sure you want to delete this comment?")) {
      try {
        await videoCommentsService.deleteComment(commentId, currentUserId, videoId);
        setComments(prev => prev.filter(c => c.id !== commentId));
        if (onCommentDeleted) onCommentDeleted(videoId);
      } catch (e) {
        console.error("Failed to delete comment", e);
        alert("Failed to delete comment.");
      }
    }
    setActiveOptionsId(null);
  };

  const startEditing = (comment: VideoComment) => {
    setEditingCommentId(comment.id);
    setEditContent(comment.content);
    setActiveOptionsId(null);
  };

  const saveEdit = async (commentId: string) => {
    if (!currentUserId || !editContent.trim()) return;
    try {
      await videoCommentsService.editComment(commentId, currentUserId, editContent);
      setComments(prev => prev.map(c => c.id === commentId ? { ...c, content: editContent.trim(), updated_at: new Date().toISOString() } : c));
      setEditingCommentId(null);
    } catch (e) {
      console.error("Failed to edit comment", e);
      alert("Failed to save changes.");
    }
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Comments">
      <div className="flex flex-col h-full bg-gray-900">
        
        {/* Comments List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loading && comments.length === 0 && (
            <div className="flex justify-center p-4">
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
          
          {!loading && comments.length === 0 && (
            <div className="text-center text-gray-400 py-8">
              No comments yet. Be the first to say something!
            </div>
          )}

          {comments.map(c => (
            <div key={c.id} className="flex space-x-3">
              <div className="w-8 h-8 rounded-full bg-gray-700 overflow-hidden flex-shrink-0">
                {c.profiles?.profile_photo ? (
                  <img src={c.profiles.profile_photo} alt={c.profiles.full_name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs font-bold text-gray-300">
                    {c.profiles?.full_name?.charAt(0) || 'U'}
                  </div>
                )}
              </div>
              
              <div className="flex-1">
                <div className="flex justify-between items-start relative">
                  <span className="text-xs font-semibold text-gray-400">{c.profiles?.full_name || 'User'}</span>
                  <div className="flex items-center space-x-2">
                    <button className="text-gray-500 hover:text-white"><Heart size={14} /></button>
                    {currentUserId === c.user_id && (
                      <button 
                        onClick={() => setActiveOptionsId(activeOptionsId === c.id ? null : c.id)}
                        className="text-gray-500 hover:text-white p-1 rounded-full hover:bg-gray-800 transition-colors"
                      >
                        <MoreVertical size={14} />
                      </button>
                    )}
                  </div>
                  
                  {activeOptionsId === c.id && (
                    <div className="absolute end-0 top-6 bg-gray-800 border border-gray-700 rounded-xl shadow-xl w-32 overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-100">
                      <button 
                        onClick={() => startEditing(c)}
                        className="w-full text-start px-3 py-2 text-white hover:bg-gray-700 text-xs font-medium transition-colors"
                      >
                        Edit Comment
                      </button>
                      <button 
                        onClick={() => handleDeleteComment(c.id)}
                        className="w-full text-start px-3 py-2 text-red-400 hover:bg-gray-700 text-xs font-medium transition-colors"
                      >
                        Delete Comment
                      </button>
                    </div>
                  )}
                </div>
                
                {editingCommentId === c.id ? (
                  <div className="mt-2 flex flex-col space-y-2">
                    <input 
                      type="text" 
                      className="w-full bg-gray-800 text-white text-sm rounded px-3 py-1.5 outline-none border border-gray-700 focus:border-emerald-500"
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && saveEdit(c.id)}
                      autoFocus
                    />
                    <div className="flex space-x-2 justify-end">
                      <button onClick={() => setEditingCommentId(null)} className="text-xs text-gray-400 hover:text-white">Cancel</button>
                      <button onClick={() => saveEdit(c.id)} className="text-xs text-blue-400 hover:text-blue-300 font-semibold">Save</button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-white mt-0.5 whitespace-pre-wrap">{c.content}</p>
                )}
                
                <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500 font-medium">
                  <span>{new Date(c.created_at).toLocaleDateString()}</span>
                  {c.updated_at && c.updated_at !== c.created_at && <span>(edited)</span>}
                  <button className="hover:text-gray-300">Reply</button>
                </div>
              </div>
            </div>
          ))}

          {hasMore && comments.length > 0 && (
            <button 
              onClick={() => loadComments(offset + 20)}
              className="w-full text-center text-blue-400 text-sm py-2"
            >
              Load more
            </button>
          )}
        </div>

        {/* Input Area */}
        <div className="p-3 border-t border-gray-800 flex items-center space-x-2 bg-gray-900 sticky bottom-0">
          <input 
            type="text" 
            placeholder="Add a comment..."
            className="flex-1 bg-gray-800 text-white text-sm rounded-full px-4 py-2 outline-none border border-gray-700 focus:border-gray-500"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handlePost()}
          />
          <button 
            onClick={handlePost}
            disabled={!text.trim()}
            className="p-2 bg-emerald-600 rounded-full text-white disabled:opacity-50 disabled:bg-gray-700 transition-colors"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </BottomSheet>
  );
};

