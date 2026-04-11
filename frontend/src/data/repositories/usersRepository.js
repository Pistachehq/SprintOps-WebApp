import apiClient from '../api/apiClient';

export const usersRepository = {
  getAll: () => apiClient.get('/usuarios'),
  getById: (id) => apiClient.get(`/usuarios/${id}`),
  getByUsername: async (username) => {
    const users = await apiClient.get('/usuarios');
    return users.find(u => u.username === username);
  },
  create: (data) => apiClient.post('/usuarios', data),
  update: (id, data) => apiClient.put(`/usuarios/${id}`, data),
  getUserProjects: (id) => apiClient.get(`/usuarios/${id}/proyectos`),
};
