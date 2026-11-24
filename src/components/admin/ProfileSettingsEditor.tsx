import React, { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import { usePortfolio } from '../../context/PortfolioContext';
import {
  saveContactInfo,
  saveProfile,
  saveSiteSettings,
} from '../../services/portfolioService';
import type { ContactInfoData, ProfileData, SiteSettingsData } from '../../types/portfolio';
import { MediaUploader } from './MediaUploader';
import { extractGoogleDriveInfo } from '../../utils/googleDriveMedia';

interface DirtyProps {
  onDirtyChange: (dirty: boolean) => void;
}

export const ProfileEditor: React.FC<DirtyProps> = ({ onDirtyChange }) => {
  const { adminData, showToast } = usePortfolio();
  const [form, setForm] = useState<Omit<ProfileData, 'id' | 'createdAt' | 'updatedAt'>>({
    fullName: adminData.profile.fullName,
    headline: adminData.profile.headline,
    shortBio: adminData.profile.shortBio,
    biography: adminData.profile.biography,
    domicile: adminData.profile.domicile,
    vision: adminData.profile.vision,
    mission: adminData.profile.mission,
    careerFocus: adminData.profile.careerFocus,
    photoUrl: adminData.profile.photoUrl,
    cvUrl: adminData.profile.cvUrl,
    cvFileName: adminData.profile.cvFileName,
    status: adminData.profile.status,
    isVisible: adminData.profile.isVisible,
  });
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    setForm({
      fullName: adminData.profile.fullName,
      headline: adminData.profile.headline,
      shortBio: adminData.profile.shortBio,
      biography: adminData.profile.biography,
      domicile: adminData.profile.domicile,
      vision: adminData.profile.vision,
      mission: adminData.profile.mission,
      careerFocus: adminData.profile.careerFocus,
      photoUrl: adminData.profile.photoUrl,
      cvUrl: adminData.profile.cvUrl,
      cvFileName: adminData.profile.cvFileName,
      status: adminData.profile.status,
      isVisible: adminData.profile.isVisible,
    });
    setDirty(false);
    onDirtyChange(false);
  }, [adminData.profile, onDirtyChange]);

  const updateField = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
    onDirtyChange(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName.trim() || !form.headline.trim() || !form.shortBio.trim()) {
      showToast('error', 'Nama lengkap, headline, dan deskripsi singkat wajib diisi.');
      return;
    }
    setSaving(true);
    try {
      await saveProfile(form);
      setDirty(false);
      onDirtyChange(false);
      showToast('success', 'Profil, biografi, dan berkas CV berhasil disimpan ke Firestore.');
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Gagal menyimpan profil.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4 pb-4 border-b-2 border-brutal">
        <div>
          <span className="brutal-badge">Identitas &amp; CV</span>
          <h1 className="font-display text-3xl font-extrabold mt-2">Profil, Biografi &amp; CV</h1>
        </div>
        <div className="flex items-center gap-3">
          {dirty && (
            <span className="brutal-badge">Ada perubahan belum disimpan</span>
          )}
          <button
            type="submit"
            disabled={saving}
            className="brutal-btn brutal-btn-primary px-5 py-2.5 text-xs font-bold inline-flex items-center gap-2 cursor-pointer disabled:opacity-60"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Menyimpan...' : 'Simpan Profil'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-5 brutal-card surface-card p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="prof-name" className="block text-xs font-bold uppercase mb-1.5">Nama Lengkap *</label>
              <input
                id="prof-name"
                type="text"
                value={form.fullName}
                onChange={(e) => updateField('fullName', e.target.value)}
                className="w-full brutal-input px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label htmlFor="prof-domicile" className="block text-xs font-bold uppercase mb-1.5">Domisili *</label>
              <input
                id="prof-domicile"
                type="text"
                value={form.domicile}
                onChange={(e) => updateField('domicile', e.target.value)}
                className="w-full brutal-input px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div>
            <label htmlFor="prof-headline" className="block text-xs font-bold uppercase mb-1.5">Headline Profesional *</label>
            <input
              id="prof-headline"
              type="text"
              value={form.headline}
              onChange={(e) => updateField('headline', e.target.value)}
              className="w-full brutal-input px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label htmlFor="prof-shortbio" className="block text-xs font-bold uppercase mb-1.5">Deskripsi Singkat (Hero) *</label>
            <textarea
              id="prof-shortbio"
              rows={3}
              value={form.shortBio}
              onChange={(e) => updateField('shortBio', e.target.value)}
              className="w-full brutal-input px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label htmlFor="prof-bio" className="block text-xs font-bold uppercase mb-1.5">Biografi Lengkap (About Me)</label>
            <textarea
              id="prof-bio"
              rows={6}
              value={form.biography}
              onChange={(e) => updateField('biography', e.target.value)}
              className="w-full brutal-input px-3 py-2 text-sm"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="prof-vision" className="block text-xs font-bold uppercase mb-1.5">Visi</label>
              <textarea
                id="prof-vision"
                rows={4}
                value={form.vision}
                onChange={(e) => updateField('vision', e.target.value)}
                className="w-full brutal-input px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label htmlFor="prof-mission" className="block text-xs font-bold uppercase mb-1.5">Misi</label>
              <textarea
                id="prof-mission"
                rows={4}
                value={form.mission}
                onChange={(e) => updateField('mission', e.target.value)}
                className="w-full brutal-input px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div>
            <label htmlFor="prof-career" className="block text-xs font-bold uppercase mb-1.5">Fokus Karier &amp; Peluang Kolaborasi</label>
            <textarea
              id="prof-career"
              rows={3}
              value={form.careerFocus}
              onChange={(e) => updateField('careerFocus', e.target.value)}
              className="w-full brutal-input px-3 py-2 text-sm"
            />
          </div>
        </div>

        {/* Media & Visibility */}
        <div className="lg:col-span-4 space-y-6">
          <div className="brutal-card surface-card p-5 space-y-4">
            <MediaUploader
              folder="profile"
              acceptMode="image"
              label="Foto Profil"
              currentUrls={form.photoUrl ? [form.photoUrl] : []}
              onUploaded={(res) => updateField('photoUrl', res.fileUrl)}
              onRemoveUrl={() => updateField('photoUrl', '')}
            />
            <div>
              <label htmlFor="prof-photo-url" className="block text-xs font-bold uppercase mb-1">Atau URL Foto Profil</label>
              <input
                id="prof-photo-url"
                type="text"
                value={form.photoUrl}
                onChange={(e) => updateField('photoUrl', e.target.value)}
                placeholder="https://... atau tautan Google Drive"
                className="w-full brutal-input px-3 py-2 text-xs"
              />
              {(() => {
                const driveInfo = extractGoogleDriveInfo(form.photoUrl);
                if (!driveInfo) return null;
                return (
                  <p className="mt-1.5 text-[11px] font-mono-num font-bold text-[#0F3D3A]">
                    Tautan Google Drive terdeteksi (ID: {driveInfo.fileId.slice(0, 10)}&hellip;) &mdash; ditampilkan otomatis sebagai gambar.
                  </p>
                );
              })()}
            </div>
          </div>

          <div className="brutal-card surface-card p-5 space-y-4">
            <MediaUploader
              folder="cv"
              acceptMode="pdf"
              label="Dokumen CV (PDF)"
              helperText="Untuk tombol Download CV"
              currentUrls={form.cvUrl ? [form.cvUrl] : []}
              onUploaded={(res) => {
                updateField('cvUrl', res.fileUrl);
                updateField('cvFileName', res.fileName);
              }}
              onRemoveUrl={() => {
                updateField('cvUrl', '');
                updateField('cvFileName', '');
              }}
            />
            <div>
              <label htmlFor="prof-cv-url" className="block text-xs font-bold uppercase mb-1">Atau URL CV PDF</label>
              <input
                id="prof-cv-url"
                type="text"
                value={form.cvUrl}
                onChange={(e) => updateField('cvUrl', e.target.value)}
                placeholder="https://..."
                className="w-full brutal-input px-3 py-2 text-xs"
              />
            </div>
          </div>

          <div className="brutal-card surface-card p-5 space-y-3">
            <p className="font-display font-bold text-sm">Kontrol Publikasi</p>
            <select
              value={form.status}
              aria-label="Status publikasi profil"
              onChange={(e) => updateField('status', e.target.value as 'draft' | 'published')}
              className="w-full brutal-input px-3 py-2 text-sm font-bold"
            >
              <option value="published">Published (Tampil Publik)</option>
              <option value="draft">Draft (Disembunyikan)</option>
            </select>
            <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
              <input
                type="checkbox"
                checked={form.isVisible}
                onChange={(e) => updateField('isVisible', e.target.checked)}
                className="w-4 h-4 accent-[#013A42]"
              />
              <span>Tampilkan di halaman publik</span>
            </label>
          </div>
        </div>
      </div>
    </form>
  );
};

