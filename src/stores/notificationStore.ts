import { create } from 'zustand';

interface Notification {
  message: string;
  type: 'success' | 'info' | 'error';
}

interface NotificationState {
  notification: Notification | null;
  showNotification: (notification: Notification) => void;
  hideNotification: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notification: null,
  showNotification: (notification) => {
    set({ notification });
    // Auto-hide after 2 seconds
    setTimeout(() => {
      set({ notification: null });
    }, 2000);
  },
  hideNotification: () => set({ notification: null }),
}));