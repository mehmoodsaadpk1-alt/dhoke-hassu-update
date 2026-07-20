import { useMemo, useEffect, useRef } from 'react';
import { useAdStore } from '../store/adStore';
import { AdItem } from '../types';

export function useAdRotator(
  placement: string,
  itemCount: number,
  interval: number = 5,
  formatFilter?: 'Feed' | 'Banner'
): Record<number, AdItem> {
  const { fetchAdsForPlacement, ads } = useAdStore();

  // 1. Filter active ads matching the placement and format
  const placementAds = useMemo(() => {
    const rawAds = (ads[placement] || []).filter(ad => ad.format !== 'Popup');
    if (formatFilter === 'Banner') {
      return rawAds.filter(ad => ad.format === 'Banner');
    }
    if (formatFilter === 'Feed') {
      // Treat undefined/null format as Feed (Standard) ad by default
      return rawAds.filter(ad => !ad.format || ad.format === 'Feed');
    }
    return rawAds;
  }, [ads, placement, formatFilter]);

  const baseCursorRef = useRef<number | null>(null);

  // 2. Trigger data fetch when placement changes
  useEffect(() => {
    try {
      fetchAdsForPlacement(placement);
    } catch (err) {
      console.warn(`[AdSystem] Failed to fetch ads for ${placement}:`, err);
    }
  }, [placement, fetchAdsForPlacement]);

  // 3. Generate placement map cleanly
  const adMap = useMemo(() => {
    const assignments: Record<number, AdItem> = {};
    if (placementAds.length === 0 || itemCount === 0 || interval <= 0) return assignments;

    // Isolate cursor per placement AND format to avoid collisions (e.g. Banner vs Feed)
    const cursorKey = `dhoke_ad_base_cursor_${placement}_${formatFilter || 'Feed'}`;
    
    // Initialize or advance cursor exactly once per component mount lifecycle
    if (baseCursorRef.current === null) {
      let stored = parseInt(localStorage.getItem(cursorKey) || '0', 10);
      stored = isNaN(stored) ? 0 : stored;
      
      // Advance base cursor by 1 on each mount/refresh to ensure fresh rotation
      stored = (stored + 1) % Math.max(1, placementAds.length);
      localStorage.setItem(cursorKey, stored.toString());
      baseCursorRef.current = stored;
    }

    const baseCursor = baseCursorRef.current;

    // Purely deterministic rotation mapping based on sequence index
    for (let i = 0; i < itemCount; i++) {
      if ((i + 1) % interval === 0) {
        // Calculate the ad's sequential order in the feed (0, 1, 2...)
        const adSequenceIndex = Math.floor(i / interval); 
        
        // Select ad consistently without duplicate state mutation
        const selectedAd = placementAds[(baseCursor + adSequenceIndex) % placementAds.length];
        assignments[i] = selectedAd;
      }
    }

    return assignments;
  }, [placement, placementAds, itemCount, interval, formatFilter]);

  return adMap;
}
