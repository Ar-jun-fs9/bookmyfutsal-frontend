import { useEffect, useState } from 'react';
import { useFutsals } from '@/hooks/useFutsals';

export function useVenueCarousel() {
  const { data: futsals = [] } = useFutsals();
  const [currentCarouselIndex, setCurrentCarouselIndex] = useState(0);

  // Auto-play carousel
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentCarouselIndex(prev => prev < futsals.length - 1 ? prev + 1 : 0);
    }, 5000); // Change slide every 5 seconds

    return () => clearInterval(interval);
  }, [futsals]);

  const goToNext = () => {
    setCurrentCarouselIndex(prev => prev < futsals.length - 1 ? prev + 1 : 0);
  };

  const goToPrev = () => {
    setCurrentCarouselIndex(prev => prev > 0 ? prev - 1 : futsals.length - 1);
  };

  const goToSlide = (index: number) => {
    setCurrentCarouselIndex(index);
  };

  return {
    futsals,
    currentCarouselIndex,
    goToNext,
    goToPrev,
    goToSlide,
  };
}