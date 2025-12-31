import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  Button,
  TextField,
  Alert,
  CircularProgress,
  Checkbox,
  FormControlLabel,
  IconButton,
} from '@mui/material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { clientStore } from '../../stores/client.store';

// Icons as SVG components
const UserIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const BuildingIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
);

const EmailIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const PhoneIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
  </svg>
);

const LocationIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const CreditCardIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
  </svg>
);

const NotesIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const CloseIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

// Section Header Component
const SectionHeader = ({ icon, title, subtitle }) => (
  <div className="flex items-center gap-3 mb-4">
    <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
      {icon}
    </div>
    <div>
      <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">{title}</h3>
      {subtitle && <p className="text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>}
    </div>
  </div>
);

// Custom Input Component
const FormInput = ({
  label,
  name,
  type = 'text',
  multiline = false,
  rows = 1,
  required = false,
  placeholder,
  formik,
  disabled,
  icon
}) => {
  const hasError = formik.touched[name] && Boolean(formik.errors[name]);
  const errorMessage = formik.touched[name] && formik.errors[name];

  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-200">
        {icon && <span className="text-gray-400 dark:text-gray-500">{icon}</span>}
        {label}
        {required && <span className="text-red-500">*</span>}
      </label>
      {multiline ? (
        <textarea
          name={name}
          value={formik.values[name]}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          disabled={disabled}
          placeholder={placeholder}
          rows={rows}
          className={`w-full px-3 py-2.5 text-sm border rounded-lg transition-all duration-200 resize-none
            ${hasError
              ? 'border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/30 focus:border-red-500 focus:ring-2 focus:ring-red-200 dark:focus:ring-red-800'
              : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 hover:border-gray-400 dark:hover:border-gray-500 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800'
            }
            ${disabled ? 'bg-gray-100 dark:bg-gray-800 cursor-not-allowed' : ''}
            text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500
            focus:outline-none`}
        />
      ) : (
        <input
          type={type}
          name={name}
          value={formik.values[name]}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          disabled={disabled}
          placeholder={placeholder}
          className={`w-full px-3 py-2.5 text-sm border rounded-lg transition-all duration-200
            ${hasError
              ? 'border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/30 focus:border-red-500 focus:ring-2 focus:ring-red-200 dark:focus:ring-red-800'
              : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 hover:border-gray-400 dark:hover:border-gray-500 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800'
            }
            ${disabled ? 'bg-gray-100 dark:bg-gray-800 cursor-not-allowed' : ''}
            text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500
            focus:outline-none`}
        />
      )}
      {hasError && (
        <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {errorMessage}
        </p>
      )}
    </div>
  );
};

