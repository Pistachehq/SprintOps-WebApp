import React, { useState, useEffect } from 'react';
import { X, RotateCcw, Trash2 } from 'lucide-react';
import { papeleraRepository } from '../../data/repositories/papeleraRepository';

const TrashModal = ({ isOpen, onClose, sprintId, onRestored }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && sprintId) {
      setLoading(true);
      papeleraRepository.getBySprint(sprintId)
        .then(data => setItems(data || []))
        .catch(() => setItems([]))
        .finally(() => setLoading(false));
    }
  }, [isOpen, sprintId]);

  const handleRestore = async (id) => {
    await papeleraRepository.restore(id);
    setItems(prev => prev.filter(i => i.id !== id));
    onRestored?.();
  };

  const handleDeletePermanently = async (id, title) => {
    if (!confirm(`¿Eliminar permanentemente "${title}"? Esta acción no se puede deshacer.`)) return;
    await papeleraRepository.deletePermanently(id);
    setItems(prev => prev.filter(i => i.id !== id));
  };

  if (!isOpen) return null;

  const getPriorityColor = (p) => {
    switch (p?.toLowerCase()) {
      case 'high': case 'alta': return 'bg-red-500';
      case 'medium': case 'media': return 'bg-yellow-500';
      case 'low': case 'baja': return 'bg-green-500';
      default: return 'bg-gray-400';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
              <Trash2 size={20} className="text-red-500" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-800">Papelera del Sprint</h2>
              <p className="text-xs text-gray-400">Issues eliminados de este sprint</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <p className="text-center text-gray-400 py-10">Cargando...</p>
          ) : items.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 size={28} className="text-gray-300" />
              </div>
              <p className="text-gray-400 font-bold">La papelera está vacía</p>
              <p className="text-gray-300 text-sm mt-1">Los issues eliminados de este sprint aparecerán aquí.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map(item => (
                <div key={item.id} className="p-4 bg-gray-50 rounded-xl border border-gray-100 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-bold text-slate-800 text-sm truncate">{item.title}</h4>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase text-white shrink-0 ${getPriorityColor(item.priority)}`}>
                        {item.priority}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      {item.storyPoints != null && <span>{item.storyPoints} SP</span>}
                      <span>Eliminado: {new Date(item.deletedAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleRestore(item.id)}
                      className="px-3 py-2 bg-[#446E51] text-white text-xs font-bold rounded-lg flex items-center gap-1.5 hover:opacity-90 transition-opacity"
                      title="Restaurar issue"
                    >
                      <RotateCcw size={14} /> Restaurar
                    </button>
                    <button
                      onClick={() => handleDeletePermanently(item.id, item.title)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Eliminar permanentemente"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TrashModal;
