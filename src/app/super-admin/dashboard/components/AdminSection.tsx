import { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useFutsalAdmins } from '../hooks/useFutsalAdmins';
import { useBulkOperations } from '../hooks/useBulkOperations';
import { ConfirmModal } from './modals/ConfirmModal';
import { NotificationModal } from './modals/NotificationModal';
import { CreateFutsalAdminForm } from './forms/CreateFutsalAdminForm';
import { EditFutsalAdminForm } from './forms/EditFutsalAdminForm';

interface Futsal {
  futsal_id: number;
  name: string;
  location: string;
  city: string;
}

interface AdminSectionProps {
  futsals: Futsal[];
  superAdminId: number;
  isVisible: boolean;
  onToggle: () => void;
}

export function AdminSection({ futsals, superAdminId, isVisible, onToggle }: AdminSectionProps) {
  const { tokens } = useAuthStore();
  const { admins, loading, error, deleteAdmin, bulkDelete, refetch } = useFutsalAdmins();
  const { selectedItems, showCheckboxes, toggleSelection, toggleSelectAll, clearSelection, selectedCount } = useBulkOperations();
  const [showCreateAdmin, setShowCreateAdmin] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<any | null>(null);
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


  const handleDeleteAdmin = (id: number) => {
    setConfirmModal({
      isOpen: true,
      message: 'Are you sure you want to delete this futsal admin?',
      onConfirm: async () => {
        setConfirmModal({ isOpen: false, message: '', onConfirm: () => {} });
        const result = await deleteAdmin(id);
        if (result.success) {
          setNotification({ message: 'Futsal admin deleted successfully', type: 'success' });
        } else {
          setNotification({ message: result.error || 'Error deleting futsal admin', type: 'info' });
        }
      }
    });
  };

  const handleDeleteSelectedAdmins = async () => {
    if (selectedItems.length === 0) {
      setNotification({ message: 'No admins selected', type: 'info' });
      return;
    }

    setConfirmModal({
      isOpen: true,
      message: `Are you sure you want to delete ${selectedItems.length} selected futsal admin${selectedItems.length > 1 ? 's' : ''}?`,
      onConfirm: async () => {
        setConfirmModal({ isOpen: false, message: '', onConfirm: () => {} });
        const result = await bulkDelete(selectedItems);
        if (result.success) {
          setNotification({ message: `${result.deletedCount ?? selectedItems.length} futsal admin${(result.deletedCount ?? selectedItems.length) > 1 ? 's' : ''} deleted successfully!`, type: 'success' });
          clearSelection();
        } else {
          setNotification({ message: result.error || 'Error deleting futsal admins', type: 'info' });
        }
      }
    });
  };

  if (!isVisible) {
    return (
      <div className="border-2 border-gray-200 rounded-lg p-2">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-gray-900">Futsal Admins</h3>
          <button
            onClick={onToggle}
            className="bg-linear-to-r from-blue-500 to-blue-600 text-white font-bold py-2.5 px-6 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 border border-blue-400/30 hover:border-blue-400/50"
          >
            Show Admins
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="border-2 border-gray-200 rounded-lg p-2">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-gray-900">Futsal Admins</h3>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowCreateAdmin(!showCreateAdmin)}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
          >
            {showCreateAdmin ? 'Cancel Create' : 'Create Admin'}
          </button>
          <button
            onClick={onToggle}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded"
          >
            Hide
          </button>
        </div>
      </div>

      {showCreateAdmin && (
        <CreateFutsalAdminForm
          futsals={futsals}
          superAdminId={superAdminId}
          setNotification={setNotification}
          onSuccess={refetch}
        />
      )}

      {/* Bulk operations controls */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="selectAllAdmins"
              checked={showCheckboxes && selectedCount === admins.length && admins.length > 0}
              onChange={(e) => toggleSelectAll(admins, 'id')}
              className="mr-2"
            />
            <label htmlFor="selectAllAdmins" className="text-sm font-medium text-gray-700">
              Select All Futsal Admins ({selectedCount} selected)
            </label>
          </div>
          {selectedCount > 0 && (
            <button
              onClick={handleDeleteSelectedAdmins}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
            >
              Delete Selected ({selectedCount})
            </button>
          )}
        </div>
      </div>

      {/* Admins list */}
      <div className="space-y-4">
        {admins.map((admin) => (
          <div key={admin.id} className="border rounded p-4">
            {editingAdmin?.id === admin.id ? (
              <EditFutsalAdminForm
                admin={admin}
                tokens={tokens}
                onUpdate={() => {
                  refetch();
                  setEditingAdmin(null);
                }}
                onCancel={() => setEditingAdmin(null)}
                setNotification={setNotification}
              />
            ) : (
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  {showCheckboxes && (
                    <input
                      type="checkbox"
                      checked={selectedItems.includes(admin.id)}
                      onChange={() => toggleSelection(admin.id)}
                      className="mr-2"
                    />
                  )}
                  <h4 className="font-bold">{admin.username}</h4>
                  <p>{admin.email} - {admin.phone}</p>
                  <p>Futsal: {admin.futsal_name}</p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setEditingAdmin(admin)}
                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteAdmin(admin.id)}
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