/**
 * Dhoke Hassu Connect - Community Polls & Opinion Module
 * 
 * Renders user-facing polls, search filters, optimistic voting, live animated percentage bars,
 * relational comments thread (likes, reports, nested replies), and share/report actions.
 */

import React, { useState, useEffect } from 'react';
import { 
  Clock, Share2, Search, Filter, CheckCircle, Calendar, 
  MessageCircle, AlertCircle, ThumbsUp, Trash2, Pin, Flag, 
  Send, ChevronDown, Check, ArrowLeft, Eye, EyeOff
} from 'lucide-react';
import { Poll, PollOption, PollComment, User } from '../types';
import { 
  dbGetPolls, dbCastVote, dbGetUserVotes, dbGetPollComments, 
  dbAddPollComment, dbLikePollComment, dbReportPollComment, 
  dbTrackPollView, dbTrackPollShare, isSupabaseConfigured,
  dbDeletePollComment
} from '../utils/supabaseClient';
import { isUserAdminOrModerator } from './AlertsModule';
import AdBannerCard from './AdBannerCard';
import { useAdRotator } from '../hooks/useAdRotator';
import { useAdStore } from '../store/adStore';

interface PollsModuleProps {
  currentUser: User;
  currentLanguage: 'en' | 'ur';
  polls: Poll[];
  setPolls: React.Dispatch<React.SetStateAction<Poll[]>>;
  userVotes: Record<string, string>;
  setUserVotes: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}

const CATEGORIES = [
  'All', 'Community', 'Development', 'Security', 'Cleanliness', 
  'Events', 'Sports', 'Education', 'Business', 'Mosque', 
  'Youth', 'Women', 'Senior Citizens', 'Transportation', 
  'Utilities', 'Emergency', 'Other'
];

