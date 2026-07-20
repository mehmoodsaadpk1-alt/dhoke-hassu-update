import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { AdItem } from '../types';
import { adAnalytics } from '../utils/adAnalytics';
import AdImageViewer from './AdImageViewer';

interface PremiumAdPopupProps {
  ad: AdItem;
  onClose: () => void;
  onNavigateToModule?: (module: string, itemId: string) => void;
}

const PremiumAdPopup: React.FC<PremiumAdPopupProps> = ({ ad, onClose, onNavigateToModule }) => {
  const [showImageViewer, setShowImageViewer] = useState(false);

  // Record impression on mount
  useEffect(() => {
    adAnalytics.recordImpression(ad.id);
  }, [ad.id]);

  const handleNavigateToModule = (module: string, itemId?: string) => {
    if (onNavigateToModule) {
      onNavigateToModule(module, itemId || '');
    }
  };

  const handleAction = async () => {
    await adAnalytics.recordClick(ad.id);
    const link = ad.cta_link || '';
    if (ad.cta_type === 'WhatsApp') {
      window.open(`https://wa.me/${link.replace(/[^0-9]/g, '') || ad.advertiser_phone}`, '_blank');
    } else if (ad.cta_type === 'Phone Call') {
      window.location.href = `tel:${link || ad.advertiser_phone}`;
    } else if (['Open Business', 'Marketplace Item', 'Property Listing', 'Job Listing'].includes(ad.cta_type)) {
      const mod = ad.cta_type.split(' ')[0].toLowerCase();
      handleNavigateToModule(mod, link);
    } else {
      window.open(link.startsWith('http') ? link : `https://${link}`, '_blank');
    }
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 bg-slate-950 z-[9999] flex flex-col items-center justify-center p-6 text-white backdrop-blur-sm">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 relative flex flex-col justify-between shadow-2xl animate-in fade-in zoom-in duration-300">
          
          {/* Close button inside the card, as requested "Include a visible X (Close) button" */}
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-slate-800/50 hover:bg-slate-700 text-slate-400 hover:text-white rounded-full transition-all cursor-pointer z-10"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="text-center space-y-1">
            <span className="bg-amber-500 text-slate-950 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full tracking-widest">
              Sponsored Advertisement
            </span>
            <p className="text-xs text-slate-400 mt-2 font-mono">from {ad.advertiser_name}</p>
          </div>
          
          {(ad.banner_url || (ad.images && ad.images.length > 0)) && (
            <div 
              onClick={() => setShowImageViewer(true)}
              className="w-full aspect-[4/3] rounded-2xl overflow-hidden border border-slate-800 shadow-inner bg-slate-950 cursor-zoom-in group/splash relative"
            >
              <img 
                src={ad.banner_url || (ad.images && ad.images[0]) || ''} 
                alt="" 
                className="w-full h-full object-cover group-hover/splash:scale-105 transition-transform duration-350" 
              />
            </div>
          )}
          
          <div className="text-center space-y-2">
            <h2 className="text-lg font-black tracking-tight leading-snug">{ad.title}</h2>
            <p className="text-xs text-slate-400 leading-normal line-clamp-3">{ad.description}</p>
            {ad.advertiser_phone && (
              <p className="text-sm font-bold text-slate-300 mt-2">{ad.advertiser_phone}</p>
            )}
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={handleAction}
              className="flex-1 py-3 bg-amber-600 hover:bg-amber-700 text-white font-extrabold rounded-xl text-xs shadow-md border-0 cursor-pointer transition-all flex items-center justify-center gap-2"
            >
              {ad.cta_type === 'Phone Call' ? '📞 Call Now' : ad.cta_type === 'WhatsApp' ? '💬 WhatsApp' : 'Learn More'}
            </button>
            <button
              onClick={onClose}
              className="px-5 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-extrabold rounded-xl text-xs border-0 cursor-pointer transition-all"
            >
              Skip
            </button>
          </div>
        </div>
      </div>

      {showImageViewer && (
        <AdImageViewer 
          ad={ad} 
          onClose={() => {
            setShowImageViewer(false);
          }} 
          onNavigateToModule={handleNavigateToModule} 
        />
      )}
    </>
  );
};

export default PremiumAdPopup;
