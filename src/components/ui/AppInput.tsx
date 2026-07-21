import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export interface AppInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  requiredIndicator?: boolean;
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
}

export const AppInput: React.FC<AppInputProps> = ({
  label,
  error,
  helperText,
  requiredIndicator = false,
  leadingIcon,
  trailingIcon,
  type = 'text',
  className = '',
  disabled,
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword && showPassword ? 'text' : type;

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label className="block text-xs font-semibold text-slate-700">
          {label} {requiredIndicator && <span className="text-error font-bold">*</span>}
        </label>
      )}
      <div className="relative">
        {leadingIcon && (
          <div className="absolute inset-y-0 start-0 ps-3.5 flex items-center pointer-events-none text-slate-400">
            {leadingIcon}
          </div>
        )}
        <input
          type={inputType}
          disabled={disabled}
          className={`w-full bg-slate-50 border rounded-xl text-sm placeholder-slate-400 transition-all duration-200 disabled:opacity-50 disabled:bg-slate-100/60
            ${leadingIcon ? 'ps-10' : 'ps-4'}
            ${trailingIcon || isPassword ? 'pe-10' : 'pe-4'}
            ${error ? 'border-error focus:border-error focus:ring-red-100' : 'border-slate-200 focus:border-primary focus:bg-white focus:ring-2 focus:ring-blue-100'}
            py-2.5 h-10.5
            ${className}`}
          {...props}
        />
        {isPassword && !disabled && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 end-0 pe-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
        {!isPassword && trailingIcon && (
          <div className="absolute inset-y-0 end-0 pe-3.5 flex items-center pointer-events-none text-slate-400">
            {trailingIcon}
          </div>
        )}
      </div>
      {error && <p className="text-[10px] text-error font-bold">{error}</p>}
      {!error && helperText && <p className="text-[10px] text-slate-400 font-bold">{helperText}</p>}
    </div>
  );
};

export interface AppTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  requiredIndicator?: boolean;
}

export const AppTextarea: React.FC<AppTextareaProps> = ({
  label,
  error,
  helperText,
  requiredIndicator = false,
  className = '',
  disabled,
  ...props
}) => {
  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label className="block text-xs font-semibold text-slate-700">
          {label} {requiredIndicator && <span className="text-error font-bold">*</span>}
        </label>
      )}
      <textarea
        disabled={disabled}
        className={`w-full bg-slate-50 border rounded-xl text-sm placeholder-slate-400 transition-all duration-200 resize-none disabled:opacity-50 disabled:bg-slate-100/60 px-4 py-2.5 min-h-[96px]
          ${error ? 'border-error focus:border-error focus:ring-red-100' : 'border-slate-200 focus:border-primary focus:bg-white focus:ring-2 focus:ring-blue-100'}
          ${className}`}
        {...props}
      />
      {error && <p className="text-[10px] text-error font-bold">{error}</p>}
      {!error && helperText && <p className="text-[10px] text-slate-400 font-bold">{helperText}</p>}
    </div>
  );
};

export interface AppSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  requiredIndicator?: boolean;
  leadingIcon?: React.ReactNode;
}

export const AppSelect: React.FC<AppSelectProps> = ({
  label,
  error,
  helperText,
  requiredIndicator = false,
  leadingIcon,
  children,
  className = '',
  disabled,
  ...props
}) => {
  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label className="block text-xs font-semibold text-slate-700">
          {label} {requiredIndicator && <span className="text-error font-bold">*</span>}
        </label>
      )}
      <div className="relative">
        {leadingIcon && (
          <div className="absolute inset-y-0 start-0 ps-3.5 flex items-center pointer-events-none text-slate-400">
            {leadingIcon}
          </div>
        )}
        <select
          disabled={disabled}
          className={`w-full bg-slate-50 border rounded-xl text-sm transition-all duration-200 appearance-none cursor-pointer disabled:opacity-50 disabled:bg-slate-100/60
            ${leadingIcon ? 'ps-10' : 'ps-4'}
            pe-10 py-2.5 h-10.5
            ${error ? 'border-error focus:border-error focus:ring-red-100' : 'border-slate-200 focus:border-primary focus:bg-white focus:ring-2 focus:ring-blue-100'}
            ${className}`}
          {...props}
        >
          {children}
        </select>
        <div className="absolute inset-y-0 end-0 pe-3.5 flex items-center pointer-events-none text-slate-400">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
      {error && <p className="text-[10px] text-error font-bold">{error}</p>}
      {!error && helperText && <p className="text-[10px] text-slate-400 font-bold">{helperText}</p>}
    </div>
  );
};
