import React from 'react';

export const Card = ({
  children,
  className = '',
  hover = false,
  padding = 'p-6',
}) => {
  return (
    <div className={`card ${hover ? 'card-hover' : ''} ${padding} ${className}`}>
      {children}
    </div>
  );
};

export const CardHeader = ({ children, className = '', action }) => {
  return (
    <div className={`flex items-center justify-between mb-4 ${className}`}>
      <div>{children}</div>
      {action && <div>{action}</div>}
    </div>
  );
};

export const CardTitle = ({ children, className = '' }) => {
  return <h3 className={`text-lg font-semibold text-neutral-900 ${className}`}>{children}</h3>;
};

export const CardContent = ({ children, className = '' }) => {
  return <div className={className}>{children}</div>;
};

export default Card;