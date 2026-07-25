import React from 'react';
import MentionLink from './MentionLink';
interface RichTextProps {
  content: string;
  className?: string;
}

export default function RichText({ content, className = '' }: RichTextProps) {
  if (!content) return null;

  // We want to safely split and render the text, matching @username and #hashtag
  // Regex matches @username or #hashtag. 
  // It uses a capturing group so `split` includes the matches in the array.
  const regex = /([@#][A-Za-z0-9_]+)/g;
  
  const parts = content?.split(regex);

  const handleNavigate = (e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
    e.preventDefault();
    window.history.pushState({}, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  return (
    <span className={`whitespace-pre-wrap break-words ${className}`}>
      {parts.map((part, i) => {
        if (part.startsWith('@')) {
          const identifier = part?.slice(1);
          return (
            <MentionLink
              key={i}
              type="user"
              identifier={identifier}
              display={part}
            />
          );
        } else if (part.startsWith('#')) {

          const tag = part?.slice(1);
          return (
            <a 
              key={i} 
              href={`/hashtag/${tag?.toLowerCase()}`} 
              className="text-emerald-600 font-semibold hover:underline"
              onClick={(e) => { e.stopPropagation(); handleNavigate(e, `/hashtag/${tag?.toLowerCase()}`); }}
            >
              {part}
            </a>
          );
        } else {
          return <React.Fragment key={i}>{part}</React.Fragment>;
        }
      })}
    </span>
  );
}

