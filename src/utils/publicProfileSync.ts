import type {
  EducationItem,
  ExperienceItem,
  ProfileData,
  PublicProfileEducationEntry,
  PublicProfileExperienceEntry,
  PublicProfilePayload,
  PublicProfileSkillEntry,
  SkillItem,
} from '../types/portfolio';
import { getImageCandidateUrls } from './googleDriveMedia';
import { clampString, filterPublicItems } from './portfolioLogic';

export const PUBLIC_PROFILE_COLLECTION = 'publicProfile';
export const PUBLIC_PROFILE_DOC_ID = 'osama';
export const PUBLIC_PROFILE_PATH = `${PUBLIC_PROFILE_COLLECTION}/${PUBLIC_PROFILE_DOC_ID}`;

export const PUBLIC_PROFILE_LIMITS = {
  maxEducation: 20,
  maxExperiences: 30,
  maxSkills: 50,
  maxPhotoFallbacks: 5,
} as const;

export interface ResolvedExternalPhoto {
  photoUrl: string;
  photoFallbackUrls: string[];
  photoSourceUrl: string;
}

function isAbsoluteHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

/**
 * Resolves the profile photo URL into external-safe absolute HTTPS image URLs
 * using the exact same Google Drive normalization logic that renders images
 * on the portfolio website, while excluding site-relative proxy paths
 * (e.g. /.netlify/functions/...) that would not resolve on external origins.
 */
export function resolveExternalPublicPhoto(rawPhotoUrl: string | undefined | null): ResolvedExternalPhoto {
  const source = clampString(rawPhotoUrl, 2048);
  if (!source) {
    return {
      photoUrl: '',
      photoFallbackUrls: [],
      photoSourceUrl: '',
    };
  }

  const candidates = getImageCandidateUrls(source, 1600)
    .filter((url) => isAbsoluteHttpUrl(url))
    .map((url) => clampString(url, 2048))
    .slice(0, PUBLIC_PROFILE_LIMITS.maxPhotoFallbacks);

  return {
    photoUrl: candidates[0] ?? '',
    photoFallbackUrls: candidates,
    photoSourceUrl: isAbsoluteHttpUrl(source) ? source : '',
  };
}

/**
 * Only published and visible profiles should overwrite the external public profile snapshot.
 */
export function shouldSyncPublicProfile(
  profile: Pick<ProfileData, 'status' | 'isVisible'> | null | undefined
): boolean {
  return Boolean(profile && profile.status === 'published' && profile.isVisible === true);
}

/**
 * Pure builder that projects existing published portfolio data into the dedicated
 * publicProfile/osama document structure.
 *
 * Strictly excludes administrative, authentication, contact/PII, and unpublished draft data.
 */
export function buildPublicProfilePayload(input: {
  profile: Pick<ProfileData, 'fullName' | 'headline' | 'shortBio' | 'domicile' | 'photoUrl'>;
  education: EducationItem[];
  experiences: ExperienceItem[];
  skills: SkillItem[];
}): PublicProfilePayload {
  const resolvedPhoto = resolveExternalPublicPhoto(input.profile.photoUrl);

  const publicEducation: PublicProfileEducationEntry[] = filterPublicItems(input.education)
    .slice(0, PUBLIC_PROFILE_LIMITS.maxEducation)
    .map((item) => ({
      institution: clampString(item.institution, 200),
      degree: clampString(item.degree, 160),
      fieldOfStudy: clampString(item.fieldOfStudy, 200),
      graduationYear: clampString(item.graduationYear, 60),
      period: clampString(item.period, 100),
      location: clampString(item.location, 160),
      category: clampString(item.category, 80),
    }))
    .filter((item) => item.institution.length > 0);

  const publicExperiences: PublicProfileExperienceEntry[] = filterPublicItems(input.experiences)
    .slice(0, PUBLIC_PROFILE_LIMITS.maxExperiences)
    .map((item) => ({
      role: clampString(item.role, 200),
      institution: clampString(item.institution, 200),
      category: clampString(item.category, 60),
      period: clampString(item.period, 100),
      duration: clampString(item.duration, 100),
      location: clampString(item.location, 160),
      description: clampString(item.description, 1500),
      featured: Boolean(item.featured),
    }))
    .filter((item) => item.role.length > 0);

  const publicSkills: PublicProfileSkillEntry[] = filterPublicItems(input.skills)
    .slice(0, PUBLIC_PROFILE_LIMITS.maxSkills)
    .map((item) => ({
      name: clampString(item.name, 140),
      category: clampString(item.category, 60),
      proficiencyLabel: clampString(item.proficiencyLabel, 120),
      description: clampString(item.description, 800),
    }))
    .filter((item) => item.name.length > 0);

  return {
    fullName: clampString(input.profile.fullName, 120),
    headline: clampString(input.profile.headline, 240),
    shortBio: clampString(input.profile.shortBio, 800),
    domicile: clampString(input.profile.domicile, 160),
    photoUrl: resolvedPhoto.photoUrl,
    photoFallbackUrls: resolvedPhoto.photoFallbackUrls,
    photoSourceUrl: resolvedPhoto.photoSourceUrl,
    education: publicEducation,
    experiences: publicExperiences,
    skills: publicSkills,
  };
}
