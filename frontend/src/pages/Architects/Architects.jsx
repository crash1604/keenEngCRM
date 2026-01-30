import React, { useState, useEffect, useCallback } from "react";
import { observer } from 'mobx-react-lite';
import { Button, Snackbar, Alert, Chip } from '@mui/material';
import { Add as AddIcon, Refresh as RefreshIcon } from '@mui/icons-material';
import LoadingSpinner from "../../components/common/LoadingSpinner";
import ArchitectForm from "../../components/architects/ArchitectForm";
import ArchitectsGrid from "../../components/architects/ArchitectsGrid";
import { architectStore } from "../../stores/architect.store";
import { useSnackbar } from "../../hooks/useSnackbar";

const Architects = observer(() => {
  const [showForm, setShowForm] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedArchitect, setSelectedArchitect] = useState(null);
  const { snackbar, showSuccess, showError, closeSnackbar } = useSnackbar();

  // Fetch architects on mount
  useEffect(() => {
    const loadArchitects = async () => {
      try {
        await architectStore.fetchArchitects(1);
      } catch {
        showError('Failed to load architects');
      }
    };
    loadArchitects();
  }, [showError]);

  // Handlers
  const handleAddArchitect = useCallback(() => {
    setSelectedArchitect(null);
    setEditMode(false);
    setShowForm(true);
  }, []);

  const handleFormSuccess = useCallback(async () => {
    setShowForm(false);
    setSelectedArchitect(null);
    showSuccess(`Architect ${editMode ? 'updated' : 'created'} successfully`);
    await architectStore.fetchArchitects(architectStore.currentPage);
  }, [editMode, showSuccess]);

  const handleFormError = useCallback((error) => {
    showError(error || 'An error occurred');
  }, [showError]);

  const handleRefresh = useCallback(async () => {
    try {
      await architectStore.fetchArchitects(architectStore.currentPage);
      showSuccess('Architects refreshed');
    } catch {
      showError('Failed to refresh architects');
    }
  }, [showSuccess, showError]);

  const handleCloseForm = useCallback(() => {
    setShowForm(false);
    setSelectedArchitect(null);
  }, []);

  if (architectStore.loading && architectStore.architects.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen">
        <LoadingSpinner size="lg" text="Loading architects..." />
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
              Architects / Designers
            </h1>
            <div className="flex gap-4 mt-2 items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Total: {architectStore.totalCount} architects
              </span>
              {architectStore.loading && (
                <Chip label="Refreshing..." size="small" color="primary" />
              )}
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={handleRefresh}
              disabled={architectStore.loading}
            >
              Refresh
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAddArchitect}
              sx={{
                bgcolor: '#2563eb',
                '&:hover': { bgcolor: '#1d4ed8' }
              }}
            >
              Add Architect
            </Button>
          </div>
        </div>
      </div>

      {/* Architects Grid with Detail Panel */}
      <div className="flex-1 min-h-0 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 flex flex-col">
        <ArchitectsGrid
          architects={architectStore.architects}
          loading={architectStore.loading}
        />
      </div>

      {/* Architect Form Modal */}
      <ArchitectForm
        open={showForm}
        onClose={handleCloseForm}
        architect={selectedArchitect}
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

export default Architects;
