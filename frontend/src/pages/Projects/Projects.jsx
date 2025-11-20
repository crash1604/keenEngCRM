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
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
            <p className="text-gray-600 mt-2">Manage and track all your projects</p>
          </div>
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
        
        {/* Search and Filters */}
        <div className="mt-4 flex flex-col sm:flex-row gap-4">
          <form onSubmit={handleSearch} className="flex-1">
            <div className="relative">
              <input
                type="text"
                placeholder="Search projects by name, job number, or client..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </form>
          
          <select
            value={filters.status || ''}
            onChange={(e) => setFilters({ status: e.target.value, page: 1 })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {statusOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <select
            value={filters.ordering}
            onChange={(e) => setFilters({ ordering: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="-created_at">Newest First</option>
            <option value="created_at">Oldest First</option>
            <option value="due_date">Due Date (Asc)</option>
            <option value="-due_date">Due Date (Desc)</option>
            <option value="project_name">Name (A-Z)</option>
            <option value="-project_name">Name (Z-A)</option>
          </select>
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