import { useRef, useState, useEffect } from 'react';
import html2canvas from 'html2canvas';
import { useQueryClient } from '@tanstack/react-query';
import { useBookingTracker } from '@/hooks/useBookingTracker';
import { useNotificationStore } from '@/stores/notificationStore';
import { formatDate, formatTimeRange } from '@/utils/helpers';

export default function BookingTracker() {
  const summaryRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const { trackingCode, setTrackingCode, hasSearched, trackedBooking, handleTrackBooking } = useBookingTracker();
  const { showNotification } = useNotificationStore();
  const [confirmModal, setConfirmModal] = useState<{isOpen: boolean, message: string, onConfirm: () => void} | null>(null);
  const [isExpired, setIsExpired] = useState(false);
  const [totalAmount, setTotalAmount] = useState<number | null>(null);

  useEffect(() => {
    setIsExpired(false);
  }, [trackingCode]);

  useEffect(() => {
    if (trackedBooking) {
      const fetchPrice = async () => {
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/special-prices/price/${trackedBooking.futsal_id}/${trackedBooking.booking_date}`);
          if (response.ok) {
            const data = await response.json();
            setTotalAmount(data.effectivePrice);
          }
        } catch (error) {
          console.error('Error fetching price:', error);
        }
      };
      fetchPrice();
    }
  }, [trackedBooking]);

  useEffect(() => {
    if (hasSearched && trackedBooking) {
      if (trackedBooking.cancelled_at) {
        setIsExpired(true);
        showNotification({ message: 'Booking not found', type: 'info' });
        setTrackingCode('');
        return;
      }

      const now = new Date();
      const bookingDate = new Date(trackedBooking.booking_date);
      const currentDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const bookDate = new Date(bookingDate.getFullYear(), bookingDate.getMonth(), bookingDate.getDate());

      if (bookDate < currentDate) {
        setIsExpired(true);
        showNotification({ message: 'Your booking is expired.', type: 'info' });
        setTrackingCode('');
      } else if (bookDate.getTime() === currentDate.getTime()) {
        const startTime = trackedBooking.time_slot.split('-')[0];
        const [hours, minutes] = startTime.split(':').map(Number);
        const bookingStart = new Date(now);
        bookingStart.setHours(hours, minutes, 0, 0);
        if (now > bookingStart) {
          setIsExpired(true);
          showNotification({ message: 'Your booking is expired.', type: 'info' });
          setTrackingCode('');
        } else {
          setIsExpired(false);
        }
      } else {
        setIsExpired(false);
      }
    }
  }, [hasSearched, trackedBooking, showNotification]);

  const handleCancelBooking = () => {
    setConfirmModal({
      isOpen: true,
      message: 'Are you sure you want to cancel this booking?',
      onConfirm: async () => {
        setConfirmModal({ isOpen: false, message: '', onConfirm: () => {} });
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/bookings/cancel/${trackedBooking?.tracking_code}`, {
            method: 'DELETE',
          });

          if (response.ok) {
            setTrackingCode('');
            queryClient.invalidateQueries({ queryKey: ['booking', 'track', trackedBooking.tracking_code] });
            showNotification({ message: 'Booking cancelled Successfully', type: 'info' });
          } else {
            showNotification({ message: 'Error cancelling booking', type: 'info' });
          }
        } catch (error) {
          console.error('Error cancelling booking:', error);
          showNotification({ message: 'Error cancelling booking', type: 'info' });
        }
      }
    });
  };

  const formatTimeRangeBooking = (timeRange: string): string => {
    if (!timeRange) return '';
    const [startTime, endTime] = timeRange.split('-');
    return `${formatTime(startTime)} - ${formatTime(endTime)}`;
  };

  const formatTime = (timeString: string): string => {
    const [hours, minutes] = timeString.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    return minutes === 0 ? `${displayHours}${period}` : `${displayHours}:${minutes.toString().padStart(2, '0')}${period}`;
  };

  const downloadAsPNG = async () => {
    if (summaryRef.current) {
      try {
        const canvas = await html2canvas(summaryRef.current, {
          useCORS: true,
          allowTaint: false,
          scale: 2,
          logging: false,
          backgroundColor: '#ffffff',
          removeContainer: true,
          onclone: (clonedDoc) => {
            // Remove any styles that might contain unsupported color functions
            const styles = clonedDoc.querySelectorAll('style');
            styles.forEach(style => {
              if (style.textContent && (style.textContent.includes('lab(') || style.textContent.includes('oklab(') || style.textContent.includes('lch(') || style.textContent.includes('oklch('))) {
                style.remove();
              }
            });
            // Hide buttons for PNG
            const buttons = clonedDoc.querySelector('.png-hide') as HTMLElement;
            if (buttons) {
              buttons.style.display = 'none';
            }
            // Override problematic CSS with comprehensive fallbacks
            const style = clonedDoc.createElement('style');
            style.textContent = `
              /* Remove all unsupported color functions and gradients */
              * {
                color: inherit !important;
                background: transparent !important;
                background-color: transparent !important;
                background-image: none !important;
                border-color: inherit !important;
                box-shadow: none !important;
              }

              /* Specific color overrides */
              .text-white { color: #ffffff !important; }
              .text-gray-50 { color: #f9fafb !important; }
              .text-gray-100 { color: #f3f4f6 !important; }
              .text-gray-200 { color: #e5e7eb !important; }
              .text-gray-300 { color: #d1d5db !important; }
              .text-gray-400 { color: #9ca3af !important; }
              .text-gray-500 { color: #6b7280 !important; }
              .text-gray-600 { color: #4b5563 !important; }
              .text-gray-700 { color: #374151 !important; }
              .text-gray-800 { color: #1f2937 !important; }
              .text-gray-900 { color: #111827 !important; }

              .text-green-50 { color: #f0fdf4 !important; }
              .text-green-100 { color: #dcfce7 !important; }
              .text-green-200 { color: #bbf7d0 !important; }
              .text-green-300 { color: #86efac !important; }
              .text-green-400 { color: #4ade80 !important; }
              .text-green-500 { color: #22c55e !important; }
              .text-green-600 { color: #16a34a !important; }
              .text-green-700 { color: #15803d !important; }
              .text-green-800 { color: #166534 !important; }
              .text-green-900 { color: #14532d !important; }

              .text-blue-50 { color: #eff6ff !important; }
              .text-blue-100 { color: #dbeafe !important; }
              .text-blue-200 { color: #bfdbfe !important; }
              .text-blue-300 { color: #93c5fd !important; }
              .text-blue-400 { color: #60a5fa !important; }
              .text-blue-500 { color: #3b82f6 !important; }
              .text-blue-600 { color: #2563eb !important; }
              .text-blue-700 { color: #1d4ed8 !important; }
              .text-blue-800 { color: #1e40af !important; }
              .text-blue-900 { color: #1e3a8a !important; }

              .text-yellow-50 { color: #fffbeb !important; }
              .text-yellow-100 { color: #fef3c7 !important; }
              .text-yellow-200 { color: #fde68a !important; }
              .text-yellow-300 { color: #fcd34d !important; }
              .text-yellow-400 { color: #fbbf24 !important; }
              .text-yellow-500 { color: #f59e0b !important; }
              .text-yellow-600 { color: #d97706 !important; }
              .text-yellow-700 { color: #b45309 !important; }
              .text-yellow-800 { color: #92400e !important; }
              .text-yellow-900 { color: #78350f !important; }

              /* Background color overrides */
              .bg-white { background-color: #ffffff !important; }
              .bg-gray-50 { background-color: #f9fafb !important; }
              .bg-gray-100 { background-color: #f3f4f6 !important; }
              .bg-green-50 { background-color: #f0fdf4 !important; }
              .bg-green-100 { background-color: #dcfce7 !important; }
              .bg-green-500 { background-color: #22c55e !important; }
              .bg-green-600 { background-color: #16a34a !important; }
              .bg-blue-100 { background-color: #dbeafe !important; }
              .bg-blue-500 { background-color: #3b82f6 !important; }
              .bg-blue-600 { background-color: #2563eb !important; }
              .bg-red-500 { background-color: #ef4444 !important; }
              .bg-red-600 { background-color: #dc2626 !important; }
              .bg-yellow-50 { background-color: #fffbeb !important; }

              /* Border color overrides */
              .border-gray-100 { border-color: #f3f4f6 !important; }
              .border-gray-200 { border-color: #e5e7eb !important; }
              .border-green-100 { border-color: #dcfce7 !important; }
              .border-green-200 { border-color: #bbf7d0 !important; }
              .border-green-500 { border-color: #22c55e !important; }
              .border-blue-200 { border-color: #bfdbfe !important; }
              .border-yellow-200 { border-color: #fde68a !important; }
              .border-gray-700 { border-color: #374151 !important; }

              /* Ring color overrides */
              .focus\\:ring-green-100 { --tw-ring-color: #dcfce7 !important; }
              .focus\\:ring-green-500 { --tw-ring-color: #22c55e !important; }

              /* Hide elements for image */
              .png-hide { display: none !important; }

              /* Ensure proper rendering */
              .rounded-2xl, .rounded-3xl, .rounded-xl, .rounded-lg, .rounded-lg {
                border-radius: 0.5rem !important;
              }

              /* Remove any problematic gradients and replace with solid colors */
              [class*="bg-linear-to"] {
                background-image: none !important;
              }

              [class*="from-"] {
                background-image: none !important;
              }

              [class*="via-"] {
                background-image: none !important;
              }

              [class*="to-"] {
                background-image: none !important;
              }

              /* Specific overrides for our design */
              .bg-linear-to-br { background-color: #f0fdf4 !important; }
              .bg-linear-to-r { background-color: #16a34a !important; }
              .from-green-50 { background-color: #f0fdf4 !important; }
              .from-green-600 { background-color: #16a34a !important; }
              .from-gray-50 { background-color: #f9fafb !important; }
              .from-yellow-50 { background-color: #fffbeb !important; }
              .from-blue-100 { background-color: #dbeafe !important; }
            `;
            clonedDoc.head.appendChild(style);
          }
        });
        const link = document.createElement('a');
        link.download = 'booking-summary.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
      } catch (error) {
        console.error('Error generating PNG:', error);
        // Fallback: try with different options
        try {
          const canvas = await html2canvas(summaryRef.current, {
            useCORS: true,
            allowTaint: true,
            scale: 1,
            logging: false,
            backgroundColor: '#ffffff',
            ignoreElements: (element) => {
              // Skip elements that might have problematic styles
              return element.tagName === 'STYLE' || element.classList.contains('some-problematic-class');
            }
          });
          const link = document.createElement('a');
          link.download = 'booking-summary.png';
          link.href = canvas.toDataURL('image/png');
          link.click();
        } catch (fallbackError) {
          console.error('Fallback PNG generation failed:', fallbackError);
          showNotification({ message: 'Unable to download. Please try again or contact support.', type: 'info' });
        }
      }
    }
  };

  return (
    <>
      {/* TRACKING CARD */}
      <div className="flex justify-center py-8 m-2 bg-linear-to-br from-green-50 via-white to-blue-50">
        <div className="flex flex-col items-center space-y-4 w-full max-w-md">

          <h3 className="text-lg font-semibold text-gray-800 text-center">
            Check Your Booking
          </h3>

          <div className="flex space-x-3">
            <input
              type="text"
              placeholder="Enter Tracking Code"
              name='tracking'
              value={trackingCode}
              onChange={(e) => setTrackingCode(e.target.value)}
              className="px-4 py-3 bg-white border border-gray-200 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400/50 focus:border-green-400/50 transition-all text-sm flex-1"
              required
            />

            <button
              onClick={() => {
                const code = trackingCode.trim();
                if (code.length === 0) {
                  showNotification({ message: 'Please enter your 8 digit tracking code', type: 'info' });
                } else if (code.length !== 8) {
                  showNotification({ message: 'Please enter 8 digit tracking code', type: 'info' });
                } else {
                  handleTrackBooking();
                }
              }}
              className="bg-linear-to-r from-green-400 to-blue-500 text-neutral-900 font-semibold py-3 px-3 rounded-lg shadow-lg hover:scale-[1.02] hover:shadow-xl transition-all duration-300"
            >
              Track Booking
            </button>
          </div>

        </div>
      </div>

      {/* Booking Summary */}
      {trackedBooking && hasSearched && !isExpired && (
        <div className="flex justify-center px-4">
          <div ref={summaryRef} className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-gray-200 p-6">
            <div className="text-center mb-6">
              <img src="/logo/logo.png" alt="Logo" className="w-20 h-20 mx-auto mb-4 rounded-lg shadow-lg" />
              <h2 className="text-2xl font-bold text-gray-800">Booking Confirmation</h2>
            </div>
            <div className="space-y-2 text-gray-700">
              <p><strong>Futsal:</strong> {trackedBooking.futsal_name}</p>
              <p><strong>Location:</strong> {trackedBooking.location}, {trackedBooking.city}</p>
              <p><strong>Contact:</strong> {trackedBooking.admin_phone || 'N/A'}</p>
              <p><strong>Playing Date:</strong> {formatDate(trackedBooking.booking_date)}</p>
              <p><strong>Time:</strong> {formatTimeRangeBooking(trackedBooking.time_slot)}</p>
              <p><strong>Players:</strong> {trackedBooking.number_of_players}</p>
              {trackedBooking.team_name && <p><strong>Team:</strong> {trackedBooking.team_name}</p>}
              <p><strong>Amount Paid:</strong> Rs. {trackedBooking.amount_paid}</p>
              {totalAmount !== null && <p><strong>Total Amount:</strong> Rs. {totalAmount}</p>}
              <p><strong>Tracking Code:</strong> {trackedBooking.tracking_code}</p>
              <p><strong>Booked By:</strong> {trackedBooking.guest_name}</p>
              <p><strong>Phone:</strong> {trackedBooking.guest_phone}</p>
              <p><strong>Booked On:</strong> {trackedBooking.created_at ? trackedBooking.created_at.split('T')[0] : 'N/A'}</p>
            </div>
            <div className="mt-6 p-4 bg-linear-to-r from-yellow-50 to-orange-50 rounded-xl border border-yellow-200">
              <p className="text-sm text-yellow-800 font-semibold mb-2">⚠️ Reminder: Please arrive 15 minutes before your booking time.</p>
              <p className="text-sm text-yellow-800 mb-2">🚫 Cancellation Policy: Non-refundable. Free cancellation up to 2 hours before play.</p>
              <p className="text-sm text-yellow-800 mb-2">💡 Account Benefit: Create an account to reschedule bookings and make multiple bookings easily..</p>
              <p className="text-sm text-yellow-800 text-center mt-5">Thank you for choosing {trackedBooking.futsal_name}!</p>
            </div>
            <div className="mt-6 flex flex-col space-y-2 md:flex-row md:space-x-2 md:space-y-0 png-hide">
              <button
                onClick={downloadAsPNG}
                className="flex-1 bg-linear-to-r from-blue-500 to-blue-600 text-white py-3 px-4 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
              >
                📥 Download PNG
              </button>
              <button
                onClick={handleCancelBooking}
                className="flex-1 bg-linear-to-r from-red-500 to-red-600 text-white py-3 px-4 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
              >
                ❌ Cancel Booking
              </button>
              <button
                onClick={() => {
                  setTrackingCode('');
                }}
                className="bg-gray-600 text-white py-3 px-4 rounded-xl hover:bg-gray-700 transition-all duration-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      {confirmModal?.isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="max-w-sm w-full bg-white rounded-2xl shadow-2xl border p-6 transform transition-all duration-300 border-red-200">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg mb-4 bg-red-100">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Confirm Action</h3>
              <p className="text-sm text-gray-600 mb-6">{confirmModal.message}</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmModal({ isOpen: false, message: '', onConfirm: () => {} })}
                  className="flex-1 bg-gray-200 text-gray-800 font-semibold py-2 px-4 rounded-lg hover:bg-gray-300 transition-all duration-300"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    confirmModal.onConfirm();
                  }}
                  className="flex-1 bg-red-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-red-600 transition-all duration-300"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}