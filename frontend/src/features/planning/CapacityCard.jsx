import React, { useState, useEffect } from 'react';
import { sprintsRepository } from '../../data/repositories/sprintsRepository';

const CapacityCard = ({ sprintId, issues = [] }) => {
  const [capacity, setCapacity] = useState(null);

  useEffect(() => {
    if (!sprintId) return;
    sprintsRepository.getById(sprintId).then(sprint => {
      if (sprint?.capacity != null) setCapacity(sprint.capacity);
    }).catch(() => {});
  }, [sprintId]);

  const usedPoints = issues.reduce((sum, issue) => sum + (issue.storyPoints || 0), 0);
  const percentage = capacity > 0 ? Math.round((usedPoints / capacity) * 100) : 0;

  const getWarning = () => {
    if (capacity == null || capacity === 0) return null;
    if (percentage > 100) {
      return {
        bg: 'bg-red-50 border-red-200',
        text: 'text-red-700',
        message: `Sobrecarga: llevas ${usedPoints} de ${capacity} SP (${percentage}%). Considera reducir los SP de algunos issues o alargar la duración del sprint.`
      };
    }
    if (percentage >= 90) {
      return {
        bg: 'bg-yellow-50 border-yellow-200',
        text: 'text-yellow-700',
        message: percentage === 100
          ? `Capacidad completa: ${usedPoints} de ${capacity} SP utilizados.`
          : `Casi al límite: llevas ${usedPoints} de ${capacity} SP (${percentage}%).`
      };
    }
    return null;
  };

  const warning = getWarning();

  return (
    <div className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100">
      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 border-b pb-2">Capacidad de Planeación</h3>
      <div className="space-y-4 mb-6">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-600">Story Points disponibles:</span>
          <span className="font-bold text-gray-800">{capacity != null ? `${capacity} pts` : '—'}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-600">Story Points asignados:</span>
          <span className="font-bold text-gray-800">{usedPoints} pts</span>
        </div>
        {capacity > 0 && (
          <div>
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>Uso</span>
              <span>{percentage}%</span>
            </div>
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  percentage > 100 ? 'bg-red-500' : percentage >= 90 ? 'bg-yellow-500' : 'bg-[#446E51]'
                }`}
                style={{ width: `${Math.min(percentage, 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {warning && (
        <div className={`p-4 rounded-xl border ${warning.bg}`}>
          <p className={`text-xs font-bold ${warning.text}`}>
            {warning.message}
          </p>
        </div>
      )}
    </div>
  );
};

export default CapacityCard;
