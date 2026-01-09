interface PriceNotificationModalProps {
  priceNotification: { isOpen: boolean; message: string } | null;
  setPriceNotification: (notification: { isOpen: boolean; message: string } | null) => void;
}

export default function PriceNotificationModal({
  priceNotification,
  setPriceNotification,
}: PriceNotificationModalProps) {
  return (
    <>
      {/* Price Notification Modal */}
      {priceNotification?.isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="max-w-sm w-full bg-white rounded-2xl shadow-2xl border p-6 transform transition-all duration-300 border-blue-200">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg mb-4 bg-blue-100">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Special Price Alert</h3>
              <p className="text-sm text-gray-600 mb-6">{priceNotification.message}</p>
              <button
                onClick={() => setPriceNotification(null)}
                className="w-full bg-blue-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-600 transition-all duration-300"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}