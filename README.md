<div align="center">

<a name="top"></a>

# ⚽️ BookMyFutsal

BookMyFutsal is a comprehensive web platform for booking futsal venues in Nepal. It allows users to browse, book, and manage futsal reservations with real-time tracking, ratings, and secure authentication. The platform supports multiple user roles including registered users, futsal administrators, and super administrators.

</div>


## 🚀 Features

- **User Registration & Authentication**: Secure user registration with email/phone OTP verification
- **Futsal Venue Management**: Browse, filter, and book futsal venues
- **Real-time Booking Tracking**: Track bookings with unique tracking codes
- **Rating & Review System**: Rate and review futsal venues
- **Multi-role Support**: Separate dashboards for users, futsal admins, and super admins
- **Real-time Notifications**: Socket.io powered real-time updates
- **Responsive Design**: Mobile-first design with Tailwind CSS
- **Secure Payments**: Integrated payment processing (future enhancement)
- **Location Services**: GPS-based distance calculation to venues

## 🛠️ Technology Stack

### Backend

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL (via Supabase)
- **Caching**: Redis
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: Argon2
- **Real-time**: Socket.io
- **Email Service**: Nodemailer
- **Logging**: Winston
- **File Uploads**: Multer

### Frontend

- **Framework**: Next.js 16 (React 19)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Data Fetching**: TanStack React Query
- **Virtualization**: React Window
- **Image Processing**: html2canvas

### Infrastructure

- **Database Hosting**: Supabase
- **Backend Deployment**: Railway
- **Frontend Deployment**: Vercel
- **Version Control**: Git

## 📁 Project Directory Structure