const ClientForm = ({ open, onClose, client, editMode, onSuccess, onError }) => {
  const [loading, setLoading] = useState(false);
  const [copyAddress, setCopyAddress] = useState(false);

  const validationSchema = Yup.object({
    name: Yup.string().required('Client name is required').max(200, 'Name is too long'),
    contact_email: Yup.string().email('Please enter a valid email address').nullable(),
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
      setCopyAddress(false);
    } else if (open) {
      formik.resetForm();
      setCopyAddress(false);
    }
  }, [open, client]);

  // Handle copy address checkbox
  useEffect(() => {
    if (copyAddress && formik.values.address) {
      formik.setFieldValue('billing_address', formik.values.address);
    }
  }, [copyAddress, formik.values.address]);

  const handleClose = () => {
    formik.resetForm();
    setCopyAddress(false);
    onClose();
  };

  // Calculate form completion percentage
  const filledFields = Object.values(formik.values).filter(v => v && v.trim()).length;
  const totalFields = Object.keys(formik.values).length;
  const completionPercent = Math.round((filledFields / totalFields) * 100);

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '16px',
          overflow: 'hidden',
          '.dark &': {
            backgroundColor: 'rgb(31 41 55)',
          }
        }
      }}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-5 text-white relative">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-white/20 transition-colors"
        >
          <CloseIcon />
        </button>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold">{editMode ? 'Edit Client' : 'Add New Client'}</h2>
            <p className="text-blue-100 text-sm mt-0.5">
              {editMode ? 'Update client information' : 'Fill in the details to create a new client'}
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-blue-100 mb-1.5">
            <span>Form completion</span>
            <span>{completionPercent}%</span>
          </div>
          <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-all duration-300"
              style={{ width: `${completionPercent}%` }}
            />
          </div>
        </div>
      </div>

      <form onSubmit={formik.handleSubmit} className="flex flex-col max-h-[calc(100vh-200px)]">
        <DialogContent sx={{ p: 0, overflow: 'auto', flex: 1 }}>
          {clientStore.error && (
            <div className="px-6 pt-4">
              <Alert severity="error" sx={{ borderRadius: '8px' }}>
                {clientStore.error}
              </Alert>
            </div>
          )}

          <div className="p-6 space-y-6">
            {/* Basic Information Section */}
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-5 border border-gray-100 dark:border-gray-600">
              <SectionHeader
                icon={<UserIcon />}
                title="Basic Information"
                subtitle="Client and company details"
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput
                  label="Client Name"
                  name="name"
                  required
                  placeholder="Enter client name"
                  formik={formik}
                  disabled={loading}
                />
                <FormInput
                  label="Company Name"
                  name="company_name"
                  placeholder="Enter company name"
                  formik={formik}
                  disabled={loading}
                />
              </div>
            </div>

            {/* Contact Information Section */}
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-5 border border-gray-100 dark:border-gray-600">
              <SectionHeader
                icon={<EmailIcon />}
                title="Contact Information"
                subtitle="How to reach this client"
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <FormInput
                  label="Email Address"
                  name="contact_email"
                  type="email"
                  placeholder="email@example.com"
                  formik={formik}
                  disabled={loading}
                />
                <FormInput
                  label="Phone Number"
                  name="phone"
                  placeholder="(555) 123-4567"
                  formik={formik}
                  disabled={loading}
                />
              </div>
              <FormInput
                label="Contact Person"
                name="contact_person"
                placeholder="Primary contact name"
                formik={formik}
                disabled={loading}
              />
            </div>

            {/* Address Section */}
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-5 border border-gray-100 dark:border-gray-600">
              <SectionHeader
                icon={<LocationIcon />}
                title="Address Information"
                subtitle="Physical and billing addresses"
              />
              <div className="space-y-4">
                <FormInput
                  label="Address"
                  name="address"
                  multiline
                  rows={2}
                  placeholder="Street address, city, state, zip code"
                  formik={formik}
                  disabled={loading}
                />

                <div className="flex items-center">
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={copyAddress}
                        onChange={(e) => setCopyAddress(e.target.checked)}
                        size="small"
                        sx={{
                          color: '#9ca3af',
                          '&.Mui-checked': {
                            color: '#3b82f6',
                          },
                        }}
                      />
                    }
                    label={
                      <span className="text-sm text-gray-600 dark:text-gray-300">
                        Billing address same as address
                      </span>
                    }
                  />
                </div>

                <FormInput
                  label="Billing Address"
                  name="billing_address"
                  multiline
                  rows={2}
                  placeholder="Billing street address, city, state, zip code"
                  formik={formik}
                  disabled={loading || copyAddress}
                />
              </div>
            </div>

            {/* Notes Section */}
            <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-5 border border-amber-100 dark:border-amber-800">
              <SectionHeader
                icon={<NotesIcon />}
                title="Additional Notes"
                subtitle="Any extra information about this client"
              />
              <FormInput
                label="Notes"
                name="notes"
                multiline
                rows={3}
                placeholder="Add any relevant notes about this client..."
                formik={formik}
                disabled={loading}
              />
            </div>
          </div>
        </DialogContent>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            <span className="text-red-500">*</span> Required field
          </p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 hover:border-gray-400 dark:hover:border-gray-500 transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !formik.isValid || !formik.dirty}
              className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm"
            >
              {loading ? (
                <>
                  <CircularProgress size={16} sx={{ color: 'white' }} />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>{editMode ? 'Update Client' : 'Create Client'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </Dialog>
  );
};

export default ClientForm;
