import React from 'react';

export interface AppAvatarProps {
  name: string;
  avatar?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | number;
  isOnline?: boolean;
  isVerified?: boolean;
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
  clickable?: boolean;
}

export const AppAvatar: React.FC<AppAvatarProps> = ({
  name,
  avatar,
  size = 'md',
  isOnline = false,
  isVerified = false,
  className = '',
  onClick,
  clickable = true,
}) => {
  const sizeMap = {
    sm: 28,
    md: 36,
    lg: 48,
    xl: 64,
  };

  const pixelSize = typeof size === 'number' ? size : sizeMap[size];

  const handleClick = (e: React.MouseEvent) => {
    if (onClick) {
      onClick(e);
      return;
    }
    if (clickable) {
      e.stopPropagation();
      e.preventDefault();
      const openUser = (window as any).openUserProfile;
      if (openUser) {
        openUser(name, avatar);
      } else {
        const url = `/profile/view?name=${encodeURIComponent(name)}${avatar ? `&avatar=${encodeURIComponent(avatar)}` : ''}`;
        window.history.pushState({}, '', url);
        window.dispatchEvent(new Event('popstate'));
      }
    }
  };

  const containerStyle: React.CSSProperties = {
    width: pixelSize,
    height: pixelSize,
    position: 'relative',
  };

  const imgStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    borderRadius: '50%',
    objectFit: 'cover',
  };

  return (
    <div 
      style={containerStyle} 
      className={`shrink-0 select-none ${clickable || onClick ? 'cursor-pointer hover:ring-2 hover:ring-blue-400 hover:ring-offset-1 transition-all' : ''} ${className}`}
      onClick={handleClick}
      role={clickable || onClick ? "button" : "img"}
      aria-label={`${name}'s avatar`}
      tabIndex={clickable || onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if ((e.key === 'Enter' || e.key === ' ') && (clickable || onClick)) {
          e.preventDefault();
          const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true });
          handleClick(clickEvent as any);
        }
      }}
    >
      {avatar ? (
        <img
          src={avatar}
          alt={name}
          style={imgStyle}
          className="border border-slate-200/60 shadow-inner"
          onError={(e) => {
            // Fallback to initials if source load fails
            (e.target as HTMLImageElement).style.display = 'none';
            const fallbackDiv = e.currentTarget.parentElement?.querySelector('.avatar-fallback');
            if (fallbackDiv) {
              fallbackDiv.classList.remove('hidden');
            }
          }}
        />
      ) : null}

      <div
        className={`avatar-fallback w-full h-full rounded-full bg-blue-50 text-blue-600 font-extrabold flex items-center justify-center border border-slate-200/60 shadow-inner text-sm uppercase ${avatar ? 'hidden absolute inset-0' : ''}`}
        style={{ fontSize: pixelSize > 40 ? '1.1rem' : '0.85rem' }}
      >
        {name.substring(0, 2).toUpperCase()}
      </div>

      {/* Online indicator badge */}
      {isOnline && (
        <span 
          className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-success ring-2 ring-white" 
          title="Online"
        />
      )}

      {/* Verified overlay badge */}
      {isVerified && !isOnline && (
        <span className="absolute -bottom-0.5 -right-0.5 bg-primary text-white rounded-full p-0.5 shadow-sm border border-white" style={{ width: '13px', height: '13px' }}>
          <svg className="w-full h-full stroke-white fill-none" viewBox="0 0 24 24" style={{ strokeWidth: 4 }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </span>
      )}
    </div>
  );
};
