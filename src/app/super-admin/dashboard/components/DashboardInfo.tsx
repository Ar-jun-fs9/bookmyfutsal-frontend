import { useState, useEffect } from 'react';
import { EditSuperAdminForm } from './forms/EditSuperAdminForm';
import { NotificationModal } from './modals/NotificationModal';

interface User {
  id: number;
  username: string;
  email: string;
}

interface DashboardInfoProps {
  user: User | null;
  onUpdate: (user: User) => void;
}

export function DashboardInfo({ user, onUpdate }: DashboardInfoProps) {
  const [editingSuperAdmin, setEditingSuperAdmin] = useState(false);
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'info'} | null>(null);

  // Auto-hide notifications after 2 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  return (
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
              onUpdate(updatedUser);
              setEditingSuperAdmin(false);
              setNotification({ message: 'Profile update successfully', type: 'success' });
            }}
            onCancel={() => setEditingSuperAdmin(false)}
            setNotification={setNotification}
          />
        )}

        {/* Notification Modal */}
        <NotificationModal
          isOpen={!!notification}
          message={notification?.message || ''}
          type={notification?.type || 'info'}
          onClose={() => setNotification(null)}
        />
      </div>
    </div>
  );
}
