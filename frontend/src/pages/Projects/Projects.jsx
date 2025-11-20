// src/pages/Projects/Projects.jsx
import React, { useEffect, useState } from 'react';
import { useProjectStore } from '../../stores/project.store';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ProjectsGrid from '../../components/projects/ProjectsGrid';

const Projects = () => {
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
      {/* <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-4">
          <div className="flex space-x-3">
            <button
              onClick={handleExport}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              disabled={loading}
            >
              Export CSV
            </button>
            <button
              onClick={() => console.log('Create new project')}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              New Project
            </button>
          </div>
        </div>
      </div> */}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* AG Grid Component */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <ProjectsGrid 
          projects={projects} 
          loading={loading}
          onStatusChange={handleStatusChange}
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
    </div>
  );
};

export default Projects;