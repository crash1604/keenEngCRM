import React from 'react';
import FormField from './FormField';

const PROJECT_TYPE_OPTIONS = [
  { value: 'M', label: 'Mechanical (M)' },
  { value: 'E', label: 'Electrical (E)' },
  { value: 'P', label: 'Plumbing (P)' },
  { value: 'EM', label: 'Emergency (EM)' },
  { value: 'FP', label: 'Fire Protection (FP)' },
  { value: 'TI', label: 'Tenant Improvement (TI)' },
  { value: 'VI', label: 'Vacant Improvement (VI)' }
];

const STATUS_OPTIONS = [
  { value: 'not_started', label: 'Not Started' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'approved', label: 'Approved' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' }
];

const DetailPanel = ({ 
  selectedProject, 
  formData, 
  editingField, 
  onClose, 
  onEdit, 
  onSave, 
  onCancel, 
  onChange 
}) => {
  if (!selectedProject) return null;

  return (
    <div className="w-2/5 p-4 animate-slide-in">
      <div className="bg-white rounded-lg shadow-lg h-full flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">{selectedProject.project_name}</h2>
            <p className="text-sm text-gray-600 mt-1">{selectedProject.job_number}</p>
            {selectedProject.year && (
              <p className="text-sm text-gray-500">Year: {selectedProject.year}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">

            {/* Items & Actions */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">
                Items & Actions
              </h3>
              <FormField 
                label="Current Open Items" 
                fieldName="current_open_items" 
                value={formData.current_open_items}
                isEditing={editingField === 'current_open_items'}
                type="textarea"
                onEdit={onEdit}
                onSave={onSave}
                onCancel={onCancel}
                onChange={onChange}
              />
              <FormField 
                label="Current Action Items" 
                fieldName="current_action_items" 
                value={formData.current_action_items}
                isEditing={editingField === 'current_action_items'}
                type="textarea"
                onEdit={onEdit}
                onSave={onSave}
                onCancel={onCancel}
                onChange={onChange}
              />
            </div>

            {/* Dates & Scheduling */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">
                Dates & Scheduling
              </h3>
              <FormField 
                label="Due Date" 
                fieldName="due_date" 
                value={formData.due_date}
                isEditing={editingField === 'due_date'}
                type="date"
                onEdit={onEdit}
                onSave={onSave}
                onCancel={onCancel}
                onChange={onChange}
              />
              <FormField 
                label="Due Date Note" 
                fieldName="due_date_note" 
                value={formData.due_date_note}
                isEditing={editingField === 'due_date_note'}
                type="textarea"
                onEdit={onEdit}
                onSave={onSave}
                onCancel={onCancel}
                onChange={onChange}
              />
              <FormField 
                label="Rough In Date" 
                fieldName="rough_in_date" 
                value={formData.rough_in_date}
                isEditing={editingField === 'rough_in_date'}
                type="date"
                onEdit={onEdit}
                onSave={onSave}
                onCancel={onCancel}
                onChange={onChange}
              />
              <FormField 
                label="Rough In Note" 
                fieldName="rough_in_note" 
                value={formData.rough_in_note}
                isEditing={editingField === 'rough_in_note'}
                type="textarea"
                onEdit={onEdit}
                onSave={onSave}
                onCancel={onCancel}
                onChange={onChange}
              />
              <FormField 
                label="Final Inspection Date" 
                fieldName="final_inspection_date" 
                value={formData.final_inspection_date}
                isEditing={editingField === 'final_inspection_date'}
                type="date"
                onEdit={onEdit}
                onSave={onSave}
                onCancel={onCancel}
                onChange={onChange}
              />
              <FormField 
                label="Final Inspection Note" 
                fieldName="final_inspection_note" 
                value={formData.final_inspection_note}
                isEditing={editingField === 'final_inspection_note'}
                type="textarea"
                onEdit={onEdit}
                onSave={onSave}
                onCancel={onCancel}
                onChange={onChange}
              />
            </div>


            {/* Basic Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">
                Basic Information
              </h3>
              <FormField 
                label="Project Name" 
                fieldName="project_name" 
                value={formData.project_name}
                isEditing={editingField === 'project_name'}
                onEdit={onEdit}
                onSave={onSave}
                onCancel={onCancel}
                onChange={onChange}
              />
              <FormField 
                label="Job Number" 
                fieldName="job_number" 
                value={formData.job_number}
                isEditing={editingField === 'job_number'}
                onEdit={onEdit}
                onSave={onSave}
                onCancel={onCancel}
                onChange={onChange}
              />
              <FormField 
                label="Year" 
                fieldName="year" 
                value={formData.year}
                isEditing={editingField === 'year'}
                type="number"
                onEdit={onEdit}
                onSave={onSave}
                onCancel={onCancel}
                onChange={onChange}
              />
              <FormField 
                label="Project Types" 
                fieldName="project_types_list" 
                value={formData.project_types_list}
                isEditing={editingField === 'project_types_list'}
                type="multiselect"
                options={PROJECT_TYPE_OPTIONS}
                onEdit={onEdit}
                onSave={onSave}
                onCancel={onCancel}
                onChange={onChange}
              />
              <FormField 
                label="Status" 
                fieldName="status" 
                value={formData.status}
                isEditing={editingField === 'status'}
                type="select"
                options={STATUS_OPTIONS}
                onEdit={onEdit}
                onSave={onSave}
                onCancel={onCancel}
                onChange={onChange}
              />
              <FormField 
                label="Current Sub Status" 
                fieldName="current_sub_status" 
                value={formData.current_sub_status}
                isEditing={editingField === 'current_sub_status'}
                onEdit={onEdit}
                onSave={onSave}
                onCancel={onCancel}
                onChange={onChange}
              />
            </div>

            {/* Client & Team Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">
                Client & Team
              </h3>
              <FormField 
                label="Client Name" 
                fieldName="client_name" 
                value={formData.client_name}
                isEditing={editingField === 'client_name'}
                onEdit={onEdit}
                onSave={onSave}
                onCancel={onCancel}
                onChange={onChange}
              />
              <FormField 
                label="Architect/Designer" 
                fieldName="architect_designer" 
                value={formData.architect_designer}
                isEditing={editingField === 'architect_designer'}
                onEdit={onEdit}
                onSave={onSave}
                onCancel={onCancel}
                onChange={onChange}
              />
              <FormField 
                label="Manager" 
                fieldName="manager_name" 
                value={formData.manager_name}
                isEditing={editingField === 'manager_name'}
                onEdit={onEdit}
                onSave={onSave}
                onCancel={onCancel}
                onChange={onChange}
              />
            </div>

            
            {/* Location Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">
                Location Information
              </h3>
              <FormField 
                label="Address" 
                fieldName="address" 
                value={formData.address}
                isEditing={editingField === 'address'}
                onEdit={onEdit}
                onSave={onSave}
                onCancel={onCancel}
                onChange={onChange}
              />
              <FormField 
                label="Legal Address" 
                fieldName="legal_address" 
                value={formData.legal_address}
                isEditing={editingField === 'legal_address'}
                onEdit={onEdit}
                onSave={onSave}
                onCancel={onCancel}
                onChange={onChange}
              />
              <FormField 
                label="Billing Information" 
                fieldName="billing_info" 
                value={formData.billing_info}
                isEditing={editingField === 'billing_info'}
                type="textarea"
                onEdit={onEdit}
                onSave={onSave}
                onCancel={onCancel}
                onChange={onChange}
              />
            </div>

            
            {/* System Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">
                System Information
              </h3>
              {selectedProject.created_at && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Created Date</label>
                  <div className="px-3 py-2 bg-gray-50 rounded-md text-gray-900">
                    {new Date(selectedProject.created_at).toLocaleDateString()}
                  </div>
                </div>
              )}
              {selectedProject.updated_at && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Last Updated</label>
                  <div className="px-3 py-2 bg-gray-50 rounded-md text-gray-900">
                    {new Date(selectedProject.updated_at).toLocaleDateString()}
                  </div>
                </div>
              )}
              {selectedProject.last_status_change && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Last Status Change</label>
                  <div className="px-3 py-2 bg-gray-50 rounded-md text-gray-900">
                    {new Date(selectedProject.last_status_change).toLocaleDateString()}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetailPanel;