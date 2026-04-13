# Codebase Structure

**Analysis Date:** 2026-04-12

## Directory Layout

```
[mindmill_]/
├── backend/                 # Backend Node.js/Express API
├── frontend/                # Frontend React/Vite application
├── node_modules/            # Root-level dependencies (concurrently)
├── .planning/               # GSD planning documents
├── .qoder/                  # Qoder IDE configuration
├── arms_cache/              # Cached data (likely from external APIs)
├── tests_questions_set/     # Test question datasets (Big5, etc.)
├── package.json             # Root package.json with workspaces
├── README.md                # Project documentation
├── .env                     # Root environment variables
├── deploy.sh                # Deployment script
└── testscript.js            # Testing/utility script
```

## Directory Purposes

**[backend]:**
- Purpose: Server-side API and business logic
- Contains: 
  - `controllers/` - Request handlers for each entity
  - `routes/` - API route definitions
  - `services/` - Business logic layer
  - `models/` - Database models (Mongoose schemas)
  - `middleware/` - Custom middleware (auth, validation, error handling)
  - `config/` - Configuration files (database, JWT, multer)
  - `seeds/` and `seeders/` - Database seeding scripts
  - `uploads/` - File upload storage (organized by type)
  - `server.js` - Application entry point
  - `docker-compose.yml` - Development environment configuration

**[frontend]:**
- Purpose: Client-side user interface
- Contains:
  - `src/` - Source code
    - `components/` - Reusable UI components
    - `pages/` - Page components mapped to routes
    - `layouts/` - Page layouts (Main, Admin, Auth, etc.)
    - `context/` - React context providers (Auth, Theme)
    - `services/` - API service layer
    - `styles/` - Global CSS and styling
    - `utils/` - Utility functions
    - `App.jsx` - Root application component
    - `main.jsx` - Application entry point
  - `public/` - Static assets
  - `dist/` - Production build output
  - Configuration files: `vite.config.js`, `tailwind.config.js`, `postcss.config.js`

**[backend/controllers]:**
- Purpose: Handle HTTP requests and coordinate responses
- Contains: One controller per entity/resource (user, assessment, report, etc.)
- Key files: `authController.js`, `userController.js`, `assessmentController.js`, `reportController.js`

**[backend/services]:**
- Purpose: Encapsulate business logic and data operations
- Contains: Service classes that interact with models
- Key files: `userService.js`, `assessmentService.js`, `reportService.js`, `authService.js`

**[backend/models]:**
- Purpose: Define data structures and database interactions
- Contains: Mongoose schema definitions
- Key files: `User.js`, `Assessment.js`, `Report.js`, `Organization.js`

**[backend/routes]:**
- Purpose: Define API endpoints and route grouping
- Contains: Route files organized by entity
- Key files: `authRoutes.js`, `userRoutes.js`, `assessmentRoutes.js`, `reportRoutes.js`

**[frontend/src/components]:**
- Purpose: Reusable, presentational UI components
- Contains: Atomic and compound components (modals, avatars, buttons, etc.)
- Key files: `UserAvatar.jsx`, `AddTestTakerModal.jsx`, `AssessmentAssignmentModal.jsx`

**[frontend/src/pages]:**
- Purpose: Route-mapped page components representing views
- Contains: Organized by feature area (auth, dashboard, assessments, reports, etc.)
- Key files: `Login.jsx`, `SuperAdminDashboard.jsx`, `AssessmentForm.jsx`, `ReportDetail.jsx`

**[frontend/src/services]:**
- Purpose: Handle API communication and data processing
- Contains: Service modules that wrap API endpoints
- Key files: `api.js` (base client), `authService.js`, `userService.js`, `assessmentService.js`

**[frontend/src/context]:**
- Purpose: Global state management via React Context API
- Contains: Context providers and hooks
- Key files: `AuthContext.jsx` (authentication state), `ThemeContext.jsx` (theme preferences)

