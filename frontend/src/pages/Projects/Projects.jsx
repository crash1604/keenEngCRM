// src/pages/Projects/Projects.jsx
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Snackbar, Alert, Button } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import FilterListOffIcon from '@mui/icons-material/FilterListOff';
import { useProjectStore } from '../../stores/project.store';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ProjectsGrid from '../../components/projects/ProjectsGrid';
import ProjectForm from '../../components/projects/ProjectForm';

const Projects = () => {
  const gridRef = useRef(null);
  const [hasActiveFilters, setHasActiveFilters] = useState(false);
  const {
    projects,
    loading,
    error,
    filters,
    fetchProjects,
    setFilters,
    updateProjectStatus
  } = useProjectStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [debugInfo, setDebugInfo] = useState(null);

  // Modal state
  const [formOpen, setFormOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [editMode, setEditMode] = useState(false);

  // Snackbar state
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // Debug helper (keep your existing debug code)
  const testAPI = async () => {
    // ... your existing debug code
  };

  useEffect(() => {
    fetchProjects();
    testAPI();
  }, [fetchProjects, filters]);

  const handleSearch = (e) => {
    e.preventDefault();
    setFilters({ search: searchTerm, page: 1 });
  };

  const handleStatusChange = async (projectId, newStatus) => {
    const result = await updateProjectStatus(projectId, newStatus);
    if (result.success) {
      console.log('Status updated successfully');
      // Optionally refresh the projects list
      fetchProjects();
    }
  };

  const handleExport = () => {
    try {
      // Get the currently displayed (filtered) rows from the grid
      const displayedRows = gridRef.current?.getDisplayedRows() || [];

      if (displayedRows.length === 0) {
        setSnackbar({
          open: true,
          message: 'No projects to export',
          severity: 'warning'
        });
        return;
      }

      // Define CSV headers matching all Project model fields
      const headers = [
        'Year',
        'Job Number',
        'Project Name',
        'Project Type',
        'Status',
        'Current Sub Status',
        'Current Open Items',
        'Current Action Items',
        'Client',
        'Architect/Designer',
        'Mechanical Manager',
        'Due Date',
        'Due Date Note',
        'Rough In Date',
        'Rough In Note',
        'Final Inspection Date',
        'Final Inspection Note',
        'Address',
        'Legal Address',
        'Billing Info',
        'Created At',
        'Updated At',
        'Last Status Change'
      ];

      // Helper to escape CSV values
      const escapeCSV = (value) => {
        if (value === null || value === undefined) return '';
        const str = String(value);
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      };

      // Helper to format date
      const formatDate = (date) => {
        if (!date) return '';
        return new Date(date).toLocaleDateString('en-CA'); // YYYY-MM-DD format
      };

      // Helper to format datetime
      const formatDateTime = (date) => {
        if (!date) return '';
        return new Date(date).toLocaleString('en-CA', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false
        }).replace(',', '');
      };

      // Convert rows to CSV
      const csvRows = displayedRows.map(project => [
        escapeCSV(project.year),
        escapeCSV(project.job_number),
        escapeCSV(project.project_name),
        escapeCSV(Array.isArray(project.project_type) ? project.project_type.join(', ') : project.project_type),
        escapeCSV(project.status_display || project.status),
        escapeCSV(project.current_sub_status),
        escapeCSV(project.current_open_items),
        escapeCSV(project.current_action_items),
        escapeCSV(project.client_name || project.client?.name || ''),
        escapeCSV(project.architect_name || project.architect_designer?.name || ''),
        escapeCSV(project.manager_name || project.mechanical_manager?.full_name || ''),
        escapeCSV(formatDate(project.due_date)),
        escapeCSV(project.due_date_note),
        escapeCSV(formatDate(project.rough_in_date)),
        escapeCSV(project.rough_in_note),
        escapeCSV(formatDate(project.final_inspection_date)),
        escapeCSV(project.final_inspection_note),
        escapeCSV(project.address),
        escapeCSV(project.legal_address),
        escapeCSV(project.billing_info),
        escapeCSV(formatDateTime(project.created_at)),
        escapeCSV(formatDateTime(project.updated_at)),
        escapeCSV(formatDateTime(project.last_status_change))
      ].join(','));

      // Combine headers and rows
      const csvContent = [headers.join(','), ...csvRows].join('\n');

      // Create and download the file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `projects_export_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setSnackbar({
        open: true,
        message: `Exported ${displayedRows.length} project${displayedRows.length !== 1 ? 's' : ''} successfully!`,
        severity: 'success'
      });
    } catch (error) {
      console.error('Export error:', error);
      setSnackbar({
        open: true,
        message: 'Failed to export projects',
        severity: 'error'
      });
    }
  };

  // Modal handlers
  const handleOpenCreate = () => {
    setSelectedProject(null);
    setEditMode(false);
    setFormOpen(true);
  };

  const handleCloseForm = () => {
    setFormOpen(false);
    setSelectedProject(null);
    setEditMode(false);
  };

  const handleFormSuccess = () => {
    setSnackbar({
      open: true,
      message: editMode ? 'Project updated successfully!' : 'Project created successfully!',
      severity: 'success'
    });
    fetchProjects();
  };

  const handleFormError = (errorMessage) => {
    setSnackbar({
      open: true,
      message: errorMessage || 'Failed to save project',
      severity: 'error'
    });
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  // Filter handlers
  const handleFilterChanged = useCallback((hasFilters) => {
    setHasActiveFilters(hasFilters);
  }, []);

  const handleClearFilters = useCallback(() => {
    if (gridRef.current) {
      gridRef.current.clearAllFilters();
      setHasActiveFilters(false);
    }
  }, []);

  const statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'not_started', label: 'Not Started' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'submitted', label: 'Submitted' },
    { value: 'approved', label: 'Approved' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' }
  ];

  return (
    <div className="space-y-6">
      {/* Debug Information - Keep your existing debug panel */}
      {debugInfo && (
        <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4">
          {/* Your existing debug content */}
        </div>
      )}

      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Projects</h1>
          <div className="flex items-center gap-3">
            {hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/50 hover:border-red-300 dark:hover:border-red-600 transition-all duration-200"
              >
                <FilterListOffIcon fontSize="small" />
                Clear Filters
              </button>
            )}
            <Button
              variant="outlined"
              startIcon={<FileDownloadIcon />}
              onClick={handleExport}
              sx={{
                borderColor: '#10b981',
                color: '#10b981',
                '&:hover': {
                  borderColor: '#059669',
                  bgcolor: 'rgba(16, 185, 129, 0.08)'
                },
                textTransform: 'none',
                fontWeight: 600,
              }}
            >
              Export
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleOpenCreate}
              sx={{
                bgcolor: '#2563eb',
                '&:hover': { bgcolor: '#1d4ed8' },
                textTransform: 'none',
                fontWeight: 600,
              }}
            >
              New Project
            </Button>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-400 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* AG Grid Component */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <ProjectsGrid
          ref={gridRef}
          projects={projects}
          loading={loading}
          onStatusChange={handleStatusChange}
          onFilterChanged={handleFilterChanged}
        />
      </div>

      {/* Quick Stats */}
      {projects.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Projects</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{projects.length}</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <div className="text-sm font-medium text-gray-600 dark:text-gray-400">In Progress</div>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {projects.filter(p => p.status === 'in_progress').length}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Overdue</div>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {projects.filter(p => p.days_until_due < 0).length}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Completed</div>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {projects.filter(p => p.status === 'completed').length}
            </div>
          </div>
        </div>
      )}

      {/* Project Form Modal */}
      <ProjectForm
        open={formOpen}
        onClose={handleCloseForm}
        project={selectedProject}
        editMode={editMode}
        onSuccess={handleFormSuccess}
        onError={handleFormError}
      />

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default Projects;