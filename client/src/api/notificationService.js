import api from './axios';

export const getNotifications = async () => {
  const response = await api.get('/api/notifications');
  return response.data.data;
};

export const markAsRead = async (id) => {
  const response = await api.put(`/api/notifications/${id}/read`);
  return response.data.data;
};

export const markAllAsRead = async () => {
  const response = await api.put('/api/notifications/read-all');
  return response.data;
};
