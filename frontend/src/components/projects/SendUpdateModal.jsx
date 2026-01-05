import React, { useState, useEffect, useRef } from 'react';
import { Dialog, CircularProgress } from '@mui/material';
import { communicationStore } from '../../stores/communication.store';

const SendUpdateModal = ({ open, onClose, project, onSuccess }) => {
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [sending, setSending] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState(null);

  // Dropdown state
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  // Get client email from project
  const clientEmail = project?.client_email || null;

  // Filter templates based on search query
  const filteredTemplates = templates.filter((template) => {
    const query = searchQuery.toLowerCase();
    return (
      template.name?.toLowerCase().includes(query) ||
      template.subject?.toLowerCase().includes(query) ||
      template.template_type?.toLowerCase().includes(query)
    );
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Load templates when modal opens
  useEffect(() => {
    if (open) {
      loadTemplates();
      setSelectedTemplate(null);
      setPreview(null);
      setError(null);
      setSearchQuery('');
      setIsDropdownOpen(false);
    }
  }, [open, project]);

  const loadTemplates = async () => {
    setLoadingTemplates(true);
    try {
      await communicationStore.fetchTemplates({ is_active: true });
      setTemplates(communicationStore.templates || []);
    } catch (err) {
      setError('Failed to load templates');
    } finally {
      setLoadingTemplates(false);
    }
  };

  const loadPreview = async (template) => {
    if (!template || !project?.id) return;

    setPreviewing(true);
    setError(null);
    try {
      const previewData = await communicationStore.previewEmail({
        project_id: project.id,
        template_id: template.id,
      });
      setPreview(previewData);
    } catch (err) {
      setError('Failed to preview email');
      setPreview(null);
    } finally {
      setPreviewing(false);
    }
  };

  // Auto-load preview when template is selected
  useEffect(() => {
    if (selectedTemplate && project?.id) {
      loadPreview(selectedTemplate);
    }
  }, [selectedTemplate, project?.id]);

  const handleSend = async () => {
    if (!selectedTemplate) {
      setError('Please select a template');
      return;
    }

    if (!clientEmail) {
      setError('No client email available for this project');
      return;
    }

    setSending(true);
    setError(null);
    try {
      await communicationStore.sendEmail({
        project_id: project.id,
        template_id: selectedTemplate.id,
      });

      onSuccess?.('Update sent successfully!');
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to send email');
    } finally {
      setSending(false);
    }
  };

  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template);
    setPreview(null);
    setError(null);
    setSearchQuery('');
    setIsDropdownOpen(false);
  };

  if (!open) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: 'transparent',
          boxShadow: 'none',
          overflow: 'visible',
        },
      }}
      slotProps={{
        backdrop: {
          sx: { backgroundColor: 'rgba(0, 0, 0, 0.6)' },
        },
      }}
    >
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800 px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">Send Project Update</h2>
                <p className="text-blue-100 text-sm">Choose a template and send an update to the client</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Project & Recipient Info Card */}
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 mb-6 border border-gray-200 dark:border-gray-600">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Project</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{project?.job_number}</p>
                <p className="text-sm text-gray-600 dark:text-gray-300">{project?.project_name}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Recipient</p>
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                    <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{project?.client_name || 'No Client'}</p>
                    {clientEmail ? (
                      <p className="text-xs text-gray-500 dark:text-gray-400">{clientEmail}</p>
                    ) : (
                      <p className="text-xs text-red-500 dark:text-red-400">No email available</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2">
              <svg className="w-5 h-5 text-red-500 dark:text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              <button
                onClick={() => setError(null)}
                className="ml-auto p-1 hover:bg-red-100 dark:hover:bg-red-800/50 rounded"
              >
                <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          {/* Template Selection Dropdown */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select Email Template
            </label>
            <div className="relative" ref={dropdownRef}>
              {/* Dropdown Trigger/Input */}
              <div
                className={`relative cursor-pointer ${loadingTemplates ? 'pointer-events-none opacity-60' : ''}`}
                onClick={() => {
                  if (!loadingTemplates) {
                    setIsDropdownOpen(!isDropdownOpen);
                    setTimeout(() => inputRef.current?.focus(), 0);
                  }
                }}
              >
                <div className={`w-full px-4 py-3 bg-white dark:bg-gray-700 border-2 rounded-xl transition-colors flex items-center justify-between ${
                  isDropdownOpen
                    ? 'border-blue-500 dark:border-blue-500 ring-2 ring-blue-500/20'
                    : selectedTemplate
                      ? 'border-green-500 dark:border-green-500'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                }`}>
                  {loadingTemplates ? (
                    <div className="flex items-center gap-2">
                      <CircularProgress size={18} />
                      <span className="text-gray-500 dark:text-gray-400">Loading templates...</span>
                    </div>
                  ) : selectedTemplate ? (
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="p-1.5 bg-green-100 dark:bg-green-900/50 rounded-lg flex-shrink-0">
                        <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{selectedTemplate.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{selectedTemplate.subject}</p>
                      </div>
                    </div>
                  ) : (
                    <span className="text-gray-500 dark:text-gray-400">Search and select a template...</span>
                  )}
                  <svg className={`w-5 h-5 text-gray-400 transition-transform flex-shrink-0 ml-2 ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <div className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl shadow-xl overflow-hidden">
                  {/* Search Input */}
                  <div className="p-3 border-b border-gray-200 dark:border-gray-600">
                    <div className="relative">
                      <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      <input
                        ref={inputRef}
                        type="text"
                        placeholder="Search templates..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  {/* Template List */}
                  <div className="max-h-64 overflow-y-auto">
                    {filteredTemplates.length === 0 ? (
                      <div className="p-4 text-center text-gray-500 dark:text-gray-400 text-sm">
                        {searchQuery ? 'No templates match your search' : 'No templates available'}
                      </div>
                    ) : (
                      filteredTemplates.map((template) => (
                        <button
                          key={template.id}
                          onClick={() => handleTemplateSelect(template)}
                          className={`w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors flex items-center gap-3 ${
                            selectedTemplate?.id === template.id ? 'bg-blue-50 dark:bg-blue-900/30' : ''
                          }`}
                        >
                          <div className={`p-1.5 rounded-lg flex-shrink-0 ${
                            selectedTemplate?.id === template.id
                              ? 'bg-blue-500 text-white'
                              : 'bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400'
                          }`}>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium truncate ${
                              selectedTemplate?.id === template.id
                                ? 'text-blue-700 dark:text-blue-300'
                                : 'text-gray-900 dark:text-white'
                            }`}>
                              {template.name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{template.subject}</p>
                          </div>
                          <span className={`px-2 py-0.5 text-xs rounded-full flex-shrink-0 ${
                            selectedTemplate?.id === template.id
                              ? 'bg-blue-200 dark:bg-blue-800 text-blue-700 dark:text-blue-300'
                              : 'bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300'
                          }`}>
                            {template.template_type}
                          </span>
                          {selectedTemplate?.id === template.id && (
                            <svg className="w-5 h-5 text-blue-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          )}
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Preview Section */}
          {selectedTemplate && (
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Email Preview</h3>
                {preview && !previewing && (
                  <button
                    onClick={() => loadPreview(selectedTemplate)}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span>Refresh</span>
                  </button>
                )}
              </div>

              {previewing ? (
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-8 text-center border border-gray-200 dark:border-gray-600">
                  <CircularProgress size={32} sx={{ color: '#3b82f6' }} />
                  <p className="text-gray-500 dark:text-gray-400 text-sm mt-3">Loading preview...</p>
                </div>
              ) : preview ? (
                <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                  {/* Email Header */}
                  <div className="bg-gray-50 dark:bg-gray-800 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium text-gray-500 dark:text-gray-400">To:</span>
                      <span className="text-gray-900 dark:text-white">{clientEmail}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm mt-1">
                      <span className="font-medium text-gray-500 dark:text-gray-400">Subject:</span>
                      <span className="text-gray-900 dark:text-white font-medium">{preview.subject}</span>
                    </div>
                  </div>
                  {/* Email Body - Increased height */}
                  <div
                    className="p-4 min-h-[200px] max-h-[400px] overflow-y-auto text-sm text-gray-700 dark:text-gray-300"
                    dangerouslySetInnerHTML={{ __html: preview.body_html || preview.body_text || '' }}
                  />
                </div>
              ) : (
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-8 text-center border-2 border-dashed border-gray-200 dark:border-gray-600">
                  <svg className="w-10 h-10 mx-auto text-gray-400 dark:text-gray-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">Unable to load preview</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 dark:bg-gray-800/50 px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {selectedTemplate ? (
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Template selected: {selectedTemplate.name}
              </span>
            ) : (
              'Select a template to continue'
            )}
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSend}
              disabled={!selectedTemplate || !clientEmail || sending}
              className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 dark:disabled:bg-gray-600 rounded-lg transition-colors disabled:cursor-not-allowed"
            >
              {sending ? (
                <>
                  <CircularProgress size={16} color="inherit" />
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  <span>Send Update</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </Dialog>
  );
};

export default SendUpdateModal;
