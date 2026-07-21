import React from 'react';

export interface AppButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const AppButton: React.FC<AppButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  children,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyle = "inline-flex items-center justify-center font-bold transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary select-none cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.98]";
  
  const variants = {
    primary: "bg-primary hover:bg-primary-dark text-white border border-transparent shadow-sm hover:shadow-md",
    secondary: "bg-secondary hover:bg-teal-800 text-white border border-transparent shadow-sm hover:shadow-md",
    outline: "bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-xs hover:shadow-sm",
    ghost: "bg-transparent hover:bg-slate-100/80 text-slate-600 border border-transparent",
    danger: "bg-error hover:bg-red-700 text-white border border-transparent shadow-sm hover:shadow-md",
    success: "bg-success hover:bg-emerald-700 text-white border border-transparent shadow-sm hover:shadow-md",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs rounded-sm gap-1.5 h-8",
    md: "px-4.5 py-2.5 text-sm rounded-md gap-2 h-10.5",
    lg: "px-6 py-3.5 text-base rounded-lg gap-2.5 h-13",
  };

  return (
    <button
      className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <svg className="animate-spin -ms-1 me-2 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      )}
      {!isLoading && leftIcon && <span className="flex shrink-0">{leftIcon}</span>}
      <span>{children}</span>
      {!isLoading && rightIcon && <span className="flex shrink-0">{rightIcon}</span>}
    </button>
  );
};
