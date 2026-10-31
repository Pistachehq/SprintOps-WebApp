import React from 'react';
import { useDroppable } from '@dnd-kit/core';

const DroppableColumn = ({ id, children, dragging = false }) => {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className={`min-h-0 flex-1 space-y-4 overscroll-y-contain rounded-xl pb-2 pr-1 transition-colors custom-scrollbar [scrollbar-width:thin] ${dragging ? 'overflow-visible' : 'overflow-y-auto'} ${isOver ? 'bg-oracle-main/5' : ''}`}
    >
      {children}
    </div>
  );
};

export default DroppableColumn;
