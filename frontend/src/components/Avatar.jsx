import React from 'react';

const Avatar = ({ name, avatarUrl, size = 'md' }) => {
  const initials = name ? name.split(' ').map(n => n[0]).join('').toUpperCase() : '??';
  
  const sizes = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-xl'
  };

  if (avatarUrl) {
    return (
      <img src={avatarUrl} alt={name} className={`${sizes[size]} rounded-full object-cover shadow-sm`} />
    );
  }

  return (
    <div className={`${sizes[size]} rounded-full bg-oracle-red text-white flex items-center justify-center font-bold shadow-sm`}>
      {initials}
    </div>
  );
};

export default Avatar;
