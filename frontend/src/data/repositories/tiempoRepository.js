import apiClient from '../api/apiClient';

export const tiempoRepository = {
  logsByIssue: (issueId) => apiClient.get(`/tiempo/issue/${issueId}`),
  registrar: (data) => apiClient.post('/tiempo', data),
};
