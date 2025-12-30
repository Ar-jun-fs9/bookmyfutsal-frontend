export interface RegistrationState {
  step: 1 | 2;
  userId: number | null;
  formData: {
    first_name: string;
    last_name: string;
    username: string;
    email: string;
    password: string;
    confirm_password: string;
    phone: string;
  };
  otpData: {
    email_otp: string;
    phone_otp: string;
  };
  emailCountdown: number;
  phoneCountdown: number;
  error: string;
  loading: boolean;
  usernameErrors: string[];
  passwordErrors: string[];
  showPassword: boolean;
  showConfirmPassword: boolean;
  notification: { message: string; type: 'success' | 'info' } | null;
}

export type RegistrationAction =
  | { type: 'SET_STEP'; payload: 1 | 2 }
  | { type: 'SET_USER_ID'; payload: number | null }
  | { type: 'UPDATE_FORM_DATA'; payload: Partial<RegistrationState['formData']> }
  | { type: 'UPDATE_OTP_DATA'; payload: Partial<RegistrationState['otpData']> }
  | { type: 'SET_EMAIL_COUNTDOWN'; payload: number }
  | { type: 'SET_PHONE_COUNTDOWN'; payload: number }
  | { type: 'DECREMENT_COUNTDOWNS' }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_USERNAME_ERRORS'; payload: string[] }
  | { type: 'SET_PASSWORD_ERRORS'; payload: string[] }
  | { type: 'TOGGLE_SHOW_PASSWORD' }
  | { type: 'TOGGLE_SHOW_CONFIRM_PASSWORD' }
  | { type: 'SET_NOTIFICATION'; payload: RegistrationState['notification'] }
  | { type: 'CLEAR_NOTIFICATION' }
  | { type: 'RESET' };

export const initialRegistrationState: RegistrationState = {
  step: 1,
  userId: null,
  formData: {
    first_name: '',
    last_name: '',
    username: '',
    email: '',
    password: '',
    confirm_password: '',
    phone: ''
  },
  otpData: {
    email_otp: '',
    phone_otp: ''
  },
  emailCountdown: 0,
  phoneCountdown: 0,
  error: '',
  loading: false,
  usernameErrors: [],
  passwordErrors: [],
  showPassword: false,
  showConfirmPassword: false,
  notification: null
};

export const registrationReducer = (state: RegistrationState, action: RegistrationAction): RegistrationState => {
  switch (action.type) {
    case 'SET_STEP':
      return { ...state, step: action.payload };
    case 'SET_USER_ID':
      return { ...state, userId: action.payload };
    case 'UPDATE_FORM_DATA':
      return { ...state, formData: { ...state.formData, ...action.payload } };
    case 'UPDATE_OTP_DATA':
      return { ...state, otpData: { ...state.otpData, ...action.payload } };
    case 'SET_EMAIL_COUNTDOWN':
      return { ...state, emailCountdown: action.payload };
    case 'SET_PHONE_COUNTDOWN':
      return { ...state, phoneCountdown: action.payload };
    case 'DECREMENT_COUNTDOWNS':
      return {
        ...state,
        emailCountdown: Math.max(0, state.emailCountdown - 1),
        phoneCountdown: Math.max(0, state.phoneCountdown - 1)
      };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_USERNAME_ERRORS':
      return { ...state, usernameErrors: action.payload };
    case 'SET_PASSWORD_ERRORS':
      return { ...state, passwordErrors: action.payload };
    case 'TOGGLE_SHOW_PASSWORD':
      return { ...state, showPassword: !state.showPassword };
    case 'TOGGLE_SHOW_CONFIRM_PASSWORD':
      return { ...state, showConfirmPassword: !state.showConfirmPassword };
    case 'SET_NOTIFICATION':
      return { ...state, notification: action.payload };
    case 'CLEAR_NOTIFICATION':
      return { ...state, notification: null };
    case 'RESET':
      return initialRegistrationState;
    default:
      return state;
  }
};