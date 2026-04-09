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
  const canMoveAnyIssue = checkPermission('canMoveAnyIssue');

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
    const draggedIssue = issues.find(i => i.id === event.active.id);
    setActiveDragIssue(draggedIssue || null);
  };

  const handleDragEnd = (event) => {
    setActiveDragIssue(null);
    const { active, over } = event;
    if (!over) return;

    const issueId = active.id;
    const targetColumnId = over.id;

    const activeIssue = issues.find(i => i.id === issueId);
    if (!activeIssue) return;

    if (!canMoveAnyIssue && !activeIssue.assigneeIds?.includes(user?.id)) {
      toast.error("No tienes permisos para mover este issue");
      return; 
    }

    const newStatus = columns.find(c => c.id === targetColumnId)?.id;

    if (newStatus && activeIssue.status !== newStatus) {
      moveIssue(issueId, newStatus);
      const columnLabel = columns.find(c => c.id === newStatus)?.label || newStatus;
      // Fixed user fallback (no longer uses 'Sistema' hardcoded, enforces user session)
      issueHistoryRepository.addHistory(issueId, user?.id, 'Cambio de Estado', `Movido a ${columnLabel} por ${user?.username}`);
      toast.success(`Movido exitosamente a ${columnLabel}`);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col h-full bg-slate-50/50 rounded-2xl w-full border border-slate-100 items-center justify-center">
        <LoadingSpinner label="Cargando Tablero Kanban..." />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Sprint Metrics Strip */}
        {checkPermission('canViewMetrics') && (
          <SprintMetrics issues={issues} />
        )}

        {/* Kanban Board */}
        <div className="flex-1 overflow-hidden">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 h-full overflow-hidden">
              {columns.map(column => {
                const columnIssues = issues.filter(i => i.status === column.id);
                return (
                  <div key={column.id} className="flex flex-col h-full bg-slate-50 rounded-2xl p-4 border border-slate-100">
                    <div className="flex items-center justify-between mb-4 px-2">
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
                        <DraggableIssueCard key={issue.id} issue={issue} />
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
