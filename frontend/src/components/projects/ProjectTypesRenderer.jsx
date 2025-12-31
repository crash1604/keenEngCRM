import React, { useState, useEffect } from 'react';

// Project type configuration with colors for light and dark modes
const PROJECT_TYPE_CONFIG = {
  M: {
    label: 'Mechanical',
    shortLabel: 'M',
    light: { bgColor: '#dbeafe', textColor: '#1d4ed8', borderColor: '#93c5fd' },
    dark: { bgColor: '#1e3a5f', textColor: '#93c5fd', borderColor: '#3b82f6' },
  },
  E: {
    label: 'Electrical',
    shortLabel: 'E',
    light: { bgColor: '#fef3c7', textColor: '#b45309', borderColor: '#fcd34d' },
    dark: { bgColor: '#78350f', textColor: '#fcd34d', borderColor: '#f59e0b' },
  },
  P: {
    label: 'Plumbing',
    shortLabel: 'P',
    light: { bgColor: '#d1fae5', textColor: '#047857', borderColor: '#6ee7b7' },
    dark: { bgColor: '#064e3b', textColor: '#6ee7b7', borderColor: '#10b981' },
  },
  FP: {
    label: 'Fire Protection',
    shortLabel: 'FP',
    light: { bgColor: '#fee2e2', textColor: '#b91c1c', borderColor: '#fca5a5' },
    dark: { bgColor: '#7f1d1d', textColor: '#fca5a5', borderColor: '#ef4444' },
  },
  EM: {
    label: 'Energy Model',
    shortLabel: 'EM',
    light: { bgColor: '#e0e7ff', textColor: '#4338ca', borderColor: '#a5b4fc' },
    dark: { bgColor: '#312e81', textColor: '#a5b4fc', borderColor: '#6366f1' },
  },
  VI: {
    label: 'Virtual Inspection',
    shortLabel: 'VI',
    light: { bgColor: '#f3e8ff', textColor: '#7c3aed', borderColor: '#c4b5fd' },
    dark: { bgColor: '#4c1d95', textColor: '#c4b5fd', borderColor: '#8b5cf6' },
  },
  TI: {
    label: 'Title 24',
    shortLabel: 'TI',
    light: { bgColor: '#fce7f3', textColor: '#be185d', borderColor: '#f9a8d4' },
    dark: { bgColor: '#831843', textColor: '#f9a8d4', borderColor: '#ec4899' },
  },
};

// Default colors for unknown types
const DEFAULT_COLORS = {
  light: { bgColor: '#f3f4f6', textColor: '#4b5563', borderColor: '#d1d5db' },
  dark: { bgColor: '#374151', textColor: '#d1d5db', borderColor: '#6b7280' },
};

const ProjectTypesRenderer = (props) => {
  const { value, data } = props;
  const [isDark, setIsDark] = useState(() =>
    document.documentElement.classList.contains('dark')
  );

  // Listen for dark mode changes
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, []);

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
    return <span style={{ color: isDark ? '#6b7280' : '#9ca3af', fontStyle: 'italic' }}>-</span>;
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', height: 'fit-content', gap: '4px', flexWrap: 'wrap' }}>
      {types.map((type, index) => {
        const typeConfig = PROJECT_TYPE_CONFIG[type];
        const colors = typeConfig
          ? (isDark ? typeConfig.dark : typeConfig.light)
          : (isDark ? DEFAULT_COLORS.dark : DEFAULT_COLORS.light);
        const label = typeConfig?.label || type;
        const shortLabel = typeConfig?.shortLabel || type;

        return (
          <span
            key={index}
            title={label}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '2px 8px',
              margin: '6px 0',
              borderRadius: '6px',
              backgroundColor: colors.bgColor,
              color: colors.textColor,
              border: `1px solid ${colors.borderColor}`,
              fontSize: '11px',
              fontWeight: 600,
              minWidth: '24px',
              height: 'fit-content',
              maxHeight: '26px',
            }}
          >
            {shortLabel}
          </span>
        );
      })}
    </div>
  );
};

export default ProjectTypesRenderer;
