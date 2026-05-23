import { useState, useEffect } from 'react';
import { resourceService } from '../../services';
import { useToast } from '../../context/ToastContext';
import ResourceCard from './ResourceCard';
import FAQSection from './FAQSection';
import {
  Plus,
  BookOpen,
  X,
  Link,
  Video,
  Trash2,
  Search,
  HelpCircle,
} from 'lucide-react';

const initialFormValues = {
  title: '',
  description: '',
  type: 'link',
  videoUrl: '',
  linkUrl: '',
  file: null,
  tags: '',
};

const AdminResources = () => {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('resources');
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTag, setActiveTag] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingResource, setEditingResource] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingResource, setDeletingResource] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formValues, setFormValues] = useState(initialFormValues);

  useEffect(() => {
    fetchResources();
  }, []);

  const fetchResources = async (tag) => {
    try {
      setLoading(true);
      const params = tag ? { tag } : {};
      const response = await resourceService.getAllResources(params);
      setResources(response.data?.resources || []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch resources');
    } finally {
      setLoading(false);
    }
  };

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
    const newTag = activeTag === tag ? null : tag;
    setActiveTag(newTag);
    fetchResources(newTag);
  };

  const handleAllClick = () => {
    setActiveTag(null);
    fetchResources(null);
  };

  const openAddModal = () => {
    setEditingResource(null);
    setFormValues(initialFormValues);
    setShowFormModal(true);
  };

  const openEditModal = (resource) => {
    setEditingResource(resource);
    setFormValues({
      title: resource.title || '',
      description: resource.description || '',
      type: resource.type || 'link',
      videoUrl: resource.videoUrl || '',
      linkUrl: resource.linkUrl || '',
      file: null,
      tags: (resource.tags || []).join(', '),
    });
    setShowFormModal(true);
  };

  const closeFormModal = () => {
    setShowFormModal(false);
    setEditingResource(null);
    setFormValues(initialFormValues);
  };

  const openDeleteModal = (resource) => {
    setDeletingResource(resource);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setDeletingResource(null);
  };

  const handleFileChange = (e) => {
    setFormValues({ ...formValues, file: e.target.files[0] });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (!editingResource && (formValues.type === 'pdf' || formValues.type === 'image') && !formValues.file) {
        toast.warning('Please select a file to upload');
        setSubmitting(false);
        return;
      }

      const formData = new FormData();
      formData.append('title', formValues.title);
      formData.append('description', formValues.description);
      formData.append('type', formValues.type);
      if (formValues.type === 'video') {
        formData.append('videoUrl', formValues.videoUrl);
      }
      if (formValues.type === 'link') {
        formData.append('linkUrl', formValues.linkUrl);
      }
      if (formValues.file) {
        formData.append('resourceFile', formValues.file);
      }
      if (formValues.tags) {
        formData.append('tags', formValues.tags);
      }

      if (editingResource) {
        await resourceService.updateResource(editingResource._id, formData);
        toast.success('Resource updated successfully');
      } else {
        await resourceService.createResource(formData);
        toast.success('Resource created successfully');
      }

      closeFormModal();
      fetchResources(activeTag);
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          `Failed to ${editingResource ? 'update' : 'create'} resource`
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setSubmitting(true);
    try {
      await resourceService.deleteResource(deletingResource._id);
      toast.success('Resource deleted successfully');
      closeDeleteModal();
      fetchResources(activeTag);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete resource');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Resources</h1>
          <p className="text-gray-500 mt-1">Manage learning resources, materials and FAQs</p>
        </div>
        {activeTab === 'resources' && (
          <button
            onClick={openAddModal}
            className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Resource
          </button>
        )}
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
              <button
                onClick={handleAllClick}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  !activeTag
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                All
              </button>
              {allTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => handleTagClick(tag)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    activeTag === tag
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {tag}
                  {activeTag === tag && <X className="w-3 h-3" />}
                </button>
              ))}
            </div>
          )}

          {filteredResources.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">
                {searchQuery
                  ? `No resources match "${searchQuery}".`
                  : "No resources yet. Click 'Add Resource' to create one."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredResources.map((resource) => (
                <ResourceCard
                  key={resource._id}
                  resource={resource}
                  isAdmin={true}
                  onEdit={() => openEditModal(resource)}
                  onDelete={() => openDeleteModal(resource)}
                />
              ))}
            </div>
          )}
        </>
      )}

      {activeTab === 'faq' && <FAQSection />}

      {showFormModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeFormModal();
          }}
        >
          <div className="bg-white rounded-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                {editingResource ? 'Edit Resource' : 'Add Resource'}
              </h2>
              <button
                onClick={closeFormModal}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formValues.title}
                  onChange={(e) =>
                    setFormValues({ ...formValues, title: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter resource title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={formValues.description}
                  onChange={(e) =>
                    setFormValues({ ...formValues, description: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500"
                  placeholder="Brief description of the resource"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={formValues.type}
                  onChange={(e) =>
                    setFormValues({ ...formValues, type: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="link">Link</option>
                  <option value="video">Video</option>
                  <option value="pdf">PDF</option>
                  <option value="image">Image</option>
                </select>
              </div>

              {formValues.type === 'video' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Video URL <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Video className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="url"
                      value={formValues.videoUrl}
                      onChange={(e) =>
                        setFormValues({ ...formValues, videoUrl: e.target.value })
                      }
                      className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500"
                      placeholder="https://youtube.com/watch?v=..."
                    />
                  </div>
                </div>
              )}

              {formValues.type === 'link' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    External URL <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Link className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="url"
                      value={formValues.linkUrl}
                      onChange={(e) =>
                        setFormValues({ ...formValues, linkUrl: e.target.value })
                      }
                      className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500"
                      placeholder="https://example.com/resource"
                    />
                  </div>
                </div>
              )}

              {(formValues.type === 'pdf' || formValues.type === 'image') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {editingResource ? 'Upload new file (optional)' : 'Upload file'}{' '}
                    {!editingResource && <span className="text-red-500">*</span>}
                  </label>
                  {editingResource && editingResource.fileUrl && (
                    <p className="text-xs text-gray-500 mb-2">
                      Current file:{' '}
                      {editingResource.fileUrl?.split('/').pop() ||
                        editingResource.fileUrl}
                    </p>
                  )}
                  <input
                    type="file"
                    accept={formValues.type === 'pdf' ? '.pdf' : 'image/*'}
                    onChange={handleFileChange}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tags
                </label>
                <input
                  type="text"
                  value={formValues.tags}
                  onChange={(e) =>
                    setFormValues({ ...formValues, tags: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500"
                  placeholder="comma, separated, tags"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Separate tags with commas
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeFormModal}
                  className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                      {editingResource ? 'Updating...' : 'Creating...'}
                    </>
                  ) : editingResource ? (
                    'Update Resource'
                  ) : (
                    'Create Resource'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeleteModal && deletingResource && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeDeleteModal();
          }}
        >
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Delete Resource
            </h2>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete{' '}
              <span className="font-medium text-gray-900">
                &ldquo;{deletingResource.title}&rdquo;
              </span>
              ? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={closeDeleteModal}
                disabled={submitting}
                className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={submitting}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminResources;
