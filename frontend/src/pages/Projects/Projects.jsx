import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Snackbar, Alert, Button } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import FilterListOffIcon from '@mui/icons-material/FilterListOff';
import { useProjectStore } from '../../stores/project.store';
import ProjectsGrid from '../../components/projects/ProjectsGrid';
import ProjectForm from '../../components/projects/ProjectForm';
import { useSnackbar } from '../../hooks/useSnackbar';
import { formatDateISO, formatDateTime, escapeCSV, downloadCSV } from '../../utils/helpers';

// CSV Export headers configuration
const CSV_HEADERS = [
  { label: 'Year', getValue: (p) => p.year },
  { label: 'Job Number', getValue: (p) => p.job_number },
  { label: 'Project Name', getValue: (p) => p.project_name },
  { label: 'Project Type', getValue: (p) => Array.isArray(p.project_type) ? p.project_type.join(', ') : p.project_type },
  { label: 'Status', getValue: (p) => p.status_display || p.status },
  { label: 'Current Sub Status', getValue: (p) => p.current_sub_status },
  { label: 'Current Open Items', getValue: (p) => p.current_open_items },
  { label: 'Current Action Items', getValue: (p) => p.current_action_items },
  { label: 'Client', getValue: (p) => p.client_name || p.client?.name || '' },
  { label: 'Architect/Designer', getValue: (p) => p.architect_name || p.architect_designer?.name || '' },
  { label: 'Mechanical Manager', getValue: (p) => p.manager_name || p.mechanical_manager?.full_name || '' },
  { label: 'Due Date', getValue: (p) => formatDateISO(p.due_date) },
  { label: 'Due Date Note', getValue: (p) => p.due_date_note },
  { label: 'Rough In Date', getValue: (p) => formatDateISO(p.rough_in_date) },
  { label: 'Rough In Note', getValue: (p) => p.rough_in_note },
  { label: 'Final Inspection Date', getValue: (p) => formatDateISO(p.final_inspection_date) },
  { label: 'Final Inspection Note', getValue: (p) => p.final_inspection_note },
  { label: 'Address', getValue: (p) => p.address },
  { label: 'Legal Address', getValue: (p) => p.legal_address },
  { label: 'Billing Info', getValue: (p) => p.billing_info },
  { label: 'Created At', getValue: (p) => formatDateTime(p.created_at) },
  { label: 'Updated At', getValue: (p) => formatDateTime(p.updated_at) },
  { label: 'Last Status Change', getValue: (p) => formatDateTime(p.last_status_change) },
];

const Projects = () => {
  const gridRef = useRef(null);
  const [hasActiveFilters, setHasActiveFilters] = useState(false);
  const { snackbar, showSuccess, showError, showWarning, closeSnackbar } = useSnackbar();

  const {
    projects,
    loading,
    error,
    filters,
    fetchProjects,
    updateProjectStatus
  } = useProjectStore();

  // Modal state - using showForm for consistency with other pages
  const [showForm, setShowForm] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects, filters]);

  const handleStatusChange = useCallback(async (projectId, newStatus) => {
    try {
      const result = await updateProjectStatus(projectId, newStatus);
      if (result.success) {
        fetchProjects();
      }
    } catch (err) {
      showError('Failed to update project status');
    }
  }, [updateProjectStatus, fetchProjects, showError]);

  const handleExport = useCallback(() => {
    try {
      const displayedRows = gridRef.current?.getDisplayedRows() || [];

      if (displayedRows.length === 0) {
        showWarning('No projects to export');
        return;
      }

      const headerRow = CSV_HEADERS.map(h => h.label).join(',');
      const dataRows = displayedRows.map(project =>
        CSV_HEADERS.map(h => escapeCSV(h.getValue(project))).join(',')
      );
      const csvContent = [headerRow, ...dataRows].join('\n');

      const filename = `projects_export_${new Date().toISOString().split('T')[0]}.csv`;
      downloadCSV(csvContent, filename);

      showSuccess(`Exported ${displayedRows.length} project${displayedRows.length !== 1 ? 's' : ''} successfully!`);
    } catch (err) {
      showError('Failed to export projects');
    }
  }, [showSuccess, showError, showWarning]);

  // Modal handlers
  const handleOpenCreate = useCallback(() => {
    setSelectedProject(null);
    setEditMode(false);
    setShowForm(true);
  }, []);

  const handleCloseForm = useCallback(() => {
    setShowForm(false);
    setSelectedProject(null);
    setEditMode(false);
  }, []);

  const handleFormSuccess = useCallback(() => {
    showSuccess(editMode ? 'Project updated successfully!' : 'Project created successfully!');
    fetchProjects();
  }, [editMode, fetchProjects, showSuccess]);

  const handleFormError = useCallback((errorMessage) => {
    showError(errorMessage || 'Failed to save project');
  }, [showError]);

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

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 shrink-0">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Projects</h1>
          <div className="flex items-center gap-3">
            {hasActiveFilters && (
              <button
                type="button"
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
      <div className="flex-1 min-h-0 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 flex flex-col">
        <ProjectsGrid
          ref={gridRef}
          projects={projects}
          loading={loading}
          onStatusChange={handleStatusChange}
          onFilterChanged={handleFilterChanged}
        />
      </div>

      {/* Project Form Modal */}
      <ProjectForm
        open={showForm}
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
        onClose={closeSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={closeSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default Projects;
