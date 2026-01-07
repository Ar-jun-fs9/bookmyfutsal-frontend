import { useState, useEffect } from 'react';

interface EditBookingFormProps {
  booking: any;
  onUpdate: (data: any) => void;
  onCancel: () => void;
  setNotification: React.Dispatch<React.SetStateAction<{message: string, type: 'success' | 'info'} | null>>;
}

function formatTime(timeString: string): string {
  const [hours, minutes] = timeString.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
}

function formatTimeSlot(timeString: string): string {
  const [hours, minutes] = timeString.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  return `${displayHours}${period}`;
}

function formatTimeRange(timeRange: string): string {
  const [startTime, endTime] = timeRange.split('-');
  return `${formatTimeSlot(startTime)}-${formatTimeSlot(endTime)}`;
}

function categorizeBooking(booking: any): 'past' | 'today' | 'future' {
  const now = new Date();
  const matchDate = booking.formatted_date || booking.booking_date?.toString().split('T')[0];
  const timeSlot = booking.time_slot;

  if (!matchDate) {
    return 'past'; // Default to past if data is missing
  }

  // Get today's date string in YYYY-MM-DD format (local timezone)
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const matchDateStr = matchDate;

  // Compare date strings directly
  if (matchDateStr < todayStr) {
    return 'past'; // Match date is before today
  } else if (matchDateStr > todayStr) {
    return 'future'; // Match date is after today
  } else {
    // Match date is today - check the time
    if (!timeSlot) return 'past';

    // Parse the start time from time_slot (format: "HH:MM-HH:MM")
    const startTime = timeSlot.split('-')[0];
    const [hours, minutes] = startTime.split(':').map(Number);

    // Create a date object for today with the match start time
    const matchStartTime = new Date(today);
    matchStartTime.setHours(hours, minutes, 0, 0);

    return matchStartTime > now ? 'today' : 'past';
  }
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
}

