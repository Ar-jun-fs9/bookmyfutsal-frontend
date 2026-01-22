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
│   ├── 📄 postcss.config.mjs             # PostCSS configuration for CSS processing
│   ├── 📄 README.md                      # Project documentation (this file)
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
│       │   ├── 📁 dashboard/         # Futsal admin dashboard
│       │   │   ├── 📄 page.tsx       # Futsal admin dashboard page
│       │   │   └── 📁 hooks/         # Custom React hooks
│       │   │       └── 📄 useSpecialPrices.ts # Hook for special prices data
│       │   └── 📁 signin/            # Futsal admin authentication
│       │   │   └── 📄 page.tsx       # Futsal admin signin page
│       │   ├── 📁 super-admin/           # Super admin section
│       │   │   ├── 📁 dashboard/         # Super admin dashboard
│       │   │   │   ├── 📄 page.tsx       # Super admin dashboard page
│       │   │   │   ├── 📁 components/    # Dashboard UI components
│       │   │   │   │   ├── 📄 AdminSection.tsx          # Futsal admins management section
│       │   │   │   │   ├── 📄 BlockedUserSection.tsx    # Blocked users management section
│       │   │   │   │   ├── 📄 BookingSection.tsx        # Bookings management section
│       │   │   │   │   ├── 📄 DashboardHeader.tsx       # Dashboard header component
│       │   │   │   │   ├── 📄 DashboardInfo.tsx         # Dashboard info and profile section
│       │   │   │   │   ├── 📄 FeedbackSection.tsx       # Feedback and bugs section
│       │   │   │   │   ├── 📄 FutsalSection.tsx         # Futsals management section
│       │   │   │   │   ├── 📄 RatingSection.tsx         # Ratings management section
│       │   │   │   ├── 📄 SlotSection.tsx           # Time slots management section
│       │   │   │   ├── 📄 SpecialPriceSection.tsx   # Special prices management section
│       │   │   │   ├── 📄 UserSection.tsx           # Users management section
│       │   │   │   ├── 📁 forms/                    # Form components
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
│       │   │   │   │   │   └── 📄 OfferMessageModal.tsx      # Modal for Offer Message
│       │   │   │   │   ├── 📁 hooks/                         # Custom React hooks
│       │   │   │   │   │   ├── 📄 useBookings.ts             # Hook for bookings data management
│       │   │   │   │   │   ├── 📄 useBulkOperations.ts       # Hook for bulk operations logic
│       │   │   │   │   │   ├── 📄 useDashboardSocket.ts      # Hook for dashboard socket handling
│       │   │   │   │   │   ├── 📄 useFeedbacks.ts            # Hook for feedbacks and bugs
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
│       ├── 📄 useVenueFilters.ts                         # Hook for venue filtering
│       └── 📄 useSpecialPrices.ts                             # Hook for special prices data
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

### Authentication & User Management

#### User Authentication

- `POST /api/users/register` - Register new user with email/phone verification
- `POST /api/users/verify-registration` - Verify email and phone OTP for registration completion
- `POST /api/users/login` - User login with progressive account blocking
- `POST /api/users/refresh-token` - Refresh JWT access token
- `GET /api/users/verify` - Verify JWT token and get user info
- `POST /api/users/forgot-password` - Send password reset OTP to email
- `POST /api/users/verify-forgot-otp` - Verify password reset OTP
- `POST /api/users/reset-password` - Reset user password after OTP verification

#### Futsal Admin Authentication

- `POST /api/futsal-admins/login` - Futsal admin login
- `POST /api/futsal-admins/forgot-password` - Send password reset OTP
- `POST /api/futsal-admins/verify-forgot-otp` - Verify password reset OTP
- `POST /api/futsal-admins/reset-password` - Reset futsal admin password

#### Super Admin Authentication

- `POST /api/superadmin/login` - Super admin login
- `POST /api/superadmin/forgot-password` - Send password reset OTP
- `POST /api/superadmin/verify-forgot-otp` - Verify password reset OTP
- `POST /api/superadmin/reset-password` - Reset super admin password

#### OTP Verification

- `POST /api/otp/send` - Send OTP for various purposes
- `POST /api/otp/verify` - Verify OTP codes

### Bookings Management

#### User Bookings

- `GET /api/bookings` - Get authenticated user's bookings
- `POST /api/bookings` - Create new booking (registered or guest)
- `PUT /api/bookings/user/:id` - Update user's own booking (max 2 updates)
- `DELETE /api/bookings/user/:id` - Cancel user's own booking
- `DELETE /api/bookings/cancel/:trackingCode` - Cancel booking by tracking code (guests)

#### Admin Bookings Management

