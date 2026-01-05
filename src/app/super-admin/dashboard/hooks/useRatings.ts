import { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useSocketStore } from '@/stores/socketStore';

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

export function useRatings() {
  const { tokens } = useAuthStore();
  const { socket } = useSocketStore();
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [fullRatings, setFullRatings] = useState<Rating[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRatings = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/ratings`, {
        headers: {
          'Authorization': `Bearer ${tokens?.accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const data = await response.json();
        setFullRatings(data.ratings);
        setRatings(data.ratings);
        setError(null);
      } else if (response.status === 401) {
        setError('Unauthorized');
      } else {
        setError('Failed to fetch ratings');
      }
    } catch (err) {
      setError('Error fetching ratings');
      console.error('Error fetching ratings:', err);
    } finally {
      setLoading(false);
    }
  };

  const createRating = async (formData: any) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/ratings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await fetchRatings(); // Refresh the list
        return { success: true };
      } else {
        const errorData = await response.json();
        return { success: false, error: errorData.message || 'Error creating rating' };
      }
    } catch (err) {
      console.error('Error creating rating:', err);
      return { success: false, error: 'Error creating rating' };
    }
  };

  const updateRating = async (id: number, formData: any) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/ratings/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setRatings(ratings.map(r => r.id === id ? { ...r, ...formData } : r));
        setFullRatings(fullRatings.map(r => r.id === id ? { ...r, ...formData } : r));
        return { success: true };
      } else {
        const errorData = await response.json();
        return { success: false, error: errorData.message || 'Error updating rating' };
      }
    } catch (err) {
      console.error('Error updating rating:', err);
      return { success: false, error: 'Error updating rating' };
    }
  };

  const deleteRating = async (id: number) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/ratings/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${tokens?.accessToken}`,
        },
      });

      if (response.ok) {
        setRatings(ratings.filter(r => r.id !== id));
        setFullRatings(fullRatings.filter(r => r.id !== id));
        return { success: true };
      } else {
        return { success: false, error: 'Error deleting rating' };
      }
    } catch (err) {
      console.error('Error deleting rating:', err);
      return { success: false, error: 'Error deleting rating' };
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
        setRatings(ratings.filter(r => !ratingIds.includes(r.id)));
        setFullRatings(fullRatings.filter(r => !ratingIds.includes(r.id)));
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
      setRatings(fullRatings);
    } else {
      const filtered = fullRatings.filter(rating => rating.futsal_id.toString() === futsalId);
      setRatings(filtered);
    }
  };

  useEffect(() => {
    if (tokens?.accessToken) {
      fetchRatings();
    }
  }, [tokens?.accessToken]);

  // Real-time updates via socket
  useEffect(() => {
    if (!socket) return;

    const handleRatingCreated = (data: any) => {
      setRatings(prev => [data.rating, ...prev]);
      setFullRatings(prev => [data.rating, ...prev]);
    };

    const handleRatingUpdated = (data: any) => {
      setRatings(prev => prev.map(r => r.id === data.rating.id ? data.rating : r));
      setFullRatings(prev => prev.map(r => r.id === data.rating.id ? data.rating : r));
    };

    const handleRatingDeleted = (data: any) => {
      setRatings(prev => prev.filter(r => r.id !== data.ratingId));
      setFullRatings(prev => prev.filter(r => r.id !== data.ratingId));
    };

    socket.on('ratingCreated', handleRatingCreated);
    socket.on('ratingUpdated', handleRatingUpdated);
    socket.on('ratingDeleted', handleRatingDeleted);

    return () => {
      socket.off('ratingCreated', handleRatingCreated);
      socket.off('ratingUpdated', handleRatingUpdated);
      socket.off('ratingDeleted', handleRatingDeleted);
    };
  }, [socket]);

  return {
    ratings,
    fullRatings,
    loading,
    error,
    createRating,
    updateRating,
    deleteRating,
    bulkDelete,
    filterRatings,
    refetch: fetchRatings
  };
}