'use client';

/**
 * SlotLoading Component
 * 
 * A compact loading spinner for slot containers.
 * Displays a small circular gradient spinner inside the slot box container
 * while data is being loaded.
 * 
 * Design follows the project's existing styling patterns from InitializeBooking.tsx
 * using the green color theme.
 */

interface SlotLoadingProps {
  /** Optional message to display below the spinner */
  message?: string;
  /** Size variant - 'sm' for smaller containers, 'md' for standard */
  size?: 'sm' | 'md';
}

export default function SlotLoading({ message = 'Loading available time slots...', size = 'md' }: SlotLoadingProps) {
  const spinnerSize = size === 'sm' ? 'w-10 h-10' : 'w-16 h-16';
  const iconSize = size === 'sm' ? 'w-4 h-4' : 'w-6 h-6';
  const textSize = size === 'sm' ? 'text-sm' : 'text-base';

  return (
    <div className="flex flex-col items-center justify-center py-8 px-4">
      {/* Animated spinner */}
      <div className={`relative ${spinnerSize} mb-4`}>
        {/* Outer ring - static */}
        <div className="absolute inset-0 border-4 border-green-200 rounded-full"></div>
        
        {/* Middle ring - spinning clockwise */}
        <div className="absolute inset-0 border-4 border-green-600 rounded-full border-t-transparent animate-spin"></div>
        
        {/* Inner ring - spinning counter-clockwise at different speed */}
        <div 
          className="absolute inset-1 border-4 border-green-300 rounded-full border-b-transparent animate-spin" 
          style={{ animationDuration: '1.5s', animationDirection: 'reverse' }}
        ></div>
      </div>
      
      {/* Loading message */}
      <p className={`text-gray-500 ${textSize} font-medium`}>
        {message}
      </p>
      
      {/* Subtle loading dots animation */}
      <div className="flex justify-center mt-2 space-x-1">
        <div 
          className="w-2 h-2 bg-green-500 rounded-full animate-bounce" 
          style={{ animationDelay: '0ms' }}
        ></div>
        <div 
          className="w-2 h-2 bg-green-500 rounded-full animate-bounce" 
          style={{ animationDelay: '150ms' }}
        ></div>
        <div 
          className="w-2 h-2 bg-green-500 rounded-full animate-bounce" 
          style={{ animationDelay: '300ms' }}
        ></div>
      </div>
    </div>
  );
}

/**
 * Compact version for inline use within smaller containers
 */
export function CompactSlotLoading() {
  return (
    <div className="flex items-center justify-center py-4">
      <div className="relative w-8 h-8">
        {/* Outer ring - static */}
        <div className="absolute inset-0 border-2 border-green-200 rounded-full"></div>
        
        {/* Spinning ring */}
        <div className="absolute inset-0 border-2 border-green-600 rounded-full border-t-transparent animate-spin"></div>
      </div>
    </div>
  );
}