- `GET /api/bookings/all` - Get all bookings (super admin)
- `GET /api/bookings/futsal/:futsalId` - Get bookings for specific futsal
- `PUT /api/bookings/:id` - Update booking (super admin)
- `PUT /api/bookings/futsal-admin/:id` - Update booking (futsal admin)
- `DELETE /api/bookings/:id` - Cancel booking (super admin)
- `DELETE /api/bookings/futsal-admin/:id` - Cancel booking (futsal admin)
- `DELETE /api/bookings/delete/:id` - Soft delete booking (super admin)
- `DELETE /api/bookings/futsal-admin/delete/:id` - Soft delete booking (futsal admin)
- `DELETE /api/bookings/super-admin/bulk-delete` - Bulk delete bookings (super admin)
- `DELETE /api/bookings/futsal-admin/bulk-delete` - Bulk delete bookings (futsal admin)
- `DELETE /api/bookings/user/bulk-delete` - Bulk delete user's own bookings

#### Booking Utilities

- `GET /api/bookings/track/:code` - Track booking by tracking code
- `GET /api/bookings/last-by-phone/:phone` - Get last booking by phone (for guests)
- `GET /api/bookings/:id` - Get booking details by ID

### Venues & Futsals

#### Public Venue Data

- `GET /api/futsals` - Get all futsal venues with ratings and filters
- `GET /api/futsals/:id` - Get detailed futsal information

#### Admin Venue Management

- `POST /api/futsals` - Create new futsal venue (super admin)
- `PUT /api/futsals/:id` - Update futsal venue (super/futsal admin)
- `DELETE /api/futsals/:id` - Delete futsal venue (super admin)

### Time Slots & Availability

- `GET /api/time-slots/:futsalId/:date` - Get available time slots for specific date
- `POST /api/time-slots` - Create time slots (admin)
- `PUT /api/time-slots/:id` - Update time slot status (admin)
- `DELETE /api/time-slots/:id` - Delete time slots (admin)

### Ratings & Reviews

- `GET /api/ratings/:futsalId` - Get ratings for specific futsal
- `POST /api/ratings` - Submit rating/review (authenticated users)
- `PUT /api/ratings/:id` - Update user's own rating (authenticated users)
- `DELETE /api/ratings/:id` - Delete rating (admin)

### Special Pricing

- `GET /api/special-prices/:futsalId` - Get special prices for futsal
- `POST /api/special-prices` - Create special price rule (admin)
- `PUT /api/special-prices/:id` - Update special price rule (admin)
- `DELETE /api/special-prices/:id` - Delete special price rule (admin)

### User Management (Super Admin)

- `GET /api/users` - Get all registered users
- `GET /api/users/:id` - Get user details
- `PUT /api/users/:id` - Update user information
- `DELETE /api/users/:id` - Delete user account
- `POST /api/users/:id/block` - Block user account
- `POST /api/users/:id/unblock` - Unblock user account
- `GET /api/users/blocked/list` - Get list of blocked users

### Futsal Admin Management (Super Admin)

- `GET /api/futsal-admins` - Get all futsal admins
- `POST /api/futsal-admins` - Create new futsal admin
- `PUT /api/futsal-admins/:id` - Update futsal admin
- `DELETE /api/futsal-admins/:id` - Delete futsal admin

### Feedback & Support

- `GET /api/feedback` - Get user feedback (admin)
- `POST /api/feedback` - Submit user feedback
- `DELETE /api/feedback/:id` - Delete feedback entry (admin)

### System Health

- `GET /health` - System health check with database and Redis status

## 🎨 Frontend Architecture

### Technology Stack

#### Core Framework

- **Next.js 16**: React framework with App Router
- **React 19**: Latest React with concurrent features
- **TypeScript**: Type-safe JavaScript development

#### State Management

- **Zustand**: Lightweight state management for global state
- **React Query (TanStack)**: Server state management and caching
- **React Reducers**: Local component state management

#### UI & Styling

- **Tailwind CSS**: Utility-first CSS framework
- **Dynamic Imports**: Code splitting for performance
- **Responsive Design**: Mobile-first approach

#### Data & Communication

- **Socket.io Client**: Real-time bidirectional communication
- **Fetch API**: RESTful API communication
- **React Window**: Virtualized lists for performance

### Application Structure

#### Pages (App Router)

- `/` - Home page with venue browsing and booking tracking
- `/user/login` - User authentication
- `/user/register` - User registration
- `/user/dashboard` - User booking management
- `/futsal-admin/signin` - Futsal admin authentication
- `/futsal-admin/dashboard` - Futsal admin venue management
- `/super-admin/signin` - Super admin authentication
- `/super-admin/dashboard` - System administration
- `/book/[futsalId]` - Dynamic booking page for specific venue

#### Component Architecture

##### Layout Components

- `Header`: Navigation with responsive mobile menu
- `Footer`: Site footer with links and information
- `HeroSection`: Landing page hero with search
- `TestimonialSection`: Customer testimonials carousel
- `WhyChooseUs`: Feature highlights section

##### Venue Components

