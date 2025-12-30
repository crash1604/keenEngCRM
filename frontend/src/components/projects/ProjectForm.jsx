import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  Button,
  TextField,
  MenuItem,
  Alert,
  CircularProgress,
  IconButton,
  Collapse,
  Tooltip,
  Autocomplete,
  InputAdornment,
} from '@mui/material';
import {
  Close as CloseIcon,
  FolderOpen as FolderIcon,
  Category as CategoryIcon,
  LocationOn as LocationIcon,
  CalendarMonth as CalendarIcon,
  Assignment as AssignmentIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  AttachMoney as MoneyIcon,
  Add as AddIcon,
  Business as BusinessIcon,
  Architecture as ArchitectureIcon,
  Search as SearchIcon,
} from '@mui/icons-material';

// Utility function to sanitize search input - prevents XSS and injection
const sanitizeSearchInput = (input) => {
  if (typeof input !== 'string') return '';
  return input
    .replace(/[<>{}[\]\\\/]/g, '')
    .replace(/['"`;]/g, '')
    .trim()
    .slice(0, 100);
};
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useProjectStore } from '../../stores/project.store';
import { clientStore } from '../../stores/client.store';
import { architectStore } from '../../stores/architect.store';
import { STATUS_OPTIONS } from './StatusRenderer';

// Quick Add Client Modal
const QuickAddClientModal = ({ open, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const formik = useFormik({
    initialValues: {
      name: '',
      company_name: '',
      contact_email: '',
      phone: '',
    },
    validationSchema: Yup.object({
      name: Yup.string().required('Name is required'),
      contact_email: Yup.string().email('Invalid email'),
    }),
    onSubmit: async (values) => {
      setLoading(true);
      setError('');
      try {
        const newClient = await clientStore.createClient(values);
        formik.resetForm();
        onSuccess(newClient);
      } catch (err) {
        setError(err.detail || 'Failed to create client');
      } finally {
        setLoading(false);
      }
    },
  });

  const handleClose = () => {
    formik.resetForm();
    setError('');
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { borderRadius: '16px', overflow: 'hidden' }
      }}
    >
      <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <BusinessIcon className="text-white" fontSize="small" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Quick Add Client</h2>
              <p className="text-emerald-100 text-xs">Add basic client info</p>
            </div>
          </div>
          <IconButton onClick={handleClose} size="small" sx={{ color: 'white' }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </div>
      </div>

      <form onSubmit={formik.handleSubmit}>
        <DialogContent sx={{ p: 3 }} className="bg-white dark:bg-gray-800">
          {error && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: '8px' }} onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          <div className="space-y-4">
            <TextField
              fullWidth
              label="Client Name"
              name="name"
              value={formik.values.name}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.name && Boolean(formik.errors.name)}
              helperText={formik.touched.name && formik.errors.name}
              disabled={loading}
              size="small"
              required
              autoFocus
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: 'var(--tw-bg-opacity, 1) ? rgb(255 255 255) : rgb(55 65 81)',
                },
                '& .MuiInputLabel-root': { color: 'inherit' },
                '& .MuiOutlinedInput-input': { color: 'inherit' },
              }}
              className="dark:[&_.MuiOutlinedInput-root]:bg-gray-700 dark:[&_.MuiOutlinedInput-input]:text-white dark:[&_.MuiInputLabel-root]:text-gray-300"
            />

            <TextField
              fullWidth
              label="Company Name"
              name="company_name"
              value={formik.values.company_name}
              onChange={formik.handleChange}
              disabled={loading}
              size="small"
              className="dark:[&_.MuiOutlinedInput-root]:bg-gray-700 dark:[&_.MuiOutlinedInput-input]:text-white dark:[&_.MuiInputLabel-root]:text-gray-300"
            />

            <div className="grid grid-cols-2 gap-3">
              <TextField
                fullWidth
                label="Email"
                name="contact_email"
                type="email"
                value={formik.values.contact_email}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.contact_email && Boolean(formik.errors.contact_email)}
                helperText={formik.touched.contact_email && formik.errors.contact_email}
                disabled={loading}
                size="small"
                className="dark:[&_.MuiOutlinedInput-root]:bg-gray-700 dark:[&_.MuiOutlinedInput-input]:text-white dark:[&_.MuiInputLabel-root]:text-gray-300"
              />

              <TextField
                fullWidth
                label="Phone"
                name="phone"
                value={formik.values.phone}
                onChange={formik.handleChange}
                disabled={loading}
                size="small"
                className="dark:[&_.MuiOutlinedInput-root]:bg-gray-700 dark:[&_.MuiOutlinedInput-input]:text-white dark:[&_.MuiInputLabel-root]:text-gray-300"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !formik.values.name}
              className="px-4 py-2 text-sm font-medium text-white bg-emerald-500 rounded-lg hover:bg-emerald-600 transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <CircularProgress size={16} sx={{ color: 'white' }} />
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <AddIcon fontSize="small" />
                  <span>Add Client</span>
                </>
              )}
            </button>
          </div>
        </DialogContent>
      </form>
    </Dialog>
  );
};

