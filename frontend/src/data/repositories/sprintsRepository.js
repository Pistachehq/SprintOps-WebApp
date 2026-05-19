import apiClient from '../api/apiClient';

export const sprintsRepository = {
  getAll: () => apiClient.get('/sprints'),
  getById: (id) => apiClient.get(`/sprints/${id}`),
  /** KPIs de un desarrollador en el sprint (viewerUserId = usuario logueado, requerido por el backend). */
  getDeveloperKpis: (sprintId, developerId, viewerUserId) =>
    apiClient.get(
      `/sprints/${sprintId}/kpis/desarrollador/${developerId}?viewerUserId=${encodeURIComponent(viewerUserId)}`
    ),
  getByProjectId: (projectId) => apiClient.get(`/sprints/proyecto/${projectId}`),
  create: (data) => apiClient.post('/sprints', data),
  update: (id, data) => apiClient.put(`/sprints/${id}`, data),
  delete: (id) => apiClient.delete(`/sprints/${id}`),
};
