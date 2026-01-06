import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { useSocketStore } from '@/stores/socketStore';

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

export function useUsers() {
  const { hydrated, tokens } = useAuthStore();
  const { socket } = useSocketStore();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users`, {
        headers: {
          'Authorization': `Bearer ${tokens?.accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
        setError(null);
      } else if (response.status === 401) {
        // Token expired or invalid, redirect to login
        router.push('/super-admin/signin');
      } else {
        setError('Failed to fetch users');
      }
    } catch (err) {
      setError('Error fetching users');
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchBlockedUsers = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/blocked/list`, {
        headers: {
          'Authorization': `Bearer ${tokens?.accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const data = await response.json();
        setBlockedUsers(data.blocked_users);
      } else if (response.status === 401) {
        // Token expired or invalid, redirect to login
        router.push('/super-admin/signin');
      }
    } catch (err) {
      console.error('Error fetching blocked users:', err);
    }
  };

  const updateUser = async (id: number, formData: any) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tokens?.accessToken}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await fetchUsers(); // Refresh the list
        return { success: true };
      } else {
        const errorData = await response.json();
        return { success: false, error: errorData.message || 'Error updating user' };
      }
    } catch (err) {
      console.error('Error updating user:', err);
      return { success: false, error: 'Error updating user' };
    }
  };

  const deleteUser = async (id: number) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${tokens?.accessToken}`,
        },
      });

      if (response.ok) {
        setUsers(users.filter(u => u.user_id !== id));
        return { success: true };
      } else {
        return { success: false, error: 'Error deleting user' };
      }
    } catch (err) {
      console.error('Error deleting user:', err);
      return { success: false, error: 'Error deleting user' };
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
        setUsers(users.filter(u => !userIds.includes(u.user_id)));
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
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/${userId}/block`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tokens?.accessToken}`,
        },
        body: JSON.stringify({ reason }),
      });

      if (response.ok) {
        const data = await response.json();
        await fetchUsers();
        await fetchBlockedUsers();
        return { success: true, blockedUntil: data.blocked_until };
      } else {
        return { success: false, error: 'Error blocking user' };
      }
    } catch (err) {
      console.error('Error blocking user:', err);
      return { success: false, error: 'Error blocking user' };
    }
  };

  const unblockUser = async (userId: number) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/${userId}/unblock`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tokens?.accessToken}`,
        },
      });

      if (response.ok) {
        setBlockedUsers(blockedUsers.filter(u => u.user_id !== userId));
        await fetchUsers(); // Refresh users list
        return { success: true };
      } else {
        return { success: false, error: 'Error unblocking user' };
      }
    } catch (err) {
      console.error('Error unblocking user:', err);
      return { success: false, error: 'Error unblocking user' };
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
        setBlockedUsers(blockedUsers.filter(u => !userIds.includes(u.user_id)));
        await fetchUsers(); // Refresh users list
        return { success: true, unblockedCount: successfulUnblocks };
      } else {
        return { success: false, error: 'Error unblocking users' };
      }
    } catch (err) {
      console.error('Error bulk unblocking users:', err);
      return { success: false, error: 'Error unblocking users' };
    }
  };

  useEffect(() => {
    if (hydrated) {
      const storedUser = sessionStorage.getItem('superadmin');
      if (storedUser) {
        fetchUsers();
        fetchBlockedUsers();
      } else {
        router.push('/super-admin/signin');
      }
    }
  }, [hydrated, router]);

  // Real-time updates via socket
  useEffect(() => {
    if (!socket) return;

    const handleUserCreated = (data: any) => {
      setUsers(prev => [data.user, ...prev]);
    };

    const handleUserUpdated = (data: any) => {
      setUsers(prev => prev.map(u => u.user_id === data.user.user_id ? data.user : u));
    };

    const handleUserDeleted = (data: any) => {
      setUsers(prev => prev.filter(u => u.user_id !== data.userId));
    };

    const handleUserBlocked = (data: any) => {
      fetchBlockedUsers();
      fetchUsers();
    };

    const handleUserUnblocked = (data: any) => {
      setBlockedUsers(prev => prev.filter(u => u.user_id !== data.userId));
      fetchUsers();
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
  }, [socket]);

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
    refetchUsers: fetchUsers,
    refetchBlockedUsers: fetchBlockedUsers
  };
}