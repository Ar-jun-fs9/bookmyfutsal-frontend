import { useQuery } from '@tanstack/react-query';
import { apiService } from '@/services/api';

export const useFutsals = () => {
  return useQuery({
    queryKey: ['futsals'],
    queryFn: () => apiService.getFutsals(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const useFutsal = (id: number) => {
  return useQuery({
    queryKey: ['futsals', id],
    queryFn: () => apiService.getFutsal(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });
};