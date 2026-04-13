import React from 'react';
import { ISSUE_TAG_COLORS, normalizeIssueTagColor, DEFAULT_ISSUE_TAG_COLOR } from '../../domain/issueTagPalette';

/**
 * Nombre de etiqueta + rejilla de colores (paleta fija del cronograma).
 */
const IssueTagPicker = ({
  tagLabel,
  tagColor,
  onLabelChange,
  onColorChange,
  enabled,
  onEnabledChange,
  idPrefix = 'tag',
}) => {
  const current = normalizeIssueTagColor(tagColor) || DEFAULT_ISSUE_TAG_COLOR;

  return (
    <div className="space-y-3 rounded-xl border border-gray-100 bg-gray-50/80 p-4">
      <label className="flex cursor-pointer items-center gap-2">
        <input
          type="checkbox"
          id={`${idPrefix}-use`}
          checked={enabled}
          onChange={(e) => onEnabledChange(e.target.checked)}
          className="h-4 w-4 rounded border-gray-300 text-[#446E51] focus:ring-[#446E51]"
        />
        <span className="text-xs font-bold uppercase tracking-widest text-gray-500">Etiqueta personalizada</span>
      </label>

      {enabled && (
        <>
          <div>
            <label htmlFor={`${idPrefix}-name`} className="mb-1 block text-xs font-bold uppercase tracking-widest text-gray-500">
              Nombre de la etiqueta
            </label>
            <input
              id={`${idPrefix}-name`}
              type="text"
              maxLength={100}
              className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#446E51]"
              value={tagLabel}
              onChange={(e) => onLabelChange(e.target.value)}
              placeholder="ej. Frontend, Urgente cliente, Spike…"
            />
          </div>
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-gray-500">Color de la etiqueta</p>
            <div className="flex flex-wrap gap-2">
              {ISSUE_TAG_COLORS.map((hex) => (
                <button
                  key={hex}
                  type="button"
                  title={hex}
                  onClick={() => onColorChange(hex)}
                  className={`h-8 w-8 shrink-0 rounded-lg border-2 transition-transform hover:scale-105 ${
                    current === hex ? 'border-slate-900 ring-2 ring-[#446E51]/30' : 'border-white shadow-sm'
                  }`}
                  style={{ backgroundColor: hex }}
                />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default IssueTagPicker;
