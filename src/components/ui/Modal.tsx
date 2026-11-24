import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  maxWidthClass?: string;
  variant?: 'default' | 'lightbox';
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({
  open,
  onClose,
  title,
  subtitle,
  maxWidthClass = 'max-w-3xl',
  variant = 'default',
  children,
}) => {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  const isLightbox = variant === 'lightbox';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-[#013A42]/80"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`w-full ${maxWidthClass} max-h-[90vh] flex flex-col overflow-hidden ${
          isLightbox
            ? 'card-midnight brutal-card-on-dark'
            : 'card-beige brutal-card frame-shadow-bordo'
        }`}
      >
        <div
          className={`flex items-start justify-between gap-4 px-6 py-4 border-b-2 ${
            isLightbox
              ? 'border-[#8ACCD5] bg-[#013A42] text-[#F8F8E1]'
              : 'border-[#013A42] card-blue text-[#013A42]'
          }`}
        >
          <div className="min-w-0">
            {subtitle && (
              <p
                className={`font-mono-num text-xs font-bold mb-0.5 ${
                  isLightbox ? 'text-[#8ACCD5]' : 'text-[#013A42]/85'
                }`}
              >
                {subtitle}
              </p>
            )}
            <h2 id="modal-title" className="font-display text-xl font-extrabold leading-tight break-words">
              {title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup dialog"
            className={`${
              isLightbox
                ? 'brutal-btn-on-dark'
                : 'brutal-btn brutal-btn-primary'
            } p-2 shrink-0 cursor-pointer`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
};
