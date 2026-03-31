import api from './axios';

export const getProjectActivity = async (projectId) => {
  const response = await api.get(`/api/activities/project/${projectId}`);
  return response.data.data;
};
