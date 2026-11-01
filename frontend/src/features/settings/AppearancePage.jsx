import React, { useState } from 'react';
import { Check, Palette, RotateCcw, Trash2, Type } from 'lucide-react';
import BackButton from '../../components/ui/BackButton';
import {
  CONTRAST_COLORS,
  DARK_COLORS,
  DEFAULT_COLORS,
  FONTS,
  FONT_SIZES,
  LINE_HEIGHTS,
  THEMES,
  colorsFor,
  inkFor,
  loadAppearance,
  saveAppearance,
} from '../../domain/appearance';

const SWATCH = {
  default: DEFAULT_COLORS,
  dark: DARK_COLORS,
  contrast: CONTRAST_COLORS,
};

const COLOR_FIELDS = [
  { key: 'accent', label: 'Tinte de los botones' },
  { key: 'bg', label: 'Fondo' },
  { key: 'surface', label: 'Tarjetas' },
  { key: 'text', label: 'Texto' },
  { key: 'muted', label: 'Texto secundario' },
  { key: 'header', label: 'Barra superior' },
];

function commit(next) {
  saveAppearance(next);
  return next;
}

const ChoiceRow = ({ options, value, onChange, render }) => (
  <div className="flex flex-wrap gap-2">
    {options.map((option) => {
      const selected = option.id === value;
      return (
        <button
          key={option.id}
          type="button"
          onClick={() => onChange(option.id)}
          aria-pressed={selected}
          className={`rounded-lg border px-2.5 py-1.5 text-sm font-bold transition-colors ${
            selected
              ? 'border-[#67BFA1] bg-[#67BFA1]/15 text-slate-800'
              : 'border-gray-200 bg-white text-slate-600 hover:border-[#67BFA1]/50'
          }`}
          style={render ? { fontFamily: option.stack } : undefined}
        >
          {render ? render(option) : option.label}
        </button>
      );
    })}
  </div>
);

