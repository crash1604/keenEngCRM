import { useMemo } from 'react';

// Project type display names for filtering
const PROJECT_TYPE_DISPLAY_NAMES = {
  M: 'Mechanical',
  E: 'Electrical',
  P: 'Plumbing',
  FP: 'Fire Protection',
  EM: 'Energy Model',
  VI: 'Virtual Inspection',
  TI: 'Title 24'
};

// Reusable date comparator for AG Grid date filters
const dateComparator = (filterDate, cellValue) => {
  if (!cellValue) return -1;
  const cellDate = new Date(cellValue);
  const filterDateOnly = new Date(filterDate.getFullYear(), filterDate.getMonth(), filterDate.getDate());
  const cellDateOnly = new Date(cellDate.getFullYear(), cellDate.getMonth(), cellDate.getDate());
  if (cellDateOnly < filterDateOnly) return -1;
  if (cellDateOnly > filterDateOnly) return 1;
  return 0;
};

// Reusable date formatter
const formatDate = (value, options = { month: 'short', day: 'numeric', year: 'numeric' }) => {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('en-US', options);
};

// Reusable empty cell style
const emptyCellStyle = { color: '#9ca3af', fontStyle: 'italic' };

export const useProjectColumnDefs = () => {
  return useMemo(() => [
    {
      field: 'job_number',
      headerName: 'Job #',
      width: 110,
      filter: 'agTextColumnFilter',
      pinned: 'left',
      filterParams: {
        filterOptions: ['contains', 'equals', 'startsWith', 'endsWith'],
        defaultOption: 'contains',
      },
      cellStyle: { fontFamily: 'monospace', fontWeight: 500 }
    },
    {
      field: 'project_name',
      headerName: 'Project Name',
      width: 220,
      filter: 'agTextColumnFilter',
      cellRenderer: 'projectNameRenderer',
      filterParams: {
        filterOptions: ['contains', 'equals', 'startsWith'],
        defaultOption: 'contains',
      }
    },
    {
      field: 'project_type',
      headerName: 'Types',
      width: 150,
      filter: 'agTextColumnFilter',
      cellRenderer: 'projectTypesRenderer',
      filterParams: {
        filterOptions: ['contains', 'equals'],
        defaultOption: 'contains',
        trimInput: true,
      },
      filterValueGetter: (params) => {
        const value = params.data?.project_type;
        if (!value) return '';
        const types = value.split(',').map(t => t.trim());
        const names = types.map(t => PROJECT_TYPE_DISPLAY_NAMES[t] || t);
        return `${value} ${names.join(' ')}`;
      },
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 155,
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      cellRenderer: 'statusRenderer',
      filterParams: {
        filterOptions: ['contains', 'equals'],
        defaultOption: 'contains',
      },
    },
    {
      field: 'current_sub_status',
      headerName: 'Sub Status',
      width: 150,
      filter: 'agTextColumnFilter',
      filterParams: {
        filterOptions: ['contains', 'equals', 'startsWith'],
        defaultOption: 'contains',
      },
      valueFormatter: (params) => params.value || '-',
      cellStyle: (params) => !params.value ? emptyCellStyle : null
    },
    {
      field: 'client_name',
      headerName: 'Client',
      width: 180,
      filter: 'agTextColumnFilter',
      filterParams: {
        filterOptions: ['contains', 'equals', 'startsWith'],
        defaultOption: 'contains',
      },
      valueFormatter: (params) => params.value || '-',
    },
    {
      field: 'architect_designer',
      headerName: 'Architect/Designer',
      width: 180,
      filter: 'agTextColumnFilter',
      filterParams: {
        filterOptions: ['contains', 'equals', 'startsWith'],
        defaultOption: 'contains',
      },
      valueFormatter: (params) => params.value || '-',
    },
    {
      field: 'manager_name',
      headerName: 'Manager',
      width: 150,
      filter: 'agTextColumnFilter',
      filterParams: {
        filterOptions: ['contains', 'equals', 'startsWith'],
        defaultOption: 'contains',
      },
      valueFormatter: (params) => params.value || '-',
    },
    {
      field: 'due_date',
      headerName: 'Due Date',
      width: 130,
      filter: 'agDateColumnFilter',
      filterParams: {
        comparator: dateComparator,
        browserDatePicker: true,
        filterOptions: ['equals', 'greaterThan', 'lessThan', 'inRange'],
      },
      valueFormatter: (params) => formatDate(params.value),
      cellStyle: (params) => {
        if (!params.value) return emptyCellStyle;
        const dueDate = new Date(params.value);
        const today = new Date();
        const daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));

        if (daysUntilDue < 0) {
          return { backgroundColor: '#fef2f2', color: '#dc2626', fontWeight: 600 };
        } else if (daysUntilDue <= 7) {
          return { backgroundColor: '#fffbeb', color: '#d97706', fontWeight: 500 };
        }
        return null;
      }
    },
    {
      field: 'rough_in_date',
      headerName: 'Rough In',
      width: 120,
      filter: 'agDateColumnFilter',
      filterParams: {
        comparator: dateComparator,
        browserDatePicker: true,
      },
      valueFormatter: (params) => formatDate(params.value, { month: 'short', day: 'numeric' }),
      cellStyle: (params) => !params.value ? emptyCellStyle : null
    },
    {
      field: 'final_inspection_date',
      headerName: 'Final Insp',
      width: 120,
      filter: 'agDateColumnFilter',
      filterParams: {
        comparator: dateComparator,
        browserDatePicker: true,
      },
      valueFormatter: (params) => formatDate(params.value, { month: 'short', day: 'numeric' }),
      cellStyle: (params) => !params.value ? emptyCellStyle : null
    },
    {
      field: 'year',
      headerName: 'Year',
      width: 90,
      filter: 'agNumberColumnFilter',
      filterParams: {
        filterOptions: ['equals', 'greaterThan', 'lessThan', 'inRange'],
      },
      cellStyle: { textAlign: 'center' }
    },
    {
      field: 'address',
      headerName: 'Address',
      width: 200,
      filter: 'agTextColumnFilter',
      cellRenderer: 'addressRenderer',
      filterParams: {
        filterOptions: ['contains', 'startsWith'],
        defaultOption: 'contains',
      }
    },
    {
      field: 'days_until_due',
      headerName: 'Days Left',
      width: 110,
      filter: 'agNumberColumnFilter',
      filterParams: {
        filterOptions: ['equals', 'greaterThan', 'lessThan', 'inRange'],
      },
      valueFormatter: (params) => {
        if (params.value === null || params.value === undefined) return '-';
        if (params.value < 0) return `${Math.abs(params.value)} overdue`;
        return params.value;
      },
      cellStyle: (params) => {
        if (params.value === null || params.value === undefined) return emptyCellStyle;
        if (params.value < 0) {
          return { backgroundColor: '#fef2f2', color: '#dc2626', fontWeight: 'bold' };
        } else if (params.value <= 7) {
          return { backgroundColor: '#fffbeb', color: '#d97706', fontWeight: 'bold' };
        }
        return { color: '#16a34a' };
      }
    },
    {
      field: 'created_at',
      headerName: 'Created',
      width: 110,
      filter: 'agDateColumnFilter',
      filterParams: {
        comparator: dateComparator,
        browserDatePicker: true,
      },
      valueFormatter: (params) => formatDate(params.value, { month: 'short', day: 'numeric', year: '2-digit' })
    }
  ], []);
};
