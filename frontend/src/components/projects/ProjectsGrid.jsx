import React, { useMemo, useState, useCallback, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
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

const ProjectsGrid = forwardRef(({ projects, loading, onFilterChanged }, ref) => {
  const gridRef = useRef(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [editingField, setEditingField] = useState(null);
  const [formData, setFormData] = useState({});
  const [tooltipContent, setTooltipContent] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [savingField, setSavingField] = useState(null);
  const [saveStatus, setSaveStatus] = useState({ show: false, success: false, message: '' });

  const { updateProjectField } = useProjectStore();

  // Expose methods to parent via ref
  useImperativeHandle(ref, () => ({
    clearAllFilters: () => {
      if (gridRef.current?.api) {
        gridRef.current.api.setFilterModel(null);
      }
    },
    getFilterModel: () => {
      if (gridRef.current?.api) {
        return gridRef.current.api.getFilterModel();
      }
      return null;
    },
    getDisplayedRows: () => {
      if (gridRef.current?.api) {
        const displayedRows = [];
        gridRef.current.api.forEachNodeAfterFilterAndSort((node) => {
          if (node.data) {
            displayedRows.push(node.data);
          }
        });
        return displayedRows;
      }
      return [];
    }
  }));

  // Handle filter changes
  const handleFilterChanged = useCallback(() => {
    if (gridRef.current?.api) {
      const filterModel = gridRef.current.api.getFilterModel();
      const hasFilters = filterModel && Object.keys(filterModel).length > 0;
      onFilterChanged?.(hasFilters);
    }
  }, [onFilterChanged]);

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
  }), []);

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

    setSavingField(fieldName);

    try {
      const result = await updateProjectField(selectedProject.id, fieldName, formData[fieldName]);

      if (result.success) {
        setSelectedProject(prev => ({
          ...prev,
          [fieldName]: formData[fieldName],
          ...result.data
        }));
        setEditingField(null);
        setSaveStatus({ show: true, success: true, message: 'Saved' });
      } else {
        console.error('Failed to update field:', result.error);
        setFormData(prev => ({ ...prev, [fieldName]: selectedProject[fieldName] }));
        setSaveStatus({ show: true, success: false, message: result.error || 'Failed to save' });
      }
    } catch (error) {
      console.error('Error saving field:', error);
      setFormData(prev => ({ ...prev, [fieldName]: selectedProject[fieldName] }));
      setSaveStatus({ show: true, success: false, message: 'Failed to save' });
    } finally {
      setSavingField(null);
      // Auto-hide status after 2 seconds
      setTimeout(() => setSaveStatus({ show: false, success: false, message: '' }), 2000);
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
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      <Tooltip content={tooltipContent} position={tooltipPosition} />

      {/* AG Grid */}
      <div className={`${selectedProject ? 'w-1/3' : 'w-full'}`}>
        <div className="ag-theme-quartz" style={{ height: '100%', width: '100%' }}>
          <AgGridReact
            ref={gridRef}
            theme={themeQuartz}
            rowData={projects}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            components={components}
            animateRows={true}
            pagination={true}
            paginationPageSize={20}
            paginationPageSizeSelector={[10, 20, 50, 100]}
            rowSelection="single"
            suppressRowClickSelection={false}
            enableCellTextSelection={true}
            ensureDomOrder={true}
            onRowClicked={handleRowClick}
            onRowMouseEnter={handleRowMouseEnter}
            onRowMouseLeave={handleRowMouseLeave}
            onFilterChanged={handleFilterChanged}
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
        savingField={savingField}
        saveStatus={saveStatus}
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
});

ProjectsGrid.displayName = 'ProjectsGrid';

export default ProjectsGrid;
