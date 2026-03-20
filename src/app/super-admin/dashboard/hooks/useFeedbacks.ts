import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';

interface UseFeedbacksOptions {
  enabled?: boolean;
}

interface Feedback {
  id: number;
  name: string | null;
  is_anonymous: boolean;
  rating: number;
  selected_issues: string[];
  message: string;
  user_agent: string;
  page_url: string;
  ip_address: string;
  session_id: string;
  browser_info: any;
  device_info: any;
  created_at: string;
  updated_at: string;
}

const QUERY_KEY = ['feedbacks'];

async function fetchFeedbacks(accessToken?: string): Promise<{ feedbacks: Feedback[] }> {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/feedback`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  });
  
  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Unauthorized');
    }
    throw new Error('Failed to fetch feedbacks');
  }
  
  return response.json();
}

export function useFeedbacks(options: UseFeedbacksOptions = {}) {
  const { enabled = true } = options;
  const { tokens } = useAuthStore();
  const queryClient = useQueryClient();

  // Use React Query for data fetching with caching
  const { data, isLoading: loading, error, refetch } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => fetchFeedbacks(tokens?.accessToken),
    enabled: enabled && !!tokens?.accessToken,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
    refetchOnMount: false, // Don't refetch when component mounts
    refetchOnWindowFocus: false, // Don't refetch when window regains focus
    throwOnError: false,
  });

  const feedbacks = data?.feedbacks || [];

  // Mutation for deleting feedback
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/feedback/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${tokens?.accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Error deleting feedback');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });

  // Wrapper functions for compatibility
  const deleteFeedback = async (id: number) => {
    try {
      await deleteMutation.mutateAsync(id);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  return {
    feedbacks,
    loading,
    error: error as Error | null,
    deleteFeedback,
    refetch
  };
}
