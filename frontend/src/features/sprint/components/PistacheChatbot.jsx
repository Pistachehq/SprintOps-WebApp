import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Sparkles } from 'lucide-react';

// ─── Oracle brand ─────────────────────────────────────────────────────────────
const ORACLE_RED    = '#EE0004';
const ORACLE_HEADER = '#312D2A';

// ─── Bot responses ────────────────────────────────────────────────────────────
const BOT_RESPONSES = [
  '¡Claro! Puedo ayudarte a revisar el estado de tu sprint actual.',
  'Detecté que hay issues sin asignar. Te recomiendo revisarlas antes del Daily.',
  'El velocity del equipo está en tendencia positiva esta semana.',
  'Recuerda crear la Retro al finalizar el sprint para documentar aprendizajes.',
  'Puedes agregar nuevos sprints desde "Configurar Proyecto" en la barra superior.',
  'El flujo de issues se ve bien. ¿Quieres que analice el burndown del sprint?',
  '¡Entendido! Estoy procesando tu consulta... Dame un momento.',
];

// ─── Variantes del contenedor único ──────────────────────────────────────────
const CONTAINER_VARIANTS = {
  closed: {
    width: 100, height: 63, borderRadius: 32,
    backgroundColor: 'rgba(243,243,243,0)',
    transition: {
      width:           { type: 'spring', stiffness: 260, damping: 26 },
      height:          { type: 'spring', stiffness: 260, damping: 26 },
      borderRadius:    { type: 'spring', stiffness: 260, damping: 26 },
      backgroundColor: { duration: 0.3, ease: 'easeIn' },
    },
  },
  open: {
    width: 360, height: 520, borderRadius: 37,
    backgroundColor: 'rgba(243,243,243,1)',
    transition: {
      width:           { type: 'spring', stiffness: 260, damping: 26 },
      height:          { type: 'spring', stiffness: 260, damping: 26 },
      borderRadius:    { type: 'spring', stiffness: 260, damping: 26 },
      backgroundColor: { duration: 0.3, ease: 'easeOut' },
    },
  },
};

// ─── Small Oracle ring avatar (for chat messages) ─────────────────────────────
const OracleAvatar = ({ size = 28 }) => (
  <div style={{
    width: size, height: size,
    borderRadius: '50%',
    background: ORACLE_HEADER,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  }}>
    <svg width={Math.round(size * 0.64)} height={Math.round(size * 0.4)}
      viewBox="0 0 181 114" fill="none">
      <rect x="10" y="10" width="161" height="94" rx="37"
        stroke={ORACLE_RED} strokeWidth="22" />
    </svg>
  </div>
);

// ─── Typing indicator ─────────────────────────────────────────────────────────
const TypingIndicator = () => (
  <div className="flex items-end gap-1 px-4 py-3 bg-white rounded-2xl rounded-bl-sm shadow-sm w-fit">
    {[0, 1, 2].map(i => (
      <motion.div
        key={i}
        className="w-2 h-2 rounded-full"
        style={{ background: ORACLE_RED }}
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15, ease: 'easeInOut' }}
      />
    ))}
  </div>
);

// ─── Message bubble ───────────────────────────────────────────────────────────
const MessageBubble = ({ message }) => {
  const isBot = message.from === 'bot';
  return (
    <motion.div
      initial={{ opacity: 0, x: isBot ? -20 : 20, y: 8 }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ duration: 0.28, ease: 'easeOut' }}
      className={`flex ${isBot ? 'justify-start' : 'justify-end'}`}
    >
      {isBot && <div className="mr-2 mt-auto mb-0.5"><OracleAvatar size={28} /></div>}
      <div
        className={`max-w-[78%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
          isBot ? 'bg-white text-slate-800 rounded-bl-sm' : 'text-white rounded-br-sm'
        }`}
        style={!isBot ? { background: ORACLE_RED } : {}}
      >
        {message.text}
      </div>
    </motion.div>
  );
};

