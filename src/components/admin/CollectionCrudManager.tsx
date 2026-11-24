import React, { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, Eye, EyeOff, Pencil, Plus, Save, Trash2 } from 'lucide-react';
import { usePortfolio } from '../../context/PortfolioContext';
import {
  deleteManagedItem,
  upsertManagedItem,
  type ManagedCollectionName,
} from '../../services/portfolioService';
import type { BaseContentMeta } from '../../types/portfolio';
import { Modal } from '../ui/Modal';
import { MediaUploader } from './MediaUploader';
import { extractGoogleDriveInfo } from '../../utils/googleDriveMedia';

interface FieldSpec {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'checkbox' | 'stringList' | 'imageList' | 'certFile';
  required?: boolean;
  placeholder?: string;
  options?: Array<{ value: string; label: string }>;
}

interface CollectionConfig {
  title: string;
  subtitle: string;
  uploadFolder?: 'certificates' | 'experiences' | 'organizations' | 'projects';
  titleKey: string;
  metaKey: string;
  fields: FieldSpec[];
  defaultValues: Record<string, unknown>;
}

const COLLECTION_CONFIGS: Record<ManagedCollectionName, CollectionConfig> = {
  experiences: {
    title: 'Pengalaman (Pembinaan, Mengajar, Kepanitiaan & Kerja)',
    subtitle: 'Kelola riwayat pengalaman beserta foto dokumentasi dan daftar tanggung jawab.',
    uploadFolder: 'experiences',
    titleKey: 'role',
    metaKey: 'institution',
    fields: [
      { key: 'role', label: 'Jabatan / Peran', type: 'text', required: true, placeholder: 'Contoh: Pembina Mahasiswa' },
      { key: 'institution', label: 'Nama Lembaga / Kegiatan', type: 'text', required: true },
      {
        key: 'category',
        label: 'Kategori',
        type: 'select',
        required: true,
        options: [
          { value: 'mentoring', label: 'Pembinaan' },
          { value: 'teaching', label: 'Mengajar' },
          { value: 'committee', label: 'Kepanitiaan' },
          { value: 'work', label: 'Pekerjaan' },
        ],
      },
      { key: 'period', label: 'Periode', type: 'text', required: true, placeholder: 'Contoh: 2024–2025' },
      { key: 'duration', label: 'Durasi', type: 'text', placeholder: 'Contoh: 1 tahun / 6 bulan' },
      { key: 'location', label: 'Lokasi', type: 'text', placeholder: 'Makassar, Sulawesi Selatan' },
      { key: 'description', label: 'Deskripsi', type: 'textarea' },
      { key: 'responsibilities', label: 'Daftar Tanggung Jawab (1 baris per poin)', type: 'stringList' },
      { key: 'imageUrls', label: 'Dokumentasi Foto', type: 'imageList' },
      { key: 'featured', label: 'Tampilkan di Sorotan Beranda (Home)', type: 'checkbox' },
    ],
    defaultValues: {
      role: '',
      institution: '',
      category: 'mentoring',
      period: '',
      duration: '',
      location: 'Makassar, Sulawesi Selatan',
      description: '',
      responsibilities: [],
      imageUrls: [],
      featured: false,
    },
  },
  organizations: {
    title: 'Pengalaman Organisasi',
    subtitle: 'Kelola jabatan organisasi kemahasiswaan, keilmuan, dan kemasyarakatan.',
    uploadFolder: 'organizations',
    titleKey: 'role',
    metaKey: 'organizationName',
    fields: [
      { key: 'role', label: 'Jabatan', type: 'text', required: true },
      { key: 'organizationName', label: 'Nama Organisasi', type: 'text', required: true },
      { key: 'category', label: 'Kategori', type: 'text', required: true, placeholder: 'Organisasi Keilmuan' },
      { key: 'period', label: 'Periode Jabatan', type: 'text', required: true },
      { key: 'description', label: 'Deskripsi', type: 'textarea' },
      { key: 'responsibilities', label: 'Tanggung Jawab / Program (1 baris per poin)', type: 'stringList' },
      { key: 'imageUrls', label: 'Foto Dokumentasi', type: 'imageList' },
    ],
    defaultValues: {
      role: '',
      organizationName: '',
      category: 'Organisasi Kemahasiswaan',
      period: '',
      description: '',
      responsibilities: [],
      imageUrls: [],
    },
  },
  education: {
    title: 'Riwayat Pendidikan',
    subtitle: 'Kelola pendidikan formal, jurusan, institusi, dan tahun kelulusan.',
    titleKey: 'institution',
    metaKey: 'fieldOfStudy',
    fields: [
      { key: 'institution', label: 'Nama Institusi / Universitas', type: 'text', required: true },
      { key: 'degree', label: 'Jenjang / Gelar', type: 'text', required: true, placeholder: 'S1 — Sarjana Hukum' },
      { key: 'fieldOfStudy', label: 'Program Studi / Bidang', type: 'text', required: true },
      { key: 'graduationYear', label: 'Tahun Kelulusan', type: 'text', required: true, placeholder: '2026' },
      { key: 'period', label: 'Periode Studi', type: 'text' },
      { key: 'location', label: 'Lokasi', type: 'text' },
      { key: 'category', label: 'Kategori', type: 'text', required: true },
      { key: 'description', label: 'Deskripsi Akademik', type: 'textarea' },
    ],
    defaultValues: {
      institution: '',
      degree: '',
      fieldOfStudy: '',
      graduationYear: '',
      period: '',
      location: 'Makassar, Sulawesi Selatan',
      category: 'Pendidikan Tinggi',
      description: '',
    },
  },
  certificates: {
    title: 'Galeri Sertifikat',
    subtitle: 'Unggah sertifikat asli (JPG, PNG, WebP, atau PDF) satu per satu beserta metadata lengkap.',
    uploadFolder: 'certificates',
    titleKey: 'title',
    metaKey: 'issuer',
    fields: [
      { key: 'title', label: 'Nama Pelatihan / Sertifikat', type: 'text', required: true },
      { key: 'issuer', label: 'Penyelenggara', type: 'text', required: true },
      { key: 'year', label: 'Tahun', type: 'text', required: true, placeholder: '2025' },
      {
        key: 'category',
        label: 'Kategori Penyelenggara',
        type: 'select',
        required: true,
        options: [
          { value: 'Dalam Negeri', label: 'Dalam Negeri' },
          { value: 'Internasional', label: 'Internasional / Luar Negeri' },
        ],
      },
      { key: 'field', label: 'Bidang', type: 'text', required: true, placeholder: 'AI / Fikih / Kepemimpinan / Editing' },
      { key: 'description', label: 'Deskripsi Sertifikat', type: 'textarea' },
      { key: 'fileUrl', label: 'Unggah File Sertifikat (Gambar atau PDF)', type: 'certFile' },
    ],
    defaultValues: {
      title: '',
      issuer: '',
      year: '',
      category: 'Dalam Negeri',
      field: '',
      description: '',
      fileUrl: '',
      fileType: 'image',
      fileName: '',
      thumbnailUrl: '',
    },
  },
  trainings: {
    title: 'Bidang & Riwayat Pelatihan',
    subtitle: 'Kelola cakupan pelatihan dalam negeri dan penyelenggara luar negeri.',
    titleKey: 'title',
    metaKey: 'organizer',
    fields: [
      { key: 'title', label: 'Judul Bidang / Program Pelatihan', type: 'text', required: true },
      {
        key: 'scope',
        label: 'Cakupan',
        type: 'select',
        required: true,
        options: [
          { value: 'domestic', label: 'Dalam Negeri' },
          { value: 'international', label: 'Internasional / Luar Negeri' },
        ],
      },
      { key: 'organizer', label: 'Penyelenggara', type: 'text' },
      { key: 'year', label: 'Tahun / Periode', type: 'text' },
      { key: 'category', label: 'Kategori', type: 'text', required: true },
      { key: 'topics', label: 'Topik Materi (1 baris per topik)', type: 'stringList' },
      { key: 'description', label: 'Deskripsi', type: 'textarea' },
    ],
    defaultValues: {
      title: '',
      scope: 'domestic',
      organizer: '',
      year: '',
      category: 'Pengembangan Kompetensi',
      topics: [],
      description: '',
    },
  },
  skills: {
    title: 'Keahlian, Perangkat & Bahasa',
    subtitle: 'Gunakan label tingkat kemampuan deskriptif buatan sendiri (bukan persentase otomatis).',
    titleKey: 'name',
    metaKey: 'proficiencyLabel',
    fields: [
      { key: 'name', label: 'Nama Keahlian / Perangkat / Bahasa', type: 'text', required: true },
      {
        key: 'category',
        label: 'Kategori',
        type: 'select',
        required: true,
        options: [
          { value: 'technical', label: 'Technical Skills' },
          { value: 'tool', label: 'Perangkat & AI Tools' },
          { value: 'soft', label: 'Soft Skills' },
          { value: 'academic', label: 'Academic Skills' },
          { value: 'language', label: 'Language Skills' },
        ],
      },
      {
        key: 'proficiencyLabel',
        label: 'Deskripsi Tingkat Kemampuan (Ditentukan Sendiri)',
        type: 'text',
        placeholder: 'Contoh: Menengah / Dasar / Aktif Digunakan',
      },
      { key: 'description', label: 'Penjelasan Singkat', type: 'textarea' },
    ],
    defaultValues: {
      name: '',
      category: 'technical',
      proficiencyLabel: '',
      description: '',
    },
  },
  interests: {
    title: 'Minat, Bakat & Arah Karier',
    subtitle: 'Kelola minat profesional, akademik, personal, bakat/kekuatan, dan bidang karier.',
    titleKey: 'title',
    metaKey: 'category',
    fields: [
      { key: 'title', label: 'Judul Minat / Bakat', type: 'text', required: true },
      {
        key: 'category',
        label: 'Kategori',
        type: 'select',
        required: true,
        options: [
          { value: 'professional_interest', label: 'Professional Interests' },
          { value: 'academic_interest', label: 'Academic Interests' },
          { value: 'personal_interest', label: 'Personal Interests' },
          { value: 'talent_strength', label: 'Talents & Strengths' },
          { value: 'career_interest', label: 'Career Interests' },
        ],
      },
      { key: 'description', label: 'Deskripsi', type: 'textarea' },
    ],
    defaultValues: {
      title: '',
      category: 'professional_interest',
      description: '',
    },
  },
  projects: {
    title: 'Proyek & Karya Digital',
    subtitle: 'Kelola Dars with Osama, website, artikel, materi pembelajaran, serta desain & media.',
    uploadFolder: 'projects',
    titleKey: 'title',
    metaKey: 'category',
    fields: [
      { key: 'title', label: 'Judul Proyek / Karya', type: 'text', required: true },
      {
        key: 'category',
        label: 'Kategori',
        type: 'select',
        required: true,
        options: [
          { value: 'dars_with_osama', label: 'Dars with Osama' },
          { value: 'website_digital', label: 'Website & Digital' },
          { value: 'article_writing', label: 'Artikel & Tulisan' },
          { value: 'learning_material', label: 'Materi Pembelajaran' },
          { value: 'design_media', label: 'Desain & Media' },
          { value: 'other', label: 'Lainnya' },
        ],
      },
      { key: 'period', label: 'Periode', type: 'text', placeholder: '2025 / Aktif Berjalan' },
      { key: 'description', label: 'Deskripsi Proyek', type: 'textarea', required: true },
      { key: 'documentation', label: 'Catatan Dokumentasi', type: 'textarea' },
      { key: 'liveUrl', label: 'Tautan Website / Live URL', type: 'text', placeholder: 'https://...' },
      { key: 'repoUrl', label: 'Tautan Repositori / Dokumen', type: 'text', placeholder: 'https://...' },
      { key: 'imageUrls', label: 'Gambar Pratinjau & Dokumentasi', type: 'imageList' },
      { key: 'featured', label: 'Tampilkan sebagai Proyek Unggulan di Home', type: 'checkbox' },
    ],
    defaultValues: {
      title: '',
      category: 'website_digital',
      period: '',
      description: '',
      documentation: '',
      liveUrl: '',
      repoUrl: '',
      imageUrls: [],
      featured: false,
    },
  },
  publications: {
    title: 'Publikasi, Karya Tulis & Kajian Keilmuan',
    subtitle: 'Kelola karya tulis, artikel, minat penelitian, dan bidang kajian akademik.',
    titleKey: 'title',
    metaKey: 'category',
    fields: [
      { key: 'title', label: 'Judul Karya / Kajian', type: 'text', required: true },
      {
        key: 'category',
        label: 'Kategori',
        type: 'select',
        required: true,
        options: [
          { value: 'publication', label: 'Publikasi Ilmiah' },
          { value: 'article', label: 'Artikel & Tulisan' },
          { value: 'research_interest', label: 'Minat Penelitian' },
          { value: 'study_field', label: 'Bidang Keilmuan & Kajian' },
        ],
      },
      { key: 'venue', label: 'Penerbit / Lembaga / Platform', type: 'text' },
      { key: 'year', label: 'Tahun', type: 'text' },
      { key: 'summary', label: 'Ringkasan', type: 'textarea' },
      { key: 'url', label: 'Tautan Baca / Referensi', type: 'text', placeholder: 'https://...' },
    ],
    defaultValues: {
      title: '',
      category: 'article',
      venue: '',
      year: '',
      summary: '',
      url: '',
    },
  },
};

