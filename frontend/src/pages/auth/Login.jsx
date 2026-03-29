import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authService, organizationService } from '../../services';
import { Eye, EyeOff, Loader2, Building2, Users, ChevronDown, ChevronUp, LogIn, Shield, User as UserIcon, Globe } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [orgInfo, setOrgInfo] = useState(null);
  const [orgLoading, setOrgLoading] = useState(false);
  const [superadminFilled, setSuperadminFilled] = useState(false);

  // Demo organizations state
  const [organizations, setOrganizations] = useState([]);
  const [selectedOrgSlug, setSelectedOrgSlug] = useState(null);
  const [demoUsers, setDemoUsers] = useState([]);
  const [demoOrgsLoading, setDemoOrgsLoading] = useState(false);
  const [demoUsersLoading, setDemoUsersLoading] = useState(false);
  const [loggingInDemo, setLoggingInDemo] = useState(null);

  const { login, demoLogin, user } = useAuth();
  const navigate = useNavigate();
  const { orgSlug } = useParams();

  // Fetch org info when on an org-scoped login page
  useEffect(() => {
    if (orgSlug) {
      setOrgLoading(true);
      fetchOrgInfo();
    }
  }, [orgSlug]);

  // Fetch demo organizations on root login page
  useEffect(() => {
    if (!orgSlug) {
      fetchDemoOrganizations();
    }
  }, [orgSlug]);

  const fetchOrgInfo = async () => {
    try {
      const response = await organizationService.getPublicProfile(orgSlug);
      setOrgInfo(response.data?.organization || response.data);
    } catch (err) {
      setOrgInfo(null);
    } finally {
      setOrgLoading(false);
    }
  };

  const fetchDemoOrganizations = async () => {
    setDemoOrgsLoading(true);
    try {
      const response = await authService.getDemoOrganizations();
      setOrganizations(response.data?.organizations || []);
    } catch (err) {
      setOrganizations([]);
    } finally {
      setDemoOrgsLoading(false);
    }
  };

  const handleOrgClick = async (slug) => {
    if (selectedOrgSlug === slug) {
      setSelectedOrgSlug(null);
      setDemoUsers([]);
      return;
    }

    setSelectedOrgSlug(slug);
    setDemoUsersLoading(true);
    setDemoUsers([]);
    try {
      const response = await authService.getDemoUsers(slug);
      setDemoUsers(response.data?.users || []);
    } catch (err) {
      setDemoUsers([]);
    } finally {
      setDemoUsersLoading(false);
    }
  };

  const handleDemoLogin = async (demoEmail, demoOrgSlug) => {
    setError('');
    setLoggingInDemo(demoEmail);
    try {
      const response = await demoLogin(demoEmail, demoOrgSlug);
      if (response.success) {
        const loggedInUser = response.data.user;
        if (loggedInUser.role === 'superadmin') {
          navigate('/dashboard/superadmin');
        } else {
          navigate(`/o/${demoOrgSlug}/`);
        }
      } else {
        setError(response.message || 'Demo login failed');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Demo login failed');
    } finally {
      setLoggingInDemo(null);
    }
  };

  const handleFillSuperadmin = () => {
    setEmail('super@admin.com');
    setPassword('supperadmin');
    setSuperadminFilled(true);
    setShowPassword(true);
    setTimeout(() => setSuperadminFilled(false), 2000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await login(email, password);
      if (response.success) {
        const loggedInUser = response.data.user;
        if (loggedInUser.role === 'superadmin' && !orgSlug) {
          navigate('/dashboard/superadmin');
        } else if (orgSlug) {
          navigate(`/o/${orgSlug}/`);
        } else {
          navigate('/');
        }
      } else {
        setError(response.message || 'Login failed');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  const primaryColor = orgInfo?.primaryColor || '#6366f1';

  const roleBadgeColors = {
    admin: 'bg-purple-100 text-purple-700',
    user: 'bg-blue-100 text-blue-700',
    superadmin: 'bg-amber-100 text-amber-700'
  };

  const roleIcons = {
    admin: Shield,
    user: UserIcon,
    superadmin: Shield
  };

  return (
    <div className="w-full">
      {/* Logo and Header */}
      <div className="text-center mb-8">
        {orgLoading ? (
          <div className="flex justify-center mb-4">
            <Loader2 className="w-8 h-8 text-gray-300 animate-spin" />
          </div>
        ) : orgInfo ? (
          <>
            {orgInfo.logo ? (
              <img
                src={orgInfo.logo.startsWith('http') ? orgInfo.logo : `${import.meta.env.VITE_API_URL?.replace('/api', '') || ''}${orgInfo.logo}`}
                alt={orgInfo.name}
                className="h-16 w-auto mx-auto mb-4 rounded-lg"
              />
            ) : (
              <div className="w-16 h-16 mx-auto mb-4 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${primaryColor}15` }}>
                <Building2 className="w-8 h-8" style={{ color: primaryColor }} />
              </div>
            )}
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {orgInfo.name}
            </h1>
            <p className="text-gray-500">
              Sign in to access your assessments
            </p>
            <Link
              to={`/org/${orgSlug}`}
              className="inline-flex items-center gap-1.5 mt-3 text-sm font-medium hover:underline transition-colors"
              style={{ color: primaryColor }}
            >
              <Globe className="w-3.5 h-3.5" />
              View Organization Profile
            </Link>
          </>
        ) : (
          <>
            <img
              src="/logo.png"
              alt="Mindmill Assessments"
              className="h-16 w-auto mx-auto mb-4"
            />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Welcome to Mindmill
            </h1>
            <p className="text-gray-500">
              Sign in to access your assessments
            </p>
          </>
        )}
      </div>

      {/* Login Form */}
      <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 p-8">
        {!orgSlug && !orgLoading && (
          <div className="mb-6 p-4 rounded-lg bg-amber-50 border border-amber-200">
            <p className="text-sm text-amber-700">
              Please access your organization's URL to login (e.g., <strong>/o/your-org/login</strong>), or login as SuperAdmin below.
            </p>
            <button
              type="button"
              onClick={handleFillSuperadmin}
              className={`mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                superadminFilled
                  ? 'bg-green-100 text-green-700 border border-green-200'
                  : 'bg-amber-100 text-amber-700 border border-amber-200 hover:bg-amber-200'
              }`}
            >
              <Shield className="w-4 h-4" />
              {superadminFilled ? 'Credentials Filled!' : 'Use SuperAdmin Credentials'}
            </button>
          </div>
        )}

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
              className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all"
              style={{ '--tw-ring-color': primaryColor }}
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
                className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all pr-12"
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
            className="w-full py-3 px-4 rounded-lg text-white font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            style={{ backgroundColor: primaryColor }}
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

          {orgSlug && (
            <button
              type="button"
              onClick={handleFillSuperadmin}
              className={`w-full mt-3 py-2 px-4 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                superadminFilled
                  ? 'bg-green-50 text-green-600 border border-green-200'
                  : 'bg-gray-50 text-gray-500 border border-gray-200 hover:bg-gray-100 hover:text-gray-700'
              }`}
            >
              <Shield className="w-4 h-4" />
              {superadminFilled ? 'Credentials Filled!' : 'SuperAdmin Login'}
            </button>
          )}
        </form>

        {/* Organizations Demo Section */}
        {!orgSlug && (
          <div className="mt-8 pt-6 border-t border-gray-100">
            <p className="text-xs text-gray-500 text-center mb-4 uppercase tracking-wider font-semibold">
              Organizations
            </p>

            {demoOrgsLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 text-gray-300 animate-spin" />
              </div>
            ) : organizations.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">
                No organizations available
              </p>
            ) : (
              <div className="space-y-2">
                {organizations.map((org) => (
                  <div key={org.slug} className="border border-gray-100 rounded-lg overflow-hidden">
                    {/* Organization Header */}
                    <button
                      onClick={() => handleOrgClick(org.slug)}
                      className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors text-left"
                    >
                      {org.logo ? (
                        <img
                          src={org.logo.startsWith('http') ? org.logo : `${import.meta.env.VITE_API_URL?.replace('/api', '') || ''}${org.logo}`}
                          alt={org.name}
                          className="w-8 h-8 rounded-lg object-cover"
                        />
                      ) : (
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: `${org.primaryColor || '#6366f1'}15` }}
                        >
                          <Building2 className="w-4 h-4" style={{ color: org.primaryColor || '#6366f1' }} />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{org.name}</p>
                        <div className="flex items-center gap-1 text-xs text-gray-400">
                          <Users className="w-3 h-3" />
                          <span>{org.userCount} {org.userCount === 1 ? 'user' : 'users'}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Link
                          to={`/org/${org.slug}`}
                          onClick={(e) => e.stopPropagation()}
                          className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                          title="View profile"
                        >
                          <Globe className="w-4 h-4" />
                        </Link>
                        {selectedOrgSlug === org.slug ? (
                          <ChevronUp className="w-4 h-4 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-gray-400" />
                        )}
                      </div>
                    </button>

                    {/* Demo Users List */}
                    {selectedOrgSlug === org.slug && (
                      <div className="border-t border-gray-100 bg-gray-50/50">
                        {demoUsersLoading ? (
                          <div className="flex justify-center py-4">
                            <Loader2 className="w-5 h-5 text-gray-300 animate-spin" />
                          </div>
                        ) : demoUsers.length === 0 ? (
                          <p className="text-xs text-gray-400 text-center py-4">
                            No demo users available
                          </p>
                        ) : (
                          <div className="p-2 space-y-1">
                            {demoUsers.map((demoUser) => {
                              const RoleIcon = roleIcons[demoUser.role] || UserIcon;
                              return (
                                <button
                                  key={demoUser.email}
                                  onClick={() => handleDemoLogin(demoUser.email, org.slug)}
                                  disabled={loggingInDemo !== null}
                                  className="w-full flex items-center gap-3 p-2.5 rounded-md hover:bg-white hover:shadow-sm transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed group"
                                >
                                  <div
                                    className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold text-white"
                                    style={{ backgroundColor: org.primaryColor || '#6366f1' }}
                                  >
                                    {demoUser.firstName?.[0]}{demoUser.lastName?.[0]}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <p className="text-sm font-medium text-gray-800 truncate">
                                        {demoUser.fullName || `${demoUser.firstName} ${demoUser.lastName}`}
                                      </p>
                                      <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium ${roleBadgeColors[demoUser.role] || 'bg-gray-100 text-gray-600'}`}>
                                        <RoleIcon className="w-2.5 h-2.5" />
                                        {demoUser.role}
                                      </span>
                                    </div>
                                    <p className="text-xs text-gray-400 truncate">
                                      {demoUser.email}
                                      {demoUser.jobTitle && ` · ${demoUser.jobTitle}`}
                                    </p>
                                  </div>
                                  {loggingInDemo === demoUser.email ? (
                                    <Loader2 className="w-4 h-4 text-gray-400 animate-spin flex-shrink-0" />
                                  ) : (
                                    <LogIn className="w-4 h-4 text-gray-300 group-hover:text-gray-500 flex-shrink-0 transition-colors" />
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <p className="mt-8 text-center text-sm text-gray-500 ">
        Protected by industry-standard security
      </p>
    </div>
  );
};

export default Login;
