import apiClient from '../api/apiClient';

export const sprintsRepository = {
  getAll: () => apiClient.get('/sprints'),
  getById: (id) => apiClient.get(`/sprints/${id}`),
  getByProjectId: (projectId) => apiClient.get(`/sprints/proyecto/${projectId}`),
  create: (data) => apiClient.post('/sprints', data),
  update: (id, data) => apiClient.put(`/sprints/${id}`, data),
  delete: (id) => apiClient.delete(`/sprints/${id}`),
};
