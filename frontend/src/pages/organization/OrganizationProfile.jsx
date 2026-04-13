import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { organizationService } from '../../services';
import {
  Building2,
  Globe,
  Linkedin,
  MapPin,
  Briefcase,
  Users,
  ChevronLeft,
  Loader2,
  AlertCircle,
  ExternalLink,
  CheckCircle2,
  LayoutGrid,
  FileText,
  Award,
  ClipboardList,
  User
} from 'lucide-react';

// LinkedIn standard banner dimensions: 1584 × 396 px (4:1 ratio)
const LINKEDIN_BANNER_RATIO = '4 / 1'; // CSS aspect-ratio

/** Render word count badge */
const WordCountBadge = ({ text, limit }) => {
  const count = text ? text.trim().split(/\s+/).filter(Boolean).length : 0;
  const over = count > limit;
  return (
    <span
      className={`text-xs font-medium px-2 py-0.5 rounded-full ${
        over
          ? 'bg-rose-100 text-rose-600'
          : 'bg-slate-100 text-slate-500'
      }`}
    >
      {count} / {limit} words
    </span>
  );
};

/** Section card wrapper for Overview */
const SectionCard = ({ icon: Icon, title, content, wordLimit, primaryColor }) => {
  const isEmpty = !content || !content.trim();
  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-8 py-5 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <Icon className="w-5 h-5" style={{ color: primaryColor }} />
          <h2 className="text-base font-semibold text-slate-900">{title}</h2>
        </div>
        {!isEmpty && <WordCountBadge text={content} limit={wordLimit} />}
      </div>
      <div className="px-8 py-6">
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center py-10 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <FileText className="w-8 h-8 text-slate-300 mb-2" />
            <p className="text-slate-500 font-medium text-sm">No content provided yet.</p>
          </div>
        ) : (
          <div className="prose prose-slate prose-p:text-slate-600 prose-p:leading-loose text-base max-w-none">
            <p className="whitespace-pre-wrap text-slate-600 leading-relaxed">{content}</p>
          </div>
        )}
      </div>
    </div>
  );
};

