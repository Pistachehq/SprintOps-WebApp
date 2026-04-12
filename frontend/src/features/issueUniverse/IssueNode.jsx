import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';

const IssueNode = ({ data }) => {
  const { label, size, isRoot, isSelected, hasChildren } = data;

  const baseColor = isRoot ? '#446E51' : '#6B9F7B';
  const glowColor = isRoot ? 'rgba(68,110,81,0.6)' : 'rgba(107,159,123,0.5)';

  return (
    <div
      className="rounded-full flex items-center justify-center font-black text-white cursor-pointer transition-all duration-500"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.28,
        background: isRoot
          ? 'radial-gradient(circle at 35% 35%, #5a9468, #446E51 50%, #2d4a36)'
          : 'radial-gradient(circle at 35% 35%, #8fbf9c, #6B9F7B 50%, #4a7a5a)',
        boxShadow: isSelected
          ? `0 0 40px ${glowColor}, 0 0 80px ${glowColor}, 0 8px 32px rgba(0,0,0,0.3)`
          : `0 0 ${hasChildren ? '20px' : '12px'} ${glowColor}, 0 4px 16px rgba(0,0,0,0.2)`,
        transform: isSelected ? 'scale(1.15)' : 'scale(1)',
        animation: isSelected ? 'none' : 'float 4s ease-in-out infinite',
        animationDelay: `${(parseInt(label.replace('#', '')) || 0) * 0.7}s`,
      }}
    >
      <span style={{ textShadow: '0 2px 8px rgba(0,0,0,0.3)', letterSpacing: '-0.02em' }}>
        {label}
      </span>
      <Handle type="target" position={Position.Left} className="!bg-transparent !border-0 !w-0 !h-0" />
      <Handle type="source" position={Position.Right} className="!bg-transparent !border-0 !w-0 !h-0" />
    </div>
  );
};

export default memo(IssueNode);
