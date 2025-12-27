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

// Status configuration with colors and icons
const STATUS_CONFIG = {
  not_started: {
    label: 'Not Started',
    bgColor: '#f3f4f6',
    textColor: '#4b5563',
    borderColor: '#d1d5db',
    Icon: HourglassEmptyIcon
  },
  in_progress: {
    label: 'In Progress',
    bgColor: '#dbeafe',
    textColor: '#1d4ed8',
    borderColor: '#93c5fd',
    Icon: SyncIcon
  },
  submitted: {
    label: 'Submitted',
    bgColor: '#fef3c7',
    textColor: '#b45309',
    borderColor: '#fcd34d',
    Icon: SendIcon
  },
  approved: {
    label: 'Approved',
    bgColor: '#d1fae5',
    textColor: '#047857',
    borderColor: '#6ee7b7',
    Icon: CheckCircleIcon
  },
  completed: {
    label: 'Completed',
    bgColor: '#dcfce7',
    textColor: '#15803d',
    borderColor: '#86efac',
    Icon: CelebrationIcon
  },
  cancelled: {
    label: 'Cancelled',
    bgColor: '#fee2e2',
    textColor: '#b91c1c',
    borderColor: '#fca5a5',
    Icon: CancelIcon
  },
  on_hold: {
    label: 'On Hold',
    bgColor: '#fef9c3',
    textColor: '#a16207',
    borderColor: '#fde047',
    Icon: PauseIcon
  },
  closed_paid: {
    label: 'Closed & Paid',
    bgColor: '#e0e7ff',
    textColor: '#4338ca',
    borderColor: '#a5b4fc',
    Icon: PaidIcon
  }
};

const StatusRenderer = (props) => {
  const { value } = props;

  // Handle null/undefined values
  if (!value) {
    return <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>-</span>;
  }

  const config = STATUS_CONFIG[value] || {
    label: value.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
    bgColor: '#f3f4f6',
    textColor: '#4b5563',
    borderColor: '#d1d5db',
    Icon: AssignmentIcon
  };

  const { Icon } = config;

  return (
    <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          padding: '4px 10px',
          borderRadius: '9999px',
          backgroundColor: config.bgColor,
          color: config.textColor,
          border: `1px solid ${config.borderColor}`,
          fontSize: '12px',
          fontWeight: 600,
          whiteSpace: 'nowrap',
        }}
      >
        <Icon style={{ fontSize: 14 }} />
        {config.label}
      </span>
    </div>
  );
};

export default StatusRenderer;
