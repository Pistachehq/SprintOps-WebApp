import apiClient from '../api/apiClient';
import { API_BASE } from '../api/apiClient';

/** Fotos del daily en el calendario del proyecto (URLs bajo /api). */
export const timelineRepository = {
  getPhotoUrl: (projectId, fecha) =>
    `${API_BASE}/proyectos/${projectId}/timeline/foto/${encodeURIComponent(fecha)}`,

  getPhotoDates: (projectId) => apiClient.get(`/proyectos/${projectId}/timeline/fotos`),

  uploadPhoto: (projectId, formData) =>
    apiClient.upload(`/proyectos/${projectId}/timeline/foto`, formData),

  deletePhoto: (projectId, fecha, userId) => {
    const q = userId != null ? `?userId=${encodeURIComponent(userId)}` : '';
    return apiClient.delete(`/proyectos/${projectId}/timeline/foto/${encodeURIComponent(fecha)}${q}`);
  },
};
