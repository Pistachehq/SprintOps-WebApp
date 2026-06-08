import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, useAnimationControls } from 'framer-motion';
import { Send, Sparkles } from 'lucide-react';
import apiClient from '../../../data/api/apiClient';
import PistacheIcon from './PistacheIcon';

/* Paleta Oracle (de globals.css) */
const ORACLE_MAIN = '#67BFA1';        // verde pistache (acento principal)
const ORACLE_MAIN_HOVER = '#52A98A';
const ORACLE_RED = '#C74634';         // rojo Oracle
const ORACLE_HEADER = '#2B2B2B';
const ORACLE_BG = '#F0EFED';
/** Mismo asset que el favicon (pistachito). */
const PISTACHE_MARK_SRC = '/pistache-mark.png';

const PistacheAvatar = ({ size = 28 }) => (
  <div
    className="shrink-0 overflow-hidden rounded-full ring-1 ring-white/20"
    style={{ width: size, height: size }}
  >
    <img
      src={PISTACHE_MARK_SRC}
      alt=""
      width={size}
      height={size}
      draggable={false}
      className="h-full w-full object-cover"
    />
  </div>
);

const TypingIndicator = () => (
  <div className="flex items-end gap-1 px-4 py-3 bg-white rounded-2xl rounded-bl-sm shadow-sm w-fit">
    {[0, 1, 2].map(i => (
      <motion.div
        key={i}
        className="w-2 h-2 rounded-full"
        style={{ background: ORACLE_MAIN }}
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15, ease: 'easeInOut' }}
      />
    ))}
  </div>
);

const TYPEWRITER_SPEED_MS = 18;

