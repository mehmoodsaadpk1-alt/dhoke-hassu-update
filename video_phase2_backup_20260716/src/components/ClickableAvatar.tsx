import React from 'react';

interface ClickableAvatarProps {
  /** Optional user ID for profile navigation */
  userId?: string;
  /** Display name of the user (used for lookup and fallback initial) */
  name: string;
  /** Avatar image URL */
  avatar?: string;
  /** Pixel size of the avatar circle (default 36) */
  size?: number;
  /** Extra CSS classes */
  className?: string;
  /** If true, also renders the name as a clickable link next to the avatar */
  showName?: boolean;
  /** Extra CSS classes for the name text */
  nameClassName?: string;
  /** Optional children to render after the avatar (e.g. verification badge) */
  children?: React.ReactNode;
}

/**
 * Reusable clickable avatar/name component.
 * Navigates to /profile/:userId using the existing SPA routing.
 * Prevents event bubbling so parent handlers (e.g. conversation select) are NOT triggered.
 */
const ClickableAvatar: React.FC<ClickableAvatarProps> = ({
  userId,
  name,
  avatar,
  size = 36,
  className = '',
  showName = false,
  nameClassName = '',
  children,
}) => {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const resolvedId = userId || name;
    console.log('Opening profile for:', resolvedId);
    const url = `/profile/${encodeURIComponent(resolvedId)}?name=${encodeURIComponent(name)}${avatar ? `&avatar=${encodeURIComponent(avatar)}` : ''}`;
    window.history.pushState({}, '', url);
    window.dispatchEvent(new Event('popstate'));
  };

  const imgStyle: React.CSSProperties = {
    width: size,
    height: size,
    minWidth: size,
    minHeight: size,
    borderRadius: '50%',
    objectFit: 'cover',
    cursor: 'pointer',
    pointerEvents: 'auto',
    position: 'relative',
    zIndex: 5,
  };

  const fallbackStyle: React.CSSProperties = {
    ...imgStyle,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  return (
    <>
      {avatar ? (
        <img
          src={avatar}
          alt={name}
          style={imgStyle}
          className={`border border-slate-100 shrink-0 hover:ring-2 hover:ring-blue-400 hover:ring-offset-1 transition-all ${className}`}
          onClick={handleClick}
          role="button"
          tabIndex={0}
          title={`View ${name}'s profile`}
        />
      ) : (
        <div
          style={fallbackStyle}
          className={`bg-blue-50 text-blue-600 font-bold text-sm shrink-0 hover:ring-2 hover:ring-blue-400 hover:ring-offset-1 transition-all ${className}`}
          onClick={handleClick}
          role="button"
          tabIndex={0}
          title={`View ${name}'s profile`}
        >
          {name?.charAt(0)?.toUpperCase()}
        </div>
      )}
      {showName && (
        <span
          onClick={handleClick}
          className={`cursor-pointer hover:text-blue-600 hover:underline transition-colors ${nameClassName}`}
          role="link"
          tabIndex={0}
          title={`View ${name}'s profile`}
        >
          {name}
        </span>
      )}
      {children}
    </>
  );
};

export default ClickableAvatar;
