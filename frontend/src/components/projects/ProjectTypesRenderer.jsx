import React from 'react';

// Project type configuration with colors
const PROJECT_TYPE_CONFIG = {
  M: {
    label: 'Mechanical',
    shortLabel: 'M',
    bgColor: '#dbeafe',
    textColor: '#1d4ed8',
    borderColor: '#93c5fd',
  },
  E: {
    label: 'Electrical',
    shortLabel: 'E',
    bgColor: '#fef3c7',
    textColor: '#b45309',
    borderColor: '#fcd34d',
  },
  P: {
    label: 'Plumbing',
    shortLabel: 'P',
    bgColor: '#d1fae5',
    textColor: '#047857',
    borderColor: '#6ee7b7',
  },
  FP: {
    label: 'Fire Protection',
    shortLabel: 'FP',
    bgColor: '#fee2e2',
    textColor: '#b91c1c',
    borderColor: '#fca5a5',
  },
  EM: {
    label: 'Energy Model',
    shortLabel: 'EM',
    bgColor: '#e0e7ff',
    textColor: '#4338ca',
    borderColor: '#a5b4fc',
  },
  VI: {
    label: 'Virtual Inspection',
    shortLabel: 'VI',
    bgColor: '#f3e8ff',
    textColor: '#7c3aed',
    borderColor: '#c4b5fd',
  },
  TI: {
    label: 'Title 24',
    shortLabel: 'TI',
    bgColor: '#fce7f3',
    textColor: '#be185d',
    borderColor: '#f9a8d4',
  },
};

const ProjectTypesRenderer = (props) => {
  const { value, data } = props;

  // Handle both project_type (string) and project_types_list (array)
  let types = [];

  if (Array.isArray(value)) {
    types = value;
  } else if (typeof value === 'string' && value) {
    // Split comma-separated values
    types = value.split(',').map(t => t.trim());
  } else if (data?.project_type) {
    types = data.project_type.split(',').map(t => t.trim());
  }

  if (types.length === 0) {
    return <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>-</span>;
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', height: '100%', gap: '4px', flexWrap: 'wrap' }}>
      {types.map((type, index) => {
        const config = PROJECT_TYPE_CONFIG[type] || {
          label: type,
          shortLabel: type,
          bgColor: '#f3f4f6',
          textColor: '#4b5563',
          borderColor: '#d1d5db',
        };

        return (
          <span
            key={index}
            title={config.label}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '2px 8px',
              borderRadius: '6px',
              backgroundColor: config.bgColor,
              color: config.textColor,
              border: `1px solid ${config.borderColor}`,
              fontSize: '11px',
              fontWeight: 600,
              minWidth: '24px',
            }}
          >
            {config.shortLabel}
          </span>
        );
      })}
    </div>
  );
};

export default ProjectTypesRenderer;
