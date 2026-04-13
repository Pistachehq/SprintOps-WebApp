import apiClient from '../api/apiClient';

export const issueHistoryRepository = {
  getByIssueId: (issueId) => apiClient.get(`/logs-issues/issue/${issueId}`),

  addHistory: (issueId, userId, action, changes) =>
    apiClient.post('/logs-issues', { issueId: Number(issueId), userId, action, changes }),
};