// Quick Add Architect Modal
const QuickAddArchitectModal = ({ open, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const formik = useFormik({
    initialValues: {
      name: '',
      company_name: '',
      contact_email: '',
      phone: '',
    },
    validationSchema: Yup.object({
      name: Yup.string().required('Name is required'),
      contact_email: Yup.string().email('Invalid email'),
    }),
    onSubmit: async (values) => {
      setLoading(true);
      setError('');
      try {
        const newArchitect = await architectStore.createArchitect(values);
        formik.resetForm();
        onSuccess(newArchitect);
      } catch (err) {
        setError(err.detail || 'Failed to create architect');
      } finally {
        setLoading(false);
      }
    },
  });

  const handleClose = () => {
    formik.resetForm();
    setError('');
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { borderRadius: '16px', overflow: 'hidden' }
      }}
    >
      <div className="bg-gradient-to-r from-violet-500 to-purple-500 px-5 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <ArchitectureIcon className="text-white" fontSize="small" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Quick Add Architect</h2>
              <p className="text-violet-100 text-xs">Add basic architect info</p>
            </div>
          </div>
          <IconButton onClick={handleClose} size="small" sx={{ color: 'white' }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </div>
      </div>

      <form onSubmit={formik.handleSubmit}>
        <DialogContent sx={{ p: 3 }} className="bg-white dark:bg-gray-800">
          {error && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: '8px' }} onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          <div className="space-y-4">
            <TextField
              fullWidth
              label="Architect / Designer Name"
              name="name"
              value={formik.values.name}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.name && Boolean(formik.errors.name)}
              helperText={formik.touched.name && formik.errors.name}
              disabled={loading}
              size="small"
              required
              autoFocus
              className="dark:[&_.MuiOutlinedInput-root]:bg-gray-700 dark:[&_.MuiOutlinedInput-input]:text-white dark:[&_.MuiInputLabel-root]:text-gray-300"
            />

            <TextField
              fullWidth
              label="Company / Firm Name"
              name="company_name"
              value={formik.values.company_name}
              onChange={formik.handleChange}
              disabled={loading}
              size="small"
              className="dark:[&_.MuiOutlinedInput-root]:bg-gray-700 dark:[&_.MuiOutlinedInput-input]:text-white dark:[&_.MuiInputLabel-root]:text-gray-300"
            />

            <div className="grid grid-cols-2 gap-3">
              <TextField
                fullWidth
                label="Email"
                name="contact_email"
                type="email"
                value={formik.values.contact_email}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.contact_email && Boolean(formik.errors.contact_email)}
                helperText={formik.touched.contact_email && formik.errors.contact_email}
                disabled={loading}
                size="small"
                className="dark:[&_.MuiOutlinedInput-root]:bg-gray-700 dark:[&_.MuiOutlinedInput-input]:text-white dark:[&_.MuiInputLabel-root]:text-gray-300"
              />

              <TextField
                fullWidth
                label="Phone"
                name="phone"
                value={formik.values.phone}
                onChange={formik.handleChange}
                disabled={loading}
                size="small"
                className="dark:[&_.MuiOutlinedInput-root]:bg-gray-700 dark:[&_.MuiOutlinedInput-input]:text-white dark:[&_.MuiInputLabel-root]:text-gray-300"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !formik.values.name}
              className="px-4 py-2 text-sm font-medium text-white bg-violet-500 rounded-lg hover:bg-violet-600 transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <CircularProgress size={16} sx={{ color: 'white' }} />
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <AddIcon fontSize="small" />
                  <span>Add Architect</span>
                </>
              )}
            </button>
          </div>
        </DialogContent>
      </form>
    </Dialog>
  );
};

