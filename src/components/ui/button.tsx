import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline';
  size?: 'sm' | 'md' | 'lg';
}

export function Button({ 
  children, 
  className = '', 
  variant = 'default',
  size = 'md',
  disabled,
  ...props 
}: ButtonProps) {
  // Base classes
  let classes = 'rounded font-medium focus:outline-none transition-colors';
  
  // Size classes
  if (size === 'sm') {
    classes += ' px-3 py-1 text-sm';
  } else if (size === 'lg') {
    classes += ' px-6 py-3 text-lg';
  } else {
    classes += ' px-4 py-2'; // md - default
  }
  
  // Variant classes
  if (variant === 'outline') {
    classes += ' border border-gray-300 text-gray-700 hover:bg-gray-50';
  } else {
    classes += ' bg-blue-600 text-white hover:bg-blue-700';
  }
  
  // Disabled state
  if (disabled) {
    classes += ' opacity-50 cursor-not-allowed';
  }
  
  // Combine with any className passed as prop
  classes += ` ${className}`;
  
  return (
    <button 
      className={classes} 
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
} 