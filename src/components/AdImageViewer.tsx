import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, MessageSquare, Phone, Store, ShoppingBag, Building2, Briefcase, ExternalLink, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { AdItem } from '../types';
import { adAnalytics } from '../utils/adAnalytics';

interface AdImageViewerProps {
  ad: AdItem;
  onClose: () => void;
  onNavigateToModule?: (module: string, itemId: string) => void;
}

export default function AdImageViewer({ ad, onClose, onNavigateToModule }: AdImageViewerProps) {
  const imagesList = ad.images && ad.images.length > 0 ? ad.images : [ad.banner_url || ''];
  const [currentIdx, setCurrentIdx] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const initialPinchDistRef = useRef<number | null>(null);

  // Focus trap ref
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Trigger impression and click (for opening viewer) tracking once per preview open
  useEffect(() => {
    if (ad?.id) {
      adAnalytics.recordImpression(ad.id);
      adAnalytics.recordClick(ad.id); // Counting opening full-screen viewer as a click
    }
  }, [ad?.id]);

  // Track zoom engagement
  const trackZoomEngagement = useCallback(() => {
    if (ad?.id) {
      adAnalytics.trackZoomEngagement(ad.id, ad.title);
    }
  }, [ad]);

  // Reset zoom and error states on image change
  const resetImageState = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setIsLoading(true);
    setHasError(false);
  }, []);

  const handleNext = useCallback(() => {
    setCurrentIdx((prev) => (prev + 1) % imagesList.length);
    resetImageState();
  }, [imagesList.length, resetImageState]);

  const handlePrev = useCallback(() => {
    setCurrentIdx((prev) => (prev - 1 + imagesList.length) % imagesList.length);
    resetImageState();
  }, [imagesList.length, resetImageState]);

  // Zoom manipulation
  const handleZoomIn = () => {
    setZoom((z) => {
      const next = Math.min(z + 0.5, 4);
      if (next > z) trackZoomEngagement();
      return next;
    });
  };

  const handleZoomOut = () => {
    setZoom((z) => {
      const next = Math.max(z - 0.5, 1);
      if (next === 1) setPan({ x: 0, y: 0 });
      return next;
    });
  };

  const handleZoomReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleDoubleClick = () => {
    if (zoom > 1) {
      handleZoomReset();
    } else {
      setZoom(2.5);
      trackZoomEngagement();
    }
  };

  // Keyboard navigation & Accessibility
  useEffect(() => {
    // Focus close button on mount
    closeButtonRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, handleNext, handlePrev]);

  // Mouse wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = 0.1;
    setZoom((z) => {
      const next = Math.max(1, Math.min(4, z - e.deltaY * zoomFactor * 0.01));
      if (next > 1 && next !== z) {
        trackZoomEngagement();
      }
      if (next === 1) {
        setPan({ x: 0, y: 0 });
      }
      return next;
    });
  };

  // Panning & dragging handlers (Desktop / Mouse)
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom === 1) return; // Only drag when zoomed in
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || zoom === 1) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch Swipe, Panning & Pinch to Zoom
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      // Single touch: Swipe or Pan
      const touch = e.touches[0];
      touchStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now()
      };
      if (zoom > 1) {
        setIsDragging(true);
        setDragStart({ x: touch.clientX - pan.x, y: touch.clientY - pan.y });
      }
    } else if (e.touches.length === 2) {
      // Double touch: Pinch
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      initialPinchDistRef.current = dist;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && touchStartRef.current) {
      const touch = e.touches[0];
      if (zoom > 1 && isDragging) {
        // Pan
        setPan({
          x: touch.clientX - dragStart.x,
          y: touch.clientY - dragStart.y
        });
      }
    } else if (e.touches.length === 2 && initialPinchDistRef.current) {
      // Pinch to zoom
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const diff = dist / initialPinchDistRef.current;
      setZoom((z) => {
        const next = Math.max(1, Math.min(4, z * (diff > 1 ? 1.05 : 0.95)));
        if (next === 1) setPan({ x: 0, y: 0 });
        return next;
      });
      initialPinchDistRef.current = dist;
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    setIsDragging(false);
    initialPinchDistRef.current = null;

    if (e.touches.length === 0 && touchStartRef.current && zoom === 1) {
      // Detect simple swipe or swipe down to close
      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - touchStartRef.current.x;
      const deltaY = touch.clientY - touchStartRef.current.y;
      const deltaTime = Date.now() - touchStartRef.current.time;

      if (deltaTime < 250) {
        if (Math.abs(deltaY) > 80 && Math.abs(deltaY) > Math.abs(deltaX)) {
          // Swipe down to close
          if (deltaY > 0) {
            onClose();
          }
        } else if (Math.abs(deltaX) > 60) {
          // Swipe left / right
          if (deltaX > 0) {
            handlePrev();
          } else {
            handleNext();
          }
        }
      }
    }
  };

  // CTA Click handler
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
    onClose(); // Close the viewer after redirecting
  };

  const getCtaIcon = () => {
    switch (ad.cta_type) {
      case 'WhatsApp': return <MessageSquare className="w-4 h-4" />;
      case 'Phone Call': return <Phone className="w-4 h-4" />;
      case 'Open Business': return <Store className="w-4 h-4" />;
      case 'Marketplace Item': return <ShoppingBag className="w-4 h-4" />;
      case 'Property Listing': return <Building2 className="w-4 h-4" />;
      case 'Job Listing': return <Briefcase className="w-4 h-4" />;
      default: return <ExternalLink className="w-4 h-4" />;
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

  // Close on backdrop click (click outside image box)
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === containerRef.current || e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      ref={containerRef}
      onClick={handleBackdropClick}
      className="fixed inset-0 bg-slate-950/95 backdrop-blur-md z-[99999] flex flex-col items-center justify-between p-4 pb-safe-bottom pt-safe-top select-none animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ad-viewer-title"
    >
      {/* Lightbox Header Bar */}
      <div className="w-full flex items-center justify-between z-10 px-2 sm:px-4">
        {/* Sponsored / Advertiser label */}
        <div className="flex flex-col text-start">
          <span className="bg-emerald-500 text-slate-950 text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full w-fit">
            📢 Sponsored
          </span>
          {ad.advertiser_name && (
            <span className="text-slate-300 text-xs mt-1 font-bold">
              by: {ad.advertiser_name}
            </span>
          )}
        </div>

        {/* Action controllers */}
        <div className="flex items-center gap-3">
          {/* Zoom controls */}
          <div className="hidden sm:flex items-center bg-slate-800/80 rounded-2xl p-1 border border-slate-700/50">
            <button
              onClick={handleZoomIn}
              className="p-1.5 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors cursor-pointer"
              title="Zoom In"
              aria-label="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={handleZoomOut}
              className="p-1.5 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors cursor-pointer"
              title="Zoom Out"
              aria-label="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            {zoom > 1 && (
              <button
                onClick={handleZoomReset}
                className="p-1.5 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors cursor-pointer"
                title="Reset Zoom"
                aria-label="Reset Zoom"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Close button */}
          <button
            ref={closeButtonRef}
            onClick={onClose}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-full transition-all cursor-pointer shadow-md border border-slate-700"
            aria-label="Close image viewer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Image Slider Viewport */}
      <div 
        className="flex-1 w-full max-w-4xl flex items-center justify-center relative overflow-hidden my-4"
        onWheel={handleWheel}
      >
        {/* Left Arrow */}
        {imagesList.length > 1 && (
          <button
            onClick={handlePrev}
            className="absolute start-2 sm:start-4 p-2 bg-slate-900/60 hover:bg-slate-800/80 text-white rounded-full transition-all z-10 shadow-lg border border-slate-700/30 cursor-pointer"
            aria-label="Previous image"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}

        {/* Image Content Container */}
        <div 
          className="relative max-w-full max-h-[90vh] sm:max-h-[95vh] flex items-center justify-center cursor-grab active:cursor-grabbing"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onDoubleClick={handleDoubleClick}
        >
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500"></div>
            </div>
          )}

          {hasError ? (
            <div className="flex flex-col items-center justify-center text-center p-8 bg-slate-900 rounded-3xl border border-slate-800 space-y-3 max-w-xs">
              <span className="text-3xl">⚠️</span>
              <p className="text-slate-300 font-bold text-sm">Image unavailable</p>
              <p className="text-slate-500 text-xs">The media could not be loaded correctly.</p>
            </div>
          ) : (
            <img
              ref={imgRef}
              src={imagesList[currentIdx]}
              alt={ad.title}
              className="max-w-full max-h-[90vh] sm:max-h-[95vh] rounded-2xl object-contain shadow-2xl transition-transform duration-100 ease-out pointer-events-none select-none"
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              }}
              onLoad={() => setIsLoading(false)}
              onError={() => {
                setIsLoading(false);
                setHasError(true);
              }}
            />
          )}
        </div>

        {/* Right Arrow */}
        {imagesList.length > 1 && (
          <button
            onClick={handleNext}
            className="absolute end-2 sm:end-4 p-2 bg-slate-900/60 hover:bg-slate-800/80 text-white rounded-full transition-all z-10 shadow-lg border border-slate-700/30 cursor-pointer"
            aria-label="Next image"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* Footer Info Tray & CTA Action Block */}
      <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-2xl text-center z-10">
        {/* Navigation Indicator / Counter */}
        {imagesList.length > 1 && (
          <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
            {currentIdx + 1} of {imagesList.length}
          </div>
        )}

        <div className="space-y-1.5">
          <h2 id="ad-viewer-title" className="text-white text-base font-black tracking-tight line-clamp-1">
            {ad.title}
          </h2>
          <p className="text-slate-400 text-xs leading-relaxed line-clamp-2">
            {ad.description}
          </p>
        </div>

        {/* Category & Placement Badges */}
        <div className="flex flex-wrap items-center justify-center gap-1.5 text-[9px] font-bold text-slate-400">
          <span className="bg-slate-800 px-2 py-0.5 rounded border border-slate-700/40">
            📂 {ad.category}
          </span>
          <span className="bg-slate-800 px-2 py-0.5 rounded border border-slate-700/40">
            📍 {ad.placement}
          </span>
        </div>

        {/* CTA Redirect Button */}
        <div 
          onClick={() => setShowViewer(true)}
          className="w-full md:w-64 h-48 rounded-2xl overflow-hidden border border-amber-200/60 shrink-0 bg-white shadow-lg cursor-zoom-in group/img relative"
        >
          <img src={ad.banner_url} alt={ad.title} className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-350" />
        </div>
        <button
          onClick={handleCtaClick}
          className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 active:scale-[0.98] text-slate-950 font-black text-xs rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer border-0"
        >
          {getCtaIcon()}
          <span>{getCtaLabel()}</span>
        </button>
      </div>
    </div>
  );
}

