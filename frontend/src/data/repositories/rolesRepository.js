import apiClient from '../api/apiClient';

export const rolesRepository = {
  getAll: () => apiClient.get('/roles'),

  getById: (id) => apiClient.get(`/roles/${id}`),

  getPermisos: (rolId) => apiClient.get(`/roles/${rolId}/permisos`),

  setPermisos: (rolId, permisoIds) => apiClient.put(`/roles/${rolId}/permisos`, permisoIds),

  createWithPermisos: (nombreRol, permisoIds) =>
    apiClient.post('/roles/with-permisos', { nombreRol, permisoIds }),

  update: (id, data) => apiClient.put(`/roles/${id}`, data),

  delete: (id) => apiClient.delete(`/roles/${id}`),

  getAllPermisos: () => apiClient.get('/permisos'),
};
