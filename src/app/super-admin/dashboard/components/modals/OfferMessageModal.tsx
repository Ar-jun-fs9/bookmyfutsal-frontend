import React, { useState, useEffect } from 'react';

interface OfferMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (message: string) => void;
  initialMessage?: string;
}

export function OfferMessageModal({ isOpen, onClose, onConfirm, initialMessage = '' }: OfferMessageModalProps) {
  const [message, setMessage] = useState(initialMessage);

  // Update message when initialMessage changes
  useEffect(() => {
    setMessage(initialMessage);
  }, [initialMessage]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(message.trim());
    setMessage('');
    onClose();
  };

  const handleCancel = () => {
    setMessage('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-black/20 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 shadow-2xl">
        <h3 className="text-lg font-semibold mb-4">Enter Offer Message</h3>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="offerMessage" className="block text-sm font-medium text-gray-700 mb-2">
              Offer Message
            </label>
            <input
              id="offerMessage"
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter custom offer message"
            />
          </div>
          <div className="flex justify-between space-x-2">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                onConfirm('');
                setMessage('');
                onClose();
              }}
              className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
            >
              Done without message
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Done
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}