// src/pages/Projects/Projects.jsx
import React, { useEffect, useState } from 'react';
import { useProjectStore } from '../../stores/project.store';
import LoadingSpinner from '../../components/common/LoadingSpinner';

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

  // Debug helper function
  const testAPI = async () => {
    try {
      const token = localStorage.getItem('access_token');
      console.log('🔍 Debug - Token:', token);
      
      const debugData = {
        token: token ? 'Present' : 'Missing',
        tokenLength: token?.length || 0,
        user: localStorage.getItem('user'),
        filters: filters
      };
      
      setDebugInfo({
        ...debugData,
        status: 'testing...'
      });

      const response = await fetch('http://localhost:8000/api/projects/', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('🔍 Debug - Response status:', response.status);
      console.log('🔍 Debug - Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('🔍 Debug - API Error:', errorText);
        setDebugInfo({
          ...debugData,
          status: `Error: ${response.status}`,
          error: errorText,
          responseHeaders: Object.fromEntries(response.headers.entries())
        });
      } else {
        const data = await response.json();
        console.log('🔍 Debug - API Success:', data);
        setDebugInfo({
          ...debugData,
          status: `Success: ${response.status}`,
          dataLength: Array.isArray(data) ? data.length : data.results?.length || 'unknown',
          dataSample: Array.isArray(data) ? data.slice(0, 2) : data.results?.slice(0, 2) || data
        });
      }
    } catch (error) {
      console.error('🔍 Debug - Fetch error:', error);
      setDebugInfo(prev => ({
        ...prev,
        status: `Exception: ${error.message}`,
        error: error.toString()
      }));
    }
  };

  useEffect(() => {
    fetchProjects();
    
    // Run debug test on component mount
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
    }
  };

  const statusColors = {
    not_started: 'bg-gray-100 text-gray-800',
    in_progress: 'bg-blue-100 text-blue-800',
    submitted: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800'
  };

  const statusOptions = [
    { value: 'not_started', label: 'Not Started' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'submitted', label: 'Submitted' },
    { value: 'approved', label: 'Approved' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' }
  ];

  return (
    <div className="space-y-6">
      {/* Debug Information - Can be removed after fixing the issue */}
      {debugInfo && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-semibold text-yellow-800">🔍 API Debug Info</h3>
            <button 
              onClick={testAPI}
              className="px-3 py-1 bg-yellow-500 text-white text-sm rounded hover:bg-yellow-600"
            >
              Test Again
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p><strong>Token:</strong> {debugInfo.token}</p>
              <p><strong>Token Length:</strong> {debugInfo.tokenLength}</p>
              <p><strong>Status:</strong> {debugInfo.status}</p>
              {debugInfo.error && (
                <p><strong>Error:</strong> <span className="text-red-600">{debugInfo.error}</span></p>
              )}
            </div>
            <div>
              <p><strong>Current Filters:</strong></p>
              <pre className="text-xs bg-white p-2 rounded border">
                {JSON.stringify(debugInfo.filters, null, 2)}
              </pre>
            </div>
            {debugInfo.dataLength && (
              <div className="md:col-span-2">
                <p><strong>Data Received:</strong> {debugInfo.dataLength} items</p>
                <p><strong>Sample Data:</strong></p>
                <pre className="text-xs bg-white p-2 rounded border max-h-32 overflow-auto">
                  {JSON.stringify(debugInfo.dataSample, null, 2)}
                </pre>
                <pre className="text-xs bg-white p-2 rounded border max-h-32 overflow-auto">
                  {JSON.stringify(debugInfo, null, 2)}
                </pre>
              </div>
            )}
          </div>
          <div className="mt-2 text-xs text-yellow-600">
            This debug panel will help identify API connection issues. You can remove it after the issue is resolved.
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
        <p className="text-gray-600 mt-2">Manage and track all your projects</p>
        
        {/* Search and Filters */}
        <div className="mt-4 flex flex-col sm:flex-row gap-4">
          <form onSubmit={handleSearch} className="flex-1">
            <input
              type="text"
              placeholder="Search projects by name, job number, or client..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </form>
          
          <select
            value={filters.status}
            onChange={(e) => setFilters({ status: e.target.value, page: 1 })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Status</option>
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

      {loading ? (
        <div className="flex justify-center py-8">
          <LoadingSpinner />
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          {projects.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {projects.map((project) => (
                <div key={project.id} className="p-6 hover:bg-gray-50 transition-colors duration-150">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg font-semibold text-blue-600">
                          {project.project_name}
                        </h3>
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${statusColors[project.status]}`}>
                          {project.status.replace('_', ' ')}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">Job #:</span> {project.job_number}
                        </div>
                        <div>
                          <span className="font-medium">Client:</span> {project.client?.name || 'N/A'}
                        </div>
                        <div>
                          <span className="font-medium">Due Date:</span> {new Date(project.due_date).toLocaleDateString()}
                        </div>
                      </div>

                      {project.architect_designer && (
                        <div className="mt-2 text-sm text-gray-500">
                          <span className="font-medium">Architect:</span> {project.architect_designer.name}
                        </div>
                      )}
                    </div>
                    
                    <div className="ml-6">
                      <select
                        value={project.status}
                        onChange={(e) => handleStatusChange(project.id, e.target.value)}
                        className="text-sm border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        {statusOptions.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No projects found</p>
              <p className="text-gray-400 mt-2">Try adjusting your search or filters</p>
            </div>
          )}
        </div>
      )}

      {/* Additional Store State Debug Info */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="font-semibold text-gray-700 mb-2">Store State Debug:</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
          <div>
            <strong>Projects Count:</strong> {projects.length}
          </div>
          <div>
            <strong>Loading:</strong> {loading ? 'Yes' : 'No'}
          </div>
          <div>
            <strong>Error:</strong> {error ? 'Yes' : 'No'}
          </div>
          <div>
            <strong>Filters Active:</strong> {Object.values(filters).filter(v => v).length}
          </div>
        </div>
        {error && (
          <div className="mt-2 text-sm text-red-600">
            <strong>Store Error:</strong> {error}
          </div>
        )}
      </div>
    </div>
  );
};

export default Projects;