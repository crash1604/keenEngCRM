import React, { useState, useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import {
  Tabs,
  Tab,
  Snackbar,
  Alert,
} from '@mui/material';
import { communicationStore } from '../../stores/communication.store';
import { emailSyncStore } from '../../stores/emailSync.store';
import EmailTemplates from '../../components/communication/EmailTemplates';
import EmailComposer from '../../components/communication/EmailComposer';
import EmailHistory from '../../components/communication/EmailHistory';
import EmailAccountSetup from '../../components/communication/EmailAccountSetup';
import SyncInbox from '../../components/communication/SyncInbox';
import ThreadView from '../../components/communication/ThreadView';

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`communication-tabpanel-${index}`}
      aria-labelledby={`communication-tab-${index}`}
      {...other}
    >
      {value === index && <div className="p-4 sm:p-6">{children}</div>}
    </div>
  );
}

const Communication = observer(() => {
  const [activeTab, setActiveTab] = useState(0);
  const [selectedThread, setSelectedThread] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  useEffect(() => {
    // Clean up on unmount
    return () => {
      communicationStore.clearAll();
      emailSyncStore.clearAll();
    };
  }, []);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    communicationStore.clearError();
    emailSyncStore.clearError();
    setSelectedThread(null);
  };

  const handleShowSnackbar = (message, severity = 'success') => {
    setSnackbar({
      open: true,
      message,
      severity,
    });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleEmailSent = () => {
    handleShowSnackbar('Email sent successfully!', 'success');
    // Switch to history tab to see the sent email
    setActiveTab(0);
    communicationStore.fetchEmailLogs();
  };

  const handleSelectThread = (thread) => {
    setSelectedThread(thread);
  };

  const handleBackToInbox = () => {
    setSelectedThread(null);
    emailSyncStore.clearCurrentThread();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Communication Center
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Manage email templates, send emails to clients, sync and track all project communications
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
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
            <Tab label="Email History" id="communication-tab-0" />
            <Tab label="Compose Email" id="communication-tab-1" />
            <Tab label="Email Templates" id="communication-tab-2" />
            <Tab label="Synced Inbox" id="communication-tab-3" />
            <Tab label="Email Accounts" id="communication-tab-4" />
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

export default Communication;
