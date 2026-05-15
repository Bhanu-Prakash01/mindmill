import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services';
import {
  Building2, User, ArrowRight, ArrowLeft, CheckCircle, Loader2,
  Eye, EyeOff, Sparkles, Clock, FileText, Brain, BarChart3
} from 'lucide-react';

const STEPS = ['Account Type', 'Your Details', 'Pick Assessment', 'All Set!'];

const categoryColors = {
  personality: { bg: 'from-violet-500 to-purple-600', light: 'bg-violet-50 text-violet-700 border-violet-200' },
  psychometric: { bg: 'from-blue-500 to-indigo-600', light: 'bg-blue-50 text-blue-700 border-blue-200' },
  cognitive: { bg: 'from-cyan-500 to-teal-600', light: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
  aptitude: { bg: 'from-emerald-500 to-green-600', light: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  situational: { bg: 'from-amber-500 to-orange-600', light: 'bg-amber-50 text-amber-700 border-amber-200' },
  professional: { bg: 'from-rose-500 to-pink-600', light: 'bg-rose-50 text-rose-700 border-rose-200' },
};

const CategoryIcon = ({ category }) => {
  const icons = { personality: Brain, psychometric: BarChart3, cognitive: Brain, aptitude: FileText, situational: FileText, professional: BarChart3 };
  const Icon = icons[category] || FileText;
  return <Icon className="w-5 h-5" />;
};

const InputField = ({ label, id, error, ...props }) => (
  <div>
    <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
    <input
      id={id}
      className={`w-full px-4 py-3 rounded-xl border text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all bg-white ${error ? 'border-red-400 bg-red-50' : 'border-gray-200'}`}
      {...props}
    />
    {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
  </div>
);

const Register = () => {
  const navigate = useNavigate();
  const { registerFreeTrial } = useAuth();

  const [step, setStep] = useState(0);
  const [accountType, setAccountType] = useState(null); // 'organization' | 'individual'
  const [assessments, setAssessments] = useState([]);
  const [assessmentsLoading, setAssessmentsLoading] = useState(false);
  const [selectedAssessment, setSelectedAssessment] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', password: '',
    phone: '', jobTitle: '',
    organizationName: '', industry: '', companySize: '', website: '',
  });

  useEffect(() => {
    if (step === 2) loadAssessments();
  }, [step]);

  const loadAssessments = async () => {
    setAssessmentsLoading(true);
    try {
      const res = await authService.getFreeTrialAssessments();
      setAssessments(res.data?.assessments || []);
    } catch {
      setAssessments([]);
    } finally {
      setAssessmentsLoading(false);
    }
  };

  const set = (field) => (e) => {
    setForm(f => ({ ...f, [field]: e.target.value }));
    setFieldErrors(fe => ({ ...fe, [field]: '' }));
  };

  const validateStep1 = () => {
    const errs = {};
    if (!form.firstName.trim()) errs.firstName = 'Required';
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Valid email required';
    if (!form.password || form.password.length < 6) errs.password = 'Min 6 characters';
    if (accountType === 'organization' && !form.organizationName.trim()) errs.organizationName = 'Required';
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if (step === 0) { if (!accountType) return; setStep(1); return; }
    if (step === 1) { if (!validateStep1()) return; setStep(2); return; }
    if (step === 2) { if (!selectedAssessment) return; handleSubmit(); }
  };

  const handleBack = () => setStep(s => Math.max(0, s - 1));

  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitError('');
    try {
      const payload = {
        accountType,
        firstName: form.firstName, lastName: form.lastName,
        email: form.email, password: form.password,
        phone: form.phone,
        selectedAssessmentId: selectedAssessment._id,
        ...(accountType === 'organization' && {
          organizationName: form.organizationName,
          industry: form.industry, companySize: form.companySize,
          website: form.website,
        }),
      };
      const res = await registerFreeTrial(payload);
      if (res.success) {
        setStep(3);
        // Auto redirect after 2.5s
        setTimeout(() => {
          if (accountType === 'organization' && res.data.orgSlug) {
            navigate(`/o/${res.data.orgSlug}/`);
          } else {
            navigate('/dashboard');
          }
        }, 2500);
      } else {
        setSubmitError(res.message || 'Registration failed');
        setStep(2);
      }
    } catch (err) {
      setSubmitError(err.response?.data?.message || 'Something went wrong. Please try again.');
      setStep(2);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <img src="/logo.png" alt="Mindmill" className="h-12 w-auto mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900">Start Your Free Trial</h1>
          <p className="text-gray-500 mt-2">One free assessment, zero credit card required</p>
        </div>

        {/* Step indicator */}
        {step < 3 && (
          <div className="flex items-center justify-center gap-2 mb-8">
            {STEPS.slice(0, 3).map((label, i) => (
              <React.Fragment key={i}>
                <div className="flex items-center gap-1.5">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${i < step ? 'bg-indigo-600 text-white' : i === step ? 'bg-indigo-600 text-white ring-4 ring-indigo-100' : 'bg-gray-100 text-gray-400'}`}>
                    {i < step ? <CheckCircle className="w-4 h-4" /> : i + 1}
                  </div>
                  <span className={`text-xs font-medium hidden sm:block ${i === step ? 'text-indigo-600' : 'text-gray-400'}`}>{label}</span>
                </div>
                {i < 2 && <div className={`flex-1 max-w-[60px] h-0.5 ${i < step ? 'bg-indigo-600' : 'bg-gray-200'}`} />}
              </React.Fragment>
            ))}
          </div>
        )}

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/60 border border-gray-100 overflow-hidden">

          {/* STEP 0 — Account Type */}
          {step === 0 && (
            <div className="p-8">
              <h2 className="text-xl font-bold text-gray-900 mb-2">What describes you best?</h2>
              <p className="text-gray-500 text-sm mb-6">Choose how you'll use MindMill</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  {
                    type: 'organization',
                    icon: Building2,
                    title: 'Organization',
                    subtitle: 'For companies & HR teams',
                    bullets: ['Invite & manage team members', 'Admin dashboard', 'Buy credits for more tests'],
                    gradient: 'from-indigo-500 to-purple-600',
                  },
                  {
                    type: 'individual',
                    icon: User,
                    title: 'Individual',
                    subtitle: 'For personal use',
                    bullets: ['Take assessments yourself', 'View your reports', 'Buy credits for more tests'],
                    gradient: 'from-teal-500 to-cyan-600',
                  },
                ].map(({ type, icon: Icon, title, subtitle, bullets, gradient }) => (
                  <button
                    key={type}
                    onClick={() => setAccountType(type)}
                    className={`relative text-left p-6 rounded-xl border-2 transition-all group ${accountType === type ? 'border-indigo-500 bg-indigo-50/60 shadow-md' : 'border-gray-200 hover:border-indigo-200 hover:bg-gray-50'}`}
                  >
                    {accountType === type && (
                      <div className="absolute top-3 right-3"><CheckCircle className="w-5 h-5 text-indigo-600" /></div>
                    )}
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-4`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-bold text-gray-900 text-lg">{title}</h3>
                    <p className="text-sm text-gray-500 mb-3">{subtitle}</p>
                    <ul className="space-y-1">
                      {bullets.map((b, i) => (
                        <li key={i} className="flex items-center gap-2 text-xs text-gray-600">
                          <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 flex-shrink-0" />
                          {b}
                        </li>
                      ))}
                    </ul>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 1 — Details Form */}
          {step === 1 && (
            <div className="p-8">
              <h2 className="text-xl font-bold text-gray-900 mb-1">
                {accountType === 'organization' ? 'Organization & Admin Details' : 'Your Details'}
              </h2>
              <p className="text-gray-500 text-sm mb-6">We'll set up your account right away</p>

              <div className="space-y-4">
                {accountType === 'organization' && (
                  <>
                    <InputField label="Organization Name *" id="orgName" placeholder="Acme Corp" value={form.organizationName} onChange={set('organizationName')} error={fieldErrors.organizationName} />
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Industry</label>
                        <select value={form.industry} onChange={set('industry')} className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all">
                          <option value="">Select...</option>
                          {['Technology', 'Finance', 'Healthcare', 'Education', 'Manufacturing', 'Retail', 'Consulting', 'Other'].map(i => <option key={i}>{i}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Company Size</label>
                        <select value={form.companySize} onChange={set('companySize')} className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all">
                          <option value="">Select...</option>
                          {['1-10', '11-50', '51-200', '201-500', '500+'].map(s => <option key={s}>{s}</option>)}
                        </select>
                      </div>
                    </div>
                    <InputField label="Website (optional)" id="website" type="url" placeholder="https://example.com" value={form.website} onChange={set('website')} />
                    <div className="border-t border-gray-100 pt-4">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Admin Account</p>
                    </div>
                  </>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <InputField label="First Name *" id="firstName" placeholder="Alex" value={form.firstName} onChange={set('firstName')} error={fieldErrors.firstName} />
                  <InputField label="Last Name" id="lastName" placeholder="Johnson" value={form.lastName} onChange={set('lastName')} />
                </div>
                <InputField label="Email Address *" id="email" type="email" placeholder="you@example.com" value={form.email} onChange={set('email')} error={fieldErrors.email} />
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">Password *</label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={form.password}
                      onChange={set('password')}
                      placeholder="Min 6 characters"
                      className={`w-full px-4 py-3 pr-11 rounded-xl border text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all bg-white ${fieldErrors.password ? 'border-red-400' : 'border-gray-200'}`}
                    />
                    <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {fieldErrors.password && <p className="mt-1 text-xs text-red-600">{fieldErrors.password}</p>}
                </div>
                <InputField label="Phone (optional)" id="phone" type="tel" placeholder="+91 98765 43210" value={form.phone} onChange={set('phone')} />
              </div>
            </div>
          )}

          {/* STEP 2 — Pick Assessment */}
          {step === 2 && (
            <div className="p-8">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-5 h-5 text-indigo-500" />
                <h2 className="text-xl font-bold text-gray-900">Choose Your Free Assessment</h2>
              </div>
              <p className="text-gray-500 text-sm mb-6 ml-7">Select one — it's on us! You can buy more credits later.</p>

              {submitError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{submitError}</div>
              )}

              {assessmentsLoading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
                </div>
              ) : assessments.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <FileText className="w-12 h-12 mx-auto mb-3 opacity-40" />
                  <p>No assessments available at the moment.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[380px] overflow-y-auto pr-1">
                  {assessments.map((a) => {
                    const colors = categoryColors[a.category] || categoryColors.personality;
                    const isSelected = selectedAssessment?._id === a._id;
                    return (
                      <button
                        key={a._id}
                        onClick={() => setSelectedAssessment(a)}
                        className={`text-left p-4 rounded-xl border-2 transition-all ${isSelected ? 'border-indigo-500 bg-indigo-50/70 shadow-md' : 'border-gray-200 hover:border-indigo-200 hover:bg-gray-50'}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${colors.bg} flex items-center justify-center text-white flex-shrink-0`}>
                            <CategoryIcon category={a.category} />
                          </div>
                          {isSelected && <CheckCircle className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />}
                        </div>
                        <h3 className="font-semibold text-gray-900 mt-2 text-sm leading-snug">{a.title}</h3>
                        {a.subCategory && <p className="text-xs text-gray-500 mt-0.5">{a.subCategory}</p>}
                        <div className="flex items-center gap-3 mt-2">
                          <span className={`inline-block text-xs px-2 py-0.5 rounded-full border capitalize ${colors.light}`}>{a.category}</span>
                          {a.timeBound?.enabled && (
                            <span className="flex items-center gap-1 text-xs text-gray-400">
                              <Clock className="w-3 h-3" />
                              {a.timeBound.durationMinutes}m
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* STEP 3 — Success */}
          {step === 3 && (
            <div className="p-12 text-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-200">
                <CheckCircle className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">You're all set! 🎉</h2>
              <p className="text-gray-500 mb-2">Your free trial account has been created.</p>
              <p className="text-sm text-indigo-600 font-medium">Redirecting you to your dashboard...</p>
              <div className="mt-6 flex justify-center">
                <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
              </div>
            </div>
          )}

          {/* Footer Nav */}
          {step < 3 && (
            <div className="px-8 pb-8 flex items-center justify-between gap-4">
              <div>
                {step > 0 && (
                  <button onClick={handleBack} className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all">
                    <ArrowLeft className="w-4 h-4" />
                    Back
                  </button>
                )}
              </div>
              <button
                onClick={handleNext}
                disabled={submitting || (step === 0 && !accountType) || (step === 2 && !selectedAssessment)}
                className="flex items-center gap-2 px-7 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-semibold rounded-xl shadow-md shadow-indigo-200 hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Creating account...</>
                ) : step === 2 ? (
                  <><Sparkles className="w-4 h-4" /> Start Free Trial</>
                ) : (
                  <>Continue <ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-indigo-600 font-medium hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
