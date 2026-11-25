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
import { ExperiencePhotoManager } from './ExperiencePhotoManager';
import { extractGoogleDriveInfo } from '../../utils/googleDriveMedia';
import {
  addExperiencePhotos,
  MAX_EXPERIENCE_PHOTOS,
  removeExperiencePhotoAt,
  reorderExperiencePhoto,
  selectPrimaryExperiencePhoto,
} from '../../utils/experienceGallery';

import type { DriveUploadCategory } from '../../services/googleDriveUploadService';
import { normalizeProjectCategory } from '../../utils/projectsCatalog';
import { normalizeCertificateCategoryLabel } from '../../utils/trainingClassification';
import { getAosStaggerDelay } from '../../utils/aos';

interface FieldSpec {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'checkbox' | 'stringList' | 'imageList' | 'experienceGallery' | 'imageSingle' | 'certFile';
  required?: boolean;
  placeholder?: string;
  options?: Array<{ value: string; label: string }>;
}

interface CollectionConfig {
  title: string;
  subtitle: string;
  uploadFolder?: DriveUploadCategory;
  titleKey: string;
  metaKey: string;
  fields: FieldSpec[];
  defaultValues: Record<string, unknown>;
}

export type CrudCollectionName = Exclude<ManagedCollectionName, 'publications'>;

const COLLECTION_CONFIGS: Record<CrudCollectionName, CollectionConfig> = {
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
      { key: 'imageUrls', label: 'Galeri Foto Dokumentasi & Foto Utama', type: 'experienceGallery' },
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
      primaryImageUrl: '',
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
      { key: 'imageUrls', label: 'Galeri Foto Dokumentasi & Foto Utama', type: 'experienceGallery' },
    ],
    defaultValues: {
      role: '',
      organizationName: '',
      category: 'Organisasi Kemahasiswaan',
      period: '',
      description: '',
      responsibilities: [],
      imageUrls: [],
      primaryImageUrl: '',
    },
  },
  education: {
    title: 'Riwayat Pendidikan',
    subtitle: 'Kelola pendidikan formal, jurusan, institusi, tahun kelulusan, dan foto dokumentasi pendidikan.',
    uploadFolder: 'education',
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
      { key: 'imageUrls', label: 'Foto Dokumentasi Pendidikan', type: 'imageList' },
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
      imageUrls: [],
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
          { value: 'Dalam Negeri', label: 'Dalam Negeri (Nasional)' },
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
    uploadFolder: 'skills',
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
      { key: 'imageUrl', label: 'Gambar / Visual Pendukung (Opsional)', type: 'imageSingle' },
    ],
    defaultValues: {
      name: '',
      category: 'technical',
      proficiencyLabel: '',
      description: '',
      imageUrl: '',
    },
  },
  interests: {
    title: 'Minat, Bakat & Arah Karier',
    subtitle: 'Kelola minat profesional, akademik, personal, bakat/kekuatan, dan bidang karier.',
    uploadFolder: 'interests',
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
          { value: 'talent_strength', label: 'Bakat & Kemampuan Personal (05)' },
          { value: 'career_interest', label: 'Bidang Pekerjaan yang Diminati (06)' },
        ],
      },
      { key: 'description', label: 'Deskripsi', type: 'textarea' },
      { key: 'imageUrl', label: 'Gambar / Ilustrasi Pendukung (Opsional)', type: 'imageSingle' },
    ],
    defaultValues: {
      title: '',
      category: 'professional_interest',
      description: '',
      imageUrl: '',
    },
  },
  projects: {
    title: 'Proyek & Karya Digital',
    subtitle: 'Kelola proyek Website & Digital (termasuk Dars with Osama) serta Artikel & Tulisan tambahan. Artikel Dars with Osama disinkronkan otomatis.',
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
          { value: 'website_digital', label: 'Website & Digital' },
          { value: 'article_writing', label: 'Artikel & Tulisan' },
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
};

