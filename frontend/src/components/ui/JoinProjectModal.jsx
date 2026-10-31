import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { AnimatedPopup } from '../PopupPortal';

const formatWait = (seconds) => {
  const total = Math.max(0, seconds);
  const minutes = Math.floor(total / 60);
  const rest = total % 60;
  if (minutes <= 0) return `${rest} s`;
  return `${minutes} min ${rest.toString().padStart(2, '0')} s`;
};

const JoinProjectModal = ({ isOpen, onClose, onJoin }) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [lockedUntil, setLockedUntil] = useState(0);
  const [now, setNow] = useState(() => Date.now());

  const locked = lockedUntil > now;
  const waitSeconds = locked ? Math.ceil((lockedUntil - now) / 1000) : 0;

  useEffect(() => {
    if (!locked) return undefined;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [locked]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (locked || submitting) return;
    const trimmed = code.trim();
    if (!/^[A-Za-z0-9]{5,6}$/.test(trimmed)) {
      setError('El código tiene 5 o 6 caracteres, con letras y números.');
      setSuccess('');
      return;
    }
    setSubmitting(true);
    setError('');
    setSuccess('');
    try {
      const name = await onJoin(trimmed);
      setSuccess(name ? `Te uniste a ${name}.` : 'Te uniste al proyecto.');
      setCode('');
      window.setTimeout(() => {
        setSuccess('');
        onClose();
      }, 900);
    } catch (err) {
      const retry = Number(err?.retryAfterSeconds);
      if (Number.isFinite(retry) && retry > 0) {
        setLockedUntil(Date.now() + retry * 1000);
        setNow(Date.now());
      }
      setError(err?.message || 'El código introducido no corresponde a un proyecto registrado, inténtalo nuevamente.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatedPopup open={isOpen}>
      <div className="popup-overlay fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="popup-panel w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50 p-6">
            <h2 className="text-xl font-black tracking-tight text-gray-800">Unirse a un proyecto</h2>
            <button type="button" onClick={onClose} className="text-gray-400 transition-colors hover:text-gray-600">
              <X size={24} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-6">
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-gray-500">
                Código del proyecto
              </label>
              <p className="mb-4 text-sm text-gray-600">
                Escríbelo tal cual. Las mayúsculas y las minúsculas cuentan.
              </p>
              <input
                type="text"
                maxLength={6}
                required
                disabled={locked || submitting}
                value={code}
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck={false}
                onChange={(e) => {
                  setCode(e.target.value.replace(/[^A-Za-z0-9]/g, '').slice(0, 6));
                  if (!locked) setError('');
                }}
                className="h-14 w-full rounded-xl border-2 border-gray-200 bg-gray-50 px-4 text-center font-mono text-2xl font-bold tracking-[0.3em] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#67BFA1] disabled:opacity-60"
                placeholder="A7k2M9"
              />
              {success && (
                <p className="mt-3 text-sm font-medium text-[#3d7563]">{success}</p>
              )}
              {error && (
                <p className="mt-3 text-sm font-medium leading-relaxed text-red-600">{error}</p>
              )}
              {locked && (
                <p className="mt-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                  Bloqueado · {formatWait(waitSeconds)}
                </p>
              )}
            </div>

            <div className="mt-2 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="h-12 flex-1 rounded-xl bg-gray-100 font-bold text-slate-600 transition-colors hover:bg-gray-200"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={locked || submitting}
                className="h-12 flex-1 rounded-xl bg-[#67BFA1] font-bold text-white shadow-lg shadow-[#67BFA1]/25 transition-colors hover:bg-[#52A98A] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? 'Uniendo...' : 'Unirse'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AnimatedPopup>
  );
};

export default JoinProjectModal;
