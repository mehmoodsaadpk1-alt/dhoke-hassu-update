import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export interface AppModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const AppModal: React.FC<AppModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  className = '',
  size = 'md',
}) => {
  // Handle escape key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizes = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div 
        className={`bg-white w-full rounded-2xl shadow-2xl border border-slate-100 flex flex-col overflow-hidden animate-fade-in ${sizes[size]} ${className}`}
        onKeyDown={(e) => {
          if (e.key === 'Escape') onClose();
        }}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 p-5 bg-slate-50/50">
          <h3 id="modal-title" className="text-h3 font-black text-slate-900 leading-tight">
            {title}
          </h3>
          <button 
            onClick={onClose} 
            className="p-1 hover:bg-slate-100 rounded-2xl text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto max-h-[70vh] text-slate-700 text-sm">
          {children}
        </div>

        {/* Modal Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-2.5 border-t border-slate-100 p-5 bg-slate-50/50">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};


