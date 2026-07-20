import React, { useEffect, useState } from 'react';
import { ExternalLink, Phone, MessageSquare, Briefcase, Building2, Store, ShoppingBag } from 'lucide-react';
import { AdItem } from '../types';
import { adAnalytics } from '../utils/adAnalytics';
import AdImageViewer from './AdImageViewer';

interface AdBannerCardProps {
  ad: AdItem;
  onNavigateToModule?: (module: string, itemId: string) => void;
}

export default function AdBannerCard({ ad, onNavigateToModule }: AdBannerCardProps) {
  const [showViewer, setShowViewer] = useState(false);

  useEffect(() => {
    if (!ad?.id) return;
    
    // Track impression immediately
    adAnalytics.recordImpression(ad.id);

    // Track view after 2 seconds of continuous visibility (mount)
    const viewTimer = setTimeout(() => {
      adAnalytics.recordView(ad.id);
    }, 2000);

    return () => clearTimeout(viewTimer);
  }, [ad?.id]);

  const handleCtaClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!ad?.id) return;
    
    // Track click
    await adAnalytics.recordClick(ad.id);

    // Perform CTA Action
    const link = ad.cta_link || '';
    switch (ad.cta_type) {
      case 'WhatsApp':
        const cleanPhone = link.replace(/[^0-9]/g, '');
        window.open(`https://wa.me/${cleanPhone || ad.advertiser_phone}`, '_blank');
        break;
      case 'Phone Call':
        window.location.href = `tel:${link || ad.advertiser_phone}`;
        break;
      case 'Website':
      case 'External Link':
        window.open(link.startsWith('http') ? link : `https://${link}`, '_blank');
        break;
      case 'Open Business':
        if (onNavigateToModule) onNavigateToModule('business', link);
        break;
      case 'Marketplace Item':
        if (onNavigateToModule) onNavigateToModule('marketplace', link);
        break;
      case 'Property Listing':
        if (onNavigateToModule) onNavigateToModule('property', link);
        break;
      case 'Job Listing':
        if (onNavigateToModule) onNavigateToModule('jobs', link);
        break;
      default:
        if (link) window.open(link, '_blank');
    }
  };

  const getCtaIcon = () => {
    switch (ad.cta_type) {
      case 'WhatsApp': return <MessageSquare className="w-3.5 h-3.5" />;
      case 'Phone Call': return <Phone className="w-3.5 h-3.5" />;
      case 'Open Business': return <Store className="w-3.5 h-3.5" />;
      case 'Marketplace Item': return <ShoppingBag className="w-3.5 h-3.5" />;
      case 'Property Listing': return <Building2 className="w-3.5 h-3.5" />;
      case 'Job Listing': return <Briefcase className="w-3.5 h-3.5" />;
      default: return <ExternalLink className="w-3.5 h-3.5" />;
    }
  };

  const getCtaLabel = () => {
    switch (ad.cta_type) {
      case 'WhatsApp': return 'WhatsApp Us';
      case 'Phone Call': return 'Call Now';
      case 'Website': return 'Visit Website';
      case 'External Link': return 'Learn More';
      case 'Open Business': return 'View Business';
      case 'Marketplace Item': return 'Buy Now';
      case 'Property Listing': return 'View Property';
      case 'Job Listing': return 'Apply Now';
      default: return 'Learn More';
    }
  };

  return (
    <div className="bg-gradient-to-br from-amber-50/70 to-orange-50/40 border border-amber-200/80 rounded-2xl p-4.5 shadow-sm relative overflow-hidden flex flex-col md:flex-row gap-4 transition-all hover:shadow-md hover:border-amber-300">
      {/* Sponsored Badge */}
      <span className="absolute top-3 right-3 bg-amber-500/10 text-amber-800 text-[9px] font-black tracking-widest px-2 py-0.5 rounded-full uppercase border border-amber-200/40">
        📢 Sponsored Promotion
      </span>

      {/* Ad Image - Click opens lightbox viewer */}
      {ad.banner_url && (
        <div 
          onClick={() => setShowViewer(true)}
          className="w-full md:w-48 h-36 rounded-xl overflow-hidden border border-amber-200/60 shrink-0 bg-white shadow-sm cursor-zoom-in group/img relative"
        >
          <img src={ad.banner_url} alt={ad.title} className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-350" />
        </div>
      )}

      {/* Ad Content */}
      <div className="flex-1 flex flex-col justify-between min-w-0">
        <div className="space-y-1">
          <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">{ad.advertiser_name}</p>
          <h4 className="text-sm font-extrabold text-slate-900 leading-snug">{ad.title}</h4>
          <p className="text-xs text-slate-650 leading-normal line-clamp-2">{ad.description}</p>
        </div>

        <div className="flex items-center justify-between gap-4 mt-3 pt-2 border-t border-amber-100/50">
          <span className="text-[9px] text-slate-450 font-mono font-bold">Category: {ad.category}</span>
          <button
            onClick={handleCtaClick}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-extrabold rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-all border-0 cursor-pointer shadow-amber-500/10 shrink-0"
          >
            {getCtaIcon()}
            <span>{getCtaLabel()}</span>
          </button>
        </div>
      </div>

      {/* Full screen advertisement image viewer modal */}
      {showViewer && (
        <AdImageViewer 
          ad={ad} 
          onClose={() => setShowViewer(false)} 
          onNavigateToModule={onNavigateToModule} 
        />
      )}
    </div>
  );
}
