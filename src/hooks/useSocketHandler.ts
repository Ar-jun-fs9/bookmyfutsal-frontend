import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSocketStore } from '@/stores/socketStore';
import { useAuthStore } from '@/stores/authStore';

export const useSocketHandler = () => {
  const queryClient = useQueryClient();
  const { socket, isConnected } = useSocketStore();
  const { user } = useAuthStore();

  useEffect(() => {
    if (!socket || !isConnected) return;

    // Handle booking updates
    const handleBookingUpdated = (data: any) => {
     
      queryClient.invalidateQueries({ queryKey: ['bookings'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['futsal-bookings'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['time-slots'] });
    };

    const handleBookingCreated = (data: any) => {
     
      queryClient.invalidateQueries({ queryKey: ['bookings'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['futsal-bookings'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['time-slots'] });
    };

    const handleBookingDeleted = (data: any) => {
      
      // Remove from local cancelled bookings
      try {
        const cancelledBookings = JSON.parse(localStorage.getItem('user_cancelled_bookings') || '[]');
        const updatedCancelled = cancelledBookings.filter((b: any) => b.booking_id !== data.bookingId);
        localStorage.setItem('user_cancelled_bookings', JSON.stringify(updatedCancelled));
        
      } catch (error) {
        console.error('Error updating cancelled bookings in localStorage:', error);
      }
      // Remove from local deleted bookings
      try {
        const deletedBookings = JSON.parse(localStorage.getItem('user_deleted_bookings') || '[]');
        const updatedDeleted = deletedBookings.filter((id: number) => id !== data.bookingId);
        localStorage.setItem('user_deleted_bookings', JSON.stringify(updatedDeleted));
        
      } catch (error) {
        console.error('Error updating deleted bookings in localStorage:', error);
      }
      
      queryClient.invalidateQueries({ queryKey: ['bookings'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['futsal-bookings'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['time-slots'] });
    };

    const handleSlotStatusUpdated = (data: any) => {

      queryClient.invalidateQueries({ queryKey: ['time-slots'] });
    };

    const handleSpecialPriceCreated = (data: any) => {

      queryClient.invalidateQueries({ queryKey: ['special-prices'], exact: false });
    };

    const handleSpecialPriceUpdated = (data: any) => {

      queryClient.invalidateQueries({ queryKey: ['special-prices'], exact: false });
    };

    const handleSpecialPriceDeleted = (data: any) => {

      queryClient.invalidateQueries({ queryKey: ['special-prices'], exact: false });
    };

    // Register event listeners
    socket.on('bookingUpdated', handleBookingUpdated);
    socket.on('bookingCreated', handleBookingCreated);
    socket.on('bookingDeleted', handleBookingDeleted);
    socket.on('slotStatusUpdated', handleSlotStatusUpdated);
    socket.on('specialPriceCreated', handleSpecialPriceCreated);
    socket.on('specialPriceUpdated', handleSpecialPriceUpdated);
    socket.on('specialPriceDeleted', handleSpecialPriceDeleted);

    // Cleanup
    return () => {
      socket.off('bookingUpdated', handleBookingUpdated);
      socket.off('bookingCreated', handleBookingCreated);
      socket.off('bookingDeleted', handleBookingDeleted);
      socket.off('slotStatusUpdated', handleSlotStatusUpdated);
      socket.off('specialPriceCreated', handleSpecialPriceCreated);
      socket.off('specialPriceUpdated', handleSpecialPriceUpdated);
      socket.off('specialPriceDeleted', handleSpecialPriceDeleted);
    };
  }, [socket, isConnected, queryClient, user]);
};