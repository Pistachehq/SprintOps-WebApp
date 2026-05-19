import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import BackButton from '../../components/ui/BackButton';
import SprintFlow from './SprintFlow';
import StandupSidebar from './StandupSidebar';
import TrashModal from '../planning/TrashModal';
import { sprintsRepository } from '../../data/repositories/sprintsRepository';
import { projectsRepository } from '../../data/repositories/projectsRepository';
import { useIssues } from '../issues/hooks/useIssues';
import { useAuth } from '../auth/hooks/useAuth';

const SprintManagerPage = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isStandupOpen, setIsStandupOpen] = useState(false);
  const [isTrashOpen, setIsTrashOpen] = useState(false);
  const [sprint, setSprint] = useState(null);
  const [projectName, setProjectName] = useState('Cargando...');
  const { issues, refetch } = useIssues(id);
  
  useEffect(() => {
    sprintsRepository.getById(id).then(s => {
      setSprint(s);
      if (s?.projectId) {
        projectsRepository.getById(s.projectId).then(p => setProjectName(p.name)).catch(() => {});
      }
    }).catch(() => {});
  }, [id]);

  const projectId = sprint?.projectId || location.state?.project?.id || 'p1';

  // Calculate progress based on role
  const role = user?.role || 'developer';
  const isDev = role === 'developer';
  const relevantIssues = isDev
    ? issues.filter(i => i.assigneeIds?.includes(user?.id))
    : issues;
  const totalIssues = relevantIssues.length;
  const doneIssues = relevantIssues.filter(i => i.status === 'done').length;
  const progress = totalIssues > 0 ? Math.round((doneIssues / totalIssues) * 100) : 0;

  return (
    <div className="h-full bg-[#F0EFED] flex flex-col items-center py-6 px-10 relative overflow-x-hidden overflow-y-auto min-h-0">
      <div className="absolute top-10 left-10">
        <BackButton to={`/project/${projectId}/sprints`} />
      </div>

      <button
        onClick={() => setIsTrashOpen(true)}
        className="absolute top-10 right-24 flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-slate-600 font-bold text-sm hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all shadow-sm"
        title="Papelera del Sprint"
      >
        <Trash2 size={18} /> Papelera
      </button>

      <h1 className="text-[52px] font-black text-gray-800 mb-5 tracking-tight shrink-0">
        {sprint?.name || 'Cargando...'}
      </h1>

      <div className="w-full max-w-[1100px] flex-1 flex justify-center items-start px-2 py-5 overflow-visible min-h-0">
        <SprintFlow sprintId={id} progress={progress} />
      </div>

      <div className="mt-4 mb-3 text-center shrink-0">
        <p className="text-gray-400 text-sm font-bold uppercase tracking-widest mb-1">Nombre del Proyecto:</p>
        <p className="text-[28px] font-black text-gray-800">{projectName}</p>
      </div>

      {/* Standup Trigger (Right side vertical button) */}
      <button 
        onClick={() => setIsStandupOpen(true)}
        className="fixed right-0 top-1/2 -translate-y-1/2 h-[300px] w-[60px] bg-gray-400/50 hover:bg-gray-500/50 backdrop-blur-md rounded-l-[30px] flex items-center justify-center transition-all group z-30"
      >
        <span className="-rotate-90 whitespace-nowrap text-gray-800 font-bold text-lg tracking-wider group-hover:text-black transition-colors">
          Daily Meeting
        </span>
      </button>

      <StandupSidebar
        isOpen={isStandupOpen}
        onClose={() => setIsStandupOpen(false)}
        sprintId={id}
        userId={user?.id}
        projectId={sprint?.projectId}
      />

      <TrashModal
        isOpen={isTrashOpen}
        onClose={() => setIsTrashOpen(false)}
        sprintId={id}
        onRestored={refetch}
      />
    </div>
  );
};

export default SprintManagerPage;
