import React from 'react';

const AddressRenderer = (params) => {
  const hasLegalAddress = params.data?.legal_address && params.data.legal_address !== params.value;

  return (
    <div className="flex flex-col">
      <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{params.value}</span>
      {hasLegalAddress && (
        <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Legal: {params.data.legal_address}
        </span>
      )}
    </div>
  );
};

export default AddressRenderer;