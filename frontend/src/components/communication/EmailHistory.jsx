import React, { useEffect, useMemo, useCallback, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { AgGridReact } from 'ag-grid-react';
import { ModuleRegistry, AllCommunityModule, themeQuartz } from 'ag-grid-community';
import {
  Box,
  Typography,
  Paper,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
} from '@mui/material';
import { Refresh as RefreshIcon } from '@mui/icons-material';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';

import { communicationStore } from '../../stores/communication.store';
import LoadingSpinner from '../common/LoadingSpinner';

ModuleRegistry.registerModules([AllCommunityModule]);

// Cell renderers
const StatusRenderer = (props) => {
  const { value } = props;
  const statusColors = {
    sent: 'primary',
    delivered: 'success',
    failed: 'error',
    pending: 'warning',
  };

  return (
    <Chip
      label={value?.toUpperCase() || 'UNKNOWN'}
      size="small"
      color={statusColors[value] || 'default'}
    />
  );
};

const ActionsRenderer = (props) => {
  const { data, onViewDetails } = props;

  return (
    <Button
      size="small"
      variant="outlined"
      onClick={() => onViewDetails(data)}
    >
      View
    </Button>
  );
};

const EmailHistory = observer(({ onShowSnackbar }) => {
  const [selectedLog, setSelectedLog] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    loadEmailLogs();
  }, []);

  const loadEmailLogs = async () => {
    try {
      await communicationStore.fetchEmailLogs(1);
    } catch (error) {
      onShowSnackbar('Failed to load email history', 'error');
    }
  };

  const handleRefresh = async () => {
    try {
      await communicationStore.fetchEmailLogs(communicationStore.currentPage);
      onShowSnackbar('Email history refreshed', 'success');
    } catch (error) {
      onShowSnackbar('Failed to refresh email history', 'error');
    }
  };

  const handleViewDetails = useCallback((log) => {
    setSelectedLog(log);
    setShowDetails(true);
  }, []);

  const handleCloseDetails = () => {
    setShowDetails(false);
    setSelectedLog(null);
  };

  const columnDefs = useMemo(() => [
    {
      field: 'subject',
      headerName: 'Subject',
      width: 300,
      filter: 'agTextColumnFilter',
    },
    {
      field: 'recipient_email',
      headerName: 'Recipient',
      width: 250,
      filter: 'agTextColumnFilter',
    },
    {
      field: 'recipient_name',
      headerName: 'Recipient Name',
      width: 200,
      filter: 'agTextColumnFilter',
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      cellRenderer: StatusRenderer,
      filter: 'agSetColumnFilter',
      filterParams: {
        values: ['sent', 'delivered', 'failed', 'pending'],
      },
    },
    {
      field: 'sent_by_name',
      headerName: 'Sent By',
      width: 180,
      filter: 'agTextColumnFilter',
    },
    {
      field: 'sent_at',
      headerName: 'Sent At',
      width: 180,
      valueFormatter: (params) => {
        if (!params.value) return '';
        return new Date(params.value).toLocaleString();
      },
      filter: 'agDateColumnFilter',
    },
    {
      field: 'project_name',
      headerName: 'Project',
      width: 200,
      filter: 'agTextColumnFilter',
    },
    {
      headerName: 'Actions',
      width: 120,
      cellRenderer: ActionsRenderer,
      cellRendererParams: { onViewDetails: handleViewDetails },
      sortable: false,
      filter: false,
      suppressMovable: true,
    },
  ], [handleViewDetails]);

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

  const paginationPageSizeSelector = useMemo(() => [10, 20, 50, 100], []);

  const onGridReady = useCallback((params) => {
    params.api.sizeColumnsToFit();
  }, []);

  if (communicationStore.loading && communicationStore.emailLogs.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" text="Loading email history..." />
      </div>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2.5}>
        <Box>
          <Typography variant="h6" fontWeight="bold" color="text.primary">
            Email History
          </Typography>
          <Box display="flex" gap={2} mt={0.5} alignItems="center">
            <Typography variant="body2" color="text.secondary">
              {communicationStore.totalCount} email{communicationStore.totalCount !== 1 ? 's' : ''} sent
            </Typography>
            {communicationStore.loading && (
              <Chip label="Refreshing..." size="small" color="primary" sx={{ height: 22, fontSize: '0.7rem' }} />
            )}
          </Box>
        </Box>

        <Button
          variant="outlined"
          size="small"
          startIcon={<RefreshIcon />}
          onClick={handleRefresh}
          disabled={communicationStore.loading}
          sx={{ textTransform: 'none', fontWeight: 600 }}
        >
          Refresh
        </Button>
      </Box>

      {/* AG Grid */}
      <Box
        sx={{
          height: 550,
          width: '100%',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 1.5,
          overflow: 'hidden',
        }}
        className="ag-theme-quartz"
      >
        <AgGridReact
          rowData={communicationStore.emailLogs}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          theme={customTheme}
          animateRows={true}
          pagination={true}
          paginationPageSize={communicationStore.pageSize}
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
              <LoadingSpinner size="md" text="Loading emails..." />
            </div>
          )}
          noRowsOverlayComponent={() => (
            <div className="flex flex-col justify-center items-center h-32 text-gray-500">
              <Typography variant="h6">No emails found</Typography>
              <Typography variant="body2">Start sending emails to see them here</Typography>
            </div>
          )}
        />
      </Box>

      {/* Email Details Dialog */}
      <Dialog
        open={showDetails}
        onClose={handleCloseDetails}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6" fontWeight="bold">
            Email Details
          </Typography>
        </DialogTitle>
        <DialogContent dividers>
          {selectedLog && (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary">
                  Subject
                </Typography>
                <Typography variant="body1">{selectedLog.subject}</Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Recipient Email
                </Typography>
                <Typography variant="body1">{selectedLog.recipient_email}</Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Recipient Name
                </Typography>
                <Typography variant="body1">{selectedLog.recipient_name || 'N/A'}</Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Status
                </Typography>
                <Chip
                  label={selectedLog.status?.toUpperCase()}
                  size="small"
                  color={
                    selectedLog.status === 'sent' || selectedLog.status === 'delivered'
                      ? 'success'
                      : selectedLog.status === 'failed'
                      ? 'error'
                      : 'warning'
                  }
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Sent By
                </Typography>
                <Typography variant="body1">{selectedLog.sent_by_name || 'N/A'}</Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Sent At
                </Typography>
                <Typography variant="body1">
                  {selectedLog.sent_at ? new Date(selectedLog.sent_at).toLocaleString() : 'N/A'}
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Project
                </Typography>
                <Typography variant="body1">{selectedLog.project_name || 'N/A'}</Typography>
              </Grid>

              {selectedLog.cc_emails && selectedLog.cc_emails.length > 0 && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">
                    CC
                  </Typography>
                  <Typography variant="body1">{selectedLog.cc_emails.join(', ')}</Typography>
                </Grid>
              )}

              {selectedLog.bcc_emails && selectedLog.bcc_emails.length > 0 && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">
                    BCC
                  </Typography>
                  <Typography variant="body1">{selectedLog.bcc_emails.join(', ')}</Typography>
                </Grid>
              )}

              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Email Body
                </Typography>
                <Paper
                  variant="outlined"
                  sx={{ p: 2, maxHeight: 300, overflow: 'auto', bgcolor: '#f9fafb' }}
                >
                  {selectedLog.body_html ? (
                    <div dangerouslySetInnerHTML={{ __html: selectedLog.body_html }} />
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No content available
                    </Typography>
                  )}
                </Paper>
              </Grid>

              {selectedLog.error_message && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="error">
                    Error Message
                  </Typography>
                  <Typography variant="body2" color="error">
                    {selectedLog.error_message}
                  </Typography>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDetails} variant="contained">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
});

export default EmailHistory;
