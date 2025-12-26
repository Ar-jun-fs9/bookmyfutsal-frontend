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
}

interface FilterState {
  searchQuery: string;
  selectedName: string;
  selectedCity: string;
  selectedLocation: string;
  sortByRating: boolean;
  sortByPrice: 'none' | 'low-to-high' | 'high-to-low';
  showFilters: boolean;
}

const initialFilterState: FilterState = {
  searchQuery: '',
  selectedName: '',
  selectedCity: '',
  selectedLocation: '',
  sortByRating: false,
  sortByPrice: 'none',
  showFilters: false,
};

export function useVenueFilters() {
  const { data: futsals = [] } = useFutsals();
  const [filterState, setFilterState] = useState<FilterState>(initialFilterState);
  const [showAllFutsals, setShowAllFutsals] = useState(false);

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
        return matchesSearch && matchesName && matchesCity && matchesLocation;
      })
      .sort((a: Futsal, b: Futsal) => {
        if (filterState.sortByRating) {
          return (b.average_rating || 0) - (a.average_rating || 0);
        }
        if (filterState.sortByPrice === 'low-to-high') {
          return a.price_per_hour - b.price_per_hour;
        }
        if (filterState.sortByPrice === 'high-to-low') {
          return b.price_per_hour - a.price_per_hour;
        }
        return 0;
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