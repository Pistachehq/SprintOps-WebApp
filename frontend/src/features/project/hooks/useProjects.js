import { useState, useEffect } from 'react';
import { projectsRepository } from '../../../data/repositories/projectsRepository';
import { db } from '../../../data/db/dbClient';

export const useProjects = (userId) => {
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let timeoutId;
    const fetchData = () => {
      setIsLoading(true);
      let data = [];
      if (userId) {
        data = projectsRepository.getByUserId(userId);
      } else {
        data = projectsRepository.getAll();
      }

      timeoutId = setTimeout(() => {
        setProjects(data);
        setIsLoading(false);
      }, 500);
    };

    fetchData();
    const unsubscribe = db.subscribe(fetchData);
    return () => {
      unsubscribe();
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [userId]);

  const addProject = (projectData) => {
    projectsRepository.create({ ...projectData, ownerId: userId });
  };

  const getProject = (id) => projectsRepository.getById(id);

  return { projects, isLoading, addProject, getProject };
};
