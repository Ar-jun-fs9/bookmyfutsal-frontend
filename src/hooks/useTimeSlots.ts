import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '@/services/api';

export const useTimeSlots = (futsalId: number, date: string, shift: string) => {
  return useQuery({
    queryKey: ['time-slots', futsalId, date, shift],
    queryFn: () => apiService.getTimeSlots(futsalId, date, shift),
    enabled: !!(futsalId && date && shift && shift.trim() !== ''),
    staleTime: 1000 * 60 * 1, // 1 minute
  });
};

export const useFutsalSlotsForDate = (futsalId: number, date: string) => {
  return useQuery({
    queryKey: ['futsal-slots', futsalId, date],
    queryFn: () => apiService.getFutsalSlotsForDate(futsalId, date),
    enabled: !!(futsalId && date),
    staleTime: 1000 * 60 * 1, // 1 minute
  });
};

export const useReserveSlot = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (slotId: number) => apiService.reserveSlot(slotId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time-slots'] });
    },
  });
};

export const useReleaseSlot = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (slotId: number) => apiService.releaseSlot(slotId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time-slots'] });
    },
  });
};

export const useSlotStatus = (slotId: number) => {
  return useQuery({
    queryKey: ['slot-status', slotId],
    queryFn: () => apiService.getSlotStatus(slotId),
    enabled: !!slotId,
    staleTime: 1000 * 30, // 30 seconds
  });
};

export const useCloseAllSlotsForDate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ futsalId, date }: { futsalId: number; date: string }) =>
      apiService.closeAllSlotsForDate(futsalId, date),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['futsal-slots'] });
    },
  });
};

export const useOpenAllSlotsForDate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ futsalId, date }: { futsalId: number; date: string }) =>
      apiService.openAllSlotsForDate(futsalId, date),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['futsal-slots'] });
    },
  });
};

export const useUpdateSlotStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ slotId, status }: { slotId: number; status: string }) =>
      apiService.updateSlotStatus(slotId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['futsal-slots'] });
    },
  });
};