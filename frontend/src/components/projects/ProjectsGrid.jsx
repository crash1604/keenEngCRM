import React, { useMemo, useState, useCallback } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ModuleRegistry, AllCommunityModule, themeQuartz } from 'ag-grid-community';

import Tooltip from './Tooltip';
import DetailPanel from './DetailPanel';
import ProjectNameRenderer from './ProjectNameRenderer';
import StatusRenderer from './StatusRenderer';
import ProjectTypesRenderer from './ProjectTypesRenderer';
import AddressRenderer from './AddressRenderer';
import LoadingSpinner from '../common/LoadingSpinner';
import { useProjectStore } from '../../stores/project.store';
import { useProjectColumnDefs } from '../../hooks/useProjectColumnDefs';

// Register all community modules
ModuleRegistry.registerModules([AllCommunityModule]);

const ProjectsGrid = ({ projects, loading }) => {
  const [selectedProject, setSelectedProject] = useState(null);
  const [editingField, setEditingField] = useState(null);
  const [formData, setFormData] = useState({});
  const [tooltipContent, setTooltipContent] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  const { updateProjectField } = useProjectStore();

  // Get column definitions from hook
  const columnDefs = useProjectColumnDefs();

  // Custom cell renderers
  const components = useMemo(() => ({
    projectNameRenderer: ProjectNameRenderer,
    statusRenderer: StatusRenderer,
    projectTypesRenderer: ProjectTypesRenderer,
    addressRenderer: AddressRenderer,
  }), []);

  const defaultColDef = useMemo(() => ({
    sortable: true,
    filter: true,
    resizable: true,
    floatingFilter: true,
    suppressMovable: true,
  }), []);

  const customTheme = useMemo(() => {
    return themeQuartz.withParams({
      backgroundColor: '#ffffff',
      foregroundColor: '#181d1f',
      borderColor: '#e2e8f0',
      headerBackgroundColor: '#f8fafc',
      headerTextColor: '#0f172a',
      fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      fontSize: 13,
      headerFontSize: 13,
      headerFontWeight: 600,
    });
  }, []);

  const handleRowClick = useCallback((event) => {
    setSelectedProject(event.data);
    setFormData(event.data);
    setEditingField(null);
  }, []);

  const handleEdit = useCallback((fieldName) => {
    setEditingField(fieldName);
  }, []);

  const handleSave = useCallback(async (fieldName) => {
    if (!selectedProject) return;

    try {
      const result = await updateProjectField(selectedProject.id, fieldName, formData[fieldName]);

      if (result.success) {
        setSelectedProject(prev => ({
          ...prev,
          [fieldName]: formData[fieldName],
          ...result.data
        }));
        setEditingField(null);
      } else {
        console.error('Failed to update field:', result.error);
        setFormData(prev => ({ ...prev, [fieldName]: selectedProject[fieldName] }));
      }
    } catch (error) {
      console.error('Error saving field:', error);
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
        setTooltipPosition({ x: rect.right, y: rect.top });
      }
    }
  }, []);

  const handleRowMouseLeave = useCallback(() => {
    setTooltipContent(null);
  }, []);

  if (loading) {
    return <LoadingSpinner message="Loading projects..." />;
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <Tooltip content={tooltipContent} position={tooltipPosition} />

      {/* AG Grid */}
      <div className={`${selectedProject ? 'w-3/5' : 'w-full'} transition-all duration-300 p-4`}>
        <div className="bg-white rounded-lg shadow-lg" style={{ height: '100%' }}>
          <AgGridReact
            rowData={projects}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            components={components}
            theme={customTheme}
            animateRows={true}
            pagination={true}
            paginationPageSize={20}
            paginationPageSizeSelector={[10, 20, 50, 100]}
            rowSelection="single"
            suppressRowClickSelection={false}
            enableCellTextSelection={true}
            ensureDomOrder={true}
            rowHeight={45}
            headerHeight={44}
            floatingFiltersHeight={36}
            onRowClicked={handleRowClick}
            onRowMouseEnter={handleRowMouseEnter}
            onRowMouseLeave={handleRowMouseLeave}
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

      {/* Detail Panel */}
      <DetailPanel
        selectedProject={selectedProject}
        formData={formData}
        editingField={editingField}
        onClose={handleClose}
        onEdit={handleEdit}
        onSave={handleSave}
        onCancel={handleCancel}
        onChange={handleChange}
      />

      <style>{`
        @keyframes slide-in {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .animate-slide-in { animation: slide-in 0.3s ease-out; }
      `}</style>
    </div>
  );
};

export default ProjectsGrid;
