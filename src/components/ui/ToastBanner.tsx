import React from 'react';
import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';
import { usePortfolio } from '../../context/PortfolioContext';

export const ToastBanner: React.FC = () => {
  const { toast, clearToast } = usePortfolio();
  if (!toast) return null;

  const styles = {
    success: 'bg-[#8ACCD5] text-[#013A42] border-2 border-[#013A42] shadow-[5px_5px_0_0_#013A42]',
    error: 'bg-[#013A42] text-[#F8F8E1] border-2 border-[#8ACCD5] shadow-[5px_5px_0_0_#8ACCD5]',
    info: 'bg-[#F8F8E1] text-[#013A42] border-2 border-[#013A42] shadow-[5px_5px_0_0_#013A42]',
  }[toast.type];

  const Icon = toast.type === 'success' ? CheckCircle2 : toast.type === 'error' ? AlertTriangle : Info;
  const label = toast.type === 'success' ? 'Berhasil' : toast.type === 'error' ? 'Peringatan / Gagal' : 'Informasi';

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-5 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50"
    >
      <div className={`p-4 flex items-start gap-3 ${styles}`}>
        <Icon className="w-5 h-5 shrink-0 mt-0.5" aria-hidden="true" />
        <div className="flex-1 min-w-0">
          <p className="font-mono-num font-bold text-xs uppercase tracking-wider">{label}</p>
          <p className="text-sm font-medium mt-0.5 leading-snug break-words">{toast.message}</p>
        </div>
        <button
          type="button"
          onClick={clearToast}
          aria-label="Tutup notifikasi"
          className="p-1 hover:opacity-75 transition-opacity cursor-pointer shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
