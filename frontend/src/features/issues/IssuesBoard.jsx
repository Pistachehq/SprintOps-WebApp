import React, { useState } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import { Plus, MoreHorizontal } from 'lucide-react';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragOverlay } from '@dnd-kit/core';
import SprintTabs from '../../components/ui/SprintTabs';
import IssueCard from './IssueCard';
import CreateIssueModal from './CreateIssueModal';
import { useAuth } from '../auth/hooks/useAuth';
import { useIssues } from './hooks/useIssues';
import { issueHistoryRepository } from '../../data/repositories/issueHistoryRepository';
import { toast } from 'sonner';
import SprintMetrics from './components/SprintMetrics';
import DroppableColumn from './components/DroppableColumn';
import DraggableIssueCard, { IssueCardContent } from './components/DraggableIssueCard';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

const IssuesBoard = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { checkPermission, user } = useAuth();
  const { issues, isLoading, addIssue, moveIssue } = useIssues(id);
  
  const { setShowCreateIssue } = useOutletContext();
  const [activeDragIssue, setActiveDragIssue] = useState(null);

  const canCreateIssue = checkPermission('canCreateIssue');
  const canViewAllIssues = checkPermission('canViewAllIssues');

  // Users with canViewAllIssues see all; otherwise only their assigned issues
  const role = user?.role || 'developer';
  const visibleIssues = canViewAllIssues
    ? issues
    : issues.filter(i => i.assigneeIds?.includes(user?.id));

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 }
    })
  );

  const columns = [
    { id: 'todo', label: 'Por Hacer' },
    { id: 'in_progress', label: 'En Progreso' },
    { id: 'blocked', label: 'Bloqueado' },
    { id: 'done', label: 'Finalizado' }
  ];

  const handleDragStart = (event) => {
    const draggedIssue = visibleIssues.find(i => i.id === event.active.id);
    setActiveDragIssue(draggedIssue || null);
  };

  const handleDragEnd = (event) => {
    setActiveDragIssue(null);
    const { active, over } = event;
    if (!over) return;

    const issueId = active.id;
    const targetColumnId = over.id;

    const activeIssue = visibleIssues.find(i => i.id === issueId);
    if (!activeIssue) return;

    if (!activeIssue.assigneeIds?.includes(user?.id)) {
      toast.error("Solo puedes mover tus propios issues");
      return; 
    }

    const newStatus = columns.find(c => c.id === targetColumnId)?.id;

    if (newStatus && activeIssue.status !== newStatus) {
      moveIssue(issueId, newStatus);
      const columnLabel = columns.find(c => c.id === newStatus)?.label || newStatus;
      issueHistoryRepository.addHistory(issueId, user?.id, 'Cambio de Estado', `Movido a ${columnLabel} por ${user?.username}`)
        .catch(() => {});
      toast.success(`Movido exitosamente a ${columnLabel}`);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-full min-h-0 w-full flex-1 flex-col items-center justify-center rounded-2xl border border-slate-100 bg-slate-50/50">
        <LoadingSpinner label="Cargando Tablero Kanban..." />
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      {/* Sprint Metrics Strip */}
        {checkPermission('canViewMetrics') && (
          <div className="shrink-0">
            <SprintMetrics issues={visibleIssues} />
          </div>
        )}

        {/* Kanban Board: md+ altura fija al viewport; scroll dentro de cada columna */}
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto md:overflow-hidden">
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
                const columnIssues = visibleIssues.filter(i => i.status === column.id);
                return (
                  <div
                    key={column.id}
                    className="flex min-h-0 flex-col rounded-2xl border border-slate-100 bg-slate-50 p-4 md:h-full md:max-h-full"
                  >
                    <div className="mb-4 flex shrink-0 items-center justify-between px-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-slate-900">{column.label}</h3>
                        <span className="bg-slate-200 text-slate-600 text-[10px] font-black px-2 py-0.5 rounded-full">
                          {columnIssues.length}
                        </span>
                      </div>
                      <button className="text-slate-400 hover:text-slate-600">
                        <MoreHorizontal size={18} />
                      </button>
                    </div>
                    
                    <DroppableColumn id={column.id}>
                      {columnIssues.map(issue => (
                        <DraggableIssueCard key={issue.id} issue={issue} sprintId={id} />
                      ))}
                      
                      {canCreateIssue && column.id === 'todo' && (
                        <button
                          onClick={() => setShowCreateIssue(true)}
                          className="w-full py-2 flex items-center justify-center gap-2 text-slate-400 hover:text-oracle-main hover:bg-white rounded-xl border-2 border-dashed border-slate-200 hover:border-oracle-main transition-all text-sm font-bold mt-4"
                        >
                          <Plus size={16} /> Añadir Issue
                        </button>
                      )}
                    </DroppableColumn>
                  </div>
                );
              })}
              </div>
            </div>

            <DragOverlay>
              {activeDragIssue ? (
                <div className="bg-white p-4 rounded-xl shadow-xl border-2 border-oracle-main w-[220px] rotate-3">
                  <IssueCardContent issue={activeDragIssue} />
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        </div>
    </div>
  );
};

export default IssuesBoard;
