'use client';

import Link from 'next/link';
import { useState } from 'react';
import dynamic from 'next/dynamic';

// Dynamic imports for code splitting
const TestimonialSection = dynamic(() => import('@/components/layout/TestimonialSection'), {
  loading: () => <div className="h-96 bg-gray-100 animate-pulse rounded-lg"></div>
});

const WhyChooseUs = dynamic(() => import('@/components/layout/WhyChooseUs'), {
  loading: () => <div className="h-96 bg-gray-100 animate-pulse rounded-lg"></div>
});

export default function AboutPage() {
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
                <div className="absolute -top-1 -right-1 w-4 h-4  rounded-lg animate-pulse"></div>
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
      {/* <div className="bg-linear-to-r from-green-600 to-blue-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">About BookMyFutsal</h1>
          <p className="text-xl text-green-100 max-w-3xl mx-auto">
            Revolutionizing the way you book and experience futsal venues across the city.
          </p>
        </div>
      </div> */}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Mission Section */}
        <div className=" rounded-2xl  p-8 mb-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold bg-linear-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-4">
              Our Mission
            </h2>
            <p className="text-gray-600 text-lg max-w-4xl mx-auto leading-relaxed">
              At BookMyFutsal, we're passionate about bringing the beautiful game to everyone. Our platform connects futsal enthusiasts with premium venues,
              making it easier than ever to book, play, and enjoy the sport you love. We believe that great facilities should be accessible to all players,
              from casual weekend warriors to competitive teams.
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-green-600 mb-2">50+</div>
              <div className="text-gray-600 font-medium">Premium Venues</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">10,000+</div>
              <div className="text-gray-600 font-medium">Happy Players</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-purple-600 mb-2">24/7</div>
              <div className="text-gray-600 font-medium">Support Available</div>
            </div>
          </div>
        </div>

        {/* Why Choose Us Section */}
        <WhyChooseUs />

        {/* Testimonials Section */}
        <TestimonialSection />

        {/* Team Section */}
        <div className=" rounded-2xl  p-8 mb-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold bg-linear-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-4">
              Meet Our Team
            </h2>
            <p className="text-gray-600 text-lg">
              The passionate individuals driving innovation at BookMyFutsal
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
             <div className="text-center">
              {/* <div className="w-32 h-32 bg-linear-to-r from-teal-400 to-cyan-500 rounded-full mx-auto mb-4 flex items-center justify-center overflow-hidden"> */}
              <div className="w-32 h-32 bg-linear-to-r rounded-full mx-auto mb-4 flex items-center justify-center overflow-hidden">
                <img src="/partners/arpit.jpeg" className="w-full h-full object-cover" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Arpit</h3>
              <p className="text-teal-600 font-medium mb-2">Product Manager</p>
              <p className="text-gray-600 text-sm">
                Product strategist focused on user experience and driving product growth through data-driven decisions.
              </p>
            </div>
             <div className="text-center">
              {/* <div className="w-32 h-32 bg-linear-to-r from-orange-400 to-red-500 rounded-full mx-auto mb-4 flex items-center justify-center overflow-hidden"> */}
               <div className="w-32 h-32 bg-linear-to-r rounded-full mx-auto mb-4 flex items-center justify-center overflow-hidden">
                <img src="/partners/suman.jpeg" className="w-full h-full object-cover" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Suman</h3>
              <p className="text-orange-600 font-medium mb-2">Software Engineer / Developer</p>
              <p className="text-gray-600 text-sm">
                Full-stack developer specializing in modern web technologies and creating robust user interfaces.
              </p>
            </div>
            <div className="text-center">
              {/* <div className="w-32 h-32 bg-linear-to-r from-purple-400 to-pink-500 rounded-full mx-auto mb-4 flex items-center justify-center overflow-hidden"> */}
              <div className="w-32 h-32 bg-linear-to-r rounded-full mx-auto mb-4 flex items-center justify-center overflow-hidden">
                <img src="/partners/prawjol.jpeg" className="w-full h-full object-cover" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Prajwol</h3>
              <p className="text-purple-600 font-medium mb-2">Engineering Manager</p>
              <p className="text-gray-600 text-sm">
                Experienced engineering leader focused on building scalable solutions and mentoring development teams.
              </p>
            </div>
            <div className="text-center">
              {/* <div className="w-32 h-32 bg-linear-to-r from-blue-400 to-purple-500 rounded-full mx-auto mb-4 flex items-center justify-center overflow-hidden"> */}
              <div className="w-32 h-32 bg-linear-to-r rounded-full mx-auto mb-4 flex items-center justify-center overflow-hidden">
                <img src="/partners/bidesh.jpeg" className="w-full h-full object-cover" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Bidesh</h3>
              <p className="text-blue-600 font-medium mb-2">Chief Technology Officer</p>
              <p className="text-gray-600 text-sm">
                Technology expert ensuring our platform delivers exceptional performance and user experience.
              </p>
            </div>
            <div className="text-center">
              {/* <div className="w-32 h-32 bg-linear-to-r from-indigo-400 to-purple-500 rounded-full mx-auto mb-4 flex items-center justify-center overflow-hidden"> */}
               <div className="w-32 h-32 bg-linear-to-r rounded-full mx-auto mb-4 flex items-center justify-center overflow-hidden">
                <img src="/partners/roshan.jpeg" className="w-full h-full object-cover" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Roshan</h3>
              <p className="text-indigo-600 font-medium mb-2">Quality Assurance Engineer</p>
              <p className="text-gray-600 text-sm">
                Quality assurance specialist ensuring our platform delivers reliable and bug-free experiences to users.
              </p>
            </div>
             <div className="text-center">
              {/* <div className="w-32 h-32 bg-linear-to-r from-green-400 to-blue-500 rounded-full mx-auto mb-4 flex items-center justify-center overflow-hidden"> */}
              <div className="w-32 h-32 bg-linear-to-rrounded-full mx-auto mb-4 flex items-center justify-center overflow-hidden">
                <img src="/partners/arjun.jpeg" className="w-full h-full object-cover" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Hakuna Matata</h3>
              <p className="text-green-600 font-medium mb-2">All Rounder</p>
              <p className="text-gray-600 text-sm">
                Visionary leader passionate about making futsal accessible to everyone through innovative technology solutions.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}