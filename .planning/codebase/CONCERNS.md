# Codebase Concerns

**Analysis Date:** 2026-04-12

## Tech Debt

**[Large Controller Files]:**
- Issue: Several backend controllers exceed 1000 lines, indicating potential god objects violating SRP
- Files: `backend/controllers/assessmentController.js` (1821 lines), `backend/controllers/attemptController.js` (1363 lines)
- Impact: Difficult to maintain, test, and understand; increased risk of bugs during modifications
- Fix approach: Split into smaller, focused controllers by responsibility (e.g., separate assessment creation, retrieval, updating logic)

**[Inconsistent Service Layer Implementation]:**
- Issue: Some business logic resides in controllers rather than services, breaking separation of concerns
- Files: Multiple controllers show direct database/model interactions instead of service delegation
- Impact: Tight coupling between presentation and data layers; hinders reusability and testing
- Fix approach: Move all business logic to service layer; controllers should only handle request/response coordination

**[Missing Environment Validation]:**
- Issue: No validation of required environment variables at startup
- Files: `backend/server.js` (and other files using process.env)
- Impact: Application may fail unpredictably at runtime if required vars missing; poor developer experience
- Fix approach: Implement startup validation that checks for required env vars and exits with clear error messages

## Known Bugs

**[Incomplete Email Implementation]:**
- Symptoms: TODO comment indicates email sending not implemented for report sharing
- Files: `backend/controllers/reportController.js:143` - `// TODO: Send email with share link`
- Trigger: When users attempt to share reports via email
- Workaround: Manual sharing of share links outside the system
- Fix approach: Implement email sending using existing nodemailer configuration and emailService

## Security Considerations

**[Environment File Exposure Risk]:**
- Risk: Environment files exist in repository root and frontend (though .gitignored)
- Files: `./.env`, `./frontend/.env.local`, `./frontend/.env.production`, `./backend/.env`
- Current mitigation: .gitignore includes .env* patterns
- Recommendations: 
  - Add pre-commit hook to prevent accidental env file commits
  - Consider using vault or secret manager for production
  - Document required env vars in README.example.env or similar

**[JWT Secret Default Value]:**
- Risk: Default JWT secret visible in source code
- Files: `backend/config/jwt.js` - line 3 shows default value
- Current mitigation: None visible (default value may be used if env var not set)
- Recommendations: 
  - Remove default value and require JWT_SECRET to be set
  - Add startup validation to ensure strong secret is configured
  - Consider RS256 algorithm for asymmetric key security

## Performance Bottlenecks

**[Synchronous File Operations in Requests]:**
- Problem: File upload processing may block event loop during large file handling
- Files: `backend/config/multer.js` and controllers using multer
- Cause: Multer processes uploads synchronously by default
- Improvement path: 
  - Configure multer with storage limits and file filters
  - Consider offloading file processing to background jobs/queues
  - Implement streaming for large file processing

**[N+1 Query Risk in Report Generation]:**
- Problem: Potential for multiple database queries when generating reports with related data
- Files: `backend/services/reportService.js` (inferred from assessment service patterns)
- Cause: Loading assessments then separately querying for users, organizations, etc.
- Improvement path: 
  - Use Mongoose populate() strategically
  - Implement aggregation pipelines for complex data retrieval
  - Add query monitoring/logging to identify slow operations

## Fragile Areas

**[Authentication Middleware]:**
- Files: `backend/middleware/auth.js` (inferred from usage)
- Why fragile: Centralized auth protection; if broken, affects all protected routes
- Safe modification: 
  - Unit test middleware in isolation
  - Maintain backward compatibility for token formats
  - Test with expired, malformed, and missing tokens
- Test coverage: Limited observed; would benefit from dedicated auth middleware tests

**[File Upload Handling]:**
- Files: `backend/config/multer.js` and upload controllers
- Why fragile: Direct filesystem interaction; disk space, permissions, file type validation critical
- Safe modification: 
  - Validate file types and sizes strictly
  - Test error conditions (disk full, permission denied)
  - Consider virus scanning for uploads in security-sensitive contexts
- Test coverage: Manual testing likely; automated tests would improve reliability

## Scaling Limits

**[Database Connection Pool]:**
- Current capacity: Default Mongoose connection pool size
- Limit: Under high concurrent load, may exhaust available DB connections
- Scaling path: 
  - Configure explicit pool size in mongoose.connect options
  - Monitor connection usage and wait times
  - Consider connection pooling at application level (e.g., with generic-pool)

**[Memory Usage in Large File Processing]:**
- Current capacity: Limited by Node.js memory constraints
- Limit: Large assessment files or batch operations may cause OOM
- Scaling path: 
  - Implement streaming processing for large datasets
  - Add job queues for memory-intensive operations
  - Set and enforce memory limits per operation type

## Dependencies at Risk

**[Outdated Lodash-equivalent Usage]:**
- Risk: Manual object/array utilities may replicate lodash functionality suboptimally
- Impact: Inconsistent performance, potential bugs, missed optimization opportunities
- Migration plan: 
  - Audit utility functions in frontend/src/utils/ and backend/utils/ (if exists)
  - Standardize on lodash or native JS equivalents where appropriate
  - Ensure consistent imports and usage patterns

## Missing Critical Features

**[Rate Limiting Per-User/IP]:**
- Problem: Global rate limiting exists but not sophisticated per-user or per-endpoint limits
- Blocks: Preventing brute force attacks on specific endpoints (auth, password reset)
- Current state: Basic express-rate-limit applied globally
- Needed feature: 
  - Different limits for auth endpoints vs API endpoints
  - Per-IP and per-user tracking for sensitive operations
  - Distributed rate limiting for multi-instance deployments

**[API Versioning]:**
- Problem: No versioning strategy for backend APIs
- Blocks: Safe evolution of API without breaking existing clients
- Current state: All APIs under unversioned paths (/api/*)
- Needed feature: 
  - URL versioning (/api/v1/*) or header versioning
  - Deprecation policy and sunset timeline
  - Backward compatibility guarantees for minor versions

## Test Coverage Gaps

**[Complete Lack of Automated Testing]:**
- What's not tested: All business logic, API endpoints, authentication flows, data validation
- Files: Entire codebase lacks *.test.* or *.spec.* files
- Risk: Regressions undetected until user impact; refactoring dangerous without safety net
- Priority: High
- Required action: 
  - Establish testing framework (Jest/Vitest + Supertest for backend, React Testing Library for frontend)
  - Write unit tests for services and utilities
  - Write integration tests for API endpoints
  - Implement test coverage reporting (target 80%+)

**[Authentication Flow Testing]:**
- What's not tested: Login, token refresh, middleware protection, role-based access
- Files: Auth-related files (authController.js, authService.js, AuthContext.jsx, middleware)
- Risk: Security vulnerabilities or access control bypasses undetected
- Priority: High
- Required action: 
  - Test valid/invalid credential handling
  - Test token expiration and refresh flows
  - Test protected route access with various token states
  - Test role-based authorization boundaries

**[File Upload/Download Testing]:**
- What's not tested: Upload validation, file type restrictions, download correctness, error handling
- Files: Multer config, upload controllers, file serving endpoints
- Risk: Security issues (malicious file uploads), broken functionality, storage exhaustion
- Priority: Medium
- Required action: 
  - Test file type and size validation
  - Test successful upload/download cycles
  - Test error conditions (wrong type, too large, storage full)
  - Test file naming and conflict resolution

---

*Concerns audit: 2026-04-12*