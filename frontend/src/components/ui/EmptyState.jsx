import React from 'react';
import { DatabaseZap } from 'lucide-react';

const EmptyState = ({ 
  icon: Icon = DatabaseZap, 
  title = 'No hay información', 
  description = 'No se encontraron registros por el momento.',
  actionButton = null 
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center w-full bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-200">
      <div className="bg-white p-4 rounded-full shadow-sm mb-4">
        <Icon size={32} className="text-slate-300" />
      </div>
      <h3 className="text-lg font-black text-slate-700 mb-2">{title}</h3>
      <p className="text-sm text-slate-500 max-w-sm mb-6">{description}</p>
      {actionButton && (
        <div>
          {actionButton}
        </div>
      )}
    </div>
  );
};

export default EmptyState;
