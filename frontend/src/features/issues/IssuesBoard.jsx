import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import { Plus, MoreHorizontal } from 'lucide-react';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragOverlay } from '@dnd-kit/core';
import { useAuth } from '../auth/hooks/useAuth';
import { useIssues } from './hooks/useIssues';
import { issueHistoryRepository } from '../../data/repositories/issueHistoryRepository';
import { issuesRepository } from '../../data/repositories/issuesRepository';
import { sprintsRepository } from '../../data/repositories/sprintsRepository';
import { toast } from 'sonner';
import SprintMetrics from './components/SprintMetrics';
import DroppableColumn from './components/DroppableColumn';
import DraggableIssueCard, { IssueCardContent } from './components/DraggableIssueCard';
import NextSprintPanel, { NEXT_SPRINT_DROPPABLE_ID } from './components/NextSprintPanel';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

function sortSprintsForOrder(list) {
  return [...(list || [])].sort((a, b) => {
    const da = a.startDate || '';
    const db = b.startDate || '';
    if (da !== db) return String(da).localeCompare(String(db));
    return (a.id || 0) - (b.id || 0);
  });
}

const COLUMN_IDS = ['todo', 'in_progress', 'done'];

const IssuesBoard = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { setShowCreateIssue } = useOutletContext();
  const { checkPermission, user } = useAuth();
  const { issues, isLoading, moveIssue, refetch } = useIssues(id);

  const [activeDragIssue, setActiveDragIssue] = useState(null);
  const [projectId, setProjectId] = useState(null);
  const [sprintsList, setSprintsList] = useState([]);
  const [issuesSentToNextSprint, setIssuesSentToNextSprint] = useState(0);
  const [showNoNextModal, setShowNoNextModal] = useState(false);
  const [movingToNext, setMovingToNext] = useState(false);

  const canCreateIssue = checkPermission('canCreateIssue');
  const canViewAllIssues = checkPermission('canViewAllIssues');
  const canCreateSprint = checkPermission('canCreateSprint');

  const loadSprintContext = useCallback(async () => {
    if (!id) return;
    try {
      const cur = await sprintsRepository.getById(id);
      const pid = cur?.projectId;
      setProjectId(pid ?? null);
      if (pid == null) {
        setSprintsList([]);
        setIssuesSentToNextSprint(0);
        return;
      }
      const all = await sprintsRepository.getByProjectId(pid);
      setSprintsList(all || []);
      const me = (all || []).find(s => String(s.id) === String(id));
      setIssuesSentToNextSprint(me?.issuesSentToNextSprint ?? 0);
    } catch (e) {
      console.error(e);
      setSprintsList([]);
      setIssuesSentToNextSprint(0);
    }
  }, [id]);

  useEffect(() => {
    loadSprintContext();
  }, [loadSprintContext]);

  const sortedProjectSprints = useMemo(() => sortSprintsForOrder(sprintsList), [sprintsList]);

  const nextSprint = useMemo(() => {
    const idx = sortedProjectSprints.findIndex(s => String(s.id) === String(id));
    if (idx < 0 || idx >= sortedProjectSprints.length - 1) return null;
    return sortedProjectSprints[idx + 1];
  }, [sortedProjectSprints, id]);

  const nextSprintPanelDisabled = !nextSprint && !canCreateSprint;

  const visibleIssues = canViewAllIssues
    ? issues
    : issues.filter(i => i.assigneeIds?.includes(user?.id));

  const canMoveIssue = (issue) =>
    canViewAllIssues || issue.assigneeIds?.includes(user?.id);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  const columns = [
    { id: 'todo', label: 'Por Hacer' },
    { id: 'in_progress', label: 'En Progreso' },
    { id: 'done', label: 'Finalizado' },
  ];

  const handleDragStart = (event) => {
    const draggedIssue =
      event.active.data?.current?.issue ||
      visibleIssues.find(i => String(i.id) === String(event.active.id));
    setActiveDragIssue(draggedIssue || null);
  };

  const resolveStatusForColumn = (columnId, issue) => {
    if (columnId === 'todo') {
      if (issue.status === 'blocked') return 'blocked';
      return 'todo';
    }
    if (columnId === 'in_progress') return 'in_progress';
    if (columnId === 'done') return 'done';
    return null;
  };

  const handleDragEnd = async (event) => {
    setActiveDragIssue(null);
    const { active, over } = event;
    if (!over) return;

    const issueId = active.id;
    const fromDrag = active.data?.current?.issue;
    const activeIssue =
      fromDrag || visibleIssues.find(i => String(i.id) === String(issueId));
    if (!activeIssue) return;

    if (!canMoveIssue(activeIssue)) {
      toast.error('Solo puedes mover tus propios issues');
      return;
    }

    if (over.id === NEXT_SPRINT_DROPPABLE_ID) {
      if (nextSprint) {
        setMovingToNext(true);
        try {
          await issuesRepository.moveToNextSprint(issueId, {
            fromSprintId: Number(id),
            toSprintId: nextSprint.id,
            userId: user?.id,
            username: user?.username ?? user?.email ?? '',
            storyPoints: Math.max(
              0,
              Math.trunc(Number(activeIssue.storyPoints ?? activeIssue.points ?? 0)) || 0
            ),
          });
          toast.success(`Issue enviado a ${nextSprint.name || 'siguiente sprint'}`);
          await refetch();
          await loadSprintContext();
        } catch (err) {
          console.error(err);
          toast.error('No se pudo mover el issue al siguiente sprint');
        } finally {
          setMovingToNext(false);
        }
        return;
      }

      if (canCreateSprint) {
        setShowNoNextModal(true);
      }
      return;
    }

    if (!COLUMN_IDS.includes(over.id)) return;

    const newStatus = resolveStatusForColumn(over.id, activeIssue);
    if (newStatus == null || activeIssue.status === newStatus) return;

    moveIssue(issueId, newStatus);
    const columnLabel = columns.find(c => c.id === over.id)?.label || over.id;
    issueHistoryRepository
      .addHistory(issueId, user?.id, 'Cambio de Estado', `Movido a ${columnLabel} por ${user?.username}`)
      .catch(() => {});
    toast.success(`Movido exitosamente a ${columnLabel}`);
  };

  if (isLoading) {
    return (
      <div className="flex h-full min-h-0 w-full flex-1 flex-col items-center justify-center rounded-2xl border border-slate-100 bg-slate-50/50">
        <LoadingSpinner label="Cargando Tablero Kanban..." />
      </div>
    );
  }

  const handleModalGoCreateSprint = () => {
    setShowNoNextModal(false);
    if (projectId != null) {
      navigate(`/project/${projectId}/sprints`, {
        state: { openProjectConfig: true, focusSprints: true },
      });
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      {checkPermission('canViewMetrics') && (
        <div className="shrink-0">
          <SprintMetrics
            issues={visibleIssues}
            issuesSentToNextSprint={issuesSentToNextSprint}
            sprintId={id}
          />
        </div>
      )}

      <div className="relative flex min-h-0 flex-1 flex-col overflow-y-auto md:overflow-hidden">
        {movingToNext && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/40 backdrop-blur-[1px]">
            <LoadingSpinner label="Moviendo al siguiente sprint..." />
          </div>
        )}

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="min-h-0 md:flex-1 md:min-h-0">
            <div
              className={[
                'grid min-h-0 gap-6',
                'grid-cols-1',
                'md:h-full md:overflow-hidden md:grid-cols-2 md:[grid-template-rows:repeat(2,minmax(0,1fr))]',
                'lg:grid-cols-4 lg:[grid-template-rows:minmax(0,1fr)]',
              ].join(' ')}
            >
              {columns.map(column => {
                const columnIssues = visibleIssues.filter(i => {
                  if (column.id === 'todo') return i.status === 'todo' || i.status === 'blocked';
                  return i.status === column.id;
                });
                return (
                  <div
                    key={column.id}
                    className="flex min-h-0 flex-col rounded-2xl border border-slate-100 bg-slate-50 p-4 md:h-full md:max-h-full"
                  >
                    <div className="mb-4 flex shrink-0 items-center justify-between px-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-slate-900">{column.label}</h3>
                        <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-black text-slate-600">
                          {columnIssues.length}
                        </span>
                      </div>
                      <button type="button" className="text-slate-400 hover:text-slate-600">
                        <MoreHorizontal size={18} />
                      </button>
                    </div>

                    <DroppableColumn id={column.id}>
                      {columnIssues.map(issue => (
                        <DraggableIssueCard key={issue.id} issue={issue} sprintId={id} />
                      ))}

                      {canCreateIssue && column.id === 'todo' && (
                        <button
                          type="button"
                          onClick={() => setShowCreateIssue(true)}
                          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 py-2 text-sm font-bold text-slate-400 transition-all hover:border-oracle-main hover:bg-white hover:text-oracle-main"
                        >
                          <Plus size={16} /> Añadir Issue
                        </button>
                      )}
                    </DroppableColumn>
                  </div>
                );
              })}

              <div
                className={[
                  'flex min-h-0 flex-col overflow-hidden rounded-2xl md:h-full md:max-h-full',
                  nextSprintPanelDisabled
                    ? 'border-2 border-dashed border-slate-300 bg-slate-50'
                    : 'border border-[#446E51]/40 shadow-sm',
                ].join(' ')}
              >
                <NextSprintPanel
                  disabled={nextSprintPanelDisabled}
                  nextSprintName={nextSprint ? nextSprint.name : null}
                />
              </div>
            </div>
          </div>

          <DragOverlay>
            {activeDragIssue ? (
              <div className="w-[220px] rotate-3 rounded-xl border-2 border-oracle-main bg-white p-4 shadow-xl">
                <IssueCardContent issue={activeDragIssue} />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      {showNoNextModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="no-next-sprint-title"
        >
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <h2 id="no-next-sprint-title" className="text-lg font-black text-slate-900">
              No hay siguiente sprint
            </h2>
            <p className="mt-3 text-sm text-slate-600">
              No existe un sprint planificado después del actual. ¿Deseas crear uno nuevo en la configuración del
              proyecto?
            </p>
            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowNoNextModal(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50"
              >
                No
              </button>
              <button
                type="button"
                onClick={handleModalGoCreateSprint}
                className="rounded-xl bg-[#446E51] px-4 py-2 text-sm font-bold text-white hover:opacity-90"
              >
                Sí, ir a crear sprint
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IssuesBoard;
