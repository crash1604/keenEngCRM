// src/components/projects/GridToolbar.jsx
import React from 'react';

const GridToolbar = ({ gridRef, projects }) => {
  const handleExport = () => {
    if (gridRef.current) {
      gridRef.current.api.exportDataAsCsv();
    }
  };

  const handleQuickFilter = (event) => {
    if (gridRef.current) {
      gridRef.current.api.setQuickFilter(event.target.value);
    }
  };

  return (
    <div className="flex justify-between items-center mb-4 p-4 bg-gray-50 rounded-lg">
      <div className="flex items-center space-x-4">
        <div className="text-sm text-gray-600">
          Showing {projects.length} projects
        </div>
        <input
          type="text"
          placeholder="Quick filter..."
          onChange={handleQuickFilter}
          className="px-3 py-1 border border-gray-300 rounded text-sm"
        />
      </div>
      <div className="flex space-x-2">
        <button
          onClick={handleExport}
          className="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600"
        >
          Export CSV
        </button>
        <button
          onClick={() => gridRef.current?.api.refreshCells()}
          className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
        >
          Refresh
        </button>
      </div>
    </div>
  );
};

export default GridToolbar;