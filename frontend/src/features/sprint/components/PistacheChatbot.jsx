import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { Send, Sparkles } from 'lucide-react';

// ─── SVG Paths ────────────────────────────────────────────────────────────────
const LEFT_SHELL_PATH =
  'M75.3318 182.492C68.5852 190.262 61.0022 194.821 53.193 195.8C45.3837 196.779 37.5662 194.153 30.3693 188.131C23.1724 182.109 16.7971 172.861 11.7562 161.129C6.71537 149.398 3.14973 135.512 1.34616 120.587C-0.457408 105.663 -0.448561 90.1168 1.37199 75.2002C3.19255 60.2836 6.77398 46.4127 11.8282 34.7035C16.8823 22.9943 23.2682 13.7737 30.4719 7.78351C37.6756 1.79328 45.4961 -0.799335 53.3043 0.214246L50 98L75.3318 182.492Z';
const RIGHT_SHELL_PATH =
  'M-2.19839e-07 167.296C5.81422 178.692 12.9726 187.102 20.8411 191.78C28.7096 196.458 37.0453 197.261 45.1099 194.117C53.1744 190.973 60.7189 183.979 67.075 173.755C73.4311 163.531 78.4027 150.392 81.5493 135.503C84.6959 120.614 85.9205 104.433 85.1146 88.3943C84.3086 72.3557 81.497 56.9542 76.9288 43.5541C72.3606 30.154 66.1768 19.1688 58.9252 11.5717C51.6735 3.9746 43.5779 1.21674e-06 35.3553 0L35.3553 98L-2.19839e-07 167.296Z';

// ─── Oracle brand color (matches main app header) ─────────────────────────────
const ORACLE_HEADER = '#312D2A';

// ─── Bot response pool ────────────────────────────────────────────────────────
const BOT_RESPONSES = [
  '¡Claro! Puedo ayudarte a revisar el estado de tu sprint actual 🌿',
  'Detecté que hay issues sin asignar. Te recomiendo revisarlas antes del Daily.',
  'El velocity del equipo está en tendencia positiva esta semana 📈',
  'Recuerda crear la Retro al finalizar el sprint para documentar aprendizajes.',
  'Puedes agregar nuevos sprints desde "Configurar Proyecto" en la barra superior.',
  'El flujo de issues se ve bien. ¿Quieres que analice el burndown del sprint?',
  '¡Entendido! Estoy procesando tu consulta... Dame un momento 🔍',
];

// ─── Dimensions ───────────────────────────────────────────────────────────────
const W = 36, H = 70;
const WL = 27, WR = 31;
const L_ORIGIN = '66% 100%';
const R_ORIGIN = '41% 100%';

// ─── 5 visual states ──────────────────────────────────────────────────────────
// wiggle  → static display of mini icons (header / avatars)
// shake   → used exclusively by the idle animation (animated via controls)
const PISTATE = {
  closed:  { lx: 0,   lr: 0,   rx: 0,  rr: 0,   cy: 0  },
  wiggle:  { lx: -12, lr: -2,  rx: 4,  rr: 6,   cy: -3 }, // mini icon display
  shake:   { lx: -5,  lr: -7,  rx: 5,  rr: 7,   cy: -3 }, // idle peek (fallback)
  hovered: { lx: -5,  lr: -8,  rx: 5,  rr: 8,   cy: -4 },
  open:    { lx: -11, lr: -21, rx: 11, rr: 21,  cy: -9 },
};

const SHELL_SPRING = { type: 'spring', stiffness: 300, damping: 22 };

// ─── Animated Pistachio Icon (floating button) ────────────────────────────────
const PistacheIcon = ({ state = 'closed' }) => {
  const v = PISTATE[state];
  return (
    <div style={{ position: 'relative', width: W, height: H, overflow: 'visible' }}>
      {/* Green center */}
      <motion.div
        style={{ position: 'absolute', left: '50%', x: '-50%', top: 6, width: 22, height: 46, zIndex: 1 }}
        animate={{ y: v.cy }}
        transition={SHELL_SPRING}
      >
        <svg viewBox="0 0 64 129" width="22" height="46">
          <ellipse cx="32" cy="64.5" rx="32" ry="64.5" fill="#AAD4B2" />
        </svg>
      </motion.div>

      {/* Left shell */}
      <motion.div
        style={{ position: 'absolute', left: 0, top: 0, width: WL, height: H, zIndex: 2, transformOrigin: L_ORIGIN }}
        animate={{ x: v.lx, rotate: v.lr }}
        transition={SHELL_SPRING}
      >
        <svg viewBox="0 0 76 196" width={WL} height={H}>
          <path d={LEFT_SHELL_PATH} fill="#E5B28D" />
        </svg>
      </motion.div>

      {/* Right shell */}
      <motion.div
        style={{ position: 'absolute', right: 0, top: 0, width: WR, height: H, zIndex: 3, transformOrigin: R_ORIGIN }}
        animate={{ x: v.rx, rotate: v.rr }}
        transition={SHELL_SPRING}
      >
        <svg viewBox="0 0 86 196" width={WR} height={H}>
          <path d={RIGHT_SHELL_PATH} fill="#C79877" />
        </svg>
      </motion.div>
    </div>
  );
};

