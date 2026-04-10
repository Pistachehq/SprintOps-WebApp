import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const IssueCard = ({ issue }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({
    id: issue.id,
    data: {
      type: 'Issue',
      issue
    }
  });

  const style = {
    transition,
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.3 : 1,
  };

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
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`bg-white p-4 rounded-xl shadow-sm border border-gray-100 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow select-none ${isDragging ? 'z-50 border-oracle-main ring-2 ring-oracle-main/20' : ''}`}
    >
      <div className="flex justify-between items-start mb-3">
        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${getPriorityColor(issue.priority)}`}>
          {issue.priority || 'Normal'}
        </span>
        <span className="text-[10px] font-bold text-gray-400">#{String(issue.id).replace('i', '')}</span>
      </div>
      
      <h4 className="text-sm font-bold text-gray-800 mb-4 line-clamp-2">{issue.title}</h4>
      
      <div className="flex justify-end items-center">
        <div className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-lg">
          <span className="text-[10px] font-black text-[#446E51]">{issue.storyPoints || issue.points} pts</span>
        </div>
      </div>
    </div>
  );
};

export default IssueCard;
