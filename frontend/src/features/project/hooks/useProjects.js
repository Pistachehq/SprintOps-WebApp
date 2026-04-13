import { useState, useEffect, useCallback } from 'react';
import { projectsRepository } from '../../../data/repositories/projectsRepository';

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
    colorOverlay: project.colorOverlay ?? "rgba(103, 191, 161, 0.7)"
  };
};

export const useProjects = (userId) => {
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      let data = [];
      if (userId) {
        data = await projectsRepository.getByUserId(userId);
      } else {
        data = await projectsRepository.getAll();
      }
      setProjects((data || []).map(enrichProject));
    } catch (err) {
      console.error('Error fetching projects:', err);
      setProjects([]);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const addProject = async (projectData) => {
    const result = await projectsRepository.create({ ...projectData, ownerId: userId });
    fetchData();
    return result;
  };

  const getProject = async (id) => {
    const project = await projectsRepository.getById(id);
    return project ? enrichProject(project) : null;
  };

  return { projects, isLoading, addProject, getProject, refetch: fetchData };
};
