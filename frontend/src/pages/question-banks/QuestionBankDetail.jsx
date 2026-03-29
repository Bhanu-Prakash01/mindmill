import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { questionBankService, assessmentService } from '../../services';
import { ArrowLeft, Plus, Download, Upload, Trash2, Edit2, FileText, AlertTriangle } from 'lucide-react';

const QuestionBankDetail = () => {
  const { assessmentId, dimension, orgSlug } = useParams();
  const navigate = useNavigate();
  const [assessment, setAssessment] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importData, setImportData] = useState('');

  useEffect(() => {
    fetchAssessment();
    fetchQuestions();
  }, [assessmentId, dimension]);

  const fetchAssessment = async () => {
    try {
      const response = await assessmentService.getAssessment(assessmentId);
      setAssessment(response.data?.assessment);
    } catch (error) {
      console.error('Error fetching assessment:', error);
    }
  };

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const response = await questionBankService.getQuestionsBySet(assessmentId, dimension);
      setQuestions(response.data?.questions || []);
    } catch (error) {
      console.error('Error fetching questions:', error);
      alert('Failed to load questions');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const response = await questionBankService.exportQuestionSet(assessmentId, dimension);
      const dataStr = JSON.stringify(response.data, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${dimension}_questions.json`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting:', error);
      alert('Failed to export question set');
    }
  };

  const handleImport = async () => {
    try {
      const data = JSON.parse(importData);
      await questionBankService.importQuestionSet(assessmentId, {
        dimension: data.dimension || dimension,
        questions: data.questions
      });
      await fetchQuestions();
      setShowImportModal(false);
      setImportData('');
      alert('Questions imported successfully!');
    } catch (error) {
      console.error('Error importing:', error);
      alert('Invalid JSON format. Please check the file.');
    }
  };

  const handleDeleteSet = async () => {
    if (!confirm(`Are you sure you want to delete all ${questions.length} questions in this set? This action cannot be undone.`)) {
      return;
    }

    try {
      await questionBankService.deleteQuestionSet(assessmentId, dimension);
      navigate(orgSlug ? `/o/${orgSlug}/question-banks` : '/question-banks');
    } catch (error) {
      console.error('Error deleting set:', error);
      alert('Failed to delete question set');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(orgSlug ? `/o/${orgSlug}/question-banks` : '/question-banks')}
            className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {dimension} Question Set
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {assessment?.title} • {questions.length} questions
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          <button
            onClick={() => setShowImportModal(true)}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            Import
          </button>
          <button
            onClick={handleDeleteSet}
            className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Delete Set
          </button>
        </div>
      </div>

      {/* Questions List */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-200 border-t-indigo-600"></div>
        </div>
      ) : questions.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-200">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No questions in this set</p>
          <p className="text-sm text-gray-400 mt-2">Import questions or add them manually</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Question Text
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  {dimension === 'DISC' && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Statements
                    </th>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trait
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Marks
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {questions.map((q, index) => (
                  <tr key={q._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {q.order || index + 1}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-md truncate">
                      {q.questionText}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        q.type === 'disc-ranking' ? 'bg-purple-100 text-purple-700' :
                        q.type === 'rating' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {q.type}
                      </span>
                    </td>
                    {dimension === 'DISC' && (
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {q.statements?.length || 0} statements
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {q.trait && (
                        <span className="px-2 py-1 text-xs font-medium bg-indigo-100 text-indigo-700 rounded-full">
                          {q.trait}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {q.marks}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Import Question Set</h2>
              <p className="text-sm text-gray-500 mt-1">
                Paste JSON data exported from another question set
              </p>
            </div>
            
            <div className="p-6 flex-1 overflow-y-auto">
              <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="text-sm text-amber-800">
                    <p className="font-medium mb-1">Important Notes:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Questions will be added to the existing set</li>
                      <li>Order numbers will be automatically adjusted</li>
                      <li>Ensure the JSON format matches the export format</li>
                    </ul>
                  </div>
                </div>
              </div>

              <textarea
                value={importData}
                onChange={(e) => setImportData(e.target.value)}
                placeholder='Paste JSON here...'
                className="w-full h-64 p-4 border border-gray-200 rounded-lg font-mono text-sm focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowImportModal(false);
                  setImportData('');
                }}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleImport}
                disabled={!importData.trim()}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                Import Questions
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestionBankDetail;
