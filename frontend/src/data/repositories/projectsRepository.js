import apiClient from '../api/apiClient';

export const projectsRepository = {
  getAll: () => apiClient.get('/proyectos'),
  getById: (id) => apiClient.get(`/proyectos/${id}`),
  getByUserId: (userId) => apiClient.get(`/proyectos/usuario/${userId}`),
  getByCodigo: (codigo) => apiClient.get(`/proyectos/codigo/${codigo}`),
  create: (data) => apiClient.post('/proyectos', data),
  update: (id, data) => apiClient.put(`/proyectos/${id}`, data),
  getMembers: (projectId) => apiClient.get(`/proyectos/${projectId}/miembros`),
  updateMemberRole: (projectId, userId, role) => apiClient.put(`/proyectos/${projectId}/miembros/${userId}/rol`, { role }),
  joinProject: (projectId, userId) => apiClient.post(`/proyectos/${projectId}/unirse`, { userId }),
};
