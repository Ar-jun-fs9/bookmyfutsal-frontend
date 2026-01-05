// Search and filter utilities for super admin dashboard

export function filterBookings(bookings: any[], searchTerm: string, futsalFilter: string, bookingFilter: 'all' | 'past' | 'today' | 'future' | 'cancelled'): any[] {
  return bookings.filter((booking) => {
    const category = categorizeBooking(booking);
    const matchesSearch = searchTerm === '' || booking.first_name.toLowerCase().includes(searchTerm.toLowerCase()) || (booking.user_phone && booking.user_phone.toLowerCase().includes(searchTerm.toLowerCase())) || (booking.team_name && booking.team_name.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesFutsal = futsalFilter === '' || booking.futsal_id.toString() === futsalFilter;
    const matchesCategory = bookingFilter === 'all' || (bookingFilter === 'cancelled' ? !!booking.cancelled_by : category === bookingFilter);
    return matchesSearch && matchesFutsal && matchesCategory;
  });
}

export function filterFutsals(futsals: any[], searchTerm: string): any[] {
  if (searchTerm === '') return futsals;
  return futsals.filter(futsal =>
    futsal.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
}

export function filterFutsalAdmins(admins: any[], searchTerm: string): any[] {
  if (searchTerm === '') return admins;
  return admins.filter(admin =>
    admin.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    admin.email.toLowerCase().includes(searchTerm.toLowerCase())
  );
}

export function filterUsers(users: any[], searchTerm: string): any[] {
  if (searchTerm === '') return users;
  return users.filter(user =>
    user.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.phone.toLowerCase().includes(searchTerm.toLowerCase())
  );
}

export function filterRatings(ratings: any[], searchTerm: string, futsalFilter: string): any[] {
  let filtered = ratings;
  if (searchTerm !== '') {
    filtered = filtered.filter(rating =>
      rating.futsal_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rating.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rating.last_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }
  if (futsalFilter !== '') {
    filtered = filtered.filter(rating => rating.futsal_id.toString() === futsalFilter);
  }
  return filtered;
}

// Import categorizeBooking from bookingUtils
import { categorizeBooking } from './bookingUtils';