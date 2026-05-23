import React, { useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useParams, useNavigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';


// Layouts
import MainLayout from './layouts/MainLayout';
import SuperAdminLayout from './layouts/SuperAdminLayout';
import AuthLayout from './layouts/AuthLayout';
import IndividualLayout from './layouts/IndividualLayout';

// Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import SuperAdminDashboard from './pages/dashboard/SuperAdminDashboard';
import AdminDashboard from './pages/dashboard/AdminDashboard';
import UserDashboard from './pages/dashboard/UserDashboard';
import IndividualDashboard from './pages/dashboard/IndividualDashboard';

// Individual pages
import IndividualAssessments from './pages/individual/IndividualAssessments';
import IndividualReports from './pages/individual/IndividualReports';
import IndividualCredits from './pages/individual/IndividualCredits';
import IndividualSupport from './pages/individual/IndividualSupport';
import IndividualProfile from './pages/individual/IndividualProfile';
import AdminResources from './pages/resources/AdminResources';
import UserResources from './pages/resources/UserResources';

// Users
import Users from './pages/users/Users';
import Groups from './pages/groups/Groups';
import GroupMembers from './pages/groups/GroupMembers';

// Assessments
import Assessments from './pages/assessments/Assessments';
import AssessmentForm from './pages/assessments/AssessmentForm';

// Question Forms for Personality Tests
import AddFiroQuestions from './pages/assessments/AddFiroQuestions';
import AddBig5Questions from './pages/assessments/AddBig5Questions';
import AddHoganQuestions from './pages/assessments/AddHoganQuestions';
import AddMbtiQuestions from './pages/assessments/AddMbtiQuestions';
import AddDiscQuestions from './pages/assessments/AddDiscQuestions';
import AddGenericQuestions from './pages/assessments/AddGenericQuestions';

// Test Taking
import TakeTest from './pages/test/TakeTest';
import PublicTest from './pages/test/PublicTest';
import TestTermsAndConditions from './pages/test/TestTermsAndConditions';
import ThankYou from './pages/ThankYou';
import Big5Test from './pages/assessments/Big5Test';
import DiscTest from './pages/assessments/DiscTest';
import HoganTest from './pages/assessments/HoganTest';
import MbtiTest from './pages/assessments/MbtiTest';
import FiroTest from './pages/assessments/FiroTest';

// Reports
import Reports from './pages/reports/Reports';
import ReportDetail from './pages/reports/ReportDetail';
import Big5Report from './pages/reports/Big5Report';
import DiscReport from './pages/reports/DiscReport';
import MbtiReport from './pages/reports/MbtiReport';
import ComprehensiveDiscReport from './pages/reports/ComprehensiveDiscReport';
import ComprehensiveBig5Report from './pages/reports/ComprehensiveBig5Report';
import HoganReport from './pages/reports/HoganReport';
import FiroReport from './pages/reports/FiroReport';
import SimpleReport from './pages/reports/SimpleReport';
import SjtReport from './pages/reports/SjtReport';
import SharedReport from './pages/reports/SharedReport';
import PclaReport from './pages/reports/PclaReport';
import EctiReport from './pages/reports/EctiReport';

// Credits
import Credits from './pages/credits/Credits';

// Test Takers
import TestTakers from './pages/test-takers/TestTakers';

// Support
import Support from './pages/support/Support';
import TicketDetail from './pages/support/TicketDetail';

// Settings
import Settings from './pages/settings/Settings';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';

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

 return children || <Outlet />;
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

 // Individual user (no org) goes to /dashboard
 if (user?.accountType === 'individual' || (!user?.organization && user?.role !== 'superadmin')) {
  return <Navigate to="/dashboard" replace />;
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
   <Route path="/forgot-password" element={<ForgotPassword />} />
   <Route path="/reset-password/:token" element={<ResetPassword />} />
   </Route>

   {/* Free Trial Registration */}
   <Route path="/register" element={<Register />} />
   {/* Public Organization Profile */}
   <Route path="/org/:slug" element={<OrganizationProfile />} />

   {/* Public Test Taking (no auth, no org prefix) */}
   <Route path="/take/:token" element={<PublicTest />} />
<Route path="/take/:token/big5/:attemptId" element={<Big5Test />} />
    <Route path="/take/:token/disc/:attemptId" element={<DiscTest />} />
    <Route path="/take/:token/hogan/:attemptId" element={<HoganTest />} />
    <Route path="/take/:token/mbti/:attemptId" element={<MbtiTest />} />
    <Route path="/take/:token/firo/:attemptId" element={<FiroTest />} />
   <Route path="/take/:token/test/:attemptId" element={<TakeTest />} />
   {/* Category-prefixed invite URLs (e.g., /take/big5/{token}) */}
   <Route path="/take/:category/:token" element={<PublicTest />} />
<Route path="/take/:category/:token/big5/:attemptId" element={<Big5Test />} />
    <Route path="/take/:category/:token/disc/:attemptId" element={<DiscTest />} />
    <Route path="/take/:category/:token/hogan/:attemptId" element={<HoganTest />} />
    <Route path="/take/:category/:token/mbti/:attemptId" element={<MbtiTest />} />
    <Route path="/take/:category/:token/firo/:attemptId" element={<FiroTest />} />
   <Route path="/take/:category/:token/test/:attemptId" element={<TakeTest />} />
   {/* Terms & Conditions before test (public) */}
   <Route path="/take/:token/terms/:attemptId" element={<TestTermsAndConditions />} />
   <Route path="/take/:category/:token/terms/:attemptId" element={<TestTermsAndConditions />} />
   {/* Thank You page (after test submission) */}
    <Route path="/thank-you" element={<ThankYou />} />

     <Route path="/reports/shared/:token" element={<SharedReport />} />

    {/* Report View Routes — accessible to any authenticated user (no role restriction) */}
    <Route element={<ProtectedRoute />}>
      <Route path="/reports/big5/:attemptId" element={<Big5Report />} />
      <Route path="/reports/disc/:attemptId" element={<DiscReport />} />
      <Route path="/reports/mbti/:attemptId" element={<MbtiReport />} />
      <Route path="/reports/hogan/:attemptId" element={<HoganReport />} />
      <Route path="/reports/firo/:attemptId" element={<FiroReport />} />
      <Route path="/reports/situational/:attemptId" element={<SimpleReport />} />
      <Route path="/reports/cognitive/:attemptId" element={<SimpleReport />} />
      <Route path="/reports/aptitude/:attemptId" element={<SimpleReport />} />
      <Route path="/reports/sjt/:attemptId" element={<SjtReport />} />
      <Route path="/reports/pcla/:attemptId" element={<PclaReport />} />
      <Route path="/reports/ecti/:attemptId" element={<EctiReport />} />
      <Route path="/reports/disc/comprehensive/:attemptId" element={<ComprehensiveDiscReport />} />
      <Route path="/reports/big5/comprehensive/:attemptId" element={<ComprehensiveBig5Report />} />
      <Route path="/reports/:id" element={<ReportDetail />} />
    </Route>
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
     <Route path="/test-takers" element={<TestTakers />} />
     <Route path="/assessments" element={<Assessments />} />
<Route path="/assessments/create" element={<AssessmentForm />} />
     <Route path="/assessments/:id" element={<AssessmentForm />} />
     <Route path="/assessments/:id/questions/firo" element={<AddFiroQuestions />} />
     <Route path="/assessments/:id/questions/big5" element={<AddBig5Questions />} />
     <Route path="/assessments/:id/questions/hogan" element={<AddHoganQuestions />} />
     <Route path="/assessments/:id/questions/mbti" element={<AddMbtiQuestions />} />
     <Route path="/assessments/:id/questions/disc" element={<AddDiscQuestions />} />
     <Route path="/assessments/:id/questions/generic" element={<AddGenericQuestions />} />
     <Route path="/reports" element={<Reports />} />
    <Route path="/credits" element={<Credits />} />
    <Route path="/support" element={<Support />} />
    <Route path="/support/:id" element={<TicketDetail />} />
    <Route path="/settings" element={<Settings />} />
    <Route path="/resources" element={<AdminResources />} />
    </Route>

   {/* Root redirect */}
   <Route path="/" element={<SuperAdminRedirect />} />

   {/* Individual Account Routes — wrapped in IndividualLayout */}
   <Route
     element={
       <ProtectedRoute>
         <IndividualLayout />
       </ProtectedRoute>
     }
   >
     <Route path="/dashboard" element={<IndividualDashboard />} />
     <Route path="/individual/assessments" element={<IndividualAssessments />} />
     <Route path="/individual/reports" element={<IndividualReports />} />
     <Route path="/individual/credits" element={<IndividualCredits />} />
      <Route path="/individual/support" element={<IndividualSupport />} />
      <Route path="/individual/support/:id" element={<TicketDetail />} />
      <Route path="/individual/profile" element={<IndividualProfile />} />
      <Route path="/individual/resources" element={<UserResources />} />
    </Route>

   {/* Individual Test-Taking Routes (no sidebar — full-screen pages) */}
   <Route path="/assessments/:id/terms" element={<ProtectedRoute><TestTermsAndConditions /></ProtectedRoute>} />
   <Route path="/assessments/:id/:category/terms" element={<ProtectedRoute><TestTermsAndConditions /></ProtectedRoute>} />
   <Route path="/assessments/:id/take" element={<ProtectedRoute><TakeTest /></ProtectedRoute>} />
   <Route path="/assessments/:id/big5" element={<ProtectedRoute><Big5Test /></ProtectedRoute>} />
   <Route path="/assessments/:id/disc" element={<ProtectedRoute><DiscTest /></ProtectedRoute>} />
   <Route path="/assessments/:id/mbti" element={<ProtectedRoute><MbtiTest /></ProtectedRoute>} />
   <Route path="/assessments/:id/hogan" element={<ProtectedRoute><HoganTest /></ProtectedRoute>} />
   <Route path="/assessments/:id/firo" element={<ProtectedRoute><FiroTest /></ProtectedRoute>} />

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
<Route
    path="test-takers"
    element={
      <ProtectedRoute allowedRoles={['admin', 'superadmin', 'member', 'user']}>
        <TestTakers />
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
    <Route
    path="assessments/:id/mbti"
    element={
    <ProtectedRoute>
    <MbtiTest />
    </ProtectedRoute>
    }
    />
    <Route
    path="assessments/:id/hogan"
    element={
    <ProtectedRoute>
    <HoganTest />
    </ProtectedRoute>
    }
    />
    <Route
    path="assessments/:id/firo"
    element={
    <ProtectedRoute>
    <FiroTest />
    </ProtectedRoute>
    }
    />
    <Route
    path="assessments/:id/questions/firo"
    element={
    <ProtectedRoute allowedRoles={['superadmin']}>
    <AddFiroQuestions />
    </ProtectedRoute>
    }
    />
    <Route
    path="assessments/:id/questions/big5"
    element={
    <ProtectedRoute allowedRoles={['superadmin']}>
    <AddBig5Questions />
    </ProtectedRoute>
    }
    />
    <Route
    path="assessments/:id/questions/hogan"
    element={
    <ProtectedRoute allowedRoles={['superadmin']}>
    <AddHoganQuestions />
    </ProtectedRoute>
    }
    />
    <Route
    path="assessments/:id/questions/mbti"
    element={
    <ProtectedRoute allowedRoles={['superadmin']}>
    <AddMbtiQuestions />
    </ProtectedRoute>
    }
    />
    <Route
    path="assessments/:id/questions/disc"
    element={
    <ProtectedRoute allowedRoles={['superadmin']}>
    <AddDiscQuestions />
    </ProtectedRoute>
    }
    />
    <Route
    path="assessments/:id/questions/generic"
    element={
    <ProtectedRoute allowedRoles={['superadmin']}>
    <AddGenericQuestions />
    </ProtectedRoute>
    }
    />
   <Route
   path="assessments/:id/terms"
   element={
   <ProtectedRoute>
   <TestTermsAndConditions />
   </ProtectedRoute>
   }
   />
   <Route
   path="assessments/:id/:category/terms"
   element={
   <ProtectedRoute>
   <TestTermsAndConditions />
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
    <Route
      path="reports/mbti/:attemptId"
      element={
      <ProtectedRoute>
      <MbtiReport />
      </ProtectedRoute>
      }
    />
     <Route
     path="reports/disc/comprehensive/:attemptId"
     element={
     <ProtectedRoute>
     <ComprehensiveDiscReport />
     </ProtectedRoute>
     }
     />
     <Route
     path="reports/hogan/:attemptId"
     element={
     <ProtectedRoute>
     <HoganReport />
     </ProtectedRoute>
     }
     />
     <Route
      path="reports/firo/:attemptId"
      element={
      <ProtectedRoute>
      <FiroReport />
      </ProtectedRoute>
      }
      />
      <Route
      path="reports/situational/:attemptId"
      element={
      <ProtectedRoute>
      <SimpleReport />
      </ProtectedRoute>
      }
      />
      <Route
      path="reports/cognitive/:attemptId"
      element={
      <ProtectedRoute>
      <SimpleReport />
      </ProtectedRoute>
      }
      />
      <Route
      path="reports/aptitude/:attemptId"
      element={
      <ProtectedRoute>
      <SimpleReport />
      </ProtectedRoute>
      }
      />
      <Route
      path="reports/sjt/:attemptId"
      element={
      <ProtectedRoute>
      <SjtReport />
      </ProtectedRoute>
      }
      />
      <Route
      path="reports/pcla/:attemptId"
      element={
      <ProtectedRoute>
      <PclaReport />
      </ProtectedRoute>
      }
      />
      <Route
      path="reports/ecti/:attemptId"
      element={
      <ProtectedRoute>
      <EctiReport />
      </ProtectedRoute>
      }
      />
     <Route
     path="reports/big5/comprehensive/:attemptId"
    element={
    <ProtectedRoute>
    <ComprehensiveBig5Report />
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

{/* Credits */}
    <Route
    path="credits"
    element={
    <ProtectedRoute>
    <Credits />
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
   <Route
    path="resources"
    element={
    <ProtectedRoute>
     <UserResources />
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
  <ToastProvider>
    <AuthProvider>
    <Router>
    <AppRoutes />
    </Router>
    </AuthProvider>
  </ToastProvider>
  );
}

export default App;
