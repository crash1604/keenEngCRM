import { useMemo } from 'react';

export const useClientColumnDefs = (onEdit, onDelete, onViewDetails) => {
  return useMemo(() => [
    {
      field: 'id',
      headerName: 'ID',
      width: 80,
      pinned: 'left',
      cellStyle: { fontWeight: '500' }
    },
    {
      field: 'name',
      headerName: 'Client Name',
      width: 200,
      cellRenderer: 'clientNameRenderer'
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
      width: 220,
      valueFormatter: (params) => params.value || 'N/A'
    },
    {
      field: 'phone',
      headerName: 'Phone',
      width: 150,
      valueFormatter: (params) => params.value || 'N/A'
    },
    {
      field: 'is_active',
      headerName: 'Status',
      width: 120,
      cellRenderer: 'clientStatusRenderer'
    },
    {
      field: 'contact_person',
      headerName: 'Contact Person',
      width: 180,
      valueFormatter: (params) => params.value || 'N/A'
    },
    {
      field: 'created_at',
      headerName: 'Created Date',
      width: 140,
      valueFormatter: (params) => {
        if (!params.value) return 'N/A';
        return new Date(params.value).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });
      },
      comparator: (dateA, dateB) => {
        return new Date(dateA) - new Date(dateB);
      }
    },
    {
      field: 'updated_at',
      headerName: 'Updated Date',
      width: 140,
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
      field: 'actions',
      headerName: 'Actions',
      width: 200,
      pinned: 'right',
      filter: false,
      sortable: false,
      cellRenderer: 'clientActionsRenderer',
      cellRendererParams: {
        onEdit,
        onDelete,
        onViewDetails
      }
    }
  ], [onEdit, onDelete, onViewDetails]);
};