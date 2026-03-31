import api from './axios';

export const getTasksByProject = async (projectId) => {
  const response = await api.get(`/api/tasks/project/${projectId}`);
  return response.data;
};

export const createTask = async (taskData) => {
  const { file, ...rest } = taskData;

  if (file) {
    // Use multipart/form-data when a file attachment is included
    const form = new FormData();
    Object.entries(rest).forEach(([key, val]) => {
      if (val !== undefined && val !== null) form.append(key, val);
    });
    form.append('attachment', file);
    const response = await api.post('/api/tasks', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  }

  const response = await api.post('/api/tasks', rest);
  return response.data;
};

export const updateTask = async (id, taskData) => {
  const response = await api.put(`/api/tasks/${id}`, taskData);
  return response.data;
};

export const deleteTask = async (id) => {
  const response = await api.delete(`/api/tasks/${id}`);
  return response.data;
};

export const getMyTasks = async () => {
  const response = await api.get('/api/tasks/my');
  return response.data;
};

export const reorderTasks = async (items) => {
  const response = await api.put('/api/tasks/reorder', { items });
  return response.data;
};

export const downloadTaskAttachment = async (taskId, filename) => {
  const response = await api.get(`/api/tasks/${taskId}/download`, {
    responseType: 'blob',
  });
  
  // Create a blob URL and trigger download
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename || 'attachment');
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

export const submitForReview = async (id, submissionNote) => {
  const response = await api.post(`/api/tasks/${id}/submit-review`, { submissionNote });
  return response.data;
};

export const approveTask = async (id) => {
  const response = await api.post(`/api/tasks/${id}/approve`);
  return response.data;
};

export const rejectTask = async (id, reviewNote) => {
  const response = await api.post(`/api/tasks/${id}/reject`, { reviewNote });
  return response.data;
};