- `VenueCard`: Individual venue display card
- `VenueCarousel`: Featured venues carousel
- `VenueGrid`: Virtualized grid of all venues
- `VirtualizedVenueGrid`: Performance-optimized venue listing

##### Booking Components

- `BookingTracker`: Track bookings by tracking code
- `BookingForm`: Dynamic booking form with time slot selection

##### Modal Components

- `VideoModal`: Venue promotional video display
- `RatingModal`: Submit venue ratings and reviews
- `DetailsModal`: Detailed venue information
- `LocationModal`: GPS distance calculation
- `FeedbackModal`: User feedback collection
- `PriceNotificationModal`: Price change notifications

##### UI Components

- `Notification`: Toast notifications system
- `Loading`: Loading spinners and skeletons

#### State Management Stores

##### Zustand Stores

- `authStore`: Authentication state (user, admin sessions)
- `bookingStore`: Booking form and process state
- `futsalStore`: Venue data and selection state
- `modalStore`: Modal visibility and data state
- `notificationStore`: Notification queue management
- `socketStore`: Real-time connection state
- `uiStore`: General UI state (loading, errors)

##### React Query Integration

- Venue data fetching with caching
- Booking operations with optimistic updates
- Real-time data synchronization
- Background refetching and invalidation

#### Custom Hooks

##### Data Fetching Hooks

- `useFutsals`: Venue listing with filters and search
- `useBookings`: User booking management
- `useTrackBooking`: Booking tracking by code
- `useRatings`: Venue ratings and reviews
- `useTimeSlots`: Available time slots for venues
- `useSpecialPrices`: Dynamic pricing information

##### UI/UX Hooks

- `useVenueCarousel`: Carousel navigation logic
- `useVenueFilters`: Venue filtering and sorting
- `useSocketHandler`: Real-time event handling
- `useBookingTracker`: Booking progress tracking

##### Admin Hooks

- `useFutsalAdmins`: Futsal admin management
- `useUsers`: User account management
- `useFeedbacks`: User feedback collection
- `useSlots`: Time slot administration
- `useBulkOperations`: Bulk data operations

#### Real-time Features

##### Socket.io Integration

- Live booking updates across admin dashboards
- Real-time availability changes
- Instant notifications for booking status
- Live chat support (future enhancement)

##### Event Types

- `bookingCreated`: New booking notification
- `bookingUpdated`: Booking modification alerts
- `bookingDeleted`: Booking removal notifications

### Performance Optimizations

#### Code Splitting

- Dynamic imports for route-based code splitting
- Component-level lazy loading
- Modal components loaded on demand

#### Virtualization

- `react-window` for large venue lists
- Virtual scrolling for smooth performance
- Memory-efficient rendering

#### Caching Strategy

- React Query for API response caching
- Image optimization with Next.js
- Static asset caching headers

#### Responsive Design

- Mobile-first CSS approach
- Adaptive component rendering
- Touch-friendly interactions

### Code Quality

- ESLint for code linting
- Prettier for code formatting
- TypeScript for type safety
- Comprehensive error handling

## 🤝 Development Workflow

### Code Quality Standards

- **ESLint**: Code linting with Next.js configuration
- **TypeScript**: Strict type checking enabled
- **Prettier**: Code formatting (via ESLint)
- **Security**: Input validation and sanitization
- **Performance**: Code splitting and optimization

### API Development Guidelines

- **RESTful Design**: Consistent REST API patterns
- **Error Handling**: Comprehensive error responses
- **Rate Limiting**: Multiple rate limit tiers
- **Authentication**: JWT-based auth with refresh tokens
- **Validation**: Input sanitization and validation
- **Logging**: Winston-based logging system

### Database Best Practices

- **Connection Pooling**: pg library connection management
- **Transactions**: ACID compliance for critical operations
- **Indexing**: Performance-optimized database indexes
- **Migrations**: Versioned schema files
- **Backup**: Regular database backups

### Testing Strategy

- **Unit Tests**: Component and utility function testing
- **Integration Tests**: API endpoint testing
- **E2E Tests**: User journey testing (future)
- **Performance Tests**: Load and stress testing

## 📊 System Monitoring

### Health Checks

- `/health` endpoint for system status
- Database connectivity monitoring
- Redis connection status
- Memory usage tracking
- Response time metrics

### Logging

- **Winston Logger**: Structured logging
- **Log Levels**: error, warn, info, debug
- **Performance Monitoring**: Request timing
- **Security Events**: Authentication failures
- **Error Tracking**: Comprehensive error logging

### Analytics

- User behavior tracking
- Booking conversion metrics
- System performance metrics
- Error rate monitoring

### Code Quality

- ESLint for code linting
- Prettier for code formatting
- TypeScript for type safety
- Comprehensive error handling

## 📞 Contact

For questions or support, please contact the development team bookmyfutsal@gmail.com.

---

**BookMyFutsal** -  Making futsal booking easy and secure! ⚽

<div align="center">
   
  **[⬆ Back to Top](#top)**
  
</div>
