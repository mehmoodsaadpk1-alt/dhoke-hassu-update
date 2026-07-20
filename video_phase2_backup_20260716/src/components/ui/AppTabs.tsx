import React from 'react';

export interface TabItem {
  id: string;
  label: string;
  count?: number;
}

export interface AppTabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
  className?: string;
}

export const AppTabs: React.FC<AppTabsProps> = ({
  tabs,
  activeTab,
  onChange,
  className = '',
}) => {
  return (
    <div className={`border-b border-slate-200/85 bg-white px-2 flex gap-1.5 overflow-x-auto no-scrollbar ${className}`}>
      {tabs.map((tab) => {
        const active = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`py-3.5 px-3 border-b-2 font-bold text-xs whitespace-nowrap transition-all duration-200 relative cursor-pointer select-none flex items-center gap-1.5
              ${active 
                ? 'border-primary text-primary font-black scale-102' 
                : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            role="tab"
            aria-selected={active}
            aria-controls={`panel-${tab.id}`}
            id={`tab-${tab.id}`}
          >
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full
                ${active 
                  ? 'bg-blue-100 text-primary' 
                  : 'bg-slate-100 text-slate-500'
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
