"use client";

import { useEffect, useState, useRef, useReducer } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from 'next/link';
import html2canvas from "html2canvas";
import { useFutsal } from "@/hooks/useFutsals";
import { useTimeSlots } from "@/hooks/useTimeSlots";
import { useCreateBooking } from "@/hooks/useBookings";
import { useAuthStore } from "@/stores/authStore";
import { useNotificationStore } from "@/stores/notificationStore";
import { bookingReducer, initialBookingState } from "@/reducers/bookingReducer";
import { formatTime, formatDate, formatBookingTimeRange, generateTrackingCode } from "@/utils/helpers";
import PriceNotificationModal from "@/components/modals/PriceNotificationModal";

interface Futsal {
  futsal_id: number;
  name: string;
  location: string;
  city: string;
  images?: string[];
  video?: string;
  price_per_hour: number;
  latitude?: number;
  longitude?: number;
  admin_phone?: string;
  opening_hours?: string;
  closing_hours?: string;
  description?: string;
  average_rating?: number;
  total_ratings?: number;
  game_format?: string;
  facilities?: string[];
}

interface User {
  user_id: number;
  name: string;
  phone: string;
}

interface Booking {
  booking_id: number;
  user_name: string;
  user_phone: string;
  futsal_name: string;
  location: string;
  city: string;
  booking_date: string;
  time_slot: string;
  number_of_players: number;
  team_name?: string;
  amount_paid: number;
  price_per_hour: number;
  tracking_code?: string;
  created_at: string;
}

interface Slot {
  slot_id: number;
  start_time: string;
  end_time: string;
  shift_category: string;
  status: string;
  display_status?: string;
  booker_name?: string;
}

// Time formatting functions are now imported from helpers.ts

