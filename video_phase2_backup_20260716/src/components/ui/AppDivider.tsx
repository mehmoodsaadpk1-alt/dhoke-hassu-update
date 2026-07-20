import React from 'react';

export interface AppDividerProps {
  label?: string;
  className?: string;
}

export const AppDivider: React.FC<AppDividerProps> = ({
  label,
  className = '',
}) => {
  return (
    <div className={`relative flex py-2 items-center w-full ${className}`}>
      <div className="flex-grow border-t border-slate-200/80" />
      {label && (
        <span className="flex-shrink mx-3 text-slate-400 font-bold text-[10px] uppercase tracking-wider bg-white px-2.5 select-none">
          {label}
        </span>
      )}
      <div className="flex-grow border-t border-slate-200/80" />
    </div>
  );
};
