import { useState, useEffect, useMemo } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useSocketStore } from '@/stores/socketStore';
import { filterBookings } from '../utils/searchUtils';
import { categorizeBooking } from '../utils/bookingUtils';

interface Booking {
  booking_id: number;
  futsal_name: string;
  futsal_id: number;
  first_name: string;
  user_phone?: string;
  team_name?: string;
  formatted_date: string;
  booking_date: string;
  time_slot: string;
  number_of_players: number;
  amount_paid: number;
  payment_status: string;
  cancelled_by?: string;
  cancelled_at?: string;
  created_at: string;
  last_updated_by?: string;
}

export function useBookings() {
  const { tokens } = useAuthStore();
  const { socket } = useSocketStore();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [futsalFilter, setFutsalFilter] = useState('');
  const [bookingFilter, setBookingFilter] = useState<'all' | 'past' | 'today' | 'future' | 'cancelled'>('all');
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/bookings/all`, {
        headers: {
          'Authorization': `Bearer ${tokens?.accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const data = await response.json();
        setBookings(data.bookings);
        setError(null);
      } else if (response.status === 401) {
        setError('Unauthorized');
      } else {
        setError('Failed to fetch bookings');
      }
    } catch (err) {
      setError('Error fetching bookings');
      console.error('Error fetching bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredBookings = useMemo(() => {
    return filterBookings(bookings, searchTerm, futsalFilter, bookingFilter, dateStart, dateEnd);
  }, [bookings, searchTerm, futsalFilter, bookingFilter, dateStart, dateEnd]);

  const updateBooking = async (id: number, formData: any) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/bookings/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await fetchBookings(); // Refresh the list
        return { success: true };
      } else {
        const errorData = await response.json();
        return { success: false, error: errorData.message || 'Error updating booking' };
      }
    } catch (err) {
      console.error('Error updating booking:', err);
      return { success: false, error: 'Error updating booking' };
    }
  };

  const deleteBooking = async (id: number) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/bookings/delete/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setBookings(bookings.filter(b => b.booking_id !== id));
        return { success: true };
      } else {
        return { success: false, error: 'Error deleting booking' };
      }
    } catch (err) {
      console.error('Error deleting booking:', err);
      return { success: false, error: 'Error deleting booking' };
    }
  };

  const cancelBooking = async (id: number) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/bookings/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchBookings(); // Refresh the list
        return { success: true };
      } else {
        return { success: false, error: 'Error cancelling booking' };
      }
    } catch (err) {
      console.error('Error cancelling booking:', err);
      return { success: false, error: 'Error cancelling booking' };
    }
  };

  const bulkDelete = async (bookingIds: number[]) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/bookings/super-admin/bulk-delete`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ booking_ids: bookingIds }),
      });

      if (response.ok) {
        const data = await response.json();
        setBookings(bookings.filter(b => !bookingIds.includes(b.booking_id)));
        return { success: true, deletedCount: data.deletedCount };
      } else {
        return { success: false, error: 'Error deleting bookings' };
      }
    } catch (err) {
      console.error('Error bulk deleting bookings:', err);
      return { success: false, error: 'Error deleting bookings' };
    }
  };

  useEffect(() => {
    if (tokens?.accessToken) {
      fetchBookings();
    }
  }, [tokens?.accessToken]);

  // Real-time updates via socket
  useEffect(() => {
    if (!socket) return;

    const handleBookingCreated = (data: any) => {
      setBookings(prev => [data.booking, ...prev]);
    };

    const handleBookingUpdated = (data: any) => {
      setBookings(prev => prev.map(b => b.booking_id === data.booking.booking_id ? data.booking : b));
    };

    const handleBookingDeleted = (data: any) => {
      setBookings(prev => prev.filter(b => b.booking_id !== data.bookingId));
    };

    socket.on('bookingCreated', handleBookingCreated);
    socket.on('bookingUpdated', handleBookingUpdated);
    socket.on('bookingDeleted', handleBookingDeleted);

    return () => {
      socket.off('bookingCreated', handleBookingCreated);
      socket.off('bookingUpdated', handleBookingUpdated);
      socket.off('bookingDeleted', handleBookingDeleted);
    };
  }, [socket]);

  return {
    bookings,
    filteredBookings,
    loading,
    error,
    searchTerm,
    setSearchTerm,
    futsalFilter,
    setFutsalFilter,
    bookingFilter,
    setBookingFilter,
    dateStart,
    setDateStart,
    dateEnd,
    setDateEnd,
    updateBooking,
    deleteBooking,
    cancelBooking,
    bulkDelete,
    refetch: fetchBookings
  };
}