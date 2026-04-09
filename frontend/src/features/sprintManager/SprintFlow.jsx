import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ListTodo, LayoutDashboard, RotateCcw, ChevronRight } from 'lucide-react';
import SprintBlock from './SprintBlock';

const SprintFlow = ({ sprintId }) => {
  const navigate = useNavigate();

  return (
    <div className="flex items-center gap-10">
      <SprintBlock 
        label="Planeación" 
        vertical 
        onClick={() => navigate(`/sprint/${sprintId}/planning`)}
      />
      
      <div className="flex items-center justify-center">
        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-[#446E51] shadow-lg border border-gray-100 group">
          <ChevronRight size={24} className="group-hover:translate-x-1 transition-transform" />
        </div>
      </div>

      <SprintBlock 
        label="Product Backlog" 
        isMain
        icon={LayoutDashboard}
        stats="En Progreso — 65% completado"
        onClick={() => navigate(`/sprint/${sprintId}/issues`)}
      />

      <div className="flex items-center justify-center">
        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-[#446E51] shadow-lg border border-gray-100 group">
          <ChevronRight size={24} className="group-hover:translate-x-1 transition-transform" />
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
