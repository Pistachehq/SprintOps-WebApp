import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';

const SunNode = ({ data }) => {
  const { label, size } = data;

  return (
    <div
      className="rounded-full flex items-center justify-center cursor-default transition-all duration-500"
      style={{
        width: size,
        height: size,
        background: 'radial-gradient(circle at 40% 38%, #ffb347, #e8702a 40%, #c0392b 70%, #922b21)',
        boxShadow: '0 0 60px rgba(232,112,42,0.6), 0 0 120px rgba(232,112,42,0.3), 0 0 200px rgba(192,57,43,0.2), inset 0 0 30px rgba(255,255,255,0.15)',
        animation: 'sunPulse 4s ease-in-out infinite',
      }}
    >
      <span
        className="font-black text-white text-center leading-tight px-4"
        style={{
          fontSize: Math.max(12, size * 0.12),
          textShadow: '0 2px 12px rgba(0,0,0,0.5)',
          maxWidth: size * 0.75,
          overflow: 'hidden',
          display: '-webkit-box',
          WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical',
        }}
      >
        {label}
      </span>
      <Handle
        type="source"
        position={Position.Top}
        className="!bg-transparent !border-0 !w-0 !h-0"
        style={{ top: '50%', left: '50%' }}
      />
    </div>
  );
};

export default memo(SunNode);
