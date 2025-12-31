import { useRouter } from 'next/navigation';
import { useVenueCarousel } from '@/hooks/useVenueCarousel';
import { useFutsalStore } from '@/stores/futsalStore';

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

export default function VenueCarousel() {
  const router = useRouter();
  const { futsals, currentCarouselIndex, goToNext, goToPrev, goToSlide } = useVenueCarousel();
  const { setSelectedFutsal } = useFutsalStore();

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold bg-linear-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-4">
            Featured Venues
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Discover our top-rated futsal venues with premium facilities and excellent ratings.
          </p>
        </div>

        <div className="relative overflow-hidden rounded-2xl shadow-2xl">
          <div className="flex transition-transform duration-500 ease-in-out" style={{ transform: `translateX(-${currentCarouselIndex * 100}%)` }}>
            {futsals.map((futsal: Futsal, index: number) => (
              <div key={futsal.futsal_id} className="w-full shrink-0 relative">
                <div className="relative h-96 md:h-[500px]">
                  {futsal.images && futsal.images[0] && (
                    <img
                      src={`${process.env.NEXT_PUBLIC_API_URL}/uploads/${futsal.images[0]}`}
                      alt={futsal.name}
                      className="w-full h-full object-cover"
                    />
                  )}
                  <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/20 to-transparent"></div>
                  {futsal.game_format && (
                    <div className="absolute top-4 right-4">
                      <span className="text-sm font-semibold bg-black/20 backdrop-blur-sm text-white px-2 py-1 rounded-lg border border-white/30">
                        {futsal.game_format}
                      </span>
                    </div>
                  )}
                  <div className="absolute bottom-2 md:bottom-8 left-4 md:left-8 right-4 md:right-8 text-white">
                    <h3 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-1 md:mb-2">{futsal.name}</h3>
                    <p className="text-base md:text-lg lg:text-xl mb-2 md:mb-4">{futsal.location}, {futsal.city}</p>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-1 sm:space-y-0 mb-2 md:mb-4">
                      <span className="text-xl md:text-2xl font-bold text-green-400">Rs. {futsal.price_per_hour}/hour</span>
                    </div>
                    <button
                      onClick={() => {
                        localStorage.setItem('selectedFutsal', JSON.stringify(futsal));
                        router.push(`/book/${futsal.futsal_id}`);
                      }}
                      className="inline-block bg-linear-to-r from-green-500 to-green-600 text-white font-bold py-2 px-6 md:py-3 md:px-8 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 text-sm md:text-base"
                    >
                      Book Now
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Navigation Arrows */}
          <button
            onClick={goToPrev}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/20 backdrop-blur-md text-white p-1 sm:p-2 rounded-lg hover:bg-white/30 transition-all duration-300"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/20 backdrop-blur-md text-white p-1 sm:p-2 rounded-lg hover:bg-white/30 transition-all duration-300"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Indicators */}
          {/* <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
            {futsals.map((_: Futsal, index: number) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`w-2 h-2 sm:w-3 sm:h-3 rounded-lg transition-all duration-300 ${index === currentCarouselIndex ? 'bg-white' : 'bg-white/50'
                  }`}
              />
            ))}
          </div> */}
        </div>
      </div>
    </section>
  );
}