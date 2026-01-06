import { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';

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

export function useFeedbacks() {
  const { tokens } = useAuthStore();
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFeedbacks = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/feedback`, {
        headers: {
          'Authorization': `Bearer ${tokens?.accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const data = await response.json();
        setFeedbacks(data.feedbacks);
        setError(null);
      } else if (response.status === 401) {
        setError('Unauthorized');
      } else {
        setError('Failed to fetch feedbacks');
      }
    } catch (err) {
      setError('Error fetching feedbacks');
      console.error('Error fetching feedbacks:', err);
    } finally {
      setLoading(false);
    }
  };

  const deleteFeedback = async (id: number) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/feedback/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${tokens?.accessToken}`,
        },
      });

      if (response.ok) {
        setFeedbacks(feedbacks.filter(f => f.id !== id));
        return { success: true };
      } else {
        return { success: false, error: 'Error deleting feedback' };
      }
    } catch (err) {
      console.error('Error deleting feedback:', err);
      return { success: false, error: 'Error deleting feedback' };
    }
  };

  useEffect(() => {
    if (tokens?.accessToken) {
      fetchFeedbacks();
    }
  }, [tokens?.accessToken]);

  return {
    feedbacks,
    loading,
    error,
    deleteFeedback,
    refetch: fetchFeedbacks
  };
}