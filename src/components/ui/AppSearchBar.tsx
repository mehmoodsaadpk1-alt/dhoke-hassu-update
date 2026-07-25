import React from 'react';
import { Search, X, SlidersHorizontal } from 'lucide-react';

export interface AppSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onFilterClick?: () => void;
  hasFilter?: boolean;
  className?: string;
}

export const AppSearchBar: React.FC<AppSearchBarProps> = ({
  value,
  onChange,
  placeholder = 'Search...',
  onFilterClick,
  hasFilter = false,
  className = '',
}) => {
  return (
    <div className={`relative flex items-center gap-2 ${className}`}>
      <div className="relative flex-1">
        <div className="absolute inset-y-0 start-0 ps-3.5 flex items-center pointer-events-none text-slate-400">
          <Search className="w-4 h-4" />
        </div>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full ps-10 pe-10 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm placeholder-slate-400 focus:outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-emerald-100 transition-all duration-200"
        />
        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute inset-y-0 end-0 pe-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            aria-label="Clear search"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      {hasFilter && onFilterClick && (
        <button
          type="button"
          onClick={onFilterClick}
          className="p-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl transition-all border border-slate-200/40 cursor-pointer active:scale-95 shrink-0"
          aria-label="Toggle filters"
        >
          <SlidersHorizontal className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

