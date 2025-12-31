import { useMemo } from 'react';

// Reusable date formatter
const formatDate = (value, options = { month: 'short', day: 'numeric', year: 'numeric' }) => {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('en-US', options);
};

// Helper to check dark mode
const isDarkMode = () => document.documentElement.classList.contains('dark');

// Reusable empty cell style (with dark mode support)
const getEmptyCellStyle = () => ({
  color: isDarkMode() ? '#6b7280' : '#9ca3af',
  fontStyle: 'italic'
});

export const useProjectColumnDefs = () => {
  return useMemo(() => [
    {
      field: 'job_number',
      headerName: 'Job #',
      width: 110,
      pinned: 'left',
      cellStyle: { fontFamily: 'monospace', fontWeight: 500 }
    },
    {
      field: 'project_name',
      headerName: 'Project Name',
      width: 220,
      cellRenderer: 'projectNameRenderer',
    },
    {
      field: 'project_type',
      headerName: 'Types',
      width: 150,
      cellRenderer: 'projectTypesRenderer',
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 155,
      cellRenderer: 'statusRenderer',
    },
    {
      field: 'current_sub_status',
      headerName: 'Sub Status',
      width: 150,
      valueFormatter: (params) => params.value || '-',
      cellStyle: (params) => !params.value ? getEmptyCellStyle() : null
    },
    {
      field: 'client_name',
      headerName: 'Client',
      width: 180,
      valueFormatter: (params) => params.value || '-',
    },
    {
      field: 'architect_designer',
      headerName: 'Architect/Designer',
      width: 180,
      valueFormatter: (params) => params.value || '-',
    },
    {
      field: 'manager_name',
      headerName: 'Manager',
      width: 150,
      valueFormatter: (params) => params.value || '-',
    },
    {
      field: 'due_date',
      headerName: 'Due Date',
      width: 130,
      valueFormatter: (params) => formatDate(params.value),
      cellStyle: (params) => {
        if (!params.value) return getEmptyCellStyle();
        const dueDate = new Date(params.value);
        const today = new Date();
        const daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
        const dark = isDarkMode();

        if (daysUntilDue < 0 && params.data.status !== 'completed') {
          // Overdue - red styling
          return {
            backgroundColor: dark ? '#7f1d1d' : '#fef2f2',
            color: dark ? '#fca5a5' : '#dc2626',
            fontWeight: 600
          };
        } else if (daysUntilDue <= 7 && params.data.status !== 'completed') {
          // Due soon - amber/yellow styling
          return {
            backgroundColor: dark ? '#78350f' : '#fffbeb',
            color: dark ? '#fcd34d' : '#d97706',
            fontWeight: 500
          };
        }
        return null;
      }
    },
    {
      field: 'rough_in_date',
      headerName: 'Rough In',
      width: 120,
      valueFormatter: (params) => formatDate(params.value, { month: 'short', day: 'numeric' }),
      cellStyle: (params) => !params.value ? getEmptyCellStyle() : null
    },
    {
      field: 'final_inspection_date',
      headerName: 'Final Insp',
      width: 120,
      valueFormatter: (params) => formatDate(params.value, { month: 'short', day: 'numeric' }),
      cellStyle: (params) => !params.value ? getEmptyCellStyle() : null
    },
    {
      field: 'year',
      headerName: 'Year',
      width: 90,
      cellStyle: { textAlign: 'center' }
    },
    {
      field: 'address',
      headerName: 'Address',
      width: 200,
      cellRenderer: 'addressRenderer',
    },
    // {
    //   field: 'days_until_due',
    //   headerName: 'Days Left',
    //   width: 110,
    //   valueFormatter: (params) => {
    //     if (params.value === null || params.value === undefined) return '-';
    //     if (params.value < 0) return `${Math.abs(params.value)} overdue`;
    //     return params.value;
    //   },
    //   cellStyle: (params) => {
    //     if (params.value === null || params.value === undefined) return emptyCellStyle;
    //     if (params.value < 0) {
    //       return { backgroundColor: '#fef2f2', color: '#dc2626', fontWeight: 'bold' };
    //     } else if (params.value <= 7) {
    //       return { backgroundColor: '#fffbeb', color: '#d97706', fontWeight: 'bold' };
    //     }
    //     return { color: '#16a34a' };
    //   }
    // },
    {
      field: 'created_at',
      headerName: 'Created',
      width: 110,
      valueFormatter: (params) => formatDate(params.value, { month: 'short', day: 'numeric', year: '2-digit' })
    }
  ], []);
};
