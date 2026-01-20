import { useState, useEffect } from 'react';
import { useSpecialPrices } from '../hooks/useSpecialPrices';
import { useFutsals } from '../hooks/useFutsals';
import { useBulkOperations } from '../hooks/useBulkOperations';
import { useAuthStore } from '@/stores/authStore';
import { ConfirmModal } from './modals/ConfirmModal';
import { NotificationModal } from './modals/NotificationModal';
import { OfferMessageModal } from './modals/OfferMessageModal';

interface SpecialPriceSectionProps {
  isVisible: boolean;
  onToggle: () => void;
}

interface SpecialPrice {
  special_price_id: number;
  futsal_id: number;
  type: 'date' | 'recurring' | 'time_based';
  special_date?: string;
  recurring_days?: string[];
  start_time?: string;
  end_time?: string;
  special_price: number;
  message?: string;
  offer_message?: string;
  is_offer: boolean;
  created_by: string;
  created_at: string;
  updated_at?: string;
  futsal_name: string;
}

export function SpecialPriceSection({ isVisible, onToggle }: SpecialPriceSectionProps) {
  const { specialPrices, loading, createSpecialPrice, updateSpecialPrice, deleteSpecialPrice } = useSpecialPrices();
  const { futsals } = useFutsals();
  const { selectedItems, showCheckboxes, toggleSelection, toggleSelectAll, clearSelection, selectedCount } = useBulkOperations();
  const { tokens } = useAuthStore();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingPrice, setEditingPrice] = useState<SpecialPrice | null>(null);
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'info'} | null>(null);
  const [confirmModal, setConfirmModal] = useState<{isOpen: boolean, message: string, onConfirm: () => void}>({isOpen: false, message: '', onConfirm: () => {}});
  const [offerMessageModal, setOfferMessageModal] = useState<{isOpen: boolean, price: SpecialPrice | null, onConfirm: (message: string) => void, existingMessage?: string}>({isOpen: false, price: null, onConfirm: () => {}, existingMessage: ''});

  const formatTime = (timeString: string): string => {
    const [hours, minutes] = timeString.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  // Auto-hide notifications after 2 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const checkExistingOfferMessage = async (futsalId: number): Promise<string | null> => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/special-prices/offer-message/${futsalId}`, {
        headers: {
          'Authorization': `Bearer ${tokens?.accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const data = await response.json();
        return data.offerMessage;
      }
    } catch (error) {
      console.error('Error checking offer message:', error);
    }
    return null;
  };

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
            Show S Prices
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
      futsals={futsals}
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
                    <p>Type: {price.type === 'date' ? 'Date-specific' : price.type === 'recurring' ? 'Recurring' : 'Time-based'}</p>
                    {price.type === 'date' ? (
                      <p>Date: {new Date(price.special_date!).toISOString().split('T')[0]}</p>
                    ) : price.type === 'recurring' ? (
                      <p>Days: {price.recurring_days!.join(', ')}</p>
                    ) : (
                      <p>Time Range: {formatTime(price.start_time!)} - {formatTime(price.end_time!)}</p>
                    )}
                    <p>Price: Rs. {price.special_price}</p>
                    {price.message && <p>Message: {price.message}</p>}
                    <div className="flex items-center mt-2">
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={price.is_offer}
                          onChange={async (e) => {
                            if (e.target.checked) {
                              // Enabling offer, always show modal to enter/edit message
                              const existingMessage = (await checkExistingOfferMessage(price.futsal_id)) || '';
                              setOfferMessageModal({
                                isOpen: true,
                                price,
                                onConfirm: async (message: string) => {
                                  const result = await updateSpecialPrice(price.special_price_id, { special_price: price.special_price, is_offer: true, offer_message: message });
                                  if (result.success) {
                                    setNotification({ message: 'Offer enabled successfully', type: 'success' });
                                  } else {
                                    setNotification({ message: result.error || 'Error updating offer status', type: 'info' });
                                  }
                                },
                                existingMessage
                              });
                            } else {
                              // Disabling offer
                              const result = await updateSpecialPrice(price.special_price_id, { special_price: price.special_price, is_offer: false });
                              if (result.success) {
                                setNotification({ message: 'Offer disabled successfully', type: 'success' });
                              } else {
                                setNotification({ message: result.error || 'Error updating offer status', type: 'info' });
                              }
                            }
                          }}
                          className="sr-only"
                        />
                        <div className={`relative inline-block w-10 h-6 transition duration-200 ease-in-out rounded-full ${price.is_offer ? 'bg-green-600' : 'bg-gray-300'}`}>
                          <span className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 ease-in-out ${price.is_offer ? 'translate-x-4' : 'translate-x-0'}`}></span>
                        </div>
                        <span className="ml-3 text-sm font-medium text-gray-700">Offer {price.is_offer ? 'Enabled' : 'Disabled'}</span>
                      </label>
                    </div>
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

      <OfferMessageModal
        isOpen={offerMessageModal.isOpen}
        onClose={() => setOfferMessageModal({ isOpen: false, price: null, onConfirm: () => {}, existingMessage: '' })}
        onConfirm={offerMessageModal.onConfirm}
        initialMessage={offerMessageModal.existingMessage || ''}
      />
    </div>
  );
}

