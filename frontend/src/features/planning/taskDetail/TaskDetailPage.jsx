import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Pencil, RotateCcw, ArrowRightLeft, Trash2, ArchiveRestore, Clock } from 'lucide-react';
import BackButton from '../../../components/ui/BackButton';
import TaskInfoCard from './TaskInfoCard';
import { useIssues } from '../../issues/hooks/useIssues';
import { useIssueHistory } from '../../issues/hooks/useIssueHistory';
import { useAuth } from '../../auth/hooks/useAuth';
import CreateIssueModal from '../../issues/CreateIssueModal';
import { projectsRepository } from '../../../data/repositories/projectsRepository';
import { sprintsRepository } from '../../../data/repositories/sprintsRepository';

const TaskDetailPage = () => {
  const { sprintId, taskId } = useParams();
  const navigate = useNavigate();
  const { user, checkPermission, refreshPermissionsForProject } = useAuth();
  const role = user?.role || 'developer';
  const canEditIssue = checkPermission('canEditIssue');
  const { issues, updateIssue, assignIssue } = useIssues(sprintId);
  const { history, addHistory } = useIssueHistory(taskId);
  
  const [showEditModal, setShowEditModal] = useState(false);
  const [members, setMembers] = useState([]);

  const task = issues.find(t => String(t.id) === String(taskId));

  // Load permissions based on the user's role in this sprint's project
  useEffect(() => {
    sprintsRepository.getById(sprintId).then(sprint => {
      if (sprint?.projectId) {
        refreshPermissionsForProject(sprint.projectId);
      }
    }).catch(() => {});
  }, [sprintId]);

  useEffect(() => {
    if (task?.projectId) {
      projectsRepository.getMembers(task.projectId).then(m => setMembers(m || [])).catch(() => {});
    }
  }, [task?.projectId]);

  const getHistoryIcon = (action) => {
    const lower = (action || '').toLowerCase();
    if (lower.includes('editó') || lower.includes('edito'))
      return { icon: Pencil, bg: 'bg-blue-500' };
    if (lower.includes('estado') || lower.includes('movido'))
      return { icon: ArrowRightLeft, bg: 'bg-amber-500' };
    if (lower.includes('papelera') && lower.includes('restaurado'))
      return { icon: ArchiveRestore, bg: 'bg-[#446E51]' };
    if (lower.includes('papelera') || lower.includes('eliminado'))
      return { icon: Trash2, bg: 'bg-red-500' };
    return { icon: Clock, bg: 'bg-gray-500' };
  };

  if (!task) {
    return (
      <div className="h-full bg-[#F0EFED] flex flex-col items-center justify-center p-10 text-center">
        <h2 className="text-2xl font-bold text-slate-800 mb-4">Tarea no encontrada</h2>
        <button 
          onClick={() => navigate(-1)}
          className="bg-[#446E51] text-white px-6 py-2 rounded-xl font-bold hover:opacity-90 transition-colors"
        >
          Volver a Planeación
        </button>
      </div>
    );
  }

  const handleEditIssue = async (id, updatedData) => {
    // Build detailed change description by comparing old vs new
    const fieldLabels = {
      title: 'Título',
      purpose: 'Propósito',
      description: 'Descripción',
      priority: 'Prioridad',
      type: 'Tipo',
      storyPoints: 'Story Points',
      status: 'Estado',
      tagLabel: 'Etiqueta',
      tagColor: 'Color de etiqueta',
    };

    const changedFields = [];
    for (const key of Object.keys(fieldLabels)) {
      const oldVal = task[key];
      const newVal = updatedData[key];
      if (newVal !== undefined && String(oldVal || '') !== String(newVal || '')) {
        changedFields.push(fieldLabels[key]);
      }
    }

    updateIssue(id, updatedData);

    const changesText = changedFields.length > 0
      ? `Se modificó: ${changedFields.join(', ')} — por ${user?.username || 'developer'}`
      : `Edición sin cambios detectados — por ${user?.username || 'developer'}`;

    await addHistory(user?.id || 'Sistema', 'Editó Tarea', changesText);
  };

  return (
    <div className="h-full bg-[#F0EFED] flex flex-col font-sans p-10 overflow-y-auto">
      {/* Header: Back + Title */}
      <div className="max-w-6xl mx-auto w-full">
        <div className="mb-4 mt-4 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 flex-1 items-start gap-6">
            <BackButton />
            <div className="min-w-0">
              <p className="mb-1 text-xs font-bold uppercase tracking-widest text-[#446E51]">
                Sprint {sprintId} · Tarea #{task.displayIndex || task.id}
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="min-w-0 text-4xl font-black text-slate-900 lg:text-5xl">{task.title}</h1>
                {task.tagLabel && task.tagColor && (
                  <span
                    className="max-w-full shrink-0 truncate rounded-lg px-3 py-1.5 text-sm font-bold text-white shadow-md sm:max-w-xs sm:text-base"
                    style={{ backgroundColor: task.tagColor }}
                  >
                    {task.tagLabel}
                  </span>
                )}
              </div>
              <p className="mt-2 text-sm font-medium text-slate-500">
                <span className="font-black text-slate-700">{task.storyPoints ?? 0}</span> story points
              </p>
            </div>
          </div>
          {canEditIssue && (
            <div className="flex shrink-0 sm:pt-1">
              <button
                type="button"
                onClick={() => setShowEditModal(true)}
                className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 font-bold text-slate-700 transition-colors hover:bg-gray-50 lg:self-start"
              >
                <Pencil size={18} /> Editar Tarea
              </button>
            </div>
          )}
        </div>

        <p className="text-sm text-gray-400 font-medium ml-14 mb-10">
          Revisa los detalles de esta tarea, su propósito dentro del sprint, la descripción técnica y los miembros del equipo asignados.
        </p>

        {/* Info Card */}
        <TaskInfoCard task={task} role={role} members={members} onAssign={assignIssue} />

        {/* History Section - Always visible below */}
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 mt-8 flex flex-col min-h-0">
          <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2 shrink-0">
            <RotateCcw size={18} className="text-[#446E51]" /> Historial de Modificaciones
          </h3>
          {history.length > 0 ? (
            <div
              className="space-y-4 overflow-y-auto max-h-[min(55vh,24rem)] pr-1 -mr-0.5"
              style={{ scrollbarWidth: 'thin' }}
            >
              {history.map((record, i) => {
                const { icon: Icon, bg } = getHistoryIcon(record.action);
                return (
                <div key={i} className="flex items-start gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full text-white shrink-0 shadow ${bg}`}>
                    <Icon size={16} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-slate-900 text-sm">{record.action}</span>
                      <time className="text-xs text-slate-400 font-medium">{new Date(record.createdAt).toLocaleString()}</time>
                    </div>
                    <p className="text-sm text-slate-500">{record.changes}</p>
                  </div>
                </div>
                );
              })}
            </div>
          ) : (
            <p className="text-slate-400 italic text-center py-6 font-medium">No hay modificaciones recientes en esta tarea.</p>
          )}
        </div>
      </div>

      <CreateIssueModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onEdit={handleEditIssue}
        issue={task}
        sprintIssues={issues}
      />
    </div>
  );
};

export default TaskDetailPage;
