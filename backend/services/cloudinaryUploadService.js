/**
 * Cloudinary Upload Service
 *
 * Upload, delete, and update files on Cloudinary.
 * Accepts buffers directly (no local temp files needed).
 *
 * Usage:
 *   const { uploadFile, deleteFile, updateFile } = require('./cloudinaryUploadService');
 *   const result = await uploadFile(buffer, { folder: 'mindmill/resources/', publicId: 'my-file' });
 */

const cloudinary = require('../config/cloudinary');

const DEFAULT_FOLDER = 'mindmill/resources/';

/**
 * Upload a file to Cloudinary.
 *
 * @param {Buffer|string} file - File buffer (from multer memoryStorage) or file path
 * @param {Object}        [options] - Upload options
 * @param {string}        [options.publicId] - Optional custom public ID
 * @param {string}        [options.folder]   - Cloudinary folder (default: mindmill/resources/)
 * @param {Object}        [options.extra]    - Additional Cloudinary upload options
 * @returns {Promise<{url: string, publicId: string, format: string, bytes: number}>}
 */
function uploadFile(file, options = {}) {
  const folder = options.folder || DEFAULT_FOLDER;
  const publicId = options.publicId || undefined;
  const extra = options.extra || {};

  return new Promise((resolve, reject) => {
    const uploadOptions = {
      resource_type: 'auto',
      folder,
      public_id: publicId,
      ...extra
    };

    Object.keys(uploadOptions).forEach(
      (key) => uploadOptions[key] === undefined && delete uploadOptions[key]
    );

    const doUpload = (error, result) => {
      if (error) {
        return reject(error);
      }
      resolve({
        url: result.secure_url || result.url,
        publicId: result.public_id,
        format: result.format,
        bytes: result.bytes
      });
    };

    if (Buffer.isBuffer(file)) {
      const stream = cloudinary.uploader.upload_stream(uploadOptions, doUpload);
      stream.end(file);
    } else {
      cloudinary.uploader.upload(file, uploadOptions, doUpload);
    }
  });
}

/**
 * Delete a file from Cloudinary by public_id.
 *
 * @param {string} publicId - The public_id of the file to delete
 * @param {Object} [options] - Additional destroy options (e.g., { resource_type: 'raw' })
 * @returns {Promise<Object>} Cloudinary deletion result (e.g., { result: 'ok' })
 */
async function deleteFile(publicId, options = {}) {
  try {
    const result = await cloudinary.uploader.destroy(publicId, options);
    return result;
  } catch (error) {
    console.error(`[cloudinaryUploadService] Error deleting ${publicId}:`, error.message);
    return { result: 'not_found', publicId };
  }
}

/**
 * Update (replace) a file on Cloudinary.
 *
 * Uploads the new file, then fire-and-forget deletes the old one.
 *
 * @param {Buffer|string} file       - New file buffer or path
 * @param {string}        [oldPublicId] - Public ID of the file to replace (optional)
 * @param {Object}        [options]     - Upload options (same as uploadFile)
 * @returns {Promise<{url: string, publicId: string, format: string, bytes: number}>}
 */
async function updateFile(file, oldPublicId, options = {}) {
  const result = await uploadFile(file, options);

  if (oldPublicId) {
    deleteFile(oldPublicId).catch((err) => {
      console.error(
        `[cloudinaryUploadService] Failed to delete old file ${oldPublicId}:`,
        err.message
      );
    });
  }

  return result;
}

module.exports = {
  uploadFile,
  deleteFile,
  updateFile
};
