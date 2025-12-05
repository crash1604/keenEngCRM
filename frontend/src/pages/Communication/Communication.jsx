import React, { useState, useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import {
  Box,
  Container,
  Paper,
  Tabs,
  Tab,
  Typography,
  Snackbar,
  Alert,
} from '@mui/material';
import { communicationStore } from '../../stores/communication.store';
import EmailTemplates from '../../components/communication/EmailTemplates';
import EmailComposer from '../../components/communication/EmailComposer';
import EmailHistory from '../../components/communication/EmailHistory';

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`communication-tabpanel-${index}`}
      aria-labelledby={`communication-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const Communication = observer(() => {
  console.log('Communication component rendering');
  const [activeTab, setActiveTab] = useState(0);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  useEffect(() => {
    // Disabled for now - will be handled by child components
    // Fetch initial data based on active tab
    // const loadData = async () => {
    //   try {
    //     if (activeTab === 0) {
    //       // Email History tab
    //       await communicationStore.fetchEmailLogs();
    //       await communicationStore.fetchEmailStatistics();
    //     } else if (activeTab === 2) {
    //       // Templates tab
    //       await communicationStore.fetchTemplates();
    //     }
    //   } catch (error) {
    //     console.error('Error loading communication data:', error);
    //     handleShowSnackbar('Failed to load data', 'error');
    //   }
    // };
    // loadData();
  }, [activeTab]);

  useEffect(() => {
    // Clean up on unmount
    return () => {
      communicationStore.clearAll();
    };
  }, []);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    communicationStore.clearError();
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

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Communication Center
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage email templates, send emails to clients, and view communication history
        </Typography>
      </Box>

      <Paper elevation={3}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            aria-label="communication tabs"
            variant="fullWidth"
          >
            <Tab label="Email History" id="communication-tab-0" />
            <Tab label="Compose Email" id="communication-tab-1" />
            <Tab label="Email Templates" id="communication-tab-2" />
          </Tabs>
        </Box>

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
      </Paper>

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
    </Container>
  );
});

export default Communication;
