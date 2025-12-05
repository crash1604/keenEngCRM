import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  FormControlLabel,
  Switch,
  Alert,
  CircularProgress,
} from '@mui/material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { clientStore } from '../../stores/client.store';

const ClientForm = ({ open, onClose, client, editMode, onSuccess, onError }) => {
  const [loading, setLoading] = useState(false);

  const validationSchema = Yup.object({
    name: Yup.string().required('Name is required').max(200, 'Name is too long'),
    contact_email: Yup.string().email('Invalid email').nullable(),
    phone: Yup.string().nullable().max(20, 'Phone number is too long'),
    address: Yup.string().nullable(),
    company_name: Yup.string().nullable().max(200, 'Company name is too long'),
    contact_person: Yup.string().nullable().max(200, 'Contact person name is too long'),
    billing_address: Yup.string().nullable(),
    notes: Yup.string().nullable(),
  });

  const formik = useFormik({
    initialValues: {
      name: '',
      contact_email: '',
      phone: '',
      address: '',
      company_name: '',
      contact_person: '',
      billing_address: '',
      notes: '',
    },
    validationSchema,
    onSubmit: async (values) => {
      setLoading(true);
      try {
        if (editMode && client) {
          await clientStore.updateClient(client.id, values);
        } else {
          await clientStore.createClient(values);
        }
        onSuccess();
      } catch (error) {
        console.error('Client form error:', error);
        onError(error.detail || 'Failed to save client');
      } finally {
        setLoading(false);
      }
    },
  });

  useEffect(() => {
    if (open && client) {
      formik.setValues({
        name: client.name || '',
        contact_email: client.contact_email || '',
        phone: client.phone || '',
        address: client.address || '',
        company_name: client.company_name || '',
        contact_person: client.contact_person || '',
        billing_address: client.billing_address || '',
        notes: client.notes || '',
      });
    } else if (open) {
      formik.resetForm();
    }
  }, [open, client]);

  const handleClose = () => {
    formik.resetForm();
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>{editMode ? 'Edit Client' : 'Add New Client'}</DialogTitle>
      <form onSubmit={formik.handleSubmit}>
        <DialogContent>
          {clientStore.error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {clientStore.error}
            </Alert>
          )}

          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Client Name *"
                name="name"
                value={formik.values.name}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.name && Boolean(formik.errors.name)}
                helperText={formik.touched.name && formik.errors.name}
                disabled={loading}
                size="small"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Company Name"
                name="company_name"
                value={formik.values.company_name}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.company_name && Boolean(formik.errors.company_name)}
                helperText={formik.touched.company_name && formik.errors.company_name}
                disabled={loading}
                size="small"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Contact Email"
                name="contact_email"
                type="email"
                value={formik.values.contact_email}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.contact_email && Boolean(formik.errors.contact_email)}
                helperText={formik.touched.contact_email && formik.errors.contact_email}
                disabled={loading}
                size="small"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Phone Number"
                name="phone"
                value={formik.values.phone}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.phone && Boolean(formik.errors.phone)}
                helperText={formik.touched.phone && formik.errors.phone}
                disabled={loading}
                size="small"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Contact Person"
                name="contact_person"
                value={formik.values.contact_person}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.contact_person && Boolean(formik.errors.contact_person)}
                helperText={formik.touched.contact_person && formik.errors.contact_person}
                disabled={loading}
                size="small"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Address"
                name="address"
                multiline
                rows={2}
                value={formik.values.address}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.address && Boolean(formik.errors.address)}
                helperText={formik.touched.address && formik.errors.address}
                disabled={loading}
                size="small"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Billing Address"
                name="billing_address"
                multiline
                rows={2}
                value={formik.values.billing_address}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.billing_address && Boolean(formik.errors.billing_address)}
                helperText={formik.touched.billing_address && formik.errors.billing_address}
                disabled={loading}
                size="small"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                name="notes"
                multiline
                rows={3}
                value={formik.values.notes}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.notes && Boolean(formik.errors.notes)}
                helperText={formik.touched.notes && formik.errors.notes}
                disabled={loading}
                size="small"
              />
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading || !formik.isValid}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            {loading ? 'Saving...' : editMode ? 'Update Client' : 'Create Client'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default ClientForm;