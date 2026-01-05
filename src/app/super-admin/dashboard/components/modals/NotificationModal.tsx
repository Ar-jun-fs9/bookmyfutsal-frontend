interface NotificationModalProps {
  isOpen: boolean;
  message: string;
  type: 'success' | 'info';
  onClose: () => void;
}

export function NotificationModal({ isOpen, message, type, onClose }: NotificationModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`max-w-sm w-full bg-white rounded-2xl shadow-2xl border p-6 transform transition-all duration-300 ${type === 'success' ? 'border-green-200' : 'border-blue-200'}`}>
        <div className="text-center">
          <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg mb-4 ${type === 'success' ? 'bg-green-100' : 'bg-blue-100'}`}>
            {type === 'success' ? (
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </div>
          <p className={`text-sm font-medium ${type === 'success' ? 'text-green-800' : 'text-blue-800'}`}>
            {message}
          </p>
        </div>
      </div>
    </div>
  );
}