const PROJECT_TYPE_OPTIONS = [
  { value: 'M', label: 'Mechanical', color: 'bg-blue-100 text-blue-700 border-blue-300', selectedBg: 'bg-blue-500' },
  { value: 'E', label: 'Electrical', color: 'bg-yellow-100 text-yellow-700 border-yellow-300', selectedBg: 'bg-yellow-500' },
  { value: 'P', label: 'Plumbing', color: 'bg-cyan-100 text-cyan-700 border-cyan-300', selectedBg: 'bg-cyan-500' },
  { value: 'EM', label: 'Energy Modelling', color: 'bg-green-100 text-green-700 border-green-300', selectedBg: 'bg-green-500' },
  { value: 'FP', label: 'Fire Protection', color: 'bg-red-100 text-red-700 border-red-300', selectedBg: 'bg-red-500' },
  { value: 'TI', label: 'Tenant Improvement', color: 'bg-purple-100 text-purple-700 border-purple-300', selectedBg: 'bg-purple-500' },
  { value: 'VI', label: 'Verification Pending', color: 'bg-gray-100 text-gray-700 border-gray-300', selectedBg: 'bg-gray-500' },
];

// Section Header Component with improved styling
const SectionHeader = ({ icon, title, subtitle, isOpen, onToggle, optional, bgColor = 'bg-blue-50', iconColor = 'text-blue-600' }) => (
  <button
    type="button"
    onClick={onToggle}
    className="w-full flex items-center justify-between py-3 px-4 hover:bg-gray-50/80 dark:hover:bg-gray-700/50 transition-colors"
  >
    <div className="flex items-center gap-3">
      <div className={`p-2 ${bgColor} dark:bg-opacity-20 rounded-lg ${iconColor}`}>
        {icon}
      </div>
      <div className="text-left">
        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">{title}</h3>
        {subtitle && <p className="text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>}
        {optional && !subtitle && <span className="text-xs text-gray-400 dark:text-gray-500">Optional</span>}
      </div>
    </div>
    <div className={`p-1 rounded-full transition-colors ${isOpen ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'}`}>
      {isOpen ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
    </div>
  </button>
);

const ProjectForm = ({ open, onClose, project, editMode, onSuccess, onError }) => {
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState([]);
  const [architects, setArchitects] = useState([]);
  const [loadingClients, setLoadingClients] = useState(false);
  const [loadingArchitects, setLoadingArchitects] = useState(false);
  const { createProject, updateProject } = useProjectStore();

  const [selectedClient, setSelectedClient] = useState(null);
  const [selectedArchitect, setSelectedArchitect] = useState(null);

  const [showQuickAddClient, setShowQuickAddClient] = useState(false);
  const [showQuickAddArchitect, setShowQuickAddArchitect] = useState(false);

  const [sectionsOpen, setSectionsOpen] = useState({
    basic: true,
    location: true,
    timeline: true,
    details: false,
    billing: false,
  });

  const toggleSection = (section) => {
    setSectionsOpen(prev => ({ ...prev, [section]: !prev[section] }));
  };

  useEffect(() => {
    if (open) {
      fetchClients();
      fetchArchitects();
      setSectionsOpen({
        basic: true,
        location: true,
        timeline: true,
        details: false,
        billing: false,
      });
    }
  }, [open]);

  const fetchClients = async (searchQuery = '') => {
    setLoadingClients(true);
    try {
      await clientStore.fetchClients(1);
      let clientList = clientStore.clients || [];

      if (searchQuery) {
        const sanitized = sanitizeSearchInput(searchQuery).toLowerCase();
        clientList = clientList.filter(client =>
          (client.name?.toLowerCase().includes(sanitized)) ||
          (client.company_name?.toLowerCase().includes(sanitized)) ||
          (client.contact_email?.toLowerCase().includes(sanitized))
        );
      }

      setClients(clientList);
    } catch (error) {
      console.error('Failed to fetch clients:', error);
    } finally {
      setLoadingClients(false);
    }
  };

  const fetchArchitects = async (searchQuery = '') => {
    setLoadingArchitects(true);
    try {
      await architectStore.fetchArchitects(1);
      let architectList = architectStore.architects || [];

      if (searchQuery) {
        const sanitized = sanitizeSearchInput(searchQuery).toLowerCase();
        architectList = architectList.filter(architect =>
          (architect.name?.toLowerCase().includes(sanitized)) ||
          (architect.company_name?.toLowerCase().includes(sanitized)) ||
          (architect.contact_email?.toLowerCase().includes(sanitized))
        );
      }

      setArchitects(architectList);
    } catch (error) {
      console.error('Failed to fetch architects:', error);
    } finally {
      setLoadingArchitects(false);
    }
  };

  const handleQuickAddClientSuccess = (newClient) => {
    setShowQuickAddClient(false);
    fetchClients().then(() => {
      if (newClient?.id) {
        setSelectedClient(newClient);
        formik.setFieldValue('client', newClient.id);
      }
    });
  };

  const handleQuickAddArchitectSuccess = (newArchitect) => {
    setShowQuickAddArchitect(false);
    fetchArchitects().then(() => {
      if (newArchitect?.id) {
        setSelectedArchitect(newArchitect);
        formik.setFieldValue('architect_designer', newArchitect.id);
      }
    });
  };

  const validationSchema = Yup.object({
    project_name: Yup.string().required('Project name is required').max(255, 'Name is too long'),
    project_type: Yup.array().min(1, 'Select at least one project type').required('Project type is required'),
    client: Yup.number().required('Client is required'),
    address: Yup.string().required('Address is required'),
    status: Yup.string().required('Status is required'),
    due_date: Yup.date().required('Due date is required'),
  });

  const formik = useFormik({
    initialValues: {
      project_name: '',
      project_type: [],
      client: '',
      architect_designer: '',
      status: 'not_started',
      address: '',
      legal_address: '',
      due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      rough_in_date: '',
      final_inspection_date: '',
      current_sub_status: '',
      current_open_items: '',
      current_action_items: '',
      due_date_note: '',
      billing_info: '',
    },
    validationSchema,
    onSubmit: async (values) => {
      setLoading(true);
      try {
        const submitData = {
          ...values,
          project_type: values.project_type.join(','),
          architect_designer: values.architect_designer || null,
          legal_address: values.legal_address || null,
          rough_in_date: values.rough_in_date || null,
          final_inspection_date: values.final_inspection_date || null,
          current_sub_status: values.current_sub_status || null,
          current_open_items: values.current_open_items || null,
          current_action_items: values.current_action_items || null,
          due_date_note: values.due_date_note || null,
          billing_info: values.billing_info || null,
        };

        let result;
        if (editMode && project) {
          result = await updateProject(project.id, submitData);
        } else {
          result = await createProject(submitData);
        }

        if (result.success) {
          onSuccess();
          handleClose();
        } else {
          onError(result.error || 'Failed to save project');
        }
      } catch (error) {
        console.error('Project form error:', error);
        onError(error.message || 'Failed to save project');
      } finally {
        setLoading(false);
      }
    },
  });

  useEffect(() => {
    if (open && project && editMode) {
      const projectTypes = project.project_type ? project.project_type.split(',').map(t => t.trim()) : [];
      formik.setValues({
        project_name: project.project_name || '',
        project_type: projectTypes,
        client: project.client || '',
        architect_designer: project.architect_designer || '',
        status: project.status || 'not_started',
        address: project.address || '',
        legal_address: project.legal_address || '',
        due_date: project.due_date || '',
        rough_in_date: project.rough_in_date || '',
        final_inspection_date: project.final_inspection_date || '',
        current_sub_status: project.current_sub_status || '',
        current_open_items: project.current_open_items || '',
        current_action_items: project.current_action_items || '',
        due_date_note: project.due_date_note || '',
        billing_info: project.billing_info || '',
      });

      if (project.client && clients.length > 0) {
        const clientObj = clients.find(c => c.id === project.client);
        if (clientObj) setSelectedClient(clientObj);
      }
      if (project.architect_designer && architects.length > 0) {
        const architectObj = architects.find(a => a.id === project.architect_designer);
        if (architectObj) setSelectedArchitect(architectObj);
      }

      setSectionsOpen({
        basic: true,
        location: true,
        timeline: true,
        details: true,
        billing: true,
      });
    } else if (open && !editMode) {
      formik.resetForm();
      setSelectedClient(null);
      setSelectedArchitect(null);
    }
  }, [open, project, editMode, clients, architects]);

  const handleClose = () => {
    formik.resetForm();
    setSelectedClient(null);
    setSelectedArchitect(null);
    onClose();
  };

  // Calculate form completion percentage
  const requiredFields = ['project_name', 'project_type', 'client', 'address', 'status', 'due_date'];
  const filledRequired = requiredFields.filter(field => {
    const value = formik.values[field];
    if (Array.isArray(value)) return value.length > 0;
    return value && value.toString().trim() !== '';
  }).length;
  const completionPercent = Math.round((filledRequired / requiredFields.length) * 100);

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '16px',
          overflow: 'hidden',
        }
      }}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-5 text-white relative">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-white/20 transition-colors"
        >
          <CloseIcon />
        </button>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
            <FolderIcon />
          </div>
          <div>
            <h2 className="text-xl font-bold">
              {editMode ? 'Edit Project' : 'Create New Project'}
            </h2>
            <p className="text-blue-100 text-sm mt-0.5">
              {editMode ? 'Update project information' : 'Fill in the details to create a new project'}
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-blue-100 mb-1.5">
            <span>Required fields completion</span>
            <span>{completionPercent}%</span>
          </div>
          <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-all duration-300"
              style={{ width: `${completionPercent}%` }}
            />
          </div>
        </div>
      </div>

      <form onSubmit={formik.handleSubmit} className="flex flex-col max-h-[calc(100vh-200px)]">
        <DialogContent sx={{ p: 0, overflow: 'auto', flex: 1 }} className="bg-white dark:bg-gray-800">
          {formik.errors.submit && (
            <div className="px-6 pt-4">
              <Alert severity="error" sx={{ borderRadius: '8px' }}>
                {formik.errors.submit}
              </Alert>
            </div>
          )}

          <div className="p-6 space-y-4">

            {/* Basic Information Section */}
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600 overflow-hidden">
              <SectionHeader
                icon={<CategoryIcon fontSize="small" />}
                title="Basic Information"
                subtitle="Project name, type, and assignments"
                isOpen={sectionsOpen.basic}
                onToggle={() => toggleSection('basic')}
              />
              <Collapse in={sectionsOpen.basic}>
                <div className="p-5 space-y-5 border-t border-gray-100 dark:border-gray-600">
                  {/* Project Name */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                      Project Name <span className="text-red-500">*</span>
                    </label>
                    <TextField
                      fullWidth
                      name="project_name"
                      value={formik.values.project_name}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={formik.touched.project_name && Boolean(formik.errors.project_name)}
                      helperText={formik.touched.project_name && formik.errors.project_name}
                      disabled={loading}
                      size="small"
                      placeholder="Enter project name"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: '8px',
                          backgroundColor: 'white',
                        }
                      }}
                      className="dark:[&_.MuiOutlinedInput-root]:bg-gray-600 dark:[&_.MuiOutlinedInput-input]:text-white dark:[&_.MuiInputLabel-root]:text-gray-300"
                    />
                  </div>

                  {/* Project Types */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                      Project Types <span className="text-red-500">*</span>
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {PROJECT_TYPE_OPTIONS.map((option) => {
                        const isSelected = formik.values.project_type.includes(option.value);
                        return (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => {
                              const newTypes = isSelected
                                ? formik.values.project_type.filter(t => t !== option.value)
                                : [...formik.values.project_type, option.value];
                              formik.setFieldValue('project_type', newTypes);
                            }}
                            className={`px-3 py-2 rounded-lg text-sm font-medium border-2 transition-all duration-200 ${
                              isSelected
                                ? option.color + ' border-current shadow-sm scale-105'
                                : 'bg-white dark:bg-gray-600 text-gray-600 dark:text-gray-200 border-gray-200 dark:border-gray-500 hover:border-gray-300 dark:hover:border-gray-400 hover:bg-gray-50 dark:hover:bg-gray-500'
                            }`}
                          >
                            {option.label}
                          </button>
                        );
                      })}
                    </div>
                    {formik.touched.project_type && formik.errors.project_type && (
                      <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        {formik.errors.project_type}
                      </p>
                    )}
                  </div>

                  {/* Status */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                        Status <span className="text-red-500">*</span>
                      </label>
                      <TextField
                        fullWidth
                        select
                        name="status"
                        value={formik.values.status}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={formik.touched.status && Boolean(formik.errors.status)}
                        helperText={formik.touched.status && formik.errors.status}
                        disabled={loading}
                        size="small"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: '8px',
                            backgroundColor: 'white',
                          }
                        }}
                        className="dark:[&_.MuiOutlinedInput-root]:bg-gray-600 dark:[&_.MuiOutlinedInput-input]:text-white dark:[&_.MuiSelect-icon]:text-gray-300"
                      >
                        {STATUS_OPTIONS.map((option) => (
                          <MenuItem key={option.value} value={option.value}>
                            {option.label}
                          </MenuItem>
                        ))}
                      </TextField>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Sub-Status</label>
                      <TextField
                        fullWidth
                        name="current_sub_status"
                        value={formik.values.current_sub_status}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        disabled={loading}
                        size="small"
                        placeholder="e.g., Awaiting permits"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: '8px',
                            backgroundColor: 'white',
                          }
                        }}
                        className="dark:[&_.MuiOutlinedInput-root]:bg-gray-600 dark:[&_.MuiOutlinedInput-input]:text-white"
                      />
                    </div>
                  </div>

                  {/* Client & Architect */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                        Client <span className="text-red-500">*</span>
                      </label>
                      <div className="flex gap-2">
                        <Autocomplete
                          fullWidth
                          options={clients}
                          value={selectedClient}
                          onChange={(event, newValue) => {
                            setSelectedClient(newValue);
                            formik.setFieldValue('client', newValue?.id || '');
                          }}
                          filterOptions={(options, state) => {
                            const input = sanitizeSearchInput(state.inputValue).toLowerCase();
                            if (!input) return options;
                            return options.filter(option =>
                              option.name?.toLowerCase().includes(input) ||
                              option.company_name?.toLowerCase().includes(input) ||
                              option.contact_email?.toLowerCase().includes(input)
                            );
                          }}
                          getOptionLabel={(option) => {
                            if (!option) return '';
                            return option.company_name
                              ? `${option.name} (${option.company_name})`
                              : option.name || '';
                          }}
                          isOptionEqualToValue={(option, value) => option?.id === value?.id}
                          loading={loadingClients}
                          disabled={loading}
                          noOptionsText={loadingClients ? "Loading..." : "No clients found - click + to add"}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              size="small"
                              error={formik.touched.client && Boolean(formik.errors.client)}
                              helperText={formik.touched.client && formik.errors.client}
                              placeholder="Search clients..."
                              sx={{
                                '& .MuiOutlinedInput-root': {
                                  borderRadius: '8px',
                                  backgroundColor: 'white',
                                }
                              }}
                              InputProps={{
                                ...params.InputProps,
                                startAdornment: (
                                  <>
                                    <InputAdornment position="start">
                                      <SearchIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                                    </InputAdornment>
                                    {params.InputProps.startAdornment}
                                  </>
                                ),
                                endAdornment: (
                                  <>
                                    {loadingClients && <CircularProgress color="inherit" size={18} />}
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
                                  <span className="font-medium text-gray-900 dark:text-gray-100">{option.name}</span>
                                  {option.company_name && (
                                    <span className="text-xs text-gray-500 dark:text-gray-400">{option.company_name}</span>
                                  )}
                                </div>
                              </li>
                            );
                          }}
                        />
                        <Tooltip title="Add new client">
                          <IconButton
                            onClick={() => setShowQuickAddClient(true)}
                            disabled={loading}
                            sx={{
                              bgcolor: '#10b981',
                              color: 'white',
                              '&:hover': { bgcolor: '#059669' },
                              height: 40,
                              width: 40,
                              flexShrink: 0,
                              borderRadius: '8px',
                            }}
                          >
                            <AddIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Architect / Designer</label>
                      <div className="flex gap-2">
                        <Autocomplete
                          fullWidth
                          options={architects}
                          value={selectedArchitect}
                          onChange={(event, newValue) => {
                            setSelectedArchitect(newValue);
                            formik.setFieldValue('architect_designer', newValue?.id || '');
                          }}
                          filterOptions={(options, state) => {
                            const input = sanitizeSearchInput(state.inputValue).toLowerCase();
                            if (!input) return options;
                            return options.filter(option =>
                              option.name?.toLowerCase().includes(input) ||
                              option.company_name?.toLowerCase().includes(input) ||
                              option.contact_email?.toLowerCase().includes(input)
                            );
                          }}
                          getOptionLabel={(option) => {
                            if (!option) return '';
                            return option.company_name
                              ? `${option.name} (${option.company_name})`
                              : option.name || '';
                          }}
                          isOptionEqualToValue={(option, value) => option?.id === value?.id}
                          loading={loadingArchitects}
                          disabled={loading}
                          noOptionsText={loadingArchitects ? "Loading..." : "No architects found - click + to add"}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              size="small"
                              placeholder="Search architects..."
                              sx={{
                                '& .MuiOutlinedInput-root': {
                                  borderRadius: '8px',
                                  backgroundColor: 'white',
                                }
                              }}
                              InputProps={{
                                ...params.InputProps,
                                startAdornment: (
                                  <>
                                    <InputAdornment position="start">
                                      <SearchIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                                    </InputAdornment>
                                    {params.InputProps.startAdornment}
                                  </>
                                ),
                                endAdornment: (
                                  <>
                                    {loadingArchitects && <CircularProgress color="inherit" size={18} />}
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
                                  <span className="font-medium text-gray-900 dark:text-gray-100">{option.name}</span>
                                  {option.company_name && (
                                    <span className="text-xs text-gray-500 dark:text-gray-400">{option.company_name}</span>
                                  )}
                                </div>
                              </li>
                            );
                          }}
                        />
                        <Tooltip title="Add new architect">
                          <IconButton
                            onClick={() => setShowQuickAddArchitect(true)}
                            disabled={loading}
                            sx={{
                              bgcolor: '#8b5cf6',
                              color: 'white',
                              '&:hover': { bgcolor: '#7c3aed' },
                              height: 40,
                              width: 40,
                              flexShrink: 0,
                              borderRadius: '8px',
                            }}
                          >
                            <AddIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </div>
                    </div>
                  </div>
                </div>
              </Collapse>
            </div>

            {/* Location Section */}
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600 overflow-hidden">
              <SectionHeader
                icon={<LocationIcon fontSize="small" />}
                title="Location"
                subtitle="Project and legal addresses"
                isOpen={sectionsOpen.location}
                onToggle={() => toggleSection('location')}
                bgColor="bg-green-50"
                iconColor="text-green-600"
              />
              <Collapse in={sectionsOpen.location}>
                <div className="p-5 space-y-4 border-t border-gray-100 dark:border-gray-600">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                      Project Address <span className="text-red-500">*</span>
                    </label>
                    <TextField
                      fullWidth
                      name="address"
                      multiline
                      rows={2}
                      value={formik.values.address}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={formik.touched.address && Boolean(formik.errors.address)}
                      helperText={formik.touched.address && formik.errors.address}
                      disabled={loading}
                      size="small"
                      placeholder="Enter the project address"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: '8px',
                          backgroundColor: 'white',
                        }
                      }}
                      className="dark:[&_.MuiOutlinedInput-root]:bg-gray-600 dark:[&_.MuiOutlinedInput-input]:text-white"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Legal Address</label>
                    <TextField
                      fullWidth
                      name="legal_address"
                      value={formik.values.legal_address}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      disabled={loading}
                      size="small"
                      placeholder="Parcel no, Block no, Lot no"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: '8px',
                          backgroundColor: 'white',
                        }
                      }}
                      className="dark:[&_.MuiOutlinedInput-root]:bg-gray-600 dark:[&_.MuiOutlinedInput-input]:text-white"
                    />
                  </div>
                </div>
              </Collapse>
            </div>

            {/* Timeline Section */}
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600 overflow-hidden">
              <SectionHeader
                icon={<CalendarIcon fontSize="small" />}
                title="Timeline"
                subtitle="Important dates and deadlines"
                isOpen={sectionsOpen.timeline}
                onToggle={() => toggleSection('timeline')}
                bgColor="bg-orange-50"
                iconColor="text-orange-600"
              />
              <Collapse in={sectionsOpen.timeline}>
                <div className="p-5 space-y-4 border-t border-gray-100 dark:border-gray-600">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                        Due Date <span className="text-red-500">*</span>
                      </label>
                      <TextField
                        fullWidth
                        name="due_date"
                        type="date"
                        value={formik.values.due_date}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={formik.touched.due_date && Boolean(formik.errors.due_date)}
                        helperText={formik.touched.due_date && formik.errors.due_date}
                        disabled={loading}
                        size="small"
                        InputLabelProps={{ shrink: true }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: '8px',
                            backgroundColor: 'white',
                          }
                        }}
                        className="dark:[&_.MuiOutlinedInput-root]:bg-gray-600 dark:[&_.MuiOutlinedInput-input]:text-white"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Rough-in Date</label>
                      <TextField
                        fullWidth
                        name="rough_in_date"
                        type="date"
                        value={formik.values.rough_in_date}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        disabled={loading}
                        size="small"
                        InputLabelProps={{ shrink: true }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: '8px',
                            backgroundColor: 'white',
                          }
                        }}
                        className="dark:[&_.MuiOutlinedInput-root]:bg-gray-600 dark:[&_.MuiOutlinedInput-input]:text-white"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Final Inspection</label>
                      <TextField
                        fullWidth
                        name="final_inspection_date"
                        type="date"
                        value={formik.values.final_inspection_date}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        disabled={loading}
                        size="small"
                        InputLabelProps={{ shrink: true }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: '8px',
                            backgroundColor: 'white',
                          }
                        }}
                        className="dark:[&_.MuiOutlinedInput-root]:bg-gray-600 dark:[&_.MuiOutlinedInput-input]:text-white"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Due Date Notes</label>
                    <TextField
                      fullWidth
                      name="due_date_note"
                      multiline
                      rows={2}
                      value={formik.values.due_date_note}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      disabled={loading}
                      size="small"
                      placeholder="Any notes about the timeline..."
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: '8px',
                          backgroundColor: 'white',
                        }
                      }}
                      className="dark:[&_.MuiOutlinedInput-root]:bg-gray-600 dark:[&_.MuiOutlinedInput-input]:text-white"
                    />
                  </div>
                </div>
              </Collapse>
            </div>

            {/* Action Items Section */}
            <div className="bg-indigo-50 dark:bg-indigo-900/30 rounded-xl border border-indigo-100 dark:border-indigo-800 overflow-hidden">
              <SectionHeader
                icon={<AssignmentIcon fontSize="small" />}
                title="Action Items & Notes"
                subtitle="Track open items and action items"
                isOpen={sectionsOpen.details}
                onToggle={() => toggleSection('details')}
                bgColor="bg-indigo-100"
                iconColor="text-indigo-600"
                optional
              />
              <Collapse in={sectionsOpen.details}>
                <div className="p-5 space-y-4 border-t border-indigo-100 dark:border-indigo-800">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Open Items</label>
                      <TextField
                        fullWidth
                        name="current_open_items"
                        multiline
                        rows={3}
                        value={formik.values.current_open_items}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        disabled={loading}
                        size="small"
                        placeholder="List any open items..."
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: '8px',
                            backgroundColor: 'white',
                          }
                        }}
                        className="dark:[&_.MuiOutlinedInput-root]:bg-gray-600 dark:[&_.MuiOutlinedInput-input]:text-white"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Action Items</label>
                      <TextField
                        fullWidth
                        name="current_action_items"
                        multiline
                        rows={3}
                        value={formik.values.current_action_items}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        disabled={loading}
                        size="small"
                        placeholder="List action items..."
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: '8px',
                            backgroundColor: 'white',
                          }
                        }}
                        className="dark:[&_.MuiOutlinedInput-root]:bg-gray-600 dark:[&_.MuiOutlinedInput-input]:text-white"
                      />
                    </div>
                  </div>
                </div>
              </Collapse>
            </div>

            {/* Billing Section */}
            <div className="bg-amber-50 dark:bg-amber-900/30 rounded-xl border border-amber-100 dark:border-amber-800 overflow-hidden">
              <SectionHeader
                icon={<MoneyIcon fontSize="small" />}
                title="Billing Information"
                subtitle="Payment terms and billing details"
                isOpen={sectionsOpen.billing}
                onToggle={() => toggleSection('billing')}
                bgColor="bg-amber-100"
                iconColor="text-amber-600"
                optional
              />
              <Collapse in={sectionsOpen.billing}>
                <div className="p-5 border-t border-amber-100 dark:border-amber-800">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Billing Information</label>
                    <TextField
                      fullWidth
                      name="billing_info"
                      multiline
                      rows={3}
                      value={formik.values.billing_info}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      disabled={loading}
                      size="small"
                      placeholder="Payment terms, billing address, etc."
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: '8px',
                          backgroundColor: 'white',
                        }
                      }}
                      className="dark:[&_.MuiOutlinedInput-root]:bg-gray-600 dark:[&_.MuiOutlinedInput-input]:text-white"
                    />
                  </div>
                </div>
              </Collapse>
            </div>

          </div>
        </DialogContent>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600 flex items-center justify-between">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            <span className="text-red-500">*</span> Required fields
          </p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-500 hover:border-gray-400 dark:hover:border-gray-400 transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !formik.isValid}
              className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm"
            >
              {loading ? (
                <>
                  <CircularProgress size={16} sx={{ color: 'white' }} />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>{editMode ? 'Update Project' : 'Create Project'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Quick Add Client Modal */}
      <QuickAddClientModal
        open={showQuickAddClient}
        onClose={() => setShowQuickAddClient(false)}
        onSuccess={handleQuickAddClientSuccess}
      />

      {/* Quick Add Architect Modal */}
      <QuickAddArchitectModal
        open={showQuickAddArchitect}
        onClose={() => setShowQuickAddArchitect(false)}
        onSuccess={handleQuickAddArchitectSuccess}
      />
    </Dialog>
  );
};

export default ProjectForm;
