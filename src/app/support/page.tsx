'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function SupportPage() {
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
                <Link href="/" className="text-gray-200 hover:text-green-400 font-semibold transition-all duration-300 px-3 py-2 rounded-lg hover:bg-green-900/50">Home</Link>
                <Link href="/venues" className="text-gray-200 hover:text-green-400 font-semibold transition-all duration-300 px-3 py-2 rounded-lg hover:bg-green-900/50">Venues</Link>
                <Link href="/bookings" className="text-gray-200 hover:text-green-400 font-semibold transition-all duration-300 px-3 py-2 rounded-lg hover:bg-green-900/50">Bookings</Link>
                <Link href="/about" className="text-gray-200 hover:text-green-400 font-semibold transition-all duration-300 px-3 py-2 rounded-lg hover:bg-green-900/50">About</Link>
                <Link href="/contact" className="text-gray-200 hover:text-green-400 font-semibold transition-all duration-300 px-3 py-2 rounded-lg hover:bg-green-900/50">Contact</Link>

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
      <div className="bg-linear-to-r from-green-600 to-blue-600 bg-clip-text text-transparent py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Support Center</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Get help with your bookings, account, and any questions you might have.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* FAQ Section */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl  p-8">
              <h2 className="text-3xl font-bold text-gray-800 mb-6">Frequently Asked Questions</h2>

              <div className="space-y-4">
                <div className="border-b border-gray-200 pb-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">How do I make a booking?</h3>
                  <p className="text-gray-600">Sign up for an account, browse available venues, select your preferred date and time, and complete the payment process.</p>
                </div>

                <div className="border-b border-gray-200 pb-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">What is the cancellation policy?</h3>
                  <p className="text-gray-600">Cancellations made more than 2 hours before your booking time receive a full refund. Cancellations within 2 hours are non-refundable.</p>
                </div>

                <div className="border-b border-gray-200 pb-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">How do I modify my booking?</h3>
                  <p className="text-gray-600">You can modify your booking up to 2 times through your dashboard. Changes must be made at least 2 hours before the booking time.</p>
                </div>

                <div className="border-b border-gray-200 pb-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">What payment methods do you accept?</h3>
                  <p className="text-gray-600">We accept payments through eSewa and other secure digital payment methods available in Nepal.</p>
                </div>

                <div className="border-b border-gray-200 pb-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">How do I contact venue operators?</h3>
                  <p className="text-gray-600">Venue contact information is available on each venue's detail page. You can also reach them through the platform messaging system.</p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">What if I have a problem with my booking?</h3>
                  <p className="text-gray-600">Contact our support team immediately at bookmyfutsal@gmail.com or call +977-123-456789. We'll help resolve any issues.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Support */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl  p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Contact Support</h2>

              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">Email Support</p>
                    <p className="text-gray-600">bookmyfutsal@gmail.com</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">Phone Support</p>
                    <p className="text-gray-600">+977-123-456789</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">Business Hours</p>
                    <p className="text-gray-600">24/7 Emergency Support</p>
                    <p className="text-gray-600">6 AM - 11 PM General</p>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <Link
                  href="/contact"
                  className="w-full bg-linear-to-r from-green-500 to-green-600 text-white font-semibold py-3 px-6 rounded-lg shadow-lg hover: transform hover:scale-105 transition-all duration-300 text-center block"
                >
                  Contact Us
                </Link>
              </div>
            </div>

            {/* Quick Links */}
            <div className="bg-white rounded-2xl  p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Quick Links</h2>

              <div className="space-y-3">
                <Link href="/privacy-policy" className="block text-gray-600 hover:text-green-600 transition-colors">
                  Privacy Policy
                </Link>
                <Link href="/terms-of-service" className="block text-gray-600 hover:text-green-600 transition-colors">
                  Terms of Service
                </Link>
                <Link href="/about" className="block text-gray-600 hover:text-green-600 transition-colors">
                  About Us
                </Link>
                <Link href="/contact" className="block text-gray-600 hover:text-green-600 transition-colors">
                  Contact Information
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}