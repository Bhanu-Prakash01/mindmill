# Architecture

**Analysis Date:** 2026-04-12

## Pattern Overview

**Overall:** Monolithic full-stack application with separated frontend (React/Vite) and backend (Node.js/Express) services

**Key Characteristics:**
- Separation of concerns between frontend and backend
- RESTful API architecture for frontend-backend communication
- JWT-based authentication for stateless sessions
- MongoDB with Mongoose ODM for data persistence
- Modular organization by feature/domain (users, assessments, reports, etc.)
- Middleware-based architecture for cross-cutting concerns (authentication, validation, error handling)

## Layers

**[Presentation Layer (Frontend)]:**
- Purpose: Handles UI rendering, user interactions, and client-side state management
- Location: `frontend/src/`
- Contains: React components, pages, layouts, contexts, services, hooks, utilities
- Depends on: React, React Router, Axios, Tailwind CSS
- Used by: Users interacting with the application

**[API Layer (Backend)]:**
- Purpose: Exposes RESTful endpoints, handles business logic, data validation, and persistence
- Location: `backend/`
- Contains: Controllers, routes, services, models, middleware, config
- Depends on: Express, Mongoose, JWT, bcryptjs, validator, nodemailer, multer
- Used by: Frontend application via HTTP requests

**[Service Layer]:**
- Purpose: Encapsulates business logic and data access patterns
- Location: `backend/services/` and `frontend/src/services/`
- Contains: Service classes/functions that handle specific domain operations
- Depends on: Models (backend), APIs (frontend)
- Used by: Controllers (backend), Components/Pages (frontend)

**[Data Access Layer]:**
- Purpose: Interacts with the database for CRUD operations
- Location: `backend/models/`
- Contains: Mongoose schema definitions and models
- Depends on: MongoDB driver, Mongoose
- Used by: Services

**[Cross-cutting Layer]:**
- Purpose: Handles concerns that span multiple layers
- Location: `backend/middleware/` and `frontend/src/context/`
- Contains: Authentication middleware, validation middleware, error handling, context providers
- Depends on: JWT, bcryptjs, validator (backend); React context API (frontend)
- Used by: All layers requiring authentication, validation, or state sharing

## Data Flow

**[User Authentication Flow]:**

1. User submits login credentials via frontend Login component
2. Frontend sends POST request to `/api/auth/login` with credentials
3. Backend auth controller validates credentials against database
4. On success, backend generates JWT access and refresh tokens
5. Tokens sent back to frontend and stored in localStorage/session
6. Frontend includes token in Authorization header for subsequent requests
7. Middleware verifies token on protected routes before controller execution

**[Assessment Creation Flow]:**

1. User fills out assessment form in frontend
2. Frontend validates form data and sends POST to `/api/assessments`
3. Backend assessment controller validates input using express-validator
4. Controller calls assessment service to create assessment record
5. Service interacts with assessment model to save to MongoDB
6. Saved assessment data returned to frontend
7. Frontend updates UI to show success/navigate to assessment list

**[Report Generation Flow]:**

1. User requests report for completed assessment
2. Frontend sends GET request to `/api/reports/:assessmentId`
3. Backend report controller validates request and user permissions
4. Controller calls report service to generate report data
5. Service fetches assessment data, processes responses, applies scoring algorithms
6. Service may fetch related data (user, organization) for report enrichment
7. Generated report data returned to frontend for display/export

**State Management:**
- Frontend: React Context API (AuthContext, ThemeContext) for global state
- Local component state managed with useState/useEffect hooks
- No external state management library (Redux/Zustand) detected
- Backend: Stateless design with session state stored in JWT tokens

## Key Abstractions

**[User Abstraction]:**
- Purpose: Represents application users with roles and permissions
- Examples: `backend/models/User.js`, `frontend/src/services/userService.js`
- Pattern: Mongoose schema with methods for password handling and token generation

**[Assessment Abstraction]:**
- Purpose: Represents psychometric tests that users can take
- Examples: `backend/models/Assessment.js`, `frontend/src/services/assessmentService.js`
- Pattern: Configurable assessment structure supporting different test types (Big5, DISC, custom)

**[Report Abstraction]:**
- Purpose: Represents generated assessment results and analytics
- Examples: `backend/models/Report.js`, `frontend/src/services/reportService.js`
- Pattern: Template-based report generation with data visualization

**[Organization Abstraction]:**
- Purpose: Represents tenants/customers in the multi-tenant SaaS model
- Examples: `backend/models/Organization.js`, `frontend/src/services/organizationService.js`
- Pattern: Multi-tenancy implemented via organizationId foreign keys on resources

## Entry Points

**[Frontend Entry Point]:**
- Location: `frontend/src/main.jsx`
- Triggers: Browser loads application
- Responsibilities: 
  - Initialize React application
  - Set up routing context
  - Apply global styles
  - Render root App component in strict mode

**[Backend Entry Point]:**
- Location: `backend/server.js`
- Triggers: Node.js process starts (`npm start` or `npm run dev`)
- Responsibilities:
  - Load environment variables
  - Configure Express middleware (cors, body parsing, logging)
  - Connect to MongoDB database
  - Mount API routes
  - Set up error handling middleware
  - Start HTTP server on configured port

## Error Handling

**Strategy:** Centralized error handling with environment-specific responses

**Patterns:**
- Backend: Custom error handler middleware (`backend/middleware/errorHandler.js`) that formats error responses and includes stack traces in development
- Frontend: Try/catch blocks in service functions with error display via UI components
- Validation: express-validator middleware for request validation with standardized error formatting
- Async Errors: Try/catch in controller functions with next(error) to pass to error handler

## Cross-Cutting Concerns

**Logging:** Morgan HTTP request logger (`morgan` package) for access logs; console.error for application errors; no structured logging implementation

**Validation:** 
- Backend: express-validator middleware for request validation
- Frontend: Form validation using HTML5 attributes and custom JavaScript logic
- Shared: Validator.js library used in backend for additional validation utilities

**Authentication:** 
- JWT-based stateless authentication
- Access tokens stored in frontend localStorage/session
- Refresh token rotation pattern implemented
- Protected routes guarded by authentication middleware
- Token verification includes expiration and signature validation

---

*Architecture analysis: 2026-04-12*