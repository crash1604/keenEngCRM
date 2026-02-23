import React, { useState, useEffect, useCallback } from 'react';
import { observer } from 'mobx-react-lite';
import { Tabs, Tab, Snackbar, Alert } from '@mui/material';
import { communicationStore } from '../../stores/communication.store';
import { emailSyncStore } from '../../stores/emailSync.store';
import EmailTemplates from '../../components/communication/EmailTemplates';
import EmailComposer from '../../components/communication/EmailComposer';
import EmailHistory from '../../components/communication/EmailHistory';
import { useSnackbar } from '../../hooks/useSnackbar';
import EmailAccountSetup from '../../components/communication/EmailAccountSetup';
import SyncInbox from '../../components/communication/SyncInbox';
import ThreadView from '../../components/communication/ThreadView';

const TabPanel = ({ children, value, index }) => {
  if (value !== index) return null;

  return (
    <div
      role="tabpanel"
      id={`communication-tabpanel-${index}`}
      aria-labelledby={`communication-tab-${index}`}
      className="flex-1 min-h-0 flex flex-col"
    >
      <div className="p-4 sm:p-6 flex-1 min-h-0 overflow-auto">{children}</div>
    </div>
  );
};

const Communication = observer(() => {
  const [activeTab, setActiveTab] = useState(0);
  const { snackbar, showSuccess, showError, closeSnackbar } = useSnackbar();
  const [selectedThread, setSelectedThread] = useState(null);

  useEffect(() => {
    return () => {
      communicationStore.clearAll();
      emailSyncStore.clearAll();
    };
  }, []);

  const handleTabChange = useCallback((event, newValue) => {
    setActiveTab(newValue);
    communicationStore.clearError();
    emailSyncStore.clearError();
    setSelectedThread(null);
  }, []);

  const handleShowSnackbar = useCallback((message, severity = 'success') => {
    if (severity === 'success') {
      showSuccess(message);
    } else {
      showError(message);
    }
  }, [showSuccess, showError]);

  const handleEmailSent = useCallback(() => {
    showSuccess('Email sent successfully!');
    setActiveTab(0);
    communicationStore.fetchEmailLogs();
  }, [showSuccess]);

  const handleSelectThread = (thread) => {
    setSelectedThread(thread);
  };

  const handleBackToInbox = () => {
    setSelectedThread(null);
    emailSyncStore.clearCurrentThread();
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 shrink-0">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Communication Center
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Manage email templates, send emails to clients, sync and track all project communications
        </p>
      </div>

      <div className="flex-1 min-h-0 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col">
        <div className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 shrink-0">
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            aria-label="communication tabs"
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.9rem',
                py: 1.5,
                color: 'rgb(107, 114, 128)',
              },
              '& .Mui-selected': {
                color: '#2563eb !important',
              },
              '& .MuiTabs-indicator': {
                backgroundColor: '#2563eb',
                height: 3,
              },
            }}
          >
            <Tab label="Email History" id="communication-tab-0" aria-controls="communication-tabpanel-0" />
            <Tab label="Compose Email" id="communication-tab-1" aria-controls="communication-tabpanel-1" />
            <Tab label="Email Templates" id="communication-tab-2" aria-controls="communication-tabpanel-2" />
            <Tab label="Synced Inbox" id="communication-tab-3" aria-controls="communication-tabpanel-3" />
            <Tab label="Email Accounts" id="communication-tab-4" aria-controls="communication-tabpanel-4" />
          </Tabs>
        </div>

        <TabPanel value={activeTab} index={0}>
          <EmailHistory onShowSnackbar={handleShowSnackbar} />
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          <EmailComposer
            onEmailSent={handleEmailSent}
            onShowSnackbar={handleShowSnackbar}
          />
        </TabPanel>

        <TabPanel value={activeTab} index={2}>
          <EmailTemplates onShowSnackbar={handleShowSnackbar} />
        </TabPanel>

        <TabPanel value={activeTab} index={3}>
          {selectedThread ? (
            <ThreadView
              thread={selectedThread}
              onBack={handleBackToInbox}
              onShowSnackbar={handleShowSnackbar}
            />
          ) : (
            <SyncInbox
              onSelectThread={handleSelectThread}
              onShowSnackbar={handleShowSnackbar}
            />
          )}
        </TabPanel>

        <TabPanel value={activeTab} index={4}>
          <EmailAccountSetup onShowSnackbar={handleShowSnackbar} />
        </TabPanel>
      </div>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
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

export default Communication;
