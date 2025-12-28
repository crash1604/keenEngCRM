import { useMemo } from 'react';

export const useArchitectColumnDefs = () => {
  return useMemo(() => [
    {
      field: 'id',
      headerName: 'ID',
      width: 80,
      cellStyle: { fontWeight: '500' }
    },
    {
      field: 'name',
      headerName: 'Name',
      width: 180,
      cellRenderer: 'architectNameRenderer'
    },
    {
      field: 'company_name',
      headerName: 'Company',
      width: 180,
      valueFormatter: (params) => params.value || 'N/A'
    },
    {
      field: 'contact_email',
      headerName: 'Email',
      width: 200,
      valueFormatter: (params) => params.value || 'N/A'
    },
    {
      field: 'phone',
      headerName: 'Phone',
      width: 140,
      valueFormatter: (params) => params.value || 'N/A'
    },
    {
      field: 'license_number',
      headerName: 'License #',
      width: 140,
      valueFormatter: (params) => params.value || 'N/A'
    },
    {
      field: 'is_active',
      headerName: 'Status',
      width: 120,
      cellRenderer: 'architectStatusRenderer'
    },
    {
      field: 'created_at',
      headerName: 'Created',
      width: 130,
      valueFormatter: (params) => {
        if (!params.value) return 'N/A';
        return new Date(params.value).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });
      }
    },
    {
      field: 'updated_at',
      headerName: 'Updated',
      width: 130,
      valueFormatter: (params) => {
        if (!params.value) return 'N/A';
        return new Date(params.value).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });
      }
    }
  ], []);
};
