import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';


// Layouts
import MainLayout from './layouts/MainLayout';
import AuthLayout from './layouts/AuthLayout';

// Pages
import Login from './pages/auth/Login';
import SuperAdminDashboard from './pages/dashboard/SuperAdminDashboard';
import AdminDashboard from './pages/dashboard/AdminDashboard';
import UserDashboard from './pages/dashboard/UserDashboard';

// Users
import Users from './pages/users/Users';
import Groups from './pages/groups/Groups';
import GroupMembers from './pages/groups/GroupMembers';

// Assessments
import Assessments from './pages/assessments/Assessments';
import AssessmentForm from './pages/assessments/AssessmentForm';

// Test Taking
import TakeTest from './pages/test/TakeTest';
import PublicTest from './pages/test/PublicTest';
import Big5Test from './pages/assessments/Big5Test';
import DiscTest from './pages/assessments/DiscTest';

// Reports
import Reports from './pages/reports/Reports';
import ReportDetail from './pages/reports/ReportDetail';
import Big5Report from './pages/reports/Big5Report';
import DiscReport from './pages/reports/DiscReport';

// Credits
import Credits from './pages/credits/Credits';

// Support
import Support from './pages/support/Support';
import TicketDetail from './pages/support/TicketDetail';

// Settings
import Settings from './pages/settings/Settings';

// Question Bank
import QuestionBankList from './pages/question-banks/QuestionBankList';
import QuestionBankDetail from './pages/question-banks/QuestionBankDetail';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
 const { isAuthenticated, user, loading } = useAuth();

 if (loading) {
 return (
 <div className="min-h-screen flex items-center justify-center">
 <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
 </div>
 );
 }

 if (!isAuthenticated) {
 return <Navigate to="/login" replace />;
 }

 if (allowedRoles && !allowedRoles.includes(user?.role)) {
 return <Navigate to="/" replace />;
 }

 return children;
};

// Role-based Dashboard Redirect
const DashboardRedirect = () => {
 const { user } = useAuth();

 if (user?.role === 'superadmin') {
 return <Navigate to="/dashboard/superadmin" replace />;
 } else if (user?.role === 'admin') {
 return <Navigate to="/dashboard/admin" replace />;
 } else {
 return <Navigate to="/dashboard/user" replace />;
 }
};

const AppRoutes = () => {
 return (
 <Routes>
 {/* Public Routes */}
 <Route element={<AuthLayout />}>
 <Route path="/login" element={<Login />} />
 </Route>

 {/* Protected Routes */}
 <Route
 element={
 <ProtectedRoute>
 <MainLayout />
 </ProtectedRoute>
 }
 >
 {/* Dashboard Routes */}
 <Route path="/" element={<DashboardRedirect />} />

 <Route
 path="/dashboard/superadmin"
 element={
 <ProtectedRoute allowedRoles={['superadmin']}>
 <SuperAdminDashboard />
 </ProtectedRoute>
 }
 />

 <Route
 path="/dashboard/admin"
 element={
 <ProtectedRoute allowedRoles={['admin', 'superadmin']}>
 <AdminDashboard />
 </ProtectedRoute>
 }
 />

 <Route
 path="/dashboard/user"
 element={
 <ProtectedRoute allowedRoles={['user', 'admin', 'superadmin']}>
 <UserDashboard />
 </ProtectedRoute>
 }
 />

 {/* Users */}
 <Route
 path="/users"
 element={
 <ProtectedRoute allowedRoles={['admin', 'superadmin']}>
 <Users />
 </ProtectedRoute>
 }
 />
 <Route
 path="/groups"
 element={
 <ProtectedRoute allowedRoles={['admin', 'superadmin']}>
 <Groups />
 </ProtectedRoute>
 }
 />
 <Route
 path="/groups/:id/members"
 element={
 <ProtectedRoute allowedRoles={['admin', 'superadmin']}>
 <GroupMembers />
 </ProtectedRoute>
 }
 />

  {/* Assessments */}
  <Route
  path="/assessments"
  element={
  <ProtectedRoute>
  <Assessments />
  </ProtectedRoute>
  }
  />
  <Route
  path="/assessments/create"
  element={
  <ProtectedRoute allowedRoles={['superadmin']}>
  <AssessmentForm />
  </ProtectedRoute>
  }
  />
  <Route
  path="/assessments/:id"
  element={
  <ProtectedRoute allowedRoles={['superadmin']}>
  <AssessmentForm />
  </ProtectedRoute>
  }
  />
  <Route
  path="/assessments/:id/take"
  element={
  <ProtectedRoute>
  <TakeTest />
  </ProtectedRoute>
  }
  />
  <Route
  path="/assessments/:id/big5"
  element={
  <ProtectedRoute>
  <Big5Test />
  </ProtectedRoute>
  }
  />
  <Route
  path="/assessments/:id/disc"
  element={
  <ProtectedRoute>
  <DiscTest />
  </ProtectedRoute>
  }
  />
  <Route
  path="/take/:token"
  element={<PublicTest />}
  />
  <Route
  path="/take/:token/big5/:attemptId"
  element={<Big5Test />}
  />
  <Route
  path="/take/:token/disc/:attemptId"
  element={<DiscTest />}
  />
  <Route
  path="/take/:token/test/:attemptId"
  element={<TakeTest />}
  />
 <Route
 path="/reports/big5/:attemptId"
 element={
 <ProtectedRoute>
 <Big5Report />
 </ProtectedRoute>
 }
 />
 <Route
 path="/reports/disc/:attemptId"
 element={
 <ProtectedRoute>
 <DiscReport />
 </ProtectedRoute>
 }
 />

 {/* Reports */}
 <Route
 path="/reports"
 element={
 <ProtectedRoute>
 <Reports />
 </ProtectedRoute>
 }
 />
 <Route
 path="/reports/:id"
 element={
 <ProtectedRoute>
 <ReportDetail />
 </ProtectedRoute>
 }
 />

 {/* Credits */}
 <Route
 path="/credits"
 element={
 <ProtectedRoute>
 <Credits />
 </ProtectedRoute>
 }
 />

 {/* Support */}
 <Route
 path="/support"
 element={
 <ProtectedRoute>
 <Support />
 </ProtectedRoute>
 }
 />
 <Route
 path="/support/:id"
 element={
 <ProtectedRoute>
 <TicketDetail />
 </ProtectedRoute>
 }
 />

 {/* Settings */}
 <Route
 path="/settings"
 element={
 <ProtectedRoute>
 <Settings />
 </ProtectedRoute>
 }
 />

 {/* Question Bank (Super Admin Only) */}
 <Route
 path="/question-banks"
 element={
 <ProtectedRoute allowedRoles={['superadmin']}>
 <QuestionBankList />
 </ProtectedRoute>
 }
 />
 <Route
 path="/question-banks/:assessmentId/sets/:dimension"
 element={
 <ProtectedRoute allowedRoles={['superadmin']}>
 <QuestionBankDetail />
 </ProtectedRoute>
 }
 />
 </Route>

 {/* Catch all */}
 <Route path="*" element={<Navigate to="/" replace />} />
 </Routes>
 );
};

function App() {
 return (
 <AuthProvider>
 <Router>
 <AppRoutes />
 </Router>
 </AuthProvider>
 );
}

export default App;
