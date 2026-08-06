import React from 'react';

/**
 * Renders a styled, accessible link for a mention.
 * Uses window.history navigation for seamless SPA routing without requiring React Router context.
 */
export default function MentionLink({ type, identifier, display }) {
  const handleClick = (e) => {
    e.preventDefault();
    let path = '';
    switch (type) {
      case 'user':
        path = `/profile/${identifier}`;
        break;
      case 'page':
        path = `/pages/${identifier}`;
        break;
      case 'group':
        path = `/social-groups/${identifier}`;
        break;
      default:
        break;
    }
    if (path) {
      window.history.pushState({}, '', path);
      window.dispatchEvent(new Event('popstate'));
    }
  };

  return (
    <a
      href="#"
      onClick={handleClick}
      className="mention-link text-blue-600 font-semibold hover:underline cursor-pointer"
      aria-label={`Open ${type} ${display}`}
    >
      {display}
    </a>
  );
}

