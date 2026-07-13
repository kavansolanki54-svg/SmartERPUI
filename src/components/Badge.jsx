import React from 'react';

export const Badge = ({ children, variant = 'primary' }) => {
  return (
    <span className={`badge badge-subtle-${variant}`}>
      {children}
    </span>
  );
};