export const ContactAndSeoEditor: React.FC<DirtyProps> = ({ onDirtyChange }) => {
  const { adminData, showToast } = usePortfolio();
  const [contactForm, setContactForm] = useState<Omit<ContactInfoData, 'id' | 'createdAt' | 'updatedAt'>>({
    email: adminData.contacts.email,
    whatsapp: adminData.contacts.whatsapp,
    whatsappLabel: adminData.contacts.whatsappLabel,
    linkedinUrl: adminData.contacts.linkedinUrl,
    githubUrl: adminData.contacts.githubUrl,
    instagramUrl: adminData.contacts.instagramUrl,
    websiteUrl: adminData.contacts.websiteUrl,
    availabilityNote: adminData.contacts.availabilityNote,
    status: adminData.contacts.status,
    isVisible: adminData.contacts.isVisible,
  });

  const [seoForm, setSeoForm] = useState<Omit<SiteSettingsData, 'id' | 'createdAt' | 'updatedAt'>>({
    siteTitle: adminData.siteSettings.siteTitle,
    metaDescription: adminData.siteSettings.metaDescription,
    ogTitle: adminData.siteSettings.ogTitle,
    ogDescription: adminData.siteSettings.ogDescription,
    ogImageUrl: adminData.siteSettings.ogImageUrl,
    status: adminData.siteSettings.status,
    isVisible: adminData.siteSettings.isVisible,
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setContactForm({
      email: adminData.contacts.email,
      whatsapp: adminData.contacts.whatsapp,
      whatsappLabel: adminData.contacts.whatsappLabel,
      linkedinUrl: adminData.contacts.linkedinUrl,
      githubUrl: adminData.contacts.githubUrl,
      instagramUrl: adminData.contacts.instagramUrl,
      websiteUrl: adminData.contacts.websiteUrl,
      availabilityNote: adminData.contacts.availabilityNote,
      status: adminData.contacts.status,
      isVisible: adminData.contacts.isVisible,
    });
    setSeoForm({
      siteTitle: adminData.siteSettings.siteTitle,
      metaDescription: adminData.siteSettings.metaDescription,
      ogTitle: adminData.siteSettings.ogTitle,
      ogDescription: adminData.siteSettings.ogDescription,
      ogImageUrl: adminData.siteSettings.ogImageUrl,
      status: adminData.siteSettings.status,
      isVisible: adminData.siteSettings.isVisible,
    });
    onDirtyChange(false);
  }, [adminData.contacts, adminData.siteSettings, onDirtyChange]);

  const handleSaveAll = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await Promise.all([saveContactInfo(contactForm), saveSiteSettings(seoForm)]);
      onDirtyChange(false);
      showToast('success', 'Informasi kontak dan pengaturan SEO berhasil disimpan.');
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Gagal menyimpan pengaturan.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSaveAll} className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4 pb-4 border-b-2 border-brutal">
        <div>
          <span className="brutal-badge">Kontak &amp; Metadata</span>
          <h1 className="font-display text-3xl font-extrabold mt-2">Kontak Publik &amp; SEO Website</h1>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="brutal-btn brutal-btn-primary px-5 py-2.5 text-xs font-bold inline-flex items-center gap-2 cursor-pointer"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Menyimpan...' : 'Simpan Kontak & SEO'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="brutal-card surface-card p-6 space-y-4">
          <h2 className="font-display text-xl font-extrabold">Saluran Kontak</h2>
          <div>
            <label htmlFor="c-email" className="block text-xs font-bold uppercase mb-1">Email Profesional</label>
            <input
              id="c-email"
              type="email"
              value={contactForm.email}
              onChange={(e) => { setContactForm((p) => ({ ...p, email: e.target.value })); onDirtyChange(true); }}
              className="w-full brutal-input px-3 py-2 text-sm"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="c-wa" className="block text-xs font-bold uppercase mb-1">Nomor WhatsApp</label>
              <input
                id="c-wa"
                type="text"
                placeholder="62812xxxxxxx"
                value={contactForm.whatsapp}
                onChange={(e) => { setContactForm((p) => ({ ...p, whatsapp: e.target.value })); onDirtyChange(true); }}
                className="w-full brutal-input px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label htmlFor="c-walabel" className="block text-xs font-bold uppercase mb-1">Label Tampilan WhatsApp</label>
              <input
                id="c-walabel"
                type="text"
                value={contactForm.whatsappLabel}
                onChange={(e) => { setContactForm((p) => ({ ...p, whatsappLabel: e.target.value })); onDirtyChange(true); }}
                className="w-full brutal-input px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div>
            <label htmlFor="c-linkedin" className="block text-xs font-bold uppercase mb-1">URL LinkedIn</label>
            <input
              id="c-linkedin"
              type="url"
              placeholder="https://linkedin.com/in/..."
              value={contactForm.linkedinUrl}
              onChange={(e) => { setContactForm((p) => ({ ...p, linkedinUrl: e.target.value })); onDirtyChange(true); }}
              className="w-full brutal-input px-3 py-2 text-sm"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="c-github" className="block text-xs font-bold uppercase mb-1">URL GitHub</label>
              <input
                id="c-github"
                type="url"
                placeholder="https://github.com/..."
                value={contactForm.githubUrl}
                onChange={(e) => { setContactForm((p) => ({ ...p, githubUrl: e.target.value })); onDirtyChange(true); }}
                className="w-full brutal-input px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label htmlFor="c-ig" className="block text-xs font-bold uppercase mb-1">URL Instagram</label>
              <input
                id="c-ig"
                type="url"
                placeholder="https://instagram.com/..."
                value={contactForm.instagramUrl}
                onChange={(e) => { setContactForm((p) => ({ ...p, instagramUrl: e.target.value })); onDirtyChange(true); }}
                className="w-full brutal-input px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div>
            <label htmlFor="c-web" className="block text-xs font-bold uppercase mb-1">URL Website Utama</label>
            <input
              id="c-web"
              type="url"
              value={contactForm.websiteUrl}
              onChange={(e) => { setContactForm((p) => ({ ...p, websiteUrl: e.target.value })); onDirtyChange(true); }}
              className="w-full brutal-input px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label htmlFor="c-note" className="block text-xs font-bold uppercase mb-1">Catatan Ketersediaan</label>
            <textarea
              id="c-note"
              rows={3}
              value={contactForm.availabilityNote}
              onChange={(e) => { setContactForm((p) => ({ ...p, availabilityNote: e.target.value })); onDirtyChange(true); }}
              className="w-full brutal-input px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div className="brutal-card surface-card p-6 space-y-4">
          <h2 className="font-display text-xl font-extrabold">SEO &amp; Open Graph</h2>
          <div>
            <label htmlFor="seo-title" className="block text-xs font-bold uppercase mb-1">Judul Website (&lt;title&gt;)</label>
            <input
              id="seo-title"
              type="text"
              value={seoForm.siteTitle}
              onChange={(e) => { setSeoForm((p) => ({ ...p, siteTitle: e.target.value })); onDirtyChange(true); }}
              className="w-full brutal-input px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label htmlFor="seo-desc" className="block text-xs font-bold uppercase mb-1">Meta Description</label>
            <textarea
              id="seo-desc"
              rows={3}
              value={seoForm.metaDescription}
              onChange={(e) => { setSeoForm((p) => ({ ...p, metaDescription: e.target.value })); onDirtyChange(true); }}
              className="w-full brutal-input px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label htmlFor="seo-ogtitle" className="block text-xs font-bold uppercase mb-1">Open Graph Title (Bagikan Tautan)</label>
            <input
              id="seo-ogtitle"
              type="text"
              value={seoForm.ogTitle}
              onChange={(e) => { setSeoForm((p) => ({ ...p, ogTitle: e.target.value })); onDirtyChange(true); }}
              className="w-full brutal-input px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label htmlFor="seo-ogdesc" className="block text-xs font-bold uppercase mb-1">Open Graph Description</label>
            <textarea
              id="seo-ogdesc"
              rows={3}
              value={seoForm.ogDescription}
              onChange={(e) => { setSeoForm((p) => ({ ...p, ogDescription: e.target.value })); onDirtyChange(true); }}
              className="w-full brutal-input px-3 py-2 text-sm"
            />
          </div>
        </div>
      </div>
    </form>
  );
};
