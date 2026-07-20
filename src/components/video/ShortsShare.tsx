import React from 'react';
import { BottomSheet } from '../ui/BottomSheet';
import { Copy, Facebook, MessageCircle, Send, Twitter, Link as LinkIcon } from 'lucide-react';

interface ShortsShareProps {
  videoId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ShortsShare: React.FC<ShortsShareProps> = ({ videoId, isOpen, onClose }) => {

  const shareUrl = `${window.location.origin}/shorts/${videoId}`;

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Check out this Short on Dhoke Hassu Connect!',
          url: shareUrl,
        });
        onClose();
      } catch (err) {
        console.error('Share API failed or user cancelled', err);
      }
    } else {
      handleCopyLink();
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      alert('Link copied to clipboard!');
      onClose();
    } catch (e) {
      console.error(e);
      prompt("Copy this link:", shareUrl);
    }
  };

  const shareTargets = [
    { name: 'Copy Link', icon: LinkIcon, color: 'bg-gray-700', action: handleCopyLink },
    { name: 'WhatsApp', icon: MessageCircle, color: 'bg-green-500', url: `https://wa.me/?text=${encodeURIComponent(shareUrl)}` },
    { name: 'Facebook', icon: Facebook, color: 'bg-blue-600', url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}` },
    { name: 'X (Twitter)', icon: Twitter, color: 'bg-black border border-gray-700', url: `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}` },
    { name: 'Telegram', icon: Send, color: 'bg-blue-500', url: `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}` },
  ];

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Share to" height="auto">
      <div className="p-4 bg-gray-900 pb-8">
        
        {/* Native Share Highlight */}
        {navigator.share && (
          <button 
            onClick={handleNativeShare}
            className="w-full mb-6 flex items-center justify-center space-x-2 bg-white text-black font-semibold py-3 rounded-xl hover:bg-gray-200 transition-colors"
          >
            <ShareIcon size={18} />
            <span>Share via Device</span>
          </button>
        )}

        {/* Social Grid */}
        <div className="grid grid-cols-4 gap-y-6">
          {shareTargets.map(target => (
            <div key={target.name} className="flex flex-col items-center justify-start cursor-pointer" onClick={() => {
              if (target.action) {
                target.action();
              } else if (target.url) {
                window.open(target.url, '_blank', 'noopener,noreferrer');
                onClose();
              }
            }}>
              <div className={`w-14 h-14 rounded-full flex items-center justify-center text-white mb-2 shadow-lg ${target.color}`}>
                <target.icon size={24} />
              </div>
              <span className="text-xs text-gray-400 text-center">{target.name}</span>
            </div>
          ))}
        </div>
      </div>
    </BottomSheet>
  );
};

const ShareIcon = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path>
    <polyline points="16 6 12 2 8 6"></polyline>
    <line x1="12" y1="2" x2="12" y2="15"></line>
  </svg>
);
