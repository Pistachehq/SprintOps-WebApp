import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import IssueTagPicker from '../../components/ui/IssueTagPicker';
import { DEFAULT_ISSUE_TAG_COLOR, normalizeIssueTagColor } from '../../domain/issueTagPalette';

const todayISO = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const minISO = (...dates) => dates.filter(Boolean).sort()[0] || '';
const maxISO = (...dates) => dates.filter(Boolean).sort().pop() || '';

const CreateIssueModal = ({
  isOpen, onClose, onCreate, onEdit, issue = null, sprintIssues = [],
  projectEndDate = null, sprintStartDate = null, sprintEndDate = null,
}) => {
  const [title, setTitle] = useState('');
  const [purpose, setPurpose] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('Task');
  const [priority, setPriority] = useState('Medium');
  const [points, setPoints] = useState(0);
  const [endDate, setEndDate] = useState('');
  const [isSubIssue, setIsSubIssue] = useState(false);
  const [parentIssueIds, setParentIssueIds] = useState([]);
  const [parentSearch, setParentSearch] = useState('');
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
      const existingParents = Array.isArray(issue.parentIssueIds) && issue.parentIssueIds.length
        ? issue.parentIssueIds
        : (issue.parentIssueId ? [issue.parentIssueId] : []);
      setIsSubIssue(existingParents.length > 0);
      setParentIssueIds(existingParents.map(Number));
      setParentSearch('');
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
      setParentIssueIds([]);
      setParentSearch('');
      setUseTag(false);
      setTagLabel('');
      setTagColor(DEFAULT_ISSUE_TAG_COLOR);
    }
  }, [issue, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (endDate) {
      const today = todayISO();
      const isCreating = !issue;
      if (isCreating && endDate < today) {
        toast.error('La fecha fin no puede ser anterior a hoy.');
        return;
      }
      if (sprintStartDate && endDate < sprintStartDate) {
        toast.error(`La fecha fin no puede ser anterior al inicio del sprint (${sprintStartDate}).`);
        return;
      }
      const cap = minISO(projectEndDate, sprintEndDate);
      if (cap && endDate > cap) {
        const which = projectEndDate && cap === projectEndDate ? 'proyecto' : 'sprint';
        toast.error(`La fecha fin no puede ser posterior al fin del ${which} (${cap}).`);
        return;
      }
    }
    if (isSubIssue && parentIssueIds.length === 0) {
      toast.error('Selecciona al menos un issue del que dependa esta tarea.');
      return;
    }
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
      parentIssueIds: isSubIssue ? parentIssueIds.map(Number) : [],
      parentIssueId: isSubIssue && parentIssueIds.length ? Number(parentIssueIds[0]) : null,
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
              className="w-full h-12 px-4 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#67BFA1] bg-gray-50"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="¿Qué se debe hacer?"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Propósito</label>
            <input 
              className="w-full h-12 px-4 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#67BFA1] bg-gray-50"
              value={purpose}
              onChange={e => setPurpose(e.target.value)}
              placeholder="¿Cuál es el propósito o beneficio de este issue?"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Descripción</label>
            <textarea
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#67BFA1] bg-gray-50 resize-none text-sm"
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
                className="w-full h-12 px-4 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#67BFA1] bg-gray-50 text-sm"
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
                className="w-full h-12 px-4 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#67BFA1] bg-gray-50 text-sm"
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
                className="w-full h-12 px-4 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#67BFA1] bg-gray-50"
                value={points}
                onChange={e => setPoints(e.target.value)}
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Fecha fin tentativa</label>
              <input
                type="date"
                min={maxISO(issue ? null : todayISO(), sprintStartDate) || undefined}
                max={minISO(projectEndDate, sprintEndDate) || undefined}
                className="w-full h-12 px-4 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#67BFA1] bg-gray-50 text-sm"
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
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">¿Depende de otros issues?</label>
              <select
                className="w-full h-12 px-4 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#67BFA1] bg-gray-50 text-sm"
                value={isSubIssue ? 'yes' : 'no'}
                onChange={e => {
                  const val = e.target.value === 'yes';
                  setIsSubIssue(val);
                  if (!val) { setParentIssueIds([]); setParentSearch(''); }
                }}
              >
                <option value="no">No</option>
                <option value="yes">Sí</option>
              </select>
            </div>
          </div>

          {isSubIssue && (
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">
                Issues padre {parentIssueIds.length > 0 && <span className="text-[#67BFA1]">({parentIssueIds.length})</span>}
              </label>
              {parentIssueIds.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {parentIssueIds.map(pid => {
                    const it = sprintIssues.find(i => Number(i.id) === Number(pid));
                    return (
                      <span key={pid} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-[#67BFA1]/10 text-[#67BFA1] text-xs font-semibold">
                        #{it?.displayIndex || it?.id || pid} — {it?.title || `Issue ${pid}`}
                        <button
                          type="button"
                          onClick={() => setParentIssueIds(prev => prev.filter(x => Number(x) !== Number(pid)))}
                          className="ml-1 hover:text-red-500"
                          aria-label="Quitar"
                        >
                          <X size={12} />
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}
              <input
                type="text"
                value={parentSearch}
                onChange={e => setParentSearch(e.target.value)}
                placeholder="Buscar issue para agregar..."
                className="w-full h-10 px-4 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#67BFA1] bg-gray-50 text-sm mb-2"
              />
              <div className="max-h-40 overflow-y-auto border border-gray-100 rounded-xl bg-white" style={{ scrollbarWidth: 'thin' }}>
                {sprintIssues
                  .filter(i => String(i.id) !== String(issue?.id))
                  .filter(i => !parentIssueIds.some(p => Number(p) === Number(i.id)))
                  .filter(i => {
                    const q = parentSearch.toLowerCase().trim();
                    if (!q) return true;
                    return (i.title || '').toLowerCase().includes(q) || String(i.displayIndex || i.id).includes(q);
                  })
                  .map(i => (
                    <button
                      key={i.id}
                      type="button"
                      onClick={() => {
                        setParentIssueIds(prev => [...prev, Number(i.id)]);
                        setParentSearch('');
                      }}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-[#67BFA1]/5 border-b border-gray-50 last:border-b-0"
                    >
                      <span className="font-bold text-[#67BFA1]">#{i.displayIndex || i.id}</span>
                      <span className="text-slate-700 ml-2">{i.title}</span>
                    </button>
                  ))
                }
                {sprintIssues.filter(i => String(i.id) !== String(issue?.id) && !parentIssueIds.some(p => Number(p) === Number(i.id))).length === 0 && (
                  <p className="px-3 py-2 text-xs text-slate-400 italic">No hay más issues disponibles.</p>
                )}
              </div>
            </div>
          )}
          </div>

          <div className="flex shrink-0 gap-3 border-t border-gray-100 bg-white px-6 py-4">
            <button type="button" onClick={onClose} className="h-12 flex-1 rounded-xl bg-gray-100 font-bold text-slate-600 transition-colors hover:bg-gray-200">
              Cancelar
            </button>
            <button type="submit" className="h-12 flex-1 rounded-xl bg-[#67BFA1] font-bold text-white shadow-lg shadow-[#67BFA1]/25 transition-colors hover:bg-[#52A98A]">
              {issue ? "Guardar Cambios" : "Crear Issue"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateIssueModal;
