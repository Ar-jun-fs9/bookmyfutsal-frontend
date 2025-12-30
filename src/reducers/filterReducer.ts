export interface FilterState {
  searchQuery: string;
  selectedName: string;
  selectedCity: string;
  selectedLocation: string;
  sortByRating: boolean;
  sortByPrice: 'none' | 'low-to-high' | 'high-to-low';
  showFilters: boolean;
  bookingFilter: 'all' | 'past' | 'today' | 'future' | 'cancelled';
}

export type FilterAction =
  | { type: 'SET_SEARCH_QUERY'; payload: string }
  | { type: 'SET_SELECTED_NAME'; payload: string }
  | { type: 'SET_SELECTED_CITY'; payload: string }
  | { type: 'SET_SELECTED_LOCATION'; payload: string }
  | { type: 'SET_SORT_BY_RATING'; payload: boolean }
  | { type: 'SET_SORT_BY_PRICE'; payload: 'none' | 'low-to-high' | 'high-to-low' }
  | { type: 'SET_SHOW_FILTERS'; payload: boolean }
  | { type: 'SET_BOOKING_FILTER'; payload: 'all' | 'past' | 'today' | 'future' | 'cancelled' }
  | { type: 'CLEAR_FILTERS' }
  | { type: 'RESET' };

export const initialFilterState: FilterState = {
  searchQuery: '',
  selectedName: '',
  selectedCity: '',
  selectedLocation: '',
  sortByRating: false,
  sortByPrice: 'none',
  showFilters: false,
  bookingFilter: 'all',
};

export const filterReducer = (state: FilterState, action: FilterAction): FilterState => {
  switch (action.type) {
    case 'SET_SEARCH_QUERY':
      return { ...state, searchQuery: action.payload };
    case 'SET_SELECTED_NAME':
      return { ...state, selectedName: action.payload };
    case 'SET_SELECTED_CITY':
      return { ...state, selectedCity: action.payload };
    case 'SET_SELECTED_LOCATION':
      return { ...state, selectedLocation: action.payload };
    case 'SET_SORT_BY_RATING':
      return { ...state, sortByRating: action.payload };
    case 'SET_SORT_BY_PRICE':
      return { ...state, sortByPrice: action.payload };
    case 'SET_SHOW_FILTERS':
      return { ...state, showFilters: action.payload };
    case 'SET_BOOKING_FILTER':
      return { ...state, bookingFilter: action.payload };
    case 'CLEAR_FILTERS':
      return {
        ...state,
        searchQuery: '',
        selectedName: '',
        selectedCity: '',
        selectedLocation: '',
        sortByRating: false,
        sortByPrice: 'none',
      };
    case 'RESET':
      return initialFilterState;
    default:
      return state;
  }
};