import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '@/services/api';

export const useBookings = (userId?: number) => {
  return useQuery({
    queryKey: ['bookings', userId],
    queryFn: () => apiService.getBookings(userId),
    enabled: !!userId,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
};

interface UseQueryOptions {
  enabled?: boolean;
  staleTime?: number;
  gcTime?: number;
  retry?: number;
  retryDelay?: (attemptIndex: number) => number;
}

export const useFutsalBookings = (futsalId: number, options?: UseQueryOptions) => {
  return useQuery({
    queryKey: ['futsal-bookings', futsalId],
    queryFn: () => apiService.getFutsalBookings(futsalId),
    enabled: !!futsalId && (options?.enabled ?? true), // Only fetch when enabled (section is open)
    staleTime: options?.staleTime ?? (5 * 60 * 1000), // Default 5 minutes
    gcTime: options?.gcTime ?? (10 * 60 * 1000), // Default 10 minutes
    retry: options?.retry ?? 2,
    retryDelay: options?.retryDelay ?? ((attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000)),
  });
};

export const useTrackBooking = (trackingCode: string, hasSearched: boolean) => {
  return useQuery({
    queryKey: ['booking', 'track', trackingCode],
    queryFn: () => apiService.trackBooking(trackingCode).then(res => res.booking),
    enabled: !!trackingCode && hasSearched,
    staleTime: 1000 * 60 * 1, // 1 minute
  });
};

export const useCreateBooking = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (bookingData: any) => apiService.createBooking(bookingData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['time-slots'] });
    },
  });
};

export const useUpdateBooking = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ bookingId, updateData }: { bookingId: number; updateData: any }) =>
      apiService.updateBooking(bookingId, updateData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['time-slots'] });
    },
  });
};

export const useCancelBooking = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ bookingId, userId }: { bookingId: number; userId: number }) =>
      apiService.cancelBooking(bookingId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['time-slots'] });
    },
  });
};