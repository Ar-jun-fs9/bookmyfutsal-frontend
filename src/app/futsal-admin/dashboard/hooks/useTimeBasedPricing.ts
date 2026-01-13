import { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';

interface TimeBasedPricing {
  time_based_pricing_id: number;
  futsal_id: number;
  start_time: string;
  end_time: string;
  price: number;
  message?: string;
  created_by: string;
  created_at: string;
  updated_at?: string;
  futsal_name: string;
}

export function useTimeBasedPricing(futsalId?: number) {
  const { tokens } = useAuthStore();
  const [timeBasedPricings, setTimeBasedPricings] = useState<TimeBasedPricing[]>([]);
  const [loading, setLoading] = useState(false);

  // const fetchTimeBasedPricings = async () => {
  //   if (!futsalId || !tokens?.accessToken) return;

  //   setLoading(true);
  //   try {
  //     const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/time-based-pricing/${futsalId}`, {
  //       headers: {
  //         'Authorization': `Bearer ${tokens.accessToken}`,
  //         'Content-Type': 'application/json'
  //       }
  //     });

  //     if (response.ok) {
  //       const data = await response.json();
  //       setTimeBasedPricings(data.timeBasedPricings || []);
  //     }
  //   } catch (error) {
  //     console.error('Error fetching time-based pricings:', error);
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const createTimeBasedPricing = async (data: {
    futsal_id: number;
    start_time: string;
    end_time: string;
    price: number;
    message?: string;
  }) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/time-based-pricing`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tokens?.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      if (response.ok) {
        // await fetchTimeBasedPricings();
        return { success: true };
      } else {
        const errorData = await response.json();
        return { success: false, error: errorData.message };
      }
    } catch (error) {
      console.error('Error creating time-based pricing:', error);
      return { success: false, error: 'Network error' };
    }
  };

  const updateTimeBasedPricing = async (id: number, data: {
    start_time: string;
    end_time: string;
    price: number;
    message?: string;
  }) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/time-based-pricing/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${tokens?.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      if (response.ok) {
        // await fetchTimeBasedPricings();
        return { success: true };
      } else {
        const errorData = await response.json();
        return { success: false, error: errorData.message };
      }
    } catch (error) {
      console.error('Error updating time-based pricing:', error);
      return { success: false, error: 'Network error' };
    }
  };

  const deleteTimeBasedPricing = async (id: number) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/time-based-pricing/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${tokens?.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        // await fetchTimeBasedPricings();
        return { success: true };
      } else {
        const errorData = await response.json();
        return { success: false, error: errorData.message };
      }
    } catch (error) {
      console.error('Error deleting time-based pricing:', error);
      return { success: false, error: 'Network error' };
    }
  };

  useEffect(() => {
    // fetchTimeBasedPricings();
  }, [futsalId, tokens?.accessToken]);

  return {
    timeBasedPricings,
    loading,
    // fetchTimeBasedPricings,
    createTimeBasedPricing,
    updateTimeBasedPricing,
    deleteTimeBasedPricing
  };
}