interface CollectionCrudManagerProps {
  collectionName: CrudCollectionName;
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
    const merged: Record<string, unknown> = { ...config.defaultValues, ...item };
    if (collectionName === 'projects' && typeof merged.category === 'string') {
      merged.category = normalizeProjectCategory(merged.category);
    }
    if (collectionName === 'certificates' && typeof merged.category === 'string') {
      merged.category = normalizeCertificateCategoryLabel(merged.category);
    }
    setFormState(merged);
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
    <div className="space-y-5">
      <div data-aos="fade-up" className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pb-3.5 border-b-2 border-brutal">
        <div>
          <span className="brutal-badge">Koleksi Firestore: /{collectionName}</span>
          <h1 className="font-display text-xl sm:text-2xl font-extrabold mt-1.5">{config.title}</h1>
          <p className="text-xs sm:text-sm text-muted mt-0.5">{config.subtitle}</p>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className="brutal-btn brutal-btn-primary px-3.5 py-2 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Tambah Item Baru</span>
        </button>
      </div>

      {/* Items Table/List */}
      {items.length === 0 ? (
        <div data-aos="fade-up" className="brutal-card surface-card p-6 text-center space-y-3">
          <p className="font-display text-base font-bold">Belum ada data pada koleksi ini.</p>
          <button
            type="button"
            onClick={openCreateModal}
            className="brutal-btn-frame-navy px-4 py-2 text-xs font-bold cursor-pointer"
          >
            Tambah Data Pertama
          </button>
        </div>
      ) : (
        <div className="space-y-2.5">
          {items.map((item, idx) => {
            const displayTitle = String(item[config.titleKey] || '(Tanpa Judul)');
            const displayMeta = String(item[config.metaKey] || '');
            return (
              <div
                key={item.id}
                data-aos="fade-up"
                data-aos-delay={getAosStaggerDelay(idx, 100, 4)}
                className="brutal-card surface-card p-3.5 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono-num">
                    <span className="font-bold text-[#D9B44A]">#{String(item.displayOrder ?? idx + 1).padStart(2, '0')}</span>
                    <span
                      className={item.status === 'published' ? 'brutal-badge' : 'brutal-badge-bordo'}
                    >
                      {item.status === 'published' ? 'Published' : 'Draft'}
                    </span>
                    <span className="text-muted font-semibold">
                      &middot; {item.isVisible ? 'Tampil' : 'Disembunyikan'}
                    </span>
                    {(collectionName === 'experiences' || collectionName === 'organizations') && (
                      <span className="text-muted font-semibold">
                        &middot; {Array.isArray(item.imageUrls) ? item.imageUrls.length : 0} foto
                      </span>
                    )}
                  </div>
                  <h2 className="font-display text-[15px] sm:text-base font-extrabold mt-1 truncate">{displayTitle}</h2>
                  {displayMeta && (
                    <p className="text-xs sm:text-[13px] text-muted truncate">{displayMeta}</p>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleReorder(idx, -1)}
                    disabled={idx === 0}
                    aria-label={`Naikkan urutan ${displayTitle}`}
                    className="brutal-btn-on-dark-outline p-1.5 cursor-pointer disabled:opacity-40"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleReorder(idx, 1)}
                    disabled={idx === items.length - 1}
                    aria-label={`Turunkan urutan ${displayTitle}`}
                    className="brutal-btn-on-dark-outline p-1.5 cursor-pointer disabled:opacity-40"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickToggle(item, 'status')}
                    className="brutal-btn-on-dark-outline px-2.5 py-1.5 text-xs font-bold cursor-pointer"
                  >
                    {item.status === 'published' ? 'Jadikan Draft' : 'Publikasikan'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickToggle(item, 'isVisible')}
                    aria-label={item.isVisible ? `Sembunyikan ${displayTitle}` : `Tampilkan ${displayTitle}`}
                    className="brutal-btn-on-dark-outline p-1.5 cursor-pointer"
                  >
                    {item.isVisible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => openEditModal(item)}
                    aria-label={`Edit ${displayTitle}`}
                    className="brutal-btn-on-dark px-2.5 py-1.5 text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget({ id: item.id, title: displayTitle })}
                    aria-label={`Hapus ${displayTitle}`}
                    className="brutal-btn-frame-bordo p-1.5 cursor-pointer"
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
        maxWidthClass="max-w-2xl"
      >
        <form onSubmit={handleSave} className="space-y-3.5">
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
                    rows={3}
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
                    className="w-4 h-4 accent-[#D9B44A]"
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
                    rows={3}
                    value={arr.join('\n')}
                    onChange={(e) => setField(field.key, e.target.value.split('\n'))}
                    placeholder="Satu item per baris..."
                    className="w-full brutal-input px-3 py-2 text-sm"
                  />
                </div>
              );
            }

            if (field.type === 'experienceGallery') {
              const urls = Array.isArray(formState.imageUrls) ? (formState.imageUrls as string[]) : [];
              const primaryUrl = String(formState.primaryImageUrl ?? '');
              const itemVisibility =
                formState.status === 'published' && Boolean(formState.isVisible) ? 'public' : 'private';
              return (
                <ExperiencePhotoManager
                  key={field.key}
                  folder={config.uploadFolder || 'experiences'}
                  label={field.label}
                  imageUrls={urls}
                  primaryImageUrl={primaryUrl}
                  defaultVisibility={itemVisibility}
                  onAddPhoto={(res) => {
                    setFormState((prev) => {
                      const prevUrls = Array.isArray(prev.imageUrls) ? (prev.imageUrls as string[]) : [];
                      const prevPrimary = String(prev.primaryImageUrl ?? '');
                      const next = addExperiencePhotos(
                        prevUrls,
                        [res.fileUrl],
                        prevPrimary,
                        MAX_EXPERIENCE_PHOTOS
                      );
                      return {
                        ...prev,
                        imageUrls: next.imageUrls,
                        primaryImageUrl: next.primaryImageUrl,
                      };
                    });
                    onDirtyChange(true);
                  }}
                  onRemovePhoto={(idx) => {
                    setFormState((prev) => {
                      const prevUrls = Array.isArray(prev.imageUrls) ? (prev.imageUrls as string[]) : [];
                      const prevPrimary = String(prev.primaryImageUrl ?? '');
                      const next = removeExperiencePhotoAt(prevUrls, idx, prevPrimary);
                      return {
                        ...prev,
                        imageUrls: next.imageUrls,
                        primaryImageUrl: next.primaryImageUrl,
                      };
                    });
                    onDirtyChange(true);
                  }}
                  onReorderPhoto={(fromIdx, toIdx) => {
                    setFormState((prev) => {
                      const prevUrls = Array.isArray(prev.imageUrls) ? (prev.imageUrls as string[]) : [];
                      const prevPrimary = String(prev.primaryImageUrl ?? '');
                      const next = reorderExperiencePhoto(prevUrls, fromIdx, toIdx, prevPrimary);
                      return {
                        ...prev,
                        imageUrls: next.imageUrls,
                        primaryImageUrl: next.primaryImageUrl,
                      };
                    });
                    onDirtyChange(true);
                  }}
                  onSelectPrimary={(url) => {
                    setFormState((prev) => {
                      const prevUrls = Array.isArray(prev.imageUrls) ? (prev.imageUrls as string[]) : [];
                      const next = selectPrimaryExperiencePhoto(prevUrls, url);
                      return {
                        ...prev,
                        imageUrls: next.imageUrls,
                        primaryImageUrl: next.primaryImageUrl,
                      };
                    });
                    onDirtyChange(true);
                  }}
                />
              );
            }

            if (field.type === 'imageList') {
              const urls = Array.isArray(formState[field.key]) ? (formState[field.key] as string[]) : [];
              const itemVisibility =
                formState.status === 'published' && Boolean(formState.isVisible) ? 'public' : 'private';
              return (
                <MediaUploader
                  key={field.key}
                  folder={config.uploadFolder || 'media'}
                  acceptMode="image"
                  multiple
                  defaultVisibility={itemVisibility}
                  label={field.label}
                  currentUrls={urls}
                  onUploaded={(res) => {
                    setFormState((prev) => {
                      const prevUrls = Array.isArray(prev[field.key]) ? (prev[field.key] as string[]) : [];
                      return {
                        ...prev,
                        [field.key]: prevUrls.includes(res.fileUrl) ? prevUrls : [...prevUrls, res.fileUrl],
                      };
                    });
                    onDirtyChange(true);
                  }}
                  onRemoveUrl={(url) => {
                    setFormState((prev) => {
                      const prevUrls = Array.isArray(prev[field.key]) ? (prev[field.key] as string[]) : [];
                      return {
                        ...prev,
                        [field.key]: prevUrls.filter((u) => u !== url),
                      };
                    });
                    onDirtyChange(true);
                  }}
                />
              );
            }

            if (field.type === 'imageSingle') {
              const currentImg = String(formState[field.key] ?? '');
              const itemVisibility =
                formState.status === 'published' && Boolean(formState.isVisible) ? 'public' : 'private';
              return (
                <MediaUploader
                  key={field.key}
                  folder={config.uploadFolder || 'media'}
                  acceptMode="image"
                  defaultVisibility={itemVisibility}
                  label={field.label}
                  currentUrls={currentImg ? [currentImg] : []}
                  onUploaded={(res) => setField(field.key, res.fileUrl)}
                  onRemoveUrl={() => setField(field.key, '')}
                />
              );
            }

            if (field.type === 'certFile') {
              const currentUrl = String(formState.fileUrl ?? '');
              const itemVisibility =
                formState.status === 'published' && Boolean(formState.isVisible) ? 'public' : 'private';
              return (
                <div key={field.key} className="space-y-3">
                  <MediaUploader
                    folder="certificates"
                    acceptMode="both"
                    defaultVisibility={itemVisibility}
                    label={field.label}
                    helperText="JPG, PNG, WebP, atau PDF — simpan ke Google Drive (Sertifikat) atau tempel tautan Drive"
                    currentUrls={currentUrl ? [currentUrl] : []}
                    onUploaded={(res) => {
                      setField('fileUrl', res.fileUrl);
                      setField('fileName', res.fileName);
                      setField('fileType', res.fileType);
                      if (res.fileType === 'image') {
                        setField('thumbnailUrl', res.fileUrl);
                      } else {
                        setField('thumbnailUrl', '');
                      }
                    }}
                    onRemoveUrl={() => {
                      setField('fileUrl', '');
                      setField('fileName', '');
                      setField('thumbnailUrl', '');
                    }}
                  />
                  <div>
                    <label className="block text-xs font-bold uppercase mb-1">URL File Sertifikat Tersimpan</label>
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
                        <p className="mt-1.5 text-[11px] font-mono-num font-bold text-[#D9B44A]">
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
          <div className="pt-3.5 mt-3.5 border-t-2 border-subtle grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label className="block text-xs font-bold uppercase mb-1">Status Konten</label>
              <select
                value={String(formState.status || 'published')}
                onChange={(e) => setField('status', e.target.value)}
                className="w-full brutal-input px-3 py-1.5 text-sm font-bold"
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
                className="w-full brutal-input px-3 py-1.5 text-sm font-mono-num"
              />
            </div>
            <div className="flex items-end pb-1.5">
              <label className="flex items-center gap-2 text-sm font-bold cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(formState.isVisible)}
                  onChange={(e) => setField('isVisible', e.target.checked)}
                  className="w-4 h-4 accent-[#D9B44A]"
                />
                <span>Tampilkan ke Publik</span>
              </label>
            </div>
          </div>

          <div className="pt-3 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={closeModal}
              className="brutal-btn-on-dark-outline px-4 py-2 text-xs font-bold cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="brutal-btn-frame-navy px-4 py-2 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
            >
              <Save className="w-3.5 h-3.5" />
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
            className="brutal-btn-on-dark-outline px-4 py-2 text-xs font-bold cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={confirmDelete}
            className="brutal-btn-frame-bordo px-4 py-2 text-xs font-bold cursor-pointer"
          >
            Ya, Hapus
          </button>
        </div>
      </Modal>
    </div>
  );
};
