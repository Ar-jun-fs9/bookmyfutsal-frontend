'use client';

import { useEffect, useState, useRef, useReducer } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useFutsals } from '@/hooks/useFutsals';
import { useBookings, useCancelBooking, useUpdateBooking } from '@/hooks/useBookings';
import { useAuthStore } from '@/stores/authStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { useSocketHandler } from '@/hooks/useSocketHandler';
import { filterReducer, initialFilterState } from '@/reducers/filterReducer';
import { formatTime, formatBookingTimeRange, categorizeBooking, formatDate } from '@/utils/helpers';
import { Notification } from '@/components/ui/Notification';
import { useSpecialPrices } from '@/hooks/useSpecialPrices';
import PriceNotificationModal from '@/components/modals/PriceNotificationModal';

interface User {
  user_id: number;
  first_name: string;
  last_name: string;
  username: string;
  email: string;
  phone: string;
}

interface Futsal {
  futsal_id: number;
  name: string;
  location: string;
  city: string;
  price_per_hour: number;
  images?: string[];
  video?: string;
  latitude?: number;
  longitude?: number;
  admin_phone?: string;
  opening_hours?: string;
  closing_hours?: string;
  description?: string;
  average_rating?: number;
  total_ratings?: number;
  game_format?: string;
  facilities?: string[];
}

interface Booking {
  booking_id: number;
  futsal_id: number;
  futsal_name: string;
  location: string;
  city: string;
  booking_date: string;
  time_slot: string;
  number_of_players: number;
  team_name?: string;
  amount_paid: number;
  total_amount: number;
  payment_status: string;
  formatted_date?: string;
  update_count?: number;
  created_at: string;
  cancelled_by?: string;
  cancelled_at?: string;
}

