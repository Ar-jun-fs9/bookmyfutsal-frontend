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
