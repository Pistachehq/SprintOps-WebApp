import { useState, useEffect, useCallback } from 'react';
import { sprintsRepository } from '../../../data/repositories/sprintsRepository';

export const useSprints = (projectId) => {
  const [sprints, setSprints] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      let data = [];
      if (projectId) {
        data = await sprintsRepository.getByProjectId(projectId);
      } else {
        data = await sprintsRepository.getAll();
      }
      setSprints(data || []);
    } catch (err) {
      console.error('Error fetching sprints:', err);
      setSprints([]);
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const addSprint = async (sprintData) => {
    await sprintsRepository.create({ ...sprintData, projectId });
    fetchData();
  };

  const getSprint = (id) => sprintsRepository.getById(id);

  const updateSprint = async (id, data) => {
    await sprintsRepository.update(id, data);
    fetchData();
  };

  return { sprints, isLoading, addSprint, getSprint, updateSprint, refetch: fetchData };
};