const MessageBubble = ({ message, onStreamProgress, onStreamDone }) => {
  const isBot = message.from === 'bot';
  const isStreaming = !!message.streaming;
  const fullText = message.fullText ?? message.text ?? '';
  const [displayed, setDisplayed] = useState(isStreaming ? '' : fullText);

  useEffect(() => {
    if (!isStreaming) {
      setDisplayed(fullText);
      return undefined;
    }
    let i = 0;
    setDisplayed('');
    const total = fullText.length;
    // Para mensajes largos avanzamos más caracteres por tick.
    const step = total > 400 ? 3 : total > 150 ? 2 : 1;
    const interval = setInterval(() => {
      i = Math.min(total, i + step);
      setDisplayed(fullText.slice(0, i));
      onStreamProgress?.();
      if (i >= total) {
        clearInterval(interval);
        onStreamDone?.(message.id);
      }
    }, TYPEWRITER_SPEED_MS);
    return () => clearInterval(interval);
    // Solo re-ejecutar si cambia el mensaje (id) o su estado de streaming.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [message.id, isStreaming]);

  return (
    <motion.div
      initial={{ opacity: 0, x: isBot ? -20 : 20, y: 8 }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ duration: 0.28, ease: 'easeOut' }}
      className={`flex ${isBot ? 'justify-start' : 'justify-end'}`}
    >
      {isBot && <div className="mr-2 mt-auto mb-0.5"><PistacheAvatar size={28} /></div>}
      <div
        className={`max-w-[78%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm whitespace-pre-wrap ${
          isBot ? 'bg-white text-slate-800 rounded-bl-sm' : 'text-white rounded-br-sm'
        }`}
        style={!isBot ? { background: ORACLE_MAIN } : {}}
      >
        {displayed}
        {isStreaming && (
          <motion.span
            aria-hidden="true"
            className="inline-block align-baseline ml-0.5"
            style={{ width: 2, height: '1em', background: ORACLE_MAIN, verticalAlign: 'text-bottom' }}
            animate={{ opacity: [1, 0, 1] }}
            transition={{ duration: 0.9, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}
      </div>
    </motion.div>
  );
};

const MAX_HISTORY_TURNS = 20;

const ChatWindow = ({ onClose, projectId, userId, messages, setMessages }) => {
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 420); }, []);

  const buildHistoryPayload = useCallback(() => {
    const turns = [];
    for (const m of messages) {
      if (m.from === 'user') {
        turns.push({ role: 'user', content: m.text });
      } else if (m.from === 'bot') {
        turns.push({ role: 'assistant', content: m.fullText ?? m.text });
      }
    }
    if (turns.length <= MAX_HISTORY_TURNS) {
      return turns;
    }
    return turns.slice(-MAX_HISTORY_TURNS);
  }, [messages]);

  const handleSend = async () => {
    const text = inputValue.trim();
    if (!text) return;
    if (!userId || !projectId) {
      setMessages(prev => [...prev, {
        id: Date.now(),
        from: 'bot',
        text: 'Necesitas iniciar sesión y estar en un proyecto para usar el asistente.',
      }]);
      setInputValue('');
      return;
    }

    setMessages(prev => [...prev, { id: Date.now(), from: 'user', text }]);
    setInputValue('');
    setIsTyping(true);

    try {
      const history = buildHistoryPayload();
      const body = {
        projectId: Number(projectId),
        userId: Number(userId),
        message: text,
        history,
      };
      const { reply } = await apiClient.post('/chatbot/message', body);
      const finalText = reply || '(sin respuesta)';
      setIsTyping(false);
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        from: 'bot',
        text: '',
        fullText: finalText,
        streaming: true,
      }]);
      return;
    } catch (err) {
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        from: 'bot',
        text: err?.message || 'No pude contactar al asistente. ¿Está el backend en marcha y GROQ_API_KEY configurada?',
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.05 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.05, transition: { duration: 0.25, ease: 'easeIn' } }}
      transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
      style={{
        width: 360,
        height: 520,
        background: ORACLE_BG,
        borderRadius: 24,
        border: `3px solid ${ORACLE_MAIN}`,
        boxShadow: '0 24px 48px -12px rgba(0,0,0,0.35)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        // Origen ≈ posición de la semilla (centro del pistache de 90×130, ~65px debajo del borde inferior de la ventana, 45px desde el borde derecho)
        transformOrigin: 'calc(100% - 45px) calc(100% + 77px)',
      }}
    >
      <div className="px-5 py-4 flex items-center justify-between shrink-0"
        style={{ background: ORACLE_HEADER }}>
        <div className="flex items-center gap-3">
          <PistacheAvatar size={40} />
          <div>
            <p className="text-white font-bold text-sm leading-tight">Pistache</p>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full animate-pulse"
                style={{ background: ORACLE_MAIN }} />
              <p className="text-slate-400 text-xs">Pistache · contexto del proyecto</p>
            </div>
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.1, rotate: 90 }}
          whileTap={{ scale: 0.9 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          className="w-8 h-8 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(255,255,255,0.1)' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.2)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M1 1L13 13M13 1L1 13" stroke="white" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </motion.button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
        {messages.map(msg => (
          <MessageBubble
            key={msg.id}
            message={msg}
            onStreamProgress={() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })}
            onStreamDone={id => setMessages(prev => prev.map(m => (
              m.id === id ? { ...m, text: m.fullText ?? m.text, streaming: false } : m
            )))}
          />
        ))}
        {isTyping && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="flex items-end gap-2">
            <PistacheAvatar size={28} />
            <TypingIndicator />
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="px-4 pb-4 pt-2 shrink-0">
        <div className="flex items-center gap-2 bg-white rounded-2xl px-4 py-2.5 shadow-sm border border-slate-100">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Mensaje o /ayuda..."
            className="flex-1 text-sm text-slate-700 placeholder-slate-400 outline-none bg-transparent"
          />
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.88 }}
            onClick={handleSend}
            disabled={!inputValue.trim() || isTyping}
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={inputValue.trim() && !isTyping
              ? { background: ORACLE_MAIN, color: 'white' }
              : { background: '#f1f5f9', color: '#cbd5e1', cursor: 'not-allowed' }}
          >
            <Send size={14} />
          </motion.button>
        </div>
        <p className="text-center text-[10px] text-slate-400 mt-2 flex items-center justify-center gap-1">
          <Sparkles size={9} /> Groq (LLM) · datos del proyecto en servidor
        </p>
      </div>
    </motion.div>
  );
};

