import { useState, useMemo } from 'react';
import { useFutsals } from '@/hooks/useFutsals';
import { filterFutsals } from '@/utils/helpers';

interface Futsal {
  futsal_id: number;
  name: string;
  location: string;
  city: string;
  images?: string[];
  video?: string;
  price_per_hour: number;
  latitude?: number;
  longitude?: number;
  admin_phone?: string;
  opening_hours?: string;
  closing_hours?: string;
  description?: string;
  average_rating?: number;
  total_ratings?: number;
  game_format?: string;
  facilities?: string[];
  created_at: string;
  special_prices?: any[];
}

interface FilterState {
  searchQuery: string;
  selectedName: string;
  selectedCity: string;
  selectedLocation: string;
  sortByRating: 'none' | 'highest' | 'lowest';
  sortByPrice: 'none' | 'low-to-high' | 'high-to-low';
  showFilters: boolean;
  selectedAge: 'all' | 'old' | 'new';
  selectedOffer: 'all' | 'offers';
}

const initialFilterState: FilterState = {
  searchQuery: '',
  selectedName: '',
  selectedCity: '',
  selectedLocation: '',
  sortByRating: 'none',
  sortByPrice: 'none',
  showFilters: false,
  selectedAge: 'all',
  selectedOffer: 'all',
};

export function useVenueFilters() {
  const { data: futsals = [] } = useFutsals();
  const [filterState, setFilterState] = useState<FilterState>(initialFilterState);
  const [showAllFutsals, setShowAllFutsals] = useState(false);

  // Calculate ranking score for a futsal
  const calculateRankingScore = (futsal: Futsal): number => {
    let score = 0;

    // 1. Highest offer discount (0-100%)
    let maxDiscount = 0;
    if (futsal.special_prices && futsal.special_prices.length > 0) {
      for (const sp of futsal.special_prices) {
        if (sp.special_price < futsal.price_per_hour) {
          const discount = ((futsal.price_per_hour - sp.special_price) / futsal.price_per_hour) * 100;
          maxDiscount = Math.max(maxDiscount, discount);
        }
      }
    }
    score += maxDiscount * 1000; // Weight: 1000

    // 2. Rating (0-5)
    const rating = futsal.average_rating || 0;
    score += rating * 100; // Weight: 100

    // 3. Number of reviews
    const reviews = futsal.total_ratings || 0;
    score += reviews * 10; // Weight: 10

    // 4. Competitive pricing (lower price is better, normalize)
    const priceScore = Math.max(0, 1000 - futsal.price_per_hour); // Assuming max price 1000, higher score for lower price
    score += priceScore;

    // 5. Facilities count (parking, lighting, washrooms)
    let facilitiesCount = 0;
    const keyFacilities = ['Parking facilities', 'Night lighting', 'Washrooms / drinking water'];
    if (futsal.facilities) {
      for (const facility of keyFacilities) {
        if (futsal.facilities.includes(facility)) {
          facilitiesCount++;
        }
      }
    }
    score += facilitiesCount * 50; // Weight: 50 per facility

    return score;
  };

  const filteredFutsals = useMemo(() => {
    return futsals
      .filter((futsal: Futsal) => {
        const matchesSearch = !filterState.searchQuery ||
          futsal.name.toLowerCase().includes(filterState.searchQuery.toLowerCase()) ||
          futsal.city.toLowerCase().includes(filterState.searchQuery.toLowerCase()) ||
          futsal.location.toLowerCase().includes(filterState.searchQuery.toLowerCase());
        const matchesName = !filterState.selectedName || futsal.name === filterState.selectedName;
        const matchesCity = !filterState.selectedCity || futsal.city === filterState.selectedCity;
        const matchesLocation = !filterState.selectedLocation || futsal.location === filterState.selectedLocation;
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const matchesAge = filterState.selectedAge === 'all' ||
          (filterState.selectedAge === 'new' && new Date(futsal.created_at) > thirtyDaysAgo) ||
          (filterState.selectedAge === 'old' && new Date(futsal.created_at) <= thirtyDaysAgo);
        const matchesOffer = filterState.selectedOffer === 'all' ||
          (filterState.selectedOffer === 'offers' && futsal.special_prices && futsal.special_prices.length > 0);
        return matchesSearch && matchesName && matchesCity && matchesLocation && matchesAge && matchesOffer;
      })
      .sort((a: Futsal, b: Futsal) => {
         if (filterState.sortByRating === 'highest') {
           return (b.average_rating || 0) - (a.average_rating || 0);
         }
         if (filterState.sortByRating === 'lowest') {
           return (a.average_rating || 0) - (b.average_rating || 0);
         }
         if (filterState.sortByPrice === 'low-to-high') {
           return a.price_per_hour - b.price_per_hour;
         }
         if (filterState.sortByPrice === 'high-to-low') {
           return b.price_per_hour - a.price_per_hour;
         }
         // Default: sort by ranking score descending
         return calculateRankingScore(b) - calculateRankingScore(a);
       });
  }, [futsals, filterState]);

  // Get unique options for dropdowns
  const uniqueNames = useMemo(() => [...new Set(futsals.map((f: Futsal) => f.name.trim()))].sort() as string[], [futsals]);
  const uniqueCities = useMemo(() => [...new Set(futsals.map((f: Futsal) => f.city.trim()))].sort() as string[], [futsals]);
  const uniqueLocations = useMemo(() => [...new Set(futsals.map((f: Futsal) => f.location.trim()))].sort() as string[], [futsals]);

  const updateFilter = <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    setFilterState(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilterState(initialFilterState);
  };

  const toggleShowAll = () => {
    setShowAllFutsals(prev => !prev);
  };

  return {
    filterState,
    updateFilter,
    clearFilters,
    filteredFutsals,
    uniqueNames,
    uniqueCities,
    uniqueLocations,
    showAllFutsals,
    toggleShowAll,
  };
}