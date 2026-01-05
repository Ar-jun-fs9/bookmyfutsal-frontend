import { useState, useEffect } from 'react';
import { useFutsals } from '../hooks/useFutsals';
import { useBulkOperations } from '../hooks/useBulkOperations';
import { ConfirmModal } from './modals/ConfirmModal';
import { NotificationModal } from './modals/NotificationModal';
import { FutsalDetailsModal } from './modals/FutsalDetailsModal';
import { CreateFutsalForm } from './forms/CreateFutsalForm';
import { EditFutsalForm } from './forms/EditFutsalForm';

interface FutsalSectionProps {
  isVisible: boolean;
  onToggle: () => void;
}

export function FutsalSection({ isVisible, onToggle }: FutsalSectionProps) {
  const { futsals, loading, deleteFutsal, bulkDelete } = useFutsals();
  const { selectedItems, showCheckboxes, toggleSelection, toggleSelectAll, clearSelection, selectedCount } = useBulkOperations();
  const [showCreateFutsal, setShowCreateFutsal] = useState(false);
  const [editingFutsalId, setEditingFutsalId] = useState<number | null>(null);
  const [viewingFutsalDetails, setViewingFutsalDetails] = useState<any>(null);
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

  const handleDeleteFutsal = (id: number) => {
    setConfirmModal({
      isOpen: true,
      message: 'Are you sure you want to delete this futsal?',
      onConfirm: async () => {
        setConfirmModal({ isOpen: false, message: '', onConfirm: () => {} });
        const result = await deleteFutsal(id);
        if (result.success) {
          setNotification({ message: 'Futsal deleted successfully', type: 'success' });
        } else {
          setNotification({ message: result.error || 'Error deleting futsal', type: 'info' });
        }
      }
    });
  };

  const handleDeleteSelectedFutsals = async () => {
    if (selectedItems.length === 0) {
      setNotification({ message: 'No futsals selected', type: 'info' });
      return;
    }

    setConfirmModal({
      isOpen: true,
      message: `Are you sure you want to delete ${selectedItems.length} selected futsal${selectedItems.length > 1 ? 's' : ''}?`,
      onConfirm: async () => {
        setConfirmModal({ isOpen: false, message: '', onConfirm: () => {} });
        const result = await bulkDelete(selectedItems);
        if (result.success) {
          setNotification({ message: `${result.deletedCount ?? selectedItems.length} futsal${(result.deletedCount ?? selectedItems.length) > 1 ? 's' : ''} deleted successfully!`, type: 'success' });
          clearSelection();
        } else {
          setNotification({ message: result.error || 'Error deleting futsals', type: 'info' });
        }
      }
    });
  };

  if (!isVisible) {
    return (
      <div className="border-2 border-gray-200 rounded-lg p-2">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-gray-900">Futsals</h3>
          <button
            onClick={onToggle}
            className="bg-linear-to-r from-blue-500 to-blue-600 text-white font-bold py-2.5 px-6 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 border border-blue-400/30 hover:border-blue-400/50"
          >
            Show Futsals
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="border-2 border-gray-200 rounded-lg p-2">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-gray-900">Futsals</h3>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowCreateFutsal(!showCreateFutsal)}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
          >
            {showCreateFutsal ? 'Cancel Create' : 'Create Futsal'}
          </button>
          <button
            onClick={onToggle}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded"
          >
            Hide
          </button>
        </div>
      </div>

      {showCreateFutsal && (
        <CreateFutsalForm
          onSuccess={() => setShowCreateFutsal(false)}
          setNotification={setNotification}
        />
      )}

      {/* Bulk operations controls */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="selectAllFutsals"
              checked={showCheckboxes && selectedCount === futsals.length && futsals.length > 0}
              onChange={(e) => toggleSelectAll(futsals, 'futsal_id')}
              className="mr-2"
            />
            <label htmlFor="selectAllFutsals" className="text-sm font-medium text-gray-700">
              Select All Futsals ({selectedCount} selected)
            </label>
          </div>
          {selectedCount > 0 && (
            <button
              onClick={handleDeleteSelectedFutsals}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
            >
              Delete Selected ({selectedCount})
            </button>
          )}
        </div>
      </div>

      {/* Futsals list */}
      <div className="space-y-4">
        {futsals.map((futsal) => (
          <div key={futsal.futsal_id} className="border rounded p-4">
            {editingFutsalId === futsal.futsal_id ? (
              <EditFutsalForm
                futsal={futsal}
                onUpdate={() => setEditingFutsalId(null)}
                onCancel={() => setEditingFutsalId(null)}
                setNotification={setNotification}
              />
            ) : (
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  {showCheckboxes && (
                    <input
                      type="checkbox"
                      checked={selectedItems.includes(futsal.futsal_id)}
                      onChange={() => toggleSelection(futsal.futsal_id)}
                      className="mr-2"
                    />
                  )}
                  <h4 className="font-bold">{futsal.name}</h4>
                  <p>{futsal.location}, {futsal.city}</p>
                  {futsal.price_per_hour && <p>Price: Rs. {futsal.price_per_hour}/hour</p>}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setViewingFutsalDetails(futsal)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded"
                  >
                    Details
                  </button>
                  <button
                    onClick={() => setEditingFutsalId(futsal.futsal_id)}
                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded"
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

      <FutsalDetailsModal
        isOpen={!!viewingFutsalDetails}
        futsal={viewingFutsalDetails}
        onClose={() => setViewingFutsalDetails(null)}
      />
    </div>
  );
}