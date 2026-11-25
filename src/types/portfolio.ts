export type PublishStatus = 'draft' | 'published';

export interface BaseContentMeta {
  id: string;
  status: PublishStatus;
  isVisible: boolean;
  displayOrder: number;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface ProfileData {
  id: string;
  fullName: string;
  headline: string;
  shortBio: string;
  biography: string;
  domicile: string;
  vision: string;
  mission: string;
  careerFocus: string;
  careerInterestsOverview?: string;
  photoUrl: string;
  cvUrl: string;
  cvFileName: string;
  status: PublishStatus;
  isVisible: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface PublicProfileEducationEntry {
  institution: string;
  degree: string;
  fieldOfStudy: string;
  graduationYear: string;
  period: string;
  location: string;
  category: string;
}

export interface PublicProfileExperienceEntry {
  role: string;
  institution: string;
  category: string;
  period: string;
  duration: string;
  location: string;
  description: string;
  featured: boolean;
}

export interface PublicProfileSkillEntry {
  name: string;
  category: string;
  proficiencyLabel: string;
  description: string;
}

export interface PublicProfilePayload {
  fullName: string;
  headline: string;
  shortBio: string;
  domicile: string;
  photoUrl: string;
  photoFallbackUrls: string[];
  photoSourceUrl: string;
  education: PublicProfileEducationEntry[];
  experiences: PublicProfileExperienceEntry[];
  skills: PublicProfileSkillEntry[];
}

export interface PublicProfileDocument extends PublicProfilePayload {
  createdAt?: unknown;
  updatedAt?: unknown;
}

export type ExperienceCategory = 'mentoring' | 'teaching' | 'committee' | 'work';

export interface ExperienceItem extends BaseContentMeta {
  institution: string;
  role: string;
  category: ExperienceCategory;
  period: string;
  duration: string;
  location: string;
  description: string;
  responsibilities: string[];
  imageUrls: string[];
  primaryImageUrl?: string;
  featured: boolean;
}

export interface OrganizationItem extends BaseContentMeta {
  organizationName: string;
  role: string;
  category: string;
  period: string;
  description: string;
  responsibilities: string[];
  imageUrls: string[];
  primaryImageUrl?: string;
}

export interface EducationItem extends BaseContentMeta {
  institution: string;
  degree: string;
  fieldOfStudy: string;
  graduationYear: string;
  period: string;
  location: string;
  description: string;
  category: string;
  imageUrls?: string[];
  primaryImageUrl?: string;
}

export interface CertificateItem extends BaseContentMeta {
  title: string;
  issuer: string;
  year: string;
  category: string;
  field: string;
  description: string;
  fileUrl: string;
  fileType: 'image' | 'pdf';
  fileName: string;
  thumbnailUrl: string;
}

export type TrainingScope = 'domestic' | 'international';

export interface TrainingItem extends BaseContentMeta {
  title: string;
  scope: TrainingScope;
  organizer: string;
  year: string;
  category: string;
  topics: string[];
  description: string;
}

export type SkillCategory = 'technical' | 'soft' | 'academic' | 'language' | 'tool';

export interface SkillItem extends BaseContentMeta {
  name: string;
  category: SkillCategory;
  proficiencyLabel: string;
  description: string;
  imageUrl?: string;
}

export type InterestCategory =
  | 'professional_interest'
  | 'academic_interest'
  | 'personal_interest'
  | 'talent_strength'
  | 'career_interest';

export interface InterestItem extends BaseContentMeta {
  title: string;
  category: InterestCategory;
  description: string;
  imageUrl?: string;
}

export type ProjectCategory =
  | 'dars_with_osama'
  | 'website_digital'
  | 'article_writing'
  | 'learning_material'
  | 'design_media'
  | 'other';

export interface ProjectItem extends BaseContentMeta {
  title: string;
  category: ProjectCategory;
  period: string;
  description: string;
  documentation: string;
  liveUrl: string;
  repoUrl: string;
  imageUrls: string[];
  featured: boolean;
}

export type PublicationCategory = 'publication' | 'article' | 'research_interest' | 'study_field';

export interface PublicationItem extends BaseContentMeta {
  title: string;
  category: PublicationCategory;
  venue: string;
  year: string;
  summary: string;
  url: string;
}

export interface ContactInfoData {
  id: string;
  email: string;
  whatsapp: string;
  whatsappLabel: string;
  linkedinUrl: string;
  githubUrl: string;
  instagramUrl: string;
  websiteUrl: string;
  availabilityNote: string;
  status: PublishStatus;
  isVisible: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface ContactMessageItem {
  id: string;
  senderName: string;
  senderEmail: string;
  subject: string;
  message: string;
  status: 'new' | 'read' | 'replied';
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface SiteSettingsData {
  id: string;
  siteTitle: string;
  metaDescription: string;
  ogTitle: string;
  ogDescription: string;
  ogImageUrl: string;
  status: PublishStatus;
  isVisible: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface ActivityLogItem {
  id: string;
  action: 'create' | 'update' | 'delete' | 'seed' | 'upload';
  module: string;
  itemTitle: string;
  actorEmail: string;
  createdAt?: unknown;
}

export interface MediaAssetItem {
  id: string;
  fileName: string;
  fileUrl: string;
  storagePath: string;
  mimeType: string;
  sizeBytes: number;
  folder: string;
  uploadedBy: string;
  driveFileId?: string;
  driveFolderId?: string;
  driveFolderName?: string;
  downloadUrl?: string;
  visibility?: 'public' | 'private';
  storageProvider?: 'google_drive' | 'firebase_storage';
  createdAt?: unknown;
}

export interface PortfolioBundle {
  profile: ProfileData;
  experiences: ExperienceItem[];
  organizations: OrganizationItem[];
  education: EducationItem[];
  certificates: CertificateItem[];
  trainings: TrainingItem[];
  skills: SkillItem[];
  interests: InterestItem[];
  projects: ProjectItem[];
  publications: PublicationItem[];
  contacts: ContactInfoData;
  siteSettings: SiteSettingsData;
}

export type PublicRoute =
  | '/'
  | '/about'
  | '/experience'
  | '/education'
  | '/certificates'
  | '/skills'
  | '/projects'
  | '/contact'
  | '/admin';
