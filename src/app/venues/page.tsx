'use client';

import { useEffect, useState, useRef, useReducer } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useFutsals } from '@/hooks/useFutsals';
import { useNotificationStore } from '@/stores/notificationStore';
import { useFutsalStore } from '@/stores/futsalStore';
import { useModalStore } from '@/stores/modalStore';
import { filterReducer, initialFilterState } from '@/reducers/filterReducer';

// Dynamic imports for code splitting
const VenueGrid = dynamic(() => import('@/components/venues/VenueGrid'), {
  loading: () => <div className="min-h-96 bg-gray-100 animate-pulse rounded-lg"></div>
});

// Modal components with dynamic imports
const VideoModal = dynamic(() => import('@/components/modals/VideoModal'), {
  loading: () => <div className="h-64 bg-gray-100 animate-pulse rounded-lg"></div>
});

const RatingModal = dynamic(() => import('@/components/modals/RatingModal'), {
  loading: () => <div className="h-64 bg-gray-100 animate-pulse rounded-lg"></div>
});

const DetailsModal = dynamic(() => import('@/components/modals/DetailsModal'), {
  loading: () => <div className="h-64 bg-gray-100 animate-pulse rounded-lg"></div>
});

const LocationModal = dynamic(() => import('@/components/modals/LocationModal'), {
  loading: () => <div className="h-64 bg-gray-100 animate-pulse rounded-lg"></div>
});

const FeedbackModal = dynamic(() => import('@/components/modals/FeedbackModal'), {
  loading: () => <div className="h-64 bg-gray-100 animate-pulse rounded-lg"></div>
});