interface CollectionCrudManagerProps {
  collectionName: ManagedCollectionName;
  onDirtyChange: (dirty: boolean) => void;
}

export const CollectionCrudManager: React.FC<CollectionCrudManagerProps> = ({
  collectionName,
  onDirtyChange,
}) => {
  const { adminData, showToast } = usePortfolio();
  const config = COLLECTION_CONFIGS[collectionName];

  const items = useMemo(
    () => (adminData[collectionName] as unknown as Array<BaseContentMeta & Record<string, unknown>>),
    [adminData, collectionName]
  );

  const [editingId, setEditingId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [formState, setFormState] = useState<Record<string, unknown>>({});
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);

  const openCreateModal = () => {
    setEditingId(null);
    setFormState({
      ...config.defaultValues,
      status: 'published',
      isVisible: true,
      displayOrder: items.length + 1,
    });
    setModalOpen(true);
    onDirtyChange(true);
  };

  const openEditModal = (item: BaseContentMeta & Record<string, unknown>) => {
    setEditingId(item.id);
    setFormState({ ...config.defaultValues, ...item });
    setModalOpen(true);
    onDirtyChange(false);
  };

  const closeModal = () => {
    setModalOpen(false);
    onDirtyChange(false);
  };

  const setField = (key: string, value: unknown) => {
    setFormState((prev) => ({ ...prev, [key]: value }));
    onDirtyChange(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    for (const f of config.fields) {
      if (f.required && !String(formState[f.key] ?? '').trim()) {
        showToast('error', `Kolom "${f.label}" wajib diisi.`);
        return;
      }
    }
    setSaving(true);
    try {
      const label = String(formState[config.titleKey] || collectionName);
      await upsertManagedItem(collectionName, editingId, formState, label);
      showToast('success', editingId ? `"${label}" berhasil diperbarui.` : `"${label}" berhasil ditambahkan.`);
      closeModal();
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Gagal menyimpan data.');
    } finally {
      setSaving(false);
    }
  };

  const handleQuickToggle = async (
    item: BaseContentMeta & Record<string, unknown>,
    field: 'status' | 'isVisible'
  ) => {
    const updated = {
      ...item,
      [field]: field === 'status' ? (item.status === 'published' ? 'draft' : 'published') : !item.isVisible,
    };
    try {
      await upsertManagedItem(collectionName, item.id, updated, String(item[config.titleKey] || item.id));
      showToast('success', 'Status tampilan diperbarui.');
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Gagal memperbarui status.');
    }
  };

  const handleReorder = async (index: number, direction: -1 | 1) => {
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= items.length) return;
    const current = items[index];
    const swapWith = items[targetIdx];
    try {
      await Promise.all([
        upsertManagedItem(
          collectionName,
          current.id,
          { ...current, displayOrder: targetIdx + 1 },
          String(current[config.titleKey] || current.id)
        ),
        upsertManagedItem(
          collectionName,
          swapWith.id,
          { ...swapWith, displayOrder: index + 1 },
          String(swapWith[config.titleKey] || swapWith.id)
        ),
      ]);
      showToast('success', 'Urutan tampilan diperbarui.');
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Gagal mengubah urutan.');
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteManagedItem(collectionName, deleteTarget.id, deleteTarget.title);
      showToast('success', `"${deleteTarget.title}" berhasil dihapus.`);
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Gagal menghapus data.');
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b-2 border-brutal">
        <div>
          <span className="brutal-badge">Koleksi Firestore: /{collectionName}</span>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold mt-2">{config.title}</h1>
          <p className="text-sm text-muted mt-1">{config.subtitle}</p>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className="brutal-btn brutal-btn-primary px-4 py-2.5 text-xs font-bold inline-flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Item Baru</span>
        </button>
      </div>

      {/* Items Table/List */}
      {items.length === 0 ? (
        <div className="brutal-card surface-card p-8 text-center space-y-3">
          <p className="font-display text-lg font-bold">Belum ada data pada koleksi ini.</p>
          <button
            type="button"
            onClick={openCreateModal}
            className="brutal-btn brutal-btn-primary px-4 py-2 text-xs font-bold cursor-pointer"
          >
            Tambah Data Pertama
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item, idx) => {
            const displayTitle = String(item[config.titleKey] || '(Tanpa Judul)');
            const displayMeta = String(item[config.metaKey] || '');
            return (
              <div
                key={item.id}
                className="brutal-card surface-card p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 text-xs font-mono-num">
                    <span className="font-bold text-muted">#{String(item.displayOrder ?? idx + 1).padStart(2, '0')}</span>
                    <span
                      className={item.status === 'published' ? 'brutal-badge' : 'brutal-badge-inverse'}
                    >
                      {item.status === 'published' ? 'Published' : 'Draft'}
                    </span>
                    <span className="text-muted font-semibold">
                      &middot; {item.isVisible ? 'Tampil' : 'Disembunyikan'}
                    </span>
                  </div>
                  <h2 className="font-display text-lg font-extrabold mt-1.5 truncate">{displayTitle}</h2>
                  {displayMeta && (
                    <p className="text-sm text-muted truncate">{displayMeta}</p>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleReorder(idx, -1)}
                    disabled={idx === 0}
                    aria-label={`Naikkan urutan ${displayTitle}`}
                    className="brutal-btn brutal-btn-outline p-2 cursor-pointer disabled:opacity-40"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleReorder(idx, 1)}
                    disabled={idx === items.length - 1}
                    aria-label={`Turunkan urutan ${displayTitle}`}
                    className="brutal-btn brutal-btn-outline p-2 cursor-pointer disabled:opacity-40"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickToggle(item, 'status')}
                    className="brutal-btn brutal-btn-outline px-3 py-1.5 text-xs font-bold cursor-pointer"
                  >
                    {item.status === 'published' ? 'Jadikan Draft' : 'Publikasikan'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickToggle(item, 'isVisible')}
                    aria-label={item.isVisible ? `Sembunyikan ${displayTitle}` : `Tampilkan ${displayTitle}`}
                    className="brutal-btn brutal-btn-outline p-2 cursor-pointer"
                  >
                    {item.isVisible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => openEditModal(item)}
                    aria-label={`Edit ${displayTitle}`}
                    className="brutal-btn brutal-btn-secondary px-3 py-1.5 text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget({ id: item.id, title: displayTitle })}
                    aria-label={`Hapus ${displayTitle}`}
                    className="brutal-btn brutal-btn-bordo p-2 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editingId ? `Edit Item — ${config.title}` : `Tambah Baru — ${config.title}`}
        maxWidthClass="max-w-3xl"
      >
        <form onSubmit={handleSave} className="space-y-4">
          {config.fields.map((field) => {
            if (field.type === 'text') {
              return (
                <div key={field.key}>
                  <label className="block text-xs font-bold uppercase mb-1">
                    {field.label} {field.required ? '*' : ''}
                  </label>
                  <input
                    type="text"
                    required={field.required}
                    placeholder={field.placeholder}
                    value={String(formState[field.key] ?? '')}
                    onChange={(e) => setField(field.key, e.target.value)}
                    className="w-full brutal-input px-3 py-2 text-sm"
                  />
                </div>
              );
            }

            if (field.type === 'textarea') {
              return (
                <div key={field.key}>
                  <label className="block text-xs font-bold uppercase mb-1">
                    {field.label} {field.required ? '*' : ''}
                  </label>
                  <textarea
                    rows={4}
                    required={field.required}
                    value={String(formState[field.key] ?? '')}
                    onChange={(e) => setField(field.key, e.target.value)}
                    className="w-full brutal-input px-3 py-2 text-sm"
                  />
                </div>
              );
            }

            if (field.type === 'select') {
              return (
                <div key={field.key}>
                  <label className="block text-xs font-bold uppercase mb-1">{field.label}</label>
                  <select
                    value={String(formState[field.key] ?? '')}
                    onChange={(e) => setField(field.key, e.target.value)}
                    className="w-full brutal-input px-3 py-2 text-sm font-medium"
                  >
                    {field.options?.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              );
            }

            if (field.type === 'checkbox') {
              return (
                <label key={field.key} className="flex items-center gap-2 text-sm font-semibold cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={Boolean(formState[field.key])}
                    onChange={(e) => setField(field.key, e.target.checked)}
                    className="w-4 h-4 accent-[#013A42]"
                  />
                  <span>{field.label}</span>
                </label>
              );
            }

            if (field.type === 'stringList') {
              const arr = Array.isArray(formState[field.key]) ? (formState[field.key] as string[]) : [];
              return (
                <div key={field.key}>
                  <label className="block text-xs font-bold uppercase mb-1">{field.label}</label>
                  <textarea
                    rows={4}
                    value={arr.join('\n')}
                    onChange={(e) => setField(field.key, e.target.value.split('\n'))}
                    placeholder="Satu item per baris..."
                    className="w-full brutal-input px-3 py-2 text-sm"
                  />
                </div>
              );
            }

            if (field.type === 'imageList') {
              const urls = Array.isArray(formState[field.key]) ? (formState[field.key] as string[]) : [];
              return (
                <MediaUploader
                  key={field.key}
                  folder={config.uploadFolder || 'media'}
                  acceptMode="image"
                  multiple
                  label={field.label}
                  currentUrls={urls}
                  onUploaded={(res) => setField(field.key, [...urls, res.fileUrl])}
                  onRemoveUrl={(url) => setField(field.key, urls.filter((u) => u !== url))}
                />
              );
            }

            if (field.type === 'certFile') {
              const currentUrl = String(formState.fileUrl ?? '');
              return (
                <div key={field.key} className="space-y-3">
                  <MediaUploader
                    folder="certificates"
                    acceptMode="both"
                    label={field.label}
                    helperText="JPG, PNG, WebP, atau PDF"
                    currentUrls={currentUrl ? [currentUrl] : []}
                    onUploaded={(res) => {
                      setField('fileUrl', res.fileUrl);
                      setField('fileName', res.fileName);
                      setField('fileType', res.fileType);
                      if (res.fileType === 'image') {
                        setField('thumbnailUrl', res.fileUrl);
                      }
                    }}
                    onRemoveUrl={() => {
                      setField('fileUrl', '');
                      setField('fileName', '');
                      setField('thumbnailUrl', '');
                    }}
                  />
                  <div>
                    <label className="block text-xs font-bold uppercase mb-1">Atau URL File Sertifikat</label>
                    <input
                      type="text"
                      value={currentUrl}
                      onChange={(e) => setField('fileUrl', e.target.value)}
                      placeholder="https://... atau tautan Google Drive"
                      className="w-full brutal-input px-3 py-2 text-xs"
                    />
                    {(() => {
                      const driveInfo = extractGoogleDriveInfo(currentUrl);
                      if (!driveInfo) return null;
                      return (
                        <p className="mt-1.5 text-[11px] font-mono-num font-bold text-[#0F3D3A]">
                          Tautan Google Drive terdeteksi (ID: {driveInfo.fileId.slice(0, 10)}&hellip;) &mdash; ditampilkan otomatis.
                        </p>
                      );
                    })()}
                  </div>
                </div>
              );
            }
            return null;
          })}

          {/* Common Content Display Controls */}
          <div className="pt-4 mt-4 border-t-2 border-subtle grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase mb-1">Status Konten</label>
              <select
                value={String(formState.status || 'published')}
                onChange={(e) => setField('status', e.target.value)}
                className="w-full brutal-input px-3 py-2 text-sm font-bold"
              >
                <option value="published">Published</option>
                <option value="draft">Draft</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase mb-1">Urutan Tampilan</label>
              <input
                type="number"
                min={0}
                max={10000}
                value={Number(formState.displayOrder ?? 1)}
                onChange={(e) => setField('displayOrder', Number(e.target.value))}
                className="w-full brutal-input px-3 py-2 text-sm font-mono-num"
              />
            </div>
            <div className="flex items-end pb-2">
              <label className="flex items-center gap-2 text-sm font-bold cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(formState.isVisible)}
                  onChange={(e) => setField('isVisible', e.target.checked)}
                  className="w-4 h-4 accent-[#013A42]"
                />
                <span>Tampilkan ke Publik</span>
              </label>
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={closeModal}
              className="brutal-btn brutal-btn-outline px-4 py-2.5 text-xs font-bold cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="brutal-btn brutal-btn-primary px-5 py-2.5 text-xs font-bold inline-flex items-center gap-2 cursor-pointer disabled:opacity-60"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Menyimpan...' : 'Simpan ke Firestore'}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Konfirmasi Hapus Konten"
        maxWidthClass="max-w-md"
      >
        <p className="text-sm mb-6">
          Anda yakin ingin menghapus <strong>{deleteTarget?.title}</strong> secara permanen dari Firestore?
        </p>
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => setDeleteTarget(null)}
            className="brutal-btn brutal-btn-outline px-4 py-2 text-xs font-bold cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={confirmDelete}
            className="brutal-btn brutal-btn-bordo px-4 py-2 text-xs font-bold cursor-pointer"
          >
            Ya, Hapus
          </button>
        </div>
      </Modal>
    </div>
  );
};
