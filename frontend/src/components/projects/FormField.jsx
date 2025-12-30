import React from 'react';

const FormField = ({
  label,
  fieldName,
  value,
  isEditing,
  saving = false,
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
      <div className="flex items-center gap-2 mb-2">
        {label && <label className="text-sm font-medium text-gray-700 dark:text-gray-200">{label}</label>}
        {!isEditing ? (
          <button
            onClick={() => onEdit(fieldName)}
            className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/50 hover:bg-blue-100 dark:hover:bg-blue-900/70 rounded border border-blue-200 dark:border-blue-700 transition-colors"
            title="Edit"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            Edit
          </button>
        ) : (
          <div className="flex gap-1">
            <button
              onClick={() => onSave(fieldName)}
              disabled={saving}
              className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded border transition-colors ${
                saving
                  ? 'text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-700 border-gray-200 dark:border-gray-600 cursor-not-allowed'
                  : 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/50 hover:bg-green-100 dark:hover:bg-green-900/70 border-green-200 dark:border-green-700'
              }`}
              title="Save"
            >
              {saving ? (
                <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={onCancel}
              disabled={saving}
              className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded border transition-colors ${
                saving
                  ? 'text-gray-300 dark:text-gray-600 bg-gray-50 dark:bg-gray-800 border-gray-100 dark:border-gray-700 cursor-not-allowed'
                  : 'text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 border-gray-200 dark:border-gray-600'
              }`}
              title="Cancel"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Cancel
            </button>
          </div>
        )}
      </div>

      {isEditing ? (
        type === 'textarea' ? (
          <textarea
            value={value || ''}
            onChange={(e) => onChange(fieldName, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            rows={5}
          />
        ) : type === 'select' && options ? (
          <select
            value={value || ''}
            onChange={(e) => onChange(fieldName, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        )
      ) : type === 'textarea' ? (
        <div className="px-3 py-2 bg-gray-50 dark:bg-gray-600 rounded-md text-gray-900 dark:text-gray-100 min-h-[80px] whitespace-pre-wrap break-words">
          {displayValue}
        </div>
      ) : (
        <div className="px-3 py-2 bg-gray-50 dark:bg-gray-600 rounded-md text-gray-900 dark:text-gray-100 min-h-[42px] flex items-center">
          {displayValue}
        </div>
      )}
    </div>
  );
};

export default FormField;