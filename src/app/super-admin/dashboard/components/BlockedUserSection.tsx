import { useState, useEffect } from 'react';
import { useUsers } from '../hooks/useUsers';
import { ConfirmModal } from './modals/ConfirmModal';
import { NotificationModal } from './modals/NotificationModal';

interface BlockedUserSectionProps {
  isVisible: boolean;
  onToggle: () => void;
}

export function BlockedUserSection({ isVisible, onToggle }: BlockedUserSectionProps) {
  const { blockedUsers, unblockUser } = useUsers();
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'info'} | null>(null);
  const [confirmModal, setConfirmModal] = useState<{isOpen: boolean, message: string, onConfirm: () => void}>({isOpen: false, message: '', onConfirm: () => {}});

  // Auto-hide notifications after 2 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const handleUnblockUser = (userId: number) => {
    setConfirmModal({
      isOpen: true,
      message: 'Are you sure you want to unblock this user?',
      onConfirm: async () => {
        setConfirmModal({ isOpen: false, message: '', onConfirm: () => {} });
        const result = await unblockUser(userId);
        if (result.success) {
          setNotification({ message: 'User unblocked successfully', type: 'success' });
        } else {
          setNotification({ message: result.error || 'Error unblocking user', type: 'info' });
        }
      }
    });
  };

  if (!isVisible) {
    return (
      <div className="border-2 border-gray-200 rounded-lg p-2">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-gray-900">Blocked Users</h3>
          <button onClick={onToggle} className="bg-linear-to-r from-blue-500 to-blue-600 text-white font-bold py-2.5 px-6 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 border border-blue-400/30 hover:border-blue-400/50">
            Show Users
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="border-2 border-gray-200 rounded-lg p-2">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-gray-900">Blocked Users</h3>
        <button onClick={onToggle} className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded">
          Hide
        </button>
      </div>

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

      {/* Modals */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal({ isOpen: false, message: '', onConfirm: () => {} })}
      />

      <NotificationModal
        isOpen={!!notification}
        message={notification?.message || ''}
        type={notification?.type || 'info'}
        onClose={() => setNotification(null)}
      />
    </div>
  );
}