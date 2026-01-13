import { useState, useCallback, useMemo, memo } from 'react';
import { useRouter } from 'next/navigation';
import { useModalStore } from '@/stores/modalStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { formatTimeRange } from '@/utils/helpers';

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

interface VenueCardProps {
  futsal: Futsal;
  index: number;
  specialPrices?: any[];
}

const VenueCard = memo(function VenueCard({ futsal, index, specialPrices = [] }: VenueCardProps) {
  const router = useRouter();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const { showNotification } = useNotificationStore();
  const {
    setVideoModal,
    setRatingModal,
    setDetailsModal,
    setLocationModal,
  } = useModalStore();

  const images = useMemo(() => futsal.images || [], [futsal.images]);

  const formattedTimeRange = useMemo(() => {
    if (futsal.opening_hours && futsal.closing_hours) {
      return formatTimeRange(futsal.opening_hours, futsal.closing_hours);
    }
    return null;
  }, [futsal.opening_hours, futsal.closing_hours]);

  const facilitiesToShow = useMemo(() => {
    return futsal.facilities?.slice(0, 3) || [];
  }, [futsal.facilities]);

  const hasMoreFacilities = useMemo(() => {
    return (futsal.facilities?.length || 0) > 3;
  }, [futsal.facilities]);

  const extraFacilitiesCount = useMemo(() => {
    return Math.max(0, (futsal.facilities?.length || 0) - 3);
  }, [futsal.facilities]);

  const handlePrevImage = useCallback(() => {
    setCurrentImageIndex(prev => prev > 0 ? prev - 1 : images.length - 1);
  }, [images.length]);

  const handleNextImage = useCallback(() => {
    setCurrentImageIndex(prev => prev < images.length - 1 ? prev + 1 : 0);
  }, [images.length]);

  const handleCheckLocation = useCallback(() => {
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
  }, [futsal.latitude, futsal.longitude, showNotification, setLocationModal]);

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

  const handleSeeVideo = useCallback(() => {
    setVideoModal({ isOpen: true, futsal });
  }, [futsal, setVideoModal]);

  const handleDescRating = useCallback(() => {
    setRatingModal({ isOpen: true, futsal });
  }, [futsal, setRatingModal]);

  const handleDetailsModal = useCallback(() => {
    setDetailsModal({ isOpen: true, futsal });
  }, [futsal, setDetailsModal]);

  return (
    <div
      className="bg-white rounded-2xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-500 border border-gray-100 overflow-hidden -up"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      {/* Image Carousel */}
      <div className="relative h-56 overflow-hidden group">
        {images[currentImageIndex] && (
          <img
            src={`${process.env.NEXT_PUBLIC_API_URL}/uploads/${images[currentImageIndex]}`}
            alt={futsal.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        )}
        <div className="absolute inset-0 bg-linear-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

        {/* Navigation Arrows */}
        {images.length > 1 && (
          <>
            <button
              onClick={handlePrevImage}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 bg-white/20 backdrop-blur-md text-white p-0.5 sm:p-1 rounded-lg hover:bg-white/30 transition-all duration-300 opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
            >
              <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={handleNextImage}
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
                onClick={() => setCurrentImageIndex(idx)}
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
        {formattedTimeRange && (
          <p className="text-sm text-gray-600 mb-2 flex items-center">
            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
            Hours: {formattedTimeRange}
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
              {futsal.average_rating ? Number(futsal.average_rating).toFixed(1) : '0.0'} ({futsal.total_ratings || 0})
            </span>
          </div>
        )}
        {futsal.facilities && futsal.facilities.length > 0 && (
          <div className="mb-3">
            <div className="flex flex-wrap gap-1 mb-5">
              {facilitiesToShow.map((facility: string, index: number) => (
                <span key={index} className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-lg">
                  {facility}
                </span>
              ))}
              {hasMoreFacilities && (
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-lg ">
                  +{extraFacilitiesCount} more
                </span>
              )}
            </div>
          </div>
        )}
        <div className="flex flex-wrap gap-1">
          <button
            onClick={() => {
              localStorage.setItem('selectedFutsal', JSON.stringify(futsal));
              router.push(`/book/${futsal.futsal_id}`);
            }}
            className="flex-1 bg-linear-to-r from-green-500 to-green-600 text-white font-semibold py-2 px-3 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 text-center text-sm"
          >
            Book Now
          </button>
          <button
            onClick={handleCheckLocation}
            className="flex-1 bg-white border-2 border-gray-200 text-gray-700 font-semibold py-2 px-3 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all duration-300 text-sm"
          >
            Location
          </button>
          <button
            onClick={handleDetailsModal}
            className="bg-white border-2 border-gray-200 text-gray-700 p-2 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all duration-300 relative"
            title="Details"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {specialPrices.some(sp => sp.is_offer) && (
              <span className="absolute -top-5 left-1/2 transform -translate-x-1/2 text-[10px] text-red-600 font-bold animate-pulse bg-white px-0.5 rounded pointer-events-none whitespace-nowrap">
                special offer
              </span>
            )}
          </button>
          {futsal.video && (
            <button
              onClick={handleSeeVideo}
              className="bg-white border-2 border-gray-200 text-gray-700 p-2 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all duration-300"
              title="Video"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </button>
          )}
          <button
            onClick={handleDescRating}
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
});

VenueCard.displayName = 'VenueCard';

export default VenueCard;