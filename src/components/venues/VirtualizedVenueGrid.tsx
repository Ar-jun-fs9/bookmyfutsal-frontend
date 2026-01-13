import { memo, useCallback, useMemo } from 'react';
import { FixedSizeGrid as Grid } from 'react-window';
import { areEqual } from 'react-window';
import VenueCard from './VenueCard';

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

interface VirtualizedVenueGridProps {
  futsals: Futsal[];
  containerWidth?: number;
  containerHeight?: number;
  futsalSpecialPrices?: {[key: number]: any[]};
}

const ITEM_WIDTH = 320; // Width of each venue card
const ITEM_HEIGHT = 420; // Height of each venue card
const COLUMN_GAP = 24; // Gap between columns
const ROW_GAP = 24; // Gap between rows

// Memoized cell renderer for better performance
const VenueCell = memo(({ columnIndex, rowIndex, style, data }: any) => {
  const { futsals, columnCount, futsalSpecialPrices } = data;
  const index = rowIndex * columnCount + columnIndex;

  if (index >= futsals.length) {
    return null;
  }

  const futsal = futsals[index];

  return (
    <div
      style={{
        ...style,
        padding: '12px',
        boxSizing: 'border-box',
      }}
    >
      <VenueCard futsal={futsal} index={index} specialPrices={futsalSpecialPrices[futsal.futsal_id] || []} />
    </div>
  );
}, areEqual);

VenueCell.displayName = 'VenueCell';

const VirtualizedVenueGrid = memo(function VirtualizedVenueGrid({
  futsals,
  containerWidth = 1200,
  containerHeight = 800,
  futsalSpecialPrices = {}
}: VirtualizedVenueGridProps) {
  // Calculate grid dimensions
  const columnCount = useMemo(() => {
    const availableWidth = containerWidth - 48; // Account for padding
    return Math.max(1, Math.floor((availableWidth + COLUMN_GAP) / (ITEM_WIDTH + COLUMN_GAP)));
  }, [containerWidth]);

  const rowCount = useMemo(() => {
    return Math.ceil(futsals.length / columnCount);
  }, [futsals.length, columnCount]);

  const columnWidth = useMemo(() => {
    if (columnCount === 1) {
      return containerWidth - 48; // Full width for single column
    }
    const totalGapWidth = (columnCount - 1) * COLUMN_GAP;
    const availableWidth = containerWidth - 48 - totalGapWidth;
    return Math.floor(availableWidth / columnCount);
  }, [containerWidth, columnCount]);

  const rowHeight = useMemo(() => {
    return ITEM_HEIGHT + ROW_GAP;
  }, []);

  // Create item data object for the grid
  const itemData = useMemo(() => ({
    futsals,
    columnCount,
    futsalSpecialPrices,
  }), [futsals, columnCount, futsalSpecialPrices]);

  const handleItemsRendered = useCallback(({
    visibleRowStartIndex,
    visibleRowStopIndex,
    visibleColumnStartIndex,
    visibleColumnStopIndex,
  }: any) => {
    // Optional: Implement preloading logic for better UX
    // This could prefetch images for upcoming items
  }, []);

  if (futsals.length === 0) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="text-6xl mb-4">🏟️</div>
          <h3 className="text-xl font-semibold text-gray-600 mb-2">No venues found</h3>
          <p className="text-gray-500">Try adjusting your search criteria</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Virtualized Grid */}
      <Grid
        columnCount={columnCount}
        columnWidth={columnWidth}
        height={containerHeight}
        rowCount={rowCount}
        rowHeight={rowHeight}
        width={containerWidth}
        itemData={itemData}
        onItemsRendered={handleItemsRendered}
        overscanRowCount={2} // Render 2 extra rows for smoother scrolling
        overscanColumnCount={1} // Render 1 extra column for smoother scrolling
        className="venue-grid"
        style={{
          padding: '24px',
        }}
      >
        {VenueCell}
      </Grid>

      {/* Loading indicator for large lists */}
      {futsals.length > 50 && (
        <div className="text-center py-4 text-sm text-gray-500">
          Showing {futsals.length} venues
        </div>
      )}
    </div>
  );
});

VirtualizedVenueGrid.displayName = 'VirtualizedVenueGrid';

export default VirtualizedVenueGrid;