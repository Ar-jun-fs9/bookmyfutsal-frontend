'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function BookingsPage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-linear-to-br from-green-50 via-white to-blue-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-linear-to-r from-gray-900 via-green-900 to-blue-900 backdrop-blur-md shadow-2xl border-b border-green-500/20">
        <div className="max-w-7xl mx-auto px-1 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4 px-2">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-3 cursor-pointer">
              <div className="relative">
                <img src="/logo/logo.png" alt="BookMyFutsal" className="h-12 w-12 rounded-lg bg-green-900 shadow-lg ring-2 ring-white" />
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-white rounded-lg animate-pulse"></div>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-white drop-shadow-lg">
                <span className="bg-linear-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">BookMy</span>
                <span className="text-white">Futsal</span>
              </h1>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <Link href="/" className="text-gray-200 hover:text-green-400 font-semibold transition-all duration-300 hover:scale-105 relative group">
                Home
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-green-400 transition-all duration-300 group-hover:w-full"></span>
              </Link>
              <Link href="/venues" className="text-gray-200 hover:text-green-400 font-semibold transition-all duration-300 hover:scale-105 relative group">
                Venues
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-green-400 transition-all duration-300 group-hover:w-full"></span>
              </Link>
              <Link href="/bookings" className="text-gray-200 hover:text-green-400 font-semibold transition-all duration-300 hover:scale-105 relative group">
                Bookings
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-green-400 transition-all duration-300 group-hover:w-full"></span>
              </Link>
              <Link href="/about" className="text-gray-200 hover:text-green-400 font-semibold transition-all duration-300 hover:scale-105 relative group">
                About
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-green-400 transition-all duration-300 group-hover:w-full"></span>
              </Link>
              <Link href="/contact" className="text-gray-200 hover:text-green-400 font-semibold transition-all duration-300 hover:scale-105 relative group">
                Contact
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-green-400 transition-all duration-300 group-hover:w-full"></span>
              </Link>
            </nav>

            {/* Auth Buttons */}
            <div className="hidden md:flex items-center space-x-4">
              <Link
                href="/user/login"
                className="px-6 py-2 bg-linear-to-r from-blue-600 to-blue-700 text-white font-bold rounded-lg shadow-lg hover: transform hover:scale-105 transition-all duration-300 border border-blue-500/30 hover:border-blue-400/50"
              >
                Login
              </Link>
              <Link
                href="/user/register"
                className="px-6 py-2 bg-linear-to-r from-green-600 to-green-700 text-white font-bold rounded-lg shadow-lg hover: transform hover:scale-105 transition-all duration-300 border border-green-500/30 hover:border-green-400/50"
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
            <div className="md:hidden border-t border-green-500/20 py-4 px-2 bg-linear-to-b from-gray-900/95 to-green-900/95 backdrop-blur-md">
              <nav className="flex flex-col space-y-4">
                <Link href="/" onClick={() => setIsMobileMenuOpen(false)} className="text-gray-200 hover:text-green-400 font-semibold transition-all duration-300 px-3 py-2 rounded-lg hover:bg-green-900/50">Home</Link>
                <Link href="/venues" onClick={() => setIsMobileMenuOpen(false)} className="text-gray-200 hover:text-green-400 font-semibold transition-all duration-300 px-3 py-2 rounded-lg hover:bg-green-900/50">Venues</Link>
                <Link href="/bookings" onClick={() => setIsMobileMenuOpen(false)} className="text-gray-200 hover:text-green-400 font-semibold transition-all duration-300 px-3 py-2 rounded-lg hover:bg-green-900/50">Bookings</Link>
                <Link href="/about" onClick={() => setIsMobileMenuOpen(false)} className="text-gray-200 hover:text-green-400 font-semibold transition-all duration-300 px-3 py-2 rounded-lg hover:bg-green-900/50">About</Link>
                <Link href="/contact" onClick={() => setIsMobileMenuOpen(false)} className="text-gray-200 hover:text-green-400 font-semibold transition-all duration-300 px-3 py-2 rounded-lg hover:bg-green-900/50">Contact</Link>

                <div className="flex flex-row space-x-3 pt-4 border-t border-green-500/20">
                  <Link
                    href="/user/login"
                    className="flex-1 px-4 py-3 bg-linear-to-r from-blue-600 to-blue-700 text-white font-bold rounded-lg text-center shadow-lg hover: transform hover:scale-105 transition-all duration-300 border border-blue-500/30"
                  >
                    Login
                  </Link>
                  <Link
                    href="/user/register"
                    className="flex-1 px-4 py-3 bg-linear-to-r from-green-600 to-green-700 text-white font-bold rounded-lg text-center shadow-lg hover: transform hover:scale-105 transition-all duration-300 border border-green-500/30"
                  >
                    Sign Up
                  </Link>
                </div>
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* Page Header */}
      {/* <div className="bg-linear-to-r from-green-600 to-blue-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Book Your Futsal Venue</h1>
          <p className="text-xl text-green-100 max-w-3xl mx-auto">
            Ready to play? Start your booking journey and secure the perfect futsal venue for your game.
          </p>
        </div>
      </div> */}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Booking Process */}
        <div className="rounded-2xl  p-8 mb-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold bg-linear-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-4">
              How Booking Works
            </h2>
            <p className="text-gray-600 text-lg max-w-3xl mx-auto">
              Get started with your futsal booking in just a few simple steps. Our streamlined process ensures a smooth experience from start to finish.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-2xl text-white font-bold">1</span>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Choose Venue</h3>
              <p className="text-gray-600">Browse and select from our wide range of premium futsal venues</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-blue-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-2xl text-white font-bold">2</span>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Select Time Slot</h3>
              <p className="text-gray-600">Pick your preferred date and time from available slots</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-purple-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-2xl text-white font-bold">3</span>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Confirm Details</h3>
              <p className="text-gray-600">Review your booking details and complete payment</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-orange-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-2xl text-white font-bold">4</span>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Play & Enjoy</h3>
              <p className="text-gray-600">Arrive at the venue and enjoy your game!</p>
            </div>
          </div>
        </div>

        {/* Booking Benefits */}
        <div className="bg-linear-to-r rounded-2xl p-8 mb-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Why Book With Us?</h2>
            <p className="text-gray-600 text-lg max-w-3xl mx-auto">
              Experience the convenience and reliability of our advanced booking system designed for futsal enthusiasts.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg p-6">
              <div className="w-12 h-12 bg-green-500 rounded-lg mb-4 flex items-center justify-center">
                <span className="text-xl text-white">⚡</span>
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">Instant Booking</h3>
              <p className="text-gray-600">Book your venue instantly with real-time availability and instant confirmation</p>
            </div>

            <div className="bg-white rounded-lg p-6">
              <div className="w-12 h-12 bg-blue-500 rounded-lg mb-4 flex items-center justify-center">
                <span className="text-xl text-white">💳</span>
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">Secure Payments</h3>
              <p className="text-gray-600">Multiple payment options with bank-grade security and encrypted transactions</p>
            </div>

            <div className="bg-white rounded-lg p-6">
              <div className="w-12 h-12 bg-purple-500 rounded-lg mb-4 flex items-center justify-center">
                <span className="text-xl text-white">📱</span>
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">Mobile Friendly</h3>
              <p className="text-gray-600">Book from anywhere using our responsive mobile app and website</p>
            </div>

            <div className="bg-white rounded-lg p-6">
              <div className="w-12 h-12 bg-orange-500 rounded-lg mb-4 flex items-center justify-center">
                <span className="text-xl text-white">🎫</span>
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">Flexible Cancellation</h3>
              <p className="text-gray-600">Free cancellation up to 24 hours before your booking time</p>
            </div>

            <div className="bg-white rounded-lg p-6">
              <div className="w-12 h-12 bg-red-500 rounded-lg mb-4 flex items-center justify-center">
                <span className="text-xl text-white">⭐</span>
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">Verified Venues</h3>
              <p className="text-gray-600">All venues are verified and regularly inspected for quality standards</p>
            </div>

            <div className="bg-white rounded-lg p-6">
              <div className="w-12 h-12 bg-teal-500 rounded-lg mb-4 flex items-center justify-center">
                <span className="text-xl text-white">🔔</span>
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">Booking Reminders</h3>
              <p className="text-gray-600">Get SMS and email reminders before your booking time</p>
            </div>
          </div>
        </div>

        {/* Booking FAQ */}
        <div className="bg-white rounded-2xl  p-8 mb-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold bg-linear-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-gray-600 text-lg">
              Common questions about booking and using our platform
            </p>
          </div>

          <div className="space-y-6">
            <div className="border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-2">How far in advance can I book a venue?</h3>
              <p className="text-gray-600">You can book venues up to 30 days in advance, depending on venue availability and policies.</p>
            </div>

            <div className="border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-2">What payment methods do you accept?</h3>
              <p className="text-gray-600">We accept credit/debit cards, bank transfers, mobile wallets (Khalti, eSewa), and cash payments at venue.</p>
            </div>

            <div className="border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-2">Can I modify or cancel my booking?</h3>
              <p className="text-gray-600">Yes, you can modify bookings up to 24 hours before the start time. Cancellation policies vary by venue.</p>
            </div>

            <div className="border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-2">What if the venue is unavailable due to unforeseen circumstances?</h3>
              <p className="text-gray-600">We offer full refunds or alternative venue options if a booking cannot be honored due to venue issues.</p>
            </div>
          </div>
        </div>

        {/* Sign In Section */}
        <div className="bg-white rounded-2xl  p-8 text-center">
          <div className="max-w-2xl mx-auto">
            <div className="w-24 h-24 bg-green-100 rounded-full mx-auto mb-6 flex items-center justify-center">
              <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>

            <h2 className="text-3xl font-bold text-gray-800 mb-4">Start Your Booking</h2>
            <p className="text-gray-600 text-lg mb-8">
              Sign in or create an account to manage your bookings.
              Or browse venues without an account.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/user/login"
                className="bg-linear-to-r from-green-500 to-green-600 text-white font-semibold py-3 px-8 rounded-lg shadow-lg hover: transform hover:scale-105 transition-all duration-300 text-center"
              >
                Sign In to View Bookings
              </Link>
              <Link
                href="/venues"
                className="bg-white border-2 border-green-500 text-green-600 font-semibold py-3 px-8 rounded-lg shadow-lg hover: transform hover:scale-105 transition-all duration-300 text-center"
              >
                Browse Venues
              </Link>
            </div>

            <div className="mt-8 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Don't have an account?</h3>
              <p className="text-gray-600 mb-4">
                Creating an account is quick and easy. You'll be able to track, update your bookings, manage payments,
                and get exclusive access to special offers.
              </p>
              <Link
                href="/user/register"
                className="inline-block bg-linear-to-r from-blue-500 to-blue-600 text-white font-semibold py-2 px-6 rounded-lg shadow-lg hover: transform hover:scale-105 transition-all duration-300"
              >
                Create Account
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}