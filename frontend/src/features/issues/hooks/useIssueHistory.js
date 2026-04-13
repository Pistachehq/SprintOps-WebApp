import { useState, useEffect, useCallback } from 'react';
import { issueHistoryRepository } from '../../../data/repositories/issueHistoryRepository';

export const useIssueHistory = (issueId) => {
  const [history, setHistory] = useState([]);

  const load = useCallback(() => {
    if (!issueId) return;
    issueHistoryRepository.getByIssueId(issueId)
      .then(data => setHistory(data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))))
      .catch(() => setHistory([]));
  }, [issueId]);

  useEffect(() => { load(); }, [load]);

  const addHistory = async (userId, action, changes) => {
    await issueHistoryRepository.addHistory(issueId, userId, action, changes);
    load();
  };

  return { history, addHistory };
};