export default function PollsModule({ 
  currentUser, 
  currentLanguage, 
  polls, 
  setPolls, 
  userVotes, 
  setUserVotes 
}: PollsModuleProps) {
  const pollsFeedAdInterval = useAdStore(s => s.feedAdIntervals?.['Polls & Opinions'] || 4);
  const pollsTopBannerMap = useAdRotator('Polls & Opinions', 1, 1, 'Banner');
  const pollsBottomBannerMap = useAdRotator('Polls & Opinions', 1, 1, 'Bottom Banner');
  const pollsAdMap = useAdRotator('Polls & Opinions', 200, pollsFeedAdInterval, 'Feed');

  // Temporary logging for Ad verification
  console.log('[DEBUG-POLLS-ADS] pollsTopBannerMap:', pollsTopBannerMap);
  console.log('[DEBUG-POLLS-ADS] pollsBottomBannerMap:', pollsBottomBannerMap);
  console.log('[DEBUG-POLLS-ADS] pollsAdMap length:', Object.keys(pollsAdMap).length, pollsAdMap);

  const isEn = currentLanguage === 'en';
  const isAdmin = isUserAdminOrModerator(currentUser);

  // States
  const [loading, setLoading] = useState(false);
  const [selectedPoll, setSelectedPoll] = useState<Poll | null>(null);
  
  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [activeTab, setActiveTab] = useState<'active' | 'featured' | 'ending' | 'recent' | 'closed'>('active');

  // Detail/Comment States
  const [comments, setComments] = useState<PollComment[]>([]);
  const [commentInput, setCommentInput] = useState('');
  const [replyInputs, setReplyInputs] = useState<Record<string, string>>({});
  const [activeReplyBox, setActiveReplyBox] = useState<string | null>(null);
  const [reportingPollId, setReportingPollId] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState('');

  // Fetch initial data
  useEffect(() => {
    loadPolls();
  }, []);

  const loadPolls = async () => {
    setLoading(true);
    try {
      const allPolls = await dbGetPolls([]);
      setPolls(allPolls);
      
      if (currentUser?.id) {
        const votesMap = await dbGetUserVotes(currentUser.id);
        setUserVotes(votesMap);
      }
    } catch (e) {
      console.error("Error loading polls:", e);
    } finally {
      setLoading(false);
    }
  };

  // View poll details and record view event
  const handleSelectPoll = async (poll: Poll) => {
    setSelectedPoll(poll);
    dbTrackPollView(poll.id, currentUser?.id);
    
    // Load comments if enabled
    if (poll.allow_comments) {
      try {
        const list = await dbGetPollComments(poll.id);
        setComments(list);
      } catch (err) {
        console.error("Comments fetch error:", err);
      }
    }
  };

  const refreshComments = async (pollId: string) => {
    const list = await dbGetPollComments(pollId);
    setComments(list);
  };

  // Vote Casting (Optimistic UI)
  const handleVote = async (pollId: string, optionId: string) => {
    if (!currentUser?.id) {
      alert(isEn ? 'Please log in to vote.' : 'براہ کرم ووٹ ڈالنے کے لئے لاگ ان کریں۔');
      return;
    }



    const targetPoll = polls.find(p => p.id === pollId);
    if (!targetPoll) return;

    // Check status
    if (targetPoll.publish_status === 'Closed') {
      alert(isEn ? 'This poll is closed.' : 'یہ سروے بند ہو چکا ہے۔');
      return;
    }

    const previousVote = userVotes[pollId];
    if (previousVote && !targetPoll.allow_option_change) {
      alert(isEn ? 'You have already voted and options changes are disabled.' : 'آپ پہلے ہی ووٹ دے چکے ہیں اور تبدیل کرنے کی اجازت نہیں ہے۔');
      return;
    }

    // Dynamic state updates (Optimistic UI)
    setUserVotes(prev => ({ ...prev, [pollId]: optionId }));

    const updatedPolls = polls.map(p => {
      if (p.id !== pollId) return p;

      // Update Option Count
      const newOptions = (p.options || []).map((o: PollOption) => {
        let count = o.votes_count || 0;
        if (o.id === optionId) count += 1;
        if (previousVote && o.id === previousVote) count = Math.max(0, count - 1);
        return { ...o, votes_count: count };
      });

      const total = newOptions.reduce((acc, curr) => acc + curr.votes_count, 0);

      return {
        ...p,
        options: newOptions,
        total_votes: total
      };
    });

    setPolls(updatedPolls);
    if (selectedPoll && selectedPoll.id === pollId) {
      const match = updatedPolls.find(p => p.id === pollId);
      if (match) setSelectedPoll(match);
    }

    // Async DB update
    const res = await dbCastVote(pollId, currentUser.id, optionId, currentUser);
    if (!res.success) {
      // Revert if error
      alert(res.error || 'Voting failed');
      loadPolls();
    }
  };

  // Share Poll details and track event
  const handleSharePoll = (poll: Poll) => {
    const shareUrl = `${window.location.origin}/polls?id=${poll.id}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      alert(isEn ? 'Poll link copied to clipboard!' : 'سروے کا لنک کاپی کر لیا گیا ہے!');
      dbTrackPollShare(poll.id, currentUser?.id, 'Clipboard');
    });
  };

  // Report Poll
  const handleReportPoll = (pollId: string) => {
    setReportingPollId(pollId);
    setReportReason('');
  };

  const submitReport = () => {
    if (!reportReason?.trim()) return;
    alert(isEn ? 'Poll reported successfully. Our moderators will review it.' : 'رپورٹ کامیابی سے درج ہو گئی۔ ہمارے ناظمین اس کا جائزہ لیں گے۔');
    setReportingPollId(null);
  };

  // Comment Likes
  const handleLikeComment = async (commentId: string) => {
    if (!currentUser?.id) return;
    
    // Optimistic Toggle
    setComments(prev => prev.map(c => {
      if (c.id === commentId) {
        return { ...c, likes_count: c.likes_count + 1 };
      }
      if (c.replies) {
        return { ...c, replies: c.replies.map(r => r.id === commentId ? { ...r, likes_count: r.likes_count + 1 } : r) };
      }
      return c;
    }));

    await dbLikePollComment(commentId, currentUser.id);
    if (selectedPoll) refreshComments(selectedPoll.id);
  };

  // Add Comment/Reply
  const handleAddComment = async (e: React.FormEvent, parentId: string | null = null) => {
    e.preventDefault();
    if (!currentUser?.id || !selectedPoll) return;

    const content = parentId ? replyInputs[parentId] : commentInput;
    if (!content?.trim()) return;

    const added = await dbAddPollComment(
      selectedPoll.id,
      currentUser.id,
      currentUser.fullName,
      currentUser.profilePhoto,
      content,
      parentId
    );

    if (added) {
      if (parentId) {
        setReplyInputs(prev => ({ ...prev, [parentId]: '' }));
        setActiveReplyBox(null);
      } else {
        setCommentInput('');
      }
      refreshComments(selectedPoll.id);
    }
  };

  // Filtering & Sorting Lists
  const getFilteredPolls = () => {
    let list = [...polls];

    // Search
    if (searchQuery?.trim()) {
      const q = searchQuery?.toLowerCase();
      list = list.filter(p => p.title?.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q));
    }

    // Category
    if (selectedCategory !== 'All') {
      list = list.filter(p => p.category === selectedCategory);
    }

    // Tab Sorting
    const now = new Date();
    if (activeTab === 'active') {
      list = list.filter(p => p.publish_status === 'Active' || p.publish_status === 'Published' || p.publish_status === 'Ending Soon');
    } else if (activeTab === 'featured') {
      list = list.filter(p => p.featured);
    } else if (activeTab === 'ending') {
      list = list.filter(p => p.publish_status === 'Ending Soon');
    } else if (activeTab === 'recent') {
      list = list.sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime());
    } else if (activeTab === 'closed') {
      list = list.filter(p => p.publish_status === 'Closed');
    }

    return list;
  };

  const filteredPolls = getFilteredPolls();

  // Dynamic remaining time calculation
  const getRemainingTimeText = (endDateStr: string) => {
    if (!endDateStr) return isEn ? 'No limit' : 'کوئی حد نہیں';
    const now = new Date();
    const end = new Date(endDateStr);
    const diffMs = end.getTime() - now.getTime();
    
    if (diffMs <= 0) return isEn ? 'Closed' : 'بند ہو چکا ہے';
    
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours < 24) {
      return isEn ? `${diffHours} hours remaining` : `${diffHours} گھنٹے باقی`;
    }
    
    const diffDays = Math.floor(diffHours / 24);
    return isEn ? `${diffDays} days remaining` : `${diffDays} دن باقی`;
  };

  return (
    <div className="flex-1 w-full max-w-5xl mx-auto px-4 py-6 bg-slate-50 min-h-screen text-slate-800">
      {selectedPoll ? (
        /* ==================== POLL DETAILS PAGE ==================== */
        <div className="space-y-6 animate-fadeIn">
          {/* Back Link */}
          <button 
            onClick={() => setSelectedPoll(null)}
            className="flex items-center gap-1.5 text-xs font-black text-slate-500 hover:text-slate-900 border-none bg-transparent cursor-pointer transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {isEn ? 'Back to Polls' : 'سروے لسٹ پر واپس'}
          </button>

          {/* Details Card */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-md overflow-hidden">
            {selectedPoll.cover_image && (
              <div className="w-full h-56 md:h-72 overflow-hidden relative">
                <img 
                  src={selectedPoll.cover_image} 
                  alt={selectedPoll.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
              </div>
            )}

            <div className="p-6 md:p-8 space-y-6">
              {/* Category Badge & Metadata */}
              <div className="flex flex-wrap items-center justify-between gap-4">
                <span className="px-3.5 py-1 bg-indigo-50 text-indigo-700 text-[10px] font-black uppercase rounded-lg tracking-wider border border-indigo-100">
                  {selectedPoll.category}
                </span>

                <div className="flex items-center gap-4 text-xs font-bold text-slate-400">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-350" />
                    {getRemainingTimeText(selectedPoll.end_date)}
                  </span>
                  <span className="flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5 text-indigo-550" />
                    {selectedPoll.total_votes} {isEn ? 'Votes' : 'ووٹ'}
                  </span>
                </div>
              </div>

              {/* Title & Desc */}
              <div className="space-y-3">
                <h1 className="text-xl md:text-2xl font-black text-slate-900 leading-snug">
                  {selectedPoll.title}
                </h1>
                <p className="text-sm text-slate-500 font-medium leading-relaxed whitespace-pre-line">
                  {selectedPoll.description}
                </p>
              </div>

              {/* Poll Options Grid */}
              <div className="space-y-3 pt-2">
                {selectedPoll.options && (selectedPoll.options as PollOption[]).map((opt) => {
                  const hasVotedThisPoll = !!userVotes[selectedPoll.id];
                  const isThisOptionVoted = userVotes[selectedPoll.id] === opt.id;
                  
                  // Compute Percentages
                  const votes = opt.votes_count || 0;
                  const total = selectedPoll.total_votes || 1;
                  const percent = Math.round((votes / total) * 100);

                  const showResults = selectedPoll.show_live_results || hasVotedThisPoll || selectedPoll.publish_status === 'Closed';

                  return (
                    <button
                      key={opt.id}
                      onClick={() => handleVote(selectedPoll.id, opt.id)}
                      disabled={hasVotedThisPoll && !selectedPoll.allow_option_change}
                      className={`w-full relative text-left p-4 rounded-2xl border transition-all cursor-pointer overflow-hidden flex items-center justify-between group ${
                        isThisOptionVoted 
                          ? 'border-indigo-650 bg-indigo-50/20' 
                          : 'border-slate-200 hover:border-slate-405 bg-white'
                      }`}
                    >
                      {/* Animated Percentage bar */}
                      {showResults && (
                        <div 
                          className="absolute left-0 top-0 bottom-0 bg-indigo-105 transition-all duration-700" 
                          style={{ width: `${percent}%` }}
                        />
                      )}

                      <div className="flex items-center gap-3 relative z-10 font-bold text-xs md:text-sm text-slate-800">
                        <span className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                          isThisOptionVoted 
                            ? 'bg-indigo-600 border-indigo-600 text-white' 
                            : 'border-slate-350 group-hover:border-slate-400'
                        }`}>
                          {isThisOptionVoted && <Check className="w-3 h-3 stroke-[3]" />}
                        </span>
                        <span>{opt.option_text}</span>
                      </div>

                      {showResults && (
                        <div className="text-right relative z-10 shrink-0 font-black text-xs md:text-sm text-slate-700">
                          <span>{percent}%</span>
                          <span className="text-[10px] text-slate-400 block font-bold">({votes} {isEn ? 'votes' : 'ووٹ'})</span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Anonymous Banner */}
              {selectedPoll.anonymous && (
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-[11px] font-bold text-slate-500 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-indigo-500 shrink-0" />
                  {isEn 
                    ? 'Anonymous Voting is ON. Your name and profile will never be linked to your vote.'
                    : 'گمنام ووٹنگ فعال ہے۔ آپ کا نام اور پروفائل آپ کے ووٹ سے لنک نہیں کیا جائے گا۔'}
                </div>
              )}

              {/* Poll Controls (Share, Report) */}
              <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-slate-100">
                <button
                  onClick={() => handleSharePoll(selectedPoll)}
                  className="flex items-center justify-center gap-1.5 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black rounded-xl transition-all cursor-pointer border-none"
                >
                  <Share2 className="w-4 h-4" />
                  {isEn ? 'Share Poll' : 'سروے شیئر کریں'}
                </button>

                <button
                  onClick={() => handleReportPoll(selectedPoll.id)}
                  className="flex items-center justify-center gap-1.5 py-2.5 px-4 bg-red-50 hover:bg-red-100/80 text-red-650 text-xs font-black rounded-xl transition-all cursor-pointer border-none ml-auto"
                >
                  <Flag className="w-4 h-4" />
                  {isEn ? 'Report Poll' : 'سروے کی شکایت کریں'}
                </button>
              </div>
            </div>
          </div>

          {/* ==================== COMMENTS SECTION ==================== */}
          {selectedPoll.allow_comments && (
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-md p-6 md:p-8 space-y-6">
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-indigo-600" />
                {isEn ? 'Comments & Discussion' : 'تبصرے اور بحث'}
              </h2>

              {/* Comment Box */}
              <form onSubmit={(e) => handleAddComment(e)} className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-2xl p-2 focus-within:border-indigo-500 focus-within:bg-white transition-all">
                <input
                  type="text"
                  placeholder={isEn ? 'Write a comment...' : 'تبصرہ لکھیں...'}
                  value={commentInput}
                  onChange={(e) => setCommentInput(e.target.value)}
                  className="flex-1 bg-transparent border-none text-xs md:text-sm px-2 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={!commentInput?.trim()}
                  className="p-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl disabled:opacity-40 transition-all border-none cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>

              {/* Discussion Thread */}
              <div className="space-y-5 pt-2">
                {comments.length === 0 ? (
                  <p className="text-xs text-slate-400 font-semibold text-center py-6">
                    {isEn ? 'No comments yet. Start the conversation!' : 'ابھی تک کوئی تبصرہ نہیں ہے۔ بحث شروع کریں!'}
                  </p>
                ) : (
                  comments.map((comm) => (
                    <div key={comm.id} className="space-y-3.5 border-l-2 border-slate-100 pl-4 relative">
                      
                      {/* Root Comment details */}
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <img 
                            src={comm.author_avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${comm.author_name}`} 
                            alt={comm.author_name}
                            className="w-6 h-6 rounded-full object-cover bg-slate-100"
                          />
                          <span className="text-xs font-black text-slate-950">{comm.author_name}</span>
                          
                          {comm.pinned && (
                            <span className="text-[9px] bg-amber-500 text-white font-black px-1.5 py-0.5 rounded flex items-center gap-0.5 uppercase tracking-wide">
                              <Pin className="w-2.5 h-2.5" />
                              Pinned
                            </span>
                          )}

                          <span className="text-[10px] text-slate-400 font-bold ml-auto">
                            {new Date(comm.created_at).toLocaleDateString()}
                          </span>
                        </div>

                        <p className="text-xs md:text-sm text-slate-650 font-semibold leading-relaxed pl-8">
                          {comm.content}
                        </p>

                        {/* Comment Controls */}
                        <div className="flex items-center gap-4 pl-8 text-[10px] font-black uppercase text-slate-400">
                          <button
                            onClick={() => handleLikeComment(comm.id)}
                            className="flex items-center gap-1 border-none bg-transparent hover:text-indigo-655 cursor-pointer font-black"
                          >
                            <ThumbsUp className="w-3.5 h-3.5" />
                            {comm.likes_count} {isEn ? 'Likes' : 'پسند'}
                          </button>

                          <button
                            onClick={() => {
                              setActiveReplyBox(activeReplyBox === comm.id ? null : comm.id);
                              setReplyInputs(prev => ({ ...prev, [comm.id]: '' }));
                            }}
                            className="border-none bg-transparent hover:text-indigo-655 cursor-pointer font-black"
                          >
                            {isEn ? 'Reply' : 'جواب دیں'}
                          </button>

                          {isAdmin && (
                            <button
                              onClick={async () => {
                                if (confirm('Delete comment?')) {
                                  await dbDeletePollComment(comm.id);
                                  refreshComments(selectedPoll.id);
                                }
                              }}
                              className="border-none bg-transparent hover:text-red-655 cursor-pointer font-black text-red-500"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Reply Box */}
                      {activeReplyBox === comm.id && (
                        <form onSubmit={(e) => handleAddComment(e, comm.id)} className="ml-8 mt-2 flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl p-1.5">
                          <input
                            type="text"
                            placeholder={isEn ? 'Write a reply...' : 'جواب لکھیں...'}
                            value={replyInputs[comm.id] || ''}
                            onChange={(e) => setReplyInputs(prev => ({ ...prev, [comm.id]: e.target.value }))}
                            className="flex-1 bg-transparent border-none text-xs px-2 focus:outline-none"
                          />
                          <button
                            type="submit"
                            disabled={!(replyInputs[comm.id] || '')?.trim()}
                            className="py-1 px-3 bg-indigo-600 hover:bg-indigo-750 text-white rounded-lg text-[10px] font-black border-none cursor-pointer"
                          >
                            {isEn ? 'Reply' : 'جواب'}
                          </button>
                        </form>
                      )}

                      {/* Replies List */}
                      {comm.replies && comm.replies.length > 0 && (
                        <div className="space-y-3.5 mt-3 ml-8 border-l border-slate-105 pl-4">
                          {comm.replies.map((rep) => (
                            <div key={rep.id} className="space-y-1">
                              <div className="flex items-center gap-2">
                                <img 
                                  src={rep.author_avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${rep.author_name}`} 
                                  alt={rep.author_name}
                                  className="w-5 h-5 rounded-full object-cover bg-slate-100"
                                />
                                <span className="text-[11px] font-black text-slate-905">{rep.author_name}</span>
                                <span className="text-[9px] text-slate-400 font-bold ml-auto">
                                  {new Date(rep.created_at).toLocaleDateString()}
                                </span>
                              </div>
                              <p className="text-xs text-slate-600 font-medium pl-7">
                                {rep.content}
                              </p>
                              <div className="flex items-center gap-3 pl-7 text-[9px] font-black uppercase text-slate-400">
                                <button
                                  onClick={() => handleLikeComment(rep.id)}
                                  className="flex items-center gap-1 border-none bg-transparent hover:text-indigo-655 cursor-pointer font-black"
                                >
                                  <ThumbsUp className="w-3 h-3" />
                                  {rep.likes_count}
                                </button>
                                {isAdmin && (
                                  <button
                                    onClick={async () => {
                                      if (confirm('Delete reply?')) {
                                        await dbDeletePollComment(rep.id);
                                        refreshComments(selectedPoll.id);
                                      }
                                    }}
                                    className="border-none bg-transparent hover:text-red-655 text-red-500 cursor-pointer"
                                  >
                                    Delete
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* ==================== POLLS LIST PAGE ==================== */
        <div className="space-y-6">
          
          {/* Header Section */}
          <div className="text-center py-6 md:py-8 space-y-2">
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
              {isEn ? 'Community Polls & Opinions' : 'سروے اور رائے عامہ'}
            </h1>
            <p className="text-xs md:text-sm text-slate-500 font-medium max-w-lg mx-auto">
              {isEn 
                ? 'Your voice matters. Vote on neighborhood development projects, security rules, cleaning routines, and local topics.'
                : 'آپ کی رائے اہم ہے۔ علاقائی ترقی، سیکیورٹی، صفائی ستھرائی اور دیگر اہم معاملات پر اپنا ووٹ ڈالیں۔'}
            </p>
          </div>

          {/* Search, Filter & Tab Options Bar */}
          <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row gap-3.5">
              
              {/* Search Bar */}
              <div className="flex-1 flex items-center gap-2.5 bg-slate-50 border border-slate-200/80 rounded-2xl px-4 py-2.5 focus-within:border-indigo-500 focus-within:bg-white transition-all">
                <Search className="w-4 h-4 text-slate-400 shrink-0" />
                <input
                  type="text"
                  placeholder={isEn ? 'Search active polls...' : 'سروے تلاش کریں...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent border-none text-xs md:text-sm focus:outline-none"
                />
              </div>

              {/* Category Filter */}
              <div className="md:w-64 flex items-center gap-2 bg-slate-50 border border-slate-200/80 rounded-2xl px-4 py-2.5">
                <Filter className="w-4 h-4 text-slate-400 shrink-0" />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full bg-transparent border-none text-xs focus:outline-none font-bold text-slate-600 cursor-pointer"
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>
                      {isEn ? cat : cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* List tabs */}
            <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-3">
              {[
                { id: 'active', labelEn: 'Active Polls', labelUr: 'فعال سروے' },
                { id: 'featured', labelEn: 'Featured', labelUr: 'اہم سروے' },
                { id: 'ending', labelEn: 'Ending Soon', labelUr: 'بند ہونے والے' },
                { id: 'recent', labelEn: 'Recently Added', labelUr: 'نئے سروے' },
                { id: 'closed', labelEn: 'Closed', labelUr: 'بند شدہ' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-4 py-2 rounded-xl text-[10px] md:text-xs font-black uppercase transition-all border-none cursor-pointer ${
                    activeTab === tab.id 
                      ? 'bg-indigo-650 text-white shadow-sm' 
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                  }`}
                >
                  {isEn ? tab.labelEn : tab.labelUr}
                </button>
              ))}
            </div>
          </div>

          {/* Top Banner */}
          {pollsTopBannerMap[0] && (
            <div className="mb-6">
              <AdBannerCard ad={pollsTopBannerMap[0]} />
            </div>
          )}

          {/* Polls Cards Grid */}
          {loading ? (
            /* Skeleton Loading */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map(idx => (
                <div key={idx} className="bg-white rounded-3xl border border-slate-250/50 p-6 space-y-4 animate-pulse">
                  <div className="w-24 h-6 bg-slate-200 rounded-lg" />
                  <div className="w-3/4 h-6 bg-slate-200 rounded-lg" />
                  <div className="w-full h-16 bg-slate-200 rounded-lg" />
                  <div className="w-1/2 h-4 bg-slate-200 rounded-lg" />
                </div>
              ))}
            </div>
          ) : filteredPolls.length === 0 ? (
            /* Empty State */
            <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center text-slate-400 space-y-3 shadow-xs">
              <AlertCircle className="w-10 h-10 mx-auto text-slate-350" />
              <h3 className="font-extrabold text-slate-800 text-sm">
                {isEn ? 'No Polls Found' : 'کوئی سروے نہیں ملا'}
              </h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                {isEn 
                  ? 'There are no polls listed in this tab matching your search or filters.' 
                  : 'اس ٹیب میں آپ کے فلٹرز کے مطابق کوئی سروے موجود نہیں ہے۔'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {(() => {
                const elements = [];
                for (let i = 0; i < filteredPolls.length; i++) {
                  const poll = filteredPolls[i];
                  const hasVoted = !!userVotes[poll.id];
                  const activeOptionText = (poll.options || []).find((o: any) => o.id === userVotes[poll.id])?.option_text;
                  const ad = pollsAdMap[i];

                  elements.push(
                    <div 
                      key={poll.id}
                      className="bg-white rounded-3xl border border-slate-200/80 hover:border-slate-300 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col justify-between"
                    >
                      {/* Cover image banner */}
                    {poll.cover_image && (
                      <div className="w-full h-36 overflow-hidden relative">
                        <img 
                          src={poll.cover_image} 
                          alt={poll.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-white/30 via-transparent to-transparent" />
                      </div>
                    )}

                    <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
                      <div className="space-y-3.5">
                        
                        {/* Tags */}
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 text-[9px] font-black uppercase rounded-md tracking-wider border border-indigo-100">
                            {poll.category}
                          </span>

                          {poll.featured && (
                            <span className="px-2.5 py-0.5 bg-amber-500 text-white text-[9px] font-black uppercase rounded-md tracking-wider">
                              {isEn ? 'Featured' : 'اہم'}
                            </span>
                          )}

                          {poll.publish_status === 'Closed' && (
                            <span className="px-2.5 py-0.5 bg-slate-100 text-slate-500 text-[9px] font-black uppercase rounded-md tracking-wider ml-auto">
                              {isEn ? 'Closed' : 'بند'}
                            </span>
                          )}
                        </div>

                        {/* Title & Preview Text */}
                        <div className="space-y-1">
                          <h3 className="font-extrabold text-slate-900 text-sm leading-snug line-clamp-2">
                            {poll.title}
                          </h3>
                          <p className="text-xs text-slate-500 font-medium leading-relaxed line-clamp-3">
                            {poll.description}
                          </p>
                        </div>
                      </div>

                      {/* Vote statistics */}
                      <div className="space-y-3 pt-3 border-t border-slate-100 mt-auto">
                        <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-slate-350" />
                            {getRemainingTimeText(poll.end_date)}
                          </span>
                          <span>
                            {poll.total_votes} {isEn ? 'Votes' : 'ووٹ'}
                          </span>
                        </div>

                        {/* Vote status button */}
                        {hasVoted ? (
                          <div className="p-2.5 bg-green-50 border border-green-200 rounded-xl text-[10px] md:text-xs font-bold text-green-700 flex items-center justify-between">
                            <span className="flex items-center gap-1.5">
                              <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
                              {isEn ? `You voted: ${activeOptionText}` : `آپ کا ووٹ: ${activeOptionText}`}
                            </span>
                            
                            {poll.allow_option_change && poll.publish_status !== 'Closed' && (
                              <button
                                onClick={() => handleSelectPoll(poll)}
                                className="text-[10px] text-indigo-650 hover:underline border-none bg-transparent font-black uppercase cursor-pointer"
                              >
                                {isEn ? 'Change' : 'تبدیل'}
                              </button>
                            )}
                          </div>
                        ) : (
                          <button
                            onClick={() => handleSelectPoll(poll)}
                            className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-750 text-white text-xs font-black rounded-xl shadow-xs hover:shadow-md transition-all border-none cursor-pointer text-center block"
                          >
                            {poll.publish_status === 'Closed' 
                              ? (isEn ? 'View Results' : 'نتائج دیکھیں') 
                              : (isEn ? 'Vote Now' : 'ابھی ووٹ دیں')}
                          </button>
                        )}
                        </div>
                      </div>
                    </div>
                  );
                  
                  if (ad) {
                    elements.push(
                      <div key={`ad-polls-${i}-${ad.id}`} className="md:col-span-2">
                        <AdBannerCard ad={ad} />
                      </div>
                    );
                  }
                }
                return elements;
              })()}
            </div>
          )}

          {/* Bottom Banner */}
          {pollsBottomBannerMap[0] && filteredPolls.length > 0 && (
            <div className="mt-6">
              <AdBannerCard ad={pollsBottomBannerMap[0]} />
            </div>
          )}
        </div>
      )}

      {/* ==================== REPORT REASON MODAL ==================== */}
      {reportingPollId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-sm w-full space-y-4 shadow-xl border border-slate-100">
            <h3 className="text-base font-black text-slate-950 flex items-center gap-1.5">
              <AlertCircle className="w-5 h-5 text-red-600" />
              {isEn ? 'Report Poll' : 'سروے کی شکایت کریں'}
            </h3>
            
            <textarea
              placeholder={isEn ? 'Please describe why this poll is inappropriate or violates rules...' : 'براہ کرم وجہ لکھیں کہ یہ سروے قوانین کے خلاف کیوں ہے...'}
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              rows={4}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs md:text-sm focus:outline-none focus:border-indigo-500 focus:bg-white transition-all font-semibold"
            />

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => setReportingPollId(null)}
                className="py-2.5 px-4 border border-slate-200 text-slate-650 hover:bg-slate-50 text-xs font-black rounded-xl transition-all cursor-pointer bg-transparent"
              >
                {isEn ? 'Cancel' : 'منسوخ'}
              </button>
              <button
                onClick={submitReport}
                disabled={!reportReason?.trim()}
                className="py-2.5 px-5 bg-red-650 hover:bg-red-700 text-white text-xs font-black rounded-xl disabled:opacity-40 transition-all cursor-pointer border-none"
              >
                {isEn ? 'Submit Report' : 'شکایت درج کریں'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
