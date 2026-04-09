import React from 'react';
import { useParams, Navigate } from 'react-router-dom';

const ProjectPage = () => {
  const { projectId } = useParams();

  if (!projectId) return <Navigate to="/home" replace />;
  
  return <Navigate to={`/project/${projectId}/sprints`} replace />;
};

export default ProjectPage;
