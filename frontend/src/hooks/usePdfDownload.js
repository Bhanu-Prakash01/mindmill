import { useState, useCallback } from 'react';
import api from '../services/api';

/**
 * Custom hook for downloading PDFs
 * Handles loading states, error states, and Blob response processing
 * 
 * @returns {Object} Hook interface
 * @property {Function} downloadPdf - Download PDF function
 * @property {boolean} isLoading - Loading state
 * @property {string|null} error - Error message
 * @property {Function} clearError - Clear error state
 */
const usePdfDownload = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Extract filename from response headers
   * @param {Object} headers - Response headers
   * @returns {string} Filename
   */
  const extractFilename = (headers) => {
    const cd = headers['content-disposition'] || headers['Content-Disposition'] || '';
    const match = cd.match(/filename[^;]*=([^;]+)/);
    if (match) {
      return match[1].replace(/"/g, '').trim();
    }
    return `Assessment_Report_${Date.now()}.pdf`;
  };

  /**
   * Trigger browser download from Blob data
   * @param {Blob} blob - File blob
   * @param {string} filename - Filename to save as
   */
  const triggerDownload = (blob, filename) => {
    const url = window.URL.createObjectURL(new Blob([blob]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.parentNode.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  /**
   * Download PDF report
   * 
   * @param {string} reportId - Report ID
   * @param {string} assessmentType - Assessment type (disc, big5, firo, mbti, hogan)
   * @param {string} downloadType - Download type (comprehensive, summary)
   * @returns {Promise<boolean>} Success status
   */
  const downloadPdf = useCallback(async (reportId, assessmentType, downloadType) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.get(`/reports/${reportId}/download`, {
        params: {
          type: downloadType,
          assessmentType,
          _t: Date.now(),
        },
        responseType: 'blob',
      });

      const filename = extractFilename(response.headers);
      triggerDownload(response.data, filename);
      
      setIsLoading(false);
      return true;
    } catch (err) {
      const errorMessage = err.response?.data?.message 
        || err.message 
        || 'Failed to download PDF';
      
      setError(errorMessage);
      setIsLoading(false);
      return false;
    }
  }, []);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    downloadPdf,
    isLoading,
    error,
    clearError,
  };
};

export default usePdfDownload;