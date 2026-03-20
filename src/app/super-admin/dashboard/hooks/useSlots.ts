import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import { useSocketStore } from '@/stores/socketStore';
import { useEffect, useRef, useCallback } from 'react';

interface Slot {
  slot_id: number;
  futsal_id: number;
  futsal_name?: string;
  slot_date: string;
  start_time: string;
  end_time: string;
  status: 'available' | 'disabled' | 'booked';
  display_status?: 'available' | 'disabled' | 'booked' | 'expired';
  shift_category: string;
  booker_name?: string;
}

// Stable query key generator
const createSlotsQueryKey = (futsalId: number | null, date: string) => 
  futsalId ? ['slots', futsalId, date] : ['slots', 'all', date];

// Fetch slots for a single futsal
async function fetchSlotsForFutsal(
  accessToken: string | undefined, 
  futsalId: number, 
  date: string,
  futsalName?: string
): Promise<Slot[]> {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/time-slots/admin/futsal/${futsalId}/date/${date}`, 
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch slots');
  }

  const data = await response.json();
  return data.slots.map((slot: any) => ({
    ...slot,
    futsal_name: futsalName || 'Unknown Futsal'
  }));
}

// Fetch slots for all futsals
async function fetchAllFutsalsSlots(
  accessToken: string | undefined, 
  futsals: any[], 
  date: string
): Promise<Slot[]> {
  if (!futsals.length || !accessToken) return [];
  
  // Fetch all slots in parallel
  const results = await Promise.all(
    futsals.map(futsal => 
      fetchSlotsForFutsal(accessToken, futsal.futsal_id, date, futsal.name)
        .catch(error => {
          console.error(`Error fetching slots for futsal ${futsal.futsal_id}:`, error);
          return [];
        })
    )
  );

  return results.flat();
}

export function useSlots() {
  const { tokens } = useAuthStore();
  const { socket } = useSocketStore();
  const queryClient = useQueryClient();
  
  // Track current selection to avoid duplicate fetches
  const currentKeyRef = useRef<string>('');

  // Mutation for updating slot status
  const updateSlotStatusMutation = useMutation({
    mutationFn: async ({ slotId, status }: { slotId: number; status: 'available' | 'disabled' }) => {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/time-slots/${slotId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        throw new Error('Error updating slot status');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['slots'] });
    },
  });

  // Mutation for bulk updating slots
  const bulkUpdateSlotsMutation = useMutation({
    mutationFn: async ({ 
      futsalId, 
      date, 
      action 
    }: { 
      futsalId: number | null; 
      date: string; 
      action: 'close' | 'open'; 
    }) => {
      let response;
      if (futsalId) {
        response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/time-slots/futsal/${futsalId}/date/${date}/${action}-all`, 
          { method: 'PUT' }
        );
      } else {
        response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/time-slots/${action}-all-available`, 
          { method: 'PUT' }
        );
      }

      if (!response.ok) {
        throw new Error(`Error ${action}ing slots`);
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['slots'] });
    },
  });

  // Fetch slots for a single futsal (with caching)
  const fetchSlots = useCallback(async (futsalId: number, date: string, futsals: any[]) => {
    const queryKey = createSlotsQueryKey(futsalId, date);
    const futsalName = futsals.find(f => f.futsal_id === futsalId)?.name;
    
    // Check if already cached
    const cached = queryClient.getQueryData<Slot[]>(queryKey);
    if (cached) {
      return cached;
    }
    
    // Fetch and cache
    return queryClient.fetchQuery({
      queryKey,
      queryFn: () => fetchSlotsForFutsal(tokens?.accessToken, futsalId, date, futsalName),
      staleTime: 1000 * 60 * 2, // 2 minutes
    });
  }, [queryClient, tokens?.accessToken]);

  // Fetch slots for all futsals (with caching)
  const fetchAllSlots = useCallback(async (futsals: any[], date: string) => {
    const queryKey = createSlotsQueryKey(null, date);
    
    // Check if already cached
    const cached = queryClient.getQueryData<Slot[]>(queryKey);
    if (cached) {
      return cached;
    }
    
    // Fetch and cache
    return queryClient.fetchQuery({
      queryKey,
      queryFn: () => fetchAllFutsalsSlots(tokens?.accessToken, futsals, date),
      staleTime: 1000 * 60 * 2, // 2 minutes
    });
  }, [queryClient, tokens?.accessToken]);

  // Real-time updates via socket
  useEffect(() => {
    if (!socket) return;

    const handleSlotStatusUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ['slots'] });
    };

    socket.on('slotStatusUpdated', handleSlotStatusUpdate);

    return () => {
      socket.off('slotStatusUpdated', handleSlotStatusUpdate);
    };
  }, [socket, queryClient]);

  // Wrapper functions for compatibility
  const updateSlotStatus = async (slotId: number, status: 'available' | 'disabled') => {
    try {
      await updateSlotStatusMutation.mutateAsync({ slotId, status });
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const bulkUpdateSlots = async (
    futsalId: number | null, 
    date: string, 
    action: 'close' | 'open', 
    futsals: any[]
  ) => {
    try {
      await bulkUpdateSlotsMutation.mutateAsync({ futsalId, date, action });
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  return {
    slots: [], // Not used - slots are fetched via fetchSlots/fetchAllSlots
    loading: false,
    error: null,
    updateSlotStatus,
    bulkUpdateSlots,
    fetchSlots,
    fetchAllSlots
  };
}
