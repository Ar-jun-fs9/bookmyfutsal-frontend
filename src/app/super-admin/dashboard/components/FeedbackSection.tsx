import { useState, useEffect } from 'react';
import { useFeedbacks } from '../hooks/useFeedbacks';
import { ConfirmModal } from './modals/ConfirmModal';
import { NotificationModal } from './modals/NotificationModal';

interface FeedbackSectionProps {
  isVisible: boolean;
  onToggle: () => void;
}

interface Feedback {
  id: number;
  name: string | null;
  is_anonymous: boolean;
  rating: number;
  selected_issues: string[];
  message: string;
  user_agent: string;
  page_url: string;
  ip_address: string;
  session_id: string;
  browser_info: any;
  device_info: any;
  created_at: string;
  updated_at: string;
}

export function FeedbackSection({ isVisible, onToggle }: FeedbackSectionProps) {
  const { feedbacks, loading, deleteFeedback, refetch } = useFeedbacks();
  const [notification, setNotification] = useState<{ message: string, type: 'success' | 'info' } | null>(null);
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean, message: string, onConfirm: () => void }>({ isOpen: false, message: '', onConfirm: () => { } });
  const [viewModal, setViewModal] = useState<{ isOpen: boolean, feedback: Feedback | null }>({ isOpen: false, feedback: null });

  // Auto-hide notifications after 2 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const handleDeleteFeedback = (id: number) => {
    setConfirmModal({
      isOpen: true,
      message: 'Are you sure you want to delete this feedback?',
      onConfirm: async () => {
        setConfirmModal({ isOpen: false, message: '', onConfirm: () => { } });
        const result = await deleteFeedback(id);
        if (result.success) {
          setNotification({ message: 'Feedback deleted successfully', type: 'success' });
        } else {
          setNotification({ message: result.error || 'Error deleting feedback', type: 'info' });
        }
      }
    });
  };

  const handleViewFeedback = (feedback: Feedback) => {
    setViewModal({ isOpen: true, feedback });
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={`w-5 h-5 ${star <= rating ? 'text-yellow-400' : 'text-gray-300'}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
        <span className="ml-2 text-sm text-gray-600">({rating}/5)</span>
      </div>
    );
  };

  if (!isVisible) {
    return (
      <div className="border-2 border-gray-200 rounded-lg p-2">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-gray-900">Feedback and Bugs</h3>
          <button onClick={onToggle} className="bg-linear-to-r from-blue-500 to-blue-600 text-white font-bold py-2.5 px-6 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 border border-blue-400/30 hover:border-blue-400/50">
            Show Feedbacks
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="border-2 border-gray-200 rounded-lg p-2">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-gray-900">Feedback and Bugs</h3>
        <button onClick={onToggle} className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded">
          Hide Feedbacks and Bugs
        </button>
      </div>

      <div className="space-y-4">
        {loading ? (
          <p>Loading feedbacks...</p>
        ) : feedbacks.length === 0 ? (
          <p>No feedbacks found.</p>
        ) : (
          feedbacks.map((feedback) => (
            <div key={feedback.id} className="border rounded p-4 flex flex-col md:flex-row md:justify-between md:items-start">
              <div className="flex-1">
                <p className='mb-2'><strong>User:</strong> {feedback.is_anonymous ? 'Anonymous' : (feedback.name || 'Anonymous')}</p>
                <div className="flex items-center mb-1">
                  <strong>Rating:</strong>
                  {renderStars(feedback.rating)}
                </div>
                <p className="text-sm text-gray-700">
                  <strong>Date:</strong>{" "}
                  {new Date(feedback.created_at).toLocaleString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true }).replace(/\//g, "-").replace(/\b(am|pm)\b/g, m => m.toUpperCase())}</p>
              </div>
              <div className="flex flex-row space-x-2 mt-4 md:ml-4 md:mt-0 md:items-center">
                <button
                  onClick={() => handleViewFeedback(feedback)}
                  className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded"
                >
                  View
                </button>
                <button
                  onClick={() => handleDeleteFeedback(feedback.id)}
                  className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* View Modal */}
      {viewModal.isOpen && viewModal.feedback && (
        <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-semibold">Feedback Details</h3>
              <button
                onClick={() => setViewModal({ isOpen: false, feedback: null })}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p><strong>User:</strong> {viewModal.feedback.is_anonymous ? 'Anonymous' : (viewModal.feedback.name || 'Anonymous')}</p>
              <div>
                <strong>Rating:</strong>
                {renderStars(viewModal.feedback.rating)}
              </div>
              <p><strong>Issues:</strong> {viewModal.feedback.selected_issues.join(', ') || 'None'}</p>
              <p><strong>Message:</strong> {viewModal.feedback.message}</p>
              <p><strong>Date:</strong> {new Date(viewModal.feedback.created_at).toLocaleString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true }).replace(/\//g, "-").replace(/\b(am|pm)\b/g, m => m.toUpperCase())}</p>
              <p><strong>Page URL:</strong> {viewModal.feedback.page_url}</p>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal({ isOpen: false, message: '', onConfirm: () => { } })}
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