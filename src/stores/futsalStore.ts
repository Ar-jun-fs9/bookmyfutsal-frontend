import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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

interface VenueFilters {
  searchQuery: string;
  selectedName: string;
  selectedCity: string;
  selectedLocation: string;
  sortByRating: boolean;
  sortByPrice: 'none' | 'low-to-high' | 'high-to-low';
  showFilters: boolean;
}

interface FutsalState {
  // Selected futsal for booking
  selectedFutsal: Futsal | null;
  setSelectedFutsal: (futsal: Futsal | null) => void;

  // Venue filters and display
  filters: VenueFilters;
  showAllVenues: boolean;

  // Filter actions
  setSearchQuery: (query: string) => void;
  setSelectedName: (name: string) => void;
  setSelectedCity: (city: string) => void;
  setSelectedLocation: (location: string) => void;
  setSortByRating: (sort: boolean) => void;
  setSortByPrice: (sort: 'none' | 'low-to-high' | 'high-to-low') => void;
  setShowFilters: (show: boolean) => void;
  clearFilters: () => void;
  toggleShowAllVenues: () => void;

  // Computed filtered venues (would be used with React Query data)
  getFilteredVenues: (venues: Futsal[]) => Futsal[];
}

const initialFilters: VenueFilters = {
  searchQuery: '',
  selectedName: '',
  selectedCity: '',
  selectedLocation: '',
  sortByRating: false,
  sortByPrice: 'none',
  showFilters: false,
};

export const useFutsalStore = create<FutsalState>()(
  persist(
    (set, get) => ({
      selectedFutsal: null,
      filters: initialFilters,
      showAllVenues: false,

      setSelectedFutsal: (futsal) => set({ selectedFutsal: futsal }),

      // Filter actions
      setSearchQuery: (query) => set((state) => ({
        filters: { ...state.filters, searchQuery: query }
      })),
      setSelectedName: (name) => set((state) => ({
        filters: { ...state.filters, selectedName: name }
      })),
      setSelectedCity: (city) => set((state) => ({
        filters: { ...state.filters, selectedCity: city }
      })),
      setSelectedLocation: (location) => set((state) => ({
        filters: { ...state.filters, selectedLocation: location }
      })),
      setSortByRating: (sort) => set((state) => ({
        filters: { ...state.filters, sortByRating: sort }
      })),
      setSortByPrice: (sort) => set((state) => ({
        filters: { ...state.filters, sortByPrice: sort }
      })),
      setShowFilters: (show) => set((state) => ({
        filters: { ...state.filters, showFilters: show }
      })),
      clearFilters: () => set({ filters: initialFilters }),
      toggleShowAllVenues: () => set((state) => ({
        showAllVenues: !state.showAllVenues
      })),

      // Computed filtered venues
      getFilteredVenues: (venues) => {
        const { filters } = get();

        return venues
          .filter((futsal) => {
            const matchesSearch = !filters.searchQuery ||
              futsal.name.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
              futsal.city.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
              futsal.location.toLowerCase().includes(filters.searchQuery.toLowerCase());
            const matchesName = !filters.selectedName || futsal.name === filters.selectedName;
            const matchesCity = !filters.selectedCity || futsal.city === filters.selectedCity;
            const matchesLocation = !filters.selectedLocation || futsal.location === filters.selectedLocation;
            return matchesSearch && matchesName && matchesCity && matchesLocation;
          })
          .sort((a, b) => {
            if (filters.sortByRating) {
              return (b.average_rating || 0) - (a.average_rating || 0);
            }
            if (filters.sortByPrice === 'low-to-high') {
              return a.price_per_hour - b.price_per_hour;
            }
            if (filters.sortByPrice === 'high-to-low') {
              return b.price_per_hour - a.price_per_hour;
            }
            return 0;
          });
      },
    }),
    {
      name: 'futsal-storage',
      storage: {
        getItem: (name) => {
          const value = sessionStorage.getItem(name);
          return value ? JSON.parse(value) : null;
        },
        setItem: (name, value) => {
          sessionStorage.setItem(name, JSON.stringify(value));
        },
        removeItem: (name) => {
          sessionStorage.removeItem(name);
        },
      },
    }
  )
);