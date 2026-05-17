import React, { useState, useRef } from 'react';
import { X, Upload, FileSpreadsheet, Download, CheckCircle, XCircle, AlertCircle, Loader2, Copy, Edit3, Table } from 'lucide-react';
import { assessmentService, testTakerService } from '../services';
import { useToast } from '../context/ToastContext';
import { useEscapeKey } from '../hooks/useEscapeKey';

const BulkImportModal = ({ onClose, onSuccess }) => {
  const [step, setStep] = useState(1);
  const [selectedAssessment, setSelectedAssessment] = useState(null);
  const [assessments, setAssessments] = useState([]);
  const [loadingAssessments, setLoadingAssessments] = useState(true);
  const [file, setFile] = useState(null);
  const [expiresAt, setExpiresAt] = useState('');
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [inputMode, setInputMode] = useState('paste');
  const [inlineData, setInlineData] = useState('');
  const fileInputRef = useRef(null);
  const toast = useToast();

  useEscapeKey(handleClose);

  React.useEffect(() => {
    fetchAssessments();
  }, []);

  const fetchAssessments = async () => {
    try {
      setLoadingAssessments(true);
      const response = await assessmentService.getAssessments({ status: 'active', limit: 50 });
      const allAssessments = response.data?.assessments || [];
      const unlocked = allAssessments.filter(a => !a.isLocked);
      setAssessments(unlocked);
    } catch (err) {
      console.error('Error fetching assessments:', err);
    } finally {
      setLoadingAssessments(false);
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      const allowedTypes = [
        'text/csv',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ];
      const allowedExtensions = ['.csv', '.xlsx', '.xls'];
      const ext = selectedFile.name.toLowerCase().slice(selectedFile.name.lastIndexOf('.'));

      if (allowedTypes.includes(selectedFile.type) || allowedExtensions.includes(ext)) {
        setFile(selectedFile);
        setError(null);
      } else {
        setError('Invalid file type. Please upload a CSV or XLSX file.');
        setFile(null);
      }
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      await testTakerService.downloadTemplate();
    } catch (err) {
      toast.error('Failed to download template');
    }
  };

  const handleUpload = async () => {
    if (!selectedAssessment) {
      setError('Please select an assessment');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      let response;
      
      if (inputMode === 'paste' && inlineData.trim()) {
        // Create a file from the inline data
        const blob = new Blob([inlineData], { type: 'text/csv' });
        const csvFile = new File([blob], 'bulk_import.csv', { type: 'text/csv' });
        
        const formData = new FormData();
        formData.append('file', csvFile);
        formData.append('assessmentId', selectedAssessment._id);
        
        if (expiresAt) {
          formData.append('expiresAt', expiresAt);
        }
        
        response = await testTakerService.bulkUploadInvites(formData);
      } else if (inputMode === 'upload' && file) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('assessmentId', selectedAssessment._id);
        
        if (expiresAt) {
          formData.append('expiresAt', expiresAt);
        }
        
        response = await testTakerService.bulkUploadInvites(formData);
      } else {
        setError(inputMode === 'paste' ? 'Please paste CSV data' : 'Please select a file');
        setUploading(false);
        return;
      }
      
      setResults(response.data);
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const handleCopySample = () => {
    const sampleData = `Name,Email,Phone
John Doe,john.doe@example.com,+91 9876543210
Jane Smith,jane.smith@example.com,+91 9876543211`;
    navigator.clipboard.writeText(sampleData);
    setInlineData(sampleData);
  };

  const sampleCSV = `Name,Email,Phone
John Doe,john.doe@example.com,+91 9876543210
Jane Smith,jane.smith@example.com,+91 9876543211
Mike Johnson,mike.j@example.com,+91 9876543212`;

  const handleClose = () => {
    if (results) {
      onSuccess?.();
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Bulk Import Test Takers</h2>
            <p className="text-sm text-gray-500 mt-1">Upload a CSV or XLSX file with test taker details</p>
          </div>
          <button
            onClick={handleClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-4 mb-6 flex-wrap gap-2">
          <div className={`flex items-center gap-2 ${step >= 1 ? 'text-indigo-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step >= 1 ? 'bg-indigo-600 text-white' : 'bg-gray-200'}`}>
              1
            </div>
            <span className="text-sm font-medium">Select Assessment</span>
          </div>
          <div className="w-12 h-0.5 bg-gray-200"></div>
          <div className={`flex items-center gap-2 ${step >= 2 ? 'text-indigo-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step >= 2 ? 'bg-indigo-600 text-white' : 'bg-gray-200'}`}>
              2
            </div>
            <span className="text-sm font-medium">Upload File</span>
          </div>
          <div className="w-12 h-0.5 bg-gray-200"></div>
          <div className={`flex items-center gap-2 ${step >= 3 ? 'text-indigo-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step >= 3 ? 'bg-indigo-600 text-white' : 'bg-gray-200'}`}>
              3
            </div>
            <span className="text-sm font-medium">Results</span>
          </div>
        </div>

        {/* Step 1: Select Assessment */}
        {step === 1 && (
          <div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Assessment
              </label>
              {loadingAssessments ? (
                <div className="flex items-center gap-2 text-gray-500">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading assessments...
                </div>
              ) : assessments.length === 0 ? (
                <p className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
                  No unlocked assessments available. Admin must unlock assessments first.
                </p>
              ) : (
                <select
                  value={selectedAssessment?._id || ''}
                  onChange={(e) => {
                    const a = assessments.find(a => a._id === e.target.value);
                    setSelectedAssessment(a);
                  }}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Choose an assessment...</option>
                  {assessments.map(a => (
                    <option key={a._id} value={a._id}>
                      {a.title} ({a.category})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Expire Date - Optional */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Expire Date (Optional)
              </label>
              <input
                type="datetime-local"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
              <p className="text-xs text-gray-500 mt-1">Leave empty to use default 30 days</p>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => selectedAssessment && setStep(2)}
                disabled={!selectedAssessment}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-50"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Upload File */}
        {step === 2 && (
          <div>
            {/* Input Mode Tabs */}
            <div className="flex mb-4 border-b border-gray-200">
              <button
                onClick={() => setInputMode('paste')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  inputMode === 'paste'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Edit3 className="w-4 h-4" />
                Paste Data
              </button>
              <button
                onClick={() => setInputMode('upload')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  inputMode === 'upload'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Upload className="w-4 h-4" />
                Upload File
              </button>
            </div>

            {/* Paste Mode */}
            {inputMode === 'paste' && (
              <div>
                {/* Sample Preview Table */}
                <div className="mb-4 bg-green-50 rounded-lg p-3 border border-green-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-green-800">Format Preview:</span>
                    <button
                      onClick={handleCopySample}
                      className="text-xs flex items-center gap-1 text-green-700 hover:text-green-800"
                    >
                      <Copy className="w-3 h-3" />
                      Copy & Use Sample
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-green-100">
                          <th className="px-2 py-1 text-left font-medium text-green-900">Name</th>
                          <th className="px-2 py-1 text-left font-medium text-green-900">Email</th>
                          <th className="px-2 py-1 text-left font-medium text-green-900">Phone</th>
                        </tr>
                      </thead>
                      <tbody className="text-green-800">
                        <tr><td className="px-2 py-1">John Doe</td><td className="px-2 py-1">john@example.com</td><td className="px-2 py-1">+91 9876543210</td></tr>
                        <tr className="bg-green-50"><td className="px-2 py-1">Jane Smith</td><td className="px-2 py-1">jane@example.com</td><td className="px-2 py-1">+91 9876543211</td></tr>
                        <tr><td className="px-2 py-1">...</td><td className="px-2 py-1">...</td><td className="px-2 py-1">...</td></tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* CSV Text Area */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Paste CSV Data (with header row)
                  </label>
                  <textarea
                    value={inlineData}
                    onChange={(e) => setInlineData(e.target.value)}
                    placeholder={`Name,Email,Phone\nJohn Doe,john@example.com,+91 9876543210\nJane Smith,jane@example.com,+91 9876543211`}
                    rows={8}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg font-mono text-sm focus:ring-2 focus:ring-indigo-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    First row should be: <code className="bg-gray-100 px-1 rounded">Name,Email,Phone</code>
                  </p>
                </div>
              </div>
            )}

            {/* Upload Mode */}
            {inputMode === 'upload' && (
              <div>
                {/* Download Template */}
                <button
                  onClick={handleDownloadTemplate}
                  className="w-full mb-4 flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-indigo-400 hover:bg-indigo-50 transition-colors"
                >
                  <Download className="w-5 h-5 text-gray-400" />
                  <span className="text-sm text-gray-600">Download CSV Template</span>
                </button>

                {/* File Upload */}
                <div
                  className={`mb-4 border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                    file ? 'border-indigo-400 bg-indigo-50' : 'border-gray-300 hover:border-indigo-400'
                  }`}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  {file ? (
                    <div className="flex items-center justify-center gap-3">
                      <FileSpreadsheet className="w-8 h-8 text-indigo-600" />
                      <div className="text-left">
                        <p className="font-medium text-gray-900">{file.name}</p>
                        <p className="text-sm text-gray-500">
                          {(file.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-600">Click to upload or drag and drop</p>
                      <p className="text-sm text-gray-400 mt-1">CSV or XLSX files only</p>
                    </>
                  )}
                </div>

                {/* File Format Info */}
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <h4 className="font-medium text-gray-900 mb-2">Expected Columns:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li><code className="bg-gray-200 px-1 rounded">Name</code> - Test taker's full name</li>
                    <li><code className="bg-gray-200 px-1 rounded">Email</code> - Valid email address</li>
                    <li><code className="bg-gray-200 px-1 rounded">Phone</code> - Contact number</li>
                  </ul>
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 text-red-600 bg-red-50 rounded-lg p-3 mb-4">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleUpload}
                disabled={uploading || (inputMode === 'upload' && !file) || (inputMode === 'paste' && !inlineData.trim())}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Upload & Send Invitations
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Results */}
        {step === 3 && results && (
          <div>
            {/* Summary */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-green-600">{results.success?.length || 0}</p>
                <p className="text-sm text-green-700">Created</p>
              </div>
              <div className="bg-amber-50 rounded-lg p-4 text-center">
                <AlertCircle className="w-8 h-8 text-amber-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-amber-600">{results.skipped || 0}</p>
                <p className="text-sm text-amber-700">Skipped</p>
              </div>
              <div className="bg-red-50 rounded-lg p-4 text-center">
                <XCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-red-600">{results.failed?.length || 0}</p>
                <p className="text-sm text-red-700">Failed</p>
              </div>
            </div>

            {/* Failed Rows */}
            {results.failed && results.failed.length > 0 && (
              <div className="mb-4">
                <h4 className="font-medium text-gray-900 mb-2">Failed Entries:</h4>
                <div className="bg-red-50 rounded-lg p-3 max-h-40 overflow-y-auto">
                  <ul className="text-sm text-red-700 space-y-1">
                    {results.failed.map((item, idx) => (
                      <li key={idx}>
                        Row {item.row}: {item.name || item.email} - {item.reason}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Email Failed Rows */}
            {results.success && results.success.filter(s => !s.emailSent).length > 0 && (
              <div className="mb-4">
                <h4 className="font-medium text-gray-900 mb-2">Email Not Sent (Invalid Email):</h4>
                <div className="bg-amber-50 rounded-lg p-3 max-h-40 overflow-y-auto">
                  <ul className="text-sm text-amber-700 space-y-1">
                    {results.success.filter(s => !s.emailSent).map((item, idx) => (
                      <li key={idx}>
                        {item.name} ({item.email}) - Please provide a valid email address
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Success Message */}
            <div className="bg-green-50 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <p className="text-green-700">
                  {results.success?.filter(s => s.emailSent).length || 0} invitations sent via email,{' '}
                  {results.success?.filter(s => !s.emailSent).length || 0} emails failed - please provide valid email addresses and resend
                </p>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  setStep(1);
                  setFile(null);
                  setSelectedAssessment(null);
                  setResults(null);
                  setExpiresAt('');
                }}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Import More
              </button>
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BulkImportModal;
