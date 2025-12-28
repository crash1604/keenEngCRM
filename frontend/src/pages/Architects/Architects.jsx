// src/pages/Architects/Architects.jsx
import React, { useState, useEffect } from "react";
import { observer } from 'mobx-react-lite';
import {
  Button,
  Box,
  Typography,
  Snackbar,
  Alert,
  Paper,
  Chip
} from '@mui/material';
import { Add as AddIcon, Refresh as RefreshIcon } from '@mui/icons-material';

import LoadingSpinner from "../../components/common/LoadingSpinner";
import ArchitectForm from "../../components/architects/ArchitectForm";
import ArchitectsGrid from "../../components/architects/ArchitectsGrid";
import { architectStore } from "../../stores/architect.store";

const Architects = observer(() => {
  const [showForm, setShowForm] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedArchitect, setSelectedArchitect] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Fetch architects on mount
  useEffect(() => {
    const loadArchitects = async () => {
      try {
        await architectStore.fetchArchitects(1);
      } catch (error) {
        setSnackbar({
          open: true,
          message: 'Failed to load architects',
          severity: 'error'
        });
      }
    };
    loadArchitects();
  }, []);

  // Handlers
  const handleAddArchitect = () => {
    setSelectedArchitect(null);
    setEditMode(false);
    setShowForm(true);
  };

  const handleFormSuccess = async () => {
    setShowForm(false);
    setSelectedArchitect(null);
    setSnackbar({
      open: true,
      message: `Architect ${editMode ? 'updated' : 'created'} successfully`,
      severity: 'success'
    });
    await architectStore.fetchArchitects(architectStore.currentPage);
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
      await architectStore.fetchArchitects(architectStore.currentPage);
      setSnackbar({
        open: true,
        message: 'Architects refreshed',
        severity: 'success'
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Failed to refresh architects',
        severity: 'error'
      });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  if (architectStore.loading && architectStore.architects.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen">
        <LoadingSpinner size="lg" text="Loading architects..." />
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
              Architects / Designers
            </Typography>
            <Box display="flex" gap={2} mt={1} alignItems="center">
              <Typography variant="body2" color="text.secondary">
                Total: {architectStore.totalCount} architects
              </Typography>
              {architectStore.loading && (
                <Chip label="Refreshing..." size="small" color="primary" />
              )}
            </Box>
          </Box>

          <Box display="flex" gap={2}>
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
                bgcolor: '#6366f1',
                '&:hover': { bgcolor: '#4f46e5' }
              }}
            >
              Add Architect
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Architects Grid with Detail Panel */}
      <Paper elevation={0} sx={{ flex: 1, p: 2, borderRadius: 2, overflow: 'hidden' }}>
        <ArchitectsGrid
          architects={architectStore.architects}
          loading={architectStore.loading}
        />
      </Paper>

      {/* Architect Form Modal */}
      <ArchitectForm
        open={showForm}
        onClose={() => {
          setShowForm(false);
          setSelectedArchitect(null);
        }}
        architect={selectedArchitect}
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
    </Box>
  );
});

export default Architects;
