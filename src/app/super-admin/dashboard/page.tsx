'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { useFutsals } from './hooks/useFutsals';
import { DashboardHeader } from './components/DashboardHeader';
import { DashboardInfo } from './components/DashboardInfo';
import { FutsalSection } from './components/FutsalSection';
import { AdminSection } from './components/AdminSection';
import { UserSection } from './components/UserSection';
import { BlockedUserSection } from './components/BlockedUserSection';
import { BookingSection } from './components/BookingSection';
import { RatingSection } from './components/RatingSection';
import { SlotSection } from './components/SlotSection';
import { CreateFutsalForm } from './components/forms/CreateFutsalForm';
import { CreateFutsalAdminForm } from './components/forms/CreateFutsalAdminForm';
import { ConfirmModal } from './components/modals/ConfirmModal';
import { NotificationModal } from './components/modals/NotificationModal';

interface User {
  id: number;
  username: string;
  email: string;
}

export default function SuperAdminDashboard() {
  const { hydrated, tokens } = useAuthStore();
  const { futsals } = useFutsals();
  const [user, setUser] = useState<User | null>(null);
  const [futsalAdmins, setFutsalAdmins] = useState<any[]>([]);
  const [showCreateFutsal, setShowCreateFutsal] = useState(false);
  const [showCreateAdmin, setShowCreateAdmin] = useState(false);
  const [showBookings, setShowBookings] = useState(false);
  const [showSlots, setShowSlots] = useState(false);
  const [showRatings, setShowRatings] = useState(false);
  const [showFutsals, setShowFutsals] = useState(false);
  const [showAdmins, setShowAdmins] = useState(false);
  const [showBlockedUsers, setShowBlockedUsers] = useState(false);
  const [showUsers, setShowUsers] = useState(false);
  const [notification, setNotification] = useState<{ message: string, type: 'success' | 'info' } | null>(null);
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean, message: string, onConfirm: () => void }>({ isOpen: false, message: '', onConfirm: () => {} });
  const router = useRouter();

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
        router.push('/super-admin/signin');
      }
    } catch (error) {
      console.error('Error fetching futsal admins:', error);
    }
  };

  useEffect(() => {
    if (hydrated) {
      const storedUser = sessionStorage.getItem('superadmin');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
        fetchFutsalAdmins();
      } else {
        router.push('/super-admin/signin');
      }
    }
  }, [hydrated, router]);

  // Auto-hide notifications after 2 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

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
      <DashboardHeader onLogout={handleLogout} />
      <main className="max-w-7xl mx-auto sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0 pb-20">
          <div className="space-y-6">
            <DashboardInfo user={user} onUpdate={setUser} />
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
                {showBookings ? 'Hide' : 'Manage Bookings'}
              </button>
              <button
                onClick={() => setShowSlots(!showSlots)}
                className="bg-linear-to-r from-orange-500 to-orange-600 text-white font-bold py-3 px-4 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 border border-orange-400/30 hover:border-orange-400/50 text-sm sm:text-base"
              >
                {showSlots ? 'Hide' : 'Manage Slots'}
              </button>
              <button
                onClick={() => setShowRatings(!showRatings)}
                className="bg-linear-to-r from-pink-500 to-pink-600 text-white font-bold py-3 px-4 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 border border-pink-400/30 hover:border-pink-400/50 text-sm sm:text-base"
              >
                {showRatings ? 'Hide' : 'Manage Ratings'}
              </button>
            </div>
            {showCreateFutsal && <CreateFutsalForm onSuccess={() => {}} setNotification={setNotification} />}
            {showCreateAdmin && <CreateFutsalAdminForm futsals={futsals} superAdminId={user?.id || 0} setNotification={setNotification} onSuccess={fetchFutsalAdmins} />}
            <SlotSection isVisible={showSlots} onToggle={() => setShowSlots(!showSlots)} />
            <FutsalSection isVisible={showFutsals} onToggle={() => setShowFutsals(!showFutsals)} />
            <AdminSection futsals={futsals} superAdminId={user?.id || 0} futsalAdmins={futsalAdmins} setFutsalAdmins={setFutsalAdmins} fetchFutsalAdmins={fetchFutsalAdmins} isVisible={showAdmins} onToggle={() => setShowAdmins(!showAdmins)} />
            <UserSection isVisible={showUsers} onToggle={() => setShowUsers(!showUsers)} />
            <BlockedUserSection isVisible={showBlockedUsers} onToggle={() => setShowBlockedUsers(!showBlockedUsers)} />
            <BookingSection isVisible={showBookings} onToggle={() => setShowBookings(!showBookings)} />
            <RatingSection isVisible={showRatings} onToggle={() => setShowRatings(!showRatings)} />
            
          </div>
        </div>
      </main>
      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal({ isOpen: false, message: '', onConfirm: () => {} })}
      />
      {/* Notification Modal */}
      <NotificationModal
        isOpen={!!notification}
        message={notification?.message || ''}
        type={notification?.type || 'info'}
        onClose={() => setNotification(null)}
      />

      {/* Notification Toast */}
      {notification && (
        <div className="fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded shadow-lg z-50">
          {notification.message}
        </div>
      )}
    </div>
  );
}