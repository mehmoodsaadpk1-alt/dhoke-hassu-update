import React, { useEffect, useState } from 'react';
import { dbGetOnlineStatus, supabase } from '../utils/supabaseClient';
import { useLanguage } from '../context/LanguageContext';

interface OnlineIndicatorProps {
  userId: string;
  viewerId?: string;
  children: React.ReactNode;
  showText?: boolean;
  className?: string;
  textClassName?: string;
}

export default function OnlineIndicator({ 
  userId, 
  viewerId, 
  children, 
  showText = false,
  className = '',
  textClassName = 'text-xs text-slate-500'
}: OnlineIndicatorProps) {
  const [isOnline, setIsOnline] = useState(false);
  const [lastSeenText, setLastSeenText] = useState<string | null>(null);
  const { currentLanguage } = useLanguage();
  const isEn = currentLanguage === 'en';

  useEffect(() => {
    let isMounted = true;
    
    async function fetchStatus() {
      if (!viewerId) return;
      const res = await dbGetOnlineStatus(viewerId, userId);
      if (isMounted) {
        setIsOnline(res.isOnline);
        setLastSeenText(res.lastSeenText);
      }
    }
    
    fetchStatus();

    return () => { isMounted = false; };
  }, [userId, viewerId]);

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="relative inline-block">
        {children}
        {isOnline && (
          <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full z-10" />
        )}
      </div>
      {showText && (
        <span className={textClassName}>
          {isOnline ? (isEn ? 'Online' : 'آن لائن') : (lastSeenText || '')}
        </span>
      )}
    </div>
  );
}
