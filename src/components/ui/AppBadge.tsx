import React from 'react';

export interface AppBadgeProps {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info';
  children: React.ReactNode;
  className?: string;
}

export const AppBadge: React.FC<AppBadgeProps> = ({
  variant = 'primary',
  children,
  className = '',
}) => {
  const variants = {
    primary: "bg-emerald-50 text-primary border border-emerald-100",
    secondary: "bg-slate-50 text-slate-700 border border-slate-200",
    success: "bg-emerald-50 text-success border border-emerald-100",
    warning: "bg-emerald-50 text-warning border border-amber-100",
    danger: "bg-red-50 text-error border border-red-100",
    info: "bg-emerald-50 text-emerald-600 border border-purple-100",
  };

  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
};

export interface AppChipProps {
  label: string;
  isActive?: boolean;
  onClick?: () => void;
  className?: string;
}

export const AppChip: React.FC<AppChipProps> = ({
  label,
  isActive = false,
  onClick,
  className = '',
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className={`px-3 py-1 rounded-full text-xs font-bold transition-all duration-200 whitespace-nowrap select-none
        ${onClick ? 'cursor-pointer active:scale-95' : 'cursor-default'}
        ${isActive 
          ? 'bg-primary text-white shadow-xs' 
          : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
        } ${className}`}
    >
      {label}
    </button>
  );
};

