import { useState, useEffect } from 'react';
import { issueHistoryRepository } from '../../../data/repositories/issueHistoryRepository';
import { db } from '../../../data/db/dbClient';

export const useIssueHistory = (issueId) => {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    if (!issueId) return;

    const load = () => {
      setHistory(issueHistoryRepository.getByIssueId(issueId));
    };

    load();
    const unsubscribe = db.subscribe(load);
    return unsubscribe;
  }, [issueId]);

  const addHistory = (userId, action, changes) => {
    return issueHistoryRepository.addHistory(issueId, userId, action, changes);
  };

  return { history, addHistory };
};
