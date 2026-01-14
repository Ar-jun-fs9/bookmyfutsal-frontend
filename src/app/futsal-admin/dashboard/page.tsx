'use client';

import { useEffect, useState, useReducer } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { useSocketStore } from '@/stores/socketStore';
import { useFutsals } from '@/hooks/useFutsals';
import { useBookings, useFutsalBookings } from '@/hooks/useBookings';
import { useTimeSlots, useFutsalSlotsForDate, useCloseAllSlotsForDate, useOpenAllSlotsForDate, useUpdateSlotStatus } from '@/hooks/useTimeSlots';
import { useFutsalRatings } from '@/hooks/useRatings';
import { filterReducer, initialFilterState } from '@/reducers/filterReducer';
// import { useSocketHandler } from '@/hooks/useSocketHandler';
import { useSpecialPrices } from './hooks/useSpecialPrices';
import { useTimeBasedPricing } from './hooks/useTimeBasedPricing';

interface Admin {
  id: number;
  username: string;
  email: string;
  phone: string;
  futsal_name: string;
  location: string;
  city: string;
  futsal_id: number;
}

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
}

function formatTime(timeString: string): string {
  const [hours, minutes] = timeString.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
}

function formatTimeSlot(timeString: string): string {
  const [hours, minutes] = timeString.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  return `${displayHours}${period}`;
}

function formatTimeRange(timeRange: string): string {
  const [startTime, endTime] = timeRange.split('-');
  return `${formatTimeSlot(startTime)}-${formatTimeSlot(endTime)}`;
}

function categorizeBooking(booking: any): 'past' | 'today' | 'future' {
  const now = new Date();
  const matchDate = booking.formatted_date || booking.booking_date?.toString().split('T')[0];
  const timeSlot = booking.time_slot;

  if (!matchDate) {
    return 'past'; // Default to past if data is missing
  }

  // Get today's date string in YYYY-MM-DD format (local timezone)
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const matchDateStr = matchDate;

  // Compare date strings directly
  if (matchDateStr < todayStr) {
    return 'past'; // Match date is before today
  } else if (matchDateStr > todayStr) {
    return 'future'; // Match date is after today
  } else {
    // Match date is today - check the time
    if (!timeSlot) return 'past';

    // Parse the start time from time_slot (format: "HH:MM-HH:MM")
    const startTime = timeSlot.split('-')[0];
    const [hours, minutes] = startTime.split(':').map((part: string) => Number(part));

    // Create a date object for today with the match start time
    const matchStartTime = new Date(today);
    matchStartTime.setHours(hours, minutes, 0, 0);

    return matchStartTime > now ? 'today' : 'past';
  }
}

