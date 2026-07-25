import React from 'react';

export interface AppSkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
}

export const AppSkeleton: React.FC<AppSkeletonProps> = ({
  className = '',
  variant = 'rectangular',
}) => {
  const variants = {
    text: "h-3 w-3/4 rounded-sm",
    circular: "rounded-full",
    rectangular: "rounded-2xl",
  };

  return (
    <div className={`animate-pulse bg-slate-200/80 ${variants[variant]} ${className}`} />
  );
};

export const SkeletonCard: React.FC = () => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-xs space-y-4">
      <div className="flex items-center gap-3">
        <AppSkeleton variant="circular" className="w-10 h-10" />
        <div className="space-y-1.5 flex-1">
          <AppSkeleton variant="text" className="w-1/3" />
          <AppSkeleton variant="text" className="w-1/4 h-2" />
        </div>
      </div>
      <div className="space-y-2">
        <AppSkeleton variant="rectangular" className="h-4 w-full" />
        <AppSkeleton variant="rectangular" className="h-4 w-5/6" />
      </div>
      <div className="flex justify-between items-center pt-2">
        <AppSkeleton variant="rectangular" className="h-8 w-20" />
        <AppSkeleton variant="rectangular" className="h-8 w-16" />
      </div>
    </div>
  );
};

export const SkeletonFeed: React.FC = () => {
  return (
    <div className="space-y-4">
      <SkeletonCard />
      <SkeletonCard />
    </div>
  );
};

export const SkeletonChat: React.FC = () => {
  return (
    <div className="p-4 space-y-4">
      <div className="flex gap-2">
        <AppSkeleton variant="circular" className="w-8 h-8 shrink-0" />
        <AppSkeleton variant="rectangular" className="h-10 w-2/3 rounded-tr-none" />
      </div>
      <div className="flex gap-2 justify-end">
        <AppSkeleton variant="rectangular" className="h-12 w-1/2 rounded-tl-none bg-emerald-100" />
        <AppSkeleton variant="circular" className="w-8 h-8 shrink-0" />
      </div>
      <div className="flex gap-2">
        <AppSkeleton variant="circular" className="w-8 h-8 shrink-0" />
        <AppSkeleton variant="rectangular" className="h-8 w-1/3 rounded-tr-none" />
      </div>
    </div>
  );
};

export const SkeletonProfile: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="relative h-44 bg-slate-200 animate-pulse rounded-t-xl" />
      <div className="px-5 -mt-16 relative space-y-4">
        <AppSkeleton variant="circular" className="w-24 h-24 border-4 border-white" />
        <div className="space-y-2">
          <AppSkeleton variant="text" className="w-1/2 h-6" />
          <AppSkeleton variant="text" className="w-1/3 h-4" />
        </div>
      </div>
    </div>
  );
};


