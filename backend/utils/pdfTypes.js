/**
 * PDF Download Type Definitions
 * Unified types for PDF download functionality
 */

/**
 * @typedef {('disc' | 'big5' | 'firo' | 'mbti' | 'hogan')} AssessmentType
 * @description Supported assessment types
 */
const AssessmentType = {
  DISC: 'disc',
  BIG5: 'big5',
  FIRO: 'firo',
  MBTI: 'mbti',
  HOGAN: 'hogan',
};

/** @readonly @type {AssessmentType[]} */
const ASSESSMENT_TYPES = Object.values(AssessmentType);

/**
 * @typedef {('comprehensive' | 'summary')} DownloadType
 * @description PDF download types
 */
const DownloadType = {
  COMPREHENSIVE: 'comprehensive',
  SUMMARY: 'summary',
};

/** @readonly @type {DownloadType[]} */
const DOWNLOAD_TYPES = Object.values(DownloadType);

/**
 * @typedef {Object} PdfDownloadOptions
 * @property {AssessmentType} assessmentType - The assessment type
 * @property {DownloadType} downloadType - Download type (comprehensive or summary)
 * @property {string} [userId] - Optional user ID
 * @property {string} [reportId] - Optional report ID
 * @property {string} [orgId] - Optional organization ID
 * @property {boolean} [includeLogo=true] - Whether to include logo
 * @property {string} [locale='en'] - Locale for content
 */

/**
 * Generates filename for PDF download
 * @param {AssessmentType} assessmentType
 * @param {DownloadType} downloadType
 * @param {string} userName - User's name
 * @returns {string} Generated filename
 */
const generatePdfFilename = (assessmentType, downloadType, userName) => {
  const timestamp = new Date().toISOString().slice(0, 10);
  const sanitizedName = (userName || 'user')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  
  return `${assessmentType}-${downloadType}-${sanitizedName}-${timestamp}.pdf`;
};

/**
 * Gets display name for assessment type
 * @param {AssessmentType} type
 * @returns {string} Display name
 */
const getAssessmentDisplayName = (type) => {
  const names = {
    disc: 'DISC',
    big5: 'Big Five',
    firo: 'FIRO-B',
    mbti: 'MBTI',
    hogan: 'Hogan',
  };
  return names[type] || type.toUpperCase();
};

/**
 * Gets display name for download type
 * @param {DownloadType} type
 * @returns {string} Display name
 */
const getDownloadTypeDisplayName = (type) => {
  const names = {
    comprehensive: 'Comprehensive Report',
    summary: 'Summary Report',
  };
  return names[type] || type;
};

/**
 * Validates assessment type
 * @param {string} type
 * @returns {boolean} True if valid
 */
const isValidAssessmentType = (type) => {
  return ASSESSMENT_TYPES.includes(type);
};

/**
 * Validates download type
 * @param {string} type
 * @returns {boolean} True if valid
 */
const isValidDownloadType = (type) => {
  return DOWNLOAD_TYPES.includes(type);
};

module.exports = {
  AssessmentType,
  ASSESSMENT_TYPES,
  DownloadType,
  DOWNLOAD_TYPES,
  generatePdfFilename,
  getAssessmentDisplayName,
  getDownloadTypeDisplayName,
  isValidAssessmentType,
  isValidDownloadType,
};