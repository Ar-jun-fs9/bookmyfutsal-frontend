import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import { useSocketStore } from '@/stores/socketStore';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface UseUsersOptions {
  enabled?: boolean;
}

interface User {
  user_id: number;
  first_name: string;
  last_name: string;
  username: string;
  email: string;
  phone: string;
  created_at: string;
}

interface BlockedUser {
  block_id: number;
  user_id: number;
  first_name: string;
  last_name: string;
  username: string;
  email: string;
  phone: string;
  blocked_until: string;
  reason: string;
}

const USERS_QUERY_KEY = ['users'];
const BLOCKED_USERS_QUERY_KEY = ['users', 'blocked'];

async function fetchUsers(accessToken?: string): Promise<{ users: User[] }> {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  });
  
  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Unauthorized');
    }
    throw new Error('Failed to fetch users');
  }
  
  return response.json();
}

async function fetchBlockedUsers(accessToken?: string): Promise<{ blocked_users: BlockedUser[] }> {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/blocked/list`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  });
  
  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Unauthorized');
    }
    throw new Error('Failed to fetch blocked users');
  }
  
  return response.json();
}

export function useUsers(options: UseUsersOptions = {}) {
  const { enabled = true } = options;
  const { hydrated, tokens } = useAuthStore();
  const { socket } = useSocketStore();
  const router = useRouter();
  const queryClient = useQueryClient();

  // Use React Query for data fetching with caching
  const { data: usersData, isLoading: usersLoading, error: usersError, refetch: refetchUsers } = useQuery({
    queryKey: USERS_QUERY_KEY,
    queryFn: () => fetchUsers(tokens?.accessToken),
    enabled: enabled && !!tokens?.accessToken,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
    refetchOnMount: false, // Don't refetch when component mounts
    refetchOnWindowFocus: false, // Don't refetch when window regains focus
    throwOnError: false,
  });

  const { data: blockedData, isLoading: blockedLoading, refetch: refetchBlockedUsers } = useQuery({
    queryKey: BLOCKED_USERS_QUERY_KEY,
    queryFn: () => fetchBlockedUsers(tokens?.accessToken),
    enabled: enabled && !!tokens?.accessToken,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
    refetchOnMount: false, // Don't refetch when component mounts
    refetchOnWindowFocus: false, // Don't refetch when window regains focus
    throwOnError: false,
  });

  const users = usersData?.users || [];
  const blockedUsers = blockedData?.blocked_users || [];
  const loading = usersLoading || blockedLoading;
  const error = usersError as Error | null;

  // Mutation for updating user
  const updateMutation = useMutation({
    mutationFn: async ({ id, formData }: { id: number; formData: any }) => {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tokens?.accessToken}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error updating user');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY });
    },
  });

  // Mutation for deleting user
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${tokens?.accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Error deleting user');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY });
    },
  });

  // Mutation for blocking user
  const blockMutation = useMutation({
    mutationFn: async ({ userId, reason }: { userId: number; reason: string }) => {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/${userId}/block`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tokens?.accessToken}`,
        },
        body: JSON.stringify({ reason }),
      });

      if (!response.ok) {
        throw new Error('Error blocking user');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: BLOCKED_USERS_QUERY_KEY });
    },
  });

  // Mutation for unblocking user
  const unblockMutation = useMutation({
    mutationFn: async (userId: number) => {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/${userId}/unblock`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tokens?.accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Error unblocking user');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: BLOCKED_USERS_QUERY_KEY });
    },
  });

  // Real-time updates via socket - update cache directly
  useEffect(() => {
    if (!socket) return;

    const handleUserCreated = (data: any) => {
      queryClient.setQueryData<{ users: User[] }>(USERS_QUERY_KEY, (old) => {
        if (!old) return { users: [data.user] };
        return { users: [data.user, ...old.users] };
      });
    };

    const handleUserUpdated = (data: any) => {
      queryClient.setQueryData<{ users: User[] }>(USERS_QUERY_KEY, (old) => {
        if (!old) return old;
        return {
          users: old.users.map(u => u.user_id === data.user.user_id ? data.user : u)
        };
      });
    };

    const handleUserDeleted = (data: any) => {
      queryClient.setQueryData<{ users: User[] }>(USERS_QUERY_KEY, (old) => {
        if (!old) return old;
        return {
          users: old.users.filter(u => u.user_id !== data.userId)
        };
      });
    };

    const handleUserBlocked = () => {
      queryClient.invalidateQueries({ queryKey: BLOCKED_USERS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY });
    };

    const handleUserUnblocked = (data: any) => {
      queryClient.setQueryData<{ blocked_users: BlockedUser[] }>(BLOCKED_USERS_QUERY_KEY, (old) => {
        if (!old) return old;
        return {
          blocked_users: old.blocked_users.filter(u => u.user_id !== data.userId)
        };
      });
      queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY });
    };

    socket.on('userCreated', handleUserCreated);
    socket.on('userUpdated', handleUserUpdated);
    socket.on('userDeleted', handleUserDeleted);
    socket.on('userBlocked', handleUserBlocked);
    socket.on('userUnblocked', handleUserUnblocked);

    return () => {
      socket.off('userCreated', handleUserCreated);
      socket.off('userUpdated', handleUserUpdated);
      socket.off('userDeleted', handleUserDeleted);
      socket.off('userBlocked', handleUserBlocked);
      socket.off('userUnblocked', handleUserUnblocked);
    };
  }, [socket, queryClient]);

  // Wrapper functions for compatibility
  const updateUser = async (id: number, formData: any) => {
    try {
      await updateMutation.mutateAsync({ id, formData });
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const deleteUser = async (id: number) => {
    try {
      await deleteMutation.mutateAsync(id);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const bulkDelete = async (userIds: number[]) => {
    try {
      const deletePromises = userIds.map(id =>
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${tokens?.accessToken}`,
          },
        })
      );

      const results = await Promise.all(deletePromises);
      const successfulDeletes = results.filter(response => response.ok).length;

      if (successfulDeletes > 0) {
        queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY });
        return { success: true, deletedCount: successfulDeletes };
      } else {
        return { success: false, error: 'Error deleting users' };
      }
    } catch (err) {
      console.error('Error bulk deleting users:', err);
      return { success: false, error: 'Error deleting users' };
    }
  };

  const blockUser = async (userId: number, reason: string) => {
    try {
      const result = await blockMutation.mutateAsync({ userId, reason });
      // Return the blockedUntil date from the response
      return { success: true, blockedUntil: result.blockedUntil };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const unblockUser = async (userId: number) => {
    try {
      await unblockMutation.mutateAsync(userId);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const bulkUnblock = async (userIds: number[]) => {
    try {
      const unblockPromises = userIds.map(id =>
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/${id}/unblock`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${tokens?.accessToken}`,
          },
        })
      );

      const results = await Promise.all(unblockPromises);
      const successfulUnblocks = results.filter(response => response.ok).length;

      if (successfulUnblocks > 0) {
        queryClient.invalidateQueries({ queryKey: BLOCKED_USERS_QUERY_KEY });
        queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY });
        return { success: true, unblockedCount: successfulUnblocks };
      } else {
        return { success: false, error: 'Error unblocking users' };
      }
    } catch (err) {
      console.error('Error bulk unblocking users:', err);
      return { success: false, error: 'Error unblocking users' };
    }
  };

  return {
    users,
    blockedUsers,
    loading,
    error,
    updateUser,
    deleteUser,
    bulkDelete,
    blockUser,
    unblockUser,
    bulkUnblock,
    refetchUsers,
    refetchBlockedUsers
  };
}
