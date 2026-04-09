import React from 'react';
import { useDroppable } from '@dnd-kit/core';

const DroppableColumn = ({ id, children }) => {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div 
      ref={setNodeRef} 
      className={`flex-1 overflow-y-auto space-y-4 custom-scrollbar pr-1 min-h-[100px] rounded-xl transition-colors ${isOver ? 'bg-oracle-main/5' : ''}`}
    >
      {children}
    </div>
  );
};

export default DroppableColumn;
