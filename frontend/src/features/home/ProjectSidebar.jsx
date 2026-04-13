import React, { useEffect, useState, useMemo } from 'react';
import { X, ExternalLink, Users, Layers, ListTodo } from 'lucide-react';
import { useAuth } from '../auth/hooks/useAuth';
import { sprintsRepository } from '../../data/repositories/sprintsRepository';
import { issuesRepository } from '../../data/repositories/issuesRepository';
import { projectsRepository } from '../../data/repositories/projectsRepository';

const ProjectSidebar = ({ project, onClose, onViewSprints }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [displayProject, setDisplayProject] = useState(null);
  const { user } = useAuth();
  const [stats, setStats] = useState({
    progress: 0,
    sprintCount: 0,
    issuesTotal: 0,
  });
  const [members, setMembers] = useState([]);

  const creatorMember = useMemo(() => {
    const cid = displayProject?.creadorId;
    if (cid == null) return null;
    return members.find((m) => Number(m.userId) === Number(cid)) ?? null;
  }, [members, displayProject?.creadorId]);

  const showCreatorSection =
    creatorMember != null ||
    (displayProject?.creadorName && String(displayProject.creadorName).trim());

  useEffect(() => {
    if (project) {
      setDisplayProject(project);
      const timer = setTimeout(() => setIsOpen(true), 10);
      return () => clearTimeout(timer);
    } else {
      setIsOpen(false);
      const timer = setTimeout(() => setDisplayProject(null), 300);
      return () => clearTimeout(timer);
    }
  }, [project]);

  useEffect(() => {
    if (!project?.id) return;
    const loadStats = async () => {
      try {
        const [sprints, memberList] = await Promise.all([
          sprintsRepository.getByProjectId(project.id),
          projectsRepository.getMembers(project.id).catch(() => []),
        ]);
        setMembers(memberList || []);

        const allIssues = (await Promise.all(
          sprints.map(s => issuesRepository.getBySprintId(s.id))
        )).flat();

        const issuesTotal = allIssues.length;
        const sprintCount = sprints.length;

        const role = user?.role || 'developer';
        const relevant = role === 'developer'
          ? allIssues.filter(i => i.assigneeIds?.includes(user?.id))
          : allIssues;

        const total = relevant.length;
        const completed = relevant.filter(i => i.status === 'done').length;
        const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

        setStats({ progress, sprintCount, issuesTotal });
      } catch {
        setStats({
          progress: 0,
          sprintCount: 0,
          issuesTotal: 0,
        });
        setMembers([]);
      }
    };
    loadStats();
  }, [project?.id, user?.id, user?.role]);

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
        <div className="flex items-start justify-between gap-3 mb-4">
          <h2 className="text-xl font-bold text-gray-800 leading-tight">Detalles del Proyecto</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors shrink-0">
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        {displayProject?.name && (
          <p className="text-lg font-black text-gray-900 leading-snug mb-5 pr-8 -mt-1">
            {displayProject.name}
          </p>
        )}

        <div className="flex-1 overflow-y-auto space-y-8 pr-2 min-h-0">
          {/* Description */}
          <div className="space-y-2">
            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Descripción</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              {displayProject?.description?.trim()
                ? displayProject.description
                : 'Sin descripción registrada.'}
            </p>
          </div>

          {/* Quick stats: sprints, issues, team */}
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-xl bg-[#446E51]/8 border border-[#446E51]/15 p-3 text-center">
              <Layers size={16} className="text-[#446E51] mx-auto mb-1.5" />
              <p className="text-lg font-black text-gray-800">{stats.sprintCount}</p>
              <p className="text-[9px] font-bold text-gray-500 uppercase tracking-wide">Sprints</p>
            </div>
            <div className="rounded-xl bg-[#446E51]/8 border border-[#446E51]/15 p-3 text-center">
              <ListTodo size={16} className="text-[#446E51] mx-auto mb-1.5" />
              <p className="text-lg font-black text-gray-800">{stats.issuesTotal}</p>
              <p className="text-[9px] font-bold text-gray-500 uppercase tracking-wide">Issues</p>
            </div>
            <div className="rounded-xl bg-[#446E51]/8 border border-[#446E51]/15 p-3 text-center">
              <Users size={16} className="text-[#446E51] mx-auto mb-1.5" />
              <p className="text-lg font-black text-gray-800">{members.length}</p>
              <p className="text-[9px] font-bold text-gray-500 uppercase tracking-wide">Equipo</p>
            </div>
          </div>

          {showCreatorSection && (
            <div className="space-y-2">
              <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                Creador del proyecto
              </h3>
              <div className="flex items-center justify-between gap-2 p-3 bg-gray-50 rounded-xl text-sm text-gray-700">
                <span className="font-semibold truncate min-w-0">
                  {creatorMember?.name?.trim() || displayProject?.creadorName?.trim() || '—'}
                </span>
                {creatorMember?.role && (
                  <span className="text-[10px] font-bold text-[#446E51] uppercase shrink-0 bg-[#446E51]/10 px-2 py-0.5 rounded">
                    {creatorMember.role}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Progress Section */}
          <div>
            <div className="flex justify-between items-end mb-2">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Progreso</h3>
              <span className="text-2xl font-black text-[#446E51]">{stats.progress}%</span>
            </div>
            <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-[#446E51] rounded-full transition-all duration-1000"
                style={{ width: `${isOpen ? stats.progress : 0}%` }}
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
        </div>

        <div className="mt-auto pt-6 flex flex-col gap-3">
          <button 
            onClick={onViewSprints}
            className="w-full py-4 bg-[#446E51] text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
          >
            Gestionar proyecto <ExternalLink size={18} />
          </button>
        </div>
      </div>
    </>
  );
};

export default ProjectSidebar;
