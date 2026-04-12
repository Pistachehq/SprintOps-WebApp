import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import IssueTagPicker from '../../components/ui/IssueTagPicker';
import { DEFAULT_ISSUE_TAG_COLOR, normalizeIssueTagColor } from '../../domain/issueTagPalette';

const CreateIssueModal = ({ isOpen, onClose, onCreate, onEdit, issue = null, sprintIssues = [] }) => {
  const [title, setTitle] = useState('');
  const [purpose, setPurpose] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('Task');
  const [priority, setPriority] = useState('Medium');
  const [points, setPoints] = useState(0);
  const [endDate, setEndDate] = useState('');
  const [isSubIssue, setIsSubIssue] = useState(false);
  const [parentIssueId, setParentIssueId] = useState('');
  const [useTag, setUseTag] = useState(false);
  const [tagLabel, setTagLabel] = useState('');
  const [tagColor, setTagColor] = useState(DEFAULT_ISSUE_TAG_COLOR);

  useEffect(() => {
    if (issue) {
      setTitle(issue.title || '');
      setPurpose(issue.purpose || '');
      setDescription(issue.description || '');
      setType(issue.type || 'Task');
      setPriority(issue.priority || 'Medium');
      setPoints(issue.storyPoints || 0);
      setEndDate(issue.completedAt || '');
      setIsSubIssue(!!issue.parentIssueId);
      setParentIssueId(issue.parentIssueId || '');
      const has = !!(issue.tagLabel && issue.tagColor);
      setUseTag(has);
      setTagLabel(issue.tagLabel || '');
      setTagColor(normalizeIssueTagColor(issue.tagColor) || DEFAULT_ISSUE_TAG_COLOR);
    } else {
      setTitle('');
      setPurpose('');
      setDescription('');
      setType('Task');
      setPriority('Medium');
      setPoints(0);
      setEndDate('');
      setIsSubIssue(false);
      setParentIssueId('');
      setUseTag(false);
      setTagLabel('');
      setTagColor(DEFAULT_ISSUE_TAG_COLOR);
    }
  }, [issue, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const tagPayload =
      useTag && tagLabel.trim()
        ? {
            tagLabel: tagLabel.trim(),
            tagColor: normalizeIssueTagColor(tagColor) || DEFAULT_ISSUE_TAG_COLOR,
          }
        : { tagLabel: null, tagColor: null };

    const issueData = {
      title,
      purpose,
      description,
      status: issue ? issue.status : 'todo',
      priority,
      type,
      storyPoints: Number(points) || 0,
      endDate: endDate || null,
      parentIssueId: isSubIssue && parentIssueId ? Number(parentIssueId) : null,
      assigneeIds: issue ? issue.assigneeIds : [],
      ...tagPayload,
    };

    if (issue && onEdit) {
      onEdit(issue.id, issueData);
    } else {
      onCreate(issueData);
    }
    
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4">
      <div className="flex max-h-[min(92vh,calc(100dvh-2rem))] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-2xl animate-in fade-in zoom-in duration-300">
        <div className="flex shrink-0 items-center justify-between border-b border-gray-100 bg-gray-50 p-6">
          <h2 className="text-xl font-black text-gray-800 tracking-tight">{issue ? "Editar Issue" : "Crear Issue"}</h2>
          <button type="button" onClick={onClose} className="text-gray-400 transition-colors hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div
            className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-4 [scrollbar-width:thin] flex flex-col gap-4"
          >
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
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Fecha fin tentativa</label>
              <input 
                type="date"
                className="w-full h-12 px-4 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#446E51] bg-gray-50 text-sm"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <IssueTagPicker
            idPrefix="issue-modal"
            enabled={useTag}
            onEnabledChange={setUseTag}
            tagLabel={tagLabel}
            tagColor={tagColor}
            onLabelChange={setTagLabel}
            onColorChange={setTagColor}
          />

          <div className="grid grid-cols-2 gap-4">
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
                    <option key={i.id} value={i.id}>#{i.displayIndex || i.id} — {i.title}</option>
                  ))
                }
              </select>
            </div>
          )}
          </div>

          <div className="flex shrink-0 gap-3 border-t border-gray-100 bg-white px-6 py-4">
            <button type="button" onClick={onClose} className="h-12 flex-1 rounded-xl bg-gray-100 font-bold text-slate-600 transition-colors hover:bg-gray-200">
              Cancelar
            </button>
            <button type="submit" className="h-12 flex-1 rounded-xl bg-[#446E51] font-bold text-white shadow-lg shadow-green-900/20 transition-colors hover:bg-[#355640]">
              {issue ? "Guardar Cambios" : "Crear Issue"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateIssueModal;
