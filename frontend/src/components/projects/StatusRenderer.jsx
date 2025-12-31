import React from 'react';
import {
  HourglassEmpty as HourglassEmptyIcon,
  Sync as SyncIcon,
  Send as SendIcon,
  CheckCircle as CheckCircleIcon,
  Celebration as CelebrationIcon,
  Cancel as CancelIcon,
  Pause as PauseIcon,
  Paid as PaidIcon,
  Assignment as AssignmentIcon,
} from '@mui/icons-material';

// Status configuration with colors and icons (matches backend STATUS_CHOICES)
export const STATUS_CONFIG = {
  not_started: {
    label: 'Not Started',
    color: 'Gray',
    bgColor: '#f3f4f6',
    textColor: '#4b5563',
    borderColor: '#d1d5db',
    tailwindClasses: 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600',
    Icon: HourglassEmptyIcon
  },
  in_progress: {
    label: 'In Progress',
    color: 'Blue',
    bgColor: '#dbeafe',
    textColor: '#1d4ed8',
    borderColor: '#93c5fd',
    tailwindClasses: 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700',
    Icon: SyncIcon
  },
  submitted: {
    label: 'Submitted',
    color: 'Orange',
    bgColor: '#fef3c7',
    textColor: '#b45309',
    borderColor: '#fcd34d',
    tailwindClasses: 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700',
    Icon: SendIcon
  },
  completed: {
    label: 'Completed',
    color: 'Green',
    bgColor: '#dcfce7',
    textColor: '#15803d',
    borderColor: '#86efac',
    tailwindClasses: 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 border-green-300 dark:border-green-700',
    Icon: CheckCircleIcon
  },
  closed_paid: {
    label: 'Closed & Paid',
    color: 'Indigo',
    bgColor: '#e0e7ff',
    textColor: '#4338ca',
    borderColor: '#a5b4fc',
    tailwindClasses: 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-700',
    Icon: PaidIcon
  },
  cancelled: {
    label: 'Cancelled / Voided',
    color: 'Red',
    bgColor: '#fee2e2',
    textColor: '#b91c1c',
    borderColor: '#fca5a5',
    tailwindClasses: 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 border-red-300 dark:border-red-700',
    Icon: CancelIcon
  },
  on_hold: {
    label: 'On Hold',
    color: 'Yellow',
    bgColor: '#fef9c3',
    textColor: '#a16207',
    borderColor: '#fde047',
    tailwindClasses: 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300 border-yellow-300 dark:border-yellow-700',
    Icon: PauseIcon
  }
};

// Export status options for filters and dropdowns
export const STATUS_OPTIONS = [
  { value: 'not_started', label: 'Not Started', color: 'Gray', bgColor: '#f3f4f6', textColor: '#4b5563' },
  { value: 'in_progress', label: 'In Progress', color: 'Blue', bgColor: '#dbeafe', textColor: '#1d4ed8' },
  { value: 'submitted', label: 'Submitted', color: 'Orange', bgColor: '#fef3c7', textColor: '#b45309' },
  { value: 'completed', label: 'Completed', color: 'Green', bgColor: '#dcfce7', textColor: '#15803d' },
  { value: 'closed_paid', label: 'Closed & Paid', color: 'Indigo', bgColor: '#e0e7ff', textColor: '#4338ca' },
  { value: 'cancelled', label: 'Cancelled / Voided', color: 'Red', bgColor: '#fee2e2', textColor: '#b91c1c' },
  { value: 'on_hold', label: 'On Hold', color: 'Yellow', bgColor: '#fef9c3', textColor: '#a16207' }
];

const StatusRenderer = (props) => {
  const { value } = props;

  // Handle null/undefined values
  if (!value) {
    return <span className="text-gray-400 dark:text-gray-500 italic">-</span>;
  }

  const config = STATUS_CONFIG[value] || {
    label: value.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
    tailwindClasses: 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600',
    Icon: AssignmentIcon
  };

  const { Icon, tailwindClasses } = config;

  return (
    <div className="flex items-center h-fit">
      <span
        className={`inline-flex items-center gap-1 px-2.5 py-1 my-1.5 rounded-full border text-xs font-semibold whitespace-nowrap h-fit max-h-[26px] ${tailwindClasses}`}
      >
        <Icon style={{ fontSize: 14 }} />
        {config.label}
      </span>
    </div>
  );
};

export default StatusRenderer;
