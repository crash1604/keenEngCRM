import React from 'react';

const STATUS_CONFIG = {
  not_started: { label: 'Not Started', className: 'bg-gray-100 text-gray-800' },
  in_progress: { label: 'In Progress', className: 'bg-blue-100 text-blue-800' },
  submitted: { label: 'Submitted', className: 'bg-yellow-100 text-yellow-800' },
  approved: { label: 'Approved', className: 'bg-green-100 text-green-800' },
  completed: { label: 'Completed', className: 'bg-green-100 text-green-800' },
  cancelled: { label: 'Cancelled', className: 'bg-red-100 text-red-800' }
};

const StatusRenderer = (params) => {
  const config = STATUS_CONFIG[params.value] || { label: params.value, className: 'bg-gray-100' };
  
  return (
    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${config.className}`}>
      {config.label}
    </span>
  );
};

export default StatusRenderer;