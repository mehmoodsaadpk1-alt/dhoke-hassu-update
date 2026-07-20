import React from 'react';
import { AppButton } from './AppButton';

export interface AppEmptyStateProps {
  title: string;
  description: string;
  illustration?: React.ReactNode;
  primaryActionLabel?: string;
  onPrimaryAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  className?: string;
}

export const AppEmptyState: React.FC<AppEmptyStateProps> = ({
  title,
  description,
  illustration,
  primaryActionLabel,
  onPrimaryAction,
  secondaryActionLabel,
  onSecondaryAction,
  className = '',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center text-center p-8 bg-white border border-slate-200/60 rounded-md shadow-xs space-y-4 max-w-md mx-auto ${className}`}>
      {illustration ? (
        <div className="text-slate-300 mb-2">{illustration}</div>
      ) : (
        <div className="w-16 h-16 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-300 text-2xl mb-2">
          📭
        </div>
      )}
      <div className="space-y-1">
        <h4 className="text-h3 font-black text-slate-800 leading-tight">{title}</h4>
        <p className="text-xs text-slate-500 font-medium px-4">{description}</p>
      </div>
      {(onPrimaryAction || onSecondaryAction) && (
        <div className="flex flex-wrap gap-2.5 justify-center pt-2 w-full">
          {onSecondaryAction && secondaryActionLabel && (
            <AppButton variant="outline" size="sm" onClick={onSecondaryAction}>
              {secondaryActionLabel}
            </AppButton>
          )}
          {onPrimaryAction && primaryActionLabel && (
            <AppButton variant="primary" size="sm" onClick={onPrimaryAction}>
              {primaryActionLabel}
            </AppButton>
          )}
        </div>
      )}
    </div>
  );
};
