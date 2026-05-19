import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';

const IssueNode = ({ data }) => {
  const { label, size, depth, isSelected, hasChildren } = data;

  const colors = [
    { bg: 'radial-gradient(circle at 35% 35%, #9ee0cf, #67BFA1 45%, #3d7563)', glow: 'rgba(103,191,161,0.7)' },
    { bg: 'radial-gradient(circle at 35% 35%, #a8e8d8, #52A98A 45%, #3d7563)', glow: 'rgba(82,169,138,0.6)' },
    { bg: 'radial-gradient(circle at 35% 35%, #bde8d2, #67BFA1 45%, #4a8f7a)', glow: 'rgba(103,191,161,0.5)' },
    { bg: 'radial-gradient(circle at 35% 35%, #d4f0e8, #7fd4bb 45%, #52A98A)', glow: 'rgba(127,212,187,0.4)' },
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
