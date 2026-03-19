import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

const Login = () => {
 const [email, setEmail] = useState('');
 const [password, setPassword] = useState('');
 const [showPassword, setShowPassword] = useState(false);
 const [error, setError] = useState('');
 const [loading, setLoading] = useState(false);

 const { login } = useAuth();
 const navigate = useNavigate();

 const handleSubmit = async (e) => {
 e.preventDefault();
 setError('');
 setLoading(true);

 try {
 const response = await login(email, password);
 if (response.success) {
 navigate('/');
 } else {
 setError(response.message || 'Login failed');
 }
 } catch (err) {
 setError(err.response?.data?.message || 'An error occurred during login');
 } finally {
 setLoading(false);
 }
 };

 return (
 <div className="w-full">
 {/* Logo and Header */}
 <div className="text-center mb-8">
 <img 
 src="/logo.png" 
 alt="Mindmil Assessments" 
 className="h-16 w-auto mx-auto mb-4"
 />
 <h1 className="text-2xl font-bold text-gray-900 mb-2">
 Welcome to Mindmil
 </h1>
 <p className="text-gray-500">
 Sign in to access your assessments
 </p>
 </div>

 {/* Login Form */}
 <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 p-8">
 {error && (
 <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 ">
 <p className="text-sm text-red-600 ">{error}</p>
 </div>
 )}

 <form onSubmit={handleSubmit} className="space-y-6">
 <div>
 <label
 htmlFor="email"
 className="block text-sm font-medium text-gray-700 mb-2"
 >
 Email Address
 </label>
 <input
 id="email"
 type="email"
 value={email}
 onChange={(e) => setEmail(e.target.value)}
 required
 className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
 placeholder="Enter your email"
 />
 </div>

 <div>
 <label
 htmlFor="password"
 className="block text-sm font-medium text-gray-700 mb-2"
 >
 Password
 </label>
 <div className="relative">
 <input
 id="password"
 type={showPassword ? 'text' : 'password'}
 value={password}
 onChange={(e) => setPassword(e.target.value)}
 required
 className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all pr-12"
 placeholder="Enter your password"
 />
 <button
 type="button"
 onClick={() => setShowPassword(!showPassword)}
 className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 "
 >
 {showPassword ? (
 <EyeOff className="w-5 h-5" />
 ) : (
 <Eye className="w-5 h-5" />
 )}
 </button>
 </div>
 </div>

 <button
 type="submit"
 disabled={loading}
 className="w-full py-3 px-4 rounded-lg bg-gradient-to-r from-primary-500 to-secondary-500 text-white font-medium hover:from-primary-600 hover:to-secondary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
 >
 {loading ? (
 <>
 <Loader2 className="w-5 h-5 animate-spin" />
 Signing in...
 </>
 ) : (
 'Sign In'
 )}
 </button>
 </form>

      <div className="mt-8 pt-6 border-t border-gray-100 ">
        <p className="text-xs text-gray-500 text-center mb-4 uppercase tracking-wider font-semibold">
          Demo Credentials
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[10px] text-gray-500">
          <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
            <p className="font-bold text-gray-700 mb-1">Super Admin</p>
            <p className="font-mono break-all">super@admin.com / super</p>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
            <p className="font-bold text-gray-700 mb-1">Admin (Global Talent)</p>
            <p className="font-mono break-all">sarah.j@globaltalent.com / password</p>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
            <p className="font-bold text-gray-700 mb-1">Admin (Peak Performance)</p>
            <p className="font-mono break-all">m.chen@peakperformance.com / password</p>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
            <p className="font-bold text-gray-700 mb-1">Standard User (Demo Org)</p>
            <p className="font-mono break-all">d.wilson@demo.com / password</p>
          </div>
        </div>
      </div>
 </div>

 {/* Footer */}
 <p className="mt-8 text-center text-sm text-gray-500 ">
 Protected by industry-standard security
 </p>
 </div>
 );
};

export default Login;
