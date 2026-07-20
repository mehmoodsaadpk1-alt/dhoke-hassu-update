import React from 'react';
import { ArrowLeft } from 'lucide-react';

export interface AppHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  actions?: React.ReactNode;
  className?: string;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  title,
  subtitle,
  onBack,
  actions,
  className = '',
}) => {
  return (
    <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 ${className}`}>
      <div className="flex items-center gap-3 min-w-0">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-600 cursor-pointer shrink-0 border border-slate-200/40"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        <div className="min-w-0">
          <h2 className="text-h2 font-black text-slate-950 flex items-center gap-2 leading-tight select-none">
            {title}
          </h2>
          {subtitle && (
            <p className="text-xs text-slate-500 mt-1 font-medium select-none truncate">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {actions && (
        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
          {actions}
        </div>
      )}
    </div>
  );
};
