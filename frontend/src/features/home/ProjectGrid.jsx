import React from 'react';
import ProjectCard from '../../components/ProjectCard';

const ProjectGrid = ({ projects, onSelect }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
      {projects.map((project) => (
        <ProjectCard 
          key={project.id} 
          project={project} 
          onSelect={onSelect} 
        />
      ))}
    </div>
  );
};

export default ProjectGrid;
