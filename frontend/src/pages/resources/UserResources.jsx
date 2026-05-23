import React, { useState, useEffect } from 'react';
import { resourceService } from '../../services';
import ResourceCard from './ResourceCard';
import FAQSection from './FAQSection';
import { Loader2, BookOpen, AlertCircle, RefreshCw, Search, HelpCircle } from 'lucide-react';

const UserResources = () => {
  const [activeTab, setActiveTab] = useState('resources');
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTag, setActiveTag] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchResources = async (tag = null) => {
    try {
      setLoading(true);
      setError(null);
      const params = tag ? { tag } : {};
      const res = await resourceService.getResources(params);
      setResources(res.data?.resources || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load resources');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
  }, []);

  const allTags = [...new Set(resources.flatMap((r) => r.tags || []))].sort();

  const filteredResources = resources.filter((r) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.title?.toLowerCase().includes(q) ||
      r.description?.toLowerCase().includes(q)
    );
  });

  const handleTagClick = (tag) => {
    const newTag = tag === activeTag ? null : tag;
    setActiveTag(newTag);
    fetchResources(newTag);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={() => fetchResources(activeTag)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Resources</h1>
        <p className="text-gray-500 mt-1">Helpful guides, resources and FAQs</p>
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('resources')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'resources'
              ? 'bg-white text-indigo-700 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Resources
        </button>
        <button
          onClick={() => setActiveTab('faq')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'faq'
              ? 'bg-white text-indigo-700 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <HelpCircle className="w-4 h-4" />
          FAQs
        </button>
      </div>

      {activeTab === 'resources' && (
        <>
          {/* Search */}
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 transition-colors group-focus-within:text-indigo-500" />
            <input
              type="text"
              placeholder="Search resources..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-sm"
            />
          </div>

          {allTags.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-medium cursor-pointer transition-all ${
                  !activeTag
                    ? 'bg-indigo-600 text-white ring-2 ring-indigo-500'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                onClick={() => {
                  setActiveTag(null);
                  fetchResources(null);
                }}
              >
                All
              </span>
              {allTags.map((tag) => (
                <span
                  key={tag}
                  className={`px-2.5 py-0.5 rounded-full text-xs font-medium cursor-pointer transition-all ${
                    tag === activeTag
                      ? 'bg-indigo-100 text-indigo-700 ring-2 ring-indigo-500'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  onClick={() => handleTagClick(tag)}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {filteredResources.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredResources.map((resource) => (
                <ResourceCard
                  key={resource._id}
                  resource={resource}
                  isAdmin={false}
                />
              ))}
            </div>
          ) : searchQuery ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <BookOpen className="w-12 h-12 text-gray-300 mb-4" />
              <p className="text-gray-500">No resources match &ldquo;{searchQuery}&rdquo;.</p>
              <p className="text-sm text-gray-400 mt-1">
                Try a different search term.
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <BookOpen className="w-12 h-12 text-gray-300 mb-4" />
              <p className="text-gray-500">No resources available yet.</p>
              <p className="text-sm text-gray-400 mt-1">
                Check back later — new resources are added regularly.
              </p>
            </div>
          )}
        </>
      )}

      {activeTab === 'faq' && <FAQSection />}
    </div>
  );
};

export default UserResources;
