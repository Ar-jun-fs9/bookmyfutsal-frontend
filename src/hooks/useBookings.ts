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

export const useFutsalBookings = (futsalId: number) => {
  return useQuery({
    queryKey: ['futsal-bookings', futsalId],
    queryFn: () => apiService.getFutsalBookings(futsalId),
    enabled: !!futsalId,
    staleTime: 1000 * 60 * 2, // 2 minutes
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