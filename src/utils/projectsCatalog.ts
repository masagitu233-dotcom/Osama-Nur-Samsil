import type { ProjectCategory, ProjectItem } from '../types/portfolio';
import { DARS_SITE_BASE_URL } from './darsPublications';

export type ActiveProjectTab = 'all' | 'website_digital' | 'article_writing';
export type NormalizedProjectCategory = 'website_digital' | 'article_writing';

export const ACTIVE_PROJECT_TABS: Array<{ value: ActiveProjectTab; label: string }> = [
  { value: 'all', label: 'Semua Karya' },
  { value: 'website_digital', label: 'Website & Digital' },
  { value: 'article_writing', label: 'Artikel & Tulisan' },
];

export const ACTIVE_PROJECT_CATEGORY_LABELS: Record<NormalizedProjectCategory, string> = {
  website_digital: 'Website & Digital',
  article_writing: 'Artikel & Tulisan',
};

export const DARS_PLATFORM_PROJECT_ID = 'proj_dars_with_osama';
export const DARS_PLATFORM_URL = `${DARS_SITE_BASE_URL}/`;
const GENERIC_STOCK_DARS_PATH = '/src/assets/images/project_dars_platform_1795494776579.jpg';

/**
 * Safely maps legacy Firestore project categories (`dars_with_osama`, `learning_material`,
 * `design_media`, `other`) into the 2 active project categories without hiding or losing saved items.
 */
export function normalizeProjectCategory(category?: string): NormalizedProjectCategory {
  if (category === 'article_writing') {
    return 'article_writing';
  }
  return 'website_digital';
}

export function isDarsPlatformProject(project: Pick<ProjectItem, 'id' | 'title' | 'liveUrl' | 'category'>): boolean {
  if (project.id === DARS_PLATFORM_PROJECT_ID) return true;

  const liveUrl = (project.liveUrl || '').trim().toLowerCase();
  const title = (project.title || '').trim().toLowerCase();

  // Never misclassify an individual article URL (/article/... or ?view=blog-detail) as the platform card
  if (liveUrl.includes('/article/') || liveUrl.includes('view=blog-detail')) {
    return false;
  }

  if (liveUrl.includes('darswithosama.netlify.app')) {
    return true;
  }

  return title === 'dars with osama' || project.category === 'dars_with_osama';
}

export function hasCustomUploadedDarsAsset(project: Pick<ProjectItem, 'imageUrls'>): boolean {
  const first = (project.imageUrls?.[0] || '').trim();
  if (!first) return false;
  return first !== GENERIC_STOCK_DARS_PATH;
}

export function buildDefaultDarsPlatformProject(): ProjectItem {
  return {
    id: DARS_PLATFORM_PROJECT_ID,
    title: 'Dars with Osama',
    category: 'website_digital',
    period: 'Aktif Berjalan',
    description:
      'Platform website media pembelajaran dan publikasi materi keislaman yang menyajikan kajian kitab turats, materi belajar terstruktur, dan artikel ilmiah secara terbuka.',
    documentation:
      'Dikembangkan dan dikelola sebagai pusat pembelajaran keislaman digital yang memuat katalog materi kitab, dokumentasi kajian, ruang konsultasi, serta publikasi artikel ilmiah.',
    liveUrl: DARS_PLATFORM_URL,
    repoUrl: '',
    imageUrls: [],
    featured: true,
    status: 'published',
    isVisible: true,
    displayOrder: 0,
  };
}

/**
 * Normalizes all stored projects into active categories and guarantees that Dars with Osama
 * appears as a dedicated platform project under `Website & Digital` (using existing saved
 * project data when present in Firestore).
 */
export function prepareWebsiteProjects(projects: ProjectItem[]): ProjectItem[] {
  const normalized = projects.map((proj) => {
    const isDars = isDarsPlatformProject(proj);
    const normalizedCategory: ProjectCategory = isDars
      ? 'website_digital'
      : normalizeProjectCategory(proj.category);

    return {
      ...proj,
      category: normalizedCategory,
      liveUrl: isDars ? proj.liveUrl || DARS_PLATFORM_URL : proj.liveUrl,
    };
  });

  const websiteProjects = normalized.filter((proj) => proj.category === 'website_digital');
  const hasDarsCard = websiteProjects.some((proj) => isDarsPlatformProject(proj));

  if (!hasDarsCard) {
    return [buildDefaultDarsPlatformProject(), ...websiteProjects];
  }

  // Keep Dars with Osama prominent while preserving stored ordering
  return websiteProjects;
}

export function filterWebsiteProjectsByQuery(projects: ProjectItem[], query: string): ProjectItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return projects;
  return projects.filter((proj) => {
    const haystack = `${proj.title} ${proj.description} ${proj.documentation} ${proj.period} ${proj.liveUrl}`.toLowerCase();
    return haystack.includes(q);
  });
}

export function filterManualArticleProjects(projects: ProjectItem[], query: string): ProjectItem[] {
  const manualArticles = projects.filter((proj) => normalizeProjectCategory(proj.category) === 'article_writing');
  const q = query.trim().toLowerCase();
  if (!q) return manualArticles;
  return manualArticles.filter((proj) => {
    const haystack = `${proj.title} ${proj.description} ${proj.documentation} ${proj.period}`.toLowerCase();
    return haystack.includes(q);
  });
}
