import React from 'react';

const FormField = ({ 
  label, 
  fieldName, 
  value, 
  isEditing, 
  type = 'text', 
  options = null,
  onEdit, 
  onSave, 
  onCancel, 
  onChange 
}) => {
  const formatDisplayValue = () => {
    if (type === 'date' && value) {
      return new Date(value).toLocaleDateString();
    } else if (type === 'multiselect' && Array.isArray(value)) {
      return value.join(', ');
    } else if (Array.isArray(value)) {
      return value.join(', ');
    } else if (type === 'number' && value) {
      return value.toString();
    }
    return value || '-';
  };

  const displayValue = formatDisplayValue();

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <label className="block text-sm font-medium text-gray-700">{label}</label>
        <div className="flex gap-2">
          {!isEditing ? (
            <button
              onClick={() => onEdit(fieldName)}
              className="text-blue-600 hover:text-blue-800"
              title="Edit"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
          ) : (
            <>
              <button
                onClick={() => onSave(fieldName)}
                className="text-green-600 hover:text-green-800"
                title="Save"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </button>
              <button
                onClick={onCancel}
                className="text-red-600 hover:text-red-800"
                title="Cancel"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </>
          )}
        </div>
      </div>
      
      {isEditing ? (
        type === 'textarea' ? (
          <textarea
            value={value || ''}
            onChange={(e) => onChange(fieldName, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
          />
        ) : type === 'select' && options ? (
          <select
            value={value || ''}
            onChange={(e) => onChange(fieldName, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select...</option>
            {options.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        ) : type === 'multiselect' && options ? (
          <select
            multiple
            value={value || []}
            onChange={(e) => {
              const selected = Array.from(e.target.selectedOptions, option => option.value);
              onChange(fieldName, selected);
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {options.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        ) : (
          <input
            type={type}
            value={value || ''}
            onChange={(e) => onChange(fieldName, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        )
      ) : (
        <div className="px-3 py-2 bg-gray-50 rounded-md text-gray-900 min-h-[42px] flex items-center">
          {displayValue}
        </div>
      )}
    </div>
  );
};

export default FormField;