const OrganizationProfile = () => {
  const { slug } = useParams();
  const [org, setOrg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchOrg();
  }, [slug]);

  const fetchOrg = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await organizationService.getPublicProfile(slug);
      setOrg(response.data?.organization || response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Organization not found');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
        <p className="mt-4 text-slate-500 font-medium">Loading profile...</p>
      </div>
    );
  }

  if (error || !org) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-white border border-slate-200 p-8 rounded-xl shadow-sm text-center">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-slate-900 mb-2">Profile Not Found</h1>
          <p className="text-slate-500 mb-8">{error || 'This organization does not exist or its profile is not public.'}</p>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors font-medium w-full justify-center"
          >
            <ChevronLeft className="w-4 h-4" />
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const primaryColor = org.primaryColor || '#0ea5e9';
  const profile = org.publicProfile || {};

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans selection:bg-slate-200">

      {/* Top Navbar */}
      <nav className="h-14 border-b border-slate-200 bg-white sticky top-0 z-50">
        <div className="max-w-[1400px] mx-auto h-full px-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/" className="text-slate-500 hover:text-slate-900 transition-colors flex items-center gap-1.5 text-sm font-medium">
              <ChevronLeft className="w-4 h-4" />
              Directory
            </Link>
            <div className="h-4 w-px bg-slate-200" />
            <span className="text-sm font-medium text-slate-900">{org.name}</span>
            <span className="text-xs text-slate-500 px-2 py-0.5 bg-slate-100 rounded-md border border-slate-200 font-mono">
              {slug}
            </span>
          </div>
          <Link
            to="/login"
            className="text-sm font-medium text-white px-4 py-1.5 rounded-md transition-opacity hover:opacity-90 shadow-sm"
            style={{ backgroundColor: primaryColor }}
          >
            Login
          </Link>
        </div>
      </nav>

      {/* Main Layout Container */}
      <div className="max-w-[1400px] mx-auto px-6 py-8">

        {/* ── LinkedIn-proportioned Cover Banner (1584×396 ≈ 4:1) ── */}
        <div
          className="w-full rounded-2xl overflow-hidden relative border border-slate-200/50 shadow-sm mb-8"
          style={{ aspectRatio: LINKEDIN_BANNER_RATIO }}
        >
          {/* Background */}
          {org.banner && !org.banner.startsWith('gradient-') ? (
            <img
              src={org.banner.startsWith('http') ? org.banner : `${import.meta.env.VITE_API_URL?.replace('/api', '') || ''}${org.banner}`}
              alt="Organization banner"
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : org.banner && org.banner.startsWith('gradient-') ? (
            <div className={`absolute inset-0 ${org.banner}`} />
          ) : (
            <>
              <div className="absolute inset-0 bg-slate-200" />
              <div className="absolute inset-0 opacity-20" style={{ backgroundColor: primaryColor }} />
            </>
          )}

          {/* LinkedIn size info overlay — bottom-left */}
          <div className="absolute bottom-4 left-5 flex items-center gap-2 bg-white/75 backdrop-blur-sm rounded-lg px-3 py-1.5 border border-white/60 shadow-sm">
            <span className="text-xs font-semibold text-slate-700">Recommended size:</span>
            <span className="text-xs font-mono text-slate-500">1584 × 396 px (LinkedIn Banner)</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">

          {/* ── Left Column: Organization Identity Sidebar ── */}
          <div className="lg:col-span-3 lg:-mt-24 space-y-6 relative z-10">

            {/* Main Profile Card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              {/* Logo */}
              <div className="w-24 h-24 bg-white border border-slate-200 rounded-2xl shadow-sm flex items-center justify-center mb-6 overflow-hidden p-1">
                {org.logo ? (
                  <img
                    src={org.logo.startsWith('http') ? org.logo : `${import.meta.env.VITE_API_URL?.replace('/api', '') || ''}${org.logo}`}
                    alt={org.name}
                    className="w-full h-full object-contain rounded-xl"
                  />
                ) : (
                  <Building2 className="w-10 h-10 text-slate-400" />
                )}
              </div>

              {/* Org Name + Verified */}
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{org.name}</h1>
                <CheckCircle2 className="w-5 h-5 shrink-0" style={{ color: primaryColor }} />
              </div>

              {/* Headline */}
              <p className="text-slate-600 text-sm leading-relaxed mb-6">
                {profile.headline || 'Official organization profile.'}
              </p>

              {/* View Opportunities */}
              <button
                className="w-full py-2.5 rounded-lg text-sm font-semibold text-slate-700 bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-colors flex justify-center items-center gap-2 mb-4"
              >
                <Globe className="w-4 h-4" />
                View Opportunities
              </button>

              {/* Moderator Name */}
              {org.moderatorName && (
                <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                  <User className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="text-sm text-slate-600 font-medium">{org.moderatorName}</span>
                </div>
              )}
            </div>

            {/* Structured Details Card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Organization Details</h3>
              <div className="space-y-4">
                {profile.industry && (
                  <div className="flex items-start gap-3">
                    <Briefcase className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-slate-900 border-b border-slate-100 pb-0.5 inline-block">Industry</p>
                      <p className="text-sm text-slate-600 mt-1">{profile.industry}</p>
                    </div>
                  </div>
                )}
                {profile.companySize && (
                  <div className="flex items-start gap-3">
                    <Users className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-slate-900 border-b border-slate-100 pb-0.5 inline-block">Company Size</p>
                      <p className="text-sm text-slate-600 mt-1">{profile.companySize}</p>
                    </div>
                  </div>
                )}
                {profile.location && (
                  <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-slate-900 border-b border-slate-100 pb-0.5 inline-block">Headquarters</p>
                      <p className="text-sm text-slate-600 mt-1">{profile.location}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Divider */}
              <div className="h-px bg-slate-100 my-5" />

              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Official Links</h3>
              <div className="flex flex-col gap-2">
                {profile.website && (
                  <a
                    href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-slate-100 transition-colors group"
                  >
                    <div className="flex items-center gap-2.5">
                      <Globe className="w-4 h-4 text-slate-500" />
                      <span className="text-sm font-medium text-slate-700">Website</span>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 transition-colors" />
                  </a>
                )}
                {profile.linkedin && (
                  <a
                    href={profile.linkedin.startsWith('http') ? profile.linkedin : `https://${profile.linkedin}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 bg-slate-50 hover:border-[#0A66C2]/30 hover:bg-blue-50 transition-colors group"
                  >
                    <div className="flex items-center gap-2.5">
                      <Linkedin className="w-4 h-4 text-[#0A66C2]" />
                      <span className="text-sm font-medium text-slate-700">LinkedIn</span>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#0A66C2] transition-colors" />
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* ── Right Column: Main Content Area ── */}
          <div className="lg:col-span-9 space-y-6">

            {/* Section Header */}
            <div className="border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2 text-slate-900 font-semibold text-lg">
                <LayoutGrid className="w-5 h-5" style={{ color: primaryColor }} />
                <span>Overview</span>
              </div>
            </div>

            {/* ── Section 1: About the Organization (500 words) ── */}
            <SectionCard
              icon={FileText}
              title="About the Organization"
              content={profile.about || org.description}
              wordLimit={500}
              primaryColor={primaryColor}
            />

            {/* ── Section 2: Best HR Practices (300 words) ── */}
            <SectionCard
              icon={ClipboardList}
              title="Best HR Practices"
              content={profile.bestHRPractices}
              wordLimit={300}
              primaryColor={primaryColor}
            />

            {/* ── Section 3: Awards & Accolades (300 words) ── */}
            <SectionCard
              icon={Award}
              title="Awards & Accolades"
              content={profile.awardsAccolades}
              wordLimit={300}
              primaryColor={primaryColor}
            />

          </div>
        </div>
      </div>
    </div>
  );
};

export default OrganizationProfile;