```
📁 BookMyFutsal/
├── 📁 frontend/                          # Frontend application (Next.js)
│   ├── 📄 .gitignore                     # Git ignore rules
│   ├── 📄 eslint.config.mjs              # ESLint configuration for code linting
│   ├── 📄 next.config.ts                 # Next.js configuration settings
│   ├── 📄 package-lock.json              # NPM lock file for exact dependency versions
│   ├── 📄 package.json                   # NPM package configuration and dependencies
│   ├── 📄 README.md                      # Project documentation (this file)
│   ├── 📄 tsconfig.json                  # TypeScript configuration
│   ├── 📁 .next/                         # Next.js build output directory (generated)
│   ├── 📁 hero/                          # Hero section static images
│   │   └── 🖼️ hero_section.jpg           # Main hero background image
│   ├── 📁 public/                        # Static assets served by Next.js
│   │   ├── 🖼️ file.svg                   # Generic file icon
│   │   ├── 🖼️ globe.svg                  # Globe icon
│   │   ├── 🖼️ next.svg                   # Next.js logo
│   │   ├── 🖼️ vercel.svg                 # Vercel logo
│   │   ├── 🖼️ window.svg                 # Window icon
│   │   └── 📁 logo/                      # Logo assets
│   │       └── 🖼️ logo.png               # Application logo
│   └── 📁 src/                           # Source code
│       ├── 📁 app/                       # Next.js App Router directory
│       │   ├── 🖼️ favicon.ico            # Browser favicon
│       │   ├── 🎨 globals.css            # Global CSS styles
│       │   ├── 📄 layout.tsx             # Root layout component
│       │   ├── 📄 page.tsx               # Home page component
│       │   ├── 📄 providers.tsx          # React context providers setup
│       │   ├── 📄 socket.tsx             # Socket.io client configuration
│       │   ├── 📁 book/                  # Booking-related pages
│       │   │   └── 📁 [futsalId]/        # Dynamic route for specific futsal booking
│       │   │       └── 📄 page.tsx       # Futsal booking page
│       │   ├── 📁 futsal-admin/          # Futsal admin section
│       │   │   ├── 📁 dashboard/         # Futsal admin dashboard
│       │   │   │   └── 📄 page.tsx       # Futsal admin dashboard page
│       │   │   └── 📁 signin/            # Futsal admin authentication
│       │   │       └── 📄 page.tsx       # Futsal admin signin page
│       │   ├── 📁 super-admin/           # Super admin section
│       │   │   ├── 📁 dashboard/         # Super admin dashboard
│       │   │   │   ├── 📄 page.tsx       # Super admin dashboard page
│       │   │   │   ├── 📁 components/    # Dashboard UI components
│       │   │   │   │   ├── 📄 AdminSection.tsx          # Futsal admins management section
│       │   │   │   │   ├── 📄 BlockedUserSection.tsx    # Blocked users management section
│       │   │   │   │   ├── 📄 BookingSection.tsx        # Bookings management section
│       │   │   │   │   ├── 📄 DashboardHeader.tsx       # Dashboard header component
│       │   │   │   │   ├── 📄 DashboardInfo.tsx         # Dashboard info and profile section
│       │   │   │   │   ├── 📄 FutsalSection.tsx         # Futsals management section
│       │   │   │   │   ├── 📄 RatingSection.tsx         # Ratings management section
│       │   │   │   │   ├── 📄 SlotSection.tsx           # Time slots management section
│       │   │   │   │   ├── 📄 UserSection.tsx           # Users management section
│       │   │   │   │   ├── 📁 forms/                    # Form components
│       │   │   │   │   │   ├── 📄 CreateFutsalAdminForm.tsx  # Form to create futsal admin
│       │   │   │   │   │   ├── 📄 CreateFutsalForm.tsx       # Form to create futsal
│       │   │   │   │   │   ├── 📄 CreateRatingForm.tsx       # Form to create rating
│       │   │   │   │   │   ├── 📄 EditBookingForm.tsx        # Form to edit booking
│       │   │   │   │   │   ├── 📄 EditFutsalAdminForm.tsx    # Form to edit futsal admin
│       │   │   │   │   │   ├── 📄 EditFutsalForm.tsx         # Form to edit futsal
│       │   │   │   │   │   ├── 📄 EditRatingForm.tsx         # Form to edit rating
│       │   │   │   │   │   ├── 📄 EditSuperAdminForm.tsx     # Form to edit super admin profile
│       │   │   │   │   │   └── 📄 EditUserForm.tsx           # Form to edit user
│       │   │   │   │   ├── 📁 modals/                        # Modal dialog components
│       │   │   │   │   │   ├── 📄 BlockReasonModal.tsx       # Modal for entering block reason
│       │   │   │   │   │   ├── 📄 ConfirmModal.tsx           # Generic confirmation modal
│       │   │   │   │   │   ├── 📄 FutsalDetailsModal.tsx     # Modal showing futsal details
│       │   │   │   │   │   └── 📄 NotificationModal.tsx      # Modal for notifications
│       │   │   │   │   ├── 📁 hooks/                         # Custom React hooks
│       │   │   │   │   │   ├── 📄 useBookings.ts             # Hook for bookings data management
│       │   │   │   │   │   ├── 📄 useBulkOperations.ts       # Hook for bulk operations logic
│       │   │   │   │   │   ├── 📄 useDashboardSocket.ts      # Hook for dashboard socket handling
│       │   │   │   │   │   ├── 📄 useFutsalAdmins.ts         # Hook for futsal admins data
│       │   │   │   │   │   ├── 📄 useFutsals.ts              # Hook for futsals data
│       │   │   │   │   │   ├── 📄 useRatings.ts              # Hook for ratings data
│       │   │   │   │   │   ├── 📄 useSlots.ts                # Hook for time slots data
│       │   │   │   │   │   └── 📄 useUsers.ts                # Hook for users data
│       │   │   │   │   └── 📁 utils/                         # Utility functions
│       │   │   │   │       ├── 📄 bookingUtils.ts            # Booking-related utilities
│       │   │   │   │       ├── 📄 searchUtils.ts             # Search functionality utilities
│       │   │   │   │       └── 📄 validationUtils.ts         # Validation utilities
│       │   │   └── 📁 signin/                                # Super admin authentication
│       │   │       └── 📄 page.tsx                           # Super admin signin page
│       │   ├── 📁 user/                                      # Regular user section
│       │   │   ├── 📁 dashboard/                             # User dashboard
│       │   │   │   └── 📄 page.tsx                           # User dashboard page
│       │   │   ├── 📁 login/                                 # User authentication
│       │   │   │   └── 📄 page.tsx                           # User login page
│       │   │   └── 📁 register/                              # User registration
│       │   │       └── 📄 page.tsx                           # User registration page
│       ├── 📁 components/                                    # Reusable React components
│       │   ├── 📁 booking/                                   # Booking-related components
│       │   │   └── 📄 BookingTracker.tsx                     # Component for tracking booking progress
│       │   ├── 📁 common/                                    # Common utility components
│       │   │   ├── 📄 ErrorBoundary.tsx                      # Error boundary for error handling
│       │   │   └── 📄 Loading.tsx                            # Loading spinner component
│       │   ├── 📁 layout/                                    # Layout components
│       │   │   ├── 📄 Footer.tsx                             # Site footer component
│       │   │   ├── 📄 Header.tsx                             # Site header component
│       │   │   ├── 📄 HeroSection.tsx                        # Hero section component
│       │   │   ├── 📄 TestimonialSection.tsx                 # Testimonials section component
│       │   │   └── 📄 WhyChooseUs.tsx                        # Why choose us section component
│       │   ├── 📁 modals/                                    # Modal components
│       │   │   ├── 📄 DetailsModal.tsx                       # Modal for showing details
│       │   │   ├── 📄 FeedbackModal.tsx                      # Modal for user feedback
│       │   │   ├── 📄 LocationModal.tsx                      # Modal for location selection
│       │   │   ├── 📄 RatingModal.tsx                        # Modal for rating submission
│       │   │   └── 📄 VideoModal.tsx                         # Modal for video display
│       │   ├── 📁 ui/                                        # UI components
│       │   │   └── 📄 Notification.tsx                       # Notification component
│       │   └── 📁 venues/                                    # Venue-related components
│       │       ├── 📄 VenueCard.tsx                          # Individual venue card component
│       │       ├── 📄 VenueCarousel.tsx                      # Venue carousel component
│       │       ├── 📄 VenueGrid.tsx                          # Venue grid layout component
│       │       └── 📄 VirtualizedVenueGrid.tsx               # Virtualized venue grid for performance
│       ├── 📁 hooks/                                         # Global custom hooks
│       │   ├── 📄 useBookings.ts                             # Hook for managing bookings
│       │   ├── 📄 useBookingTracker.ts                       # Hook for booking progress tracking
│       │   ├── 📄 useFutsals.ts                              # Hook for futsal data
│       │   ├── 📄 useRatings.ts                              # Hook for ratings data
│       │   ├── 📄 useSocketHandler.ts                        # Hook for socket event handling
│       │   ├── 📄 useTestimonials.ts                         # Hook for testimonials data
│       │   ├── 📄 useTimeSlots.ts                            # Hook for time slots data
│       │   ├── 📄 useVenueCarousel.ts                        # Hook for venue carousel logic
│       │   └── 📄 useVenueFilters.ts                         # Hook for venue filtering
│       ├── 📁 reducers/                                      # Redux-style reducers
│       │   ├── 📄 bookingReducer.ts                          # Reducer for booking state
│       │   ├── 📄 filterReducer.ts                           # Reducer for filter state
│       │   └── 📄 registrationReducer.ts                     # Reducer for registration state
│       ├── 📁 services/                                      # API service functions
│       │   └── 📄 api.ts                                     # Centralized API service
│       ├── 📁 stores/                                        # Zustand state stores
│       │   ├── 📄 authStore.ts                               # Authentication state store
│       │   ├── 📄 bookingStore.ts                            # Booking state store
│       │   ├── 📄 futsalStore.ts                             # Futsal state store
│       │   ├── 📄 modalStore.ts                              # Modal state store
│       │   ├── 📄 notificationStore.ts                       # Notification state store
│       │   ├── 📄 socketStore.ts                             # Socket state store
│       │   └── 📄 uiStore.ts                                 # UI state store
│       ├── 📁 types/                                         # TypeScript type definitions
│       │   └── 📄 react-window.d.ts                          # Types for react-window library
│       └── 📁 utils/                                         # Utility functions
│           └── 📄 helpers.ts                                 # General helper functions
├── 📁 backend/                                               # Backend application (Node.js/Express)
│   └── 🔒 Repository is private due to privacy, security, and production concerns
│       └── 🔐 Access restricted to prevent misuse or unauthorized modifications
└── 📄 production.md                                          # Production deployment documentation
```

