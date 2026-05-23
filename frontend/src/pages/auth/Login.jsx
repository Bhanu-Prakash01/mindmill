import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services';
import {
  Eye, EyeOff, Loader2, Building2, User as UserIcon,
  ChevronDown, Check, Search
} from 'lucide-react';

const LOGIN_MODE_ORG = 'org';
const LOGIN_MODE_INDIVIDUAL = 'individual';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loginMode, setLoginMode] = useState(LOGIN_MODE_ORG);

  // Org selector
  const [organizations, setOrganizations] = useState([]);
  const [orgsLoading, setOrgsLoading] = useState(false);
  const [orgSearch, setOrgSearch] = useState('');
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [showOrgDropdown, setShowOrgDropdown] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const { orgSlug } = useParams();

  // If on an org-scoped URL, pre-select that org
  useEffect(() => {
    if (orgSlug) {
      fetchOrganizations().then(() => {
        setSelectedOrg(orgSlug);
        setLoginMode(LOGIN_MODE_ORG);
      });
    }
  }, [orgSlug]);

  useEffect(() => {
    if (!orgSlug) {
      fetchOrganizations();
    }
  }, [orgSlug]);

  const fetchOrganizations = async () => {
    setOrgsLoading(true);
    try {
      const response = await authService.getDemoOrganizations();
      setOrganizations(response.data?.organizations || []);
      // If orgSlug is in URL, pre-select from list
      if (orgSlug) {
        const found = (response.data?.organizations || []).find(o => o.slug === orgSlug);
        if (found) setSelectedOrg(found);
      }
    } catch (err) {
      setOrganizations([]);
    } finally {
      setOrgsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let response;

      if (loginMode === LOGIN_MODE_ORG) {
        if (!selectedOrg) {
          setError('Please select an organization');
          setLoading(false);
          return;
        }
        const orgSlugVal = typeof selectedOrg === 'string' ? selectedOrg : selectedOrg.slug;
        response = await login(email, password, orgSlugVal);
      } else {
        response = await login(email, password);
      }

      if (response.success) {
        const loggedInUser = response.data.user;
        if (loggedInUser.role === 'superadmin') {
          navigate('/dashboard/superadmin');
        } else if (loggedInUser.organization) {
          const userOrgSlug = loggedInUser.organization?.slug;
          if (userOrgSlug) {
            navigate(`/o/${userOrgSlug}/`);
          } else {
            navigate('/');
          }
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

  const filteredOrgs = organizations.filter(org =>
    org.name.toLowerCase().includes(orgSearch.toLowerCase())
  );

  const modes = [
    {
      id: LOGIN_MODE_ORG,
      label: 'Organization',
      icon: Building2,
      description: 'Sign in via your organization'
    },
    {
      id: LOGIN_MODE_INDIVIDUAL,
      label: 'Individual',
      icon: UserIcon,
      description: 'Sign in as individual user'
    }
  ];

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-8">
        <img
          src="/logo.png"
          alt="Mindmil Assessments"
          className="h-14 w-auto mx-auto mb-4"
        />
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome to Mindmil
        </h1>
        <p className="text-gray-500 mt-1.5 text-sm">
          Sign in to access your assessments
        </p>
      </div>

      {/* Login mode tabs */}
      <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 p-6 sm:p-8">
        <div className="flex rounded-xl bg-gray-100 p-1 mb-6">
          {modes.map((mode) => {
            const Icon = mode.icon;
            const active = loginMode === mode.id;
            return (
              <button
                key={mode.id}
                type="button"
                onClick={() => {
                  setLoginMode(mode.id);
                  setError('');
                  if (mode.id !== LOGIN_MODE_SUPERADMIN) {
                    setEmail('');
                    setPassword('');
                  }
                }}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  active
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                {mode.label}
              </button>
            );
          })}
        </div>

        {error && (
          <div className="mb-5 p-3.5 rounded-lg bg-red-50 border border-red-200">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Organization selector */}
          {loginMode === LOGIN_MODE_ORG && (
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Select Organization
              </label>
              <button
                type="button"
                onClick={() => setShowOrgDropdown(!showOrgDropdown)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border border-gray-200 bg-white text-left transition-all hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                {selectedOrg ? (
                  <>
                    {selectedOrg.logo ? (
                      <img
                        src={selectedOrg.logo.startsWith('http') ? selectedOrg.logo : ''}
                        alt=""
                        className="w-7 h-7 rounded-md object-cover"
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-md bg-indigo-50 flex items-center justify-center flex-shrink-0">
                        <Building2 className="w-3.5 h-3.5 text-indigo-500" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {selectedOrg.name}
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center gap-3 text-gray-400">
                    <Building2 className="w-5 h-5" />
                    <span className="text-sm">Choose your organization...</span>
                  </div>
                )}
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showOrgDropdown ? 'rotate-180' : ''}`} />
              </button>

              {showOrgDropdown && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowOrgDropdown(false)} />
                  <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                    <div className="p-2 border-b border-gray-100">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          value={orgSearch}
                          onChange={(e) => setOrgSearch(e.target.value)}
                          placeholder="Search organizations..."
                          className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                    <div className="max-h-56 overflow-y-auto p-1">
                      {orgsLoading ? (
                        <div className="flex justify-center py-6">
                          <Loader2 className="w-5 h-5 text-gray-300 animate-spin" />
                        </div>
                      ) : filteredOrgs.length === 0 ? (
                        <p className="text-sm text-gray-400 text-center py-6">No organizations found</p>
                      ) : (
                        filteredOrgs.map((org) => (
                          <button
                            key={org.slug}
                            type="button"
                            onClick={() => {
                              setSelectedOrg(org);
                              setShowOrgDropdown(false);
                              setOrgSearch('');
                            }}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                              selectedOrg?.slug === org.slug
                                ? 'bg-indigo-50 text-indigo-700'
                                : 'hover:bg-gray-50 text-gray-700'
                            }`}
                          >
                            {org.logo ? (
                              <img
                                src={org.logo.startsWith('http') ? org.logo : ''}
                                alt=""
                                className="w-7 h-7 rounded-md object-cover flex-shrink-0"
                              />
                            ) : (
                              <div className="w-7 h-7 rounded-md bg-gray-100 flex items-center justify-center flex-shrink-0">
                                <Building2 className="w-3.5 h-3.5 text-gray-400" />
                              </div>
                            )}
                            <span className="text-sm font-medium flex-1 truncate">{org.name}</span>
                            {selectedOrg?.slug === org.slug && (
                              <Check className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                            )}
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Individual note */}
          {loginMode === LOGIN_MODE_INDIVIDUAL && (
            <div className="p-3.5 rounded-lg bg-blue-50 border border-blue-200">
              <p className="text-xs text-blue-700">
                Sign in with your individual account credentials.
              </p>
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              placeholder="Enter your email"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all pr-12"
                placeholder="Enter your password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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

          <Link
            to="/forgot-password"
            className="block text-center text-sm text-indigo-600 hover:text-indigo-700 font-medium"
          >
            Forgot Password?
          </Link>

          <div className="pt-4 border-t border-gray-100">
            <Link
              to="/register"
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg border border-indigo-200 text-indigo-600 text-sm font-medium hover:bg-indigo-50 hover:border-indigo-300 transition-all"
            >
              Try a Free Assessment
            </Link>
            <p className="mt-2 text-xs text-gray-400 text-center">No credit card required</p>
          </div>
        </form>
      </div>

      <p className="mt-6 text-center text-sm text-gray-500">
        Built with enterprise-level security architecture
      </p>
    </div>
  );
};

export default Login;
