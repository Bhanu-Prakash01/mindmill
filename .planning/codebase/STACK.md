# Technology Stack

**Analysis Date:** 2026-04-12

## Languages

**Primary:**
- JavaScript (ES2023+) - Used throughout both frontend and backend
- JSX - Used for React components in frontend

**Secondary:**
- HTML - For frontend structure
- CSS - For styling (with Tailwind CSS)

## Runtime

**Environment:**
- Node.js >=18.0.0

**Package Manager:**
- npm [Version not specified in lockfile]
- Lockfile: present (package-lock.json)

## Frameworks

**Core:**
- React 18.2.0 - Frontend UI library
- Express 4.18.2 - Backend web framework
- Vite 5.0.8 - Frontend build tool and development server

**Testing:**
- Not explicitly configured in package.json scripts (no test scripts found)

**Build/Dev:**
- TailwindCSS 3.3.6 - Utility-first CSS framework
- PostCSS 8.4.32 - CSS processing
- Autoprefixer 10.4.16 - CSS vendor prefixing
- ESLint 8.55.0 - Code linting
- concurrently 8.2.2 - Running multiple processes concurrently

## Key Dependencies

**Critical:**
- mongoose 8.0.3 - MongoDB ODM for backend
- jsonwebtoken 9.0.2 - JWT authentication
- bcryptjs 2.4.3 - Password hashing
- cors 2.8.5 - Cross-origin resource sharing
- express-validator 7.0.1 - Input validation
- axios 1.6.2 - HTTP client for frontend
- react-router-dom 6.20.1 - Frontend routing
- recharts 2.10.3 - Data visualization charts
- nodemailer 8.0.4 - Email sending
- multer 1.4.5-lts.1 - File upload handling
- xlsx 0.18.5 - Excel file processing

**Infrastructure:**
- dotenv 16.3.1 - Environment variable loading
- morgan 1.10.0 - HTTP request logging
- nodemon 3.0.2 - Development file watching (devDependency)

## Configuration

**Environment:**
- Configured via .env files (.env, frontend/.env.local, frontend/.env.production)
- dotenv package loads variables in backend
- Vite automatically loads frontend/.env files

**Build:**
- vite.config.js - Vite configuration
- tailwind.config.js - Tailwind CSS configuration
- postcss.config.js - PostCSS configuration

## Platform Requirements

**Development:**
- Node.js >=18.0.0
- npm package manager

**Production:**
- Node.js runtime
- MongoDB database connection
- Build outputs served as static files (frontend build)

---

*Stack analysis: 2026-04-12*