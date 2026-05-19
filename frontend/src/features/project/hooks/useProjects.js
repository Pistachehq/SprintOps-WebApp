import { useState, useEffect, useCallback } from 'react';
import { projectsRepository } from '../../../data/repositories/projectsRepository';
import { API_BASE } from '../../../data/api/apiClient';
import { DEFAULT_PROJECT_CARD_IMAGE } from '../defaultProjectCardImage';

function buildCardImageUrl(project) {
  if (project.cardCoverCustom) {
    const v = project.cardCoverVersion ?? 0;
    return `${API_BASE}/proyectos/${project.id}/card-cover?v=${v}`;
  }
  return DEFAULT_PROJECT_CARD_IMAGE;
}

const enrichProject = (project) => {
  return {
    ...project,
    progress: project.progress ?? 0,
    status: project.status ?? 'Active',
    start: project.start ?? '2026-04-01',
    end: project.end ?? '2026-04-30',
    tasksTotal: project.tasksTotal ?? 0,
    tasksCompleted: project.tasksCompleted ?? 0,
    tasksLate: project.tasksLate ?? 0,
    image: buildCardImageUrl(project),
    colorOverlay: project.colorOverlay ?? 'rgba(68, 110, 81, 0.7)',
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
