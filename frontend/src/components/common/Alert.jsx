import React from 'react';

export const Alert = ({ type = 'error', message, onClose }) => {
  if (!message) return null;

  const alertClasses = {
    error: 'bg-red-50 border-red-200 text-red-800',
    success: 'bg-green-50 border-green-200 text-green-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
  };

  return (
    <div className={`p-4 border rounded-md ${alertClasses[type]} flex justify-between items-center`}>
      <span>{message}</span>
      {onClose && (
        <button
          onClick={onClose}
          className="text-lg font-semibold leading-none hover:opacity-70"
        >
          ×
        </button>
      )}
    </div>
  );
};

export default Alert;