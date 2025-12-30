'use client';

import { useEffect, useReducer, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { registrationReducer, initialRegistrationState } from '@/reducers/registrationReducer';
import { useNotificationStore } from '@/stores/notificationStore';


export default function UserRegister() {
  const [state, dispatch] = useReducer(registrationReducer, initialRegistrationState);
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { notification, showNotification } = useNotificationStore();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    username: '',
    email: '',
    phone: '',
    password: '',
    confirm_password: ''
  });
  const [otpData, setOtpData] = useState({ email_otp: '', phone_otp: '' });
  const [userId, setUserId] = useState<number | null>(null);
  const [emailCountdown, setEmailCountdown] = useState(0);
  const [phoneCountdown, setPhoneCountdown] = useState(0);
  const [usernameErrors, setUsernameErrors] = useState<string[]>([]);
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Username validation function - returns unmet criteria
  const validateUsername = (username: string) => {
    const unmet: string[] = [];

    // Length check
    if (username.length < 3 || username.length > 15) {
      unmet.push('3-15 characters');
    }

    // Character check - only letters, numbers, underscore, dot
    const validPattern = /^[a-zA-Z0-9_.]+$/;
    if (username && !validPattern.test(username)) {
      unmet.push('Only letters, numbers, underscore (_), dot (.)');
    }

    // No spaces
    if (username.includes(' ')) {
      unmet.push('No spaces');
    }

    // Reserved names
    const reservedNames = ['admin', 'root', 'superadmin', 'support', 'system', 'owner', 'administrator', 'moderator', 'staff', 'user', 'guest'];
    if (reservedNames.includes(username.toLowerCase())) {
      unmet.push('Not a reserved name');
    }

    // SQL keywords (basic check)
    const sqlKeywords = ['select', 'insert', 'update', 'delete', 'drop', 'create', 'alter', 'table', 'database', 'index', 'view'];
    if (sqlKeywords.includes(username.toLowerCase())) {
      unmet.push('Not a SQL keyword');
    }

    return unmet;
  };

  // Password validation function - returns unmet criteria
  const validatePassword = (password: string) => {
    const unmet: string[] = [];

    // Length check
    if (password.length < 12) {
      unmet.push('At least 12 characters');
    }

    // Character requirements
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

    if (!hasUppercase) {
      unmet.push('One uppercase letter');
    }
    if (!hasLowercase) {
      unmet.push('One lowercase letter');
    }
    if (!hasNumber) {
      unmet.push('One number');
    }
    if (!hasSpecialChar) {
      unmet.push('One special character');
    }

    // Common passwords check
    const commonPasswords = ['password', '123456', '123456789', 'qwerty', 'abc123', 'password123', 'admin', 'letmein', 'welcome', 'monkey', '1234567890'];
    if (commonPasswords.includes(password.toLowerCase())) {
      unmet.push('Not a common password');
    }

    return unmet;
  };

  // Countdown timers
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (emailCountdown > 0 || phoneCountdown > 0) {
      interval = setInterval(() => {
        setEmailCountdown(prev => Math.max(0, prev - 1));
        setPhoneCountdown(prev => Math.max(0, prev - 1));
      }, 1000);
    }

    return () => {
      clearInterval(interval);
    };
  }, [emailCountdown, phoneCountdown]);

  // Auto-hide notifications after 7 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        // Notification will be cleared automatically
      }, 7000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Auto-hide form errors after 2 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError('');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setUserId(data.user_id);
        setEmailCountdown(60);
        setPhoneCountdown(60);
        showNotification({ message: `Registration initiated! OTPs sent to ${formData.email} and ${formData.phone}. Email OTP: ${data.otps.email}, Phone OTP: ${data.otps.phone}`, type: 'info' });
        setStep(2);
      } else {
        setError(data.message || 'Registration failed');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setLoading(true);
    setError('');

    try {
      // Resend email OTP
      const emailResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/otp/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contact: formData.email,
          otp_type: 'email',
          user_id: userId
        }),
      });

      // Resend phone OTP
      const phoneResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/otp/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contact: formData.phone,
          otp_type: 'phone',
          user_id: userId
        }),
      });

      if (emailResponse.ok && phoneResponse.ok) {
        const emailData = await emailResponse.json();
        const phoneData = await phoneResponse.json();
        setEmailCountdown(60);
        setPhoneCountdown(60);
        showNotification({ message: `OTPs resent! Email OTP: ${emailData.otp_code}, Phone OTP: ${phoneData.otp_code}`, type: 'info' });
      } else {
        setError('Failed to resend OTPs');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/verify-registration`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          email_otp: otpData.email_otp,
          phone_otp: otpData.phone_otp
        }),
      });

      const data = await response.json();

      if (response.ok) {
        showNotification({ message: 'Registration completed successfully! Please login.', type: 'success' });
        setTimeout(() => router.push('/user/login'), 2000); // Delay to show notification
      } else {
        setError(data.message || 'Verification failed');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-50 bg-linear-to-r from-gray-900 via-green-900 to-blue-900 backdrop-blur-md shadow-2xl border-b border-green-500/20 mb-1">
        <div className="max-w-7xl mx-auto px-1 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4 px-2">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="relative">
                <img src="/logo/logo.png" alt="BookMyFutsal" className="h-12 w-12 rounded-lg shadow-lg ring-2 ring-green-400/50" />
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-lg animate-pulse"></div>
              </div>
              <h1 onClick={() => window.location.href = '/'} className="text-2xl md:text-3xl font-bold text-white drop-shadow-lg cursor-pointer">
                <span className="bg-linear-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">BookMy</span>
                <span className="text-white">Futsal</span>
              </h1>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <a href="/" className="text-gray-200 hover:text-green-400 font-semibold transition-all duration-300 hover:scale-105 relative group">
                Home
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-green-400 transition-all duration-300 group-hover:w-full"></span>
              </a>
              <a href="/" className="text-gray-200 hover:text-green-400 font-semibold transition-all duration-300 hover:scale-105 relative group">
                Venues
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-green-400 transition-all duration-300 group-hover:w-full"></span>
              </a>
              <a href="/" className="text-gray-200 hover:text-green-400 font-semibold transition-all duration-300 hover:scale-105 relative group">
                Bookings
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-green-400 transition-all duration-300 group-hover:w-full"></span>
              </a>
              <a href="/" className="text-gray-200 hover:text-green-400 font-semibold transition-all duration-300 hover:scale-105 relative group">
                About
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-green-400 transition-all duration-300 group-hover:w-full"></span>
              </a>
              <a href="/" className="text-gray-200 hover:text-green-400 font-semibold transition-all duration-300 hover:scale-105 relative group">
                Contact
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-green-400 transition-all duration-300 group-hover:w-full"></span>
              </a>
            </nav>

            {/* Auth Buttons */}
            <div className="hidden md:flex items-center space-x-4">
              <Link
                href="/user/login"
                className="px-6 py-2.5 bg-linear-to-r from-blue-600 to-blue-700 text-white font-bold rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 border border-blue-500/30 hover:border-blue-400/50"
              >
                Login
              </Link>
              <Link
                href="/user/register"
                className="px-6 py-2.5 bg-linear-to-r from-green-600 to-green-700 text-white font-bold rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 border border-green-500/30 hover:border-green-400/50"
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
                <a href="/" className="text-gray-200 hover:text-green-400 font-semibold transition-all duration-300 px-3 py-2 rounded-lg hover:bg-green-900/50">Home</a>
                <a href="/" className="text-gray-200 hover:text-green-400 font-semibold transition-all duration-300 px-3 py-2 rounded-lg hover:bg-green-900/50">Venues</a>
                <a href="/" className="text-gray-200 hover:text-green-400 font-semibold transition-all duration-300 px-3 py-2 rounded-lg hover:bg-green-900/50">Bookings</a>
                <a href="/" className="text-gray-200 hover:text-green-400 font-semibold transition-all duration-300 px-3 py-2 rounded-lg hover:bg-green-900/50">About</a>
                <a href="/" className="text-gray-200 hover:text-green-400 font-semibold transition-all duration-300 px-3 py-2 rounded-lg hover:bg-green-900/50">Contact</a>
                <div className="flex flex-row space-x-3 pt-4 border-t border-green-500/20 ml-2 mr-2">
                  <Link
                    href="/user/login"
                    className="flex-1 px-4 py-3 bg-linear-to-r from-blue-600 to-blue-700 text-white font-bold rounded-lg text-center shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 border border-blue-500/30"
                  >
                    Login
                  </Link>
                  <Link
                    href="/user/register"
                    className="flex-1 px-4 py-3 bg-linear-to-r from-green-600 to-green-700 text-white font-bold rounded-lg text-center shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 border border-green-500/30"
                  >
                    Sign Up
                  </Link>
                </div>
              </nav>
            </div>
          )}
        </div>
      </header>

      <div className="min-h-[calc(100vh-6rem)] flex items-center justify-center bg-linear-to-br from-green-50 via-white to-blue-50 px-4">
        <div className="max-w-md w-full space-y-6">
          <div className="relative bg-white rounded-2xl shadow-2xl overflow-hidden transform transition-all duration-500 hover:scale-[1.02]">
            {/* Gradient Background */}
            <div className="absolute inset-0 bg-linear-to-br from-green-50 via-white to-blue-50 opacity-50"></div>

            {/* Content */}
            <div className="relative p-6 sm:p-8">
              {/* Header */}
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 bg-linear-to-br from-green-500 to-green-600 rounded-lg mb-3 shadow-lg">
                  <svg className="w-6 h-6 sm:w-7 sm:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold bg-linear-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-2">
                  {step === 1 ? 'Create Account' : 'Verify Your Account'}
                </h2>
                <p className="text-gray-600 text-sm">
                  {step === 1 ? 'Join BookMyFutsal and start booking your favorite venues' : 'Enter the OTPs sent to your email and phone to complete registration'}
                </p>
              </div>

              {step === 1 ? (
                <>
                  <form className="space-y-5" onSubmit={handleRegisterSubmit}>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="relative">
                          <label htmlFor="first_name" className="block text-sm font-semibold text-gray-700 mb-1.5">
                            👤 First Name
                          </label>
                          <div className="relative">
                            <input
                              id="first_name"
                              name="first_name"
                              type="text"
                              required
                              className="w-full px-4 py-2.5 pl-9 bg-white border border-gray-200 rounded-lg text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400/50 focus:border-green-400/50 transition-all duration-300 font-medium text-sm"
                              placeholder="first name"
                              value={formData.first_name}
                              onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                            />
                            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-500">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                            </div>
                          </div>
                        </div>

                        <div className="relative">
                          <label htmlFor="last_name" className="block text-sm font-semibold text-gray-700 mb-1.5">
                            👤 Last Name
                          </label>
                          <div className="relative">
                            <input
                              id="last_name"
                              name="last_name"
                              type="text"
                              required
                              className="w-full px-4 py-2.5 pl-9 bg-white border border-gray-200 rounded-lg text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400/50 focus:border-green-400/50 transition-all duration-300 font-medium text-sm"
                              placeholder="last name"
                              value={formData.last_name}
                              onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                            />
                            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-500">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="relative">
                          <label htmlFor="username" className="block text-sm font-semibold text-gray-700 mb-1.5">
                            👤 Username
                          </label>
                          <div className="relative">
                            <input
                              id="username"
                              name="username"
                              type="text"
                              required
                              className="w-full px-4 py-2.5 pl-9 bg-white border border-gray-200 rounded-lg text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400/50 focus:border-green-400/50 transition-all duration-300 font-medium text-sm"
                              placeholder="username"
                              value={formData.username}
                              onChange={(e) => {
                                const value = e.target.value;
                                setFormData({ ...formData, username: value });
                                setUsernameErrors(validateUsername(value));
                              }}
                            />
                            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-500">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                            </div>
                          </div>
                          {formData.username && usernameErrors.length > 0 && (
                            <div className=" mt-1 px-3">
                              <ul className="text-xs text-red-600 list-disc list-inside">
                                {usernameErrors.map((error, index) => (
                                  <li key={index}>{error}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>

                        <div className="relative">
                          <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-1.5">
                            📧 Email Address
                          </label>
                          <div className="relative">
                            <input
                              id="email"
                              name="email"
                              type="email"
                              required
                              className="w-full px-4 py-2.5 pl-9 bg-white border border-gray-200 rounded-lg text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400/50 focus:border-green-400/50 transition-all duration-300 font-medium text-sm"
                              placeholder="email"
                              value={formData.email}
                              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            />
                            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-500">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="relative">
                          <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-1.5">
                            🔒 Password
                          </label>
                          <div className="relative">
                            <input
                              id="password"
                              name="password"
                              type={showPassword ? "text" : "password"}
                              required
                              className="w-full px-4 py-2.5 pl-9 bg-white border border-gray-200 rounded-lg text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400/50 focus:border-green-400/50 transition-all duration-300 font-medium text-sm"
                              placeholder="password"
                              value={formData.password}
                              onChange={(e) => {
                                const value = e.target.value;
                                setFormData({ ...formData, password: value });
                                setPasswordErrors(validatePassword(value));
                              }}
                            />
                            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-500">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                              </svg>
                            </div>
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500 hover:text-green-700 focus:outline-none"
                            >
                              {showPassword ? (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18" />
                                </svg>
                              ) : (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                              )}
                            </button>
                          </div>
                        </div>

                        <div className="relative">
                          <label htmlFor="confirm_password" className="block text-sm font-semibold text-gray-700 mb-1.5">
                            🔒 Confirm Password
                          </label>
                          <div className="relative">
                            <input
                              id="confirm_password"
                              name="confirm_password"
                              type={showConfirmPassword ? "text" : "password"}
                              required
                              className="w-full px-4 py-2.5 pl-9 bg-white border border-gray-200 rounded-lg text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400/50 focus:border-green-400/50 transition-all duration-300 font-medium text-sm"
                              placeholder="Confirm "
                              value={formData.confirm_password}
                              onChange={(e) => setFormData({ ...formData, confirm_password: e.target.value })}
                            />
                            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-500">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </div>
                            <button
                              type="button"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500 hover:text-green-700 focus:outline-none"
                            >
                              {showConfirmPassword ? (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18" />
                                </svg>
                              ) : (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                              )}
                            </button>
                          </div>
                        </div>
                        {/* Password Criteria – Full Width */}
                        {formData.password && passwordErrors.length > 0 && (
                          <div className="col-span-2 mt-1 px-3">
                            <ul className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-red-600 list-disc list-inside">
                              {passwordErrors.map((error, index) => (
                                <li key={index}>{error}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>

                      <div className="relative">
                        <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-1.5">
                          📞 Phone Number
                        </label>
                        <div className="relative">
                          <input
                            id="phone"
                            name="phone"
                            type="tel"
                            required
                            maxLength={10}
                            pattern="9[0-9]{9}"
                            className="w-full px-4 py-2.5 pl-9 bg-white border border-gray-200 rounded-lg text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400/50 focus:border-green-400/50 transition-all duration-300 font-medium text-sm"
                            placeholder="9XXXXXXXXX"
                            value={formData.phone}
                            onChange={(e) => {
                              const value = e.target.value.replace(/\D/g, "");
                              if (value.length <= 10 && (value === "" || value.startsWith("9"))) {
                                setFormData({ ...formData, phone: value });
                              }
                            }}
                          />
                          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-500">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </div>

                    {error && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <div className="flex items-center">
                          <svg className="w-4 h-4 text-red-600 mr-2 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <p className="text-sm text-red-800 font-medium">{error}</p>
                        </div>
                      </div>
                    )}

                    <div className="space-y-3">
                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-linear-to-r from-green-500 to-green-600 text-white font-semibold py-2.5 px-4 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none border border-green-400/30 text-sm"
                      >
                        <span className="flex items-center justify-center">
                          {loading ? (
                            <>
                              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Creating Account...
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                              </svg>
                              Create Account
                            </>
                          )}
                        </span>
                      </button>
                    </div>
                  </form>

                  <div className="text-center pt-4 border-t border-gray-200">
                    <p className="text-gray-600 text-sm">
                      Already have an account?{' '}
                      <Link
                        href="/user/login"
                        className="text-green-600 hover:text-green-700 font-semibold transition-colors duration-300"
                      >
                        Sign in here
                      </Link>
                    </p>
                  </div>
                </>
              ) : (
                <div className="space-y-5">
                  {/* Progress Indicator */}
                  <div className="mb-6">
                    <div className="flex items-center justify-center space-x-4">
                      <div className="flex items-center">
                        <div className={'w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm ' + (step >= 1 ? 'bg-green-500' : 'bg-gray-300')}>
                          {step > 1 ? (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <span>1</span>
                          )}
                        </div>
                        <span className={'ml-2 text-sm font-medium ' + (step >= 1 ? 'text-green-600' : 'text-gray-500')}>Register</span>
                      </div>
                      <div className={'w-6 h-0.5 ' + (step > 1 ? 'bg-green-500' : 'bg-gray-300')}></div>
                      <div className="flex items-center">
                        <div className={'w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm ' + (step >= 2 ? 'bg-green-500' : 'bg-gray-300')}>
                          <span>2</span>
                        </div>
                        <span className={'ml-2 text-sm font-medium ' + (step >= 2 ? 'text-green-600' : 'text-gray-500')}>Verify</span>
                      </div>
                    </div>
                  </div>

                  <form onSubmit={handleVerifySubmit} className="space-y-5">
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="relative">
                          <label htmlFor="email_otp" className="block text-sm font-semibold text-gray-700 mb-1.5">
                            📧 Email OTP
                          </label>
                          <div className="relative">
                            <input
                              id="email_otp"
                              name="email_otp"
                              type="text"
                              required
                              className="w-full px-4 py-2.5 pl-9 bg-white border border-gray-200 rounded-lg text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400/50 focus:border-green-400/50 transition-all duration-300 font-medium text-sm"
                              placeholder="Enter email OTP"
                              value={otpData.email_otp}
                              onChange={(e) => setOtpData({ ...otpData, email_otp: e.target.value })}
                            />
                            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-500">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                            </div>
                          </div>
                          {emailCountdown > 0 && (
                            <p className="text-xs text-red-600 mt-1 px-3">
                              Resend email OTP in: {Math.floor(emailCountdown / 60)}:{(emailCountdown % 60).toString().padStart(2, '0')}
                            </p>
                          )}
                        </div>

                        <div className="relative">
                          <label htmlFor="phone_otp" className="block text-sm font-semibold text-gray-700 mb-1.5">
                            📞 Phone OTP
                          </label>
                          <div className="relative">
                            <input
                              id="phone_otp"
                              name="phone_otp"
                              type="text"
                              required
                              className="w-full px-4 py-2.5 pl-9 bg-white border border-gray-200 rounded-lg text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400/50 focus:border-green-400/50 transition-all duration-300 font-medium text-sm"
                              placeholder="Enter phone OTP"
                              value={otpData.phone_otp}
                              onChange={(e) => setOtpData({ ...otpData, phone_otp: e.target.value })}
                            />
                            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-500">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                              </svg>
                            </div>
                          </div>
                          {phoneCountdown > 0 && (
                            <p className="text-xs text-red-600 mt-1 px-3">
                              Resend phone OTP in: {Math.floor(phoneCountdown / 60)}:{(phoneCountdown % 60).toString().padStart(2, '0')}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {error && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <div className="flex items-center">
                          <svg className="w-4 h-4 text-red-600 mr-2 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <p className="text-sm text-red-800 font-medium">{error}</p>
                        </div>
                      </div>
                    )}

                    <div className="space-y-3">
                      {emailCountdown > 0 || phoneCountdown > 0 ? (
                        <button
                          type="submit"
                          disabled={loading || !otpData.email_otp || !otpData.phone_otp}
                          className="w-full bg-linear-to-r from-green-500 to-green-600 text-white font-semibold py-2.5 px-4 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none border border-green-400/30 text-sm"
                        >
                          <span className="flex items-center justify-center">
                            {loading ? (
                              <>
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Verifying...
                              </>
                            ) : (
                              <>
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Verify Account
                              </>
                            )}
                          </span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={handleResendOTP}
                          disabled={loading}
                          className="w-full bg-linear-to-r from-green-500 to-green-600 text-white font-semibold py-2.5 px-4 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none border border-blue-400/30 text-sm"
                        >
                          <span className="flex items-center justify-center">
                            {loading ? (
                              <>
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Resending...
                              </>
                            ) : (
                              <>
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                Resend OTP
                              </>
                            )}
                          </span>
                        </button>
                      )}
                    </div>
                  </form>

                  <div className="text-center pt-4 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={() => {
                        setStep(1);
                        setError('');
                        setUserId(null);
                        setOtpData({ email_otp: '', phone_otp: '' });
                        setEmailCountdown(0);
                        setPhoneCountdown(0);
                      }}
                      className="text-green-600 hover:text-green-700 text-sm font-medium transition-colors duration-300"
                    >
                      ← Back to Registration
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

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

      <footer className="bg-linear-to-r from-gray-900 via-green-900 to-blue-900 text-white py-16 mt-5">
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
                  <li><a href="/" className="text-gray-300 hover:text-white transition-colors duration-300">Venues</a></li>
                  <li><a href="/" className="text-gray-300 hover:text-white transition-colors duration-300">Bookings</a></li>
                  <li><a href="/" className="text-gray-300 hover:text-white transition-colors duration-300">About</a></li>
                  <li><a href="/" className="text-gray-300 hover:text-white transition-colors duration-300">Contact</a></li>
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
                <li><a href="/" className="text-gray-300 hover:text-white transition-colors duration-300">Venues</a></li>
                <li><a href="/" className="text-gray-300 hover:text-white transition-colors duration-300">Bookings</a></li>
                <li><a href="/" className="text-gray-300 hover:text-white transition-colors duration-300">About</a></li>
                <li><a href="/" className="text-gray-300 hover:text-white transition-colors duration-300">Contact</a></li>
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
    </>
  );
}