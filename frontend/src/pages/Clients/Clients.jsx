// src/pages/Clients/Clients.jsx
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { observer } from 'mobx-react-lite';
import { AgGridReact } from 'ag-grid-react';
import { ModuleRegistry, AllCommunityModule, themeQuartz } from 'ag-grid-community';
import {
  Button,
  Box,
  Typography,
  Snackbar,
  Alert,
  Paper,
  IconButton,
  Chip
} from '@mui/material';
import { Add as AddIcon, Refresh as RefreshIcon } from '@mui/icons-material';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';

import LoadingSpinner from "../../components/common/LoadingSpinner";
import ClientForm from "../../components/clients/ClientForm";
import ClientDetails from "../../components/clients/ClientDetails";
import { clientStore } from "../../stores/client.store";
import { useClientColumnDefs } from "../../hooks/useClientColumnDefs";
import {
  clientNameRenderer,
  clientStatusRenderer,
  clientActionsRenderer
} from "../../components/clients/CellRenderers";

// Register all AG Grid community modules
ModuleRegistry.registerModules([AllCommunityModule]);

const Clients = observer(() => {
  const [showForm, setShowForm] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Fetch clients on mount
  useEffect(() => {
    const loadClients = async () => {
      try {
        await clientStore.fetchClients(1);
      } catch (error) {
        setSnackbar({
          open: true,
          message: 'Failed to load clients',
          severity: 'error'
        });
      }
    };
    loadClients();
  }, []);

  // Handlers
  const handleAddClient = () => {
    setSelectedClient(null);
    setEditMode(false);
    setShowForm(true);
  };

  const handleEditClient = useCallback((client) => {
    setSelectedClient(client);
    setEditMode(true);
    setShowForm(true);
  }, []);

  const handleViewDetails = useCallback((client) => {
    setSelectedClient(client);
    setShowDetails(true);
  }, []);

  const handleDeleteClient = useCallback(async (client) => {
    if (window.confirm(`Are you sure you want to delete client "${client.name}"?`)) {
      try {
        await clientStore.deleteClient(client.id);
        setSnackbar({
          open: true,
          message: 'Client deleted successfully',
          severity: 'success'
        });
      } catch (error) {
        setSnackbar({
          open: true,
          message: error.detail || 'Failed to delete client',
          severity: 'error'
        });
      }
    }
  }, []);

  const handleFormSuccess = async () => {
    setShowForm(false);
    setSelectedClient(null);
    setSnackbar({
      open: true,
      message: `Client ${editMode ? 'updated' : 'created'} successfully`,
      severity: 'success'
    });
    await clientStore.fetchClients(clientStore.currentPage);
  };

  const handleFormError = (error) => {
    setSnackbar({
      open: true,
      message: error || 'An error occurred',
      severity: 'error'
    });
  };

  const handleRefresh = async () => {
    try {
      await clientStore.fetchClients(clientStore.currentPage);
      setSnackbar({
        open: true,
        message: 'Clients refreshed',
        severity: 'success'
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Failed to refresh clients',
        severity: 'error'
      });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // AG Grid configuration
  const columnDefs = useClientColumnDefs(handleEditClient, handleDeleteClient, handleViewDetails);

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

  const frameworkComponents = useMemo(() => ({
    clientNameRenderer,
    clientStatusRenderer,
    clientActionsRenderer
  }), []);

  const paginationPageSizeSelector = useMemo(() => [10, 20, 50, 100], []);

  const onGridReady = useCallback((params) => {
    params.api.sizeColumnsToFit();
  }, []);

  if (clientStore.loading && clientStore.clients.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen">
        <LoadingSpinner size="lg" text="Loading clients..." />
      </div>
    );
  }

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', bgcolor: '#f9fafb' }}>
      {/* Header */}
      <Paper elevation={0} sx={{ p: 3, mb: 2, borderRadius: 2 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h4" fontWeight="bold" color="text.primary">
              Clients
            </Typography>
            <Box display="flex" gap={2} mt={1} alignItems="center">
              <Typography variant="body2" color="text.secondary">
                Total: {clientStore.totalCount} clients
              </Typography>
              {clientStore.loading && (
                <Chip label="Refreshing..." size="small" color="primary" />
              )}
            </Box>
          </Box>

          <Box display="flex" gap={2}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={handleRefresh}
              disabled={clientStore.loading}
            >
              Refresh
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAddClient}
              sx={{
                bgcolor: '#2563eb',
                '&:hover': { bgcolor: '#1d4ed8' }
              }}
            >
              Add Client
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* AG Grid */}
      <Paper elevation={0} sx={{ flex: 1, p: 2, borderRadius: 2, overflow: 'hidden' }}>
        <Box sx={{ height: '100%', width: '100%' }} className="ag-theme-quartz">
          <AgGridReact
            rowData={clientStore.clients}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            frameworkComponents={frameworkComponents}
            theme={customTheme}
            animateRows={true}
            pagination={true}
            paginationPageSize={clientStore.pageSize}
            paginationPageSizeSelector={paginationPageSizeSelector}
            rowSelection="single"
            suppressRowClickSelection={true}
            enableCellTextSelection={true}
            onGridReady={onGridReady}
            rowHeight={45}
            headerHeight={44}
            floatingFiltersHeight={36}
            loadingOverlayComponent={() => (
              <div className="flex justify-center items-center h-32">
                <LoadingSpinner size="md" text="Loading clients..." />
              </div>
            )}
            noRowsOverlayComponent={() => (
              <div className="flex flex-col justify-center items-center h-32 text-gray-500">
                <Typography variant="h6">No clients found</Typography>
                <Typography variant="body2">Click "Add Client" to create your first client</Typography>
              </div>
            )}
          />
        </Box>
      </Paper>

      {/* Client Form Modal */}
      <ClientForm
        open={showForm}
        onClose={() => {
          setShowForm(false);
          setSelectedClient(null);
        }}
        client={selectedClient}
        editMode={editMode}
        onSuccess={handleFormSuccess}
        onError={handleFormError}
      />

      {/* Client Details Modal */}
      {showDetails && selectedClient && (
        <ClientDetails
          open={showDetails}
          onClose={() => {
            setShowDetails(false);
            setSelectedClient(null);
          }}
          clientId={selectedClient.id}
        />
      )}

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
});

export default Clients;
