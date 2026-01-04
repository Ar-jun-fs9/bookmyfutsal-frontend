export interface BookingState {
  step: number;
  selectedDate: string;
  selectedShift: string;
  availableShifts: string[];
  availableSlots: any[];
  selectedSlotIds: number[];
  phone: string;
  name: string;
  numberOfPlayers: string;
  teamName: string;
  generatedTrackingCode: string;
  otpCode: string;
  esewaPhone: string;
  booking: any | null;
  user: any | null;
  loading: boolean;
  error: string | null;
}

export type BookingAction =
  | { type: 'SET_STEP'; payload: number }
  | { type: 'SET_SELECTED_DATE'; payload: string }
  | { type: 'SET_SELECTED_SHIFT'; payload: string }
  | { type: 'SET_AVAILABLE_SHIFTS'; payload: string[] }
  | { type: 'SET_AVAILABLE_SLOTS'; payload: any[] }
  | { type: 'ADD_SELECTED_SLOT'; payload: number }
  | { type: 'REMOVE_SELECTED_SLOT'; payload: number }
  | { type: 'CLEAR_SELECTED_SLOTS' }
  | { type: 'UPDATE_SLOT_STATUS'; payload: { slotId: number; status: string; display_status: string } }
  | { type: 'SET_PHONE'; payload: string }
  | { type: 'SET_NAME'; payload: string }
  | { type: 'SET_NUMBER_OF_PLAYERS'; payload: string }
  | { type: 'SET_TEAM_NAME'; payload: string }
  | { type: 'SET_TRACKING_CODE'; payload: string }
  | { type: 'SET_OTP_CODE'; payload: string }
  | { type: 'SET_ESEWA_PHONE'; payload: string }
  | { type: 'SET_BOOKING'; payload: any }
  | { type: 'SET_USER'; payload: any }
  | { type: 'SET_GENERATED_TRACKING_CODE'; payload: string }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'LOAD_PROGRESS'; payload: Partial<BookingState> }
  | { type: 'RESET' };

export const initialBookingState: BookingState = {
  step: 1,
  selectedDate: '',
  selectedShift: '',
  availableShifts: [],
  availableSlots: [],
  selectedSlotIds: [],
  phone: '',
  name: '',
  numberOfPlayers: '',
  teamName: '',
  generatedTrackingCode: '',
  otpCode: '',
  esewaPhone: '',
  booking: null,
  user: null,
  loading: false,
  error: null,
};

export const bookingReducer = (state: BookingState, action: BookingAction): BookingState => {
  switch (action.type) {
    case 'SET_STEP':
      return { ...state, step: action.payload };
    case 'SET_SELECTED_DATE':
      return { ...state, selectedDate: action.payload, selectedShift: '', availableSlots: [], selectedSlotIds: [] };
    case 'SET_SELECTED_SHIFT':
      return { ...state, selectedShift: action.payload, availableSlots: [], selectedSlotIds: [] };
    case 'SET_AVAILABLE_SHIFTS':
      return { ...state, availableShifts: action.payload };
    case 'SET_AVAILABLE_SLOTS':
      return { ...state, availableSlots: action.payload };
    case 'ADD_SELECTED_SLOT':
      return { ...state, selectedSlotIds: [...state.selectedSlotIds, action.payload] };
    case 'REMOVE_SELECTED_SLOT':
      return { ...state, selectedSlotIds: state.selectedSlotIds.filter(id => id !== action.payload) };
    case 'CLEAR_SELECTED_SLOTS':
      return { ...state, selectedSlotIds: [] };
    case 'UPDATE_SLOT_STATUS':
      return {
        ...state,
        availableSlots: state.availableSlots.map(slot =>
          slot.slot_id === action.payload.slotId
            ? { ...slot, status: action.payload.status, display_status: action.payload.display_status }
            : slot
        )
      };
    case 'SET_PHONE':
      return { ...state, phone: action.payload };
    case 'SET_NAME':
      return { ...state, name: action.payload };
    case 'SET_NUMBER_OF_PLAYERS':
      return { ...state, numberOfPlayers: action.payload };
    case 'SET_TEAM_NAME':
      return { ...state, teamName: action.payload };
    case 'SET_TRACKING_CODE':
      return { ...state, generatedTrackingCode: action.payload };
    case 'SET_OTP_CODE':
      return { ...state, otpCode: action.payload };
    case 'SET_ESEWA_PHONE':
      return { ...state, esewaPhone: action.payload };
    case 'SET_BOOKING':
      return { ...state, booking: action.payload };
    case 'SET_USER':
      return { ...state, user: action.payload };
    case 'SET_GENERATED_TRACKING_CODE':
      return { ...state, generatedTrackingCode: action.payload };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'LOAD_PROGRESS':
      return { ...state, ...action.payload };
    case 'RESET':
      return initialBookingState;
    default:
      return state;
  }
};