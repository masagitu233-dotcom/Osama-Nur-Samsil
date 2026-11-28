import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  Eye,
  LayoutGrid,
  Palette,
  RotateCcw,
  Save,
  ShieldCheck,
  Sliders,
  Sparkles,
} from 'lucide-react';
import { usePortfolio } from '../../context/PortfolioContext';
import { saveDesignMode } from '../../services/portfolioService';
import {
  DESIGN_MODE_DEFINITIONS,
  DESIGN_MODE_LIST,
  HERO_CUTOUT_ASSET_URL,
  normalizeDesignMode,
  shouldUsePreprocessedHeroCutout,
  writeCachedDesignMode,
  type DesignMode,
} from '../../utils/designMode';
import { SafeImage } from '../ui/SafeImage';
import { LayoutSizingPanel } from './LayoutSizingPanel';

interface AppearanceSettingsPanelProps {
  onDirtyChange: (dirty: boolean) => void;
}

type AppearanceSubTab = 'design_mode' | 'layout_sizing';

export const AppearanceSettingsPanel: React.FC<AppearanceSettingsPanelProps> = ({
  onDirtyChange,
}) => {
  const { adminData, designMode, showToast } = usePortfolio();
  const activeSavedMode = normalizeDesignMode(adminData.siteSettings?.designMode ?? designMode);

  const [subTab, setSubTab] = useState<AppearanceSubTab>('design_mode');
  const [selectedMode, setSelectedMode] = useState<DesignMode>(activeSavedMode);
  const [saving, setSaving] = useState(false);

  // Sync local selection when Firestore snapshot updates
  useEffect(() => {
    setSelectedMode(activeSavedMode);
    if (subTab === 'design_mode') {
      onDirtyChange(false);
    }
  }, [activeSavedMode, onDirtyChange, subTab]);

  const hasChanges = selectedMode !== activeSavedMode;
  const activeMeta = DESIGN_MODE_DEFINITIONS[activeSavedMode];
  const previewMeta = DESIGN_MODE_DEFINITIONS[selectedMode];
  const previewIsMinimal = selectedMode === 'minimalis_elegan';
  const useCutoutPreview = shouldUsePreprocessedHeroCutout(adminData.profile.photoUrl);

  const handleSelectMode = (nextMode: DesignMode) => {
    setSelectedMode(nextMode);
    onDirtyChange(nextMode !== activeSavedMode);
  };

  const handleResetSelection = () => {
    setSelectedMode(activeSavedMode);
    onDirtyChange(false);
  };

  const handleSave = async () => {
    if (!hasChanges || saving) return;
    setSaving(true);
    try {
      await saveDesignMode(selectedMode, adminData.siteSettings);
      writeCachedDesignMode(selectedMode);
      onDirtyChange(false);
      showToast(
        'success',
        `Mode tampilan "${DESIGN_MODE_DEFINITIONS[selectedMode].name}" berhasil disimpan dan diterapkan ke seluruh website publik.`
      );
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Gagal menyimpan pengaturan tampilan. Pastikan hak akses admin aktif.';
      showToast('error', message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Active Mode Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b-2 border-brutal pb-4">
        <div>
          <span className="brutal-badge">Pengaturan Tampilan Global</span>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold mt-2 text-[#1B2A3D]">
            {subTab === 'design_mode'
              ? 'Mode Desain Website Portofolio'
              : 'Ukuran dan Proporsi Tampilan'}
          </h1>
          <p className="text-xs sm:text-sm text-muted mt-1 max-w-2xl leading-relaxed">
            {subTab === 'design_mode' ? (
              <>
                Pilih gaya tampilan visual publik antara <strong>Minimalis Elegan</strong> dan{' '}
                <strong>Neo-Brutalist</strong>. Seluruh konten, foto asli, data Firestore, dan palet 6 warna resmi tetap utuh tanpa duplikasi.
              </>
            ) : (
              <>
                Atur proporsi keseluruhan (Compact, Normal, Spacious), dimensi elemen (frame, kartu, gambar, tipografi, tombol, spacing), pengaturan per komponen, serta responsivitas Desktop, Tablet, dan Mobile.
              </>
            )}
          </p>
        </div>

        <div
          data-testid="admin-active-design-mode"
          className="brutal-card card-navy frame-navy px-4 py-3 shrink-0"
        >
          <p className="font-mono-num text-[10px] font-bold uppercase tracking-wider text-[#D9B44A]">
            Mode Aktif Saat Ini
          </p>
          <p className="font-display text-base font-extrabold text-[#F8F8E1] mt-0.5 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#D9B44A] shrink-0" aria-hidden="true" />
            <span>{activeMeta.name}</span>
          </p>
        </div>
      </div>

      {/* Appearance Sub-Section Switcher */}
      <div
        role="tablist"
        aria-label="Sub-menu Pengaturan Tampilan"
        className="flex flex-wrap gap-2"
      >
        <button
          type="button"
          role="tab"
          aria-selected={subTab === 'design_mode'}
          data-testid="appearance-subtab-design-mode"
          onClick={() => setSubTab('design_mode')}
          className={`px-4 py-2 text-xs sm:text-sm font-display font-bold border-2 border-[#001F24] inline-flex items-center gap-2 cursor-pointer transition-colors ${
            subTab === 'design_mode'
              ? 'bg-[#0F3D3A] text-[#F8F8E1] shadow-[2.5px_2.5px_0_0_#001F24]'
              : 'bg-[#F8F8E1] text-[#1B2A3D] hover:bg-[#D9B44A] hover:text-[#001F24]'
          }`}
        >
          <Palette className="w-4 h-4" aria-hidden="true" />
          <span>Mode Desain</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={subTab === 'layout_sizing'}
          data-testid="appearance-subtab-layout-sizing"
          onClick={() => setSubTab('layout_sizing')}
          className={`px-4 py-2 text-xs sm:text-sm font-display font-bold border-2 border-[#001F24] inline-flex items-center gap-2 cursor-pointer transition-colors ${
            subTab === 'layout_sizing'
              ? 'bg-[#0F3D3A] text-[#F8F8E1] shadow-[2.5px_2.5px_0_0_#001F24]'
              : 'bg-[#F8F8E1] text-[#1B2A3D] hover:bg-[#D9B44A] hover:text-[#001F24]'
          }`}
        >
          <Sliders className="w-4 h-4" aria-hidden="true" />
          <span>Ukuran dan Proporsi</span>
        </button>
      </div>

      {subTab === 'layout_sizing' ? (
        <LayoutSizingPanel onDirtyChange={onDirtyChange} />
      ) : (
        <>
      {/* Mode Selection Cards */}
      <section aria-labelledby="mode-selector-heading" className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="mode-selector-heading" className="font-display text-lg font-extrabold text-[#1B2A3D] flex items-center gap-2">
            <Palette className="w-4 h-4 text-[#6C151E]" aria-hidden="true" />
            <span>1. Pilih Gaya Desain Publik</span>
          </h2>
          <span className="inline-flex items-center gap-1.5 text-[11px] font-mono-num font-bold text-[#0F3D3A]">
            <ShieldCheck className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>Khusus Admin · Berlaku Global untuk Semua Pengunjung</span>
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {DESIGN_MODE_LIST.map((mode) => {
            const isSelected = selectedMode === mode.id;
            const isLiveActive = activeSavedMode === mode.id;
            const ModeIcon = mode.id === 'minimalis_elegan' ? Sparkles : LayoutGrid;

            return (
              <button
                key={mode.id}
                type="button"
                data-testid={`design-mode-option-${mode.id}`}
                aria-pressed={isSelected}
                onClick={() => handleSelectMode(mode.id)}
                className={`text-left brutal-card p-5 flex flex-col justify-between gap-4 cursor-pointer transition-all ${
                  isSelected
                    ? 'card-green frame-green ring-2 ring-[#D9B44A] ring-offset-2 ring-offset-[#F8F8E1]'
                    : 'card-navy frame-navy opacity-95 hover:opacity-100'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 brutal-badge">
                      <ModeIcon className="w-3 h-3" aria-hidden="true" />
                      <span>{mode.code}</span>
                    </span>

                    <div className="flex items-center gap-1.5">
                      {isLiveActive && (
                        <span className="font-mono-num text-[10px] font-extrabold uppercase px-2 py-0.5 bg-[#D9B44A] text-[#001F24] border border-[#001F24]">
                          Aktif di Website
                        </span>
                      )}
                      {isSelected && !isLiveActive && (
                        <span className="font-mono-num text-[10px] font-extrabold uppercase px-2 py-0.5 bg-[#6C151E] text-[#F8F8E1] border border-[#D9B44A]">
                          Dipilih (Pratinjau)
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-display text-xl font-extrabold text-[#F8F8E1]">
                      {mode.name}
                    </h3>
                    <p className="font-mono-num text-[11px] font-semibold text-[#D9B44A] mt-0.5">
                      {mode.tagline}
                    </p>
                  </div>

                  <p className="text-xs sm:text-sm text-[#F8F8E1]/90 leading-relaxed">
                    {mode.description}
                  </p>

                  <ul className="space-y-1.5 pt-2 border-t border-[#D9B44A]/35 text-xs text-[#F8F8E1]/90">
                    {mode.characteristics.map((item) => (
                      <li key={item} className="flex items-start gap-2">
                        <span className="text-[#D9B44A] font-bold shrink-0" aria-hidden="true">
                          &bull;
                        </span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-2 border-t border-[#D9B44A]/30 flex items-center justify-between text-xs font-mono-num font-bold">
                  <span className={isSelected ? 'text-[#D9B44A]' : 'text-[#F8F8E1]/80'}>
                    {isSelected ? 'Sedang Dipilih untuk Pratinjau' : 'Klik untuk Memilih & Pratinjau'}
                  </span>
                  <span
                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      isSelected
                        ? 'border-[#D9B44A] bg-[#D9B44A]'
                        : 'border-[#F8F8E1]/60 bg-transparent'
                    }`}
                    aria-hidden="true"
                  >
                    {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-[#001F24]" />}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Interactive Live Preview Section */}
      <section aria-labelledby="mode-preview-heading" className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="mode-preview-heading" className="font-display text-lg font-extrabold text-[#1B2A3D] flex items-center gap-2">
            <Eye className="w-4 h-4 text-[#0F3D3A]" aria-hidden="true" />
            <span>2. Pratinjau Langsung ({previewMeta.code}: {previewMeta.name})</span>
          </h2>
          <span className="font-mono-num text-[11px] font-bold text-[#1B2A3D]/80">
            {hasChanges
              ? 'Pratinjau belum diterapkan — klik Simpan di bawah untuk menerapkan'
              : 'Menampilkan tampilan yang sedang aktif di website publik'}
          </span>
        </div>

        {/* Isolated Preview Stage */}
        <div
          data-testid="appearance-live-preview"
          data-preview-mode={selectedMode}
          className="brutal-card card-navy frame-navy p-3 sm:p-4 space-y-3"
        >
          {/* Mini Browser Chrome Bar */}
          <div className="flex items-center justify-between gap-3 px-2 py-1 border-b border-[#D9B44A]/35 text-[11px] font-mono-num text-[#F8F8E1]/85">
            <div className="flex items-center gap-1.5" aria-hidden="true">
              <span className="w-2.5 h-2.5 rounded-full bg-[#6C151E] border border-[#F8F8E1]/40" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#D9B44A]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#0F3D3A] border border-[#F8F8E1]/40" />
            </div>
            <span className="truncate">
              Pratinjau Publik &middot; {adminData.profile.fullName} ({previewMeta.name})
            </span>
            <span className="text-[#D9B44A] font-bold shrink-0">{previewMeta.code}</span>
          </div>

          {/* Simulated Public Canvas (Strictly 6-Color Palette) */}
          <div
            className="bg-[#F8F8E1] text-[#1B2A3D] p-4 sm:p-6 overflow-hidden transition-all duration-300"
            style={
              previewIsMinimal
                ? { borderRadius: '0.875rem' }
                : {
                    backgroundImage:
                      "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='36' height='36' viewBox='0 0 50 50'%3E%3Cline x1='0' y1='25.5' x2='50' y2='25.5' stroke='%231B2A3D' stroke-opacity='0.14' stroke-width='1'/%3E%3Cline x1='25.5' y1='0' x2='25.5' y2='50' stroke='%231B2A3D' stroke-opacity='0.14' stroke-width='1'/%3E%3Ccircle cx='25.5' cy='25.5' r='2.2' fill='%231B2A3D' fill-opacity='0.28'/%3E%3C/svg%3E\")",
                  }
            }
          >
            {/* Preview Mini Navbar */}
            <div
              className={`flex items-center justify-between gap-3 pb-3 mb-5 ${
                previewIsMinimal
                  ? 'border-b border-[#1B2A3D]/15'
                  : 'border-b-2 border-[#001F24]'
              }`}
            >
              <span className="font-display font-extrabold text-xs sm:text-sm text-[#1B2A3D]">
                {(adminData.profile.fullName || 'OSAMA NUR SAMSIL').toUpperCase()}
              </span>
              <div className="hidden sm:flex items-center gap-3 text-[11px] font-bold text-[#1B2A3D]/80">
                <span>About</span>
                <span>Experience</span>
                <span>Education</span>
                <span>Projects</span>
              </div>
              <span
                className={
                  previewIsMinimal
                    ? 'px-2.5 py-1 text-[10px] font-display font-bold rounded-lg bg-[#1B2A3D] text-[#F8F8E1]'
                    : 'px-2.5 py-1 text-[10px] font-display font-bold bg-[#1B2A3D] text-[#F8F8E1] border-2 border-[#001F24] shadow-[2px_2px_0_0_#001F24]'
                }
              >
                Contact Me
              </span>
            </div>

            {/* Preview Hero Comparison */}
            {previewIsMinimal ? (
              <div className="pt-4">
                <div className="relative bg-[#0F3D3A] text-[#F8F8E1] rounded-2xl border border-[#D9B44A]/25 shadow-[0_18px_40px_-18px_rgba(0,31,36,0.45)] p-5 sm:p-6 overflow-visible">
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-end">
                    <div className="sm:col-span-7 space-y-2.5">
                      <p className="font-mono-num text-[10px] uppercase tracking-[0.14em] text-[#D9B44A] font-bold">
                        — {adminData.profile.domicile}
                      </p>
                      <h3 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight leading-[1.05] text-[#F8F8E1]">
                        {adminData.profile.fullName}
                      </h3>
                      <p className="font-display text-xs sm:text-sm font-semibold text-[#D9B44A] leading-snug">
                        {adminData.profile.headline}
                      </p>
                      <p className="text-[11px] sm:text-xs text-[#F8F8E1]/85 line-clamp-2">
                        {adminData.profile.shortBio}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 pt-1.5">
                        <span className="px-3 py-1.5 rounded-lg bg-[#F8F8E1] text-[#0F3D3A] text-[11px] font-display font-bold">
                          Explore Portfolio
                        </span>
                        <span className="px-3 py-1.5 rounded-lg border border-[#F8F8E1]/45 text-[#F8F8E1] text-[11px] font-display font-bold">
                          Download CV
                        </span>
                      </div>
                    </div>

                    <div className="sm:col-span-5 flex justify-center sm:justify-end overflow-visible">
                      <div className="relative isolate w-36 h-36 sm:w-44 sm:h-44 flex items-end justify-center overflow-visible">
                        <div className="absolute bottom-2 w-32 h-32 sm:w-36 sm:h-36 rounded-full border border-[#D9B44A]/40 z-10 pointer-events-none" />
                        <div className="absolute bottom-3 w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-[#D9B44A] z-10 pointer-events-none" />
                        {useCutoutPreview ? (
                          <img
                            src={HERO_CUTOUT_ASSET_URL}
                            alt="Pratinjau potret transparan Minimalis Elegan"
                            className="relative z-20 w-32 sm:w-36 h-auto max-h-48 object-contain object-bottom -mt-8 block opacity-100"
                          />
                        ) : (
                          <div className="relative z-20 w-28 h-36 -mt-4 rounded-t-full overflow-hidden">
                            <SafeImage
                              src={adminData.profile.photoUrl}
                              alt="Pratinjau potret profil"
                              className="w-full h-full object-cover object-[50%_15%]"
                            />
                          </div>
                        )}
                        <div
                          aria-hidden="true"
                          className="hero-bottom-green-fade absolute inset-x-0 bottom-0 h-10 z-30 pointer-events-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-[#0F3D3A] text-[#F8F8E1] border-2 border-[#001F24] shadow-[4px_4px_0_0_#001F24] p-4 sm:p-5">
                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-2 min-w-0 flex-1">
                    <span className="inline-block px-2 py-0.5 bg-[#D9B44A] text-[#001F24] border border-[#001F24] font-mono-num text-[10px] font-bold">
                      {adminData.profile.domicile}
                    </span>
                    <h3 className="font-display text-lg sm:text-2xl font-extrabold leading-tight text-[#F8F8E1]">
                      {(adminData.profile.fullName || 'OSAMA NUR SAMSIL').toUpperCase()}
                    </h3>
                    <p className="text-xs font-display font-bold border-l-[3px] border-[#D9B44A] pl-2.5 text-[#F8F8E1]">
                      {adminData.profile.headline}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 pt-1.5">
                      <span className="px-3 py-1 bg-[#0F3D3A] text-[#F8F8E1] border-2 border-[#F8F8E1] shadow-[2.5px_2.5px_0_0_#D9B44A] text-[11px] font-display font-bold">
                        Explore Portfolio
                      </span>
                      <span className="px-3 py-1 bg-[#D9B44A] text-[#001F24] border-2 border-[#F8F8E1] shadow-[2px_2px_0_0_#F8F8E1] text-[11px] font-display font-bold">
                        Contact Me
                      </span>
                    </div>
                  </div>

                  <div className="shrink-0">
                    <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-full p-1 bg-[#D9B44A] border-2 border-[#001F24] shadow-[3px_3px_0_0_#001F24]">
                      <div className="w-full h-full rounded-full overflow-hidden border-2 border-[#001F24] bg-[#F8F8E1]">
                        <SafeImage
                          src={adminData.profile.photoUrl}
                          alt="Pratinjau foto profil Neo-Brutalist"
                          className="w-full h-full object-cover object-[50%_18%]"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Preview 4 Official Category Color Cards */}
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div
                className={
                  previewIsMinimal
                    ? 'p-3 rounded-xl bg-[#6C151E] text-[#F8F8E1] border border-[#F8F8E1]/15 shadow-sm'
                    : 'p-3 bg-[#6C151E] text-[#F8F8E1] border-2 border-[#001F24] shadow-[3px_3px_0_0_#001F24]'
                }
              >
                <p className="font-mono-num text-sm font-extrabold text-[#D9B44A]">01</p>
                <p className="font-display text-[11px] font-bold mt-1">Pengalaman</p>
              </div>
              <div
                className={
                  previewIsMinimal
                    ? 'p-3 rounded-xl bg-[#0F3D3A] text-[#F8F8E1] border border-[#F8F8E1]/15 shadow-sm'
                    : 'p-3 bg-[#0F3D3A] text-[#F8F8E1] border-2 border-[#001F24] shadow-[3px_3px_0_0_#001F24]'
                }
              >
                <p className="font-mono-num text-sm font-extrabold text-[#D9B44A]">02</p>
                <p className="font-display text-[11px] font-bold mt-1">Proyek Digital</p>
              </div>
              <div
                className={
                  previewIsMinimal
                    ? 'p-3 rounded-xl bg-[#D9B44A] text-[#001F24] border border-[#001F24]/15 shadow-sm'
                    : 'p-3 bg-[#D9B44A] text-[#001F24] border-2 border-[#001F24] shadow-[3px_3px_0_0_#1B2A3D]'
                }
              >
                <p className="font-mono-num text-sm font-extrabold text-[#001F24]">03</p>
                <p className="font-display text-[11px] font-bold mt-1">Keahlian</p>
              </div>
              <div
                className={
                  previewIsMinimal
                    ? 'p-3 rounded-xl bg-[#1B2A3D] text-[#F8F8E1] border border-[#F8F8E1]/15 shadow-sm'
                    : 'p-3 bg-[#1B2A3D] text-[#F8F8E1] border-2 border-[#001F24] shadow-[3px_3px_0_0_#001F24]'
                }
              >
                <p className="font-mono-num text-sm font-extrabold text-[#D9B44A]">04</p>
                <p className="font-display text-[11px] font-bold mt-1">Pendidikan</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Save / Apply Footer Bar */}
      <div className="brutal-card card-gold frame-gold p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="text-xs sm:text-sm text-[#001F24]">
          <p className="font-display font-extrabold">
            {hasChanges
              ? `Siap menerapkan Mode ${previewMeta.name} ke seluruh website publik?`
              : `Mode ${activeMeta.name} saat ini aktif dan tersimpan di database.`}
          </p>
          <p className="mt-0.5 text-xs text-[#001F24]/90">
            Perubahan bersifat instan, persisten lintas muat ulang halaman, dan tidak mengubah isi konten maupun foto asli Anda.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {hasChanges && (
            <button
              type="button"
              onClick={handleResetSelection}
              disabled={saving}
              className="brutal-btn brutal-btn-outline px-3.5 py-2 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Batalkan</span>
            </button>
          )}
          <button
            type="button"
            data-testid="save-design-mode-btn"
            onClick={handleSave}
            disabled={!hasChanges || saving}
            className="brutal-btn-on-gold px-5 py-2.5 text-xs sm:text-sm font-display font-extrabold inline-flex items-center gap-2 cursor-pointer disabled:opacity-55"
          >
            <Save className="w-4 h-4" aria-hidden="true" />
            <span>{saving ? 'Menyimpan...' : 'Simpan & Terapkan Perubahan'}</span>
          </button>
        </div>
      </div>
        </>
      )}
    </div>
  );
};
