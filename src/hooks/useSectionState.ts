"use client";

import { useState, useCallback } from 'react';

export type SectionId = 
  | 'futsal'
  | 'slots'
  | 'bookings'
  | 'special-prices'
  | 'ratings'
  | 'time-based-pricing';

interface UseSectionStateOptions {
  defaultOpenSections?: SectionId[];
}

interface UseSectionStateReturn {
  openSections: Set<SectionId>;
  isOpen: (sectionId: SectionId) => boolean;
  toggleSection: (sectionId: SectionId) => void;
  openSection: (sectionId: SectionId) => void;
  closeSection: (sectionId: SectionId) => void;
  closeAllSections: () => void;
  openAllSections: () => void;
}

/**
 * Hook for managing collapsible section state in the dashboard.
 * Each section can be independently toggled open/closed.
 * 
 * @param options - Configuration options
 * @param options.defaultOpenSections - Sections that should be open by default
 * @returns Section state management functions
 */
export function useSectionState(options: UseSectionStateOptions = {}): UseSectionStateReturn {
  const { defaultOpenSections = [] } = options;
  
  const [openSections, setOpenSections] = useState<Set<SectionId>>(
    new Set(defaultOpenSections)
  );

  const isOpen = useCallback((sectionId: SectionId): boolean => {
    return openSections.has(sectionId);
  }, [openSections]);

  const toggleSection = useCallback((sectionId: SectionId) => {
    setOpenSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  }, []);

  const openSection = useCallback((sectionId: SectionId) => {
    setOpenSections(prev => {
      const newSet = new Set(prev);
      newSet.add(sectionId);
      return newSet;
    });
  }, []);

  const closeSection = useCallback((sectionId: SectionId) => {
    setOpenSections(prev => {
      const newSet = new Set(prev);
      newSet.delete(sectionId);
      return newSet;
    });
  }, []);

  const closeAllSections = useCallback(() => {
    setOpenSections(new Set());
  }, []);

  const openAllSections = useCallback(() => {
    setOpenSections(new Set([
      'futsal',
      'slots',
      'bookings',
      'special-prices',
      'ratings',
      'time-based-pricing'
    ] as SectionId[]));
  }, []);

  return {
    openSections,
    isOpen,
    toggleSection,
    openSection,
    closeSection,
    closeAllSections,
    openAllSections,
  };
}
