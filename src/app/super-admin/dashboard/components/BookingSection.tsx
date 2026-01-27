import { useState, useEffect } from 'react';
import { useBookings } from '../hooks/useBookings';
import { useBulkOperations } from '../hooks/useBulkOperations';
import { useFutsals } from '../hooks/useFutsals';
import { categorizeBooking, formatTimeRange, formatDate } from '../utils/bookingUtils';
import { ConfirmModal } from './modals/ConfirmModal';
import { NotificationModal } from './modals/NotificationModal';
import { EditBookingForm } from './forms/EditBookingForm';
import { useAuthStore } from '@/stores/authStore';

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
    dateStart,
    setDateStart,
    dateEnd,
    setDateEnd,
    deleteBooking,
    cancelBooking,
    bulkDelete
  } = useBookings();
  const { selectedItems, showCheckboxes, toggleSelection, toggleSelectAll, clearSelection, selectedCount } = useBulkOperations();
  const [editingBooking, setEditingBooking] = useState<any | null>(null);
  const [viewingOriginalBooking, setViewingOriginalBooking] = useState<any | null>(null);
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'info'} | null>(null);
  const [confirmModal, setConfirmModal] = useState<{isOpen: boolean, message: string, onConfirm: () => void}>({isOpen: false, message: '', onConfirm: () => {}});
  const [showDateFilter, setShowDateFilter] = useState(false);

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

        {/* Search by Date Button */}
        <div className="flex justify-center">
          <button
            onClick={() => {
              if (showDateFilter) {
                setDateStart('');
                setDateEnd('');
                setShowDateFilter(false);
              } else {
                setShowDateFilter(true);
              }
            }}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
          >
            {showDateFilter ? 'Clear Date Filter' : 'Search by Date'}
          </button>
        </div>

        {/* Date Filter Inputs */}
        {showDateFilter && (
          <div className="flex flex-col space-y-2 md:flex-row md:space-x-4 md:space-y-0">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={dateStart}
                onChange={(e) => setDateStart(e.target.value)}
                className="w-full p-2 border border-gray-400 rounded focus:outline-none focus:ring-0 focus:border-gray-900 focus:border"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                value={dateEnd}
                onChange={(e) => setDateEnd(e.target.value)}
                className="w-full p-2 border border-gray-400 rounded focus:outline-none focus:ring-0 focus:border-gray-900 focus:border"
              />
            </div>
          </div>
        )}

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

        {/* Total Count when date filter is applied */}
        {showDateFilter && dateStart && dateEnd && (
          <div className="text-center py-2 bg-blue-50 rounded-lg">
            <p className="text-sm font-medium text-blue-800">
              Total Bookings from {dateStart} to {dateEnd}: {filteredBookings.length}
            </p>
          </div>
        )}

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
                  {/* <p><strong>Booked On:</strong> {booking.created_at.split('T')[0]}</p> */}
                  <p><strong>Booked On:</strong> {(() => { const parts = booking.created_at.includes('T') ? booking.created_at.split('T') : booking.created_at.split(' '); const timeStr = parts[1].substring(0,5); const [hours, minutes] = timeStr.split(':').map(Number); const period = hours >= 12 ? 'PM' : 'AM'; const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours; return parts[0] + ' ' + `${displayHours}:${minutes.toString().padStart(2,'0')} ${period}`; })()}</p>
                  <p><strong>Booking Type:</strong> {(() => {
                    const type = booking.booking_type || 'normal';
                    switch (type) {
                      case 'normal': return 'Normal';
                      case 'date': return 'Date-Specific';
                      case 'recurring': return 'Recurring';
                      case 'time_based': return 'Time-Based';
                      default: return 'Normal';
                    }
                  })()}</p>
                  <p><strong>Time:</strong> {formatTimeRange(booking.time_slot)}</p>
                  <p><strong>Players:</strong> {booking.number_of_players}</p>
                  {booking.team_name && <p><strong>Team:</strong> {booking.team_name}</p>}
                  <p><strong>Advance:</strong> {booking.payment_status}</p>
                  {/* {booking.cancelled_by && booking.cancelled_at && <p><strong>Cancelled on:</strong> {new Date(booking.cancelled_at).toLocaleDateString('en-CA')}, {new Date(booking.cancelled_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}</p>} */}
                  {booking.cancelled_by && booking.cancelled_at && <p><strong>Cancelled on:</strong> {(() => { const parts = booking.cancelled_at.includes('T') ? booking.cancelled_at.split('T') : booking.cancelled_at.split(' '); const timeStr = parts[1].substring(0,5); const [hours, minutes] = timeStr.split(':').map(Number); const period = hours >= 12 ? 'PM' : 'AM'; const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours; return parts[0] + ' ' + `${displayHours}:${minutes.toString().padStart(2,'0')} ${period}`; })()}</p>}
                  {booking.update_count > 0 && booking.last_updated_by && (
                    <p><strong>Last Updated By:</strong> {booking.last_updated_by} ({booking.update_count})</p>
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

                  <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
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
                    {booking.update_count > 0 && (
                      <button
                        onClick={() => setViewingOriginalBooking(booking)}
                        className="bg-linear-to-r from-blue-600 to-blue-700 text-white px-3 py-1 rounded text-sm hover:shadow-lg transform hover:scale-105 transition-all duration-300"
                      >
                        Org
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

      {/* View Original Booking Modal */}
      {viewingOriginalBooking && (
        <ViewOriginalBookingModal
          booking={viewingOriginalBooking}
          onClose={() => setViewingOriginalBooking(null)}
          setNotification={setNotification}
        />
      )}
    </div>
  );
}

// View Original Booking Modal Component
function ViewOriginalBookingModal({ booking, onClose, setNotification }: { booking: any, onClose: () => void, setNotification: (notification: { message: string, type: 'success' | 'info' } | null) => void }) {
  const [history, setHistory] = useState<any[]>([]);
  const [confirmModal, setConfirmModal] = useState<{isOpen: boolean, message: string, onConfirm: () => void}>({isOpen: false, message: '', onConfirm: () => {}});
  const { tokens } = useAuthStore();

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const headers: any = { 'Content-Type': 'application/json' };
        if (tokens?.accessToken) {
          headers['Authorization'] = `Bearer ${tokens.accessToken}`;
        }

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/bookings/history/${booking.booking_id}`, {
          headers
        });
        if (response.ok) {
          const data = await response.json();
          setHistory(data.history);
        }
      } catch (error) {
        console.error('Error fetching booking history:', error);
      }
    };

    fetchHistory();
  }, [booking.booking_id, tokens]);

  const handleRemoveHistory = (historyId: number) => {
    setConfirmModal({
      isOpen: true,
      message: 'Are you sure you want to permanently delete this history entry?',
      onConfirm: async () => {
        setConfirmModal({ isOpen: false, message: '', onConfirm: () => {} });
        try {
          const headers: any = { 'Content-Type': 'application/json' };
          if (tokens?.accessToken) {
            headers['Authorization'] = `Bearer ${tokens.accessToken}`;
          }

          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/bookings/history/super-admin/${historyId}`, {
            method: 'DELETE',
            headers
          });

          if (response.ok) {
            // Remove from local state
            setHistory(history.filter(h => h.history_id !== historyId));
            setNotification({ message: 'History entry deleted successfully', type: 'success' });
          } else {
            setNotification({ message: 'Error deleting history entry', type: 'info' });
          }
        } catch (error) {
          console.error('Error deleting history entry:', error);
          setNotification({ message: 'Error deleting history entry', type: 'info' });
        }
      }
    });
  };

  const formatTimeRange = (timeString: string): string => {
    const [startTime, endTime] = timeString.split('-');
    return `${formatTimeSlot(startTime)}-${formatTimeSlot(endTime)}`;
  };

  const formatTimeSlot = (timeString: string): string => {
    const [hours, minutes] = timeString.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    return `${displayHours}${period}`;
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">Booking History</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {history.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">No booking history found.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {history.map((version, index) => (
                <div key={version.history_id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Version {version.version_number}
                      {version.version_number === 1 && " (Original)"}
                    </h3>
                    <span className="text-sm text-gray-500">
                      Stored: {new Date(version.stored_at).toLocaleString()}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <strong>Futsal:</strong> {version.futsal_name}
                    </div>
                    <div>
                      <strong>Location:</strong> {version.location}, {version.city}
                    </div>
                    <div>
                      <strong>Playing Date:</strong> {version.formatted_date}
                    </div>
                    <div>
                      <strong>Booked On:</strong> {(() => {
                        const parts = version.created_at.includes('T') ? version.created_at.split('T') : version.created_at.split(' ');
                        const timeStr = parts[1].substring(0,5);
                        const [hours, minutes] = timeStr.split(':').map(Number);
                        const period = hours >= 12 ? 'PM' : 'AM';
                        const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
                        return parts[0] + ' ' + `${displayHours}:${minutes.toString().padStart(2,'0')} ${period}`;
                      })()}
                    </div>
                    <div>
                      <strong>Booking Type:</strong> {(() => {
                        const type = version.booking_type || 'normal';
                        switch (type) {
                          case 'normal': return 'Normal';
                          case 'date': return 'Date-Specific';
                          case 'recurring': return 'Recurring';
                          case 'time_based': return 'Time-Based';
                          default: return 'Normal';
                        }
                      })()}
                    </div>
                    <div>
                      <strong>Time:</strong> {formatTimeRange(version.time_slot)}
                    </div>
                    <div>
                      <strong>Players:</strong> {version.number_of_players}
                    </div>
                    <div>
                      <strong>Team:</strong> {version.team_name || 'N/A'}
                    </div>
                    <div>
                      <strong>Paid Amount:</strong> Rs. {version.amount_paid}
                    </div>
                    <div>
                      <strong>Total Amount:</strong> Rs. {version.total_amount}
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex justify-between items-center">
                      <div className="text-sm text-gray-600">
                        <strong>User:</strong> {version.first_name}
                        {version.user_phone && <span> | <strong>Phone:</strong> {version.user_phone}</span>}
                      </div>
                      <button
                        onClick={() => handleRemoveHistory(version.history_id)}
                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="max-w-sm w-full bg-white rounded-2xl shadow-2xl border border-red-200 p-6 transform transition-all duration-300">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg mb-4 bg-red-100">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Confirm Action</h3>
              <p className="text-sm text-gray-600 mb-6">{confirmModal.message}</p>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => setConfirmModal({ isOpen: false, message: '', onConfirm: () => {} })}
                  className="flex-1 bg-gray-100 text-gray-700 font-semibold py-2 px-4 rounded-lg hover:bg-gray-200 transition-all duration-300"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmModal.onConfirm}
                  className="flex-1 bg-red-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-red-700 transition-all duration-300"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}