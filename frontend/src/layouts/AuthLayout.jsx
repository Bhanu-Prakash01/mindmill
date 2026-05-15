import React, { useEffect, useRef, useCallback } from 'react';
import { Outlet, useNavigate, useParams, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AuthLayout = () => {
 const { isAuthenticated, user, loading } = useAuth();
 const { orgSlug } = useParams();
 const navigate = useNavigate();
 const redirected = useRef(false);

 useEffect(() => {
  if (loading) return;
  if (!isAuthenticated) return;
  if (redirected.current) return;

  redirected.current = true;

  if (user?.accountType === 'individual' || (!user?.organization && user?.role !== 'superadmin')) {
   navigate('/dashboard', { replace: true });
  } else if (orgSlug && user?.role !== 'superadmin') {
   navigate(`/o/${orgSlug}/`, { replace: true });
  } else {
   navigate('/', { replace: true });
  }
 }, [isAuthenticated, loading, orgSlug, user?.role, user?.accountType, user?.organization, navigate]);

 if (loading) {
  return (
   <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
   </div>
  );
 }

 if (isAuthenticated) return null;

 return (
 <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex items-center justify-center p-4">
 <div className="w-full max-w-md">
 <Outlet />
 </div>
 </div>
 );
};

export default AuthLayout;
