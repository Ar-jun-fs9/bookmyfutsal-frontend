export function formatTime(timeString: string): string {
  const [hours, minutes] = timeString.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
}

export function formatTimeSlot(timeString: string): string {
  const [hours, minutes] = timeString.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  return `${displayHours}${period}`;
}

export function formatTimeRange(timeRange: string): string {
  const [startTime, endTime] = timeRange.split('-');
  return `${formatTimeSlot(startTime)}-${formatTimeSlot(endTime)}`;
}

export function categorizeBooking(booking: any): 'past' | 'today' | 'future' {
  const now = new Date();
  const matchDate = booking.formatted_date || booking.booking_date?.toString().split('T')[0];
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
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
}