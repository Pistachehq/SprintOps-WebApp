import apiClient from '../api/apiClient';

export const issuesRepository = {
  getAll: () => apiClient.get('/issues'),
  getById: (id) => apiClient.get(`/issues/${id}`),
  getBySprintId: (sprintId) => apiClient.get(`/issues/sprint/${sprintId}`),
  getByProjectId: (projectId) => apiClient.get(`/issues/proyecto/${projectId}`),
  create: (data) => apiClient.post('/issues', data),
  update: (id, data) => apiClient.put(`/issues/${id}`, data),
  delete: (id) => apiClient.delete(`/issues/${id}`),
  moveToNextSprint: (issueId, payload) =>
    apiClient.post(`/issues/${issueId}/move-to-next-sprint`, payload),
};
