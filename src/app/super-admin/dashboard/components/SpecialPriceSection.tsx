import { useState, useEffect } from 'react';
import { useSpecialPrices } from '../hooks/useSpecialPrices';
import { useFutsals } from '../hooks/useFutsals';
import { useBulkOperations } from '../hooks/useBulkOperations';
import { ConfirmModal } from './modals/ConfirmModal';
import { NotificationModal } from './modals/NotificationModal';

interface SpecialPriceSectionProps {
  isVisible: boolean;
  onToggle: () => void;
}

interface SpecialPrice {
  special_price_id: number;
  futsal_id: number;
  type: 'date' | 'recurring';
  special_date?: string;
  recurring_days?: string[];
  special_price: number;
  message?: string;
  created_by: string;
  created_at: string;
  updated_at?: string;
  futsal_name: string;
}

export function SpecialPriceSection({ isVisible, onToggle }: SpecialPriceSectionProps) {
  const { specialPrices, loading, createSpecialPrice, updateSpecialPrice, deleteSpecialPrice } = useSpecialPrices();
  const { futsals } = useFutsals();
  const { selectedItems, showCheckboxes, toggleSelection, toggleSelectAll, clearSelection, selectedCount } = useBulkOperations();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingPrice, setEditingPrice] = useState<SpecialPrice | null>(null);
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

  const handleDeleteSpecialPrice = (id: number) => {
    setConfirmModal({
      isOpen: true,
      message: 'Are you sure you want to delete this special price?',
      onConfirm: async () => {
        setConfirmModal({ isOpen: false, message: '', onConfirm: () => {} });
        const result = await deleteSpecialPrice(id);
        if (result.success) {
          setNotification({ message: 'Special price deleted successfully', type: 'success' });
        } else {
          setNotification({ message: result.error || 'Error deleting special price', type: 'info' });
        }
      }
    });
  };

  const handleDeleteSelectedPrices = async () => {
    if (selectedItems.length === 0) {
      setNotification({ message: 'No special prices selected', type: 'info' });
      return;
    }

    setConfirmModal({
      isOpen: true,
      message: `Are you sure you want to delete ${selectedItems.length} selected special price${selectedItems.length > 1 ? 's' : ''}?`,
      onConfirm: async () => {
        setConfirmModal({ isOpen: false, message: '', onConfirm: () => {} });
        let successCount = 0;
        for (const id of selectedItems) {
          const result = await deleteSpecialPrice(id);
          if (result.success) successCount++;
        }
        if (successCount > 0) {
          setNotification({ message: `${successCount} special price${successCount > 1 ? 's' : ''} deleted successfully!`, type: 'success' });
          clearSelection();
        } else {
          setNotification({ message: 'Error deleting special prices', type: 'info' });
        }
      }
    });
  };

  if (!isVisible) {
    return (
      <div className="border-2 border-gray-200 rounded-lg p-2">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-gray-900">Special Prices</h3>
          <button
            onClick={onToggle}
            className="bg-linear-to-r from-blue-500 to-blue-600 text-white font-bold py-2.5 px-6 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 border border-blue-400/30 hover:border-blue-400/50"
          >
            Show Special Prices
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="border-2 border-gray-200 rounded-lg p-2">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-gray-900">Special Prices</h3>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
          >
            {showCreateForm ? 'Cancel Create' : 'Create Special Price'}
          </button>
          <button
            onClick={onToggle}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded"
          >
            Hide
          </button>
        </div>
      </div>

      {showCreateForm && (
        <CreateSpecialPriceForm
          futsals={futsals}
          onSuccess={() => setShowCreateForm(false)}
          setNotification={setNotification}
        />
      )}

      {/* Bulk operations controls */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="selectAllPrices"
              checked={showCheckboxes && selectedCount === specialPrices.length && specialPrices.length > 0}
              onChange={(e) => toggleSelectAll(specialPrices, 'special_price_id')}
              className="mr-2"
            />
            <label htmlFor="selectAllPrices" className="text-sm font-medium text-gray-700">
              Select All Special Prices ({selectedCount} selected)
            </label>
          </div>
          {selectedCount > 0 && (
            <button
              onClick={handleDeleteSelectedPrices}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
            >
              Delete Selected ({selectedCount})
            </button>
          )}
        </div>
      </div>

      {/* Special prices list */}
      <div className="space-y-4">
        {loading ? (
          <p className="text-center text-gray-500">Loading special prices...</p>
        ) : specialPrices.length === 0 ? (
          <p className="text-center text-gray-500">No special prices found</p>
        ) : (
          specialPrices.map((price) => (
            <div key={price.special_price_id} className="border rounded p-4">
              {editingPrice?.special_price_id === price.special_price_id ? (
                <EditSpecialPriceForm
                  price={price}
                  onUpdate={() => setEditingPrice(null)}
                  onCancel={() => setEditingPrice(null)}
                  setNotification={setNotification}
                />
              ) : (
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    {showCheckboxes && (
                      <input
                        type="checkbox"
                        checked={selectedItems.includes(price.special_price_id)}
                        onChange={() => toggleSelection(price.special_price_id)}
                        className="mr-2"
                      />
                    )}
                    <h4 className="font-bold">{price.futsal_name}</h4>
                    <p>Type: {price.type === 'date' ? 'Date-specific' : 'Recurring'}</p>
                    {price.type === 'date' ? (
                      <p>Date: {new Date(price.special_date!).toLocaleDateString()}</p>
                    ) : (
                      <p>Days: {price.recurring_days!.join(', ')}</p>
                    )}
                    <p>Price: Rs. {price.special_price}</p>
                    {price.message && <p>Message: {price.message}</p>}
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setEditingPrice(price)}
                      className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteSpecialPrice(price.special_price_id)}
                      className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
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

// Create Special Price Form Component
function CreateSpecialPriceForm({ futsals, onSuccess, setNotification }: any) {
  const { createSpecialPrice } = useSpecialPrices();
  const [formData, setFormData] = useState({
    futsal_id: '',
    type: 'date' as 'date' | 'recurring',
    special_dates: [] as string[],
    recurring_days: [] as string[],
    special_price: '',
    message: ''
  });
  const [currentDate, setCurrentDate] = useState('');

  const addDate = () => {
    if (currentDate && !formData.special_dates.includes(currentDate)) {
      setFormData({
        ...formData,
        special_dates: [...formData.special_dates, currentDate].sort()
      });
      setCurrentDate('');
    }
  };

  const removeDate = (dateToRemove: string) => {
    setFormData({
      ...formData,
      special_dates: formData.special_dates.filter(date => date !== dateToRemove)
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.type === 'date' && formData.special_dates.length === 0) {
      setNotification({ message: 'Please select at least one date', type: 'info' });
      return;
    }
    if (formData.type === 'recurring' && formData.recurring_days.length === 0) {
      setNotification({ message: 'Please select at least one day', type: 'info' });
      return;
    }

    const result = await createSpecialPrice({
      futsal_id: parseInt(formData.futsal_id),
      type: formData.type,
      ...(formData.type === 'date' ? { special_dates: formData.special_dates } : { recurring_days: formData.recurring_days }),
      special_price: parseFloat(formData.special_price),
      message: formData.message || undefined
    });

    if (result.success) {
      setNotification({ message: `${formData.type === 'date' ? 'Special prices' : 'Recurring special price'} created successfully`, type: 'success' });
      onSuccess();
    } else {
      setNotification({ message: result.error || 'Error creating special price', type: 'info' });
    }
  };

  const handleTypeChange = (type: 'date' | 'recurring') => {
    setFormData({
      ...formData,
      type,
      special_dates: [],
      recurring_days: []
    });
  };

  const toggleDay = (day: string) => {
    setFormData({
      ...formData,
      recurring_days: formData.recurring_days.includes(day)
        ? formData.recurring_days.filter(d => d !== day)
        : [...formData.recurring_days, day]
    });
  };

  return (
    <form onSubmit={handleSubmit} className="border rounded p-4 mb-4 bg-gray-50">
      <h4 className="font-bold mb-4">Create Special Price</h4>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Futsal</label>
          <select
            value={formData.futsal_id}
            onChange={(e) => setFormData({ ...formData, futsal_id: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded"
            required
          >
            <option value="">Select Futsal</option>
            {futsals.map((futsal: any) => (
              <option key={futsal.futsal_id} value={futsal.futsal_id}>
                {futsal.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
          <input
            type="number"
            step="0.01"
            value={formData.special_price}
            onChange={(e) => setFormData({ ...formData, special_price: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded"
            required
          />
        </div>
      </div>

      {/* Type Selection */}
      <div className="mt-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
        <div className="flex gap-4">
          <label className="flex items-center">
            <input
              type="radio"
              value="date"
              checked={formData.type === 'date'}
              onChange={() => handleTypeChange('date')}
              className="mr-2"
            />
            Date-specific
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              value="recurring"
              checked={formData.type === 'recurring'}
              onChange={() => handleTypeChange('recurring')}
              className="mr-2"
            />
            Recurring
          </label>
        </div>
      </div>

      {/* Conditional Selection */}
      {formData.type === 'date' ? (
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">Special Dates</label>
          <div className="flex gap-2">
            <input
              type="date"
              value={currentDate}
              onChange={(e) => setCurrentDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="flex-1 px-3 py-2 border border-gray-300 rounded"
            />
            <button
              type="button"
              onClick={addDate}
              disabled={!currentDate}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add Date
            </button>
          </div>

          {/* Selected Dates */}
          {formData.special_dates.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm text-gray-600">Selected Dates ({formData.special_dates.length}):</p>
              <div className="flex flex-wrap gap-2">
                {formData.special_dates.map((date) => (
                  <span
                    key={date}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                  >
                    {new Date(date).toISOString().split('T')[0].split('-').reverse().join('-')}
                    <button
                      type="button"
                      onClick={() => removeDate(date)}
                      className="ml-2 text-blue-600 hover:text-blue-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">Recurring Days</label>
          <div className="grid grid-cols-7 gap-2">
            {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day) => (
              <label key={day} className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.recurring_days.includes(day.toLowerCase())}
                  onChange={() => toggleDay(day.toLowerCase())}
                  className="mr-2"
                />
                {day.slice(0, 3)}
              </label>
            ))}
          </div>
          {formData.recurring_days.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm text-gray-600">Selected Days ({formData.recurring_days.length}):</p>
              <div className="flex flex-wrap gap-2">
                {formData.recurring_days.map((day) => (
                  <span
                    key={day}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800"
                  >
                    {day.charAt(0).toUpperCase() + day.slice(1)}
                    <button
                      type="button"
                      onClick={() => toggleDay(day)}
                      className="ml-2 text-green-600 hover:text-green-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Message (Optional)</label>
        <input
          type="text"
          value={formData.message}
          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded"
        />
      </div>
      <div className="flex justify-end mt-4">
        <button
          type="submit"
          disabled={(formData.type === 'date' && formData.special_dates.length === 0) || (formData.type === 'recurring' && formData.recurring_days.length === 0)}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Create {formData.type === 'date' ? 'Special Price' : 'Recurring Special Price'}
        </button>
      </div>
    </form>
  );
}

// Edit Special Price Form Component
function EditSpecialPriceForm({ price, onUpdate, onCancel, setNotification }: any) {
  const { updateSpecialPrice } = useSpecialPrices();
  const [formData, setFormData] = useState({
    special_price: price.special_price.toString(),
    message: price.message || ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await updateSpecialPrice(price.special_price_id, {
      special_price: parseFloat(formData.special_price),
      message: formData.message || undefined
    });

    if (result.success) {
      setNotification({ message: 'Special price updated successfully', type: 'success' });
      onUpdate();
    } else {
      setNotification({ message: result.error || 'Error updating special price', type: 'info' });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="border rounded p-4 mb-4 bg-gray-50">
      <h4 className="font-bold mb-4">Edit Special Price</h4>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
          <input
            type="number"
            step="0.01"
            value={formData.special_price}
            onChange={(e) => setFormData({ ...formData, special_price: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Message (Optional)</label>
          <input
            type="text"
            value={formData.message}
            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded"
          />
        </div>
      </div>
      <div className="flex justify-end mt-4 space-x-2">
        <button type="button" onClick={onCancel} className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded">
          Cancel
        </button>
        <button type="submit" className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded">
          Update
        </button>
      </div>
    </form>
  );
}