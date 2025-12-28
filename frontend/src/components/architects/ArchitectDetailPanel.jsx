import React, { useRef, useState, useEffect } from 'react';
import FormField from '../projects/FormField';

// Tab configuration for architects
const TABS = [
  { id: 'basic-info', label: 'Basic Info', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
  { id: 'contact', label: 'Contact', icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
  { id: 'professional', label: 'Professional', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
  { id: 'notes', label: 'Notes', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
  { id: 'system-info', label: 'System', icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
];

// Section Header Component
const SectionHeader = ({ icon, title, subtitle }) => (
  <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-200">
    <div className="p-2 bg-gray-100 rounded-lg">
      {icon}
    </div>
    <div>
      <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wide">{title}</h3>
      {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
    </div>
  </div>
);

// Info Card for read-only display
const InfoCard = ({ label, value, icon }) => (
  <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
    <div className="flex items-center gap-2 mb-1">
      {icon && <span className="text-gray-400">{icon}</span>}
      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</span>
    </div>
    <div className="text-sm font-medium text-gray-900">{value || '—'}</div>
  </div>
);

const ArchitectDetailPanel = ({
  selectedArchitect,
  formData,
  editingField,
  savingField,
  saveStatus,
  onClose,
  onEdit,
  onSave,
  onCancel,
  onChange
}) => {
  const scrollContainerRef = useRef(null);
  const [activeTab, setActiveTab] = useState('basic-info');

  // Scroll to section when tab is clicked
  const scrollToSection = (sectionId) => {
    const section = document.getElementById(`architect-${sectionId}`);
    const container = scrollContainerRef.current;
    if (section && container) {
      const containerTop = container.getBoundingClientRect().top;
      const sectionTop = section.getBoundingClientRect().top;
      const offset = sectionTop - containerTop + container.scrollTop - 12;
      container.scrollTo({ top: offset, behavior: 'smooth' });
      setActiveTab(sectionId);
    }
  };

  // Update active tab based on scroll position
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || !selectedArchitect) return;

    const handleScroll = () => {
      const containerTop = container.getBoundingClientRect().top;
      let currentSection = 'basic-info';

      TABS.forEach(tab => {
        const section = document.getElementById(`architect-${tab.id}`);
        if (section) {
          const sectionTop = section.getBoundingClientRect().top - containerTop;
          if (sectionTop <= 50) {
            currentSection = tab.id;
          }
        }
      });

      setActiveTab(currentSection);
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [selectedArchitect]);

  if (!selectedArchitect) return null;

  return (
    <div className="w-2/3 p-4 animate-slide-in">
      <div className="bg-white rounded-xl shadow-lg h-full flex flex-col overflow-hidden border border-gray-200 relative">

        {/* Save Status Toast */}
        {saveStatus?.show && (
          <div className={`absolute top-4 right-16 z-10 px-3 py-2 rounded-lg text-sm font-medium shadow-lg transition-all ${
            saveStatus.success
              ? 'bg-green-100 text-green-700 border border-green-200'
              : 'bg-red-100 text-red-700 border border-red-200'
          }`}>
            {saveStatus.success ? (
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {saveStatus.message}
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                {saveStatus.message}
              </span>
            )}
          </div>
        )}

        {/* Header */}
        <div className="bg-gradient-to-r from-gray-50 to-white p-6 border-b border-gray-200">
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{formData.name}</h2>
                  {formData.company_name && (
                    <p className="text-sm text-gray-500">{formData.company_name}</p>
                  )}
                </div>
                <span className={`ml-2 px-3 py-1 text-xs font-semibold rounded-full border ${
                  formData.is_active !== false
                    ? 'bg-green-100 text-green-700 border-green-300'
                    : 'bg-gray-100 text-gray-700 border-gray-300'
                }`}>
                  {formData.is_active !== false ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Quick Info Bar */}
          <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-200">
            <InfoCard
              label="Email"
              value={formData.contact_email}
              icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>}
            />
            <InfoCard
              label="Phone"
              value={formData.phone}
              icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>}
            />
            <InfoCard
              label="License #"
              value={formData.license_number}
              icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>}
            />
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white border-b border-gray-200 px-4 py-2 flex gap-1 overflow-x-auto sticky top-0 z-10">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => scrollToSection(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-indigo-100 text-indigo-700 shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
              </svg>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Scrollable Content */}
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* Basic Information Section */}
          <section id="architect-basic-info" className="bg-indigo-50 rounded-xl p-5 border border-indigo-200 scroll-mt-4">
            <SectionHeader
              icon={<svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>}
              title="Basic Information"
              subtitle="Architect and company details"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white rounded-lg p-4 border border-indigo-100">
                <FormField
                  label="Name"
                  fieldName="name"
                  value={formData.name}
                  isEditing={editingField === 'name'}
                  saving={savingField === 'name'}
                  onEdit={onEdit}
                  onSave={onSave}
                  onCancel={onCancel}
                  onChange={onChange}
                />
              </div>
              <div className="bg-white rounded-lg p-4 border border-indigo-100">
                <FormField
                  label="Company Name"
                  fieldName="company_name"
                  value={formData.company_name}
                  isEditing={editingField === 'company_name'}
                  saving={savingField === 'company_name'}
                  onEdit={onEdit}
                  onSave={onSave}
                  onCancel={onCancel}
                  onChange={onChange}
                />
              </div>
            </div>
          </section>

          {/* Contact Section */}
          <section id="architect-contact" className="bg-white rounded-xl p-5 border border-gray-200 scroll-mt-4">
            <SectionHeader
              icon={<svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>}
              title="Contact Information"
              subtitle="Email, phone, and address"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="Email"
                fieldName="contact_email"
                value={formData.contact_email}
                isEditing={editingField === 'contact_email'}
                saving={savingField === 'contact_email'}
                onEdit={onEdit}
                onSave={onSave}
                onCancel={onCancel}
                onChange={onChange}
              />
              <FormField
                label="Phone"
                fieldName="phone"
                value={formData.phone}
                isEditing={editingField === 'phone'}
                saving={savingField === 'phone'}
                onEdit={onEdit}
                onSave={onSave}
                onCancel={onCancel}
                onChange={onChange}
              />
              <FormField
                label="Website"
                fieldName="website"
                value={formData.website}
                isEditing={editingField === 'website'}
                saving={savingField === 'website'}
                onEdit={onEdit}
                onSave={onSave}
                onCancel={onCancel}
                onChange={onChange}
              />
              <div className="md:col-span-2">
                <FormField
                  label="Address"
                  fieldName="address"
                  value={formData.address}
                  isEditing={editingField === 'address'}
                  saving={savingField === 'address'}
                  type="textarea"
                  onEdit={onEdit}
                  onSave={onSave}
                  onCancel={onCancel}
                  onChange={onChange}
                />
              </div>
            </div>
          </section>

          {/* Professional Section */}
          <section id="architect-professional" className="bg-white rounded-xl p-5 border border-gray-200 scroll-mt-4">
            <SectionHeader
              icon={<svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>}
              title="Professional Information"
              subtitle="License and affiliations"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="License Number"
                fieldName="license_number"
                value={formData.license_number}
                isEditing={editingField === 'license_number'}
                saving={savingField === 'license_number'}
                onEdit={onEdit}
                onSave={onSave}
                onCancel={onCancel}
                onChange={onChange}
              />
              <div className="md:col-span-2">
                <FormField
                  label="Professional Affiliations"
                  fieldName="professional_affiliations"
                  value={formData.professional_affiliations}
                  isEditing={editingField === 'professional_affiliations'}
                  saving={savingField === 'professional_affiliations'}
                  type="textarea"
                  onEdit={onEdit}
                  onSave={onSave}
                  onCancel={onCancel}
                  onChange={onChange}
                />
              </div>
            </div>
          </section>

          {/* Notes Section */}
          <section id="architect-notes" className="bg-amber-50 rounded-xl p-5 border border-amber-200 scroll-mt-4">
            <SectionHeader
              icon={<svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
              title="Notes"
              subtitle="Additional information and comments"
            />
            <div className="bg-white rounded-lg p-4 border border-amber-100">
              <FormField
                label="Notes"
                fieldName="notes"
                value={formData.notes}
                isEditing={editingField === 'notes'}
                saving={savingField === 'notes'}
                type="textarea"
                onEdit={onEdit}
                onSave={onSave}
                onCancel={onCancel}
                onChange={onChange}
              />
            </div>
          </section>

          {/* System Info Section */}
          <section id="architect-system-info" className="bg-gray-50 rounded-xl p-5 border border-gray-200 scroll-mt-4">
            <SectionHeader
              icon={<svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
              title="System Information"
              subtitle="Account and record details"
            />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <InfoCard
                label="Architect ID"
                value={selectedArchitect.id}
              />
              <InfoCard
                label="Has User Account"
                value={selectedArchitect.is_user ? 'Yes' : 'No'}
              />
              <InfoCard
                label="Status"
                value={selectedArchitect.is_active !== false ? 'Active' : 'Inactive'}
              />
              {selectedArchitect.created_at && (
                <InfoCard
                  label="Created"
                  value={new Date(selectedArchitect.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                />
              )}
              {selectedArchitect.updated_at && (
                <InfoCard
                  label="Last Updated"
                  value={new Date(selectedArchitect.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                />
              )}
            </div>
          </section>

        </div>
      </div>
    </div>
  );
};

export default ArchitectDetailPanel;
