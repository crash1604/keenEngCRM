// src/pages/Clients/Clients.jsx
import React, { useState, useEffect } from "react";
import { observer } from 'mobx-react-lite';
import {
  Button,
  Snackbar,
  Alert,
  Chip
} from '@mui/material';
import { Add as AddIcon, Refresh as RefreshIcon } from '@mui/icons-material';

import LoadingSpinner from "../../components/common/LoadingSpinner";
import ClientForm from "../../components/clients/ClientForm";
import ClientsGrid from "../../components/clients/ClientsGrid";
import { clientStore } from "../../stores/client.store";

const Clients = observer(() => {
  const [showForm, setShowForm] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

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
        onClose={() => {
          setShowForm(false);
          setSelectedClient(null);
        }}
        client={selectedClient}
        editMode={editMode}
        onSuccess={handleFormSuccess}
        onError={handleFormError}
      />

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
    </div>
  );
});

export default Clients;
