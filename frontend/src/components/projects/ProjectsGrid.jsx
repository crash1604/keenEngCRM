import React, { useMemo, useState, useCallback } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ModuleRegistry, AllCommunityModule, themeQuartz } from 'ag-grid-community';

import Tooltip from './Tooltip';
import DetailPanel from './DetailPanel';
import { useColumnDefs } from '../../hooks/useColumnDefs';
import ProjectNameRenderer from './ProjectNameRenderer';
import StatusRenderer from './StatusRenderer';
import ActionsRenderer from './ActionsRenderer';
import AddressRenderer from './AddressRenderer';
import LoadingSpinner from '../common/LoadingSpinner';
import { useProjectStore } from '../../stores/project.store'; // Add this import

// Register all community modules
ModuleRegistry.registerModules([AllCommunityModule]);

const ProjectsGrid = ({ projects, loading, onStatusChange }) => {
  const [selectedProject, setSelectedProject] = useState(null);
  const [editingField, setEditingField] = useState(null);
  const [formData, setFormData] = useState({});
  const [tooltipContent, setTooltipContent] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  // Add this line to get the update method from store
  const { updateProjectField } = useProjectStore();

  const columnDefs = useColumnDefs(onStatusChange);

  const defaultColDef = useMemo(() => ({
    sortable: true,
    filter: true,
    resizable: true,
    floatingFilter: true,
    suppressMovable: true,
    suppressSizeToFit: true,
    suppressAutoSize: true,
  }), []);

  const customTheme = useMemo(() => {
    return themeQuartz.withParams({});
  }, []);

  const frameworkComponents = useMemo(() => ({
    projectNameRenderer: ProjectNameRenderer,
    statusRenderer: StatusRenderer,
    actionsRenderer: (params) => <ActionsRenderer {...params} onStatusChange={onStatusChange} />,
    addressRenderer: AddressRenderer
  }), [onStatusChange]);

  const handleRowClick = useCallback((event) => {
    setSelectedProject(event.data);
    setFormData(event.data);
    setEditingField(null);
  }, []);

  const handleEdit = useCallback((fieldName) => {
    setEditingField(fieldName);
  }, []);

  // ONLY CHANGE THIS FUNCTION - Add API call here
  const handleSave = useCallback(async (fieldName) => {
    if (!selectedProject) return;

    try {
      // Call the store method to update the field via API
      const result = await updateProjectField(selectedProject.id, fieldName, formData[fieldName]);
      
      if (result.success) {
        // Update local state with the response data
        setSelectedProject(prev => ({ 
          ...prev, 
          [fieldName]: formData[fieldName],
          ...result.data // Include any additional data from backend
        }));
        setEditingField(null);
        
        console.log(`Successfully updated ${fieldName}`);
      } else {
        // Handle error - revert the change
        console.error('Failed to update field:', result.error);
        setFormData(prev => ({ ...prev, [fieldName]: selectedProject[fieldName] }));
      }
    } catch (error) {
      console.error('Error saving field:', error);
      // Revert on error
      setFormData(prev => ({ ...prev, [fieldName]: selectedProject[fieldName] }));
    }
  }, [selectedProject, formData, updateProjectField]);

  const handleCancel = useCallback(() => {
    setFormData(selectedProject);
    setEditingField(null);
  }, [selectedProject]);

  const handleChange = useCallback((fieldName, value) => {
    setFormData(prev => ({ ...prev, [fieldName]: value }));
  }, []);

  const handleClose = useCallback(() => {
    setSelectedProject(null);
    setEditingField(null);
  }, []);

  const handleRowMouseEnter = useCallback((event) => {
    const hasItems = event.data.current_open_items || event.data.current_action_items;
    if (hasItems) {
      setTooltipContent(event.data);
      const rowElement = event.event.target.closest('.ag-row');
      if (rowElement) {
        const rect = rowElement.getBoundingClientRect();
        setTooltipPosition({
          x: rect.right,
          y: rect.top
        });
      }
    }
  }, []);

  const handleRowMouseLeave = useCallback(() => {
    setTooltipContent(null);
  }, []);

  const handleGridReady = useCallback((params) => {
    // params.api.sizeColumnsToFit();
  }, []);

  const handleFirstDataRendered = useCallback((params) => {
    // params.api.sizeColumnsToFit();
  }, []);

  if (loading) {
    return <LoadingSpinner message="Loading projects..." />;
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <Tooltip content={tooltipContent} position={tooltipPosition} />
      
      {/* Left side - AG Grid */}
      <div className={`${selectedProject ? 'w-3/5' : 'w-full'} transition-all duration-300 p-4`}>
        <div className="bg-white rounded-lg shadow-lg" style={{ height: '100%' }}>
          <AgGridReact
            rowData={projects}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            frameworkComponents={frameworkComponents}
            theme={customTheme}
            animateRows={true}
            pagination={true}
            paginationPageSize={20}
            rowSelection="single"
            suppressRowClickSelection={false}
            enableCellTextSelection={true}
            ensureDomOrder={true}
            onRowClicked={handleRowClick}
            onRowMouseEnter={handleRowMouseEnter}
            onRowMouseLeave={handleRowMouseLeave}
            onGridReady={handleGridReady}
            onFirstDataRendered={handleFirstDataRendered}
            loadingOverlayComponent={() => (
              <div className="flex justify-center items-center h-32">
                <div className="text-gray-600">Loading projects...</div>
              </div>
            )}
            noRowsOverlayComponent={() => (
              <div className="flex justify-center items-center h-32">
                <div className="text-gray-500">No projects found</div>
              </div>
            )}
          />
        </div>
      </div>

      {/* Right side - Detail Panel */}
      <DetailPanel
        selectedProject={selectedProject}
        formData={formData}
        editingField={editingField}
        onClose={handleClose}
        onEdit={handleEdit}
        onSave={handleSave} // This now calls the API
        onCancel={handleCancel}
        onChange={handleChange}
      />

      <style>{`
        @keyframes slide-in {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default ProjectsGrid;