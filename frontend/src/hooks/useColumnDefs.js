import { useMemo } from 'react';

export const useColumnDefs = (onStatusChange) => {
  return useMemo(() => [
    {
      field: 'job_number',
      headerName: 'Job #',
      width: 100,
      filter: 'agTextColumnFilter',
      pinned: 'left'
    },
    {
      field: 'project_name', 
      headerName: 'Project Name',
      width: 200,
      filter: 'agTextColumnFilter',
      cellRenderer: 'projectNameRenderer'
    },
    {
      field: 'project_types_list',
      headerName: 'Project Types',
      width: 150,
      filter: 'agSetColumnFilter',
      valueFormatter: (params) => {
        if (!params.value) return '';
        return params.value.join(', ');
      }
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 140,
      filter: 'agSetColumnFilter',
      cellRenderer: 'statusRenderer'
    },
    {
      field: 'current_sub_status',
      headerName: 'Sub Status',
      width: 150,
      filter: 'agTextColumnFilter'
    },
    {
      field: 'client_name',
      headerName: 'Client',
      width: 180,
      filter: 'agTextColumnFilter'
    },
    {
      field: 'architect_designer',
      headerName: 'Architect/Designer',
      width: 180,
      filter: 'agTextColumnFilter'
    },
    {
      field: 'manager_name',
      headerName: 'Manager',
      width: 150,
      filter: 'agTextColumnFilter'
    },
    {
      field: 'due_date',
      headerName: 'Due Date',
      width: 120,
      filter: 'agDateColumnFilter',
      valueFormatter: (params) => {
        if (!params.value) return '';
        return new Date(params.value).toLocaleDateString();
      },
      cellStyle: (params) => {
        if (!params.value) return null;
        const dueDate = new Date(params.value);
        const today = new Date();
        const daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
        
        if (daysUntilDue < 0) {
          return { backgroundColor: '#fef2f2', color: '#dc2626' };
        } else if (daysUntilDue <= 7) {
          return { backgroundColor: '#fffbeb', color: '#d97706' };
        }
        return null;
      }
    },
    {
      field: 'rough_in_date',
      headerName: 'Rough In Date',
      width: 130,
      filter: 'agDateColumnFilter',
      valueFormatter: (params) => {
        if (!params.value) return '';
        return new Date(params.value).toLocaleDateString();
      }
    },
    {
      field: 'final_inspection_date',
      headerName: 'Final Insp Date',
      width: 130,
      filter: 'agDateColumnFilter',
      valueFormatter: (params) => {
        if (!params.value) return '';
        return new Date(params.value).toLocaleDateString();
      }
    },
    {
      field: 'year',
      headerName: 'Year',
      width: 100,
      filter: 'agNumberColumnFilter'
    },
    {
      field: 'address',
      headerName: 'Address',
      width: 200,
      filter: 'agTextColumnFilter',
      cellRenderer: 'addressRenderer'
    },
    {
      field: 'days_until_due',
      headerName: 'Days Left',
      width: 100,
      filter: 'agNumberColumnFilter',
      cellStyle: (params) => {
        if (params.value < 0) {
          return { backgroundColor: '#fef2f2', color: '#dc2626', fontWeight: 'bold' };
        } else if (params.value <= 7) {
          return { backgroundColor: '#fffbeb', color: '#d97706', fontWeight: 'bold' };
        }
        return null;
      }
    },
    {
      field: 'created_at',
      headerName: 'Created',
      width: 120,
      filter: 'agDateColumnFilter',
      valueFormatter: (params) => {
        if (!params.value) return '';
        return new Date(params.value).toLocaleDateString();
      }
    }
    // ,{
    //   field: 'actions',
    //   headerName: 'Actions',
    //   width: 180,
    //   pinned: 'right',
    //   filter: false,
    //   sortable: false,
    //   cellRenderer: 'actionsRenderer'
    // }
  ], [onStatusChange]);
};