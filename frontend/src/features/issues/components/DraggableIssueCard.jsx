import React, { useRef } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { useNavigate } from 'react-router-dom';

export const IssueCardContent = ({ issue }) => {
  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high':
      case 'critica': return 'bg-black text-white';
      case 'alta': return 'bg-red-500 text-white';
      case 'medium':
      case 'media': return 'bg-yellow-400 text-black';
      case 'low':
      case 'baja': return 'bg-green-500 text-white';
      default: return 'bg-gray-200 text-gray-700';
    }
  };

  return (
    <>
      <div className="mb-3 flex items-start justify-between gap-2">
        <span className="shrink-0 text-[10px] font-bold text-gray-400">#{issue.displayIndex || issue.id}</span>
        <span className={`shrink-0 rounded px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${getPriorityColor(issue.priority)}`}>
          {issue.priority || 'Normal'}
        </span>
      </div>
      <h4 className="text-sm font-bold text-gray-800 mb-4 line-clamp-2">{issue.title}</h4>
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          {issue.tagLabel && issue.tagColor && (
            <span
              className="inline-block max-w-[7.5rem] truncate rounded-md px-2 py-0.5 text-[9px] font-bold text-white shadow-sm align-middle"
              style={{ backgroundColor: issue.tagColor }}
              title={issue.tagLabel}
            >
              {issue.tagLabel}
            </span>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1 rounded-lg bg-gray-50 px-2 py-1">
          <span className="text-[10px] font-black text-oracle-main">{issue.storyPoints || issue.points || 0} pts</span>
        </div>
      </div>
    </>
  );
};

const DraggableIssueCard = ({ issue, sprintId }) => {
  const navigate = useNavigate();
  const pointerDownRef = useRef(null);

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: issue.id,
    data: { issue }
  });

  const { onPointerDown: dndPointerDown, ...restListeners } = listeners;

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  const openDetail = () => {
    if (issue?.id == null || sprintId == null || sprintId === '') return;
    navigate(`/sprint/${sprintId}/planning/task/${issue.id}`);
  };

  /** Mismo umbral que PointerSensor (8px): poco movimiento = clic → detalle; arrastre no abre. */
  const handlePointerUp = (e) => {
    const start = pointerDownRef.current;
    pointerDownRef.current = null;
    if (!start || e.button !== 0) return;
    const dx = Math.abs(e.clientX - start.x);
    const dy = Math.abs(e.clientY - start.y);
    if (dx < 8 && dy < 8) {
      openDetail();
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...restListeners}
      {...attributes}
      onPointerDown={(e) => {
        pointerDownRef.current = { x: e.clientX, y: e.clientY };
        dndPointerDown?.(e);
      }}
      onPointerUp={handlePointerUp}
      onPointerCancel={() => { pointerDownRef.current = null; }}
      role="button"
      tabIndex={0}
      title="Clic para ver detalle · Arrastra para mover de columna"
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openDetail();
        }
      }}
      className={`rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition-shadow select-none hover:shadow-md cursor-grab active:cursor-grabbing focus:outline-none focus-visible:ring-2 focus-visible:ring-oracle-main/40 ${isDragging ? 'opacity-30' : ''}`}
    >
      <IssueCardContent issue={issue} />
    </div>
  );
};

export default DraggableIssueCard;