export function EditBookingForm({ booking, onUpdate, onCancel, setNotification }: EditBookingFormProps) {
  const [step, setStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState(booking.booking_date?.split('T')[0] || '');
  const [selectedShift, setSelectedShift] = useState('');
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [selectedSlotId, setSelectedSlotId] = useState<number | null>(null);
  const [numberOfPlayers, setNumberOfPlayers] = useState(booking.number_of_players);
  const [teamName, setTeamName] = useState(booking.team_name || '');
  const [loading, setLoading] = useState(false);

  // Get futsal_id from the booking
  const futsalId = booking.futsal_id;

  const handleDateSubmit = () => {
    if (selectedDate) {
      setStep(2);
      setSelectedShift(''); // Reset shift when date changes
      setAvailableSlots([]);
      setSelectedSlotId(null);
    }
  };

  const handleShiftSubmit = async () => {
    if (selectedShift && selectedDate && futsalId) {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/time-slots/futsal/${futsalId}/date/${selectedDate}/shift/${selectedShift}`);
        if (response.ok) {
          const data = await response.json();
          setAvailableSlots(data.slots);
          setStep(3);
        }
      } catch (error) {
        console.error('Error fetching slots:', error);
      }
    }
  };

  const handleFinalSubmit = async () => {
    if (!selectedSlotId) return;

    setLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/bookings/${booking.booking_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slot_id: selectedSlotId,
          number_of_players: numberOfPlayers,
          team_name: teamName
        }),
      });

      if (response.ok) {
        onUpdate({ selectedDate, selectedSlotId, numberOfPlayers, teamName });
        setNotification({ message: "Booking updated successfully", type: 'success' });
      } else {
        setNotification({ message: "Error updating booking", type: 'info' });
      }
    } catch (error) {
      console.error('Error:', error);
      setNotification({ message: "Error updating booking", type: 'info' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-green-50 via-white to-blue-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-linear-to-r from-gray-900 via-green-900 to-blue-900 backdrop-blur-md shadow-2xl border-b border-green-500/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            {/* Logo */}
            <div onClick={() => document.getElementById('hero')?.scrollIntoView({ behavior: 'smooth' })} className="flex items-center space-x-3 cursor-pointer">
              <div className="relative">
                <img src="/logo/logo.png" alt="BookMyFutsal" className="h-12 w-12 rounded-lg shadow-lg ring-2 ring-green-400/50" />
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-lg animate-pulse"></div>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-white drop-shadow-lg">
                <span className="bg-linear-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">BookMy</span>
                <span className="text-white">Futsal</span>
              </h1>
            </div>

            {/* Welcome Message */}
            <div className="hidden md:flex items-center space-x-4">
              <div className="text-white">
                <p className="text-sm opacity-90">Super Admin Dashboard</p>
                <p className="font-semibold text-center ">Edit Booking</p>
              </div>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={onCancel}
              className="md:hidden p-2 rounded-lg text-gray-200 hover:text-green-400 hover:bg-green-900/50 transition-all duration-300 border border-gray-600/30"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
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
                  <span>Step {step} of 3</span>
                  <span>{Math.round((step / 3) * 100)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-lg h-3">
                  <div
                    className="bg-linear-to-r from-green-500 to-green-600 h-3 rounded-lg transition-all duration-300"
                    style={{ width: `${(step / 3) * 100}%` }}
                  ></div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-1 text-xs text-center">
                <span className={step >= 1 ? 'text-green-600 font-semibold' : 'text-gray-400'}>Date</span>
                <span className={step >= 2 ? 'text-green-600 font-semibold' : 'text-gray-400'}>Shift</span>
                <span className={step >= 3 ? 'text-green-600 font-semibold' : 'text-gray-400'}>Slot</span>
              </div>
            </div>
          </div>
          {/* Desktop: Horizontal */}
          <div className="hidden sm:flex sm:flex-row items-center space-x-4">
            <div className="flex items-center">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-lg ${
                step >= 1 ? 'bg-linear-to-r from-green-500 to-green-600' : 'bg-gray-300'
              }`}>
                {step > 1 ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  1
                )}
              </div>
              <span className={`ml-2 text-sm font-medium ${step >= 1 ? 'text-green-600' : 'text-gray-500'}`}>Date</span>
            </div>
            <div className={`w-8 h-0.5 ${step > 1 ? 'bg-linear-to-r from-green-500 to-green-600' : 'bg-gray-300'}`}></div>
            <div className="flex items-center">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-lg ${
                step >= 2 ? 'bg-linear-to-r from-green-500 to-green-600' : 'bg-gray-300'
              }`}>
                {step > 2 ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : step === 2 ? (
                  2
                ) : (
                  <span className="text-gray-500">2</span>
                )}
              </div>
              <span className={`ml-2 text-sm font-medium ${step >= 2 ? 'text-green-600' : 'text-gray-500'}`}>Shift</span>
            </div>
            <div className={`w-8 h-0.5 ${step > 2 ? 'bg-linear-to-r from-green-500 to-green-600' : 'bg-gray-300'}`}></div>
            <div className="flex items-center">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-lg ${
                step >= 3 ? 'bg-linear-to-r from-green-500 to-green-600' : 'bg-gray-300'
              }`}>
                {step > 3 ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : step === 3 ? (
                  3
                ) : (
                  <span className="text-gray-500">3</span>
                )}
              </div>
              <span className={`ml-2 text-sm font-medium ${step >= 3 ? 'text-green-600' : 'text-gray-500'}`}>Slot</span>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-2 sm:px-0">
          {/* Step 1: Select Date */}
          {step === 1 && (
            <div className="max-w-lg mx-auto">
              <div className="relative bg-white rounded-2xl shadow-2xl overflow-hidden transform transition-all duration-500 hover:scale-[1.02]">
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
                      <label htmlFor="bookingDate"  className="block text-sm font-semibold text-gray-700 mb-2">
                        📅 Booking Date
                      </label>
                      <div className="relative">
                        <input
                          type="date"
                          id="bookingDate"
                          value={selectedDate}
                          onChange={(e) => setSelectedDate(e.target.value)}
                          min={new Date().toISOString().split("T")[0]}
                          required
                          className="w-full px-4 py-2.5 pl-9 bg-white border border-gray-200 rounded-lg text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400/50 focus:border-green-400/50 transition-all duration-300 font-medium text-sm"
                        />
                        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-500">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4 pt-4">
                      <button
                        onClick={onCancel}
                        className="flex-1 order-2 sm:order-1 bg-linear-to-r from-gray-500 to-gray-600 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 border border-gray-400/30"
                      >
                        <span className="flex items-center justify-center">
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                          </svg>
                          Cancel
                        </span>
                      </button>
                      <button
                        onClick={handleDateSubmit}
                        disabled={!selectedDate}
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
          {step === 2 && (
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
                        Selected Date: <span className="font-bold">{selectedDate}</span>
                      </span>
                    </div>
                  </div>

                  {/* Shift Selection */}
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      {[
                        { name: "Morning", time: "6 AM - 10 AM" },
                        { name: "Day", time: "10 AM - 2 PM" },
                        { name: "Evening", time: "2 PM - 6 PM" },
                        { name: "Night", time: "6 PM - 11 PM" }
                      ].map((shift) => (
                        <button
                          key={shift.name}
                           onClick={() => {
                            const newShift = selectedShift === shift.name ? '' : shift.name;
                            setSelectedShift(newShift);
                          }}
                          className={`relative p-6 border-2 rounded-xl transition-all duration-300 transform hover:scale-105 ${
                            selectedShift === shift.name
                              ? "bg-linear-to-br from-green-500 to-green-600 border-green-500 text-white shadow-lg"
                              : "bg-white border-gray-200 hover:border-green-300 hover:shadow-md"
                          }`}
                        >
                          {selectedShift === shift.name && (
                            <div className="absolute top-2 right-2 w-6 h-6 bg-white rounded-full flex items-center justify-center">
                              <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          )}
                          <div className={`font-bold text-lg mb-1 ${selectedShift === shift.name ? 'text-white' : 'text-gray-800'}`}>
                            {shift.name}
                          </div>
                          <div className={`text-sm ${selectedShift === shift.name ? 'text-green-100' : 'text-gray-600'}`}>
                            {shift.time}
                          </div>
                        </button>
                      ))}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4 pt-4">
                      <button
                        onClick={() => setStep(1)}
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
                        disabled={!selectedShift}
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
          {step === 3 && (
            <div className="w-full max-w-4xl mx-auto">
              <div className="relative bg-white rounded-2xl shadow-2xl overflow-hidden transform transition-all duration-500 hover:scale-[1.02]">
                {/* Gradient Background */}
                <div className="absolute inset-0 bg-linear-to-br from-green-50 via-white to-blue-50 opacity-50"></div>

                {/* Content */}
                <div className="relative p-8">
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
                  </div>

                  {/* Date and Shift Info */}
                  <div className="bg-linear-to-r from-green-100 to-blue-100 rounded-xl p-4 mb-6 border border-green-200">
                    <div className="flex items-center justify-center space-x-6">
                      <div className="flex items-center">
                        <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="text-sm font-medium text-green-800">
                          Date: <span className="font-bold">{selectedDate}</span>
                        </span>
                      </div>
                      <div className="w-px h-6 bg-green-300"></div>
                      <div className="flex items-center">
                        <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                        <span className="text-sm font-medium text-green-800">
                          Shift: <span className="font-bold">{selectedShift}</span>
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
                            onClick={() => slot.display_status === 'available' && setSelectedSlotId(slot.slot_id)}
                            disabled={
                              (slot.display_status === "booked" ||
                              slot.display_status === "expired" ||
                              slot.status === "disabled") && !selectedSlotId === slot.slot_id
                            }
                            className={`relative p-4 border-2 rounded-xl text-center transition-all duration-300 transform hover:scale-105 ${
                              selectedSlotId === slot.slot_id
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
                            {selectedSlotId === slot.slot_id && (
                              <div className="absolute top-1 right-2 w-4 h-4 bg-white rounded-lg flex items-center justify-center shadow-sm">
                                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              </div>
                            )}
                            <div className={`font-bold text-sm mb-1 ${
                              selectedSlotId === slot.slot_id ? 'text-white' :
                              slot.display_status === "booked" ? 'text-red-600' :
                              slot.display_status === "expired" ? 'text-yellow-600' :
                              slot.status === "disabled" ? 'text-gray-600' :
                              slot.status === "pending" ? 'text-gray-800' :
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
                            <div className={`text-sm ${
                              selectedSlotId === slot.slot_id ? 'text-white' :
                              slot.display_status === "booked" ? 'text-red-500' :
                              slot.display_status === "expired" ? 'text-yellow-500' :
                              slot.status === "disabled" ? 'text-gray-500' :
                              slot.status === "pending" ? 'text-orange-500' :
                              'text-gray-600'
                            }`}>
                              {selectedSlotId === slot.slot_id
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
                  {selectedSlotId && (
                    <div className="border-t border-gray-200 pt-8">
                      <div className="text-center mb-6">
                        <h3 className="text-xl font-bold text-gray-800 mb-2">Enter Your Details</h3>
                        <p className="text-gray-600 text-sm">Complete your booking information</p>
                      </div>

                      <form onSubmit={(e) => { e.preventDefault(); handleFinalSubmit(); }} className="space-y-6">
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
                                value={numberOfPlayers}
                                onChange={(e) => setNumberOfPlayers(Number(e.target.value))}
                                min="1"
                                max="10"
                                required
                                className="w-full px-4 py-3 pl-12 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all duration-300 text-gray-700 font-medium"
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
                                value={teamName}
                                onChange={(e) => setTeamName(e.target.value)}
                                className="w-full px-4 py-3 pl-12 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all duration-300 text-gray-700 font-medium"
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
                            onClick={() => setStep(2)}
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
                            disabled={loading}
                            className="flex-1 order-1 sm:order-2 bg-linear-to-r from-green-500 to-green-600 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none border border-green-400/30"
                          >
                            <span className="flex items-center justify-center">
                              {loading ? (
                                <>
                                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                  Updating Booking...
                                </>
                              ) : (
                                <>
                                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                  Update Booking
                                </>
                              )}
                            </span>
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  {/* Back Button when no slot selected */}
                  {!selectedSlotId && availableSlots.length > 0 && (
                    <div className="flex justify-center pt-6">
                      <button
                        onClick={() => setStep(2)}
                        className="bg-linear-to-r from-gray-500 to-gray-600 text-white font-semibold py-3 px-8 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 border border-gray-400/30"
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
        </div>
      </main>
    </div>
  );
}