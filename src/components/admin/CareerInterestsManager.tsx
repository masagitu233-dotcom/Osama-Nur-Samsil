import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Pencil,
  Plus,
  Save,
  Trash2,
  X,
} from 'lucide-react';
import { usePortfolio } from '../../context/PortfolioContext';
import {
  deleteManagedItem,
  saveCareerInterestsOverview,
  upsertManagedItem,
} from '../../services/portfolioService';
import type { InterestItem, PublishStatus } from '../../types/portfolio';
import { Modal } from '../ui/Modal';
import {
  buildNextCareerInterestOrder,
  CAREER_ITEM_DESC_MAX_LENGTH,
  CAREER_ITEM_TITLE_MAX_LENGTH,
  CAREER_OVERVIEW_MAX_LENGTH,
  computeCareerReorderUpdates,
  extractCareerInterestItems,
  validateCareerInterestForm,
  validateCareerOverview,
} from '../../utils/careerInterests';

interface CareerInterestsManagerProps {
  onDirtyChange: (dirty: boolean) => void;
}

interface InlineFeedback {
  type: 'success' | 'error';
  message: string;
}

export const CareerInterestsManager: React.FC<CareerInterestsManagerProps> = ({ onDirtyChange }) => {
  const { adminData, showToast } = usePortfolio();

  // Level 1: General Overview state (stored in /profile/main.careerInterestsOverview)
  const savedOverview = adminData.profile.careerInterestsOverview ?? '';
  const [overview, setOverview] = useState(savedOverview);
  const [overviewDirty, setOverviewDirty] = useState(false);
  const [savingOverview, setSavingOverview] = useState(false);
  const [overviewFeedback, setOverviewFeedback] = useState<InlineFeedback | null>(null);

  // Level 2: Career interest items (stored in /interests with category = 'career_interest')
  const careerItems = useMemo(
    () => extractCareerInterestItems(adminData.interests),
    [adminData.interests]
  );

  const [editingItem, setEditingItem] = useState<InterestItem | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<PublishStatus>('published');
  const [isVisible, setIsVisible] = useState(true);
  const [savingItem, setSavingItem] = useState(false);
  const [reorderingId, setReorderingId] = useState<string | null>(null);
  const [itemFeedback, setItemFeedback] = useState<InlineFeedback | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<InterestItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const titleInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setOverview(savedOverview);
    setOverviewDirty(false);
  }, [savedOverview]);

  const itemFormDirty = useMemo(() => {
    if (editingItem) {
      return (
        title !== editingItem.title ||
        description !== (editingItem.description || '') ||
        status !== editingItem.status ||
        isVisible !== editingItem.isVisible
      );
    }
    return title.trim().length > 0 || description.trim().length > 0;
  }, [editingItem, title, description, status, isVisible]);

  useEffect(() => {
    onDirtyChange(overviewDirty || itemFormDirty);
  }, [overviewDirty, itemFormDirty, onDirtyChange]);

  const resetItemForm = () => {
    setEditingItem(null);
    setTitle('');
    setDescription('');
    setStatus('published');
    setIsVisible(true);
  };

  const handleSaveOverview = async (e: React.FormEvent) => {
    e.preventDefault();
    setOverviewFeedback(null);

    const check = validateCareerOverview(overview);
    if (!check.valid) {
      setOverviewFeedback({ type: 'error', message: check.error || 'Uraian umum tidak valid.' });
      showToast('error', check.error || 'Uraian umum tidak valid.');
      return;
    }

    setSavingOverview(true);
    try {
      await saveCareerInterestsOverview(check.value, adminData.profile);
      setOverview(check.value);
      setOverviewDirty(false);
      const msg = 'Uraian umum bidang pekerjaan berhasil disimpan ke Firestore.';
      setOverviewFeedback({ type: 'success', message: msg });
      showToast('success', msg);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Gagal menyimpan uraian umum bidang pekerjaan.';
      setOverviewFeedback({ type: 'error', message: msg });
      showToast('error', msg);
    } finally {
      setSavingOverview(false);
    }
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setItemFeedback(null);

    const check = validateCareerInterestForm({ title, description });
    if (!check.valid) {
      setItemFeedback({ type: 'error', message: check.error || 'Data bidang pekerjaan belum valid.' });
      showToast('error', check.error || 'Data bidang pekerjaan belum valid.');
      return;
    }

    setSavingItem(true);
    try {
      const displayOrder = editingItem
        ? editingItem.displayOrder
        : buildNextCareerInterestOrder(careerItems);

      await upsertManagedItem(
        'interests',
        editingItem ? editingItem.id : null,
        {
          title: check.title,
          category: 'career_interest',
          description: check.description,
          imageUrl: editingItem?.imageUrl ?? '',
          status,
          isVisible,
          displayOrder,
        },
        check.title
      );

      const msg = editingItem
        ? `Bidang "${check.title}" berhasil diperbarui.`
        : `Bidang "${check.title}" berhasil ditambahkan.`;
      setItemFeedback({ type: 'success', message: msg });
      showToast('success', msg);
      resetItemForm();
      titleInputRef.current?.focus();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Gagal menyimpan bidang pekerjaan.';
      setItemFeedback({ type: 'error', message: msg });
      showToast('error', msg);
    } finally {
      setSavingItem(false);
    }
  };

  const handleStartEdit = (item: InterestItem) => {
    setEditingItem(item);
    setTitle(item.title);
    setDescription(item.description || '');
    setStatus(item.status);
    setIsVisible(item.isVisible);
    setItemFeedback(null);
    titleInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    titleInputRef.current?.focus();
  };

  const handleQuickToggle = async (item: InterestItem, field: 'status' | 'isVisible') => {
    setItemFeedback(null);
    const updated = {
      ...item,
      category: 'career_interest' as const,
      [field]:
        field === 'status'
          ? item.status === 'published'
            ? 'draft'
            : 'published'
          : !item.isVisible,
    };
    try {
      await upsertManagedItem('interests', item.id, updated, item.title);
      const msg =
        field === 'status'
          ? `Status "${item.title}" diubah menjadi ${updated.status === 'published' ? 'Published' : 'Draft'}.`
          : `"${item.title}" sekarang ${updated.isVisible ? 'ditampilkan' : 'disembunyikan'} di halaman publik.`;
      setItemFeedback({ type: 'success', message: msg });
      showToast('success', msg);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Gagal memperbarui status tampilan.';
      setItemFeedback({ type: 'error', message: msg });
      showToast('error', msg);
    }
  };

  const handleReorder = async (index: number, direction: -1 | 1) => {
    const updates = computeCareerReorderUpdates(careerItems, index, direction);
    if (updates.length === 0) return;

    const movedItem = careerItems[index];
    setReorderingId(movedItem.id);
    setItemFeedback(null);
    try {
      await Promise.all(
        updates.map(({ item, nextOrder }) =>
          upsertManagedItem(
            'interests',
            item.id,
            {
              ...item,
              category: 'career_interest',
              displayOrder: nextOrder,
            },
            item.title
          )
        )
      );
      const msg = `Urutan bidang "${movedItem.title}" berhasil diperbarui.`;
      setItemFeedback({ type: 'success', message: msg });
      showToast('success', msg);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Gagal mengubah urutan bidang pekerjaan.';
      setItemFeedback({ type: 'error', message: msg });
      showToast('error', msg);
    } finally {
      setReorderingId(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setItemFeedback(null);
    try {
      await deleteManagedItem('interests', deleteTarget.id, deleteTarget.title);
      if (editingItem?.id === deleteTarget.id) {
        resetItemForm();
      }
      const msg = `Bidang "${deleteTarget.title}" berhasil dihapus dari Firestore.`;
      setItemFeedback({ type: 'success', message: msg });
      showToast('success', msg);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Gagal menghapus bidang pekerjaan.';
      setItemFeedback({ type: 'error', message: msg });
      showToast('error', msg);
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  const publishedCount = careerItems.filter((i) => i.status === 'published' && i.isVisible).length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <header data-aos="fade-up" className="pb-3.5 border-b-2 border-brutal">
        <span className="brutal-badge">Halaman About &middot; Bagian 06</span>
        <h1 className="font-display text-xl sm:text-2xl font-extrabold mt-1.5">
          06. Bidang Pekerjaan yang Diminati
        </h1>
        <p className="text-xs sm:text-sm text-muted mt-1 max-w-2xl leading-relaxed">
          Kelola uraian umum orientasi pekerjaan serta daftar bidang pekerjaan yang ditampilkan pada bagian 06 halaman About publik.
        </p>
      </header>

      {/* FORM A: General Overview */}
      <section
        data-aos="fade-up"
        aria-labelledby="career-overview-heading"
        className="brutal-card card-beige frame-shadow-green p-5 sm:p-6 space-y-4"
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <span className="brutal-badge-green">Bagian A</span>
            <h2 id="career-overview-heading" className="font-display text-lg font-extrabold mt-1.5">
              Uraian Umum Bidang Pekerjaan
            </h2>
            <p className="text-xs sm:text-sm text-muted mt-0.5">
              Ditampilkan sebagai teks pengantar tepat sebelum kumpulan card bidang pekerjaan pada halaman About.
            </p>
          </div>
          {overviewDirty && (
            <span className="brutal-badge-bordo">Belum disimpan</span>
          )}
        </div>

        <form onSubmit={handleSaveOverview} className="space-y-3.5">
          <div>
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <label htmlFor="career-overview-input" className="block text-xs font-bold uppercase">
                Uraian Umum Orientasi Pekerjaan
              </label>
              <span className="font-mono-num text-[11px] font-semibold text-muted">
                {overview.length}/{CAREER_OVERVIEW_MAX_LENGTH}
              </span>
            </div>
            <textarea
              id="career-overview-input"
              rows={4}
              maxLength={CAREER_OVERVIEW_MAX_LENGTH}
              value={overview}
              onChange={(e) => {
                setOverview(e.target.value);
                setOverviewDirty(true);
                setOverviewFeedback(null);
              }}
              placeholder="Tuliskan penjelasan umum mengenai orientasi pekerjaan, jenis peran, atau arah kontribusi profesional yang diminati..."
              className="w-full brutal-input px-3.5 py-2.5 text-sm leading-relaxed"
            />
          </div>

          {overviewFeedback && (
            <div
              role="status"
              className={`border-2 p-3 text-xs sm:text-sm font-semibold flex items-start gap-2 ${
                overviewFeedback.type === 'success'
                  ? 'bg-[#0F3D3A] text-[#F8F8E1] border-[#013A42]'
                  : 'bg-[#6C151E] text-[#F8F8E1] border-[#013A42]'
              }`}
            >
              {overviewFeedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-[#8ACCD5]" aria-hidden="true" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#8ACCD5]" aria-hidden="true" />
              )}
              <span>{overviewFeedback.message}</span>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-end gap-2.5">
            {overviewDirty && (
              <button
                type="button"
                onClick={() => {
                  setOverview(savedOverview);
                  setOverviewDirty(false);
                  setOverviewFeedback(null);
                }}
                className="brutal-btn brutal-btn-outline px-3.5 py-2 text-xs font-bold cursor-pointer"
              >
                Batalkan Perubahan
              </button>
            )}
            <button
              type="submit"
              disabled={savingOverview}
              className="brutal-btn brutal-btn-primary px-4 py-2 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
            >
              <Save className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{savingOverview ? 'Menyimpan...' : 'Simpan Uraian Umum'}</span>
            </button>
          </div>
        </form>
      </section>

      {/* FORM B: Career Interest Items List & CRUD */}
      <section aria-labelledby="career-items-heading" className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <span className="brutal-badge-bordo">Bagian B</span>
            <h2 id="career-items-heading" className="font-display text-lg font-extrabold mt-1.5">
              Daftar Bidang Pekerjaan
            </h2>
            <p className="text-xs sm:text-sm text-muted mt-0.5">
              Tambahkan beberapa bidang pekerjaan secara bertahap, atur urutan tampilannya, atau perbarui kapan saja.
            </p>
          </div>
          <div className="font-mono-num text-xs font-bold text-muted">
            Total: {careerItems.length} bidang &middot; Publik: {publishedCount}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Create / Edit Item Form */}
          <form
            onSubmit={handleSaveItem}
            data-aos="fade-up"
            className="lg:col-span-5 brutal-card surface-card p-5 space-y-4"
          >
            <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-subtle">
              <h3 className="font-display text-base font-extrabold">
                {editingItem ? 'Edit Bidang Pekerjaan' : 'Tambah Bidang Pekerjaan'}
              </h3>
              {editingItem && (
                <button
                  type="button"
                  onClick={() => {
                    resetItemForm();
                    setItemFeedback(null);
                  }}
                  className="text-xs font-bold inline-flex items-center gap-1 text-[#6C151E] hover:underline cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Batal Edit</span>
                </button>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between gap-2 mb-1">
                <label htmlFor="career-item-title" className="block text-xs font-bold uppercase">
                  Nama Bidang Pekerjaan *
                </label>
                <span className="font-mono-num text-[11px] text-muted">
                  {title.length}/{CAREER_ITEM_TITLE_MAX_LENGTH}
                </span>
              </div>
              <input
                ref={titleInputRef}
                id="career-item-title"
                type="text"
                required
                maxLength={CAREER_ITEM_TITLE_MAX_LENGTH}
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  setItemFeedback(null);
                }}
                placeholder="Masukkan nama bidang pekerjaan..."
                className="w-full brutal-input px-3 py-2 text-sm"
              />
            </div>

            <div>
              <div className="flex items-center justify-between gap-2 mb-1">
                <label htmlFor="career-item-desc" className="block text-xs font-bold uppercase">
                  Deskripsi Singkat
                </label>
                <span className="font-mono-num text-[11px] text-muted">
                  {description.length}/{CAREER_ITEM_DESC_MAX_LENGTH}
                </span>
              </div>
              <textarea
                id="career-item-desc"
                rows={4}
                maxLength={CAREER_ITEM_DESC_MAX_LENGTH}
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  setItemFeedback(null);
                }}
                placeholder="Jelaskan ketertarikan, peran, atau kontribusi yang diharapkan pada bidang ini..."
                className="w-full brutal-input px-3 py-2 text-sm leading-relaxed"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label htmlFor="career-item-status" className="block text-xs font-bold uppercase mb-1">
                  Status
                </label>
                <select
                  id="career-item-status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as PublishStatus)}
                  className="w-full brutal-input px-3 py-1.5 text-sm font-bold"
                >
                  <option value="published">Published (Publik)</option>
                  <option value="draft">Draft (Disimpan)</option>
                </select>
              </div>
              <div className="flex items-end pb-1.5">
                <label className="flex items-center gap-2 text-xs sm:text-sm font-bold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isVisible}
                    onChange={(e) => setIsVisible(e.target.checked)}
                    className="w-4 h-4 accent-[#013A42]"
                  />
                  <span>Tampilkan ke Publik</span>
                </label>
              </div>
            </div>

            {itemFeedback && (
              <div
                role="status"
                className={`border-2 p-3 text-xs font-semibold flex items-start gap-2 ${
                  itemFeedback.type === 'success'
                    ? 'bg-[#0F3D3A] text-[#F8F8E1] border-[#013A42]'
                    : 'bg-[#6C151E] text-[#F8F8E1] border-[#013A42]'
                }`}
              >
                {itemFeedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-[#8ACCD5]" aria-hidden="true" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#8ACCD5]" aria-hidden="true" />
                )}
                <span>{itemFeedback.message}</span>
              </div>
            )}

            <div className="pt-1 flex flex-wrap items-center justify-end gap-2">
              {editingItem && (
                <button
                  type="button"
                  onClick={resetItemForm}
                  className="brutal-btn brutal-btn-outline px-3.5 py-2 text-xs font-bold cursor-pointer"
                >
                  Batal
                </button>
              )}
              <button
                type="submit"
                disabled={savingItem}
                className="brutal-btn brutal-btn-primary px-4 py-2 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
              >
                {editingItem ? (
                  <Save className="w-3.5 h-3.5" aria-hidden="true" />
                ) : (
                  <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                )}
                <span>
                  {savingItem
                    ? 'Menyimpan...'
                    : editingItem
                    ? 'Simpan Perubahan'
                    : 'Tambah Bidang'}
                </span>
              </button>
            </div>
          </form>

          {/* Saved Career Interest Items List */}
          <div className="lg:col-span-7 space-y-3">
            {careerItems.length === 0 ? (
              <div
                data-aos="fade-up"
                className="brutal-card surface-card p-6 text-center space-y-2"
              >
                <p className="font-display text-base font-extrabold">
                  Belum ada bidang pekerjaan yang tersimpan.
                </p>
                <p className="text-xs sm:text-sm text-muted max-w-md mx-auto leading-relaxed">
                  Gunakan formulir di samping untuk menambahkan bidang pekerjaan pertama Anda. Setiap data yang dipublikasikan akan langsung muncul di bagian 06 halaman About.
                </p>
              </div>
            ) : (
              careerItems.map((item, idx) => {
                const isEditingThis = editingItem?.id === item.id;
                const isBusy = reorderingId === item.id;
                return (
                  <article
                    key={item.id}
                    className={`brutal-card surface-card p-4 space-y-3 transition-colors ${
                      isEditingThis ? 'ring-2 ring-[#6C151E]' : ''
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono-num">
                          <span className="font-extrabold text-[#013A42]">
                            #{String(idx + 1).padStart(2, '0')}
                          </span>
                          <span className={item.status === 'published' ? 'brutal-badge' : 'brutal-badge-inverse'}>
                            {item.status === 'published' ? 'Published' : 'Draft'}
                          </span>
                          <span className="text-muted font-semibold">
                            &middot; {item.isVisible ? 'Tampil Publik' : 'Disembunyikan'}
                          </span>
                        </div>
                        <h3 className="font-display text-base font-extrabold mt-1.5 leading-snug">
                          {item.title}
                        </h3>
                        {item.description ? (
                          <p className="text-xs sm:text-sm text-muted mt-1 leading-relaxed whitespace-pre-line">
                            {item.description}
                          </p>
                        ) : (
                          <p className="text-xs text-muted italic mt-1">
                            Belum ada deskripsi singkat.
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="pt-2.5 border-t border-subtle flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleReorder(idx, -1)}
                          disabled={idx === 0 || isBusy}
                          aria-label={`Naikkan urutan ${item.title}`}
                          title="Naikkan urutan"
                          className="brutal-btn brutal-btn-outline px-2 py-1.5 text-xs font-bold inline-flex items-center gap-1 cursor-pointer disabled:opacity-40"
                        >
                          <ArrowUp className="w-3.5 h-3.5" aria-hidden="true" />
                          <span className="hidden sm:inline">Naik</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReorder(idx, 1)}
                          disabled={idx === careerItems.length - 1 || isBusy}
                          aria-label={`Turunkan urutan ${item.title}`}
                          title="Turunkan urutan"
                          className="brutal-btn brutal-btn-outline px-2 py-1.5 text-xs font-bold inline-flex items-center gap-1 cursor-pointer disabled:opacity-40"
                        >
                          <ArrowDown className="w-3.5 h-3.5" aria-hidden="true" />
                          <span className="hidden sm:inline">Turun</span>
                        </button>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleQuickToggle(item, 'status')}
                          className="brutal-btn brutal-btn-outline px-2.5 py-1.5 text-xs font-bold cursor-pointer"
                        >
                          {item.status === 'published' ? 'Jadikan Draft' : 'Publikasikan'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleQuickToggle(item, 'isVisible')}
                          aria-label={item.isVisible ? `Sembunyikan ${item.title}` : `Tampilkan ${item.title}`}
                          title={item.isVisible ? 'Sembunyikan' : 'Tampilkan'}
                          className="brutal-btn brutal-btn-outline p-1.5 cursor-pointer"
                        >
                          {item.isVisible ? (
                            <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                          ) : (
                            <EyeOff className="w-3.5 h-3.5" aria-hidden="true" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStartEdit(item)}
                          aria-label={`Edit ${item.title}`}
                          className="brutal-btn brutal-btn-secondary px-2.5 py-1.5 text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(item)}
                          aria-label={`Hapus ${item.title}`}
                          className="brutal-btn brutal-btn-bordo px-2.5 py-1.5 text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>Hapus</span>
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </div>
      </section>

      {/* Delete Confirmation Modal */}
      <Modal
        open={Boolean(deleteTarget)}
        onClose={() => !deleting && setDeleteTarget(null)}
        title="Konfirmasi Hapus Bidang Pekerjaan"
        maxWidthClass="max-w-md"
      >
        <p className="text-sm leading-relaxed mb-6">
          Anda yakin ingin menghapus bidang pekerjaan <strong>{deleteTarget?.title}</strong> secara permanen dari Firestore?
        </p>
        <div className="flex justify-end gap-3">
          <button
            type="button"
            disabled={deleting}
            onClick={() => setDeleteTarget(null)}
            className="brutal-btn brutal-btn-outline px-4 py-2 text-xs font-bold cursor-pointer disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="button"
            disabled={deleting}
            onClick={handleConfirmDelete}
            className="brutal-btn brutal-btn-bordo px-4 py-2 text-xs font-bold cursor-pointer disabled:opacity-50"
          >
            {deleting ? 'Menghapus...' : 'Ya, Hapus'}
          </button>
        </div>
      </Modal>
    </div>
  );
};
