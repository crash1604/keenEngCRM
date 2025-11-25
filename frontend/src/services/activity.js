// src/services/activity.js
import api from './api';  // Change from named import to default import

export const activityService = {
  // Get all activity logs (with role-based filtering)
  getActivityLogs: async (params = {}) => {
    const response = await api.get('/activity/activity-logs/', { params });
    return response.data;
  },

  // Get current user's activity only
  getMyActivity: async (params = {}) => {
    const response = await api.get('/activity/activity-logs/my_activity/', { params });
    return response.data;
  },

  // Get project activity (projects user has access to)
  getProjectActivity: async (params = {}) => {
    const response = await api.get('/activity/activity-logs/project_activity/', { params });
    return response.data;
  },

  // Get specific activity log
  getActivityLog: async (id) => {
    const response = await api.get(`/activity/activity-logs/${id}/`);
    return response.data;
  }
};