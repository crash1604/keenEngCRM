import React, { useMemo, useState, useCallback } from 'react';
import { observer } from 'mobx-react-lite';
import { AgGridReact } from 'ag-grid-react';
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community';

import ClientDetailPanel from './ClientDetailPanel';
import LoadingSpinner from '../common/LoadingSpinner';
import { clientStore } from '../../stores/client.store';
import { useClientColumnDefs } from '../../hooks/useClientColumnDefs';
import {
  clientNameRenderer,
  clientStatusRenderer
} from './CellRenderers';

// Register all community modules
ModuleRegistry.registerModules([AllCommunityModule]);

const ClientsGrid = observer(({ clients, loading }) => {
  const [selectedClient, setSelectedClient] = useState(null);
  const [editingField, setEditingField] = useState(null);
  const [formData, setFormData] = useState({});
  const [savingField, setSavingField] = useState(null);
  const [saveStatus, setSaveStatus] = useState({ show: false, success: false, message: '' });

  // Get column definitions from hook
  const columnDefs = useClientColumnDefs();

  // Custom cell renderers
  const components = useMemo(() => ({
    clientNameRenderer,
    clientStatusRenderer
  }), []);

  const defaultColDef = useMemo(() => ({
    sortable: true,
    filter: true,
    resizable: true,
    floatingFilter: true,
    suppressMovable: true,
  }), []);

  const handleRowClick = useCallback((event) => {
    setSelectedClient(event.data);
    setFormData(event.data);
    setEditingField(null);
  }, []);

  const handleEdit = useCallback((fieldName) => {
    setEditingField(fieldName);
  }, []);

  const handleSave = useCallback(async (fieldName) => {
    if (!selectedClient) return;

    setSavingField(fieldName);

    try {
      const result = await clientStore.updateClientField(selectedClient.id, fieldName, formData[fieldName]);

      if (result.success) {
        setSelectedClient(prev => ({
          ...prev,
          [fieldName]: formData[fieldName],
          ...result.data
        }));
        setEditingField(null);
        setSaveStatus({ show: true, success: true, message: 'Saved' });
      } else {
        console.error('Failed to update field:', result.error);
        setFormData(prev => ({ ...prev, [fieldName]: selectedClient[fieldName] }));
        setSaveStatus({ show: true, success: false, message: result.error || 'Failed to save' });
      }
    } catch (error) {
      console.error('Error saving field:', error);
      setFormData(prev => ({ ...prev, [fieldName]: selectedClient[fieldName] }));
      setSaveStatus({ show: true, success: false, message: 'Failed to save' });
    } finally {
      setSavingField(null);
      // Auto-hide status after 2 seconds
      setTimeout(() => setSaveStatus({ show: false, success: false, message: '' }), 2000);
    }
  }, [selectedClient, formData]);

  const handleCancel = useCallback(() => {
    setFormData(selectedClient);
    setEditingField(null);
  }, [selectedClient]);

  const handleChange = useCallback((fieldName, value) => {
    setFormData(prev => ({ ...prev, [fieldName]: value }));
  }, []);

  const handleClose = useCallback(() => {
    setSelectedClient(null);
    setEditingField(null);
  }, []);

  const onGridReady = useCallback((params) => {
    params.api.sizeColumnsToFit();
  }, []);

  if (loading && clients.length === 0) {
    return <LoadingSpinner message="Loading clients..." />;
  }

  return (
    <div className="flex bg-gray-100 dark:bg-gray-900" style={{ minHeight: 600 }}>
      {/* AG Grid */}
      <div className={`${selectedClient ? 'w-1/3' : 'w-full'} transition-all duration-300`}>
        <div className="ag-theme-quartz dark:ag-theme-quartz-dark" style={{ height: 600, width: '100%' }}>
          <AgGridReact
            rowData={clients}
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
            onGridReady={onGridReady}
            rowHeight={45}
            headerHeight={44}
            floatingFiltersHeight={36}
            loadingOverlayComponent={() => (
              <div className="flex justify-center items-center h-32">
                <div className="text-gray-600 dark:text-gray-400">Loading clients...</div>
              </div>
            )}
            noRowsOverlayComponent={() => (
              <div className="flex flex-col justify-center items-center h-32 text-gray-500 dark:text-gray-400">
                <div className="text-lg font-medium">No clients found</div>
                <div className="text-sm">Click "Add Client" to create your first client</div>
              </div>
            )}
          />
        </div>
      </div>

      {/* Detail Panel */}
      <ClientDetailPanel
        selectedClient={selectedClient}
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

export default ClientsGrid;
