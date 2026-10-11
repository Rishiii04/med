import React from 'react';

export const Input = ({
  label,
  error,
  helperText,
  id,
  className = '',
  ...props
}) => {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
  const errorId = `${inputId}-error`;
  const helperId = `${inputId}-helper`;
  
  const describedBy = [error && errorId, helperText && helperId].filter(Boolean).join(' ') || undefined;
  
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="label">
          {label}
        </label>
      )}
      <input
        id={inputId}
        aria-describedby={describedBy}
        aria-invalid={error ? 'true' : 'false'}
        className={`input ${error ? 'input-error' : ''} ${className}`}
        {...props}
      />
      {error && (
        <p id={errorId} className="form-error" role="alert">
          {error}
        </p>
      )}
      {helperText && !error && (
        <p id={helperId} className="text-sm text-neutral-500 mt-1">
          {helperText}
        </p>
      )}
    </div>
  );
};

export const Textarea = ({
  label,
  error,
  helperText,
  id,
  className = '',
  rows = 3,
  ...props
}) => {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
  const errorId = `${inputId}-error`;
  const helperId = `${inputId}-helper`;
  
  const describedBy = [error && errorId, helperText && helperId].filter(Boolean).join(' ') || undefined;
  
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="label">
          {label}
        </label>
      )}
      <textarea
        id={inputId}
        aria-describedby={describedBy}
        aria-invalid={error ? 'true' : 'false'}
        rows={rows}
        className={`input ${error ? 'input-error' : ''} ${className} resize-y`}
        {...props}
      />
      {error && (
        <p id={errorId} className="form-error" role="alert">
          {error}
        </p>
      )}
      {helperText && !error && (
        <p id={helperId} className="text-sm text-neutral-500 mt-1">
          {helperText}
        </p>
      )}
    </div>
  );
};

export const Select = ({
  label,
  error,
  helperText,
  id,
  options = [],
  className = '',
  placeholder = 'Select an option',
  ...props
}) => {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
  const errorId = `${inputId}-error`;
  const helperId = `${inputId}-helper`;
  
  const describedBy = [error && errorId, helperText && helperId].filter(Boolean).join(' ') || undefined;
  
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="label">
          {label}
        </label>
      )}
      <select
        id={inputId}
        aria-describedby={describedBy}
        aria-invalid={error ? 'true' : 'false'}
        className={`input ${error ? 'input-error' : ''} ${className}`}
        {...props}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p id={errorId} className="form-error" role="alert">
          {error}
        </p>
      )}
      {helperText && !error && (
        <p id={helperId} className="text-sm text-neutral-500 mt-1">
          {helperText}
        </p>
      )}
    </div>
  );
};

export default Input;