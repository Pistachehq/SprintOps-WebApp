import React from 'react';

const CapacityCard = () => {
  return (
    <div className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100">
      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 border-b pb-2">Capacidad de Planeación</h3>
      <div className="space-y-4 mb-6">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-600">Horas disponibles:</span>
          <span className="font-bold text-gray-800">120 hrs</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-600">Story Points rec.:</span>
          <span className="font-bold text-gray-800">30 pts</span>
        </div>
      </div>
      
      <div className="p-4 bg-yellow-50 border border-yellow-100 rounded-xl">
        <p className="text-xs font-bold text-yellow-700">
          Advertencia: ¡El sprint actual tiene sobre carga!
        </p>
      </div>
    </div>
  );
};

export default CapacityCard;
