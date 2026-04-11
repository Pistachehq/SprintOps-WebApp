import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Clock, Pencil, RotateCcw } from 'lucide-react';
import BackButton from '../../../components/ui/BackButton';
import TaskInfoCard from './TaskInfoCard';
import { useIssues } from '../../issues/hooks/useIssues';
import { useIssueHistory } from '../../issues/hooks/useIssueHistory';
import { useAuth } from '../../auth/hooks/useAuth';
import CreateIssueModal from '../../issues/CreateIssueModal';
import { projectsRepository } from '../../../data/repositories/projectsRepository';

const TaskDetailPage = () => {
  const { sprintId, taskId } = useParams();
  const navigate = useNavigate();
  const { user, checkPermission } = useAuth();
  const role = user?.role || 'developer';
  const canEditIssue = checkPermission('canEditIssue');
  const { issues, updateIssue, assignIssue } = useIssues(sprintId);
  const { history, addHistory } = useIssueHistory(taskId);
  
  const [showEditModal, setShowEditModal] = useState(false);
  const [members, setMembers] = useState([]);

  const task = issues.find(t => String(t.id) === String(taskId));

  useEffect(() => {
    if (task?.projectId) {
      projectsRepository.getMembers(task.projectId).then(m => setMembers(m || [])).catch(() => {});
    }
  }, [task?.projectId]);

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
      status: 'Estado'
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
        <div className="flex items-center justify-between mb-4 mt-4">
          <div className="flex items-center gap-6">
            <BackButton />
            <div>
              <p className="text-xs font-bold text-[#446E51] uppercase tracking-widest mb-1">Sprint {sprintId} · Tarea #{task.displayIndex || task.id}</p>
              <h1 className="text-4xl lg:text-5xl font-black text-slate-900">
                {task.title}
              </h1>
            </div>
          </div>
          {canEditIssue && (
            <button
              onClick={() => setShowEditModal(true)}
              className="flex items-center gap-2 bg-white border border-gray-200 text-slate-700 px-4 py-2 rounded-xl font-bold hover:bg-gray-50 transition-colors"
            >
              <Pencil size={18} /> Editar Tarea
            </button>
          )}
        </div>

        <p className="text-sm text-gray-400 font-medium ml-14 mb-10">
          Revisa los detalles de esta tarea, su propósito dentro del sprint, la descripción técnica y los miembros del equipo asignados.
        </p>

        {/* Info Card */}
        <TaskInfoCard task={task} role={role} members={members} onAssign={assignIssue} />

        {/* History Section - Always visible below */}
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 mt-8">
          <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
            <RotateCcw size={18} className="text-[#446E51]" /> Historial de Modificaciones
          </h3>
          {history.length > 0 ? (
            <div className="space-y-4">
              {history.map((record, i) => (
                <div key={i} className="flex items-start gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[#446E51] text-white shrink-0 shadow">
                    <Clock size={16} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-slate-900 text-sm">{record.action}</span>
                      <time className="text-xs text-slate-400 font-medium">{new Date(record.createdAt).toLocaleString()}</time>
                    </div>
                    <p className="text-sm text-slate-500">{record.changes}</p>
                  </div>
                </div>
              ))}
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
