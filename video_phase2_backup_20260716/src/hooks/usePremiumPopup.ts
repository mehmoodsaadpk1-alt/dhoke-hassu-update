import { useState, useEffect, useCallback, useRef } from 'react';
import { useAdStore } from '../store/adStore';
import { AdItem } from '../types';

export function usePremiumPopup() {
  const { ads, fetchAdsForPlacement } = useAdStore();
  const [activePopupAd, setActivePopupAd] = useState<AdItem | null>(null);
  const checkTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize ads (we just fetch all active ads globally from the store)
  useEffect(() => {
    // Start realtime listener for ad changes
    useAdStore.getState().setupRealtime();
    
    // Only fetch if we have very few ads to ensure freshness, otherwise rely on the store's own caching
    const allAdsArray = Object.values(ads).flat();
    if (allAdsArray.length === 0) {
      fetchAdsForPlacement('Home Feed'); // Hack to trigger store fetch if empty, but better to just fetch all
    }
  }, [ads, fetchAdsForPlacement]);

  const triggerPopupCheck = useCallback(() => {
    if (checkTimeoutRef.current) clearTimeout(checkTimeoutRef.current);
    
    // Add a slight delay to allow navigation animations to complete
    checkTimeoutRef.current = setTimeout(() => {
      try {
        const now = new Date();
        const allAdsArray = Object.values(ads).flat();
        
        // 1. Filter eligible popup ads
        const popupAds = allAdsArray.filter(ad => {
          if (ad.format !== 'Popup') return false;
          if (ad.status !== 'Active') return false;
          if (ad.deleted_at) return false;
          
          const startDate = new Date(ad.start_date);
          const endDate = new Date(ad.end_date);
          if (now < startDate || now > endDate) return false;
          
          return true;
        });

        console.log(`[POPUP] Active ads loaded:`, popupAds.length, popupAds);
        
        // Remove currently active popup if it was just deleted or deactivated
        if (activePopupAd) {
          const stillExists = popupAds.some(a => a.id === activePopupAd.id);
          if (!stillExists) {
            console.log(`[POPUP] Current popup removed because deleted:`, activePopupAd.id);
            setActivePopupAd(null);
          }
        }

        if (popupAds.length === 0) {
          console.log(`[POPUP] Queue size: 0`);
          if (!activePopupAd) setActivePopupAd(null);
          return;
        }

        // 2. Sort by priority (Premium > High > Normal > Low)
        const priorityScore = { 'Premium': 4, 'High': 3, 'Normal': 2, 'Low': 1 };
        popupAds.sort((a, b) => (priorityScore[b.priority] || 0) - (priorityScore[a.priority] || 0));

        // Group by highest priority
        const highestPriority = priorityScore[popupAds[0].priority] || 0;
        const topTierAds = popupAds.filter(ad => (priorityScore[ad.priority] || 0) === highestPriority);

        console.log(`[POPUP] Queue rebuilt:`, topTierAds.length, topTierAds);
        console.log(`[POPUP] Queue size:`, topTierAds.length);

        // 3. Determine which ad to show based on frequency limits and rotation
        let selectedAd: AdItem | null = null;
        let openedReason = "";
        
        // Retrieve rotation index and last shown times
        const rotationKey = 'dhoke_popup_rotation_idx';
        const currentIndex = parseInt(localStorage.getItem(rotationKey) || '0', 10);
        
        // Find the next eligible ad in the top tier rotation
        for (let i = 0; i < topTierAds.length; i++) {
          const checkIndex = (currentIndex + i) % topTierAds.length;
          const candidate = topTierAds[checkIndex];
          
          const frequencyMinutes = typeof candidate.display_frequency === 'number' ? candidate.display_frequency : 20;
          const lastShownStr = localStorage.getItem(`dhoke_popup_last_${candidate.id}`);
          const lastShownMs = lastShownStr ? parseInt(lastShownStr, 10) : 0;
          
          const elapsedMinutes = (Date.now() - lastShownMs) / 60000;
          const nextAllowedTime = new Date(lastShownMs + frequencyMinutes * 60000);
          
          console.log(`[POPUP] Ad ID: ${candidate.id}`);
          console.log(`[POPUP] Display Frequency: ${frequencyMinutes} mins`);
          console.log(`[POPUP] Last Shown: ${lastShownMs ? new Date(lastShownMs).toLocaleTimeString() : 'Never'}`);
          console.log(`[POPUP] Next Allowed Time: ${nextAllowedTime.toLocaleTimeString()}`);
          console.log(`[POPUP] Current Time: ${new Date().toLocaleTimeString()}`);
          console.log(`[POPUP] Eligible: ${elapsedMinutes >= frequencyMinutes}`);

          if (elapsedMinutes >= frequencyMinutes) {
            selectedAd = candidate;
            openedReason = `Cooldown expired (${elapsedMinutes.toFixed(1)} mins elapsed >= ${frequencyMinutes} mins required)`;
            
            // Update rotation index for next time (fair rotation)
            localStorage.setItem(rotationKey, ((checkIndex + 1) % topTierAds.length).toString());
            break;
          }
        }

        if (selectedAd) {
          console.log(`[POPUP] Next popup:`, selectedAd.title);
          console.log(`[POPUP] Reason Popup Opened: ${openedReason}`);
          
          // Mark as shown
          localStorage.setItem(`dhoke_popup_last_${selectedAd.id}`, Date.now().toString());
          localStorage.setItem('dhoke_popup_global_last', Date.now().toString());
          
          // Only trigger React state update if it's a new ad (prevents flicker and infinite loops)
          setActivePopupAd(prev => prev?.id === selectedAd?.id ? prev : selectedAd);
        } else {
          // Do NOT clear activePopupAd if one is already showing, because we don't want to auto-close it 
          // just because its timer hasn't expired again! (The timer resets immediately after showing it).
          // We only clear it if there are NO popupAds at all (handled earlier).
        }
      } catch (err) {
        console.error('[PopupSystem] Error evaluating popup ads:', err);
      }
    }, 500); // 500ms delay
  }, [ads, activePopupAd]);

  const closePopup = useCallback(() => {
    setActivePopupAd(null);
    useAdStore.getState().invalidateCache();
    fetchAdsForPlacement('Home Feed'); // Reload fresh active ads
  }, [fetchAdsForPlacement]);

  return {
    activePopupAd,
    closePopup,
    triggerPopupCheck
  };
}
