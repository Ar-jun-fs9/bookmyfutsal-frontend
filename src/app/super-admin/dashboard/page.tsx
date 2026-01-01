'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
// import { useSocket } from '../socket';
import { useSocketStore } from '@/stores/socketStore';
import { useAuthStore } from '@/stores/authStore';

interface User {
  id: number;
  username: string;
  email: string;
}

interface Futsal {
  futsal_id: number;
  name: string;
  location: string;
  city: string;
  latitude?: number;
  longitude?: number;
  phone?: string;
  description?: string;
  images?: string[];
  video?: string;
  price_per_hour: number;
  game_format?: string;
  facilities?: string[];
  opening_hours?: string;
  closing_hours?: string;
  last_updated_by?: string;
  created_at?: string;
  updated_at?: string;
}

function formatTime(timeString: string): string {
  const [hours, minutes] = timeString.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
}

function formatTimeSlot(timeString: string): string {
  const [hours, minutes] = timeString.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  return `${displayHours}${period}`;
}

function formatTimeRange(timeRange: string): string {
  const [startTime, endTime] = timeRange.split('-');
  return `${formatTimeSlot(startTime)}-${formatTimeSlot(endTime)}`;
}

function categorizeBooking(booking: any): 'past' | 'today' | 'future' {
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

    // Parse the start time from time_slot (format: "HH:MM-HH:MM")
    const startTime = timeSlot.split('-')[0];
    const [hours, minutes] = startTime.split(':').map(Number);

    // Create a date object for today with the match start time
    const matchStartTime = new Date(today);
    matchStartTime.setHours(hours, minutes, 0, 0);

    return matchStartTime > now ? 'today' : 'past';
  }
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
}