export default function FutsalAdminDashboard() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { role, logout, hydrated } = useAuthStore();
  const [user, setUser] = useState<Admin | null>(null);
  const admin = user;
  const { socket } = useSocketStore();
  const { showNotification, notification } = useNotificationStore();

  // Local state for UI
  const [slotDate, setSlotDate] = useState(() => {
    const today = new Date();
    return today.getFullYear() + '-' +
      String(today.getMonth() + 1).padStart(2, '0') + '-' +
      String(today.getDate()).padStart(2, '0');
  });
  const [showSlots, setShowSlots] = useState(false);
  const [editingFutsal, setEditingFutsal] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState(false);
  const [editingBooking, setEditingBooking] = useState<any | null>(null);
  const [editingRating, setEditingRating] = useState<any | null>(null);
  const [creatingRating, setCreatingRating] = useState(false);
  const [showFutsalInfo, setShowFutsalInfo] = useState(false);
  const [showBookings, setShowBookings] = useState(false);
  const [showRatings, setShowRatings] = useState(false);
  const [showSpecialPrices, setShowSpecialPrices] = useState(false);
  const [creatingSpecialPrice, setCreatingSpecialPrice] = useState(false);
  const [editingSpecialPrice, setEditingSpecialPrice] = useState<any | null>(null);
  const [showTimeBasedPricing, setShowTimeBasedPricing] = useState(false);
  const [creatingTimeBasedPricing, setCreatingTimeBasedPricing] = useState(false);
  const [editingTimeBasedPricing, setEditingTimeBasedPricing] = useState<any | null>(null);
  const [bookingFilter, setBookingFilter] = useState<'all' | 'past' | 'today' | 'future' | 'cancelled'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean, message: string, onConfirm: () => void }>({ isOpen: false, message: '', onConfirm: () => { } });
  const [deletedBookings, setDeletedBookings] = useState<number[]>([]);
  const [selectedBookings, setSelectedBookings] = useState<number[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [showCheckboxes, setShowCheckboxes] = useState(false);
  const [selectedRatings, setSelectedRatings] = useState<number[]>([]);
  const [selectAllRatings, setSelectAllRatings] = useState(false);
  const [showRatingCheckboxes, setShowRatingCheckboxes] = useState(false);

  // Reducer for filters
  const [filterState, dispatch] = useReducer(filterReducer, initialFilterState);

  // React Query hooks
  const { data: futsalsData } = useFutsals();
  const futsal = admin?.futsal_id ? futsalsData?.find((f: Futsal) => f.futsal_id === admin.futsal_id) : null;
  const { data: bookingsData, refetch: refetchBookings } = useFutsalBookings(futsal?.futsal_id || 0);
  const { data: slotsData } = useFutsalSlotsForDate(futsal?.futsal_id ?? 0, slotDate);
  const closeAllSlotsMutation = useCloseAllSlotsForDate();
  const openAllSlotsMutation = useOpenAllSlotsForDate();
  const updateSlotStatusMutation = useUpdateSlotStatus();
  const { data: ratingsData } = useFutsalRatings(futsal?.futsal_id);
  const { specialPrices, loading: specialPricesLoading, createSpecialPrice, updateSpecialPrice, deleteSpecialPrice } = useSpecialPrices(futsal?.futsal_id);
  const { timeBasedPricings, loading: timeBasedPricingLoading, createTimeBasedPricing, updateTimeBasedPricing, deleteTimeBasedPricing } = useTimeBasedPricing(futsal?.futsal_id);

  // Processed data
  const bookings = bookingsData?.bookings || [];
  const slots = slotsData?.slots || [];
  const ratings = ratingsData || [];

  // Filtered bookings for display and counts
  const filteredBookings = bookings
    .filter((b: any) => !deletedBookings.includes(b.booking_id))
    .filter((b: any) => {
      if (!searchTerm) return true;
      const searchLower = searchTerm.toLowerCase();
      return (
        b.first_name?.toLowerCase().includes(searchLower) ||
        b.user_phone?.includes(searchTerm) ||
        b.team_name?.toLowerCase().includes(searchLower)
      );
    });

  useEffect(() => {
    if (hydrated) {
      if (role !== 'futsal_admin') {
        router.push('/futsal-admin/signin');
        return;
      }

      const storedUser = sessionStorage.getItem('futsal_admin');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      } else {
        router.push('/futsal-admin/signin');
        return;
      }
    }

    // Load hidden bookings from localStorage
    const storedHidden = localStorage.getItem('futsal_admin_hidden_bookings');
    if (storedHidden) {
      setDeletedBookings(JSON.parse(storedHidden));
    }
  }, [role, hydrated, router]);

  // Prevent background scrolling when modals are open
  useEffect(() => {
    const hasModalOpen = editingBooking || editingRating || editingSpecialPrice || confirmModal.isOpen;

    if (hasModalOpen) {
      // Prevent layout shift by adding padding equal to scrollbar width
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    } else {
      document.body.style.overflow = 'unset';
      document.body.style.paddingRight = '0px';
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset';
      document.body.style.paddingRight = '0px';
    };
  }, [editingBooking, editingRating, confirmModal.isOpen]);

  // Socket handling is now centralized in useSocketHandler

  // Bookings are now handled by React Query

  const handleLogout = () => {
    setConfirmModal({
      isOpen: true,
      message: 'Are you sure you want to logout?',
      onConfirm: () => {
        setConfirmModal({ isOpen: false, message: '', onConfirm: () => { } });
        logout();
        sessionStorage.removeItem('futsal_admin');
        sessionStorage.removeItem('assigned_futsal');
        router.push('/futsal-admin/signin');
      }
    });
  };

  const handleUpdateFutsal = async (formData: FormData) => {
    if (!futsal || !admin) return;

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/futsals/${futsal.futsal_id}`, {
        method: 'PUT',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();

        // Update sessionStorage with new futsal details
        const updatedAdmin = {
          ...admin,
          futsal_name: data.futsal.name,
          location: data.futsal.location,
          city: data.futsal.city
        };
        sessionStorage.setItem('futsal_admin', JSON.stringify(updatedAdmin));
        setUser(updatedAdmin);

        setEditingFutsal(false);
        showNotification({ message: 'Futsal updated successfully!', type: 'success' });
      } else {
        showNotification({ message: 'Error updating futsal', type: 'info' });
      }
    } catch (error) {
      console.error('Error:', error);
      showNotification({ message: 'Error updating futsal', type: 'info' });
    }
  };

  const handleUpdateAdmin = async (formData: any) => {
    if (!admin) return;

    try {
      // Get tokens from authStore
      const { tokens } = useAuthStore.getState();

      const headers: any = { 'Content-Type': 'application/json' };
      if (tokens?.accessToken) {
        headers['Authorization'] = `Bearer ${tokens.accessToken}`;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/futsal-admins/${admin.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        sessionStorage.setItem('futsal_admin', JSON.stringify(data.admin));
        setUser(data.admin);
        setEditingAdmin(false);
        showNotification({ message: 'Admin info updated successfully!', type: 'success' });
      } else {
        showNotification({ message: 'Error updating admin info', type: 'info' });
      }
    } catch (error) {
      console.error('Error:', error);
      showNotification({ message: 'Error updating admin info', type: 'info' });
    }
  };

  // Slots are now handled by React Query

  const closeAllSlots = async () => {
    // Check current status of slots to determine action
    const availableSlots = slots.filter((slot: any) => slot.status === 'available').length;
    const disabledSlots = slots.filter((slot: any) => slot.status === 'disabled').length;
    const shouldClose = availableSlots > disabledSlots; // If more available than disabled, close them

    const action = shouldClose ? 'close' : 'open';
    const confirmMessage = shouldClose
      ? 'Are you sure you want to close all available slots for this futsal?'
      : 'Are you sure you want to open all disabled slots for this futsal?';

    setConfirmModal({
      isOpen: true,
      message: confirmMessage,
      onConfirm: async () => {
        setConfirmModal({ isOpen: false, message: '', onConfirm: () => { } });

        try {
          const mutation = shouldClose ? closeAllSlotsMutation : openAllSlotsMutation;
          const result = await mutation.mutateAsync({ futsalId: futsal?.futsal_id || 0, date: slotDate });

          showNotification({ message: `${result.updatedSlots} slots ${action}d successfully!`, type: 'success' });
        } catch (error) {
          console.error(`Error ${action}ing all slots:`, error);
          showNotification({ message: `Error ${action === 'close' ? 'closing' : 'opening'} slots`, type: 'info' });
        }
      }
    });
  };

  const toggleSlotStatus = async (slotId: number, currentStatus: string) => {
    if (currentStatus === 'booked') {
      showNotification({ message: 'Cannot modify status of booked slots', type: 'info' });
      return;
    }

    const newStatus = currentStatus === 'available' ? 'disabled' : 'available';

    try {
      await updateSlotStatusMutation.mutateAsync({ slotId, status: newStatus });
    } catch (error) {
      console.error('Error updating slot status:', error);
      showNotification({ message: 'Error updating slot status', type: 'info' });
    }
  };

  const handleCancelBooking = async (bookingId: number) => {
    setConfirmModal({
      isOpen: true,
      message: 'Confirm Action\nAre you sure you want to cancel this booking permanently?',
      onConfirm: async () => {
        setConfirmModal({ isOpen: false, message: '', onConfirm: () => { } });
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/bookings/futsal-admin/${bookingId}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ futsal_admin_id: admin?.id }),
          });

          if (response.ok) {
            showNotification({ message: 'Booking cancelled successfully!', type: 'success' });
            refetchBookings(); // Refresh to show updated status
          } else {
            showNotification({ message: 'Error cancelling booking', type: 'info' });
          }
        } catch (error) {
          console.error('Error cancelling booking:', error);
          showNotification({ message: 'Error cancelling booking', type: 'info' });
        }
      }
    });
  };

  const handleDeleteBooking = async (bookingId: number) => {
    // Find the booking to check if it's expired or cancelled
    const booking = bookings.find((b: any) => b.booking_id === bookingId);
    if (!booking) {
      showNotification({ message: 'Booking not found', type: 'info' });
      return;
    }

    // If the booking is expired (past), hide it from the dashboard permanently (store in localStorage)
    if (categorizeBooking(booking) === 'past') {
      setConfirmModal({
        isOpen: true,
        message: 'Are you sure you want to permanently hide this expired booking from your dashboard?',
        onConfirm: () => {
          setConfirmModal({ isOpen: false, message: '', onConfirm: () => { } });
          // Add to hidden bookings list
          const updatedHidden = [...deletedBookings, bookingId];
          setDeletedBookings(updatedHidden);
          localStorage.setItem('futsal_admin_hidden_bookings', JSON.stringify(updatedHidden));
          showNotification({ message: 'Expired booking permanently hidden from dashboard', type: 'success' });
        }
      });
    } else if (booking.cancelled_by) {
      // For cancelled bookings, hide them from the dashboard permanently
      setConfirmModal({
        isOpen: true,
        message: 'Are you sure you want to permanently hide this cancelled booking from your dashboard?',
        onConfirm: () => {
          setConfirmModal({ isOpen: false, message: '', onConfirm: () => { } });
          // Add to hidden bookings list
          const updatedHidden = [...deletedBookings, bookingId];
          setDeletedBookings(updatedHidden);
          localStorage.setItem('futsal_admin_hidden_bookings', JSON.stringify(updatedHidden));
          showNotification({ message: 'Cancelled booking permanently hidden from dashboard', type: 'success' });
        }
      });
    } else {
      // For non-expired and non-cancelled bookings, futsal admin cannot delete
      showNotification({ message: 'Only super admin can delete active bookings', type: 'info' });
    }
  };

  const handleDeleteSelectedBookings = async () => {
    if (selectedBookings.length === 0) {
      showNotification({ message: 'No bookings selected', type: 'info' });
      return;
    }

    const filterMessages = {
      all: 'Are you sure you want to permanently hide all selected bookings from your dashboard?',
      past: 'Are you sure you want to permanently hide all selected past bookings from your dashboard?',
      today: 'Are you sure you want to permanently hide all selected today bookings from your dashboard?',
      future: 'Are you sure you want to permanently hide all selected future bookings from your dashboard?',
      cancelled: 'Are you sure you want to permanently hide all selected cancelled bookings from your dashboard?'
    };

    setConfirmModal({
      isOpen: true,
      message: filterMessages[bookingFilter],
      onConfirm: () => {
        setConfirmModal({ isOpen: false, message: '', onConfirm: () => { } });

        // Hide selected bookings from dashboard permanently (localStorage)
        const updatedHidden = [...deletedBookings, ...selectedBookings];
        setDeletedBookings(updatedHidden);
        localStorage.setItem('futsal_admin_hidden_bookings', JSON.stringify(updatedHidden));

        showNotification({ message: `${selectedBookings.length} booking${selectedBookings.length > 1 ? 's' : ''} permanently hidden from dashboard!`, type: 'success' });

        // Clear selection
        setSelectedBookings([]);
        setSelectAll(false);
      }
    });
  };

  const handleSelectBooking = (bookingId: number, checked: boolean) => {
    if (checked) {
      setSelectedBookings(prev => [...prev, bookingId]);
    } else {
      setSelectedBookings(prev => prev.filter(id => id !== bookingId));
      setSelectAll(false);
    }
  };

  const handleSelectRating = (ratingId: number, checked: boolean) => {
    if (checked) {
      setSelectedRatings(prev => [...prev, ratingId]);
    } else {
      setSelectedRatings(prev => prev.filter(id => id !== ratingId));
      setSelectAllRatings(false);
    }
  };

  const handleSelectAllRatings = (checked: boolean) => {
    if (checked) {
      const allRatingIds = ratings.map((rating: any) => rating.id);
      setSelectedRatings(allRatingIds);
      setSelectAllRatings(true);
      setShowRatingCheckboxes(true);
    } else {
      setSelectedRatings([]);
      setSelectAllRatings(false);
      setShowRatingCheckboxes(false);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const visibleBookings = filteredBookings
        .filter((booking: any) => {
          const category = categorizeBooking(booking);
          return bookingFilter === 'all' || (bookingFilter === 'cancelled' ? !!booking.cancelled_by : category === bookingFilter);
        })
        .map((booking: any) => booking.booking_id);
      setSelectedBookings(visibleBookings);
      setSelectAll(true);
      setShowCheckboxes(true);
    } else {
      setSelectedBookings([]);
      setSelectAll(false);
      setShowCheckboxes(false);
    }
  };

  // Ratings are now handled by React Query

  const handleDeleteSpecialPrice = async (id: number) => {
    setConfirmModal({
      isOpen: true,
      message: 'Are you sure you want to delete this special price?',
      onConfirm: async () => {
        setConfirmModal({ isOpen: false, message: '', onConfirm: () => { } });
        const result = await deleteSpecialPrice(id);
        if (result.success) {
          showNotification({ message: 'Special price deleted successfully', type: 'success' });
        } else {
          showNotification({ message: result.error || 'Error deleting special price', type: 'info' });
        }
      }
    });
  };

  const handleDeleteTimeBasedPricing = async (id: number) => {
    setConfirmModal({
      isOpen: true,
      message: 'Are you sure you want to delete this time-based pricing?',
      onConfirm: async () => {
        setConfirmModal({ isOpen: false, message: '', onConfirm: () => { } });
        const result = await deleteTimeBasedPricing(id);
        if (result.success) {
          showNotification({ message: 'Time-based pricing deleted successfully', type: 'success' });
        } else {
          showNotification({ message: result.error || 'Error deleting time-based pricing', type: 'info' });
        }
      }
    });
  };

  const handleUpdateRating = async (ratingId: number, rating: number, comment: string, users?: string, users_type?: string) => {
    try {
      const body: any = { rating, comment, admin_type: 'futsal_admin' };
      if (users !== undefined) {
        body.users = users;
      }
      if (users_type !== undefined) {
        body.users_type = users_type;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/ratings/${ratingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        showNotification({ message: 'Rating updated successfully!', type: 'success' });
        setEditingRating(null);
        // Refetch to ensure immediate UI update
        queryClient.refetchQueries({ queryKey: ['ratings', futsal?.futsal_id] });
      } else {
        const errorData = await response.json();
        showNotification({ message: errorData.message || 'Error updating rating', type: 'info' });
      }
    } catch (error) {
      console.error('Error updating rating:', error);
      showNotification({ message: 'Error updating rating', type: 'info' });
    }
  };

  const handleDeleteRating = async (ratingId: number) => {
    setConfirmModal({
      isOpen: true,
      message: 'Are you sure you want to delete this rating?',
      onConfirm: async () => {
        setConfirmModal({ isOpen: false, message: '', onConfirm: () => { } });

        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/ratings/${ratingId}`, {
            method: 'DELETE',
          });

          if (response.ok) {
            showNotification({ message: 'Rating deleted successfully!', type: 'success' });
            // Refetch to ensure immediate UI update
            queryClient.refetchQueries({ queryKey: ['ratings', futsal?.futsal_id] });
          } else {
            showNotification({ message: 'Error deleting rating', type: 'info' });
          }
        } catch (error) {
          console.error('Error deleting rating:', error);
          showNotification({ message: 'Error deleting rating', type: 'info' });
        }
      }
    });
  };

  const handleDeleteSelectedRatings = async () => {
    if (selectedRatings.length === 0) {
      showNotification({ message: 'No ratings selected', type: 'info' });
      return;
    }

    setConfirmModal({
      isOpen: true,
      message: `Are you sure you want to delete ${selectedRatings.length} selected rating${selectedRatings.length > 1 ? 's' : ''}?`,
      onConfirm: async () => {
        setConfirmModal({ isOpen: false, message: '', onConfirm: () => { } });

        try {
          const deletePromises = selectedRatings.map((ratingId: number) =>
            fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/ratings/${ratingId}`, {
              method: 'DELETE',
            })
          );

          const results = await Promise.all(deletePromises);
          const successfulDeletes = results.filter((response: Response) => response.ok).length;

          if (successfulDeletes > 0) {
            setSelectedRatings([]);
            setSelectAllRatings(false);
            setShowRatingCheckboxes(false);
            showNotification({ message: `${successfulDeletes} rating${successfulDeletes > 1 ? 's' : ''} deleted successfully!`, type: 'success' });
            // Refetch to ensure immediate UI update
            queryClient.refetchQueries({ queryKey: ['ratings', futsal?.futsal_id] });
          } else {
            showNotification({ message: 'Error deleting ratings', type: 'info' });
          }
        } catch (error) {
          console.error('Error deleting ratings:', error);
          showNotification({ message: 'Error deleting ratings', type: 'info' });
        }
      }
    });
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-green-50 via-white to-blue-50">
      <header className="bg-linear-to-r from-gray-900 via-green-900 to-blue-900 backdrop-blur-md shadow-2xl border-b border-green-500/20">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-white drop-shadow-lg">
            Hi {admin?.username || ''}
          </h1>
          <button
            onClick={handleLogout}
            className="bg-linear-to-r from-red-600 to-red-700 text-white font-bold py-2 px-4 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 border border-red-500/30 hover:border-red-400/50"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="space-y-6">
            {/* Admin Info */}
            <div className="bg-white rounded-lg p-2">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-semibold bg-linear-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">Admin Information</h2>
                <button
                  onClick={() => setEditingAdmin(!editingAdmin)}
                  className="bg-linear-to-r from-green-600 to-green-700 text-white font-bold py-2 px-4 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 border border-green-500/30 hover:border-green-400/50"
                >
                  {editingAdmin ? 'Cancel' : 'Edit Info'}
                </button>
              </div>
              {editingAdmin && admin ? (
                <EditAdminForm admin={admin} onUpdate={handleUpdateAdmin} onCancel={() => setEditingAdmin(false)} />
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <p><strong>Username:</strong> {admin?.username || ''}</p>
                  <p><strong>Phone:</strong> {admin?.phone || ''}</p>
                  <p><strong>Futsal:</strong> {admin?.futsal_name || ''}</p>
                  <p><strong>Location:</strong> {admin?.location || ''}</p>
                  <p><strong>City:</strong> {admin?.city || ''}</p>
                  <p className="col-span-2"><strong>Email:</strong> {admin?.email || ''}
                  </p>
                </div>
              )}
            </div>

            {/* Futsal Info and Edit */}
            <div className="bg-white rounded-lg p-2">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-semibold bg-linear-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">Assigned Futsal</h2>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setShowFutsalInfo(!showFutsalInfo)}
                    className="bg-linear-to-r from-green-600 to-green-700 text-white font-bold py-2 px-4 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 border border-green-500/30 hover:border-green-400/50"
                  >
                    {showFutsalInfo ? 'Hide' : 'Show'}
                  </button>
                  {showFutsalInfo && (
                    <button
                      onClick={() => setEditingFutsal(!editingFutsal)}
                      className="bg-linear-to-r from-green-600 to-green-700 text-white font-bold py-2 px-4 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 border border-green-500/30 hover:border-green-400/50"
                    >
                      {editingFutsal ? 'Cancel' : 'Edit'}
                    </button>
                  )}
                </div>
              </div>

              {showFutsalInfo && (
                editingFutsal && futsal ? (
                  <EditFutsalForm futsal={futsal as Futsal} onUpdate={handleUpdateFutsal} onCancel={() => setEditingFutsal(false)} />
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <p><strong>Name:</strong> {futsal?.name || ''}</p>
                      <p><strong>Location:</strong> {futsal?.location || ''}</p>
                      <p><strong>City:</strong> {futsal?.city || ''}</p>
                      <p><strong>Phone:</strong> {futsal?.phone || ''}</p>
                      <p><strong>Latitude:</strong> {futsal?.latitude || ''}</p>
                      <p><strong>Longitude:</strong> {futsal?.longitude || ''}</p>
                      <p><strong>Price per Hour:</strong> Rs. {futsal?.price_per_hour || 'N/A'}</p>
                      <p><strong>Game Format:</strong> {futsal?.game_format || 'N/A'}</p>
                      {futsal?.opening_hours && futsal?.closing_hours && (
                        <p><strong>Operating Hours:</strong> {formatTime(futsal.opening_hours)} - {formatTime(futsal.closing_hours)}</p>
                      )}
                      <div className="col-span-2">
                        <strong>Facilities:</strong> {futsal?.facilities && futsal.facilities.length > 0 ? futsal.facilities.join(', ') : 'N/A'}
                      </div>
                    </div>

                    <p><strong>Description:</strong> {futsal?.description || ''}</p>
                    {futsal?.images && futsal.images.length > 0 && (
                      <div>
                        <strong>Images:</strong>
                        <div className="flex flex-wrap ga p-2 mt-2">
                          {futsal.images.map((img: string, index: number) => (
                            <img key={index} src={`${process.env.NEXT_PUBLIC_API_URL}/uploads/${img}`} alt={`${futsal?.name || ''} ${index + 1}`} className="w-32 h-32 object-cover" />
                          ))}
                        </div>
                      </div>
                    )}
                    {futsal?.video && (
                      <div>
                        <strong>Video:</strong>
                        <video controls className="w-64 h-36 mt-2">
                          <source src={`${process.env.NEXT_PUBLIC_API_URL}/uploads/${futsal.video}`} type="video/mp4" />
                        </video>
                      </div>
                    )}
                  </div>
                )
              )}
            </div>

            {/* Slot Management */}
            {showSlots && (
              <div className="bg-white rounded-lg p-2">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-semibold bg-linear-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">Slot Management</h3>
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                    <button
                      onClick={closeAllSlots}
                      className={`${(() => {
                        const availableSlots = slots.filter((slot: any) => slot.status === 'available').length;
                        const disabledSlots = slots.filter((slot: any) => slot.status === 'disabled').length;
                        return availableSlots > disabledSlots ? 'bg-linear-to-r from-red-600 to-red-700' : 'bg-linear-to-r from-green-600 to-green-700';
                      })()} text-white font-bold py-2 px-4 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 border border-red-500/30 hover:border-red-400/50 text-sm w-full sm:w-auto`}
                    >
                      {(() => {
                        const availableSlots = slots.filter((slot: any) => slot.status === 'available').length;
                        const disabledSlots = slots.filter((slot: any) => slot.status === 'disabled').length;
                        return availableSlots > disabledSlots ? 'Close All Slots' : 'Open All Slots';
                      })()}
                    </button>
                    <button
                      onClick={() => setShowSlots(false)}
                      className="bg-linear-to-r from-gray-500 to-gray-600 text-white font-bold py-2 px-4 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 border border-gray-400/30 hover:border-gray-400/50 text-sm w-full sm:w-auto"
                    >
                      Hide Slots
                    </button>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Select Date</label>
                  <input
                    type="date"
                    value={slotDate}
                    onChange={(e) => setSlotDate(e.target.value)}
                    className="p-2 border border-gray-400 rounded resize-none focus:outline-none focus:ring-0 focus:border-gray-900 focus:border"
                  />
                </div>

                {/* Display slots for selected date only */}
                <div className="mb-6">
                  <h4 className="text-lg font-semibold mb-3">{new Date(slotDate).toLocaleDateString()}</h4>
                  {slots.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {slots.map((slot: any) => (
                        <div
                          key={slot.slot_id}
                          className={` p-2 md:p-4 border rounded ${slot.display_status === 'booked'
                            ? 'bg-red-100 border-red-500'
                            : slot.display_status === 'expired'
                              ? 'bg-yellow-100 border-yellow-500'
                              : slot.status === 'disabled'
                                ? 'bg-gray-100 border-gray-500'
                                : 'bg-green-100 border-green-500'
                            }`}
                        >
                          <div className="font-semibold text-center mb-1 md:mb-2 text-sm md:text-base">
                            {formatTimeSlot(slot.start_time)} - {formatTimeSlot(slot.end_time)} {
                              slot.display_status === 'booked' ? 'Booked' :
                                slot.display_status === 'expired' ? 'Expired' :
                                  slot.status === 'disabled' ? 'Disabled' : 'Available'
                            }
                          </div>
                          <div className="text-xs md:text-sm text-center text-gray-600 mb-1 md:mb-2">{slot.shift_category}</div>
                          {slot.display_status === 'booked' && (
                            <div className="text-xs text-center text-gray-500 mb-1 md:mb-2">
                              Booked by {slot.booker_name || 'User'}
                            </div>
                          )}
                          <div className="flex space-x-1 md:space-x-2">
                            <button
                              onClick={() => toggleSlotStatus(slot.slot_id, slot.status)}
                              disabled={slot.display_status === 'booked' || slot.display_status === 'expired'}
                              className={`flex-1 px-2 md:px-3 py-1 rounded text-xs md:text-sm ${slot.status === 'available'
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
                  ) : (
                    <p className="text-gray-500 text-center">No slots available for this date.</p>
                  )}
                </div>
              </div>
            )}

            {!showSlots && (
              <div className="bg-white rounded-lg p-2">
                <div className="text-center">
                  <h3 className="text-xl font-semibold bg-linear-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-4">Slot Management</h3>
                  <button
                    onClick={() => setShowSlots(true)}
                    className="bg-linear-to-r from-green-600 to-green-700 text-white font-bold py-2 px-4 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 border border-green-500/30 hover:border-green-400/50"
                  >
                    Show All Slots
                  </button>
                </div>
              </div>
            )}

            {/* Bookings */}
            <div className="bg-white rounded-lg p-2">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold bg-linear-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">Bookings Management</h3>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setShowBookings(!showBookings)}
                    className="bg-linear-to-r from-green-600 to-green-700 text-white font-bold py-2 px-4 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 border border-green-500/30 hover:border-green-400/50"
                  >
                    {showBookings ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>
              {showBookings && (
                <>
                  {/* Filter Buttons */}
                  <div className="mb-4">
                    <div className="grid grid-cols-2 gap-3 mb-4 sm:flex sm:flex-wrap sm:gap-3">
                      {[
                        { key: 'all', label: `All Bookings (${filteredBookings.length})`, icon: '📋' },
                        { key: 'past', label: `Past Bookings (${filteredBookings.filter((b: any) => categorizeBooking(b) === 'past').length})`, icon: '⏰' },
                        { key: 'today', label: `Today Bookings (${filteredBookings.filter((b: any) => categorizeBooking(b) === 'today').length})`, icon: '📅' },
                        { key: 'future', label: `Future Bookings (${filteredBookings.filter((b: any) => categorizeBooking(b) === 'future').length})`, icon: '🔮' },
                        { key: 'cancelled', label: `Cancelled Bookings (${filteredBookings.filter((b: any) => b.cancelled_by).length})`, icon: '❌' }
                      ].map((filter: any) => (
                        <button
                          key={filter.key}
                          onClick={() => {
                            setBookingFilter(filter.key as 'all' | 'past' | 'today' | 'future' | 'cancelled');
                            setSelectedBookings([]);
                            setSelectAll(false);
                            setShowCheckboxes(false);
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
                          id="selectAll"
                          checked={selectAll}
                          onChange={(e) => handleSelectAll(e.target.checked)}
                          className="mr-2"
                        />
                        <label htmlFor="selectAll" className="text-sm font-medium text-gray-700">
                          Select All ({selectedBookings.length} selected)
                        </label>
                      </div>
                      {selectedBookings.length > 0 && (
                        <button
                          onClick={handleDeleteSelectedBookings}
                          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                        >
                          Delete Selected ({selectedBookings.length})
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="mb-4 relative">
                    <input
                      type="text"
                      placeholder="Search by name, phone, or team name..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full p-2 border border-gray-400 rounded resize-none focus:outline-none focus:ring-0 focus:border-gray-900 focus:border pr-10"
                    />
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute right-2 to p-2 text-gray-500 hover:text-gray-700"
                      title="Clear search"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="space-y-4">
                    {filteredBookings
                      .filter((b: any) => {
                        const category = categorizeBooking(b);
                        return bookingFilter === 'all' || (bookingFilter === 'cancelled' ? !!b.cancelled_by : category === bookingFilter);
                      })
                      .map((b: any) => {
                        const category = categorizeBooking(b);
                        const isPastBooking = category === 'past';

                        return (
                          <div key={b.booking_id} className={`border rounded p-4 ${isPastBooking ? 'bg-gray-50 border-gray-300' : ''}`}>
                            <div className="flex justify-between">
                              <div className="flex-1">
                                <div className="flex items-center mb-2">
                                  {showCheckboxes && (
                                    <input
                                      type="checkbox"
                                      checked={selectedBookings.includes(b.booking_id)}
                                      onChange={(e) => handleSelectBooking(b.booking_id, e.target.checked)}
                                      className="mr-3"
                                    />
                                  )}
                                  <p>
                                    <strong>User:</strong> {b.first_name}
                                  </p>
                                </div>

                                {/* Phone number in separate column below User */}
                                {b.user_phone && (
                                  <p >
                                    <strong>Phone:</strong> {b.user_phone}
                                  </p>
                                )}

                                <p><strong>Playing Date:</strong> {b.formatted_date || b.booking_date?.split('T')[0]}</p>
                                <p><strong>Booked On:</strong> {b.created_at.split('T')[0]}</p>
                                <p><strong>Time:</strong> {formatTimeRange(b.time_slot)}</p>
                                <p><strong>Players:</strong> {b.number_of_players}</p>
                                {b.team_name && <p><strong>Team:</strong> {b.team_name}</p>}
                                <p><strong>Advance:</strong> {b.payment_status}</p>
                                {b.cancelled_by && b.cancelled_at && <p><strong>Cancelled on:</strong> {new Date(b.cancelled_at).toLocaleDateString('en-CA')}, {new Date(b.cancelled_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}</p>}

                                {b.last_updated_by && (
                                  <p><strong>Last Updated By:</strong> {b.last_updated_by}</p>
                                )}
                              </div>

                              <div className="flex flex-col items-end space-y-2">
                                <p className="text-lg font-semibold">Rs. {b.amount_paid}</p>

                                {isPastBooking && !b.cancelled_by && (
                                  <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium bg-red-100 text-red-800">
                                    ⏰ Expired
                                  </span>
                                )}

                                {b.cancelled_by && (
                                  <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium bg-orange-100 text-orange-800">
                                    ❌ Cancelled by {b.cancelled_by.replace(/\b\w/g, (l: string) => l.toUpperCase())}
                                  </span>
                                )}

                                <div className="flex space-x-2">
                                  {!b.cancelled_by && (
                                    <>
                                      <button
                                        onClick={() => setEditingBooking(b)}
                                        disabled={isPastBooking || !!b.cancelled_by}
                                        className={`px-3 py-1 rounded text-sm transition-all duration-300 ${isPastBooking || !!b.cancelled_by
                                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                          : 'bg-linear-to-r from-green-600 to-green-700 text-white hover:shadow-lg transform hover:scale-105'
                                          }`}
                                      >
                                        Edit
                                      </button>
                                      {isPastBooking ? (
                                        <button
                                          onClick={() => handleDeleteBooking(b.booking_id)}
                                          className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm hover:shadow-lg transform hover:scale-105 transition-all duration-300"
                                        >
                                          Delete
                                        </button>
                                      ) : (
                                        <button
                                          onClick={() => handleCancelBooking(b.booking_id)}
                                          className="bg-linear-to-r from-red-600 to-red-700 text-white px-3 py-1 rounded text-sm hover:shadow-lg transform hover:scale-105 transition-all duration-300"
                                        >
                                          Cancel
                                        </button>
                                      )}
                                    </>
                                  )}
                                  {b.cancelled_by && (
                                    <button
                                      onClick={() => handleDeleteBooking(b.booking_id)}
                                      className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm hover:shadow-lg transform hover:scale-105 transition-all duration-300"
                                    >
                                      Delete
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>

                          </div>
                        );
                      })}
                  </div>
                </>
              )}
            </div>

            {/* Special Prices Management */}
            <div className="bg-white rounded-lg p-2">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold bg-linear-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">Special Prices Management</h3>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setShowSpecialPrices(!showSpecialPrices)}
                    className="bg-linear-to-r from-green-600 to-green-700 text-white font-bold py-2 px-4 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 border border-green-500/30 hover:border-green-400/50"
                  >
                    {showSpecialPrices ? 'Hide' : 'Show'}
                  </button>
                  {showSpecialPrices && (
                    <button
                      onClick={() => setCreatingSpecialPrice(!creatingSpecialPrice)}
                      className="bg-linear-to-r from-green-600 to-green-700 text-white font-bold py-2 px-4 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 border border-green-500/30 hover:border-green-400/50"
                    >
                      {creatingSpecialPrice ? 'Cancel' : 'Create'}
                    </button>
                  )}
                </div>
              </div>
              {showSpecialPrices && (
                <>
                  {creatingSpecialPrice && futsal && (
                    <div className="mb-6 relative bg-white rounded-2xl shadow-2xl overflow-hidden transform transition-all duration-500 hover:scale-[1.01]">
                      {/* Gradient Background */}
                      <div className="absolute inset-0 bg-linear-to-br from-green-50 via-white to-green-50 opacity-70"></div>

                      {/* Content */}
                      <div className="relative p-6 sm:p-8">
                        <CreateSpecialPriceForm
                          futsalId={futsal.futsal_id}
                          openingHours={futsal.opening_hours}
                          closingHours={futsal.closing_hours}
                          onSuccess={() => setCreatingSpecialPrice(false)}
                          setNotification={showNotification}
                        />
                      </div>
                    </div>
                  )}
                  {/* Special Prices List */}
                  <div className="space-y-4">
                    {specialPricesLoading ? (
                      <p className="text-center text-gray-500">Loading special prices...</p>
                    ) : specialPrices.length === 0 ? (
                      <p className="text-center text-gray-500">No special prices set for this futsal.</p>
                    ) : (
                      specialPrices.map((price) => (
                        <div key={price.special_price_id} className="border rounded p-4">
                          {editingSpecialPrice?.special_price_id === price.special_price_id ? (
                            <EditSpecialPriceForm
                              price={price}
                              onUpdate={() => setEditingSpecialPrice(null)}
                              onCancel={() => setEditingSpecialPrice(null)}
                              setNotification={showNotification}
                            />
                          ) : (
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <h4 className="font-bold">{futsal?.name}</h4>
                                <p>Type: {price.type === 'date' ? 'Date-specific' : price.type === 'recurring' ? 'Recurring' : 'Time-based'}</p>
                                {price.type === 'date' ? (
                                  <p>Date: {new Date(price.special_date!).toISOString().split('T')[0]}</p>
                                ) : price.type === 'recurring' ? (
                                  <p>Days: {price.recurring_days?.join(', ') || 'None'}</p>
                                ) : (
                                  <p>Time Range: {formatTime(price.start_time!)} - {formatTime(price.end_time!)}{price.special_date ? ` on ${new Date(price.special_date).toISOString().split('T')[0]}` : ''}</p>
                                )}
                                <p>Price: Rs. {price.special_price}</p>
                                {price.message && <p>Message: {price.message}</p>}
                                <div className="flex items-center mt-2">
                                  <label className="flex items-center cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={price.is_offer}
                                      onChange={async (e) => {
                                        const result = await updateSpecialPrice(price.special_price_id, { special_price: price.special_price, is_offer: e.target.checked });
                                        if (result.success) {
                                          showNotification({ message: `Offer ${e.target.checked ? 'disabled' : 'enabled'} successfully`, type: 'success' });
                                        } else {
                                          showNotification({ message: result.error || 'Error updating offer status', type: 'info' });
                                        }
                                      }}
                                      className="sr-only"
                                    />
                                    <div className={`relative inline-block w-10 h-6 transition duration-200 ease-in-out rounded-full ${price.is_offer ? 'bg-green-600' : 'bg-gray-300'}`}>
                                      <span className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 ease-in-out ${price.is_offer ? 'translate-x-4' : 'translate-x-0'}`}></span>
                                    </div>
                                    <span className="ml-3 text-sm font-medium text-gray-700">Offer {price.is_offer ? 'Enabled' : 'Disabled'}</span>
                                  </label>
                                </div>
                              </div>
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => setEditingSpecialPrice(price)}
                                  className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteSpecialPrice(price.special_price_id)}
                                  className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Time-Based Pricing Management */}
            {/* <div className="bg-white rounded-lg p-2">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold bg-linear-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">Time-Based Pricing Management</h3>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setShowTimeBasedPricing(!showTimeBasedPricing)}
                    className="bg-linear-to-r from-green-600 to-green-700 text-white font-bold py-2 px-4 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 border border-green-500/30 hover:border-green-400/50"
                  >
                    {showTimeBasedPricing ? 'Hide' : 'Show'}
                  </button>
                  {showTimeBasedPricing && (
                    <button
                      onClick={() => setCreatingTimeBasedPricing(!creatingTimeBasedPricing)}
                      className="bg-linear-to-r from-green-600 to-green-700 text-white font-bold py-2 px-4 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 border border-green-500/30 hover:border-green-400/50"
                    >
                      {creatingTimeBasedPricing ? 'Cancel' : 'Create'}
                    </button>
                  )}
                </div>
              </div>
              {showTimeBasedPricing && (
                <>
                  {creatingTimeBasedPricing && futsal && (
                    <div className="mb-6 relative bg-white rounded-2xl shadow-2xl overflow-hidden transform transition-all duration-500 hover:scale-[1.01]">
                      
                      <div className="absolute inset-0 bg-linear-to-br from-green-50 via-white to-green-50 opacity-70"></div>

                      
                      <div className="relative p-6 sm:p-8">
                        <CreateTimeBasedPricingForm
                          futsalId={futsal.futsal_id}
                          openingHours={futsal.opening_hours}
                          closingHours={futsal.closing_hours}
                          onSuccess={() => setCreatingTimeBasedPricing(false)}
                          setNotification={showNotification}
                        />
                      </div>
                    </div>
                  )}
                  <div className="space-y-4">
                    {timeBasedPricingLoading ? (
                      <p className="text-center text-gray-500">Loading time-based pricing...</p>
                    ) : timeBasedPricings.length === 0 ? (
                      <p className="text-center text-gray-500">No time-based pricing set for this futsal.</p>
                    ) : (
                      timeBasedPricings.map((price) => (
                        <div key={price.time_based_pricing_id} className="border rounded p-4">
                          {editingTimeBasedPricing?.time_based_pricing_id === price.time_based_pricing_id ? (
                            <EditTimeBasedPricingForm
                              price={price}
                              openingHours={futsal?.opening_hours}
                              closingHours={futsal?.closing_hours}
                              onUpdate={() => setEditingTimeBasedPricing(null)}
                              onCancel={() => setEditingTimeBasedPricing(null)}
                              setNotification={showNotification}
                            />
                          ) : (
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <h4 className="font-bold">{futsal?.name}</h4>
                                <p>Time Range: {formatTime(price.start_time)} - {formatTime(price.end_time)}</p>
                                <p>Price: Rs. {price.price}</p>
                                {price.message && <p>Message: {price.message}</p>}
                              </div>
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => setEditingTimeBasedPricing(price)}
                                  className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteTimeBasedPricing(price.time_based_pricing_id)}
                                  className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </>
              )}
            </div> */}

            {/* Ratings Management */}
            <div className="bg-white rounded-lg p-2">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold bg-linear-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">Ratings Management</h3>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setShowRatings(!showRatings)}
                    className="bg-linear-to-r from-green-600 to-green-700 text-white font-bold py-2 px-4 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 border border-green-500/30 hover:border-green-400/50"
                  >
                    {showRatings ? 'Hide' : 'Show'}
                  </button>
                  {showRatings && (
                    <button
                      onClick={() => setCreatingRating(!creatingRating)}
                      className="bg-linear-to-r from-green-600 to-green-700 text-white font-bold py-2 px-4 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 border border-green-500/30 hover:border-green-400/50"
                    >
                      {creatingRating ? 'Cancel' : 'Create'}
                    </button>
                  )}
                </div>
              </div>
              {showRatings && (
                <>
                  {/* Select All and Delete Controls for Ratings */}
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="selectAllRatings"
                          checked={selectAllRatings}
                          onChange={(e) => handleSelectAllRatings(e.target.checked)}
                          className="mr-2"
                        />
                        <label htmlFor="selectAllRatings" className="text-sm font-medium text-gray-700">
                          Select All Ratings ({selectedRatings.length} selected)
                        </label>
                      </div>
                      {selectedRatings.length > 0 && (
                        <button
                          onClick={handleDeleteSelectedRatings}
                          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                        >
                          Delete Selected ({selectedRatings.length})
                        </button>
                      )}
                    </div>
                  </div>

                  {creatingRating && (
                    <div className="mb-6 relative bg-white rounded-2xl shadow-2xl overflow-hidden transform transition-all duration-500 hover:scale-[1.01]">
                      {/* Gradient Background */}
                      <div className="absolute inset-0 bg-linear-to-br from-green-50 via-white to-green-50 opacity-70"></div>

                      {/* Content */}
                      <div className="relative p-6 sm:p-8">
                        <CreateRatingForm
                          futsalId={futsal!.futsal_id}
                          onSuccess={() => {
                            setCreatingRating(false);
                            // Refetch to ensure immediate UI update
                            queryClient.refetchQueries({ queryKey: ['ratings', futsal!.futsal_id] });
                          }}
                          onCancel={() => setCreatingRating(false)}
                          setNotification={showNotification}
                        />
                      </div>
                    </div>
                  )}
                  <div className="space-y-4">
                    {ratings.map((rating: any) => (
                      <div key={rating.id} className="border rounded p-4">
                        <div className="flex justify-between">
                          <div className="flex-1">
                            <div className="flex items-center mb-2">
                              {showRatingCheckboxes && (
                                <input
                                  type="checkbox"
                                  checked={selectedRatings.includes(rating.id)}
                                  onChange={(e) => handleSelectRating(rating.id, e.target.checked)}
                                  className="mr-3"
                                />
                              )}
                              <p><strong>User:</strong> {rating.first_name && rating.last_name ? `${rating.first_name} ${rating.last_name}` : rating.users}</p>
                            </div>
                            <div className="flex items-center mt-1">
                              <div className="flex">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <svg key={star} className={`w-4 h-4 ${star <= rating.rating ? 'text-yellow-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                  </svg>
                                ))}
                              </div>
                              <span className="ml-2 text-sm text-gray-600">({rating.rating} stars)</span>
                            </div>
                            {rating.comment && <p className="text-sm text-gray-700 mt-2"><strong>Comment:</strong> {rating.comment}</p>}
                            <p className="text-xs text-gray-500 mt-1">Rated on: {new Date(rating.created_at).toLocaleDateString()}</p>
                          </div>
                          <div className="flex flex-col items-end space-y-2">
                            {/* Desktop layout */}
                            <div className="hidden md:flex items-center space-x-2">
                              <span className="text-xs text-gray-500 px-2 py-1 bg-gray-100 rounded">
                                {rating.users_type}
                              </span>
                              {rating.users_type !== 'super admin created' && rating.users_type !== 'super admin updated' && (
                                <>
                                  <button
                                    onClick={() => setEditingRating(rating)}
                                    className="bg-linear-to-r from-green-600 to-green-700 text-white px-3 py-1 rounded text-sm hover:shadow-lg transform hover:scale-105 transition-all duration-300"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handleDeleteRating(rating.id)}
                                    className="bg-linear-to-r from-red-600 to-red-700 text-white px-3 py-1 rounded text-sm hover:shadow-lg transform hover:scale-105 transition-all duration-300"
                                  >
                                    Delete
                                  </button>
                                </>
                              )}
                            </div>
                            {/* Mobile layout */}
                            <div className="md:hidden flex flex-col items-end space-y-1">
                              <span className="text-xs text-gray-500 px-2 py-1 bg-gray-100 rounded">
                                {rating.users_type}
                              </span>
                              {rating.users_type !== 'super admin created' && rating.users_type !== 'super admin updated' && (
                                <>
                                  <button
                                    onClick={() => setEditingRating(rating)}
                                    className="bg-linear-to-r from-green-600 to-green-700 text-white px-3 py-1 rounded text-sm hover:shadow-lg transform hover:scale-105 transition-all duration-300"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handleDeleteRating(rating.id)}
                                    className="bg-linear-to-r from-red-600 to-red-700 text-white px-3 py-1 rounded text-sm hover:shadow-lg transform hover:scale-105 transition-all duration-300"
                                  >
                                    Delete
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    {ratings.length === 0 && (
                      <div className="text-center py-8">
                        <p className="text-gray-500">No ratings yet.</p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Special Prices Management */}
            {/* <div className="bg-white rounded-lg p-2">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold bg-linear-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">Special Prices Management</h3>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setShowSpecialPrices(!showSpecialPrices)}
                    className="bg-linear-to-r from-green-600 to-green-700 text-white font-bold py-2 px-4 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 border border-green-500/30 hover:border-green-400/50"
                  >
                    {showSpecialPrices ? 'Hide' : 'Show'}
                  </button>
                  {showSpecialPrices && (
                    <button
                      onClick={() => setCreatingSpecialPrice(!creatingSpecialPrice)}
                      className="bg-linear-to-r from-green-600 to-green-700 text-white font-bold py-2 px-4 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 border border-green-500/30 hover:border-green-400/50"
                    >
                      {creatingSpecialPrice ? 'Cancel' : 'Create'}
                    </button>
                  )}
                </div>
              </div>
              {showSpecialPrices && (
                <>
                  {creatingSpecialPrice && futsal && (
                    <div className="mb-6 relative bg-white rounded-2xl shadow-2xl overflow-hidden transform transition-all duration-500 hover:scale-[1.01]">
                      
                      <div className="absolute inset-0 bg-linear-to-br from-green-50 via-white to-green-50 opacity-70"></div>

                    
                      <div className="relative p-6 sm:p-8">
                        <CreateSpecialPriceForm
                          futsalId={futsal.futsal_id}
                          openingHours={futsal.opening_hours}
                          closingHours={futsal.closing_hours}
                          onSuccess={() => setCreatingSpecialPrice(false)}
                          setNotification={showNotification}
                        />
                      </div>
                    </div>
                  )}
                  <div className="space-y-4">
                    {specialPricesLoading ? (
                      <p className="text-center text-gray-500">Loading special prices...</p>
                    ) : specialPrices.length === 0 ? (
                      <p className="text-center text-gray-500">No special prices set for this futsal.</p>
                    ) : (
                      specialPrices.map((price) => (
                        <div key={price.special_price_id} className="border rounded p-4">
                          {editingSpecialPrice?.special_price_id === price.special_price_id ? (
                            <EditSpecialPriceForm
                              price={price}
                              onUpdate={() => setEditingSpecialPrice(null)}
                              onCancel={() => setEditingSpecialPrice(null)}
                              setNotification={showNotification}
                            />
                          ) : (
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <h4 className="font-bold">{futsal?.name}</h4>
                                <p>Type: {price.type === 'date' ? 'Date-specific' : price.type === 'recurring' ? 'Recurring' : 'Time-based'}</p>
                                {price.type === 'date' ? (
                                  <p>Date: {new Date(price.special_date!).toISOString().split('T')[0]}</p>
                                ) : price.type === 'recurring' ? (
                                  <p>Days: {price.recurring_days!.join(', ')}</p>
                                ) : (
                                  <p>Time Range: {formatTime(price.start_time!)} - {formatTime(price.end_time!)}</p>
                                )}
                                <p>Price: Rs. {price.special_price}</p>
                                {price.message && <p>Message: {price.message}</p>}
                              </div>
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => setEditingSpecialPrice(price)}
                                  className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteSpecialPrice(price.special_price_id)}
                                  className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </>
              )}
            </div> */}
          </div>
        </div>
      </main>

      {/* Edit Booking Overlay */}
      {editingBooking && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-4xl">
            <EditBookingForm booking={editingBooking} onUpdate={(data) => {
              refetchBookings();
              setEditingBooking(null);
              showNotification({ message: 'Booking updated successfully!', type: 'success' });
            }} onCancel={() => setEditingBooking(null)} adminId={admin!.id} setNotification={showNotification} />
          </div>
        </div>
      )}

      {/* Edit Rating Modal */}
      {editingRating && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 ">
          <div className="relative bg-white rounded-2xl shadow-2xl overflow-hidden transform transition-all duration-500 hover:scale-[1.02] max-w-lg w-full max-h-[90vh] overflow-y-auto">
            {/* Gradient Background */}
            <div className="absolute inset-0 bg-linear-to-br from-green-50 via-white to-green-50 opacity-70"></div>

            {/* Content */}
            <div className="relative p-6 sm:p-8">
              <EditRatingForm rating={editingRating} onUpdate={(rating, comment, users, users_type) => {
                handleUpdateRating(editingRating.id, rating, comment, users, users_type);
              }} onCancel={() => setEditingRating(null)} />
            </div>
          </div>
        </div>
      )}

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
                  onClick={() => setConfirmModal({ isOpen: false, message: '', onConfirm: () => { } })}
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

      {/* Notification Modal */}
      {notification && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 ">
          <div className={`max-w-sm w-full bg-white rounded-2xl shadow-2xl border p-6 transform transition-all duration-300 ${notification.type === 'success' ? 'border-green-200' : 'border-blue-200'}`}>
            <div className="text-center">
              <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg mb-4 ${notification.type === 'success' ? 'bg-green-100' : 'bg-blue-100'}`}>
                {notification.type === 'success' ? (
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
              </div>
              <p className={`text-sm font-medium ${notification.type === 'success' ? 'text-green-800' : 'text-blue-800'}`}>
                {notification.message}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Create Special Price Form Component
function CreateSpecialPriceForm({ futsalId, openingHours, closingHours, onSuccess, setNotification }: { futsalId: number, openingHours: string, closingHours: string, onSuccess: () => void, setNotification: (notification: { message: string, type: 'success' | 'info' }) => void }) {
  const { createSpecialPrice } = useSpecialPrices(futsalId);
  const [formData, setFormData] = useState({
    type: 'date' as 'date' | 'recurring' | 'time_based',
    special_dates: [] as string[],
    recurring_days: [] as string[],
    start_time: '',
    end_time: '',
    special_date: '',
    special_price: '',
    message: ''
  });
  const [currentDate, setCurrentDate] = useState('');

  const addDate = () => {
    if (currentDate && !formData.special_dates.includes(currentDate)) {
      setFormData({
        ...formData,
        special_dates: [...formData.special_dates, currentDate].sort()
      });
      setCurrentDate('');
    }
  };

  const removeDate = (dateToRemove: string) => {
    setFormData({
      ...formData,
      special_dates: formData.special_dates.filter(date => date !== dateToRemove)
    });
  };

  const handleTypeChange = (type: 'date' | 'recurring' | 'time_based') => {
    setFormData({
      ...formData,
      type,
      special_dates: [],
      recurring_days: [],
      start_time: '',
      end_time: '',
      special_date: ''
    });
  };

  const toggleDay = (day: string) => {
    setFormData({
      ...formData,
      recurring_days: formData.recurring_days.includes(day)
        ? formData.recurring_days.filter(d => d !== day)
        : [...formData.recurring_days, day]
    });
  };

  const generateTimeOptions = (opening: string, closing: string) => {
    const options = [];
    const openingTime = new Date(`2000-01-01T${opening}`);
    const closingTime = new Date(`2000-01-01T${closing}`);

    for (let time = new Date(openingTime); time <= closingTime; time.setMinutes(time.getMinutes() + 30)) {
      const timeString = time.toTimeString().slice(0, 5);
      options.push(timeString);
    }
    return options;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.type === 'date' && formData.special_dates.length === 0) {
      setNotification({ message: 'Please select at least one date', type: 'info' });
      return;
    }
    if (formData.type === 'recurring' && formData.recurring_days.length === 0) {
      setNotification({ message: 'Please select at least one day', type: 'info' });
      return;
    }
    if (formData.type === 'time_based' && (!formData.start_time || !formData.end_time)) {
      setNotification({ message: 'Please select both start and end times', type: 'info' });
      return;
    }

    const price = parseFloat(formData.special_price);
    if (isNaN(price) || price <= 0) {
      setNotification({ message: 'Please enter a valid positive price', type: 'info' });
      return;
    }

    const result = await createSpecialPrice({
      futsal_id: futsalId,
      type: formData.type,
      ...(formData.type === 'date' ? { special_dates: formData.special_dates } :
        formData.type === 'recurring' ? { recurring_days: formData.recurring_days } :
          { start_time: formData.start_time, end_time: formData.end_time, special_date: formData.special_date || undefined }),
      special_price: price,
      message: formData.message || undefined
    });

    if (result.success) {
      setNotification({ message: `${formData.type === 'date' ? 'Special prices' : formData.type === 'recurring' ? 'Recurring special price' : 'Time-based special price'} created successfully`, type: 'success' });
      onSuccess();
    } else {
      setNotification({ message: result.error || 'Error creating special price', type: 'info' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 bg-linear-to-br from-green-500 to-green-600 rounded-lg mb-3 shadow-lg">
          <svg className="w-6 h-6 sm:w-7 sm:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
          </svg>
        </div>
        <h3 className="text-xl sm:text-2xl font-bold bg-linear-to-r from-green-600 to-green-700 bg-clip-text text-transparent mb-2">
          Create Special Price
        </h3>
        <p className="text-gray-600 text-sm">
          {formData.type === 'date' ? 'Set a special price for a specific date' :
           formData.type === 'recurring' ? 'Set a special price for recurring days' :
           'Set a special price for specific time ranges'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Type Selection */}
        <div className="space-y-3">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Type</label>
          <div className="flex gap-4">
            <label className="flex items-center">
              <input
                type="radio"
                value="date"
                checked={formData.type === 'date'}
                onChange={() => handleTypeChange('date')}
                className="mr-2"
              />
              Date-specific
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="recurring"
                checked={formData.type === 'recurring'}
                onChange={() => handleTypeChange('recurring')}
                className="mr-2"
              />
              Recurring
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="time_based"
                checked={formData.type === 'time_based'}
                onChange={() => handleTypeChange('time_based')}
                className="mr-2"
              />
              Time-based price
            </label>
          </div>
        </div>

        <div className="relative">
          <label htmlFor="specialPrice" className="block text-sm font-semibold text-gray-700 mb-2">
            💰 Special Price (Rs.)
          </label>
          <div className="relative">
            <input
              id="specialPrice"
              type="number"
              step="0.01"
              value={formData.special_price}
              onChange={(e) => setFormData({ ...formData, special_price: e.target.value })}
              placeholder="Enter price"
              required
              className="w-full px-4 py-3 pl-12 bg-white border border-gray-200 rounded-lg text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400/50 focus:border-green-400/50 transition-all duration-300 font-medium text-sm"
            />
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-green-500">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
          </div>
        </div>

        {/* Date Selection */}
        {formData.type === 'date' && (
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              📅 Special Dates
            </label>
            <div className="flex gap-2">
              <input
                type="date"
                value={currentDate}
                onChange={(e) => setCurrentDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="flex-1 px-4 py-3 bg-white border border-gray-200 rounded-lg text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400/50 focus:border-green-400/50 transition-all duration-300 font-medium text-sm"
              />
              <button
                type="button"
                onClick={addDate}
                disabled={!currentDate}
                className="px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
              >
                Add Date
              </button>
            </div>

            {/* Selected Dates */}
            {formData.special_dates.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm text-gray-600">Selected Dates ({formData.special_dates.length}):</p>
                <div className="flex flex-wrap gap-2">
                  {formData.special_dates.map((date) => (
                    <span
                      key={date}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                    >
                      {new Date(date).toISOString().split('T')[0].split('-').reverse().join('-')}
                      <button
                        type="button"
                        onClick={() => removeDate(date)}
                        className="ml-2 text-blue-600 hover:text-blue-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Recurring Days Selection */}
        {/* Recurring Days Selection */}
        {formData.type === 'recurring' && (
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              📅 Recurring Days
            </label>

            <div className="grid grid-cols-2 gap-3">
              {[
                'sunday',
                'monday',
                'tuesday',
                'wednesday',
                'thursday',
                'friday',
                'saturday',
              ].map((day) => (
                <label
                  key={day}
                  className="flex items-center p-3 border-2 rounded-lg cursor-pointer transition-all duration-300 hover:border-green-400"
                >
                  <input
                    type="checkbox"
                    checked={formData.recurring_days.includes(day)}
                    onChange={() => toggleDay(day)}
                    className="mr-3 text-green-600 focus:ring-green-500"
                  />
                  <span className="text-sm font-medium text-gray-700 capitalize">
                    {day}
                  </span>
                </label>
              ))}
            </div>

            {/* Selected Days */}
            {formData.recurring_days.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  Selected Days ({formData.recurring_days.length}):
                </p>
                <div className="flex flex-wrap gap-2">
                  {formData.recurring_days.map((day) => (
                    <span
                      key={day}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800 capitalize"
                    >
                      {day}
                      <button
                        type="button"
                        onClick={() => toggleDay(day)}
                        className="ml-2 text-green-600 hover:text-green-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Time-Based Selection */}
        {formData.type === 'time_based' && (
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              🕒 Time Range
            </label>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <label
                  htmlFor="startTime"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  Start Time
                </label>

                <div className="relative">
                  <select
                    id="startTime"
                    value={formData.start_time}
                    onChange={(e) =>
                      setFormData({ ...formData, start_time: e.target.value })
                    }
                    className="w-full px-4 py-3 pl-12 bg-white border border-gray-200 rounded-lg text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400/50 focus:border-green-400/50 transition-all duration-300 font-medium text-sm"
                    required
                  >
                    <option value="">Select start time</option>
                    {generateTimeOptions(openingHours, closingHours).map((time) => (
                      <option key={time} value={time}>
                        {formatTime(time)}
                      </option>
                    ))}
                  </select>

                  <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-green-500">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="relative">
                <label
                  htmlFor="endTime"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  End Time
                </label>

                <div className="relative">
                  <select
                    id="endTime"
                    value={formData.end_time}
                    onChange={(e) =>
                      setFormData({ ...formData, end_time: e.target.value })
                    }
                    className="w-full px-4 py-3 pl-12 bg-white border border-gray-200 rounded-lg text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400/50 focus:border-green-400/50 transition-all duration-300 font-medium text-sm"
                    required
                  >
                    <option value="">Select end time</option>
                    {generateTimeOptions(openingHours, closingHours).map((time) => (
                      <option key={time} value={time}>
                        {formatTime(time)}
                      </option>
                    ))}
                  </select>

                  <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-green-500">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative">
              <label htmlFor="specialDate" className="block text-sm font-semibold text-gray-700 mb-2">
                📅 Choose Date (Optional)
              </label>
              <div className="relative">
                <input
                  id="specialDate"
                  type="date"
                  value={formData.special_date}
                  onChange={(e) => setFormData({ ...formData, special_date: e.target.value })}
                  className="w-full px-4 py-3 pl-12 bg-white border border-gray-200 rounded-lg text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400/50 focus:border-green-400/50 transition-all duration-300 font-medium text-sm"
                />
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-green-500">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="relative">
          <label htmlFor="message" className="block text-sm font-semibold text-gray-700 mb-2">
            💬 Message (Optional)
          </label>
          <div className="relative">
            <textarea
              id="message"
              placeholder="Add a message explaining the special price..."
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              className="w-full px-4 py-3 pl-12 bg-white border border-gray-200 rounded-lg text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400/50 focus:border-green-400/50 transition-all duration-300 font-medium text-sm"
              rows={3}
              maxLength={200}
            />
            <div className="absolute left-4 top-4 text-green-500">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
          </div>
          <div className="text-right text-xs text-gray-500 mt-1">
            {formData.message.length}/200
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <button
            type="submit"
            disabled={(formData.type === 'date' && formData.special_dates.length === 0) || (formData.type === 'recurring' && formData.recurring_days.length === 0) || (formData.type === 'time_based' && (!formData.start_time || !formData.end_time))}
            className="flex-1 bg-linear-to-r from-green-500 to-green-600 text-white font-semibold py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 border border-green-400/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            <span className="flex items-center justify-center">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Create {formData.type === 'date' ? 'Special Price' : formData.type === 'recurring' ? 'Recurring Special Price' : 'Time-Based Special Price'}{formData.type === 'date' && formData.special_dates.length > 1 ? 's' : ''}
            </span>
          </button>
          <button
            type="button"
            onClick={onSuccess}
            className="flex-1 sm:flex-none bg-linear-to-r from-gray-500 to-gray-600 text-white font-semibold py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 border border-gray-400/30"
          >
            <span className="flex items-center justify-center">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Cancel
            </span>
          </button>
        </div>
      </form>
    </div>
  );
}

// Create Time-Based Pricing Form Component
function CreateTimeBasedPricingForm({ futsalId, openingHours, closingHours, onSuccess, setNotification }: {
  futsalId: number,
  openingHours: string,
  closingHours: string,
  onSuccess: () => void,
  setNotification: (notification: { message: string, type: 'success' | 'info' }) => void
}) {
  const { createTimeBasedPricing } = useTimeBasedPricing(futsalId);
  const [formData, setFormData] = useState({
    start_time: '',
    end_time: '',
    price: '',
    message: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const price = parseFloat(formData.price);
    if (isNaN(price) || price <= 0) {
      setNotification({ message: 'Please enter a valid positive price', type: 'info' });
      return;
    }

    if (!formData.start_time || !formData.end_time) {
      setNotification({ message: 'Please select both start and end times', type: 'info' });
      return;
    }

    if (formData.start_time >= formData.end_time) {
      setNotification({ message: 'End time must be after start time', type: 'info' });
      return;
    }

    const result = await createTimeBasedPricing({
      futsal_id: futsalId,
      start_time: formData.start_time,
      end_time: formData.end_time,
      price,
      message: formData.message || undefined
    });

    if (result.success) {
      setNotification({ message: 'Time-based pricing created successfully', type: 'success' });
      onSuccess();
    } else {
      setNotification({ message: result.error || 'Error creating time-based pricing', type: 'info' });
    }
  };

  const generateTimeOptions = () => {
    const options = [];
    const opening = new Date(`2000-01-01T${openingHours}`);
    const closing = new Date(`2000-01-01T${closingHours}`);

    for (let time = new Date(opening); time <= closing; time.setMinutes(time.getMinutes() + 30)) {
      const timeString = time.toTimeString().slice(0, 5);
      options.push(timeString);
    }
    return options;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 bg-linear-to-br from-green-500 to-green-600 rounded-lg mb-3 shadow-lg">
          <svg className="w-6 h-6 sm:w-7 sm:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-xl sm:text-2xl font-bold bg-linear-to-r from-green-600 to-green-700 bg-clip-text text-transparent mb-2">
          Create Time-Based Pricing
        </h3>
        <p className="text-gray-600 text-sm">
          Set pricing for specific time ranges within operating hours
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Time Range Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <label htmlFor="startTime" className="block text-sm font-semibold text-gray-700 mb-2">
              🕒 Start Time
            </label>
            <div className="relative">
              <select
                id="startTime"
                value={formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                className="w-full px-4 py-3 pl-12 bg-white border border-gray-200 rounded-lg text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400/50 focus:border-green-400/50 transition-all duration-300 font-medium text-sm"
                required
              >
                <option value="">Select start time</option>
                {generateTimeOptions().map(time => (
                  <option key={time} value={time}>{formatTime(time)}</option>
                ))}
              </select>
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-green-500">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="relative">
            <label htmlFor="endTime" className="block text-sm font-semibold text-gray-700 mb-2">
              🕒 End Time
            </label>
            <div className="relative">
              <select
                id="endTime"
                value={formData.end_time}
                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                className="w-full px-4 py-3 pl-12 bg-white border border-gray-200 rounded-lg text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400/50 focus:border-green-400/50 transition-all duration-300 font-medium text-sm"
                required
              >
                <option value="">Select end time</option>
                {generateTimeOptions().map(time => (
                  <option key={time} value={time}>{formatTime(time)}</option>
                ))}
              </select>
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-green-500">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        <div className="relative">
          <label htmlFor="timeBasedPrice" className="block text-sm font-semibold text-gray-700 mb-2">
            💰 Price (Rs.)
          </label>
          <div className="relative">
            <input
              id="timeBasedPrice"
              type="number"
              step="0.01"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              placeholder="Enter price"
              required
              className="w-full px-4 py-3 pl-12 bg-white border border-gray-200 rounded-lg text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400/50 focus:border-green-400/50 transition-all duration-300 font-medium text-sm"
            />
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-green-500">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
          </div>
        </div>

        <div className="relative">
          <label htmlFor="timeBasedMessage" className="block text-sm font-semibold text-gray-700 mb-2">
            💬 Message (Optional)
          </label>
          <div className="relative">
            <textarea
              id="timeBasedMessage"
              placeholder="Add a message explaining the time-based price..."
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              className="w-full px-4 py-3 pl-12 bg-white border border-gray-200 rounded-lg text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400/50 focus:border-green-400/50 transition-all duration-300 font-medium text-sm"
              rows={3}
              maxLength={200}
            />
            <div className="absolute left-4 top-4 text-green-500">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
          </div>
          <div className="text-right text-xs text-gray-500 mt-1">
            {formData.message.length}/200
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <button
            type="submit"
            className="flex-1 bg-linear-to-r from-green-500 to-green-600 text-white font-semibold py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 border border-green-400/30"
          >
            <span className="flex items-center justify-center">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Create Time-Based Pricing
            </span>
          </button>
          <button
            type="button"
            onClick={onSuccess}
            className="flex-1 sm:flex-none bg-linear-to-r from-gray-500 to-gray-600 text-white font-semibold py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 border border-gray-400/30"
          >
            <span className="flex items-center justify-center">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Cancel
            </span>
          </button>
        </div>
      </form>
    </div>
  );
}

// Edit Time-Based Pricing Form Component
function EditTimeBasedPricingForm({ price, openingHours, closingHours, onUpdate, onCancel, setNotification }: {
  price: any,
  openingHours: string,
  closingHours: string,
  onUpdate: () => void,
  onCancel: () => void,
  setNotification: (notification: { message: string, type: 'success' | 'info' }) => void
}) {
  const { updateTimeBasedPricing } = useTimeBasedPricing(price.futsal_id);
  const [formData, setFormData] = useState({
    start_time: price.start_time,
    end_time: price.end_time,
    price: price.price.toString(),
    message: price.message || ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const priceNum = parseFloat(formData.price);
    if (isNaN(priceNum) || priceNum <= 0) {
      setNotification({ message: 'Please enter a valid positive price', type: 'info' });
      return;
    }

    if (!formData.start_time || !formData.end_time) {
      setNotification({ message: 'Please select both start and end times', type: 'info' });
      return;
    }

    if (formData.start_time >= formData.end_time) {
      setNotification({ message: 'End time must be after start time', type: 'info' });
      return;
    }

    const result = await updateTimeBasedPricing(price.time_based_pricing_id, {
      start_time: formData.start_time,
      end_time: formData.end_time,
      price: priceNum,
      message: formData.message || undefined
    });

    if (result.success) {
      setNotification({ message: 'Time-based pricing updated successfully', type: 'success' });
      onUpdate();
    } else {
      setNotification({ message: result.error || 'Error updating time-based pricing', type: 'info' });
    }
  };

  const generateTimeOptions = () => {
    const options = [];
    const opening = new Date(`2000-01-01T${openingHours}`);
    const closing = new Date(`2000-01-01T${closingHours}`);

    for (let time = new Date(opening); time <= closing; time.setMinutes(time.getMinutes() + 30)) {
      const timeString = time.toTimeString().slice(0, 5);
      options.push(timeString);
    }
    return options;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 bg-linear-to-br from-green-500 to-green-600 rounded-lg mb-3 shadow-lg">
          <svg className="w-6 h-6 sm:w-7 sm:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </div>
        <h3 className="text-xl sm:text-2xl font-bold bg-linear-to-r from-green-600 to-green-700 bg-clip-text text-transparent mb-2">
          Edit Time-Based Pricing
        </h3>
        <p className="text-gray-600 text-sm">
          Update the time-based pricing details
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Time Range Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <label htmlFor="editStartTime" className="block text-sm font-semibold text-gray-700 mb-2">
              🕒 Start Time
            </label>
            <div className="relative">
              <select
                id="editStartTime"
                value={formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                className="w-full px-4 py-3 pl-12 bg-white border border-gray-200 rounded-lg text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400/50 focus:border-green-400/50 transition-all duration-300 font-medium text-sm"
                required
              >
                <option value="">Select start time</option>
                {generateTimeOptions().map(time => (
                  <option key={time} value={time}>{formatTime(time)}</option>
                ))}
              </select>
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-green-500">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="relative">
            <label htmlFor="editEndTime" className="block text-sm font-semibold text-gray-700 mb-2">
              🕒 End Time
            </label>
            <div className="relative">
              <select
                id="editEndTime"
                value={formData.end_time}
                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                className="w-full px-4 py-3 pl-12 bg-white border border-gray-200 rounded-lg text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400/50 focus:border-green-400/50 transition-all duration-300 font-medium text-sm"
                required
              >
                <option value="">Select end time</option>
                {generateTimeOptions().map(time => (
                  <option key={time} value={time}>{formatTime(time)}</option>
                ))}
              </select>
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-green-500">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        <div className="relative">
          <label htmlFor="editTimeBasedPrice" className="block text-sm font-semibold text-gray-700 mb-2">
            💰 Price (Rs.)
          </label>
          <div className="relative">
            <input
              id="editTimeBasedPrice"
              type="number"
              step="0.01"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              placeholder="Enter price"
              required
              className="w-full px-4 py-3 pl-12 bg-white border border-gray-200 rounded-lg text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400/50 focus:border-green-400/50 transition-all duration-300 font-medium text-sm"
            />
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-green-500">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
          </div>
        </div>

        <div className="relative">
          <label htmlFor="editTimeBasedMessage" className="block text-sm font-semibold text-gray-700 mb-2">
            💬 Message (Optional)
          </label>
          <div className="relative">
            <textarea
              id="editTimeBasedMessage"
              placeholder="Add a message explaining the time-based price..."
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              className="w-full px-4 py-3 pl-12 bg-white border border-gray-200 rounded-lg text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400/50 focus:border-green-400/50 transition-all duration-300 font-medium text-sm"
              rows={3}
              maxLength={200}
            />
            <div className="absolute left-4 top-4 text-green-500">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
          </div>
          <div className="text-right text-xs text-gray-500 mt-1">
            {formData.message.length}/200
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <button
            type="submit"
            className="flex-1 bg-linear-to-r from-green-500 to-green-600 text-white font-semibold py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 border border-green-400/30"
          >
            <span className="flex items-center justify-center">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Update Time-Based Pricing
            </span>
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 sm:flex-none bg-linear-to-r from-gray-500 to-gray-600 text-white font-semibold py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 border border-gray-400/30"
          >
            <span className="flex items-center justify-center">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Cancel
            </span>
          </button>
        </div>
      </form>
    </div>
  );
}

// Edit Special Price Form Component
function EditSpecialPriceForm({ price, onUpdate, onCancel, setNotification }: { price: any, onUpdate: () => void, onCancel: () => void, setNotification: (notification: { message: string, type: 'success' | 'info' }) => void }) {
  const { updateSpecialPrice } = useSpecialPrices(price.futsal_id);
  const { data: futsalsData } = useFutsals();
  const futsal = futsalsData?.find((f: Futsal) => f.futsal_id === price.futsal_id);
  const [formData, setFormData] = useState({
    special_price: price.special_price.toString(),
    message: price.message || '',
    special_date: price.special_date ? new Date(price.special_date).toISOString().split('T')[0] : '',
    recurring_days: price.recurring_days || [],
    start_time: price.start_time ? price.start_time.slice(0, 5) : '',
    end_time: price.end_time ? price.end_time.slice(0, 5) : ''
  });

  const generateTimeOptions = (opening: string, closing: string) => {
    const options = [];
    const openingTime = new Date(`2000-01-01T${opening}`);
    const closingTime = new Date(`2000-01-01T${closing}`);

    for (let time = new Date(openingTime); time <= closingTime; time.setMinutes(time.getMinutes() + 30)) {
      const timeString = time.toTimeString().slice(0, 5);
      options.push(timeString);
    }
    return options;
  };

  const formatTime = (timeString: string): string => {
    const [hours, minutes] = timeString.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const updateData: any = {
      special_price: parseFloat(formData.special_price),
      message: formData.message || undefined
    };

    if (price.type === 'date') {
      updateData.special_date = formData.special_date;
    } else if (price.type === 'recurring') {
      updateData.recurring_days = formData.recurring_days;
    } else if (price.type === 'time_based') {
      updateData.start_time = formData.start_time;
      updateData.end_time = formData.end_time;
      if (formData.special_date) {
        updateData.special_date = formData.special_date;
      }
    }

    const result = await updateSpecialPrice(price.special_price_id, updateData);

    if (result.success) {
      setNotification({ message: 'Special price updated successfully', type: 'success' });
      onUpdate();
    } else {
      setNotification({ message: result.error || 'Error updating special price', type: 'info' });
    }
  };

  const toggleDay = (day: string) => {
    setFormData({
      ...formData,
      recurring_days: formData.recurring_days.includes(day)
        ? formData.recurring_days.filter((d: string) => d !== day)
        : [...formData.recurring_days, day]
    });
  };

  return (
    <form onSubmit={handleSubmit} className="border rounded p-4 mb-4 bg-green-50">
      <h4 className="font-bold mb-4">Edit Special Price</h4>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
          <input
            type="number"
            step="0.01"
            value={formData.special_price}
            onChange={(e) => setFormData({ ...formData, special_price: e.target.value })}
            className="w-full p-2 border border-gray-300 rounded resize-none focus:outline-none focus:ring-0 focus:border-gray-900"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Message (Optional)</label>
          <input
            type="text"
            value={formData.message}
            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            className="w-full p-2 border border-gray-300 rounded resize-none focus:outline-none focus:ring-0 focus:border-gray-900"
          />
        </div>
      </div>

      {price.type === 'date' && (
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
          <input
            type="date"
            value={formData.special_date}
            onChange={(e) => setFormData({ ...formData, special_date: e.target.value })}
            min={new Date().toISOString().split('T')[0]}
            className="w-full p-2 border border-gray-300 rounded resize-none focus:outline-none focus:ring-0 focus:border-gray-900"
            required
          />
        </div>
      )}

      {price.type === 'recurring' && (
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Recurring Days</label>
          <div className="grid grid-cols-7 gap-2">
            {['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'].map((day) => (
              <label key={day} className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.recurring_days.includes(day)}
                  onChange={() => toggleDay(day)}
                  className="mr-2"
                />
                {day.slice(0, 3)}
              </label>
            ))}
          </div>
        </div>
      )}

      {price.type === 'time_based' && futsal && (
        <div className="mt-4 space-y-3">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            🕒 Time Range
          </label>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <label
                htmlFor="editStartTime"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                Start Time
              </label>

              <div className="relative">
                <select
                  id="editStartTime"
                  value={formData.start_time}
                  onChange={(e) =>
                    setFormData({ ...formData, start_time: e.target.value })
                  }
                  className="w-full px-4 py-3 pl-12 bg-white border border-gray-200 rounded-lg text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400/50 focus:border-green-400/50 transition-all duration-300 font-medium text-sm"
                  required
                >
                  <option value="">Select start time</option>
                  {generateTimeOptions(futsal.opening_hours, futsal.closing_hours).map((time: string) => (
                    <option key={time} value={time}>
                      {formatTime(time)}
                    </option>
                  ))}
                </select>

                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-green-500">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
              </div>
            </div>

            <div className="relative">
              <label
                htmlFor="editEndTime"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                End Time
              </label>

              <div className="relative">
                <select
                  id="editEndTime"
                  value={formData.end_time}
                  onChange={(e) =>
                    setFormData({ ...formData, end_time: e.target.value })
                  }
                  className="w-full px-4 py-3 pl-12 bg-white border border-gray-200 rounded-lg text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400/50 focus:border-green-400/50 transition-all duration-300 font-medium text-sm"
                  required
                >
                  <option value="">Select end time</option>
                  {generateTimeOptions(futsal.opening_hours, futsal.closing_hours).map((time: string) => (
                    <option key={time} value={time}>
                      {formatTime(time)}
                    </option>
                  ))}
                </select>

                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-green-500">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <div className="relative">
            <label htmlFor="editSpecialDate" className="block text-sm font-semibold text-gray-700 mb-2">
              📅 Choose Date (Optional)
            </label>
            <div className="relative">
              <input
                id="editSpecialDate"
                type="date"
                value={formData.special_date}
                onChange={(e) => setFormData({ ...formData, special_date: e.target.value })}
                className="w-full px-4 py-3 pl-12 bg-white border border-gray-200 rounded-lg text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400/50 focus:border-green-400/50 transition-all duration-300 font-medium text-sm"
              />
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-green-500">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-end mt-4 space-x-2">
        <button type="button" onClick={onCancel} className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded">
          Cancel
        </button>
        <button type="submit" className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded">
          Update
        </button>
      </div>
    </form>
  );
}

function CreateRatingForm({ futsalId, onSuccess, onCancel, setNotification }: { futsalId: number, onSuccess: () => void, onCancel: () => void, setNotification: (notification: { message: string, type: 'success' | 'info' }) => void }) {
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [userName, setUserName] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/ratings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          futsal_id: futsalId,
          user_id: null, // Admin-created ratings are always anonymous
          users: isAnonymous ? 'Anonymous' : userName.trim(),
          users_type: 'admin created',
          rating,
          comment: comment.trim() || null
        }),
      });

      if (response.ok) {
        setNotification({ message: 'Rating created successfully!', type: 'success' });
        onSuccess();
      } else {
        const error = await response.json();
        setNotification({ message: error.message || 'Error creating rating', type: 'info' });
      }
    } catch (error) {
      console.error('Error:', error);
      setNotification({ message: 'Error creating rating', type: 'info' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 bg-linear-to-br from-green-500 to-green-600 rounded-lg mb-3 shadow-lg">
          <svg className="w-6 h-6 sm:w-7 sm:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
        </div>
        <h3 className="text-xl sm:text-2xl font-bold bg-linear-to-r from-green-600 to-green-700 bg-clip-text text-transparent mb-2">
          Create New Rating
        </h3>
        <p className="text-gray-600 text-sm">
          Add a rating for your futsal venue
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* User Type Selection */}
        <div className="space-y-3">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            👤 User Type
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className={`flex items-center p-3 border-2 rounded-lg cursor-pointer transition-all duration-300 ${!isAnonymous
              ? 'border-green-500 bg-green-50 shadow-md'
              : 'border-gray-200 hover:border-green-300'
              }`}>
              <input
                type="radio"
                checked={!isAnonymous}
                onChange={() => setIsAnonymous(false)}
                className="mr-3 text-green-600 focus:ring-green-500"
              />
              <span className="text-sm font-medium text-gray-700">Named User</span>
            </label>
            <label className={`flex items-center p-3 border-2 rounded-lg cursor-pointer transition-all duration-300 ${isAnonymous
              ? 'border-green-500 bg-green-50 shadow-md'
              : 'border-gray-200 hover:border-green-300'
              }`}>
              <input
                type="radio"
                checked={isAnonymous}
                onChange={() => setIsAnonymous(true)}
                className="mr-3 text-green-600 focus:ring-green-500"
              />
              <span className="text-sm font-medium text-gray-700">Anonymous</span>
            </label>
          </div>
        </div>

        {/* User Name Input */}
        {!isAnonymous && (
          <div className="relative">
            <label htmlFor="userName" className="block text-sm font-semibold text-gray-700 mb-2">
              📝 User Name
            </label>
            <div className="relative">
              <input
                id="userName"
                type="text"
                placeholder="Enter user name"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                required
                className="w-full px-4 py-3 pl-12 bg-white border border-gray-200 rounded-lg text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400/50 focus:border-green-400/50 transition-all duration-300 font-medium text-sm"
              />
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-green-500">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            </div>
          </div>
        )}

        {/* Rating Stars */}
        <div className="space-y-3">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            ⭐ Rating
          </label>
          <div className="flex items-center justify-center space-x-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                className="focus:outline-none transform hover:scale-110 transition-all duration-300"
              >
                <svg
                  className={`w-8 h-8 sm:w-10 sm:h-10 ${star <= rating
                    ? 'text-yellow-400 drop-shadow-lg'
                    : 'text-gray-300 hover:text-yellow-300'
                    }`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </button>
            ))}
          </div>
          <div className="text-center">
            <span className="inline-flex items-center px-3 py-1 rounded-lg bg-green-100 text-green-800 text-sm font-medium">
              {rating} star{rating > 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Comment */}
        <div className="relative">
          <label htmlFor="comment" className="block text-sm font-semibold text-gray-700 mb-2">
            💬 Comment (Optional)
          </label>
          <div className="relative">
            <textarea
              id="comment"
              placeholder="Share your thoughts about this futsal venue..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full px-4 py-3 pl-12 bg-white border border-gray-200 rounded-lg text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400/50 focus:border-green-400/50 transition-all duration-300 font-medium text-sm"
              rows={4}
              maxLength={500}
            />
            <div className="absolute left-4 top-4 text-green-500">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
          </div>
          <div className="text-right text-xs text-gray-500 mt-1">
            {comment.length}/500
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <button
            type="submit"
            disabled={loading || (!isAnonymous && !userName.trim())}
            className="flex-1 bg-linear-to-r from-green-500 to-green-600 text-white font-semibold py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none border border-green-400/30"
          >
            <span className="flex items-center justify-center">
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating Rating...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Create Rating
                </>
              )}
            </span>
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 sm:flex-none bg-linear-to-r from-gray-500 to-gray-600 text-white font-semibold py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 border border-gray-400/30"
          >
            <span className="flex items-center justify-center">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Cancel
            </span>
          </button>
        </div>
      </form>
    </div>
  );
}

function EditAdminForm({ admin, onUpdate, onCancel }: { admin: Admin, onUpdate: (data: any) => void, onCancel: () => void }) {
  const [formData, setFormData] = useState({
    username: admin.username,
    email: admin.email,
    phone: admin.phone,
    password: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    await onUpdate(formData);
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <input type="text" placeholder="Username" value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} required className="p-2 border border-gray-400 rounded resize-none focus:outline-none focus:ring-0 focus:border-gray-900 focus:border" />
        <input type="email" placeholder="Email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required className="p-2 border border-gray-400 rounded resize-none focus:outline-none focus:ring-0 focus:border-gray-900 focus:border" />
        <input type="tel" placeholder="Phone (10 digits starting with 9)" value={formData.phone} maxLength={10} pattern="9[0-9]{9}" onChange={(e) => {
          const value = e.target.value.replace(/\D/g, "");
          if (value.length <= 10 && (value === "" || value.startsWith("9"))) {
            setFormData({ ...formData, phone: value });
          }
        }} required className="p-2 border border-gray-400 rounded resize-none focus:outline-none focus:ring-0 focus:border-gray-900 focus:border" />
        <input type="password" placeholder="New Password (leave empty to keep current)" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className="p-2 border border-gray-400 rounded resize-none focus:outline-none focus:ring-0 focus:border-gray-900 focus:border" />
      </div>
      <div className="flex space-x-4">
        <button type="submit" disabled={loading} className="bg-linear-to-r from-green-600 to-green-700 text-white font-bold py-2 px-4 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 border border-green-500/30 hover:border-green-400/50 disabled:opacity-50">
          {loading ? 'Updating...' : 'Update Info'}
        </button>
        <button type="button" onClick={onCancel} className="bg-linear-to-r from-gray-500 to-gray-600 text-white font-bold py-2 px-4 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 border border-gray-400/30 hover:border-gray-400/50">
          Cancel
        </button>
      </div>
    </form>
  );
}

// Notification Component
const Notification = () => {
  const { notification, hideNotification } = useNotificationStore();

  if (!notification) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`max-w-sm w-full bg-white rounded-2xl shadow-2xl border p-6 transform transition-all duration-300 ${notification.type === 'success' ? 'border-green-200' : 'border-blue-200'}`}>
        <div className="text-center">
          <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg mb-4 ${notification.type === 'success' ? 'bg-green-100' : 'bg-blue-100'}`}>
            {notification.type === 'success' ? (
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </div>
          <p className={`text-sm font-medium ${notification.type === 'success' ? 'text-green-800' : 'text-blue-800'}`}>
            {notification.message}
          </p>
        </div>
      </div>
    </div>
  );
};

function EditBookingForm({ booking, onUpdate, onCancel, adminId, setNotification }: { booking: any, onUpdate: (data: any) => void, onCancel: () => void, adminId: number, setNotification: (notification: { message: string, type: 'success' | 'info' }) => void }) {
  const [step, setStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState(booking.booking_date?.split('T')[0] || '');
  const [selectedShift, setSelectedShift] = useState('');
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [selectedSlotId, setSelectedSlotId] = useState<number | null>(null);
  const [numberOfPlayers, setNumberOfPlayers] = useState(booking.number_of_players);
  const [teamName, setTeamName] = useState(booking.team_name || '');
  const [loading, setLoading] = useState(false);

  // Get futsal_id from the booking
  const futsalId = booking.futsal_id;

  const handleDateSubmit = () => {
    if (selectedDate) {
      setStep(2);
      setSelectedShift(''); // Reset shift when date changes
      setAvailableSlots([]);
      setSelectedSlotId(null);
    }
  };

  const handleShiftSubmit = async () => {
    if (selectedShift && selectedDate && futsalId) {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/time-slots/futsal/${futsalId}/date/${selectedDate}/shift/${selectedShift}`);
        if (response.ok) {
          const data = await response.json();
          setAvailableSlots(data.slots);
          setStep(3);
        }
      } catch (error) {
        console.error('Error fetching slots:', error);
      }
    }
  };

  const handleFinalSubmit = async () => {
    if (!selectedSlotId) return;

    setLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/bookings/futsal-admin/${booking.booking_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slot_id: selectedSlotId,
          number_of_players: numberOfPlayers,
          team_name: teamName,
          futsal_admin_id: adminId
        }),
      });

      if (response.ok) {
        onUpdate({ selectedDate, selectedSlotId, numberOfPlayers, teamName });
      } else {
        setNotification({ message: 'Error updating booking', type: 'info' });
      }
    } catch (error) {
      console.error('Error:', error);
      setNotification({ message: 'Error updating booking', type: 'info' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">

      {/* Step 1: Select Date */}
      {step === 1 && (
        <div className="max-w-2xl mx-auto">
          <div className="relative bg-white rounded-2xl shadow-2xl overflow-hidden transform transition-all duration-500 hover:scale-[1.02]">
            {/* Gradient Background */}
            <div className="absolute inset-0 bg-linear-to-br from-green-50 via-white to-blue-50 opacity-50"></div>

            {/* Content */}
            <div className="relative p-5">
              {/* Header */}
              <div className="text-center mb-5">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-linear-to-br from-green-500 to-green-600 rounded-lg mb-4 shadow-lg">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold bg-linear-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-2">
                  Select New Date
                </h2>
                <p className="text-gray-600 text-sm">Choose a new date for this booking</p>
              </div>

              {/* Date Input */}
              <div className="space-y-7">
                <div className="relative">
                  <label htmlFor="editBookingDate" className="block text-sm font-semibold text-gray-700 mb-2">
                    📅 New Booking Date
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      id="editBookingDate"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      min={new Date().toISOString().split("T")[0]}
                      required
                      className="w-full px-4 py-2.5 pl-9 bg-white border border-gray-200 rounded-lg text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400/50 focus:border-green-400/50 transition-all duration-300 font-medium text-sm"
                    />
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-500">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <button
                    onClick={onCancel}
                    className="flex-1 order-2 sm:order-1 bg-linear-to-r from-gray-500 to-gray-600 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 border border-gray-400/30"
                  >
                    <span className="flex items-center justify-center">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Cancel Edit
                    </span>
                  </button>
                  <button
                    onClick={handleDateSubmit}
                    disabled={!selectedDate}
                    className="flex-1 order-1 sm:order-2 bg-linear-to-r from-green-500 to-green-600 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none border border-green-400/30"
                  >
                    <span className="flex items-center justify-center">
                      Next: Select Shift
                      <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </span>
                  </button>
                </div>
              </div>


            </div>
          </div>
        </div>
      )}

      {/* Step 2: Select Shift */}
      {step === 2 && (
        <div className="max-w-2xl mx-auto">
          <div className="relative bg-white rounded-2xl shadow-2xl overflow-hidden transform transition-all duration-500 hover:scale-[1.02]">
            {/* Gradient Background */}
            <div className="absolute inset-0 bg-linear-to-br from-green-50 via-white to-blue-50 opacity-50"></div>

            {/* Content */}
            <div className="relative p-2 sm:p-8">
              {/* Header */}
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-linear-to-br from-green-500 to-green-600 rounded-lg mb-4 shadow-lg">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold bg-linear-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-2">
                  Choose New Shift
                </h2>
                <p className="text-gray-600 text-sm">Pick the time period that works best for the new booking</p>
              </div>

              {/* Selected Date Info */}
              <div className="bg-linear-to-r from-green-100 to-blue-100 rounded-xl p-4 mb-6 border border-green-200">
                <div className="flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-sm font-medium text-green-800">
                    Selected Date: <span className="font-bold">{selectedDate}</span>
                  </span>
                </div>
              </div>

              {/* Shift Selection */}
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  {['Morning', 'Day', 'Evening', 'Night'].map((shift) => (
                    <button
                      key={shift}
                      onClick={() => {
                        const newShift = selectedShift === shift ? '' : shift;
                        setSelectedShift(newShift);
                      }}
                      className={`relative p-6 border-2 rounded-xl transition-all duration-300 transform hover:scale-105 ${selectedShift === shift
                        ? "bg-linear-to-br from-green-500 to-green-600 border-green-500 text-white shadow-lg"
                        : "bg-white border-gray-200 hover:border-green-300 hover:shadow-md"
                        }`}
                    >
                      {selectedShift === shift && (
                        <div className="absolute top-2 right-2 w-6 h-6 bg-white rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                      <div className={`font-bold text-lg mb-1 ${selectedShift === shift ? 'text-white' : 'text-gray-800'}`}>
                        {shift}
                      </div>
                      <div className={`text-sm ${selectedShift === shift ? 'text-green-100' : 'text-gray-600'}`}>
                        {shift === "Morning" && "6 AM - 10 AM"}
                        {shift === "Day" && "10 AM - 2 PM"}
                        {shift === "Evening" && "2 PM - 6 PM"}
                        {shift === "Night" && "7 PM - 11 PM"}
                      </div>
                    </button>
                  ))}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <button
                    onClick={() => {
                      setStep(1);
                    }}
                    className="flex-1 order-2 sm:order-1 bg-linear-to-r from-gray-500 to-gray-600 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 border border-gray-400/30"
                  >
                    <span className="flex items-center justify-center">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                      </svg>
                      Back
                    </span>
                  </button>
                  <button
                    onClick={handleShiftSubmit}
                    disabled={!selectedShift}
                    className="flex-1 order-1 sm:order-2 bg-linear-to-r from-green-500 to-green-600 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none border border-green-400/30"
                  >
                    <span className="flex items-center justify-center">
                      Next: Select Slot
                      <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </span>
                  </button>
                </div>
              </div>


            </div>
          </div>
        </div>
      )}

      {/* Step 3: Select Slot and Update Details */}
      {step === 3 && (
        <div className="w-full max-w-6xl mx-auto">
          <div className="relative bg-white rounded-2xl shadow-2xl overflow-hidden transform transition-all duration-500 hover:scale-[1.02]">
            {/* Gradient Background */}
            <div className="absolute inset-0 bg-linear-to-br from-green-50 via-white to-blue-50 opacity-50"></div>

            {/* Content */}
            <div className="relative p-2 sm:p-8 max-h-[80vh] overflow-y-auto">
              {/* Header */}
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-linear-to-br from-green-500 to-green-600 rounded-lg mb-4 shadow-lg">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold bg-linear-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-2">
                  Pick New Time Slot
                </h2>
                <p className="text-gray-600 text-sm">Choose the perfect time for the updated booking</p>
              </div>

              {/* Date and Shift Info */}
              <div className="bg-linear-to-r from-green-100 to-blue-100 rounded-xl p-4 mb-6 border border-green-200">
                <div className="flex items-center justify-center space-x-6">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-sm font-medium text-green-800">
                      Date: <span className="font-bold">{selectedDate}</span>
                    </span>
                  </div>
                  <div className="w-px h-6 bg-green-300"></div>
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    <span className="text-sm font-medium text-green-800">
                      Shift: <span className="font-bold">{selectedShift}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Slot Selection */}
              {availableSlots.length > 0 ? (
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">Available Time Slots</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {availableSlots.map((slot) => (
                      <button
                        key={slot.slot_id}
                        onClick={() => slot.display_status === 'available' && setSelectedSlotId(slot.slot_id)}
                        disabled={
                          slot.display_status === "booked" ||
                          slot.display_status === "expired" ||
                          slot.status === "disabled" ||
                          slot.status === "pending"
                        }
                        className={`relative p-4 border-2 rounded-xl text-center transition-all duration-300 transform hover:scale-105 ${slot.display_status === "booked"
                          ? "bg-red-50 border-red-300 cursor-not-allowed opacity-60"
                          : slot.display_status === "expired"
                            ? "bg-yellow-50 border-yellow-300 cursor-not-allowed opacity-60"
                            : slot.status === "disabled"
                              ? "bg-gray-50 border-gray-300 cursor-not-allowed opacity-60"
                              : slot.status === "pending"
                                ? "bg-orange-50 border-orange-300 cursor-not-allowed opacity-60"
                                : selectedSlotId === slot.slot_id
                                  ? "bg-linear-to-br from-green-500 to-green-600 border-green-500 text-white shadow-lg"
                                  : "bg-white border-gray-200 hover:border-green-300 hover:shadow-md"
                          }`}
                      >
                        {selectedSlotId === slot.slot_id && (
                          <div className="absolute top-1 right-2 w-4 h-4 bg-white rounded-lg flex items-center justify-center shadow-sm">
                            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        )}
                        <div className={`font-bold text-sm mb-1 ${selectedSlotId === slot.slot_id ? 'text-white' :
                          slot.display_status === "booked" ? 'text-red-600' :
                            slot.display_status === "expired" ? 'text-yellow-600' :
                              slot.status === "disabled" ? 'text-gray-600' :
                                slot.status === "pending" ? 'text-orange-600' :
                                  'text-gray-800'
                          }`}>
                          {formatTimeSlot(slot.start_time)} - {formatTimeSlot(slot.end_time)}
                        </div>
                        <div className={`text-sm ${selectedSlotId === slot.slot_id ? 'text-green-100' :
                          slot.display_status === "booked" ? 'text-red-500' :
                            slot.display_status === "expired" ? 'text-yellow-500' :
                              slot.status === "disabled" ? 'text-gray-500' :
                                slot.status === "pending" ? 'text-orange-500' :
                                  'text-gray-600'
                          }`}>
                          {slot.display_status === "booked"
                            ? `👤 ${slot.booker_name || "User"}`
                            : slot.display_status === "expired"
                              ? "⏰ Expired"
                              : slot.status === "disabled"
                                ? "🚫 Disabled"
                                : slot.status === "pending"
                                  ? "⏳ In Process"
                                  : "✅ Available"}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-gray-500 text-lg font-medium">No slots available for this shift</p>
                  <p className="text-gray-400 text-sm mt-1">Try selecting a different shift or date</p>
                </div>
              )}

              {/* Details Form */}
              {selectedSlotId && availableSlots.length > 0 && (
                <div className="border-t border-gray-200 pt-8">
                  <div className="text-center mb-6">
                    <h3 className="text-xl font-bold text-gray-800 mb-2">Update Booking Details</h3>
                    <p className="text-gray-600 text-sm">Modify the booking information</p>
                  </div>

                  <form onSubmit={(e) => { e.preventDefault(); handleFinalSubmit(); }} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="relative">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          👥 Number of Players
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            id="editNumber"
                            placeholder="1-10 players"
                            value={numberOfPlayers}
                            onChange={(e) => setNumberOfPlayers(Number(e.target.value))}
                            min="1"
                            max="10"
                            required
                            className="w-full px-4 py-3 pl-12 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all duration-300 text-gray-700 font-medium"
                          />
                          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-500">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                          </div>
                        </div>
                      </div>

                      <div className="relative">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          🏆 Team Name <span className="text-gray-500 font-normal">(optional)</span>
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            id="editTeamname"
                            placeholder="Enter team name"
                            value={teamName}
                            onChange={(e) => setTeamName(e.target.value)}
                            className="w-full px-4 py-3 pl-12 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all duration-300 text-gray-700 font-medium"
                          />
                          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-500">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4 pt-6">
                      <button
                        type="button"
                        onClick={() => {
                          setStep(2);
                        }}
                        className="flex-1 order-2 sm:order-1 bg-linear-to-r from-gray-500 to-gray-600 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 border border-gray-400/30"
                      >
                        <span className="flex items-center justify-center">
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                          </svg>
                          Back
                        </span>
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 order-1 sm:order-2 bg-linear-to-r from-green-500 to-green-600 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none border border-green-400/30"
                      >
                        <span className="flex items-center justify-center">
                          {loading ? (
                            <>
                              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Updating Booking...
                            </>
                          ) : (
                            <>
                              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                              Update Booking
                            </>
                          )}
                        </span>
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Back Button when no slot selected */}
              {!selectedSlotId && availableSlots.length > 0 && (
                <div className="flex justify-center pt-6">
                  <button
                    onClick={() => setStep(2)}
                    className="bg-linear-to-r from-gray-500 to-gray-600 text-white font-semibold py-3 px-8 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 border border-gray-400/30"
                  >
                    <span className="flex items-center justify-center">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                      </svg>
                      Back to Shift Selection
                    </span>
                  </button>
                </div>
              )}


            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EditRatingForm({ rating, onUpdate, onCancel }: { rating: any, onUpdate: (ratingValue: number, comment: string, users?: string, users_type?: string) => void, onCancel: () => void }) {
  const [userRating, setUserRating] = useState(rating.rating);
  const [comment, setComment] = useState(rating.comment || '');
  const [users, setUsers] = useState(rating.users || '');
  const [users_type, setUsersType] = useState(rating.users_type || '');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    onUpdate(userRating, comment, users, users_type);
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 bg-linear-to-br from-green-500 to-green-600 rounded-lg mb-3 shadow-lg">
          <svg className="w-6 h-6 sm:w-7 sm:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </div>
        <h3 className="text-xl sm:text-2xl font-bold bg-linear-to-r from-green-600 to-green-700 bg-clip-text text-transparent mb-2">
          Edit Rating
        </h3>
        <p className="text-gray-600 text-sm">
          Update the rating details
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* User Name Input (only for non-registered users) */}
        {rating.users_type !== 'registered user' && (
          <div className="relative">
            <label htmlFor="editUserName" className="block text-sm font-semibold text-gray-700 mb-2">
              📝 User Name
            </label>
            <div className="relative">
              <input
                id="editUserName"
                type="text"
                placeholder="Enter user name"
                value={users}
                onChange={(e) => setUsers(e.target.value)}
                required
                className="w-full px-4 py-3 pl-12 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all duration-300 text-gray-700 font-medium"
              />
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-green-500">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            </div>
          </div>
        )}

        {/* Rating Stars */}
        <div className="space-y-3">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            ⭐ Rating
          </label>
          <div className="flex items-center justify-center space-x-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setUserRating(star)}
                className="focus:outline-none transform hover:scale-110 transition-all duration-300"
              >
                <svg
                  className={`w-8 h-8 sm:w-10 sm:h-10 ${star <= userRating
                    ? 'text-yellow-400 drop-shadow-lg'
                    : 'text-gray-300 hover:text-yellow-300'
                    }`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </button>
            ))}
          </div>
          <div className="text-center">
            <span className="inline-flex items-center px-3 py-1 rounded-lg bg-green-100 text-green-800 text-sm font-medium">
              {userRating} star{userRating > 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Comment */}
        <div className="relative">
          <label htmlFor="editComment" className="block text-sm font-semibold text-gray-700 mb-2">
            💬 Comment (Optional)
          </label>
          <div className="relative">
            <textarea
              id="editComment"
              placeholder="Update your comment..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full px-4 py-3 pl-12 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all duration-300 text-gray-700 font-medium resize-none"
              rows={4}
              maxLength={500}
            />
            <div className="absolute left-4 top-4 text-green-500">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
          </div>
          <div className="text-right text-xs text-gray-500 mt-1">
            {comment.length}/500
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4">

          <button
            type="button"
            onClick={onCancel}
            className="flex-1 sm:flex-none bg-linear-to-r from-gray-500 to-gray-600 text-white font-semibold py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 border border-gray-400/30"
          >
            <span className="flex items-center justify-center">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Cancel
            </span>
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-linear-to-r from-green-500 to-green-600 text-white font-semibold py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none border border-green-400/30"
          >
            <span className="flex items-center justify-center">
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Updating Rating...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Update Rating
                </>
              )}
            </span>
          </button>
        </div>
      </form>
    </div>
  );
}

function EditFutsalForm({ futsal, onUpdate, onCancel }: { futsal: Futsal, onUpdate: (data: FormData) => void, onCancel: () => void }) {
  const [formData, setFormData] = useState({
    name: futsal.name,
    location: futsal.location,
    city: futsal.city,
    latitude: futsal.latitude?.toString() || '',
    longitude: futsal.longitude?.toString() || '',
    phone: futsal.phone || '',
    description: futsal.description || '',
    price_per_hour: futsal.price_per_hour?.toString() || '',
    game_format: futsal.game_format || '',
    facilities: futsal.facilities || [],
    opening_hours: futsal.opening_hours ? futsal.opening_hours.split(':').slice(0, 2).map(h => h.padStart(2, '0')).join(':') : '',
    closing_hours: futsal.closing_hours ? futsal.closing_hours.split(':').slice(0, 2).map(h => h.padStart(2, '0')).join(':') : ''
  });
  const [images, setImages] = useState<FileList | null>(null);
  const [video, setVideo] = useState<File | null>(null);
  const [existingImages, setExistingImages] = useState<string[]>(futsal.images || []);
  const [existingVideo, setExistingVideo] = useState<string | null>(futsal.video || null);
  const [removedImages, setRemovedImages] = useState<string[]>([]);
  const [removedVideo, setRemovedVideo] = useState(false);
  const [loading, setLoading] = useState(false);
  const [customGameFormat, setCustomGameFormat] = useState('');
  const [customFacilities, setCustomFacilities] = useState('');
  const gameFormatOptions = [
    '5 vs 5 on-court',
    '6 vs 6 on-court',
    '7 vs 7 on-court',
    '8 vs 8 on-court',
    '9 vs 9 on-court',
    '10 vs 10 on-field',
    '1 vs 11 on-field'
  ];

  const facilitiesOptions = [
    'Night lighting',
    'Changing rooms',
    'showers',
    'Washrooms / drinking water',
    'Parking facilities',
    'swimming pool',
    'Tournaments',
    'Café / snacks area / seating lounge'
  ];


  const removeImage = (imgPath: string) => {
    setExistingImages(existingImages.filter(img => img !== imgPath));
    setRemovedImages([...removedImages, imgPath]);
  };

  const removeVideo = () => {
    setExistingVideo(null);
    setRemovedVideo(true);
  };

  const handleGameFormatChange = (value: string) => {
    if (value !== 'custom') {
      setFormData({ ...formData, game_format: value });
      setCustomGameFormat('');
    }
  };

  const handleFacilitiesChange = (option: string, checked: boolean) => {
    if (checked) {
      setFormData({ ...formData, facilities: [...formData.facilities, option] });
    } else {
      setFormData({ ...formData, facilities: formData.facilities.filter(f => f !== option) });
    }
  };

  const addCustomFacility = () => {
    if (customFacilities.trim() && !formData.facilities.includes(customFacilities.trim())) {
      setFormData({ ...formData, facilities: [...formData.facilities, customFacilities.trim()] });
      setCustomFacilities('');
    }
  };

  const removeFacility = (facility: string) => {
    setFormData({ ...formData, facilities: formData.facilities.filter(f => f !== facility) });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const data = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (key === 'facilities') {
        data.append(key, JSON.stringify(value));
      } else {
        data.append(key, value as string);
      }
    });
    if (images) {
      for (let i = 0; i < images.length; i++) {
        data.append('images', images[i]);
      }
    }
    if (video) data.append('video', video);
    data.append('removed_images', JSON.stringify(removedImages));
    data.append('removed_video', removedVideo.toString());

    await onUpdate(data);
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <input type="text" placeholder="Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required className="p-2 border border-gray-400 rounded resize-none focus:outline-none focus:ring-0 focus:border-gray-900 focus:border" />
        <input type="text" placeholder="Location" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} required className="p-2 border border-gray-400 rounded resize-none focus:outline-none focus:ring-0 focus:border-gray-900 focus:border" />
        <input type="text" placeholder="City" value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} required className="p-2 border border-gray-400 rounded resize-none focus:outline-none focus:ring-0 focus:border-gray-900 focus:border" />
        <input type="tel" placeholder="Phone (10 digits starting with 9)" value={formData.phone} maxLength={10} pattern="9[0-9]{9}" onChange={(e) => {
          const value = e.target.value.replace(/\D/g, "");
          if (value.length <= 10 && (value === "" || value.startsWith("9"))) {
            setFormData({ ...formData, phone: value });
          }
        }} className="p-2 border border-gray-400 rounded resize-none focus:outline-none focus:ring-0 focus:border-gray-900 focus:border" />
        <input type="number" placeholder="Price per Hour (Rs.)" value={formData.price_per_hour} onChange={(e) => setFormData({ ...formData, price_per_hour: e.target.value })} step="0.01" className="p-2 border border-gray-400 rounded resize-none focus:outline-none focus:ring-0 focus:border-gray-900 focus:border" />
        <input type="text" placeholder="Latitude" value={formData.latitude} onChange={(e) => setFormData({ ...formData, latitude: e.target.value })} className="p-2 border border-gray-400 rounded resize-none focus:outline-none focus:ring-0 focus:border-gray-900 focus:border" />
        <input type="text" placeholder="Longitude" value={formData.longitude} onChange={(e) => setFormData({ ...formData, longitude: e.target.value })} className="p-2 border border-gray-400 rounded resize-none focus:outline-none focus:ring-0 focus:border-gray-900 focus:border" />
      </div>
      <textarea placeholder="Description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full p-2 border border-gray-400 rounded resize-none focus:outline-none focus:ring-0 focus:border-gray-900 focus:border" />

      {/* Game Format */}
      <div>
        <label className="block text-sm font-medium mb-2">Game Format</label>
        <select
          value={gameFormatOptions.includes(formData.game_format) ? formData.game_format : 'custom'}
          onChange={(e) => {
            const value = e.target.value;
            if (value === 'custom') {
              // keep current
            } else {
              handleGameFormatChange(value);
            }
          }}
          className="w-full p-2 border border-gray-400 rounded resize-none focus:outline-none focus:ring-0 focus:border-gray-900 focus:border mb-2"
        >
          <option value="">Select Game Format</option>
          {gameFormatOptions.map((option: string) => (
            <option key={option} value={option}>{option}</option>
          ))}
          <option value="custom">Enter Custom Format</option>
        </select>
        {(formData.game_format === '' || !gameFormatOptions.includes(formData.game_format)) && (
          <input
            type="text"
            placeholder="Enter custom game format"
            value={customGameFormat}
            onChange={(e) => {
              setCustomGameFormat(e.target.value);
              setFormData({ ...formData, game_format: e.target.value });
            }}
            className="w-full p-2 border border-gray-400 rounded resize-none focus:outline-none focus:ring-0 focus:border-gray-900 focus:border"
          />
        )}
      </div>

      {/* Facilities */}
      <div>
        <label className="block text-sm font-medium mb-2">Facilities</label>
        <div className="grid grid-cols-2 ga p-2 mb-2">
          {facilitiesOptions.map((option: string) => (
            <label key={option} className="flex items-center">
              <input
                type="checkbox"
                checked={formData.facilities.includes(option)}
                onChange={(e) => handleFacilitiesChange(option, e.target.checked)}
                className="mr-2"
              />
              {option}
            </label>
          ))}
        </div>
        <div className="flex space-x-2">
          <input
            type="text"
            placeholder="Add custom facility"
            value={customFacilities}
            onChange={(e) => setCustomFacilities(e.target.value)}
            className="flex-1 p-2 border border-gray-400 rounded resize-none focus:outline-none focus:ring-0 focus:border-gray-900 focus:border"
          />
          <button type="button" onClick={addCustomFacility} className="bg-linear-to-r from-green-600 to-green-700 text-white font-bold py-2 px-4 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 border border-green-500/30 hover:border-green-400/50">
            Add
          </button>
        </div>
        {formData.facilities.length > 0 && (
          <div className="mt-2">
            <strong>Selected Facilities:</strong>
            <div className="flex flex-wrap gap-1 mt-1">
              {formData.facilities.map((facility: string) => (
                <span key={facility} className="bg-blue-100 px-2 py-1 rounded text-sm flex items-center">
                  {facility}
                  <button type="button" onClick={() => removeFacility(facility)} className="ml-1 text-red-600">×</button>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <select value={formData.opening_hours} onChange={(e) => setFormData({ ...formData, opening_hours: e.target.value })} required className="w-full p-2 border border-gray-400 rounded resize-none focus:outline-none focus:ring-0 focus:border-gray-900 focus:border">
          <option value="">Opening Hours</option>
          <option value="06:00">6 AM</option>
          <option value="07:00">7 AM</option>
          <option value="08:00">8 AM</option>
          <option value="09:00">9 AM</option>
          <option value="10:00">10 AM</option>
          <option value="11:00">11 AM</option>
          <option value="12:00">12 PM</option>
          <option value="13:00">1 PM</option>
          <option value="14:00">2 PM</option>
          <option value="15:00">3 PM</option>
          <option value="16:00">4 PM</option>
          <option value="17:00">5 PM</option>
          <option value="18:00">6 PM</option>
          <option value="19:00">7 PM</option>
          <option value="20:00">8 PM</option>
          <option value="21:00">9 PM</option>
          <option value="22:00">10 PM</option>
          <option value="23:00">11 PM</option>
        </select>
        <select value={formData.closing_hours} onChange={(e) => setFormData({ ...formData, closing_hours: e.target.value })} required className="w-full p-2 border border-gray-400 rounded resize-none focus:outline-none focus:ring-0 focus:border-gray-900 focus:border">
          <option value="">Closing Hours</option>
          <option value="06:00">6 AM</option>
          <option value="07:00">7 AM</option>
          <option value="08:00">8 AM</option>
          <option value="09:00">9 AM</option>
          <option value="10:00">10 AM</option>
          <option value="11:00">11 AM</option>
          <option value="12:00">12 PM</option>
          <option value="13:00">1 PM</option>
          <option value="14:00">2 PM</option>
          <option value="15:00">3 PM</option>
          <option value="16:00">4 PM</option>
          <option value="17:00">5 PM</option>
          <option value="18:00">6 PM</option>
          <option value="19:00">7 PM</option>
          <option value="20:00">8 PM</option>
          <option value="21:00">9 PM</option>
          <option value="22:00">10 PM</option>
          <option value="23:00">11 PM</option>
        </select>
      </div>
      {existingImages.length > 0 && (
        <div>
          <strong>Existing Images:</strong>
          <div className="flex flex-wrap ga p-2 mt-2">
            {existingImages.map((img: string, index: number) => (
              <div key={index} className="relative">
                <img src={`${process.env.NEXT_PUBLIC_API_URL}/uploads/${img}`} alt={`Existing ${index + 1}`} className="w-32 h-32 object-cover" />
                <button
                  type="button"
                  onClick={() => removeImage(img)}
                  className="absolute top-0 right-0 bg-red-600 text-white rounded-lg w-6 h-6 flex items-center justify-center text-xs"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      {existingVideo && (
        <div>
          <strong>Existing Video:</strong>
          <div className="relative mt-2">
            <video controls className="w-64 h-36">
              <source src={`${process.env.NEXT_PUBLIC_API_URL}/uploads/${existingVideo}`} type="video/mp4" />
            </video>
            <button
              type="button"
              onClick={removeVideo}
              className="absolute top-0 right-0 bg-red-600 text-white rounded-lg w-6 h-6 flex items-center justify-center text-xs"
            >
              ×
            </button>
          </div>
        </div>
      )}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label>Add Images (up to 5): <input type="file" accept="image/*" multiple onChange={(e) => setImages(e.target.files)} /></label>
        </div>
        <div>
          <label>Update Video: <input type="file" accept="video/*" onChange={(e) => setVideo(e.target.files?.[0] || null)} /></label>
        </div>
      </div>
      <div className="flex space-x-4">
        <button type="submit" disabled={loading} className="bg-linear-to-r from-green-600 to-green-700 text-white font-bold py-2 px-4 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 border border-green-500/30 hover:border-green-400/50 disabled:opacity-50">
          {loading ? 'Updating...' : 'Update Futsal'}
        </button>
        <button type="button" onClick={onCancel} className="bg-linear-to-r from-gray-500 to-gray-600 text-white font-bold py-2 px-4 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 border border-gray-400/30 hover:border-gray-400/50">
          Cancel
        </button>
      </div>
    </form>
  );
}