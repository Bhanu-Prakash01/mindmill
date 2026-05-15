import { useState } from 'react';
import {
  Video,
  FileText,
  Image,
  Link,
  ExternalLink,
  Download,
  Edit3,
  Trash2,
  Tag,
} from 'lucide-react';
import FilePreviewModal from '../../components/FilePreviewModal';

const getEmbedUrl = (url) => {
  if (!url) return '';
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;
  const vimeoMatch = url.match(/(?:vimeo\.com\/)(\d+)/);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  return url;
};

const TYPE_META = {
  video: {
    icon: Video,
    badge: 'bg-blue-100 text-blue-700',
    label: 'Video',
  },
  pdf: {
    icon: FileText,
    badge: 'bg-amber-100 text-amber-700',
    label: 'PDF',
  },
  image: {
    icon: Image,
    badge: 'bg-green-100 text-green-700',
    label: 'Image',
  },
  link: {
    icon: Link,
    badge: 'bg-purple-100 text-purple-700',
    label: 'Link',
  },
};

const ResourceCard = ({ resource, isAdmin, onEdit, onDelete }) => {
  const [previewFile, setPreviewFile] = useState(null);

  const type = resource?.type || 'link';
  const meta = TYPE_META[type] || TYPE_META.link;
  const TypeIcon = meta.icon;

  const handlePreview = (url, mimeType) => {
    setPreviewFile({ url, type: mimeType });
  };

  const renderVideoContent = () => {
    const embedUrl = getEmbedUrl(resource.videoUrl);
    return (
      <div className="relative w-full pt-[56.25%] bg-black rounded-t-xl overflow-hidden">
        <iframe
          src={embedUrl}
          title={resource.title}
          className="absolute inset-0 w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  };

  const renderPdfContent = () => (
    <div className="flex flex-col items-center justify-center py-10 px-4 bg-gray-50 rounded-t-xl">
      <FileText className="w-16 h-16 text-amber-500 mb-3" />
      <p className="text-sm text-gray-500 text-center mb-4 line-clamp-2">
        {resource.description || 'PDF Document'}
      </p>
      <div className="flex items-center gap-3">
        <button
          onClick={() => handlePreview(resource.fileUrl, 'application/pdf')}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <FileText className="w-4 h-4" />
          Preview
        </button>
        <a
          href={resource.fileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
        >
          <Download className="w-4 h-4" />
          Download
        </a>
      </div>
    </div>
  );

  const renderImageContent = () => (
    <div
      className="relative w-full h-48 bg-gray-100 rounded-t-xl overflow-hidden cursor-pointer group"
      onClick={() => handlePreview(resource.fileUrl, 'image/jpeg')}
    >
      <img
        src={resource.thumbnail || resource.fileUrl}
        alt={resource.title}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
      />
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
        <Image className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
      </div>
    </div>
  );

  const renderLinkContent = () => (
    <div className="flex flex-col items-center justify-center py-10 px-4 bg-gray-50 rounded-t-xl">
      <Link className="w-16 h-16 text-purple-500 mb-3" />
      <p className="text-sm text-gray-500 text-center mb-4 line-clamp-2">
        {resource.description || 'External Link'}
      </p>
      <a
        href={resource.linkUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors"
      >
        <ExternalLink className="w-4 h-4" />
        Open Link
      </a>
    </div>
  );

  const renderContent = () => {
    switch (type) {
      case 'video':
        return renderVideoContent();
      case 'pdf':
        return renderPdfContent();
      case 'image':
        return renderImageContent();
      case 'link':
        return renderLinkContent();
      default:
        return renderLinkContent();
    }
  };

  return (
    <>
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-lg transition-shadow flex flex-col relative">
        <div className="absolute top-3 right-3 z-10">
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold shadow-sm ${meta.badge}`}
          >
            <TypeIcon className="w-3.5 h-3.5" />
            {meta.label}
          </span>
        </div>

        {renderContent()}

        <div className="flex-1 flex flex-col p-4">
          <h3 className="text-base font-semibold text-gray-900 mb-1 line-clamp-2">
            {resource.title}
          </h3>

          {resource.description && (
            <p className="text-sm text-gray-500 mb-3 line-clamp-2">
              {resource.description}
            </p>
          )}

          {resource.tags && resource.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {resource.tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700"
                >
                  <Tag className="w-3 h-3" />
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div className="flex-1 min-h-0" />

          {isAdmin && (
            <div className="flex items-center justify-end gap-1 pt-3 border-t border-gray-100">
              <button
                onClick={() => onEdit?.(resource)}
                className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                title="Edit resource"
              >
                <Edit3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => onDelete?.(resource)}
                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Delete resource"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {previewFile && (
        <FilePreviewModal
          file={previewFile}
          onClose={() => setPreviewFile(null)}
        />
      )}
    </>
  );
};

export default ResourceCard;