// ─── Chat window content ──────────────────────────────────────────────────────
const ChatWindow = ({ onClose }) => {
  const [messages, setMessages] = useState([
    { id: 1, from: 'bot', text: '¡Hola! Soy el asistente de Oracle SprintOps.' },
    { id: 2, from: 'bot', text: '¿En qué puedo ayudarte con tu sprint hoy?' },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping]     = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef       = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 420); }, []);

  const handleSend = () => {
    const text = inputValue.trim();
    if (!text) return;
    setMessages(prev => [...prev, { id: Date.now(), from: 'user', text }]);
    setInputValue('');
    setIsTyping(true);
    setTimeout(() => {
      const botText = BOT_RESPONSES[Math.floor(Math.random() * BOT_RESPONSES.length)];
      setIsTyping(false);
      setMessages(prev => [...prev, { id: Date.now() + 1, from: 'bot', text: botText }]);
    }, 1200 + Math.random() * 800);
  };

  const handleKeyDown = e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  // Fade in after modal expands; fade out immediately on close
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.08 } }}
      transition={{ delay: 0.3, duration: 0.2 }}
      style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column' }}
    >
      {/* Header */}
      <div className="px-5 py-4 flex items-center justify-between shrink-0"
        style={{ background: ORACLE_HEADER }}>
        <div className="flex items-center gap-3">
          {/* Mini Oracle oval in header */}
          <svg width="40" height="25" viewBox="0 0 181 114" fill="none">
            <rect x="10" y="10" width="161" height="94" rx="37"
              stroke={ORACLE_RED} strokeWidth="22" />
          </svg>
          <div>
            <p className="text-white font-bold text-sm leading-tight">Oracle AI</p>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full animate-pulse"
                style={{ background: ORACLE_RED }} />
              <p className="text-slate-400 text-xs">Asistente de SprintOps</p>
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
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M1 1L13 13M13 1L1 13" stroke="white" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </motion.button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
        {messages.map(msg => <MessageBubble key={msg.id} message={msg} />)}
        {isTyping && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="flex items-end gap-2">
            <OracleAvatar size={28} />
            <TypingIndicator />
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-4 pb-4 pt-2 shrink-0">
        <div className="flex items-center gap-2 bg-white rounded-2xl px-4 py-2.5 shadow-sm border border-slate-100">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escribe tu mensaje..."
            className="flex-1 text-sm text-slate-700 placeholder-slate-400 outline-none bg-transparent"
          />
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.88 }}
            onClick={handleSend}
            disabled={!inputValue.trim()}
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={inputValue.trim()
              ? { background: ORACLE_RED, color: 'white' }
              : { background: '#f1f5f9', color: '#cbd5e1', cursor: 'not-allowed' }}
          >
            <Send size={14} />
          </motion.button>
        </div>
        <p className="text-center text-[10px] text-slate-400 mt-2 flex items-center justify-center gap-1">
          <Sparkles size={9} /> Oracle AI · Solo para demostración
        </p>
      </div>
    </motion.div>
  );
};

// ─── Main Exported Component ──────────────────────────────────────────────────
// Un único motion.div que morfea entre el óvalo Oracle y el modal de chat.
// No hay dos elementos: el mismo div rota 90° y se expande.
const PistacheChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <motion.div
      initial="closed"
      animate={isOpen ? 'open' : 'closed'}
      variants={CONTAINER_VARIANTS}
      onClick={!isOpen ? () => setIsOpen(true) : undefined}
      whileHover={!isOpen ? { scale: 1.07 } : undefined}
      whileTap={!isOpen   ? { scale: 0.93 } : undefined}
      style={{
        position: 'fixed',
        bottom: 24, right: 24,
        zIndex: 50,
        border: `11px solid ${ORACLE_RED}`,
        overflow: 'hidden',
        cursor: !isOpen ? 'pointer' : 'default',
        transformOrigin: 'center',
      }}
    >
      <AnimatePresence>
        {isOpen && <ChatWindow onClose={() => setIsOpen(false)} />}
      </AnimatePresence>
    </motion.div>
  );
};

export default PistacheChatbot;
