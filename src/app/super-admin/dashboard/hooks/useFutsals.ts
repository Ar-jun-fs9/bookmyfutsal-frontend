import { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useSocketStore } from '@/stores/socketStore';

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

export function useFutsals() {
  const { tokens } = useAuthStore();
  const { socket } = useSocketStore();
  const [futsals, setFutsals] = useState<Futsal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFutsals = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/futsals`, {
        headers: {
          'Authorization': `Bearer ${tokens?.accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const data = await response.json();
        setFutsals(data);
        setError(null);
      } else if (response.status === 401) {
        setError('Unauthorized');
      } else {
        setError('Failed to fetch futsals');
      }
    } catch (err) {
      setError('Error fetching futsals');
      console.error('Error fetching futsals:', err);
    } finally {
      setLoading(false);
    }
  };

  const createFutsal = async (formData: FormData) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/futsals`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        await fetchFutsals(); // Refresh the list
        return { success: true };
      } else {
        const errorData = await response.json();
        return { success: false, error: errorData.message || 'Error creating futsal' };
      }
    } catch (err) {
      console.error('Error creating futsal:', err);
      return { success: false, error: 'Error creating futsal' };
    }
  };

  const updateFutsal = async (id: number, formData: FormData) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/futsals/${id}`, {
        method: 'PUT',
        body: formData,
      });

      if (response.ok) {
        await fetchFutsals(); // Refresh the list
        return { success: true };
      } else {
        const errorData = await response.json();
        return { success: false, error: errorData.message || 'Error updating futsal' };
      }
    } catch (err) {
      console.error('Error updating futsal:', err);
      return { success: false, error: 'Error updating futsal' };
    }
  };

  const deleteFutsal = async (id: number) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/futsals/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setFutsals(futsals.filter(f => f.futsal_id !== id));
        return { success: true };
      } else {
        return { success: false, error: 'Error deleting futsal' };
      }
    } catch (err) {
      console.error('Error deleting futsal:', err);
      return { success: false, error: 'Error deleting futsal' };
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
        setFutsals(futsals.filter(f => !futsalIds.includes(f.futsal_id)));
        return { success: true, deletedCount: successfulDeletes };
      } else {
        return { success: false, error: 'Error deleting futsals' };
      }
    } catch (err) {
      console.error('Error bulk deleting futsals:', err);
      return { success: false, error: 'Error deleting futsals' };
    }
  };

  useEffect(() => {
    if (tokens?.accessToken) {
      fetchFutsals();
    }
  }, [tokens?.accessToken]);

  // Real-time updates via socket
  useEffect(() => {
    if (!socket) return;

    const handleFutsalCreated = (data: any) => {
      setFutsals(prev => [data.futsal, ...prev]);
    };

    const handleFutsalUpdated = (data: any) => {
      setFutsals(prev => prev.map(f => f.futsal_id === data.futsal.futsal_id ? data.futsal : f));
    };

    const handleFutsalDeleted = (data: any) => {
      setFutsals(prev => prev.filter(f => f.futsal_id !== data.futsalId));
    };

    socket.on('futsalCreated', handleFutsalCreated);
    socket.on('futsalUpdated', handleFutsalUpdated);
    socket.on('futsalDeleted', handleFutsalDeleted);

    return () => {
      socket.off('futsalCreated', handleFutsalCreated);
      socket.off('futsalUpdated', handleFutsalUpdated);
      socket.off('futsalDeleted', handleFutsalDeleted);
    };
  }, [socket]);

  return {
    futsals,
    loading,
    error,
    createFutsal,
    updateFutsal,
    deleteFutsal,
    bulkDelete,
    refetch: fetchFutsals
  };
}