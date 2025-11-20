import React from 'react';

const Tooltip = ({ content, position }) => {
  if (!content) return null;

  return (
    <div 
      className="fixed z-50 bg-white border border-gray-300 rounded-lg shadow-lg p-4 max-w-sm"
      style={{
        left: position.x + 10,
        top: position.y + 10,
      }}
    >
      <div className="space-y-3">
        {content.current_open_items && (
          <div>
            <h4 className="font-semibold text-sm text-gray-800 mb-1 flex items-center">
              <svg className="w-4 h-4 mr-1 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Open Items
            </h4>
            <p className="text-sm text-gray-600 bg-blue-50 p-2 rounded">
              {content.current_open_items || 'No open items'}
            </p>
          </div>
        )}
        
        {content.current_action_items && (
          <div>
            <h4 className="font-semibold text-sm text-gray-800 mb-1 flex items-center">
              <svg className="w-4 h-4 mr-1 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Action Items
            </h4>
            <p className="text-sm text-gray-600 bg-green-50 p-2 rounded">
              {content.current_action_items || 'No action items'}
            </p>
          </div>
        )}
        
        {(!content.current_open_items && !content.current_action_items) && (
          <p className="text-sm text-gray-500">No additional information available</p>
        )}
      </div>
      
      <div className="absolute w-3 h-3 bg-white border-l border-t border-gray-300 transform rotate-45 -left-1 top-4" />
    </div>
  );
};

export default Tooltip;