import React from 'react';
import { useDraggable } from '@dnd-kit/core';

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
      <div className="flex justify-between items-start mb-3">
        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${getPriorityColor(issue.priority)}`}>
          {issue.priority || 'Normal'}
        </span>
        <span className="text-[10px] font-bold text-gray-400">#{issue.displayIndex || issue.id}</span>
      </div>
      <h4 className="text-sm font-bold text-gray-800 mb-4 line-clamp-2">{issue.title}</h4>
      <div className="flex justify-end items-center">
        <div className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-lg">
          <span className="text-[10px] font-black text-oracle-main">{issue.storyPoints || issue.points || 0} pts</span>
        </div>
      </div>
    </>
  );
};

const DraggableIssueCard = ({ issue }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: issue.id,
    data: { issue }
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}
      className={`bg-white p-4 rounded-xl shadow-sm border border-gray-100 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow select-none ${isDragging ? 'opacity-30' : ''}`}
    >
      <IssueCardContent issue={issue} />
    </div>
  );
};

export default DraggableIssueCard;
