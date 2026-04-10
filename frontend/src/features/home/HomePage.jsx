import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ProjectGrid from './ProjectGrid';
import ProjectSidebar from './ProjectSidebar';
import CreateProjectModal from './CreateProjectModal';
import JoinProjectModal from '../../components/ui/JoinProjectModal';
import { useAuth } from '../auth/hooks/useAuth';
import { useProjects } from '../project/hooks/useProjects';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';

const HomePage = () => {
  const [selectedProject, setSelectedProject] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const navigate = useNavigate();
  const { user, checkPermission } = useAuth();
  const { projects, isLoading, addProject } = useProjects(user?.id);

  const canCreate = checkPermission('canCreateProject');

  const handleSelectProject = (project) => {
    setSelectedProject(project);
  };

  const handleViewSprints = () => {
    if (selectedProject) {
      navigate(`/project/${selectedProject.id}/sprints`);
    }
  };

  const handleCreateProject = (newProject) => {
    const projectToCreate = {
      ...newProject,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: "active"
    };
    addProject(projectToCreate);
  };

  const handleJoinProject = (code) => {
    // Find project by code and join
    const project = projects.find(p => p.codigo === code);
    if (project) {
      // Simulate joining - in real app this would update backend
      alert(`¡Te has unido al proyecto ${project.name} exitosamente!`);
      // Could also navigate to project or refresh projects list
    } else {
      alert('No se encontró proyecto con ese código');
    }
  };

  return (
    <div className="min-h-screen bg-oracle-bg p-10">
      <div className="max-w-7xl mx-auto">
        <header className="flex justify-between items-center mb-10">
          <h1 className="text-4xl font-black text-gray-800">Proyectos</h1>
          <div className="flex gap-3">
            {canCreate && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-6 py-3 bg-oracle-main text-white rounded-xl font-bold text-sm hover:opacity-90 transition-opacity flex items-center gap-2"
              >
                <span className="text-xl">+</span> Crear Proyecto
              </button>
            )}
            <button
              onClick={() => setShowJoinModal(true)}
              className="px-6 py-3 bg-white text-oracle-main border border-oracle-main rounded-xl font-bold text-sm hover:bg-green-50 transition-colors flex items-center gap-2"
            >
              <span className="text-xl">+</span> Unirse a Proyecto
            </button>
          </div>
        </header>

        {isLoading ? (
          <LoadingSpinner label="Cargando proyectos..." />
        ) : projects.length === 0 ? (
          <EmptyState 
            title="Aún no tienes proyectos"
            description="Crea un nuevo proyecto para comenzar a organizar tus Sprints."
            actionButton={
              canCreate && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-6 py-3 bg-oracle-main text-white rounded-xl font-bold text-sm hover:opacity-90 transition-opacity"
                >
                  Crear Proyecto
                </button>
              )
            }
          />
        ) : (
          <ProjectGrid projects={projects} onSelect={handleSelectProject} />
        )}
      </div>

      <ProjectSidebar
        project={selectedProject}
        onClose={() => setSelectedProject(null)}
        onViewSprints={handleViewSprints}
      />

      <CreateProjectModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={handleCreateProject}
      />

      <JoinProjectModal
        isOpen={showJoinModal}
        onClose={() => setShowJoinModal(false)}
        onJoin={handleJoinProject}
      />
    </div>
  );
};

export default HomePage;

