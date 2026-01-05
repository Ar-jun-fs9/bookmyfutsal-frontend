import { useEffect } from 'react';
import { useSocketStore } from '@/stores/socketStore';

interface SocketCallbacks {
  onSlotStatusUpdate?: (data: any) => void;
  onBookingCreated?: (data: any) => void;
  onBookingUpdated?: (data: any) => void;
  onBookingDeleted?: (data: any) => void;
  onFutsalCreated?: (data: any) => void;
  onFutsalUpdated?: (data: any) => void;
  onFutsalDeleted?: (data: any) => void;
  onAdminCreated?: (data: any) => void;
  onAdminUpdated?: (data: any) => void;
  onAdminDeleted?: (data: any) => void;
  onUserCreated?: (data: any) => void;
  onUserUpdated?: (data: any) => void;
  onUserDeleted?: (data: any) => void;
  onUserBlocked?: (data: any) => void;
  onUserUnblocked?: (data: any) => void;
  onRatingCreated?: (data: any) => void;
  onRatingUpdated?: (data: any) => void;
  onRatingDeleted?: (data: any) => void;
}

export function useDashboardSocket(callbacks: SocketCallbacks) {
  const { socket } = useSocketStore();

  useEffect(() => {
    if (!socket) return;

    // Slot events
    if (callbacks.onSlotStatusUpdate) {
      socket.on('slotStatusUpdated', callbacks.onSlotStatusUpdate);
    }

    // Booking events
    if (callbacks.onBookingCreated) {
      socket.on('bookingCreated', callbacks.onBookingCreated);
    }
    if (callbacks.onBookingUpdated) {
      socket.on('bookingUpdated', callbacks.onBookingUpdated);
    }
    if (callbacks.onBookingDeleted) {
      socket.on('bookingDeleted', callbacks.onBookingDeleted);
    }

    // Futsal events
    if (callbacks.onFutsalCreated) {
      socket.on('futsalCreated', callbacks.onFutsalCreated);
    }
    if (callbacks.onFutsalUpdated) {
      socket.on('futsalUpdated', callbacks.onFutsalUpdated);
    }
    if (callbacks.onFutsalDeleted) {
      socket.on('futsalDeleted', callbacks.onFutsalDeleted);
    }

    // Admin events
    if (callbacks.onAdminCreated) {
      socket.on('futsalAdminCreated', callbacks.onAdminCreated);
    }
    if (callbacks.onAdminUpdated) {
      socket.on('futsalAdminUpdated', callbacks.onAdminUpdated);
    }
    if (callbacks.onAdminDeleted) {
      socket.on('futsalAdminDeleted', callbacks.onAdminDeleted);
    }

    // User events
    if (callbacks.onUserCreated) {
      socket.on('userCreated', callbacks.onUserCreated);
    }
    if (callbacks.onUserUpdated) {
      socket.on('userUpdated', callbacks.onUserUpdated);
    }
    if (callbacks.onUserDeleted) {
      socket.on('userDeleted', callbacks.onUserDeleted);
    }
    if (callbacks.onUserBlocked) {
      socket.on('userBlocked', callbacks.onUserBlocked);
    }
    if (callbacks.onUserUnblocked) {
      socket.on('userUnblocked', callbacks.onUserUnblocked);
    }

    // Rating events
    if (callbacks.onRatingCreated) {
      socket.on('ratingCreated', callbacks.onRatingCreated);
    }
    if (callbacks.onRatingUpdated) {
      socket.on('ratingUpdated', callbacks.onRatingUpdated);
    }
    if (callbacks.onRatingDeleted) {
      socket.on('ratingDeleted', callbacks.onRatingDeleted);
    }

    // Cleanup function
    return () => {
      if (callbacks.onSlotStatusUpdate) {
        socket.off('slotStatusUpdated', callbacks.onSlotStatusUpdate);
      }
      if (callbacks.onBookingCreated) {
        socket.off('bookingCreated', callbacks.onBookingCreated);
      }
      if (callbacks.onBookingUpdated) {
        socket.off('bookingUpdated', callbacks.onBookingUpdated);
      }
      if (callbacks.onBookingDeleted) {
        socket.off('bookingDeleted', callbacks.onBookingDeleted);
      }
      if (callbacks.onFutsalCreated) {
        socket.off('futsalCreated', callbacks.onFutsalCreated);
      }
      if (callbacks.onFutsalUpdated) {
        socket.off('futsalUpdated', callbacks.onFutsalUpdated);
      }
      if (callbacks.onFutsalDeleted) {
        socket.off('futsalDeleted', callbacks.onFutsalDeleted);
      }
      if (callbacks.onAdminCreated) {
        socket.off('futsalAdminCreated', callbacks.onAdminCreated);
      }
      if (callbacks.onAdminUpdated) {
        socket.off('futsalAdminUpdated', callbacks.onAdminUpdated);
      }
      if (callbacks.onAdminDeleted) {
        socket.off('futsalAdminDeleted', callbacks.onAdminDeleted);
      }
      if (callbacks.onUserCreated) {
        socket.off('userCreated', callbacks.onUserCreated);
      }
      if (callbacks.onUserUpdated) {
        socket.off('userUpdated', callbacks.onUserUpdated);
      }
      if (callbacks.onUserDeleted) {
        socket.off('userDeleted', callbacks.onUserDeleted);
      }
      if (callbacks.onUserBlocked) {
        socket.off('userBlocked', callbacks.onUserBlocked);
      }
      if (callbacks.onUserUnblocked) {
        socket.off('userUnblocked', callbacks.onUserUnblocked);
      }
      if (callbacks.onRatingCreated) {
        socket.off('ratingCreated', callbacks.onRatingCreated);
      }
      if (callbacks.onRatingUpdated) {
        socket.off('ratingUpdated', callbacks.onRatingUpdated);
      }
      if (callbacks.onRatingDeleted) {
        socket.off('ratingDeleted', callbacks.onRatingDeleted);
      }
    };
  }, [socket, callbacks]);

  return socket;
}