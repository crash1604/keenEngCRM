import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  Alert,
  CircularProgress,
} from '@mui/material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { architectStore } from '../../stores/architect.store';

const ArchitectForm = ({ open, onClose, architect, editMode, onSuccess, onError }) => {
  const [loading, setLoading] = useState(false);

  const validationSchema = Yup.object({
    name: Yup.string().required('Name is required').max(200, 'Name is too long'),
    contact_email: Yup.string().email('Invalid email').nullable(),
    phone: Yup.string().nullable().max(20, 'Phone number is too long'),
    address: Yup.string().nullable(),
    company_name: Yup.string().nullable().max(200, 'Company name is too long'),
    license_number: Yup.string().nullable().max(100, 'License number is too long'),
    professional_affiliations: Yup.string().nullable(),
    website: Yup.string().url('Invalid URL').nullable(),
    notes: Yup.string().nullable(),
  });

  const formik = useFormik({
    initialValues: {
      name: '',
      contact_email: '',
      phone: '',
      address: '',
      company_name: '',
      license_number: '',
      professional_affiliations: '',
      website: '',
      notes: '',
    },
    validationSchema,
    onSubmit: async (values) => {
      setLoading(true);
      try {
        if (editMode && architect) {
          await architectStore.updateArchitect(architect.id, values);
        } else {
          await architectStore.createArchitect(values);
        }
        onSuccess();
      } catch (error) {
        console.error('Architect form error:', error);
        onError(error.detail || 'Failed to save architect');
      } finally {
        setLoading(false);
      }
    },
  });

  useEffect(() => {
    if (open && architect) {
      formik.setValues({
        name: architect.name || '',
        contact_email: architect.contact_email || '',
        phone: architect.phone || '',
        address: architect.address || '',
        company_name: architect.company_name || '',
        license_number: architect.license_number || '',
        professional_affiliations: architect.professional_affiliations || '',
        website: architect.website || '',
        notes: architect.notes || '',
      });
    } else if (open) {
      formik.resetForm();
    }
  }, [open, architect]);

  const handleClose = () => {
    formik.resetForm();
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>{editMode ? 'Edit Architect' : 'Add New Architect'}</DialogTitle>
      <form onSubmit={formik.handleSubmit}>
        <DialogContent>
          {architectStore.error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {architectStore.error}
            </Alert>
          )}

          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Name *"
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
                label="Email"
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
                label="Phone"
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

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="License Number"
                name="license_number"
                value={formik.values.license_number}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.license_number && Boolean(formik.errors.license_number)}
                helperText={formik.touched.license_number && formik.errors.license_number}
                disabled={loading}
                size="small"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Website"
                name="website"
                value={formik.values.website}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.website && Boolean(formik.errors.website)}
                helperText={formik.touched.website && formik.errors.website}
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
                label="Professional Affiliations"
                name="professional_affiliations"
                multiline
                rows={2}
                value={formik.values.professional_affiliations}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.professional_affiliations && Boolean(formik.errors.professional_affiliations)}
                helperText={formik.touched.professional_affiliations && formik.errors.professional_affiliations}
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
            {loading ? 'Saving...' : editMode ? 'Update Architect' : 'Create Architect'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default ArchitectForm;
