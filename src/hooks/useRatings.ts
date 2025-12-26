import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '@/services/api';

export const useFutsalRatings = (futsalId: number) => {
  return useQuery({
    queryKey: ['ratings', futsalId],
    queryFn: () => apiService.getFutsalRatings(futsalId),
    enabled: !!futsalId,
    staleTime: 1000 * 60 * 5, // 5 minutes
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