export default function UserDashboard() {
  const router = useRouter();

  // Server state with React Query
  const { user, hydrated } = useAuthStore();
  const { data: futsals = [], isLoading: futsalsLoading } = useFutsals();
  const { data: bookingsData, isLoading: bookingsLoading } = useBookings(user?.user_id);
  const { notification, showNotification } = useNotificationStore();

  // Mutations
  const cancelBookingMutation = useCancelBooking();
  const updateBookingMutation = useUpdateBooking();

  // Complex UI state with useReducer
  const [filterState, dispatch] = useReducer(filterReducer, initialFilterState);

  // Simple UI state
  const [editing, setEditing] = useState(false);
  const [showBooking, setShowBooking] = useState(false);
  const [selectedFutsal, setSelectedFutsal] = useState<Futsal | null>(null);
  const [updatingBooking, setUpdatingBooking] = useState<Booking | null>(null);
  const [currentImageIndexes, setCurrentImageIndexes] = useState<{ [key: number]: number }>({});
  const [videoModal, setVideoModal] = useState<{ isOpen: boolean, futsal: Futsal | null }>({ isOpen: false, futsal: null });
  const [ratingModal, setRatingModal] = useState<{ isOpen: boolean, futsal: Futsal | null }>({ isOpen: false, futsal: null });
  const [locationModal, setLocationModal] = useState<{ isOpen: boolean, futsal: Futsal | null, distance?: number }>({ isOpen: false, futsal: null });
  const [detailsModal, setDetailsModal] = useState<{ isOpen: boolean, futsal: Futsal | null }>({ isOpen: false, futsal: null });
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean, message: string, onConfirm: () => void }>({ isOpen: false, message: '', onConfirm: () => { } });
  const [successModal, setSuccessModal] = useState<{ isOpen: boolean, message: string }>({ isOpen: false, message: '' });
  const [priceNotification, setPriceNotification] = useState<{ isOpen: boolean, message: string } | null>(null);
  const [deletedBookings, setDeletedBookings] = useState<number[]>([]);
  const [cancelledBookings, setCancelledBookings] = useState<Booking[]>([]);
  const [selectedBookings, setSelectedBookings] = useState<number[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [showCheckboxes, setShowCheckboxes] = useState(false);
  const [showAllFutsals, setShowAllFutsals] = useState(false);
  const [availableShifts, setAvailableShifts] = useState<string[]>([]);
  const [futsalSpecialPrices, setFutsalSpecialPrices] = useState<{[key: number]: any[]}>({});
  // const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  // const [otpCode, setOtpCode] = useState('');
  // const [loggedInUser, setLoggedInUser] = useState<User | null>(null);
  // const [booking, setBooking] = useState<Booking | null>(null);
  const scrollPositionRef = useRef<number>(0);

  // Socket handling
  useSocketHandler();

  // Redirect if not authenticated
  useEffect(() => {
    if (hydrated && !user) {
      router.push('/user/login');
    }
  }, [user, hydrated, router]);

  // Load local state from sessionStorage
  useEffect(() => {
    const storedDeleted = sessionStorage.getItem('user_deleted_bookings');
    if (storedDeleted) {
      setDeletedBookings(JSON.parse(storedDeleted));
    }

    const storedCancelled = sessionStorage.getItem('user_cancelled_bookings');
    if (storedCancelled) {
      setCancelledBookings(JSON.parse(storedCancelled));
    }

    const saved = sessionStorage.getItem('dashboardState');
    if (saved) {
      const data = JSON.parse(saved);
      setSelectedFutsal(data.selectedFutsal || null);
      setShowBooking(data.showBooking || false);
    }
  }, []);

  // Save dashboard state to sessionStorage
  useEffect(() => {
    const state = { selectedFutsal, showBooking };
    sessionStorage.setItem('dashboardState', JSON.stringify(state));
  }, [selectedFutsal, showBooking]);

  // Fetch special prices for all futsals
  useEffect(() => {
    const fetchSpecialPrices = async () => {
      const prices: {[key: number]: any[]} = {};
      for (const futsal of futsals) {
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/special-prices/${futsal.futsal_id}`);
          if (response.ok) {
            const data = await response.json();
            prices[futsal.futsal_id] = data.specialPrices || [];
          }
        } catch (error) {
          console.error('Error fetching special prices for futsal', futsal.futsal_id, error);
        }
      }
      setFutsalSpecialPrices(prices);
    };

    if (futsals.length > 0) {
      fetchSpecialPrices();
    }
  }, [futsals]);

  // Prevent background scrolling when modals are open
  useEffect(() => {
    const hasModalOpen = detailsModal.isOpen || videoModal.isOpen || ratingModal.isOpen || locationModal.isOpen ||
      confirmModal.isOpen || successModal.isOpen || selectedFutsal || updatingBooking;

    if (hasModalOpen) {
      scrollPositionRef.current = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollPositionRef.current}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.overflow = '';
      window.scrollTo(0, scrollPositionRef.current);
    }

    return () => {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.overflow = '';
    };
  }, [detailsModal.isOpen, videoModal.isOpen, ratingModal.isOpen, confirmModal.isOpen, successModal.isOpen, selectedFutsal, updatingBooking]);

  // Process bookings data with local cancelled bookings
  const processedBookings: Booking[] = bookingsData?.bookings ? (() => {

    let mergedBookings: Booking[] = [...(bookingsData.bookings as Booking[])];
    let updatedCancelledList = [...cancelledBookings];

    mergedBookings = mergedBookings.map(booking => {
      const isInCancelledList = cancelledBookings.some(c => c.booking_id === booking.booking_id);
      if (booking.cancelled_by) {
        if (!isInCancelledList) {
          updatedCancelledList.push(booking);
        }
        return booking;
      } else if (isInCancelledList) {

        return { ...booking, cancelled_by: 'registered user' };
      }
      return booking;
    });

    // Do not add cancelled bookings that are not in server data to prevent showing deleted bookings


    if (updatedCancelledList.length > cancelledBookings.length) {
      setCancelledBookings(updatedCancelledList);
      sessionStorage.setItem('user_cancelled_bookings', JSON.stringify(updatedCancelledList));
    }

    return mergedBookings;
  })() : [];

  const canUpdateBooking = (bookingDate: string, timeSlot: string) => {
    const bookingDateTime = new Date(`${bookingDate} ${timeSlot.split('-')[0]}`);
    const now = new Date();
    const diffHours = (bookingDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    return diffHours > 2;
  };

  const handleCancelBooking = async (bookingId: number, isExpired: boolean = false) => {
    setConfirmModal({
      isOpen: true,
      message: isExpired ? 'Are you sure you want to delete this expired booking?' : 'Are you sure you want to cancel this booking?',
      onConfirm: async () => {
        setConfirmModal({ isOpen: false, message: '', onConfirm: () => { } });

        try {
          await cancelBookingMutation.mutateAsync({ bookingId, userId: user!.user_id });

          // Find the booking and mark as cancelled locally
          const bookingToCancel = processedBookings.find(b => b.booking_id === bookingId);
          if (bookingToCancel) {
            const cancelledBooking = { ...bookingToCancel, cancelled_by: 'registered user' };
            const updatedCancelled = [...cancelledBookings, cancelledBooking];
            setCancelledBookings(updatedCancelled);
            sessionStorage.setItem('user_cancelled_bookings', JSON.stringify(updatedCancelled));
          }

          showNotification({ message: isExpired ? "Booking deleted successfully!" : "Booking cancelled successfully!", type: 'success' });
        } catch (error) {
          console.error('Error cancelling booking:', error);
          showNotification({ message: isExpired ? "Error deleting booking" : "Error cancelling booking", type: 'info' });
        }
      }
    });
  };

  const handleDeleteBooking = async (bookingId: number) => {
    setConfirmModal({
      isOpen: true,
      message: 'Are you sure you want to delete this booking?',
      onConfirm: async () => {
        setConfirmModal({ isOpen: false, message: '', onConfirm: () => { } });

        const updatedDeleted = [...deletedBookings, bookingId];
        setDeletedBookings(updatedDeleted);
        sessionStorage.setItem('user_deleted_bookings', JSON.stringify(updatedDeleted));

        const updatedCancelled = cancelledBookings.filter(b => b.booking_id !== bookingId);
        setCancelledBookings(updatedCancelled);
        sessionStorage.setItem('user_cancelled_bookings', JSON.stringify(updatedCancelled));

        showNotification({ message: 'Booking deleted successfully!', type: 'success' });
      }
    });
  };

  const handleDeleteSelectedBookings = async () => {
    if (selectedBookings.length === 0) {
      showNotification({ message: 'No bookings selected', type: 'info' });
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
      message: filterMessages[filterState.bookingFilter],
      onConfirm: async () => {
        setConfirmModal({ isOpen: false, message: '', onConfirm: () => { } });

        // Hide selected bookings from dashboard permanently (sessionStorage)
        const updatedDeleted = [...deletedBookings, ...selectedBookings];
        setDeletedBookings(updatedDeleted);
        sessionStorage.setItem('user_deleted_bookings', JSON.stringify(updatedDeleted));

        showNotification({ message: `${selectedBookings.length} booking${selectedBookings.length > 1 ? 's' : ''} deleted `, type: 'success' });

        // Clear selection
        setSelectedBookings([]);
        setSelectAll(false);
        setShowCheckboxes(false);
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

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const visibleBookings = processedBookings
        .filter((b: Booking) => !deletedBookings.includes(b.booking_id))
        .filter((booking: Booking) => {
          if (filterState.bookingFilter === 'all') return true;
          if (filterState.bookingFilter === 'cancelled') return booking.cancelled_by;
          const category = categorizeBooking(booking);
          return category === filterState.bookingFilter;
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

  const handleUpdateBooking = (booking: Booking) => {
    if ((booking.update_count || 0) >= 2) {
      setConfirmModal({
        isOpen: true,
        message: 'You have reached the maximum update limit of 2 times for this booking.',
        onConfirm: () => setConfirmModal({ isOpen: false, message: '', onConfirm: () => { } })
      });
      return;
    }

    setConfirmModal({
      isOpen: true,
      message: 'You will only be allowed to update this booking 2 times. Do you want to proceed?',
      onConfirm: () => {
        setConfirmModal({ isOpen: false, message: '', onConfirm: () => { } });
        setUpdatingBooking(booking);
      }
    });
  };

  const handleLogout = () => {
    setConfirmModal({
      isOpen: true,
      message: 'Are you sure you want to logout?',
      onConfirm: () => {
        setConfirmModal({ isOpen: false, message: '', onConfirm: () => { } });
        const { logout } = useAuthStore.getState();
        logout();
        sessionStorage.removeItem('dashboardState');
        sessionStorage.removeItem('userBookingProgress');
        router.push('/user/login');
      }
    });
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // radius of Earth in km

    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) *
      Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // distance in km
  };

  const handleCheckLocation = (futsal: Futsal) => {
    if (!futsal.latitude || !futsal.longitude) {
      showNotification({ message: "Location information not available for this futsal.", type: 'info' });
      return;
    }

    if (!navigator.geolocation) {
      showNotification({ message: "Geolocation is not supported by this browser.", type: 'info' });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLat = position.coords.latitude;
        const userLon = position.coords.longitude;

        const distance = calculateDistance(
          userLat,
          userLon,
          futsal.latitude!,
          futsal.longitude!
        );

        setLocationModal({ isOpen: true, futsal, distance });
      },
      (error) => {
        console.error('Error getting location:', error);
        let errorMessage = ' ';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage += 'Please allow location access to check distance.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage += 'Location information is unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage += 'Location request timed out.';
            break;
          default:
            errorMessage += 'An unknown error occurred.';
            break;
        }
        showNotification({ message: errorMessage, type: 'info' });
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  };

  const handlePrevImage = (futsalId: number, images: string[]) => {
    setCurrentImageIndexes(prev => ({
      ...prev,
      [futsalId]: prev[futsalId] > 0 ? prev[futsalId] - 1 : images.length - 1
    }));
  };

  const handleNextImage = (futsalId: number, images: string[]) => {
    setCurrentImageIndexes(prev => ({
      ...prev,
      [futsalId]: prev[futsalId] < images.length - 1 ? prev[futsalId] + 1 : 0
    }));
  };

  const handleSeeVideo = (futsal: Futsal) => {
    setVideoModal({ isOpen: true, futsal });
  };


  const closeVideoModal = () => {
    setVideoModal({ isOpen: false, futsal: null });
  };

  const handleDescRating = (futsal: Futsal) => {
    setRatingModal({ isOpen: true, futsal });
  };
  const handleDetailsModal = (futsal: Futsal) => {
    setDetailsModal({ isOpen: true, futsal });
  };

  const closeDetailsModal = () => {
    setDetailsModal({ isOpen: false, futsal: null });
  };

  const closeRatingModal = () => {
    setRatingModal({ isOpen: false, futsal: null });
  };

  const formatTime = (timeString: string): string => {
    const [hours, minutes] = timeString.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  const formatTimeSlot = (timeString: string): string => {
    return formatTime(timeString);
  };

  const formatTimeRange = (opening: string, closing: string): string => {
    return `${formatTime(opening)} – ${formatTime(closing)}`;
  };

  const formatBookingTimeRange = (timeRange: string): string => {
    const [startTime, endTime] = timeRange.split('-');
    return `${formatTimeSlot(startTime)}-${formatTimeSlot(endTime)}`;
  };

  const fetchBookings = async (userId: number) => {
    // Implementation would go here
  };

  const fetchFutsals = async () => {
    // Implementation would go here
  };

  // Filter and sort futsals using reducer state
  const filteredFutsals = futsals
    .filter((futsal: Futsal) => {
      const matchesSearch = !filterState.searchQuery ||
        futsal.name.toLowerCase().includes(filterState.searchQuery.toLowerCase()) ||
        futsal.city.toLowerCase().includes(filterState.searchQuery.toLowerCase()) ||
        futsal.location.toLowerCase().includes(filterState.searchQuery.toLowerCase());
      const matchesName = !filterState.selectedName || futsal.name === filterState.selectedName;
      const matchesCity = !filterState.selectedCity || futsal.city === filterState.selectedCity;
      const matchesLocation = !filterState.selectedLocation || futsal.location === filterState.selectedLocation;
      return matchesSearch && matchesName && matchesCity && matchesLocation;
    })
    .sort((a: Futsal, b: Futsal) => {
      if (filterState.sortByRating === 'highest') {
        return (b.average_rating || 0) - (a.average_rating || 0);
      }
      if (filterState.sortByRating === 'lowest') {
        return (a.average_rating || 0) - (b.average_rating || 0);
      }
      if (filterState.sortByPrice === 'low-to-high') {
        return a.price_per_hour - b.price_per_hour;
      }
      if (filterState.sortByPrice === 'high-to-low') {
        return b.price_per_hour - a.price_per_hour;
      }
      return 0;
    });

  // Get unique options for dropdowns
  const uniqueNames = [...new Set(futsals.map((f: Futsal) => f.name.trim()))] as string[];
  const uniqueCities = [...new Set(futsals.map((f: Futsal) => f.city.trim()))] as string[];
  const uniqueLocations = [...new Set(futsals.map((f: Futsal) => f.location.trim()))] as string[];

  // Calculate booking counts
  const visibleBookings = processedBookings.filter(b => !deletedBookings.includes(b.booking_id));
  const allCount = visibleBookings.length;
  const pastCount = visibleBookings.filter(b => categorizeBooking(b) === 'past').length;
  const todayCount = visibleBookings.filter(b => categorizeBooking(b) === 'today').length;
  const futureCount = visibleBookings.filter(b => categorizeBooking(b) === 'future').length;
  const cancelledCount = visibleBookings.filter(b => b.cancelled_by).length;


  return (
    <div className="min-h-screen bg-linear-to-br from-green-50 via-white to-blue-50">
      <header className="bg-linear-to-r from-gray-900 via-green-900 to-blue-900 backdrop-blur-md shadow-2xl border-b border-green-500/20">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-white drop-shadow-lg">Hi {user?.first_name || ''} {user?.last_name || ''}</h1>
          <button
            onClick={handleLogout}
            className="bg-transparent sm:bg-linear-to-r sm:from-red-600 sm:to-red-700 text-white font-bold py-0 px-0 sm:py-2 sm:px-4 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 border-transparent sm:border-red-500/30 hover:border-transparent sm:hover:border-red-400/50"
          >
            <svg className="w-6 h-6 mr-0 sm:mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-1 py-6 sm:px-0">
          <div className="space-y-6">
            {/* User Info */}
            <div className="bg-white rounded-lg p-2">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-semibold bg-linear-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">My Information</h2>
                <button
                  onClick={() => setEditing(!editing)}
                  className="bg-linear-to-r from-green-600 to-green-700 text-white font-bold py-2 px-4 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 border border-green-500/30 hover:border-green-400/50"
                >
                  {editing ? 'Cancel' : 'Edit Info'}
                </button>
              </div>
              {editing && user ? (
                <EditUserForm user={user} onUpdate={(updatedUser) => {
                  // Update auth store
                  const { setUser } = useAuthStore.getState();
                  setUser(updatedUser);
                  setEditing(false);
                }} onCancel={() => setEditing(false)} showNotification={showNotification} />
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <p><strong>First Name:</strong> {user?.first_name || ''}</p>
                  <p><strong>Last Name:</strong> {user?.last_name || ''}</p>
                  <p><strong>Username:</strong> {user?.username || ''}</p>
                  <p><strong>Phone:</strong> {user?.phone || ''}</p>
                  <p className="col-span-2">
                    <strong>Email:</strong> {user?.email || ''}
                  </p>
                </div>

              )}
            </div>

            {/* Bookings or Book Futsal */}
            <div className="p-2">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-semibold bg-linear-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">My Bookings</h2>
                <button
                  onClick={() => setShowBooking(!showBooking)}
                  className="bg-linear-to-r from-green-600 to-green-700 text-white font-bold py-2 px-4 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 border border-green-500/30 hover:border-green-400/50"
                >
                  {showBooking ? 'Hide' : 'Book Futsal'}
                </button>
              </div>

              {showBooking ? (
                <div className="space-y-6">
                  <h4 className="text-2xl font-semibold text-gray-900 text-center">Available Futsals</h4>

                  {/* Filter Toggle Button */}
                  <div className="mb-6 text-left">
                    <button
                      onClick={() => dispatch({ type: 'SET_SHOW_FILTERS', payload: !filterState.showFilters })}
                      className="bg-linear-to-r from-green-500 to-green-600 text-white font-semibold py-2 px-4 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 text-sm"
                    >
                      {filterState.showFilters ? '🔽 Hide Filters' : '🔍 Show Filters'}
                    </button>
                    {filterState.showFilters && (
                      <button
                        onClick={() => dispatch({ type: 'CLEAR_FILTERS' })}
                        className="ml-4 bg-linear-to-r from-red-500 to-red-600 text-white font-semibold py-2 px-4 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 text-sm"
                      >
                        🗑️ Clear Filters
                      </button>
                    )}
                  </div>

                  {/* Filters */}
                  {filterState.showFilters && (
                    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 ">
                      <h3 className="text-xl font-bold mb-6 bg-linear-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">Filter & Search Futsals</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                        {/* Search Bar */}
                        <div className="lg:col-span-2">
                          <label className="block text-sm font-semibold text-gray-800 mb-2">🔍 Search</label>
                          <input
                            type="text"
                            placeholder="Search by name, city, or location..."
                            value={filterState.searchQuery}
                            onChange={(e) => dispatch({ type: 'SET_SEARCH_QUERY', payload: e.target.value })}
                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400/50 focus:border-green-400/50 transition-all text-sm"
                          />
                        </div>

                        {/* Name Filter */}
                        <div>
                          <label className="block text-sm font-semibold text-gray-800 mb-2">🏟️ Futsal Name</label>
                          <select
                            value={filterState.selectedName}
                            onChange={(e) => dispatch({ type: 'SET_SELECTED_NAME', payload: e.target.value })}
                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-400/50 focus:border-green-400/50 transition-all text-sm"
                          >
                            <option value="">All Names</option>
                            {uniqueNames.map((name: string) => (
                              <option key={name} value={name}>{name}</option>
                            ))}
                          </select>
                        </div>

                        {/* City Filter */}
                        <div>
                          <label className="block text-sm font-semibold text-gray-800 mb-2">🏙️ City</label>
                          <select
                            value={filterState.selectedCity}
                            onChange={(e) => dispatch({ type: 'SET_SELECTED_CITY', payload: e.target.value })}
                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-400/50 focus:border-green-400/50 transition-all text-sm"
                          >
                            <option value="">All Cities</option>
                            {uniqueCities.map((city: string) => (
                              <option key={city} value={city}>{city}</option>
                            ))}
                          </select>
                        </div>

                        {/* Location Filter */}
                        <div>
                          <label className="block text-sm font-semibold text-gray-800 mb-2">📍 Location</label>
                          <select
                            value={filterState.selectedLocation}
                            onChange={(e) => dispatch({ type: 'SET_SELECTED_LOCATION', payload: e.target.value })}
                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-400/50 focus:border-green-400/50 transition-all text-sm"
                          >
                            <option value="">All Locations</option>
                            {uniqueLocations.map((location: string) => (
                              <option key={location} value={location}>{location}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Sort Options */}
                      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-semibold text-gray-800 mb-2">⭐ Sort by Rating</label>
                          <select
                            value={filterState.sortByRating}
                            onChange={(e) => dispatch({ type: 'SET_SORT_BY_RATING', payload: e.target.value as 'none' | 'highest' | 'lowest' })}
                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-400/50 focus:border-green-400/50 transition-all text-sm"
                          >
                            <option value="none">No Rating Sort</option>
                            <option value="highest">Highest Rating</option>
                            <option value="lowest">Lowest Rating</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-800 mb-2">💰 Sort by Price</label>
                          <select
                            value={filterState.sortByPrice}
                            onChange={(e) => dispatch({ type: 'SET_SORT_BY_PRICE', payload: e.target.value as 'none' | 'low-to-high' | 'high-to-low' })}
                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-400/50 focus:border-green-400/50 transition-all text-sm"
                          >
                            <option value="none">No Price Sort</option>
                            <option value="low-to-high">Low to High</option>
                            <option value="high-to-low">High to Low</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredFutsals.slice(0, showAllFutsals ? filteredFutsals.length : 6).map((futsal: Futsal, index: number) => {
                       const currentImageIndex = currentImageIndexes[futsal.futsal_id] || 0;
                       const images = futsal.images || [];
                       const currentImage = images[currentImageIndex];
                       const hasSpecialOffer = futsalSpecialPrices[futsal.futsal_id]?.some(sp => sp.is_offer) || false;

                      return (
                        <div
                          key={futsal.futsal_id}
                          className="bg-white rounded-2xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-500 border border-gray-100 overflow-hidden"
                          style={{ animationDelay: `${index * 100}ms` }}
                        >
                          {/* Image Carousel */}
                          <div className="relative h-56 overflow-hidden group">
                            {currentImage && (
                              <img
                                src={`${process.env.NEXT_PUBLIC_API_URL}/uploads/${currentImage}`}
                                alt={futsal.name}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                              />
                            )}
                            <div className="absolute inset-0 bg-linear-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  
                            {hasSpecialOffer && (
                              <div className="absolute top-4 left-4 bg-red-600 text-white px-3 py-1 rounded-lg font-bold text-sm animate-bounce">
                                SPECIAL OFFER
                              </div>
                            )}
                  
                            {/* Navigation Arrows */}
                            {images.length > 1 && (
                              <>
                                <button
                                  onClick={() => handlePrevImage(futsal.futsal_id, images)}
                                  className="absolute left-3 top-1/2 transform -translate-y-1/2 bg-white/20 backdrop-blur-md text-white p-0.5 sm:p-1 rounded-lg hover:bg-white/30 transition-all duration-300 opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                                >
                                  <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => handleNextImage(futsal.futsal_id, images)}
                                  className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-white/20 backdrop-blur-md text-white p-0.5 sm:p-1 rounded-lg hover:bg-white/30 transition-all duration-300 opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                                >
                                  <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                  </svg>
                                </button>
                              </>
                            )}

                            {/* Image Indicators */}
                            {images.length > 1 && (
                              <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex space-x-2">
                                {images.map((_: string, idx: number) => (
                                  <button
                                    key={idx}
                                    onClick={() => setCurrentImageIndexes(prev => ({ ...prev, [futsal.futsal_id]: idx }))}
                                    className={`w-2 h-2 rounded-lg transition-all duration-300 ${idx === currentImageIndex ? 'bg-white' : 'bg-white/50'
                                      }`}
                                  />
                                ))}
                              </div>
                            )}
                          </div>

                          <div className="p-4 md:p-6">
                            <div className="flex justify-between items-start mb-2">
                              <h3 className="text-xl font-bold text-gray-800">{futsal.name}</h3>
                              {futsal.game_format && (
                                <span className="text-sm font-semibold bg-blue-100 text-blue-800 px-2 py-1 rounded-lg">
                                  {futsal.game_format}
                                </span>
                              )}
                            </div>
                            <p className="text-gray-600 mb-3 flex items-center">
                              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                              </svg>
                              {futsal.location}, {futsal.city}
                            </p>
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-2xl font-bold text-green-600">
                                Rs. {futsal.price_per_hour}
                                <span className="ml-1 text-xl font-medium">/hr</span>
                              </span>
                              <p className="text-sm  text-green-700 bg-green-50 px-1.5 rounded-full">Normal Days Price</p>
                            </div>
                            {/* <p className="text-sm text-gray-600">Normal Days Price</p> */}
                            {futsal.opening_hours && futsal.closing_hours && (
                              <p className="text-sm text-gray-600 mb-2 flex items-center">
                                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                </svg>
                                Hours: {formatTimeRange(futsal.opening_hours, futsal.closing_hours)}
                              </p>
                            )}
                            {futsal.admin_phone && (
                              <p className="text-sm text-gray-600 mb-2 flex items-center">
                                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                                </svg>
                                {futsal.admin_phone}
                              </p>
                            )}
                            {futsal.average_rating !== undefined && futsal.average_rating !== null && futsal.total_ratings !== undefined && futsal.total_ratings > 0 && (
                              <div className="flex items-center mb-3">
                                <div className="flex">
                                  {[...Array(5)].map((_, i) => (
                                    <svg key={i} className={`w-4 h-4 ${i < Math.floor(Number(futsal.average_rating)) ? 'text-yellow-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
                                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                    </svg>
                                  ))}
                                </div>
                                <span className="text-sm text-gray-600 ml-1">
                                  {Number(futsal.average_rating).toFixed(1)} ({futsal.total_ratings} ratings)
                                </span>
                              </div>
                            )}
                            {futsal.facilities && futsal.facilities.length > 0 && (
                              <div className="mb-3">
                                <div className="flex flex-wrap gap-1 mb-5">
                                  {futsal.facilities.slice(0, 3).map((facility: string, index: number) => (
                                    <span key={index} className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-lg">
                                      {facility}
                                    </span>
                                  ))}
                                  {futsal.facilities.length > 3 && (
                                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-lg ">
                                      +{futsal.facilities.length - 3} more
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}
                            <div className="flex flex-wrap gap-1">
                              <button
                                onClick={() => setSelectedFutsal(futsal)}
                                className="flex-1 bg-linear-to-r from-green-500 to-green-600 text-white font-semibold py-2 px-3 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 text-center text-sm"
                              >
                                Book Now
                              </button>
                              <button
                                onClick={() => handleCheckLocation(futsal)}
                                className="flex-1 bg-white border-2 border-gray-200 text-gray-700 font-semibold py-2 px-3 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all duration-300 text-sm"
                              >
                                Location
                              </button>
                              <button
                                onClick={() => handleDetailsModal(futsal)}
                                className={`bg-white border-2 border-gray-200 text-gray-700 p-2 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all duration-300 relative ${hasSpecialOffer ? 'ring-2 ring-red-500 ring-opacity-75 animate-pulse' : ''}`}
                                title="Details"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {futsalSpecialPrices[futsal.futsal_id]?.some(sp => sp.is_offer) && (
                                  <span className="absolute -top-7 left-1/2 transform -translate-x-1/2 text-[15px] text-red-600 font-bold animate-pulse rounded pointer-events-none whitespace-nowrap">
                                    special offer
                                  </span>
                                )}
                              </button>
                              {futsal.video && (
                                <button
                                  onClick={() => handleSeeVideo(futsal)}
                                  className="bg-white border-2 border-gray-200 text-gray-700 p-2 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all duration-300"
                                  title="Video"
                                >
                                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M8 5v14l11-7z" />
                                  </svg>
                                </button>
                              )}
                              <button
                                onClick={() => handleDescRating(futsal)}
                                className="bg-white border-2 border-gray-200 text-gray-700 p-2 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all duration-300"
                                title="Rating"
                              >
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {filteredFutsals.length > 6 && (
                    <div className="text-center mt-8">
                      <button
                        onClick={() => setShowAllFutsals(!showAllFutsals)}
                        className="bg-linear-to-r from-green-500 to-green-600 text-white font-semibold py-3 px-8 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                      >

                        {showAllFutsals ? 'Show Less Futsals' : `Show All Futsals (${filteredFutsals.length})`}
                      </button>
                    </div>
                  )}
                </div>
              ) : processedBookings.length > 0 ? (
                <>
                  {/* Filter Buttons */}
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-2 mb-4">
                      {[
                        { key: 'all', label: 'All Bookings', icon: '📋', count: allCount },
                        { key: 'past', label: 'Past Bookings', icon: '⏰', count: pastCount },
                        { key: 'today', label: 'Today Bookings', icon: '📅', count: todayCount },
                        { key: 'future', label: 'Future Bookings', icon: '🔮', count: futureCount },
                        { key: 'cancelled', label: 'Cancelled Bookings', icon: '❌', count: cancelledCount }
                      ].map((filter) => (
                        <button
                          key={filter.key}
                          onClick={() => {
                            dispatch({ type: 'SET_BOOKING_FILTER', payload: filter.key as 'all' | 'past' | 'today' | 'future' | 'cancelled' });
                            setSelectedBookings([]);
                            setSelectAll(false);
                            setShowCheckboxes(false);
                          }}
                          className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 flex items-center gap-2 ${filterState.bookingFilter === filter.key
                            ? 'bg-linear-to-r from-green-500 to-green-600 text-white shadow-lg'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                          <span>{filter.icon}</span>
                          <span className="hidden sm:inline">{filter.label} ({filter.count})</span>
                          <span className="sm:hidden">{filter.label.split(' ')[0]} ({filter.count})</span>
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
                  {/* Booking List */}
                  <div className="space-y-4">
                    {processedBookings
                      .filter((booking) => !deletedBookings.includes(booking.booking_id))
                      .filter((booking) => {
                        if (filterState.bookingFilter === 'all') return true;
                        if (filterState.bookingFilter === 'cancelled') return booking.cancelled_by;
                        const category = categorizeBooking(booking);
                        return category === filterState.bookingFilter;
                      })
                      .map((booking) => {
                        const category = categorizeBooking(booking);
                        const isPastBooking = category === 'past';
                        const startTimeReached = (() => {
                          const [startTime] = booking.time_slot.split('-');
                          const [hours, minutes] = startTime.split(':').map(Number);
                          const bookingDateTime = new Date(booking.booking_date);
                          bookingDateTime.setHours(hours, minutes, 0, 0);
                          const now = new Date();
                          return now >= bookingDateTime;
                        })();
                        return (
                          <div key={booking.booking_id} className={`border rounded p-4 ${isPastBooking ? 'bg-gray-50 border-gray-300' : ''}`}>
                            <div className="flex justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  {showCheckboxes && (
                                    <input
                                      type="checkbox"
                                      checked={selectedBookings.includes(booking.booking_id)}
                                      onChange={(e) => handleSelectBooking(booking.booking_id, e.target.checked)}
                                      className="mr-3"
                                    />
                                  )}
                                  <p><strong>Futsal:</strong> {booking.futsal_name}</p>
                                </div>
                                <p><strong>Location:</strong> {booking.location}, {booking.city}</p>
                                <p><strong>Playing Date:</strong> {new Date(booking.booking_date).toLocaleDateString('en-CA')}</p>
                                <p><strong>Booked On:</strong> {booking.created_at.split('T')[0]}</p>
                                <p><strong>Time:</strong> {(() => {
                                  const [start, end] = booking.time_slot.split('-');
                                  const startHour = parseInt(start.split(':')[0]);
                                  const endHour = parseInt(end.split(':')[0]);
                                  const startDisplay = startHour === 0 ? 12 : startHour > 12 ? startHour - 12 : startHour;
                                  const endDisplay = endHour === 0 ? 12 : endHour > 12 ? endHour - 12 : endHour;
                                  const startPeriod = startHour >= 12 ? 'PM' : 'AM';
                                  const endPeriod = endHour >= 12 ? 'PM' : 'AM';
                                  return `${startDisplay}${startPeriod}-${endDisplay}${endPeriod}`;
                                })()}</p>
                                <p><strong>Players:</strong> {booking.number_of_players}</p>
                                {booking.team_name && <p><strong>Team:</strong> {booking.team_name}</p>}
                                <p><strong>Paid Amount:</strong> Rs. {booking.amount_paid}</p>
                                <p><strong>Total Amount:</strong> Rs. {booking.total_amount}</p>
                                {booking.cancelled_by && booking.cancelled_at && <p><strong>Cancelled on:</strong> {new Date(booking.cancelled_at).toLocaleDateString('en-CA')}, {new Date(booking.cancelled_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}</p>}
                              </div>
                              <div className="flex flex-col items-end space-y-2">
                                <p className="text-lg font-semibold">Rs. {booking.amount_paid}</p>

                                {isPastBooking && (
                                  <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium bg-red-100 text-red-800">
                                    ⏰ Expired
                                  </span>
                                )}

                                {booking.cancelled_by && (
                                  <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium bg-yellow-100 text-yellow-800">
                                    ❌ Cancelled by {booking.cancelled_by === 'registered user' ? 'You' : booking.cancelled_by.replace(/\b\w/g, (l: string) => l.toUpperCase())}
                                  </span>
                                )}

                                <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
                                  {!booking.cancelled_by && (
                                    <>
                                      <button
                                        onClick={() => handleUpdateBooking(booking)}
                                        disabled={startTimeReached || (booking.update_count || 0) >= 2}
                                        className={`px-2 py-1 rounded-lg text-xs sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 ${startTimeReached || (booking.update_count || 0) >= 2
                                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                          : 'bg-linear-to-r from-green-500 to-green-600 text-white'
                                          }`}
                                      >
                                        {(booking.update_count || 0) >= 2 ? 'Disabled' : 'Update'}
                                      </button>
                                      {isPastBooking ? (
                                        <button
                                          onClick={() => handleDeleteBooking(booking.booking_id)}
                                          className="px-2 py-1 rounded-lg text-xs sm:text-sm bg-linear-to-r from-orange-500 to-red-600 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                                        >
                                          Delete
                                        </button>
                                      ) : (
                                        <button
                                          onClick={() => handleCancelBooking(booking.booking_id, isPastBooking)}
                                          className="px-2 py-1 rounded-lg text-xs sm:text-sm bg-linear-to-r from-red-500 to-red-600 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                                        >
                                          Cancel
                                        </button>
                                      )}
                                    </>
                                  )}
                                  {booking.cancelled_by && (
                                    <button
                                      onClick={() => handleDeleteBooking(booking.booking_id)}
                                      className="px-2 py-1 rounded-lg text-xs sm:text-sm bg-linear-to-r from-red-500 to-red-600 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
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
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">No bookings yet. Click "Book Futsal" to get started!</p>
                </div>
              )}
            </div>

            {/* Details Modal */}
            {detailsModal.isOpen && detailsModal.futsal && (
              <DetailsModal
                futsal={detailsModal.futsal}
                onClose={closeDetailsModal}
              />
            )}


            {/* Booking Modal */}
            {selectedFutsal && (
              <BookingModal futsal={selectedFutsal} user={user} onClose={() => setSelectedFutsal(null)} onSuccess={() => {
                setSelectedFutsal(null);
                setShowBooking(false);
              }} setSuccessModal={setSuccessModal} setConfirmModal={setConfirmModal} setPriceNotification={setPriceNotification} showNotification={showNotification} />
            )}

            {/* Update Booking Modal */}
            {updatingBooking && (
              <UpdateBookingModal booking={updatingBooking} onClose={() => setUpdatingBooking(null)} onSuccess={() => {
                setUpdatingBooking(null);
              }} setSuccessModal={setSuccessModal} showNotification={showNotification} setPriceNotification={setPriceNotification} />
            )}
          </div>
        </div>
      </main>

      {/* Video Modal */}
      {videoModal.isOpen && videoModal.futsal && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/20 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-semibold">{videoModal.futsal.name} - Video</h3>
              <button
                onClick={closeVideoModal}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            <div className="p-4">
              <video
                controls
                className="w-full h-auto max-h-[70vh] rounded"
                src={`${process.env.NEXT_PUBLIC_API_URL}/uploads/${videoModal.futsal.video}`}
              >
                Your browser does not support the video tag.
              </video>
            </div>
          </div>
        </div>
      )}

      {/* Rating Modal */}
      {ratingModal.isOpen && ratingModal.futsal && (
        <RatingModal
          futsal={ratingModal.futsal}
          onClose={closeRatingModal}
          onRatingSubmitted={() => {
            // Refresh futsals to update ratings
            fetchFutsals();
          }}
          showNotification={showNotification}
          setConfirmModal={setConfirmModal}
        />
      )}

      {/* Location Modal */}
      {locationModal.isOpen && locationModal.futsal && locationModal.distance !== undefined && (
        <LocationModal
          futsal={locationModal.futsal}
          distance={locationModal.distance}
          onClose={() => setLocationModal({ isOpen: false, futsal: null })}
          showNotification={showNotification}
        />
      )}

      {/* Confirmation Modal */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/20 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4 text-center shadow-2xl">
            <p className="text-gray-800 mb-6 text-sm">{confirmModal.message}</p>
            <div className="flex space-x-3 justify-center">
              <button
                onClick={() => setConfirmModal({ isOpen: false, message: '', onConfirm: () => { } })}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors duration-200 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={confirmModal.onConfirm}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-200 text-sm"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {successModal.isOpen && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/20 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4 text-center shadow-2xl">
            <div className="text-green-500 mb-4">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-gray-800 mb-6 text-sm font-medium">{successModal.message}</p>
            <button
              onClick={() => setSuccessModal({ isOpen: false, message: '' })}
              className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors duration-200 text-sm"
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* Notification Component */}
      <Notification />

      <PriceNotificationModal
        priceNotification={priceNotification}
        setPriceNotification={setPriceNotification}
      />
    </div>
  );
}

// Details Modal Component
function DetailsModal({ futsal, onClose }: { futsal: Futsal, onClose: () => void }) {
  const { data: specialPrices = [], isLoading: loadingSpecialPrices } = useSpecialPrices(futsal.futsal_id);

  const formatTime = (timeString: string): string => {
    const [hours, minutes] = timeString.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    return `${displayHours}${period}`;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-black/20 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-4 md:p-6">
          <div className="flex justify-between items-start mb-6">
            <h3 className="text-2xl font-bold text-gray-800">{futsal.name}</h3>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-3xl hover:bg-gray-100 rounded-lg w-10 h-10 flex items-center justify-center transition-all duration-300"
            >
              ×
            </button>
          </div>

          <div className="space-y-6">
            {/* Images */}
            {futsal.images && futsal.images.length > 0 && (
              <div>
                <h4 className="text-lg font-semibold mb-3">Images</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {futsal.images.map((img, index) => (
                    <img key={index} src={`${process.env.NEXT_PUBLIC_API_URL}/uploads/${img}`} alt={`${futsal.name} ${index + 1}`} className="w-full h-48 object-cover rounded-lg" />
                  ))}
                </div>
              </div>
            )}

            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-lg font-semibold mb-3">Basic Information</h4>
                <div className="space-y-2">
                  <p><strong>Name:</strong> {futsal.name}</p>
                  <p><strong>Location:</strong> {futsal.location}, {futsal.city}</p>
                  {futsal.game_format && <p><strong>Game Format:</strong> {futsal.game_format}</p>}
                  {futsal.opening_hours && futsal.closing_hours && (
                    <p><strong>Operating Hours:</strong> {formatTime(futsal.opening_hours)} - {formatTime(futsal.closing_hours)}</p>
                  )}
                  {futsal.admin_phone && <p><strong>Contact:</strong> {futsal.admin_phone}</p>}
                </div>
              </div>

              {/* Price Section */}
              {/* <div>
                <h4 className="text-lg font-semibold mb-3">Pricing</h4>
                <div className="space-y-3">
                  <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                    <p className="text-green-800 font-medium">Normal Days Price</p>
                    <p className="text-2xl font-bold text-green-600">Rs. {futsal.price_per_hour}/hr</p>
                  </div>
                  {loadingSpecialPrices ? (
                    <p className="text-gray-500">Loading special prices...</p>
                  ) : specialPrices.length > 0 ? (
                    <div className="space-y-2">
                      <p className="font-medium text-gray-700">Special Prices:</p>
                      {specialPrices.filter((sp: any) => sp.type === 'date').map((sp: any) => (
                        <div key={sp.special_price_id} className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                          <p className="text-yellow-800 font-medium">{formatDate(sp.special_date)}</p>
                          <p className="text-xl font-bold text-yellow-600">Rs. {sp.special_price}/hr</p>
                          {sp.message && <p className="text-sm text-yellow-700 mt-1">{sp.message}</p>}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">No special prices set</p>
                  )}
                </div>
              </div> */}
              <div>
                <h4 className="text-lg font-semibold mb-3">Pricing</h4>

                <div className="space-y-3">
                  {/* Normal Price */}
                  <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                    <p className="text-green-800 font-semibold">Normal Days Price</p>
                    <p className="text-2xl font-bold text-green-600">
                      Rs. {futsal.price_per_hour}
                      <span className="ml-1 text-xl font-medium">/hr</span>
                    </p>
                  </div>

                  {/* Special Prices */}
                  {loadingSpecialPrices ? (
                    <p className="text-gray-500">Loading special prices...</p>
                  ) : specialPrices.length > 0 ? (
                    <div className="space-y-2">
                      <p className="font-semibold text-gray-700">Special Prices:</p>

                      {specialPrices.map((sp: any) => {
                        let details = '';
                        if (sp.type === 'date' && sp.special_date) {
                          const date = new Date(sp.special_date);
                          details = date.toISOString().split('T')[0];
                        } else if (sp.type === 'recurring' && sp.recurring_days) {
                          const days = Array.isArray(sp.recurring_days)
                            ? sp.recurring_days
                            : JSON.parse(sp.recurring_days);

                          const dayList = days.map((day: string) => day.toLowerCase()).join(', ');
                          details = `Every : ${dayList}`;
                        } else if (sp.type === 'time_based') {
                          if (sp.special_date) {
                            const date = new Date(sp.special_date);
                            const dateStr = date.toISOString().split('T')[0];
                            details = `${formatTime(sp.start_time)} - ${formatTime(sp.end_time)} on ${dateStr}`;
                          } else {
                            details = `Every day : ${formatTime(sp.start_time)} - ${formatTime(sp.end_time)}`;
                          }
                        }
                        return (
                          <div
                            key={sp.special_price_id}
                            className="bg-yellow-50 p-3 rounded-lg border border-yellow-200"
                          >
                            <p className="text-xl font-bold text-yellow-600">
                              Rs. {sp.special_price}
                              <span className="ml-1 text-lg font-medium">/hr</span>
                              {sp.is_offer && <span className="ml-2 text-red-600 font-bold animate-pulse">special offer</span>}
                              <span className="text-sm text-yellow-700"> ({details})</span>
                            </p>

                            {sp.message && (
                              <p className="text-sm text-yellow-700 mt-1">
                                {sp.message}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-gray-500">No special prices set</p>
                  )}
                </div>
              </div>
            </div>

            {/* Facilities */}
            <div>
              <h4 className="text-lg font-semibold mb-3">Facilities</h4>
              {futsal.facilities && futsal.facilities.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {futsal.facilities.map((facility, index) => (
                    <span key={index} className="bg-green-100 text-green-800 px-3 py-1 rounded-lg text-sm">
                      {facility}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No facilities information available</p>
              )}
            </div>
          </div>

          {/* Description */}
          {futsal.description && (
            <div>
              <h4 className="text-lg font-semibold mb-3">Description</h4>
              <p className="text-gray-700 leading-relaxed">{futsal.description}</p>
            </div>
          )}

          {/* Video */}
          {futsal.video && (
            <div>
              <h4 className="text-lg font-semibold mb-3">Video</h4>
              <video controls className="w-full max-w-2xl rounded-lg">
                <source src={`${process.env.NEXT_PUBLIC_API_URL}/uploads/${futsal.video}`} type="video/mp4" />
              </video>
            </div>
          )}

          {/* Rating */}
          {futsal.average_rating !== undefined && futsal.average_rating !== null && futsal.total_ratings !== undefined && futsal.total_ratings > 0 && (
            <div>
              <h4 className="text-lg font-semibold mb-3">Rating</h4>
              <div className="flex items-center">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className={`w-5 h-5 ${i < Math.floor(futsal.average_rating!) ? 'text-yellow-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <span className="ml-2 text-lg font-medium">
                  {futsal.average_rating ? Number(futsal.average_rating).toFixed(1) : '0.0'} ({futsal.total_ratings || 0} reviews)
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end mt-8">
          <button
            onClick={onClose}
            className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-all duration-300"
          >
            Close
          </button>
        </div>
      </div>
    </div>

  );
}

// Rating Modal Component
function RatingModal({ futsal, onClose, onRatingSubmitted, showNotification, setConfirmModal }: { futsal: Futsal, onClose: () => void, onRatingSubmitted: () => void, showNotification: (notification: { message: string, type: 'success' | 'info' }) => void, setConfirmModal: (modal: { isOpen: boolean, message: string, onConfirm: () => void }) => void }) {
  const [ratings, setRatings] = useState<any[]>([]);
  const [userRating, setUserRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasRated, setHasRated] = useState<boolean | null>(null);
  const [userName, setUserName] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [userExistingRating, setUserExistingRating] = useState<any | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const formatTimeSlot = (timeString: string): string => {
    const [hours, minutes] = timeString.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  useEffect(() => {
    // Fetch existing ratings
    fetchRatings();

    // Check if user has already rated
    checkUserRating();
  }, [futsal.futsal_id]);

  const fetchRatings = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/ratings/futsal/${futsal.futsal_id}`);
      if (response.ok) {
        const data = await response.json();
        setRatings(data);
      }
    } catch (error) {
      console.error('Error fetching ratings:', error);
    }
  };

  const checkUserRating = async () => {
    try {
      const user = sessionStorage.getItem('user');
      const userData = user ? JSON.parse(user) : null;

      if (userData) {
        // Registered user - check if they have rated this futsal
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/ratings/futsal/${futsal.futsal_id}`);
        if (response.ok) {
          const futsalRatings = await response.json();
          const userRating = futsalRatings.find((r: any) => r.user_id === userData.user_id);
          if (userRating) {
            setHasRated(true);
            setUserExistingRating(userRating);
            // Pre-populate form with existing data
            setUserRating(userRating.rating);
            setComment(userRating.comment || '');
          } else {
            setHasRated(false);
            setUserExistingRating(null);
          }
        }
      } else {
        // Unregistered user - check sessionStorage for rating info
        const storedRatingInfo = sessionStorage.getItem(`rating_${futsal.futsal_id}`);

        if (storedRatingInfo) {
          try {
            const ratingInfo = JSON.parse(storedRatingInfo);

            // Try to find the rating by ID first
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/ratings/futsal/${futsal.futsal_id}`);
            if (response.ok) {
              const futsalRatings = await response.json();
              let userRating = futsalRatings.find((r: any) => r.id === ratingInfo.rating_id);

              // If not found by ID, try to match by users and users_type
              if (!userRating) {
                userRating = futsalRatings.find((r: any) =>
                  r.users === ratingInfo.users && r.users_type === ratingInfo.users_type
                );
              }

              if (userRating) {
                setHasRated(true);
                setUserExistingRating(userRating);
                // Pre-populate form with existing data
                setUserRating(userRating.rating);
                setComment(userRating.comment || '');
                setUserName(userRating.users !== 'Anonymous' ? userRating.users : '');
                setIsAnonymous(userRating.users === 'Anonymous');
              } else {
                // If we can't find the rating, reset the state
                setHasRated(false);
                setUserExistingRating(null);
                sessionStorage.removeItem(`rating_${futsal.futsal_id}`);
              }
            }
          } catch (error) {
            // Invalid localStorage data, reset
            setHasRated(false);
            setUserExistingRating(null);
            sessionStorage.removeItem(`rating_${futsal.futsal_id}`);
          }
        } else {
          setHasRated(false);
          setUserExistingRating(null);
        }
      }
    } catch (error) {
      console.error('Error checking user rating:', error);
      setHasRated(false);
    }
  };

  const generateAnonymousToken = () => {
    return 'Anonymous_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  };

  const handleUpdateRating = async () => {
    if (!userExistingRating) return;

    if (userRating === 0) {
      showNotification({ message: "Please select a rating", type: 'info' });
      return;
    }

    setLoading(true);
    try {
      const user = sessionStorage.getItem('user');
      const userData = user ? JSON.parse(user) : null;

      let users = null;
      let users_type = null;

      if (userData) {
        // Registered user
        users = `${userData.first_name} ${userData.last_name}`;
        users_type = 'registered user';
      } else {
        // Unregistered user
        if (isAnonymous) {
          users = 'Anonymous';
          users_type = 'anonymous user';
        } else {
          users = userName.trim() || generateAnonymousToken();
          users_type = 'anonymous user';
        }
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/ratings/${userExistingRating.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating: userRating,
          comment: comment.trim() || null,
          users: users,
          users_type: users_type
        })
      });

      if (response.ok) {
        const data = await response.json();
        showNotification({ message: "Rating updated successfully!", type: 'success' });

        // Update localStorage for unregistered users
        if (!userData) {
          const updatedRatingInfo = {
            rating_id: userExistingRating.id,
            futsal_id: futsal.futsal_id,
            users: users,
            users_type: users_type,
            timestamp: Date.now()
          };
          sessionStorage.setItem(`rating_${futsal.futsal_id}`, JSON.stringify(updatedRatingInfo));
        }

        // Update the existing rating state
        setUserExistingRating(data.rating);

        onRatingSubmitted();
        fetchRatings();
        setIsEditing(false);
      } else {
        const error = await response.json();
        showNotification({ message: error.message || 'Error updating rating', type: 'info' });
      }
    } catch (error) {
      console.error('Error updating rating:', error);
      alert('Error updating rating');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRating = async () => {
    if (!userExistingRating) return;

    setConfirmModal({
      isOpen: true,
      message: 'Are you sure you want to delete your rating?',
      onConfirm: async () => {
        setConfirmModal({ isOpen: false, message: '', onConfirm: () => { } });
        setLoading(true);
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/ratings/${userExistingRating.id}`, {
            method: 'DELETE'
          });

          if (response.ok) {
            showNotification({ message: "Rating deleted successfully!", type: 'success' });
            setHasRated(false);
            setUserExistingRating(null);
            setUserRating(0);
            setComment('');
            setUserName('');
            setIsAnonymous(false);
            setIsEditing(false);

            // Remove from sessionStorage for unregistered users
            const user = sessionStorage.getItem('user');
            if (!user) {
              sessionStorage.removeItem(`rating_${futsal.futsal_id}`);
            }

            onRatingSubmitted();
            fetchRatings();
          } else {
            showNotification({ message: "Error deleting rating", type: 'info' });
          }
        } catch (error) {
          console.error('Error deleting rating:', error);
          showNotification({ message: "Error deleting rating", type: 'info' });
        } finally {
          setLoading(false);
        }
      }
    });
  };

  const handleSubmitRating = async () => {
    if (userRating === 0) {
      showNotification({ message: "Please select a rating", type: 'info' });
      return;
    }

    setLoading(true);
    try {
      const user = sessionStorage.getItem('user');
      const userData = user ? JSON.parse(user) : null;

      let users = null;
      let users_type = null;

      if (userData) {
        // Registered user
        users = `${userData.first_name} ${userData.last_name}`;
        users_type = 'registered user';
      } else {
        // Unregistered user
        if (isAnonymous) {
          users = 'Anonymous';
          users_type = 'anonymous user';
        } else {
          users = userName.trim() || generateAnonymousToken();
          users_type = 'anonymous user';
        }
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/ratings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          futsal_id: futsal.futsal_id,
          user_id: userData?.user_id,
          rating: userRating,
          comment: comment.trim() || null,
          users: users,
          users_type: users_type
        })
      });

      if (response.ok) {
        const data = await response.json();
        showNotification({ message: "Rating submitted successfully!", type: 'success' });
        setHasRated(true);
        setUserExistingRating(data.rating);

        // Store rating info in localStorage for unregistered users
        if (!userData) {
          const ratingInfo = {
            rating_id: data.rating.id,
            futsal_id: futsal.futsal_id,
            users: users,
            users_type: users_type,
            timestamp: Date.now()
          };
          sessionStorage.setItem(`rating_${futsal.futsal_id}`, JSON.stringify(ratingInfo));
        }

        onRatingSubmitted();
        fetchRatings();
        setUserRating(0);
        setComment('');
        setUserName('');
        setIsAnonymous(false);
      } else {
        const error = await response.json();
        showNotification({ message: error.message || 'Error submitting rating', type: 'info' });
      }
    } catch (error) {
      console.error('Error submitting rating:', error);
      alert('Error submitting rating');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-black/20 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-lg font-semibold">{futsal.name}</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="p-4 md:p-6">
          {/* Description */}
          <div className="mb-6">
            <h4 className="text-md font-semibold mb-2">Description</h4>
            <p className="text-gray-700">{futsal.description || 'No description available.'}</p>
          </div>

          {/* Rating Section */}
          <div className="mb-6">
            <h4 className="text-md font-semibold mb-2">
              {hasRated === null ? 'Loading Rating Status...' : 'Rate this Futsal'}
            </h4>
            {hasRated === null ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-lg h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600">Checking rating status...</span>
              </div>
            ) : hasRated && userExistingRating ? (
              <div className="space-y-4">
                {!isEditing ? (
                  // Display existing rating
                  <div className="border rounded p-4 bg-blue-50">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="font-semibold text-lg">Your Rating</h5>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setIsEditing(true)}
                          className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded text-sm"
                        >
                          Edit
                        </button>
                        <button
                          onClick={handleDeleteRating}
                          disabled={loading}
                          className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm disabled:opacity-50"
                        >
                          {loading ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center mb-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <svg key={star} className={`w-6 h-6 ${star <= userExistingRating.rating ? 'text-yellow-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                      <span className="ml-2 text-sm text-gray-600">({userExistingRating.rating} stars)</span>
                    </div>
                    {userExistingRating.comment && (
                      <p className="text-sm text-gray-700 mb-2">{userExistingRating.comment}</p>
                    )}
                    <p className="text-xs text-gray-500">
                      {userExistingRating.updated_at && new Date(userExistingRating.updated_at) > new Date(userExistingRating.created_at) ?
                        `Updated on: ${new Date(userExistingRating.updated_at).toLocaleDateString()}` :
                        `Rated on: ${new Date(userExistingRating.created_at).toLocaleDateString()}`
                      }
                    </p>
                  </div>
                ) : (
                  // Edit mode
                  <div className="space-y-4">
                    <div className="flex items-center space-x-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => setUserRating(star)}
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                          className="text-2xl focus:outline-none"
                        >
                          <svg
                            className={`w-8 h-8 ${star <= (hoverRating || userRating)
                              ? 'text-yellow-400'
                              : 'text-gray-300'
                              }`}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        </button>
                      ))}
                      <span className="ml-2 text-sm text-gray-600">
                        {userRating > 0 && `${userRating} star${userRating > 1 ? 's' : ''}`}
                      </span>
                    </div>

                    <textarea
                      placeholder="Leave a comment (optional)"
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded resize-none focus:outline-none focus:ring-0 focus:border-gray-900"
                      rows={3}
                      maxLength={500}
                    />

                    <div className="flex space-x-4">
                      <button
                        onClick={handleUpdateRating}
                        disabled={loading || userRating === 0}
                        className="bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50"
                      >
                        {loading ? 'Updating...' : 'Update Rating'}
                      </button>
                      <button
                        onClick={() => setIsEditing(false)}
                        className="bg-gray-600 text-white px-4 py-2 rounded"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              // Create new rating form
              <div className="space-y-4">
                {/* User Name Options - Only for unregistered users */}
                {(() => {
                  const user = sessionStorage.getItem('user');
                  const userData = user ? JSON.parse(user) : null;
                  return !userData && (
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <input
                          type="radio"
                          id="enterName"
                          name="userType"
                          checked={!isAnonymous}
                          onChange={() => setIsAnonymous(false)}
                        />
                        <label htmlFor="enterName" className="text-sm">Enter User Name</label>
                      </div>
                      {!isAnonymous && (
                        <input
                          type="text"
                          placeholder="User Name"
                          value={userName}
                          onChange={(e) => setUserName(e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded resize-none focus:outline-none focus:ring-0 focus:border-gray-900"
                          required={!isAnonymous}
                        />
                      )}

                      <div className="flex items-center space-x-2">
                        <input
                          type="radio"
                          id="anonymous"
                          name="userType"
                          checked={isAnonymous}
                          onChange={() => setIsAnonymous(true)}
                        />
                        <label htmlFor="anonymous" className="text-sm">Anonymous User</label>
                      </div>
                    </div>
                  );
                })()}

                <div className="flex items-center space-x-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setUserRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="text-2xl focus:outline-none"
                    >
                      <svg
                        className={`w-8 h-8 ${star <= (hoverRating || userRating)
                          ? 'text-yellow-400'
                          : 'text-gray-300'
                          }`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    </button>
                  ))}
                  <span className="ml-2 text-sm text-gray-600">
                    {userRating > 0 && `${userRating} star${userRating > 1 ? 's' : ''}`}
                  </span>
                </div>

                <textarea
                  placeholder="Leave a comment (optional)"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded resize-none focus:outline-none focus:ring-0 focus:border-gray-900"
                  rows={3}
                  maxLength={500}
                />

                <button
                  onClick={handleSubmitRating}
                  disabled={loading || userRating === 0}
                  className="bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50"
                >
                  {loading ? 'Submitting...' : 'Submit Rating'}
                </button>
              </div>
            )}
          </div>

          {/* Existing Ratings */}
          <div>
            <h4 className="text-md font-semibold mb-2">Reviews ({ratings.length})</h4>
            {ratings.length === 0 ? (
              <p className="text-gray-500">No reviews yet. Be the first to rate!</p>
            ) : (
              <div className="space-y-4 max-h-60 overflow-y-auto">
                {ratings.map((rating) => (
                  <div key={rating.id} className="border-b pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <svg key={star} className={`w-4 h-4 ${star <= rating.rating ? 'text-yellow-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                        </div>
                        <span className="ml-2 text-sm font-medium">
                          {rating.first_name && rating.last_name
                            ? `${rating.first_name} ${rating.last_name}`
                            : rating.users || 'Anonymous User'
                          }
                        </span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(rating.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    {rating.comment && (
                      <p className="text-sm text-gray-700 mt-1">{rating.comment}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}

// Location Modal Component
function LocationModal({ futsal, distance, onClose, showNotification }: { futsal: Futsal, distance: number, onClose: () => void, showNotification: (notification: { message: string, type: 'success' | 'info' }) => void }) {
  const handleShowDirections = () => {
    if (!futsal.latitude || !futsal.longitude) return;

    if (!navigator.geolocation) {
      showNotification({ message: "Geolocation is not supported by this browser.", type: 'info' });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLat = position.coords.latitude;
        const userLon = position.coords.longitude;

        const url = `https://www.google.com/maps/dir/?api=1&origin=${userLat},${userLon}&destination=${futsal.latitude},${futsal.longitude}&travelmode=driving`;
        window.open(url, '_blank');
        onClose();
      },
      (error) => {
        console.error('Error getting location:', error);
        showNotification({ message: "Unable to get your current location for directions.", type: 'info' });
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-sm w-full shadow-2xl">
        <div className="p-4">
          <div className="text-center mb-4">
            <div className="text-4xl mb-3">📍</div>
            <h3 className="text-lg font-bold text-gray-800 mb-3">Location Information</h3>
            <p className="text-gray-700 text-sm leading-relaxed">
              You are <span className="font-semibold text-blue-600">{distance.toFixed(2)} km</span> away from <span className="font-semibold">{futsal.name}</span>.
            </p>
            <p className="text-gray-600 text-sm mt-2">
              Would you like to see directions in Google Maps?
            </p>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={handleShowDirections}
              className="flex-1 bg-green-600 text-white py-2 px-3 rounded-lg hover:bg-green-700 transition-all duration-300 font-semibold text-sm"
            >
              Yes, Show Directions
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-gray-600 text-white py-2 px-3 rounded-lg hover:bg-gray-700 transition-all duration-300 font-semibold text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function EditUserForm({ user, onUpdate, onCancel, showNotification }: { user: User, onUpdate: (user: User) => void, onCancel: () => void, showNotification: (notification: { message: string, type: 'success' | 'info' }) => void }) {
  const [formData, setFormData] = useState({
    first_name: user.first_name,
    last_name: user.last_name,
    username: user.username,
    email: user.email,
    phone: user.phone,
    password: ''
  });
  const [loading, setLoading] = useState(false);

  const { tokens } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/${user.user_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tokens?.accessToken}`
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        onUpdate(data.user);
        showNotification({ message: "Profile updated successfully", type: 'success' });
      } else {
        const errorData = await response.json();
        showNotification({ message: errorData.message || "Error updating profile", type: 'info' });
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error updating profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <input type="text" placeholder="First Name" value={formData.first_name} onChange={(e) => setFormData({ ...formData, first_name: e.target.value })} required className="p-2 border rounded" />
        <input type="text" placeholder="Last Name" value={formData.last_name} onChange={(e) => setFormData({ ...formData, last_name: e.target.value })} required className="p-2 border rounded" />
        <input type="text" placeholder="Username" value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} required className="p-2 border rounded" />
        <input type="email" placeholder="Email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required className="p-2 border rounded" />
        <input type="text" placeholder="Phone" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} required className="p-2 border rounded" />
        <input type="password" placeholder="New Password (leave empty)" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className="p-2 border rounded" />
      </div>
      <div className="flex space-x-4">
        <button type="submit" disabled={loading} className="bg-linear-to-r from-green-600 to-green-700 text-white font-bold py-2 px-4 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 border border-green-500/30 hover:border-green-400/50 disabled:opacity-50">
          {loading ? 'Updating...' : 'Update Profile'}
        </button>
        <button type="button" onClick={onCancel} className="bg-gray-600 text-white font-bold py-2 px-4 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 border border-gray-500/30 hover:border-gray-400/50">
          Cancel
        </button>
      </div>
    </form>
  );
}


function BookingModal({ futsal, user, onClose, onSuccess, setSuccessModal, setConfirmModal, setPriceNotification, showNotification }: { futsal: Futsal, user: User | null, onClose: () => void, onSuccess: () => void, setSuccessModal: (modal: { isOpen: boolean, message: string }) => void, setConfirmModal: (modal: { isOpen: boolean, message: string, onConfirm: () => void }) => void, setPriceNotification: (notification: { isOpen: boolean, message: string } | null) => void, showNotification: (notification: { message: string, type: 'success' | 'info' }) => void }) {
  const [priceNotification, setPriceNotificationLocal] = useState<{ isOpen: boolean, message: string } | null>(null);
  const [step, setStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedShift, setSelectedShift] = useState('');
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [availableShifts, setAvailableShifts] = useState<string[]>([]);
  const [selectedSlotIds, setSelectedSlotIds] = useState<number[]>([]);
  const [numberOfPlayers, setNumberOfPlayers] = useState('');
  const [teamName, setTeamName] = useState('');
  const [esewaPhone, setEsewaPhone] = useState(user?.phone || '');
  const [loading, setLoading] = useState(false);
  const [currentPrice, setCurrentPrice] = useState<{ normalPrice: number, specialPrice?: { price: number, message?: string }, effectivePrice: number } | null>(null);
  const [specialPrices, setSpecialPrices] = useState<any[]>([]);
  const phone = user?.phone || '';

  const fetchPriceForSlot = async (slot: any) => {
    if (step !== 3) return;
    try {
      const url = `${process.env.NEXT_PUBLIC_API_URL}/api/special-prices/price/${futsal.futsal_id}/${selectedDate}?startTime=${slot.start_time}`;
      const response = await fetch(url);
      if (response.ok) {
        const priceData = await response.json();
        if (priceData.timeBasedPrice) {
          const message = `Normal Price: Rs. ${priceData.normalPrice} → Time-Based Price: Rs. ${priceData.timeBasedPrice.price}`;
          setPriceNotification({ isOpen: true, message });
        }
      }
    } catch (error) {
      console.error('Error fetching price for slot:', error);
    }
  };

  // console.log('BookingModal - Initial state:', { step, selectedDate, futsalId: futsal.futsal_id, booking: null });

  // Remove local priceNotification state since it's now in main component

  // Load booking progress from sessionStorage on mount
  useEffect(() => {
    const saved = sessionStorage.getItem('userBookingProgress');
    if (saved) {
      const data = JSON.parse(saved);
      setStep(data.step || 1);
      setSelectedDate(data.selectedDate || '');
      setSelectedShift(data.selectedShift || '');
      setSelectedSlotIds(data.selectedSlotIds || []);
      setNumberOfPlayers(data.numberOfPlayers || '5');
      setTeamName(data.teamName || '');
      setEsewaPhone(data.esewaPhone || user?.phone || '');
    }
  }, []);

  // Save booking progress to sessionStorage whenever state changes
  useEffect(() => {
    const progress = {
      step,
      selectedDate,
      selectedShift,
      selectedSlotIds,
      numberOfPlayers,
      teamName,
      esewaPhone,
    };
    sessionStorage.setItem('userBookingProgress', JSON.stringify(progress));
  }, [step, selectedDate, selectedShift, selectedSlotIds, numberOfPlayers, teamName, esewaPhone]);

  // Clear progress on unmount (modal close)
  useEffect(() => {
    return () => {
      sessionStorage.removeItem('userBookingProgress');
    };
  }, []);

  useEffect(() => {
    (async () => {
      if (futsal && futsal.opening_hours && futsal.closing_hours) {
        const openingHour = parseInt(futsal.opening_hours.split(':')[0]);
        const closingHour = parseInt(futsal.closing_hours.split(':')[0]);
        const shifts = [
          { name: 'Morning', start: 6, end: 10 },
          { name: 'Day', start: 10, end: 14 },
          { name: 'Evening', start: 14, end: 18 },
          { name: 'Night', start: 19, end: 23 }
        ];
        const available = shifts.filter(shift =>
          closingHour > shift.start && openingHour < shift.end
        ).map(shift => shift.name);
        setAvailableShifts(available);
      }

      // Refetch slots if restoring progress at step 3 or higher
      if (selectedDate && selectedShift && step >= 3) {
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/time-slots/futsal/${futsal.futsal_id}/date/${selectedDate}/shift/${selectedShift}`);
          if (response.ok) {
            const data = await response.json();
            setAvailableSlots(data.slots);
          }
        } catch (error) {
          console.error("Error fetching slots on restore:", error);
        }
      }
    })();
  }, [futsal, selectedDate, selectedShift, step]);

  // Fetch price when date or step changes
  useEffect(() => {
    const fetchPrice = async () => {
      if (futsal.futsal_id && selectedDate) {
        try {
          const url = `${process.env.NEXT_PUBLIC_API_URL}/api/special-prices/price/${futsal.futsal_id}/${selectedDate}`;

          const response = await fetch(url);
          if (response.ok) {
            const priceData = await response.json();
            setCurrentPrice(priceData);

            // Show notification only in appropriate step
            if (priceData.specialPrice && step === 1) {
              // Date-specific or recurring special price: show only in date step (step 1)
              const message = `Normal: Rs. ${priceData.normalPrice} → ${priceData.specialPrice.message || 'Special Price'}: Rs. ${priceData.specialPrice.price}`;
              setPriceNotification({ isOpen: true, message });
            } else if (step === 2 || step === 4) {
              // Close modal in other steps to prevent it from staying open
              setPriceNotification(null);
            }
          }
        } catch (error) {
          console.error('Error fetching price:', error);
        }
      }
    };

    fetchPrice();
  }, [futsal.futsal_id, selectedDate, step]);

  // Check slot status before allowing selection
  const checkSlotStatus = async (slotId: number): Promise<string> => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/time-slots/${slotId}/status`);
      if (response.ok) {
        const data = await response.json();
        return data.status;
      }
      return 'error';
    } catch (error) {
      console.error('Error checking slot status:', error);
      return 'error';
    }
  };

  // Handle slot selection with reservation
  const handleSlotClick = async (slot: any) => {
    try {
      const isSelected = selectedSlotIds.includes(slot.slot_id);
      if (isSelected) {
        // Deselect: release reservation
        await releaseSlotReservation(slot.slot_id);
        setSelectedSlotIds(prev => prev.filter(id => id !== slot.slot_id));
        // Update local state to available
        setAvailableSlots(prev => prev.map(s => s.slot_id === slot.slot_id ? { ...s, display_status: 'available', status: 'available' } : s));
      } else {
        // Select: reserve slot
        const reserveResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/time-slots/${slot.slot_id}/reserve`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });

        const reserveData = await reserveResponse.json();

        if (reserveResponse.ok) {
          // Reservation successful
          setSelectedSlotIds(prev => [...prev, slot.slot_id]);
          // Update local to pending
          setAvailableSlots(prev => prev.map(s => s.slot_id === slot.slot_id ? { ...s, display_status: 'pending' } : s));
          // Fetch price and show notification if special
          fetchPriceForSlot(slot);
        } else {
          // Reservation failed
          if (reserveData.status === 'pending') {
            showNotification({ message: "Slot is already chosen and in process of booking. Please choose another one.", type: 'info' });
          } else if (reserveData.status === 'booked') {
            showNotification({ message: "Slot already booked. Please choose another slot.", type: 'info' });
          } else if (reserveData.status === 'disabled') {
            showNotification({ message: "Slot is disabled. Please choose another slot.", type: 'info' });
          } else {
            showNotification({ message: reserveData.message || 'Unable to reserve slot. Please try again.', type: 'info' });
          }

          // Refresh slots
          try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/time-slots/futsal/${futsal.futsal_id}/date/${selectedDate}/shift/${selectedShift}`);
            if (response.ok) {
              const data = await response.json();
              setAvailableSlots(data.slots);
            }
          } catch (error) {
            console.error('Error refreshing slots:', error);
          }
        }
      }
    } catch (error) {
      console.error('Error reserving slot:', error);
      showNotification({ message: "Unable to reserve slot. Please try again.", type: 'info' });
    }
  };

  // Release slot reservation when user goes back or changes selection
  const releaseSlotReservation = async (slotId: number) => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/time-slots/${slotId}/release`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error('Error releasing slot:', error);
    }
  };

  const handleDateSubmit = async () => {
    if (selectedDate) {
      // Release any previously selected slots when changing date
      if (selectedSlotIds.length > 0) {
        await Promise.all(selectedSlotIds.map(slotId => releaseSlotReservation(slotId)));
        setSelectedSlotIds([]);
      }
      setStep(2);
    }
  };

  const handleShiftSubmit = async () => {
    if (selectedShift && selectedDate) {
      // Release any previously selected slots when changing shift
      if (selectedSlotIds.length > 0) {
        await Promise.all(selectedSlotIds.map(slotId => releaseSlotReservation(slotId)));
        setSelectedSlotIds([]);
      }
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/time-slots/futsal/${futsal.futsal_id}/date/${selectedDate}/shift/${selectedShift}`);
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
    if (selectedSlotIds.length === 0) return;

    // Final check of all selected slot statuses before proceeding to payment
    for (const slotId of selectedSlotIds) {
      const currentStatus = await checkSlotStatus(slotId);
      if (currentStatus !== 'available' && currentStatus !== 'pending') {
        if (currentStatus === 'booked') {
          showNotification({ message: "One or more slots have been booked by another user. Please start over and choose other slots.", type: 'info' });
        } else if (currentStatus === 'disabled') {
          showNotification({ message: "One or more slots have been disabled. Please start over and choose other slots.", type: 'info' });
        } else {
          showNotification({ message: "Unable to verify slot availability. Please try again.", type: 'info' });
        }
        // Reset to step 3 to choose other slots
        setStep(3);
        setSelectedSlotIds([]);
        // Refresh slots
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/time-slots/futsal/${futsal.futsal_id}/date/${selectedDate}/shift/${selectedShift}`);
          if (response.ok) {
            const data = await response.json();
            setAvailableSlots(data.slots);
          }
        } catch (error) {
          console.error('Error refreshing slots:', error);
        }
        return;
      }
    }

    // Proceed to payment step
    setStep(4);
  };

  const handlePaymentSubmit = async () => {
    setLoading(true);
    try {
      const totalAmount = selectedSlotIds.length * 100;
      let successCount = 0;
      let failedSlots: number[] = [];

      for (const slotId of selectedSlotIds) {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/bookings`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: user?.user_id,
            slot_id: slotId,
            number_of_players: Number(numberOfPlayers) || 10,
            team_name: teamName,
            payment_status: 'paid',
            amount_paid: 100,
            otp_verified: true,
          }),
        });

        if (response.ok) {
          successCount++;
        } else {
          failedSlots.push(slotId);
        }
      }

      if (successCount > 0) {
        showNotification({ message: `Payment successful for ${successCount} slot${successCount > 1 ? 's' : ''}!`, type: 'success' });
        sessionStorage.removeItem('userBookingProgress');
        // Show success modal after notification hides
        setTimeout(() => {
          setSuccessModal({ isOpen: true, message: `Booking successful for ${successCount} slot${successCount > 1 ? 's' : ''}!` });
          onSuccess();
        }, 2000);
      } else {
        showNotification({ message: "All bookings failed. The slots may have been taken by another user.", type: 'info' });
        // Reset to step 3
        setStep(3);
        setSelectedSlotIds([]);
      }

      if (failedSlots.length > 0) {
        showNotification({ message: `${failedSlots.length} booking${failedSlots.length > 1 ? 's' : ''} failed.`, type: 'info' });
      }
    } catch (error) {
      console.error('Error:', error);
      showNotification({ message: "Error creating bookings. Please try again.", type: 'info' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-black/20 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl overflow-hidden max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-linear-to-br from-green-50 via-white to-blue-50 opacity-50"></div>

        {/* Content */}
        <div className="relative p-5">
          {/* Header - Hidden for registered users */}
          {!user && (
            <div className="text-center mb-2">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-linear-to-br from-green-500 to-green-600 rounded-lg mb-4 shadow-lg">
                <svg
                  className="w-9 h-9 text-white"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <rect x="3" y="4" width="18" height="16" rx="2" />
                  <line x1="12" y1="4" x2="12" y2="20" />
                  <circle cx="12" cy="12" r="2.5" />
                </svg>
              </div>

              <h2 className="text-2xl sm:text-3xl font-bold text-center bg-linear-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-2">
                {futsal.name}
              </h2>
              <p className="text-gray-600 text-sm">Choose your preferred time slot</p>
            </div>
          )}

          {/* Selected Futsal Indicator for Registered Users */}
          {user && (
            <div className="bg-linear-to-r from-green-100 to-blue-100 rounded-xl p-4 mb-6 border border-green-200">
              <div className="flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <span className="text-sm font-medium text-green-800">
                  Booking at: <span className="font-bold">{futsal.name}</span>
                </span>
              </div>
            </div>
          )}

          {/* Progress Indicator for Registered Users */}
          {user && (
            <div className="flex justify-center py-8 bg-gray-50">
              <div className="max-w-4xl px-4 w-full">
                {/* Mobile Progress */}
                <div className="flex justify-center sm:hidden">
                  <div className="w-full px-6">
                    {/* Progress bar */}
                    <div className="mb-3">
                      <div className="flex justify-between text-xs text-gray-600 mb-2">
                        <span>Step {step} of 4</span>
                        <span>{Math.round((step / 4) * 100)}%</span>
                      </div>

                      <div className="w-full bg-gray-200 rounded-lg h-3">
                        <div
                          className="bg-linear-to-r from-green-500 to-green-600 h-3 rounded-lg transition-all duration-300"
                          style={{ width: `${(step / 4) * 100}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Step labels */}
                    <div className="grid grid-cols-4 gap-1 text-xs text-center">
                      <span className={step >= 1 ? 'text-green-600 font-semibold' : 'text-gray-400'}>Date</span>
                      <span className={step >= 2 ? 'text-green-600 font-semibold' : 'text-gray-400'}>Shift</span>
                      <span className={step >= 3 ? 'text-green-600 font-semibold' : 'text-gray-400'}>Slot</span>
                      <span className={step >= 4 ? 'text-green-600 font-semibold' : 'text-gray-400'}>Payment</span>
                    </div>
                  </div>
                </div>

                {/* Desktop Progress */}
                <div className="hidden sm:flex items-center justify-center space-x-4">
                  {/* Step 1 */}
                  <div className="flex items-center">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-lg ${step >= 1 ? 'bg-linear-to-r from-green-500 to-green-600' : 'bg-gray-300 text-gray-500'
                      }`}>
                      1
                    </div>
                    <span className={`ml-2 text-sm font-medium ${step >= 1 ? 'text-green-600' : 'text-gray-500'}`}>
                      Select Date
                    </span>
                  </div>

                  <div className={`w-8 h-0.5 ${step > 1 ? 'bg-linear-to-r from-green-500 to-green-600' : 'bg-gray-300'}`}></div>

                  {/* Step 2 */}
                  <div className="flex items-center">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shadow-lg font-bold text-sm ${step >= 2 ? 'bg-linear-to-r from-green-500 to-green-600 text-white' : 'bg-gray-300 text-gray-500'
                      }`}>
                      2
                    </div>
                    <span className={`ml-2 text-sm font-medium ${step >= 2 ? 'text-green-600' : 'text-gray-500'}`}>
                      Select Shift
                    </span>
                  </div>

                  <div className={`w-8 h-0.5 ${step > 2 ? 'bg-linear-to-r from-green-500 to-green-600' : 'bg-gray-300'}`}></div>

                  {/* Step 3 */}
                  <div className="flex items-center">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shadow-lg font-bold text-sm ${step >= 3 ? 'bg-linear-to-r from-green-500 to-green-600 text-white' : 'bg-gray-300 text-gray-500'
                      }`}>
                      3
                    </div>
                    <span className={`ml-2 text-sm font-medium ${step >= 3 ? 'text-green-600' : 'text-gray-500'}`}>
                      Slot & Details
                    </span>
                  </div>

                  <div className={`w-8 h-0.5 ${step > 3 ? 'bg-linear-to-r from-green-500 to-green-600' : 'bg-gray-300'}`}></div>

                  {/* Step 4 */}
                  <div className="flex items-center">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shadow-lg font-bold text-sm ${step >= 4 ? 'bg-linear-to-r from-green-500 to-green-600 text-white' : 'bg-gray-300 text-gray-500'
                      }`}>
                      4
                    </div>
                    <span className={`ml-2 text-sm font-medium ${step >= 4 ? 'text-green-600' : 'text-gray-500'}`}>
                      Payment
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 1: Select Date */}
          {step === 1 && (
            <div className="max-w-lg mx-auto">
              <div className="relative bg-white rounded-2xl shadow-sm overflow-hidden transform transition-all duration-500 hover:scale-[1.02] mt-5">
                {/* Cancel Button */}
                <div className="absolute top-4 right-4 z-10">
                  <button
                    onClick={() => {
                      setConfirmModal({
                        isOpen: true,
                        message: 'Confirm Action\nAre you sure you want to cancel this booking?',
                        onConfirm: async () => {
                          setConfirmModal({ isOpen: false, message: '', onConfirm: () => { } });
                          // Release selected slots
                          await Promise.all(selectedSlotIds.map(id => releaseSlotReservation(id)));
                          setSelectedSlotIds([]);
                          sessionStorage.removeItem('userBookingProgress');
                          onClose();
                        }
                      });
                    }}
                    className="w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-lg flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Gradient Background */}
                {/* <div className="absolute inset-0 bg-linear-to-br from-green-50 via-white to-blue-50 opacity-50"></div> */}

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
                      Select Your Date
                    </h2>
                    <p className="text-gray-600 text-sm">Choose the perfect day for your futsal adventure</p>
                  </div>

                  {/* Date Input */}
                  <div className="space-y-7">
                    <div className="relative">
                      <label htmlFor="bookingDate" className="block text-sm font-semibold text-gray-700 mb-2">
                        📅 Booking Date
                      </label>
                      <div className="relative">
                        <input
                          type="date"
                          id="bookingDate"
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
                      {/* {currentPrice && (
                        <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                          <p className="text-sm text-green-800 font-medium">
                            {currentPrice.specialPrice ? (
                              <>
                                Normal: Rs. {currentPrice.normalPrice} → {currentPrice.specialPrice.message || 'Special'}: Rs. {currentPrice.effectivePrice}
                              </>
                            ) : (
                              <>Price: Rs. {currentPrice.effectivePrice}/hour</>
                            )}
                          </p>
                        </div>
                      )} */}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4 pt-4">
                      <button
                        onClick={onClose}
                        className="flex-1 order-2 sm:order-1 bg-linear-to-r from-gray-500 to-gray-600 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 border border-gray-400/30"
                      >
                        <span className="flex items-center justify-center">
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          Cancel
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
            <div className="max-w-lg mx-auto">
              <div className="relative bg-white rounded-2xl shadow-sm overflow-hidden transform transition-all duration-500 hover:scale-[1.02] mt-5 ">
                {/* Cancel Button */}
                <div className="absolute top-4 right-4 z-10">
                  <button
                    onClick={() => {
                      setConfirmModal({
                        isOpen: true,
                        message: 'Confirm Action\nAre you sure you want to cancel this booking?',
                        onConfirm: async () => {
                          setConfirmModal({ isOpen: false, message: '', onConfirm: () => { } });
                          // Release selected slots
                          await Promise.all(selectedSlotIds.map(id => releaseSlotReservation(id)));
                          setSelectedSlotIds([]);
                          sessionStorage.removeItem('userBookingProgress');
                          onClose();
                        }
                      });
                    }}
                    className="w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-lg flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Gradient Background */}
                {/* <div className="absolute inset-0 bg-linear-to-br from-green-50 via-white to-blue-50 opacity-50"></div> */}

                {/* Content */}
                <div className="relative p-2 md:p-8">
                  {/* Header */}
                  <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-linear-to-br from-green-500 to-green-600 rounded-lg mb-4 shadow-lg">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-bold bg-linear-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-2">
                      Choose Your Shift
                    </h2>
                    <p className="text-gray-600 text-sm">Pick the time period that works best for you</p>
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
                      {availableShifts.map((shift: string) => (
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
                        onClick={async () => {
                          if (selectedSlotIds.length > 0) {
                            await Promise.all(selectedSlotIds.map(slotId => releaseSlotReservation(slotId)));
                            setSelectedSlotIds([]);
                          }
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

          {/* Step 3: Select Slot and Details */}
          {step === 3 && (
            <div className="w-full max-w-4xl mx-auto">
              <div className="relative bg-white rounded-2xl shadow-sm overflow-hidden transform transition-all duration-500 hover:scale-[1.02] mt-5 ">
                {/* Cancel Button */}
                <div className="absolute top-4 right-4 z-10">
                  <button
                    onClick={() => {
                      setConfirmModal({
                        isOpen: true,
                        message: 'Confirm Action\nAre you sure you want to cancel this booking?',
                        onConfirm: async () => {
                          setConfirmModal({ isOpen: false, message: '', onConfirm: () => { } });
                          // Release selected slots
                          await Promise.all(selectedSlotIds.map(id => releaseSlotReservation(id)));
                          setSelectedSlotIds([]);
                          localStorage.removeItem('userBookingProgress');
                          onClose();
                        }
                      });
                    }}
                    className="w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-lg flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Gradient Background */}
                {/* <div className="absolute inset-0 bg-linear-to-br from-green-50 via-white to-blue-50 opacity-50"></div> */}

                {/* Content */}
                <div className="relative p-2 md:p-8">
                  {/* Header */}
                  <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-linear-to-br from-green-500 to-green-600 rounded-lg mb-4 shadow-lg">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-bold bg-linear-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-2">
                      Pick Your Time Slot
                    </h2>
                    <p className="text-gray-600 text-sm">Choose the perfect time for your game</p>
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
                        {availableSlots.map((slot: any) => (
                          <button
                            key={slot.slot_id}
                            onClick={() => handleSlotClick(slot)}
                            disabled={
                              (slot.display_status === "booked" ||
                                slot.display_status === "expired" ||
                                slot.status === "disabled" ||
                                slot.status === "pending") && !selectedSlotIds.includes(slot.slot_id)
                            }
                            className={`relative p-4 border-2 rounded-xl text-center transition-all duration-300 transform hover:scale-105 ${selectedSlotIds.includes(slot.slot_id)
                              ? "bg-linear-to-br from-green-500 to-green-600 border-green-500 text-white shadow-lg"
                              : slot.display_status === "booked"
                                ? "bg-red-50 border-red-300 cursor-not-allowed opacity-60"
                                : slot.display_status === "expired"
                                  ? "bg-yellow-50 border-yellow-300 cursor-not-allowed opacity-60"
                                  : slot.status === "disabled"
                                    ? "bg-gray-50 border-gray-300 cursor-not-allowed opacity-60"
                                    : slot.status === "pending"
                                      ? "bg-orange-50 border-orange-300 cursor-not-allowed opacity-60"
                                      : "bg-white border-gray-200 hover:border-green-300 hover:shadow-md"
                              }`}
                          >
                            {selectedSlotIds.includes(slot.slot_id) && (
                              <div className="absolute top-1 right-2 w-4 h-4 bg-white rounded-lg flex items-center justify-center shadow-sm">
                                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              </div>
                            )}
                            <div className={`font-bold text-sm mb-1 ${selectedSlotIds.includes(slot.slot_id) ? 'text-white' :
                              slot.display_status === "booked" ? 'text-red-600' :
                                slot.display_status === "expired" ? 'text-yellow-600' :
                                  slot.status === "disabled" ? 'text-gray-600' :
                                    slot.status === "pending" ? 'text-orange-600' :
                                      'text-gray-800'
                              }`}>
                              {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                            </div>
                            <div className={`text-sm ${selectedSlotIds.includes(slot.slot_id) ? 'text-green-100' :
                              slot.display_status === "booked" ? 'text-red-500' :
                                slot.display_status === "expired" ? 'text-yellow-500' :
                                  slot.status === "disabled" ? 'text-gray-500' :
                                    slot.status === "pending" ? 'text-orange-500' :
                                      'text-gray-600'
                              }`}>
                              {selectedSlotIds.includes(slot.slot_id)
                                ? "✅ Selected"
                                : slot.display_status === "booked"
                                  ? `👤 Booked`
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
                  {selectedSlotIds.length > 0 && (
                    <div className="border-t border-gray-200 pt-8">
                      <div className="text-center mb-6">
                        <h3 className="text-xl font-bold text-gray-800 mb-2">Enter Your Details</h3>
                        <p className="text-gray-600 text-sm">Complete your booking information</p>
                      </div>

                      <form onSubmit={(e) => { e.preventDefault(); setStep(4); }} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="relative">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                              👥 Number of Players
                            </label>
                            <div className="relative">
                              <input
                                type="number"
                                id="number"
                                placeholder="1-10 players"
                                value={numberOfPlayers}
                                onChange={(e) => setNumberOfPlayers(e.target.value)}
                                min="1"
                                max="10"
                                required
                                className="w-full px-4 py-3 pl-12 bg-white border-2 border-gray-200 rounded-lg text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400/50 focus:border-green-400/50 transition-all duration-300 font-medium text-sm"
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
                                id="teamname"
                                placeholder="Enter team name"
                                value={teamName}
                                onChange={(e) => setTeamName(e.target.value)}
                                className="w-full px-4 py-3 pl-12 bg-white border-2 border-gray-200 rounded-lg text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400/50 focus:border-green-400/50 transition-all duration-300 font-medium text-sm"
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
                            onClick={async () => {
                              if (selectedSlotIds.length > 0) {
                                await Promise.all(selectedSlotIds.map(slotId => releaseSlotReservation(slotId)));
                                setSelectedSlotIds([]);
                              }
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
                            className="flex-1 order-1 sm:order-2 bg-linear-to-r from-green-500 to-green-600 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 border border-green-400/30"
                          >
                            <span className="flex items-center justify-center">
                              Next: Payment
                              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </span>
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  {/* Back Button when no slot selected */}
                  {selectedSlotIds.length === 0 && availableSlots.length > 0 && (
                    <div className="flex justify-center pt-6">
                      <button
                        onClick={() => setStep(2)}
                        className="bg-linear-to-r from-gray-500 to-gray-600 text-white font-semibold py-3 px-8 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 border border-gray-400/30 mb-2"
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

          {/* Step 4: Payment */}
          {step === 4 && (
            <div className="max-w-lg mx-auto">
              <div className="relative bg-white rounded-2xl shadow-sm overflow-hidden transform transition-all duration-500 hover:scale-[1.02] mt-5">
                {/* Cancel Button */}
                <div className="absolute top-4 right-4 z-10">
                  <button
                    onClick={() => {
                      setConfirmModal({
                        isOpen: true,
                        message: 'Confirm Action\nAre you sure you want to cancel this booking?',
                        onConfirm: async () => {
                          setConfirmModal({ isOpen: false, message: '', onConfirm: () => { } });
                          // Release selected slots
                          if (selectedSlotIds.length > 0) {
                            await Promise.all(selectedSlotIds.map(id => releaseSlotReservation(id)));
                            setSelectedSlotIds([]);
                          }
                          sessionStorage.removeItem('userBookingProgress');
                          onClose();
                        }
                      });
                    }}
                    className="w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-lg flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Gradient Background */}
                {/* <div className="absolute inset-0 bg-linear-to-br from-green-50 via-white to-blue-50 opacity-50"></div> */}

                {/* Content */}
                <div className="relative p-2 md:p-8">
                  {/* Header */}
                  <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-linear-to-br from-green-500 to-green-600 rounded-lg mb-4 shadow-lg">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-bold bg-linear-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-2">
                      Advance Payment
                    </h2>
                    <p className="text-gray-600 text-sm">Pay Rs. 100 advance to confirm your booking</p>
                  </div>

                  {/* Phone Info */}
                  <div className="bg-linear-to-r from-green-100 to-blue-100 rounded-xl p-4 mb-6 border border-green-200">
                    <div className="flex items-center justify-center">
                      <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                      </svg>
                      <span className="text-sm font-medium text-green-800">
                        Phone: <span className="font-bold">{user?.phone}</span>
                      </span>
                    </div>
                  </div>

                  {/* eSewa Phone Number Input */}
                  <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      📱 eSewa Phone Number
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={esewaPhone}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, ""); // Only allow digits
                          if (value.length <= 10 && (value === "" || value.startsWith("9"))) {
                            setEsewaPhone(value);
                          }
                        }}
                        placeholder="Enter your eSewa registered phone number"
                        className="w-full px-4 py-3 pl-12 bg-white border-2 border-gray-200 rounded-lg text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400/50 focus:border-green-400/50 transition-all duration-300 font-medium text-sm"
                        required
                        maxLength={10}
                      />
                      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-500">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                        </svg>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">This should be the phone number registered with your eSewa account</p>
                  </div>

                  {/* eSewa Details */}
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 mb-8">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">eSewa Payment Details</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 font-medium">Merchant:</span>
                        <span className="text-gray-800 font-semibold">BookMyFutsal</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 font-medium">Amount per slot:</span>
                        <span className="text-green-600 font-bold">Rs. 100</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 font-medium">Slots selected:</span>
                        <span className="text-gray-800 font-bold">{selectedSlotIds.length}</span>
                      </div>
                      <div className="flex justify-between items-center border-t pt-2">
                        <span className="text-gray-800 font-semibold">Total Amount:</span>
                        <span className="text-green-600 font-bold">Rs. {selectedSlotIds.length * 100}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 font-medium">eSewa ID:</span>
                        <span className="text-gray-800 font-semibold">{esewaPhone || 'Not set'}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 font-medium">Purpose:</span>
                        <span className="text-gray-800 font-semibold">Advance Booking</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button
                      onClick={() => setStep(3)}
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
                      onClick={() => {
                        if (!esewaPhone.trim()) {
                          showNotification({ message: "Please enter your eSewa phone number", type: 'info' });
                          return;
                        }
                        handlePaymentSubmit();
                      }}
                      disabled={!esewaPhone.trim()}
                      className="flex-1 order-1 sm:order-2 bg-linear-to-r from-green-500 to-green-600 text-white font-semibold py-3 px-8 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 border border-green-400/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    >
                      <span className="flex items-center justify-center">
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        </svg>
                        Pay Rs. {selectedSlotIds.length * 100}
                      </span>
                    </button>
                  </div>

                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function UpdateBookingModal({ booking, onClose, onSuccess, setSuccessModal, showNotification, setPriceNotification }: { booking: Booking, onClose: () => void, onSuccess: () => void, setSuccessModal: (modal: { isOpen: boolean, message: string }) => void, showNotification: (notification: { message: string, type: 'success' | 'info' }) => void, setPriceNotification: (notification: { isOpen: boolean, message: string } | null) => void }) {
  const formatTime = (timeString: string): string => {
    const [hours, minutes] = timeString.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    return `${displayHours}${period}`;
  };

  const [step, setStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState(booking.booking_date?.split('T')[0] || '');
  const [selectedShift, setSelectedShift] = useState('');
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [availableShifts, setAvailableShifts] = useState<string[]>([]);
  const [futsal, setFutsal] = useState<Futsal | null>(null);
  const [selectedSlotIds, setSelectedSlotIds] = useState<number[]>([]);
  const [numberOfPlayers, setNumberOfPlayers] = useState(booking.number_of_players.toString());
  const [teamName, setTeamName] = useState(booking.team_name || '');
  const [loading, setLoading] = useState(false);

  const fetchPriceForSlot = async (slot: any) => {
    if (step !== 3) return;
    try {
      const url = `${process.env.NEXT_PUBLIC_API_URL}/api/special-prices/price/${futsalId}/${selectedDate}?startTime=${slot.start_time}`;
      const response = await fetch(url);
      if (response.ok) {
        const priceData = await response.json();
        if (priceData.timeBasedPrice) {
          const message = `Normal Price: Rs. ${priceData.normalPrice} → Time-Based Price: Rs. ${priceData.timeBasedPrice.price}`;
          setPriceNotification({ isOpen: true, message });
        }
      }
    } catch (error) {
      console.error('Error fetching price for slot:', error);
    }
  };

  // Get futsal_id from the booking, with fallback fetch if missing
  const [futsalId, setFutsalId] = useState<number | undefined>(booking.futsal_id);
  // console.log('UpdateBookingModal - Initial state:', { step, selectedDate, futsalId, booking });

  // Fallback: if futsalId is undefined, fetch the booking details to get it
  useEffect(() => {
    if (!futsalId && booking.booking_id) {
      const fetchBooking = async () => {
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/bookings/${booking.booking_id}`);
          if (response.ok) {
            const data = await response.json();
            setFutsalId(data.booking.futsal_id);
          }
        } catch (error) {
          console.error('Error fetching booking for futsalId:', error);
        }
      };
      fetchBooking();
    }
  }, [futsalId, booking.booking_id]);

  // Fetch price when date or step changes
  useEffect(() => {
    const fetchPrice = async () => {
      if (futsalId && selectedDate) {
        try {
          const url = `${process.env.NEXT_PUBLIC_API_URL}/api/special-prices/price/${futsalId}/${selectedDate}`;

          const response = await fetch(url);
          if (response.ok) {
            const priceData = await response.json();

            // Show notification only in appropriate step
            if (priceData.specialPrice && step === 1) {
              // Date-specific or recurring special price: show only in date step (step 1)
              const message = `Normal: Rs. ${priceData.normalPrice} → ${priceData.specialPrice.message || 'Special Price'}: Rs. ${priceData.specialPrice.price}`;
              setPriceNotification({ isOpen: true, message });
            } else if (step === 2) {
              // Close modal in other steps to prevent it from staying open
              setPriceNotification(null);
            }
          }
        } catch (error) {
          console.error('Error fetching price:', error);
        }
      }
    };

    fetchPrice();
  }, [futsalId, selectedDate, step, setPriceNotification]);

  useEffect(() => {
    const fetchFutsal = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/futsals/${futsalId}`);
        if (response.ok) {
          const data = await response.json();
          setFutsal(data);

          if (data.opening_hours && data.closing_hours) {
            const openingHour = parseInt(data.opening_hours.split(':')[0]);
            const closingHour = parseInt(data.closing_hours.split(':')[0]);
            const shifts = [
              { name: 'Morning', start: 6, end: 10 },
              { name: 'Day', start: 10, end: 14 },
              { name: 'Evening', start: 14, end: 18 },
              { name: 'Night', start: 19, end: 23 }
            ];
            const available = shifts.filter(shift =>
              closingHour > shift.start && openingHour < shift.end
            ).map(shift => shift.name);
            setAvailableShifts(available);
          }
        }
      } catch (error) {
        console.error('Error fetching futsal:', error);
      }
    };

    if (futsalId) {
      fetchFutsal();
    }
  }, [futsalId]);

  // Check slot status before allowing selection
  const checkSlotStatus = async (slotId: number): Promise<string> => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/time-slots/${slotId}/status`);
      if (response.ok) {
        const data = await response.json();
        return data.status;
      }
      return 'error';
    } catch (error) {
      console.error('Error checking slot status:', error);
      return 'error';
    }
  };

  // Handle slot selection with reservation
  const handleSlotClick = async (slot: any) => {
    if (slot.display_status !== 'available' && !selectedSlotIds.includes(slot.slot_id)) return;

    try {
      const isSelected = selectedSlotIds.includes(slot.slot_id);
      if (isSelected) {
        // Deselect: release reservation
        await releaseSlotReservation(slot.slot_id);
        setSelectedSlotIds([]);
        // Update local state to available
        setAvailableSlots(prev => prev.map(s => s.slot_id === slot.slot_id ? { ...s, display_status: 'available', status: 'available' } : s));
      } else {
        // Select: reserve slot
        const reserveResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/time-slots/${slot.slot_id}/reserve`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });

        const reserveData = await reserveResponse.json();

        if (reserveResponse.ok) {
          // Reservation successful
          setSelectedSlotIds([slot.slot_id]);
          // Update local to pending
          setAvailableSlots(prev => prev.map(s => s.slot_id === slot.slot_id ? { ...s, display_status: 'pending' } : s));
          // Fetch price and show notification if special
          fetchPriceForSlot(slot);
        } else {
          // Reservation failed
          if (reserveData.status === 'pending') {
            showNotification({ message: "Slot is already chosen and in process of booking. Please choose another one.", type: 'info' });
          } else if (reserveData.status === 'booked') {
            showNotification({ message: "Slot already booked. Please choose another slot.", type: 'info' });
          } else if (reserveData.status === 'disabled') {
            showNotification({ message: "Slot is disabled. Please choose another slot.", type: 'info' });
          } else {
            showNotification({ message: reserveData.message || 'Unable to reserve slot. Please try again.', type: 'info' });
          }

          // Refresh slots to show updated status
          try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/time-slots/futsal/${futsalId}/date/${selectedDate}/shift/${selectedShift}`);
            if (response.ok) {
              const data = await response.json();
              setAvailableSlots(data.slots);
            }
          } catch (error) {
            console.error('Error refreshing slots:', error);
          }
        }
      }
    } catch (error) {
      console.error('Error reserving slot:', error);
      showNotification({ message: "Unable to reserve slot. Please try again.", type: 'info' });
    }
  };

  // Release slot reservation when user goes back or changes selection
  const releaseSlotReservation = async (slotId: number) => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/time-slots/${slotId}/release`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error('Error releasing slot:', error);
    }
  };

  const handleDateSubmit = () => {
    if (selectedDate) {
      setStep(2);
      setSelectedShift(''); // Reset shift when date changes
      setAvailableSlots([]);
      setSelectedSlotIds([]);
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
    if (selectedSlotIds.length === 0) return;

    // Final check of slot status before updating booking
    const currentStatus = await checkSlotStatus(selectedSlotIds[0]);

    if (currentStatus !== 'available' && currentStatus !== 'pending') {
      if (currentStatus === 'booked') {
        showNotification({ message: "Slot has been booked by another user. Please start over and choose another slot.", type: 'info' });
      } else if (currentStatus === 'disabled') {
        showNotification({ message: "Slot has been disabled. Please start over and choose another slot.", type: 'info' });
      } else {
        showNotification({ message: "Unable to verify slot availability. Please try again.", type: 'info' });
      }
      // Reset to step 3 to choose another slot
      setStep(3);
      setSelectedSlotIds([]);
      // Refresh slots
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/time-slots/futsal/${futsalId}/date/${selectedDate}/shift/${selectedShift}`);
        if (response.ok) {
          const data = await response.json();
          setAvailableSlots(data.slots);
        }
      } catch (error) {
        console.error('Error refreshing slots:', error);
      }
      return;
    }

    setLoading(true);
    try {
      const user = JSON.parse(sessionStorage.getItem('user') || '{}');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/bookings/user/${booking.booking_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slot_id: selectedSlotIds[0],
          number_of_players: Number(numberOfPlayers) || 5,
          team_name: teamName,
          user_id: user.user_id
        }),
      });

      if (response.ok) {
        setSuccessModal({ isOpen: true, message: 'Booking updated successfully!' });
        onSuccess();
      } else {
        setSuccessModal({ isOpen: true, message: 'Error updating booking. The slot may have been taken by another user.' });
        // Reset to step 3
        setStep(3);
        setSelectedSlotIds([]);
      }
    } catch (error) {
      console.error('Error:', error);
      setSuccessModal({ isOpen: true, message: 'Error updating booking. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-black/20 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl overflow-hidden max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Gradient Background */}
        {/* <div className="absolute inset-0 bg-linear-to-br from-green-50 via-white to-blue-50 opacity-50"></div> */}

        {/* Content */}
        <div className="relative p-2 sm:p-8">
          {/* Header */}
          <div className="text-center mb-2 sm:mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-linear-to-br from-green-500 to-green-600 rounded-lg mb-4 shadow-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-center bg-linear-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-2">
              {futsal?.name || 'Update Booking'}
            </h2>
            <p className="text-gray-600 text-sm">Modify your existing booking details</p>
          </div>

          {/* Step 1: Select Date */}
          {step === 1 && (
            <div className="max-w-lg mx-auto">
              <div className="relative bg-white rounded-2xl shadow-2xl overflow-hidden transform transition-all duration-500 hover:scale-[1.02]">
                {/* Gradient Background */}
                {/* <div className="absolute inset-0 bg-linear-to-br from-green-50 via-white to-blue-50 opacity-50"></div> */}

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
                    <p className="text-gray-600 text-sm">Choose a different date for your booking</p>
                  </div>

                  {/* Date Input */}
                  <div className="space-y-7">
                    <div className="relative">
                      <label htmlFor="updateBookingDate" className="block text-sm font-semibold text-gray-700 mb-2">
                        📅 New Booking Date
                      </label>
                      <div className="relative">
                        <input
                          type="date"
                          id="updateBookingDate"
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
                        onClick={onClose}
                        className="flex-1 order-2 sm:order-1 bg-linear-to-r from-gray-500 to-gray-600 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 border border-gray-400/30"
                      >
                        <span className="flex items-center justify-center">
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          Cancel
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
            <div className="max-w-lg mx-auto">
              <div className="relative bg-white rounded-2xl shadow-2xl overflow-hidden transform transition-all duration-500 hover:scale-[1.02]">
                {/* Gradient Background */}
                {/* <div className="absolute inset-0 bg-linear-to-br from-green-50 via-white to-blue-50 opacity-50"></div> */}

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
                    <p className="text-gray-600 text-sm">Pick a different time period</p>
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
                      {availableShifts.map((shift) => (
                        <button
                          key={shift}
                          onClick={() => {
                            const newShift = selectedShift === shift ? '' : shift;
                            setSelectedShift(newShift);
                            if (newShift === '') {
                              // If deselecting, release any selected slots and clear
                              if (selectedSlotIds.length > 0) {
                                selectedSlotIds.forEach(slotId => releaseSlotReservation(slotId));
                              }
                              setSelectedSlotIds([]);
                              setAvailableSlots([]);
                            }
                          }}
                          className={`relative p-6 border-2 rounded-xl transition-all duration-300 transform hover:scale-105 ${selectedShift === shift
                            ? "bg-linear-to-br from-green-500 to-green-600 border-green-500 text-white shadow-lg"
                            : "bg-white border-gray-200 hover:border-green-300 hover:shadow-md"
                            }`}
                        >
                          {selectedShift === shift && (
                            <div className="absolute top-2 right-2 w-6 h-6 bg-white rounded-lg flex items-center justify-center">
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
                        onClick={async () => {
                          if (selectedSlotIds.length > 0) {
                            await Promise.all(selectedSlotIds.map(slotId => releaseSlotReservation(slotId)));
                            setSelectedSlotIds([]);
                          }
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

          {/* Step 3: Select Slot and Details */}
          {step === 3 && (
            <div className="w-full max-w-4xl mx-auto">
              <div className="relative bg-white rounded-2xl shadow-2xl overflow-hidden transform transition-all duration-500 hover:scale-[1.02]">
                {/* Gradient Background */}
                {/* <div className="absolute inset-0 bg-linear-to-br from-green-50 via-white to-blue-50 opacity-50"></div> */}

                {/* Content */}
                <div className="relative p-2 sm:p-8">
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
                    <p className="text-gray-600 text-sm">Choose a different time for your game</p>
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
                            onClick={() => handleSlotClick(slot)}
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
                                    : selectedSlotIds.includes(slot.slot_id)
                                      ? "bg-linear-to-br from-green-500 to-green-600 border-green-500 text-white shadow-lg"
                                      : "bg-white border-gray-200 hover:border-green-300 hover:shadow-md"
                              }`}
                          >
                            {selectedSlotIds.includes(slot.slot_id) && (
                              <div className="absolute top-1 right-2 w-4 h-4 bg-white rounded-lg flex items-center justify-center shadow-sm">
                                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              </div>
                            )}
                            <div className={`font-bold text-sm mb-1 ${selectedSlotIds.includes(slot.slot_id) ? 'text-white' :
                              slot.display_status === "booked" ? 'text-red-600' :
                                slot.display_status === "expired" ? 'text-yellow-600' :
                                  slot.status === "disabled" ? 'text-gray-600' :
                                    slot.status === "pending" ? 'text-orange-600' :
                                      'text-gray-800'
                              }`}>
                              {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                            </div>
                            <div className={`text-sm ${selectedSlotIds.includes(slot.slot_id) ? 'text-green-100' :
                              slot.display_status === "booked" ? 'text-red-500' :
                                slot.display_status === "expired" ? 'text-yellow-500' :
                                  slot.status === "disabled" ? 'text-gray-500' :
                                    slot.status === "pending" ? 'text-orange-500' :
                                      'text-gray-600'
                              }`}>
                              {slot.display_status === "booked"
                                ? `👤 Booked`
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
                  {selectedSlotIds.length > 0 && (
                    <div className="border-t border-gray-200 pt-8">
                      <div className="text-center mb-6">
                        <h3 className="text-xl font-bold text-gray-800 mb-2">Update Your Details</h3>
                        <p className="text-gray-600 text-sm">Modify your booking information</p>
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
                                id="updateNumber"
                                placeholder="1-10 players"
                                value={numberOfPlayers}
                                onChange={(e) => setNumberOfPlayers(e.target.value)}
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
                                id="updateTeamname"
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
                            onClick={async () => {
                              if (selectedSlotIds.length > 0) {
                                await Promise.all(selectedSlotIds.map(slotId => releaseSlotReservation(slotId)));
                                setSelectedSlotIds([]);
                              }
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
                            className="flex-1 order-1 sm:order-2 bg-linear-to-r from-green-500 to-green-600 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 border border-green-400/30"
                          >
                            <span className="flex items-center justify-center">
                              Update Booking
                              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </span>
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  {/* Back Button when no slot selected */}
                  {selectedSlotIds.length === 0 && availableSlots.length > 0 && (
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
      </div>
    </div>
  );
}