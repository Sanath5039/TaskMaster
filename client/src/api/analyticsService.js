import api from './axios';

// Get dashboard analytics
export const getDashboardAnalytics = async () => {
  const response = await api.get('/api/analytics/dashboard');
  return response.data.data;
};
