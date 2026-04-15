import React, { useState, useMemo } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import ProjectGrid from './ProjectGrid';
import ProjectSidebar from './ProjectSidebar';
import CreateProjectModal from './CreateProjectModal';
import JoinProjectModal from '../../components/ui/JoinProjectModal';
import { useAuth } from '../auth/hooks/useAuth';
import { useProjects } from '../project/hooks/useProjects';
import { projectsRepository } from '../../data/repositories/projectsRepository';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';

const HomePage = () => {
  const [selectedProject, setSelectedProject] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const navigate = useNavigate();
  const { user, checkPermission } = useAuth();
  const { projects, isLoading, addProject, refetch } = useProjects(user?.id);
  const { searchQuery } = useOutletContext() || {};

  const canCreate = true; // All users can create projects

  // Filter projects based on search query
  const filteredProjects = useMemo(() => {
    if (!searchQuery) return projects;
    return projects.filter(project => 
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [projects, searchQuery]);

  const handleSelectProject = (project) => {
    setSelectedProject(project);
  };

  const handleViewSprints = () => {
    if (selectedProject) {
      navigate(`/project/${selectedProject.id}/sprints`);
    }
  };

  const handleCreateProject = async (newProject) => {
    return await addProject(newProject);
  };

  const handleJoinProject = async (code) => {
    try {
      const project = await projectsRepository.getByCodigo(code);
      if (project) {
        await projectsRepository.joinProject(project.id, user.id);
        alert(`¡Te has unido al proyecto ${project.name} exitosamente!`);
        refetch();
      } else {
        alert('No se encontró proyecto con ese código');
      }
    } catch (err) {
      alert(err.message || 'No se encontró proyecto con ese código');
    }
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-oracle-bg p-10">
      <div className="max-w-7xl mx-auto w-full flex flex-col flex-1 min-h-0">
        <header className="flex justify-between items-center gap-4 mb-6 shrink-0">
          <h1 className="text-4xl font-black text-gray-800">Proyectos</h1>
          <div className="flex gap-3 shrink-0">
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

        <div
          className="flex-1 min-h-0 overflow-y-auto overscroll-contain pr-1 pb-2"
          style={{ scrollbarWidth: 'thin' }}
        >
          {isLoading ? (
            <div className="flex justify-center py-16">
              <LoadingSpinner label="Cargando proyectos..." />
            </div>
          ) : filteredProjects.length === 0 ? (
            <EmptyState 
              title={searchQuery ? "No se encontraron proyectos" : "Aún no tienes proyectos"}
              description={searchQuery ? "Prueba con otro término de búsqueda." : "Crea un nuevo proyecto para comenzar a organizar tus Sprints."}
              actionButton={
                !searchQuery && canCreate && (
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
            <ProjectGrid
              projects={filteredProjects}
              onSelect={handleSelectProject}
              userId={user?.id}
              onCoverUpdated={refetch}
            />
          )}
        </div>
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

