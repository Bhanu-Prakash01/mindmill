# Coding Conventions

**Analysis Date:** 2026-04-12

## Naming Patterns

**Files:**
- Backend: camelCase for service/controller files (userService.js, authController.js)
- Backend: PascalCase for model files (User.js, Assessment.js)
- Frontend: camelCase for component/files (UserAvatar.jsx, AuthContext.jsx)
- Frontend: PascalCase for React components (App.jsx, MainLayout.jsx)
- Configuration: Matching tool convention (vite.config.js, tailwind.config.js)

**Functions:**
- Backend: camelCase (createUser, validatePassword, generateToken)
- Frontend: camelCase (handleLogin, fetchUserData, updateProfile)
- Event handlers: prefixed with 'handle' (handleSubmit, handleChange, handleClick)

**Variables:**
- Backend: camelCase (userId, accessToken, refreshToken)
- Frontend: camelCase (userData, isLoading, errorMessage)
- Constants: UPPER_SNAKE_CASE (DEFAULT_PAGE_SIZE, MAX_UPLOAD_SIZE)

**Types:**
- Backend: Not applicable (JavaScript, no TypeScript)
- Frontend: Not applicable (JavaScript, no TypeScript)
- JSDoc types seen in some files: {string}, {number}, {boolean}, {Object}, {Array}

## Code Style

**Formatting:**
- Tool: Prettier (inferred from code consistency and lack of configuration)
- Key settings: 
  - Print width: ~100 chars (inferred)
  - Tab width: 2 spaces
  - Use tabs: false (spaces preferred)
  - Semicolons: consistently used
  - Single quotes: used for strings

**Linting:**
- Tool: ESLint 8.55.0 (from devDependencies)
- Configuration: Inferred from eslint script in package.json
- Key rules (from script flags):
  - `report-unused-disable-directives`: Warn when eslint disable comments are unused
  - `max-warnings`: 0 (treat warnings as errors)
  - Extensions: js,jsx
- Additional rules inferred from code:
  - react/react-in-jsx-scope: off (due to new JSX transform)
  - react-hooks/rules-of-hooks: enforced
  - react-hooks/exhaustive-deps: enforced

## Import Organization

**Order:**
1. React imports (React, ReactDOM, etc.)
2. Third-party libraries (axios, lodash, etc.)
3. Internal services and utilities (from '../services/', from '../utils/')
4. Internal components (from './components/', from '../components/')
5. Styles and assets (from './styles/', from '../assets/')

**Path Aliases:**
- None detected (relative paths used exclusively)
- Examples of imports:
  - `import React from 'react'`
  - `import { authService } from '../services/authService';`
  - `import UserAvatar from '../components/UserAvatar.jsx';`

## Error Handling

**Patterns:**
- Backend: 
  - Try/catch blocks in controller functions
  - Forward errors to next(error) for centralized handling
  - Custom error classes not observed (uses standard Error objects)
  - Validation errors handled by express-validator middleware
- Frontend:
  - Try/catch in service functions
  - Error states managed via React state (useState)
  - Error boundaries not observed
  - User-friendly error messages displayed in UI components

## Logging

**Framework:** 
- Backend: morgan package for HTTP requests, console.error for application errors
- Frontend: console.log/console.error for debugging (no dedicated logging library)

**Patterns:**
- Backend:
  - HTTP request logging: morgan('dev') middleware
  - Error logging: console.error in error handler middleware
  - Info logging: Occasional console.log in services (not systematic)
- Frontend:
  - Debug logging: console.log in development (observed in some services)
  - Error logging: console.error in catch blocks
  - No production logging stripping

## Comments

**When to Comment:**
- Complex logic explanations
- Non-obvious business rules
- TODO/FIXME markers for future work
- Function parameter/return descriptions (JSDoc style)

**JSDoc/TSDoc:**
- Pattern: Observed in some service files
- Format: 
  ```
  /**
   * Description of function
   * @param {type} paramName - Description
   * @returns {type} Description
   */
  ```
- Usage: Inconsistent (some files have JSDoc, others don't)
- Tags used: @param, @returns, @description, @todo

## Function Design

**Size:** 
- Functions generally small (<20 lines)
- Larger functions broken into smaller helpers
- No strict line limit observed but preference for readability

**Parameters:** 
- Maximum 3-4 parameters preferred
- Objects used for parameter groups (>3 parameters)
- Callback parameters typically last
- Error-first callback pattern not used (promises/async-await preferred)

**Return Values:** 
- Consistent return types per function
- Early returns for error conditions
- Objects for multiple related values
- Arrays for collections
- Promises for asynchronous operations (handled with async/await)

## Module Design

**Exports:** 
- Backend: Named exports for functions/classes (module.exports = { functionName })
- Frontend: Named and default exports (export function ComponentName, export default Component)
- Services: Typically export instance or named functions
- Constants: Named exports (export const CONSTANT = value)

**Barrel Files:** 
- Not detected (no index.js export files in directories)
- Direct imports from files preferred

---

*Convention analysis: 2026-04-12*