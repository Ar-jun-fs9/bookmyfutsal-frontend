import { useEffect } from 'react';
import { useNotificationStore } from '@/stores/notificationStore';

export const Notification = () => {
  const { notification, hideNotification } = useNotificationStore();

  useEffect(() => {
    if (notification && notification.message.includes('Booking cancelled')) {
      const timer = setTimeout(() => {
        hideNotification();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [notification, hideNotification]);

  if (!notification) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`max-w-sm w-full bg-white rounded-2xl shadow-2xl border p-6 transform transition-all duration-300 ${notification.type === 'success' ? 'border-green-200' : 'border-blue-200'}`}>
        <div className="text-center">
          <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg mb-4 ${notification.type === 'success' ? 'bg-green-100' : 'bg-blue-100'}`}>
            {notification.type === 'success' ? (
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </div>
          <p className={`text-sm font-medium ${notification.type === 'success' ? 'text-green-800' : 'text-blue-800'}`}>
            {notification.message}
          </p>
          {!notification.message.includes('Payment successful') && !notification.message.includes('Booking cancelled') && (
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