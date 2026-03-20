import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';

interface UseSpecialPricesOptions {
  enabled?: boolean;
}

interface SpecialPrice {
  special_price_id: number;
  futsal_id: number;
  type: 'date' | 'recurring' | 'time_based';
  special_date?: string;
  recurring_days?: string[];
  start_time?: string;
  end_time?: string;
  special_price: number;
  message?: string;
  offer_message?: string;
  is_offer: boolean;
  created_by: string;
  created_at: string;
  updated_at?: string;
  futsal_name: string;
}

const QUERY_KEY = ['special-prices', 'all'];

async function fetchSpecialPrices(accessToken?: string): Promise<{ specialPrices: SpecialPrice[] }> {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/special-prices/all`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch special prices');
  }
  
  return response.json();
}

export function useSpecialPrices(options: UseSpecialPricesOptions = {}) {
  const { enabled = true } = options;
  const { tokens } = useAuthStore();
  const queryClient = useQueryClient();

  // Use React Query for data fetching with caching
  const { data, isLoading: loading, error, refetch } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => fetchSpecialPrices(tokens?.accessToken),
    enabled: enabled && !!tokens?.accessToken,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
    refetchOnMount: false, // Don't refetch when component mounts
    refetchOnWindowFocus: false, // Don't refetch when window regains focus
    throwOnError: false,
  });

  const specialPrices = data?.specialPrices || [];

  // Mutation for creating special price
  const createMutation = useMutation({
    mutationFn: async (data: {
      futsal_id: number;
      type?: 'date' | 'recurring' | 'time_based';
      special_dates?: string[];
      recurring_days?: string[];
      start_time?: string;
      end_time?: string;
      special_price: number;
      message?: string;
      is_offer?: boolean;
    }) => {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/special-prices`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tokens?.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error creating special price');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });

  // Mutation for updating special price
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/special-prices/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${tokens?.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error updating special price');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });

  // Mutation for deleting special price
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/special-prices/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${tokens?.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Error deleting special price');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });

  // Wrapper functions for compatibility
  const createSpecialPrice = async (data: {
    futsal_id: number;
    type?: 'date' | 'recurring' | 'time_based';
    special_dates?: string[];
    recurring_days?: string[];
    start_time?: string;
    end_time?: string;
    special_price: number;
    message?: string;
    is_offer?: boolean;
  }) => {
    try {
      await createMutation.mutateAsync(data);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const updateSpecialPrice = async (id: number, data: any) => {
    try {
      await updateMutation.mutateAsync({ id, data });
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const deleteSpecialPrice = async (id: number) => {
    try {
      await deleteMutation.mutateAsync(id);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const fetchSpecialPricesDirect = async (futsalId?: number) => {
    // This is kept for backwards compatibility but should use refetch() instead
    refetch();
  };

  const updateLocalSpecialPrice = (id: number, updates: Partial<SpecialPrice>) => {
    queryClient.setQueryData<{ specialPrices: SpecialPrice[] }>(QUERY_KEY, (old) => {
      if (!old) return old;
      return {
        ...old,
        specialPrices: old.specialPrices.map(price =>
          price.special_price_id === id ? { ...price, ...updates } : price
        )
      };
    });
  };

  return {
    specialPrices,
    loading,
    error: error as Error | null,
    fetchSpecialPrices: fetchSpecialPricesDirect,
    createSpecialPrice,
    updateSpecialPrice,
    deleteSpecialPrice,
    updateLocalSpecialPrice,
    refetch
  };
}