// Create Special Price Form Component
function CreateSpecialPriceForm({ futsals, onSuccess, setNotification }: any) {
  const { createSpecialPrice } = useSpecialPrices();
  const [formData, setFormData] = useState({
    futsal_id: '',
    type: 'date' as 'date' | 'recurring' | 'time_based',
    special_dates: [] as string[],
    recurring_days: [] as string[],
    start_time: '',
    end_time: '',
    special_price: '',
    message: ''
  });
  const [currentDate, setCurrentDate] = useState('');

  const selectedFutsal = futsals.find((f: any) => f.futsal_id === parseInt(formData.futsal_id));

  const generateTimeOptions = (opening: string, closing: string) => {
    const options = [];
    const openingTime = new Date(`2000-01-01T${opening}`);
    const closingTime = new Date(`2000-01-01T${closing}`);

    for (let time = new Date(openingTime); time <= closingTime; time.setMinutes(time.getMinutes() + 30)) {
      const timeString = time.toTimeString().slice(0, 5);
      options.push(timeString);
    }
    return options;
  };

  const formatTime = (timeString: string): string => {
    const [hours, minutes] = timeString.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

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
    if (formData.type === 'time_based' && (!formData.start_time || !formData.end_time)) {
      setNotification({ message: 'Please select both start and end times', type: 'info' });
      return;
    }

    const result = await createSpecialPrice({
      futsal_id: parseInt(formData.futsal_id),
      type: formData.type,
      ...(formData.type === 'date' ? { special_dates: formData.special_dates } :
          formData.type === 'recurring' ? { recurring_days: formData.recurring_days } :
          { start_time: formData.start_time, end_time: formData.end_time }),
      special_price: parseFloat(formData.special_price),
      message: formData.message || undefined
    });

    if (result.success) {
      setNotification({ message: `${formData.type === 'date' ? 'Special prices' : formData.type === 'recurring' ? 'Recurring special price' : 'Time-based special price'} created successfully`, type: 'success' });
      onSuccess();
    } else {
      setNotification({ message: result.error || 'Error creating special price', type: 'info' });
    }
  };

  const handleTypeChange = (type: 'date' | 'recurring' | 'time_based') => {
    setFormData({
      ...formData,
      type,
      special_dates: [],
      recurring_days: [],
      start_time: '',
      end_time: ''
    });
  };

  const toggleDay = (day: string) => {
    setFormData({
      ...formData,
      recurring_days: formData.recurring_days.includes(day)
        ? formData.recurring_days.filter((d: string) => d !== day)
        : [...formData.recurring_days, day]
    });
  };

  return (
    <form onSubmit={handleSubmit} className="border rounded p-4 mb-4 bg-gray-50">
      <h4 className="font-bold mb-4">Create Special Price</h4>
      <p className="text-gray-600 text-sm mb-4">
        {formData.type === 'date' ? 'Set a special price for a specific date' :
         formData.type === 'recurring' ? 'Set a special price for recurring days' :
         'Set a special price for specific time ranges'}
      </p>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Futsal</label>
          <select
            value={formData.futsal_id}
            onChange={(e) => setFormData({ ...formData, futsal_id: e.target.value })}
            className="w-full p-2 border border-gray-300 rounded resize-none focus:outline-none focus:ring-0 focus:border-gray-900"
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
            className="w-full p-2 border border-gray-300 rounded resize-none focus:outline-none focus:ring-0 focus:border-gray-900"
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
          <label className="flex items-center">
            <input
              type="radio"
              value="time_based"
              checked={formData.type === 'time_based'}
              onChange={() => handleTypeChange('time_based')}
              className="mr-2"
            />
            Time-based price
          </label>
        </div>
      </div>

      {/* Date Selection */}
      {formData.type === 'date' && (
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">Special Dates</label>
          <div className="flex gap-2">
            <input
              type="date"
              value={currentDate}
              onChange={(e) => setCurrentDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="flex-1 px-3 py-2  border border-gray-300 rounded resize-none focus:outline-none focus:ring-0 focus:border-gray-900"
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
      )}

      {/* Recurring Days Selection */}
      {formData.type === 'recurring' && (
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

      {/* Time-Based Selection */}
      {formData.type === 'time_based' && (
        <div className="space-y-3">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            🕒 Time Range
          </label>

          {selectedFutsal ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <label
                  htmlFor="startTime"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  Start Time
                </label>

                <div className="relative">
                  <select
                    id="startTime"
                    value={formData.start_time}
                    onChange={(e) =>
                      setFormData({ ...formData, start_time: e.target.value })
                    }
                    className="w-full px-4 py-3 pl-12 bg-white border border-gray-200 rounded-lg text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400/50 focus:border-green-400/50 transition-all duration-300 font-medium text-sm"
                    required
                  >
                    <option value="">Select start time</option>
                    {generateTimeOptions(selectedFutsal.opening_hours, selectedFutsal.closing_hours).map((time: string) => (
                      <option key={time} value={time}>
                        {formatTime(time)}
                      </option>
                    ))}
                  </select>

                  <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-green-500">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="relative">
                <label
                  htmlFor="endTime"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  End Time
                </label>

                <div className="relative">
                  <select
                    id="endTime"
                    value={formData.end_time}
                    onChange={(e) =>
                      setFormData({ ...formData, end_time: e.target.value })
                    }
                    className="w-full px-4 py-3 pl-12 bg-white border border-gray-200 rounded-lg text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400/50 focus:border-green-400/50 transition-all duration-300 font-medium text-sm"
                    required
                  >
                    <option value="">Select end time</option>
                    {generateTimeOptions(selectedFutsal.opening_hours, selectedFutsal.closing_hours).map((time: string) => (
                      <option key={time} value={time}>
                        {formatTime(time)}
                      </option>
                    ))}
                  </select>

                  <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-green-500">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500">Please select a futsal first to see time options.</p>
          )}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Message (Optional)</label>
        <input
          type="text"
          value={formData.message}
          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
          className="w-full p-2 border border-gray-300 rounded resize-none focus:outline-none focus:ring-0 focus:border-gray-900"
        />
      </div>
      <div className="flex justify-end mt-4">
        <button
          type="submit"
          disabled={(formData.type === 'date' && formData.special_dates.length === 0) || (formData.type === 'recurring' && formData.recurring_days.length === 0) || (formData.type === 'time_based' && (!formData.start_time || !formData.end_time))}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Create {formData.type === 'date' ? 'Special Price' : formData.type === 'recurring' ? 'Recurring Special Price' : 'Time-Based Special Price'}
        </button>
      </div>
    </form>
  );
}

// Edit Special Price Form Component
function EditSpecialPriceForm({ price, futsals, onUpdate, onCancel, setNotification }: any) {
  const { updateSpecialPrice } = useSpecialPrices();
  const selectedFutsal = futsals.find((f: any) => f.futsal_id === price.futsal_id);
  const [formData, setFormData] = useState({
    special_price: price.special_price.toString(),
    message: price.message || '',
    special_date: price.special_date ? new Date(price.special_date).toISOString().split('T')[0] : '',
    recurring_days: price.recurring_days || [],
    start_time: price.start_time ? price.start_time.slice(0, 5) : '',
    end_time: price.end_time ? price.end_time.slice(0, 5) : ''
  });

  const generateTimeOptions = (opening: string, closing: string) => {
    const options = [];
    const openingTime = new Date(`2000-01-01T${opening}`);
    const closingTime = new Date(`2000-01-01T${closing}`);

    for (let time = new Date(openingTime); time <= closingTime; time.setMinutes(time.getMinutes() + 30)) {
      const timeString = time.toTimeString().slice(0, 5);
      options.push(timeString);
    }
    return options;
  };

  const formatTime = (timeString: string): string => {
    const [hours, minutes] = timeString.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const updateData: any = {
      special_price: parseFloat(formData.special_price),
      message: formData.message || undefined
    };

    if (price.type === 'date') {
      updateData.special_date = formData.special_date;
    } else if (price.type === 'recurring') {
      updateData.recurring_days = formData.recurring_days;
    } else if (price.type === 'time_based') {
      updateData.start_time = formData.start_time;
      updateData.end_time = formData.end_time;
      if (formData.special_date) {
        updateData.special_date = formData.special_date;
      }
    }

    const result = await updateSpecialPrice(price.special_price_id, updateData);

    if (result.success) {
      setNotification({ message: 'Special price updated successfully', type: 'success' });
      onUpdate();
    } else {
      setNotification({ message: result.error || 'Error updating special price', type: 'info' });
    }
  };

  const toggleDay = (day: string) => {
    setFormData({
      ...formData,
      recurring_days: formData.recurring_days.includes(day)
        ? formData.recurring_days.filter((d: string) => d !== day)
        : [...formData.recurring_days, day]
    });
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
            className="w-full p-2 border border-gray-300 rounded resize-none focus:outline-none focus:ring-0 focus:border-gray-900"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Message (Optional)</label>
          <input
            type="text"
            value={formData.message}
            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            className="w-full p-2 border border-gray-300 rounded resize-none focus:outline-none focus:ring-0 focus:border-gray-900"
          />
        </div>
      </div>

      {price.type === 'date' && (
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
          <input
            type="date"
            value={formData.special_date}
            onChange={(e) => setFormData({ ...formData, special_date: e.target.value })}
            min={new Date().toISOString().split('T')[0]}
            className="w-full p-2 border border-gray-300 rounded resize-none focus:outline-none focus:ring-0 focus:border-gray-900"
            required
          />
        </div>
      )}

      {price.type === 'recurring' && (
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Recurring Days</label>
          <div className="grid grid-cols-7 gap-2">
            {['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'].map((day) => (
              <label key={day} className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.recurring_days.includes(day)}
                  onChange={() => toggleDay(day)}
                  className="mr-2"
                />
                {day.slice(0, 3)}
              </label>
            ))}
          </div>
        </div>
      )}

      {price.type === 'time_based' && selectedFutsal && (
        <div className="mt-4 space-y-3">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            🕒 Time Range
          </label>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <label
                htmlFor="editStartTime"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                Start Time
              </label>

              <div className="relative">
                <select
                  id="editStartTime"
                  value={formData.start_time}
                  onChange={(e) =>
                    setFormData({ ...formData, start_time: e.target.value })
                  }
                  className="w-full px-4 py-3 pl-12 bg-white border border-gray-200 rounded-lg text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400/50 focus:border-green-400/50 transition-all duration-300 font-medium text-sm"
                  required
                >
                  <option value="">Select start time</option>
                  {generateTimeOptions(selectedFutsal.opening_hours, selectedFutsal.closing_hours).map((time: string) => (
                    <option key={time} value={time}>
                      {formatTime(time)}
                    </option>
                  ))}
                </select>

                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-green-500">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
              </div>
            </div>

            <div className="relative">
              <label
                htmlFor="editEndTime"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                End Time
              </label>

              <div className="relative">
                <select
                  id="editEndTime"
                  value={formData.end_time}
                  onChange={(e) =>
                    setFormData({ ...formData, end_time: e.target.value })
                  }
                  className="w-full px-4 py-3 pl-12 bg-white border border-gray-200 rounded-lg text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400/50 focus:border-green-400/50 transition-all duration-300 font-medium text-sm"
                  required
                >
                  <option value="">Select end time</option>
                  {generateTimeOptions(selectedFutsal.opening_hours, selectedFutsal.closing_hours).map((time: string) => (
                    <option key={time} value={time}>
                      {formatTime(time)}
                    </option>
                  ))}
                </select>

                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-green-500">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <div className="relative">
            <label htmlFor="editSpecialDate" className="block text-sm font-semibold text-gray-700 mb-2">
              📅 Choose Date (Optional)
            </label>
            <div className="relative">
              <input
                id="editSpecialDate"
                type="date"
                value={formData.special_date}
                onChange={(e) => setFormData({ ...formData, special_date: e.target.value })}
                className="w-full px-4 py-3 pl-12 bg-white border border-gray-200 rounded-lg text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400/50 focus:border-green-400/50 transition-all duration-300 font-medium text-sm"
              />
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-green-500">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      )}

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