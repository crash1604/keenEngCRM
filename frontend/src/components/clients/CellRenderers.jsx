import React from 'react';
import {
  Badge,
  Button,
  Chip,
  IconButton,
  Tooltip,
  Box,
  Typography,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Email as EmailIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  Phone as PhoneIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  PersonAdd as PersonAddIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';

// Client Name Renderer
export const ClientNameRenderer = ({ value, data }) => {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <PersonIcon fontSize="small" color="action" />
      <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
        {value}
      </Typography>
      {data?.is_user && (
        <Tooltip title="Has user account">
          <Chip
            label="User"
            size="small"
            color="primary"
            sx={{ height: 20, fontSize: '0.7rem' }}
          />
        </Tooltip>
      )}
    </Box>
  );
};

// Email Renderer
export const EmailRenderer = ({ value }) => {
  if (!value) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
        N/A
      </Typography>
    );
  }

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <EmailIcon fontSize="small" color="action" />
      <Typography variant="body2">
        {value}
      </Typography>
    </Box>
  );
};

// Status Renderer
export const StatusRenderer = ({ value, data }) => {
  const isActive = data?.is_active ?? (value === 'Active');
  
  return (
    <Chip
      label={isActive ? 'Active' : 'Inactive'}
      size="small"
      color={isActive ? 'success' : 'error'}
      icon={isActive ? <CheckCircleIcon /> : <CancelIcon />}
      sx={{ height: 24, fontSize: '0.75rem' }}
    />
  );
};

// Account Renderer
export const AccountRenderer = ({ value, data }) => {
  const hasAccount = data?.is_user ?? (value === 'Yes');
  
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      {hasAccount ? (
        <>
          <PersonIcon fontSize="small" color="success" />
          <Typography variant="body2" color="success.main">
            Yes
          </Typography>
        </>
      ) : (
        <>
          <PersonAddIcon fontSize="small" color="action" />
          <Typography variant="body2" color="text.secondary">
            No
          </Typography>
        </>
      )}
    </Box>
  );
};

// Actions Renderer
export const ActionsRenderer = ({ data, onAction }) => {
  return (
    <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
      <Tooltip title="View Details">
        <IconButton
          size="small"
          onClick={() => onAction('view', data)}
          sx={{ color: 'primary.main' }}
        >
          <ViewIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      <Tooltip title="Edit Client">
        <IconButton
          size="small"
          onClick={() => onAction('edit', data)}
          sx={{ color: 'info.main' }}
        >
          <EditIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      <Tooltip title="Delete Client">
        <IconButton
          size="small"
          onClick={() => onAction('delete', data)}
          sx={{ color: 'error.main' }}
        >
          <DeleteIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </Box>
  );
};

// Client Actions Renderer for AG Grid
export const ClientActionsRenderer = (props) => {
  const { data, onEdit, onDelete, onViewDetails } = props;

  return (
    <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center', height: '100%', alignItems: 'center' }}>
      <Tooltip title="View Details">
        <IconButton
          size="small"
          onClick={() => onViewDetails(data)}
          sx={{ color: 'primary.main' }}
        >
          <ViewIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      <Tooltip title="Edit Client">
        <IconButton
          size="small"
          onClick={() => onEdit(data)}
          sx={{ color: 'info.main' }}
        >
          <EditIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      <Tooltip title="Delete Client">
        <IconButton
          size="small"
          onClick={() => onDelete(data)}
          sx={{ color: 'error.main' }}
        >
          <DeleteIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </Box>
  );
};

// Aliases for AG Grid cell renderers
export const clientNameRenderer = ClientNameRenderer;
export const clientStatusRenderer = StatusRenderer;
export const clientActionsRenderer = ClientActionsRenderer;

// Date Renderer
export const DateRenderer = ({ value }) => {
  if (!value) return 'N/A';
  
  try {
    const date = new Date(value);
    return format(date, 'MMM dd, yyyy');
  } catch {
    return value;
  }
};

// Company Renderer
export const CompanyRenderer = ({ value }) => {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <BusinessIcon fontSize="small" color="action" />
      <Typography variant="body2">
        {value || 'N/A'}
      </Typography>
    </Box>
  );
};

// Phone Renderer
export const PhoneRenderer = ({ value }) => {
  if (!value) return 'N/A';
  
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <PhoneIcon fontSize="small" color="action" />
      <Typography variant="body2">
        {value}
      </Typography>
    </Box>
  );
};