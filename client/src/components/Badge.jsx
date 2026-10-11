import React from 'react';

export const Badge = ({
  children,
  variant = 'neutral',
  size = 'md',
  className = '',
  dot = false,
}) => {
  const variantClasses = {
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    danger: 'bg-red-100 text-red-800',
    info: 'bg-blue-100 text-blue-800',
    neutral: 'bg-neutral-100 text-neutral-800',
    primary: 'bg-primary-100 text-primary-800',
  };
  
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-0.5 text-xs',
    lg: 'px-3 py-1 text-sm',
  };
  
  const dotColors = {
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    danger: 'bg-red-500',
    info: 'bg-blue-500',
    neutral: 'bg-neutral-500',
    primary: 'bg-primary-500',
  };
  
  return (
    <span className={`inline-flex items-center badge ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}>
      {dot && <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${dotColors[variant]}`} />}
      {children}
    </span>
  );
};

export const StatusBadge = ({ status, showDot = true }) => {
  const statusConfig = {
    REGISTERED: { variant: 'neutral', label: 'Registered' },
    WAITING: { variant: 'info', label: 'Waiting' },
    CALLED: { variant: 'warning', label: 'Called' },
    IN_PROGRESS: { variant: 'primary', label: 'In Progress' },
    COMPLETED: { variant: 'success', label: 'Completed' },
    SKIPPED: { variant: 'danger', label: 'Skipped' },
    CANCELLED: { variant: 'neutral', label: 'Cancelled' },
    NO_SHOW: { variant: 'danger', label: 'No Show' },
  };
  
  const config = statusConfig[status] || { variant: 'neutral', label: status };
  
  return <Badge variant={config.variant} dot={showDot}>{config.label}</Badge>;
};

export default Badge;