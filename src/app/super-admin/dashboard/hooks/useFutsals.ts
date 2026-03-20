import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import { useSocketStore } from '@/stores/socketStore';
import { useEffect } from 'react';

interface UseFutsalsOptions {
  enabled?: boolean;
}

interface Futsal {
  futsal_id: number;
  name: string;
  location: string;
  city: string;
  latitude?: number;
  longitude?: number;
  phone?: string;
  description?: string;
  images?: string[];
  video?: string;
  price_per_hour: number;
  game_format?: string;
  facilities?: string[];
  opening_hours?: string;
  closing_hours?: string;
  last_updated_by?: string;
  created_at?: string;
  updated_at?: string;
}

const QUERY_KEY = ['futsals'];

async function fetchFutsals(accessToken?: string): Promise<Futsal[]> {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/futsals`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  });
  
  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Unauthorized');
    }
    throw new Error('Failed to fetch futsals');
  }
  
  return response.json();
}

export function useFutsals(options: UseFutsalsOptions = {}) {
  const { enabled = true } = options;
  const { tokens } = useAuthStore();
  const { socket } = useSocketStore();
  const queryClient = useQueryClient();

  // Use React Query for data fetching with caching
  const { data: futsals = [], isLoading: loading, error, refetch } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => fetchFutsals(tokens?.accessToken),
    enabled: enabled && !!tokens?.accessToken,
    staleTime: 1000 * 60 * 5, // 5 minutes - data stays fresh for 5 mins
    gcTime: 1000 * 60 * 10, // 10 minutes - cache persists for 10 mins
    refetchOnMount: false, // Don't refetch when component mounts
    refetchOnWindowFocus: false, // Don't refetch when window regains focus
    throwOnError: false,
  });

  // Mutation for creating futsal
  const createMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/futsals`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error creating futsal');
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });

  // Mutation for updating futsal
  const updateMutation = useMutation({
    mutationFn: async ({ id, formData }: { id: number; formData: FormData }) => {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/futsals/${id}`, {
        method: 'PUT',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error updating futsal');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });

  // Mutation for deleting futsal
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/futsals/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Error deleting futsal');
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

    const handleFutsalCreated = (data: any) => {
      queryClient.setQueryData<Futsal[]>(QUERY_KEY, (old) => 
        old ? [data.futsal, ...old] : [data.futsal]
      );
    };

    const handleFutsalUpdated = (data: any) => {
      queryClient.setQueryData<Futsal[]>(QUERY_KEY, (old) =>
        old ? old.map(f => f.futsal_id === data.futsal.futsal_id ? data.futsal : f) : old
      );
    };

    const handleFutsalDeleted = (data: any) => {
      queryClient.setQueryData<Futsal[]>(QUERY_KEY, (old) =>
        old ? old.filter(f => f.futsal_id !== data.futsalId) : old
      );
    };

    socket.on('futsalCreated', handleFutsalCreated);
    socket.on('futsalUpdated', handleFutsalUpdated);
    socket.on('futsalDeleted', handleFutsalDeleted);

    return () => {
      socket.off('futsalCreated', handleFutsalCreated);
      socket.off('futsalUpdated', handleFutsalUpdated);
      socket.off('futsalDeleted', handleFutsalDeleted);
    };
  }, [socket, queryClient]);

  // Wrapper functions for compatibility
  const createFutsal = async (formData: FormData) => {
    try {
      await createMutation.mutateAsync(formData);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const updateFutsal = async (id: number, formData: FormData) => {
    try {
      await updateMutation.mutateAsync({ id, formData });
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const deleteFutsal = async (id: number) => {
    try {
      await deleteMutation.mutateAsync(id);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const bulkDelete = async (futsalIds: number[]) => {
    try {
      const deletePromises = futsalIds.map(id =>
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/futsals/${id}`, {
          method: 'DELETE',
        })
      );

      const results = await Promise.all(deletePromises);
      const successfulDeletes = results.filter(response => response.ok).length;

      if (successfulDeletes > 0) {
        // Invalidate to refetch
        queryClient.invalidateQueries({ queryKey: QUERY_KEY });
        return { success: true, deletedCount: successfulDeletes };
      } else {
        return { success: false, error: 'Error deleting futsals' };
      }
    } catch (err) {
      console.error('Error bulk deleting futsals:', err);
      return { success: false, error: 'Error deleting futsals' };
    }
  };

  return {
    futsals,
    loading,
    error: error as Error | null,
    createFutsal,
    updateFutsal,
    deleteFutsal,
    bulkDelete,
    refetch
  };
}
