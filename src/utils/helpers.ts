// Time formatting utilities
export const formatTime = (timeString: string): string => {
  const [hours, minutes] = timeString.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  return `${displayHours}${period}`;
};

export const formatTimeRange = (opening: string, closing: string): string => {
  return `${formatTime(opening)} – ${formatTime(closing)}`;
};

export const formatBookingTimeRange = (timeRange: string): string => {
  const [startTime, endTime] = timeRange.split('-');
  return `${formatTime(startTime)}-${formatTime(endTime)}`;
};

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${year}-${month}-${day}`;
};

// Distance calculation
export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
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

// Booking categorization
export const categorizeBooking = (booking: any): 'past' | 'today' | 'future' => {
  const now = new Date();
  const matchDate = new Date(booking.booking_date).toLocaleDateString('en-CA');
  const timeSlot = booking.time_slot;

  if (!matchDate) {
    return 'past'; // Default to past if data is missing
  }

  // Get today's date string in YYYY-MM-DD format (local timezone)
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const matchDateStr = matchDate;

  // Compare date strings directly
  if (matchDateStr < todayStr) {
    return 'past'; // Match date is before today
  } else if (matchDateStr > todayStr) {
    return 'future'; // Match date is after today
  } else {
    // Match date is today - check the time
    if (!timeSlot) return 'past';

    // Parse the end time from time_slot (format: "HH:MM-HH:MM")
    const endTime = timeSlot.split('-')[1];
    const [hours, minutes] = endTime.split(':').map(Number);

    // Create a date object for today with the match end time
    const matchEndTime = new Date(today);
    matchEndTime.setHours(hours, minutes, 0, 0);

    return matchEndTime > now ? 'today' : 'past';
  }
};

// Generate tracking code
export const generateTrackingCode = (): string => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

// Generate anonymous token
export const generateAnonymousToken = (): string => {
  return 'Anonymous_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
};

// Check if user can update booking
export const canUpdateBooking = (bookingDate: string, timeSlot: string): boolean => {
  const bookingDateTime = new Date(`${bookingDate} ${timeSlot.split('-')[0]}`);
  const now = new Date();
  const diffHours = (bookingDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
  return diffHours > 2;
};

// Phone validation
export const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^9\d{9}$/;
  return phoneRegex.test(phone);
};

// Email validation
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Filter futsals
export const filterFutsals = (futsals: any[], filters: any) => {
  return futsals
    .filter(futsal => {
      const matchesSearch = !filters.searchQuery ||
        futsal.name.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
        futsal.city.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
        futsal.location.toLowerCase().includes(filters.searchQuery.toLowerCase());
      const matchesName = !filters.selectedName || futsal.name === filters.selectedName;
      const matchesCity = !filters.selectedCity || futsal.city === filters.selectedCity;
      const matchesLocation = !filters.selectedLocation || futsal.location === filters.selectedLocation;
      return matchesSearch && matchesName && matchesCity && matchesLocation;
    })
    .sort((a, b) => {
      if (filters.sortByRating) {
        return (b.average_rating || 0) - (a.average_rating || 0);
      }
      if (filters.sortByPrice === 'low-to-high') {
        return a.price_per_hour - b.price_per_hour;
      }
      if (filters.sortByPrice === 'high-to-low') {
        return b.price_per_hour - a.price_per_hour;
      }
      return 0;
    });
};