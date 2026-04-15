import React, { useState, useRef, useEffect } from 'react';
import { MoreVertical, ImagePlus, RotateCcw } from 'lucide-react';
import { projectsRepository } from '../data/repositories/projectsRepository';

function formatProjectDate(value) {
  if (value == null || value === '') return '—';
  const str = String(value).slice(0, 10);
  const d = new Date(`${str}T12:00:00`);
  if (Number.isNaN(d.getTime())) return str;
  return d.toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' });
}

const ProjectCard = ({ project, onSelect, userId, onCoverUpdated }) => {
  const { id, name, start, end, image, colorOverlay } = project;
  const fileInputRef = useRef(null);
  const menuRef = useRef(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [imgBroken, setImgBroken] = useState(false);
  const [coverBusy, setCoverBusy] = useState(false);

  useEffect(() => {
    setImgBroken(false);
  }, [image]);

  useEffect(() => {
    if (!menuOpen) return;
    const onDoc = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    const onKey = (e) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  const openPanel = () => onSelect(project);

  const handleCardKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openPanel();
    }
  };

  const handleMenuToggle = (e) => {
    e.stopPropagation();
    setMenuOpen((o) => !o);
  };

  const handleFileChange = async (e) => {
    e.stopPropagation();
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !file.type.startsWith('image/')) return;
    if (!userId) {
      window.alert('Inicia sesión para cambiar la imagen del proyecto.');
      return;
    }
    setCoverBusy(true);
    try {
      await projectsRepository.uploadProjectCardCover(id, userId, file);
      onCoverUpdated?.();
      setMenuOpen(false);
    } catch (err) {
      window.alert(err?.message || 'No se pudo subir la imagen');
    } finally {
      setCoverBusy(false);
    }
  };

  const handleRestoreDefault = async (e) => {
    e.stopPropagation();
    if (!userId) {
      window.alert('Inicia sesión para restaurar la imagen.');
      return;
    }
    setCoverBusy(true);
    try {
      await projectsRepository.deleteProjectCardCover(id, userId);
      onCoverUpdated?.();
      setMenuOpen(false);
    } catch (err) {
      window.alert(err?.message || 'No se pudo restaurar la imagen por defecto');
    } finally {
      setCoverBusy(false);
    }
  };

  const startFmt = formatProjectDate(start);
  const endFmt = formatProjectDate(end);
  const showImage = image && !imgBroken;

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`Abrir proyecto ${name}`}
      onClick={openPanel}
      onKeyDown={handleCardKeyDown}
      className="bg-white rounded-[20px] overflow-hidden shadow-sm hover:shadow-md transition-shadow group/card cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[#446E51] focus-visible:ring-offset-2 select-none"
    >
      <div className="relative h-48 overflow-hidden bg-slate-100 flex items-center justify-center">
        {showImage ? (
          <img
            src={image}
            alt=""
            className="w-full h-full object-cover transition-transform duration-500 group-hover/card:scale-105 pointer-events-none"
            onError={() => setImgBroken(true)}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#446E51] to-[#2d4a36] flex flex-col items-center justify-center pointer-events-none">
            <span className="text-white/30 text-5xl font-black tracking-tighter">{name?.charAt(0) || '?'}</span>
          </div>
        )}

        <div
          className="absolute inset-0 transition-opacity duration-300 pointer-events-none"
          style={{ backgroundColor: colorOverlay }}
        />

        <div
          ref={menuRef}
          className={`absolute top-2 right-2 z-20 transition-opacity duration-200 ${
            menuOpen
              ? 'opacity-100 pointer-events-auto'
              : 'opacity-0 pointer-events-none group-hover/card:opacity-100 group-hover/card:pointer-events-auto'
          }`}
        >
          <button
            type="button"
            onClick={handleMenuToggle}
            disabled={coverBusy}
            className="p-2 rounded-full bg-black/45 text-white hover:bg-black/60 backdrop-blur-sm shadow-md disabled:opacity-50"
            aria-label="Cambiar imagen de la card (todos la verán)"
            aria-expanded={menuOpen}
          >
            <MoreVertical size={18} strokeWidth={2.5} />
          </button>

          {menuOpen && (
            <div
              className="absolute top-full right-0 mt-1 w-56 rounded-xl bg-white shadow-xl border border-slate-100 py-1 text-left z-30 [&_button]:justify-start"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                disabled={coverBusy}
                className="w-full px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2 font-semibold text-left disabled:opacity-50"
                onClick={() => fileInputRef.current?.click()}
              >
                <ImagePlus size={16} className="text-[#446E51] shrink-0" />
                Subir imagen
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={handleFileChange}
              />
              <button
                type="button"
                disabled={coverBusy}
                className="w-full px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2 font-semibold text-left border-t border-slate-100 disabled:opacity-50"
                onClick={handleRestoreDefault}
              >
                <RotateCcw size={16} className="text-[#446E51] shrink-0" />
                Imagen Predeterminada
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="p-6 flex flex-col items-center pointer-events-none">
        <h3 className="text-2xl font-bold text-gray-800 mb-1 text-center leading-tight">{name}</h3>
        <p className="text-[11px] text-gray-500 text-center leading-relaxed">
          <span className="text-gray-400">Inicio</span> {startFmt}
          <span className="mx-1.5 text-gray-300">·</span>
          <span className="text-gray-400">Fin</span> {endFmt}
        </p>
      </div>
    </div>
  );
};

export default ProjectCard;
