# Mindmil Assessments

A production-ready multi-tenant SaaS platform for psychometric and cognitive assessments with role-based access control, assessment management, test-taking flow, reports, and white-labeling capabilities.

## Features

### Authentication & Authorization
- JWT-based authentication with secure password hashing (bcrypt)
- Role-based access control (SuperAdmin, Admin, User)
- Protected routes with middleware
- Token expiration handling

### User Management
- Multi-tenant architecture with organization isolation
- User CRUD operations
- Assessment assignment to users
- Profile management

### Assessment Module
- Multiple assessment types (Psychometric, Cognitive, Situational, Professional)
- Question management (MCQ, Text, Image, Graphic, Rating, Matrix)
- Difficulty levels (Basic, Moderate, Tough)
- Time-bound assessments
- Question randomization and ordering

### Test Taking
- Full-screen test interface with timer
- Auto-save progress
- Auto-submit on timeout
- Anti-cheating measures (tab switch detection)
- Progress tracking

### Reports & Analytics
- Auto-generated psychometric reports (DISC, MBTI style)
- Score distribution charts
- Performance analytics
- Report sharing via email
- Public report access links

### Credit Management
- Credit-based usage system
- Credit request workflow
- SuperAdmin approval system
- Usage tracking

### Support System
- Ticket-based support
- Priority levels
- Response tracking
- Admin assignment

### White Labeling
- Organization branding (logo, colors)
- Public profile pages
- Customizable settings

## Tech Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcryptjs
- **File Uploads**: Multer
- **Validation**: express-validator
- **Logging**: Morgan
- **Rate Limiting**: express-rate-limit

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Charts**: Recharts
- **HTTP Client**: Axios
- **Routing**: React Router DOM

## Project Structure

```
mindmill_/
├── backend/
│   ├── config/           # Database, JWT, Multer config
│   ├── controllers/      # Route controllers
│   ├── middleware/       # Auth, role, error handlers
│   ├── models/          # MongoDB models
│   ├── routes/          # API routes
│   ├── seeds/           # Database seeding
│   ├── uploads/         # File uploads
│   ├── utils/           # Utility functions
│   ├── server.js        # Entry point
│   └── .env.example     # Environment template
├── frontend/
│   ├── src/
│   │   ├── components/  # Reusable components
│   │   ├── context/     # React contexts
│   │   ├── layouts/     # Page layouts
│   │   ├── pages/       # Page components
│   │   ├── services/    # API services
│   │   ├── styles/      # Global styles
│   │   ├── App.jsx      # Main app component
│   │   └── main.jsx     # Entry point
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
├── package.json         # Root workspace config
└── README.md
```

## Prerequisites

- Node.js >= 18.0.0
- MongoDB >= 5.0
- npm or yarn

## Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd mindmill_
```

2. **Install dependencies**
```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend && npm install && cd ..

# Install frontend dependencies
cd frontend && npm install && cd ..

# Or use the convenience script
npm run install:all
```

3. **Configure environment variables**
```bash
# Backend
cp backend/.env.example backend/.env

# Frontend
cp .env.example frontend/.env
```

Edit the `.env` files with your configuration:

**backend/.env:**
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/mindmil_assessments
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRE=24h
FRONTEND_URL=http://localhost:5173
```

**frontend/.env:**
```
VITE_API_URL=http://localhost:5000/api
```

4. **Start MongoDB**
Make sure MongoDB is running on your system.

5. **Seed the database**
```bash
npm run seed
```

This creates:
- SuperAdmin: `super@admin.com` / `supperadmin`
- Admin: `admin@admin.com` / `admin`
- User: `user@user.com` / `user`
- Demo Organization with 1000 credits
- Sample assessments

## Running the Application

### Development Mode

Start both backend and frontend:
```bash
npm run dev
```

Or start individually:
```bash
# Backend only
npm run dev:backend

# Frontend only
npm run dev:frontend
```

### Production Mode

1. Build the frontend:
```bash
cd frontend && npm run build
```

2. Start the backend:
```bash
cd backend && npm start
```

## API Documentation

### Authentication
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile
- `POST /api/auth/change-password` - Change password
- `POST /api/auth/logout` - Logout

### Users
- `GET /api/users` - List users
- `POST /api/users` - Create user
- `GET /api/users/:id` - Get user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user
- `POST /api/users/:id/assign-assessment` - Assign assessment

### Organizations
- `GET /api/organizations` - List organizations
- `POST /api/organizations` - Create organization
- `GET /api/organizations/:id` - Get organization
- `PUT /api/organizations/:id` - Update organization
- `PUT /api/organizations/:id/branding` - Update branding
- `GET /api/organizations/:slug/public` - Public profile

### Assessments
- `GET /api/assessments` - List assessments
- `POST /api/assessments` - Create assessment
- `GET /api/assessments/:id` - Get assessment
- `PUT /api/assessments/:id` - Update assessment
- `DELETE /api/assessments/:id` - Delete assessment
- `POST /api/assessments/:id/duplicate` - Duplicate assessment

### Questions
- `GET /api/assessments/:id/questions` - List questions
- `POST /api/assessments/:id/questions` - Create question
- `PUT /api/questions/:id` - Update question
- `DELETE /api/questions/:id` - Delete question

### Attempts
- `GET /api/attempts` - List attempts
- `POST /api/assessments/:id/start` - Start attempt
- `POST /api/attempts/:id/answer` - Save answer
- `POST /api/attempts/:id/submit` - Submit attempt

### Reports
- `GET /api/reports` - List reports
- `GET /api/reports/:id` - Get report
- `POST /api/reports/:id/share` - Share report
- `GET /api/reports/shared/:token` - Access shared report

### Credits
- `GET /api/credits` - Get credits
- `POST /api/credits/request` - Request credits
- `GET /api/credits/requests` - List requests
- `PUT /api/credits/requests/:id/approve` - Approve request

### Support
- `GET /api/support/tickets` - List tickets
- `POST /api/support/tickets` - Create ticket
- `POST /api/support/tickets/:id/respond` - Add response

### Dashboard
- `GET /api/dashboard/superadmin` - SuperAdmin metrics
- `GET /api/dashboard/admin` - Admin metrics
- `GET /api/dashboard/user` - User metrics

## Default Login Credentials

| Role | Email | Password |
|------|-------|----------|
| SuperAdmin | super@admin.com | supperadmin |
| Admin | admin@admin.com | admin |
| User | user@user.com | user |

## Security Features

- Password hashing with bcrypt (salt rounds: 12)
- JWT authentication with configurable expiry
- CORS protection
- Rate limiting on sensitive endpoints
- Input validation and sanitization
- MongoDB injection protection
- Organization data isolation

## License

MIT License

## Support

For support, email support@mindmil.com or create a ticket through the application.
# mindmill
