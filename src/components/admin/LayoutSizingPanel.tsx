import React, { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  Eye,
  Image as ImageIcon,
  Layers,
  LayoutGrid,
  Monitor,
  MousePointerClick,
  RotateCcw,
  Save,
  Sliders,
  Smartphone,
  Sparkles,
  Square,
  Tablet,
  Type,
  Maximize2,
  Play,
} from 'lucide-react';
import { usePortfolio } from '../../context/PortfolioContext';
import { saveLayoutSizing } from '../../services/portfolioService';
import {
  DESIGN_MODE_DEFINITIONS,
  HERO_CUTOUT_ASSET_URL,
  normalizeDesignMode,
  shouldUsePreprocessedHeroCutout,
  type DesignMode,
} from '../../utils/designMode';
import {
  IMAGE_POSITION_OPTIONS,
  IMAGE_RATIO_OPTIONS,
  SCALE_PRESET_LIST,
  SIZING_RANGES,
  areLayoutSizingEqual,
  buildPresetModeConfig,
  buildSizingCssVariables,
  normalizeLayoutSizingSettings,
  resetSizingGroup,
  writeCachedLayoutSizing,
  type DeviceBreakpoint,
  type ImageAspectRatioOption,
  type ImageFitPositionOption,
  type LayoutSizingSettings,
  type ModeSizingConfig,
  type ScalePresetId,
  type SizingGroupKey,
} from '../../utils/layoutSizing';
import { SafeImage } from '../ui/SafeImage';

interface LayoutSizingPanelProps {
  onDirtyChange: (dirty: boolean) => void;
}

type ElementGroupTab = 'layout' | 'cards' | 'images' | 'typography' | 'buttons' | 'spacing';
type ComponentTab = 'hero' | 'education' | 'projects' | 'certificates' | 'experience' | 'about';

const ELEMENT_GROUP_TABS: Array<{
  id: ElementGroupTab;
  code: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: 'layout', code: 'A', label: 'Layout & Frame', icon: Maximize2 },
  { id: 'cards', code: 'B', label: 'Kartu & Item', icon: Square },
  { id: 'images', code: 'C', label: 'Gambar', icon: ImageIcon },
  { id: 'typography', code: 'D', label: 'Tipografi', icon: Type },
  { id: 'buttons', code: 'E', label: 'Tombol & Ikon', icon: MousePointerClick },
  { id: 'spacing', code: 'F', label: 'Spacing', icon: Layers },
];

const COMPONENT_TABS: Array<{ id: ComponentTab; label: string; desc: string }> = [
  { id: 'hero', label: 'Hero', desc: 'Tinggi potret, lingkaran kuning, padding, dan judul Hero.' },
  { id: 'education', label: 'Pendidikan', desc: 'Padding kartu, batas tinggi foto utama, dan ukuran thumbnail galeri.' },
  { id: 'projects', label: 'Proyek', desc: 'Padding kartu, rasio gambar proyek, tinggi gambar, dan ukuran judul.' },
  { id: 'certificates', label: 'Sertifikat', desc: 'Padding kartu, tinggi pratinjau dokumen sertifikat, dan judul.' },
  { id: 'experience', label: 'Pengalaman', desc: 'Padding kartu, tinggi foto dokumentasi, dan ukuran judul lembaga.' },
  { id: 'about', label: 'Tentang Saya', desc: 'Padding kartu biografi, batas tinggi foto profil, dan ukuran teks biografi.' },
];

const DEVICE_TABS: Array<{
  id: DeviceBreakpoint;
  label: string;
  rangeLabel: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: 'desktop', label: 'Desktop', rangeLabel: '≥ 1025px', icon: Monitor },
  { id: 'tablet', label: 'Tablet', rangeLabel: '641–1024px', icon: Tablet },
  { id: 'mobile', label: 'Mobile', rangeLabel: '≤ 640px', icon: Smartphone },
];

interface NumberControlProps {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  hint?: string;
  onChange: (next: number) => void;
}

const NumberControl: React.FC<NumberControlProps> = ({
  id,
  label,
  value,
  min,
  max,
  step,
  unit,
  hint,
  onChange,
}) => {
  const handleNumericInput = (raw: string) => {
    const parsed = Number(raw);
    if (!Number.isFinite(parsed)) return;
    const clamped = Math.min(max, Math.max(min, parsed));
    onChange(Math.round(clamped * 100) / 100);
  };

  return (
    <div className="p-3 bg-[#F8F8E1] border-2 border-[#001F24] space-y-2">
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={id} className="text-xs font-extrabold text-[#1B2A3D] leading-snug">
          {label}
        </label>
        <div className="flex items-center gap-1 shrink-0">
          <input
            id={id}
            type="number"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => handleNumericInput(e.target.value)}
            className="w-[72px] brutal-input px-2 py-0.5 text-xs font-mono-num font-bold text-right"
          />
          <span className="font-mono-num text-[11px] font-extrabold text-[#6C151E] min-w-[22px]">
            {unit}
          </span>
        </div>
      </div>

      <input
        type="range"
        aria-label={`${label} slider`}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => handleNumericInput(e.target.value)}
        className="w-full accent-[#0F3D3A] cursor-pointer h-2"
      />

      <div className="flex items-center justify-between text-[10px] font-mono-num text-[#1B2A3D]/70">
        <span>
          {min}
          {unit}
        </span>
        {hint && <span className="text-[#0F3D3A] font-semibold truncate px-2">{hint}</span>}
        <span>
          {max}
          {unit}
        </span>
      </div>
    </div>
  );
};

