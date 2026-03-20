import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import { useSocketStore } from '@/stores/socketStore';
import { useEffect, useState } from 'react';

interface UseRatingsOptions {
  enabled?: boolean;
}

interface Rating {
  id: number;
  futsal_id: number;
  futsal_name: string;
  user_id?: number;
  first_name?: string;
  last_name?: string;
  users?: string;
  users_type: string;
  rating: number;
  comment?: string;
  created_at: string;
}

const QUERY_KEY = ['ratings'];

async function fetchRatings(accessToken?: string): Promise<{ ratings: Rating[] }> {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/ratings`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  });
  
  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Unauthorized');
    }
    throw new Error('Failed to fetch ratings');
  }
  
  return response.json();
}

export function useRatings(options: UseRatingsOptions = {}) {
  const { enabled = true } = options;
  const { tokens } = useAuthStore();
  const { socket } = useSocketStore();
  const queryClient = useQueryClient();
  
  // Local filter state
  const [filteredRatings, setFilteredRatings] = useState<Rating[]>([]);

  // Use React Query for data fetching with caching
  const { data, isLoading: loading, error, refetch } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => fetchRatings(tokens?.accessToken),
    enabled: enabled && !!tokens?.accessToken,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
    refetchOnMount: false, // Don't refetch when component mounts
    refetchOnWindowFocus: false, // Don't refetch when window regains focus
    throwOnError: false,
  });

  const fullRatings = data?.ratings || [];
  const ratings = filteredRatings.length > 0 ? filteredRatings : fullRatings;

  // Update filtered ratings when data changes
  useEffect(() => {
    if (fullRatings.length > 0 && filteredRatings.length === 0) {
      setFilteredRatings(fullRatings);
    }
  }, [fullRatings]);

  // Mutation for creating rating
  const createMutation = useMutation({
    mutationFn: async (formData: any) => {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/ratings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error creating rating');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });

  // Mutation for updating rating
  const updateMutation = useMutation({
    mutationFn: async ({ id, formData }: { id: number; formData: any }) => {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/ratings/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error updating rating');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });

  // Mutation for deleting rating
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/ratings/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${tokens?.accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Error deleting rating');
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

    const handleRatingCreated = (data: any) => {
      queryClient.setQueryData<{ ratings: Rating[] }>(QUERY_KEY, (old) => {
        if (!old) return { ratings: [data.rating] };
        return { ratings: [data.rating, ...old.ratings] };
      });
    };

    const handleRatingUpdated = (data: any) => {
      queryClient.setQueryData<{ ratings: Rating[] }>(QUERY_KEY, (old) => {
        if (!old) return old;
        return {
          ratings: old.ratings.map(r => r.id === data.rating.id ? data.rating : r)
        };
      });
    };

    const handleRatingDeleted = (data: any) => {
      queryClient.setQueryData<{ ratings: Rating[] }>(QUERY_KEY, (old) => {
        if (!old) return old;
        return {
          ratings: old.ratings.filter(r => r.id !== data.ratingId)
        };
      });
    };

    socket.on('ratingCreated', handleRatingCreated);
    socket.on('ratingUpdated', handleRatingUpdated);
    socket.on('ratingDeleted', handleRatingDeleted);

    return () => {
      socket.off('ratingCreated', handleRatingCreated);
      socket.off('ratingUpdated', handleRatingUpdated);
      socket.off('ratingDeleted', handleRatingDeleted);
    };
  }, [socket, queryClient]);

  // Wrapper functions for compatibility
  const createRating = async (formData: any) => {
    try {
      await createMutation.mutateAsync(formData);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const updateRating = async (id: number, formData: any) => {
    try {
      await updateMutation.mutateAsync({ id, formData });
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const deleteRating = async (id: number) => {
    try {
      await deleteMutation.mutateAsync(id);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const bulkDelete = async (ratingIds: number[]) => {
    try {
      const deletePromises = ratingIds.map(id =>
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/ratings/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${tokens?.accessToken}`,
          },
        })
      );

      const results = await Promise.all(deletePromises);
      const successfulDeletes = results.filter(response => response.ok).length;

      if (successfulDeletes > 0) {
        queryClient.invalidateQueries({ queryKey: QUERY_KEY });
        return { success: true, deletedCount: successfulDeletes };
      } else {
        return { success: false, error: 'Error deleting ratings' };
      }
    } catch (err) {
      console.error('Error bulk deleting ratings:', err);
      return { success: false, error: 'Error deleting ratings' };
    }
  };

  const filterRatings = (futsalId: string) => {
    if (futsalId === '') {
      setFilteredRatings(fullRatings);
    } else {
      const filtered = fullRatings.filter(rating => rating.futsal_id.toString() === futsalId);
      setFilteredRatings(filtered);
    }
  };

  return {
    ratings,
    fullRatings,
    loading,
    error: error as Error | null,
    createRating,
    updateRating,
    deleteRating,
    bulkDelete,
    filterRatings,
    refetch
  };
}
