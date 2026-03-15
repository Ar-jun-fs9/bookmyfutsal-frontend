import { create } from 'zustand';

interface SpecialPrice {
  special_price_id: number;
  futsal_id: number;
  type: string;
  special_date: string | null;
  recurring_days: string[] | null;
  start_time: string | null;
  end_time: string | null;
  special_price: number;
  message?: string;
  offer_message?: string;
  is_offer: boolean;
  created_by: string;
  created_at: string;
  updated_at?: string;
  futsal_name: string;
}

interface PrefetchState {
  // =============================================================================
  // PREFETCH CACHE - Background prefetching for DetailsModal
  // =============================================================================
  // These stores cache data fetched on page load so DetailsModal opens instantly
  // without waiting for additional fetches when user clicks handleDetailsModal
  // =============================================================================
  
  // Cache special prices by futsal_id
  specialPricesCache: { [futsalId: number]: SpecialPrice[] };
  
  // Track which futsals have been prefetched
  prefetchedFutsals: Set<number>;
  
  // Track which media URLs have been preloaded
  preloadedImages: Set<string>;
  preloadedVideos: Set<string>;
  
  // Actions
  setSpecialPrices: (futsalId: number, prices: SpecialPrice[]) => void;
  getSpecialPrices: (futsalId: number) => SpecialPrice[] | undefined;
  markFutsalPrefetched: (futsalId: number) => void;
  isFutsalPrefetched: (futsalId: number) => boolean;
  preloadImage: (url: string) => void;
  preloadVideo: (url: string) => void;
  isImagePreloaded: (url: string) => boolean;
  isVideoPreloaded: (url: string) => boolean;
  clearCache: () => void;
}

export const usePrefetchStore = create<PrefetchState>((set, get) => ({
  specialPricesCache: {},
  prefetchedFutsals: new Set<number>(),
  preloadedImages: new Set<string>(),
  preloadedVideos: new Set<string>(),

  setSpecialPrices: (futsalId: number, prices: SpecialPrice[]) => {
    set((state) => ({
      specialPricesCache: {
        ...state.specialPricesCache,
        [futsalId]: prices,
      },
      prefetchedFutsals: new Set([...state.prefetchedFutsals, futsalId]),
    }));
  },

  getSpecialPrices: (futsalId: number) => {
    return get().specialPricesCache[futsalId];
  },

  markFutsalPrefetched: (futsalId: number) => {
    set((state) => ({
      prefetchedFutsals: new Set([...state.prefetchedFutsals, futsalId]),
    }));
  },

  isFutsalPrefetched: (futsalId: number) => {
    return get().prefetchedFutsals.has(futsalId);
  },

  preloadImage: (url: string) => {
    if (!url || get().preloadedImages.has(url)) return;
    
    // Use browser-native image preloading
    if (typeof window !== 'undefined') {
      const img = new Image();
      img.src = url;
    }
    
    set((state) => ({
      preloadedImages: new Set([...state.preloadedImages, url]),
    }));
  },

  preloadVideo: (url: string) => {
    if (!url || get().preloadedVideos.has(url)) return;
    
    // Use browser-native video preloading with multiple methods for better coverage
    if (typeof window !== 'undefined') {
      // Method 1: Create video element with preload='auto' for metadata + partial buffering
      const video = document.createElement('video');
      video.preload = 'auto';
      video.src = url;
      
      // Method 2: Use <link rel="preload"> for browser-level prefetching
      // This tells the browser to start fetching the video resource early
      if (!document.querySelector(`link[href="${url}"]`)) {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'video';
        link.href = url;
        document.head.appendChild(link);
      }
      
      // Method 3: Fetch with range header to get partial content for faster first frame
      // This helps with getting the first keyframe quickly
      fetch(url, { method: 'HEAD' }).catch(() => {
        // Silently fail - we don't want to break anything
      });
    }
    
    set((state) => ({
      preloadedVideos: new Set([...state.preloadedVideos, url]),
    }));
  },

  isImagePreloaded: (url: string) => {
    return get().preloadedImages.has(url);
  },

  isVideoPreloaded: (url: string) => {
    return get().preloadedVideos.has(url);
  },

  clearCache: () => {
    set({
      specialPricesCache: {},
      prefetchedFutsals: new Set<number>(),
      preloadedImages: new Set<string>(),
      preloadedVideos: new Set<string>(),
    });
  },
}));