**[frontend/src/layouts]:**
- Purpose: Wrapper components providing consistent page structure
- Contains: Layout components for different user types
- Key files: `MainLayout.jsx` (standard users), `AdminDashboard.jsx` (admins), `SuperAdminLayout.jsx` (super admins), `AuthLayout.jsx` (login/register pages)

## Key File Locations

**Entry Points:**
- `frontend/src/main.jsx`: Frontend application entry point
- `backend/server.js`: Backend API entry point

**Configuration:**
- `backend/config/database.js`: MongoDB connection configuration
- `backend/config/jwt.js`: JWT secret and expiration settings
- `backend/config/multer.js`: File upload configuration
- `frontend/vite.config.js`: Vite build and development server configuration
- `frontend/tailwind.config.js`: Tailwind CSS configuration
- `frontend/postcss.config.js`: PostCSS plugin configuration

**Core Logic:**
- `backend/services/`: Business logic implementations
- `backend/controllers/: Request handling and response coordination
- `frontend/src/services/`: API communication and data transformation
- `frontend/src/pages/`: View-specific logic and UI

**Testing:**
- `tests_questions_set/`: Contains test question datasets (Big5, DISC, etc.)
- No dedicated test source directories detected (testing appears to be manual or via testscript.js)

## Naming Conventions

**Files:**
- Backend: camelCase for service/controller files (userService.js, authController.js)
- Backend: PascalCase for model files (User.js, Assessment.js)
- Frontend: camelCase for component/files (UserAvatar.jsx, AuthContext.jsx)
- Frontend: PascalCase for React components (App.jsx, MainLayout.jsx)
- Configuration: snake_case or matching tool convention (vite.config.js, tailwind.config.js)

**Directories:**
- Backend: plural lowercase nouns (controllers, services, models, routes)
- Frontend: plural lowercase nouns (components, pages, services, contexts)
- Feature grouping: lowercase singular/plural based on context (assessments, users, reports)

## Where to Add New Code

**New Feature (Backend):**
- Model: `backend/models/[EntityName].js`
- Service: `backend/services/[entityName]Service.js`
- Controller: `backend/controllers/[entityName]Controller.js`
- Routes: `backend/routes/[entityName]Routes.js`
- Register routes in `backend/server.js`

**New Feature (Frontend):**
- Component (reusable): `frontend/src/components/[ComponentName].jsx`
- Page (route-mapped): `frontend/src/pages/[Feature]/[PageName].jsx`
- Service: `frontend/src/services/[entityName]Service.js`
- Add route to `frontend/src/App.jsx` in Routes section

**New Utility/Helper:**
- Backend: `backend/utils/` directory (create if needed) or appropriate service
- Frontend: `frontend/src/utils/[utilityName].js`

**New API Endpoint:**
- Add route file: `backend/routes/[newEntity]Routes.js`
- Create controller: `backend/controllers/[newEntity]Controller.js`
- Create service: `backend/services/[newEntity]Service.js`
- Create model: `backend/models/[newEntity].js`
- Import and use in `backend/server.js`

## Special Directories

**[backend/uploads]:**
- Purpose: Stores file uploads organized by type
- Contains: Subdirectories for attachments, avatars, banners, logos, questions
- Generated: Yes (via multer uploads)
- Committed: No (only in .gitignore, but directory structure committed)

**[backend/seeds] and [backend/seeders]:**
- Purpose: Database seeding scripts for initial/test data
- Contains: JavaScript files that populate MongoDB collections
- Generated: No
- Committed: Yes

**[frontend/dist]:**
- Purpose: Production build output
- Contains: Minified HTML, CSS, JS assets
- Generated: Yes (via `npm run build`)
- Committed: No (in .gitignore)

**[.planning]:**
- Purpose: GSD-generated planning documents
- Contains: STACK.md, INTEGRATIONS.md, ARCHITECTURE.md, STRUCTURE.md, etc.
- Generated: Yes (by GSD commands)
- Committed: Yes (for AI context sharing)

---

*Structure analysis: 2026-04-12*