// ─── Static mini pistachio — parked at a given open level ────────────────────
// openState: 'closed' | 'wiggle' | 'hovered' | 'open'
// For the chat header we pass openState='wiggle' so it looks slightly open.
const MiniPistache = ({ width = 28, height = 38, openState = 'closed' }) => {
  const s   = height / H;
  const wl  = Math.round(WL * s);
  const wr  = Math.round(WR * s);
  const v   = PISTATE[openState];

  // Scale translations with icon size; rotations are angular (keep same degrees)
  const lx = v.lx * s;
  const rx = v.rx * s;
  const cy = v.cy * s;

  return (
    <div style={{ position: 'relative', width, height, overflow: 'visible', flexShrink: 0 }}>
      {/* Green center */}
      <svg
        style={{
          position: 'absolute', left: '50%',
          transform: `translateX(-50%) translateY(${1}px)`,
          top: Math.round(6 * s), width: Math.round(22 * s), height: Math.round(46 * s), zIndex: 1,
        }}
        viewBox="0 0 64 129"
      >
        <ellipse cx="32" cy="64.5" rx="32" ry="64.5" fill="#AAD4B2" />
      </svg>

      {/* Left shell */}
      <svg
        style={{
          position: 'absolute', left: 4, top: 0, width: wl, height, zIndex: 3,
          transformOrigin: L_ORIGIN,
          transform: `translateX(${lx}px) rotate(${v.lr}deg)`,
        }}
        viewBox="0 0 76 196"
      >
        <path d={LEFT_SHELL_PATH} fill="#E5B28D" />
      </svg>

      {/* Right shell */}
      <svg
        style={{
          position: 'absolute', right: 2, top: 0, width: wr, height, zIndex: 2,
          transformOrigin: R_ORIGIN,
          transform: `translateX(${rx}px) rotate(${v.rr}deg)`,
        }}
        viewBox="0 0 86 196"
      >
        <path d={RIGHT_SHELL_PATH} fill="#C79877" />
      </svg>
    </div>
  );
};

