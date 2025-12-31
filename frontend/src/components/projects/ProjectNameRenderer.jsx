import React from 'react';

const ProjectNameRenderer = (params) => {
  const hasItems = params.data?.current_open_items || params.data?.current_action_items;
  const hasNotes = params.data?.due_date_note || params.data?.rough_in_note || params.data?.final_inspection_note;

  return (
    <div className="flex flex-col">
      <div className="flex items-center space-x-2">
        <span className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 cursor-pointer">
          {params.value}
        </span>
        {hasItems && (
          <span className="text-xs bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-300 px-1 rounded-full flex items-center justify-center w-4 h-4">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </span>
        )}
        {hasNotes && (
          <span className="text-xs bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 px-1 rounded-full flex items-center justify-center w-4 h-4">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </span>
        )}
      </div>
      {params.data?.year && (
        <span className="text-xs text-gray-500 dark:text-gray-400">
          Year: {params.data.year}
        </span>
      )}
    </div>
  );
};

export default ProjectNameRenderer;