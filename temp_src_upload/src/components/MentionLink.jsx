import React from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Renders a styled, accessible link for a mention.
 * Uses react-router navigation to avoid full page reload.
 */
export default function MentionLink({ type, identifier, display }) {
  const navigate = useNavigate();

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
    navigate(path);
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

