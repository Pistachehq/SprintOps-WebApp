import { useState, useEffect, useCallback } from 'react';
import { issuesRepository } from '../../../data/repositories/issuesRepository';

export const useIssues = (sprintId, projectId) => {
  const [issues, setIssues] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      let data = [];
      if (sprintId) {
        data = await issuesRepository.getBySprintId(sprintId);
      } else if (projectId) {
        data = await issuesRepository.getByProjectId(projectId);
      } else {
        data = await issuesRepository.getAll();
      }
      setIssues((data || []).map((issue, idx) => ({ ...issue, displayIndex: idx + 1 })));
    } catch (err) {
      console.error('Error fetching issues:', err);
      setIssues([]);
    } finally {
      setIsLoading(false);
    }
  }, [sprintId, projectId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const addIssue = async (issueData) => {
    await issuesRepository.create(issueData);
    fetchData();
  };
  const updateIssue = async (id, data) => {
    await issuesRepository.update(id, data);
    fetchData();
  };
  const deleteIssue = async (id) => {
    await issuesRepository.delete(id);
    fetchData();
  };

  const moveIssue = (id, newStatus) => updateIssue(id, { status: newStatus });
  const assignIssue = (id, assigneeIds) => updateIssue(id, { assigneeIds });

  return { issues, isLoading, addIssue, updateIssue, deleteIssue, moveIssue, assignIssue, refetch: fetchData };
};