const AppearancePage = () => {
  const [prefs, setPrefs] = useState(() => loadAppearance());
  const [presetName, setPresetName] = useState('');
  const [hexDrafts, setHexDrafts] = useState({});
  const colors = colorsFor(prefs);

  const update = (patch) => {
    setPrefs((current) => commit({ ...current, ...patch }));
  };

  const selectTheme = (mode) => {
    if (mode === 'custom' && prefs.mode === 'preset') {
      const fromPreset = colorsFor(prefs);
      update({ mode: 'custom', presetId: null, custom: { ...fromPreset } });
      return;
    }
    update({ mode, presetId: mode === 'preset' ? prefs.presetId : null });
  };

  const setCustomColor = (key, value) => {
    setPrefs((current) => commit({
      ...current,
      mode: 'custom',
      presetId: null,
      custom: { ...current.custom, [key]: value },
    }));
  };

  const savePreset = () => {
    const name = presetName.trim();
    if (!name) return;
    const preset = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `preset-${Date.now()}`,
      name: name.slice(0, 40),
      colors: { ...colorsFor({ ...prefs, mode: 'custom', custom: prefs.mode === 'custom' ? prefs.custom : colors }) },
    };
    update({
      mode: 'preset',
      presetId: preset.id,
      presets: [...prefs.presets, preset],
    });
    setPresetName('');
  };

  const applyPreset = (preset) => {
    update({ mode: 'preset', presetId: preset.id });
  };

  const deletePreset = (id) => {
    const presets = prefs.presets.filter((item) => item.id !== id);
    update({
      presets,
      mode: prefs.presetId === id ? 'custom' : prefs.mode,
      presetId: prefs.presetId === id ? null : prefs.presetId,
      custom: prefs.presetId === id ? { ...colors } : prefs.custom,
    });
  };

  const reset = () => {
    setPresetName('');
    update({
      mode: 'default',
      presetId: null,
      custom: { ...DEFAULT_COLORS },
      font: 'system',
      fontSize: 'md',
      lineHeight: 'normal',
    });
  };

  return (
    <div className="absolute inset-0 flex flex-col overflow-hidden bg-[#F0EFED] px-5 py-4 sm:px-6 lg:px-8">
      <div className="mx-auto flex h-full min-h-0 w-full max-w-6xl flex-col">
        <div className="mb-3 flex shrink-0 items-center gap-3">
          <BackButton />
          <div className="min-w-0">
            <h1 className="text-2xl font-black text-slate-800">Apariencia</h1>
            <p className="text-sm font-medium text-slate-500">Tema, colores y tipografía de Pistache.</p>
          </div>
          <button
            type="button"
            onClick={reset}
            className="ml-auto inline-flex shrink-0 items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-bold text-slate-600 hover:bg-gray-50"
          >
            <RotateCcw size={15} />
            Restaurar
          </button>
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-2">
        <section className="flex min-h-0 flex-col rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-5">
          <div className="mb-3 flex items-center gap-2">
            <Palette size={16} className="text-[#67BFA1]" />
            <h2 className="text-base font-black text-slate-800">Tema</h2>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {THEMES.map((theme) => {
              const selected = prefs.mode === theme.id;
              const swatch = theme.id === 'custom' ? prefs.custom : SWATCH[theme.id];
              return (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => selectTheme(theme.id)}
                  aria-pressed={selected}
                  className={`flex items-center gap-3 rounded-xl border p-2.5 text-left transition-colors ${
                    selected ? 'border-[#67BFA1] bg-[#67BFA1]/10' : 'border-gray-200 hover:border-[#67BFA1]/40'
                  }`}
                >
                  <span className="flex shrink-0 -space-x-1.5">
                    {[swatch.bg, swatch.surface, swatch.accent].map((color) => (
                      <span
                        key={color}
                        className="h-6 w-6 rounded-full border border-black/10"
                        style={{ background: color }}
                      />
                    ))}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-black text-slate-800">{theme.label}</span>
                    <span className="block text-xs font-medium text-slate-500">{theme.hint}</span>
                  </span>
                  {selected && <Check size={18} className="ml-auto shrink-0 text-[#67BFA1]" />}
                </button>
              );
            })}
          </div>

          {prefs.mode === 'custom' && (
            <div className="mt-3 border-t border-gray-100 pt-3">
              <div className="mb-3 flex flex-wrap items-center gap-2 rounded-xl border border-gray-100 px-3 py-2" style={{ background: prefs.custom.bg, color: prefs.custom.text }}>
                <span className="text-xs font-semibold" style={{ color: prefs.custom.muted }}>Vista previa</span>
                <span className="rounded-lg px-3 py-1 text-xs font-black" style={{ background: prefs.custom.accent, color: inkFor(prefs.custom.accent) }}>
                  Botón
                </span>
                <span className="rounded-lg px-3 py-1 text-xs font-bold shadow-sm" style={{ background: prefs.custom.surface }}>
                  Tarjeta
                </span>
              </div>
              <div className="grid grid-cols-2 gap-x-3 gap-y-2">
                {COLOR_FIELDS.map((field) => (
                  <label key={field.key} className="block text-[11px] font-bold uppercase tracking-wide text-slate-400">
                    {field.label}
                    <span className="mt-1 flex items-center gap-1.5">
                      <input
                        type="color"
                        value={/^#[0-9a-fA-F]{6}$/.test(prefs.custom[field.key]) ? prefs.custom[field.key] : '#000000'}
                        onChange={(event) => setCustomColor(field.key, event.target.value)}
                        className="h-8 w-10 cursor-pointer rounded-md border border-gray-200 bg-white p-0.5"
                        aria-label={field.label}
                      />
                      <input
                        value={hexDrafts[field.key] ?? prefs.custom[field.key]}
                        onChange={(event) => {
                          const next = event.target.value;
                          if (!/^#[0-9a-fA-F]{0,6}$/.test(next)) return;
                          setHexDrafts((current) => ({ ...current, [field.key]: next }));
                          if (/^#[0-9a-fA-F]{6}$/.test(next)) setCustomColor(field.key, next);
                        }}
                        onBlur={() => setHexDrafts((current) => {
                          const next = { ...current };
                          delete next[field.key];
                          return next;
                        })}
                        spellCheck={false}
                        className="h-8 min-w-0 flex-1 rounded-lg border border-gray-200 bg-gray-50 px-2 font-mono text-xs font-semibold normal-case tracking-normal text-slate-700"
                      />
                    </span>
                  </label>
                ))}
              </div>
              <div className="mt-3 flex gap-2">
                <input
                  value={presetName}
                  onChange={(event) => setPresetName(event.target.value)}
                  onKeyDown={(event) => event.key === 'Enter' && savePreset()}
                  placeholder="Nombre del preset"
                  maxLength={40}
                  className="h-8 min-w-0 flex-1 rounded-lg border border-gray-200 bg-gray-50 px-2 text-sm font-semibold text-slate-700"
                />
                <button
                  type="button"
                  onClick={savePreset}
                  disabled={!presetName.trim()}
                  className="h-8 shrink-0 rounded-lg bg-[#67BFA1] px-3 text-xs font-black text-white disabled:opacity-40"
                >
                  Guardar preset
                </button>
              </div>
            </div>
          )}

          {prefs.presets.length > 0 && (
            <div className="mt-3 border-t border-gray-100 pt-3">
              <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-slate-400">Presets guardados</p>
              <ul className="space-y-1.5">
                {prefs.presets.map((preset) => {
                  const selected = prefs.mode === 'preset' && prefs.presetId === preset.id;
                  return (
                    <li key={preset.id} className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => applyPreset(preset)}
                        className={`flex min-w-0 flex-1 items-center gap-3 rounded-xl border px-3 py-2 text-left ${
                          selected ? 'border-[#67BFA1] bg-[#67BFA1]/10' : 'border-gray-200 hover:border-[#67BFA1]/40'
                        }`}
                      >
                        <span className="flex shrink-0 -space-x-1.5">
                          {[preset.colors.bg, preset.colors.accent, preset.colors.text].map((color) => (
                            <span key={color} className="h-5 w-5 rounded-full border border-black/10" style={{ background: color }} />
                          ))}
                        </span>
                        <span className="truncate text-sm font-bold text-slate-700">{preset.name}</span>
                        {selected && <Check size={16} className="ml-auto text-[#67BFA1]" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => deletePreset(preset.id)}
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-400 hover:bg-red-50 hover:text-red-600"
                        aria-label={`Eliminar ${preset.name}`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </section>

        <section className="flex min-h-0 flex-col rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-5">
          <div className="mb-3 flex items-center gap-2">
            <Type size={16} className="text-[#67BFA1]" />
            <h2 className="text-base font-black text-slate-800">Tipografía</h2>
          </div>
          <div className="space-y-4">
            <div>
              <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-slate-400">Fuente</p>
              <ChoiceRow
                options={FONTS}
                value={prefs.font}
                onChange={(font) => update({ font })}
                render={(option) => option.label}
              />
              <p className="mt-3 text-sm text-slate-600" style={{ fontFamily: FONTS.find((item) => item.id === prefs.font)?.stack }}>
                El sprint cierra el viernes. Así se lee un párrafo con esta fuente.
              </p>
            </div>
            <div>
              <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-slate-400">Tamaño</p>
              <ChoiceRow options={FONT_SIZES} value={prefs.fontSize} onChange={(fontSize) => update({ fontSize })} />
            </div>
            <div>
              <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-slate-400">Interlineado</p>
              <ChoiceRow options={LINE_HEIGHTS} value={prefs.lineHeight} onChange={(lineHeight) => update({ lineHeight })} />
            </div>
          </div>
        </section>
        </div>
      </div>
    </div>
  );
};

export default AppearancePage;
