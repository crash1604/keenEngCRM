import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  Alert,
  CircularProgress,
} from '@mui/material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { architectStore } from '../../stores/architect.store';

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

const BadgeIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
  </svg>
);

const GlobeIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
  </svg>
);

const AwardIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
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
    <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
      {icon}
    </div>
    <div>
      <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
      {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
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
      <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
        {icon && <span className="text-gray-400">{icon}</span>}
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
              ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-2 focus:ring-red-200'
              : 'border-gray-300 bg-white hover:border-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
            }
            ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}
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
              ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-2 focus:ring-red-200'
              : 'border-gray-300 bg-white hover:border-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
            }
            ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}
            focus:outline-none`}
        />
      )}
      {hasError && (
        <p className="text-xs text-red-600 flex items-center gap-1">
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {errorMessage}
        </p>
      )}
    </div>
  );
};

const ArchitectForm = ({ open, onClose, architect, editMode, onSuccess, onError }) => {
  const [loading, setLoading] = useState(false);

  const validationSchema = Yup.object({
    name: Yup.string().required('Architect name is required').max(200, 'Name is too long'),
    contact_email: Yup.string().email('Please enter a valid email address').nullable(),
    phone: Yup.string().nullable().max(20, 'Phone number is too long'),
    address: Yup.string().nullable(),
    company_name: Yup.string().nullable().max(200, 'Company name is too long'),
    license_number: Yup.string().nullable().max(100, 'License number is too long'),
    professional_affiliations: Yup.string().nullable(),
    website: Yup.string().url('Please enter a valid URL (e.g., https://example.com)').nullable(),
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
        // Clean empty strings to null for optional URL field
        const cleanedValues = {
          ...values,
          website: values.website?.trim() || null,
        };

        if (editMode && architect) {
          await architectStore.updateArchitect(architect.id, cleanedValues);
        } else {
          await architectStore.createArchitect(cleanedValues);
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold">{editMode ? 'Edit Architect' : 'Add New Architect'}</h2>
            <p className="text-blue-100 text-sm mt-0.5">
              {editMode ? 'Update architect information' : 'Fill in the details to add a new architect or designer'}
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
          {architectStore.error && (
            <div className="px-6 pt-4">
              <Alert severity="error" sx={{ borderRadius: '8px' }}>
                {architectStore.error}
              </Alert>
            </div>
          )}

          <div className="p-6 space-y-6">
            {/* Basic Information Section */}
            <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
              <SectionHeader
                icon={<UserIcon />}
                title="Basic Information"
                subtitle="Architect and company details"
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput
                  label="Architect Name"
                  name="name"
                  required
                  placeholder="Enter architect or designer name"
                  formik={formik}
                  disabled={loading}
                />
                <FormInput
                  label="Company / Firm Name"
                  name="company_name"
                  placeholder="Enter company or firm name"
                  formik={formik}
                  disabled={loading}
                />
              </div>
            </div>

            {/* Contact Information Section */}
            <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
              <SectionHeader
                icon={<EmailIcon />}
                title="Contact Information"
                subtitle="How to reach this architect"
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
                label="Website"
                name="website"
                type="url"
                placeholder="https://www.example.com"
                formik={formik}
                disabled={loading}
              />
            </div>

            {/* Professional Details Section */}
            <div className="bg-indigo-50 rounded-xl p-5 border border-indigo-100">
              <SectionHeader
                icon={<BadgeIcon />}
                title="Professional Details"
                subtitle="Licenses and affiliations"
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <FormInput
                  label="License Number"
                  name="license_number"
                  placeholder="Enter license number"
                  formik={formik}
                  disabled={loading}
                />
                <div className="hidden md:block" /> {/* Spacer for grid alignment */}
              </div>
              <FormInput
                label="Professional Affiliations"
                name="professional_affiliations"
                multiline
                rows={2}
                placeholder="AIA, NCARB, or other professional memberships..."
                formik={formik}
                disabled={loading}
              />
            </div>

            {/* Address Section */}
            <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
              <SectionHeader
                icon={<LocationIcon />}
                title="Address Information"
                subtitle="Office or business address"
              />
              <FormInput
                label="Address"
                name="address"
                multiline
                rows={2}
                placeholder="Street address, city, state, zip code"
                formik={formik}
                disabled={loading}
              />
            </div>

            {/* Notes Section */}
            <div className="bg-amber-50 rounded-xl p-5 border border-amber-100">
              <SectionHeader
                icon={<NotesIcon />}
                title="Additional Notes"
                subtitle="Any extra information about this architect"
              />
              <FormInput
                label="Notes"
                name="notes"
                multiline
                rows={3}
                placeholder="Add any relevant notes about this architect..."
                formik={formik}
                disabled={loading}
              />
            </div>
          </div>
        </DialogContent>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
          <p className="text-xs text-gray-500">
            <span className="text-red-500">*</span> Required field
          </p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all disabled:opacity-50"
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
                  <span>{editMode ? 'Update Architect' : 'Create Architect'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </Dialog>
  );
};

export default ArchitectForm;