export const LayoutSizingPanel: React.FC<LayoutSizingPanelProps> = ({ onDirtyChange }) => {
  const {
    adminData,
    designMode,
    layoutSizing,
    draftSizingPreview,
    setDraftSizingPreview,
    showToast,
  } = usePortfolio();

  const savedStore = useMemo(
    () => normalizeLayoutSizingSettings(adminData.siteSettings?.layoutSizing ?? layoutSizing),
    [adminData.siteSettings?.layoutSizing, layoutSizing]
  );

  const liveMode = normalizeDesignMode(adminData.siteSettings?.designMode ?? designMode);

  const [targetMode, setTargetMode] = useState<DesignMode>(liveMode);
  const [draftStore, setDraftStore] = useState<LayoutSizingSettings>(
    () => draftSizingPreview ?? savedStore
  );
  const [activeGroupTab, setActiveGroupTab] = useState<ElementGroupTab>('layout');
  const [activeCompTab, setActiveCompTab] = useState<ComponentTab>('hero');
  const [activeDeviceTab, setActiveDeviceTab] = useState<DeviceBreakpoint>('desktop');
  const [previewDevice, setPreviewDevice] = useState<DeviceBreakpoint>('desktop');
  const [saving, setSaving] = useState(false);

  // Sync draft when Firestore settings update and there is no active local draft preview
  useEffect(() => {
    if (!draftSizingPreview) {
      setDraftStore(savedStore);
    }
  }, [savedStore, draftSizingPreview]);

  const hasChanges = useMemo(
    () => !areLayoutSizingEqual(draftStore, savedStore),
    [draftStore, savedStore]
  );

  useEffect(() => {
    onDirtyChange(hasChanges);
  }, [hasChanges, onDirtyChange]);

  const currentConfig: ModeSizingConfig = draftStore[targetMode];
  const savedModeConfig: ModeSizingConfig = savedStore[targetMode];
  const targetMeta = DESIGN_MODE_DEFINITIONS[targetMode];
  const isTargetMinimal = targetMode === 'minimalis_elegan';
  const useCutoutPreview = shouldUsePreprocessedHeroCutout(adminData.profile.photoUrl);

  const updateCurrentMode = (updater: (prev: ModeSizingConfig) => ModeSizingConfig) => {
    setDraftStore((prev) => ({
      ...prev,
      [targetMode]: updater(prev[targetMode]),
    }));
  };

  const handleSelectPreset = (presetId: ScalePresetId) => {
    const nextConfig = buildPresetModeConfig(targetMode, presetId);
    updateCurrentMode(() => nextConfig);
  };

  const handleResetGroup = (group: SizingGroupKey) => {
    updateCurrentMode((prev) => resetSizingGroup(targetMode, prev, group));
    showToast('info', `Kelompok pengaturan berhasil dikembalikan ke nilai standar preset ${currentConfig.preset.toUpperCase()}.`);
  };

  const handleResetAllCurrentMode = () => {
    updateCurrentMode(() => buildPresetModeConfig(targetMode, 'normal'));
    showToast('info', `Seluruh ukuran untuk mode ${targetMeta.name} dikembalikan ke preset Normal.`);
  };

  const handleCancelChanges = () => {
    setDraftStore(savedStore);
    setDraftSizingPreview(null);
    showToast('info', 'Perubahan ukuran dibatalkan dan dikembalikan ke pengaturan tersimpan.');
  };

  const handleApplyDraftPreview = () => {
    const normalized = normalizeLayoutSizingSettings(draftStore);
    setDraftStore(normalized);
    setDraftSizingPreview(normalized);
    showToast(
      'info',
      `Pratinjau draft ukuran untuk mode ${targetMeta.name} aktif. Buka halaman publik untuk mengecek hasilnya sebelum menyimpan permanen.`
    );
  };

  const handleSavePermanent = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const normalized = normalizeLayoutSizingSettings(draftStore);
      await saveLayoutSizing(normalized, adminData.siteSettings, targetMode);
      writeCachedLayoutSizing(normalized);
      setDraftStore(normalized);
      setDraftSizingPreview(null);
      onDirtyChange(false);
      showToast(
        'success',
        `Pengaturan ukuran dan proporsi (${targetMeta.name}) berhasil disimpan ke database dan diterapkan ke website publik.`
      );
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Gagal menyimpan pengaturan ukuran. Pastikan hak akses admin aktif.';
      showToast('error', message);
    } finally {
      setSaving(false);
    }
  };

  const previewCssVars = useMemo(
    () => buildSizingCssVariables(currentConfig, previewDevice),
    [currentConfig, previewDevice]
  );

  // Preview frame width reflects selected viewport cleanly without CSS transform: scale()
  const previewFrameStyle = useMemo<React.CSSProperties>(() => {
    const varsObj: Record<string, string> = {};
    for (const [k, v] of Object.entries(previewCssVars)) {
      varsObj[k] = v;
    }
    return {
      ...varsObj,
      width: '100%',
      maxWidth:
        previewDevice === 'mobile'
          ? '375px'
          : previewDevice === 'tablet'
            ? '740px'
            : '100%',
      marginLeft: 'auto',
      marginRight: 'auto',
    } as React.CSSProperties;
  }, [previewCssVars, previewDevice]);

  return (
    <div className="space-y-6" data-testid="layout-sizing-panel">
      {/* Mode Target Selector (Independent per Design Mode) */}
      <section className="brutal-card card-navy frame-navy p-4 sm:p-5 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="brutal-badge">Penyimpanan Terpisah per Mode</span>
            <h2 className="font-display text-lg font-extrabold text-[#F8F8E1] mt-1.5">
              Pilih Mode Desain yang Diatur Ukurannya
            </h2>
            <p className="text-xs text-[#F8F8E1]/85 mt-0.5 leading-relaxed">
              Setiap mode desain menyimpan konfigurasi ukuran sendiri. Mengubah ukuran pada{' '}
              <strong>Minimalis Elegan</strong> tidak akan menimpa konfigurasi{' '}
              <strong>Neo-Brutalist</strong>.
            </p>
          </div>

          <div
            role="tablist"
            aria-label="Pilih mode desain target"
            className="flex flex-wrap gap-2 shrink-0"
          >
            {(['minimalis_elegan', 'neo_brutalist'] as DesignMode[]).map((modeId) => {
              const meta = DESIGN_MODE_DEFINITIONS[modeId];
              const selected = targetMode === modeId;
              const isLive = liveMode === modeId;
              const Icon = modeId === 'minimalis_elegan' ? Sparkles : LayoutGrid;

              return (
                <button
                  key={modeId}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  data-testid={`sizing-target-mode-${modeId}`}
                  onClick={() => setTargetMode(modeId)}
                  className={`px-3.5 py-2 text-xs font-display font-bold border-2 inline-flex items-center gap-2 cursor-pointer transition-colors ${
                    selected
                      ? 'bg-[#D9B44A] text-[#001F24] border-[#001F24] shadow-[2px_2px_0_0_#F8F8E1]'
                      : 'bg-[#1B2A3D] text-[#F8F8E1] border-[#D9B44A]/50 hover:border-[#D9B44A]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>{meta.name}</span>
                  {isLive && (
                    <span className="font-mono-num text-[9px] uppercase px-1.5 py-0.5 bg-[#0F3D3A] text-[#F8F8E1] border border-[#D9B44A]">
                      Aktif
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* SECTION 1: 3 OVERALL SCALE PRESETS */}
      <section aria-labelledby="scale-preset-heading" className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2
            id="scale-preset-heading"
            className="font-display text-lg font-extrabold text-[#1B2A3D] flex items-center gap-2"
          >
            <Sliders className="w-4 h-4 text-[#6C151E]" aria-hidden="true" />
            <span>1. Preset Skala Keseluruhan ({targetMeta.name})</span>
          </h2>
          <span className="font-mono-num text-[11px] font-bold text-[#0F3D3A]">
            Preset Aktif: {currentConfig.preset.toUpperCase()}
            {savedModeConfig.preset !== currentConfig.preset ? ' (Draft)' : ''}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {SCALE_PRESET_LIST.map((preset) => {
            const isSelected = currentConfig.preset === preset.id;
            const isSaved = savedModeConfig.preset === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                data-testid={`scale-preset-${preset.id}`}
                aria-pressed={isSelected}
                onClick={() => handleSelectPreset(preset.id)}
                className={`text-left brutal-card p-4 flex flex-col justify-between gap-3 cursor-pointer transition-all ${
                  isSelected
                    ? 'card-green frame-green ring-2 ring-[#D9B44A] ring-offset-2 ring-offset-[#F8F8E1]'
                    : 'card-navy frame-navy opacity-95 hover:opacity-100'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="brutal-badge">{preset.badge}</span>
                    {isSaved && (
                      <span className="font-mono-num text-[10px] font-extrabold uppercase px-1.5 py-0.5 bg-[#D9B44A] text-[#001F24] border border-[#001F24]">
                        Tersimpan
                      </span>
                    )}
                  </div>
                  <h3 className="font-display text-lg font-extrabold text-[#F8F8E1] flex items-center gap-1.5">
                    {isSelected && (
                      <CheckCircle2 className="w-4 h-4 text-[#D9B44A] shrink-0" aria-hidden="true" />
                    )}
                    <span>{preset.name}</span>
                  </h3>
                  <p className="text-xs text-[#F8F8E1]/90 leading-relaxed">{preset.description}</p>
                </div>

                <ul className="space-y-1 pt-2 border-t border-[#D9B44A]/30 text-[11px] text-[#F8F8E1]/85">
                  {preset.highlights.map((item) => (
                    <li key={item} className="flex items-start gap-1.5">
                      <span className="text-[#D9B44A] font-bold" aria-hidden="true">
                        &bull;
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </button>
            );
          })}
        </div>
      </section>

      {/* SECTION 2: RESPONSIVE BREAKPOINT CONTROLS (DESKTOP / TABLET / MOBILE) */}
      <section aria-labelledby="responsive-sizing-heading" className="brutal-card card-navy frame-navy p-4 sm:p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#D9B44A]/35 pb-3">
          <div>
            <h2
              id="responsive-sizing-heading"
              className="font-display text-base sm:text-lg font-extrabold text-[#F8F8E1]"
            >
              2. Pengaturan Ukuran Responsif (Desktop, Tablet &amp; Mobile)
            </h2>
            <p className="text-xs text-[#F8F8E1]/80 mt-0.5">
              Atur skala proporsi, padding tepi layar, dan jarak antarkartu secara terpisah untuk tiap ukuran perangkat.
            </p>
          </div>
          <button
            type="button"
            onClick={() => handleResetGroup('responsive')}
            className="brutal-btn-on-dark-outline px-3 py-1.5 text-[11px] font-bold inline-flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" aria-hidden="true" />
            <span>Reset Responsif</span>
          </button>
        </div>

        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Pilih breakpoint perangkat">
          {DEVICE_TABS.map((dev) => {
            const Icon = dev.icon;
            const active = activeDeviceTab === dev.id;
            return (
              <button
                key={dev.id}
                type="button"
                role="tab"
                aria-selected={active}
                data-testid={`responsive-tab-${dev.id}`}
                onClick={() => {
                  setActiveDeviceTab(dev.id);
                  setPreviewDevice(dev.id);
                }}
                className={`px-3 py-1.5 text-xs font-bold border-2 inline-flex items-center gap-1.5 cursor-pointer transition-colors ${
                  active
                    ? 'bg-[#D9B44A] text-[#001F24] border-[#001F24]'
                    : 'bg-[#1B2A3D] text-[#F8F8E1] border-[#D9B44A]/45 hover:border-[#D9B44A]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{dev.label}</span>
                <span className="font-mono-num text-[10px] opacity-80">({dev.rangeLabel})</span>
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <NumberControl
            id={`resp-scale-${activeDeviceTab}`}
            label="Faktor Skala Proporsi"
            value={currentConfig.responsive[activeDeviceTab].scaleFactor}
            min={SIZING_RANGES.responsive.scaleFactor.min}
            max={SIZING_RANGES.responsive.scaleFactor.max}
            step={SIZING_RANGES.responsive.scaleFactor.step}
            unit="×"
            hint="CSS asli, bukan zoom"
            onChange={(val) =>
              updateCurrentMode((prev) => ({
                ...prev,
                responsive: {
                  ...prev.responsive,
                  [activeDeviceTab]: {
                    ...prev.responsive[activeDeviceTab],
                    scaleFactor: val,
                  },
                },
              }))
            }
          />
          <NumberControl
            id={`resp-padx-${activeDeviceTab}`}
            label="Padding Horizontal Container"
            value={currentConfig.responsive[activeDeviceTab].paddingX}
            min={SIZING_RANGES.responsive.paddingX.min}
            max={SIZING_RANGES.responsive.paddingX.max}
            step={SIZING_RANGES.responsive.paddingX.step}
            unit="px"
            onChange={(val) =>
              updateCurrentMode((prev) => ({
                ...prev,
                responsive: {
                  ...prev.responsive,
                  [activeDeviceTab]: {
                    ...prev.responsive[activeDeviceTab],
                    paddingX: val,
                  },
                },
                layout:
                  activeDeviceTab === 'desktop'
                    ? { ...prev.layout, paddingX: val }
                    : prev.layout,
              }))
            }
          />
          <NumberControl
            id={`resp-gap-${activeDeviceTab}`}
            label="Jarak Antarkartu (Card Gap)"
            value={currentConfig.responsive[activeDeviceTab].cardGap}
            min={SIZING_RANGES.responsive.cardGap.min}
            max={SIZING_RANGES.responsive.cardGap.max}
            step={SIZING_RANGES.responsive.cardGap.step}
            unit="px"
            onChange={(val) =>
              updateCurrentMode((prev) => ({
                ...prev,
                responsive: {
                  ...prev.responsive,
                  [activeDeviceTab]: {
                    ...prev.responsive[activeDeviceTab],
                    cardGap: val,
                  },
                },
                cards:
                  activeDeviceTab === 'desktop'
                    ? { ...prev.cards, cardGap: val }
                    : prev.cards,
              }))
            }
          />
        </div>
      </section>

      {/* SECTION 3: ADVANCED ELEMENT SIZING GROUPS (A - F) */}
      <section aria-labelledby="element-groups-heading" className="brutal-card card-green frame-green p-4 sm:p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#D9B44A]/35 pb-3">
          <div>
            <h2
              id="element-groups-heading"
              className="font-display text-base sm:text-lg font-extrabold text-[#F8F8E1]"
            >
              3. Pengaturan Lanjutan per Elemen (Kelompok A–F)
            </h2>
            <p className="text-xs text-[#F8F8E1]/85 mt-0.5">
              Kontrol presisi berbasis dimensi CSS asli (px, %, rasio) untuk setiap kelompok elemen tampilan.
            </p>
          </div>
          <button
            type="button"
            data-testid={`reset-group-${activeGroupTab}`}
            onClick={() => handleResetGroup(activeGroupTab)}
            className="brutal-btn-on-dark-outline px-3 py-1.5 text-[11px] font-bold inline-flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" aria-hidden="true" />
            <span>Reset Kelompok Ini</span>
          </button>
        </div>

        {/* Group A-F Tabs */}
        <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Kelompok pengaturan elemen">
          {ELEMENT_GROUP_TABS.map((tab) => {
            const Icon = tab.icon;
            const active = activeGroupTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                data-testid={`sizing-group-tab-${tab.id}`}
                onClick={() => setActiveGroupTab(tab.id)}
                className={`px-3 py-1.5 text-xs font-bold border-2 inline-flex items-center gap-1.5 cursor-pointer transition-colors ${
                  active
                    ? 'bg-[#D9B44A] text-[#001F24] border-[#001F24]'
                    : 'bg-[#0F3D3A] text-[#F8F8E1] border-[#F8F8E1]/35 hover:border-[#D9B44A]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" aria-hidden="true" />
                <span>
                  {tab.code}. {tab.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Group A: Layout & Frame */}
        {activeGroupTab === 'layout' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            <NumberControl
              id="sz-content-max-w"
              label="Lebar Maksimum Konten"
              value={currentConfig.layout.contentMaxWidth}
              {...SIZING_RANGES.layout.contentMaxWidth}
              unit="px"
              onChange={(v) =>
                updateCurrentMode((p) => ({ ...p, layout: { ...p.layout, contentMaxWidth: v } }))
              }
            />
            <NumberControl
              id="sz-hero-max-w"
              label="Lebar Maksimum Frame Hero"
              value={currentConfig.layout.heroMaxWidth}
              {...SIZING_RANGES.layout.heroMaxWidth}
              unit="px"
              onChange={(v) =>
                updateCurrentMode((p) => ({ ...p, layout: { ...p.layout, heroMaxWidth: v } }))
              }
            />
            <NumberControl
              id="sz-pad-x"
              label="Padding Horizontal Section"
              value={currentConfig.layout.paddingX}
              {...SIZING_RANGES.layout.paddingX}
              unit="px"
              onChange={(v) =>
                updateCurrentMode((p) => ({
                  ...p,
                  layout: { ...p.layout, paddingX: v },
                  responsive: {
                    ...p.responsive,
                    desktop: { ...p.responsive.desktop, paddingX: v },
                  },
                }))
              }
            />
            <NumberControl
              id="sz-pad-y"
              label="Padding Vertikal Halaman"
              value={currentConfig.layout.paddingY}
              {...SIZING_RANGES.layout.paddingY}
              unit="px"
              onChange={(v) =>
                updateCurrentMode((p) => ({ ...p, layout: { ...p.layout, paddingY: v } }))
              }
            />
            <NumberControl
              id="sz-section-gap"
              label="Jarak Antarsection"
              value={currentConfig.layout.sectionGap}
              {...SIZING_RANGES.layout.sectionGap}
              unit="px"
              onChange={(v) =>
                updateCurrentMode((p) => ({ ...p, layout: { ...p.layout, sectionGap: v } }))
              }
            />
            <NumberControl
              id="sz-section-min-h"
              label="Tinggi Minimum Section"
              value={currentConfig.layout.sectionMinHeight}
              {...SIZING_RANGES.layout.sectionMinHeight}
              unit="px"
              hint="0 = otomatis"
              onChange={(v) =>
                updateCurrentMode((p) => ({ ...p, layout: { ...p.layout, sectionMinHeight: v } }))
              }
            />
            <NumberControl
              id="sz-frame-radius"
              label="Radius Sudut Frame Utama"
              value={currentConfig.layout.frameRadius}
              {...SIZING_RANGES.layout.frameRadius}
              unit="px"
              onChange={(v) =>
                updateCurrentMode((p) => ({ ...p, layout: { ...p.layout, frameRadius: v } }))
              }
            />
          </div>
        )}

        {/* Group B: Cards & Items */}
        {activeGroupTab === 'cards' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            <NumberControl
              id="sz-card-min-w"
              label="Lebar Minimum Kartu"
              value={currentConfig.cards.cardMinWidth}
              {...SIZING_RANGES.cards.cardMinWidth}
              unit="px"
              onChange={(v) =>
                updateCurrentMode((p) => ({ ...p, cards: { ...p.cards, cardMinWidth: v } }))
              }
            />
            <NumberControl
              id="sz-card-min-h"
              label="Tinggi Minimum Kartu"
              value={currentConfig.cards.cardMinHeight}
              {...SIZING_RANGES.cards.cardMinHeight}
              unit="px"
              hint="0 = sesuai konten"
              onChange={(v) =>
                updateCurrentMode((p) => ({ ...p, cards: { ...p.cards, cardMinHeight: v } }))
              }
            />
            <NumberControl
              id="sz-card-pad"
              label="Padding Dalam Kartu"
              value={currentConfig.cards.cardPadding}
              {...SIZING_RANGES.cards.cardPadding}
              unit="px"
              onChange={(v) =>
                updateCurrentMode((p) => ({ ...p, cards: { ...p.cards, cardPadding: v } }))
              }
            />
            <NumberControl
              id="sz-card-gap"
              label="Jarak Antarkartu (Grid Gap)"
              value={currentConfig.cards.cardGap}
              {...SIZING_RANGES.cards.cardGap}
              unit="px"
              onChange={(v) =>
                updateCurrentMode((p) => ({
                  ...p,
                  cards: { ...p.cards, cardGap: v },
                  responsive: {
                    ...p.responsive,
                    desktop: { ...p.responsive.desktop, cardGap: v },
                  },
                }))
              }
            />
            <NumberControl
              id="sz-card-radius"
              label="Radius Sudut Kartu"
              value={currentConfig.cards.cardRadius}
              {...SIZING_RANGES.cards.cardRadius}
              unit="px"
              onChange={(v) =>
                updateCurrentMode((p) => ({ ...p, cards: { ...p.cards, cardRadius: v } }))
              }
            />
            <NumberControl
              id="sz-border-w"
              label="Ketebalan Border Kartu"
              value={currentConfig.cards.borderWidth}
              {...SIZING_RANGES.cards.borderWidth}
              unit="px"
              onChange={(v) =>
                updateCurrentMode((p) => ({ ...p, cards: { ...p.cards, borderWidth: v } }))
              }
            />
          </div>
        )}

        {/* Group C: Images */}
        {activeGroupTab === 'images' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            <NumberControl
              id="sz-img-w"
              label="Lebar Gambar dalam Kartu"
              value={currentConfig.images.imageWidthPct}
              {...SIZING_RANGES.images.imageWidthPct}
              unit="%"
              onChange={(v) =>
                updateCurrentMode((p) => ({ ...p, images: { ...p.images, imageWidthPct: v } }))
              }
            />
            <NumberControl
              id="sz-img-max-h"
              label="Tinggi Maksimum Gambar"
              value={currentConfig.images.imageMaxHeight}
              {...SIZING_RANGES.images.imageMaxHeight}
              unit="px"
              onChange={(v) =>
                updateCurrentMode((p) => ({ ...p, images: { ...p.images, imageMaxHeight: v } }))
              }
            />
            <NumberControl
              id="sz-thumb-size"
              label="Ukuran Thumbnail Galeri"
              value={currentConfig.images.thumbnailSize}
              {...SIZING_RANGES.images.thumbnailSize}
              unit="px"
              onChange={(v) =>
                updateCurrentMode((p) => ({ ...p, images: { ...p.images, thumbnailSize: v } }))
              }
            />
            <NumberControl
              id="sz-img-radius"
              label="Radius Sudut Gambar"
              value={currentConfig.images.imageRadius}
              {...SIZING_RANGES.images.imageRadius}
              unit="px"
              onChange={(v) =>
                updateCurrentMode((p) => ({ ...p, images: { ...p.images, imageRadius: v } }))
              }
            />

            <div className="p-3 bg-[#F8F8E1] border-2 border-[#001F24] space-y-2">
              <label htmlFor="sz-img-ratio" className="block text-xs font-extrabold text-[#1B2A3D]">
                Rasio Gambar Kartu (Aspect Ratio)
              </label>
              <select
                id="sz-img-ratio"
                value={currentConfig.images.imageRatio}
                onChange={(e) =>
                  updateCurrentMode((p) => ({
                    ...p,
                    images: { ...p.images, imageRatio: e.target.value as ImageAspectRatioOption },
                  }))
                }
                className="w-full brutal-input px-2.5 py-1.5 text-xs font-bold"
              >
                {IMAGE_RATIO_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="p-3 bg-[#F8F8E1] border-2 border-[#001F24] space-y-2">
              <label htmlFor="sz-img-pos" className="block text-xs font-extrabold text-[#1B2A3D]">
                Posisi Fokus Crop Gambar
              </label>
              <select
                id="sz-img-pos"
                value={currentConfig.images.imagePosition}
                onChange={(e) =>
                  updateCurrentMode((p) => ({
                    ...p,
                    images: { ...p.images, imagePosition: e.target.value as ImageFitPositionOption },
                  }))
                }
                className="w-full brutal-input px-2.5 py-1.5 text-xs font-bold"
              >
                {IMAGE_POSITION_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Group D: Typography */}
        {activeGroupTab === 'typography' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            <NumberControl
              id="sz-hero-title"
              label="Ukuran Judul Utama / H1"
              value={currentConfig.typography.heroTitleSize}
              {...SIZING_RANGES.typography.heroTitleSize}
              unit="px"
              onChange={(v) =>
                updateCurrentMode((p) => ({
                  ...p,
                  typography: { ...p.typography, heroTitleSize: v },
                }))
              }
            />
            <NumberControl
              id="sz-section-title"
              label="Ukuran Judul Section / H2"
              value={currentConfig.typography.sectionTitleSize}
              {...SIZING_RANGES.typography.sectionTitleSize}
              unit="px"
              onChange={(v) =>
                updateCurrentMode((p) => ({
                  ...p,
                  typography: { ...p.typography, sectionTitleSize: v },
                }))
              }
            />
            <NumberControl
              id="sz-card-title"
              label="Ukuran Judul Kartu / H3"
              value={currentConfig.typography.cardTitleSize}
              {...SIZING_RANGES.typography.cardTitleSize}
              unit="px"
              onChange={(v) =>
                updateCurrentMode((p) => ({
                  ...p,
                  typography: { ...p.typography, cardTitleSize: v },
                }))
              }
            />
            <NumberControl
              id="sz-body-text"
              label="Ukuran Teks Deskripsi / Body"
              value={currentConfig.typography.bodyTextSize}
              {...SIZING_RANGES.typography.bodyTextSize}
              unit="px"
              onChange={(v) =>
                updateCurrentMode((p) => ({
                  ...p,
                  typography: { ...p.typography, bodyTextSize: v },
                }))
              }
            />
            <NumberControl
              id="sz-meta-text"
              label="Ukuran Teks Label & Metadata"
              value={currentConfig.typography.metaTextSize}
              {...SIZING_RANGES.typography.metaTextSize}
              unit="px"
              onChange={(v) =>
                updateCurrentMode((p) => ({
                  ...p,
                  typography: { ...p.typography, metaTextSize: v },
                }))
              }
            />
            <NumberControl
              id="sz-line-height"
              label="Tinggi Baris (Line Height)"
              value={currentConfig.typography.lineHeight}
              {...SIZING_RANGES.typography.lineHeight}
              unit="×"
              onChange={(v) =>
                updateCurrentMode((p) => ({
                  ...p,
                  typography: { ...p.typography, lineHeight: v },
                }))
              }
            />
            <NumberControl
              id="sz-heading-gap"
              label="Jarak Atas Heading Halaman"
              value={currentConfig.typography.headingGap}
              {...SIZING_RANGES.typography.headingGap}
              unit="px"
              onChange={(v) =>
                updateCurrentMode((p) => ({
                  ...p,
                  typography: { ...p.typography, headingGap: v },
                }))
              }
            />
          </div>
        )}

        {/* Group E: Buttons & Icons */}
        {activeGroupTab === 'buttons' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            <NumberControl
              id="sz-btn-h"
              label="Tinggi Minimum Tombol"
              value={currentConfig.buttons.buttonHeight}
              {...SIZING_RANGES.buttons.buttonHeight}
              unit="px"
              onChange={(v) =>
                updateCurrentMode((p) => ({ ...p, buttons: { ...p.buttons, buttonHeight: v } }))
              }
            />
            <NumberControl
              id="sz-btn-px"
              label="Padding Horizontal Tombol"
              value={currentConfig.buttons.buttonPaddingX}
              {...SIZING_RANGES.buttons.buttonPaddingX}
              unit="px"
              onChange={(v) =>
                updateCurrentMode((p) => ({ ...p, buttons: { ...p.buttons, buttonPaddingX: v } }))
              }
            />
            <NumberControl
              id="sz-btn-text"
              label="Ukuran Teks Tombol"
              value={currentConfig.buttons.buttonTextSize}
              {...SIZING_RANGES.buttons.buttonTextSize}
              unit="px"
              onChange={(v) =>
                updateCurrentMode((p) => ({ ...p, buttons: { ...p.buttons, buttonTextSize: v } }))
              }
            />
            <NumberControl
              id="sz-icon-size"
              label="Ukuran Ikon dalam Tombol"
              value={currentConfig.buttons.iconSize}
              {...SIZING_RANGES.buttons.iconSize}
              unit="px"
              onChange={(v) =>
                updateCurrentMode((p) => ({ ...p, buttons: { ...p.buttons, iconSize: v } }))
              }
            />
            <NumberControl
              id="sz-icon-gap"
              label="Jarak Ikon dan Teks"
              value={currentConfig.buttons.iconGap}
              {...SIZING_RANGES.buttons.iconGap}
              unit="px"
              onChange={(v) =>
                updateCurrentMode((p) => ({ ...p, buttons: { ...p.buttons, iconGap: v } }))
              }
            />
            <NumberControl
              id="sz-btn-radius"
              label="Radius Sudut Tombol"
              value={currentConfig.buttons.buttonRadius}
              {...SIZING_RANGES.buttons.buttonRadius}
              unit="px"
              onChange={(v) =>
                updateCurrentMode((p) => ({ ...p, buttons: { ...p.buttons, buttonRadius: v } }))
              }
            />
          </div>
        )}

        {/* Group F: Spacing */}
        {activeGroupTab === 'spacing' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <NumberControl
              id="sz-title-desc-gap"
              label="Jarak Judul ke Deskripsi"
              value={currentConfig.spacing.titleDescGap}
              {...SIZING_RANGES.spacing.titleDescGap}
              unit="px"
              onChange={(v) =>
                updateCurrentMode((p) => ({ ...p, spacing: { ...p.spacing, titleDescGap: v } }))
              }
            />
            <NumberControl
              id="sz-comp-gap"
              label="Jarak Antarkomponen"
              value={currentConfig.spacing.componentGap}
              {...SIZING_RANGES.spacing.componentGap}
              unit="px"
              onChange={(v) =>
                updateCurrentMode((p) => ({ ...p, spacing: { ...p.spacing, componentGap: v } }))
              }
            />
            <NumberControl
              id="sz-media-text-gap"
              label="Jarak Gambar ke Teks Kartu"
              value={currentConfig.spacing.mediaTextGap}
              {...SIZING_RANGES.spacing.mediaTextGap}
              unit="px"
              onChange={(v) =>
                updateCurrentMode((p) => ({ ...p, spacing: { ...p.spacing, mediaTextGap: v } }))
              }
            />
            <NumberControl
              id="sz-card-sec-gap"
              label="Jarak Header ke Grid Kartu"
              value={currentConfig.spacing.cardSectionGap}
              {...SIZING_RANGES.spacing.cardSectionGap}
              unit="px"
              onChange={(v) =>
                updateCurrentMode((p) => ({ ...p, spacing: { ...p.spacing, cardSectionGap: v } }))
              }
            />
          </div>
        )}
      </section>

      {/* SECTION 4: PER-COMPONENT & PER-PAGE INDEPENDENT OVERRIDES */}
      <section aria-labelledby="component-overrides-heading" className="brutal-card card-bordo frame-bordo p-4 sm:p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#D9B44A]/35 pb-3">
          <div>
            <h2
              id="component-overrides-heading"
              className="font-display text-base sm:text-lg font-extrabold text-[#F8F8E1]"
            >
              4. Pengaturan Khusus per Komponen &amp; Halaman
            </h2>
            <p className="text-xs text-[#F8F8E1]/85 mt-0.5">
              Sesuaikan ukuran komponen secara independen agar kartu Pendidikan, Proyek, Sertifikat, dan Hero tidak harus seragam.
            </p>
          </div>
          <button
            type="button"
            onClick={() => handleResetGroup('components')}
            className="brutal-btn-on-dark-outline px-3 py-1.5 text-[11px] font-bold inline-flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" aria-hidden="true" />
            <span>Reset Semua Komponen</span>
          </button>
        </div>

        <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Pilih komponen atau halaman">
          {COMPONENT_TABS.map((tab) => {
            const active = activeCompTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                data-testid={`sizing-comp-tab-${tab.id}`}
                onClick={() => setActiveCompTab(tab.id)}
                className={`px-3 py-1.5 text-xs font-bold border-2 cursor-pointer transition-colors ${
                  active
                    ? 'bg-[#D9B44A] text-[#001F24] border-[#001F24]'
                    : 'bg-[#6C151E] text-[#F8F8E1] border-[#F8F8E1]/35 hover:border-[#D9B44A]'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <p className="text-xs text-[#D9B44A] font-semibold">
          {COMPONENT_TABS.find((t) => t.id === activeCompTab)?.desc}
        </p>

        {activeCompTab === 'hero' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <NumberControl
              id="comp-hero-pady"
              label="Padding Vertikal Hero"
              value={currentConfig.components.hero.paddingY}
              {...SIZING_RANGES.components.hero.paddingY}
              unit="px"
              onChange={(v) =>
                updateCurrentMode((p) => ({
                  ...p,
                  components: { ...p.components, hero: { ...p.components.hero, paddingY: v } },
                }))
              }
            />
            <NumberControl
              id="comp-hero-portrait"
              label="Tinggi Foto Profil Hero"
              value={currentConfig.components.hero.portraitHeight}
              {...SIZING_RANGES.components.hero.portraitHeight}
              unit="px"
              onChange={(v) =>
                updateCurrentMode((p) => ({
                  ...p,
                  components: { ...p.components, hero: { ...p.components.hero, portraitHeight: v } },
                }))
              }
            />
            <NumberControl
              id="comp-hero-circle"
              label="Diameter Lingkaran Kuning"
              value={currentConfig.components.hero.circleSize}
              {...SIZING_RANGES.components.hero.circleSize}
              unit="px"
              onChange={(v) =>
                updateCurrentMode((p) => ({
                  ...p,
                  components: { ...p.components, hero: { ...p.components.hero, circleSize: v } },
                }))
              }
            />
            <NumberControl
              id="comp-hero-title"
              label="Ukuran Judul Nama Hero"
              value={currentConfig.components.hero.titleSize}
              {...SIZING_RANGES.components.hero.titleSize}
              unit="px"
              onChange={(v) =>
                updateCurrentMode((p) => ({
                  ...p,
                  components: { ...p.components, hero: { ...p.components.hero, titleSize: v } },
                }))
              }
            />
          </div>
        )}

        {activeCompTab === 'education' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <NumberControl
              id="comp-edu-pad"
              label="Padding Kartu Pendidikan"
              value={currentConfig.components.education.cardPadding}
              {...SIZING_RANGES.components.education.cardPadding}
              unit="px"
              onChange={(v) =>
                updateCurrentMode((p) => ({
                  ...p,
                  components: {
                    ...p.components,
                    education: { ...p.components.education, cardPadding: v },
                  },
                }))
              }
            />
            <NumberControl
              id="comp-edu-photo"
              label="Tinggi Maksimum Foto Utama"
              value={currentConfig.components.education.photoMaxHeight}
              {...SIZING_RANGES.components.education.photoMaxHeight}
              unit="px"
              onChange={(v) =>
                updateCurrentMode((p) => ({
                  ...p,
                  components: {
                    ...p.components,
                    education: { ...p.components.education, photoMaxHeight: v },
                  },
                }))
              }
            />
            <NumberControl
              id="comp-edu-thumb"
              label="Ukuran Thumbnail Galeri (1:1)"
              value={currentConfig.components.education.thumbnailSize}
              {...SIZING_RANGES.components.education.thumbnailSize}
              unit="px"
              onChange={(v) =>
                updateCurrentMode((p) => ({
                  ...p,
                  components: {
                    ...p.components,
                    education: { ...p.components.education, thumbnailSize: v },
                  },
                }))
              }
            />
            <NumberControl
              id="comp-edu-title"
              label="Ukuran Judul Lembaga"
              value={currentConfig.components.education.titleSize}
              {...SIZING_RANGES.components.education.titleSize}
              unit="px"
              onChange={(v) =>
                updateCurrentMode((p) => ({
                  ...p,
                  components: {
                    ...p.components,
                    education: { ...p.components.education, titleSize: v },
                  },
                }))
              }
            />
          </div>
        )}

        {activeCompTab === 'projects' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <NumberControl
              id="comp-proj-pad"
              label="Padding Kartu Proyek"
              value={currentConfig.components.projects.cardPadding}
              {...SIZING_RANGES.components.projects.cardPadding}
              unit="px"
              onChange={(v) =>
                updateCurrentMode((p) => ({
                  ...p,
                  components: {
                    ...p.components,
                    projects: { ...p.components.projects, cardPadding: v },
                  },
                }))
              }
            />
            <NumberControl
              id="comp-proj-img"
              label="Tinggi Maksimum Gambar"
              value={currentConfig.components.projects.imageMaxHeight}
              {...SIZING_RANGES.components.projects.imageMaxHeight}
              unit="px"
              onChange={(v) =>
                updateCurrentMode((p) => ({
                  ...p,
                  components: {
                    ...p.components,
                    projects: { ...p.components.projects, imageMaxHeight: v },
                  },
                }))
              }
            />
            <NumberControl
              id="comp-proj-title"
              label="Ukuran Judul Proyek"
              value={currentConfig.components.projects.titleSize}
              {...SIZING_RANGES.components.projects.titleSize}
              unit="px"
              onChange={(v) =>
                updateCurrentMode((p) => ({
                  ...p,
                  components: {
                    ...p.components,
                    projects: { ...p.components.projects, titleSize: v },
                  },
                }))
              }
            />
            <div className="p-3 bg-[#F8F8E1] border-2 border-[#001F24] space-y-2">
              <label htmlFor="comp-proj-ratio" className="block text-xs font-extrabold text-[#1B2A3D]">
                Rasio Gambar Proyek
              </label>
              <select
                id="comp-proj-ratio"
                value={currentConfig.components.projects.imageRatio}
                onChange={(e) =>
                  updateCurrentMode((p) => ({
                    ...p,
                    components: {
                      ...p.components,
                      projects: {
                        ...p.components.projects,
                        imageRatio: e.target.value as ImageAspectRatioOption,
                      },
                    },
                  }))
                }
                className="w-full brutal-input px-2.5 py-1.5 text-xs font-bold"
              >
                {IMAGE_RATIO_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {activeCompTab === 'certificates' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <NumberControl
              id="comp-cert-pad"
              label="Padding Kartu Sertifikat"
              value={currentConfig.components.certificates.cardPadding}
              {...SIZING_RANGES.components.certificates.cardPadding}
              unit="px"
              onChange={(v) =>
                updateCurrentMode((p) => ({
                  ...p,
                  components: {
                    ...p.components,
                    certificates: { ...p.components.certificates, cardPadding: v },
                  },
                }))
              }
            />
            <NumberControl
              id="comp-cert-thumb"
              label="Tinggi Pratinjau Sertifikat"
              value={currentConfig.components.certificates.thumbnailHeight}
              {...SIZING_RANGES.components.certificates.thumbnailHeight}
              unit="px"
              onChange={(v) =>
                updateCurrentMode((p) => ({
                  ...p,
                  components: {
                    ...p.components,
                    certificates: { ...p.components.certificates, thumbnailHeight: v },
                  },
                }))
              }
            />
            <NumberControl
              id="comp-cert-title"
              label="Ukuran Judul Sertifikat"
              value={currentConfig.components.certificates.titleSize}
              {...SIZING_RANGES.components.certificates.titleSize}
              unit="px"
              onChange={(v) =>
                updateCurrentMode((p) => ({
                  ...p,
                  components: {
                    ...p.components,
                    certificates: { ...p.components.certificates, titleSize: v },
                  },
                }))
              }
            />
          </div>
        )}

        {activeCompTab === 'experience' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <NumberControl
              id="comp-exp-pad"
              label="Padding Kartu Pengalaman"
              value={currentConfig.components.experience.cardPadding}
              {...SIZING_RANGES.components.experience.cardPadding}
              unit="px"
              onChange={(v) =>
                updateCurrentMode((p) => ({
                  ...p,
                  components: {
                    ...p.components,
                    experience: { ...p.components.experience, cardPadding: v },
                  },
                }))
              }
            />
            <NumberControl
              id="comp-exp-img"
              label="Tinggi Gambar Pengalaman"
              value={currentConfig.components.experience.imageMaxHeight}
              {...SIZING_RANGES.components.experience.imageMaxHeight}
              unit="px"
              onChange={(v) =>
                updateCurrentMode((p) => ({
                  ...p,
                  components: {
                    ...p.components,
                    experience: { ...p.components.experience, imageMaxHeight: v },
                  },
                }))
              }
            />
            <NumberControl
              id="comp-exp-title"
              label="Ukuran Judul Lembaga"
              value={currentConfig.components.experience.titleSize}
              {...SIZING_RANGES.components.experience.titleSize}
              unit="px"
              onChange={(v) =>
                updateCurrentMode((p) => ({
                  ...p,
                  components: {
                    ...p.components,
                    experience: { ...p.components.experience, titleSize: v },
                  },
                }))
              }
            />
          </div>
        )}

        {activeCompTab === 'about' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <NumberControl
              id="comp-about-pad"
              label="Padding Kartu Biografi"
              value={currentConfig.components.about.cardPadding}
              {...SIZING_RANGES.components.about.cardPadding}
              unit="px"
              onChange={(v) =>
                updateCurrentMode((p) => ({
                  ...p,
                  components: {
                    ...p.components,
                    about: { ...p.components.about, cardPadding: v },
                  },
                }))
              }
            />
            <NumberControl
              id="comp-about-portrait"
              label="Tinggi Maksimum Foto Profil"
              value={currentConfig.components.about.portraitMaxHeight}
              {...SIZING_RANGES.components.about.portraitMaxHeight}
              unit="px"
              onChange={(v) =>
                updateCurrentMode((p) => ({
                  ...p,
                  components: {
                    ...p.components,
                    about: { ...p.components.about, portraitMaxHeight: v },
                  },
                }))
              }
            />
            <NumberControl
              id="comp-about-body"
              label="Ukuran Teks Biografi"
              value={currentConfig.components.about.bodyTextSize}
              {...SIZING_RANGES.components.about.bodyTextSize}
              unit="px"
              onChange={(v) =>
                updateCurrentMode((p) => ({
                  ...p,
                  components: {
                    ...p.components,
                    about: { ...p.components.about, bodyTextSize: v },
                  },
                }))
              }
            />
          </div>
        )}
      </section>

      {/* SECTION 5: REAL-TIME LIVE PREVIEW (DESKTOP / TABLET / MOBILE) */}
      <section aria-labelledby="sizing-live-preview-heading" className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2
            id="sizing-live-preview-heading"
            className="font-display text-lg font-extrabold text-[#1B2A3D] flex items-center gap-2"
          >
            <Eye className="w-4 h-4 text-[#0F3D3A]" aria-hidden="true" />
            <span>5. Pratinjau Langsung Ukuran ({targetMeta.name})</span>
          </h2>

          <div className="flex items-center gap-1.5" role="tablist" aria-label="Pilih perangkat pratinjau">
            {DEVICE_TABS.map((dev) => {
              const Icon = dev.icon;
              const active = previewDevice === dev.id;
              return (
                <button
                  key={dev.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setPreviewDevice(dev.id)}
                  className={`px-2.5 py-1 text-[11px] font-bold border-2 inline-flex items-center gap-1 cursor-pointer ${
                    active
                      ? 'bg-[#0F3D3A] text-[#F8F8E1] border-[#001F24]'
                      : 'bg-[#F8F8E1] text-[#1B2A3D] border-[#001F24] hover:bg-[#D9B44A]'
                  }`}
                >
                  <Icon className="w-3 h-3" aria-hidden="true" />
                  <span>{dev.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div
          data-testid="sizing-live-preview-stage"
          className="brutal-card card-navy frame-navy p-3 sm:p-4 space-y-3"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 px-2 py-1 border-b border-[#D9B44A]/35 text-[11px] font-mono-num text-[#F8F8E1]/90">
            <span>
              Viewport: <strong className="text-[#D9B44A] uppercase">{previewDevice}</strong> · Preset:{' '}
              <strong className="text-[#D9B44A] uppercase">{currentConfig.preset}</strong>
            </span>
            <span>
              Container: {previewCssVars['--sz-content-max-w']} · Pad-X: {previewCssVars['--sz-pad-x']} · Card Gap:{' '}
              {previewCssVars['--sz-card-gap']}
            </span>
          </div>

          {/* Isolated Preview Canvas (Real CSS Dimensions, Zero transform: scale) */}
          <div className="overflow-x-auto py-1">
            <div
              style={previewFrameStyle}
              className="bg-[#F8F8E1] text-[#1B2A3D] transition-all duration-200 border border-[#001F24]/20"
            >
              <div
                style={{
                  paddingLeft: 'var(--sz-pad-x)',
                  paddingRight: 'var(--sz-pad-x)',
                  paddingTop: 'var(--sz-pad-y)',
                  paddingBottom: 'var(--sz-pad-y)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 'var(--sz-section-gap)',
                }}
              >
                {/* Live Hero Preview */}
                <div
                  className="relative bg-[#0F3D3A] text-[#F8F8E1] overflow-hidden"
                  style={{
                    borderRadius: 'var(--sz-frame-radius)',
                    borderWidth: 'var(--sz-border-w)',
                    borderStyle: 'solid',
                    borderColor: isTargetMinimal ? 'rgba(217, 180, 74, 0.28)' : '#001F24',
                    paddingTop: 'var(--sz-hero-pad-y)',
                    paddingBottom: 'var(--sz-hero-pad-y)',
                    paddingLeft: 'var(--sz-pad-x)',
                    paddingRight: 'var(--sz-pad-x)',
                  }}
                >
                  <div
                    className={`grid gap-4 items-center ${
                      previewDevice === 'mobile' ? 'grid-cols-1 text-center' : 'grid-cols-12'
                    }`}
                  >
                    <div className={previewDevice === 'mobile' ? 'space-y-2' : 'col-span-7 space-y-2'}>
                      <p
                        className="font-mono-num uppercase font-bold text-[#D9B44A]"
                        style={{ fontSize: 'var(--sz-meta-text)' }}
                      >
                        &mdash; {adminData.profile.domicile}
                      </p>
                      <p
                        className="font-display font-extrabold text-[#F8F8E1] leading-[1.06]"
                        style={{ fontSize: 'var(--sz-hero-comp-title)' }}
                      >
                        {adminData.profile.fullName}
                      </p>
                      <p
                        className="text-[#F8F8E1]/90"
                        style={{
                          fontSize: 'var(--sz-body-text)',
                          lineHeight: 'var(--sz-line-height)',
                        }}
                      >
                        {adminData.profile.headline}
                      </p>
                      <div
                        className={`flex flex-wrap items-center pt-1 ${
                          previewDevice === 'mobile' ? 'justify-center' : ''
                        }`}
                        style={{ gap: 'var(--sz-comp-gap)' }}
                      >
                        <span
                          className="inline-flex items-center justify-center bg-[#F8F8E1] text-[#0F3D3A] font-display font-bold"
                          style={{
                            minHeight: 'var(--sz-btn-h)',
                            paddingLeft: 'var(--sz-btn-px)',
                            paddingRight: 'var(--sz-btn-px)',
                            fontSize: 'var(--sz-btn-text)',
                            borderRadius: 'var(--sz-btn-radius)',
                          }}
                        >
                          Explore Portfolio
                        </span>
                        <span
                          className="inline-flex items-center justify-center border border-[#F8F8E1]/50 text-[#F8F8E1] font-display font-bold"
                          style={{
                            minHeight: 'var(--sz-btn-h)',
                            paddingLeft: 'var(--sz-btn-px)',
                            paddingRight: 'var(--sz-btn-px)',
                            fontSize: 'var(--sz-btn-text)',
                            borderRadius: 'var(--sz-btn-radius)',
                          }}
                        >
                          Contact Me
                        </span>
                      </div>
                    </div>

                    <div
                      className={`flex justify-center ${
                        previewDevice === 'mobile' ? 'mt-2' : 'col-span-5'
                      }`}
                    >
                      {isTargetMinimal ? (
                        <div
                          className="relative isolate flex items-end justify-center overflow-hidden"
                          style={{
                            width: 'calc(var(--sz-hero-circle) * 0.72)',
                            height: 'calc(var(--sz-hero-portrait-h) * 0.62)',
                          }}
                        >
                          <div
                            className="absolute bottom-1 rounded-full bg-[#D9B44A] z-10 pointer-events-none"
                            style={{
                              width: 'calc(var(--sz-hero-circle) * 0.62)',
                              height: 'calc(var(--sz-hero-circle) * 0.62)',
                            }}
                          />
                          {useCutoutPreview ? (
                            <img
                              src={HERO_CUTOUT_ASSET_URL}
                              alt="Pratinjau potret Hero"
                              className="relative z-20 w-auto h-full max-w-full object-contain object-bottom block opacity-100"
                            />
                          ) : (
                            <div className="relative z-20 w-24 h-28 rounded-t-full overflow-hidden">
                              <SafeImage
                                src={adminData.profile.photoUrl}
                                alt="Pratinjau potret profil"
                                className="w-full h-full object-cover object-top"
                              />
                            </div>
                          )}
                          <div
                            aria-hidden="true"
                            className="hero-bottom-green-fade absolute inset-x-0 bottom-0 h-8 z-30 pointer-events-none"
                          />
                        </div>
                      ) : (
                        <div
                          className="rounded-full p-1 bg-[#D9B44A] border-2 border-[#001F24]"
                          style={{
                            width: 'calc(var(--sz-hero-circle) * 0.56)',
                            height: 'calc(var(--sz-hero-circle) * 0.56)',
                          }}
                        >
                          <div className="w-full h-full rounded-full overflow-hidden border-2 border-[#001F24] bg-[#F8F8E1]">
                            <SafeImage
                              src={adminData.profile.photoUrl}
                              alt="Pratinjau foto profil"
                              className="w-full h-full object-cover object-[50%_18%]"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Live Sample Cards Grid */}
                <div
                  className={`grid ${
                    previewDevice === 'mobile'
                      ? 'grid-cols-1'
                      : previewDevice === 'tablet'
                        ? 'grid-cols-2'
                        : 'grid-cols-3'
                  }`}
                  style={{ gap: 'var(--sz-card-gap)' }}
                >
                  {/* Sample Card 1: Education (Navy + Thumbnail) */}
                  <div
                    className="bg-[#1B2A3D] text-[#F8F8E1] flex flex-col justify-between"
                    style={{
                      padding: 'var(--sz-edu-pad)',
                      borderRadius: 'var(--sz-card-radius)',
                      borderWidth: 'var(--sz-border-w)',
                      borderStyle: 'solid',
                      borderColor: isTargetMinimal ? 'rgba(248, 248, 225, 0.16)' : '#001F24',
                      gap: 'var(--sz-title-desc-gap)',
                    }}
                  >
                    <div>
                      <span
                        className="font-mono-num font-bold uppercase text-[#D9B44A]"
                        style={{ fontSize: 'var(--sz-meta-text)' }}
                      >
                        Pendidikan
                      </span>
                      <p
                        className="font-display font-extrabold mt-1 leading-snug"
                        style={{ fontSize: 'var(--sz-edu-title)' }}
                      >
                        UIN Sunan Gunung Djati
                      </p>
                      <p
                        className="text-[#F8F8E1]/85 mt-1"
                        style={{
                          fontSize: 'var(--sz-body-text)',
                          lineHeight: 'var(--sz-line-height)',
                        }}
                      >
                        Hukum Keluarga (Ahwal Syakhshiyyah) · 2025
                      </p>
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <div
                        className="bg-[#D9B44A]/30 border border-[#D9B44A] shrink-0"
                        style={{
                          width: 'calc(var(--sz-edu-thumb) * 0.55)',
                          height: 'calc(var(--sz-edu-thumb) * 0.55)',
                          borderRadius: 'var(--sz-img-radius)',
                        }}
                      />
                      <div
                        className="bg-[#D9B44A]/20 border border-[#D9B44A]/60 shrink-0"
                        style={{
                          width: 'calc(var(--sz-edu-thumb) * 0.55)',
                          height: 'calc(var(--sz-edu-thumb) * 0.55)',
                          borderRadius: 'var(--sz-img-radius)',
                        }}
                      />
                    </div>
                  </div>

                  {/* Sample Card 2: Project (Green + Media Box) */}
                  <div
                    className="bg-[#0F3D3A] text-[#F8F8E1] overflow-hidden flex flex-col"
                    style={{
                      borderRadius: 'var(--sz-card-radius)',
                      borderWidth: 'var(--sz-border-w)',
                      borderStyle: 'solid',
                      borderColor: isTargetMinimal ? 'rgba(248, 248, 225, 0.16)' : '#001F24',
                    }}
                  >
                    <div
                      className="w-full bg-[#F4F4F0] border-b border-[#D9B44A]/40 flex items-center justify-center text-[11px] font-mono-num font-bold text-[#0F3D3A]"
                      style={{
                        height: 'calc(var(--sz-proj-img-h) * 0.45)',
                      }}
                    >
                      MEDIA PROYEK ({currentConfig.components.projects.imageRatio})
                    </div>
                    <div
                      className="flex flex-col"
                      style={{
                        padding: 'var(--sz-proj-pad)',
                        gap: 'var(--sz-title-desc-gap)',
                      }}
                    >
                      <span
                        className="font-mono-num font-bold uppercase text-[#D9B44A]"
                        style={{ fontSize: 'var(--sz-meta-text)' }}
                      >
                        Website &amp; Digital
                      </span>
                      <p
                        className="font-display font-extrabold leading-snug"
                        style={{ fontSize: 'var(--sz-proj-title)' }}
                      >
                        Dars with Osama
                      </p>
                    </div>
                  </div>

                  {/* Sample Card 3: Skills / Highlight (Gold + Deep Ink) */}
                  <div
                    className="bg-[#D9B44A] text-[#001F24] flex flex-col justify-between"
                    style={{
                      padding: 'var(--sz-card-pad)',
                      borderRadius: 'var(--sz-card-radius)',
                      borderWidth: 'var(--sz-border-w)',
                      borderStyle: 'solid',
                      borderColor: isTargetMinimal ? 'rgba(0, 31, 36, 0.18)' : '#001F24',
                      gap: 'var(--sz-title-desc-gap)',
                    }}
                  >
                    <div>
                      <span
                        className="font-mono-num font-bold uppercase text-[#001F24]"
                        style={{ fontSize: 'var(--sz-meta-text)' }}
                      >
                        Keahlian
                      </span>
                      <p
                        className="font-display font-extrabold mt-1 leading-snug text-[#001F24]"
                        style={{ fontSize: 'var(--sz-card-title)' }}
                      >
                        Web Development &amp; Edukasi
                      </p>
                      <p
                        className="text-[#001F24]/90 mt-1"
                        style={{
                          fontSize: 'var(--sz-body-text)',
                          lineHeight: 'var(--sz-line-height)',
                        }}
                      >
                        Contoh kepadatan teks, tinggi baris, dan padding kartu kuning.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ACTION BAR: RESET, BATALKAN, TERAPKAN (DRAFT), SIMPAN PERMANEN */}
      <div className="brutal-card card-gold frame-gold p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="text-xs sm:text-sm text-[#001F24]">
          <p className="font-display font-extrabold">
            {hasChanges
              ? `Terdapat perubahan ukuran belum disimpan pada mode ${targetMeta.name}`
              : `Seluruh ukuran untuk mode ${targetMeta.name} sudah tersimpan di database.`}
          </p>
          <p className="mt-0.5 text-xs text-[#001F24]/90">
            Gunakan <strong>Terapkan (Draft)</strong> untuk meninjau langsung di halaman publik tanpa mengubah situs untuk pengunjung, atau klik <strong>Simpan Permanen</strong> agar tetap tersimpan setelah muat ulang.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            data-testid="sizing-reset-all-btn"
            onClick={handleResetAllCurrentMode}
            disabled={saving}
            className="brutal-btn brutal-btn-outline px-3 py-2 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Reset Semua</span>
          </button>

          {(hasChanges || draftSizingPreview) && (
            <button
              type="button"
              data-testid="sizing-cancel-btn"
              onClick={handleCancelChanges}
              disabled={saving}
              className="brutal-btn brutal-btn-outline px-3 py-2 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <span>Batalkan</span>
            </button>
          )}

          <button
            type="button"
            data-testid="sizing-apply-preview-btn"
            onClick={handleApplyDraftPreview}
            disabled={saving}
            className="brutal-btn-frame-green px-3.5 py-2 text-xs font-display font-bold inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Play className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Terapkan (Draft)</span>
          </button>

          <button
            type="button"
            data-testid="sizing-save-btn"
            onClick={handleSavePermanent}
            disabled={!hasChanges || saving}
            className="brutal-btn-on-gold px-4 py-2 text-xs sm:text-sm font-display font-extrabold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-55"
          >
            <Save className="w-4 h-4" aria-hidden="true" />
            <span>{saving ? 'Menyimpan...' : 'Simpan Permanen'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
