import { useState, useEffect } from 'react';
import { useUsers } from '../hooks/useUsers';
import { useBulkOperations } from '../hooks/useBulkOperations';
import { ConfirmModal } from './modals/ConfirmModal';
import { NotificationModal } from './modals/NotificationModal';
import { EditUserForm } from './forms/EditUserForm';
import { BlockReasonModal } from './modals/BlockReasonModal';

interface UserSectionProps {
  isVisible: boolean;
  onToggle: () => void;
}

export function UserSection({ isVisible, onToggle }: UserSectionProps) {
  const { users, blockedUsers, updateUser, deleteUser, bulkDelete, blockUser, refetchUsers } = useUsers();
  const { selectedItems, showCheckboxes, toggleSelection, toggleSelectAll, clearSelection, selectedCount } = useBulkOperations();
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'info'} | null>(null);
  const [confirmModal, setConfirmModal] = useState<{isOpen: boolean, message: string, onConfirm: () => void}>({isOpen: false, message: '', onConfirm: () => {}});
  const [blockReasonModal, setBlockReasonModal] = useState<{isOpen: boolean, userId: number, onConfirm: (reason: string) => void}>({isOpen: false, userId: 0, onConfirm: () => {}});

  // Auto-hide notifications after 2 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const handleDeleteUser = (id: number) => {
    setConfirmModal({
      isOpen: true,
      message: 'Are you sure you want to delete this user?',
      onConfirm: async () => {
        setConfirmModal({ isOpen: false, message: '', onConfirm: () => {} });
        const result = await deleteUser(id);
        if (result.success) {
          setNotification({ message: 'User deleted successfully', type: 'success' });
        } else {
          setNotification({ message: result.error || 'Error deleting user', type: 'info' });
        }
      }
    });
  };

  const handleDeleteSelectedUsers = async () => {
    if (selectedItems.length === 0) {
      setNotification({ message: 'No users selected', type: 'info' });
      return;
    }

    setConfirmModal({
      isOpen: true,
      message: `Are you sure you want to delete ${selectedItems.length} selected user${selectedItems.length > 1 ? 's' : ''}?`,
      onConfirm: async () => {
        setConfirmModal({ isOpen: false, message: '', onConfirm: () => {} });
        const result = await bulkDelete(selectedItems);
        if (result.success) {
          setNotification({ message: `${result.deletedCount ?? selectedItems.length} user${(result.deletedCount ?? selectedItems.length) > 1 ? 's' : ''} deleted successfully!`, type: 'success' });
          clearSelection();
        } else {
          setNotification({ message: result.error || 'Error deleting users', type: 'info' });
        }
      }
    });
  };

  const handleBlockUser = (userId: number) => {
    setBlockReasonModal({
      isOpen: true,
      userId,
      onConfirm: async (reason: string) => {
        const result = await blockUser(userId, reason);
        if (result.success) {
          setNotification({ message: `User blocked until ${new Date(result.blockedUntil!).toLocaleString()}`, type: 'success' });
        } else {
          setNotification({ message: result.error || 'Error blocking user', type: 'info' });
        }
        setBlockReasonModal({ isOpen: false, userId: 0, onConfirm: () => {} });
      }
    });
  };

  if (!isVisible) {
    return (
      <div className="border-2 border-gray-200 rounded-lg p-2">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-gray-900">Users</h3>
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
        <h3 className="text-xl font-semibold text-gray-900">Users</h3>
        <button onClick={onToggle} className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded">
          Hide
        </button>
      </div>

      {/* Select All and Delete Controls for Users */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="selectAllUsers"
              checked={showCheckboxes && selectedCount === users.length && users.length > 0}
              onChange={(e) => toggleSelectAll(users, 'user_id')}
              className="mr-2"
            />
            <label htmlFor="selectAllUsers" className="text-sm font-medium text-gray-700">
              Select All Users ({selectedCount} selected)
            </label>
          </div>
          {selectedCount > 0 && (
            <button
              onClick={handleDeleteSelectedUsers}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
            >
              Delete Selected ({selectedCount})
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
              refetchUsers();
            } else {
              // Filter locally for simplicity
            }
          }}
          className="w-full p-2 border border-gray-400 rounded resize-none focus:outline-none focus:ring-0 focus:border-gray-900 focus:border pr-10"
        />
        <button
          onClick={() => refetchUsers()}
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
                {showCheckboxes && (
                  <input
                    type="checkbox"
                    checked={selectedItems.includes(user.user_id)}
                    onChange={() => toggleSelection(user.user_id)}
                    className="mr-2"
                  />
                )}
                <h4 className="font-bold">{user.first_name} {user.last_name}</h4>
              </div>
              <p>{user.username} - {user.email} - {user.phone}</p>
            </div>
            <div className="flex space-x-2 mt-4 md:ml-4 md:mt-0">
              <button
                onClick={() => setEditingUser(user)}
                className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded"
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

      <BlockReasonModal
        isOpen={blockReasonModal.isOpen}
        onConfirm={blockReasonModal.onConfirm}
        onCancel={() => setBlockReasonModal({ isOpen: false, userId: 0, onConfirm: () => {} })}
      />

      {editingUser && (
        <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Edit User</h3>
            <EditUserForm
              user={editingUser}
              updateUser={updateUser}
              onUpdate={() => {
                refetchUsers();
                setEditingUser(null);
              }}
              onCancel={() => setEditingUser(null)}
              setNotification={setNotification}
            />
          </div>
        </div>
      )}
    </div>
  );
}