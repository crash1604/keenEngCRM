import React, { useState, useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import {
  TextField,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Typography,
  Box,
  Paper,
  Autocomplete,
  InputAdornment,
} from '@mui/material';
import {
  Send as SendIcon,
  Preview as PreviewIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { communicationStore } from '../../stores/communication.store';
import { useProjectStore } from '../../stores/project.store';

// Utility function to sanitize search input
const sanitizeSearchInput = (input) => {
  if (typeof input !== 'string') return '';
  return input
    .replace(/[<>{}[\]\\\/]/g, '')
    .replace(/['"`;]/g, '')
    .trim()
    .slice(0, 100);
};

const EmailComposer = observer(({ onEmailSent, onShowSnackbar }) => {
  const projectStore = useProjectStore();
  const [formData, setFormData] = useState({
    project_id: '',
    template_id: '',
    recipient_email: '',
    cc_emails: '',
    bcc_emails: '',
    custom_subject: '',
    custom_body: '',
  });
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    // Load projects and templates on mount
    const loadData = async () => {
      setLoadingProjects(true);
      setLoadingTemplates(true);
      try {
        await Promise.all([
          projectStore.fetchProjects({ page_size: 100 }),
          communicationStore.fetchTemplates({ is_active: true }),
        ]);
      } catch (error) {
        onShowSnackbar('Failed to load data', 'error');
      } finally {
        setLoadingProjects(false);
        setLoadingTemplates(false);
      }
    };
    loadData();
  }, [onShowSnackbar]);

  const handleInputChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const handlePreview = async () => {
    if (!formData.project_id || !formData.template_id) {
      onShowSnackbar('Please select a project and template', 'warning');
      return;
    }

    setLoading(true);
    try {
      const previewData = await communicationStore.previewEmail({
        project_id: formData.project_id,
        template_id: formData.template_id,
      });
      setPreview(previewData);
      setShowPreview(true);
    } catch (error) {
      onShowSnackbar('Failed to preview email', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSendEmail = async () => {
    if (!formData.project_id || !formData.template_id) {
      onShowSnackbar('Please select a project and template', 'warning');
      return;
    }

    setSending(true);
    try {
      const emailData = {
        project_id: formData.project_id,
        template_id: formData.template_id,
      };

      // Add optional fields if provided
      if (formData.recipient_email.trim()) {
        emailData.recipient_email = formData.recipient_email.trim();
      }
      if (formData.cc_emails.trim()) {
        emailData.cc_emails = formData.cc_emails
          .split(',')
          .map((email) => email.trim())
          .filter((email) => email);
      }
      if (formData.bcc_emails.trim()) {
        emailData.bcc_emails = formData.bcc_emails
          .split(',')
          .map((email) => email.trim())
          .filter((email) => email);
      }
      if (formData.custom_subject.trim()) {
        emailData.custom_subject = formData.custom_subject.trim();
      }
      if (formData.custom_body.trim()) {
        emailData.custom_body = formData.custom_body.trim();
      }

      await communicationStore.sendEmail(emailData);

      // Reset form
      setFormData({
        project_id: '',
        template_id: '',
        recipient_email: '',
        cc_emails: '',
        bcc_emails: '',
        custom_subject: '',
        custom_body: '',
      });
      setSelectedProject(null);
      setSelectedTemplate(null);

      onEmailSent();
    } catch (error) {
      onShowSnackbar(
        error.message || error.detail || 'Failed to send email',
        'error'
      );
    } finally {
      setSending(false);
    }
  };

  const handleClosePreview = () => {
    setShowPreview(false);
    setPreview(null);
  };

  // Get active templates for selection
  const activeTemplates = communicationStore.templates.filter((t) => t.is_active);

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            Compose Email
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Select a project and template to send an email
          </p>
        </div>
      </div>

      {/* Section 1: Project & Template Selection */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-5 mb-4 bg-white dark:bg-gray-800">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
          Select Project & Template
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 items-end">
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">
              PROJECT *
            </label>
            <Autocomplete
              fullWidth
              options={projectStore.projects}
              value={selectedProject}
              onChange={(event, newValue) => {
                setSelectedProject(newValue);
                handleInputChange('project_id', newValue?.id || '');
              }}
              filterOptions={(options, state) => {
                const input = sanitizeSearchInput(state.inputValue).toLowerCase();
                if (!input) return options;
                return options.filter(option =>
                  option.project_name?.toLowerCase().includes(input) ||
                  option.job_number?.toLowerCase().includes(input) ||
                  option.client_name?.toLowerCase().includes(input) ||
                  option.address?.toLowerCase().includes(input)
                );
              }}
              getOptionLabel={(option) => {
                if (!option) return '';
                return option.job_number
                  ? `${option.project_name} (${option.job_number})`
                  : option.project_name || '';
              }}
              isOptionEqualToValue={(option, value) => option?.id === value?.id}
              loading={loadingProjects}
              noOptionsText={loadingProjects ? "Loading..." : "No projects found"}
              slotProps={{
                paper: {
                  sx: {
                    '.dark &': {
                      backgroundColor: 'rgb(55 65 81)',
                      '& .MuiAutocomplete-option': {
                        color: 'white',
                        '&:hover': {
                          backgroundColor: 'rgb(75 85 99)',
                        },
                        '&[aria-selected="true"]': {
                          backgroundColor: 'rgb(59 130 246 / 0.3)',
                        },
                      },
                      '& .MuiAutocomplete-noOptions': {
                        color: 'rgb(156 163 175)',
                      },
                    },
                  },
                },
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  size="small"
                  placeholder="Search projects..."
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '8px',
                      backgroundColor: 'white',
                    },
                    '.dark & .MuiOutlinedInput-root': {
                      backgroundColor: 'rgb(55 65 81)',
                    },
                    '.dark & .MuiOutlinedInput-input': {
                      color: 'white',
                    },
                    '.dark & .MuiOutlinedInput-input::placeholder': {
                      color: 'rgb(156 163 175)',
                    },
                    '.dark & .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgb(75 85 99)',
                    },
                    '.dark & .MuiSvgIcon-root': {
                      color: 'rgb(156 163 175)',
                    },
                  }}
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: (
                      <>
                        <InputAdornment position="start">
                          <SearchIcon fontSize="small" sx={{ color: 'text.secondary', '.dark &': { color: 'rgb(156 163 175)' } }} />
                        </InputAdornment>
                        {params.InputProps.startAdornment}
                      </>
                    ),
                    endAdornment: (
                      <>
                        {loadingProjects && <CircularProgress color="inherit" size={18} />}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
              renderOption={(props, option) => {
                const { key, ...otherProps } = props;
                return (
                  <li key={option.id} {...otherProps}>
                    <div className="flex flex-col py-1">
                      <span className="font-medium text-gray-900 dark:text-gray-100">{option.project_name}</span>
                      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                        {option.job_number && <span className="font-mono">{option.job_number}</span>}
                        {option.client_name && <span>• {option.client_name}</span>}
                      </div>
                    </div>
                  </li>
                );
              }}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">
              TEMPLATE *
            </label>
            <Autocomplete
              fullWidth
              options={activeTemplates}
              value={selectedTemplate}
              onChange={(event, newValue) => {
                setSelectedTemplate(newValue);
                handleInputChange('template_id', newValue?.id || '');
              }}
              filterOptions={(options, state) => {
                const input = sanitizeSearchInput(state.inputValue).toLowerCase();
                if (!input) return options;
                return options.filter(option =>
                  option.name?.toLowerCase().includes(input) ||
                  option.template_type?.toLowerCase().includes(input) ||
                  option.subject?.toLowerCase().includes(input)
                );
              }}
              getOptionLabel={(option) => {
                if (!option) return '';
                return option.name || '';
              }}
              isOptionEqualToValue={(option, value) => option?.id === value?.id}
              loading={loadingTemplates}
              noOptionsText={loadingTemplates ? "Loading..." : "No templates found"}
              slotProps={{
                paper: {
                  sx: {
                    '.dark &': {
                      backgroundColor: 'rgb(55 65 81)',
                      '& .MuiAutocomplete-option': {
                        color: 'white',
                        '&:hover': {
                          backgroundColor: 'rgb(75 85 99)',
                        },
                        '&[aria-selected="true"]': {
                          backgroundColor: 'rgb(59 130 246 / 0.3)',
                        },
                      },
                      '& .MuiAutocomplete-noOptions': {
                        color: 'rgb(156 163 175)',
                      },
                    },
                  },
                },
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  size="small"
                  placeholder="Search templates..."
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '8px',
                      backgroundColor: 'white',
                    },
                    '.dark & .MuiOutlinedInput-root': {
                      backgroundColor: 'rgb(55 65 81)',
                    },
                    '.dark & .MuiOutlinedInput-input': {
                      color: 'white',
                    },
                    '.dark & .MuiOutlinedInput-input::placeholder': {
                      color: 'rgb(156 163 175)',
                    },
                    '.dark & .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgb(75 85 99)',
                    },
                    '.dark & .MuiSvgIcon-root': {
                      color: 'rgb(156 163 175)',
                    },
                  }}
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: (
                      <>
                        <InputAdornment position="start">
                          <SearchIcon fontSize="small" sx={{ color: 'text.secondary', '.dark &': { color: 'rgb(156 163 175)' } }} />
                        </InputAdornment>
                        {params.InputProps.startAdornment}
                      </>
                    ),
                    endAdornment: (
                      <>
                        {loadingTemplates && <CircularProgress color="inherit" size={18} />}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
              renderOption={(props, option) => {
                const { key, ...otherProps } = props;
                return (
                  <li key={option.id} {...otherProps}>
                    <div className="flex flex-col py-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900 dark:text-gray-100">{option.name}</span>
                        {option.is_default && (
                          <Chip
                            label="Default"
                            size="small"
                            sx={{
                              height: 18,
                              fontSize: '0.65rem',
                              bgcolor: '#dbeafe',
                              color: '#1d4ed8',
                              '.dark &': {
                                bgcolor: 'rgba(59, 130, 246, 0.3)',
                                color: '#93c5fd',
                              },
                            }}
                          />
                        )}
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {option.template_type_display || option.template_type}
                      </span>
                    </div>
                  </li>
                );
              }}
            />
          </div>

          {/* Project Info */}
          <div>
            {selectedProject ? (
              <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-700">
                <span className="text-xs text-gray-500 dark:text-gray-400">Client:</span>
                <span className="text-xs font-semibold text-gray-900 dark:text-white ml-1">{selectedProject.client_name}</span>
                <div className="mt-1">
                  <span className="text-xs text-gray-500 dark:text-gray-400">Email:</span>
                  <span className="text-xs font-semibold text-gray-900 dark:text-white ml-1">{selectedProject.client_email || 'N/A'}</span>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-dashed border-gray-300 dark:border-gray-600 text-center">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Select a project to view client details
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Section 2: Email Details */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-5 mb-4 bg-white dark:bg-gray-800">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
          Email Details
        </h4>

        {/* Row 1: Recipient Email */}
        <div className="mb-4">
          <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">
            RECIPIENT EMAIL
          </label>
          <TextField
            fullWidth
            size="small"
            placeholder="Leave empty to use client email from project"
            value={formData.recipient_email}
            onChange={(e) => handleInputChange('recipient_email', e.target.value)}
            InputProps={{
              sx: {
                fontSize: '0.875rem',
                '.dark &': {
                  backgroundColor: 'rgb(55 65 81)',
                  color: 'white',
                  '& input': { color: 'white' },
                  '& input::placeholder': { color: 'rgb(156 163 175)' },
                },
              }
            }}
            sx={{
              '.dark & .MuiOutlinedInput-notchedOutline': {
                borderColor: 'rgb(75 85 99)',
              },
            }}
          />
        </div>

        {/* Row 2: CC and BCC */}
        <div className="flex gap-4 mb-4">
          <div className="flex-1">
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">
              CC
            </label>
            <TextField
              fullWidth
              size="small"
              placeholder="email1@example.com, email2@example.com"
              value={formData.cc_emails}
              onChange={(e) => handleInputChange('cc_emails', e.target.value)}
              InputProps={{
                sx: {
                  fontSize: '0.875rem',
                  '.dark &': {
                    backgroundColor: 'rgb(55 65 81)',
                    color: 'white',
                    '& input': { color: 'white' },
                    '& input::placeholder': { color: 'rgb(156 163 175)' },
                  },
                }
              }}
              sx={{
                '.dark & .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'rgb(75 85 99)',
                },
              }}
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">
              BCC
            </label>
            <TextField
              fullWidth
              size="small"
              placeholder="email1@example.com, email2@example.com"
              value={formData.bcc_emails}
              onChange={(e) => handleInputChange('bcc_emails', e.target.value)}
              InputProps={{
                sx: {
                  fontSize: '0.875rem',
                  '.dark &': {
                    backgroundColor: 'rgb(55 65 81)',
                    color: 'white',
                    '& input': { color: 'white' },
                    '& input::placeholder': { color: 'rgb(156 163 175)' },
                  },
                }
              }}
              sx={{
                '.dark & .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'rgb(75 85 99)',
                },
              }}
            />
          </div>
        </div>

        {/* Row 3: Subject */}
        <div className="mb-4">
          <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">
            SUBJECT <span className="text-gray-400 dark:text-gray-500 font-normal">(optional - leave empty to use template subject)</span>
          </label>
          <TextField
            fullWidth
            size="small"
            placeholder="Enter custom subject line"
            value={formData.custom_subject}
            onChange={(e) => handleInputChange('custom_subject', e.target.value)}
            InputProps={{
              sx: {
                fontSize: '0.875rem',
                '.dark &': {
                  backgroundColor: 'rgb(55 65 81)',
                  color: 'white',
                  '& input': { color: 'white' },
                  '& input::placeholder': { color: 'rgb(156 163 175)' },
                },
              }
            }}
            sx={{
              '.dark & .MuiOutlinedInput-notchedOutline': {
                borderColor: 'rgb(75 85 99)',
              },
            }}
          />
        </div>

        {/* Row 4: Additional Notes */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">
            ADDITIONAL NOTES <span className="text-gray-400 dark:text-gray-500 font-normal">(optional)</span>
          </label>
          <TextField
            fullWidth
            multiline
            rows={3}
            placeholder="Add any additional message to include in the email"
            value={formData.custom_body}
            onChange={(e) => handleInputChange('custom_body', e.target.value)}
            InputProps={{
              sx: {
                fontSize: '0.875rem',
                '.dark &': {
                  backgroundColor: 'rgb(55 65 81)',
                  color: 'white',
                  '& textarea': { color: 'white' },
                  '& textarea::placeholder': { color: 'rgb(156 163 175)' },
                },
              }
            }}
            sx={{
              '.dark & .MuiOutlinedInput-notchedOutline': {
                borderColor: 'rgb(75 85 99)',
              },
            }}
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 justify-end items-center">
        <Button
          variant="outlined"
          startIcon={<PreviewIcon />}
          onClick={handlePreview}
          disabled={!formData.project_id || !formData.template_id || loading}
          sx={{ textTransform: 'none', fontWeight: 600, px: 3 }}
        >
          {loading ? <CircularProgress size={20} /> : 'Preview Email'}
        </Button>
        <Button
          variant="contained"
          startIcon={<SendIcon />}
          onClick={handleSendEmail}
          disabled={!formData.project_id || !formData.template_id || sending}
          sx={{
            bgcolor: '#2563eb',
            '&:hover': { bgcolor: '#1d4ed8' },
            textTransform: 'none',
            fontWeight: 600,
            px: 3,
          }}
        >
          {sending ? <CircularProgress size={20} /> : 'Send Email'}
        </Button>
      </div>

      {/* Preview Dialog */}
      <Dialog
        open={showPreview}
        onClose={handleClosePreview}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            '.dark &': {
              backgroundColor: 'rgb(31 41 55)',
            }
          }
        }}
      >
        <DialogTitle sx={{ '.dark &': { color: 'white' } }}>
          <Typography variant="h6" fontWeight="bold">
            Email Preview
          </Typography>
        </DialogTitle>
        <DialogContent dividers sx={{ '.dark &': { borderColor: 'rgb(55 65 81)' } }}>
          {preview && (
            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Subject:
              </Typography>
              <Typography variant="body1" fontWeight="bold" mb={2} sx={{ '.dark &': { color: 'white' } }}>
                {preview.subject}
              </Typography>

              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Body:
              </Typography>
              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  maxHeight: 500,
                  overflow: 'auto',
                  bgcolor: '#f9fafb',
                  '.dark &': {
                    bgcolor: 'rgb(55 65 81)',
                    borderColor: 'rgb(75 85 99)',
                  }
                }}
              >
                {preview.body_html ? (
                  <div
                    dangerouslySetInnerHTML={{ __html: preview.body_html }}
                    className="dark:text-gray-200"
                  />
                ) : (
                  <Typography variant="body2" style={{ whiteSpace: 'pre-wrap' }}>
                    {preview.body_text}
                  </Typography>
                )}
              </Paper>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ '.dark &': { borderColor: 'rgb(55 65 81)' } }}>
          <Button onClick={handleClosePreview}>Close</Button>
          <Button
            variant="contained"
            startIcon={<SendIcon />}
            onClick={() => {
              handleClosePreview();
              handleSendEmail();
            }}
            disabled={sending}
          >
            Send Email
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
});

export default EmailComposer;