export default function SuperAdminDashboard() {
   const { hydrated, tokens } = useAuthStore();
   const [user, setUser] = useState<User | null>(null);
  const [futsals, setFutsals] = useState<Futsal[]>([]);
  const [futsalAdmins, setFutsalAdmins] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [showCreateFutsal, setShowCreateFutsal] = useState(false);
  const [showCreateAdmin, setShowCreateAdmin] = useState(false);
  const [showBookings, setShowBookings] = useState(false);
  const [showSlots, setShowSlots] = useState(false);
  const [showRatings, setShowRatings] = useState(false);
  const [editingFutsalId, setEditingFutsalId] = useState<number | null>(null);
  const [editingAdmin, setEditingAdmin] = useState<any | null>(null);
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [editingBooking, setEditingBooking] = useState<any | null>(null);
  const [ratings, setRatings] = useState<any[]>([]);
  const [fullRatings, setFullRatings] = useState<any[]>([]);
  const [editingRating, setEditingRating] = useState<any | null>(null);
  const [creatingRating, setCreatingRating] = useState(false);
  const [slots, setSlots] = useState<any[]>([]);
  const [selectedFutsal, setSelectedFutsal] = useState<number | null>(null);
  const [slotDate, setSlotDate] = useState(new Date().toLocaleDateString('en-CA'));
  const [blockedUsers, setBlockedUsers] = useState<any[]>([]);
  const [allSlotsClosed, setAllSlotsClosed] = useState(false);
  const [viewingFutsalDetails, setViewingFutsalDetails] = useState<Futsal | null>(null);
  const [editingSuperAdmin, setEditingSuperAdmin] = useState(false);
  const [showFutsals, setShowFutsals] = useState(false);
  const [showFutsalAdmins, setShowFutsalAdmins] = useState(false);
  const [showUsers, setShowUsers] = useState(false);
  const [showBlockedUsers, setShowBlockedUsers] = useState(false);
  const [notification, setNotification] = useState<{ message: string, type: 'success' | 'info' } | null>(null);
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean, message: string, onConfirm: () => void }>({ isOpen: false, message: '', onConfirm: () => {} });
  const [bookingFilter, setBookingFilter] = useState<'all' | 'past' | 'today' | 'future' | 'cancelled'>('all');
  const [futsalFilter, setFutsalFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [blockReasonModal, setBlockReasonModal] = useState<{ isOpen: boolean, userId: number, onConfirm: (reason: string) => void }>({ isOpen: false, userId: 0, onConfirm: () => {} });
  // Removed deletedBookings state as we now delete from database
  const [selectedBookings, setSelectedBookings] = useState<number[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [showCheckboxes, setShowCheckboxes] = useState(false);
  const [selectedRatings, setSelectedRatings] = useState<number[]>([]);
  const [selectAllRatings, setSelectAllRatings] = useState(false);
  const [showRatingCheckboxes, setShowRatingCheckboxes] = useState(false);
  const [selectedFutsals, setSelectedFutsals] = useState<number[]>([]);
  const [selectAllFutsals, setSelectAllFutsals] = useState(false);
  const [showFutsalCheckboxes, setShowFutsalCheckboxes] = useState(false);
  const [selectedFutsalAdmins, setSelectedFutsalAdmins] = useState<number[]>([]);
  const [selectAllFutsalAdmins, setSelectAllFutsalAdmins] = useState(false);
  const [showFutsalAdminCheckboxes, setShowFutsalAdminCheckboxes] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [selectAllUsers, setSelectAllUsers] = useState(false);
  const [showUserCheckboxes, setShowUserCheckboxes] = useState(false);
  const [selectedBlockedUsers, setSelectedBlockedUsers] = useState<number[]>([]);
  const [selectAllBlockedUsers, setSelectAllBlockedUsers] = useState(false);
  const [showBlockedUserCheckboxes, setShowBlockedUserCheckboxes] = useState(false);
  const router = useRouter();
  const { socket } = useSocketStore();

  useEffect(() => {
    if (hydrated) {
      const storedUser = sessionStorage.getItem('superadmin');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
        fetchFutsals();
        fetchFutsalAdmins();
        fetchUsers();
        fetchBookings();
        fetchRatings();
        fetchBlockedUsers();
      } else {
        router.push('/super-admin/signin');
      }
    }
  }, [hydrated, router]);

  // Auto-fetch slots when futsal or date changes
  useEffect(() => {
    if (selectedFutsal) {
      fetchSlots(selectedFutsal, slotDate);
    } else if (showSlots) {
      fetchAllSlots();
    }
  }, [selectedFutsal, slotDate, showSlots]);

  // Auto-hide notifications after 2 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Real-time updates
  useEffect(() => {
    if (!socket) return;

    const handleSlotStatusUpdate = (data: any) => {
      if (selectedFutsal === data.futsalId && slotDate === data.date) {
        // Update the slots state in real-time
        setSlots(prevSlots =>
          prevSlots.map(slot =>
            slot.slot_id === data.slotId
              ? { ...slot, status: data.status }
              : slot
          )
        );
      }
    };

    const handleBookingCreated = (data: any) => {
      // Add new booking to the list in real-time
      setBookings(prevBookings => [data.booking, ...prevBookings]);
    };

    const handleBookingUpdated = (data: any) => {
      // Update the booking in the list in real-time
      setBookings(prevBookings =>
        prevBookings.map(booking =>
          booking.booking_id === data.booking.booking_id
            ? data.booking
            : booking
        )
      );
    };

    const handleBookingDeleted = (data: any) => {
      // Remove the booking from the list in real-time
      setBookings(prevBookings =>
        prevBookings.filter(booking => booking.booking_id !== data.bookingId)
      );
    };

    socket.on('slotStatusUpdated', handleSlotStatusUpdate);
    socket.on('bookingCreated', handleBookingCreated);
    socket.on('bookingUpdated', handleBookingUpdated);
    socket.on('bookingDeleted', handleBookingDeleted);

    return () => {
      socket.off('slotStatusUpdated', handleSlotStatusUpdate);
      socket.off('bookingCreated', handleBookingCreated);
      socket.off('bookingUpdated', handleBookingUpdated);
      socket.off('bookingDeleted', handleBookingDeleted);
    };
  }, [socket, selectedFutsal, slotDate]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    const hasModalOpen = viewingFutsalDetails || editingSuperAdmin || confirmModal.isOpen;
    if (hasModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [viewingFutsalDetails, editingSuperAdmin, confirmModal.isOpen]);

  const fetchBookings = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/bookings/all`, {
        headers: {
          'Authorization': `Bearer ${tokens?.accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const data = await response.json();
        setBookings(data.bookings);
      } else if (response.status === 401) {
        // Token expired or invalid, redirect to login
        router.push('/super-admin/signin');
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    }
  };

  const fetchBlockedUsers = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/blocked/list`, {
        headers: {
          'Authorization': `Bearer ${tokens?.accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const data = await response.json();
        setBlockedUsers(data.blocked_users);
      } else if (response.status === 401) {
        // Token expired or invalid, redirect to login
        router.push('/super-admin/signin');
      }
    } catch (error) {
      console.error('Error fetching blocked users:', error);
    }
  };

  const fetchRatings = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/ratings`, {
        headers: {
          'Authorization': `Bearer ${tokens?.accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const data = await response.json();
        setFullRatings(data.ratings);
        setRatings(data.ratings);
      } else if (response.status === 401) {
        // Token expired or invalid, redirect to login
        router.push('/super-admin/signin');
      }
    } catch (error) {
      console.error('Error fetching ratings:', error);
    }
  };

  const fetchFutsals = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/futsals`, {
        headers: {
          'Authorization': `Bearer ${tokens?.accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const data = await response.json();
        setFutsals(data);
      } else if (response.status === 401) {
        // Token expired or invalid, redirect to login
        router.push('/super-admin/signin');
      }
    } catch (error) {
      console.error('Error fetching futsals:', error);
    }
  };

  const fetchFutsalAdmins = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/futsal-admins`, {
        headers: {
          'Authorization': `Bearer ${tokens?.accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const data = await response.json();
        setFutsalAdmins(data);
      } else if (response.status === 401) {
        // Token expired or invalid, redirect to login
        router.push('/super-admin/signin');
      }
    } catch (error) {
      console.error('Error fetching futsal admins:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users`, {
        headers: {
          'Authorization': `Bearer ${tokens?.accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
      } else if (response.status === 401) {
        // Token expired or invalid, redirect to login
        router.push('/super-admin/signin');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleDeleteFutsal = (id: number) => {
    setConfirmModal({
      isOpen: true,
      message: 'Are you sure you want to delete this futsal?',
      onConfirm: async () => {
        setConfirmModal({ isOpen: false, message: '', onConfirm: () => {} });
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/futsals/${id}`, {
            method: 'DELETE',
          });

          if (response.ok) {
            setFutsals(futsals.filter(f => f.futsal_id !== id));
            setNotification({ message: 'Futsal deleted successfully', type: 'success' });
          } else {
            setNotification({ message: 'Error deleting futsal', type: 'info' });
          }
        } catch (error) {
          console.error('Error:', error);
          setNotification({ message: 'Error deleting futsal', type: 'info' });
        }
      }
    });
  };

  const handleDeleteFutsalAdmin = (id: number) => {
    setConfirmModal({
      isOpen: true,
      message: 'Are you sure you want to delete this futsal admin?',
      onConfirm: async () => {
        setConfirmModal({ isOpen: false, message: '', onConfirm: () => {} });
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/futsal-admins/${id}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${tokens?.accessToken}`,
            },
          });

          if (response.ok) {
            setFutsalAdmins(futsalAdmins.filter(a => a.id !== id));
            setNotification({ message: 'Futsal admin deleted successfully', type: 'success' });
          } else {
            setNotification({ message: 'Error deleting futsal admin', type: 'info' });
          }
        } catch (error) {
          console.error('Error:', error);
          setNotification({ message: 'Error deleting futsal admin', type: 'info' });
        }
      }
    });
  };

  const handleDeleteUser = (id: number) => {
    setConfirmModal({
      isOpen: true,
      message: 'Are you sure you want to delete this user?',
      onConfirm: async () => {
        setConfirmModal({ isOpen: false, message: '', onConfirm: () => {} });
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/${id}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${tokens?.accessToken}`,
            },
          });

          if (response.ok) {
            setUsers(users.filter(u => u.user_id !== id));
            setNotification({ message: 'User deleted successfully', type: 'success' });
          } else {
            setNotification({ message: 'Error deleting user', type: 'info' });
          }
        } catch (error) {
          console.error('Error:', error);
          setNotification({ message: 'Error deleting user', type: 'info' });
        }
      }
    });
  };

  const handleCancelBooking = async (id: number, type: 'expired' | 'cancelled' | 'active') => {
    const messages = {
      expired: 'Are you sure you want to delete this expired booking permanently?',
      cancelled: 'Are you sure you want to delete this cancelled booking permanently?',
      active: 'Confirm Action\nAre you sure you want to cancel this booking permanently?'
    };

    setConfirmModal({
      isOpen: true,
      message: messages[type],
      onConfirm: async () => {
        setConfirmModal({ isOpen: false, message: '', onConfirm: () => {} });
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/bookings/${id}`, {
            method: 'DELETE',
          });

          if (response.ok) {
            setNotification({ message: type === 'active' ? "Booking cancelled successfully" : "Booking deleted successfully", type: 'success' });
            fetchBookings();
          } else {
            setNotification({ message: type === 'active' ? "Error cancelling booking" : "Error deleting booking", type: 'info' });
          }
        } catch (error) {
          console.error('Error:', error);
          setNotification({ message: type === 'active' ? "Error cancelling booking" : "Error deleting booking", type: 'info' });
        }
      }
    });
  };

  const handleDeleteBooking = async (id: number) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/bookings/delete/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setNotification({ message: "Booking deleted successfully", type: 'success' });
        // The socket event will handle removing from UI
      } else {
        setNotification({ message: "Error deleting booking", type: 'info' });
      }
    } catch (error) {
      console.error('Error:', error);
      setNotification({ message: "Error deleting booking", type: 'info' });
    }
  };

  const handleDeleteSelectedBookings = async () => {
    if (selectedBookings.length === 0) {
      setNotification({ message: 'No bookings selected', type: 'info' });
      return;
    }

    const filterMessages = {
      all: 'Are you sure you want to delete all bookings?',
      past: 'Are you sure you want to delete all past bookings?',
      today: 'Are you sure you want to delete all today bookings?',
      future: 'Are you sure you want to delete all future bookings?',
      cancelled: 'Are you sure you want to delete all cancelled bookings?'
    };

    setConfirmModal({
      isOpen: true,
      message: filterMessages[bookingFilter],
      onConfirm: async () => {
        setConfirmModal({ isOpen: false, message: '', onConfirm: () => {} });

        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/bookings/super-admin/bulk-delete`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              booking_ids: selectedBookings
            }),
          });

          if (response.ok) {
            const data = await response.json();
            setNotification({ message: `${data.deletedCount} bookings deleted successfully!`, type: 'success' });
            // Remove deleted bookings from state
            setBookings(bookings.filter(b => !selectedBookings.includes(b.booking_id)));
            // Clear selection
            setSelectedBookings([]);
            setSelectAll(false);
          } else {
            setNotification({ message: 'Error deleting bookings', type: 'info' });
          }
        } catch (error) {
          console.error('Error deleting bookings:', error);
          setNotification({ message: 'Error deleting bookings', type: 'info' });
        }
      }
    });
  };

  const handleSelectBooking = (bookingId: number, checked: boolean) => {
    if (checked) {
      setSelectedBookings(prev => [...prev, bookingId]);
    } else {
      setSelectedBookings(prev => prev.filter(id => id !== bookingId));
      setSelectAll(false);
    }
  };

  const handleSelectRating = (ratingId: number, checked: boolean) => {
    if (checked) {
      setSelectedRatings(prev => [...prev, ratingId]);
    } else {
      setSelectedRatings(prev => prev.filter(id => id !== ratingId));
      setSelectAllRatings(false);
    }
  };

  const handleSelectAllRatings = (checked: boolean) => {
    if (checked) {
      const allRatingIds = ratings.map(rating => rating.id);
      setSelectedRatings(allRatingIds);
      setSelectAllRatings(true);
      setShowRatingCheckboxes(true);
    } else {
      setSelectedRatings([]);
      setSelectAllRatings(false);
      setShowRatingCheckboxes(false);
    }
  };

  const handleSelectFutsal = (futsalId: number, checked: boolean) => {
    if (checked) {
      setSelectedFutsals(prev => [...prev, futsalId]);
    } else {
      setSelectedFutsals(prev => prev.filter(id => id !== futsalId));
      setSelectAllFutsals(false);
    }
  };

  const handleSelectAllFutsals = (checked: boolean) => {
    if (checked) {
      const allFutsalIds = futsals.map(futsal => futsal.futsal_id);
      setSelectedFutsals(allFutsalIds);
      setSelectAllFutsals(true);
      setShowFutsalCheckboxes(true);
    } else {
      setSelectedFutsals([]);
      setSelectAllFutsals(false);
      setShowFutsalCheckboxes(false);
    }
  };

  const handleSelectFutsalAdmin = (adminId: number, checked: boolean) => {
    if (checked) {
      setSelectedFutsalAdmins(prev => [...prev, adminId]);
    } else {
      setSelectedFutsalAdmins(prev => prev.filter(id => id !== adminId));
      setSelectAllFutsalAdmins(false);
    }
  };

  const handleSelectAllFutsalAdmins = (checked: boolean) => {
    if (checked) {
      const allAdminIds = futsalAdmins.map(admin => admin.id);
      setSelectedFutsalAdmins(allAdminIds);
      setSelectAllFutsalAdmins(true);
      setShowFutsalAdminCheckboxes(true);
    } else {
      setSelectedFutsalAdmins([]);
      setSelectAllFutsalAdmins(false);
      setShowFutsalAdminCheckboxes(false);
    }
  };

  const handleSelectUser = (userId: number, checked: boolean) => {
    if (checked) {
      setSelectedUsers(prev => [...prev, userId]);
    } else {
      setSelectedUsers(prev => prev.filter(id => id !== userId));
      setSelectAllUsers(false);
    }
  };

  const handleSelectAllUsers = (checked: boolean) => {
    if (checked) {
      const allUserIds = users.map(user => user.user_id);
      setSelectedUsers(allUserIds);
      setSelectAllUsers(true);
      setShowUserCheckboxes(true);
    } else {
      setSelectedUsers([]);
      setSelectAllUsers(false);
      setShowUserCheckboxes(false);
    }
  };

  const handleSelectBlockedUser = (userId: number, checked: boolean) => {
    if (checked) {
      setSelectedBlockedUsers(prev => [...prev, userId]);
    } else {
      setSelectedBlockedUsers(prev => prev.filter(id => id !== userId));
      setSelectAllBlockedUsers(false);
    }
  };

  const handleSelectAllBlockedUsers = (checked: boolean) => {
    if (checked) {
      const allBlockedUserIds = blockedUsers.map(user => user.user_id);
      setSelectedBlockedUsers(allBlockedUserIds);
      setSelectAllBlockedUsers(true);
      setShowBlockedUserCheckboxes(true);
    } else {
      setSelectedBlockedUsers([]);
      setSelectAllBlockedUsers(false);
      setShowBlockedUserCheckboxes(false);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const visibleBookings = bookings
        .filter((booking) => {
          const category = categorizeBooking(booking);
          const matchesSearch = searchTerm === '' || booking.first_name.toLowerCase().includes(searchTerm.toLowerCase()) || (booking.user_phone && booking.user_phone.toLowerCase().includes(searchTerm.toLowerCase())) || (booking.team_name && booking.team_name.toLowerCase().includes(searchTerm.toLowerCase()));
          const matchesFutsal = futsalFilter === '' || booking.futsal_id.toString() === futsalFilter;
          const matchesCategory = bookingFilter === 'all' || (bookingFilter === 'cancelled' ? !!booking.cancelled_by : category === bookingFilter);
          return matchesSearch && matchesFutsal && matchesCategory;
        })
        .map(booking => booking.booking_id);
      setSelectedBookings(visibleBookings);
      setSelectAll(true);
      setShowCheckboxes(true);
    } else {
      setSelectedBookings([]);
      setSelectAll(false);
      setShowCheckboxes(false);
    }
  };

  const handleUpdateRating = async (ratingId: number, rating: number, comment: string, users?: string, users_type?: string) => {
    try {
      const body: any = { rating, comment, admin_type: 'super_admin' };
      if (users !== undefined) {
        body.users = users;
      }
      if (users_type !== undefined) {
        body.users_type = users_type;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/ratings/${ratingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        setRatings(ratings.map(r => r.id === ratingId ? { ...r, rating, comment, users, users_type: 'super admin updated', display_name: users } : r));
        setFullRatings(fullRatings.map(r => r.id === ratingId ? { ...r, rating, comment, users, users_type: 'super admin updated', display_name: users } : r));
        setNotification({ message: "Rating updated successfully", type: 'success' });
        setEditingRating(null);
      } else {
        const errorData = await response.json();
        setNotification({ message: errorData.message || 'Error updating rating', type: 'info' });
      }
    } catch (error) {
      console.error('Error updating rating:', error);
      setNotification({ message: "Error updating rating", type: 'info' });
    }
  };

  const handleDeleteRating = (id: number) => {
    setConfirmModal({
      isOpen: true,
      message: 'Are you sure you want to delete this rating?',
      onConfirm: async () => {
        setConfirmModal({ isOpen: false, message: '', onConfirm: () => {} });
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/ratings/${id}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${tokens?.accessToken}`,
            },
          });

          if (response.ok) {
            setRatings(ratings.filter(r => r.id !== id));
            setFullRatings(fullRatings.filter(r => r.id !== id));
            setNotification({ message: "Rating deleted successfully", type: 'success' });
          } else {
            setNotification({ message: "Error deleting rating", type: 'info' });
          }
        } catch (error) {
          console.error('Error:', error);
          setNotification({ message: "Error deleting rating", type: 'info' });
        }
      }
    });
  };

  const handleDeleteSelectedRatings = async () => {
    if (selectedRatings.length === 0) {
      setNotification({ message: 'No ratings selected', type: 'info' });
      return;
    }

    setConfirmModal({
      isOpen: true,
      message: `Are you sure you want to delete ${selectedRatings.length} selected rating${selectedRatings.length > 1 ? 's' : ''}?`,
      onConfirm: async () => {
        setConfirmModal({ isOpen: false, message: '', onConfirm: () => {} });

        try {
          const deletePromises = selectedRatings.map(ratingId =>
            fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/ratings/${ratingId}`, {
              method: 'DELETE',
            })
          );

          const results = await Promise.all(deletePromises);
          const successfulDeletes = results.filter(response => response.ok).length;

          if (successfulDeletes > 0) {
            setRatings(ratings.filter(r => !selectedRatings.includes(r.id)));
            setFullRatings(fullRatings.filter(r => !selectedRatings.includes(r.id)));
            setSelectedRatings([]);
            setSelectAllRatings(false);
            setShowRatingCheckboxes(false);
            setNotification({ message: `${successfulDeletes} rating${successfulDeletes > 1 ? 's' : ''} deleted successfully!`, type: 'success' });
          } else {
            setNotification({ message: 'Error deleting ratings', type: 'info' });
          }
        } catch (error) {
          console.error('Error deleting ratings:', error);
          setNotification({ message: 'Error deleting ratings', type: 'info' });
        }
      }
    });
  };

  const handleDeleteSelectedFutsals = async () => {
    if (selectedFutsals.length === 0) {
      setNotification({ message: 'No futsals selected', type: 'info' });
      return;
    }

    setConfirmModal({
      isOpen: true,
      message: `Are you sure you want to delete ${selectedFutsals.length} selected futsal${selectedFutsals.length > 1 ? 's' : ''}?`,
      onConfirm: async () => {
        setConfirmModal({ isOpen: false, message: '', onConfirm: () => {} });

        try {
          const deletePromises = selectedFutsals.map(futsalId =>
            fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/futsals/${futsalId}`, {
              method: 'DELETE',
            })
          );

          const results = await Promise.all(deletePromises);
          const successfulDeletes = results.filter(response => response.ok).length;

          if (successfulDeletes > 0) {
            setFutsals(futsals.filter(f => !selectedFutsals.includes(f.futsal_id)));
            setSelectedFutsals([]);
            setSelectAllFutsals(false);
            setShowFutsalCheckboxes(false);
            setNotification({ message: `${successfulDeletes} futsal${successfulDeletes > 1 ? 's' : ''} deleted successfully!`, type: 'success' });
          } else {
            setNotification({ message: 'Error deleting futsals', type: 'info' });
          }
        } catch (error) {
          console.error('Error deleting futsals:', error);
          setNotification({ message: 'Error deleting futsals', type: 'info' });
        }
      }
    });
  };

  const handleDeleteSelectedFutsalAdmins = async () => {
    if (selectedFutsalAdmins.length === 0) {
      setNotification({ message: 'No futsal admins selected', type: 'info' });
      return;
    }

    setConfirmModal({
      isOpen: true,
      message: `Are you sure you want to delete ${selectedFutsalAdmins.length} selected futsal admin${selectedFutsalAdmins.length > 1 ? 's' : ''}?`,
      onConfirm: async () => {
        setConfirmModal({ isOpen: false, message: '', onConfirm: () => {} });

        try {
          const deletePromises = selectedFutsalAdmins.map(adminId =>
            fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/futsal-admins/${adminId}`, {
              method: 'DELETE',
            })
          );

          const results = await Promise.all(deletePromises);
          const successfulDeletes = results.filter(response => response.ok).length;

          if (successfulDeletes > 0) {
            setFutsalAdmins(futsalAdmins.filter(a => !selectedFutsalAdmins.includes(a.id)));
            setSelectedFutsalAdmins([]);
            setSelectAllFutsalAdmins(false);
            setShowFutsalAdminCheckboxes(false);
            setNotification({ message: `${successfulDeletes} futsal admin${successfulDeletes > 1 ? 's' : ''} deleted successfully!`, type: 'success' });
          } else {
            setNotification({ message: 'Error deleting futsal admins', type: 'info' });
          }
        } catch (error) {
          console.error('Error deleting futsal admins:', error);
          setNotification({ message: 'Error deleting futsal admins', type: 'info' });
        }
      }
    });
  };

  const handleDeleteSelectedUsers = async () => {
    if (selectedUsers.length === 0) {
      setNotification({ message: 'No users selected', type: 'info' });
      return;
    }

    setConfirmModal({
      isOpen: true,
      message: `Are you sure you want to delete ${selectedUsers.length} selected user${selectedUsers.length > 1 ? 's' : ''}?`,
      onConfirm: async () => {
        setConfirmModal({ isOpen: false, message: '', onConfirm: () => {} });

        try {
          const deletePromises = selectedUsers.map(userId =>
            fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/${userId}`, {
              method: 'DELETE',
            })
          );

          const results = await Promise.all(deletePromises);
          const successfulDeletes = results.filter(response => response.ok).length;

          if (successfulDeletes > 0) {
            setUsers(users.filter(u => !selectedUsers.includes(u.user_id)));
            setSelectedUsers([]);
            setSelectAllUsers(false);
            setShowUserCheckboxes(false);
            setNotification({ message: `${successfulDeletes} user${successfulDeletes > 1 ? 's' : ''} deleted successfully!`, type: 'success' });
          } else {
            setNotification({ message: 'Error deleting users', type: 'info' });
          }
        } catch (error) {
          console.error('Error deleting users:', error);
          setNotification({ message: 'Error deleting users', type: 'info' });
        }
      }
    });
  };

  const handleUnblockSelectedUsers = async () => {
    if (selectedBlockedUsers.length === 0) {
      setNotification({ message: 'No blocked users selected', type: 'info' });
      return;
    }

    setConfirmModal({
      isOpen: true,
      message: `Are you sure you want to unblock ${selectedBlockedUsers.length} selected user${selectedBlockedUsers.length > 1 ? 's' : ''}?`,
      onConfirm: async () => {
        setConfirmModal({ isOpen: false, message: '', onConfirm: () => {} });

        try {
          const unblockPromises = selectedBlockedUsers.map(userId =>
            fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/${userId}/unblock`, {
              method: 'POST',
            })
          );

          const results = await Promise.all(unblockPromises);
          const successfulUnblocks = results.filter(response => response.ok).length;

          if (successfulUnblocks > 0) {
            setBlockedUsers(blockedUsers.filter(u => !selectedBlockedUsers.includes(u.user_id)));
            setSelectedBlockedUsers([]);
            setSelectAllBlockedUsers(false);
            setShowBlockedUserCheckboxes(false);
            setNotification({ message: `${successfulUnblocks} user${successfulUnblocks > 1 ? 's' : ''} unblocked successfully!`, type: 'success' });
            fetchUsers(); // Refresh users list
          } else {
            setNotification({ message: 'Error unblocking users', type: 'info' });
          }
        } catch (error) {
          console.error('Error unblocking users:', error);
          setNotification({ message: 'Error unblocking users', type: 'info' });
        }
      }
    });
  };

  const fetchSlots = async (futsalId: number, date: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/time-slots/admin/futsal/${futsalId}/date/${date}`, {
        headers: {
          'Authorization': `Bearer ${tokens?.accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const data = await response.json();
        const futsalName = futsals.find(f => f.futsal_id === futsalId)?.name || 'Unknown Futsal';
        const slotsWithFutsal = data.slots.map((slot: any) => ({
          ...slot,
          futsal_name: futsalName
        }));
        setSlots(slotsWithFutsal);
      } else if (response.status === 401) {
        // Token expired or invalid, redirect to login
        router.push('/super-admin/signin');
      }
    } catch (error) {
      console.error('Error fetching slots:', error);
    }
  };

  const fetchAllSlots = async () => {
    try {
      // Fetch slots for all futsals for current date only
      const currentDate = new Date().toLocaleDateString('en-CA');
      const allSlots: any[] = [];
      for (const futsal of futsals) {
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/time-slots/admin/futsal/${futsal.futsal_id}/date/${currentDate}`, {
            headers: {
              'Authorization': `Bearer ${tokens?.accessToken}`,
              'Content-Type': 'application/json'
            }
          });
          if (response.ok) {
            const data = await response.json();
            // Add futsal name to each slot
            const slotsWithFutsal = data.slots.map((slot: any) => ({
              ...slot,
              futsal_name: futsal.name
            }));
            allSlots.push(...slotsWithFutsal);
          } else if (response.status === 401) {
            // Token expired or invalid, redirect to login
            router.push('/super-admin/signin');
            return;
          }
        } catch (error) {
          console.error(`Error fetching slots for futsal ${futsal.futsal_id}:`, error);
        }
      }
      setSlots(allSlots);
    } catch (error) {
      console.error('Error fetching all slots:', error);
    }
  };

  const closeAllSlots = () => {
    // Check current status of slots to determine action
    const availableSlots = slots.filter(slot => slot.status === 'available').length;
    const disabledSlots = slots.filter(slot => slot.status === 'disabled').length;
    const shouldClose = availableSlots > disabledSlots; // If more available than disabled, close them

    const action = shouldClose ? 'close' : 'open';
    const confirmMessage = selectedFutsal
      ? `Are you sure you want to ${action} all ${shouldClose ? 'available' : 'disabled'} slots for this futsal on this date?`
      : `Are you sure you want to ${action} all ${shouldClose ? 'available' : 'disabled'} slots across all futsals?`;

    setConfirmModal({
      isOpen: true,
      message: confirmMessage,
      onConfirm: async () => {
        setConfirmModal({ isOpen: false, message: '', onConfirm: () => {} });
        try {
          let response;
          if (selectedFutsal) {
            response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/time-slots/futsal/${selectedFutsal}/date/${slotDate}/${action}-all`, {
              method: 'PUT',
            });
          } else {
            response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/time-slots/${action}-all-available`, {
              method: 'PUT',
            });
          }

          if (response.ok) {
            const data = await response.json();
            setNotification({ message: `${data.updatedSlots} slots ${action}d successfully`, type: 'success' });
            // Refresh slots to show updated status
            if (selectedFutsal) {
              fetchSlots(selectedFutsal, slotDate);
            } else {
              fetchAllSlots();
            }
          } else {
            setNotification({ message: `Error ${action}ing slots`, type: 'info' });
          }
        } catch (error) {
          console.error(`Error ${action}ing all slots:`, error);
          setNotification({ message: `Error ${action === 'close' ? 'closing' : 'opening'} slots`, type: 'info' });
        }
      }
    });
  };

  const toggleSlotStatus = async (slotId: number, currentStatus: string) => {
    if (currentStatus === 'booked') {
      setNotification({ message: "Cannot modify status of booked slots", type: 'info' });
      return;
    }

    const newStatus = currentStatus === 'available' ? 'disabled' : 'available';

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/time-slots/${slotId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        setSlots(slots.map(slot =>
          slot.slot_id === slotId ? { ...slot, status: newStatus } : slot
        ));
      } else {
        setNotification({ message: "Error updating slot status", type: 'info' });
      }
    } catch (error) {
      console.error('Error updating slot status:', error);
      setNotification({ message: "Error updating slot status", type: 'info' });
    }
  };

  const handleBlockUser = (userId: number) => {
    setBlockReasonModal({
      isOpen: true,
      userId,
      onConfirm: async (reason: string) => {
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/${userId}/block`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${tokens?.accessToken}`,
            },
            body: JSON.stringify({ reason }),
          });

          if (response.ok) {
            const data = await response.json();
            setNotification({ message: `User blocked until ${new Date(data.blocked_until).toLocaleString()}`, type: 'success' });
            fetchUsers();
            fetchBlockedUsers();
          } else {
            setNotification({ message: 'Error blocking user', type: 'info' });
          }
        } catch (error) {
          console.error('Error blocking user:', error);
          setNotification({ message: 'Error blocking user', type: 'info' });
        }
        setBlockReasonModal({ isOpen: false, userId: 0, onConfirm: () => {} });
      }
    });
  };

  const handleUnblockUser = (userId: number) => {
    setConfirmModal({
      isOpen: true,
      message: 'Are you sure you want to unblock this user?',
      onConfirm: async () => {
        setConfirmModal({ isOpen: false, message: '', onConfirm: () => {} });
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/${userId}/unblock`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${tokens?.accessToken}`,
            },
          });

          if (response.ok) {
            setNotification({ message: 'User unblocked successfully', type: 'success' });
            fetchUsers();
            fetchBlockedUsers();
          } else {
            setNotification({ message: 'Error unblocking user', type: 'info' });
          }
        } catch (error) {
          console.error('Error unblocking user:', error);
          setNotification({ message: 'Error unblocking user', type: 'info' });
        }
      }
    });
  };

  const handleLogout = () => {
    setConfirmModal({
      isOpen: true,
      message: 'Are you sure you want to logout?',
      onConfirm: () => {
        setConfirmModal({ isOpen: false, message: '', onConfirm: () => {} });
        sessionStorage.removeItem('superadmin');
        router.push('/super-admin/signin');
      }
    });
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-green-50 via-white to-blue-50">
      <header className="sticky top-0 z-50 bg-linear-to-r from-gray-900 via-green-900 to-blue-900 backdrop-blur-md shadow-2xl border-b border-green-500/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="relative">
                <img src="/logo/logo.png" alt="BookMyFutsal" className="h-12 w-12 rounded-lg shadow-lg ring-2 ring-green-400/50" />
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-lg animate-pulse"></div>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-white drop-shadow-lg">
                <span className="bg-linear-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">BookMy</span>
                <span className="text-white">Futsal</span>
              </h1>
            </div>

            {/* Welcome Message */}
            <div className="hidden md:flex items-center space-x-4">
              {/* <div className="text-white">
                <p className="text-sm opacity-90">Welcome back,</p>
                <p className="font-semibold">{user?.username}</p>
              </div> */}
              <button
                onClick={handleLogout}
                className="bg-linear-to-r from-red-500 to-red-600 text-white font-bold py-2.5 px-6 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 border border-red-400/30 hover:border-red-400/50"
              >
                <svg className="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </button>
            </div>

            {/* Mobile Logout Button */}
            <button
              onClick={handleLogout}
              className="md:hidden p-2 rounded-lg text-gray-200 hover:text-green-400 hover:bg-green-900/50 transition-all duration-300 border border-gray-600/30"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="space-y-6">
            {/* Dashboard Info */}
            <div className="relative bg-white rounded-2xl shadow-2xl overflow-hidden transform transition-all duration-500 hover:scale-[1.02]">
              {/* Gradient Background */}
              <div className="absolute inset-0 bg-linear-to-br from-green-50 via-white to-blue-50 opacity-50"></div>

              {/* Content */}
              <div className="relative p-2 sm:p-8">
                {/* Header */}
                <div className="text-center mb-6">
                  <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 bg-linear-to-br from-green-500 to-green-600 rounded-lg mb-3 shadow-lg">
                    <svg className="w-6 h-6 sm:w-7 sm:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-bold bg-linear-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-2">
                    Super Admin Dashboard
                  </h2>
                  <p className="text-gray-600 text-sm">
                    Manage your futsal platform with full administrative control
                  </p>
                </div>

                {!editingSuperAdmin ? (
                  <>
                    <div className="space-y-4">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">Welcome back, {user?.username || ''}!</h3>
                            <p className="text-gray-600 mt-1">You are logged in as a Super Administrator</p>
                          </div>
                          <button
                            onClick={() => setEditingSuperAdmin(true)}
                            className="bg-linear-to-r from-green-500 to-green-600 text-white font-semibold py-2 px-4 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 border border-green-400/30 hover:border-green-400/50"
                          >
                            <svg className="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Edit
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <div className="flex items-center">
                            <svg className="w-8 h-8 text-blue-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            <div>
                              <p className="text-sm font-medium text-blue-800">Username</p>
                              <p className="text-lg font-bold text-blue-900">{user?.username || ''}</p>
                            </div>
                          </div>
                        </div>

                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                          <div className="flex items-center">
                            <svg className="w-8 h-8 text-green-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            <div>
                              <p className="text-sm font-medium text-green-800">Email</p>
                              <p className="text-lg font-bold text-green-900">{user?.email || ''}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  user && <EditSuperAdminForm
                    user={user}
                    onUpdate={(updatedUser) => {
                      setUser(updatedUser);
                      setEditingSuperAdmin(false);
                      setNotification({ message: 'Profile updated successfully!', type: 'success' });
                    }}
                    onCancel={() => setEditingSuperAdmin(false)}
                    setNotification={setNotification}
                  />
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              <button
                onClick={() => setShowCreateFutsal(!showCreateFutsal)}
                className="bg-linear-to-r from-blue-500 to-blue-600 text-white font-bold py-3 px-4 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 border border-blue-400/30 hover:border-blue-400/50 text-sm sm:text-base"
              >
                {showCreateFutsal ? 'Hide' : 'Create Futsal'}
              </button>
              <button
                onClick={() => setShowCreateAdmin(!showCreateAdmin)}
                className="bg-linear-to-r from-green-500 to-green-600 text-white font-bold py-3 px-4 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 border border-green-400/30 hover:border-green-400/50 text-sm sm:text-base"
              >
                {showCreateAdmin ? 'Hide' : 'Create Admin'}
              </button>
              <button
                onClick={() => setShowBookings(!showBookings)}
                className="bg-linear-to-r from-purple-500 to-purple-600 text-white font-bold py-3 px-4 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 border border-purple-400/30 hover:border-purple-400/50 text-sm sm:text-base"
              >
                {showBookings ? 'Hide Bookings' : 'Manage Bookings'}
              </button>
              <button
                onClick={() => setShowSlots(!showSlots)}
                className="bg-linear-to-r from-orange-500 to-orange-600 text-white font-bold py-3 px-4 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 border border-orange-400/30 hover:border-orange-400/50 text-sm sm:text-base"
              >
                {showSlots ? 'Hide Slots' : 'Manage Slots'}
              </button>
              <button
                onClick={() => setShowRatings(!showRatings)}
                className="bg-linear-to-r from-pink-500 to-pink-600 text-white font-bold py-3 px-4 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 border border-pink-400/30 hover:border-pink-400/50 text-sm sm:text-base"
              >
                {showRatings ? 'Hide Ratings' : 'Manage Ratings'}
              </button>
            </div>

            {/* Create Futsal Form */}
            {showCreateFutsal && <CreateFutsalForm onSuccess={fetchFutsals} setNotification={setNotification} />}

            {/* Create Futsal Admin Form */}
            {showCreateAdmin && user && <CreateFutsalAdminForm futsals={futsals} superAdminId={user.id} setNotification={setNotification} tokens={tokens} />}

            {/* Slot Management */}
            {showSlots && (
              <div className="border-2  border-gray-200 rounded-lg p-2">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-semibold text-gray-900">Slot Management</h3>
                  <div className="flex space-x-4">
                    <button
                      onClick={closeAllSlots}
                      className={`${(() => {
                        const availableSlots = slots.filter(slot => slot.status === 'available').length;
                        const disabledSlots = slots.filter(slot => slot.status === 'disabled').length;
                        return availableSlots > disabledSlots ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700';
                      })()} text-white px-4 py-2 rounded`}
                    >
                      {(() => {
                        const availableSlots = slots.filter(slot => slot.status === 'available').length;
                        const disabledSlots = slots.filter(slot => slot.status === 'disabled').length;
                        return availableSlots > disabledSlots ? (selectedFutsal ? 'Close All' : 'Close All ') : (selectedFutsal ? 'Open All ' : 'Open All ');
                      })()}
                    </button>
                    <button
                      onClick={() => setShowSlots(false)}
                      className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded"
                    >
                      Hide
                    </button>
                  </div>
                </div>
                <div className="mb-4 flex items-center space-x-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Select Futsal (Optional)</label>
                    <select
                      value={selectedFutsal || ''}
                      onChange={(e) => setSelectedFutsal(e.target.value ? Number(e.target.value) : null)}
                      className="p-2 border rounded"
                    >
                      <option value="">All Futsals</option>
                      {futsals.map((futsal) => (
                        <option key={futsal.futsal_id} value={futsal.futsal_id}>
                          {futsal.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  {selectedFutsal && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Select Date</label>
                      <input
                        type="date"
                        value={slotDate}
                        onChange={(e) => setSlotDate(e.target.value)}
                        className="p-2 border rounded"
                      />
                    </div>
                  )}
                </div>

                {/* Group slots by futsal and date */}
                {Object.entries(
                  slots.reduce((acc: Record<string, any[]>, slot: any) => {
                    const formattedDate = formatDate(slot.slot_date);
                    const key = `${slot.futsal_name || 'Unknown Futsal'} - ${formattedDate}`;
                    if (!acc[key]) acc[key] = [];
                    acc[key].push(slot);
                    return acc;
                  }, {} as Record<string, any[]>)
                ).map(([futsalDate, futsalSlots]) => (
                  <div key={futsalDate} className="mb-6">
                    <h4 className="text-lg font-semibold mb-3">{futsalDate}</h4>
                    <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {futsalSlots.map((slot) => (
                        <div
                          key={slot.slot_id}
                          className={`p-2 border rounded ${slot.display_status === 'booked'
                              ? 'bg-red-100 border-red-500'
                              : slot.display_status === 'expired'
                                ? 'bg-yellow-100 border-yellow-500'
                                : slot.status === 'disabled'
                                  ? 'bg-gray-100 border-gray-500'
                                  : 'bg-green-100 border-green-500'
                            }`}
                        >
                          <div className="font-semibold text-center mb-2 md:mb-2 text-sm md:text-base">
                            {formatTimeSlot(slot.start_time)} - {formatTimeSlot(slot.end_time)} {
                              slot.display_status === 'booked' ? 'Booked' :
                                slot.display_status === 'expired' ? 'Expired' :
                                  slot.status === 'disabled' ? 'Disabled' : 'Available'
                            }
                          </div>
                          <div className="text-sm text-center text-gray-600 mb-2">{slot.shift_category}</div>
                          {slot.display_status === 'booked' && (
                            <div className="text-xs text-center text-gray-500 mb-2">
                              Booked by {slot.booker_name || 'User'}
                            </div>
                          )}
                          <div className="flex space-x-2">
                            <button
                              onClick={() => toggleSlotStatus(slot.slot_id, slot.status)}
                              disabled={slot.display_status === 'booked' || slot.display_status === 'expired'}
                              className={`flex-1 px-3 py-1 rounded text-sm ${slot.status === 'available'
                                  ? 'bg-red-600 hover:bg-red-700 text-white'
                                  : 'bg-green-600 hover:bg-green-700 text-white'
                                } disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                              {slot.status === 'available' ? 'Close Slot' : 'Open Slot'}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!showSlots && (
              <div className="border-2  border-gray-200 rounded-lg p-2">
                <div className="text-center">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Slot Management</h3>
                  <button
                    onClick={() => setShowSlots(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
                  >
                    Show All Slots
                  </button>
                </div>
              </div>
            )}

            {/* Futsals List */}
            <div className="border-2  border-gray-200 rounded-lg p-2">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-900">Futsals</h3>
                <button
                  onClick={() => {
                    if (!showFutsals) {
                      fetchFutsals(); // Fetch futsals when showing
                    }
                    setShowFutsals(!showFutsals);
                  }}
                  className="bg-linear-to-r from-blue-500 to-blue-600 text-white font-bold py-2.5 px-6 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 border border-blue-400/30 hover:border-blue-400/50"
                >
                  {showFutsals ? 'Hide Futsals' : 'Show Futsals'}
                </button>
              </div>

              {showFutsals && (
                <>
                  {/* Select All and Delete Controls for Futsals */}
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="selectAllFutsals"
                          checked={selectAllFutsals}
                          onChange={(e) => handleSelectAllFutsals(e.target.checked)}
                          className="mr-2"
                        />
                        <label htmlFor="selectAllFutsals" className="text-sm font-medium text-gray-700">
                          Select All Futsals ({selectedFutsals.length} selected)
                        </label>
                      </div>
                      {selectedFutsals.length > 0 && (
                        <button
                          onClick={handleDeleteSelectedFutsals}
                          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                        >
                          Delete Selected ({selectedFutsals.length})
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="mb-4 relative">
                    <input
                      type="text"
                      placeholder="Search by futsal name..."
                      onChange={(e) => {
                        const searchTerm = e.target.value.toLowerCase();
                        if (searchTerm === '') {
                          fetchFutsals(); // Reset to full list
                        } else {
                          const filtered = futsals.filter(futsal =>
                            futsal.name.toLowerCase().includes(searchTerm)
                          );
                          setFutsals(filtered);
                        }
                      }}
                      className="w-full p-2 border border-gray-400 rounded resize-none focus:outline-none focus:ring-0 focus:border-gray-900 focus:border pr-10"
                    />
                    <button
                      onClick={() => {
                        fetchFutsals(); // Reset to full list
                      }}
                      className="absolute right-2 top-2 text-gray-500 hover:text-gray-700"
                      title="Clear search"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="space-y-4">
                    {futsals.map((futsal) => (
                      <div key={futsal.futsal_id} className="border rounded p-4">
                        {editingFutsalId === futsal.futsal_id ? (
                          <EditFutsalForm
                            futsal={futsal}
                            onUpdate={(data) => {
                              fetchFutsals();
                              setEditingFutsalId(null);
                              setNotification({ message: 'Futsal updated successfully', type: 'success' });
                            }}
                            onCancel={() => setEditingFutsalId(null)}
                            setNotification={setNotification}
                          />
                        ) : (
                          <div className="flex flex-col md:flex-row md:justify-between md:items-start">
                            <div className="flex-1">
                              <div className="flex items-center mb-2">
                                {showFutsalCheckboxes && (
                                  <input
                                    type="checkbox"
                                    checked={selectedFutsals.includes(futsal.futsal_id)}
                                    onChange={(e) => handleSelectFutsal(futsal.futsal_id, e.target.checked)}
                                    className="mr-3"
                                  />
                                )}
                                <h4 className="font-bold">{futsal.name}</h4>
                              </div>
                              <p>{futsal.location}, {futsal.city}</p>
                              {futsal.price_per_hour && <p>Price: Rs. {futsal.price_per_hour}/hour</p>}
                              {futsal.game_format && <p>Game Format: {futsal.game_format}</p>}
                              {futsal.facilities && futsal.facilities.length > 0 && (
                                <p>Facilities: {futsal.facilities.slice(0, 3).join(', ')}{futsal.facilities.length > 3 && ` +${futsal.facilities.length - 3} more`}</p>
                              )}
                              {futsal.opening_hours && futsal.closing_hours && (
                                <p>Hours: {formatTime(futsal.opening_hours)} - {formatTime(futsal.closing_hours)}</p>
                              )}
                              {futsal.images && futsal.images.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-2">
                                  {futsal.images.slice(0, 3).map((img, index) => (
                                    <img key={index} src={`${process.env.NEXT_PUBLIC_API_URL}/uploads/${img}`} alt={`${futsal.name} ${index + 1}`} className="w-16 h-16 object-cover" />
                                  ))}
                                  {futsal.images.length > 3 && <span className="text-sm text-gray-500">+{futsal.images.length - 3} more</span>}
                                </div>
                              )}
                              {futsal.video && (
                                <div className="mt-2">
                                  <video controls className="w-32 h-18">
                                    <source src={`${process.env.NEXT_PUBLIC_API_URL}/uploads/${futsal.video}`} type="video/mp4" />
                                  </video>
                                </div>
                              )}
                            </div>
                            <div className="flex space-x-2 mt-4 md:ml-4 md:mt-0">
                              <button
                                onClick={() => setViewingFutsalDetails(futsal)}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded"
                              >
                                Details
                              </button>
                              <button
                                onClick={() => setEditingFutsalId(futsal.futsal_id)}
                                className="bg-linear-to-r from-green-500 to-green-600 text-white px-3 py-1 rounded shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 border border-green-400/30"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteFutsal(futsal.futsal_id)}
                                className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Futsal Admins List */}
            <div className="border-2  border-gray-200 rounded-lg p-2">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-900">Futsal Admins</h3>
                <button
                  onClick={() => {
                    if (!showFutsalAdmins) {
                      fetchFutsalAdmins(); // Fetch admins when showing
                    }
                    setShowFutsalAdmins(!showFutsalAdmins);
                  }}
                  className="bg-linear-to-r from-blue-500 to-blue-600 text-white font-bold py-2.5 px-6 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 border border-blue-400/30 hover:border-blue-400/50"
                >
                  {showFutsalAdmins ? 'Hide Admins' : 'Show Admins'}
                </button>
              </div>

              {showFutsalAdmins && (
                <>
                  {/* Select All and Delete Controls for Futsal Admins */}
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="selectAllFutsalAdmins"
                          checked={selectAllFutsalAdmins}
                          onChange={(e) => handleSelectAllFutsalAdmins(e.target.checked)}
                          className="mr-2"
                        />
                        <label htmlFor="selectAllFutsalAdmins" className="text-sm font-medium text-gray-700">
                          Select All Futsal Admins ({selectedFutsalAdmins.length} selected)
                        </label>
                      </div>
                      {selectedFutsalAdmins.length > 0 && (
                        <button
                          onClick={handleDeleteSelectedFutsalAdmins}
                          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                        >
                          Delete Selected ({selectedFutsalAdmins.length})
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="mb-4 relative">
                    <input
                      type="text"
                      placeholder="Search by username or email..."
                      onChange={(e) => {
                        const searchTerm = e.target.value.toLowerCase();
                        if (searchTerm === '') {
                          fetchFutsalAdmins(); // Reset to full list
                        } else {
                          const filtered = futsalAdmins.filter(admin =>
                            admin.username.toLowerCase().includes(searchTerm) ||
                            admin.email.toLowerCase().includes(searchTerm)
                          );
                          setFutsalAdmins(filtered);
                        }
                      }}
                      className="w-full p-2 border border-gray-400 rounded resize-none focus:outline-none focus:ring-0 focus:border-gray-900 focus:border pr-10"
                    />
                    <button
                      onClick={() => {
                        fetchFutsalAdmins(); // Reset to full list
                      }}
                      className="absolute right-2 top-2 text-gray-500 hover:text-gray-700"
                      title="Clear search"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="space-y-4">
                    {futsalAdmins.map((admin) => (
                      <div key={admin.id} className="border rounded p-4 flex flex-col md:flex-row md:justify-between md:items-center">
                        <div className="flex-1">
                          <div className="flex items-center mb-2">
                            {showFutsalAdminCheckboxes && (
                              <input
                                type="checkbox"
                                checked={selectedFutsalAdmins.includes(admin.id)}
                                onChange={(e) => handleSelectFutsalAdmin(admin.id, e.target.checked)}
                                className="mr-3"
                              />
                            )}
                            <h4 className="font-bold">{admin.username}</h4>
                          </div>
                          <p>{admin.email} - {admin.futsal_name}</p>
                        </div>
                        <div className="flex space-x-2 mt-4 md:ml-4 md:mt-0">
                          <button
                            onClick={() => setEditingAdmin(admin)}
                            className="bg-linear-to-r from-green-500 to-green-600 text-white px-3 py-1 rounded shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 border border-green-400/30"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteFutsalAdmin(admin.id)}
                            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          

            {/* Users List */}
            <div className="border-2  border-gray-200 rounded-lg p-2">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-900">Users</h3>
                <button
                  onClick={() => {
                    if (!showUsers) {
                      fetchUsers(); // Fetch users when showing
                    }
                    setShowUsers(!showUsers);
                  }}
                  className="bg-linear-to-r from-blue-500 to-blue-600 text-white font-bold py-2.5 px-6 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 border border-blue-400/30 hover:border-blue-400/50"
                >
                  {showUsers ? 'Hide Users' : 'Show Users'}
                </button>
              </div>

              {showUsers && (
                <>
                  {/* Select All and Delete Controls for Users */}
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="selectAllUsers"
                          checked={selectAllUsers}
                          onChange={(e) => handleSelectAllUsers(e.target.checked)}
                          className="mr-2"
                        />
                        <label htmlFor="selectAllUsers" className="text-sm font-medium text-gray-700">
                          Select All Users ({selectedUsers.length} selected)
                        </label>
                      </div>
                      {selectedUsers.length > 0 && (
                        <button
                          onClick={handleDeleteSelectedUsers}
                          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                        >
                          Delete Selected ({selectedUsers.length})
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="mb-4 relative">
                    <input
                      type="text"
                      placeholder="Search by name, username, email, or phone..."
                      onChange={(e) => {
                        const searchTerm = e.target.value.toLowerCase();
                        if (searchTerm === '') {
                          fetchUsers(); // Reset to full list
                        } else {
                          const filtered = users.filter(user =>
                            user.first_name.toLowerCase().includes(searchTerm) ||
                            user.last_name.toLowerCase().includes(searchTerm) ||
                            user.username.toLowerCase().includes(searchTerm) ||
                            user.email.toLowerCase().includes(searchTerm) ||
                            user.phone.toLowerCase().includes(searchTerm)
                          );
                          setUsers(filtered);
                        }
                      }}
                      className="w-full p-2 border border-gray-400 rounded resize-none focus:outline-none focus:ring-0 focus:border-gray-900 focus:border pr-10"
                    />
                    <button
                      onClick={() => {
                        fetchUsers(); // Reset to full list
                      }}
                      className="absolute right-2 top-2 text-gray-500 hover:text-gray-700"
                      title="Clear search"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="space-y-4">
                    {users.map((user) => (
                      <div key={user.user_id} className="border rounded p-4 flex flex-col md:flex-row md:justify-between md:items-center">
                        <div className="flex-1">
                          <div className="flex items-center mb-2">
                            {showUserCheckboxes && (
                              <input
                                type="checkbox"
                                checked={selectedUsers.includes(user.user_id)}
                                onChange={(e) => handleSelectUser(user.user_id, e.target.checked)}
                                className="mr-3"
                              />
                            )}
                            <h4 className="font-bold">{user.first_name} {user.last_name}</h4>
                          </div>
                          <p>{user.username} - {user.email} - {user.phone}</p>
                        </div>
                        <div className="flex space-x-2 mt-4 md:ml-4 md:mt-0">
                          <button
                            onClick={() => setEditingUser(user)}
                            className="bg-linear-to-r from-green-500 to-green-600 text-white px-3 py-1 rounded shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 border border-green-400/30"
                          >
                            Edit
                          </button>
                          {blockedUsers.some(b => b.user_id === user.user_id) ? (
                            <button
                              disabled
                              className="bg-gray-500 text-white px-3 py-1 rounded cursor-not-allowed"
                            >
                              Blocked
                            </button>
                          ) : (
                            <button
                              onClick={() => handleBlockUser(user.user_id)}
                              className="bg-orange-600 hover:bg-orange-700 text-white px-3 py-1 rounded"
                            >
                              Block
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteUser(user.user_id)}
                            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Blocked Users List */}
            <div className="border-2  border-gray-200 rounded-lg p-2">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-900">Blocked Users</h3>
                <button
                  onClick={() => {
                    if (!showBlockedUsers) {
                      fetchBlockedUsers(); // Fetch blocked users when showing
                    }
                    setShowBlockedUsers(!showBlockedUsers);
                  }}
                  className="bg-linear-to-r from-blue-500 to-blue-600 text-white font-bold py-2.5 px-6 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 border border-blue-400/30 hover:border-blue-400/50"
                >
                  {showBlockedUsers ? 'Hide Users' : 'Show Users'}
                </button>
              </div>

              {showBlockedUsers && (
                <div className="space-y-4">
                  {blockedUsers.map((blockedUser) => (
                    <div key={blockedUser.block_id} className="border rounded p-4 flex flex-col md:flex-row md:justify-between md:items-center">
                      <div className="flex-1">
                        <h4 className="font-bold">{blockedUser.first_name} {blockedUser.last_name}</h4>
                        <p>{blockedUser.username} - {blockedUser.email}</p>
                        <p className="text-sm text-red-600">Blocked until: {new Date(blockedUser.blocked_until).toLocaleString()}</p>
                        <p className="text-sm text-gray-600">Reason: {blockedUser.reason}</p>
                      </div>
                      <div className="flex space-x-2 mt-4 md:ml-4 md:mt-0">
                        <button
                          onClick={() => handleUnblockUser(blockedUser.user_id)}
                          className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded"
                        >
                          Unblock
                        </button>
                      </div>
                    </div>
                  ))}
                  {blockedUsers.length === 0 && (
                    <p className="text-gray-500 text-center">No blocked users</p>
                  )}
                </div>
              )}
            </div>

            {/* Bookings Management */}
            {showBookings && (
              <div className="border-2  border-gray-200 rounded-lg p-2">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-semibold text-gray-900">All Bookings</h3>
                  {/* <button
                    onClick={fetchBookings}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                  >
                    Refresh
                  </button> */}
                </div>
                <div className="mb-4 space-y-4">
                  <div className="flex flex-col space-y-4 md:flex-row md:space-x-4 md:space-y-0">
                    <div className="flex-1">
                      <input
                        type="text"
                        placeholder="Search by name, phone, or team name..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full p-2 border border-gray-400 rounded resize-none focus:outline-none focus:ring-0 focus:border-gray-900 focus:border pr-10"
                      />
                      <button
                        onClick={() => setSearchTerm('')}
                        className="absolute right-2 top-2 text-gray-500 hover:text-gray-700"
                        title="Clear search"
                      >
                        ✕
                      </button>
                    </div>
                    <div className="w-full md:w-64">
                      <select
                        value={futsalFilter}
                        onChange={(e) => setFutsalFilter(e.target.value)}
                        className="w-full p-2 border border-gray-400 rounded resize-none focus:outline-none focus:ring-0 focus:border-gray-900 focus:border"
                      >
                        <option value="">All Futsals</option>
                        {futsals.map((futsal) => (
                          <option key={futsal.futsal_id} value={futsal.futsal_id}>
                            {futsal.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Filter Buttons */}
                  <div className="grid grid-cols-2 gap-3 mb-4 sm:flex sm:flex-wrap sm:gap-3">
                    {[
                      { key: 'all', label: `All Bookings (${bookings.length})`, icon: '📋' },
                      { key: 'past', label: `Past Bookings (${bookings.filter(b => categorizeBooking(b) === 'past').length})`, icon: '⏰' },
                      { key: 'today', label: `Today Bookings (${bookings.filter(b => categorizeBooking(b) === 'today').length})`, icon: '📅' },
                      { key: 'future', label: `Future Bookings (${bookings.filter(b => categorizeBooking(b) === 'future').length})`, icon: '🔮' },
                      { key: 'cancelled', label: `Cancelled Bookings (${bookings.filter(b => b.cancelled_by).length})`, icon: '❌' }
                    ].map((filter) => (
                      <button
                        key={filter.key}
                        onClick={() => {
                          setBookingFilter(filter.key as 'all' | 'past' | 'today' | 'future' | 'cancelled');
                          setSelectedBookings([]);
                          setSelectAll(false);
                          setShowCheckboxes(false);
                        }}
                        className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 flex items-center gap-2 ${bookingFilter === filter.key
                            ? 'bg-linear-to-r from-green-500 to-green-600 text-white shadow-lg'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                      >
                        <span>{filter.icon}</span>
                        <span className="hidden sm:inline">{filter.label}</span>
                        <span className="sm:hidden">{filter.label.replace(' Bookings', '')}</span>
                      </button>
                    ))}
                  </div>

                  {/* Select All and Delete Controls */}
                  <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="selectAll"
                        checked={selectAll}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        className="mr-2"
                      />
                      <label htmlFor="selectAll" className="text-sm font-medium text-gray-700">
                        Select All ({selectedBookings.length} selected)
                      </label>
                    </div>
                    {selectedBookings.length > 0 && (
                      <button
                        onClick={handleDeleteSelectedBookings}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                      >
                        Delete Selected ({selectedBookings.length})
                      </button>
                    )}
                  </div>

                  {futsalFilter && (
                    <button
                      onClick={() => {
                        fetchBookings(); // Reset to full list
                        setBookingFilter('all');
                        setFutsalFilter('');
                        setSearchTerm('');
                      }}
                      className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded"
                    >
                      Clear Filters
                    </button>
                  )}
                </div>
                <div className="space-y-4">
                  {bookings
                    .filter((booking) => {
                      const category = categorizeBooking(booking);
                      const matchesSearch = searchTerm === '' || booking.first_name.toLowerCase().includes(searchTerm.toLowerCase()) || (booking.user_phone && booking.user_phone.toLowerCase().includes(searchTerm.toLowerCase())) || (booking.team_name && booking.team_name.toLowerCase().includes(searchTerm.toLowerCase()));
                      const matchesFutsal = futsalFilter === '' || booking.futsal_id.toString() === futsalFilter;
                      const matchesCategory = bookingFilter === 'all' || (bookingFilter === 'cancelled' ? !!booking.cancelled_by : category === bookingFilter);
                      return matchesSearch && matchesFutsal && matchesCategory;
                    })
                    .map((booking) => {
                      const category = categorizeBooking(booking);
                      const isPastBooking = category === 'past';

                      return (
                        <div key={booking.booking_id} className={`border rounded p-4 ${isPastBooking ? 'bg-gray-50 border-gray-300' : ''}`}>
                          <div className="flex justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                {showCheckboxes && (
                                  <input
                                    type="checkbox"
                                    checked={selectedBookings.includes(booking.booking_id)}
                                    onChange={(e) => handleSelectBooking(booking.booking_id, e.target.checked)}
                                    className="mr-3"
                                  />
                                )}
                                <p>
                                  <strong>User:</strong> {booking.first_name}
                                </p>
                              </div>

                              {/* Phone number in separate column below User */}
                              {booking.user_phone && (
                                <p >
                                  <strong>Phone:</strong> {booking.user_phone}
                                </p>
                              )}

                              <p><strong>Futsal:</strong> {booking.futsal_name}</p>
                              <p><strong>Playing Date:</strong> {booking.formatted_date}</p>
                              <p><strong>Booked On:</strong> {booking.created_at.split('T')[0]}</p>
                              <p><strong>Time:</strong> {formatTimeRange(booking.time_slot)}</p>
                              <p><strong>Players:</strong> {booking.number_of_players}</p>
                              {booking.team_name && <p><strong>Team:</strong> {booking.team_name}</p>}
                              <p><strong>Status:</strong> {booking.payment_status}</p>
                              {booking.cancelled_by && booking.cancelled_at && <p><strong>Cancelled on:</strong> {new Date(booking.cancelled_at).toLocaleDateString('en-CA')}, {new Date(booking.cancelled_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}</p>}
                              {booking.last_updated_by && (
                                <p><strong>Last Updated By:</strong> {booking.last_updated_by}</p>
                              )}
                            </div>

                            <div className="flex flex-col items-end space-y-2">
                              <p className="text-lg font-semibold">Rs. {booking.amount_paid}</p>

                              {isPastBooking && !booking.cancelled_by && (
                                <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium bg-red-100 text-red-800">
                                  ⏰ Expired
                                </span>
                              )}

                              {booking.cancelled_by && (
                                <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium bg-orange-100 text-orange-800">
                                  ❌ Cancelled by {booking.cancelled_by.replace(/\b\w/g, (l: string) => l.toUpperCase())}
                                </span>
                              )}

                              <div className="flex space-x-2">
                                <button
                                  onClick={() => setEditingBooking(booking)}
                                  disabled={isPastBooking || !!booking.cancelled_by}
                                  className={`px-3 py-1 rounded text-sm transition-all duration-300 ${isPastBooking || !!booking.cancelled_by
                                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                      : 'bg-linear-to-r from-green-600 to-green-700 text-white hover:shadow-lg transform hover:scale-105'
                                    }`}
                                >
                                  Edit
                                </button>
                                {booking.cancelled_by ? (
                                  <button
                                    onClick={() => handleCancelBooking(booking.booking_id, 'cancelled')}
                                    className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm hover:shadow-lg transform hover:scale-105 transition-all duration-300"
                                  >
                                    Delete
                                  </button>
                                ) : isPastBooking ? (
                                  <button
                                    onClick={() => handleCancelBooking(booking.booking_id, 'expired')}
                                    className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm hover:shadow-lg transform hover:scale-105 transition-all duration-300"
                                  >
                                    Delete
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleCancelBooking(booking.booking_id, 'active')}
                                    className="bg-linear-to-r from-red-600 to-red-700 text-white px-3 py-1 rounded text-sm hover:shadow-lg transform hover:scale-105 transition-all duration-300"
                                  >
                                    Cancel
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {/* Ratings Management */}
            {showRatings && (
              <div className="border-2  border-gray-200 rounded-lg p-2">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-semibold text-gray-900">All Ratings</h3>
                  <button
                    onClick={() => setCreatingRating(!creatingRating)}
                    className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
                  >
                    {creatingRating ? 'Cancel Create' : 'Create Rating'}
                  </button>
                </div>
                <div className="mb-4 space-y-4">
                  {/* Select All and Delete Controls for Ratings */}
                  <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="selectAllRatings"
                        checked={selectAllRatings}
                        onChange={(e) => handleSelectAllRatings(e.target.checked)}
                        className="mr-2"
                      />
                      <label htmlFor="selectAllRatings" className="text-sm font-medium text-gray-700">
                        Select All Ratings ({selectedRatings.length} selected)
                      </label>
                    </div>
                    {selectedRatings.length > 0 && (
                      <button
                        onClick={handleDeleteSelectedRatings}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                      >
                        Delete Selected ({selectedRatings.length})
                      </button>
                    )}
                  </div>

                  <div className="flex space-x-4">
                    <div className="flex-1">
                      <input
                        type="text"
                        placeholder="Search by futsal name or user name..."
                        onChange={(e) => {
                          const searchTerm = e.target.value.toLowerCase();
                          if (searchTerm === '') {
                            fetchRatings(); // Reset to full list
                          } else {
                            const filtered = ratings.filter(rating =>
                              rating.futsal_name?.toLowerCase().includes(searchTerm) ||
                              rating.first_name?.toLowerCase().includes(searchTerm) ||
                              rating.last_name?.toLowerCase().includes(searchTerm)
                            );
                            setRatings(filtered);
                          }
                        }}
                        className="w-full p-2 border border-gray-400 rounded resize-none focus:outline-none focus:ring-0 focus:border-gray-900 focus:border"
                      />
                    </div>
                    <div className="w-64">
                      <select
                        onChange={(e) => {
                          const futsalId = e.target.value;
                          if (futsalId === '') {
                            setRatings(fullRatings); // Reset to full list
                          } else {
                            const filtered = fullRatings.filter(rating => rating.futsal_id.toString() === futsalId);
                            setRatings(filtered);
                          }
                        }}
                        className="w-full p-2 border border-gray-400 rounded resize-none focus:outline-none focus:ring-0 focus:border-gray-900 focus:border"
                      >
                        <option value="">All Futsals</option>
                        {futsals.map((futsal) => (
                          <option key={futsal.futsal_id} value={futsal.futsal_id}>
                            {futsal.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      fetchRatings(); // Reset to full list
                    }}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded"
                  >
                    Clear Filters
                  </button>
                </div>
                {creatingRating && (
                  <div className="mb-6 border rounded p-4 bg-green-50">
                    <SuperAdminCreateRatingForm
                      futsals={futsals}
                      onSuccess={() => {
                        setCreatingRating(false);
                        fetchRatings();
                      }}
                      onCancel={() => setCreatingRating(false)}
                      setNotification={setNotification}
                    />
                  </div>
                )}
                <div className="space-y-4">
                  {ratings.map((rating) => (
                    <div key={rating.id} className="border rounded p-4 flex flex-col md:flex-row md:justify-between md:items-start">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          {showRatingCheckboxes && (
                            <input
                              type="checkbox"
                              checked={selectedRatings.includes(rating.id)}
                              onChange={(e) => handleSelectRating(rating.id, e.target.checked)}
                              className="mr-3"
                            />
                          )}
                          <p><strong>Futsal:</strong> {rating.futsal_name}</p>
                        </div>
                        <p><strong>User:</strong> {rating.first_name && rating.last_name ? `${rating.first_name} ${rating.last_name}` : rating.users}</p>
                        <p><strong>Rating:</strong> {rating.rating}/5</p>
                        {rating.comment && <p><strong>Comment:</strong> {rating.comment}</p>}
                        <p><strong>Date:</strong> {new Date(rating.created_at).toLocaleDateString()}</p>
                      </div>
                      <div className="flex flex-row space-x-2 mt-4 md:ml-4 md:mt-0 md:items-center">
                        <span className="text-xs text-gray-500 px-2 py-1 bg-gray-100 rounded">
                          {rating.users_type}
                        </span>
                        <button
                          onClick={() => setEditingRating(rating)}
                          className="bg-linear-to-r from-green-500 to-green-600 text-white px-3 py-1 rounded shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 border border-green-400/30"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteRating(rating.id)}
                          className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Confirmation Modal */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="max-w-sm w-full bg-white rounded-2xl shadow-2xl border p-6 transform transition-all duration-300">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg mb-4 bg-red-100">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Confirm Action</h3>
              <p className="text-sm text-gray-600 mb-6">{confirmModal.message}</p>
              <div className="flex space-x-3">
                <button
                  onClick={() => setConfirmModal({ isOpen: false, message: '', onConfirm: () => {} })}
                  className="flex-1 bg-gray-200 text-gray-800 font-semibold py-2 px-4 rounded-lg hover:bg-gray-300 transition-all duration-300"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmModal.onConfirm}
                  className="flex-1 bg-linear-to-r from-red-500 to-red-600 text-white font-semibold py-2 px-4 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 border border-red-400/30"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notification Modal */}
      {notification && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 ">
          <div className={`max-w-sm w-full bg-white rounded-2xl shadow-2xl border p-6 transform transition-all duration-300 ${notification.type === 'success' ? 'border-green-200' : 'border-blue-200'}`}>
            <div className="text-center">
              <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg mb-4 ${notification.type === 'success' ? 'bg-green-100' : 'bg-blue-100'}`}>
                {notification.type === 'success' ? (
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
              </div>
              <p className={`text-sm font-medium ${notification.type === 'success' ? 'text-green-800' : 'text-blue-800'}`}>
                {notification.message}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Edit Admin Modal */}
      {editingAdmin && (
        <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Edit Futsal Admin</h3>
            <EditAdminForm admin={editingAdmin} tokens={tokens} onUpdate={(data) => {
              // Handle update
              fetchFutsalAdmins();
              setEditingAdmin(null);
              setNotification({ message: 'Admin updated successfully', type: 'success' });
            }} onCancel={() => setEditingAdmin(null)} setNotification={setNotification} />
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Edit User</h3>
            <EditUserForm user={editingUser} onUpdate={(data) => {
              // Handle update
              fetchUsers();
              setEditingUser(null);
            }} onCancel={() => setEditingUser(null)} setNotification={setNotification} />
          </div>
        </div>
      )}

      {/* Edit Booking Modal */}
      {editingBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white w-full h-full overflow-auto">
            <EditBookingForm booking={editingBooking} onUpdate={(data) => {
              // Handle update
              fetchBookings();
              setEditingBooking(null);
            }} onCancel={() => setEditingBooking(null)} setNotification={setNotification} />
          </div>
        </div>
      )}

      {/* Edit Rating Modal */}
      {editingRating && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Edit Rating</h3>
            <EditRatingForm rating={editingRating} onUpdate={(rating, comment, users, users_type) => {
              handleUpdateRating(editingRating.id, rating, comment, users, users_type);
            }} onCancel={() => setEditingRating(null)} />
          </div>
        </div>
      )}

      {/* Edit Super Admin Modal */}
      {editingSuperAdmin && user && (
        <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Edit Super Admin Profile</h3>
            <EditSuperAdminForm user={user} onUpdate={(updatedUser) => {
              setUser(updatedUser);
              setEditingSuperAdmin(false);
              setNotification({ message: 'Profile updated successfully!', type: 'success' });
            }} onCancel={() => setEditingSuperAdmin(false)} setNotification={setNotification} />
          </div>
        </div>
      )}

      {/* Block Reason Modal */}
      {blockReasonModal.isOpen && (
        <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Enter Reason for Blocking</h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              const reason = (e.target as any).reason.value.trim();
              if (reason) {
                blockReasonModal.onConfirm(reason);
              }
            }}>
              <textarea
                name="reason"
                placeholder="Enter reason for blocking..."
                required
                className="w-full p-2 border border-gray-400 rounded resize-none focus:outline-none focus:ring-0 focus:border-gray-900 focus:border mb-4"
                rows={4}
              />
              <div className="flex space-x-4">
                <button type="submit" className="flex-1 bg-red-600 text-white py-2 rounded">
                  Block User
                </button>
                <button type="button" onClick={() => setBlockReasonModal({ isOpen: false, userId: 0, onConfirm: () => {} })} className="flex-1 bg-gray-600 text-white py-2 rounded">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Futsal Details Modal */}
      {viewingFutsalDetails && (
        <div className="fixed top-16 inset-x-0 z-50 mt-1 p-4 backdrop-blur-sm">
          <div className="bg-white p-6 rounded max-w-4xl w-full mx-auto max-h-[calc(100vh-5rem)] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Futsal Details</h3>
              <button
                onClick={() => setViewingFutsalDetails(null)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <strong>Name:</strong> {viewingFutsalDetails.name}
                </div>
                <div>
                  <strong>Location:</strong> {viewingFutsalDetails.location}
                </div>
                <div>
                  <strong>City:</strong> {viewingFutsalDetails.city}
                </div>
                <div>
                  <strong>Phone:</strong> {viewingFutsalDetails.phone || 'N/A'}
                </div>
                <div>
                  <strong>Latitude:</strong> {viewingFutsalDetails.latitude || 'N/A'}
                </div>
                <div>
                  <strong>Longitude:</strong> {viewingFutsalDetails.longitude || 'N/A'}
                </div>
                <div>
                  <strong>Price per Hour:</strong> Rs. {viewingFutsalDetails.price_per_hour || 'N/A'}
                </div>
                <div>
                  <strong>Game Format:</strong> {viewingFutsalDetails.game_format || 'N/A'}
                </div>
                <div className="col-span-2">
                  <strong>Facilities:</strong> {viewingFutsalDetails.facilities && viewingFutsalDetails.facilities.length > 0 ? viewingFutsalDetails.facilities.join(', ') : 'N/A'}
                </div>
                <div>
                  <strong>Opening Hours:</strong> {viewingFutsalDetails.opening_hours ? formatTime(viewingFutsalDetails.opening_hours) : 'N/A'}
                </div>
                <div>
                  <strong>Closing Hours:</strong> {viewingFutsalDetails.closing_hours ? formatTime(viewingFutsalDetails.closing_hours) : 'N/A'}
                </div>
                <div>
                  <strong>Last Updated By:</strong> {viewingFutsalDetails.last_updated_by || 'N/A'}
                </div>
                <div>
                  <strong>Created At:</strong> {viewingFutsalDetails.created_at ? new Date(viewingFutsalDetails.created_at).toLocaleString() : 'N/A'}
                </div>
                <div>
                  <strong>Updated At:</strong> {viewingFutsalDetails.updated_at ? new Date(viewingFutsalDetails.updated_at).toLocaleString() : 'N/A'}
                </div>
              </div>
              <div>
                <strong>Description:</strong>
                <p className="mt-1">{viewingFutsalDetails.description || 'N/A'}</p>
              </div>
              {viewingFutsalDetails.images && viewingFutsalDetails.images.length > 0 && (
                <div>
                  <strong>Images:</strong>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {viewingFutsalDetails.images.map((img, index) => (
                      <img key={index} src={`${process.env.NEXT_PUBLIC_API_URL}/uploads/${img}`} alt={`${viewingFutsalDetails.name} ${index + 1}`} className="w-32 h-32 object-cover" />
                    ))}
                  </div>
                </div>
              )}
              {viewingFutsalDetails.video && (
                <div>
                  <strong>Video:</strong>
                  <div className="mt-2">
                    <video controls className="w-64 h-36">
                      <source src={`${process.env.NEXT_PUBLIC_API_URL}/uploads/${viewingFutsalDetails.video}`} type="video/mp4" />
                    </video>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SuperAdminCreateRatingForm({ futsals, onSuccess, onCancel, setNotification }: { futsals: Futsal[], onSuccess: () => void, onCancel: () => void, setNotification: React.Dispatch<React.SetStateAction<{message: string, type: 'success' | 'info'} | null>> }) {
  const [selectedFutsalId, setSelectedFutsalId] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [userName, setUserName] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/ratings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          futsal_id: selectedFutsalId,
          user_id: null, // Admin-created ratings are always anonymous
          users: isAnonymous ? 'Anonymous' : userName.trim(),
          users_type: 'super admin created',
          rating,
          comment: comment.trim() || null
        }),
      });

      if (response.ok) {
        setNotification({ message: "Rating created successfully", type: 'success' });
        onSuccess();
      } else {
        const error = await response.json();
        setNotification({ message: error.message || 'Error creating rating', type: 'info' });
      }
    } catch (error) {
      console.error('Error:', error);
      setNotification({ message: "Error creating rating", type: 'info' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h4 className="text-lg font-semibold">Create New Rating</h4>

      <select
        value={selectedFutsalId}
        onChange={(e) => setSelectedFutsalId(e.target.value)}
        required
        className="w-full p-2 border border-gray-400 rounded resize-none focus:outline-none focus:ring-0 focus:border-gray-900 focus:border"
      >
        <option value="">Select Futsal</option>
        {futsals.map((futsal) => (
          <option key={futsal.futsal_id} value={futsal.futsal_id}>
            {futsal.name}
          </option>
        ))}
      </select>

      <div className="space-y-2">
        <label className="flex items-center">
          <input
            type="radio"
            checked={!isAnonymous}
            onChange={() => setIsAnonymous(false)}
            className="mr-2"
          />
          Enter User Name
        </label>
        <label className="flex items-center">
          <input
            type="radio"
            checked={isAnonymous}
            onChange={() => setIsAnonymous(true)}
            className="mr-2"
          />
          Anonymous User
        </label>
      </div>

      {!isAnonymous && (
        <input
          type="text"
          placeholder="User Name"
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
          required
          className="w-full p-2 border border-gray-400 rounded resize-none focus:outline-none focus:ring-0 focus:border-gray-900 focus:border"
        />
      )}

      <div>
        <label className="block text-sm font-medium mb-2">Rating:</label>
        <div className="flex items-center space-x-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              className="text-2xl focus:outline-none"
            >
              <svg
                className={`w-8 h-8 ${star <= rating
                    ? 'text-yellow-400'
                    : 'text-gray-300'
                  }`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </button>
          ))}
          <span className="ml-2 text-sm text-gray-600">
            {rating} star{rating > 1 ? 's' : ''}
          </span>
        </div>
      </div>

      <textarea
        placeholder="Comment (optional)"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        className="w-full p-2 border border-gray-300 rounded resize-none focus:outline-none focus:ring-0 focus:border-gray-900"
        rows={3}
        maxLength={500}
      />

      <div className="flex space-x-4">
        <button type="submit" disabled={loading || !selectedFutsalId || (!isAnonymous && !userName.trim())} className="bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50">
          {loading ? 'Creating...' : 'Create Rating'}
        </button>
        <button type="button" onClick={onCancel} className="bg-gray-600 text-white px-4 py-2 rounded">
          Cancel
        </button>
      </div>
    </form>
  );
}

function EditRatingForm({ rating, onUpdate, onCancel }: { rating: any, onUpdate: (rating: number, comment: string, users?: string, users_type?: string) => void, onCancel: () => void }) {
  const [userRating, setUserRating] = useState(rating.rating);
  const [comment, setComment] = useState(rating.comment || '');
  const [users, setUsers] = useState(rating.users || '');
  const [users_type, setUsersType] = useState(rating.users_type || '');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    onUpdate(userRating, comment, users, users_type);
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {rating.users_type !== 'registered user' && (
        <input
          type="text"
          placeholder="User Name"
          value={users}
          onChange={(e) => setUsers(e.target.value)}
          required
          className="w-full p-2 border border-gray-400 rounded resize-none focus:outline-none focus:ring-0 focus:border-gray-900 focus:border"
        />
      )}

      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setUserRating(star)}
            className="text-2xl focus:outline-none"
          >
            <svg
              className={`w-8 h-8 ${star <= userRating
                  ? 'text-yellow-400'
                  : 'text-gray-300'
                }`}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </button>
        ))}
        <span className="ml-2 text-sm text-gray-600">
          {userRating} star{userRating > 1 ? 's' : ''}
        </span>
      </div>

      <textarea
        placeholder="Comment (optional)"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        className="w-full p-2 border border-gray-300 rounded resize-none focus:outline-none focus:ring-0 focus:border-gray-900"
        rows={3}
        maxLength={500}
      />

      <div className="flex space-x-4">
        <button type="submit" disabled={loading} className="bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50">
          {loading ? 'Updating...' : 'Update Rating'}
        </button>
        <button type="button" onClick={onCancel} className="bg-gray-600 text-white px-4 py-2 rounded">
          Cancel
        </button>
      </div>
    </form>
  );
}

function EditFutsalForm({ futsal, onUpdate, onCancel, setNotification }: { futsal: Futsal, onUpdate: (data: FormData) => void, onCancel: () => void, setNotification: React.Dispatch<React.SetStateAction<{message: string, type: 'success' | 'info'} | null>> }) {
  const [formData, setFormData] = useState({
    name: futsal.name,
    location: futsal.location,
    city: futsal.city,
    latitude: futsal.latitude?.toString() || '',
    longitude: futsal.longitude?.toString() || '',
    phone: futsal.phone || '',
    description: futsal.description || '',
    price_per_hour: futsal.price_per_hour?.toString() || '',
    game_format: futsal.game_format || '',
    facilities: futsal.facilities || [],
    opening_hours: futsal.opening_hours ? futsal.opening_hours.split(':').slice(0, 2).map(h => h.padStart(2, '0')).join(':') : '',
    closing_hours: futsal.closing_hours ? futsal.closing_hours.split(':').slice(0, 2).map(h => h.padStart(2, '0')).join(':') : ''
  });
  const [customGameFormat, setCustomGameFormat] = useState('');
  const [customFacilities, setCustomFacilities] = useState('');
  const [images, setImages] = useState<FileList | null>(null);
  const [video, setVideo] = useState<File | null>(null);
  const [existingImages, setExistingImages] = useState<string[]>(futsal.images || []);
  const [existingVideo, setExistingVideo] = useState<string | null>(futsal.video || null);
  const [removedImages, setRemovedImages] = useState<string[]>([]);
  const [removedVideo, setRemovedVideo] = useState(false);
  const [newImagePreviews, setNewImagePreviews] = useState<File[]>([]);
  const [newVideoPreview, setNewVideoPreview] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const gameFormatOptions = [
    '5 vs 5 on-court',
    '6 vs 6 on-court',
    '7 vs 7 on-court',
    '8 vs 8 on-court',
    '9 vs 9 on-court',
    '10 vs 10 on-field',
    '1 vs 11 on-field'
  ];

  const facilitiesOptions = [
    'Night lighting',
    'Changing rooms',
    'showers',
    'Washrooms / drinking water',
    'Parking facilities',
    'swimming pool',
    'Tournaments',
    'Café / snacks area / seating lounge'
  ];

  const removeImage = (imgPath: string) => {
    setExistingImages(existingImages.filter(img => img !== imgPath));
    setRemovedImages([...removedImages, imgPath]);
  };

  const removeVideo = () => {
    setExistingVideo(null);
    setRemovedVideo(true);
  };

  const handleGameFormatChange = (value: string) => {
    if (value === 'custom') {
      setFormData({ ...formData, game_format: customGameFormat });
    } else {
      setFormData({ ...formData, game_format: value });
      setCustomGameFormat('');
    }
  };

  const handleFacilitiesChange = (facility: string, checked: boolean) => {
    if (checked) {
      setFormData({ ...formData, facilities: [...formData.facilities, facility] });
    } else {
      setFormData({ ...formData, facilities: formData.facilities.filter(f => f !== facility) });
    }
  };

  const addCustomFacility = () => {
    if (customFacilities.trim() && !formData.facilities.includes(customFacilities.trim())) {
      setFormData({ ...formData, facilities: [...formData.facilities, customFacilities.trim()] });
      setCustomFacilities('');
    }
  };

  const removeFacility = (facility: string) => {
    setFormData({ ...formData, facilities: formData.facilities.filter(f => f !== facility) });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const data = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (key === 'facilities') {
        data.append(key, JSON.stringify(value));
      } else {
        data.append(key, value as string);
      }
    });
    if (images) {
      for (let i = 0; i < images.length; i++) {
        data.append('images', images[i]);
      }
    }
    if (video) data.append('video', video);
    data.append('removed_images', JSON.stringify(removedImages));
    data.append('removed_video', removedVideo.toString());

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/futsals/${futsal.futsal_id}`, {
        method: 'PUT',
        body: data,
      });

      if (response.ok) {
        onUpdate(data);
        setNotification({ message: "Futsal updated successfully", type: 'success' });
      } else {
        setNotification({ message: "Error updating futsal", type: 'info' });
      }
    } catch (error) {
      console.error('Error:', error);
      setNotification({ message: "Error updating futsal", type: 'info' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input type="text" placeholder="Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required className="w-full p-2 border border-gray-400 rounded resize-none focus:outline-none focus:ring-0 focus:border-gray-900 focus:border" />
      <input type="text" placeholder="Location" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} required className="w-full p-2 border border-gray-400 rounded resize-none focus:outline-none focus:ring-0 focus:border-gray-900 focus:border" />
      <input type="text" placeholder="City" value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} required className="w-full p-2 border border-gray-400 rounded resize-none focus:outline-none focus:ring-0 focus:border-gray-900 focus:border" />
      <input type="text" placeholder="Latitude" value={formData.latitude} onChange={(e) => setFormData({ ...formData, latitude: e.target.value })} className="w-full p-2 border border-gray-400 rounded resize-none focus:outline-none focus:ring-0 focus:border-gray-900 focus:border" />
      <input type="text" placeholder="Longitude" value={formData.longitude} onChange={(e) => setFormData({ ...formData, longitude: e.target.value })} className="w-full p-2 border border-gray-400 rounded resize-none focus:outline-none focus:ring-0 focus:border-gray-900 focus:border" />
      <input type="tel" placeholder="Phone (10 digits starting with 9)" value={formData.phone} maxLength={10} pattern="9[0-9]{9}" onChange={(e) => {
        const value = e.target.value.replace(/\D/g, "");
        if (value.length <= 10 && (value === "" || value.startsWith("9"))) {
          setFormData({ ...formData, phone: value });
        }
      }} className="w-full p-2 border border-gray-400 rounded resize-none focus:outline-none focus:ring-0 focus:border-gray-900 focus:border" />
      <input type="number" placeholder="Price per Hour (Rs.)" value={formData.price_per_hour} onChange={(e) => setFormData({ ...formData, price_per_hour: e.target.value })} step="0.01" className="w-full p-2 border border-gray-400 rounded resize-none focus:outline-none focus:ring-0 focus:border-gray-900 focus:border" />

      {/* Game Format */}
      <div>
        <label className="block text-sm font-medium mb-2">Game Format</label>
        <select
          value={gameFormatOptions.includes(formData.game_format) ? formData.game_format : 'custom'}
          onChange={(e) => handleGameFormatChange(e.target.value)}
          className="w-full p-2 border border-gray-400 rounded resize-none focus:outline-none focus:ring-0 focus:border-gray-900 focus:border mb-2"
        >
          <option value="">Select Game Format</option>
          {gameFormatOptions.map(option => (
            <option key={option} value={option}>{option}</option>
          ))}
          <option value="custom">Enter Custom Format</option>
        </select>
        {(formData.game_format === '' || !gameFormatOptions.includes(formData.game_format)) && (
          <input
            type="text"
            placeholder="Enter custom game format"
            value={customGameFormat}
            onChange={(e) => {
              setCustomGameFormat(e.target.value);
              setFormData({ ...formData, game_format: e.target.value });
            }}
            className="w-full p-2 border border-gray-400 rounded resize-none focus:outline-none focus:ring-0 focus:border-gray-900 focus:border"
          />
        )}
      </div>

      {/* Facilities */}
      <div>
        <label className="block text-sm font-medium mb-2">Facilities</label>
        <div className="grid grid-cols-2 gap-2 mb-2">
          {facilitiesOptions.map(option => (
            <label key={option} className="flex items-center">
              <input
                type="checkbox"
                checked={formData.facilities.includes(option)}
                onChange={(e) => handleFacilitiesChange(option, e.target.checked)}
                className="mr-2"
              />
              {option}
            </label>
          ))}
        </div>
        <div className="flex space-x-2">
          <input
            type="text"
            placeholder="Add custom facility"
            value={customFacilities}
            onChange={(e) => setCustomFacilities(e.target.value)}
            className="flex-1 p-2 border border-gray-400 rounded resize-none focus:outline-none focus:ring-0 focus:border-gray-900 focus:border"
          />
          <button type="button" onClick={addCustomFacility} className="bg-green-600 text-white px-4 py-2 rounded">
            Add
          </button>
        </div>
        {formData.facilities.length > 0 && (
          <div className="mt-2">
            <strong>Selected Facilities:</strong>
            <div className="flex flex-wrap gap-1 mt-1">
              {formData.facilities.map(facility => (
                <span key={facility} className="bg-blue-100 px-2 py-1 rounded text-sm flex items-center">
                  {facility}
                  <button type="button" onClick={() => removeFacility(facility)} className="ml-1 text-red-600">×</button>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <select value={formData.opening_hours} onChange={(e) => setFormData({ ...formData, opening_hours: e.target.value })} required className="w-full p-2 border border-gray-400 rounded resize-none focus:outline-none focus:ring-0 focus:border-gray-900 focus:border">
          <option value="">Opening Hours</option>
          <option value="06:00">6 AM</option>
          <option value="07:00">7 AM</option>
          <option value="08:00">8 AM</option>
          <option value="09:00">9 AM</option>
          <option value="10:00">10 AM</option>
          <option value="11:00">11 AM</option>
          <option value="12:00">12 PM</option>
          <option value="13:00">1 PM</option>
          <option value="14:00">2 PM</option>
          <option value="15:00">3 PM</option>
          <option value="16:00">4 PM</option>
          <option value="17:00">5 PM</option>
          <option value="18:00">6 PM</option>
          <option value="19:00">7 PM</option>
          <option value="20:00">8 PM</option>
          <option value="21:00">9 PM</option>
          <option value="22:00">10 PM</option>
          <option value="23:00">11 PM</option>
        </select>
        <select value={formData.closing_hours} onChange={(e) => setFormData({ ...formData, closing_hours: e.target.value })} required className="w-full p-2 border border-gray-400 rounded resize-none focus:outline-none focus:ring-0 focus:border-gray-900 focus:border">
          <option value="">Closing Hours</option>
          <option value="06:00">6 AM</option>
          <option value="07:00">7 AM</option>
          <option value="08:00">8 AM</option>
          <option value="09:00">9 AM</option>
          <option value="10:00">10 AM</option>
          <option value="11:00">11 AM</option>
          <option value="12:00">12 PM</option>
          <option value="13:00">1 PM</option>
          <option value="14:00">2 PM</option>
          <option value="15:00">3 PM</option>
          <option value="16:00">4 PM</option>
          <option value="17:00">5 PM</option>
          <option value="18:00">6 PM</option>
          <option value="19:00">7 PM</option>
          <option value="20:00">8 PM</option>
          <option value="21:00">9 PM</option>
          <option value="22:00">10 PM</option>
          <option value="23:00">11 PM</option>
        </select>
      </div>
      <textarea placeholder="Description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full p-2 border border-gray-400 rounded resize-none focus:outline-none focus:ring-0 focus:border-gray-900 focus:border" />
      {existingImages.length > 0 && (
        <div>
          <strong>Existing Images:</strong>
          <div className="flex flex-wrap gap-2 mt-2">
            {existingImages.map((img, index) => (
              <div key={index} className="relative">
                <img src={`${process.env.NEXT_PUBLIC_API_URL}/uploads/${img}`} alt={`Existing ${index + 1}`} className="w-32 h-32 object-cover" />
                <button
                  type="button"
                  onClick={() => removeImage(img)}
                  className="absolute top-0 right-0 bg-red-600 text-white rounded-lg w-6 h-6 flex items-center justify-center text-xs"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      {existingVideo && (
        <div>
          <strong>Existing Video:</strong>
          <div className="relative mt-2">
            <video controls className="w-64 h-36">
              <source src={`${process.env.NEXT_PUBLIC_API_URL}/uploads/${existingVideo}`} type="video/mp4" />
            </video>
            <button
              type="button"
              onClick={removeVideo}
              className="absolute top-0 right-0 bg-red-600 text-white rounded-lg w-6 h-6 flex items-center justify-center text-xs"
            >
              ×
            </button>
          </div>
        </div>
      )}
      <div>
        <label>Add Images: <input type="file" accept="image/*" multiple onChange={(e) => {
          const files = Array.from(e.target.files || []);
          setImages(e.target.files);
          setNewImagePreviews(files);
        }} /></label>
      </div>
      <div>
        <label>Update Video: <input type="file" accept="video/*" onChange={(e) => {
          const file = e.target.files?.[0] || null;
          setVideo(file);
          setNewVideoPreview(file);
        }} /></label>
      </div>
      {newImagePreviews.length > 0 && (
        <div>
          <strong>New Images to Add:</strong>
          <div className="flex flex-wrap gap-2 mt-2">
            {newImagePreviews.map((file, index) => (
              <div key={index} className="relative">
                <img src={URL.createObjectURL(file)} alt={`New ${index + 1}`} className="w-32 h-32 object-cover" />
                <button
                  type="button"
                  onClick={() => {
                    const newPreviews = newImagePreviews.filter((_, i) => i !== index);
                    setNewImagePreviews(newPreviews);
                    const dt = new DataTransfer();
                    newPreviews.forEach(f => dt.items.add(f));
                    const input = document.querySelector('input[type="file"][accept="image/*"]') as HTMLInputElement;
                    if (input) input.files = dt.files;
                    setImages(dt.files);
                  }}
                  className="absolute top-0 right-0 bg-red-600 text-white rounded-lg w-6 h-6 flex items-center justify-center text-xs"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      {newVideoPreview && (
        <div>
          <strong>New Video to Update:</strong>
          <div className="relative mt-2">
            <video controls className="w-64 h-36">
              <source src={URL.createObjectURL(newVideoPreview)} type="video/mp4" />
            </video>
            <button
              type="button"
              onClick={() => {
                setNewVideoPreview(null);
                setVideo(null);
                const input = document.querySelector('input[type="file"][accept="video/*"]') as HTMLInputElement;
                if (input) input.value = '';
              }}
              className="absolute top-0 right-0 bg-red-600 text-white rounded-lg w-6 h-6 flex items-center justify-center text-xs"
            >
              ×
            </button>
          </div>
        </div>
      )}
      <div className="flex space-x-4">
        <button type="submit" disabled={loading} className="bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50">
          {loading ? 'Updating...' : 'Update Futsal'}
        </button>
        <button type="button" onClick={onCancel} className="bg-gray-600 text-white px-4 py-2 rounded">
          Cancel
        </button>
      </div>
    </form>
  );
}

function EditAdminForm({ admin, tokens, onUpdate, onCancel, setNotification }: { admin: any, tokens: any, onUpdate: (data: any) => void, onCancel: () => void, setNotification: React.Dispatch<React.SetStateAction<{message: string, type: 'success' | 'info'} | null>> }) {
  const [formData, setFormData] = useState({
    username: admin.username,
    email: admin.email,
    phone: admin.phone,
    password: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/futsal-admins/${admin.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tokens?.accessToken}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        onUpdate(formData);
        setNotification({ message: "Admin updated successfully", type: 'success' });
      } else {
        setNotification({ message: "Error updating admin", type: 'info' });
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error updating admin');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input type="text" placeholder="Username" value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} required className="w-full p-2 border border-gray-400 rounded resize-none focus:outline-none focus:ring-0 focus:border-gray-900 focus:border" />
      <input type="email" placeholder="Email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required className="w-full p-2 border border-gray-400 rounded resize-none focus:outline-none focus:ring-0 focus:border-gray-900 focus:border" />
      <input type="tel" placeholder="Phone (10 digits starting with 9)" value={formData.phone} maxLength={10} pattern="9[0-9]{9}" onChange={(e) => {
        const value = e.target.value.replace(/\D/g, "");
        if (value.length <= 10 && (value === "" || value.startsWith("9"))) {
          setFormData({ ...formData, phone: value });
        }
      }} required className="w-full p-2 border border-gray-400 rounded resize-none focus:outline-none focus:ring-0 focus:border-gray-900 focus:border" />
      <input type="password" placeholder="New Password (leave empty)" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className="w-full p-2 border border-gray-400 rounded resize-none focus:outline-none focus:ring-0 focus:border-gray-900 focus:border" />
      <div className="flex space-x-4">
        <button type="submit" disabled={loading} className="bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50">
          {loading ? 'Updating...' : 'Update Admin'}
        </button>
        <button type="button" onClick={onCancel} className="bg-gray-600 text-white px-4 py-2 rounded">
          Cancel
        </button>
      </div>
    </form>
  );
}

function CreateFutsalForm({ onSuccess, setNotification }: { onSuccess: () => void, setNotification: React.Dispatch<React.SetStateAction<{message: string, type: 'success' | 'info'} | null>> }) {
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    city: '',
    latitude: '',
    longitude: '',
    phone: '',
    description: '',
    price_per_hour: '',
    game_format: '',
    facilities: [] as string[],
    opening_hours: '',
    closing_hours: ''
  });
  const [customGameFormat, setCustomGameFormat] = useState('');
  const [customFacilities, setCustomFacilities] = useState('');
  const [images, setImages] = useState<FileList | null>(null);
  const [video, setVideo] = useState<File | null>(null);
  const [imagePreviews, setImagePreviews] = useState<File[]>([]);
  const [videoPreview, setVideoPreview] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const gameFormatOptions = [
    '5 vs 5 on-court',
    '6 vs 6 on-court',
    '7 vs 7 on-court',
    '8 vs 8 on-court',
    '9 vs 9 on-court',
    '10 vs 10 on-field',
    '1 vs 11 on-field'
  ];

  const facilitiesOptions = [
    'Night lighting',
    'Changing rooms',
    'showers',
    'Washrooms / drinking water',
    'Parking facilities',
    'swimming pool',
    'Tournaments',
    'Café / snacks area / seating lounge'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const data = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (key === 'facilities') {
        data.append(key, JSON.stringify(value));
      } else {
        data.append(key, value as string);
      }
    });
    if (images) {
      for (let i = 0; i < images.length; i++) {
        data.append('images', images[i]);
      }
    }
    if (video) data.append('video', video);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/futsals`, {
        method: 'POST',
        body: data,
      });

      if (response.ok) {
        setNotification({ message: "Futsal created successfully", type: 'success' });
        onSuccess();
        setFormData({
          name: '', location: '', city: '', latitude: '', longitude: '', phone: '', description: '', price_per_hour: '', game_format: '', facilities: [], opening_hours: '', closing_hours: ''
        });
        setCustomGameFormat('');
        setCustomFacilities('');
        setImages(null);
        setVideo(null);
        setImagePreviews([]);
        setVideoPreview(null);
      } else {
        setNotification({ message: "Error creating futsal", type: 'info' });
      }
    } catch (error) {
      console.error('Error:', error);
      setNotification({ message: "Error creating futsal", type: 'info' });
    } finally {
      setLoading(false);
    }
  };

  const handleGameFormatChange = (value: string) => {
    if (value === 'custom') {
      setFormData({ ...formData, game_format: customGameFormat });
    } else {
      setFormData({ ...formData, game_format: value });
      setCustomGameFormat('');
    }
  };

  const handleFacilitiesChange = (facility: string, checked: boolean) => {
    if (checked) {
      setFormData({ ...formData, facilities: [...formData.facilities, facility] });
    } else {
      setFormData({ ...formData, facilities: formData.facilities.filter(f => f !== facility) });
    }
  };

  const addCustomFacility = () => {
    if (customFacilities.trim() && !formData.facilities.includes(customFacilities.trim())) {
      setFormData({ ...formData, facilities: [...formData.facilities, customFacilities.trim()] });
      setCustomFacilities('');
    }
  };

  const removeFacility = (facility: string) => {
    setFormData({ ...formData, facilities: formData.facilities.filter(f => f !== facility) });
  };

  return (
    <div className="border rounded-lg p-6 bg-white">
      <h3 className="text-lg font-semibold mb-4">Create New Futsal</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input type="text" placeholder="Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required className="w-full p-2 border border-gray-400 rounded resize-none focus:outline-none focus:ring-0 focus:border-gray-900 focus:border" />
        <input type="text" placeholder="Location" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} required className="w-full p-2 border border-gray-400 rounded resize-none focus:outline-none focus:ring-0 focus:border-gray-900 focus:border" />
        <input type="text" placeholder="City" value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} required className="w-full p-2 border border-gray-400 rounded resize-none focus:outline-none focus:ring-0 focus:border-gray-900 focus:border" />
        <input type="text" placeholder="Latitude" value={formData.latitude} onChange={(e) => setFormData({ ...formData, latitude: e.target.value })} className="w-full p-2 border border-gray-400 rounded resize-none focus:outline-none focus:ring-0 focus:border-gray-900 focus:border" />
        <input type="text" placeholder="Longitude" value={formData.longitude} onChange={(e) => setFormData({ ...formData, longitude: e.target.value })} className="w-full p-2 border border-gray-400 rounded resize-none focus:outline-none focus:ring-0 focus:border-gray-900 focus:border" />
        <input type="tel" placeholder="Phone (10 digits starting with 9)" value={formData.phone} maxLength={10} pattern="9[0-9]{9}" onChange={(e) => {
          const value = e.target.value.replace(/\D/g, "");
          if (value.length <= 10 && (value === "" || value.startsWith("9"))) {
            setFormData({ ...formData, phone: value });
          }
        }} className="w-full p-2 border border-gray-400 rounded resize-none focus:outline-none focus:ring-0 focus:border-gray-900 focus:border" />
        <input type="number" placeholder="Price per Hour (Rs.)" value={formData.price_per_hour} onChange={(e) => setFormData({ ...formData, price_per_hour: e.target.value })} step="0.01" className="w-full p-2 border border-gray-400 rounded resize-none focus:outline-none focus:ring-0 focus:border-gray-900 focus:border" />

        {/* Game Format */}
        <div>
          <label className="block text-sm font-medium mb-2">Game Format</label>
          <select
            value={gameFormatOptions.includes(formData.game_format) ? formData.game_format : 'custom'}
            onChange={(e) => handleGameFormatChange(e.target.value)}
            className="w-full p-2 border border-gray-400 rounded resize-none focus:outline-none focus:ring-0 focus:border-gray-900 focus:border mb-2"
          >
            <option value="">Select Game Format</option>
            {gameFormatOptions.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
            <option value="custom">Enter Custom Format</option>
          </select>
          {(formData.game_format === '' || !gameFormatOptions.includes(formData.game_format)) && (
            <input
              type="text"
              placeholder="Enter custom game format"
              value={customGameFormat}
              onChange={(e) => {
                setCustomGameFormat(e.target.value);
                setFormData({ ...formData, game_format: e.target.value });
              }}
              className="w-full p-2 border border-gray-400 rounded resize-none focus:outline-none focus:ring-0 focus:border-gray-900 focus:border"
            />
          )}
        </div>

        {/* Facilities */}
        <div>
          <label className="block text-sm font-medium mb-2">Facilities</label>
          <div className="grid grid-cols-2 gap-2 mb-2">
            {facilitiesOptions.map(option => (
              <label key={option} className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.facilities.includes(option)}
                  onChange={(e) => handleFacilitiesChange(option, e.target.checked)}
                  className="mr-2"
                />
                {option}
              </label>
            ))}
          </div>
          <div className="flex space-x-2">
            <input
              type="text"
              placeholder="Add custom facility"
              value={customFacilities}
              onChange={(e) => setCustomFacilities(e.target.value)}
              className="flex-1 p-2 border border-gray-400 rounded resize-none focus:outline-none focus:ring-0 focus:border-gray-900 focus:border"
            />
            <button type="button" onClick={addCustomFacility} className="bg-green-600 text-white px-4 py-2 rounded">
              Add
            </button>
          </div>
          {formData.facilities.length > 0 && (
            <div className="mt-2">
              <strong>Selected Facilities:</strong>
              <div className="flex flex-wrap gap-1 mt-1">
                {formData.facilities.map(facility => (
                  <span key={facility} className="bg-blue-100 px-2 py-1 rounded text-sm flex items-center">
                    {facility}
                    <button type="button" onClick={() => removeFacility(facility)} className="ml-1 text-red-600">×</button>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <select value={formData.opening_hours} onChange={(e) => setFormData({ ...formData, opening_hours: e.target.value })} required className="w-full p-2 border border-gray-400 rounded resize-none focus:outline-none focus:ring-0 focus:border-gray-900 focus:border">
            <option value="">Opening Hours</option>
            <option value="06:00">6 AM</option>
            <option value="07:00">7 AM</option>
            <option value="08:00">8 AM</option>
            <option value="09:00">9 AM</option>
            <option value="10:00">10 AM</option>
            <option value="11:00">11 AM</option>
            <option value="12:00">12 PM</option>
            <option value="13:00">1 PM</option>
            <option value="14:00">2 PM</option>
            <option value="15:00">3 PM</option>
            <option value="16:00">4 PM</option>
            <option value="17:00">5 PM</option>
            <option value="18:00">6 PM</option>
            <option value="19:00">7 PM</option>
            <option value="20:00">8 PM</option>
            <option value="21:00">9 PM</option>
            <option value="22:00">10 PM</option>
            <option value="23:00">11 PM</option>
          </select>
          <select value={formData.closing_hours} onChange={(e) => setFormData({ ...formData, closing_hours: e.target.value })} required className="w-full p-2 border border-gray-400 rounded resize-none focus:outline-none focus:ring-0 focus:border-gray-900 focus:border">
            <option value="">Closing Hours</option>
            <option value="06:00">6 AM</option>
            <option value="07:00">7 AM</option>
            <option value="08:00">8 AM</option>
            <option value="09:00">9 AM</option>
            <option value="10:00">10 AM</option>
            <option value="11:00">11 AM</option>
            <option value="12:00">12 PM</option>
            <option value="13:00">1 PM</option>
            <option value="14:00">2 PM</option>
            <option value="15:00">3 PM</option>
            <option value="16:00">4 PM</option>
            <option value="17:00">5 PM</option>
            <option value="18:00">6 PM</option>
            <option value="19:00">7 PM</option>
            <option value="20:00">8 PM</option>
            <option value="21:00">9 PM</option>
            <option value="22:00">10 PM</option>
            <option value="23:00">11 PM</option>
          </select>
        </div>
        <textarea placeholder="Description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full p-2 border border-gray-400 rounded resize-none focus:outline-none focus:ring-0 focus:border-gray-900 focus:border" />
        <div>
          <label>Images (up to 5): <input type="file" accept="image/*" multiple onChange={(e) => {
            const files = Array.from(e.target.files || []);
            setImages(e.target.files);
            setImagePreviews(files);
          }} /></label>
        </div>
        <div>
          <label>Video: <input type="file" accept="video/*" onChange={(e) => {
            const file = e.target.files?.[0] || null;
            setVideo(file);
            setVideoPreview(file);
          }} /></label>
        </div>
        {imagePreviews.length > 0 && (
          <div>
            <strong>New Images:</strong>
            <div className="flex flex-wrap gap-2 mt-2">
              {imagePreviews.map((file, index) => (
                <div key={index} className="relative">
                  <img src={URL.createObjectURL(file)} alt={`New ${index + 1}`} className="w-32 h-32 object-cover" />
                  <button
                    type="button"
                    onClick={() => {
                      const newPreviews = imagePreviews.filter((_, i) => i !== index);
                      setImagePreviews(newPreviews);
                      const dt = new DataTransfer();
                      newPreviews.forEach(f => dt.items.add(f));
                      const input = document.querySelector('input[type="file"][accept="image/*"]') as HTMLInputElement;
                      if (input) input.files = dt.files;
                      setImages(dt.files);
                    }}
                    className="absolute top-0 right-0 bg-red-600 text-white rounded-lg w-6 h-6 flex items-center justify-center text-xs"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
        {videoPreview && (
          <div>
            <strong>New Video:</strong>
            <div className="relative mt-2">
              <video controls className="w-64 h-36">
                <source src={URL.createObjectURL(videoPreview)} type="video/mp4" />
              </video>
              <button
                type="button"
                onClick={() => {
                  setVideoPreview(null);
                  setVideo(null);
                  const input = document.querySelector('input[type="file"][accept="video/*"]') as HTMLInputElement;
                  if (input) input.value = '';
                }}
                className="absolute top-0 right-0 bg-red-600 text-white rounded-lg w-6 h-6 flex items-center justify-center text-xs"
              >
                ×
              </button>
            </div>
          </div>
        )}
        <button type="submit" disabled={loading} className="bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50">
          {loading ? 'Creating...' : 'Create Futsal'}
        </button>
      </form>
    </div>
  );
}

function CreateFutsalAdminForm({ futsals, superAdminId, setNotification, tokens }: { futsals: Futsal[], superAdminId: number, setNotification: React.Dispatch<React.SetStateAction<{message: string, type: 'success' | 'info'} | null>>, tokens: any }) {
  const [formData, setFormData] = useState({
    futsal_name: '',
    location: '',
    city: '',
    username: '',
    email: '',
    phone: '',
    password: '',
    futsal_id: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/futsal-admins`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tokens?.accessToken}`,
        },
        body: JSON.stringify({ ...formData, super_admin_id: superAdminId }),
      });

      if (response.ok) {
        setNotification({ message: "Futsal admin created successfully", type: 'success' });
        setFormData({
          futsal_name: '', location: '', city: '', username: '', email: '', phone: '', password: '', futsal_id: ''
        });
      } else {
        setNotification({ message: "Error creating futsal admin", type: 'info' });
      }
    } catch (error) {
      console.error('Error:', error);
      setNotification({ message: "Error creating futsal admin", type: 'info' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border rounded-lg p-6 bg-white">
      <h3 className="text-lg font-semibold mb-4">Create Futsal Admin</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <select value={formData.futsal_id} onChange={(e) => {
          const selectedFutsal = futsals.find(f => f.futsal_id.toString() === e.target.value);
          setFormData({
            ...formData,
            futsal_id: e.target.value,
            futsal_name: selectedFutsal?.name || '',
            location: selectedFutsal?.location || '',
            city: selectedFutsal?.city || ''
          });
        }} required className="w-full p-2 border border-gray-400 rounded resize-none focus:outline-none focus:ring-0 focus:border-gray-900 focus:border">
          <option value="">Select Futsal</option>
          {futsals.map((futsal) => (
            <option key={futsal.futsal_id} value={futsal.futsal_id}>{futsal.name}</option>
          ))}
        </select>
        <input type="text" placeholder="Futsal Name" value={formData.futsal_name} readOnly className="w-full p-2 border border-gray-400 rounded resize-none focus:outline-none focus:ring-0 focus:border-gray-900 focus:border bg-gray-100" />
        <input type="text" placeholder="Location" value={formData.location} readOnly className="w-full p-2 border border-gray-400 rounded resize-none focus:outline-none focus:ring-0 focus:border-gray-900 focus:border bg-gray-100" />
        <input type="text" placeholder="City" value={formData.city} readOnly className="w-full p-2 border border-gray-400 rounded resize-none focus:outline-none focus:ring-0 focus:border-gray-900 focus:border bg-gray-100" />
        <input type="text" placeholder="Username" value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} required className="w-full p-2 border border-gray-400 rounded resize-none focus:outline-none focus:ring-0 focus:border-gray-900 focus:border" />
        <input type="email" placeholder="Email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required className="w-full p-2 border border-gray-400 rounded resize-none focus:outline-none focus:ring-0 focus:border-gray-900 focus:border" />
        <input type="tel" placeholder="Phone (10 digits starting with 9)" value={formData.phone} maxLength={10} pattern="9[0-9]{9}" onChange={(e) => {
          const value = e.target.value.replace(/\D/g, "");
          if (value.length <= 10 && (value === "" || value.startsWith("9"))) {
            setFormData({ ...formData, phone: value });
          }
        }} required className="w-full p-2 border border-gray-400 rounded resize-none focus:outline-none focus:ring-0 focus:border-gray-900 focus:border" />
        <input type="password" placeholder="Password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required className="w-full p-2 border border-gray-400 rounded resize-none focus:outline-none focus:ring-0 focus:border-gray-900 focus:border" />
        <button type="submit" disabled={loading} className="bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50">
          {loading ? 'Creating...' : 'Create Futsal Admin'}
        </button>
      </form>
    </div>
  );
}

function EditUserForm({ user, onUpdate, onCancel, setNotification }: { user: any, onUpdate: (data: any) => void, onCancel: () => void, setNotification: React.Dispatch<React.SetStateAction<{message: string, type: 'success' | 'info'} | null>> }) {
  const [formData, setFormData] = useState({
    first_name: user.first_name,
    last_name: user.last_name,
    username: user.username,
    email: user.email,
    phone: user.phone,
    password: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/${user.user_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        onUpdate(formData);
        setNotification({ message: "User updated successfully", type: 'success' });
      } else {
        setNotification({ message: "Error updating user", type: 'info' });
      }
    } catch (error) {
      console.error('Error:', error);
      setNotification({ message: "Error updating user", type: 'info' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input type="text" placeholder="First Name" value={formData.first_name} onChange={(e) => setFormData({ ...formData, first_name: e.target.value })} required className="w-full p-2 border border-gray-400 rounded resize-none focus:outline-none focus:ring-0 focus:border-gray-900 focus:border" />
      <input type="text" placeholder="Last Name" value={formData.last_name} onChange={(e) => setFormData({ ...formData, last_name: e.target.value })} required className="w-full p-2 border border-gray-400 rounded resize-none focus:outline-none focus:ring-0 focus:border-gray-900 focus:border" />
      <input type="text" placeholder="Username" value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} required className="w-full p-2 border border-gray-400 rounded resize-none focus:outline-none focus:ring-0 focus:border-gray-900 focus:border" />
      <input type="email" placeholder="Email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required className="w-full p-2 border border-gray-400 rounded resize-none focus:outline-none focus:ring-0 focus:border-gray-900 focus:border" />
      <input type="tel" placeholder="Phone (10 digits starting with 9)" value={formData.phone} maxLength={10} pattern="9[0-9]{9}" onChange={(e) => {
        const value = e.target.value.replace(/\D/g, "");
        if (value.length <= 10 && (value === "" || value.startsWith("9"))) {
          setFormData({ ...formData, phone: value });
        }
      }} required className="w-full p-2 border border-gray-400 rounded resize-none focus:outline-none focus:ring-0 focus:border-gray-900 focus:border" />
      <input type="password" placeholder="New Password (leave empty)" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className="w-full p-2 border border-gray-400 rounded resize-none focus:outline-none focus:ring-0 focus:border-gray-900 focus:border" />
      <div className="flex space-x-4">
        <button type="submit" disabled={loading} className="bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50">
          {loading ? 'Updating...' : 'Update User'}
        </button>
        <button type="button" onClick={onCancel} className="bg-gray-600 text-white px-4 py-2 rounded">
          Cancel
        </button>
      </div>
    </form>
  );
}

function EditSuperAdminForm({ user, onUpdate, onCancel, setNotification }: { user: User, onUpdate: (user: User) => void, onCancel: () => void, setNotification: React.Dispatch<React.SetStateAction<{message: string, type: 'success' | 'info'} | null>> }) {
  const [formData, setFormData] = useState({
    username: user.username,
    email: user.email,
    password: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/superadmin/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const updatedUser = { ...user, ...formData };
        onUpdate(updatedUser);
      } else {
        setNotification({ message: "Error updating profile", type: 'info' });
      }
    } catch (error) {
      console.error('Error:', error);
      setNotification({ message: "Error updating profile", type: 'info' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input type="text" placeholder="Username" value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} required className="w-full p-2 border border-gray-400 rounded resize-none focus:outline-none focus:ring-0 focus:border-gray-900 focus:border" />
      <input type="email" placeholder="Email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required className="w-full p-2 border border-gray-400 rounded resize-none focus:outline-none focus:ring-0 focus:border-gray-900 focus:border" />
      <input type="password" placeholder="New Password (leave empty)" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className="w-full p-2 border border-gray-400 rounded resize-none focus:outline-none focus:ring-0 focus:border-gray-900 focus:border" />
      <div className="flex space-x-4">
        <button type="submit" disabled={loading} className="bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50">
          {loading ? 'Updating...' : 'Update Profile'}
        </button>
        <button type="button" onClick={onCancel} className="bg-gray-600 text-white px-4 py-2 rounded">
          Cancel
        </button>
      </div>
    </form>
  );
}

function EditBookingForm({ booking, onUpdate, onCancel, setNotification }: { booking: any, onUpdate: (data: any) => void, onCancel: () => void, setNotification: React.Dispatch<React.SetStateAction<{message: string, type: 'success' | 'info'} | null>> }) {
  const [step, setStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState(booking.booking_date?.split('T')[0] || '');
  const [selectedShift, setSelectedShift] = useState('');
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [selectedSlotId, setSelectedSlotId] = useState<number | null>(null);
  const [numberOfPlayers, setNumberOfPlayers] = useState(booking.number_of_players);
  const [teamName, setTeamName] = useState(booking.team_name || '');
  const [loading, setLoading] = useState(false);

  // Get futsal_id from the booking
  const futsalId = booking.futsal_id;

  const handleDateSubmit = () => {
    if (selectedDate) {
      setStep(2);
      setSelectedShift(''); // Reset shift when date changes
      setAvailableSlots([]);
      setSelectedSlotId(null);
    }
  };

  const handleShiftSubmit = async () => {
    if (selectedShift && selectedDate && futsalId) {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/time-slots/futsal/${futsalId}/date/${selectedDate}/shift/${selectedShift}`);
        if (response.ok) {
          const data = await response.json();
          setAvailableSlots(data.slots);
          setStep(3);
        }
      } catch (error) {
        console.error('Error fetching slots:', error);
      }
    }
  };

  const handleFinalSubmit = async () => {
    if (!selectedSlotId) return;

    setLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/bookings/${booking.booking_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slot_id: selectedSlotId,
          number_of_players: numberOfPlayers,
          team_name: teamName
        }),
      });

      if (response.ok) {
        onUpdate({ selectedDate, selectedSlotId, numberOfPlayers, teamName });
        setNotification({ message: "Booking updated successfully", type: 'success' });
      } else {
        setNotification({ message: "Error updating booking", type: 'info' });
      }
    } catch (error) {
      console.error('Error:', error);
      setNotification({ message: "Error updating booking", type: 'info' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-green-50 via-white to-blue-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-linear-to-r from-gray-900 via-green-900 to-blue-900 backdrop-blur-md shadow-2xl border-b border-green-500/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="relative">
                <img src="/logo/logo.png" alt="BookMyFutsal" className="h-12 w-12 rounded-lg shadow-lg ring-2 ring-green-400/50" />
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-lg animate-pulse"></div>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-white drop-shadow-lg">
                <span className="bg-linear-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">BookMy</span>
                <span className="text-white">Futsal</span>
              </h1>
            </div>

            {/* Welcome Message */}
            <div className="hidden md:flex items-center space-x-4">
              <div className="text-white">
                <p className="text-sm opacity-90">Super Admin Dashboard</p>
                <p className="font-semibold text-center ">Edit Booking</p>
              </div>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={onCancel}
              className="md:hidden p-2 rounded-lg text-gray-200 hover:text-green-400 hover:bg-green-900/50 transition-all duration-300 border border-gray-600/30"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Progress Indicator */}
      <div className="flex justify-center sm:justify-center py-8 bg-gray-50">
        <div className="max-w-4xl px-4">
          {/* Mobile: Progress Bar Style */}
          <div className="flex justify-center sm:hidden">
            <div className="w-full px-6">
              <div className="mb-3">
                <div className="flex justify-between text-xs text-gray-600 mb-2">
                  <span>Step {step} of 3</span>
                  <span>{Math.round((step / 3) * 100)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-lg h-3">
                  <div
                    className="bg-linear-to-r from-green-500 to-green-600 h-3 rounded-lg transition-all duration-300"
                    style={{ width: `${(step / 3) * 100}%` }}
                  ></div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-1 text-xs text-center">
                <span className={step >= 1 ? 'text-green-600 font-semibold' : 'text-gray-400'}>Date</span>
                <span className={step >= 2 ? 'text-green-600 font-semibold' : 'text-gray-400'}>Shift</span>
                <span className={step >= 3 ? 'text-green-600 font-semibold' : 'text-gray-400'}>Slot</span>
              </div>
            </div>
          </div>
          {/* Desktop: Horizontal */}
          <div className="hidden sm:flex sm:flex-row items-center space-x-4">
            <div className="flex items-center">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-lg ${
                step >= 1 ? 'bg-linear-to-r from-green-500 to-green-600' : 'bg-gray-300'
              }`}>
                {step > 1 ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  1
                )}
              </div>
              <span className={`ml-2 text-sm font-medium ${step >= 1 ? 'text-green-600' : 'text-gray-500'}`}>Date</span>
            </div>
            <div className={`w-8 h-0.5 ${step > 1 ? 'bg-linear-to-r from-green-500 to-green-600' : 'bg-gray-300'}`}></div>
            <div className="flex items-center">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-lg ${
                step >= 2 ? 'bg-linear-to-r from-green-500 to-green-600' : 'bg-gray-300'
              }`}>
                {step > 2 ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : step === 2 ? (
                  2
                ) : (
                  <span className="text-gray-500">2</span>
                )}
              </div>
              <span className={`ml-2 text-sm font-medium ${step >= 2 ? 'text-green-600' : 'text-gray-500'}`}>Shift</span>
            </div>
            <div className={`w-8 h-0.5 ${step > 2 ? 'bg-linear-to-r from-green-500 to-green-600' : 'bg-gray-300'}`}></div>
            <div className="flex items-center">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-lg ${
                step >= 3 ? 'bg-linear-to-r from-green-500 to-green-600' : 'bg-gray-300'
              }`}>
                {step > 3 ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : step === 3 ? (
                  3
                ) : (
                  <span className="text-gray-500">3</span>
                )}
              </div>
              <span className={`ml-2 text-sm font-medium ${step >= 3 ? 'text-green-600' : 'text-gray-500'}`}>Slot</span>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-2 sm:px-0">
          {/* Step 1: Select Date */}
          {step === 1 && (
            <div className="max-w-lg mx-auto">
              <div className="relative bg-white rounded-2xl shadow-2xl overflow-hidden transform transition-all duration-500 hover:scale-[1.02]">
                {/* Gradient Background */}
                <div className="absolute inset-0 bg-linear-to-br from-green-50 via-white to-blue-50 opacity-50"></div>

                {/* Content */}
                <div className="relative p-5">
                  {/* Header */}
                  <div className="text-center mb-5">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-linear-to-br from-green-500 to-green-600 rounded-lg mb-4 shadow-lg">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-bold bg-linear-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-2">
                      Select Your Date
                    </h2>
                    <p className="text-gray-600 text-sm">Choose the perfect day for your futsal adventure</p>
                  </div>

                  {/* Date Input */}
                  <div className="space-y-7">
                    <div className="relative">
                      <label htmlFor="bookingDate"  className="block text-sm font-semibold text-gray-700 mb-2">
                        📅 Booking Date
                      </label>
                      <div className="relative">
                        <input
                          type="date"
                          id="bookingDate"
                          value={selectedDate}
                          onChange={(e) => setSelectedDate(e.target.value)}
                          min={new Date().toISOString().split("T")[0]}
                          required
                          className="w-full px-4 py-2.5 pl-9 bg-white border border-gray-200 rounded-lg text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400/50 focus:border-green-400/50 transition-all duration-300 font-medium text-sm"
                        />
                        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-500">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4 pt-4">
                      <button
                        onClick={onCancel}
                        className="flex-1 order-2 sm:order-1 bg-linear-to-r from-gray-500 to-gray-600 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 border border-gray-400/30"
                      >
                        <span className="flex items-center justify-center">
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                          </svg>
                          Cancel
                        </span>
                      </button>
                      <button
                        onClick={handleDateSubmit}
                        disabled={!selectedDate}
                        className="flex-1 order-1 sm:order-2 bg-linear-to-r from-green-500 to-green-600 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none border border-green-400/30"
                      >
                        <span className="flex items-center justify-center">
                          Next: Select Shift
                          <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </span>
                      </button>
                    </div>
                  </div>


                </div>
              </div>
            </div>
          )}

          {/* Step 2: Select Shift */}
          {step === 2 && (
            <div className="max-w-lg mx-auto">
              <div className="relative bg-white rounded-2xl shadow-2xl overflow-hidden transform transition-all duration-500 hover:scale-[1.02]">
                {/* Gradient Background */}
                <div className="absolute inset-0 bg-linear-to-br from-green-50 via-white to-blue-50 opacity-50"></div>

                {/* Content */}
                <div className="relative p-8">
                  {/* Header */}
                  <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-linear-to-br from-green-500 to-green-600 rounded-lg mb-4 shadow-lg">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-bold bg-linear-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-2">
                      Choose Your Shift
                    </h2>
                    <p className="text-gray-600 text-sm">Pick the time period that works best for you</p>
                  </div>

                  {/* Selected Date Info */}
                  <div className="bg-linear-to-r from-green-100 to-blue-100 rounded-xl p-4 mb-6 border border-green-200">
                    <div className="flex items-center justify-center">
                      <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-sm font-medium text-green-800">
                        Selected Date: <span className="font-bold">{selectedDate}</span>
                      </span>
                    </div>
                  </div>

                  {/* Shift Selection */}
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      {[
                        { name: "Morning", time: "6 AM - 10 AM" },
                        { name: "Day", time: "10 AM - 2 PM" },
                        { name: "Evening", time: "2 PM - 6 PM" },
                        { name: "Night", time: "6 PM - 11 PM" }
                      ].map((shift) => (
                        <button
                          key={shift.name}
                          onClick={() => setSelectedShift(shift.name)}
                          className={`relative p-6 border-2 rounded-xl transition-all duration-300 transform hover:scale-105 ${
                            selectedShift === shift.name
                              ? "bg-linear-to-br from-green-500 to-green-600 border-green-500 text-white shadow-lg"
                              : "bg-white border-gray-200 hover:border-green-300 hover:shadow-md"
                          }`}
                        >
                          {selectedShift === shift.name && (
                            <div className="absolute top-2 right-2 w-6 h-6 bg-white rounded-full flex items-center justify-center">
                              <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          )}
                          <div className={`font-bold text-lg mb-1 ${selectedShift === shift.name ? 'text-white' : 'text-gray-800'}`}>
                            {shift.name}
                          </div>
                          <div className={`text-sm ${selectedShift === shift.name ? 'text-green-100' : 'text-gray-600'}`}>
                            {shift.time}
                          </div>
                        </button>
                      ))}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4 pt-4">
                      <button
                        onClick={() => setStep(1)}
                        className="flex-1 order-2 sm:order-1 bg-linear-to-r from-gray-500 to-gray-600 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 border border-gray-400/30"
                      >
                        <span className="flex items-center justify-center">
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                          </svg>
                          Back
                        </span>
                      </button>
                      <button
                        onClick={handleShiftSubmit}
                        disabled={!selectedShift}
                        className="flex-1 order-1 sm:order-2 bg-linear-to-r from-green-500 to-green-600 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none border border-green-400/30"
                      >
                        <span className="flex items-center justify-center">
                          Next: Select Slot
                          <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </span>
                      </button>
                    </div>
                  </div>


                </div>
              </div>
            </div>
          )}

          {/* Step 3: Select Slot and Enter Details */}
          {step === 3 && (
            <div className="w-full max-w-4xl mx-auto">
              <div className="relative bg-white rounded-2xl shadow-2xl overflow-hidden transform transition-all duration-500 hover:scale-[1.02]">
                {/* Gradient Background */}
                <div className="absolute inset-0 bg-linear-to-br from-green-50 via-white to-blue-50 opacity-50"></div>

                {/* Content */}
                <div className="relative p-8">
                  {/* Header */}
                  <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-linear-to-br from-green-500 to-green-600 rounded-lg mb-4 shadow-lg">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-bold bg-linear-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-2">
                      Pick Your Time Slot
                    </h2>
                    <p className="text-gray-600 text-sm">Choose the perfect time for your game</p>
                  </div>

                  {/* Date and Shift Info */}
                  <div className="bg-linear-to-r from-green-100 to-blue-100 rounded-xl p-4 mb-6 border border-green-200">
                    <div className="flex items-center justify-center space-x-6">
                      <div className="flex items-center">
                        <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="text-sm font-medium text-green-800">
                          Date: <span className="font-bold">{selectedDate}</span>
                        </span>
                      </div>
                      <div className="w-px h-6 bg-green-300"></div>
                      <div className="flex items-center">
                        <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                        <span className="text-sm font-medium text-green-800">
                          Shift: <span className="font-bold">{selectedShift}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Slot Selection */}
                  {availableSlots.length > 0 ? (
                    <div className="mb-8">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">Available Time Slots</h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {availableSlots.map((slot: any) => (
                          <button
                            key={slot.slot_id}
                            onClick={() => slot.display_status === 'available' && setSelectedSlotId(slot.slot_id)}
                            disabled={
                              (slot.display_status === "booked" ||
                              slot.display_status === "expired" ||
                              slot.status === "disabled") && !selectedSlotId === slot.slot_id
                            }
                            className={`relative p-4 border-2 rounded-xl text-center transition-all duration-300 transform hover:scale-105 ${
                              selectedSlotId === slot.slot_id
                                ? "bg-linear-to-br from-green-500 to-green-600 border-green-500 text-white shadow-lg"
                                : slot.display_status === "booked"
                                ? "bg-red-50 border-red-300 cursor-not-allowed opacity-60"
                                : slot.display_status === "expired"
                                ? "bg-yellow-50 border-yellow-300 cursor-not-allowed opacity-60"
                                : slot.status === "disabled"
                                ? "bg-gray-50 border-gray-300 cursor-not-allowed opacity-60"
                                : slot.status === "pending"
                                ? "bg-orange-50 border-orange-300 hover:border-green-300 hover:shadow-md"
                                : "bg-white border-gray-200 hover:border-green-300 hover:shadow-md"
                            }`}
                          >
                            {selectedSlotId === slot.slot_id && (
                              <div className="absolute top-1 right-2 w-4 h-4 bg-white rounded-lg flex items-center justify-center shadow-sm">
                                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              </div>
                            )}
                            <div className={`font-bold text-sm mb-1 ${
                              selectedSlotId === slot.slot_id ? 'text-white' :
                              slot.display_status === "booked" ? 'text-red-600' :
                              slot.display_status === "expired" ? 'text-yellow-600' :
                              slot.status === "disabled" ? 'text-gray-600' :
                              slot.status === "pending" ? 'text-gray-800' :
                              'text-gray-800'
                            }`}>
                              {(() => {
                                const startHour = parseInt(slot.start_time.split(':')[0]);
                                const endHour = parseInt(slot.end_time.split(':')[0]);
                                const startDisplay = startHour === 0 ? 12 : startHour > 12 ? startHour - 12 : startHour;
                                const endDisplay = endHour === 0 ? 12 : endHour > 12 ? endHour - 12 : endHour;
                                const startPeriod = startHour >= 12 ? 'PM' : 'AM';
                                const endPeriod = endHour >= 12 ? 'PM' : 'AM';
                                return `${startDisplay}${startPeriod}-${endDisplay}${endPeriod}`;
                              })()}
                            </div>
                            <div className={`text-sm ${
                              selectedSlotId === slot.slot_id ? 'text-white' :
                              slot.display_status === "booked" ? 'text-red-500' :
                              slot.display_status === "expired" ? 'text-yellow-500' :
                              slot.status === "disabled" ? 'text-gray-500' :
                              slot.status === "pending" ? 'text-orange-500' :
                              'text-gray-600'
                            }`}>
                              {selectedSlotId === slot.slot_id
                                ? "✅ Selected"
                                : slot.display_status === "booked"
                                ? `👤 Booked`
                                : slot.display_status === "expired"
                                ? "⏰ Expired"
                                : slot.status === "disabled"
                                ? "🚫 Disabled"
                                : slot.status === "pending"
                                ? "⏳ In Process"
                                : "✅ Available"}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <p className="text-gray-500 text-lg font-medium">No slots available for this shift</p>
                      <p className="text-gray-400 text-sm mt-1">Try selecting a different shift or date</p>
                    </div>
                  )}

                  {/* Details Form */}
                  {selectedSlotId && (
                    <div className="border-t border-gray-200 pt-8">
                      <div className="text-center mb-6">
                        <h3 className="text-xl font-bold text-gray-800 mb-2">Enter Your Details</h3>
                        <p className="text-gray-600 text-sm">Complete your booking information</p>
                      </div>

                      <form onSubmit={(e) => { e.preventDefault(); handleFinalSubmit(); }} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="relative">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                              👥 Number of Players
                            </label>
                            <div className="relative">
                              <input
                                type="number"
                                id="number"
                                placeholder="1-10 players"
                                value={numberOfPlayers}
                                onChange={(e) => setNumberOfPlayers(Number(e.target.value))}
                                min="1"
                                max="10"
                                required
                                className="w-full px-4 py-3 pl-12 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all duration-300 text-gray-700 font-medium"
                              />
                              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-500">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                              </div>
                            </div>
                          </div>

                          <div className="relative">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                              🏆 Team Name <span className="text-gray-500 font-normal">(optional)</span>
                            </label>
                            <div className="relative">
                              <input
                                type="text"
                                id="teamname"
                                placeholder="Enter team name"
                                value={teamName}
                                onChange={(e) => setTeamName(e.target.value)}
                                className="w-full px-4 py-3 pl-12 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all duration-300 text-gray-700 font-medium"
                              />
                              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-500">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row gap-4 pt-6">
                          <button
                            type="button"
                            onClick={() => setStep(2)}
                            className="flex-1 order-2 sm:order-1 bg-linear-to-r from-gray-500 to-gray-600 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 border border-gray-400/30"
                          >
                            <span className="flex items-center justify-center">
                              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                              </svg>
                              Back
                            </span>
                          </button>
                          <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 order-1 sm:order-2 bg-linear-to-r from-green-500 to-green-600 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none border border-green-400/30"
                          >
                            <span className="flex items-center justify-center">
                              {loading ? (
                                <>
                                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                  Updating Booking...
                                </>
                              ) : (
                                <>
                                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                  Update Booking
                                </>
                              )}
                            </span>
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  {/* Back Button when no slot selected */}
                  {!selectedSlotId && availableSlots.length > 0 && (
                    <div className="flex justify-center pt-6">
                      <button
                        onClick={() => setStep(2)}
                        className="bg-linear-to-r from-gray-500 to-gray-600 text-white font-semibold py-3 px-8 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 border border-gray-400/30"
                      >
                        <span className="flex items-center justify-center">
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                          </svg>
                          Back to Shift Selection
                        </span>
                      </button>
                    </div>
                  )}


                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}