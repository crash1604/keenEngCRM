import React from 'react';

const STATUS_OPTIONS = [
  { value: 'not_started', label: 'Not Started' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'approved', label: 'Approved' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' }
];

const ActionsRenderer = (params) => {
  const handleStatusChange = (projectId, newStatus) => {
    if (params.onStatusChange) {
      params.onStatusChange(projectId, newStatus);
    }
  };

  return (
    <div className="flex space-x-2">
      <select
        value={params.data.status}
        onChange={(e) => handleStatusChange(params.data.id, e.target.value)}
        className="text-xs border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      >
        {STATUS_OPTIONS.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <button
        onClick={() => console.log('View project:', params.data.id)}
        className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
      >
        View
      </button>
    </div>
  );
};

export default ActionsRenderer;