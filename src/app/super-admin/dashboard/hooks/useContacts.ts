import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';

interface UseContactsOptions {
  enabled?: boolean;
}

interface Contact {
  id: number;
  name: string;
  email: string;
  subject: string | null;
  message: string;
  phone: string | null;
  ip_address: string;
  user_agent: string;
  is_read: boolean;
  created_at: string;
  updated_at: string;
}

const QUERY_KEY = ['contacts'];

async function fetchContacts(accessToken?: string): Promise<{ contacts: Contact[] }> {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/contact`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  });
  
  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Unauthorized');
    }
    throw new Error('Failed to fetch contacts');
  }
  
  return response.json();
}

export function useContacts(options: UseContactsOptions = {}) {
  const { enabled = true } = options;
  const { tokens } = useAuthStore();
  const queryClient = useQueryClient();

  // Use React Query for data fetching with caching
  const { data, isLoading: loading, error, refetch } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => fetchContacts(tokens?.accessToken),
    enabled: enabled && !!tokens?.accessToken,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
    refetchOnMount: false, // Don't refetch when component mounts
    refetchOnWindowFocus: false, // Don't refetch when window regains focus
    throwOnError: false,
  });

  const contacts = data?.contacts || [];

  // Mutation for deleting contact
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/contact/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${tokens?.accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Error deleting contact');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });

  // Mutation for marking contact as read
  const markAsReadMutation = useMutation({
    mutationFn: async ({ id, isRead }: { id: number; isRead: boolean }) => {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/contact/${id}/read`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${tokens?.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ is_read: isRead })
      });

      if (!response.ok) {
        throw new Error('Error updating contact status');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });

  // Wrapper functions for compatibility
  const deleteContact = async (id: number) => {
    try {
      await deleteMutation.mutateAsync(id);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const markAsRead = async (id: number, isRead: boolean) => {
    try {
      await markAsReadMutation.mutateAsync({ id, isRead });
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  return {
    contacts,
    loading,
    error: error as Error | null,
    deleteContact,
    markAsRead,
    refetch
  };
}
