import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AdItem } from '../types';
import { dbGetActiveAds, supabase, isSupabaseConfigured } from '../utils/supabaseClient';

interface AdState {
  ads: Record<string, AdItem[]>;
  lastSeenAdIndices: Record<string, number>;
  lastFetched: Record<string, number>;
  feedAdIntervals: Record<string, number>;
  
  fetchAdsForPlacement: (placement: string) => Promise<void>;
  getNextAdForPlacement: (placement: string) => AdItem | null;
  setFeedAdInterval: (placement: string, interval: number) => void;
  invalidateCache: () => void;
  setupRealtime: () => void;
}

const CACHE_TTL = 1000 * 60 * 15; // 15 minutes
let realtimeInitialized = false;

export const useAdStore = create<AdState>()(
  persist(
    (set, get) => ({
      ads: {},
      lastSeenAdIndices: {},
      lastFetched: {},
      feedAdIntervals: { 'Jobs': 3 },

      fetchAdsForPlacement: async (placement: string) => {
        const { lastFetched } = get();
        const now = Date.now();
        
        // Cache mechanism
        if (lastFetched[placement] && now - lastFetched[placement] < CACHE_TTL) {
          return;
        }

        try {
          const adsList = await dbGetActiveAds(placement);
          // Optional: we can shuffle them here initially
          const shuffledAds = [...adsList].sort(() => 0.5 - Math.random());
          
          set((state) => ({
            ads: {
              ...state.ads,
              [placement]: shuffledAds
            },
            lastFetched: {
              ...state.lastFetched,
              [placement]: now
            },
            lastSeenAdIndices: {
              ...state.lastSeenAdIndices,
              [placement]: state.lastSeenAdIndices[placement] ?? -1
            }
          }));
        } catch (err) {
          console.error(`Error loading active ads for placement ${placement}:`, err);
        }
      },

      getNextAdForPlacement: (placement: string) => {
        const state = get();
        const adsForPlacement = state.ads[placement] || [];
        
        if (adsForPlacement.length === 0) return null;
        if (adsForPlacement.length === 1) return adsForPlacement[0];

        const lastIndex = state.lastSeenAdIndices[placement] ?? -1;
        let nextIndex = lastIndex + 1;

        if (nextIndex >= adsForPlacement.length) {
          // Shuffle the array when we start over
          nextIndex = 0;
          const shuffledAds = [...adsForPlacement].sort(() => 0.5 - Math.random());
          // Make sure the first ad isn't the same as the last seen ad to avoid consecutive duplicates
          if (shuffledAds[0].id === adsForPlacement[lastIndex].id && shuffledAds.length > 1) {
            const temp = shuffledAds[0];
            shuffledAds[0] = shuffledAds[1];
            shuffledAds[1] = temp;
          }

          set((s) => ({
            ads: {
              ...s.ads,
              [placement]: shuffledAds
            },
            lastSeenAdIndices: {
              ...s.lastSeenAdIndices,
              [placement]: nextIndex
            }
          }));
          return shuffledAds[nextIndex];
        }

        set((s) => ({
          lastSeenAdIndices: {
            ...s.lastSeenAdIndices,
            [placement]: nextIndex
          }
        }));

        return adsForPlacement[nextIndex];
      },

      invalidateCache: () => {
        set({
          ads: {},
          lastFetched: {},
          lastSeenAdIndices: {}
        });
        localStorage.removeItem('dhoke-connect-ads-storage');
      },

      setFeedAdInterval: (placement: string, interval: number) => {
        set((state) => ({
          feedAdIntervals: {
            ...state.feedAdIntervals,
            [placement]: interval
          }
        }));
      },

      setupRealtime: () => {
        if (!isSupabaseConfigured || !supabase || realtimeInitialized) return;
        realtimeInitialized = true;
        
        supabase.channel('ads_changes')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'ads' }, (payload) => {
            console.log('Ads table changed, refreshing cache...', payload);
            
            const currentLastFetched = get().lastFetched;
            
            // Invalidate cache immediately
            get().invalidateCache();
            
            // Re-fetch all previously fetched placements
            Object.keys(currentLastFetched).forEach(placement => {
              get().fetchAdsForPlacement(placement as AdItem['placement']);
            });
          })
          .subscribe();
      }
    }),
    {
      name: 'dhoke-connect-ads-storage',
      partialize: (state) => ({ 
        lastSeenAdIndices: state.lastSeenAdIndices, 
        lastFetched: state.lastFetched,
        ads: state.ads,
        feedAdIntervals: state.feedAdIntervals
      }),
    }
  )
);
