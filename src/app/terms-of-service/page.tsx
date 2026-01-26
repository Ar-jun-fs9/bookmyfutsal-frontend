'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function TermsOfServicePage() {
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
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Terms of Service</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Please read these terms carefully before using our futsal booking platform.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl  p-8">
          <div className="prose prose-lg max-w-none">
            <p className="text-sm text-gray-500 mb-8">Last updated: January 23, 2026</p>

            <h2 className="text-2xl font-bold text-gray-800 mb-4">1. Acceptance of Terms</h2>
            <p className="text-gray-700 mb-6">
              By accessing and using BookMyFutsal ("the Platform"), you accept and agree to be bound by the terms and provision of this agreement.
              If you do not agree to abide by the above, please do not use this service.
            </p>

            <h2 className="text-2xl font-bold text-gray-800 mb-4">2. Description of Service</h2>
            <p className="text-gray-700 mb-6">
              BookMyFutsal is an online platform that connects users with futsal venue operators. We provide booking services, payment processing,
              and related support services to facilitate futsal venue reservations.
            </p>

            <h2 className="text-2xl font-bold text-gray-800 mb-4">3. User Accounts</h2>

            <h3 className="text-xl font-semibold text-gray-800 mb-3">Registration</h3>
            <p className="text-gray-700 mb-4">To use certain features of the Platform, you must register for an account. You agree to:</p>
            <ul className="list-disc list-inside text-gray-700 mb-6 space-y-2">
              <li>Provide accurate and complete information during registration</li>
              <li>Maintain and update your information to keep it accurate and current</li>
              <li>Keep your password secure and confidential</li>
              <li>Be responsible for all activities under your account</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-3">Account Termination</h3>
            <p className="text-gray-700 mb-6">
              We reserve the right to terminate or suspend your account at our discretion, with or without notice, for conduct that violates these terms.
            </p>

            <h2 className="text-2xl font-bold text-gray-800 mb-4">4. Booking Terms</h2>

            <h3 className="text-xl font-semibold text-gray-800 mb-3">Booking Process</h3>
            <p className="text-gray-700 mb-4">When making a booking:</p>
            <ul className="list-disc list-inside text-gray-700 mb-6 space-y-2">
              <li>You agree to pay the full amount for the booking</li>
              <li>You confirm you have the authority to make the booking</li>
              <li>You understand that bookings are subject to venue availability</li>
              <li>You acknowledge that prices may change based on special offers</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-3">Cancellation Policy</h3>
            <p className="text-gray-700 mb-4">Booking cancellations are subject to the following terms:</p>
            <ul className="list-disc list-inside text-gray-700 mb-6 space-y-2">
              <li>Cancellations made more than 2 hours before booking time: Full refund</li>
              <li>Cancellations made less than 2 hours before booking time: No refund</li>
              <li>No-shows will result in forfeiture of payment</li>
              <li>Venue operators may have additional cancellation policies</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-3">Booking Modifications</h3>
            <p className="text-gray-700 mb-6">
              You may modify your booking up to 2 times. Modifications made less than 2 hours before the booking time may not be permitted.
              Additional modification requests may incur fees.
            </p>

            <h2 className="text-2xl font-bold text-gray-800 mb-4">5. Payment Terms</h2>

            <h3 className="text-xl font-semibold text-gray-800 mb-3">Payment Processing</h3>
            <p className="text-gray-700 mb-4">Payment terms include:</p>
            <ul className="list-disc list-inside text-gray-700 mb-6 space-y-2">
              <li>Advance payment of Rs. 100 per slot is required to confirm booking</li>
              <li>Full payment is due at the time of booking</li>
              <li>All payments are processed through secure third-party providers</li>
              <li>Refunds are processed according to our cancellation policy</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-3">Pricing</h3>
            <p className="text-gray-700 mb-6">
              All prices displayed are in Nepalese Rupees (NPR) and are subject to change. Special pricing may apply for certain dates, times, or promotions.
              The final price will be confirmed at the time of booking.
            </p>

            <h2 className="text-2xl font-bold text-gray-800 mb-4">6. User Conduct</h2>
            <p className="text-gray-700 mb-4">You agree not to:</p>
            <ul className="list-disc list-inside text-gray-700 mb-6 space-y-2">
              <li>Use the Platform for any unlawful purpose</li>
              <li>Impersonate any person or entity</li>
              <li>Interfere with the Platform's operations</li>
              <li>Upload harmful or malicious content</li>
              <li>Violate any applicable laws or regulations</li>
              <li>Harass or abuse other users or venue operators</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-800 mb-4">7. Venue Operator Terms</h2>
            <p className="text-gray-700 mb-4">Venue operators using our platform agree to:</p>
            <ul className="list-disc list-inside text-gray-700 mb-6 space-y-2">
              <li>Maintain accurate venue information and availability</li>
              <li>Provide venues that meet safety and quality standards</li>
              <li>Honor confirmed bookings</li>
              <li>Respond promptly to booking inquiries</li>
              <li>Maintain professional conduct with users</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-800 mb-4">8. Limitation of Liability</h2>
            <p className="text-gray-700 mb-6">
              BookMyFutsal shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the Platform.
              Our total liability shall not exceed the amount paid by you for the specific booking in question.
            </p>

            <h2 className="text-2xl font-bold text-gray-800 mb-4">9. Indemnification</h2>
            <p className="text-gray-700 mb-6">
              You agree to indemnify and hold BookMyFutsal harmless from any claims, damages, losses, or expenses arising from your use of the Platform
              or violation of these terms.
            </p>

            <h2 className="text-2xl font-bold text-gray-800 mb-4">10. Governing Law</h2>
            <p className="text-gray-700 mb-6">
              These terms shall be governed by and construed in accordance with the laws of Nepal. Any disputes shall be resolved in the courts of Nepal.
            </p>

            <h2 className="text-2xl font-bold text-gray-800 mb-4">11. Changes to Terms</h2>
            <p className="text-gray-700 mb-6">
              We reserve the right to modify these terms at any time. Changes will be effective immediately upon posting on the Platform.
              Continued use of the Platform constitutes acceptance of the modified terms.
            </p>

            <h2 className="text-2xl font-bold text-gray-800 mb-4">12. Contact Information</h2>
            <p className="text-gray-700 mb-4">
              If you have any questions about these Terms of Service, please contact us:
            </p>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-700"><strong>Email:</strong> legal@bookmyfutsal.com</p>
              <p className="text-gray-700"><strong>Phone:</strong> +977-123-456789</p>
              <p className="text-gray-700"><strong>Address:</strong> Kathmandu, Nepal</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}