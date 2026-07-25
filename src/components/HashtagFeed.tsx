import React, { useEffect, useState } from 'react';
import { supabase } from '../utils/supabaseClient';
import PostCard from './PostCard';
import { Post } from '../types';
import { ArrowLeft, Hash } from 'lucide-react';
import TrendingHashtags from './TrendingHashtags';

export default function HashtagFeed({ currentLanguage }: { currentLanguage: 'en' | 'ur' }) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Extract tag from path: /hashtag/:tag
  const pathParts = window.location.pathname?.split('/');
  const tag = pathParts[pathParts.length - 1];

  const handleBack = () => {
    window.history.back();
  };

  const handleNavigateToProfile = (userId: string) => {
    window.history.pushState({}, '', `/profile/${userId}`);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      // Basic implementation for fetching posts by hashtag
      // A more robust implementation would use a text search vector or explicit hashtag relations table
      if (tag) {
        const { data, error } = await supabase
          .from('posts')
          .select('*')
          .ilike('text_content', `%#${tag}%`)
          .order('created_at', { ascending: false })
          .limit(20);

        if (!error && data) {
          const mappedPosts = data.map((p: any) => ({
            id: p.id,
            userId: p.user_id,
            author: p.author_name || 'User',
            authorAvatar: p.author_avatar,
            time: new Date(p.created_at).toLocaleDateString(),
            content: p.text_content,
            image: p.image_url,
            likes: p.likes || 0,
            commentsCount: p.commentsCount || 0,
            postType: p.post_type || 'general'
          }));
          setPosts(mappedPosts);
        }
      }
      setLoading(false);
    };

    fetchPosts();
  }, [tag]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <button 
        onClick={handleBack} 
        className="mb-6 flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-5 h-5" />
        <span className="font-semibold">{currentLanguage === 'en' ? 'Back' : 'واپس'}</span>
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 flex items-center gap-4">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
              <Hash className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900">#{tag}</h1>
              <p className="text-slate-500 font-medium">
                {posts.length} {currentLanguage === 'en' ? 'Posts' : 'پوسٹس'}
              </p>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-10 text-slate-500 font-semibold">Loading...</div>
          ) : posts.length > 0 ? (
            <div className="space-y-6">
              {posts.map(post => (
                <PostCard 
                  key={post.id} 
                  post={post}
                  isLiked={false}
                  likeCount={post.likes}
                  onLike={() => {}}
                  onComment={() => {}}
                  onShare={() => {}}
                  currentLanguage={currentLanguage}
                  onNavigateToProfile={() => handleNavigateToProfile(post.userId)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-slate-500 font-semibold bg-white rounded-3xl border border-slate-200">
              {currentLanguage === 'en' ? 'No posts found for this hashtag.' : 'اس ہیش ٹیگ کے لیے کوئی پوسٹ نہیں ملی۔'}
            </div>
          )}
        </div>

        <div className="lg:col-span-1">
          <TrendingHashtags currentLanguage={currentLanguage} />
        </div>
      </div>
    </div>
  );
}

