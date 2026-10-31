import React from 'react';
import TeamAvatars from './TeamAvatars';
import IssueTagPicker from '../../../components/ui/IssueTagPicker';
import { PRIORITY_LEVELS } from '../../../domain/priority';
import { formatLong } from '../../../domain/scheduleDates';

const fieldClass = 'mt-1 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#67BFA1]';

const TaskInfoCard = ({
  task,
  role,
  members = [],
  onAssign,
  editing = false,
  draft = null,
  onDraft,
  sprintIssues = [],
  sprintRange = null,
}) => {
  const assignedMembers = members.filter(m => task.assigneeIds?.includes(m.userId));
  const set = (patch) => onDraft?.({ ...draft, ...patch });

  return (
    <div className="bg-white rounded-[24px] p-10 shadow-sm border border-gray-100 w-full space-y-8">
      <section>
        <h3 className="text-lg font-bold text-[#67BFA1] mb-3">Propósito</h3>
        {editing ? (
          <textarea
            value={draft.purpose}
            onChange={(e) => set({ purpose: e.target.value })}
            rows={3}
            placeholder="Sin propósito definido."
            className={`${fieldClass} resize-none py-3`}
          />
        ) : (
          <div className="border-l-4 border-[#67BFA1] bg-gray-50 rounded-r-xl p-5 text-sm text-gray-600 leading-relaxed">
            {task.purpose || 'Sin propósito definido.'}
          </div>
        )}
      </section>

      <section>
        <h3 className="text-lg font-bold text-[#67BFA1] mb-3">Descripción</h3>
        {editing ? (
          <textarea
            value={draft.description}
            onChange={(e) => set({ description: e.target.value })}
            rows={4}
            className={`${fieldClass} resize-none py-3`}
          />
        ) : (
          <div className="border-l-4 border-[#67BFA1] bg-gray-50 rounded-r-xl p-5 text-sm text-gray-600 leading-relaxed">
            {task.description}
          </div>
        )}
      </section>

      {!editing && (
        <section>
          <h3 className="text-lg font-bold text-[#67BFA1] mb-3">Fecha fin tentativa</h3>
          <div className="border-l-4 border-[#67BFA1] bg-gray-50 rounded-r-xl p-5 text-sm text-gray-600 leading-relaxed">
            {task.completedAt ? formatLong(task.completedAt) : 'Por determinar'}
          </div>
        </section>
      )}

      {editing && (
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="text-xs font-bold uppercase tracking-widest text-slate-400">
            Prioridad
            <select
              value={draft.priority}
              onChange={(e) => set({ priority: e.target.value })}
              className={`${fieldClass} h-12`}
            >
              {PRIORITY_LEVELS.map((level) => (
                <option key={level.value} value={level.value}>{level.label}</option>
              ))}
            </select>
          </label>
          <label className="text-xs font-bold uppercase tracking-widest text-slate-400">
            Story points
            <input
              type="number"
              min="0"
              value={draft.points}
              onChange={(e) => set({ points: e.target.value })}
              className={`${fieldClass} h-12 font-semibold`}
            />
          </label>
          <div className="text-xs font-bold uppercase tracking-widest text-slate-400">
            Fecha fin tentativa
            <input
              type="date"
              min={sprintRange?.start || undefined}
              max={sprintRange?.end || undefined}
              disabled={draft.datePending}
              value={draft.datePending ? '' : (draft.endDate || '')}
              onChange={(e) => set({ endDate: e.target.value, datePending: false })}
              className={`${fieldClass} h-12 disabled:opacity-50`}
            />
            <label className="mt-2 flex items-center gap-2 text-sm font-medium normal-case tracking-normal text-slate-600">
              <input
                type="checkbox"
                className="h-4 w-4 accent-[#67BFA1]"
                checked={!!draft.datePending}
                onChange={(e) => set({ datePending: e.target.checked, endDate: e.target.checked ? '' : draft.endDate })}
              />
              Por determinar
            </label>
            {sprintRange?.start && sprintRange?.end && (
              <p className="mt-1 text-xs font-medium normal-case tracking-normal text-slate-400">
                Dentro del sprint: {formatLong(sprintRange.start)} – {formatLong(sprintRange.end)}.
              </p>
            )}
          </div>
          <label className="text-xs font-bold uppercase tracking-widest text-slate-400">
            ¿Es sub issue?
            <select
              value={draft.isSubIssue ? 'yes' : 'no'}
              onChange={(e) => {
                const yes = e.target.value === 'yes';
                set({ isSubIssue: yes, parentIssueId: yes ? draft.parentIssueId : '' });
              }}
              className={`${fieldClass} h-12`}
            >
              <option value="no">No</option>
              <option value="yes">Sí</option>
            </select>
          </label>
          <label className={`text-xs font-bold uppercase tracking-widest text-slate-400 sm:col-span-2 ${draft.isSubIssue ? '' : 'opacity-45'}`}>
            Issue padre
            <select
              required={draft.isSubIssue}
              disabled={!draft.isSubIssue}
              value={draft.parentIssueId || ''}
              onChange={(e) => set({ parentIssueId: e.target.value })}
              className={`${fieldClass} h-12 disabled:cursor-not-allowed`}
            >
              <option value="">{draft.isSubIssue ? 'Selecciona un issue...' : 'No aplica'}</option>
              {sprintIssues
                .filter((item) => String(item.id) !== String(task.id))
                .map((item) => (
                  <option key={item.id} value={item.id}>
                    #{item.displayIndex || item.id} — {item.title}
                  </option>
                ))}
            </select>
          </label>
          <div className="sm:col-span-2">
            <IssueTagPicker
              idPrefix="task-detail"
              enabled={draft.useTag}
              onEnabledChange={(useTag) => set({ useTag })}
              tagLabel={draft.tagLabel}
              tagColor={draft.tagColor}
              onLabelChange={(tagLabel) => set({ tagLabel })}
              onColorChange={(tagColor) => set({ tagColor })}
            />
          </div>
        </section>
      )}

      <section>
        <h3 className="text-lg font-bold text-[#67BFA1] mb-3">Equipo Asignado</h3>
        <TeamAvatars
          assignedMembers={assignedMembers}
          allMembers={members}
          assigneeIds={task.assigneeIds || []}
          taskId={task.id}
          canAdd={role === 'scrumMaster' || role === 'productOwner'}
          onAssign={onAssign}
        />
      </section>
    </div>
  );
};

export default TaskInfoCard;
