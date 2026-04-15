import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Settings, GitFork, CalendarDays } from 'lucide-react';
import SprintFlow from './SprintFlow';
import BackButton from '../../components/ui/BackButton';
import ProjectConfigView from '../project/ProjectConfigView';
import { useAuth } from '../auth/hooks/useAuth';
import { useSprints } from './hooks/useSprints';
import { useProjects } from '../project/hooks/useProjects';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import PistacheChatbot from './components/PistacheChatbot';

const SprintsPage = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [showConfig, setShowConfig] = useState(false);
  const [focusSprintsInConfig, setFocusSprintsInConfig] = useState(false);
  const [addedUsers, setAddedUsers] = useState([]);

  const { checkPermission, user } = useAuth();
  const { sprints, isLoading: isLoadingSprints, addSprint, updateSprint, refetch: refetchSprints } = useSprints(projectId);
  const { projects, isLoading: isLoadingProjects, refetch: refetchProjects } = useProjects();
  const isLoading = isLoadingSprints || isLoadingProjects;
  const canManageProject = checkPermission('canManageSprints');

  useEffect(() => {
    const st = location.state;
    if (!st?.openProjectConfig) return;
    setShowConfig(true);
    setFocusSprintsInConfig(Boolean(st.focusSprints));
    navigate(`${location.pathname}${location.search || ''}`, { replace: true, state: {} });
  }, [location.state, location.pathname, location.search, navigate]);

  // Find current project info
  const project = projects.find(p => String(p.id) === String(projectId)) || { name: 'Cargando Proyecto...' };

  const handleSprintClick = (sprintId) => {
    navigate(`/sprint/${sprintId}`);
  };

  return (
    <div className="relative min-h-full bg-oracle-bg flex flex-col">
      
      {/* Navigation Sub-bar */}
      <div className="h-[80px] px-10 flex items-center justify-between">
        <BackButton to="/home" />
        
        <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(`/project/${projectId}/timeline`)}
              className="px-6 py-3 bg-[#446E51] text-white rounded-xl font-bold text-sm hover:bg-[#3a5f45] transition-colors flex items-center gap-2 shadow-sm"
              title="Calendario"
            >
              <CalendarDays size={18} /> Calendario
            </button>
            <button
              onClick={() => navigate(`/project/${projectId}/universe`)}
              className="px-6 py-3 bg-[#446E51] text-white rounded-xl font-bold text-sm hover:bg-[#3a5f45] transition-colors flex items-center gap-2 shadow-sm"
              title="Universo de Issues"
            >
              <GitFork size={18} className="rotate-180" /> Universo de Issues
            </button>
            <button
              onClick={() => {
                setFocusSprintsInConfig(false);
                setShowConfig(true);
              }}
              className="px-6 py-3 bg-white text-oracle-main border border-oracle-main rounded-xl font-bold text-sm hover:bg-green-50 transition-colors flex items-center gap-2"
              title="Configurar Proyecto"
            >
              <Settings size={18} /> Configurar Proyecto
            </button>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col justify-center overflow-hidden bg-oracle-bg">
        {isLoading ? (
          <LoadingSpinner label="Cargando entorno visual..." fullPage />
        ) : sprints.length > 0 ? (
          <SprintFlow
            sprints={sprints}
            onSprintClick={handleSprintClick}
            projectId={projectId}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center w-full px-4">
            <div className="max-w-xl w-full">
              <EmptyState 
                title="No hay Sprints Planificados"
                description="Inicia la configuración de tu proyecto y agrega tu primer Sprint para comenzar."
                actionButton={
                  canManageProject && (
                    <button 
                      onClick={() => setShowConfig(true)}
                      className="px-8 py-4 bg-oracle-main text-white rounded-2xl font-bold hover:opacity-90 transition-opacity shadow-lg"
                    >
                      Configurar Sprints
                    </button>
                  )
                }
              />
            </div>
          </div>
        )}
        
        {/* Project Info Footer */}
        <div className="py-20 text-center bg-oracle-bg z-10 w-full mt-auto">
          <p className="text-sm font-medium text-slate-500 mb-1">Nombre del Proyecto:</p>
          <h2 className="text-4xl font-bold text-slate-900">{project.name}</h2>

          {/* Show added users */}
          {addedUsers.length > 0 && (
            <div className="mt-4 flex justify-center gap-2 flex-wrap">
              {addedUsers.map((u, i) => (
                <span key={i} className="bg-oracle-main text-white text-xs font-bold px-3 py-1 rounded-full">
                  {u.name} — {u.role}
                </span>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Pistache: solo en la vista principal del proyecto, no encima de Configuración */}
      {!showConfig && (
        <PistacheChatbot projectId={projectId} userId={user?.id} />
      )}

      {showConfig && (
        <ProjectConfigView
          projectId={projectId}
          project={project}
          onClose={() => {
            setShowConfig(false);
            setFocusSprintsInConfig(false);
          }}
          focusSprintsSection={focusSprintsInConfig}
          sprints={sprints}
          sprintActions={{ addSprint, updateSprint, refetchSprints }}
          onProjectUpdated={refetchProjects}
        />
      )}
    </div>
  );
};

export default SprintsPage;
