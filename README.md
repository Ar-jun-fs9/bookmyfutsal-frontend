<div align="center">

<a name="top"></a>

# ⚽️ BookMyFutsal

BookMyFutsal is a comprehensive web platform for booking futsal venues in Nepal. It allows users to browse, book, and manage futsal reservations with real-time tracking, ratings, and secure authentication. The platform supports multiple user roles including registered users, futsal administrators, and super administrators.

🌐 **[Live Demo](https://bookmyfutsal.vercel.app/)**

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
- **File Uploads**: Cloudinary

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
│   ├── 📄 tsconfig.json                  # TypeScript configuration
│   ├── 📄 README.md                      # Project documentation (this file)
│   └── 📁 src/                           # Source code
│       ├── 📁 app/                       # Next.js App Router directory
│       │   ├── 🖼️ favicon.ico            # Browser favicon
│       │   ├── 🎨 globals.css            # Global CSS styles
│       │   ├── 📄 layout.tsx             # Root layout component
│       │   ├── 📄 page.tsx               # Home page component
│       │   ├── 📄 not-found.tsx          # 404 error page for non-existent routes
│       │   ├── 📄 providers.tsx          # React context providers setup
│       │   ├── 📄 socket.tsx             # Socket.io client configuration
│       │   ├── 📁 about/                 # About page
│       │   │   └── 📄 page.tsx           # About page component
│       │   ├── 📁 book/                  # Booking-related pages
│       │   │   └── 📁 [futsalId]/        # Dynamic route for specific futsal booking
│       │   │       └── 📄 page.tsx       # Futsal booking page
│       │   ├── 📁 bookings/              # Bookings tracking page
│       │   │   └── 📄 page.tsx           # Bookings tracking page
│       │   ├── 📁 careers/               # Careers page
│       │   │   └── 📄 page.tsx           # Careers page component
│       │   ├── 📁 contact/               # Contact page
│       │   │   └── 📄 page.tsx           # Contact page component
│       │   ├── 📁 futsal-admin/          # Futsal admin section
│       │   │   ├── 📁 signin/            # Futsal admin authentication
│       │   │   │   └── 📄 page.tsx       # Futsal admin signin page
│       │   │   └── 📁 dashboard/         # Futsal admin dashboard
│       │   │       ├── 📄 page.tsx       # Futsal admin dashboard page
│       │   │       ├── 📁 hooks/                         # Custom React hooks for futsal admin
│       │   │       │   ├── 📄 useSpecialPrices.ts            # Hook for special prices data
│       │   │       │   └── 📄 useTimeBasedPricing.ts         # Hook for time-based pricing
│       │   │       └── 📁 wallet/                            # Futsal admin wallet page
│       │   │           └── 📄 page.tsx                       # Futsal admin wallet page
│       │   ├── 📁 privacy-policy/        # Privacy policy page
│       │   │   └── 📄 page.tsx           # Privacy policy page
│       │   ├── 📁 support/               # Support page
│       │   │   └── 📄 page.tsx           # Support page
│       │   ├── 📁 terms-of-service/      # Terms of service page
│       │   │   └── 📄 page.tsx           # Terms of service page
│       │   ├── 📁 venues/                # Venues listing page
│       │   │   └── 📄 page.tsx           # Venues listing page
│       │   ├── 📁 super-admin/           # Super admin section
│       │   │   ├── 📁 dashboard/         # Super admin dashboard
│       │   │   │   ├── 📄 page.tsx       # Super admin dashboard page
│       │   │   │   ├── 📁 components/    # Dashboard UI components
│       │   │   │   │   ├── 📄 AdminSection.tsx          # Futsal admins management section
│       │   │   │   │   ├── 📄 BlockedUserSection.tsx    # Blocked users management section
│       │   │   │   │   ├── 📄 BookingSection.tsx        # Bookings management section
│       │   │   │   │   ├── 📄 DashboardHeader.tsx       # Dashboard header component
│       │   │   │   │   ├── 📄 ContactSection.tsx        # Contact messages section
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
│       │   │   │   │   │   ├── 📄 useContacts.ts             # Hook for contact messages
│       │   │   │   │   │   ├── 📄 useDashboardSocket.ts      # Hook for dashboard socket handling
│       │   │   │   │   │   ├── 📄 useFeedbacks.ts            # Hook for feedbacks and bugs
│       │   │   │   │   │   ├── 📄 useFutsalAdmins.ts         # Hook for futsal admins data
│       │   │   │   │   │   ├── 📄 useFutsals.ts              # Hook for futsals data
│       │   │   │   │   │   ├── 📄 useRatings.ts              # Hook for ratings data
│       │   │   │   │   │   ├── 📄 useSlots.ts                # Hook for time slots data
│       │   │   │   │   │   ├── 📄 useSpecialPrices.ts         # Hook for special prices data
│       │   │   │   │   │   └── 📄 useUsers.ts                # Hook for users data
│       │   │   │   │   └── 📁 utils/                         # Utility functions
│       │   │   │   │       ├── 📄 bookingUtils.ts            # Booking-related utilities
│       │   │   │   │       ├── 📄 searchUtils.ts             # Search functionality utilities
│       │   │   │   │       └── 📄 validationUtils.ts         # Validation utilities
│       │   │   └── 📁 signin/                                # Super admin authentication
│       │   │       └── 📄 page.tsx                           # Super admin signin page
│       │   │   └── 📁 wallet/                                # Super admin wallet page
│       │   │       └── 📄 page.tsx                           # Super admin wallet page
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
│       │   │   ├── 📄 VideoModal.tsx                         # Modal for video display
│       │   │   ├── 📄 BookingTermsModal.tsx                  # Modal for booking terms and conditions
│       │   │   ├── 📄 PriceNotificationModal.tsx             # Modal for price change notifications
│       │   │   └── 📄 RegisterTermsModal.tsx                 # Modal for registration terms and conditions
│       │   ├── 📁 ui/                                        # UI components
│       │   │   └── 📄 Notification.tsx                       # Notification component
│       │   └── 📁 venues/                                    # Venue-related components
│       │       ├── 📄 InitializeBooking.tsx                  # Booking initialization component
│       │       ├── 📄 SlotLoading.tsx                        # Slot loading spinner component
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
│       │   ├── 📄 useVenueFilters.ts                         # Hook for venue filtering
│       │   └── 📄 useSpecialPrices.ts                             # Hook for special prices data
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
│       │   ├── 📄 prefetchStore.ts                           # Prefetch state for image/video, rating etc for bg loading
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

### Authentication & Authorization

- **JWT-based Authentication**: Access and refresh token pairs with secure token handling
- **Password Security**: Argon2 hashing with strong validation rules (12+ chars, mixed case, numbers, special chars)
- **Progressive Account Blocking**: Auto-block after 5 failed login attempts (15-minute lockout)
- **Role-based Access Control**: Three-tier authorization (user, futsal_admin, super_admin)

### API Security

- **Rate Limiting**: Multiple rate limiters for different endpoints
  - General API: 1000 requests/15 minutes
  - Authentication: 20 attempts/hour
  - Bookings: 10/hour (write), 500/15min (read)
  - OTP: 10 generation/hour, 50 verification/15min
- **Input Validation**: Comprehensive sanitization and validation
- **CORS Protection**: Configured CORS policies for production domains

### Web Security

- **Security Headers**: Helmet.js with CSP, HSTS, XSS protection
- **XSS Protection**: xss-clean middleware
- **HPP Protection**: HTTP Parameter Pollution prevention
- **SQL Injection Prevention**: Parameterized queries + express-mongo-sanitize
- **Request Size Limiting**: 10MB max request size
- **File Upload Security**: Type validation and malicious filename detection

### Data Protection

- **OTP Verification**: Email and phone OTP for registration and password reset
- **Email Validation**: Block temporary email services
- **Phone Validation**: Nepali 10-digit format validation
- **Account Blocking**: Manual and automatic blocking capabilities

## 👥 User Roles & Permissions

### Unregistered/Guest Users

| Permission     | Description                         |
| -------------- | ----------------------------------- |
| Browse venues  | View all futsal venues              |
| Track bookings | Track booking by tracking code      |
| View details   | See venue info, ratings, facilities |
| Location       | View distance to venues             |

### Registered Users

| Permission            | Description                  |
| --------------------- | ---------------------------- |
| All guest permissions | Inherited from guest         |
| User registration     | Email/phone verification     |
| Make bookings         | Book multipe time slots              |
| Manage bookings       | View, update (max 2), cancel |
| Rate venues           | Submit reviews after booking |
| Profile management    | Update personal info         |
| Password reset        | OTP-based password recovery  |

### Futsal Administrators

| Permission           | Description                   |
| -------------------- | ----------------------------- |
| Dashboard access     | Venue management dashboard    |
| Booking management   | View, update, cancel bookings |
| Venue configuration  | Update venue info, pricing    |
| Time slot management | Create/manage availability    |
| View ratings         | See customer reviews          |
| Wallet access        | View earnings                 |
| Password reset       | Admin password recovery       |

### Super Administrators

| Permission            | Description                  |
| --------------------- | ---------------------------- |
| System administration | Full platform control        |
| User management       | Create, block, delete users  |
| Futsal management     | Create, edit, delete venues  |
| Admin management      | Create futsal admin accounts |
| Analytics             | System-wide statistics       |
| Pricing control       | Override special prices      |
| Feedback access       | View user feedback           |

## 📡 API Endpoints

### Authentication & Users

#### User Registration & Login

| Method | Endpoint                         | Description                    |
| ------ | -------------------------------- | ------------------------------ |
| POST   | `/api/users/register`            | Register new user (sends OTPs) |
| POST   | `/api/users/verify-registration` | Verify email & phone OTPs      |
| POST   | `/api/users/login`               | User login                     |
| POST   | `/api/users/refresh-token`       | Refresh access token           |
| GET    | `/api/users/verify`              | Verify token & get user info   |
| POST   | `/api/users/forgot-password`     | Send password reset OTP        |
| POST   | `/api/users/verify-forgot-otp`   | Verify password reset OTP      |
| POST   | `/api/users/reset-password`      | Reset password                 |

#### User Management (Super Admin)

| Method | Endpoint                  | Description        |
| ------ | ------------------------- | ------------------ |
| GET    | `/api/users`              | List all users     |
| GET    | `/api/users/:id`          | Get user details   |
| PUT    | `/api/users/:id`          | Update user        |
| DELETE | `/api/users/:id`          | Delete user        |
| POST   | `/api/users/:id/block`    | Block user         |
| POST   | `/api/users/:id/unblock`  | Unblock user       |
| GET    | `/api/users/blocked/list` | List blocked users |

### Futsal Management

#### Public Endpoints

| Method | Endpoint           | Description              |
| ------ | ------------------ | ------------------------ |
| GET    | `/api/futsals`     | List all venues (cached) |
| GET    | `/api/futsals/:id` | Get venue details        |

#### Admin Endpoints

| Method | Endpoint           | Description  |
| ------ | ------------------ | ------------ |
| POST   | `/api/futsals`     | Create venue |
| PUT    | `/api/futsals/:id` | Update venue |
| DELETE | `/api/futsals/:id` | Delete venue |

### Bookings

#### User Bookings

| Method | Endpoint                     | Description             |
| ------ | ---------------------------- | ----------------------- |
| GET    | `/api/bookings`              | Get user's bookings     |
| POST   | `/api/bookings`              | Create booking          |
| PUT    | `/api/bookings/user/:id`     | Update booking (max 2)  |
| DELETE | `/api/bookings/user/:id`     | Cancel booking          |
| DELETE | `/api/bookings/cancel/:code` | Cancel by tracking code |

#### Admin Bookings

| Method | Endpoint                                 | Description                |
| ------ | ---------------------------------------- | -------------------------- |
| GET    | `/api/bookings/all`                      | All bookings (super admin) |
| GET    | `/api/bookings/futsal/:id`               | Venue bookings             |
| PUT    | `/api/bookings/:id`                      | Update (super admin)       |
| PUT    | `/api/bookings/futsal-admin/:id`         | Update (futsal admin)      |
| DELETE | `/api/bookings/:id`                      | Cancel (super admin)       |
| DELETE | `/api/bookings/futsal-admin/:id`         | Cancel (futsal admin)      |
| DELETE | `/api/bookings/delete/:id`               | Soft delete                |
| DELETE | `/api/bookings/super-admin/bulk-delete`  | Bulk delete                |
| DELETE | `/api/bookings/futsal-admin/bulk-delete` | Bulk delete                |

#### Booking Tracking

| Method | Endpoint                             | Description        |
| ------ | ------------------------------------ | ------------------ |
| GET    | `/api/bookings/track/:code`          | Track by code      |
| GET    | `/api/bookings/last-by-phone/:phone` | Last guest booking |
| GET    | `/api/bookings/history/:id`          | Booking history    |

### Time Slots

| Method | Endpoint                          | Description         |
| ------ | --------------------------------- | ------------------- |
| GET    | `/api/time-slots/:futsalId/:date` | Get available slots |
| POST   | `/api/time-slots`                 | Create slots        |
| PUT    | `/api/time-slots/:id`             | Update slot status  |
| DELETE | `/api/time-slots/:id`             | Delete slot         |

### Ratings

| Method | Endpoint                 | Description       |
| ------ | ------------------------ | ----------------- |
| GET    | `/api/ratings/:futsalId` | Get venue ratings |
| POST   | `/api/ratings`           | Submit rating     |
| PUT    | `/api/ratings/:id`       | Update rating     |
| DELETE | `/api/ratings/:id`       | Delete rating     |

### Special Pricing

| Method | Endpoint                                    | Description          |
| ------ | ------------------------------------------- | -------------------- |
| GET    | `/api/special-prices/:futsalId`             | Get special prices   |
| GET    | `/api/special-prices/price/:futsalId/:date` | Get price for date   |
| POST   | `/api/special-prices`                       | Create special price |
| PUT    | `/api/special-prices/:id`                   | Update special price |
| DELETE | `/api/special-prices/:id`                   | Delete special price |

### Other Endpoints

#### OTP

| Method | Endpoint            | Description  |
| ------ | ------------------- | ------------ |
| POST   | `/api/otp/generate` | Generate OTP |
| POST   | `/api/otp/verify`   | Verify OTP   |

#### Feedback

| Method | Endpoint            | Description     |
| ------ | ------------------- | --------------- |
| GET    | `/api/feedback`     | List feedback   |
| POST   | `/api/feedback`     | Submit feedback |
| DELETE | `/api/feedback/:id` | Delete feedback |

#### Contact

| Method | Endpoint       | Description    |
| ------ | -------------- | -------------- |
| GET    | `/api/contact` | List contacts  |
| POST   | `/api/contact` | Submit contact |

#### Futsal Admin

| Method | Endpoint                             | Description    |
| ------ | ------------------------------------ | -------------- |
| POST   | `/api/futsal-admins/login`           | Admin login    |
| POST   | `/api/futsal-admins/forgot-password` | Password reset |
| POST   | `/api/futsal-admins/reset-password`  | New password   |

#### Super Admin

| Method | Endpoint                          | Description       |
| ------ | --------------------------------- | ----------------- |
| POST   | `/api/superadmin/login`           | Super admin login |
| POST   | `/api/superadmin/forgot-password` | Password reset    |
| POST   | `/api/superadmin/reset-password`  | New password      |

#### File Upload

| Method | Endpoint      | Description                |
| ------ | ------------- | -------------------------- |
| POST   | `/api/upload` | Upload media to Cloudinary |

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
- `/about` - About page with company information and team
- `/bookings` - Bookings tracking page for guests
- `/careers` - Careers page with job opportunities
- `/contact` - Contact page with support information
- `/privacy-policy` - Privacy policy page
- `/support` - Support page with help resources
- `/terms-of-service` - Terms of service page
- `/venues` - Venues listing page with filters
- `/user/login` - User authentication
- `/user/register` - User registration
- `/user/dashboard` - User booking management
- `/futsal-admin/signin` - Futsal admin authentication
- `/futsal-admin/dashboard` - Futsal admin venue management
- `/super-admin/signin` - Super admin authentication
- `/super-admin/dashboard` - System administration
- `/book/[futsalId]` - Dynamic booking page for specific venue
- `/not-found` - 404 error page for non-existent routes

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

**BookMyFutsal** - Making futsal booking easy and secure! ⚽

<div align="center">
   
  **[⬆ Back to Top](#top)**
  
</div>
