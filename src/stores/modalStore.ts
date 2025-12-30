import { create } from 'zustand';

interface ModalState {
  // Error modal
  errorModal: { isOpen: boolean; message: string };
  setErrorModal: (modal: { isOpen: boolean; message: string }) => void;

  // Confirm modal
  confirmModal: { isOpen: boolean; message: string; onConfirm: () => void } | null;
  setConfirmModal: (modal: { isOpen: boolean; message: string; onConfirm: () => void } | null) => void;

  // Video modal
  videoModal: { isOpen: boolean; futsal: any | null };
  setVideoModal: (modal: { isOpen: boolean; futsal: any | null }) => void;

  // Rating modal
  ratingModal: { isOpen: boolean; futsal: any | null };
  setRatingModal: (modal: { isOpen: boolean; futsal: any | null }) => void;

  // Details modal
  detailsModal: { isOpen: boolean; futsal: any | null };
  setDetailsModal: (modal: { isOpen: boolean; futsal: any | null }) => void;

  // Location modal
  locationModal: { isOpen: boolean; futsal: any | null; distance?: number };
  setLocationModal: (modal: { isOpen: boolean; futsal: any | null; distance?: number }) => void;

  // Feedback modal
  feedbackModal: { isOpen: boolean };
  setFeedbackModal: (modal: { isOpen: boolean }) => void;

  // Mobile menu
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
}

export const useModalStore = create<ModalState>((set) => ({
  // Error modal
  errorModal: { isOpen: false, message: '' },
  setErrorModal: (modal) => set({ errorModal: modal }),

  // Confirm modal
  confirmModal: null,
  setConfirmModal: (modal) => set({ confirmModal: modal }),

  // Video modal
  videoModal: { isOpen: false, futsal: null },
  setVideoModal: (modal) => set({ videoModal: modal }),

  // Rating modal
  ratingModal: { isOpen: false, futsal: null },
  setRatingModal: (modal) => set({ ratingModal: modal }),

  // Details modal
  detailsModal: { isOpen: false, futsal: null },
  setDetailsModal: (modal) => set({ detailsModal: modal }),

  // Location modal
  locationModal: { isOpen: false, futsal: null },
  setLocationModal: (modal) => set({ locationModal: modal }),

  // Feedback modal
  feedbackModal: { isOpen: false },
  setFeedbackModal: (modal) => set({ feedbackModal: modal }),

  // Mobile menu
  isMobileMenuOpen: false,
  setIsMobileMenuOpen: (open) => set({ isMobileMenuOpen: open }),
}));