## 🔒 Security Measures

- **Authentication**: JWT-based authentication with refresh tokens
- **Password Security**: Argon2 hashing with strong validation rules
- **Rate Limiting**: Multiple rate limiters for different endpoints (API, auth, bookings)
- **Input Validation**: Comprehensive input sanitization and validation
- **CORS Protection**: Configured CORS policies
- **Security Headers**: Helmet.js for security headers
- **XSS Protection**: XSS-clean middleware
- **HPP Protection**: HTTP Parameter Pollution prevention
- **OTP Verification**: Email and SMS OTP for registration and password reset
- **Account Blocking**: Progressive blocking for failed login attempts
- **Data Sanitization**: Express-mongo-sanitize for NoSQL injection prevention
- **SQL Injection Prevention**: Parameterized queries with pg library

## 👥 User Roles & Permissions

### Unregistered Users

- Browse and view futsal venues
- Track existing bookings using tracking codes
- View venue details, ratings, and facilities
- Access location information and distance calculation

### Registered Users

- All unregistered user permissions
- User registration with email/phone verification
- Secure login with progressive account blocking
- Book futsal venues with real-time availability
- Manage personal bookings (view, cancel)
- Update profile information
- Rate and review booked venues
- Password reset with OTP verification

### Futsal Administrators

- Secure login to manage assigned futsal
- View and manage bookings for their venue
- Update venue information and pricing
- Manage time slots and availability
- View customer ratings and feedback
- Password reset functionality
- Created and managed by super administrators

### Super Administrators

- Full system administration privileges
- Create and manage futsal administrator accounts
- View and manage all user accounts
- Block/unblock users for security
- Access system-wide analytics and reports
- Manage system configuration and settings
- Override bookings and venue management

## 📡 API Endpoints

### Authentication

- `POST /api/users/register` - User registration
- `POST /api/users/login` - User login
- `POST /api/futsal-admins/login` - Futsal admin login
- `POST /api/superadmin/login` - Super admin login

### Bookings

- `GET /api/bookings` - Get user bookings
- `POST /api/bookings` - Create booking
- `DELETE /api/bookings/cancel/:trackingCode` - Cancel booking

### Venues

- `GET /api/futsals` - Get all futsal venues
- `GET /api/futsals/:id` - Get specific futsal details

### Time Slots

- `GET /api/time-slots/:futsalId/:date` - Get available time slots

### Code Quality

- ESLint for code linting
- Prettier for code formatting
- TypeScript for type safety
- Comprehensive error handling

## 📞 Contact

For questions or support, please contact the development team bookmyfutsal@gmail.com.

---

**BookMyFutsal** - Making futsal booking easy and secure! ⚽

<div align="center">
   
  **[⬆ Back to Top](#top)**
  
</div>
