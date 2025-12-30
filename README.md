<div align="center">
<a name="top"></a

# BookMyFutsal

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

## 📁 Project Structure

```
BookMyFutsal/
├── 📁 backend/
│   ├── 📄 .env                          # Backend environment variables
│   ├── 📄 .gitignore                    # Git ignore rules for backend
│   ├── 📄 db.js                         # Database connection configuration
│   ├── 📄 package.json                  # Backend dependencies and scripts
│   ├── 📄 package-lock.json             # Backend lockfile
│   ├── 📁 logs/                         # Application logs directory
│   └── 📁 src/
│       ├── 📄 index.js                  # Main application entry point with Express setup, middleware, routes, and Socket.io
│       ├── 📄 emailService.js           # Email sending service using Nodemailer
│       ├── 📄 jwtUtils.js               # JWT token generation and verification utilities
│       ├── 📁 config/
│       │   └── 📄 redis.js              # Redis client configuration
│       ├── 📁 middleware/
│       │   ├── 📄 auth.js               # Authentication middleware with JWT and role-based access
│       │   ├── 📄 cors.js               # CORS configuration middleware
│       │   ├── 📄 errorHandler.js       # Global error handling middleware
│       │   ├── 📄 rateLimit.js          # Rate limiting middleware for different endpoints
│       │   └── 📄 security.js           # Security headers and data sanitization middleware
│       ├── 📁 routes/
│       │   ├── 📄 bookings.js           # Booking management routes (CRUD operations)
│       │   ├── 📄 futsal_admins.js      # Futsal admin authentication and management routes
│       │   ├── 📄 futsals.js            # Futsal venue CRUD operations and management
│       │   ├── 📄 otp.js                # OTP generation and verification routes
│       │   ├── 📄 ratings.js            # Rating and review management routes
│       │   ├── 📄 superadmin.js         # Super admin authentication and management routes
│       │   ├── 📄 time_slots.js         # Time slot management for bookings
│       │   ├── 📄 users.js              # User authentication, registration, and profile management
│       │   └── 📁 bookings/
│       │       ├── 📄 controller.js     # Booking business logic controller
│       │       ├── 📄 index.js          # Booking routes entry point
│       │       ├── 📄 middleware.js     # Booking-specific middleware
│       │       └── 📄 validation.js     # Booking input validation
│       ├── 📁 services/
│       │   └── 📄 cache.js              # Redis caching service
│       └── 📁 utils/
│           └── 📄 logger.js             # Logging utility with Winston
│   └── 📁 uploads/                      # File upload directory for images and videos
│       ├── 📁 Cav_Futsal/               # Futsal-specific upload directories
│       ├── 📁 Fav_Futsal/
│       ├── 📁 Gav_Futsal/
│       ├── 📁 Jav_futsal/
│       ├── 📁 Lav_Futsal/
│       ├── 📁 Sav_Futsal/
│       └── 📁 Tav_Futsal/
│
├── 📁 frontend/
│   ├── 📄 .env                          # Frontend environment variables
│   ├── 📄 .gitignore                    # Git ignore rules for frontend
│   ├── 📄 eslint.config.mjs             # ESLint configuration
│   ├── 📄 next-env.d.ts                 # Next.js TypeScript declarations
│   ├── 📄 next.config.ts                # Next.js configuration
│   ├── 📄 package.json                  # Frontend dependencies and scripts
│   ├── 📄 package-lock.json             # Frontend lockfile
│   ├── 📄 postcss.config.mjs            # PostCSS configuration
│   ├── 📄 tsconfig.json                 # TypeScript configuration
│   ├── 📁 .next/                        # Next.js build output (generated)
│   ├── 📁 hero/                         # Static hero section assets
│   │   └── 📄 hero_section.jpg          # Hero background image
│   ├── 📁 public/                       # Static public assets
│   │   ├── 📄 file.svg                  # Generic SVG file
│   │   ├── 📄 globe.svg                 # Globe icon
│   │   ├── 📄 next.svg                  # Next.js logo
│   │   ├── 📄 vercel.svg                # Vercel logo
│   │   ├── 📄 window.svg                # Window icon
│   │   └── 📁 logo/
│   │       └── 📄 logo.png              # Application logo
│   └── 📁 src/
│       ├── 📁 app/                      # Next.js app directory
│       │   ├── 📄 favicon.ico           # Application favicon
│       │   ├── 📄 globals.css           # Global CSS styles
│       │   ├── 📄 layout.tsx            # Root layout component
│       │   ├── 📄 page.tsx              # Home page component with venue browsing and booking tracking
│       │   ├── 📄 providers.tsx         # Context providers for the application
│       │   ├── 📄 socket.tsx            # Socket.io client configuration
│       │   ├── 📁 book/                 # Booking-related pages
│       │   │   └── 📁 [futsalId]/
│       │   │       └── 📄 page.tsx      # Dynamic booking page for specific futsal
│       │   ├── 📁 futsal-admin/         # Futsal admin dashboard pages
│       │   │   ├── 📁 dashboard/
│       │   │   │   └── 📄 page.tsx      # Futsal admin dashboard
│       │   │   └── 📁 signin/
│       │   │       └── 📄 page.tsx      # Futsal admin sign-in page
│       │   ├── 📁 super-admin/          # Super admin dashboard pages
│       │   │   ├── 📁 dashboard/
│       │   │   │   └── 📄 page.tsx      # Super admin dashboard
│       │   │   └── 📁 signin/
│       │   │       └── 📄 page.tsx      # Super admin sign-in page
│       │   └── 📁 user/                 # User authentication and profile pages
│       │       ├── 📁 dashboard/
│       │       │   └── 📄 page.tsx      # User dashboard
│       │       ├── 📁 login/
│       │       │   └── 📄 page.tsx      # User login page
│       │       └── 📁 register/
│       │           └── 📄 page.tsx      # User registration page
│       ├── 📁 components/               # Reusable React components
│       │   ├── 📁 booking/
│       │   │   └── 📄 BookingTracker.tsx # Component for tracking bookings
│       │   ├── 📁 common/
│       │   │   ├── 📄 ErrorBoundary.tsx # Error boundary component
│       │   │   └── 📄 Loading.tsx       # Loading spinner component
│       │   ├── 📁 layout/               # Layout components
│       │   │   ├── 📄 Footer.tsx        # Application footer
│       │   │   ├── 📄 Header.tsx        # Application header
│       │   │   ├── 📄 HeroSection.tsx   # Hero section component
│       │   │   ├── 📄 TestimonialSection.tsx # Testimonials display
│       │   │   └── 📄 WhyChooseUs.tsx   # Why choose us section
│       │   ├── 📁 modals/               # Modal components
│       │   │   ├── 📄 DetailsModal.tsx  # Venue details modal
│       │   │   ├── 📄 LocationModal.tsx # Location and distance modal
│       │   │   ├── 📄 RatingModal.tsx   # Rating submission modal
│       │   │   └── 📄 VideoModal.tsx    # Video display modal
│       │   ├── 📁 ui/                   # UI components
│       │   │   └── 📄 Notification.tsx  # Notification component
│       │   └── 📁 venues/               # Venue-related components
│       │       ├── 📄 VenueCard.tsx     # Individual venue card
│       │       ├── 📄 VenueCarousel.tsx # Venue carousel component
│       │       ├── 📄 VenueGrid.tsx     # Venue grid display
│       │       └── 📄 VirtualizedVenueGrid.tsx # Virtualized venue grid for performance
│       ├── 📁 hooks/                    # Custom React hooks
│       │   ├── 📄 useBookings.ts        # Hook for booking operations
│       │   ├── 📄 useBookingTracker.ts  # Hook for booking tracking
│       │   ├── 📄 useFutsals.ts         # Hook for fetching futsals
│       │   ├── 📄 useRatings.ts         # Hook for rating operations
│       │   ├── 📄 useSocketHandler.ts   # Hook for socket handling
│       │   ├── 📄 useTestimonials.ts    # Hook for testimonials
│       │   ├── 📄 useTimeSlots.ts       # Hook for time slot management
│       │   ├── 📄 useVenueCarousel.ts   # Hook for venue carousel
│       │   └── 📄 useVenueFilters.ts    # Hook for venue filtering
│       ├── 📁 reducers/                 # State reducers
│       │   ├── 📄 bookingReducer.ts     # Booking state reducer
│       │   ├── 📄 filterReducer.ts      # Filter state reducer
│       │   └── 📄 registrationReducer.ts # Registration state reducer
│       ├── 📁 services/                 # API service functions
│       │   └── 📄 api.ts                # API client configuration
│       ├── 📁 stores/                   # Zustand state stores
│       │   ├── 📄 authStore.ts          # Authentication state store
│       │   ├── 📄 bookingStore.ts       # Booking state store
│       │   ├── 📄 futsalStore.ts        # Futsal state store
│       │   ├── 📄 modalStore.ts         # Modal state store
│       │   ├── 📄 notificationStore.ts  # Notification state store
│       │   ├── 📄 socketStore.ts        # Socket state store
│       │   └── 📄 uiStore.ts            # UI state store
│       └── 📁 types/                    # TypeScript type definitions
│           ├── 📄 react-window.d.ts     # React Window type definitions
│           └── 📄 helpers.ts            # Utility helper functions
│
└── 📄 README.md                         # This README file

```

### Environment Variables

#### Backend (.env)

```env
NODE_ENV=development
PORT=5000
DATABASE_URL=your_supabase_database_url
REDIS_URL=your_redis_url
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_jwt_refresh_secret
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_password
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

#### Frontend (.env.local)

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

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
