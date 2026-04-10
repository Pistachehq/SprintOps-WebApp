import { useState, useEffect } from 'react';
import { projectsRepository } from '../../../data/repositories/projectsRepository';
import { db } from '../../../data/db/dbClient';

const enrichProject = (project) => {
  return {
    ...project,
    progress: project.progress ?? 0,
    status: project.status ?? "Active",
    start: project.start ?? '2026-04-01',
    end: project.end ?? '2026-04-30',
    tasksTotal: project.tasksTotal ?? 0,
    tasksCompleted: project.tasksCompleted ?? 0,
    tasksLate: project.tasksLate ?? 0,
    image: project.image ?? "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=800",
    colorOverlay: project.colorOverlay ?? "rgba(68, 110, 81, 0.7)"
  };
};

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

      const enrichedData = data.map(enrichProject);

      timeoutId = setTimeout(() => {
        setProjects(enrichedData);
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

  const getProject = (id) => {
    const project = projectsRepository.getById(id);
    return project ? enrichProject(project) : null;
  };

  return { projects, isLoading, addProject, getProject };
};
