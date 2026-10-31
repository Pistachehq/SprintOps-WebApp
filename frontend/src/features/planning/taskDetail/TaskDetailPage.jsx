import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Pencil, RotateCcw, ArrowRightLeft, Trash2, ArchiveRestore, Clock } from 'lucide-react';
import BackButton from '../../../components/ui/BackButton';
import TaskInfoCard from './TaskInfoCard';
import { useIssues } from '../../issues/hooks/useIssues';
import { useIssueHistory } from '../../issues/hooks/useIssueHistory';
import { useAuth } from '../../auth/hooks/useAuth';
import { projectsRepository } from '../../../data/repositories/projectsRepository';
import { sprintsRepository } from '../../../data/repositories/sprintsRepository';
import TaskTimeCard from './TaskTimeCard';
import { DEFAULT_ISSUE_TAG_COLOR, normalizeIssueTagColor } from '../../../domain/issueTagPalette';
import { normalizePriority } from '../../../domain/priority';

const draftFromTask = (task) => ({
  title: task.title || '',
  purpose: task.purpose || '',
  description: task.description || '',
  priority: normalizePriority(task.priority),
  points: task.storyPoints || 0,
  endDate: task.completedAt || '',
  isSubIssue: !!task.parentIssueId,
  parentIssueId: task.parentIssueId || '',
  useTag: !!(task.tagLabel && task.tagColor),
  tagLabel: task.tagLabel || '',
  tagColor: normalizeIssueTagColor(task.tagColor) || DEFAULT_ISSUE_TAG_COLOR,
});

const TaskDetailPage = () => {
  const { sprintId, taskId } = useParams();
  const navigate = useNavigate();
  const { user, checkPermission, refreshPermissionsForProject } = useAuth();
  const role = user?.role || 'developer';
  const canEditIssue = checkPermission('canEditIssue');
  const { issues, updateIssue, assignIssue, refetch } = useIssues(sprintId);
  const { history, addHistory } = useIssueHistory(taskId);
  
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(null);
  const [members, setMembers] = useState([]);
  const [projectMode, setProjectMode] = useState('agil');

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
      projectsRepository.getById(task.projectId)
        .then((project) => setProjectMode(project?.modo || 'agil'))
        .catch(() => setProjectMode('agil'));
    }
  }, [task?.projectId]);

  const getHistoryIcon = (action) => {
    const lower = (action || '').toLowerCase();
    if (lower.includes('editó') || lower.includes('edito'))
      return { icon: Pencil, bg: 'bg-blue-500' };
    if (lower.includes('estado') || lower.includes('movido'))
      return { icon: ArrowRightLeft, bg: 'bg-amber-500' };
    if (lower.includes('papelera') && lower.includes('restaurado'))
      return { icon: ArchiveRestore, bg: 'bg-[#67BFA1]' };
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
          className="bg-[#67BFA1] text-white px-6 py-2 rounded-xl font-bold hover:opacity-90 transition-colors"
        >
          Volver a Planeación
        </button>
      </div>
    );
  }

  const handleEditIssue = async (id, form) => {
    const tagPayload = form.useTag && form.tagLabel.trim()
      ? {
          tagLabel: form.tagLabel.trim(),
          tagColor: normalizeIssueTagColor(form.tagColor) || DEFAULT_ISSUE_TAG_COLOR,
        }
      : { tagLabel: null, tagColor: null };
    const updatedData = {
      title: form.title,
      purpose: form.purpose,
      description: form.description,
      priority: form.priority,
      storyPoints: Number(form.points) || 0,
      endDate: form.endDate || null,
      parentIssueId: form.isSubIssue && form.parentIssueId ? Number(form.parentIssueId) : null,
      assigneeIds: task.assigneeIds || [],
      status: task.status,
      ...tagPayload,
    };
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
    if (String(task.completedAt || '') !== String(updatedData.endDate || '')) {
      changedFields.push('Fecha fin');
    }
    if (String(task.parentIssueId || '') !== String(updatedData.parentIssueId || '')) {
      changedFields.push('Issue padre');
    }

    updateIssue(id, updatedData);

    const changesText = changedFields.length > 0
      ? `Se modificó: ${changedFields.join(', ')} — por ${user?.username || 'developer'}`
      : `Edición sin cambios detectados — por ${user?.username || 'developer'}`;

    await addHistory(user?.id || 'Sistema', 'Editó Tarea', changesText);
    setEditing(false);
    setDraft(null);
  };

  return (
    <div className="h-full bg-[#F0EFED] flex flex-col font-sans p-10 overflow-y-auto">
      {/* Header: Back + Title */}
      <div className="max-w-6xl mx-auto w-full">
        <div className="mb-4 mt-4 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 flex-1 items-start gap-6">
            <BackButton />
            <div className="min-w-0">
              <p className="mb-1 text-xs font-bold uppercase tracking-widest text-[#67BFA1]">
                Sprint {sprintId} · Tarea #{task.displayIndex || task.id}
              </p>
              <div className="flex flex-wrap items-center gap-3">
                {editing && draft ? (
                  <input
                    value={draft.title}
                    onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                    className="min-w-0 w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-3xl font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#67BFA1] lg:text-4xl"
                  />
                ) : (
                  <h1 className="min-w-0 text-4xl font-black text-slate-900 lg:text-5xl">{task.title}</h1>
                )}
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
            <div className="flex shrink-0 gap-2 sm:pt-1">
              {editing ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setEditing(false);
                      setDraft(null);
                    }}
                    className="rounded-xl border border-gray-200 bg-white px-4 py-2 font-bold text-slate-600 transition-colors hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={() => handleEditIssue(task.id, draft)}
                    className="rounded-xl bg-[#67BFA1] px-4 py-2 font-bold text-white transition-colors hover:bg-[#52A98A]"
                  >
                    Guardar
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setDraft(draftFromTask(task));
                    setEditing(true);
                  }}
                  className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 font-bold text-slate-700 transition-colors hover:bg-gray-50 lg:self-start"
                >
                  <Pencil size={18} /> Editar Tarea
                </button>
              )}
            </div>
          )}
        </div>

        <p className="text-sm text-gray-400 font-medium ml-14 mb-10">
          Revisa los detalles de esta tarea, su propósito dentro del sprint, la descripción técnica y los miembros del equipo asignados.
        </p>

        {/* Info Card */}
        <TaskInfoCard
          task={task}
          role={role}
          members={members}
          onAssign={assignIssue}
          editing={editing && !!draft}
          draft={draft}
          onDraft={setDraft}
          sprintIssues={issues}
        />

        {projectMode === 'tiempo' && (
          <TaskTimeCard task={task} userId={user?.id} onEstimatedSaved={refetch} />
        )}

        {/* History Section - Always visible below */}
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 mt-8 flex flex-col min-h-0">
          <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2 shrink-0">
            <RotateCcw size={18} className="text-[#67BFA1]" /> Historial de Modificaciones
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

    </div>
  );
};

export default TaskDetailPage;
