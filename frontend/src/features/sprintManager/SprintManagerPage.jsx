import React, { useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import BackButton from '../../components/ui/BackButton';
import SprintFlow from './SprintFlow';
import StandupSidebar from './StandupSidebar';
import { sprintsRepository } from '../../data/repositories/sprintsRepository';

const SprintManagerPage = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [isStandupOpen, setIsStandupOpen] = useState(false);
  
  // Get sprint details to find the projectId
  const sprint = sprintsRepository.getById(id);
  const projectId = sprint?.projectId || 'p1'; // Fallback to p1 if not found
  
  // Use project name from state or fallback
  const projectName = location.state?.project?.name || "Gestor de Proyectos";

  return (
    <div className="h-full bg-[#F0EFED] flex flex-col items-center py-12 px-10 relative overflow-hidden">
      <div className="absolute top-10 left-10">
        <BackButton to={`/project/${projectId}/sprints`} />
      </div>

      <h1 className="text-[52px] font-black text-gray-800 mb-20 tracking-tight">
        Product BackLog (Issues)
      </h1>

      <div className="w-full max-w-6xl flex-1 flex justify-center items-center">
        <SprintFlow sprintId={id} />
      </div>

      <div className="mt-8 mb-4 text-center">
        <p className="text-gray-400 text-sm font-bold uppercase tracking-widest mb-1">Nombre del Proyecto:</p>
        <p className="text-[28px] font-black text-gray-800">{projectName}</p>
      </div>

      {/* Standup Trigger (Right side vertical button) */}
      <button 
        onClick={() => setIsStandupOpen(true)}
        className="fixed right-0 top-1/2 -translate-y-1/2 h-[300px] w-[60px] bg-gray-400/50 hover:bg-gray-500/50 backdrop-blur-md rounded-l-[30px] flex items-center justify-center transition-all group z-30"
      >
        <span className="rotate-90 whitespace-nowrap text-gray-800 font-bold text-lg tracking-wider group-hover:text-black transition-colors">
          Daily Standup Meeting
        </span>
      </button>

      <StandupSidebar 
        isOpen={isStandupOpen} 
        onClose={() => setIsStandupOpen(false)} 
      />
    </div>
  );
};

export default SprintManagerPage;
