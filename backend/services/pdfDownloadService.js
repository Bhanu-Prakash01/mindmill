/**
 * PDF Download Service
 * Unified service for generating and downloading PDF reports
 * 
 * @module services/pdfDownloadService
 */

const {
  generateDiscReportPdf,
  generateBig5ReportPdf,
  generateFiroReportPdf,
  generateMbtiReportPdf,
  generateQuickSummaryPdf,
  generateHoganReportPdf,
  generateSjtReportPdf,
  generatePclaReportPdf,
  generateEctiReportPdf,
  getCachedPdf,
  savePdfToDisk,
} = require('./pdfService');

const {
  AssessmentType,
  DownloadType,
  isValidAssessmentType,
  isValidDownloadType,
  getAssessmentDisplayName,
  getDownloadTypeDisplayName,
} = require('../utils/pdfTypes');

// In-memory cache for generated PDFs
// In production, consider using Redis or similar for distributed caching
const pdfCache = new Map();

/**
 * Cache configuration
 */
const CACHE_CONFIG = {
  maxSize: 100, // Maximum number of cached PDFs
  ttl: 1000 * 60 * 30, // 30 minutes TTL
};

/**
 * Generate cache key for PDF
 * @param {string} reportId
 * @param {string} assessmentType
 * @param {string} downloadType
 * @returns {string} Cache key
 */
const generateCacheKey = (reportId, assessmentType, downloadType) => {
  return `${reportId}:${assessmentType}:${downloadType}`;
};

/**
 * Get cached PDF if available and valid
 * @param {string} reportId
 * @param {string} assessmentType
 * @param {string} downloadType
 * @returns {Buffer|null} Cached PDF buffer or null
 */
const getCachedPdfFromMemory = (reportId, assessmentType, downloadType) => {
  const key = generateCacheKey(reportId, assessmentType, downloadType);
  const cached = pdfCache.get(key);
  
  if (cached) {
    const isExpired = Date.now() - cached.timestamp > CACHE_CONFIG.ttl;
    if (!isExpired) {
      return cached.buffer;
    }
    pdfCache.delete(key);
  }
  
  return null;
};

/**
 * Save PDF to memory cache
 * @param {string} reportId
 * @param {string} assessmentType
 * @param {string} downloadType
 * @param {Buffer} buffer
 */
const savePdfToMemoryCache = (reportId, assessmentType, downloadType, buffer) => {
  // Evict oldest if cache is full
  if (pdfCache.size >= CACHE_CONFIG.maxSize) {
    let oldestKey = null;
    let oldestTime = Infinity;
    
    for (const [key, value] of pdfCache.entries()) {
      if (value.timestamp < oldestTime) {
        oldestTime = value.timestamp;
        oldestKey = key;
      }
    }
    
    if (oldestKey) {
      pdfCache.delete(oldestKey);
    }
  }
  
  const key = generateCacheKey(reportId, assessmentType, downloadType);
  pdfCache.set(key, {
    buffer,
    timestamp: Date.now(),
  });
};

/**
 * Validate PDF generation parameters
 * @param {string} assessmentType
 * @param {string} downloadType
 * @throws {Error} If validation fails
 */
const validateParams = (assessmentType, downloadType) => {
  if (!isValidAssessmentType(assessmentType)) {
    const validTypes = Object.values(AssessmentType).join(', ');
    throw new Error(
      `Invalid assessment type: ${assessmentType}. Valid types: ${validTypes}`
    );
  }
  
  if (!isValidDownloadType(downloadType)) {
    const validTypes = Object.values(DownloadType).join(', ');
    throw new Error(
      `Invalid download type: ${downloadType}. Valid types: ${validTypes}`
    );
  }
};

/**
 * Unified PDF download function
 * Generates and returns PDF buffer based on assessment and download types
 * 
 * @param {Object} report - Report data object
 * @param {Object} testTaker - Test taker data object
 * @param {AssessmentType|string} assessmentType - Assessment type (disc, big5, firo, mbti, hogan)
 * @param {DownloadType|string} downloadType - Download type (comprehensive, summary)
 * @returns {Promise<{buffer: Buffer, filename: string}>} PDF buffer and filename
 * @throws {Error} If parameters are invalid or generation fails
 */
