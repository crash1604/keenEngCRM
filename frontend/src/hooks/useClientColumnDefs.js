import { useMemo } from 'react';

export const useClientColumnDefs = (onEdit, onDelete, onViewDetails) => {
  return useMemo(() => [
    {
      field: 'id',
      headerName: 'ID',
      width: 80,
      filter: 'agNumberColumnFilter',
      pinned: 'left',
      cellStyle: { fontWeight: '500' }
    },
    {
      field: 'name',
      headerName: 'Client Name',
      width: 200,
      filter: 'agTextColumnFilter',
      cellRenderer: 'clientNameRenderer'
    },
    {
      field: 'company_name',
      headerName: 'Company',
      width: 180,
      filter: 'agTextColumnFilter',
      valueFormatter: (params) => params.value || 'N/A'
    },
    {
      field: 'contact_email',
      headerName: 'Email',
      width: 220,
      filter: 'agTextColumnFilter',
      valueFormatter: (params) => params.value || 'N/A'
    },
    {
      field: 'phone',
      headerName: 'Phone',
      width: 150,
      filter: 'agTextColumnFilter',
      valueFormatter: (params) => params.value || 'N/A'
    },
    {
      field: 'is_active',
      headerName: 'Status',
      width: 120,
      filter: 'agSetColumnFilter',
      cellRenderer: 'clientStatusRenderer'
    },
    {
      field: 'contact_person',
      headerName: 'Contact Person',
      width: 180,
      filter: 'agTextColumnFilter',
      valueFormatter: (params) => params.value || 'N/A'
    },
    {
      field: 'created_at',
      headerName: 'Created Date',
      width: 140,
      filter: 'agDateColumnFilter',
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
      filter: 'agDateColumnFilter',
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