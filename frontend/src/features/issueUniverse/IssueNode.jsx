import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';

const IssueNode = ({ data }) => {
  const { label, size, depth, isSelected, hasChildren } = data;

  const colors = [
    { bg: 'radial-gradient(circle at 35% 35%, #7acea0, #446E51 45%, #2d4a36)', glow: 'rgba(68,110,81,0.7)' },
    { bg: 'radial-gradient(circle at 35% 35%, #8fd4af, #5a9468 45%, #3d6b49)', glow: 'rgba(90,148,104,0.6)' },
    { bg: 'radial-gradient(circle at 35% 35%, #a8e0c4, #6eaa82 45%, #4e8563)', glow: 'rgba(110,170,130,0.5)' },
    { bg: 'radial-gradient(circle at 35% 35%, #bde8d2, #82bb96 45%, #5f9a76)', glow: 'rgba(130,187,150,0.4)' },
  ];

  const colorSet = colors[Math.min(depth, colors.length - 1)];

  return (
    <div
      className="rounded-full flex items-center justify-center font-black text-white cursor-pointer transition-all duration-500"
      style={{
        width: size,
        height: size,
        fontSize: Math.max(9, size * 0.28),
        background: colorSet.bg,
        boxShadow: isSelected
          ? `0 0 50px ${colorSet.glow}, 0 0 100px ${colorSet.glow}, inset 0 0 20px rgba(255,255,255,0.15)`
          : `0 0 ${hasChildren ? '25px' : '12px'} ${colorSet.glow}, inset 0 0 8px rgba(255,255,255,0.08)`,
        transform: isSelected ? 'scale(1.2)' : 'scale(1)',
        animation: isSelected ? 'none' : `float ${3 + depth * 0.5}s ease-in-out infinite`,
        animationDelay: `${(parseInt(label.replace('#', '')) || 0) * 0.6}s`,
      }}
    >
      <span style={{ textShadow: '0 2px 10px rgba(0,0,0,0.4)', letterSpacing: '-0.02em' }}>
        {label}
      </span>
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-transparent !border-0 !w-0 !h-0"
        style={{ top: '50%', left: '50%' }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-transparent !border-0 !w-0 !h-0"
        style={{ top: '50%', left: '50%' }}
      />
    </div>
  );
};

export default memo(IssueNode);
