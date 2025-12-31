import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  Paper,
  Typography,
  Box,
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import {
  Person as PersonIcon,
  Business as BusinessIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  TrendingUp as TrendingUpIcon,
  CalendarToday as CalendarIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
} from '@mui/icons-material';
import { clientStore } from '../../stores/client.store';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const StatisticsPanel = ({ open, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    withUsers: 0,
    withoutUsers: 0,
    byCompany: [],
    monthlyGrowth: [],
    statusDistribution: [],
  });

  useEffect(() => {
    if (open) {
      calculateStatistics();
    }
  }, [open]);

  const calculateStatistics = () => {
    setLoading(true);
    
    const clients = clientStore.clients;
    const total = clients.length;
    const active = clients.filter(c => c.is_active).length;
    const inactive = clients.filter(c => !c.is_active).length;
    const withUsers = clients.filter(c => c.is_user).length;
    const withoutUsers = total - withUsers;

    // Group by company
    const companyCounts = {};
    clients.forEach(client => {
      const company = client.company_name || 'No Company';
      companyCounts[company] = (companyCounts[company] || 0) + 1;
    });

    const byCompany = Object.entries(companyCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Status distribution for pie chart
    const statusDistribution = [
      { name: 'Active', value: active, color: '#4caf50' },
      { name: 'Inactive', value: inactive, color: '#f44336' },
    ];

    // Monthly growth (last 6 months)
    const monthlyGrowth = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = startOfMonth(subMonths(new Date(), i));
      const monthEnd = endOfMonth(monthStart);
      
      const monthClients = clients.filter(client => {
        const created = new Date(client.created_at);
        return created >= monthStart && created <= monthEnd;
      });

      monthlyGrowth.push({
        month: format(monthStart, 'MMM'),
        count: monthClients.length,
      });
    }

    setStats({
      total,
      active,
      inactive,
      withUsers,
      withoutUsers,
      byCompany,
      monthlyGrowth,
      statusDistribution,
    });
    
    setLoading(false);
  };

  const COLORS = ['#4caf50', '#f44336', '#2196f3', '#ff9800', '#9c27b0'];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">Client Statistics</Typography>
          <Button onClick={onClose} size="small">
            Close
          </Button>
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
            <CircularProgress />
          </Box>
        ) : (
          <Grid container spacing={3}>
            {/* Summary Cards */}
            <Grid item xs={12}>
              <Grid container spacing={2}>
                <Grid item xs={6} sm={3}>
                  <Paper elevation={2} sx={{ p: 2, textAlign: 'center', '.dark &': { backgroundColor: 'rgb(55 65 81)' } }}>
                    <Typography variant="h4" fontWeight="bold" color="primary">
                      {stats.total}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Clients
                    </Typography>
                    <PersonIcon sx={{ mt: 1, color: 'primary.main' }} />
                  </Paper>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Paper elevation={2} sx={{ p: 2, textAlign: 'center', '.dark &': { backgroundColor: 'rgb(55 65 81)' } }}>
                    <Typography variant="h4" fontWeight="bold" color="success.main">
                      {stats.active}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Active Clients
                    </Typography>
                    <CheckCircleIcon sx={{ mt: 1, color: 'success.main' }} />
                  </Paper>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Paper elevation={2} sx={{ p: 2, textAlign: 'center', '.dark &': { backgroundColor: 'rgb(55 65 81)' } }}>
                    <Typography variant="h4" fontWeight="bold" color="error.main">
                      {stats.inactive}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Inactive Clients
                    </Typography>
                    <CancelIcon sx={{ mt: 1, color: 'error.main' }} />
                  </Paper>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Paper elevation={2} sx={{ p: 2, textAlign: 'center', '.dark &': { backgroundColor: 'rgb(55 65 81)' } }}>
                    <Typography variant="h4" fontWeight="bold" color="info.main">
                      {stats.withUsers}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      With User Accounts
                    </Typography>
                    <BusinessIcon sx={{ mt: 1, color: 'info.main' }} />
                  </Paper>
                </Grid>
              </Grid>
            </Grid>

            {/* Charts */}
            <Grid item xs={12} md={6}>
              <Paper elevation={1} sx={{ p: 2, height: 300, '.dark &': { backgroundColor: 'rgb(55 65 81)' } }}>
                <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                  Monthly Client Growth
                </Typography>
                <ResponsiveContainer width="100%" height="85%">
                  <BarChart data={stats.monthlyGrowth}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" name="New Clients" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>

            <Grid item xs={12} md={6}>
              <Paper elevation={1} sx={{ p: 2, height: 300, '.dark &': { backgroundColor: 'rgb(55 65 81)' } }}>
                <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                  Status Distribution
                </Typography>
                <ResponsiveContainer width="100%" height="85%">
                  <PieChart>
                    <Pie
                      data={stats.statusDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {stats.statusDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>

            {/* Top Companies */}
            <Grid item xs={12}>
              <Paper elevation={1} sx={{ p: 2, '.dark &': { backgroundColor: 'rgb(55 65 81)' } }}>
                <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                  Top Companies
                </Typography>
                <List dense>
                  {stats.byCompany.map((company, index) => (
                    <ListItem key={company.name}>
                      <ListItemIcon>
                        <BusinessIcon color="action" />
                      </ListItemIcon>
                      <ListItemText
                        primary={company.name}
                        secondary={`${company.count} client${company.count !== 1 ? 's' : ''}`}
                      />
                      <Typography variant="body2" color="primary">
                        {Math.round((company.count / stats.total) * 100)}%
                      </Typography>
                    </ListItem>
                  ))}
                </List>
              </Paper>
            </Grid>

            {/* Additional Stats */}
            <Grid item xs={12} md={6}>
              <Paper elevation={1} sx={{ p: 2, '.dark &': { backgroundColor: 'rgb(55 65 81)' } }}>
                <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                  User Account Stats
                </Typography>
                <Box display="flex" justifyContent="space-around" mt={2}>
                  <Box textAlign="center">
                    <Typography variant="h6" color="success.main">
                      {stats.withUsers}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      With Accounts
                    </Typography>
                  </Box>
                  <Box textAlign="center">
                    <Typography variant="h6" color="text.secondary">
                      {stats.withoutUsers}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Without Accounts
                    </Typography>
                  </Box>
                  <Box textAlign="center">
                    <Typography variant="h6" color="primary">
                      {stats.total > 0 ? Math.round((stats.withUsers / stats.total) * 100) : 0}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Account Rate
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            </Grid>

            <Grid item xs={12} md={6}>
              <Paper elevation={1} sx={{ p: 2, '.dark &': { backgroundColor: 'rgb(55 65 81)' } }}>
                <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                  Activity Ratio
                </Typography>
                <Box display="flex" justifyContent="space-around" mt={2}>
                  <Box textAlign="center">
                    <Typography variant="h6" color="success.main">
                      {stats.active}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Active
                    </Typography>
                  </Box>
                  <Box textAlign="center">
                    <Typography variant="h6" color="error.main">
                      {stats.inactive}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Inactive
                    </Typography>
                  </Box>
                  <Box textAlign="center">
                    <Typography variant="h6" color="primary">
                      {stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Active Rate
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} variant="contained">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default StatisticsPanel;