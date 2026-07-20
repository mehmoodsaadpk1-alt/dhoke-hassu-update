import React from 'react';

export interface AppLoaderProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'white' | 'teal';
  className?: string;
}

export const AppLoader: React.FC<AppLoaderProps> = ({
  size = 'md',
  color = 'primary',
  className = '',
}) => {
  const sizes = {
    sm: "w-5 h-5 border-2",
    md: "w-8 h-8 border-3",
    lg: "w-12 h-12 border-4",
  };

  const colors = {
    primary: "border-primary/20 border-t-primary",
    white: "border-white/20 border-t-white",
    teal: "border-secondary/20 border-t-secondary",
  };

  return (
    <div className="flex items-center justify-center p-4">
      <div 
        className={`animate-spin rounded-full border-solid ${sizes[size]} ${colors[color]} ${className}`}
        role="status"
        aria-label="loading"
      />
    </div>
  );
};
