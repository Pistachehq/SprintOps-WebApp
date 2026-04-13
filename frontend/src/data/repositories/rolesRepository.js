import apiClient from '../api/apiClient';

export const rolesRepository = {
  getAll: () => apiClient.get('/roles'),

  getByProject: (projectId) => apiClient.get(`/roles/proyecto/${projectId}`),

  getById: (id) => apiClient.get(`/roles/${id}`),

  getPermisos: (rolId) => apiClient.get(`/roles/${rolId}/permisos`),

  setPermisos: (rolId, permisoIds) => apiClient.put(`/roles/${rolId}/permisos`, permisoIds),

  createWithPermisos: (nombreRol, permisoIds, proyectoId) =>
    apiClient.post('/roles/with-permisos', { nombreRol, permisoIds, proyectoId }),

  update: (id, data) => apiClient.put(`/roles/${id}`, data),

  delete: (id) => apiClient.delete(`/roles/${id}`),

  getAllPermisos: () => apiClient.get('/permisos'),
};
