import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AuthLayout = () => {
 const { isAuthenticated } = useAuth();

 if (isAuthenticated) {
 return <Navigate to="/" replace />;
 }

 return (
 <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex items-center justify-center p-4">
 <div className="w-full max-w-md">
 <Outlet />
 </div>
 </div>
 );
};

export default AuthLayout;
