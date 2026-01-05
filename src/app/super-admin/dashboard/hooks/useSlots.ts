import { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useSocketStore } from '@/stores/socketStore';

interface Slot {
  slot_id: number;
  futsal_id: number;
  futsal_name?: string;
  slot_date: string;
  start_time: string;
  end_time: string;
  status: 'available' | 'disabled' | 'booked';
  display_status?: 'available' | 'disabled' | 'booked' | 'expired';
  shift_category: string;
  booker_name?: string;
}

export function useSlots() {
  const { tokens } = useAuthStore();
  const { socket } = useSocketStore();
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSlots = async (futsalId: number, date: string, futsals: any[]) => {
    try {
      setLoading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/time-slots/admin/futsal/${futsalId}/date/${date}`, {
        headers: {
          'Authorization': `Bearer ${tokens?.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        const futsalName = futsals.find(f => f.futsal_id === futsalId)?.name || 'Unknown Futsal';
        const slotsWithFutsal = data.slots.map((slot: any) => ({
          ...slot,
          futsal_name: futsalName
        }));
        setSlots(slotsWithFutsal);
        setError(null);
      } else if (response.status === 401) {
        setError('Unauthorized');
      } else {
        setError('Failed to fetch slots');
      }
    } catch (err) {
      setError('Error fetching slots');
      console.error('Error fetching slots:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllSlots = async (futsals: any[], date: string) => {
    try {
      setLoading(true);
      const allSlots = [];
      for (const futsal of futsals) {
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/time-slots/admin/futsal/${futsal.futsal_id}/date/${date}`, {
            headers: {
              'Authorization': `Bearer ${tokens?.accessToken}`,
              'Content-Type': 'application/json'
            }
          });
          if (response.ok) {
            const data = await response.json();
            const slotsWithFutsal = data.slots.map((slot: any) => ({
              ...slot,
              futsal_name: futsal.name
            }));
            allSlots.push(...slotsWithFutsal);
          }
        } catch (error) {
          console.error(`Error fetching slots for futsal ${futsal.futsal_id}:`, error);
        }
      }
      setSlots(allSlots);
      setError(null);
    } catch (err) {
      setError('Error fetching slots');
      console.error('Error fetching all slots:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateSlotStatus = async (slotId: number, status: 'available' | 'disabled') => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/time-slots/${slotId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        setSlots(slots.map(slot =>
          slot.slot_id === slotId ? { ...slot, status } : slot
        ));
        return { success: true };
      } else {
        return { success: false, error: 'Error updating slot status' };
      }
    } catch (err) {
      console.error('Error updating slot status:', err);
      return { success: false, error: 'Error updating slot status' };
    }
  };

  const bulkUpdateSlots = async (futsalId: number | null, date: string, action: 'close' | 'open', futsals: any[]) => {
    try {
      let response;
      if (futsalId) {
        response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/time-slots/futsal/${futsalId}/date/${date}/${action}-all`, {
          method: 'PUT',
        });
      } else {
        response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/time-slots/${action}-all-available`, {
          method: 'PUT',
        });
      }

      if (response.ok) {
        const data = await response.json();
        // Refresh slots after bulk update
        if (futsalId) {
          await fetchSlots(futsalId, date, futsals);
        } else {
          await fetchAllSlots(futsals, date);
        }
        return { success: true, updatedSlots: data.updatedSlots };
      } else {
        return { success: false, error: `Error ${action}ing slots` };
      }
    } catch (err) {
      console.error(`Error ${action}ing slots:`, err);
      return { success: false, error: `Error ${action}ing slots` };
    }
  };

  // Real-time updates via socket
  useEffect(() => {
    if (!socket) return;

    const handleSlotStatusUpdate = (data: any) => {
      setSlots(prevSlots =>
        prevSlots.map(slot =>
          slot.slot_id === data.slotId
            ? { ...slot, status: data.status }
            : slot
        )
      );
    };

    socket.on('slotStatusUpdated', handleSlotStatusUpdate);

    return () => {
      socket.off('slotStatusUpdated', handleSlotStatusUpdate);
    };
  }, [socket]);

  return {
    slots,
    loading,
    error,
    updateSlotStatus,
    bulkUpdateSlots,
    fetchSlots,
    fetchAllSlots
  };
}