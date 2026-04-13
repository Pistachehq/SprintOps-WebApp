import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ListTodo, LayoutDashboard, RotateCcw, ChevronRight } from 'lucide-react';
import SprintBlock from './SprintBlock';

const SprintFlow = ({ sprintId, progress = 0 }) => {
  const navigate = useNavigate();

  const statusLabel = progress === 100 ? 'Completado' : 'En Progreso';

  return (
    <div className="flex items-center gap-5 sm:gap-6 py-2">
      <SprintBlock 
        label="Planeación" 
        vertical 
        onClick={() => navigate(`/sprint/${sprintId}/planning`)}
      />
      
      <div className="flex items-center justify-center shrink-0">
        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-[#446E51] shadow-lg border border-gray-100 group">
          <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
        </div>
      </div>

      <SprintBlock 
        label="Product Backlog" 
        isMain
        icon={LayoutDashboard}
        stats={`${statusLabel} — ${progress}% completado`}
        progress={progress}
        onClick={() => navigate(`/sprint/${sprintId}/issues`)}
      />

      <div className="flex items-center justify-center shrink-0">
        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-[#446E51] shadow-lg border border-gray-100 group">
          <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
        </div>
      </div>

      <SprintBlock 
        label="Reflexión" 
        vertical 
        onClick={() => navigate(`/sprint/${sprintId}/reflection`)}
      />
    </div>
  );
};

export default SprintFlow;
