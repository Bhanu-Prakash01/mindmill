import React, { useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useParams, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';


// Layouts
import MainLayout from './layouts/MainLayout';
import SuperAdminLayout from './layouts/SuperAdminLayout';
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

// Test Takers
import TestTakers from './pages/test-takers/TestTakers';

// Support
import Support from './pages/support/Support';
import TicketDetail from './pages/support/TicketDetail';

// Settings
import Settings from './pages/settings/Settings';

// Organization
import OrganizationProfile from './pages/organization/OrganizationProfile';

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

// SuperAdmin Dashboard Redirect (at root)
const SuperAdminRedirect = () => {
 const { user, loading, isAuthenticated, logout } = useAuth();
 const navigate = useNavigate();

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

 if (user?.role === 'superadmin') {
 return <Navigate to="/dashboard/superadmin" replace />;
 }

 if (user?.organization?.slug) {
 return <Navigate to={`/o/${user.organization.slug}/`} replace />;
 }

 return (
 <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
 <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
 <h2 className="text-2xl font-bold text-gray-900 mb-2">Account Error</h2>
 <p className="text-gray-600 mb-6">Your account is not associated with any active organization. Please contact support.</p>
 <button 
 onClick={() => { logout(); navigate('/login'); }} 
 className="w-full bg-primary-600 text-white font-medium py-2 px-4 rounded hover:bg-primary-700 transition"
 >
 Logout
 </button>
 </div>
 </div>
 );
};

// Org Dashboard Redirect (under /o/:orgSlug)
const OrgDashboardRedirect = () => {
 const { user, loading } = useAuth();
 const { orgSlug } = useParams();

 if (loading) {
 return (
 <div className="min-h-screen flex items-center justify-center">
 <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
 </div>
 );
 }

 if (!orgSlug) {
 return <Navigate to="/login" replace />;
 }

 if (user?.role === 'superadmin') {
 return <Navigate to="/dashboard/superadmin" replace />;
 } else if (user?.role === 'admin') {
 return <Navigate to={`/o/${orgSlug}/dashboard/admin`} replace />;
 } else {
 return <Navigate to={`/o/${orgSlug}/dashboard/user`} replace />;
 }
};

const AppRoutes = () => {
 return (
 <Routes>
   {/* Public Routes (no org prefix) */}
   <Route element={<AuthLayout />}>
   <Route path="/login" element={<Login />} />
   </Route>

   {/* Public Organization Profile */}
   <Route path="/org/:slug" element={<OrganizationProfile />} />

   {/* Public Test Taking (no auth, no org prefix) */}
   <Route path="/take/:token" element={<PublicTest />} />
   <Route path="/take/:token/big5/:attemptId" element={<Big5Test />} />
   <Route path="/take/:token/disc/:attemptId" element={<DiscTest />} />
   <Route path="/take/:token/test/:attemptId" element={<TakeTest />} />
   {/* Category-prefixed invite URLs (e.g., /take/big5/{token}) */}
   <Route path="/take/:category/:token" element={<PublicTest />} />
   <Route path="/take/:category/:token/big5/:attemptId" element={<Big5Test />} />
   <Route path="/take/:category/:token/disc/:attemptId" element={<DiscTest />} />
   <Route path="/take/:category/:token/test/:attemptId" element={<TakeTest />} />

    {/* SuperAdmin Routes (at root, auth required) */}
    <Route
    element={
    <ProtectedRoute allowedRoles={['superadmin']}>
    <SuperAdminLayout />
    </ProtectedRoute>
    }
    >
    <Route path="/dashboard/superadmin" element={<SuperAdminDashboard />} />
    <Route path="/users" element={<Users />} />
    <Route path="/groups" element={<Groups />} />
    <Route path="/groups/:id/members" element={<GroupMembers />} />
    <Route path="/assessments" element={<Assessments />} />
    <Route path="/assessments/create" element={<AssessmentForm />} />
    <Route path="/assessments/:id" element={<AssessmentForm />} />
    <Route path="/reports" element={<Reports />} />
    <Route path="/reports/:id" element={<ReportDetail />} />
    <Route path="/reports/big5/:attemptId" element={<Big5Report />} />
    <Route path="/reports/disc/:attemptId" element={<DiscReport />} />
    <Route path="/credits" element={<Credits />} />
    <Route path="/support" element={<Support />} />
    <Route path="/support/:id" element={<TicketDetail />} />
    <Route path="/settings" element={<Settings />} />
    </Route>

   {/* Root redirect */}
   <Route path="/" element={<SuperAdminRedirect />} />

   {/* Org-Scoped Routes under /o/:orgSlug */}
   <Route path="/o/:orgSlug">
   {/* Org Login (no auth required) */}
   <Route element={<AuthLayout />}>
   <Route path="login" element={<Login />} />
   </Route>

   {/* Org Protected Routes */}
   <Route
   element={
   <ProtectedRoute>
   <MainLayout />
   </ProtectedRoute>
   }
   >
   {/* Dashboard */}
   <Route index element={<OrgDashboardRedirect />} />
   <Route
   path="dashboard/admin"
   element={
   <ProtectedRoute allowedRoles={['admin', 'superadmin']}>
   <AdminDashboard />
   </ProtectedRoute>
   }
   />
   <Route
   path="dashboard/user"
   element={
   <ProtectedRoute allowedRoles={['user', 'admin', 'superadmin']}>
   <UserDashboard />
   </ProtectedRoute>
   }
   />

   {/* Users */}
   <Route
   path="users"
   element={
   <ProtectedRoute allowedRoles={['admin', 'superadmin']}>
   <Users />
   </ProtectedRoute>
   }
   />
    <Route
    path="groups"
    element={
    <ProtectedRoute allowedRoles={['admin', 'superadmin', 'user']}>
    <Groups />
    </ProtectedRoute>
    }
    />
    <Route
    path="groups/:id/members"
    element={
    <ProtectedRoute allowedRoles={['admin', 'superadmin', 'user']}>
   <GroupMembers />
   </ProtectedRoute>
   }
   />

   {/* Assessments */}
   <Route
   path="assessments"
   element={
   <ProtectedRoute>
   <Assessments />
   </ProtectedRoute>
   }
   />
   <Route
   path="assessments/create"
   element={
   <ProtectedRoute allowedRoles={['superadmin']}>
   <AssessmentForm />
   </ProtectedRoute>
   }
   />
   <Route
   path="assessments/:id"
   element={
   <ProtectedRoute allowedRoles={['superadmin']}>
   <AssessmentForm />
   </ProtectedRoute>
   }
   />
   <Route
   path="assessments/:id/take"
   element={
   <ProtectedRoute>
   <TakeTest />
   </ProtectedRoute>
   }
   />
   <Route
   path="assessments/:id/big5"
   element={
   <ProtectedRoute>
   <Big5Test />
   </ProtectedRoute>
   }
   />
   <Route
   path="assessments/:id/disc"
   element={
   <ProtectedRoute>
   <DiscTest />
   </ProtectedRoute>
   }
   />

   {/* Reports */}
   <Route
   path="reports"
   element={
   <ProtectedRoute>
   <Reports />
   </ProtectedRoute>
   }
   />
   <Route
   path="reports/:id"
   element={
   <ProtectedRoute>
   <ReportDetail />
   </ProtectedRoute>
   }
   />
   <Route
   path="reports/big5/:attemptId"
   element={
   <ProtectedRoute>
   <Big5Report />
   </ProtectedRoute>
   }
   />
   <Route
   path="reports/disc/:attemptId"
   element={
   <ProtectedRoute>
   <DiscReport />
   </ProtectedRoute>
   }
   />

   {/* Credits */}
   <Route
   path="credits"
   element={
   <ProtectedRoute>
   <Credits />
   </ProtectedRoute>
   }
   />

   {/* Test Takers */}
   <Route
   path="test-takers"
   element={
   <ProtectedRoute>
   <TestTakers />
   </ProtectedRoute>
   }
   />

   {/* Support */}
   <Route
   path="support"
   element={
   <ProtectedRoute>
   <Support />
   </ProtectedRoute>
   }
   />
   <Route
   path="support/:id"
   element={
   <ProtectedRoute>
   <TicketDetail />
   </ProtectedRoute>
   }
   />

   {/* Settings */}
   <Route
   path="settings"
   element={
   <ProtectedRoute>
   <Settings />
   </ProtectedRoute>
   }
   />
   </Route>
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
