import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';

const IssueNode = ({ data }) => {
  const { label, size, depth, isSelected, isHighlighted, hasChildren } = data;

  const colors = [
    { bg: 'radial-gradient(circle at 35% 35%, #9ee0cf, #67BFA1 45%, #3d7563)', glow: 'rgba(103,191,161,0.7)', glowBright: 'rgba(186,255,228,0.95)' },
    { bg: 'radial-gradient(circle at 35% 35%, #a8e8d8, #52A98A 45%, #3d7563)', glow: 'rgba(82,169,138,0.6)', glowBright: 'rgba(196,255,232,0.9)' },
    { bg: 'radial-gradient(circle at 35% 35%, #bde8d2, #67BFA1 45%, #4a8f7a)', glow: 'rgba(103,191,161,0.5)', glowBright: 'rgba(206,255,234,0.85)' },
    { bg: 'radial-gradient(circle at 35% 35%, #d4f0e8, #7fd4bb 45%, #52A98A)', glow: 'rgba(127,212,187,0.4)', glowBright: 'rgba(216,255,238,0.8)' },
  ];

  const colorSet = colors[Math.min(depth, colors.length - 1)];

  const selectedBg = 'radial-gradient(circle at 35% 35%, #ffffff, #c8f5e3 35%, #67BFA1 75%)';
  const highlightedBg = 'radial-gradient(circle at 35% 35%, #f1fff8, #aceedb 40%, #52A98A 80%)';

  return (
    <div
      className="rounded-full flex items-center justify-center font-black text-white cursor-pointer transition-all duration-500"
      style={{
        width: size,
        height: size,
        fontSize: Math.max(9, size * 0.28),
        background: isSelected ? selectedBg : (isHighlighted ? highlightedBg : colorSet.bg),
        boxShadow: isSelected
          ? `0 0 60px ${colorSet.glowBright}, 0 0 130px ${colorSet.glowBright}, 0 0 220px ${colorSet.glow}, inset 0 0 26px rgba(255,255,255,0.45)`
          : isHighlighted
            ? `0 0 45px ${colorSet.glowBright}, 0 0 90px ${colorSet.glow}, inset 0 0 18px rgba(255,255,255,0.35)`
            : `0 0 ${hasChildren ? '25px' : '12px'} ${colorSet.glow}, inset 0 0 8px rgba(255,255,255,0.08)`,
        transform: isSelected ? 'scale(1.22)' : (isHighlighted ? 'scale(1.12)' : 'scale(1)'),
        animation: (isSelected || isHighlighted) ? 'none' : `float ${3 + depth * 0.5}s ease-in-out infinite`,
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
