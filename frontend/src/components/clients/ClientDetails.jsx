import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  Typography,
  Chip,
  Divider,
  Box,
  Paper,
  IconButton,
} from '@mui/material';
import {
  Person as PersonIcon,
  Business as BusinessIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  CalendarToday as CalendarIcon,
  Notes as NotesIcon,
  Close as CloseIcon,
  CheckCircle as ActiveIcon,
  Cancel as InactiveIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { clientStore } from '../../stores/client.store';

const ClientDetails = ({ open, onClose, clientId }) => {
  const client = clientStore.clients.find(c => c.id === clientId);

  if (!client) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>Client Not Found</DialogTitle>
        <DialogContent>
          <Typography>The requested client could not be found.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Close</Button>
        </DialogActions>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">Client Details</Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={3}>
          {/* Header with status */}
          <Grid item xs={12}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Box display="flex" alignItems="center" gap={2}>
                <PersonIcon color="primary" fontSize="large" />
                <Box>
                  <Typography variant="h5" fontWeight="bold">
                    {client.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    ID: {client.id}
                  </Typography>
                </Box>
              </Box>
              <Chip
                label={client.is_active ? 'Active' : 'Inactive'}
                color={client.is_active ? 'success' : 'error'}
                icon={client.is_active ? <ActiveIcon /> : <InactiveIcon />}
              />
            </Box>
            <Divider />
          </Grid>

          {/* Contact Information */}
          <Grid item xs={12} md={6}>
            <Paper elevation={0} sx={{ p: 2, border: '1px solid #e0e0e0' }}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Contact Information
              </Typography>
              <Box display="flex" flexDirection="column" gap={1}>
                {client.contact_person && (
                  <Box display="flex" alignItems="center" gap={1}>
                    <PersonIcon fontSize="small" color="action" />
                    <Typography variant="body2">
                      <strong>Contact:</strong> {client.contact_person}
                    </Typography>
                  </Box>
                )}
                {client.contact_email && (
                  <Box display="flex" alignItems="center" gap={1}>
                    <EmailIcon fontSize="small" color="action" />
                    <Typography variant="body2">
                      <strong>Email:</strong> {client.contact_email}
                    </Typography>
                  </Box>
                )}
                {client.phone && (
                  <Box display="flex" alignItems="center" gap={1}>
                    <PhoneIcon fontSize="small" color="action" />
                    <Typography variant="body2">
                      <strong>Phone:</strong> {client.phone}
                    </Typography>
                  </Box>
                )}
              </Box>
            </Paper>
          </Grid>

          {/* Company Information */}
          <Grid item xs={12} md={6}>
            <Paper elevation={0} sx={{ p: 2, border: '1px solid #e0e0e0' }}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Company Information
              </Typography>
              <Box display="flex" flexDirection="column" gap={1}>
                {client.company_name && (
                  <Box display="flex" alignItems="center" gap={1}>
                    <BusinessIcon fontSize="small" color="action" />
                    <Typography variant="body2">
                      <strong>Company:</strong> {client.company_name}
                    </Typography>
                  </Box>
                )}
                {client.address && (
                  <Box display="flex" alignItems="center" gap={1}>
                    <LocationIcon fontSize="small" color="action" />
                    <Typography variant="body2">
                      <strong>Address:</strong> {client.address}
                    </Typography>
                  </Box>
                )}
                {client.billing_address && client.billing_address !== client.address && (
                  <Box display="flex" alignItems="flex-start" gap={1}>
                    <LocationIcon fontSize="small" color="action" />
                    <Typography variant="body2">
                      <strong>Billing Address:</strong> {client.billing_address}
                    </Typography>
                  </Box>
                )}
              </Box>
            </Paper>
          </Grid>

          {/* Dates */}
          <Grid item xs={12} md={6}>
            <Paper elevation={0} sx={{ p: 2, border: '1px solid #e0e0e0' }}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Dates
              </Typography>
              <Box display="flex" flexDirection="column" gap={1}>
                {client.created_at && (
                  <Box display="flex" alignItems="center" gap={1}>
                    <CalendarIcon fontSize="small" color="action" />
                    <Typography variant="body2">
                      <strong>Created:</strong> {format(new Date(client.created_at), 'MMM dd, yyyy')}
                    </Typography>
                  </Box>
                )}
                {client.updated_at && (
                  <Box display="flex" alignItems="center" gap={1}>
                    <CalendarIcon fontSize="small" color="action" />
                    <Typography variant="body2">
                      <strong>Last Updated:</strong> {format(new Date(client.updated_at), 'MMM dd, yyyy')}
                    </Typography>
                  </Box>
                )}
              </Box>
            </Paper>
          </Grid>

          {/* Account Status */}
          <Grid item xs={12} md={6}>
            <Paper elevation={0} sx={{ p: 2, border: '1px solid #e0e0e0' }}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Account Status
              </Typography>
              <Box display="flex" flexDirection="column" gap={1}>
                <Typography variant="body2">
                  <strong>Has User Account:</strong>{' '}
                  <Chip
                    label={client.is_user ? 'Yes' : 'No'}
                    size="small"
                    color={client.is_user ? 'success' : 'default'}
                  />
                </Typography>
              </Box>
            </Paper>
          </Grid>

          {/* Notes */}
          {client.notes && (
            <Grid item xs={12}>
              <Paper elevation={0} sx={{ p: 2, border: '1px solid #e0e0e0' }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  <Box display="flex" alignItems="center" gap={1}>
                    <NotesIcon fontSize="small" />
                    Notes
                  </Box>
                </Typography>
                <Typography variant="body2" style={{ whiteSpace: 'pre-wrap' }}>
                  {client.notes}
                </Typography>
              </Paper>
            </Grid>
          )}
        </Grid>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} variant="outlined">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ClientDetails;