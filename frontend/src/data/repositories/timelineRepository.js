import apiClient, { API_BASE } from '../api/apiClient';

export const timelineRepository = {
  uploadPhoto: (projectId, formData) =>
    apiClient.upload(`/timeline/foto/${projectId}`, formData),

  getPhotoUrl: (projectId, fecha) =>
    `${API_BASE}/timeline/foto/${projectId}/${fecha}`,

  deletePhoto: (projectId, fecha) =>
    apiClient.delete(`/timeline/foto/${projectId}/${fecha}`),

  getPhotoDates: (projectId) =>
    apiClient.get(`/timeline/foto/${projectId}/dates`),
};
