import { useState, useEffect } from 'react';
import { useBookings } from '../hooks/useBookings';
import { useBulkOperations } from '../hooks/useBulkOperations';
import { useFutsals } from '../hooks/useFutsals';
import { categorizeBooking, formatTimeRange, formatDate } from '../utils/bookingUtils';
import { ConfirmModal } from './modals/ConfirmModal';
import { NotificationModal } from './modals/NotificationModal';
import { EditBookingForm } from './forms/EditBookingForm';

interface BookingSectionProps {
  isVisible: boolean;
  onToggle: () => void;
}

export function BookingSection({ isVisible, onToggle }: BookingSectionProps) {
  const { futsals } = useFutsals();
  const {
    filteredBookings,
    loading,
    searchTerm,
    setSearchTerm,
    futsalFilter,
    setFutsalFilter,
    bookingFilter,
    setBookingFilter,
    deleteBooking,
    cancelBooking,
    bulkDelete
  } = useBookings();
  const { selectedItems, showCheckboxes, toggleSelection, toggleSelectAll, clearSelection, selectedCount } = useBulkOperations();
  const [editingBooking, setEditingBooking] = useState<any | null>(null);
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'info'} | null>(null);
  const [confirmModal, setConfirmModal] = useState<{isOpen: boolean, message: string, onConfirm: () => void}>({isOpen: false, message: '', onConfirm: () => {}});

  // Auto-hide notifications after 2 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const handleDeleteBooking = (id: number) => {
    setConfirmModal({
      isOpen: true,
      message: 'Are you sure you want to delete this booking permanently?',
      onConfirm: async () => {
        setConfirmModal({ isOpen: false, message: '', onConfirm: () => {} });
        const result = await deleteBooking(id);
        if (result.success) {
          setNotification({ message: 'Booking deleted successfully', type: 'success' });
        } else {
          setNotification({ message: result.error || 'Error deleting booking', type: 'info' });
        }
      }
    });
  };

  const handleCancelBooking = (id: number, type: 'expired' | 'cancelled' | 'active') => {
    const messages = {
      expired: 'Are you sure you want to delete this expired booking permanently?',
      cancelled: 'Are you sure you want to delete this cancelled booking permanently?',
      active: 'Confirm Action\nAre you sure you want to cancel this booking permanently?'
    };

    setConfirmModal({
      isOpen: true,
      message: messages[type],
      onConfirm: async () => {
        setConfirmModal({ isOpen: false, message: '', onConfirm: () => {} });
        const result = await cancelBooking(id);
        if (result.success) {
          setNotification({ message: type === 'active' ? "Booking cancelled successfully" : "Booking deleted successfully", type: 'success' });
        } else {
          setNotification({ message: result.error || (type === 'active' ? "Error cancelling booking" : "Error deleting booking"), type: 'info' });
        }
      }
    });
  };

  const handleDeleteSelectedBookings = async () => {
    if (selectedItems.length === 0) {
      setNotification({ message: 'No bookings selected', type: 'info' });
      return;
    }

    const filterMessages = {
      all: 'Are you sure you want to delete all bookings?',
      past: 'Are you sure you want to delete all past bookings?',
      today: 'Are you sure you want to delete all today bookings?',
      future: 'Are you sure you want to delete all future bookings?',
      cancelled: 'Are you sure you want to delete all cancelled bookings?'
    };

    setConfirmModal({
      isOpen: true,
      message: filterMessages[bookingFilter],
      onConfirm: async () => {
        setConfirmModal({ isOpen: false, message: '', onConfirm: () => {} });
        const result = await bulkDelete(selectedItems);
        if (result.success) {
          setNotification({ message: `${result.deletedCount ?? selectedItems.length} bookings deleted successfully!`, type: 'success' });
          clearSelection();
        } else {
          setNotification({ message: result.error || 'Error deleting bookings', type: 'info' });
        }
      }
    });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      toggleSelectAll(filteredBookings, 'booking_id');
    } else {
      clearSelection();
    }
  };

  if (!isVisible) {
    return (
      <div className="border-2 border-gray-200 rounded-lg p-2">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-gray-900">Bookings</h3>
          <button onClick={onToggle} className="bg-linear-to-r from-blue-500 to-blue-600 text-white font-bold py-2.5 px-6 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 border border-blue-400/30 hover:border-blue-400/50">
            Show Bookings
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="border-2 border-gray-200 rounded-lg p-2">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-gray-900">All Bookings</h3>
        <button onClick={onToggle} className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded">
          Hide
        </button>
      </div>

      <div className="mb-4 space-y-4">
        <div className="flex flex-col space-y-4 md:flex-row md:space-x-4 md:space-y-0">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by name, phone, or team name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-2 border border-gray-400 rounded resize-none focus:outline-none focus:ring-0 focus:border-gray-900 focus:border pr-10"
            />
          </div>
          <div className="w-full md:w-64">
            <select
              value={futsalFilter}
              onChange={(e) => setFutsalFilter(e.target.value)}
              className="w-full p-2 border border-gray-400 rounded resize-none focus:outline-none focus:ring-0 focus:border-gray-900 focus:border"
            >
              <option value="">All Futsals</option>
              {futsals.map((futsal) => (
                <option key={futsal.futsal_id} value={futsal.futsal_id}>
                  {futsal.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="grid grid-cols-2 gap-3 mb-4 sm:flex sm:flex-wrap sm:gap-3">
          {[
            { key: 'all', label: `All Bookings (${filteredBookings.length})`, icon: '📋' },
            { key: 'past', label: `Past Bookings (${filteredBookings.filter(b => categorizeBooking(b) === 'past').length})`, icon: '⏰' },
            { key: 'today', label: `Today Bookings (${filteredBookings.filter(b => categorizeBooking(b) === 'today').length})`, icon: '📅' },
            { key: 'future', label: `Future Bookings (${filteredBookings.filter(b => categorizeBooking(b) === 'future').length})`, icon: '🔮' },
            { key: 'cancelled', label: `Cancelled Bookings (${filteredBookings.filter(b => b.cancelled_by).length})`, icon: '❌' }
          ].map((filter) => (
            <button
              key={filter.key}
              onClick={() => {
                setBookingFilter(filter.key as 'all' | 'past' | 'today' | 'future' | 'cancelled');
                clearSelection();
              }}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 flex items-center gap-2 ${bookingFilter === filter.key
                  ? 'bg-linear-to-r from-green-500 to-green-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
              <span>{filter.icon}</span>
              <span className="hidden sm:inline">{filter.label}</span>
              <span className="sm:hidden">{filter.label.replace(' Bookings', '')}</span>
            </button>
          ))}
        </div>

        {/* Select All and Delete Controls */}
        <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="selectAllBookings"
              checked={selectedCount === filteredBookings.length && filteredBookings.length > 0}
              onChange={(e) => handleSelectAll(e.target.checked)}
              className="mr-2"
            />
            <label htmlFor="selectAllBookings" className="text-sm font-medium text-gray-700">
              Select All ({selectedCount} selected)
            </label>
          </div>
          {selectedCount > 0 && (
            <button
              onClick={handleDeleteSelectedBookings}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
            >
              Delete Selected ({selectedCount})
            </button>
          )}
        </div>

        {futsalFilter && (
          <button
            onClick={() => {
              setBookingFilter('all');
              setFutsalFilter('');
              setSearchTerm('');
            }}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded"
          >
            Clear Filters
          </button>
        )}
      </div>

      <div className="space-y-4">
        {filteredBookings.map((booking) => {
          const category = categorizeBooking(booking);
          const isPastBooking = category === 'past';

          return (
            <div key={booking.booking_id} className={`border rounded p-4 ${isPastBooking ? 'bg-gray-50 border-gray-300' : ''}`}>
              <div className="flex justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {showCheckboxes && (
                      <input
                        type="checkbox"
                        checked={selectedItems.includes(booking.booking_id)}
                        onChange={(e) => toggleSelection(booking.booking_id)}
                        className="mr-3"
                      />
                    )}
                    <p>
                      <strong>User:</strong> {booking.first_name}
                    </p>
                  </div>

                  {booking.user_phone && (
                    <p>
                      <strong>Phone:</strong> {booking.user_phone}
                    </p>
                  )}

                  <p><strong>Futsal:</strong> {booking.futsal_name}</p>
                  <p><strong>Playing Date:</strong> {booking.formatted_date}</p>
                  <p><strong>Booked On:</strong> {booking.created_at.split('T')[0]}</p>
                  <p><strong>Time:</strong> {formatTimeRange(booking.time_slot)}</p>
                  <p><strong>Players:</strong> {booking.number_of_players}</p>
                  {booking.team_name && <p><strong>Team:</strong> {booking.team_name}</p>}
                  <p><strong>Status:</strong> {booking.payment_status}</p>
                  {booking.cancelled_by && booking.cancelled_at && <p><strong>Cancelled on:</strong> {new Date(booking.cancelled_at).toLocaleDateString('en-CA')}, {new Date(booking.cancelled_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}</p>}
                  {booking.last_updated_by && (
                    <p><strong>Last Updated By:</strong> {booking.last_updated_by}</p>
                  )}
                </div>

                <div className="flex flex-col items-end space-y-2">
                  <p className="text-lg font-semibold">Rs. {booking.amount_paid}</p>

                  {isPastBooking && !booking.cancelled_by && (
                    <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium bg-red-100 text-red-800">
                      ⏰ Expired
                    </span>
                  )}

                  {booking.cancelled_by && (
                    <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium bg-orange-100 text-orange-800">
                      ❌ Cancelled by {booking.cancelled_by.replace(/\b\w/g, (l: string) => l.toUpperCase())}
                    </span>
                  )}

                  <div className="flex space-x-2">
                    <button
                      onClick={() => setEditingBooking(booking)}
                      disabled={isPastBooking || !!booking.cancelled_by}
                      className={`px-3 py-1 rounded text-sm transition-all duration-300 ${isPastBooking || !!booking.cancelled_by
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-linear-to-r from-green-600 to-green-700 text-white hover:shadow-lg transform hover:scale-105'
                        }`}
                    >
                      Edit
                    </button>
                    {booking.cancelled_by ? (
                      <button
                        onClick={() => handleCancelBooking(booking.booking_id, 'cancelled')}
                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm hover:shadow-lg transform hover:scale-105 transition-all duration-300"
                      >
                        Delete
                      </button>
                    ) : isPastBooking ? (
                      <button
                        onClick={() => handleCancelBooking(booking.booking_id, 'expired')}
                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm hover:shadow-lg transform hover:scale-105 transition-all duration-300"
                      >
                        Delete
                      </button>
                    ) : (
                      <button
                        onClick={() => handleCancelBooking(booking.booking_id, 'active')}
                        className="bg-linear-to-r from-red-600 to-red-700 text-white px-3 py-1 rounded text-sm hover:shadow-lg transform hover:scale-105 transition-all duration-300"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modals */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal({ isOpen: false, message: '', onConfirm: () => {} })}
      />

      <NotificationModal
        isOpen={!!notification}
        message={notification?.message || ''}
        type={notification?.type || 'info'}
        onClose={() => setNotification(null)}
      />

      {editingBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white w-full h-full overflow-auto">
            <EditBookingForm booking={editingBooking} onUpdate={() => setEditingBooking(null)} onCancel={() => setEditingBooking(null)} setNotification={setNotification} />
          </div>
        </div>
      )}
    </div>
  );
}