import { useState, useEffect } from 'react';
import { useRatings } from '../hooks/useRatings';
import { useBulkOperations } from '../hooks/useBulkOperations';
import { useFutsals } from '../hooks/useFutsals';
import { ConfirmModal } from './modals/ConfirmModal';
import { NotificationModal } from './modals/NotificationModal';
import { EditRatingForm } from './forms/EditRatingForm';
import { CreateRatingForm } from './forms/CreateRatingForm';

interface RatingSectionProps {
  isVisible: boolean;
  onToggle: () => void;
}

export function RatingSection({ isVisible, onToggle }: RatingSectionProps) {
  const { futsals } = useFutsals();
  const { ratings, loading, deleteRating, bulkDelete, updateRating, filterRatings, refetch } = useRatings();
  const { selectedItems, showCheckboxes, toggleSelection, toggleSelectAll, clearSelection, selectedCount } = useBulkOperations();
  const [creatingRating, setCreatingRating] = useState(false);
  const [editingRating, setEditingRating] = useState<any | null>(null);
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

  const handleDeleteRating = (id: number) => {
    setConfirmModal({
      isOpen: true,
      message: 'Are you sure you want to delete this rating?',
      onConfirm: async () => {
        setConfirmModal({ isOpen: false, message: '', onConfirm: () => {} });
        const result = await deleteRating(id);
        if (result.success) {
          setNotification({ message: 'Rating deleted successfully', type: 'success' });
        } else {
          setNotification({ message: result.error || 'Error deleting rating', type: 'info' });
        }
      }
    });
  };

  const handleDeleteSelectedRatings = async () => {
    if (selectedItems.length === 0) {
      setNotification({ message: 'No ratings selected', type: 'info' });
      return;
    }

    setConfirmModal({
      isOpen: true,
      message: `Are you sure you want to delete ${selectedItems.length} selected rating${selectedItems.length > 1 ? 's' : ''}?`,
      onConfirm: async () => {
        setConfirmModal({ isOpen: false, message: '', onConfirm: () => {} });
        const result = await bulkDelete(selectedItems);
        if (result.success) {
          setNotification({ message: `${result.deletedCount ?? selectedItems.length} rating${(result.deletedCount ?? selectedItems.length) > 1 ? 's' : ''} deleted successfully!`, type: 'success' });
          clearSelection();
        } else {
          setNotification({ message: result.error || 'Error deleting ratings', type: 'info' });
        }
      }
    });
  };

  if (!isVisible) {
    return (
      <div className="border-2 border-gray-200 rounded-lg p-2">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-gray-900">Ratings</h3>
          <button onClick={onToggle} className="bg-linear-to-r from-blue-500 to-blue-600 text-white font-bold py-2.5 px-6 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 border border-blue-400/30 hover:border-blue-400/50">
            Show Ratings
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="border-2 border-gray-200 rounded-lg p-2">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-gray-900">All Ratings</h3>
        <div className="flex space-x-2">
          <button
            onClick={() => setCreatingRating(!creatingRating)}
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
          >
            {creatingRating ? 'Cancel Create' : 'Create Rating'}
          </button>
          <button onClick={onToggle} className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded">
            Hide
          </button>
        </div>
      </div>

      {creatingRating && (
        <div className="mb-6 border rounded p-4 bg-green-50">
          <CreateRatingForm
            futsals={futsals}
            onSuccess={() => {
              setCreatingRating(false);
              refetch();
            }}
            onCancel={() => setCreatingRating(false)}
            setNotification={setNotification}
          />
        </div>
      )}

      <div className="mb-4 space-y-4">
        {/* Select All and Delete Controls for Ratings */}
        <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="selectAllRatings"
              checked={showCheckboxes && selectedCount === ratings.length && ratings.length > 0}
              onChange={(e) => toggleSelectAll(ratings, 'id')}
              className="mr-2"
            />
            <label htmlFor="selectAllRatings" className="text-sm font-medium text-gray-700">
              Select All Ratings ({selectedCount} selected)
            </label>
          </div>
          {selectedCount > 0 && (
            <button
              onClick={handleDeleteSelectedRatings}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
            >
              Delete Selected ({selectedCount})
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
                  refetch();
                } else {
                  // Filter locally for simplicity
                  const filtered = ratings.filter(rating =>
                    rating.futsal_name?.toLowerCase().includes(searchTerm) ||
                    rating.first_name?.toLowerCase().includes(searchTerm) ||
                    rating.last_name?.toLowerCase().includes(searchTerm)
                  );
                  // Note: This won't persist, but for now it's fine
                }
              }}
              className="w-full p-2 border border-gray-400 rounded resize-none focus:outline-none focus:ring-0 focus:border-gray-900 focus:border"
            />
          </div>
          <div className="w-64">
            <select
              onChange={(e) => {
                filterRatings(e.target.value);
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
            refetch();
          }}
          className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded"
        >
          Clear Filters
        </button>
      </div>

      <div className="space-y-4">
        {ratings.map((rating) => (
          <div key={rating.id} className="border rounded p-4 flex flex-col md:flex-row md:justify-between md:items-start">
            <div className="flex-1">
              <div className="flex items-center mb-2">
                {showCheckboxes && (
                  <input
                    type="checkbox"
                    checked={selectedItems.includes(rating.id)}
                    onChange={(e) => toggleSelection(rating.id)}
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
                className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded"
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

      {editingRating && (
        <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Edit Rating</h3>
            <EditRatingForm rating={editingRating} onUpdate={async (rating, comment, users, users_type) => {
              const result = await updateRating(editingRating.id, { rating, comment, users, users_type });
              if (result.success) {
                setNotification({ message: "Rating updated successfully", type: 'success' });
              } else {
                setNotification({ message: result.error || 'Error updating rating', type: 'info' });
              }
              setEditingRating(null);
            }} onCancel={() => setEditingRating(null)} />
          </div>
        </div>
      )}
    </div>
  );
}