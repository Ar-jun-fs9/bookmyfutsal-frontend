import { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';

interface SpecialPrice {
  special_price_id: number;
  futsal_id: number;
  type: 'date' | 'recurring' | 'time_based';
  special_date?: string;
  recurring_days?: string[];
  start_time?: string;
  end_time?: string;
  special_price: number;
  message?: string;
  offer_message?: string;
  is_offer: boolean;
  created_by: string;
  created_at: string;
  updated_at?: string;
  futsal_name: string;
}

export function useSpecialPrices() {
  const { tokens } = useAuthStore();
  const [specialPrices, setSpecialPrices] = useState<SpecialPrice[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchSpecialPrices = async (futsalId?: number) => {
    setLoading(true);
    try {
      const url = futsalId
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/special-prices/${futsalId}`
        : `${process.env.NEXT_PUBLIC_API_URL}/api/special-prices/all`; // Assuming we add an endpoint for all

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${tokens?.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSpecialPrices(data.specialPrices || []);
      }
    } catch (error) {
      console.error('Error fetching special prices:', error);
    } finally {
      setLoading(false);
    }
  };

  const createSpecialPrice = async (data: {
    futsal_id: number;
    type?: 'date' | 'recurring' | 'time_based';
    special_dates?: string[];
    recurring_days?: string[];
    start_time?: string;
    end_time?: string;
    special_price: number;
    message?: string;
    is_offer?: boolean;
  }) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/special-prices`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tokens?.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      if (response.ok) {
        return { success: true };
      } else {
        const errorData = await response.json();
        return { success: false, error: errorData.message };
      }
    } catch (error) {
      console.error('Error creating special price:', error);
      return { success: false, error: 'Network error' };
    }
  };

  const updateSpecialPrice = async (id: number, data: {
    special_price: number;
    message?: string;
    offer_message?: string;
    special_date?: string;
    recurring_days?: string[];
    start_time?: string;
    end_time?: string;
    is_offer?: boolean;
  }) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/special-prices/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${tokens?.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      if (response.ok) {
        return { success: true };
      } else {
        const errorData = await response.json();
        return { success: false, error: errorData.message };
      }
    } catch (error) {
      console.error('Error updating special price:', error);
      return { success: false, error: 'Network error' };
    }
  };

  const deleteSpecialPrice = async (id: number) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/special-prices/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${tokens?.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        return { success: true };
      } else {
        const errorData = await response.json();
        return { success: false, error: errorData.message };
      }
    } catch (error) {
      console.error('Error deleting special price:', error);
      return { success: false, error: 'Network error' };
    }
  };

  useEffect(() => {
    if (tokens?.accessToken) {
      fetchSpecialPrices();
    }
  }, [tokens?.accessToken]);

  return {
    specialPrices,
    loading,
    fetchSpecialPrices,
    createSpecialPrice,
    updateSpecialPrice,
    deleteSpecialPrice
  };
}