import { useState, useEffect } from 'react';
import { sprintsRepository } from '../../../data/repositories/sprintsRepository';
import { db } from '../../../data/db/dbClient';

export const useSprints = (projectId) => {
  const [sprints, setSprints] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let timeoutId;
    const fetchData = () => {
      setIsLoading(true);
      let data = [];
      if (projectId) {
        data = sprintsRepository.getByProjectId(projectId) || [];
      } else {
        data = sprintsRepository.getAll() || [];
      }

      timeoutId = setTimeout(() => {
        setSprints(data);
        setIsLoading(false);
      }, 500);
    };

    fetchData();
    const unsubscribe = db.subscribe(fetchData);
    return () => {
      unsubscribe();
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [projectId]);

  const addSprint = (sprintData) => {
    sprintsRepository.create({ ...sprintData, projectId });
  };

  const getSprint = (id) => sprintsRepository.getById(id);

  const updateSprint = (id, data) => sprintsRepository.update(id, data);

  return { sprints, isLoading, addSprint, getSprint, updateSprint };
};
