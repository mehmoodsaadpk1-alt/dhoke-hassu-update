import React from 'react';

export interface AppCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'outlined' | 'interactive';
  hoverEffect?: boolean;
}

export const AppCard: React.FC<AppCardProps> = ({
  variant = 'default',
  hoverEffect = false,
  children,
  className = '',
  ...props
}) => {
  const baseStyle = "bg-white rounded-2xl p-5 border transition-all duration-200";
  
  const variants = {
    default: "border-slate-200/60 shadow-xs",
    elevated: "border-slate-100 shadow-md",
    outlined: "border-slate-200 shadow-none",
    interactive: "border-slate-200/60 shadow-xs hover:border-slate-300 hover:shadow-md cursor-pointer",
  };

  const hoverStyle = hoverEffect && variant !== 'interactive' ? "hover:shadow-md hover:border-slate-300" : "";

  return (
    <div
      className={`${baseStyle} ${variants[variant]} ${hoverStyle} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export interface AppStatCardProps extends AppCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: {
    value: string | number;
    isPositive?: boolean;
  };
}

export const AppStatCard: React.FC<AppStatCardProps> = ({
  title,
  value,
  icon,
  trend,
  className = '',
  ...props
}) => {
  return (
    <AppCard variant="elevated" className={`flex items-center justify-between gap-4 p-5 ${className}`} {...props}>
      <div className="space-y-1.5 min-w-0">
        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">{title}</span>
        <h4 className="text-display text-slate-900 leading-none truncate font-black">{value}</h4>
        {trend && (
          <span className={`inline-flex items-center gap-0.5 text-[10px] font-bold ${trend.isPositive ? 'text-success' : 'text-error'}`}>
            {trend.isPositive ? '↑' : '↓'} {trend.value}
          </span>
        )}
      </div>
      {icon && (
        <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-200/60 flex items-center justify-center text-slate-500 shrink-0 shadow-inner">
          {icon}
        </div>
      )}
    </AppCard>
  );
};


