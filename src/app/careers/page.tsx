'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function CareersPage() {
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
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Join Our Team</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Be part of revolutionizing the futsal booking industry. We're looking for passionate individuals to join our growing team.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Why Join Us */}
        <div className="bg-white rounded-2xl  p-8 mb-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold bg-linear-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-4">
              Why Join BookMyFutsal?
            </h2>
            <p className="text-gray-600 text-lg max-w-3xl mx-auto">
              We're building the future of sports booking in Nepal. Join a dynamic team that's passionate about sports, technology, and customer experience.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-2xl">🚀</span>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Innovation</h3>
              <p className="text-gray-600">Work on cutting-edge technology in the sports and booking industry</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-2xl">⚽</span>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Sports Passion</h3>
              <p className="text-gray-600">Combine your love for sports with technology and business</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-2xl">🌱</span>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Growth</h3>
              <p className="text-gray-600">Fast-growing startup with opportunities for rapid career advancement</p>
            </div>
          </div>
        </div>

        {/* Career Development */}
        <div className="bg-white rounded-2xl  p-8 mb-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold bg-linear-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-4">
              Career Development
            </h2>
            <p className="text-gray-600 text-lg max-w-3xl mx-auto">
              We invest in our team's growth through continuous learning, mentorship programs, and opportunities to take on challenging projects.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-2xl">📚</span>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Learning & Development</h3>
              <p className="text-gray-600">Access to online courses, conferences, and workshops to keep your skills sharp</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-2xl">🎯</span>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Mentorship Program</h3>
              <p className="text-gray-600">One-on-one mentorship with experienced leaders in your field</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-2xl">🚀</span>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Career Progression</h3>
              <p className="text-gray-600">Clear career paths with regular performance reviews and growth opportunities</p>
            </div>
          </div>
        </div>

        {/* Work Environment */}
        <div className="bg-linear-to-r from-green-50 to-blue-50 rounded-2xl p-8 mb-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Our Work Environment</h2>
            <p className="text-gray-600 text-lg max-w-3xl mx-auto">
              We believe in creating a positive and inclusive workplace where everyone can thrive and contribute their best.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white rounded-lg p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Flexible Work Culture</h3>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  Remote work options available
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  Flexible working hours
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  Work-life balance focus
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  Unlimited paid time off
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-lg p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Employee Benefits</h3>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  Health insurance coverage
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  Professional development budget
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  Team building activities
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  Modern equipment and tools
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Company Culture */}
        <div className="bg-white rounded-2xl  p-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold bg-linear-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-4">
              Our Culture
            </h2>
            <p className="text-gray-600 text-lg">
              We believe in work-life balance, continuous learning, and having fun while building something amazing.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg mx-auto mb-3 flex items-center justify-center">
                <span className="text-xl">⚽</span>
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">Sports Lovers</h3>
              <p className="text-sm text-gray-600">We love sports and understand our users</p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg mx-auto mb-3 flex items-center justify-center">
                <span className="text-xl">🚀</span>
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">Innovation</h3>
              <p className="text-sm text-gray-600">Always looking for better solutions</p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg mx-auto mb-3 flex items-center justify-center">
                <span className="text-xl">🤝</span>
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">Team Work</h3>
              <p className="text-sm text-gray-600">Collaboration is key to our success</p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-orange-100 rounded-lg mx-auto mb-3 flex items-center justify-center">
                <span className="text-xl">📈</span>
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">Growth</h3>
              <p className="text-sm text-gray-600">Continuous learning and development</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}