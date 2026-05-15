import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
 const [user, setUser] = useState(null);
 const [loading, setLoading] = useState(true);

 useEffect(() => {
  const initAuth = () => {
   const storedUser = authService.getUser();
   if (storedUser) {
   setUser(storedUser);
   }
   setLoading(false);
  };

  initAuth();
 }, []);

 const login = async (email, password) => {
  const response = await authService.login(email, password);
  if (response.success) {
  setUser(response.data.user);
  }
  return response;
 };

 const demoLogin = async (email, orgSlug) => {
  const response = await authService.demoLogin(email, orgSlug);
  if (response.success) {
  setUser(response.data.user);
  }
  return response;
 };

 const registerFreeTrial = async (registrationData) => {
  const response = await authService.registerFreeTrial(registrationData);
  if (response.success) {
   setUser(response.data.user);
  }
  return response;
 };

 const logout = async () => {
  await authService.logout();
  setUser(null);
 };

  const updateUser = (updatedUser) => {
   setUser(updatedUser);
   localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const refreshUser = async () => {
    try {
      const response = await authService.getMe();
      if (response.success) {
        updateUser(response.data.user);
      }
    } catch (err) {
      console.error('Failed to refresh user:', err);
    }
  };

  const value = useMemo(() => ({
   user,
   login,
   demoLogin,
   registerFreeTrial,
   logout,
   updateUser,
   refreshUser,
   loading,
  isAuthenticated: !!user,
  isSuperAdmin: user?.role === 'superadmin',
  isAdmin: user?.role === 'admin' || user?.role === 'superadmin',
  isUser: user?.role === 'user',
  isIndividual: user?.accountType === 'individual',
 }), [user, loading]);

 return (
  <AuthContext.Provider value={value}>
  {children}
  </AuthContext.Provider>
 );
};

export const useAuth = () => {
 const context = useContext(AuthContext);
 if (!context) {
  throw new Error('useAuth must be used within an AuthProvider');
 }
 return context;
};
