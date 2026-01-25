interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TermsModal({ isOpen, onClose }: TermsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="max-w-4xl w-full bg-white rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Terms & Refund</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-8">
            {/* Refund Policy - Highlighted in Red */}
            <div>
              <h3 className="text-xl font-semibold text-red-600 mb-4">❗ Refund Policy</h3>
              <div className="bg-red-50 rounded-lg p-4 space-y-3 text-sm text-red-800">
                <p><strong>❗ If the booking is cancelled at least 6 hours before the booked time, the full advance amount will be refunded.</strong></p>
                <p><strong>❗ If the booking is NOT cancelled and the player does not come to play, the full booking amount must be paid.</strong></p>
                <p><strong>❗ Because the slot cannot be used by another player, the booking person/team is fully responsible for the payment.</strong></p>
                <p><strong>❗ If there is any issue and the player cannot play, please cancel the booking at least 2–3 hours before the slot time to avoid full payment without playing.</strong></p>
              </div>
            </div>

            {/* Booking Terms & Conditions */}
            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Booking Terms & Conditions</h3>
              <div className="bg-gray-50 rounded-lg p-4 space-y-3 text-sm text-gray-700">
                <p><strong>Advance Payment:</strong> A non-refundable advance payment of Rs. 100 is required to confirm your booking.</p>
                <p><strong>Cancellation Policy:</strong> Bookings can be cancelled up to 2 hours before the scheduled time for a full refund of the advance amount. Late cancellations or no-shows will result in forfeiture of the full booking amount.</p>
                <p><strong>Responsibility:</strong> You are responsible for ensuring all players arrive on time and follow venue rules.</p>
                <p><strong>Weather Conditions:</strong> Bookings are not automatically cancelled due to weather. Contact the venue directly for weather-related concerns.</p>
                <p><strong>Equipment:</strong> Basic equipment may be provided, but players are encouraged to bring their own gear.</p>
                <p><strong>Code of Conduct:</strong> All players must maintain respectful behavior. Violation may result in immediate termination of the booking.</p>
                <p><strong>Changes:</strong> Booking details cannot be modified less than 2 hours before the scheduled time.</p>
                <p><strong>Liability:</strong> BookMyFutsal is not liable for injuries or accidents occurring during play.</p>
              </div>
            </div>

            {/* General Terms */}
            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-4">General Terms</h3>
              <div className="bg-blue-50 rounded-lg p-4 space-y-3 text-sm text-gray-700">
                <p><strong>Service Availability:</strong> We strive to provide 24/7 access but cannot guarantee uninterrupted service.</p>
                <p><strong>Privacy:</strong> Your personal information is protected and used only for booking purposes.</p>
                <p><strong>Changes to Terms:</strong> We may update these terms at any time. Continued use constitutes acceptance.</p>
                <p><strong>Governing Law:</strong> These terms are governed by the laws of Nepal.</p>
                <p><strong>Contact:</strong> For questions about these terms, contact us at bookmyfutsal@gmail.com</p>
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              I Understand
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}