export default function BookFutsal() {
  const params = useParams();
  const futsalId = params?.futsalId ? parseInt(params.futsalId as string, 10) : undefined;
  const router = useRouter();

  // Create futsal-specific localStorage key to prevent state leakage between different futsals
  const storageKey = futsalId ? `bookingProgress_${futsalId}` : 'bookingProgress';

  // Server state with React Query
  const { data: futsal, isLoading: futsalLoading } = useFutsal(Number(params.futsalId));
  const { user } = useAuthStore();
  const { notification, showNotification } = useNotificationStore();
  const createBookingMutation = useCreateBooking();

  // Complex UI state with useReducer
  const [bookingState, dispatch] = useReducer(bookingReducer, initialBookingState);

  // Simple UI state
  const summaryRef = useRef<HTMLDivElement>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [currentPrice, setCurrentPrice] = useState<{ normalPrice: number, specialPrice?: { price: number, message?: string }, effectivePrice: number } | null>(null);
  const [priceNotification, setPriceNotification] = useState<{ isOpen: boolean, message: string } | null>(null);
  const [specialPrices, setSpecialPrices] = useState<any[]>([]);

  // Derived state
  const availableShifts = bookingState.availableShifts;
  const loggedInUser = user;
  const availableSlots = bookingState.availableSlots;
  const otpCode = bookingState.otpCode;
  const booking = bookingState.booking;
  const formatTimeSlot = formatTime;
  const phone = bookingState.phone;

  const downloadAsImage = async (format: 'png' | 'jpeg' | 'webp' = 'png') => {
    if (summaryRef.current) {
      // Store original styles
      const originalWidth = summaryRef.current.style.width;
      const originalMaxWidth = summaryRef.current.style.maxWidth;
      const originalMinWidth = summaryRef.current.style.minWidth;

      // Set fixed width for consistent dimensions across devices
      summaryRef.current.style.width = '800px';
      summaryRef.current.style.maxWidth = '800px';
      summaryRef.current.style.minWidth = '800px';

      try {
        const canvas = await html2canvas(summaryRef.current, {
          useCORS: true,
          allowTaint: false,
          scale: 2,
          logging: false,
          backgroundColor: "#ffffff",
          removeContainer: true,
          width: 800, // Fixed width for consistent output
          onclone: (clonedDoc) => {
            // Remove any styles that might contain unsupported color functions
            const styles = clonedDoc.querySelectorAll("style");
            styles.forEach((style) => {
              if (style.textContent && (style.textContent.includes("lab(") || style.textContent.includes("oklab("))) {
                style.remove();
              }
            });
            // Hide buttons for image
            const buttons = clonedDoc.querySelector(".png-hide") as HTMLElement;
            if (buttons) {
              buttons.style.display = "none";
            }
            // Override problematic CSS for image generation - comprehensive fallbacks
            const style = clonedDoc.createElement("style");
            style.textContent = `
              /* Remove all unsupported color functions */
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
          },
        });

        // Determine MIME type and file extension
        let mimeType: string;
        let fileExtension: string;

        switch (format) {
          case 'jpeg':
            mimeType = 'image/jpeg';
            fileExtension = 'jpg';
            break;
          case 'webp':
            mimeType = 'image/webp';
            fileExtension = 'webp';
            break;
          case 'png':
          default:
            mimeType = 'image/png';
            fileExtension = 'png';
            break;
        }

        const link = document.createElement("a");
        link.download = `booking-summary.${fileExtension}`;
        link.href = canvas.toDataURL(mimeType, format === 'jpeg' ? 0.9 : undefined);
        link.click();
      } catch (error) {
        console.error(`Error generating ${format.toUpperCase()}:`, error);
        // Fallback: try with different options
        try {
          const canvas = await html2canvas(summaryRef.current, {
            useCORS: true,
            allowTaint: true,
            scale: 1,
            logging: false,
            backgroundColor: "#ffffff",
            width: 800, // Fixed width for consistent output in fallback too
            ignoreElements: (element) => {
              // Skip elements that might have problematic styles
              return (
                element.tagName === "STYLE" ||
                element.classList.contains("some-problematic-class")
              );
            },
          });

          let mimeType: string;
          let fileExtension: string;

          switch (format) {
            case 'jpeg':
              mimeType = 'image/jpeg';
              fileExtension = 'jpg';
              break;
            case 'webp':
              mimeType = 'image/webp';
              fileExtension = 'webp';
              break;
            case 'png':
            default:
              mimeType = 'image/png';
              fileExtension = 'png';
              break;
          }

          const link = document.createElement("a");
          link.download = `booking-summary.${fileExtension}`;
          link.href = canvas.toDataURL(mimeType, format === 'jpeg' ? 0.9 : undefined);
          link.click();
        } catch (fallbackError) {
          console.error(`Fallback ${format.toUpperCase()} generation failed:`, fallbackError);
          showNotification({ message: `Unable to download ${format.toUpperCase()}. Please try again or contact support.`, type: 'info' });
        }
      } finally {
        // Restore original styles
        summaryRef.current.style.width = originalWidth;
        summaryRef.current.style.maxWidth = originalMaxWidth;
        summaryRef.current.style.minWidth = originalMinWidth;
      }
    }
  };

  // Time slots query
  const { data: timeSlotsData, refetch: refetchTimeSlots } = useTimeSlots(
    futsalId!,
    bookingState.selectedDate,
    bookingState.selectedShift
  );

  // Simple UI state
  const [otpCountdown, setOtpCountdown] = useState(0);
  const [showOtpNote, setShowOtpNote] = useState(false);
  const [esewaPhone, setEsewaPhone] = useState('');
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean, message: string, onConfirm: () => void } | null>(null);

  // Load booking progress from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      const data = JSON.parse(saved);
      dispatch({ type: 'LOAD_PROGRESS', payload: data });
    }
  }, [storageKey]);

  // Fetch price when date or selected slot changes
  useEffect(() => {
    const fetchPrice = async () => {
      if (futsalId && bookingState.selectedDate) {
        try {
          const selectedSlot = bookingState.selectedSlotIds.length > 0 ? availableSlots.find(slot => slot.slot_id === bookingState.selectedSlotIds[0]) : null;
          const startTime = selectedSlot ? selectedSlot.start_time : undefined;

          const url = startTime
            ? `${process.env.NEXT_PUBLIC_API_URL}/api/special-prices/price/${futsalId}/${bookingState.selectedDate}?startTime=${startTime}`
            : `${process.env.NEXT_PUBLIC_API_URL}/api/special-prices/price/${futsalId}/${bookingState.selectedDate}`;

          const response = await fetch(url);
          if (response.ok) {
            const priceData = await response.json();
            setCurrentPrice(priceData);

            // Show notification if special or time-based price
            if (priceData.specialPrice) {
              const message = `Normal: Rs. ${priceData.normalPrice} → ${priceData.specialPrice.message || 'Special Price'}: Rs. ${priceData.specialPrice.price}`;
              setPriceNotification({ isOpen: true, message });
            } else if (priceData.timeBasedPrice) {
              const message = `Normal: Rs. ${priceData.normalPrice} → ${priceData.timeBasedPrice.message || 'Time-Based Price'}: Rs. ${priceData.timeBasedPrice.price}`;
              setPriceNotification({ isOpen: true, message });
            } else {
              setPriceNotification(null);
            }
          }
        } catch (error) {
          console.error('Error fetching price:', error);
        }
      }
    };

    fetchPrice();
  }, [futsalId, bookingState.selectedDate, bookingState.selectedSlotIds, availableSlots]);

  // Save booking progress to localStorage whenever state changes
  useEffect(() => {
    const progress = {
      ...bookingState,
      esewaPhone,
    };
    localStorage.setItem(storageKey, JSON.stringify(progress));
  }, [bookingState, esewaPhone, storageKey]);

  // Calculate available shifts when futsal data is loaded
  useEffect(() => {
    if (futsal?.opening_hours && futsal?.closing_hours) {
      const openingHour = parseInt(futsal.opening_hours.split(":")[0]);
      const closingHour = parseInt(futsal.closing_hours.split(":")[0]);
      const shifts = [
        { name: "Morning", start: 6, end: 10 },
        { name: "Day", start: 10, end: 14 },
        { name: "Evening", start: 14, end: 18 },
        { name: "Night", start: 18, end: 23 },
      ];
      const available = shifts
        .filter((shift) => closingHour > shift.start && openingHour < shift.end)
        .map((shift) => shift.name);

      dispatch({ type: 'SET_AVAILABLE_SHIFTS', payload: available });
      // Clear the stored data
      localStorage.removeItem('selectedFutsal');
    }
  }, [futsal]);

  // OTP countdown timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (otpCountdown > 0) {
      interval = setInterval(() => {
        setOtpCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [otpCountdown]);

  // Real-time updates for time slots
  useEffect(() => {
    if (futsalId && bookingState.selectedDate) {
      // Refetch time slots when date changes to get real-time updates
      refetchTimeSlots();
    }
  }, [futsalId, bookingState.selectedDate, bookingState.selectedShift, refetchTimeSlots]);

  // Fetch special prices when in summary step
  useEffect(() => {
    if (bookingState.step === 7 && futsalId) {
      const fetchSpecialPrices = async () => {
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/special-prices/${futsalId}`);
          if (response.ok) {
            const data = await response.json();
            setSpecialPrices(data.specialPrices || []);
          }
        } catch (error) {
          console.error('Error fetching special prices:', error);
        }
      };
      fetchSpecialPrices();
    }
  }, [bookingState.step, futsalId]);

  // Set available slots when data is fetched
  useEffect(() => {
    if (timeSlotsData) {
      dispatch({ type: 'SET_AVAILABLE_SLOTS', payload: timeSlotsData.slots || [] });
    }
  }, [timeSlotsData, dispatch]);

  const handleDateSubmit = () => {
    if (bookingState.selectedDate) {
      dispatch({ type: 'SET_STEP', payload: 2 });
    }
  };

  const handleShiftSubmit = () => {
    if (bookingState.selectedShift && bookingState.selectedDate) {
      dispatch({ type: 'SET_STEP', payload: 3 });
    }
  };

  // Check slot status before allowing selection
  const checkSlotStatus = async (slotId: number): Promise<string> => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/time-slots/${slotId}/status`
      );
      if (response.ok) {
        const data = await response.json();
        return data.status;
      }
      return "error";
    } catch (error) {
      console.error("Error checking slot status:", error);
      return "error";
    }
  };

  // Handle slot selection with reservation
  const handleSlotClick = async (slot: Slot) => {
    try {
      if (bookingState.selectedSlotIds.includes(slot.slot_id)) {
        // Clicking the same slot, release and deselect
        await releaseSlotReservation(slot.slot_id);
        dispatch({ type: 'REMOVE_SELECTED_SLOT', payload: slot.slot_id });
        dispatch({ type: 'UPDATE_SLOT_STATUS', payload: { slotId: slot.slot_id, status: 'available', display_status: 'available' } });
      } else {
        // Clicking different slot, release previous if any
        if (bookingState.selectedSlotIds.length > 0) {
          for (const id of bookingState.selectedSlotIds) {
            await releaseSlotReservation(id);
          }
          dispatch({ type: 'CLEAR_SELECTED_SLOTS' });
        }

        // Reserve new slot
        const reserveResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/time-slots/${slot.slot_id}/reserve`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
          }
        );

        const reserveData = await reserveResponse.json();

        if (reserveResponse.ok) {
          // Reservation successful
          dispatch({ type: 'ADD_SELECTED_SLOT', payload: slot.slot_id });
          dispatch({ type: 'UPDATE_SLOT_STATUS', payload: { slotId: slot.slot_id, status: 'pending', display_status: 'pending' } });
        } else {
          // Reservation failed
          if (reserveData.status === "pending") {
            showNotification({ message: "Slot is already chosen and in process of booking. Please choose another one.", type: 'info' });
          } else if (reserveData.status === "booked") {
            showNotification({ message: "Slot already booked. Please choose another slot.", type: 'info' });
          } else if (reserveData.status === "disabled") {
            showNotification({ message: "Slot is disabled. Please choose another slot.", type: 'info' });
          } else {
            showNotification({ message: reserveData.message || "Unable to reserve slot. Please try again.", type: 'info' });
          }

          // Refresh slots
          refetchTimeSlots();
        }
      }
    } catch (error) {
      console.error("Error reserving slot:", error);
      showNotification({ message: "Unable to reserve slot. Please try again.", type: 'info' });
    }
  };

  // Release slot reservation when user goes back or changes selection
  const releaseSlotReservation = async (slotId: number) => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/time-slots/${slotId}/release`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Error releasing slot:", error);
    }
  };

  const handleSlotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (bookingState.selectedSlotIds.length === 0) return;

    // Check slot status before proceeding
    const currentStatus = await checkSlotStatus(bookingState.selectedSlotIds[0]);

    if (currentStatus !== "available" && currentStatus !== "pending") {
      if (currentStatus === "booked") {
        showNotification({ message: "Slot is already booked. Please choose another slot.", type: 'info' });
      } else if (currentStatus === "disabled") {
        showNotification({ message: "Slot is disabled. Please choose another slot.", type: 'info' });
      } else {
        showNotification({ message: "Unable to verify slot availability. Please try again.", type: 'info' });
      }
      // Reset selection and refresh slots
      dispatch({ type: 'CLEAR_SELECTED_SLOTS' });
      refetchTimeSlots();
      return;
    }

    try {
      // First check if phone number is already registered
      const registeredResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/users/check-registered/${bookingState.phone}`
      );
      const registeredData = await registeredResponse.json();

      if (registeredData.isRegistered) {
        showNotification({ message: "A user with this phone number already exists. Please log in to make a booking or use a different number.", type: 'info' });
        return;
      }

      // Check if phone is already verified
      const checkResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/otp/check-verified?contact=${bookingState.phone}&contact_type=phone`
      );
      const checkData = await checkResponse.json();

      if (checkData.verified) {
        // Phone already verified, proceed to payment
        dispatch({ type: 'SET_USER', payload: { user_id: 0, name: bookingState.name, phone: bookingState.phone } });
        dispatch({ type: 'SET_STEP', payload: 5 });
      } else {
        // Need to verify phone first
        const otpResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/otp/generate`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contact: bookingState.phone,
              otp_type: "phone",
            }),
          }
        );

        if (otpResponse.ok) {
          const otpData = await otpResponse.json();
          showNotification({ message: `OTP sent to ${bookingState.phone}. OTP: ${otpData.otp_code}`, type: 'info' });
          setOtpCountdown(60); // Start 1-minute countdown
          dispatch({ type: 'SET_STEP', payload: 4 }); // Go to OTP verification step
        } else {
          showNotification({ message: "Failed to send OTP", type: 'info' });
        }
      }
    } catch (error) {
      console.error("Error:", error);
      showNotification({ message: "Error processing request", type: 'info' });
    }
  };

  const generateTrackingCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "";
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const handleResendOTP = async () => {
    try {
      const otpResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/otp/generate`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contact: bookingState.phone,
            otp_type: "phone",
          }),
        }
      );

      if (otpResponse.ok) {
        const otpData = await otpResponse.json();
        setOtpCountdown(60);
        showNotification({ message: `OTP resent to ${bookingState.phone}. OTP: ${otpData.otp_code}`, type: 'info' });
      } else {
        showNotification({ message: "Failed to resend OTP", type: 'info' });
      }
    } catch (error) {
      console.error("Error resending OTP:", error);
      alert("Error resending OTP");
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const verifyResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/otp/verify`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contact: bookingState.phone,
            otp_code: bookingState.otpCode,
            otp_type: "phone",
          }),
        }
      );

      if (verifyResponse.ok) {
        // OTP verified, proceed to payment
        dispatch({ type: 'SET_USER', payload: { user_id: 0, name: bookingState.name, phone: bookingState.phone } });
        dispatch({ type: 'SET_STEP', payload: 5 });
      } else {
        showNotification({ message: "Invalid OTP", type: 'info' });
      }
    } catch (error) {
      console.error("Error verifying OTP:", error);
      showNotification({ message: "Error verifying OTP", type: 'info' });
    }
  };



  return (
    <div className="min-h-screen bg-linear-to-br from-green-50 via-white to-blue-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-linear-to-r from-gray-900 via-green-900 to-blue-900 backdrop-blur-md shadow-2xl border-b border-green-500/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div onClick={() => document.getElementById('hero')?.scrollIntoView({ behavior: 'smooth' })} className="relative cursor-pointer">
                <img src="/logo/logo.png" alt="BookMyFutsal" className="h-12 w-12 rounded-lg shadow-lg ring-2 ring-green-400/50" />
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-lg animate-pulse"></div>
              </div>
              <Link href="/" className="text-2xl md:text-3xl font-bold text-white drop-shadow-lg">
                <span className="bg-linear-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">BookMy</span>
                <span className="text-white">Futsal</span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <Link href="/" className="text-gray-200 hover:text-green-400 font-semibold transition-all duration-300 hover:scale-105 relative group">
                Home
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-green-400 transition-all duration-300 group-hover:w-full"></span>
              </Link>
              <Link href="/" className="text-gray-200 hover:text-green-400 font-semibold transition-all duration-300 hover:scale-105 relative group">
                Venues
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-green-400 transition-all duration-300 group-hover:w-full"></span>
              </Link>
              <Link href="/user/dashboard" className="text-gray-200 hover:text-green-400 font-semibold transition-all duration-300 hover:scale-105 relative group">
                My Bookings
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-green-400 transition-all duration-300 group-hover:w-full"></span>
              </Link>
              <Link href="/" className="text-gray-200 hover:text-green-400 font-semibold transition-all duration-300 hover:scale-105 relative group">
                About
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-green-400 transition-all duration-300 group-hover:w-full"></span>
              </Link>
              <Link href="/" className="text-gray-200 hover:text-green-400 font-semibold transition-all duration-300 hover:scale-105 relative group">
                Contact
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-green-400 transition-all duration-300 group-hover:w-full"></span>
              </Link>

            </nav>

            {/* Auth Buttons */}
            <div className="hidden md:flex items-center space-x-4">
              <Link
                href="/user/login"
                className="px-6 py-2 bg-linear-to-r from-blue-600 to-blue-700 text-white font-bold rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 border border-blue-500/30 hover:border-blue-400/50"
              >
                Login
              </Link>
              <Link
                href="/user/register"
                className="px-6 py-2 bg-linear-to-r from-green-600 to-green-700 text-white font-bold rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 border border-green-500/30 hover:border-green-400/50"
              >
                Sign Up
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-gray-200 hover:text-green-400 hover:bg-green-900/50 transition-all duration-300 border border-gray-600/30"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>

          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <div className="md:hidden border-t border-green-500/20 py-4  bg-linear-to-b from-gray-900/95 to-green-900/95 backdrop-blur-md">
              <nav className="flex flex-col space-y-4">
                <Link href="/" onClick={() => setIsMobileMenuOpen(false)} className="text-gray-200 hover:text-green-400 font-semibold transition-all duration-300 px-3 py-2 rounded-lg hover:bg-green-900/50">Home</Link>
                <Link href="/" onClick={() => setIsMobileMenuOpen(false)} className="text-gray-200 hover:text-green-400 font-semibold transition-all duration-300 px-3 py-2 rounded-lg hover:bg-green-900/50">Venues</Link>
                <Link href="/user/dashboard" onClick={() => setIsMobileMenuOpen(false)} className="text-gray-200 hover:text-green-400 font-semibold transition-all duration-300 px-3 py-2 rounded-lg hover:bg-green-900/50">My Bookings</Link>
                <Link href="/" onClick={() => setIsMobileMenuOpen(false)} className="text-gray-200 hover:text-green-400 font-semibold transition-all duration-300 px-3 py-2 rounded-lg hover:bg-green-900/50">About</Link>
                <Link href="/" onClick={() => setIsMobileMenuOpen(false)} className="text-gray-200 hover:text-green-400 font-semibold transition-all duration-300 px-3 py-2 rounded-lg hover:bg-green-900/50">Contact</Link>

                <div className="flex flex-col space-y-3 pt-4 border-t border-green-500/20">
                  <Link
                    href="/user/login"
                    className="px-4 py-3 bg-linear-to-r from-blue-600 to-blue-700 text-white font-bold rounded-lg text-center shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 border border-blue-500/30"
                  >
                    Login
                  </Link>
                  <Link
                    href="/user/register"
                    className="px-4 py-3 bg-linear-to-r from-green-600 to-green-700 text-white font-bold rounded-lg text-center shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 border border-green-500/30"
                  >
                    Sign Up
                  </Link>
                </div>
              </nav>
            </div>
          )}
        </div>
      </header>
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900 text-center">
            Book {futsal?.name || 'Futsal'}
          </h1>
        </div>
      </header>

      {/* Progress Indicator */}
      <div className="flex justify-center sm:justify-center py-8 bg-gray-50">
        <div className="max-w-4xl px-4">
          {/* Mobile: Progress Bar Style */}
          <div className="flex justify-center sm:hidden">
            <div className="w-full px-6">
              <div className="mb-3">
                <div className="flex justify-between text-xs text-gray-600 mb-2">
                  <span>Step {bookingState.step} of 7</span>
                  <span>{Math.round((bookingState.step / 7) * 100)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-lg h-3">
                  <div
                    className="bg-linear-to-r from-green-500 to-green-600 h-3 rounded-lg transition-all duration-300"
                    style={{ width: `${(bookingState.step / 7) * 100}%` }}
                  ></div>
                </div>
              </div>
              <div className="grid grid-cols-7 gap-1 text-xs text-center">
                <span className={bookingState.step >= 1 ? 'text-green-600 font-semibold' : 'text-gray-400'}>Date</span>
                <span className={bookingState.step >= 2 ? 'text-green-600 font-semibold' : 'text-gray-400'}>Shift</span>
                <span className={bookingState.step >= 3 ? 'text-green-600 font-semibold' : 'text-gray-400'}>Slot</span>
                <span className={bookingState.step >= 4 ? 'text-green-600 font-semibold' : 'text-gray-400'}>OTP</span>
                <span className={bookingState.step >= 5 ? 'text-green-600 font-semibold' : 'text-gray-400'}>Pay</span>
                <span className={bookingState.step >= 6 ? 'text-green-600 font-semibold' : 'text-gray-400'}>Track</span>
                <span className={bookingState.step >= 7 ? 'text-green-600 font-semibold' : 'text-gray-400'}>Done</span>
              </div>
            </div>
          </div>
          {/* Desktop: Horizontal */}
          <div className="hidden sm:flex sm:flex-row items-center space-x-4">
            <div className="flex items-center">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-lg ${bookingState.step >= 1 ? 'bg-linear-to-r from-green-500 to-green-600' : 'bg-gray-300'
                }`}>
                {bookingState.step > 1 ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  1
                )}
              </div>
              <span className={`ml-2 text-sm font-medium ${bookingState.step >= 1 ? 'text-green-600' : 'text-gray-500'}`}>Date</span>
            </div>
            <div className={`w-8 h-0.5 ${bookingState.step > 1 ? 'bg-linear-to-r from-green-500 to-green-600' : 'bg-gray-300'}`}></div>
            <div className="flex items-center">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-lg ${bookingState.step >= 2 ? 'bg-linear-to-r from-green-500 to-green-600' : 'bg-gray-300'
                }`}>
                {bookingState.step > 2 ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : bookingState.step === 2 ? (
                  2
                ) : (
                  <span className="text-gray-500">2</span>
                )}
              </div>
              <span className={`ml-2 text-sm font-medium ${bookingState.step >= 2 ? 'text-green-600' : 'text-gray-500'}`}>Shift</span>
            </div>
            <div className={`w-8 h-0.5 ${bookingState.step > 2 ? 'bg-linear-to-r from-green-500 to-green-600' : 'bg-gray-300'}`}></div>
            <div className="flex items-center">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-lg ${bookingState.step >= 3 ? 'bg-linear-to-r from-green-500 to-green-600' : 'bg-gray-300'
                }`}>
                {bookingState.step > 3 ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : bookingState.step === 3 ? (
                  3
                ) : (
                  <span className="text-gray-500">3</span>
                )}
              </div>
              <span className={`ml-2 text-sm font-medium ${bookingState.step >= 3 ? 'text-green-600' : 'text-gray-500'}`}>Slot</span>
            </div>
            <div className={`w-8 h-0.5 ${bookingState.step > 3 ? 'bg-linear-to-r from-green-500 to-green-600' : 'bg-gray-300'}`}></div>
            <div className="flex items-center">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-lg ${bookingState.step >= 4 ? 'bg-linear-to-r from-green-500 to-green-600' : 'bg-gray-300'
                }`}>
                {bookingState.step > 4 ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : bookingState.step === 4 ? (
                  4
                ) : (
                  <span className="text-gray-500">4</span>
                )}
              </div>
              <span className={`ml-2 text-sm font-medium ${bookingState.step >= 4 ? 'text-green-600' : 'text-gray-500'}`}>OTP</span>
            </div>
            <div className={`w-8 h-0.5 ${bookingState.step > 4 ? 'bg-linear-to-r from-green-500 to-green-600' : 'bg-gray-300'}`}></div>
            <div className="flex items-center">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-lg ${bookingState.step >= 5 ? 'bg-linear-to-r from-green-500 to-green-600' : 'bg-gray-300'
                }`}>
                {bookingState.step > 5 ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : bookingState.step === 5 ? (
                  5
                ) : (
                  <span className="text-gray-500">5</span>
                )}
              </div>
              <span className={`ml-2 text-sm font-medium ${bookingState.step >= 5 ? 'text-green-600' : 'text-gray-500'}`}>Payment</span>
            </div>
            <div className={`w-8 h-0.5 ${bookingState.step > 4 ? 'bg-linear-to-r from-green-500 to-green-600' : 'bg-gray-300'}`}></div>
            <div className="flex items-center">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-lg ${bookingState.step >= 6 ? 'bg-linear-to-r from-green-500 to-green-600' : 'bg-gray-300'
                }`}>
                {bookingState.step > 6 ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : bookingState.step === 6 ? (
                  6
                ) : (
                  <span className="text-gray-500">6</span>
                )}
              </div>
              <span className={`ml-2 text-sm font-medium ${bookingState.step >= 6 ? 'text-green-600' : 'text-gray-500'}`}>Tracking</span>
            </div>
            <div className={`w-8 h-0.5 ${bookingState.step > 6 ? 'bg-linear-to-r from-green-500 to-green-600' : 'bg-gray-300'}`}></div>
            <div className="flex items-center">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-lg ${bookingState.step >= 7 ? 'bg-linear-to-r from-green-500 to-green-600' : 'bg-gray-300'
                }`}>
                {bookingState.step > 7 ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : bookingState.step === 7 ? (
                  7
                ) : (
                  <span className="text-gray-500">7</span>
                )}
              </div>
              <span className={`ml-2 text-sm font-medium ${bookingState.step >= 7 ? 'text-green-600' : 'text-gray-500'}`}>Summary</span>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-2 sm:px-0">
          {/* Step 1: Select Date */}
          {bookingState.step === 1 && (
            <div className="max-w-lg mx-auto">
              <div className="relative bg-white rounded-2xl shadow-2xl overflow-hidden transform transition-all duration-500 hover:scale-[1.02]">
                {/* Cancel Button */}
                <div className="absolute top-4 right-4 z-10">
                  <button
                    onClick={() => {
                      setConfirmModal({
                        isOpen: true,
                        message: 'Are you sure you want to cancel this booking?',
                        onConfirm: () => {
                          setConfirmModal({ isOpen: false, message: '', onConfirm: () => { } });
                          localStorage.removeItem(storageKey);
                          router.push("/");
                        }
                      });
                    }}
                    className="w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-lg flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Gradient Background */}
                <div className="absolute inset-0 bg-linear-to-br from-green-50 via-white to-blue-50 opacity-50"></div>

                {/* Content */}
                <div className="relative p-5">
                  {/* Header */}
                  <div className="text-center mb-5">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-linear-to-br from-green-500 to-green-600 rounded-lg mb-4 shadow-lg">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-bold bg-linear-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-2">
                      Select Your Date
                    </h2>
                    <p className="text-gray-600 text-sm">Choose the perfect day for your futsal adventure</p>
                  </div>

                  {/* Date Input */}
                  <div className="space-y-7">
                    <div className="relative">
                      <label htmlFor="bookingDate" className="block text-sm font-semibold text-gray-700 mb-2">
                        📅 Booking Date
                      </label>
                      <div className="relative">
                        <input
                          type="date"
                          id="bookingDate"
                          value={bookingState.selectedDate}
                          onChange={(e) => dispatch({ type: 'SET_SELECTED_DATE', payload: e.target.value })}
                          min={new Date().toISOString().split("T")[0]}
                          required
                          className="w-full px-4 py-3.5 pl-9 bg-white border border-gray-200 rounded-lg text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400/50 focus:border-green-400/50 transition-all duration-300 font-medium text-sm"
                        />
                        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-500">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      </div>
                      {/* {currentPrice && (
                        <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                          <p className="text-sm text-green-800 font-medium">
                            {currentPrice.specialPrice ? (
                              <>
                                Normal: Rs. {currentPrice.normalPrice} → {currentPrice.specialPrice.message || 'Special'}: Rs. {currentPrice.effectivePrice}
                              </>
                            ) : (
                              <>Price: Rs. {currentPrice.effectivePrice}/hour</>
                            )}
                          </p>
                        </div>
                      )} */}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4 pt-4">
                      <button
                        onClick={() => {
                          if (bookingState.selectedSlotIds.length > 0) {
                            bookingState.selectedSlotIds.forEach(id => releaseSlotReservation(id));
                            dispatch({ type: 'CLEAR_SELECTED_SLOTS' });
                          }
                          router.push("/");
                        }}
                        className="flex-1 order-2 sm:order-1 bg-linear-to-r from-gray-500 to-gray-600 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 border border-gray-400/30"
                      >
                        <span className="flex items-center justify-center">
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                          </svg>
                          Back to Home
                        </span>
                      </button>
                      <button
                        onClick={handleDateSubmit}
                        disabled={!bookingState.selectedDate}
                        className="flex-1 order-1 sm:order-2 bg-linear-to-r from-green-500 to-green-600 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none border border-green-400/30"
                      >
                        <span className="flex items-center justify-center">
                          Next: Select Shift
                          <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </span>
                      </button>
                    </div>
                  </div>


                </div>
              </div>
            </div>
          )}

          {/* Step 2: Select Shift */}
          {bookingState.step === 2 && (
            <div className="max-w-lg mx-auto">
              <div className="relative bg-white rounded-2xl shadow-2xl overflow-hidden transform transition-all duration-500 hover:scale-[1.02]">
                {/* Cancel Button */}
                <div className="absolute top-4 right-4 z-10">
                  <button
                    onClick={() => {
                      setConfirmModal({
                        isOpen: true,
                        message: 'Are you sure you want to cancel this booking?',
                        onConfirm: () => {
                          setConfirmModal({ isOpen: false, message: '', onConfirm: () => { } });
                          localStorage.removeItem(storageKey);
                          router.push("/");
                        }
                      });
                    }}
                    className="w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-lg flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Gradient Background */}
                <div className="absolute inset-0 bg-linear-to-br from-green-50 via-white to-blue-50 opacity-50"></div>

                {/* Content */}
                <div className="relative p-8">
                  {/* Header */}
                  <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-linear-to-br from-green-500 to-green-600 rounded-lg mb-4 shadow-lg">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-bold bg-linear-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-2">
                      Choose Your Shift
                    </h2>
                    <p className="text-gray-600 text-sm">Pick the time period that works best for you</p>
                  </div>

                  {/* Selected Date Info */}
                  <div className="bg-linear-to-r from-green-100 to-blue-100 rounded-xl p-4 mb-6 border border-green-200">
                    <div className="flex items-center justify-center">
                      <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-sm font-medium text-green-800">
                        Selected Date: <span className="font-bold">{bookingState.selectedDate}</span>
                      </span>
                    </div>
                  </div>

                  {/* Shift Selection */}
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      {availableShifts.map((shift: string) => (
                        <button
                          key={shift}
                          onClick={() => {
                            const newShift = bookingState.selectedShift === shift ? '' : shift;
                            dispatch({ type: 'SET_SELECTED_SHIFT', payload: newShift });
                          }}
                          className={`relative p-6 border-2 rounded-xl transition-all duration-300 transform hover:scale-105 ${bookingState.selectedShift === shift
                              ? "bg-linear-to-br from-green-500 to-green-600 border-green-500 text-white shadow-lg"
                              : "bg-white border-gray-200 hover:border-green-300 hover:shadow-md"
                            }`}
                        >
                          {bookingState.selectedShift === shift && (
                            <div className="absolute top-2 right-2 w-6 h-6 bg-white rounded-full flex items-center justify-center">
                              <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          )}
                          <div className={`font-bold text-lg mb-1 ${bookingState.selectedShift === shift ? 'text-white' : 'text-gray-800'}`}>
                            {shift}
                          </div>
                          <div className={`text-sm ${bookingState.selectedShift === shift ? 'text-green-100' : 'text-gray-600'}`}>
                            {shift === "Morning" && "6 AM - 10 AM"}
                            {shift === "Day" && "10 AM - 2 PM"}
                            {shift === "Evening" && "2 PM - 6 PM"}
                            {shift === "Night" && "6 PM - 11 PM"}
                          </div>
                        </button>
                      ))}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4 pt-4">
                      <button
                        onClick={() => {
                          if (bookingState.selectedSlotIds.length > 0) {
                            bookingState.selectedSlotIds.forEach(id => releaseSlotReservation(id));
                            dispatch({ type: 'CLEAR_SELECTED_SLOTS' });
                          }
                          dispatch({ type: 'SET_STEP', payload: 1 });
                        }}
                        className="flex-1 order-2 sm:order-1 bg-linear-to-r from-gray-500 to-gray-600 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 border border-gray-400/30"
                      >
                        <span className="flex items-center justify-center">
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                          </svg>
                          Back
                        </span>
                      </button>
                      <button
                        onClick={handleShiftSubmit}
                        disabled={!bookingState.selectedShift}
                        className="flex-1 order-1 sm:order-2 bg-linear-to-r from-green-500 to-green-600 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none border border-green-400/30"
                      >
                        <span className="flex items-center justify-center">
                          Next: Select Slot
                          <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </span>
                      </button>
                    </div>
                  </div>


                </div>
              </div>
            </div>
          )}

          {/* Step 3: Select Slot and Enter Details */}
          {bookingState.step === 3 && (
            <div className="w-full max-w-4xl mx-auto">
              <div className="relative bg-white rounded-2xl shadow-2xl overflow-hidden transform transition-all duration-500 hover:scale-[1.02]">
                {/* Cancel Button */}
                <div className="absolute top-4 right-4 z-10">
                  <button
                    onClick={() => {
                      setConfirmModal({
                        isOpen: true,
                        message: 'Are you sure you want to cancel this booking?',
                        onConfirm: () => {
                          setConfirmModal({ isOpen: false, message: '', onConfirm: () => { } });
                          // Release selected slots
                          bookingState.selectedSlotIds.forEach(id => releaseSlotReservation(id));
                          dispatch({ type: 'CLEAR_SELECTED_SLOTS' });
                          localStorage.removeItem(storageKey);
                          router.push("/");
                        }
                      });
                    }}
                    className="w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-lg flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Gradient Background */}
                <div className="absolute inset-0 bg-linear-to-br from-green-50 via-white to-blue-50 opacity-50"></div>

                {/* Content */}
                <div className="relative p-2 md:p-8">
                  {/* Header */}
                  <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-linear-to-br from-green-500 to-green-600 rounded-lg mb-4 shadow-lg">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-bold bg-linear-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-2">
                      Pick Your Time Slot
                    </h2>
                    <p className="text-gray-600 text-sm">Choose the perfect time for your game</p>
                    {showOtpNote && !loggedInUser && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                        <p className="text-sm text-blue-800">
                          📱 <strong>OTP Verification:</strong> One-time verification required for new numbers. If you've booked before with this number, no OTP needed.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Date and Shift Info */}
                  <div className="bg-linear-to-r from-green-100 to-blue-100 rounded-xl p-4 mb-6 border border-green-200">
                    <div className="flex items-center justify-center space-x-6">
                      <div className="flex items-center">
                        <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="text-sm font-medium text-green-800">
                          Date: <span className="font-bold">{bookingState.selectedDate}</span>
                        </span>
                      </div>
                      <div className="w-px h-6 bg-green-300"></div>
                      <div className="flex items-center">
                        <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                        <span className="text-sm font-medium text-green-800">
                          Shift: <span className="font-bold">{bookingState.selectedShift}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Slot Selection */}
                  {availableSlots.length > 0 ? (
                    <div className="mb-8">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">Available Time Slots</h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {availableSlots.map((slot: any) => (
                          <button
                            key={slot.slot_id}
                            onClick={() => handleSlotClick(slot)}
                            disabled={
                              (slot.display_status === "booked" ||
                                slot.display_status === "expired" ||
                                slot.status === "disabled") && !bookingState.selectedSlotIds.includes(slot.slot_id)
                            }
                            className={`relative p-4 border-2 rounded-xl text-center transition-all duration-300 transform hover:scale-105 ${bookingState.selectedSlotIds.includes(slot.slot_id)
                                ? "bg-linear-to-br from-green-500 to-green-600 border-green-500 text-white shadow-lg"
                                : slot.display_status === "booked"
                                  ? "bg-red-50 border-red-300 cursor-not-allowed opacity-60"
                                  : slot.display_status === "expired"
                                    ? "bg-yellow-50 border-yellow-300 cursor-not-allowed opacity-60"
                                    : slot.status === "disabled"
                                      ? "bg-gray-50 border-gray-300 cursor-not-allowed opacity-60"
                                      : slot.status === "pending"
                                        ? "bg-orange-50 border-orange-300 hover:border-green-300 hover:shadow-md"
                                        : "bg-white border-gray-200 hover:border-green-300 hover:shadow-md"
                              }`}
                          >
                            {bookingState.selectedSlotIds.includes(slot.slot_id) && (
                              <div className="absolute top-1 right-2 w-4 h-4 bg-white rounded-lg flex items-center justify-center shadow-sm">
                                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              </div>
                            )}
                            <div className={`font-bold text-sm mb-1 ${bookingState.selectedSlotIds.includes(slot.slot_id) ? 'text-white' :
                                slot.display_status === "booked" ? 'text-red-600' :
                                  slot.display_status === "expired" ? 'text-yellow-600' :
                                    slot.status === "disabled" ? 'text-gray-600' :
                                      slot.status === "pending" ? 'text-orange-400' :
                                        'text-gray-800'
                              }`}>
                              {(() => {
                                const startHour = parseInt(slot.start_time.split(':')[0]);
                                const endHour = parseInt(slot.end_time.split(':')[0]);
                                const startDisplay = startHour === 0 ? 12 : startHour > 12 ? startHour - 12 : startHour;
                                const endDisplay = endHour === 0 ? 12 : endHour > 12 ? endHour - 12 : endHour;
                                const startPeriod = startHour >= 12 ? 'PM' : 'AM';
                                const endPeriod = endHour >= 12 ? 'PM' : 'AM';
                                return `${startDisplay}${startPeriod}-${endDisplay}${endPeriod}`;
                              })()}
                            </div>
                            <div className={`text-sm ${bookingState.selectedSlotIds.includes(slot.slot_id) ? 'text-white' :
                                slot.display_status === "booked" ? 'text-red-500' :
                                  slot.display_status === "expired" ? 'text-yellow-500' :
                                    slot.status === "disabled" ? 'text-gray-500' :
                                      slot.status === "pending" ? 'text-orange-600' :
                                        'text-gray-600'
                              }`}>
                              {bookingState.selectedSlotIds.includes(slot.slot_id)
                                ? "✅ Selected"
                                : slot.display_status === "booked"
                                  ? `👤 Booked`
                                  : slot.display_status === "expired"
                                    ? "⏰ Expired"
                                    : slot.status === "disabled"
                                      ? "🚫 Disabled"
                                      : slot.status === "pending"
                                        ? "⏳ In Process"
                                        : "✅ Available"}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <p className="text-gray-500 text-lg font-medium">No slots available for this shift</p>
                      <p className="text-gray-400 text-sm mt-1">Try selecting a different shift or date</p>
                    </div>
                  )}

                  {/* Details Form */}
                  {bookingState.selectedSlotIds.length > 0 && (
                    <div className="border-t border-gray-200 pt-8">
                      <div className="text-center mb-6">
                        <h3 className="text-xl font-bold text-gray-800 mb-2">Enter Your Details</h3>
                        <p className="text-gray-600 text-sm">Complete your booking information</p>
                      </div>

                      <form onSubmit={handleSlotSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="relative">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                              📱 Phone Number
                            </label>
                            <div className="relative">
                              <input
                                type="tel"
                                placeholder="10 digits starting with 9"
                                id="phone"
                                value={bookingState.phone}
                                maxLength={10}
                                pattern="9[0-9]{9}"
                                onChange={async (e) => {
                                  const value = e.target.value.replace(/\D/g, ""); // Only allow digits
                                  if (value.length <= 10 && (value === "" || value.startsWith("9"))) {
                                    dispatch({ type: 'SET_PHONE', payload: value });
                                    // Auto-fill eSewa phone number with the entered phone number
                                    setEsewaPhone(value);
                                    if (value.length === 10) {
                                      // Check for verified phone and pre-populate if available
                                      try {
                                        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/bookings/last-verified/${value}`);
                                        const data = await response.json();
                                        if (data.verified && data.guest_name) {
                                          dispatch({ type: 'SET_NAME', payload: data.guest_name });
                                          dispatch({ type: 'SET_NUMBER_OF_PLAYERS', payload: data.number_of_players?.toString() || '5' });
                                          dispatch({ type: 'SET_TEAM_NAME', payload: data.team_name || "" });
                                        } else {
                                          // Clear fields if not verified or no data
                                          dispatch({ type: 'SET_NAME', payload: "" });
                                          dispatch({ type: 'SET_NUMBER_OF_PLAYERS', payload: '10' });
                                          dispatch({ type: 'SET_TEAM_NAME', payload: "" });
                                        }
                                      } catch (error) {
                                        console.error("Error fetching last booking details:", error);
                                        // Clear fields on error
                                        dispatch({ type: 'SET_NAME', payload: "" });
                                        dispatch({ type: 'SET_NUMBER_OF_PLAYERS', payload: '5' });
                                        dispatch({ type: 'SET_TEAM_NAME', payload: "" });
                                      }
                                      // Check if phone is verified for OTP note
                                      try {
                                        const checkResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/otp/check-verified?contact=${value}&contact_type=phone`);
                                        const checkData = await checkResponse.json();
                                        setShowOtpNote(!checkData.verified);
                                      } catch (error) {
                                        console.error("Error checking verification:", error);
                                        setShowOtpNote(true); // Default to show if error
                                      }
                                    } else {
                                      // Clear fields when phone is not complete
                                      dispatch({ type: 'SET_NAME', payload: "" });
                                      dispatch({ type: 'SET_NUMBER_OF_PLAYERS', payload: '10' });
                                      dispatch({ type: 'SET_TEAM_NAME', payload: "" });
                                      setShowOtpNote(false);
                                    }
                                  }
                                }}
                                required
                                className="w-full px-4 py-3 pl-12 bg-white border-2 border-gray-200 rounded-lg text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400/50 focus:border-green-400/50 transition-all duration-300 font-medium text-sm"
                              />
                              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-500">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                </svg>
                              </div>
                            </div>
                          </div>

                          <div className="relative">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                              👤 Your Name
                            </label>
                            <div className="relative">
                              <input
                                type="text"
                                id="name"
                                placeholder="Enter your full name"
                                value={bookingState.name}
                                onChange={(e) => dispatch({ type: 'SET_NAME', payload: e.target.value })}
                                required
                                className="w-full px-4 py-3 pl-12 bg-white border-2 border-gray-200 rounded-lg text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400/50 focus:border-green-400/50 transition-all duration-300 font-medium text-sm"
                              />
                              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-500">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="relative">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                              👥 Number of Players
                            </label>
                            <div className="relative">
                              <input
                                type="number"
                                id="number"
                                placeholder="1-10 players"
                                value={bookingState.numberOfPlayers}
                                onChange={(e) => dispatch({ type: 'SET_NUMBER_OF_PLAYERS', payload: e.target.value })}
                                min="1"
                                max="10"
                                required
                                className="w-full px-4 py-3 pl-12 bg-white border-2 border-gray-200 rounded-lg text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400/50 focus:border-green-400/50 transition-all duration-300 font-medium text-sm"
                              />
                              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-500">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                              </div>
                            </div>
                          </div>

                          <div className="relative">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                              🏆 Team Name <span className="text-gray-500 font-normal">(optional)</span>
                            </label>
                            <div className="relative">
                              <input
                                type="text"
                                id="teamname"
                                placeholder="Enter team name"
                                value={bookingState.teamName}
                                onChange={(e) => dispatch({ type: 'SET_TEAM_NAME', payload: e.target.value })}
                                className="w-full px-4 py-3 pl-12 bg-white border-2 border-gray-200 rounded-lg text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400/50 focus:border-green-400/50 transition-all duration-300 font-medium text-sm"
                              />
                              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-500">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row gap-4 pt-6">
                          <button
                            type="button"
                            onClick={() => {
                              if (bookingState.selectedSlotIds.length > 0) {
                                bookingState.selectedSlotIds.forEach(id => releaseSlotReservation(id));
                                dispatch({ type: 'CLEAR_SELECTED_SLOTS' });
                              }
                              dispatch({ type: 'SET_STEP', payload: 2 });
                            }}
                            className="flex-1 order-2 sm:order-1 bg-linear-to-r from-gray-500 to-gray-600 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 border border-gray-400/30"
                          >
                            <span className="flex items-center justify-center">
                              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                              </svg>
                              Back
                            </span>
                          </button>
                          <button
                            type="submit"
                            className="flex-1 order-1 sm:order-2 bg-linear-to-r from-green-500 to-green-600 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 border border-green-400/30"
                          >
                            <span className="flex items-center justify-center">
                              {showOtpNote ? 'Next: OTP Verify' : 'Next: Advance Payment'}
                              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </span>
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  {/* Back Button when no slot selected */}
                  {bookingState.selectedSlotIds.length === 0 && availableSlots.length > 0 && (
                    <div className="flex justify-center pt-6">
                      <button
                        onClick={() => dispatch({ type: 'SET_STEP', payload: 2 })}
                        className="bg-linear-to-r from-gray-500 to-gray-600 text-white font-semibold py-3 px-8 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 border border-gray-400/30 mb-3"
                      >
                        <span className="flex items-center justify-center">
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                          </svg>
                          Back to Shift Selection
                        </span>
                      </button>
                    </div>
                  )}


                </div>
              </div>
            </div>
          )}


          {/* Step 4: OTP Verification */}
          {bookingState.step === 4 && (
            <div className="max-w-lg mx-auto">
              <div className="relative bg-white rounded-2xl shadow-2xl overflow-hidden transform transition-all duration-500 hover:scale-[1.02]">
                {/* Cancel Button */}
                <div className="absolute top-4 right-4 z-10">
                  <button
                    onClick={() => {
                      setConfirmModal({
                        isOpen: true,
                        message: 'Are you sure you want to cancel this booking?',
                        onConfirm: () => {
                          setConfirmModal({ isOpen: false, message: '', onConfirm: () => { } });
                          localStorage.removeItem(storageKey);
                          router.push("/");
                        }
                      });
                    }}
                    className="w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-lg flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Gradient Background */}
                <div className="absolute inset-0 bg-linear-to-br from-green-50 via-white to-blue-50 opacity-50"></div>

                {/* Content */}
                <div className="relative p-8">
                  {/* Header */}
                  <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-linear-to-br from-green-500 to-green-600 rounded-lg mb-4 shadow-lg">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-bold bg-linear-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-2">
                      Verify Phone Number
                    </h2>
                    <p className="text-gray-600 text-sm">Enter the OTP sent to your phone</p>
                  </div>

                  {/* Phone Info */}
                  <div className="bg-linear-to-r from-green-100 to-blue-100 rounded-xl p-4 mb-6 border border-green-200">
                    <div className="flex items-center justify-center">
                      <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      <span className="text-sm font-medium text-green-800">
                        OTP sent to: <span className="font-bold">{bookingState.phone}</span>
                      </span>
                    </div>
                  </div>

                  {/* OTP Countdown */}
                  {otpCountdown > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                      <div className="flex items-center justify-center">
                        <svg className="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-sm font-medium text-red-800">
                          Resend OTP in: {Math.floor(otpCountdown / 60)}:{(otpCountdown % 60).toString().padStart(2, "0")}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* OTP Form */}
                  <form onSubmit={handleOtpSubmit} className="space-y-6">
                    <div className="text-center">
                      <label className="block text-sm font-semibold text-gray-700 mb-4">
                        Enter 6-digit OTP
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="000000"
                          value={bookingState.otpCode}
                          onChange={(e) => dispatch({ type: 'SET_OTP_CODE', payload: e.target.value })}
                          required
                          className="w-full px-6 py-4 border-2 border-gray-200 rounded-xl text-center text-2xl font-mono font-bold tracking-widest focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all duration-300 text-gray-700"
                          maxLength={6}
                        />
                        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-green-400">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4 pt-4">
                      <button
                        type="button"
                        onClick={() => {
                          if (bookingState.selectedSlotIds.length > 0) {
                            bookingState.selectedSlotIds.forEach(id => releaseSlotReservation(id));
                            dispatch({ type: 'CLEAR_SELECTED_SLOTS' });
                          }
                          dispatch({ type: 'SET_STEP', payload: 3 });
                        }}
                        className="flex-1 order-2 sm:order-1 bg-linear-to-r from-gray-500 to-gray-600 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 border border-gray-400/30"
                      >
                        <span className="flex items-center justify-center">
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                          </svg>
                          Back
                        </span>
                      </button>
                      {otpCountdown > 0 ? (
                        <button
                          type="submit"
                          disabled={!otpCode}
                          className="flex-1 order-1 sm:order-2 bg-linear-to-r from-green-500 to-green-600 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none border border-green-400/30"
                        >
                          <span className="flex items-center justify-center">
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Verify OTP
                          </span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={handleResendOTP}
                          className="flex-1 order-1 sm:order-2 bg-linear-to-r from-green-500 to-green-600 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 border border-green-400/30"
                        >
                          <span className="flex items-center justify-center">
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Resend OTP
                          </span>
                        </button>
                      )}
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Payment / Tracking Code */}
          {bookingState.step === 5 && !bookingState.booking && (
            <div className="max-w-lg mx-auto">
              <div className="relative bg-white rounded-2xl shadow-2xl overflow-hidden transform transition-all duration-500 hover:scale-[1.02]">
                {/* Cancel Button */}
                <div className="absolute top-4 right-4 z-10">
                  <button
                    onClick={() => {
                      setConfirmModal({
                        isOpen: true,
                        message: 'Are you sure you want to cancel this booking?',
                        onConfirm: () => {
                          setConfirmModal({ isOpen: false, message: '', onConfirm: () => { } });
                          // Release selected slots
                          bookingState.selectedSlotIds.forEach(id => releaseSlotReservation(id));
                          dispatch({ type: 'CLEAR_SELECTED_SLOTS' });
                          localStorage.removeItem(storageKey);
                          router.push("/");
                        }
                      });
                    }}
                    className="w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-lg flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Gradient Background */}
                <div className="absolute inset-0 bg-linear-to-br from-green-50 via-white to-blue-50 opacity-50"></div>

                {/* Content */}
                <div className="relative p-8">
                  {/* Header */}
                  <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-linear-to-br from-green-500 to-green-600 rounded-lg mb-4 shadow-lg">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-bold bg-linear-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-2">
                      Advance Payment
                    </h2>
                    <p className="text-gray-600 text-sm">Pay Rs. 100 advance to confirm your booking</p>
                  </div>

                  {/* Phone Info */}
                  <div className="bg-linear-to-r from-green-100 to-blue-100 rounded-xl p-4 mb-6 border border-green-200">
                    <div className="flex items-center justify-center">
                      <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      <span className="text-sm font-medium text-green-800">
                        Phone: <span className="font-bold">{bookingState.phone}</span>
                      </span>
                    </div>
                  </div>

                  {/* eSewa Phone Number Input */}
                  <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      📱 eSewa Phone Number
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={esewaPhone}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, ""); // Only allow digits
                          if (value.length <= 10 && (value === "" || value.startsWith("9"))) {
                            setEsewaPhone(value);
                          }
                        }}
                        placeholder="Enter your eSewa registered phone number"
                        className="w-full px-4 py-3 pl-12 bg-white border-2 border-gray-200 rounded-lg text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400/50 focus:border-green-400/50 transition-all duration-300 font-medium text-sm"
                        required
                        maxLength={10}
                      />
                      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-500">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">This should be the phone number registered with your eSewa account</p>
                  </div>

                  {/* eSewa Details */}
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 mb-8">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">eSewa Payment Details</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 font-medium">Merchant:</span>
                        <span className="text-gray-800 font-semibold">BookMyFutsal</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 font-medium">Amount:</span>
                        <span className="text-green-600 font-bold">Rs. 100</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 font-medium">eSewa ID:</span>
                        <span className="text-gray-800 font-semibold">{esewaPhone || 'Not set'}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 font-medium">Purpose:</span>
                        <span className="text-gray-800 font-semibold">Advance Booking</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button
                      onClick={() => dispatch({ type: 'SET_STEP', payload: 4 })}
                      className="flex-1 order-2 sm:order-1 bg-linear-to-r from-gray-500 to-gray-600 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 border border-gray-400/30"
                    >
                      <span className="flex items-center justify-center">
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Back
                      </span>
                    </button>
                    <button
                      onClick={async () => {
                        if (!esewaPhone.trim()) {
                          showNotification({ message: "Please enter your eSewa phone number", type: 'info' });
                          return;
                        }

                        // Create booking immediately after payment
                        try {
                          const bookingResponse = await createBookingMutation.mutateAsync({
                            slot_id: bookingState.selectedSlotIds[0],
                            number_of_players: Number(bookingState.numberOfPlayers) || 5,
                            team_name: bookingState.teamName,
                            payment_status: "paid",
                            amount_paid: 100,
                            otp_verified: true,
                            tracking_code: generateTrackingCode(),
                            guest_name: bookingState.name,
                            guest_phone: bookingState.phone,
                            price_per_hour: currentPrice?.effectivePrice || futsal.price_per_hour,
                          });

                          if (bookingResponse) {
                            showNotification({ message: "Payment successful!", type: 'success' });
                            dispatch({ type: 'SET_BOOKING', payload: { ...bookingResponse.booking, futsal_name: futsal.name, location: futsal.location, city: futsal.city, price_per_hour: futsal.price_per_hour } });
                            dispatch({ type: 'SET_GENERATED_TRACKING_CODE', payload: bookingResponse.booking.tracking_code });
                            dispatch({ type: 'SET_STEP', payload: 6 });
                          }
                        } catch (error) {
                          console.error("Error:", error);
                          showNotification({ message: "Error processing payment. Please try again.", type: 'info' });
                        }
                      }}
                      disabled={!esewaPhone.trim()}
                      className="flex-1 order-1 sm:order-2 bg-linear-to-r from-green-500 to-green-600 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 border border-green-400/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    >
                      <span className="flex items-center justify-center">
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        </svg>
                        Pay Rs. 100
                      </span>
                    </button>
                  </div>

                </div>
              </div>
            </div>
          )}

          {/* Step 6: Tracking Code */}
          {bookingState.step === 6 && bookingState.generatedTrackingCode && (
            <div className="max-w-lg mx-auto">
              <div className="relative bg-white rounded-2xl shadow-2xl overflow-hidden transform transition-all duration-500 hover:scale-[1.02]">
                {/* Gradient Background */}
                <div className="absolute inset-0 bg-linear-to-br from-green-50 via-white to-blue-50 opacity-50"></div>

                {/* Content */}
                <div className="relative p-8">
                  {/* Header */}
                  <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-linear-to-br from-green-500 to-green-600 rounded-lg mb-4 shadow-lg">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-bold bg-linear-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-2">
                      Your Tracking Code
                    </h2>
                    <p className="text-gray-600 text-sm">Save this code to manage your booking</p>
                  </div>

                  {/* Tracking Code Display */}
                  <div className="text-center mb-8">
                    <p className="text-gray-700 mb-4 font-medium">
                      Your unique tracking code has been generated:
                    </p>
                    <div className="bg-linear-to-r from-gray-100 to-gray-200 border-2 border-gray-300 rounded-xl p-4 mb-4 shadow-inner">
                      <div className="text-3xl font-mono font-bold text-gray-800 tracking-wider ">
                        {bookingState.generatedTrackingCode}
                      </div>
                    </div>
                  </div>

                  {/* Info Alert */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
                    <div className="flex items-center">
                      <svg className="w-5 h-5 text-blue-600 mr-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-sm text-blue-800 font-medium">
                        Save this code to track and manage your booking later.
                      </p>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="text-center">
                    <button
                      onClick={() => dispatch({ type: 'SET_STEP', payload: 7 })}
                      className="bg-linear-to-r from-green-500 to-green-600 text-white font-semibold py-3 px-8 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 border border-green-400/30"
                    >
                      <span className="flex items-center justify-center">
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                        Next: Summary
                      </span>
                    </button>
                  </div>

                </div>
              </div>
            </div>
          )}

          {/* Step 7: Summary */}
          {bookingState.step === 7 && bookingState.booking && (() => {
            const bookingDate = bookingState.booking.booking_date;
            const dayOfWeek = new Date(bookingDate).toLocaleString('en-US', { weekday: 'long' }).toLowerCase();

            // Check for date-specific special price first
            const dateSpecial = specialPrices.find(sp => sp.type === 'date' && sp.special_date === bookingDate);

            // If no date-specific, check for recurring special price
            const recurringSpecial = !dateSpecial ? specialPrices.find(sp =>
              sp.type === 'recurring' && sp.recurring_days && sp.recurring_days.includes(dayOfWeek)
            ) : null;

            const applicableSpecial = dateSpecial || recurringSpecial;

            // Check for time-based pricing if no special price
            let timeBasedPrice = null;
            if (!applicableSpecial && bookingState.booking.time_slot) {
              const slotStartTime = bookingState.booking.time_slot.split('-')[0];
              // Note: In a real implementation, you'd fetch time-based prices for this futsal
              // For now, we'll assume the effective price from currentPrice includes time-based pricing
            }

            const rateToShow = applicableSpecial ? applicableSpecial.special_price : futsal.price_per_hour;

            return (
              <div className="max-w-4xl mx-auto">
                <div
                  ref={summaryRef}
                  className="relative bg-linear-to-br from-green-50 via-white to-blue-50 rounded-3xl shadow-2xl overflow-hidden border border-green-200/50 w-full"
                >
                  {/* Background Pattern */}
                  <div className="absolute inset-0 opacity-5">
                    <div className="absolute top-0 left-0 w-32 h-32 bg-green-400 rounded-lg -translate-x-16 -translate-y-16"></div>
                    <div className="absolute top-0 right-0 w-24 h-24 bg-blue-400 rounded-lg translate-x-12 -translate-y-12"></div>
                    <div className="absolute bottom-0 left-1/4 w-20 h-20 bg-green-300 rounded-lg"></div>
                    <div className="absolute bottom-0 right-1/3 w-16 h-16 bg-blue-300 rounded-lg"></div>
                  </div>

                  {/* Header Section */}
                  <div className="relative bg-linear-to-r from-green-600 via-green-700 to-blue-700 p-6 md:p-8 text-white">
                    <div className="flex flex-col md:flex-row items-center justify-between">
                      <div className="flex items-center space-x-4 mb-4 md:mb-0">
                        <div className="relative">
                          <img
                            src="/logo/logo.png"
                            alt="BookMyFutsal Logo"
                            className="w-16 h-16 md:w-20 md:h-20 rounded-lg shadow-lg ring-4 ring-white/20"
                          />
                          <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-400 rounded-lg animate-pulse"></div>
                        </div>
                        <div>
                          <h1 className="text-2xl md:text-3xl font-bold">BookMyFutsal</h1>
                          <p className="text-green-100 text-sm md:text-base">Premium Futsal Booking</p>
                        </div>
                      </div>
                      <div className="text-center md:text-right">
                        <div className="text-3xl md:text-4xl font-bold">🎉</div>
                        <p className="text-green-100 font-medium">Booking Confirmed!</p>
                      </div>
                    </div>
                  </div>

                  {/* Main Content */}
                  <div className="relative p-2 md:p-4">
                    {/* Booking Details Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                      {/* Venue Details */}
                      <div className="bg-white rounded-2xl p-6 shadow-lg border border-green-100">
                        <div className="flex items-center mb-4">
                          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                            <span className="text-2xl">🏟️</span>
                          </div>
                          <h3 className="text-lg font-bold text-gray-800">Venue Details</h3>
                        </div>
                        <div className="space-y-3">
                          <div className="flex justify-between items-start">
                            <span className="text-gray-600 font-medium">Futsal:</span>
                            <span className="text-gray-800 font-semibold text-right ml-2">{bookingState.booking.futsal_name}</span>
                          </div>
                          <div className="flex justify-between items-start">
                            <span className="text-gray-600 font-medium">Location:</span>
                            <span className="text-gray-800 font-semibold text-right ml-2">{bookingState.booking.location}, {bookingState.booking.city}</span>
                          </div>
                          <div className="flex justify-between items-start">
                            <span className="text-gray-600 font-medium">Contact:</span>
                            <span className="text-gray-800 font-semibold text-right ml-2">{futsal?.admin_phone || "N/A"}</span>
                          </div>
                        </div>
                      </div>

                      {/* Booking Details */}
                      <div className="bg-white rounded-2xl p-6 shadow-lg border border-green-100">
                        <div className="flex items-center mb-4">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                            <span className="text-2xl">📅</span>
                          </div>
                          <h3 className="text-lg font-bold text-gray-800">Booking Details</h3>
                        </div>
                        <div className="space-y-3">
                          <div className="flex justify-between items-start">
                            <span className="text-gray-600 font-medium">Playing Date:</span>
                            <span className="text-gray-800 font-semibold text-right ml-2">{formatDate(bookingState.booking.booking_date)}</span>
                          </div>
                          <div className="flex justify-between items-start">
                            <span className="text-gray-600 font-medium">Booked On:</span>
                            <span className="text-gray-800 font-semibold text-right ml-2">{formatDate(bookingState.booking.created_at.split('T')[0])}</span>
                          </div>
                          <div className="flex justify-between items-start">
                            <span className="text-gray-600 font-medium">Time:</span>
                            <span className="text-gray-800 font-semibold text-right ml-2">{formatBookingTimeRange(bookingState.booking.time_slot)}</span>
                          </div>
                          <div className="flex justify-between items-start">
                            <span className="text-gray-600 font-medium">Players:</span>
                            <span className="text-gray-800 font-semibold text-right ml-2">{bookingState.booking.number_of_players}</span>
                          </div>
                          {booking.team_name && (
                            <div className="flex justify-between items-start">
                              <span className="text-gray-600 font-medium">Team:</span>
                              <span className="text-gray-800 font-semibold text-right ml-2">{bookingState.booking.team_name}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Payment Details */}
                      <div className="bg-white rounded-2xl p-6 shadow-lg border border-green-100 md:col-span-1 lg:col-span-1">
                        <div className="flex items-center mb-4">
                          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                            <span className="text-2xl">💰</span>
                          </div>
                          <h3 className="text-lg font-bold text-gray-800">Payment Details</h3>
                        </div>
                        <div className="space-y-3">
                          <div className="flex justify-between items-start">
                            <span className="text-gray-600 font-medium">Amount Paid:</span>
                            <span className="text-green-600 font-bold text-lg text-right ml-2">Rs. {bookingState.booking.amount_paid}</span>
                          </div>
                          <div className="flex justify-between items-start">
                            <span className="text-gray-600 font-medium">Rate/Hour:</span>
                            <span className="text-gray-800 font-semibold text-right ml-2">
                              Rs. {rateToShow}
                              {applicableSpecial && (
                                <span className="text-xs text-green-600 ml-1">
                                  ({applicableSpecial.message || 'Special Price'})
                                </span>
                              )}
                            </span>
                          </div>
                          <div className="flex justify-between items-start">
                            <span className="text-gray-600 font-medium">Tracking Code:</span>
                            <span className="text-gray-800 font-semibold text-right ml-2">{bookingState.booking.tracking_code}</span>
                          </div>
                          {!loggedInUser && (
                            <>
                              <div className="flex justify-between items-start">
                                <span className="text-gray-600 font-medium">Booked By:</span>
                                <span className="text-gray-800 font-semibold text-right ml-2">{bookingState.booking.guest_name}</span>
                              </div>
                              <div className="flex justify-between items-start">
                                <span className="text-gray-600 font-medium">Phone:</span>
                                <span className="text-gray-800 font-semibold text-right ml-2">{bookingState.booking.guest_phone}</span>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Important Information */}
                    <div className="bg-linear-to-r from-yellow-50 to-orange-50 rounded-2xl p-6 mb-8 border border-yellow-200" >
                      <h3 className="text-lg font-bold text-yellow-800 mb-4 flex items-center">
                        <span className="text-2xl mr-2">📋</span>
                        Important Information
                      </h3>
                      <div className="space-y-3 text-sm text-yellow-800">
                        <div className="flex items-start">
                          <span className="text-lg mr-3 mt-0.5">🕒</span>
                          <div>
                            <strong>Reminder:</strong> Please arrive 15 minutes before your booking time.
                            {!loggedInUser && booking.tracking_code && (
                              <span> Use your tracking code to manage your booking.</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-start">
                          <span className="text-lg mr-3 mt-0.5">⚠️</span>
                          <div>
                            <strong>Cancellation Policy:</strong> Non-refundable. Free cancellation allowed up to 2 hours before play.
                          </div>
                        </div>
                        <div className="flex items-start">
                          <span className="text-lg mr-3 mt-0.5">👤🔄</span>
                          <div>
                            <strong>Account Benefit:</strong> Create an account to reschedule bookings and make multiple bookings easily.
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Thank You Message */}
                    <div className="text-center bg-linear-to-r from-green-500 to-green-600 rounded-2xl p-6 text-white">
                      <div className="text-4xl mb-4">😊</div>
                      <h3 className="text-xl md:text-2xl font-bold mb-2">Thank You!</h3>
                      <p className="text-green-100">
                        Thank you for choosing <span className="font-bold text-white">{bookingState.booking.futsal_name}</span>!
                        <br />
                        We wish you an amazing futsal experience!
                      </p>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="bg-gray-50 px-6 md:px-8 py-4 border-t border-gray-200">
                    <div className="text-center text-sm text-gray-600">
                      <p>Experience the future of sports booking • BookMyFutsal © 2026</p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-8 flex flex-wrap gap-4 justify-center png-hide">
                  <button
                    onClick={() => downloadAsImage('png')}
                    className="bg-linear-to-r from-blue-500 to-blue-600 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 border border-blue-400/30"
                  >
                    <span className="flex items-center">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Download Receipt
                    </span>
                  </button>

                  <button
                    onClick={() => {
                      setConfirmModal({
                        isOpen: true,
                        message: 'Are you sure you want to cancel this booking?',
                        onConfirm: async () => {
                          setConfirmModal({ isOpen: false, message: '', onConfirm: () => { } });
                          if (bookingState.booking) {
                            try {
                              await fetch(
                                `${process.env.NEXT_PUBLIC_API_URL}/api/bookings/cancel/${bookingState.booking.tracking_code}`,
                                {
                                  method: "DELETE",
                                }
                              );
                              showNotification({ message: "Booking cancelled Successfully", type: 'info' });
                              localStorage.removeItem(storageKey);
                              router.push("/");
                            } catch (error) {
                              showNotification({ message: "Error cancelling booking", type: 'info' });
                            }
                          }
                        }
                      });
                    }}
                    className="bg-linear-to-r from-red-500 to-red-600 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 border border-red-400/30"
                  >
                    <span className="flex items-center">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Cancel Booking
                    </span>
                  </button>

                  <button
                    onClick={() => {
                      localStorage.removeItem(storageKey);
                      router.push("/");
                    }}
                    className="bg-linear-to-r from-green-500 to-green-600 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 border border-green-400/30"
                  >
                    <span className="flex items-center">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                      </svg>
                      Back to Home
                    </span>
                  </button>
                </div>
              </div>
            );
          })()}
        </div>
      </main>

      {/* Notification Modal */}
      {notification && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 ">
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
                  onClick={() => setConfirmModal({ isOpen: false, message: '', onConfirm: () => { } })}
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

      <PriceNotificationModal
        priceNotification={priceNotification}
        setPriceNotification={setPriceNotification}
      />

      {/* Footer */}
      <footer className="bg-linear-to-r from-gray-900 via-green-900 to-blue-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Mobile Footer Layout */}
          <div className="grid grid-cols-1 gap-8 mb-8 md:hidden">
            {/* Company Info - Full width on mobile */}
            <div className="-up">
              <h3 className="text-xl font-bold mb-2">BookMyFutsal</h3>
              <p className="text-gray-300 mb-4">Your ultimate destination for booking premium futsal venues. Experience the thrill of the game with top-quality facilities.</p>
              <div className="flex space-x-4">

                {/* Instagram */}
                <a
                  href="https://www.instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-300 hover:text-pink-500 transition-colors duration-300"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 1.366.062 2.633.343 3.608 1.318.975.975 1.256 2.242 1.318 3.608.058 1.266.07 1.646.07 4.84s-.012 3.574-.07 4.84c-.062 1.366-.343 2.633-1.318 3.608-.975.975-2.242 1.256-3.608 1.318-1.266.058-1.646.07-4.85.07s-3.584-.012-4.85-.07c-1.366-.062-2.633-.343-3.608-1.318-.975-.975-1.256-2.242-1.318-3.608-.058-1.266-.07-1.646-.07-4.84s.012-3.574.07-4.84c.062-1.366.343-2.633 1.318-3.608C4.517 2.576 5.784 2.295 7.15 2.233 8.416 2.175 8.796 2.163 12 2.163zm0 3.675a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zm0 10.162a3.999 3.999 0 1 1 0-7.998 3.999 3.999 0 0 1 0 7.998zm6.406-11.845a1.44 1.44 0 1 1-2.88 0 1.44 1.44 0 0 1 2.88 0z" />
                  </svg>
                </a>
                {/* Facebook */}
                <a
                  href="https://www.facebook.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-300 hover:text-blue-600 transition-colors duration-300"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M22.675 0h-21.35C.597 0 0 .597 0 1.326v21.348C0 23.403.597 24 1.326 24H12.82v-9.294H9.692V11.01h3.128V8.309c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.796.715-1.796 1.763v2.312h3.587l-.467 3.696h-3.12V24h6.116C23.403 24 24 23.403 24 22.674V1.326C24 .597 23.403 0 22.675 0z" />
                  </svg>
                </a>

                {/* YouTube */}
                <a
                  href="https://www.youtube.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-300 hover:text-red-600 transition-colors duration-300"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.376.505A3.016 3.016 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.376-.505a3.016 3.016 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                  </svg>
                </a>
              </div>
            </div>

            {/* Quick Links and Support - Two columns on mobile */}
            <div className="grid grid-cols-2 gap-8">
              {/* Quick Links */}
              <div className="-up delay-200">
                <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
                <ul className="space-y-2">
                  <li><Link href="/" className="text-gray-300 hover:text-white transition-colors duration-300">Venues</Link></li>
                  <li><Link href="/user/dashboard" className="text-gray-300 hover:text-white transition-colors duration-300">My Bookings</Link></li>
                  <li><Link href="/" className="text-gray-300 hover:text-white transition-colors duration-300">About</Link></li>
                  <li><Link href="/" className="text-gray-300 hover:text-white transition-colors duration-300">Contact</Link></li>

                </ul>
              </div>

              {/* Support */}
              <div className="-up delay-400">
                <h4 className="text-lg font-semibold mb-4">Support</h4>
                <ul className="space-y-2">
                  <li><a href="#" className="text-gray-300 hover:text-white transition-colors duration-300">Privacy Policy</a></li>
                  <li><a href="#" className="text-gray-300 hover:text-white transition-colors duration-300">Terms of Service</a></li>
                  <li><a href="#" className="text-gray-300 hover:text-white transition-colors duration-300">Support</a></li>
                  <li><a href="#" className="text-gray-300 hover:text-white transition-colors duration-300">Careers</a></li>
                </ul>
              </div>
            </div>

            {/* Newsletter - Full width on mobile */}
            <div className="-up delay-600">
              <h4 className="text-lg font-semibold mb-4">Stay Updated</h4>
              <p className="text-gray-300 mb-4">Subscribe to our newsletter for the latest updates and exclusive offers.</p>
              <div className="space-y-3">
                <input
                  type="email"
                  placeholder="Enter your email"
                  name="footeremail"
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                />
                <button className="w-full bg-linear-to-r from-green-500 to-green-600 text-white font-semibold py-2 px-4 rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-300 transform hover:scale-105">
                  Subscribe
                </button>
              </div>
            </div>
          </div>

          {/* Desktop Footer Layout */}
          <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
            {/* Company Info */}
            <div className="-up">
              <h3 className="text-xl font-bold mb-2">BookMyFutsal</h3>
              <p className="text-gray-300 mb-4">Your ultimate destination for booking premium futsal venues. Experience the thrill of the game with top-quality facilities.</p>
              <div className="flex space-x-4">

                {/* Instagram */}
                <a
                  href="https://www.instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-300 hover:text-pink-500 transition-colors duration-300"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 1.366.062 2.633.343 3.608 1.318.975.975 1.256 2.242 1.318 3.608.058 1.266.07 1.646.07 4.84s-.012 3.574-.07 4.84c-.062 1.366-.343 2.633-1.318 3.608-.975.975-2.242 1.256-3.608 1.318-1.266.058-1.646.07-4.85.07s-3.584-.012-4.85-.07c-1.366-.062-2.633-.343-3.608-1.318-.975-.975-1.256-2.242-1.318-3.608-.058-1.266-.07-1.646-.07-4.84s.012-3.574.07-4.84c.062-1.366.343-2.633 1.318-3.608C4.517 2.576 5.784 2.295 7.15 2.233 8.416 2.175 8.796 2.163 12 2.163zm0 3.675a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zm0 10.162a3.999 3.999 0 1 1 0-7.998 3.999 3.999 0 0 1 0 7.998zm6.406-11.845a1.44 1.44 0 1 1-2.88 0 1.44 1.44 0 0 1 2.88 0z" />
                  </svg>
                </a>
                {/* Facebook */}
                <a
                  href="https://www.facebook.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-300 hover:text-blue-600 transition-colors duration-300"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M22.675 0h-21.35C.597 0 0 .597 0 1.326v21.348C0 23.403.597 24 1.326 24H12.82v-9.294H9.692V11.01h3.128V8.309c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.796.715-1.796 1.763v2.312h3.587l-.467 3.696h-3.12V24h6.116C23.403 24 24 23.403 24 22.674V1.326C24 .597 23.403 0 22.675 0z" />
                  </svg>
                </a>

                {/* YouTube */}
                <a
                  href="https://www.youtube.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-300 hover:text-red-600 transition-colors duration-300"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.376.505A3.016 3.016 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.376-.505a3.016 3.016 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                  </svg>
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div className="-up delay-200">
              <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2">
                <li><Link href="/" className="text-gray-300 hover:text-white transition-colors duration-300">Venues</Link></li>
                <li><Link href="/user/dashboard" className="text-gray-300 hover:text-white transition-colors duration-300">My Bookings</Link></li>
                <li><Link href="/" className="text-gray-300 hover:text-white transition-colors duration-300">About</Link></li>
                <li><Link href="/" className="text-gray-300 hover:text-white transition-colors duration-300">Contact</Link></li>

              </ul>
            </div>

            {/* Support */}
            <div className="-up delay-400">
              <h4 className="text-lg font-semibold mb-4">Support</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-300 hover:text-white transition-colors duration-300">Privacy Policy</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white transition-colors duration-300">Terms of Service</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white transition-colors duration-300">Support</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white transition-colors duration-300">Careers</a></li>
              </ul>
            </div>

            {/* Newsletter */}
            <div className="-up delay-600">
              <h4 className="text-lg font-semibold mb-4">Stay Updated</h4>
              <p className="text-gray-300 mb-4">Subscribe to our newsletter for the latest updates and exclusive offers.</p>
              <div className="space-y-3">
                <input
                  type="email"
                  placeholder="Enter your email"
                  id="mainemail"
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                />
                <button className="w-full bg-linear-to-r from-green-500 to-green-600 text-white font-semibold py-2 px-4 rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-300 transform hover:scale-105">
                  Subscribe
                </button>
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div className="border-t border-gray-700 pt-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="text-center md:text-left">
                <h5 className="font-semibold mb-2">Contact Us</h5>
                <p className="text-gray-300 text-sm">📧 support@bookmyfutsal.com</p>
                <p className="text-gray-300 text-sm">📞 +977-123-456789</p>
              </div>
              <div className="text-center">
                <h5 className="font-semibold mb-2">Business Hours</h5>
                <p className="text-gray-300 text-sm">Mon - Sun: 6:00 AM - 11:00 PM</p>
                <p className="text-gray-300 text-sm">Emergency Support: 24/7</p>
              </div>
              <div className="text-center md:text-right">
                <h5 className="font-semibold mb-2">Follow Us</h5>
                <p className="text-gray-300 text-sm">Stay connected for updates</p>
                <p className="text-gray-300 text-sm">and exclusive offers</p>
              </div>
            </div>
            <div className="text-center border-t border-gray-700 pt-6">
              <p className="text-gray-400">&copy; 2026 BookMyFutsal. All rights reserved. Experience the future of sports booking.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
