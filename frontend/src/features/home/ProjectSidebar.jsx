import React, { useEffect, useState } from 'react';
import { X, ExternalLink } from 'lucide-react';
import { useAuth } from '../auth/hooks/useAuth';

const ProjectSidebar = ({ project, onClose, onViewSprints }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [displayProject, setDisplayProject] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    if (project) {
      setDisplayProject(project);
      // Small delay to ensure the component is in the DOM before animating
      const timer = setTimeout(() => setIsOpen(true), 10);
      return () => clearTimeout(timer);
    } else {
      setIsOpen(false);
      const timer = setTimeout(() => setDisplayProject(null), 300);
      return () => clearTimeout(timer);
    }
  }, [project]);

  if (!displayProject && !isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        className={`fixed inset-0 bg-black/20 z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />
      
      <div 
        className={`fixed inset-y-0 right-0 w-[350px] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out border-l border-gray-100 p-8 flex flex-col ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl font-bold text-gray-800">Detalles del Proyecto</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-8 pr-2">
          {/* Progress Section */}
          <div>
            <div className="flex justify-between items-end mb-2">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Progreso</h3>
              <span className="text-2xl font-black text-[#446E51]">{displayProject?.progress}%</span>
            </div>
            <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-[#446E51] rounded-full transition-all duration-1000"
                style={{ width: `${isOpen ? displayProject?.progress : 0}%` }}
              />
            </div>
          </div>

          {/* Dates Section */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-[10px] text-gray-400 font-bold uppercase">Fecha Inicio</p>
              <p className="text-sm font-bold text-gray-700">{displayProject?.start}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] text-gray-400 font-bold uppercase">Fecha Fin</p>
              <p className="text-sm font-bold text-gray-700">{displayProject?.end}</p>
            </div>
          </div>

          {/* Tasks Summary */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b pb-2">Resumen de Tareas</h3>
            
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <span className="text-sm font-medium text-gray-600">Totales</span>
              </div>
              <span className="font-bold text-gray-800">{displayProject?.tasksTotal}</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-sm font-medium text-gray-600">Completados</span>
              </div>
              <span className="font-bold text-gray-800">{displayProject?.tasksCompleted}</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-red-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-red-500" />
                <span className="text-sm font-medium text-gray-600">Retrasadas</span>
              </div>
              <span className="font-bold text-gray-800">{displayProject?.tasksLate}</span>
            </div>
          </div>
        </div>

        <div className="mt-auto pt-6 flex flex-col gap-3">
          <button 
            onClick={onViewSprints}
            className="w-full py-4 bg-[#446E51] text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity shadow-lg shadow-green-100"
          >
            Gestionar Sprints <ExternalLink size={18} />
          </button>
        </div>
      </div>
    </>
  );
};

export default ProjectSidebar;
