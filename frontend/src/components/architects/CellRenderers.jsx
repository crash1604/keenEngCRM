import React from 'react';
import { Chip, Box, Typography, Tooltip } from '@mui/material';
import {
  Person as PersonIcon,
  Business as BusinessIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';

// Architect Name Renderer
export const ArchitectNameRenderer = ({ value, data }) => {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <BusinessIcon fontSize="small" color="action" />
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

// Status Renderer
export const ArchitectStatusRenderer = ({ value, data }) => {
  // Check is_active: treat as active unless explicitly set to false
  const fieldValue = value ?? data?.is_active;
  const isActive = fieldValue !== false && fieldValue !== 0 && fieldValue !== 'false';

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

// Aliases for AG Grid cell renderers
export const architectNameRenderer = ArchitectNameRenderer;
export const architectStatusRenderer = ArchitectStatusRenderer;
