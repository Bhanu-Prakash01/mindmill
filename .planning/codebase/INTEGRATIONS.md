# External Integrations

**Analysis Date:** 2026-04-12

## APIs & External Services

**Email Service:**
- SMTP (configured via nodemailer) - Used for sending emails
  - SDK/Client: nodemailer package
  - Auth: SMTP credentials (SMTP_USER, SMTP_PASS, SMTP_HOST, SMTP_PORT, SMTP_SECURE, FROM_EMAIL, FROM_NAME)

**File Processing:**
- SheetJS (xlsx) - Used for Excel file import/export
  - SDK/Client: xlsx package
  - Auth: None required (local processing)

**HTTP Client:**
- Axios - Used for frontend to backend communication
  - SDK/Client: axios package
  - Auth: JWT tokens (stored in localStorage/session)

## Data Storage

**Databases:**
- MongoDB
  - Connection: MONGODB_URI environment variable
  - Client: Mongoose ODM (mongoose package)

**File Storage:**
- Local filesystem only (via multer for uploads)
  - Uploads directory: backend/uploads/

**Caching:**
- None detected

## Authentication & Identity

**Auth Provider:**
- Custom JWT-based authentication
  - Implementation: jsonwebtoken package for token generation/validation
  - Secret: JWT_SECRET environment variable
  - Tokens stored in frontend localStorage/session
  - Routes protected by middleware checking Authorization header

## Monitoring & Observability

**Error Tracking:**
- None detected (basic error handling via middleware)

**Logs:**
- Morgan HTTP logger (morgan package) - logs HTTP requests
- Console.error for application errors
- Winston or similar not implemented

## CI/CD & Deployment

**Hosting:**
- Not configured (designed for self-hosted deployment)

**CI Pipeline:**
- None detected (no CI configuration files found)

## Environment Configuration

**Required env vars:**
- MONGODB_URI - MongoDB connection string
- JWT_SECRET - Secret for JWT signing
- JWT_EXPIRE - Access token expiration (default: 24h)
- JWT_REFRESH_EXPIRE - Refresh token expiration (default: 7d)
- SMTP_HOST - Email server host
- SMTP_PORT - Email server port
- SMTP_SECURE - Whether to use SSL/TLS for email
- SMTP_USER - Email username
- SMTP_PASS - Email password
- FROM_EMAIL - Sender email address
- FROM_NAME - Sender name
- FRONTEND_URL - Frontend URL for generating links
- PORT - Server port (default: 5005)
- NODE_ENV - Environment (development/production/test)

**Secrets location:**
- Environment variables (.env files)
- Never committed to repository (.env in .gitignore)

## Webhooks & Callbacks

**Incoming:**
- None detected

**Outgoing:**
- None detected (no outbound webhook implementations)

---

*Integration audit: 2026-04-12*