const downloadPdf = async (report, testTaker, assessmentType, downloadType) => {
  // Validate parameters
  validateParams(assessmentType, downloadType);
  
  const reportId = report?._id?.toString() || report?.id || 'unknown';
  
  // Check memory cache first
  const cachedBuffer = getCachedPdfFromMemory(reportId, assessmentType, downloadType);
  if (cachedBuffer) {
    // Import filename generator dynamically to avoid circular deps
    const { generatePdfFilename } = require('../utils/pdfTypes');
    const userName = testTaker?.name || testTaker?.firstName || '';
    const filename = generatePdfFilename(assessmentType, downloadType, userName);
    
    return {
      buffer: cachedBuffer,
      filename,
    };
  }
  
  // Check file-based cache (from pdfService) — include downloadType to avoid summary/comprehensive collision
  const fileCached = getCachedPdf(reportId, `${assessmentType}_${downloadType}`);
  if (fileCached) {
    const { generatePdfFilename } = require('../utils/pdfTypes');
    const userName = testTaker?.name || testTaker?.firstName || '';
    const filename = generatePdfFilename(assessmentType, downloadType, userName);
    
    // Save to memory cache for faster subsequent access
    savePdfToMemoryCache(reportId, assessmentType, downloadType, fileCached);
    
    return {
      buffer: fileCached,
      filename,
    };
  }
  
  // Determine whether to generate comprehensive or summary
  const isComprehensive = downloadType === DownloadType.COMPREHENSIVE;
  
  let pdfBuffer;
  
  // Dispatch to appropriate generator based on assessment type
  switch (assessmentType) {
    case AssessmentType.DISC:
      if (isComprehensive) {
        pdfBuffer = await generateDiscReportPdf(report, testTaker);
      } else {
        pdfBuffer = await generateQuickSummaryPdf('disc', report, testTaker);
      }
      break;
      
    case AssessmentType.BIG5:
      if (isComprehensive) {
        pdfBuffer = await generateBig5ReportPdf(report, testTaker);
      } else {
        pdfBuffer = await generateQuickSummaryPdf('big5', report, testTaker);
      }
      break;
      
    case AssessmentType.FIRO:
      if (isComprehensive) {
        pdfBuffer = await generateFiroReportPdf(report, testTaker);
      } else {
        pdfBuffer = await generateQuickSummaryPdf('firo', report, testTaker);
      }
      break;
      
    case AssessmentType.MBTI:
      if (isComprehensive) {
        pdfBuffer = await generateMbtiReportPdf(report, testTaker);
      } else {
        pdfBuffer = await generateQuickSummaryPdf('mbti', report, testTaker);
      }
      break;
      
    case AssessmentType.HOGAN:
      if (isComprehensive) {
        pdfBuffer = await generateHoganReportPdf(report, testTaker);
      } else {
        pdfBuffer = await generateQuickSummaryPdf('hogan', report, testTaker);
      }
      break;

    case AssessmentType.SJT:
      pdfBuffer = await generateSjtReportPdf(report, testTaker, { summary: !isComprehensive });
      break;

    case AssessmentType.PCLA:
      pdfBuffer = await generatePclaReportPdf(report, testTaker, { summary: !isComprehensive });
      break;

    case AssessmentType.ECTI:
      pdfBuffer = await generateEctiReportPdf(report, testTaker);
      break;
      
    default:
      // Fallback to summary for unknown types
      pdfBuffer = await generateQuickSummaryPdf(assessmentType, report, testTaker);
  }
  
  // Validate PDF was generated
  if (!pdfBuffer || pdfBuffer.length === 0) {
    throw new Error(`Failed to generate PDF for ${assessmentType} ${downloadType} report`);
  }
  
  // Save to caches — include downloadType so summary/comprehensive don't collide
  savePdfToDisk(pdfBuffer, reportId, `${assessmentType}_${downloadType}`);
  savePdfToMemoryCache(reportId, assessmentType, downloadType, pdfBuffer);
  
  // Generate filename
  const { generatePdfFilename: generateFilename } = require('../utils/pdfTypes');
  const userName = testTaker?.name || testTaker?.firstName || '';
  const filename = generateFilename(assessmentType, downloadType, userName);
  
  return {
    buffer: pdfBuffer,
    filename,
  };
};

/**
 * Clear PDF cache for a specific report
 * @param {string} reportId - Report ID
 * @param {string} [assessmentType] - Optional assessment type filter
 * @param {string} [downloadType] - Optional download type filter
 */
const clearPdfCache = (reportId, assessmentType, downloadType) => {
  if (assessmentType && downloadType) {
    const key = generateCacheKey(reportId, assessmentType, downloadType);
    pdfCache.delete(key);
  } else {
    // Clear all related cache entries
    for (const key of pdfCache.keys()) {
      if (key.startsWith(`${reportId}:`)) {
        pdfCache.delete(key);
      }
    }
  }
};

/**
 * Clear all PDF caches (memory and file-based)
 * @param {string} reportId - Report ID
 */
const clearAllPdfCaches = async (reportId) => {
  clearPdfCache(reportId);
  // File-based cache clearing is handled in pdfService
};

/**
 * Get cache statistics
 * @returns {Object} Cache stats
 */
const getCacheStats = () => {
  return {
    memoryCacheSize: pdfCache.size,
    maxMemoryCache: CACHE_CONFIG.maxSize,
    ttlMinutes: CACHE_CONFIG.ttl / (1000 * 60),
  };
};

module.exports = {
  downloadPdf,
  clearPdfCache,
  clearAllPdfCaches,
  getCacheStats,
  AssessmentType,
  DownloadType,
  getAssessmentDisplayName,
  getDownloadTypeDisplayName,
};