interface Futsal {
  futsal_id: number;
  name: string;
  location: string;
  city: string;
  images?: string[];
  video?: string;
  price_per_hour: number;
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

export default function VenuesPage() {
  const { data: futsals = [], isLoading: futsalsLoading } = useFutsals();
  const [currentImageIndexes, setCurrentImageIndexes] = useState<{ [key: number]: number }>({});
  const [filterState, dispatch] = useReducer(filterReducer, initialFilterState);
  const scrollPositionRef = useRef<number>(0);
  const { showNotification } = useNotificationStore();
  const { setSelectedFutsal } = useFutsalStore();
  const {
    errorModal,
    setErrorModal,
    confirmModal,
    setConfirmModal,
    videoModal,
    setVideoModal,
    ratingModal,
    setRatingModal,
    detailsModal,
    setDetailsModal,
    locationModal,
    setLocationModal,
    feedbackModal,
    setFeedbackModal,
    isMobileMenuOpen,
    setIsMobileMenuOpen,
  } = useModalStore();

  // Auto-hide error modal after 2 seconds
  useEffect(() => {
    if (errorModal.isOpen) {
      const timer = setTimeout(() => {
        setErrorModal({ isOpen: false, message: '' });
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [errorModal.isOpen]);

  // Prevent background scrolling when modals are open
  useEffect(() => {
    const hasModalOpen = videoModal.isOpen || ratingModal.isOpen || detailsModal.isOpen || locationModal.isOpen || feedbackModal.isOpen;

    if (hasModalOpen) {
      // Save current scroll position
      scrollPositionRef.current = window.scrollY;
      // Prevent scrolling by fixing body position
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollPositionRef.current}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
    } else {
      // Restore scroll position
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.overflow = '';
      window.scrollTo(0, scrollPositionRef.current);
    }

    // Cleanup on unmount
    return () => {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.overflow = '';
    };
  }, [videoModal.isOpen, ratingModal.isOpen, detailsModal.isOpen, locationModal.isOpen, feedbackModal.isOpen]);

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

  const closeRatingModal = () => {
    setRatingModal({ isOpen: false, futsal: null });
  };

  const handleDetailsModal = (futsal: Futsal) => {
    setDetailsModal({ isOpen: true, futsal });
  };

  const closeDetailsModal = () => {
    setDetailsModal({ isOpen: false, futsal: null });
  };

  const formatTime = (timeString: string): string => {
    const [hours, minutes] = timeString.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  const formatTimeRange = (opening: string, closing: string): string => {
    return `${formatTime(opening)} – ${formatTime(closing)}`;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${year}-${month}-${day}`;
  };

  const formatTimeRangeBooking = (timeRange: string): string => {
    if (!timeRange) return '';
    const [startTime, endTime] = timeRange.split('-');
    return `${formatTime(startTime)}-${formatTime(endTime)}`;
  };

  // Filter and sort futsals
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
      if (filterState.sortByRating) {
        return (b.average_rating || 0) - (a.average_rating || 0);
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
  const uniqueNames = [...new Set(futsals.map((f: Futsal) => f.name.trim()))].sort() as string[];
  const uniqueCities = [...new Set(futsals.map((f: Futsal) => f.city.trim()))].sort() as string[];
  const uniqueLocations = [...new Set(futsals.map((f: Futsal) => f.location.trim()))].sort() as string[];

  return (
    <div className="min-h-screen bg-linear-to-br from-green-50 via-white to-blue-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-linear-to-r from-gray-900 via-green-900 to-blue-900 backdrop-blur-md shadow-2xl border-b border-green-500/20">
        <div className="max-w-7xl mx-auto px-1 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4 px-2">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-3 cursor-pointer">
              <div className="relative">
                <img src="/logo/logo.png" alt="BookMyFutsal" className="h-12 w-12 rounded-lg bg-green-900 shadow-lg ring-2 ring-white" />
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-white rounded-lg animate-pulse"></div>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-white drop-shadow-lg">
                <span className="bg-linear-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">BookMy</span>
                <span className="text-white">Futsal</span>
              </h1>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <Link href="/" className="text-gray-200 hover:text-green-400 font-semibold transition-all duration-300 hover:scale-105 relative group">
                Home
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-green-400 transition-all duration-300 group-hover:w-full"></span>
              </Link>
              <Link href="/venues" className="text-gray-200 hover:text-green-400 font-semibold transition-all duration-300 hover:scale-105 relative group">
                Venues
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-green-400 transition-all duration-300 group-hover:w-full"></span>
              </Link>
              <Link href="/bookings" className="text-gray-200 hover:text-green-400 font-semibold transition-all duration-300 hover:scale-105 relative group">
                Bookings
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-green-400 transition-all duration-300 group-hover:w-full"></span>
              </Link>
              <Link href="/about" className="text-gray-200 hover:text-green-400 font-semibold transition-all duration-300 hover:scale-105 relative group">
                About
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-green-400 transition-all duration-300 group-hover:w-full"></span>
              </Link>
              <Link href="/contact" className="text-gray-200 hover:text-green-400 font-semibold transition-all duration-300 hover:scale-105 relative group">
                Contact
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-green-400 transition-all duration-300 group-hover:w-full"></span>
              </Link>
            </nav>

            {/* Auth Buttons */}
            <div className="hidden md:flex items-center space-x-4">
              <Link
                href="/user/login"
                className="px-6 py-2 bg-linear-to-r from-blue-600 to-blue-700 text-white font-bold rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 border border-blue-500/30 hover:border-blue-400/50"
              >
                Login
              </Link>
              <Link
                href="/user/register"
                className="px-6 py-2 bg-linear-to-r from-green-600 to-green-700 text-white font-bold rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 border border-green-500/30 hover:border-green-400/50"
              >
                Sign Up
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-gray-200 hover:text-green-400 hover:bg-green-900/50 transition-all duration-300 border border-gray-600/30"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>

          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <div className="md:hidden border-t border-green-500/20 py-4 px-2 bg-linear-to-b from-gray-900/95 to-green-900/95 backdrop-blur-md">
              <nav className="flex flex-col space-y-4">
                <Link href="/" className="text-gray-200 hover:text-green-400 font-semibold transition-all duration-300 px-3 py-2 rounded-lg hover:bg-green-900/50">Home</Link>
                <Link href="/venues" className="text-gray-200 hover:text-green-400 font-semibold transition-all duration-300 px-3 py-2 rounded-lg hover:bg-green-900/50">Venues</Link>
                <Link href="/bookings" className="text-gray-200 hover:text-green-400 font-semibold transition-all duration-300 px-3 py-2 rounded-lg hover:bg-green-900/50">Bookings</Link>
                <Link href="/about" className="text-gray-200 hover:text-green-400 font-semibold transition-all duration-300 px-3 py-2 rounded-lg hover:bg-green-900/50">About</Link>
                <Link href="/contact" className="text-gray-200 hover:text-green-400 font-semibold transition-all duration-300 px-3 py-2 rounded-lg hover:bg-green-900/50">Contact</Link>

                <div className="flex flex-row space-x-3 pt-4 border-t border-green-500/20">
                  <Link
                    href="/user/login"
                    className="flex-1 px-4 py-3 bg-linear-to-r from-blue-600 to-blue-700 text-white font-bold rounded-lg text-center shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 border border-blue-500/30"
                  >
                    Login
                  </Link>
                  <Link
                    href="/user/register"
                    className="flex-1 px-4 py-3 bg-linear-to-r from-green-600 to-green-700 text-white font-bold rounded-lg text-center shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 border border-green-500/30"
                  >
                    Sign Up
                  </Link>
                </div>
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* Page Header */}
      <div className="bg-linear-to-r from-green-600 to-blue-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Available Futsal Venues</h1>
          <p className="text-xl text-green-100 max-w-3xl mx-auto">
            Discover and book premium futsal venues across the city. Find the perfect spot for your next game.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <VenueGrid />
      </main>

      {/* Video Modal */}
      {videoModal.isOpen && videoModal.futsal && (
        <VideoModal
          futsal={videoModal.futsal}
          onClose={closeVideoModal}
        />
      )}

      {/* Rating Modal */}
      {ratingModal.isOpen && ratingModal.futsal && (
        <RatingModal
          futsal={ratingModal.futsal}
          onClose={closeRatingModal}
          onRatingSubmitted={() => {
            // Note: futsals will be refetched by React Query
          }}
        />
      )}

      {/* Details Modal */}
      {detailsModal.isOpen && detailsModal.futsal && (
        <DetailsModal
          futsal={detailsModal.futsal}
          onClose={closeDetailsModal}
        />
      )}

      {/* Location Modal */}
      {locationModal.isOpen && locationModal.futsal && locationModal.distance !== undefined && (
        <LocationModal
          futsal={locationModal.futsal}
          distance={locationModal.distance}
          onClose={() => setLocationModal({ isOpen: false, futsal: null })}
        />
      )}

      {/* Feedback Modal */}
      {feedbackModal.isOpen && (
        <FeedbackModal
          onClose={() => setFeedbackModal({ isOpen: false })}
        />
      )}
    </div>
  );
}