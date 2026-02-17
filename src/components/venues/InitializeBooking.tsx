'use client';

import { useEffect, useState } from 'react';

interface InitializeBookingProps {
  onComplete?: () => void;
}

/**
 * InitializeBooking Component
 * 
 * This component displays a loading message while preparing for booking.
 * It measures the time taken to initialize and only renders if the 
 * initialization takes more than 1 second (1000ms).
 * 
 * This provides visual feedback to users only when there's a noticeable delay,
 * avoiding unnecessary loader flashes for fast operations.
 */
export default function InitializeBooking({ onComplete }: InitializeBookingProps) {
  const [startTime] = useState(() => performance.now());
  const [shouldRender, setShouldRender] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);

  // Threshold: 1 second (1000ms) - loader only shows for noticeable delays
  const THRESHOLD_MS = 1000;

  useEffect(() => {
    // Check if initialization took more than 1 second
    const checkTime = () => {
      const currentTime = performance.now();
      const elapsed = currentTime - startTime;
      setElapsedTime(elapsed);
      
      // Only render if taking more than 1 second
      if (elapsed > THRESHOLD_MS) {
        setShouldRender(true);
      }
    };

    // Run check periodically to measure actual initialization time
    // Check every 100ms to see if we've crossed the threshold
    const intervalId = setInterval(() => {
      const currentTime = performance.now();
      const elapsed = currentTime - startTime;
      setElapsedTime(elapsed);
      
      if (elapsed > THRESHOLD_MS) {
        setShouldRender(true);
        clearInterval(intervalId);
      }
    }, 100);

    // Cleanup and call onComplete when component unmounts
    return () => {
      clearInterval(intervalId);
      if (onComplete) {
        onComplete();
      }
    };
  }, [startTime, onComplete]);

  // Don't render if initialization was fast (less than 1 second)
  if (!shouldRender && elapsedTime <= THRESHOLD_MS) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/90 backdrop-blur-sm">
      <div className="text-center">
        {/* Animated loader */}
        <div className="relative w-20 h-20 mx-auto mb-6">
          <div className="absolute inset-0 border-4 border-green-200 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-green-600 rounded-full border-t-transparent animate-spin"></div>
          <div className="absolute inset-2 border-4 border-green-300 rounded-full border-b-transparent animate-spin" style={{ animationDuration: '1.5s' }}></div>
        </div>
        
        {/* Loading message */}
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Preparing for booking...
        </h2>
        <p className="text-gray-600 text-lg">
          Loading...
        </p>
        
        {/* Loading dots animation */}
        <div className="flex justify-center mt-4 space-x-2">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-3 h-3 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-3 h-3 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
        
        {/* Time indicator (for debugging/verification) */}
        {elapsedTime > 0 && (
          <p className="text-xs text-gray-400 mt-4">
            Initialization time: {elapsedTime.toFixed(0)}ms
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * Hook to track booking initialization time
 * Returns the startTime and a function to complete initialization
 */
export function useBookingInitialization() {
  const [startTime] = useState(() => performance.now());
  const [isInitializing, setIsInitializing] = useState(true);

  const completeInitialization = () => {
    const elapsed = performance.now() - startTime;
    setIsInitializing(false);
    return elapsed;
  };

  return {
    startTime,
    isInitializing,
    completeInitialization,
    elapsedTime: performance.now() - startTime
  };
}
