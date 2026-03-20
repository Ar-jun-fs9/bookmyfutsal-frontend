import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '@/services/api';

interface UseQueryOptions {
  enabled?: boolean;
  staleTime?: number;
  gcTime?: number;
  retry?: number;
  retryDelay?: (attemptIndex: number) => number;
}

export const useFutsalRatings = (futsalId: number, options?: UseQueryOptions) => {
  return useQuery({
    queryKey: ['ratings', futsalId],
    queryFn: () => apiService.getFutsalRatings(futsalId),
    enabled: !!futsalId && (options?.enabled ?? true), // Only fetch when enabled (section is open)
    staleTime: options?.staleTime ?? (5 * 60 * 1000), // Default 5 minutes
    gcTime: options?.gcTime ?? (10 * 60 * 1000), // Default 10 minutes
    retry: options?.retry ?? 2,
    retryDelay: options?.retryDelay ?? ((attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000)),
  });
};

export const useCreateRating = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ratingData: any) => apiService.createRating(ratingData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ratings'] });
      queryClient.invalidateQueries({ queryKey: ['futsals'] });
    },
  });
};

export const useUpdateRating = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ ratingId, updateData }: { ratingId: number; updateData: any }) =>
      apiService.updateRating(ratingId, updateData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ratings'] });
      queryClient.invalidateQueries({ queryKey: ['futsals'] });
    },
  });
};

export const useDeleteRating = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ratingId: number) => apiService.deleteRating(ratingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ratings'] });
      queryClient.invalidateQueries({ queryKey: ['futsals'] });
    },
  });
};