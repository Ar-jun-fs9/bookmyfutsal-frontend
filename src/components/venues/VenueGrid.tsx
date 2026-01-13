import { useVenueFilters } from '@/hooks/useVenueFilters';
import { useState, useEffect, useMemo } from 'react';
import VenueCard from './VenueCard';
import VirtualizedVenueGrid from './VirtualizedVenueGrid';
import { useFutsals } from '@/hooks/useFutsals';

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

export default function VenueGrid() {
    const {
      filterState,
      updateFilter,
      clearFilters,
      filteredFutsals,
      uniqueNames,
      uniqueCities,
      uniqueLocations,
      showAllFutsals,
      toggleShowAll,
    } = useVenueFilters();

    const { data: futsals = [] } = useFutsals();
    const [futsalSpecialPrices, setFutsalSpecialPrices] = useState<{[key: number]: any[]}>({});
    const [containerDimensions, setContainerDimensions] = useState({ width: 1200, height: 800 });

   // Determine if we should use virtual scrolling
   const shouldUseVirtualization = useMemo(() => {
     return filteredFutsals.length > 20; // Use virtualization for lists with more than 20 items
   }, [filteredFutsals.length]);

   // Get the venues to display
   const displayVenues = useMemo(() => {
     return showAllFutsals ? filteredFutsals : filteredFutsals.slice(0, 6);
   }, [filteredFutsals, showAllFutsals]);

   // Update container dimensions on resize
   useEffect(() => {
     const updateDimensions = () => {
       const container = document.getElementById('venues');
       if (container) {
         const rect = container.getBoundingClientRect();
         setContainerDimensions({
           width: rect.width,
           height: Math.min(800, window.innerHeight * 0.7) // Max height based on viewport
         });
       }
     };

     updateDimensions();
     window.addEventListener('resize', updateDimensions);
     return () => window.removeEventListener('resize', updateDimensions);
   }, []);

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

  return (
    <main id="venues" className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-16">
      <div className="text-center mb-12 -up">
        <h2 className="text-4xl md:text-5xl font-bold bg-linear-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-4">
          Available Futsals
        </h2>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Choose from our premium futsal venues. Book now and experience the thrill of the game.
        </p>
      </div>

      {/* Filter Toggle Button */}
      <div className="mb-6 text-left">
        <button
          onClick={() => updateFilter('showFilters', !filterState.showFilters)}
          className="bg-linear-to-r from-green-500 to-green-600 text-white font-semibold py-2 px-4 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 text-sm"
        >
          {filterState.showFilters ? '🔽 Hide Filters' : '🔍 Show Filters'}
        </button>
        {filterState.showFilters && (
          <button
            onClick={clearFilters}
            className="ml-4 bg-linear-to-r from-red-500 to-red-600 text-white font-semibold py-2 px-4 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 text-sm"
          >
            🗑️ Clear Filters
          </button>
        )}
      </div>

      {/* Filters */}
      {filterState.showFilters && (
        <div className="mb-8 bg-white rounded-2xl shadow-xl border border-gray-100 p-6 ">
          <h3 className="text-xl font-bold mb-6 bg-linear-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">Filter & Search Futsals</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            {/* Search Bar */}
            <div className="lg:col-span-2">
              <label className="block text-sm font-semibold text-gray-800 mb-2">🔍 Search</label>
              <input
                type="text"
                placeholder="Search by name, city, or location..."
                value={filterState.searchQuery}
                onChange={(e) => updateFilter('searchQuery', e.target.value)}
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400/50 focus:border-green-400/50 transition-all text-sm"
              />
            </div>

            {/* Name Filter */}
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">🏟️ Futsal Name</label>
              <select
                value={filterState.selectedName}
                onChange={(e) => updateFilter('selectedName', e.target.value)}
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-400/50 focus:border-green-400/50 transition-all text-sm"
              >
                <option value="">All Names</option>
                {uniqueNames.map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </div>

            {/* City Filter */}
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">🏙️ City</label>
              <select
                value={filterState.selectedCity}
                onChange={(e) => updateFilter('selectedCity', e.target.value)}
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-400/50 focus:border-green-400/50 transition-all text-sm"
              >
                <option value="">All Cities</option>
                {uniqueCities.map((city) => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>

            {/* Location Filter */}
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">📍 Location</label>
              <select
                value={filterState.selectedLocation}
                onChange={(e) => updateFilter('selectedLocation', e.target.value)}
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-400/50 focus:border-green-400/50 transition-all text-sm"
              >
                <option value="">All Locations</option>
                {uniqueLocations.map((location) => (
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
                onChange={(e) => updateFilter('sortByRating', e.target.value as 'none' | 'highest' | 'lowest')}
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
                onChange={(e) => updateFilter('sortByPrice', e.target.value as 'none' | 'low-to-high' | 'high-to-low')}
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

      {/* Venue Grid - Use virtualization for large lists */}
      {shouldUseVirtualization && showAllFutsals ? (
        <VirtualizedVenueGrid
          futsals={displayVenues}
          containerWidth={containerDimensions.width}
          containerHeight={containerDimensions.height}
          futsalSpecialPrices={futsalSpecialPrices}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {displayVenues.map((futsal: Futsal, index: number) => (
            <VenueCard key={futsal.futsal_id} futsal={futsal} index={index} specialPrices={futsalSpecialPrices[futsal.futsal_id] || []} />
          ))}
        </div>
      )}

      {/* Show All/Less Button - Only show for non-virtualized lists or when virtualization is not needed */}
      {filteredFutsals.length > 6 && (!shouldUseVirtualization || !showAllFutsals) && (
        <div className="text-center mt-8">
          <button
            onClick={toggleShowAll}
            className="bg-linear-to-r from-green-500 to-green-600 text-white font-semibold py-3 px-8 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
          >
            {showAllFutsals ? 'Show Less Futsals' : `Show All Futsals (${filteredFutsals.length})`}
          </button>
        </div>
      )}

      {/* Performance indicator for virtualized lists */}
      {shouldUseVirtualization && showAllFutsals && (
        <div className="text-center mt-4 text-sm text-gray-500">
          ⚡ Virtual scrolling enabled for optimal performance with {filteredFutsals.length} venues
        </div>
      )}
    </main>
  );
}