const INITIAL_MESSAGES = [
  {
    id: 1,
    from: 'bot',
    text: '¡Hola! Soy Pistache, conectado a Groq con contexto de este proyecto. Escribe /ayuda para comandos o pregúntame en natural (por ejemplo el daily de un compañero por fecha).',
  },
];

const PistacheChatbot = ({ projectId, userId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const shakeControls = useAnimationControls();
  const leftShellControls = useAnimationControls();
  const rightShellControls = useAnimationControls();
  const seedControls = useAnimationControls();

  // Abrir/cerrar las cáscaras al abrir/cerrar el chatbot
  useEffect(() => {
    if (isOpen) {
      leftShellControls.start({
        rotate: -10,
        x: -1,
        transition: { duration: 0.5, ease: 'easeOut' },
      });
      rightShellControls.start({
        rotate: 10,
        x: 1,
        transition: { duration: 0.5, ease: 'easeOut' },
      });
      seedControls.start({
        y: -8,
        transition: { duration: 0.5, ease: 'easeOut' },
      });
    } else {
      leftShellControls.start({
        rotate: 0,
        x: 0,
        transition: { duration: 0.4, ease: 'easeInOut' },
      });
      rightShellControls.start({
        rotate: 0,
        x: 0,
        transition: { duration: 0.4, ease: 'easeInOut' },
      });
      seedControls.start({
        y: 0,
        transition: { duration: 0.4, ease: 'easeInOut' },
      });
    }
  }, [isOpen, leftShellControls, rightShellControls, seedControls]);

  // Vibración periódica cada 7s mientras el chat esté cerrado
  useEffect(() => {
    if (isOpen) return undefined;
    const interval = setInterval(() => {
      shakeControls.start({
        rotate: [0, -8, 8, -6, 6, -3, 3, 0],
        x: [0, -2, 2, -1, 1, 0, 0, 0],
        transition: { duration: 0.6, ease: 'easeInOut' },
      });
      leftShellControls.start({
        rotate: [0, -4, -5, -3, 0],
        x: [0, -1, -1, 0, 0],
        transition: { duration: 1.2, ease: 'easeInOut' },
      });
      rightShellControls.start({
        rotate: [0, 4, 5, 3, 0],
        x: [0, 1, 1, 0, 0],
        transition: { duration: 1.2, ease: 'easeInOut' },
      });
    }, 7000);
    return () => clearInterval(interval);
  }, [isOpen, shakeControls, leftShellControls, rightShellControls]);

  const handleOpen = () => {
    if (!isOpen) setIsOpen(true);
  };

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 8,
        right: 12,
        zIndex: 50,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: 12,
        pointerEvents: 'none',
      }}
    >
      {/* Ventana del chat — flota encima del pistache */}
      <AnimatePresence>
        {isOpen && (
          <div style={{ pointerEvents: 'auto' }}>
            <ChatWindow
              onClose={() => setIsOpen(false)}
              projectId={projectId}
              userId={userId}
              messages={messages}
              setMessages={setMessages}
            />
          </div>
        )}
      </AnimatePresence>

      {/* Botón pistache — siempre visible abajo a la derecha */}
      <motion.div
        onClick={handleOpen}
        whileHover={!isOpen ? { scale: 1.07 } : undefined}
        whileTap={!isOpen ? { scale: 0.93 } : undefined}
        style={{
          width: 90,
          height: 130,
          cursor: !isOpen ? 'pointer' : 'default',
          pointerEvents: 'auto',
          transformOrigin: 'center',
        }}
      >
        <motion.div
          animate={shakeControls}
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <PistacheIcon
            leftShellControls={leftShellControls}
            rightShellControls={rightShellControls}
            seedControls={seedControls}
          />
        </motion.div>
      </motion.div>
    </div>
  );
};

export default PistacheChatbot;
