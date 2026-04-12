import React from 'react';
import { useDroppable } from '@dnd-kit/core';

const DroppableColumn = ({ id, children }) => {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className={`min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-y-contain rounded-xl pb-2 pr-1 transition-colors custom-scrollbar [scrollbar-width:thin] ${isOver ? 'bg-oracle-main/5' : ''}`}
    >
      {children}
    </div>
  );
};

export default DroppableColumn;
