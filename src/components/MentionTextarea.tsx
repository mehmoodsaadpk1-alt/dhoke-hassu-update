import React, { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { dbSearchUsers, dbGetPages, dbGetSocialGroups } from '../utils/supabaseClient';
import { User, Page, Group } from '../types';
import { CheckCircle } from 'lucide-react';

interface MentionTextareaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  rows?: number;
}

type SuggestionType = 'user' | 'page' | 'group' | 'hashtag';

interface Suggestion {
  id: string;
  display: string;
  username: string; // the string that gets inserted (e.g. "@johndoe" or "#jobs")
  avatar?: string;
  verified?: boolean;
  type: SuggestionType;
}

export default function MentionTextarea({ value, onChange, placeholder, className, rows = 3 }: MentionTextareaProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(0);
  const [triggerPos, setTriggerPos] = useState(-1);
  const [triggerType, setTriggerType] = useState<'@' | '#' | null>(null);
  const [query, setQuery] = useState('');
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const fetchSuggestions = async (searchQuery: string, type: '@' | '#') => {
    if (type === '#') {
      // Mocking hashtag search for now, to be connected to dbSearchHashtags
      setSuggestions([
        { id: 'jobs', display: 'Jobs', username: 'Jobs', type: 'hashtag' },
        { id: 'property', display: 'Property', username: 'Property', type: 'hashtag' },
        { id: 'dhokehassu', display: 'DhokeHassu', username: 'DhokeHassu', type: 'hashtag' }
      ].filter(h => h.username?.toLowerCase().includes(searchQuery?.toLowerCase())));
      return;
    }

    if (type === '@') {
      try {
        const users = await dbSearchUsers(searchQuery);
        // Optionally fetch pages and groups if query is short
        let pages: Page[] = [];
        if (searchQuery.length > 1) {
          const allPages = await dbGetPages();
          pages = allPages.filter(p => p.name?.toLowerCase().includes(searchQuery?.toLowerCase()) || p.slug?.toLowerCase().includes(searchQuery?.toLowerCase()))?.slice(0, 3);
        }

        const mappedUsers: Suggestion[] = users.map((u: any) => ({
          id: u.id,
          display: u.fullName,
          username: u.username || u.fullName.replace(/\s+/g, '')?.toLowerCase(),
          avatar: u.profilePhoto,
          verified: u.verified,
          type: 'user'
        }));

        const mappedPages: Suggestion[] = pages.map(p => ({
          id: p.id,
          display: p.name,
          username: p.slug,
          avatar: p.logo_url,
          verified: true, // Pages could have verification
          type: 'page'
        }));

        setSuggestions([...mappedUsers, ...mappedPages]?.slice(0, 10));
      } catch (e) {
        console.error("Error fetching suggestions", e);
      }
    }
  };

  useEffect(() => {
    if (triggerType && triggerPos !== -1) {
      // Show dropdown immediately when trigger is active
      setShowSuggestions(true);
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = setTimeout(() => {
        fetchSuggestions(query, triggerType);
      }, 300);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [query, triggerType, triggerPos]);

  useEffect(() => {
    if (suggestions.length > 0) {
      setActiveSuggestionIndex(0);
    }
    // Visibility of suggestions is controlled by the trigger effect
  }, [suggestions]);

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    onChange(text);

    const cursorPos = e.target.selectionStart;
    const textBeforeCursor = text?.slice(0, cursorPos);
    
    // Check if we are currently typing a mention or hashtag
    const match = textBeforeCursor.match(/([@#])([\w_]*)$/);
    
    if (match) {
      const type = match[1] as '@' | '#';
      const currentQuery = match[2];
      setTriggerType(type);
      setTriggerPos(cursorPos - currentQuery.length - 1);
      setQuery(currentQuery);
    } else {
      setTriggerType(null);
      setTriggerPos(-1);
      setShowSuggestions(false);
    }
  };

  const insertSuggestion = (suggestion: Suggestion) => {
    if (triggerPos === -1 || !triggerType) return;
    
    const textBefore = value?.slice(0, triggerPos);
    const textAfter = value?.slice(textareaRef.current?.selectionStart || value.length);
    const insertion = `${triggerType}${suggestion.username} `;
    
    const newText = textBefore + insertion + textAfter;
    onChange(newText);
    
    setTriggerType(null);
    setTriggerPos(-1);
    setShowSuggestions(false);
    setQuery('');
    
    // Focus back and set cursor
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        const newCursorPos = triggerPos + insertion.length;
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 10);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (showSuggestions) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveSuggestionIndex(prev => Math.min(prev + 1, suggestions.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveSuggestionIndex(prev => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        if (suggestions[activeSuggestionIndex]) {
          insertSuggestion(suggestions[activeSuggestionIndex]);
        }
      } else if (e.key === 'Escape') {
        setShowSuggestions(false);
        setTriggerType(null);
        setTriggerPos(-1);
      }
    }
  };

  return (
    <div className="relative w-full">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleInput}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={className || "w-full bg-slate-50 hover:bg-slate-100/70 focus:bg-white focus:ring-2 focus:ring-emerald-100 border-0 rounded-2xl py-2.5 px-4 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none transition-all resize-none min-h-[60px]"}
        rows={rows}
      />
      {showSuggestions && (
          <div className="absolute z-50 bottom-full start-0 mb-1 w-64 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden">
            {suggestions.length > 0 ? (
              <ul className="max-h-48 overflow-y-auto py-1">
                {suggestions.map((s, index) => (
                  <li
                    key={`${s.type}-${s.id}`}
                    className={`px-3 py-2 flex items-center gap-3 cursor-pointer transition-colors ${
                      index === activeSuggestionIndex ? 'bg-emerald-50' : 'hover:bg-slate-50'
                    }`}
                    onMouseDown={(e) => {
                      e.preventDefault(); // prevent losing focus
                      insertSuggestion(s);
                    }}
                    onMouseEnter={() => setActiveSuggestionIndex(index)}
                  >
                    {s.avatar ? (
                      <img src={s.avatar} alt={s.display} className="w-6 h-6 rounded-full object-cover bg-slate-100" />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-[10px]">
                        {s.type === 'hashtag' ? '#' : s.display?.charAt(0)?.toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-bold text-slate-900 truncate">{s.display}</span>
                        {s.verified && <CheckCircle className="w-3 h-3 text-emerald-500 shrink-0" />}
                      </div>
                      <span className="text-[10px] text-slate-500 font-medium truncate">
                        {s.type === 'hashtag' ? 'Hashtag' : `@${s.username}`}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="px-3 py-2 text-sm text-slate-500">No results</div>
            )}
          </div>
        )}
    </div>
  );
}

