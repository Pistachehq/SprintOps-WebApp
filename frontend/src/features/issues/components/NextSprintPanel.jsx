import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { ArrowRight } from 'lucide-react';

export const NEXT_SPRINT_DROPPABLE_ID = 'next-sprint';

const NextSprintPanel = ({ disabled, nextSprintName }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: NEXT_SPRINT_DROPPABLE_ID,
    disabled: Boolean(disabled),
  });

  if (disabled) {
    return (
      <div
        className="flex h-full min-h-0 flex-1 flex-col items-center justify-center gap-2 px-4 py-10 text-center"
        role="region"
        aria-label="Siguiente sprint no disponible"
      >
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Zona no disponible</p>
        <p className="max-w-[14rem] text-sm font-semibold leading-snug text-slate-500">
          No hay siguiente sprint y no tienes permiso para crear uno
        </p>
        <div className="mt-4 rounded-full border border-dashed border-slate-300 p-4 text-slate-300">
          <ArrowRight className="h-10 w-10" strokeWidth={1.25} aria-hidden />
        </div>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      role="region"
      aria-label="Zona para enviar el issue al siguiente sprint"
      className="relative flex h-full min-h-0 w-full flex-1 flex-col items-center justify-center gap-4 overflow-hidden rounded-2xl bg-gradient-to-b from-[#52855f] via-[#446E51] to-[#2f4d3a] px-5 py-8 text-center transition-colors duration-200"
    >
      {isOver ? (
        <div
          className="pointer-events-none absolute inset-0 rounded-2xl bg-white/[0.14] ring-2 ring-inset ring-white/45"
          aria-hidden
        />
      ) : null}

      <div className="relative z-[1] flex max-w-[12rem] flex-col items-center gap-1">
        <p className="text-[11px] font-black uppercase leading-tight tracking-[0.22em] text-white">
          Enviar al siguiente sprint
        </p>
        {nextSprintName ? (
          <span
            className="mt-1 inline-flex max-w-full items-center justify-center rounded-lg bg-black/25 px-3 py-1.5 text-xs font-bold text-white shadow-inner backdrop-blur-[2px]"
            title={nextSprintName}
          >
            <span className="truncate">{nextSprintName}</span>
          </span>
        ) : (
          <p className="mt-1 text-xs font-semibold text-white/75">Suelta un issue aquí</p>
        )}
      </div>

      <ArrowRight
        className="relative z-[1] h-16 w-16 shrink-0 text-white drop-shadow-lg md:h-[4.5rem] md:w-[4.5rem]"
        strokeWidth={1.75}
        aria-hidden
      />

      <p className="relative z-[1] max-w-[11rem] text-[10px] font-medium leading-relaxed text-white/55">
        Arrastra una tarjeta desde cualquier columna
      </p>
    </div>
  );
};

export default NextSprintPanel;
