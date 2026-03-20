import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import { useSocketStore } from '@/stores/socketStore';
import { useEffect, useMemo, useState } from 'react';
import { filterBookings } from '../utils/searchUtils';

interface UseBookingsOptions {
  enabled?: boolean;
}

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

const QUERY_KEY = ['bookings', 'all'];

async function fetchBookings(accessToken?: string): Promise<{ bookings: Booking[] }> {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/bookings/all`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  });
  
  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Unauthorized');
    }
    if (response.status === 429) {
      throw new Error('Rate limit exceeded. Please wait before retrying.');
    }
    throw new Error('Failed to fetch bookings');
  }
  
  return response.json();
}

export function useBookings(options: UseBookingsOptions = {}) {
  const { enabled = true } = options;
  const { tokens } = useAuthStore();
  const { socket } = useSocketStore();
  const queryClient = useQueryClient();
  
  // Local filter state - kept for client-side filtering
  const [searchTerm, setSearchTerm] = useState('');
  const [futsalFilter, setFutsalFilter] = useState('');
  const [bookingFilter, setBookingFilter] = useState<'all' | 'past' | 'today' | 'future' | 'cancelled'>('all');
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');

  // Use React Query for data fetching with caching
  const { data, isLoading: loading, error, refetch } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => fetchBookings(tokens?.accessToken),
    enabled: enabled && !!tokens?.accessToken,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
    refetchOnMount: false, // Don't refetch when component mounts
    refetchOnWindowFocus: false, // Don't refetch when window regains focus
    throwOnError: false,
  });

  const bookings = data?.bookings || [];

  // Client-side filtering
  const filteredBookings = useMemo(() => {
    return filterBookings(bookings, searchTerm, futsalFilter, bookingFilter, dateStart, dateEnd);
  }, [bookings, searchTerm, futsalFilter, bookingFilter, dateStart, dateEnd]);

  // Mutation for updating booking
  const updateMutation = useMutation({
    mutationFn: async ({ id, formData }: { id: number; formData: any }) => {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/bookings/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error updating booking');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });

  // Mutation for deleting booking
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/bookings/delete/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Error deleting booking');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });

  // Mutation for cancelling booking
  const cancelMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/bookings/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Error cancelling booking');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });

  // Mutation for bulk delete
  const bulkDeleteMutation = useMutation({
    mutationFn: async (bookingIds: number[]) => {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/bookings/super-admin/bulk-delete`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ booking_ids: bookingIds }),
      });

      if (!response.ok) {
        throw new Error('Error deleting bookings');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });

  // Real-time updates via socket - update cache directly
  useEffect(() => {
    if (!socket) return;

    const handleBookingCreated = (data: any) => {
      queryClient.setQueryData<{ bookings: Booking[] }>(QUERY_KEY, (old) => {
        if (!old) return { bookings: [data.booking] };
        return { bookings: [data.booking, ...old.bookings] };
      });
    };

    const handleBookingUpdated = (data: any) => {
      queryClient.setQueryData<{ bookings: Booking[] }>(QUERY_KEY, (old) => {
        if (!old) return old;
        return {
          bookings: old.bookings.map(b => b.booking_id === data.booking.booking_id ? data.booking : b)
        };
      });
    };

    const handleBookingDeleted = (data: any) => {
      queryClient.setQueryData<{ bookings: Booking[] }>(QUERY_KEY, (old) => {
        if (!old) return old;
        return {
          bookings: old.bookings.filter(b => b.booking_id !== data.bookingId)
        };
      });
    };

    socket.on('bookingCreated', handleBookingCreated);
    socket.on('bookingUpdated', handleBookingUpdated);
    socket.on('bookingDeleted', handleBookingDeleted);

    return () => {
      socket.off('bookingCreated', handleBookingCreated);
      socket.off('bookingUpdated', handleBookingUpdated);
      socket.off('bookingDeleted', handleBookingDeleted);
    };
  }, [socket, queryClient]);

  // Wrapper functions for compatibility
  const updateBooking = async (id: number, formData: any) => {
    try {
      await updateMutation.mutateAsync({ id, formData });
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const deleteBooking = async (id: number) => {
    try {
      await deleteMutation.mutateAsync(id);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const cancelBooking = async (id: number) => {
    try {
      await cancelMutation.mutateAsync(id);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const bulkDelete = async (bookingIds: number[]) => {
    try {
      await bulkDeleteMutation.mutateAsync(bookingIds);
      return { success: true, deletedCount: bookingIds.length };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  return {
    bookings,
    filteredBookings,
    loading,
    error: error as Error | null,
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
    refetch
  };
}
