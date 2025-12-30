import { create } from 'zustand';

interface Booking {
  booking_id: number;
  futsal_name: string;
  location: string;
  city: string;
  booking_date: string;
  time_slot: string;
  number_of_players: number;
  team_name?: string;
  amount_paid: number;
  price_per_hour: number;
  tracking_code: string;
  guest_name?: string;
  guest_phone?: string;
  admin_phone?: string;
  created_at?: string;
}

interface BookingFilters {
  searchQuery: string;
  selectedName: string;
  selectedCity: string;
  selectedLocation: string;
  sortByRating: boolean;
  sortByPrice: 'none' | 'low-to-high' | 'high-to-low';
  showFilters: boolean;
}

interface BookingState {
  // Current booking being tracked
  trackedBooking: Booking | null;
  trackingCode: string;
  hasSearched: boolean;
  isTracking: boolean;

  // Booking filters and display
  filters: BookingFilters;
  showAllBookings: boolean;

  // Actions
  setTrackingCode: (code: string) => void;
  setTrackedBooking: (booking: Booking | null) => void;
  setHasSearched: (searched: boolean) => void;
  setIsTracking: (tracking: boolean) => void;
  clearTracking: () => void;

  // Filter actions
  setSearchQuery: (query: string) => void;
  setSelectedName: (name: string) => void;
  setSelectedCity: (city: string) => void;
  setSelectedLocation: (location: string) => void;
  setSortByRating: (sort: boolean) => void;
  setSortByPrice: (sort: 'none' | 'low-to-high' | 'high-to-low') => void;
  setShowFilters: (show: boolean) => void;
  clearFilters: () => void;
  toggleShowAllBookings: () => void;
}

const initialFilters: BookingFilters = {
  searchQuery: '',
  selectedName: '',
  selectedCity: '',
  selectedLocation: '',
  sortByRating: false,
  sortByPrice: 'none',
  showFilters: false,
};

export const useBookingStore = create<BookingState>((set, get) => ({
  // Initial state
  trackedBooking: null,
  trackingCode: '',
  hasSearched: false,
  isTracking: false,
  filters: initialFilters,
  showAllBookings: false,

  // Tracking actions
  setTrackingCode: (code) => set({ trackingCode: code }),
  setTrackedBooking: (booking) => set({ trackedBooking: booking }),
  setHasSearched: (searched) => set({ hasSearched: searched }),
  setIsTracking: (tracking) => set({ isTracking: tracking }),
  clearTracking: () => set({
    trackedBooking: null,
    trackingCode: '',
    hasSearched: false,
    isTracking: false
  }),

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
  toggleShowAllBookings: () => set((state) => ({
    showAllBookings: !state.showAllBookings
  })),
}));