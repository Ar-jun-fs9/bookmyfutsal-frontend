import React from 'react';

interface RegisterTermsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const RegisterTermsModal: React.FC<RegisterTermsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="max-w-4xl w-full bg-white rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Terms and Conditions</h2>
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
            {/* Unregistered Users */}
            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-4">For Unregistered Users</h3>
              <div className="bg-gray-50 rounded-lg p-4 space-y-3 text-sm text-gray-700">
                <p><strong>Browsing and Information Access:</strong> You can browse futsal venues, view details, and access general information about our services.</p>
                <p><strong>Contact and Support:</strong> You may contact our support team for inquiries about venues, services, or general questions.</p>
                <p><strong>Data Usage:</strong> We collect basic analytics data (IP address, browser info) to improve our service. No personal information is stored for unregistered users.</p>
                <p><strong>Limitations:</strong> Unregistered users cannot book venues, leave ratings, or access personalized features.</p>
                <p><strong>Privacy:</strong> We respect your privacy and do not share any information collected from unregistered users.</p>
              </div>
            </div>

            {/* Registered Users */}
            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-4">For Registered Users</h3>
              <div className="bg-green-50 rounded-lg p-4 space-y-3 text-sm text-gray-700">
                <p><strong>Account Creation:</strong> By registering, you agree to provide accurate information and maintain account security.</p>
                <p><strong>Booking Services:</strong> You can book futsal venues, manage bookings, and receive booking confirmations.</p>
                <p><strong>Ratings and Reviews:</strong> You may rate and review venues you've used, helping other users make informed decisions.</p>
                <p><strong>Feedback:</strong> You can submit feedback about our services and venues.</p>
                <p><strong>Personal Data:</strong> We collect and store your personal information (name, email, phone, booking history) to provide our services.</p>
                <p><strong>Communication:</strong> We may send you booking confirmations, updates, and promotional offers via email or SMS.</p>
                <p><strong>Account Responsibility:</strong> You are responsible for all activities under your account and must keep your password secure.</p>
                <p><strong>Payment Terms:</strong> All bookings require payment at the time of reservation. Refunds are subject to venue policies.</p>
                <p><strong>Code of Conduct:</strong> You agree to use our platform respectfully and not engage in fraudulent activities.</p>
                <p><strong>Termination:</strong> We reserve the right to suspend or terminate accounts that violate our terms.</p>
              </div>
            </div>

            {/* General Terms */}
            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-4">General Terms</h3>
              <div className="bg-blue-50 rounded-lg p-4 space-y-3 text-sm text-gray-700">
                <p><strong>Service Availability:</strong> We strive to provide 24/7 access but cannot guarantee uninterrupted service.</p>
                <p><strong>Liability:</strong> BookMyFutsal is not liable for issues arising from venue quality, cancellations, or external factors.</p>
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
};

export default RegisterTermsModal;