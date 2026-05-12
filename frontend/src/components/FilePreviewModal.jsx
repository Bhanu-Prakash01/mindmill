import { X, Download, FileText, File as FileIcon, FileImage } from 'lucide-react';
import { useEscapeKey } from '../hooks/useEscapeKey';

const getFileType = (type) => {
  if (!type) return 'unknown';
  if (type.startsWith('image/')) return 'image';
  if (type.includes('pdf')) return 'pdf';
  return 'other';
};

const getHeaderIcon = (type) => {
  if (!type) return FileIcon;
  if (type.startsWith('image/')) return FileImage;
  if (type.includes('pdf')) return FileText;
  return FileIcon;
};

const FilePreviewModal = ({ file, onClose }) => {
  useEscapeKey(onClose);

  if (!file) return null;

  const fileType = getFileType(file.type);
  const HeaderIcon = getHeaderIcon(file.type);
  const baseUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || '';
  const fileUrl = file.url.startsWith('http') ? file.url : `${baseUrl}${file.url}`;

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-xl max-w-5xl w-full max-h-[95vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-end px-5 py-3 border-b border-gray-200 shrink-0 gap-2">
          <a
            href={fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            title="Download"
          >
            <Download className="w-4 h-4" />
            Download
          </a>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto bg-gray-900 rounded-b-xl flex items-center justify-center">
          {fileType === 'image' ? (
            <img
              src={fileUrl}
              alt="Preview"
              className="max-w-full max-h-[90vh] object-contain"
            />
          ) : fileType === 'pdf' ? (
            <iframe
              src={fileUrl}
              title="PDF Preview"
              className="w-full h-[90vh] bg-white"
            />
          ) : (
            <div className="flex flex-col items-center gap-4 py-12">
              <FileIcon className="w-20 h-20 text-gray-500" />
              <p className="text-gray-400 text-sm">Preview not available for this file type.</p>
              <a
                href={fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
              >
                <Download className="w-4 h-4" />
                Download to View
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FilePreviewModal;
