import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import { useSocketStore } from '@/stores/socketStore';
import { useEffect } from 'react';

interface UseFutsalAdminsOptions {
  enabled?: boolean;
}

interface FutsalAdmin {
  id: number;
  username: string;
  email: string;
  phone: string;
  futsal_name: string;
  futsal_id: number;
  created_at: string;
  is_blocked?: boolean;
  blocked_until?: string;
}

const QUERY_KEY = ['futsal-admins'];

async function fetchFutsalAdmins(accessToken?: string): Promise<FutsalAdmin[]> {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/futsal-admins`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  });
  
  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Unauthorized');
    }
    throw new Error('Failed to fetch futsal admins');
  }
  
  return response.json();
}

export function useFutsalAdmins(options: UseFutsalAdminsOptions = {}) {
  const { enabled = true } = options;
  const { tokens } = useAuthStore();
  const { socket } = useSocketStore();
  const queryClient = useQueryClient();

  // Use React Query for data fetching with caching
  const { data: admins = [], isLoading: loading, error, refetch } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => fetchFutsalAdmins(tokens?.accessToken),
    enabled: enabled && !!tokens?.accessToken,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
    refetchOnMount: false, // Don't refetch when component mounts
    refetchOnWindowFocus: false, // Don't refetch when window regains focus
    throwOnError: false,
  });

  // Mutation for creating admin
  const createMutation = useMutation({
    mutationFn: async (formData: any) => {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/futsal-admins`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tokens?.accessToken}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error creating futsal admin');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });

  // Mutation for updating admin
  const updateMutation = useMutation({
    mutationFn: async ({ id, formData }: { id: number; formData: any }) => {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/futsal-admins/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tokens?.accessToken}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error updating futsal admin');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });

  // Mutation for deleting admin
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/futsal-admins/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${tokens?.accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Error deleting futsal admin');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });

  // Mutation for blocking admin
  const blockMutation = useMutation({
    mutationFn: async ({ id, reason, duration }: { id: number; reason?: string; duration?: number }) => {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/futsal-admins/${id}/block`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tokens?.accessToken}`,
        },
        body: JSON.stringify({ reason, duration_minutes: duration }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error blocking futsal admin');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });

  // Mutation for unblocking admin
  const unblockMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/futsal-admins/${id}/unblock`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tokens?.accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Error unblocking futsal admin');
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

    const handleAdminCreated = (data: any) => {
      queryClient.setQueryData<FutsalAdmin[]>(QUERY_KEY, (old) =>
        old ? [data.admin, ...old] : [data.admin]
      );
    };

    const handleAdminUpdated = (data: any) => {
      queryClient.setQueryData<FutsalAdmin[]>(QUERY_KEY, (old) =>
        old ? old.map(a => a.id === data.admin.id ? data.admin : a) : old
      );
    };

    const handleAdminDeleted = (data: any) => {
      queryClient.setQueryData<FutsalAdmin[]>(QUERY_KEY, (old) =>
        old ? old.filter(a => a.id !== data.adminId) : old
      );
    };

    socket.on('futsalAdminCreated', handleAdminCreated);
    socket.on('futsalAdminUpdated', handleAdminUpdated);
    socket.on('futsalAdminDeleted', handleAdminDeleted);

    return () => {
      socket.off('futsalAdminCreated', handleAdminCreated);
      socket.off('futsalAdminUpdated', handleAdminUpdated);
      socket.off('futsalAdminDeleted', handleAdminDeleted);
    };
  }, [socket, queryClient]);

  // Wrapper functions for compatibility
  const createAdmin = async (formData: any) => {
    try {
      await createMutation.mutateAsync(formData);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const updateAdmin = async (id: number, formData: any) => {
    try {
      await updateMutation.mutateAsync({ id, formData });
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const deleteAdmin = async (id: number) => {
    try {
      await deleteMutation.mutateAsync(id);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const bulkDelete = async (adminIds: number[]) => {
    try {
      const deletePromises = adminIds.map(id =>
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/futsal-admins/${id}`, {
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
        return { success: false, error: 'Error deleting futsal admins' };
      }
    } catch (err) {
      console.error('Error bulk deleting futsal admins:', err);
      return { success: false, error: 'Error deleting futsal admins' };
    }
  };

  const blockAdmin = async (id: number, reason?: string, duration?: number) => {
    try {
      await blockMutation.mutateAsync({ id, reason, duration });
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const unblockAdmin = async (id: number) => {
    try {
      await unblockMutation.mutateAsync(id);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  return {
    admins,
    loading,
    error: error as Error | null,
    createAdmin,
    updateAdmin,
    deleteAdmin,
    bulkDelete,
    blockAdmin,
    unblockAdmin,
    refetch
  };
}
