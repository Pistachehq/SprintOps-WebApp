import React, { useState, useEffect } from 'react';
import { X, Search } from 'lucide-react';

const CreateIssueModal = ({ isOpen, onClose, onCreate, onEdit, issue = null, sprintIssues = [] }) => {
  const [title, setTitle] = useState('');
  const [purpose, setPurpose] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('Task');
  const [priority, setPriority] = useState('Medium');
  const [points, setPoints] = useState(0);
  const [isSubIssue, setIsSubIssue] = useState(false);
  const [parentIssueId, setParentIssueId] = useState('');

  useEffect(() => {
    if (issue) {
      setTitle(issue.title || '');
      setPurpose(issue.purpose || '');
      setDescription(issue.description || '');
      setType(issue.type || 'Task');
      setPriority(issue.priority || 'Medium');
      setPoints(issue.storyPoints || 0);
      setIsSubIssue(!!issue.parentIssueId);
      setParentIssueId(issue.parentIssueId || '');
    } else {
      setTitle('');
      setPurpose('');
      setDescription('');
      setType('Task');
      setPriority('Medium');
      setPoints(0);
      setIsSubIssue(false);
      setParentIssueId('');
    }
  }, [issue, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const issueData = {
      title,
      purpose,
      description,
      status: issue ? issue.status : 'todo',
      priority,
      type,
      storyPoints: Number(points) || 0,
      parentIssueId: isSubIssue && parentIssueId ? Number(parentIssueId) : null,
      assigneeIds: issue ? issue.assigneeIds : []
    };

    if (issue && onEdit) {
      onEdit(issue.id, issueData);
    } else {
      onCreate(issueData);
    }
    
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
        <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50">
          <h2 className="text-xl font-black text-gray-800 tracking-tight">{issue ? "Editar Issue" : "Crear Issue"}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={24} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Título</label>
            <input 
              required
              className="w-full h-12 px-4 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#446E51] bg-gray-50"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="¿Qué se debe hacer?"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Propósito</label>
            <input 
              className="w-full h-12 px-4 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#446E51] bg-gray-50"
              value={purpose}
              onChange={e => setPurpose(e.target.value)}
              placeholder="¿Cuál es el propósito o beneficio de este issue?"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Descripción</label>
            <textarea
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#446E51] bg-gray-50 resize-none text-sm"
              rows={3}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Describe el issue con más detalle..."
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Tipo</label>
              <select 
                className="w-full h-12 px-4 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#446E51] bg-gray-50 text-sm"
                value={type} onChange={e => setType(e.target.value)}
              >
                <option value="Task">Task</option>
                <option value="Bug">Bug</option>
                <option value="Story">User Story</option>
                <option value="Spike">Spike</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Prioridad</label>
              <select 
                className="w-full h-12 px-4 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#446E51] bg-gray-50 text-sm"
                value={priority} onChange={e => setPriority(e.target.value)}
              >
                <option value="high">Alta</option>
                <option value="medium">Media</option>
                <option value="low">Baja</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Story Points</label>
              <input 
                type="number"
                min="0"
                className="w-full h-12 px-4 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#446E51] bg-gray-50"
                value={points}
                onChange={e => setPoints(e.target.value)}
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">¿Es Sub Issue?</label>
              <select
                className="w-full h-12 px-4 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#446E51] bg-gray-50 text-sm"
                value={isSubIssue ? 'yes' : 'no'}
                onChange={e => {
                  const val = e.target.value === 'yes';
                  setIsSubIssue(val);
                  if (!val) setParentIssueId('');
                }}
              >
                <option value="no">No</option>
                <option value="yes">Sí</option>
              </select>
            </div>
          </div>

          {isSubIssue && (
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Issue padre</label>
              <select
                required
                className="w-full h-12 px-4 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#446E51] bg-gray-50 text-sm"
                value={parentIssueId}
                onChange={e => setParentIssueId(e.target.value)}
              >
                <option value="">Selecciona un issue...</option>
                {sprintIssues
                  .filter(i => String(i.id) !== String(issue?.id))
                  .map(i => (
                    <option key={i.id} value={i.id}>#{i.id} — {i.title}</option>
                  ))
                }
              </select>
            </div>
          )}
          
          <div className="mt-4 flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 h-12 bg-gray-100 text-slate-600 font-bold rounded-xl hover:bg-gray-200 transition-colors">
              Cancelar
            </button>
            <button type="submit" className="flex-1 h-12 bg-[#446E51] text-white font-bold rounded-xl hover:bg-[#355640] transition-colors shadow-lg shadow-green-900/20">
              {issue ? "Guardar Cambios" : "Crear Issue"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateIssueModal;
