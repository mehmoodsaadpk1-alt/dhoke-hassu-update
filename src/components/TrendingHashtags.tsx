import React, { useEffect, useState } from 'react';
import { dbGetTrendingHashtags, Hashtag } from '../utils/hashtagService';
import { TrendingUp } from 'lucide-react';

interface TrendingHashtagsProps {
  currentLanguage: 'en' | 'ur';
}

export default function TrendingHashtags({ currentLanguage }: TrendingHashtagsProps) {
  const isEn = currentLanguage === 'en';
  const [trending, setTrending] = useState<Hashtag[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrending = async () => {
      setLoading(true);
      const tags = await dbGetTrendingHashtags(5);
      setTrending(tags);
      setLoading(false);
    };
    fetchTrending();
  }, []);

  if (loading || trending.length === 0) return null;

  const handleNavigate = (e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
    e.preventDefault();
    window.history.pushState({}, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm mb-6">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-5 h-5 text-red-500" />
        <h3 className="font-bold text-slate-900">{isEn ? 'Trending' : 'ٹرینڈنگ'}</h3>
      </div>
      <ul className="space-y-3">
        {trending.map(t => (
          <li key={t.id} className="flex justify-between items-center group">
            <a 
              href={`/hashtag/${t.tag}`} 
              className="font-bold text-slate-700 group-hover:text-blue-600 transition-colors"
              onClick={(e) => handleNavigate(e, `/hashtag/${t.tag}`)}
            >
              #{t.tag}
            </a>
            <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
              {t.count} {isEn ? 'posts' : 'پوسٹس'}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
