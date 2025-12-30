import { useState, useEffect } from 'react';
import { useTrackBooking } from '@/hooks/useBookings';
import { useNotificationStore } from '@/stores/notificationStore';

export function useBookingTracker() {
  const [trackingCode, setTrackingCode] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const { data: trackedBooking, refetch: refetchBooking } = useTrackBooking(trackingCode, hasSearched);
  const { showNotification } = useNotificationStore();

  // Reset search when tracking code changes
  useEffect(() => {
    setHasSearched(false);
  }, [trackingCode]);

  const handleTrackBooking = async () => {
    if (!trackingCode.trim()) return;

    setHasSearched(true);

    try {
      const result = await refetchBooking();
      if (result.data) {
        // Success - booking data will be available
      } else {
        showNotification({ message: 'Booking not found', type: 'info' });
        setTrackingCode(''); // Clear tracking code on error
        setHasSearched(false);
      }
    } catch (error) {
      console.error('Error tracking booking:', error);
      showNotification({ message: 'Error tracking booking', type: 'info' });
      setTrackingCode(''); // Clear tracking code on error
      setHasSearched(false);
    }
  };

  return {
    trackingCode,
    setTrackingCode,
    hasSearched,
    trackedBooking,
    handleTrackBooking,
  };
}