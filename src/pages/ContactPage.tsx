import React, { useState } from 'react';
import { AlertCircle, ArrowUpRight, CheckCircle2, Mail, MessageSquare, Send } from 'lucide-react';
import { usePortfolio } from '../context/PortfolioContext';
import { submitContactMessage } from '../services/portfolioService';
import {
  formatWhatsAppLink,
  validateContactForm,
  type ContactFormValues,
} from '../utils/portfolioLogic';

const EMPTY_FORM: ContactFormValues = {
  senderName: '',
  senderEmail: '',
  subject: '',
  message: '',
};

export const ContactPage: React.FC = () => {
  const { publicData, showToast } = usePortfolio();
  const { contacts, profile } = publicData;

  const [values, setValues] = useState<ContactFormValues>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof ContactFormValues, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const check = validateContactForm(values);
    setErrors(check.errors);
    if (!check.valid) {
      showToast('error', 'Mohon lengkapi seluruh kolom formulir dengan benar.');
      return;
    }

    setSubmitting(true);
    try {
      await submitContactMessage(values);
      setSubmitted(true);
      setValues(EMPTY_FORM);
      setErrors({});
      showToast('success', 'Pesan Anda berhasil dikirim dan tersimpan di kotak masuk admin.');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Gagal mengirim pesan. Coba lagi.';
      showToast('error', msg);
    } finally {
      setSubmitting(false);
    }
  };

  const waUrl = formatWhatsAppLink(contacts.whatsapp);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-10">
      <header data-aos="fade-up" className="border-b-2 border-brutal pb-5 sm:pb-6">
        <span className="brutal-badge">07. Hubungi Saya</span>
        <h1 className="font-display text-2xl sm:text-3xl lg:text-[34px] font-extrabold mt-2.5 text-balance leading-tight">
          Kolaborasi, Rekrutmen &amp; Diskusi Profesional
        </h1>
        <p className="mt-2.5 text-sm sm:text-[15px] text-muted max-w-2xl leading-relaxed">
          {contacts.availabilityNote}
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Editable Contact Channels */}
        <aside className="lg:col-span-5 space-y-4">
          <div data-aos="fade-up" data-aos-delay="0" className="brutal-card card-beige frame-shadow-green p-5 space-y-3.5">
            <h2 className="font-display text-lg sm:text-xl font-extrabold">Saluran Kontak Resmi</h2>

            <div className="divide-y divide-[var(--card-border-subtle)] text-sm">
              <div className="py-3 first:pt-0">
                <p className="font-mono-num text-[11px] font-bold text-[#6C151E] uppercase">Email</p>
                {contacts.email ? (
                  <a
                    href={`mailto:${contacts.email}`}
                    className="mt-0.5 inline-flex items-center gap-2 font-bold text-sm sm:text-[15px] hover:underline break-all"
                  >
                    <Mail className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span>{contacts.email}</span>
                  </a>
                ) : (
                  <p className="mt-0.5 text-muted text-xs sm:text-sm">Belum diisi (dapat diperbarui melalui Admin)</p>
                )}
              </div>

              <div className="py-3">
                <p className="font-mono-num text-[11px] font-bold text-[#0F3D3A] uppercase">WhatsApp</p>
                {waUrl ? (
                  <a
                    href={waUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-0.5 inline-flex items-center gap-2 font-bold text-sm sm:text-[15px] hover:underline"
                  >
                    <MessageSquare className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span>{contacts.whatsappLabel || contacts.whatsapp}</span>
                    <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
                  </a>
                ) : (
                  <p className="mt-0.5 text-muted text-xs sm:text-sm">
                    {contacts.whatsappLabel || 'Belum diisi — dapat diperbarui melalui Dashboard Admin'}
                  </p>
                )}
              </div>

              <div className="py-3 last:pb-0">
                <p className="font-mono-num text-[11px] font-bold text-muted uppercase">Domisili</p>
                <p className="mt-0.5 font-bold text-sm sm:text-[15px]">{profile.domicile}</p>
              </div>
            </div>
          </div>

          {/* Professional Links */}
          <div data-aos="fade-up" data-aos-delay="80" className="brutal-card card-green frame-midnight p-5 space-y-3">
            <span className="brutal-badge">Jejaring Digital</span>
            <h2 className="font-display text-lg font-extrabold text-[#F8F8E1]">Media Sosial &amp; Tautan Profesional</h2>
            <div className="flex flex-col gap-1.5 text-sm font-bold">
              {contacts.websiteUrl && (
                <a
                  href={contacts.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between py-2 border-b border-[#8ACCD5]/30 text-[#F8F8E1] hover:text-[#8ACCD5] transition-colors"
                >
                  <span>Dars with Osama (Website)</span>
                  <ArrowUpRight className="w-4 h-4 text-[#8ACCD5]" aria-hidden="true" />
                </a>
              )}
              {contacts.linkedinUrl ? (
                <a
                  href={contacts.linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between py-2 border-b border-[#8ACCD5]/30 text-[#F8F8E1] hover:text-[#8ACCD5] transition-colors"
                >
                  <span>LinkedIn</span>
                  <ArrowUpRight className="w-4 h-4 text-[#8ACCD5]" aria-hidden="true" />
                </a>
              ) : (
                <p className="text-xs font-semibold text-muted py-1">
                  LinkedIn: Siap diisi melalui Dashboard Admin
                </p>
              )}
              {contacts.githubUrl ? (
                <a
                  href={contacts.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between py-2 border-b border-[#8ACCD5]/30 text-[#F8F8E1] hover:text-[#8ACCD5] transition-colors"
                >
                  <span>GitHub</span>
                  <ArrowUpRight className="w-4 h-4 text-[#8ACCD5]" aria-hidden="true" />
                </a>
              ) : (
                <p className="text-xs font-semibold text-muted py-1">
                  GitHub: Siap diisi melalui Dashboard Admin
                </p>
              )}
              {contacts.instagramUrl && (
                <a
                  href={contacts.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between py-2 text-[#F8F8E1] hover:text-[#8ACCD5] transition-colors"
                >
                  <span>Instagram</span>
                  <ArrowUpRight className="w-4 h-4 text-[#8ACCD5]" aria-hidden="true" />
                </a>
              )}
            </div>
          </div>
        </aside>

        {/* Right: Validated Contact Form */}
        <section
          aria-labelledby="contact-form-heading"
          data-aos="fade-up"
          data-aos-delay="100"
          className="lg:col-span-7 brutal-card card-beige frame-shadow-bordo p-5 sm:p-6"
        >
          <h2 id="contact-form-heading" className="font-display text-lg sm:text-xl font-extrabold mb-1.5">
            Kirim Pesan Langsung
          </h2>
          <p className="text-xs sm:text-sm text-muted mb-5">
            Pesan yang Anda kirim tersimpan secara aman di Firestore dan hanya dapat dibaca oleh pemilik portofolio di Dashboard Admin.
          </p>

          {submitted && (
            <div
              role="status"
              className="mb-5 p-3.5 border-2 border-[#013A42] card-blue flex items-start gap-2.5"
            >
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
              <div className="text-xs sm:text-sm">
                <p className="font-display font-extrabold">Pesan Terkirim</p>
                <p className="mt-0.5">
                  Terima kasih telah menghubungi {profile.fullName}. Pesan Anda telah tercatat dan akan segera ditinjau.
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label htmlFor="contact-name" className="block text-xs font-bold uppercase tracking-wider mb-1">
                  Nama Lengkap *
                </label>
                <input
                  id="contact-name"
                  type="text"
                  required
                  value={values.senderName}
                  onChange={(e) => setValues((v) => ({ ...v, senderName: e.target.value }))}
                  placeholder="Nama Anda atau Instansi"
                  aria-invalid={Boolean(errors.senderName)}
                  className="w-full brutal-input px-3 py-2 text-sm"
                />
                {errors.senderName && (
                  <p role="alert" className="mt-1 inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-bold bg-[#6C151E] text-[#F8F8E1] border border-[#013A42]">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    <span>{errors.senderName}</span>
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="contact-email" className="block text-xs font-bold uppercase tracking-wider mb-1">
                  Alamat Email *
                </label>
                <input
                  id="contact-email"
                  type="email"
                  required
                  value={values.senderEmail}
                  onChange={(e) => setValues((v) => ({ ...v, senderEmail: e.target.value }))}
                  placeholder="nama@perusahaan.com"
                  aria-invalid={Boolean(errors.senderEmail)}
                  className="w-full brutal-input px-3 py-2 text-sm"
                />
                {errors.senderEmail && (
                  <p role="alert" className="mt-1 inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-bold bg-[#6C151E] text-[#F8F8E1] border border-[#013A42]">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    <span>{errors.senderEmail}</span>
                  </p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="contact-subject" className="block text-xs font-bold uppercase tracking-wider mb-1">
                Subjek Pesan *
              </label>
              <input
                id="contact-subject"
                type="text"
                required
                value={values.subject}
                onChange={(e) => setValues((v) => ({ ...v, subject: e.target.value }))}
                placeholder="Contoh: Peluang Kerja Remote / Kolaborasi Edukasi"
                aria-invalid={Boolean(errors.subject)}
                className="w-full brutal-input px-3 py-2 text-sm"
              />
              {errors.subject && (
                <p role="alert" className="mt-1 inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-bold bg-[#6C151E] text-[#F8F8E1] border border-[#013A42]">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span>{errors.subject}</span>
                </p>
              )}
            </div>

            <div>
              <label htmlFor="contact-message" className="block text-xs font-bold uppercase tracking-wider mb-1">
                Isi Pesan *
              </label>
              <textarea
                id="contact-message"
                rows={4}
                required
                value={values.message}
                onChange={(e) => setValues((v) => ({ ...v, message: e.target.value }))}
                placeholder="Tuliskan detail peluang, pertanyaan, atau rencana kolaborasi Anda..."
                aria-invalid={Boolean(errors.message)}
                className="w-full brutal-input px-3 py-2 text-sm resize-y"
              />
              {errors.message && (
                <p role="alert" className="mt-1 inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-bold bg-[#6C151E] text-[#F8F8E1] border border-[#013A42]">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span>{errors.message}</span>
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="brutal-btn brutal-btn-primary font-display font-bold text-xs sm:text-sm px-5 py-2.5 inline-flex items-center gap-2 cursor-pointer disabled:opacity-60"
            >
              <Send className="w-4 h-4" aria-hidden="true" />
              <span>{submitting ? 'Mengirim Pesan...' : 'Kirim Pesan Sekarang'}</span>
            </button>
          </form>
        </section>
      </div>
    </div>
  );
};
