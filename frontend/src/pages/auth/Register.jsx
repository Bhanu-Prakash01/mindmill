import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services';
import {
  Building2, User, ArrowRight, ArrowLeft, CheckCircle, Loader2,
  Eye, EyeOff, Sparkles, Mail, RefreshCw
} from 'lucide-react';

const STEPS = ['Account Type', 'Your Details', 'Verify Email', 'All Set!'];

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
  const { registerFreeTrial, verifyEmail } = useAuth();

  const [step, setStep] = useState(0);
  const [accountType, setAccountType] = useState(null); // 'organization' | 'individual'
  const [assessments, setAssessments] = useState([]);
  const [selectedAssessment, setSelectedAssessment] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  const [registrationEmail, setRegistrationEmail] = useState('');
  const [registrationOrgSlug, setRegistrationOrgSlug] = useState('');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [otpError, setOtpError] = useState('');
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [otpResending, setOtpResending] = useState(false);

  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', password: '',
    phone: '', jobTitle: '',
    organizationName: '', industry: '', companySize: '', website: '',
  });

  useEffect(() => {
    loadAssessments();
  }, []);

  useEffect(() => {
    if (assessments.length > 0 && !selectedAssessment) {
      setSelectedAssessment(assessments[0]);
    }
  }, [assessments]);

  const loadAssessments = async () => {
    try {
      const res = await authService.getFreeTrialAssessments();
      setAssessments(res.data?.assessments || []);
    } catch {
      setAssessments([]);
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
    if (step === 1) { if (!validateStep1()) return; handleSubmit(); }
  };

  const handleBack = () => setStep(s => Math.max(0, s - 1));

  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newDigits = [...otpDigits];
    newDigits[index] = value.slice(-1);
    setOtpDigits(newDigits);
    setOtpError('');
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  const handleVerifyOtp = async () => {
    const otp = otpDigits.join('');
    if (otp.length !== 6) {
      setOtpError('Please enter the complete 6-digit code');
      return;
    }
    setOtpVerifying(true);
    setOtpError('');
    try {
      const res = await verifyEmail(registrationEmail, otp);
      if (res.success) {
        setStep(3);
        setTimeout(() => {
          if (accountType === 'organization' && registrationOrgSlug) {
            navigate(`/o/${registrationOrgSlug}/`);
          } else {
            navigate('/dashboard');
          }
        }, 2500);
      } else {
        setOtpError(res.message || 'Invalid verification code');
      }
    } catch (err) {
      setOtpError(err.response?.data?.message || 'Verification failed. Please try again.');
    } finally {
      setOtpVerifying(false);
    }
  };

  const handleResendOtp = async () => {
    setOtpResending(true);
    setOtpError('');
    try {
      await authService.resendVerificationOtp(registrationEmail);
      setOtpDigits(['', '', '', '', '', '']);
    } catch (err) {
      setOtpError(err.response?.data?.message || 'Failed to resend code');
    } finally {
      setOtpResending(false);
    }
  };

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
        if (res.data?.needsVerification) {
          setRegistrationEmail(res.data.email);
          setRegistrationOrgSlug(res.data?.orgSlug || '');
          setOtpDigits(['', '', '', '', '', '']);
          setStep(2);
        } else {
          setStep(3);
          setTimeout(() => {
            if (accountType === 'organization' && res.data.orgSlug) {
              navigate(`/o/${res.data.orgSlug}/`);
            } else {
              navigate('/dashboard');
            }
          }, 2500);
        }
      } else {
        setSubmitError(res.message || 'Registration failed. Please try again.');
        setStep(1);
      }
    } catch (err) {
      setSubmitError(err.response?.data?.message || 'Registration failed. Please try again.');
      setStep(1);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <img src="/logo.png" alt="MindMil" className="h-12 w-auto mx-auto mb-4" />
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
              <p className="text-gray-500 text-sm mb-6">Choose how you'll use MindMil</p>
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

              {submitError && (
                <div className="mb-5 p-3.5 rounded-lg bg-red-50 border border-red-200">
                  <p className="text-sm text-red-600">{submitError}</p>
                </div>
              )}

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

          {/* STEP 2 — Verify Email */}
          {step === 2 && (
            <div className="p-8">
              <div className="text-center mb-6">
                <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-8 h-8 text-indigo-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Verify Your Email</h2>
                <p className="text-gray-500 text-sm mt-1">
                  We sent a verification code to <span className="font-medium text-gray-700">{registrationEmail}</span>
                </p>
              </div>

              {otpError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 text-center">{otpError}</div>
              )}

              <div className="flex justify-center gap-2 mb-6">
                {otpDigits.map((digit, i) => (
                  <input
                    key={i}
                    id={`otp-${i}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    className="w-12 h-14 text-center text-xl font-bold border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all bg-white text-gray-900"
                    autoFocus={i === 0}
                  />
                ))}
              </div>

              <button
                onClick={handleVerifyOtp}
                disabled={otpVerifying || otpDigits.join('').length !== 6}
                className="w-full flex items-center justify-center gap-2 px-7 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-semibold rounded-xl shadow-md shadow-indigo-200 hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {otpVerifying ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Verifying...</>
                ) : (
                  <><CheckCircle className="w-4 h-4" /> Verify Email</>
                )}
              </button>

              <div className="text-center mt-4">
                <button
                  onClick={handleResendOtp}
                  disabled={otpResending}
                  className="inline-flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-800 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {otpResending ? (
                    <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Resending...</>
                  ) : (
                    <><RefreshCw className="w-3.5 h-3.5" /> Resend code</>
                  )}
                </button>
              </div>
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
          {step < 2 && (
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
                disabled={submitting || (step === 0 && !accountType)}
                className="flex items-center gap-2 px-7 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-semibold rounded-xl shadow-md shadow-indigo-200 hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Creating account...</>
                ) : step === 1 ? (
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
