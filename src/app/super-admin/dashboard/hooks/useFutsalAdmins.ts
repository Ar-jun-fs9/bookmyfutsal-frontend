import { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useSocketStore } from '@/stores/socketStore';

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

export function useFutsalAdmins() {
  const { tokens } = useAuthStore();
  const { socket } = useSocketStore();
  const [admins, setAdmins] = useState<FutsalAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/futsal-admins`, {
        headers: {
          'Authorization': `Bearer ${tokens?.accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const data = await response.json();
        setAdmins(data);
        setError(null);
      } else if (response.status === 401) {
        setError('Unauthorized');
      } else {
        setError('Failed to fetch futsal admins');
      }
    } catch (err) {
      setError('Error fetching futsal admins');
      console.error('Error fetching futsal admins:', err);
    } finally {
      setLoading(false);
    }
  };

  const createAdmin = async (formData: any) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/futsal-admins`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tokens?.accessToken}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await fetchAdmins(); // Refresh the list
        return { success: true };
      } else {
        const errorData = await response.json();
        return { success: false, error: errorData.message || 'Error creating futsal admin' };
      }
    } catch (err) {
      console.error('Error creating futsal admin:', err);
      return { success: false, error: 'Error creating futsal admin' };
    }
  };

  const updateAdmin = async (id: number, formData: any) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/futsal-admins/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tokens?.accessToken}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await fetchAdmins(); // Refresh the list
        return { success: true };
      } else {
        const errorData = await response.json();
        return { success: false, error: errorData.message || 'Error updating futsal admin' };
      }
    } catch (err) {
      console.error('Error updating futsal admin:', err);
      return { success: false, error: 'Error updating futsal admin' };
    }
  };

  const deleteAdmin = async (id: number) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/futsal-admins/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${tokens?.accessToken}`,
        },
      });

      if (response.ok) {
        setAdmins(admins.filter(a => a.id !== id));
        return { success: true };
      } else {
        return { success: false, error: 'Error deleting futsal admin' };
      }
    } catch (err) {
      console.error('Error deleting futsal admin:', err);
      return { success: false, error: 'Error deleting futsal admin' };
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
        setAdmins(admins.filter(a => !adminIds.includes(a.id)));
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
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/futsal-admins/${id}/block`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tokens?.accessToken}`,
        },
        body: JSON.stringify({ reason, duration_minutes: duration }),
      });

      if (response.ok) {
        return { success: true };
      } else {
        const errorData = await response.json();
        return { success: false, error: errorData.message || 'Error blocking futsal admin' };
      }
    } catch (err) {
      console.error('Error blocking futsal admin:', err);
      return { success: false, error: 'Error blocking futsal admin' };
    }
  };

  const unblockAdmin = async (id: number) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/futsal-admins/${id}/unblock`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tokens?.accessToken}`,
        },
      });

      if (response.ok) {
        return { success: true };
      } else {
        const errorData = await response.json();
        return { success: false, error: errorData.message || 'Error unblocking futsal admin' };
      }
    } catch (err) {
      console.error('Error unblocking futsal admin:', err);
      return { success: false, error: 'Error unblocking futsal admin' };
    }
  };

  useEffect(() => {
    if (tokens?.accessToken) {
      fetchAdmins();
    }
  }, [tokens?.accessToken]);

  // Real-time updates via socket
  useEffect(() => {
    if (!socket) return;

    const handleAdminCreated = (data: any) => {
      setAdmins(prev => [data.admin, ...prev]);
    };

    const handleAdminUpdated = (data: any) => {
      setAdmins(prev => prev.map(a => a.id === data.admin.id ? data.admin : a));
    };

    const handleAdminDeleted = (data: any) => {
      setAdmins(prev => prev.filter(a => a.id !== data.adminId));
    };

    socket.on('futsalAdminCreated', handleAdminCreated);
    socket.on('futsalAdminUpdated', handleAdminUpdated);
    socket.on('futsalAdminDeleted', handleAdminDeleted);

    return () => {
      socket.off('futsalAdminCreated', handleAdminCreated);
      socket.off('futsalAdminUpdated', handleAdminUpdated);
      socket.off('futsalAdminDeleted', handleAdminDeleted);
    };
  }, [socket]);

  return {
    admins,
    loading,
    error,
    createAdmin,
    updateAdmin,
    deleteAdmin,
    bulkDelete,
    blockAdmin,
    unblockAdmin,
    refetch: fetchAdmins
  };
}