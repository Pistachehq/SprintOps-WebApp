import { useState, useEffect } from 'react';
import { issuesRepository } from '../../../data/repositories/issuesRepository';
import { db } from '../../../data/db/dbClient';

export const useIssues = (sprintId, projectId) => {
  const [issues, setIssues] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let timeoutId;
    const fetchData = () => {
      setIsLoading(true);
      
      let data = [];
      if (sprintId) {
        data = issuesRepository.getBySprintId(sprintId);
      } else if (projectId) {
        data = issuesRepository.getByProjectId(projectId);
      } else {
        // all
        data = issuesRepository.getAll();
      }

      // Simulate network request
      timeoutId = setTimeout(() => {
        setIssues(data);
        setIsLoading(false);
      }, 500);
    };

    fetchData();
    const unsubscribe = db.subscribe(fetchData);
    return () => {
      unsubscribe();
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [sprintId, projectId]);

  const addIssue = (issueData) => issuesRepository.create(issueData);
  const updateIssue = (id, data) => issuesRepository.update(id, data);
  const deleteIssue = (id) => issuesRepository.delete(id);

  const moveIssue = (id, newStatus) => updateIssue(id, { status: newStatus });
  const assignIssue = (id, assigneeIds) => updateIssue(id, { assigneeIds });

  return { issues, isLoading, addIssue, updateIssue, deleteIssue, moveIssue, assignIssue };
};
