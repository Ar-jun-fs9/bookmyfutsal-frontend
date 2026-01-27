import { useEffect } from 'react';
import { useNotificationStore } from '@/stores/notificationStore';

export const Notification = () => {
  const { notification, hideNotification } = useNotificationStore();

  useEffect(() => {
    if (notification && (notification.message.includes('Booking cancelled') || notification.message.includes('Booking not found'))) {
      const timer = setTimeout(() => {
        hideNotification();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [notification, hideNotification]);

  if (!notification) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`max-w-sm w-full bg-white rounded-2xl shadow-2xl border p-6 transform transition-all duration-300 ${notification.type === 'success' ? 'border-green-200' : 'border-red-200'}`}>
        <div className="text-center">
          <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg mb-4 ${notification.type === 'success' ? 'bg-green-100' : 'bg-blue-100'}`}>
            {notification.type === 'success' ? (
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-6 h-6 text-blue-800" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 10-12 0v3.2a2 2 0 01-.6 1.4L4 17h5m6 0a3 3 0 11-6 0" /></svg>
            )}
          </div>
          <p className={`text-sm font-medium ${notification.type === 'success' ? 'text-green-800' : 'text-blue-800'}`}>
            {notification.message}
          </p>
          {!notification.message.includes('Payment successful') && !notification.message.includes('Booking cancelled') && !notification.message.includes('Please enter your 8 digit tracking code') && !notification.message.includes('Please enter 8 digit tracking code') && !notification.message.includes('Message sent successfully') && !notification.message.includes('Booking not found') && !notification.message.includes('History entry removed successfully') && !notification.message.includes('History entry deleted successfully') && (
            <button
              onClick={hideNotification}
              className="mt-4 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors duration-200"
            >
              OK
            </button>
          )}
        </div>
      </div>
    </div>
  );
};