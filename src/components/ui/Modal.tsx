import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  maxWidthClass?: string;
  variant?: 'default' | 'lightbox';
  tone?: 'bordo' | 'navy' | 'green' | 'gold';
  disableEscapeClose?: boolean;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({
  open,
  onClose,
  title,
  subtitle,
  maxWidthClass = 'max-w-2xl',
  variant = 'default',
  tone,
  disableEscapeClose = false,
  children,
}) => {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !disableEscapeClose) onClose();
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open, onClose, disableEscapeClose]);

  if (!open) return null;

  const isLightbox = variant === 'lightbox';
  const resolvedTone = tone || (isLightbox ? 'green' : 'navy');
  const isGold = resolvedTone === 'gold';

  const containerClass =
    resolvedTone === 'gold'
      ? 'card-gold brutal-card frame-gold'
      : resolvedTone === 'green'
      ? 'card-green brutal-card-on-dark'
      : resolvedTone === 'bordo'
      ? 'card-bordo brutal-card-on-dark'
      : 'card-navy brutal-card-on-dark';

  const headerClass =
    resolvedTone === 'gold'
      ? 'border-[#001F24] bg-[#D9B44A] text-[#001F24]'
      : resolvedTone === 'green'
      ? 'border-[#D9B44A] bg-[#0F3D3A] text-[#F8F8E1]'
      : resolvedTone === 'bordo'
      ? 'border-[#D9B44A] bg-[#6C151E] text-[#F8F8E1]'
      : 'border-[#D9B44A] bg-[#1B2A3D] text-[#F8F8E1]';

  const subtitleClass = isGold ? 'text-[#001F24]' : 'text-[#D9B44A]';

  const closeBtnClass =
    resolvedTone === 'gold'
      ? 'brutal-btn-frame-gold'
      : resolvedTone === 'green'
      ? 'brutal-btn-frame-green'
      : resolvedTone === 'bordo'
      ? 'brutal-btn-frame-bordo'
      : 'brutal-btn-frame-navy';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-[#1B2A3D]/80 backdrop-blur-[2px]"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={`w-full ${maxWidthClass} max-h-[88vh] flex flex-col overflow-hidden ${containerClass}`}>
        <div className={`flex items-start justify-between gap-3 px-5 py-3.5 border-b-2 ${headerClass}`}>
          <div className="min-w-0">
            {subtitle && (
              <p className={`font-mono-num text-[11px] font-bold mb-0.5 ${subtitleClass}`}>
                {subtitle}
              </p>
            )}
            <h2 id="modal-title" className="font-display text-lg sm:text-xl font-extrabold leading-tight break-words">
              {title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup dialog"
            className={`${closeBtnClass} p-1.5 shrink-0 cursor-pointer`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-4 sm:p-5 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
};
