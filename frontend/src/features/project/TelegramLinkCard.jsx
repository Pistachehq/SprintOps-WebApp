import React, { useState } from 'react';
import { MessageCircle, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import apiClient from '../../data/api/apiClient';

/**
 * Vinculación Telegram por teléfono (solo desde Configuración del proyecto).
 */
const TelegramLinkCard = ({ userId, suggestedProjectId }) => {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [doneMsg, setDoneMsg] = useState(null);
  const [telegramUrl, setTelegramUrl] = useState(null);
  const [error, setError] = useState(null);
  const [showCodeFallback, setShowCodeFallback] = useState(false);
  const [codeLoading, setCodeLoading] = useState(false);
  const [codeInfo, setCodeInfo] = useState(null);

  const savePhone = async () => {
    if (!userId) return;
    const trimmed = phone.trim();
    if (trimmed.length < 8) {
      setError('Escribe tu número con lada internacional (ej. +52…).');
      return;
    }
    setLoading(true);
    setError(null);
    setDoneMsg(null);
    setTelegramUrl(null);
    try {
      const body = { userId: Number(userId), phone: trimmed };
      if (suggestedProjectId != null) body.projectId = Number(suggestedProjectId);
      const res = await apiClient.post('/telegram/register-phone', body);
      setDoneMsg(res.message || 'Listo. Sigue en Telegram.');
      if (res.telegramUrl) setTelegramUrl(res.telegramUrl);
    } catch (e) {
      setError(e.message || 'No se pudo guardar');
    } finally {
      setLoading(false);
    }
  };

  const generateCodeFallback = async () => {
    if (!userId) return;
    setCodeLoading(true);
    setError(null);
    setCodeInfo(null);
    try {
      const body = { userId: Number(userId) };
      if (suggestedProjectId != null) body.projectId = Number(suggestedProjectId);
      const res = await apiClient.post('/telegram/link-code', body);
      setCodeInfo(res);
    } catch (e) {
      setError(e.message || 'No se pudo generar el código');
    } finally {
      setCodeLoading(false);
    }
  };

  if (!userId) return null;

  const proyectoHint =
    suggestedProjectId != null ? (
      <span>
        {' '}
        Tras vincular, para <strong>este proyecto</strong> usa{' '}
        <span className="font-mono text-slate-800">/proyecto {suggestedProjectId}</span> en Telegram.
      </span>
    ) : (
      <span>
        {' '}
        Luego elige proyecto con <span className="font-mono text-slate-800">/proyecto ID</span> en Telegram.
      </span>
    );

  return (
    <div className="flex items-start gap-3">
      <div className="rounded-xl bg-[#446E51]/10 p-2 text-[#446E51] shrink-0">
        <MessageCircle size={22} />
      </div>
      <div className="min-w-0 flex-1 space-y-2">
        <p className="text-sm text-slate-600 leading-relaxed">
          Guarda el <strong>mismo</strong> número que vas a compartir en Telegram. Abre el bot, escribe{' '}
          <span className="font-mono text-slate-800">/vincular</span> y pulsa «Compartir mi número».
          {proyectoHint}
        </p>
        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">
          Tu teléfono (con lada)
        </label>
        <input
          type="tel"
          autoComplete="tel"
          placeholder="+52 55 1234 5678"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full max-w-md rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-900 focus:ring-2 focus:ring-[#446E51] focus:border-transparent outline-none"
        />
        <button
          type="button"
          onClick={savePhone}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#446E51] text-white text-xs font-bold hover:opacity-90 disabled:opacity-60"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : null}
          Guardar y continuar en Telegram
        </button>
        {error && <p className="text-xs text-red-600">{error}</p>}
        {doneMsg && <p className="text-xs text-green-700 font-semibold">{doneMsg}</p>}
        {telegramUrl && (
          <a
            href={telegramUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-block text-xs text-[#446E51] font-bold underline"
          >
            Abrir bot en Telegram
          </a>
        )}

        <button
          type="button"
          onClick={() => setShowCodeFallback((v) => !v)}
          className="flex items-center gap-1 text-[11px] text-slate-500 font-semibold mt-2"
        >
          {showCodeFallback ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          Prefiero un código en lugar del teléfono
        </button>
        {showCodeFallback && (
          <div className="rounded-xl bg-slate-50 border border-slate-100 p-3 text-xs text-slate-600 space-y-2">
            <p>
              Genera un código y en Telegram escribe <span className="font-mono">/vincular CODIGO</span>.
            </p>
            <button
              type="button"
              onClick={generateCodeFallback}
              disabled={codeLoading}
              className="text-[#446E51] font-bold underline underline-offset-2"
            >
              {codeLoading ? 'Generando…' : 'Generar código'}
            </button>
            {codeInfo?.code && <p className="font-mono font-bold text-slate-900">{codeInfo.code}</p>}
            {codeInfo?.deepLink && (
              <a href={codeInfo.deepLink} target="_blank" rel="noreferrer" className="block text-[#446E51] font-bold">
                Abrir en Telegram
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TelegramLinkCard;
