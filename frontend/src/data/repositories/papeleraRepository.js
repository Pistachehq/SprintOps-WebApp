import apiClient from '../api/apiClient';

export const papeleraRepository = {
  getBySprint: (sprintId) => apiClient.get(`/papelera/sprint/${sprintId}`),
  restore: (id) => apiClient.post(`/papelera/restore/${id}`),
  deletePermanently: (id) => apiClient.delete(`/papelera/${id}`),
};
