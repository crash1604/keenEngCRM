import React, { useEffect, useMemo, useCallback, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { AgGridReact } from 'ag-grid-react';
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
import {
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Typography,
  Paper,
} from '@mui/material';
import { Refresh as RefreshIcon } from '@mui/icons-material';

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
    },
    {
      field: 'recipient_email',
      headerName: 'Recipient',
      width: 250,
    },
    {
      field: 'recipient_name',
      headerName: 'Recipient Name',
      width: 200,
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      cellRenderer: StatusRenderer,
    },
    {
      field: 'sent_by_name',
      headerName: 'Sent By',
      width: 180,
    },
    {
      field: 'sent_at',
      headerName: 'Sent At',
      width: 180,
      valueFormatter: (params) => {
        if (!params.value) return '';
        return new Date(params.value).toLocaleString();
      },
    },
    {
      field: 'project_name',
      headerName: 'Project',
      width: 200,
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
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-5">
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            Email History
          </h3>
          <div className="flex gap-4 mt-1 items-center">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {communicationStore.totalCount} email{communicationStore.totalCount !== 1 ? 's' : ''} sent
            </span>
            {communicationStore.loading && (
              <Chip label="Refreshing..." size="small" color="primary" sx={{ height: 22, fontSize: '0.7rem' }} />
            )}
          </div>
        </div>

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
      </div>

      {/* AG Grid */}
      <div
        className="ag-theme-quartz dark:ag-theme-quartz-dark border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
        style={{ height: 550, width: '100%' }}
      >
        <AgGridReact
          rowData={communicationStore.emailLogs}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
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
            <div className="flex flex-col justify-center items-center h-32 text-gray-500 dark:text-gray-400">
              <p className="text-lg font-medium">No emails found</p>
              <p className="text-sm">Start sending emails to see them here</p>
            </div>
          )}
        />
      </div>

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
    </div>
  );
});

export default EmailHistory;
