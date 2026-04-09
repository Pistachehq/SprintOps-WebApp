import React from 'react';

const PredictionCard = () => {
  return (
    <div className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100">
      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 border-b pb-2">Pronóstico Predictivo</h3>
      <div className="space-y-4 mb-6">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-600">Promedio SP:</span>
          <span className="font-bold text-gray-800">28 pts/sprint</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-600">Fin estimado:</span>
          <span className="font-bold text-gray-800">16 de Marzo</span>
        </div>
      </div>
      
      <div className="p-4 bg-red-50 border border-red-100 rounded-xl">
        <p className="text-xs font-bold text-red-600">
          Riesgo de retraso: ALTO (3 días)
        </p>
      </div>
    </div>
  );
};

export default PredictionCard;
