// src/components/projects/ProjectsGrid.jsx
import React, { useMemo, useState } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ModuleRegistry, AllCommunityModule, themeQuartz } from 'ag-grid-community';

// Register all community modules
ModuleRegistry.registerModules([AllCommunityModule]);

const ProjectsGrid = ({ projects, loading, onStatusChange }) => {
  const [hoveredRow, setHoveredRow] = useState(null);
  const [modalPosition, setModalPosition] = useState({ x: 0, y: 0 });

  // Row Hover Modal Component
  const RowHoverModal = () => {
    if (!hoveredRow) return null;

    return (
      <div 
        className="fixed z-50 bg-white border border-gray-300 rounded-lg shadow-xl p-6 max-w-md"
        style={{
          left: modalPosition.x + 20,
          top: modalPosition.y - 100,
          maxHeight: '400px',
          overflowY: 'auto'
        }}
      >
        {/* Header */}
        <div className="border-b border-gray-200 pb-3 mb-4">
          <h3 className="text-lg font-semibold text-gray-800">{hoveredRow.project_name}</h3>
          <p className="text-sm text-gray-600">Job #: {hoveredRow.job_number}</p>
          <p className="text-xs text-gray-500">{hoveredRow.address}</p>
        </div>

        {/* Open Items Section */}
        <div className="mb-6">
          <div className="flex items-center mb-3">
            <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
            <h4 className="font-semibold text-gray-800 text-sm">Open Items</h4>
          </div>
          {hoveredRow.current_open_items ? (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {hoveredRow.current_open_items}
              </p>
            </div>
          ) : (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <p className="text-sm text-gray-500 text-center">No open items</p>
            </div>
          )}
        </div>

        {/* Action Items Section */}
        <div className="mb-4">
          <div className="flex items-center mb-3">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
            <h4 className="font-semibold text-gray-800 text-sm">Action Items</h4>
          </div>
          {hoveredRow.current_action_items ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {hoveredRow.current_action_items}
              </p>
            </div>
          ) : (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <p className="text-sm text-gray-500 text-center">No action items</p>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="border-t border-gray-200 pt-4 mt-4">
          <div className="flex space-x-2">
            <button
              onClick={() => {
                console.log('Quick view:', hoveredRow.id);
                setHoveredRow(null);
              }}
              className="flex-1 bg-blue-500 text-white text-xs py-2 px-3 rounded hover:bg-blue-600 transition-colors"
            >
              Quick View
            </button>
            <button
              onClick={() => setHoveredRow(null)}
              className="flex-1 bg-gray-500 text-white text-xs py-2 px-3 rounded hover:bg-gray-600 transition-colors"
            >
              Close
            </button>
          </div>
        </div>

        {/* Modal arrow */}
        <div 
          className="absolute w-4 h-4 bg-white border-l border-t border-gray-300 transform rotate-45 -left-2 top-1/2"
          style={{ marginTop: '-8px' }}
        />
      </div>
    );
  };

  // Custom cell renderer for project name with info indicator
  const ProjectNameRenderer = (params) => {
    const hasItems = params.data.current_open_items || params.data.current_action_items;

    return (
      <div className="flex flex-col">
        <div className="flex items-center space-x-2">
          <span className="font-medium text-blue-600">
            {params.value}
          </span>
          {hasItems && (
            <span className="text-xs bg-blue-500 text-white px-1 rounded-full flex items-center justify-center w-4 h-4">
              <svg className="w-2 h-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </span>
          )}
        </div>
        {params.data.address && (
          <span className="text-xs text-gray-500 truncate">
            {params.data.address}
          </span>
        )}
      </div>
    );
  };

  // Column Definitions
  const [columnDefs] = useState([
    {
      field: 'job_number',
      headerName: 'Job #',
      width: 120,
      filter: 'agTextColumnFilter',
      pinned: 'left'
    },
    {
      field: 'project_name', 
      headerName: 'Project Name',
      width: 250,
      filter: 'agTextColumnFilter',
      cellRenderer: ProjectNameRenderer
    },
    {
      field: 'client_name',
      headerName: 'Client',
      width: 180,
      filter: 'agTextColumnFilter'
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 140,
      filter: 'agSetColumnFilter',
      cellRenderer: (params) => {
        const statusColors = {
          not_started: 'bg-gray-100 text-gray-800',
          in_progress: 'bg-blue-100 text-blue-800',
          submitted: 'bg-yellow-100 text-yellow-800',
          approved: 'bg-green-100 text-green-800',
          completed: 'bg-green-100 text-green-800',
          cancelled: 'bg-red-100 text-red-800'
        };
        
        const statusLabels = {
          not_started: 'Not Started',
          in_progress: 'In Progress', 
          submitted: 'Submitted',
          approved: 'Approved',
          completed: 'Completed',
          cancelled: 'Cancelled'
        };
        
        return (
          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusColors[params.value] || 'bg-gray-100'}`}>
            {statusLabels[params.value] || params.value}
          </span>
        );
      }
    },
    {
      field: 'manager_name',
      headerName: 'Manager',
      width: 150,
      filter: 'agTextColumnFilter'
    },
    {
      field: 'due_date',
      headerName: 'Due Date',
      width: 120,
      filter: 'agDateColumnFilter',
      valueFormatter: (params) => {
        if (!params.value) return '';
        return new Date(params.value).toLocaleDateString();
      },
      cellStyle: (params) => {
        if (!params.value) return null;
        const dueDate = new Date(params.value);
        const today = new Date();
        const daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
        
        if (daysUntilDue < 0) {
          return { backgroundColor: '#fef2f2', color: '#dc2626' };
        } else if (daysUntilDue <= 7) {
          return { backgroundColor: '#fffbeb', color: '#d97706' };
        }
        return null;
      }
    },
    {
      field: 'project_types_list',
      headerName: 'Project Types',
      width: 150,
      filter: 'agSetColumnFilter',
      valueFormatter: (params) => {
        if (!params.value) return '';
        return params.value.join(', ');
      }
    },
    {
      field: 'days_until_due',
      headerName: 'Days Left',
      width: 100,
      filter: 'agNumberColumnFilter',
      cellStyle: (params) => {
        if (params.value < 0) {
          return { backgroundColor: '#fef2f2', color: '#dc2626', fontWeight: 'bold' };
        } else if (params.value <= 7) {
          return { backgroundColor: '#fffbeb', color: '#d97706', fontWeight: 'bold' };
        }
        return null;
      }
    },
    {
      field: 'created_at',
      headerName: 'Created',
      width: 120,
      filter: 'agDateColumnFilter',
      valueFormatter: (params) => {
        if (!params.value) return '';
        return new Date(params.value).toLocaleDateString();
      }
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 180,
      pinned: 'right',
      filter: false,
      sortable: false,
      cellRenderer: (params) => {
        const statusOptions = [
          { value: 'not_started', label: 'Not Started' },
          { value: 'in_progress', label: 'In Progress' },
          { value: 'submitted', label: 'Submitted' },
          { value: 'approved', label: 'Approved' },
          { value: 'completed', label: 'Completed' },
          { value: 'cancelled', label: 'Cancelled' }
        ];
        
        return (
          <div className="flex space-x-2">
            <select
              value={params.data.status}
              onChange={(e) => onStatusChange(params.data.id, e.target.value)}
              className="text-xs border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <button
              onClick={() => console.log('View project:', params.data.id)}
              className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
            >
              View
            </button>
          </div>
        );
      }
    }
  ]);

  // Default Column Definitions
  const defaultColDef = useMemo(() => ({
    sortable: true,
    filter: true,
    resizable: true,
    floatingFilter: true,
    suppressMovable: true,
  }), []);

  // Custom theme
  const customTheme = useMemo(() => {
    return themeQuartz.withParams({});
  }, []);

  // Handle row hover events
  const handleRowHover = (event) => {
    if (event.node && event.data) {
      setHoveredRow(event.data);
      
      // Position modal near the hovered row
      const rowElement = event.api.getRowNode(event.rowIndex)?.rowElement;
      if (rowElement) {
        const rect = rowElement.getBoundingClientRect();
        setModalPosition({
          x: rect.right,
          y: rect.top + (rect.height / 2)
        });
      }
    }
  };

  const handleRowHoverLeave = () => {
    setHoveredRow(null);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg text-gray-600">Loading projects...</div>
      </div>
    );
  }

  return (
    <>
      {/* Row Hover Modal */}
      <RowHoverModal />
      
      <div className="w-full border border-gray-200 rounded-lg overflow-hidden" style={{ height: '600px' }}>
        <AgGridReact
          rowData={projects}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          theme={customTheme}
          animateRows={true}
          pagination={true}
          paginationPageSize={20}
          domLayout="autoHeight"
          rowSelection="multiple"
          suppressRowClickSelection={true}
          enableCellTextSelection={true}
          ensureDomOrder={true}
          // Row hover events
          onRowMouseOver={handleRowHover}
          onRowMouseOut={handleRowHoverLeave}
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
          onGridReady={(params) => {
            params.api.sizeColumnsToFit();
          }}
          onFirstDataRendered={(params) => {
            params.api.sizeColumnsToFit();
          }}
        />
      </div>
    </>
  );
};

export default ProjectsGrid;