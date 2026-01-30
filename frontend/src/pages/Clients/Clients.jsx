import React, { useState, useEffect, useCallback } from "react";
import { observer } from 'mobx-react-lite';
import { Button, Snackbar, Alert, Chip } from '@mui/material';
import { Add as AddIcon, Refresh as RefreshIcon } from '@mui/icons-material';
import LoadingSpinner from "../../components/common/LoadingSpinner";
import ClientForm from "../../components/clients/ClientForm";
import ClientsGrid from "../../components/clients/ClientsGrid";
import { clientStore } from "../../stores/client.store";
import { useSnackbar } from "../../hooks/useSnackbar";

const Clients = observer(() => {
  const [showForm, setShowForm] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const { snackbar, showSuccess, showError, closeSnackbar } = useSnackbar();

  // Fetch clients on mount
  useEffect(() => {
    const loadClients = async () => {
      try {
        await clientStore.fetchClients(1);
      } catch {
        showError('Failed to load clients');
      }
    };
    loadClients();
  }, [showError]);

  // Handlers
  const handleAddClient = useCallback(() => {
    setSelectedClient(null);
    setEditMode(false);
    setShowForm(true);
  }, []);

  const handleFormSuccess = useCallback(async () => {
    setShowForm(false);
    setSelectedClient(null);
    showSuccess(`Client ${editMode ? 'updated' : 'created'} successfully`);
    await clientStore.fetchClients(clientStore.currentPage);
  }, [editMode, showSuccess]);

  const handleFormError = useCallback((error) => {
    showError(error || 'An error occurred');
  }, [showError]);

  const handleRefresh = useCallback(async () => {
    try {
      await clientStore.fetchClients(clientStore.currentPage);
      showSuccess('Clients refreshed');
    } catch {
      showError('Failed to refresh clients');
    }
  }, [showSuccess, showError]);

  const handleCloseForm = useCallback(() => {
    setShowForm(false);
    setSelectedClient(null);
  }, []);

  if (clientStore.loading && clientStore.clients.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen">
        <LoadingSpinner size="lg" text="Loading clients..." />
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 shrink-0">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Clients
            </h1>
            <div className="flex gap-4 mt-2 items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Total: {clientStore.totalCount} clients
              </span>
              {clientStore.loading && (
                <Chip label="Refreshing..." size="small" color="primary" />
              )}
            </div>
          </div>

          <div className="flex gap-3">
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
          </div>
        </div>
      </div>

      {/* Client Grid with Detail Panel */}
      <div className="flex-1 min-h-0 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 flex flex-col">
        <ClientsGrid
          clients={clientStore.clients}
          loading={clientStore.loading}
        />
      </div>

      {/* Client Form Modal */}
      <ClientForm
        open={showForm}
        onClose={handleCloseForm}
        client={selectedClient}
        editMode={editMode}
        onSuccess={handleFormSuccess}
        onError={handleFormError}
      />

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={closeSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={closeSnackbar}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </div>
  );
});

export default Clients;
