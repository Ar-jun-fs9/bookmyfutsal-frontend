import { useState, useEffect } from 'react';
import { useSlots } from '../hooks/useSlots';
import { useFutsals } from '../hooks/useFutsals';
import { ConfirmModal } from './modals/ConfirmModal';
import { NotificationModal } from './modals/NotificationModal';

interface SlotSectionProps {
  isVisible: boolean;
  onToggle: () => void;
}

export function SlotSection({ isVisible, onToggle }: SlotSectionProps) {
  const { futsals } = useFutsals();
  const { slots, loading, updateSlotStatus, bulkUpdateSlots, fetchSlots, fetchAllSlots } = useSlots();
  const [selectedFutsal, setSelectedFutsal] = useState<number | null>(null);
  const [slotDate, setSlotDate] = useState(new Date().toLocaleDateString('en-CA'));
  const [notification, setNotification] = useState<{ message: string, type: 'success' | 'info' } | null>(null);
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean, message: string, onConfirm: () => void }>({ isOpen: false, message: '', onConfirm: () => { } });

  // Auto-hide notifications after 2 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Auto-fetch slots when futsal or date changes
  useEffect(() => {
    if (isVisible) {
      if (selectedFutsal) {
        fetchSlots(selectedFutsal, slotDate);
      } else {
        fetchAllSlots(futsals, slotDate);
      }
    }
  }, [selectedFutsal, slotDate, isVisible, futsals]);

  const toggleSlotStatus = async (slotId: number, currentStatus: string) => {
    if (currentStatus === 'booked') {
      setNotification({ message: "Cannot modify status of booked slots", type: 'info' });
      return;
    }

    const newStatus = currentStatus === 'available' ? 'disabled' : 'available';

    const result = await updateSlotStatus(slotId, newStatus);
    if (!result.success) {
      setNotification({ message: result.error || "Error updating slot status", type: 'info' });
    }
  };

  const closeAllSlots = () => {
    const availableSlots = slots.filter(slot => slot.status === 'available').length;
    const disabledSlots = slots.filter(slot => slot.status === 'disabled').length;
    const shouldClose = availableSlots > disabledSlots;

    const action = shouldClose ? 'close' : 'open';
    const confirmMessage = selectedFutsal
      ? `Are you sure you want to ${action} all ${shouldClose ? 'available' : 'disabled'} slots for this futsal on this date?`
      : `Are you sure you want to ${action} all ${shouldClose ? 'available' : 'disabled'} slots across all futsals?`;

    setConfirmModal({
      isOpen: true,
      message: confirmMessage,
      onConfirm: async () => {
        setConfirmModal({ isOpen: false, message: '', onConfirm: () => { } });
        const result = await bulkUpdateSlots(selectedFutsal, slotDate, action as 'close' | 'open');
        if (result.success) {
          setNotification({ message: `${result.updatedSlots} slots ${action}d successfully`, type: 'success' });
        } else {
          setNotification({ message: result.error || `Error ${action}ing slots`, type: 'info' });
        }
      }
    });
  };

  if (!isVisible) {
    return (
      <div className="border-2 border-gray-200 rounded-lg p-2">
        <div className="text-center">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            Slot Management
          </h3>
          <button
            onClick={onToggle}
            className="bg-linear-to-r from-blue-500 to-blue-600 text-white font-bold py-2.5 px-6 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 border border-blue-400/30 hover:border-blue-400/50"
          >
            Show All Slots
          </button>
        </div>
      </div>
    );
  }


  return (
    <div className="border-2 border-gray-200 rounded-lg p-2">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-gray-900">Slot Management</h3>
        <div className="flex space-x-4">
          <button
            onClick={closeAllSlots}
            className={`${(() => {
              const availableSlots = slots.filter(slot => slot.status === 'available').length;
              const disabledSlots = slots.filter(slot => slot.status === 'disabled').length;
              return availableSlots > disabledSlots ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700';
            })()} text-white px-4 py-2 rounded`}
          >
            {(() => {
              const availableSlots = slots.filter(slot => slot.status === 'available').length;
              const disabledSlots = slots.filter(slot => slot.status === 'disabled').length;
              return availableSlots > disabledSlots ? (selectedFutsal ? 'Close All' : 'Close All ') : (selectedFutsal ? 'Open All ' : 'Open All ');
            })()}
          </button>
          <button
            onClick={onToggle}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded"
          >
            Hide
          </button>
        </div>
      </div>

      <div className="mb-4 flex items-center space-x-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Select Futsal (Optional)</label>
          <select
            value={selectedFutsal || ''}
            onChange={(e) => setSelectedFutsal(e.target.value ? Number(e.target.value) : null)}
            className="p-2 border rounded"
          >
            <option value="">All Futsals</option>
            {futsals.map((futsal) => (
              <option key={futsal.futsal_id} value={futsal.futsal_id}>
                {futsal.name}
              </option>
            ))}
          </select>
        </div>
        {selectedFutsal && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Date</label>
            <input
              type="date"
              value={slotDate}
              onChange={(e) => setSlotDate(e.target.value)}
              className="p-2 border rounded"
            />
          </div>
        )}
      </div>

      {/* Group slots by futsal and date */}
      {Object.entries(
        slots.reduce((acc: Record<string, any[]>, slot: any) => {
          const formattedDate = new Date(slot.slot_date).toLocaleDateString('en-CA');
          const key = `${slot.futsal_name || 'Unknown Futsal'} - ${formattedDate}`;
          if (!acc[key]) acc[key] = [];
          acc[key].push(slot);
          return acc;
        }, {} as Record<string, any[]>)
      ).map(([futsalDate, futsalSlots]) => (
        <div key={futsalDate} className="mb-6">
          <h4 className="text-lg font-semibold mb-3">{futsalDate}</h4>
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {futsalSlots.map((slot) => (
              <div
                key={slot.slot_id}
                className={`p-2 border rounded ${slot.display_status === 'booked'
                  ? 'bg-red-100 border-red-500'
                  : slot.display_status === 'expired'
                    ? 'bg-yellow-100 border-yellow-500'
                    : slot.status === 'disabled'
                      ? 'bg-gray-100 border-gray-500'
                      : 'bg-green-100 border-green-500'
                  }`}
              >
                <div className="font-semibold text-center mb-2 md:mb-2 text-sm md:text-base">
                  {(() => {
                    const startHour = parseInt(slot.start_time.split(':')[0]);
                    const endHour = parseInt(slot.end_time.split(':')[0]);
                    const startDisplay = startHour === 0 ? 12 : startHour > 12 ? startHour - 12 : startHour;
                    const endDisplay = endHour === 0 ? 12 : endHour > 12 ? endHour - 12 : endHour;
                    const startPeriod = startHour >= 12 ? 'PM' : 'AM';
                    const endPeriod = endHour >= 12 ? 'PM' : 'AM';
                    return `${startDisplay}${startPeriod}-${endDisplay}${endPeriod}`;
                  })()} {
                    slot.display_status === 'booked' ? 'Booked' :
                      slot.display_status === 'expired' ? 'Expired' :
                        slot.status === 'disabled' ? 'Disabled' : 'Available'
                  }
                </div>
                <div className="text-sm text-center text-gray-600 mb-2">{slot.shift_category}</div>
                {slot.display_status === 'booked' && (
                  <div className="text-xs text-center text-gray-500 mb-2">
                    Booked by {slot.booker_name || 'User'}
                  </div>
                )}
                <div className="flex space-x-2">
                  <button
                    onClick={() => toggleSlotStatus(slot.slot_id, slot.status)}
                    disabled={slot.display_status === 'booked' || slot.display_status === 'expired'}
                    className={`flex-1 px-3 py-1 rounded text-sm ${slot.status === 'available'
                      ? 'bg-red-600 hover:bg-red-700 text-white'
                      : 'bg-green-600 hover:bg-green-700 text-white'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {slot.status === 'available' ? 'Close Slot' : 'Open Slot'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Modals */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal({ isOpen: false, message: '', onConfirm: () => { } })}
      />

      <NotificationModal
        isOpen={!!notification}
        message={notification?.message || ''}
        type={notification?.type || 'info'}
        onClose={() => setNotification(null)}
      />
    </div>
  );
}