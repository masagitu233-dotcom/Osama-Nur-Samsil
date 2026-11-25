import React from 'react';

interface State {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorMessage: error?.message || 'Terjadi kesalahan aplikasi.' };
  }

  componentDidCatch(error: Error) {
    console.error('ErrorBoundary caught:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen surface-page flex items-center justify-center p-6">
          <div className="max-w-xl w-full card-navy brutal-card frame-shadow-bordo p-8">
            <span className="brutal-badge mb-3">Pemulihan Sistem</span>
            <h1 className="text-2xl font-extrabold mb-3 text-[#F8F8E1]">Terjadi Gangguan Saat Memuat Halaman</h1>
            <p className="text-sm text-muted mb-6 break-words">{this.state.errorMessage}</p>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="brutal-btn-on-dark font-bold px-5 py-2.5 text-sm cursor-pointer"
              >
                Muat Ulang Halaman
              </button>
              <button
                type="button"
                onClick={() => {
                  window.history.pushState({}, '', '/');
                  window.location.reload();
                }}
                className="brutal-btn-on-dark-outline font-bold px-5 py-2.5 text-sm cursor-pointer"
              >
                Kembali ke Beranda
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
