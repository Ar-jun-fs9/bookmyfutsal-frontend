import { create } from 'zustand';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
}

interface ModalState {
  video: { isOpen: boolean; futsal: any | null };
  rating: { isOpen: boolean; futsal: any | null };
  details: { isOpen: boolean; futsal: any | null };
  location: { isOpen: boolean; futsal: any | null; distance?: number };
  error: { isOpen: boolean; message: string };
  confirm: { isOpen: boolean; message: string; onConfirm: () => void } | null;
}

interface LoadingState {
  [key: string]: boolean;
}

interface UIState {
  toasts: Toast[];
  modals: ModalState;
  loading: LoadingState;
  mobileMenuOpen: boolean;

  // Toast actions
  showToast: (toast: Omit<Toast, 'id'>) => void;
  hideToast: (id: string) => void;
  clearToasts: () => void;

  // Modal actions
  openModal: (type: keyof ModalState, data?: any) => void;
  closeModal: (type: keyof ModalState) => void;
  closeAllModals: () => void;

  // Loading actions
  setLoading: (key: string, loading: boolean) => void;
  isLoading: (key: string) => boolean;

  // Mobile menu
  setMobileMenuOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState>((set, get) => ({
  toasts: [],
  modals: {
    video: { isOpen: false, futsal: null },
    rating: { isOpen: false, futsal: null },
    details: { isOpen: false, futsal: null },
    location: { isOpen: false, futsal: null },
    error: { isOpen: false, message: '' },
    confirm: null,
  },
  loading: {},
  mobileMenuOpen: false,

  // Toast actions
  showToast: (toast) => {
    const id = Date.now().toString();
    const newToast = { ...toast, id };

    set((state) => ({
      toasts: [...state.toasts, newToast],
    }));

    // Auto-hide toast after duration
    setTimeout(() => {
      get().hideToast(id);
    }, toast.duration || 5000);
  },

  hideToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== id),
    }));
  },

  clearToasts: () => {
    set({ toasts: [] });
  },

  // Modal actions
  openModal: (type, data) => {
    set((state) => ({
      modals: {
        ...state.modals,
        [type]: { isOpen: true, ...data },
      },
    }));
  },

  closeModal: (type) => {
    set((state) => ({
      modals: {
        ...state.modals,
        [type]: { isOpen: false, futsal: null, distance: undefined, message: '', onConfirm: undefined },
      },
    }));
  },

  closeAllModals: () => {
    set((state) => ({
      modals: {
        video: { isOpen: false, futsal: null },
        rating: { isOpen: false, futsal: null },
        details: { isOpen: false, futsal: null },
        location: { isOpen: false, futsal: null },
        error: { isOpen: false, message: '' },
        confirm: null,
      },
    }));
  },

  // Loading actions
  setLoading: (key, loading) => {
    set((state) => ({
      loading: {
        ...state.loading,
        [key]: loading,
      },
    }));
  },

  isLoading: (key) => {
    return get().loading[key] || false;
  },

  // Mobile menu
  setMobileMenuOpen: (open) => {
    set({ mobileMenuOpen: open });
  },
}));