// ─── Typing indicator ─────────────────────────────────────────────────────────
const TypingIndicator = () => (
  <div className="flex items-end gap-1 px-4 py-3 bg-white rounded-2xl rounded-bl-sm shadow-sm w-fit">
    {[0, 1, 2].map((i) => (
      <motion.div
        key={i}
        className="w-2 h-2 rounded-full bg-[#AAD4B2]"
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
      {isBot && (
        // Avatar — uses oracle header color, pistachio closed (avatar is small, keep clean)
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center mr-2 mt-auto mb-0.5 shrink-0"
          style={{ background: ORACLE_HEADER }}
        >
          <MiniPistache width={14} height={19} openState="wiggle" />
        </div>
      )}
      <div className={`max-w-[78%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
        isBot ? 'bg-white text-slate-800 rounded-bl-sm' : 'bg-[#446E51] text-white rounded-br-sm'
      }`}>
        {message.text}
      </div>
    </motion.div>
  );
};

// ─── Chat Window ──────────────────────────────────────────────────────────────
const ChatWindow = ({ onClose }) => {
  const [messages, setMessages] = useState([
    { id: 1, from: 'bot', text: '¡Hola! Soy Pistache, tu asistente de SprintOps 🌿' },
    { id: 2, from: 'bot', text: '¿En qué puedo ayudarte con tu sprint hoy?' },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping]     = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef       = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 300); }, []);

  const handleSend = () => {
    const text = inputValue.trim();
    if (!text) return;
    setMessages((prev) => [...prev, { id: Date.now(), from: 'user', text }]);
    setInputValue('');
    setIsTyping(true);
    setTimeout(() => {
      const botText = BOT_RESPONSES[Math.floor(Math.random() * BOT_RESPONSES.length)];
      setIsTyping(false);
      setMessages((prev) => [...prev, { id: Date.now() + 1, from: 'bot', text: botText }]);
    }, 1200 + Math.random() * 800);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 320, damping: 28 }}
      className="absolute bottom-24 right-0 w-[360px] bg-[#F4F4F2] rounded-3xl shadow-2xl overflow-hidden flex flex-col"
      style={{ height: 480, transformOrigin: 'bottom right' }}
    >
      {/* Header — oracle header color */}
      <div
        className="px-5 py-4 flex items-center justify-between shrink-0"
        style={{ background: ORACLE_HEADER }}
      >
        <div className="flex items-center gap-3">
          {/* Header pistachio — same reference size as avatar (14×19), scaled 2× via CSS */}
          <div style={{ width: 28, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <div style={{ transform: 'scale(2)', transformOrigin: 'center' }}>
              <MiniPistache width={14} height={19} openState="wiggle" />
            </div>
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-tight">Pistache AI</p>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-[#AAD4B2] animate-pulse" />
              <p className="text-[#AAD4B2] text-xs">Asistente de SprintOps</p>
            </div>
          </div>
        </div>
        <motion.button
          whileHover={{ scale: 1.1, rotate: 90 }}
          whileTap={{ scale: 0.9 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
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
        {messages.map((msg) => <MessageBubble key={msg.id} message={msg} />)}
        {isTyping && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex items-end gap-2">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
              style={{ background: ORACLE_HEADER }}
            >
              <MiniPistache width={14} height={19} openState="wiggle" />
            </div>
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
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escribe tu mensaje..."
            className="flex-1 text-sm text-slate-700 placeholder-slate-400 outline-none bg-transparent"
          />
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.88 }}
            onClick={handleSend}
            disabled={!inputValue.trim()}
            className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
              inputValue.trim() ? 'bg-[#446E51] text-white' : 'bg-slate-100 text-slate-300 cursor-not-allowed'
            }`}
          >
            <Send size={14} />
          </motion.button>
        </div>
        <p className="text-center text-[10px] text-slate-400 mt-2 flex items-center justify-center gap-1">
          <Sparkles size={9} /> Pistache AI · Solo para demostración
        </p>
      </div>
    </motion.div>
  );
};

// ─── Main Exported Component ──────────────────────────────────────────────────
const PistacheChatbot = () => {
  const [isOpen,     setIsOpen]     = useState(false);
  const [isHovered,  setIsHovered]  = useState(false);
  const [isWiggling, setIsWiggling] = useState(false);

  const isOpenRef    = useRef(false);
  const isHoveredRef = useRef(false);
  const mountedRef   = useRef(true);

  useEffect(() => { isOpenRef.current    = isOpen;    }, [isOpen]);
  useEffect(() => { isHoveredRef.current = isHovered; }, [isHovered]);
  useEffect(() => { return () => { mountedRef.current = false; }; }, []);

  const bodyControls = useAnimation();

  const triggerWiggle = useCallback(async () => {
    if (isOpenRef.current || isHoveredRef.current) return;

    // 1. Abrir cáscaras primero — esperar 1 frame para que React aplique el estado
    if (mountedRef.current) setIsWiggling(true);
    await new Promise((r) => setTimeout(r, 32)); // ~2 frames → shells empiezan a abrirse

    // 2. Agitar el cuerpo mientras las cáscaras están abiertas
    await bodyControls.start({
      x: [0, -7, 7, -5, 5, -3, 3, 0],
      transition: { duration: 0.85, ease: 'easeInOut' },
    });

    // 3. Mantener shells abiertos un momento visible antes de cerrar
    await new Promise((r) => setTimeout(r, 350));
    if (mountedRef.current) setIsWiggling(false);
  }, [bodyControls]);

  useEffect(() => {
    let timerId;
    const schedule = () => {
      const delay = 10_000 + Math.random() * 5_000;
      timerId = setTimeout(async () => {
        await triggerWiggle();
        schedule();
      }, delay);
    };
    schedule();
    return () => clearTimeout(timerId);
  }, [triggerWiggle]);

  const pistacheState =
    isOpen      ? 'open'    :
    isWiggling  ? 'shake'   :  // idle animation uses its own state
    isHovered   ? 'hovered' : 'closed';

  const handleClick = () => {
    setIsOpen((prev) => !prev);
    setIsHovered(false);
    setIsWiggling(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      <AnimatePresence>
        {isOpen && <ChatWindow onClose={() => setIsOpen(false)} />}
      </AnimatePresence>

      <motion.button
        onClick={handleClick}
        onMouseEnter={() => { setIsHovered(true); setIsWiggling(false); }}
        onMouseLeave={() =>   setIsHovered(false)}
        whileTap={{ scale: 0.9 }}
        style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', userSelect: 'none' }}
        title={isOpen ? 'Cerrar Pistache AI' : 'Abrir Pistache AI'}
      >
        <motion.div
          animate={bodyControls}
          style={{
            filter: isHovered || isOpen
              ? 'drop-shadow(0 8px 20px rgba(0,0,0,0.28))'
              : 'drop-shadow(0 3px 8px rgba(0,0,0,0.16))',
            transition: 'filter 0.3s ease',
          }}
        >
          <PistacheIcon state={pistacheState} />
        </motion.div>
      </motion.button>
    </div>
  );
};

export default PistacheChatbot;
