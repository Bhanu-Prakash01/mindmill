import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { questionBankService, assessmentService } from '../../services';
import { FileText, Search, Plus, Eye, Download, Upload, Trash2, Filter } from 'lucide-react';

const QuestionBankList = () => {
  const navigate = useNavigate();
  const { orgSlug } = useParams();
  const orgPrefix = orgSlug ? `/o/${orgSlug}` : '';
  const [questionBanks, setQuestionBanks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [dimensionFilter, setDimensionFilter] = useState('');

  useEffect(() => {
    fetchQuestionBanks();
  }, []);

  const fetchQuestionBanks = async () => {
    setLoading(true);
    try {
      const params = {};
      if (categoryFilter) params.category = categoryFilter;
      if (dimensionFilter) params.dimension = dimensionFilter;
      
      const response = await questionBankService.getQuestionBanks(params);
      setQuestionBanks(response.data?.questionBanks || []);
    } catch (error) {
      console.error('Error fetching question banks:', error);
      alert('Failed to load question banks');
    } finally {
      setLoading(false);
    }
  };

  const handleExportSet = async (bank) => {
    try {
      const response = await questionBankService.exportQuestionSet(bank._id, bank.dimension);
      const dataStr = JSON.stringify(response.data, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${bank.title.replace(/\s+/g, '_')}_${bank.dimension}_questions.json`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting question set:', error);
      alert('Failed to export question set');
    }
  };

  const filteredBanks = questionBanks.filter(bank => {
    const matchesSearch = bank.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !categoryFilter || bank.category === categoryFilter;
    const matchesDimension = !dimensionFilter || bank.dimension === dimensionFilter;
    return matchesSearch && matchesCategory && matchesDimension;
  });

  const categories = [...new Set(questionBanks.map(b => b.category))].filter(Boolean);
  const dimensions = [...new Set(questionBanks.map(b => b.dimension))].filter(Boolean);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Question Bank</h1>
          <p className="text-gray-500 mt-1">Manage and organize question sets across assessments</p>
        </div>
        <button
          onClick={() => navigate(`${orgPrefix}/assessments`)}
          className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Assessment
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search question banks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>
          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div>
            <select
              value={dimensionFilter}
              onChange={(e) => setDimensionFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Dimensions</option>
              {dimensions.map(dim => (
                <option key={dim} value={dim}>{dim}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            {(categoryFilter || dimensionFilter || searchQuery) && (
              <button
                onClick={() => {
                  setCategoryFilter('');
                  setDimensionFilter('');
                  setSearchQuery('');
                }}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Question Banks Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-200 border-t-indigo-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBanks.length === 0 ? (
            <div className="col-span-full text-center py-16">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No question banks found</p>
              <p className="text-sm text-gray-400 mt-2">Create an assessment and add questions to get started</p>
            </div>
          ) : (
            filteredBanks.map((bank) => (
              <div
                key={bank._id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                      <FileText className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{bank.title}</h3>
                      {bank.dimension && (
                        <span className="inline-block px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded text-xs font-medium">
                          {bank.dimension}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Questions:</span>
                    <span className="font-medium text-gray-900">{bank.questionCount}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Category:</span>
                    <span className="font-medium text-gray-900 capitalize">{bank.category || 'N/A'}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Question Range:</span>
                    <span className="font-medium text-gray-900">{bank.minOrder}-{bank.maxOrder}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-4 border-t border-gray-100">
                  <button
                    onClick={() => navigate(`${orgPrefix}/question-banks/${bank._id}/sets/${bank.dimension}`)}
                    className="flex-1 px-3 py-2 text-sm bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors flex items-center justify-center gap-1"
                  >
                    <Eye className="w-4 h-4" />
                    View Questions
                  </button>
                  <button
                    onClick={() => handleExportSet(bank)}
                    className="px-3 py-2 text-sm bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                    title="Export Question Set"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default QuestionBankList;
