// src/pages/Projects/Projects.jsx
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Snackbar, Alert, Button } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
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

  const handleExport = async () => {
    const { exportProjects } = useProjectStore.getState();
    await exportProjects();
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
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          {/* Your existing debug content */}
        </div>
      )}

      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
          <div className="flex items-center gap-3">
            {hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 hover:border-red-300 transition-all duration-200"
              >
                <FilterListOffIcon fontSize="small" />
                Clear Filters
              </button>
            )}
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
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* AG Grid Component */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
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
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="text-sm font-medium text-gray-600">Total Projects</div>
            <div className="text-2xl font-bold text-gray-900">{projects.length}</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="text-sm font-medium text-gray-600">In Progress</div>
            <div className="text-2xl font-bold text-blue-600">
              {projects.filter(p => p.status === 'in_progress').length}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="text-sm font-medium text-gray-600">Overdue</div>
            <div className="text-2xl font-bold text-red-600">
              {projects.filter(p => p.days_until_due < 0).length}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="text-sm font-medium text-gray-600">Completed</div>
            <div className="text-2xl font-bold text-green-600">
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