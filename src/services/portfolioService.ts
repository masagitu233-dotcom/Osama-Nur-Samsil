import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  type QueryConstraint,
  type Unsubscribe,
} from 'firebase/firestore';
import {
  deleteObject,
  ref as storageRef,
} from 'firebase/storage';
import {
  auth,
  BOOTSTRAPPED_ADMIN_EMAIL,
  db,
  handleFirestoreError,
  OperationType,
  storage,
} from './firebase';
import {
  deleteGoogleDriveFileById,
  uploadFileToGoogleDrive,
  type DriveFileVisibility,
  type DriveUploadCategory,
} from './googleDriveUploadService';
import type { UploadProgressSnapshot } from '../utils/uploadStateMachine';
import { INITIAL_PORTFOLIO_DATA } from '../data/initialPortfolioData';
import type {
  ActivityLogItem,
  CertificateItem,
  ContactInfoData,
  ContactMessageItem,
  EducationItem,
  ExperienceItem,
  InterestItem,
  MediaAssetItem,
  OrganizationItem,
  ProfileData,
  ProjectItem,
  PublicationItem,
  SiteSettingsData,
  SkillItem,
  TrainingItem,
} from '../types/portfolio';
import {
  clampString,
  clampStringArray,
  generateSafeDocId,
  validateContactForm,
  validateUploadFile,
  type ContactFormValues,
} from '../utils/portfolioLogic';
import { compressImageIfNeeded } from '../utils/mediaCompression';
import {
  buildPublicProfilePayload,
  PUBLIC_PROFILE_COLLECTION,
  PUBLIC_PROFILE_DOC_ID,
  PUBLIC_PROFILE_PATH,
  shouldSyncPublicProfile,
} from '../utils/publicProfileSync';

const PUBLIC_PROFILE_SYNC_COLLECTIONS = new Set<ManagedCollectionName>([
  'education',
  'experiences',
  'skills',
]);

export type ManagedCollectionName =
  | 'experiences'
  | 'organizations'
  | 'education'
  | 'certificates'
  | 'trainings'
  | 'skills'
  | 'interests'
  | 'projects'
  | 'publications';

export async function verifyAdminAccess(uid: string, email: string | null, emailVerified: boolean): Promise<boolean> {
  if (!emailVerified) return false;
  if (email && email.toLowerCase() === BOOTSTRAPPED_ADMIN_EMAIL.toLowerCase()) {
    return true;
  }
  try {
    const snap = await getDoc(doc(db, 'admins', uid));
    return snap.exists();
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `admins/${uid}`);
  }
}

export function subscribePublicCollection<T>(
  collectionName: string,
  onData: (items: T[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const constraints: QueryConstraint[] = [
    where('status', '==', 'published'),
    where('isVisible', '==', true),
  ];
  const q = query(collection(db, collectionName), ...constraints);
  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as T);
      onData(items);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, collectionName);
      } catch (wrapped) {
        if (onError && wrapped instanceof Error) {
          onError(wrapped);
        }
      }
    }
  );
}

export function subscribeAdminCollection<T>(
  collectionName: string,
  onData: (items: T[]) => void,
  onError?: (err: Error) => void,
  orderField?: string
): Unsubscribe {
  const q = orderField
    ? query(collection(db, collectionName), orderBy(orderField, 'desc'))
    : query(collection(db, collectionName));
  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as T);
      onData(items);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, collectionName);
      } catch (wrapped) {
        if (onError && wrapped instanceof Error) {
          onError(wrapped);
        }
      }
    }
  );
}

export async function logAdminActivity(
  action: ActivityLogItem['action'],
  module: string,
  itemTitle: string
): Promise<void> {
  const actorEmail = auth.currentUser?.email || BOOTSTRAPPED_ADMIN_EMAIL;
  const logId = generateSafeDocId('log');
  try {
    await setDoc(doc(db, 'activityLogs', logId), {
      action,
      module: clampString(module, 80),
      itemTitle: clampString(itemTitle, 200) || '(Tanpa Judul)',
      actorEmail: clampString(actorEmail, 160),
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.warn('Activity log failed:', error);
  }
}

export async function syncPublicProfileFromFirestore(
  profileOverride?: Pick<ProfileData, 'fullName' | 'headline' | 'shortBio' | 'domicile' | 'photoUrl' | 'status' | 'isVisible'>
): Promise<boolean> {
  const publicDocRef = doc(db, PUBLIC_PROFILE_COLLECTION, PUBLIC_PROFILE_DOC_ID);
  try {
    let sourceProfile = profileOverride;
    if (!sourceProfile) {
      const profileSnap = await getDoc(doc(db, 'profile', 'main'));
      if (!profileSnap.exists()) {
        return false;
      }
      sourceProfile = profileSnap.data() as ProfileData;
    }

    if (!shouldSyncPublicProfile(sourceProfile)) {
      return false;
    }

    const [eduSnap, expSnap, skillSnap, existingPublicSnap] = await Promise.all([
      getDocs(collection(db, 'education')),
      getDocs(collection(db, 'experiences')),
      getDocs(collection(db, 'skills')),
      getDoc(publicDocRef),
    ]);

    const education = eduSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as EducationItem);
    const experiences = expSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as ExperienceItem);
    const skills = skillSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as SkillItem);

    const payload = buildPublicProfilePayload({
      profile: sourceProfile,
      education,
      experiences,
      skills,
    });

    if (existingPublicSnap.exists()) {
      await setDoc(publicDocRef, {
        ...payload,
        createdAt: existingPublicSnap.data().createdAt,
        updatedAt: serverTimestamp(),
      });
    } else {
      await setDoc(publicDocRef, {
        ...payload,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, PUBLIC_PROFILE_PATH);
  }
}

export async function saveProfile(data: Omit<ProfileData, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> {
  const path = 'profile/main';
  const docRef = doc(db, 'profile', 'main');
  try {
    const existingSnap = await getDoc(docRef);
    const payload = {
      fullName: clampString(data.fullName, 120),
      headline: clampString(data.headline, 240),
      shortBio: clampString(data.shortBio, 800),
      biography: clampString(data.biography, 5000),
      domicile: clampString(data.domicile, 160),
      vision: clampString(data.vision, 1500),
      mission: clampString(data.mission, 2000),
      careerFocus: clampString(data.careerFocus, 1000),
      photoUrl: clampString(data.photoUrl, 2048),
      cvUrl: clampString(data.cvUrl, 2048),
      cvFileName: clampString(data.cvFileName, 200),
      status: data.status,
      isVisible: Boolean(data.isVisible),
      updatedAt: serverTimestamp(),
    };
    if (existingSnap.exists()) {
      await setDoc(docRef, {
        ...payload,
        createdAt: existingSnap.data().createdAt,
      });
    } else {
      await setDoc(docRef, {
        ...payload,
        createdAt: serverTimestamp(),
      });
    }

    // Automatically synchronize the dedicated external public profile document (publicProfile/osama)
    await syncPublicProfileFromFirestore(payload);

    await logAdminActivity('update', 'profile', payload.fullName);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function saveContactInfo(
  data: Omit<ContactInfoData, 'id' | 'createdAt' | 'updatedAt'>
): Promise<void> {
  const path = 'contacts/main';
  const docRef = doc(db, 'contacts', 'main');
  try {
    const existingSnap = await getDoc(docRef);
    const payload = {
      email: clampString(data.email, 160),
      whatsapp: clampString(data.whatsapp, 80),
      whatsappLabel: clampString(data.whatsappLabel, 120),
      linkedinUrl: clampString(data.linkedinUrl, 2048),
      githubUrl: clampString(data.githubUrl, 2048),
      instagramUrl: clampString(data.instagramUrl, 2048),
      websiteUrl: clampString(data.websiteUrl, 2048),
      availabilityNote: clampString(data.availabilityNote, 400),
      status: data.status,
      isVisible: Boolean(data.isVisible),
      updatedAt: serverTimestamp(),
    };
    if (existingSnap.exists()) {
      await setDoc(docRef, { ...payload, createdAt: existingSnap.data().createdAt });
    } else {
      await setDoc(docRef, { ...payload, createdAt: serverTimestamp() });
    }
    await logAdminActivity('update', 'contacts', 'Informasi Kontak');
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function saveSiteSettings(
  data: Omit<SiteSettingsData, 'id' | 'createdAt' | 'updatedAt'>
): Promise<void> {
  const path = 'siteSettings/main';
  const docRef = doc(db, 'siteSettings', 'main');
  try {
    const existingSnap = await getDoc(docRef);
    const payload = {
      siteTitle: clampString(data.siteTitle, 120),
      metaDescription: clampString(data.metaDescription, 320),
      ogTitle: clampString(data.ogTitle, 120),
      ogDescription: clampString(data.ogDescription, 320),
      ogImageUrl: clampString(data.ogImageUrl, 2048),
      status: data.status,
      isVisible: Boolean(data.isVisible),
      updatedAt: serverTimestamp(),
    };
    if (existingSnap.exists()) {
      await setDoc(docRef, { ...payload, createdAt: existingSnap.data().createdAt });
    } else {
      await setDoc(docRef, { ...payload, createdAt: serverTimestamp() });
    }
    await logAdminActivity('update', 'siteSettings', payload.siteTitle);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

function sanitizeEntityPayload(collectionName: ManagedCollectionName, raw: Record<string, unknown>) {
  const common = {
    status: raw.status === 'draft' ? 'draft' : 'published',
    isVisible: Boolean(raw.isVisible),
    displayOrder: Math.max(0, Math.min(10000, Math.round(Number(raw.displayOrder) || 0))),
  };

  switch (collectionName) {
    case 'experiences': {
      const r = raw as Partial<ExperienceItem>;
      return {
        ...common,
        institution: clampString(r.institution, 200),
        role: clampString(r.role, 200),
        category: r.category && ['mentoring', 'teaching', 'committee', 'work'].includes(r.category) ? r.category : 'mentoring',
        period: clampString(r.period, 100),
        duration: clampString(r.duration, 100),
        location: clampString(r.location, 160),
        description: clampString(r.description, 3000),
        responsibilities: clampStringArray(r.responsibilities, 12, 400),
        imageUrls: clampStringArray(r.imageUrls, 8, 2048),
        featured: Boolean(r.featured),
      };
    }
    case 'organizations': {
      const r = raw as Partial<OrganizationItem>;
      return {
        ...common,
        organizationName: clampString(r.organizationName, 200),
        role: clampString(r.role, 200),
        category: clampString(r.category || 'Organisasi', 80),
        period: clampString(r.period, 100),
        description: clampString(r.description, 3000),
        responsibilities: clampStringArray(r.responsibilities, 12, 400),
        imageUrls: clampStringArray(r.imageUrls, 8, 2048),
      };
    }
    case 'education': {
      const r = raw as Partial<EducationItem>;
      return {
        ...common,
        institution: clampString(r.institution, 200),
        degree: clampString(r.degree, 160),
        fieldOfStudy: clampString(r.fieldOfStudy, 200),
        graduationYear: clampString(r.graduationYear, 60),
        period: clampString(r.period, 100),
        location: clampString(r.location, 160),
        description: clampString(r.description, 2500),
        category: clampString(r.category || 'Pendidikan Tinggi', 80),
        imageUrls: clampStringArray(r.imageUrls, 8, 2048),
      };
    }
    case 'certificates': {
      const r = raw as Partial<CertificateItem>;
      return {
        ...common,
        title: clampString(r.title, 200),
        issuer: clampString(r.issuer, 200),
        year: clampString(r.year, 40),
        category: clampString(r.category || 'Dalam Negeri', 80),
        field: clampString(r.field || 'Umum', 100),
        description: clampString(r.description, 2000),
        fileUrl: clampString(r.fileUrl, 2048),
        fileType: r.fileType === 'pdf' ? 'pdf' : 'image',
        fileName: clampString(r.fileName, 200),
        thumbnailUrl: clampString(r.thumbnailUrl, 2048),
      };
    }
    case 'trainings': {
      const r = raw as Partial<TrainingItem>;
      return {
        ...common,
        title: clampString(r.title, 200),
        scope: r.scope === 'international' ? 'international' : 'domestic',
        organizer: clampString(r.organizer, 200),
        year: clampString(r.year, 60),
        category: clampString(r.category || 'Pelatihan', 80),
        topics: clampStringArray(r.topics, 15, 160),
        description: clampString(r.description, 2000),
      };
    }
    case 'skills': {
      const r = raw as Partial<SkillItem>;
      return {
        ...common,
        name: clampString(r.name, 140),
        category: r.category && ['technical', 'soft', 'academic', 'language', 'tool'].includes(r.category) ? r.category : 'technical',
        proficiencyLabel: clampString(r.proficiencyLabel, 120),
        description: clampString(r.description, 800),
        imageUrl: clampString(r.imageUrl, 2048),
      };
    }
    case 'interests': {
      const r = raw as Partial<InterestItem>;
      return {
        ...common,
        title: clampString(r.title, 160),
        category:
          r.category &&
          ['professional_interest', 'academic_interest', 'personal_interest', 'talent_strength', 'career_interest'].includes(
            r.category
          )
            ? r.category
            : 'professional_interest',
        description: clampString(r.description, 1000),
        imageUrl: clampString(r.imageUrl, 2048),
      };
    }
    case 'projects': {
      const r = raw as Partial<ProjectItem>;
      return {
        ...common,
        title: clampString(r.title, 200),
        category:
          r.category &&
          ['dars_with_osama', 'website_digital', 'article_writing', 'learning_material', 'design_media', 'other'].includes(
            r.category
          )
            ? r.category
            : 'website_digital',
        period: clampString(r.period, 100),
        description: clampString(r.description, 3000),
        documentation: clampString(r.documentation, 3000),
        liveUrl: clampString(r.liveUrl, 2048),
        repoUrl: clampString(r.repoUrl, 2048),
        imageUrls: clampStringArray(r.imageUrls, 8, 2048),
        featured: Boolean(r.featured),
      };
    }
    case 'publications': {
      const r = raw as Partial<PublicationItem>;
      return {
        ...common,
        title: clampString(r.title, 240),
        category:
          r.category && ['publication', 'article', 'research_interest', 'study_field'].includes(r.category)
            ? r.category
            : 'article',
        venue: clampString(r.venue, 200),
        year: clampString(r.year, 40),
        summary: clampString(r.summary, 2500),
        url: clampString(r.url, 2048),
      };
    }
  }
}

export async function upsertManagedItem(
  collectionName: ManagedCollectionName,
  existingId: string | null,
  rawData: Record<string, unknown>,
  labelForLog: string
): Promise<string> {
  const docId = existingId || generateSafeDocId(collectionName.slice(0, 6));
  const path = `${collectionName}/${docId}`;
  const docRef = doc(db, collectionName, docId);
  const sanitized = sanitizeEntityPayload(collectionName, rawData);

  try {
    const existingSnap = existingId ? await getDoc(docRef) : null;
    if (existingSnap && existingSnap.exists()) {
      await setDoc(docRef, {
        ...sanitized,
        createdAt: existingSnap.data().createdAt,
        updatedAt: serverTimestamp(),
      });
      await logAdminActivity('update', collectionName, labelForLog);
    } else {
      await setDoc(docRef, {
        ...sanitized,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      await logAdminActivity('create', collectionName, labelForLog);
    }

    if (PUBLIC_PROFILE_SYNC_COLLECTIONS.has(collectionName)) {
      await syncPublicProfileFromFirestore();
    }

    return docId;
  } catch (error) {
    handleFirestoreError(error, existingId ? OperationType.UPDATE : OperationType.CREATE, path);
  }
}

export async function deleteManagedItem(
  collectionName: ManagedCollectionName | 'contactMessages',
  docId: string,
  labelForLog: string
): Promise<void> {
  const path = `${collectionName}/${docId}`;
  try {
    await deleteDoc(doc(db, collectionName, docId));
    await logAdminActivity('delete', collectionName, labelForLog);

    if (collectionName !== 'contactMessages' && PUBLIC_PROFILE_SYNC_COLLECTIONS.has(collectionName)) {
      await syncPublicProfileFromFirestore();
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function submitContactMessage(values: ContactFormValues): Promise<string> {
  const validation = validateContactForm(values);
  if (!validation.valid) {
    throw new Error('Formulir belum valid. Mohon periksa kembali seluruh kolom wajib.');
  }

  const msgId = generateSafeDocId('msg');
  const path = `contactMessages/${msgId}`;
  try {
    await setDoc(doc(db, 'contactMessages', msgId), {
      senderName: clampString(values.senderName, 120),
      senderEmail: clampString(values.senderEmail, 160),
      subject: clampString(values.subject, 200),
      message: clampString(values.message, 3000),
      status: 'new',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return msgId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateContactMessageStatus(
  msgId: string,
  status: ContactMessageItem['status']
): Promise<void> {
  const path = `contactMessages/${msgId}`;
  try {
    await updateDoc(doc(db, 'contactMessages', msgId), {
      status,
      updatedAt: serverTimestamp(),
    });
    await logAdminActivity('update', 'contactMessages', `Status pesan -> ${status}`);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function uploadMediaFile(
  file: File,
  folder: DriveUploadCategory,
  options?: {
    visibility?: DriveFileVisibility;
    signal?: AbortSignal;
    onProgress?: (snapshot: UploadProgressSnapshot) => void;
  }
): Promise<MediaAssetItem> {
  const allowedMode =
    folder === 'cv' || folder === 'documents'
      ? 'pdf'
      : folder === 'certificates' || folder === 'media' || folder === 'other'
      ? 'both'
      : 'image';

  const check = validateUploadFile(file, allowedMode);
  if (!check.valid) {
    throw new Error(check.error || 'File tidak valid.');
  }

  const processedFile = check.fileType === 'image' ? await compressImageIfNeeded(file) : file;
  const visibility: DriveFileVisibility = options?.visibility ?? 'public';

  // Stage 1, 2, & 3: Resumable upload directly to Google Drive & confirmed finalization
  const driveFile = await uploadFileToGoogleDrive({
    file: processedFile,
    category: folder,
    visibility,
    signal: options?.signal,
    onProgress: (snap) => {
      options?.onProgress?.(snap);
    },
  });

  // Save metadata to Firestore ONLY AFTER Google Drive confirms successful persistence
  const assetId = generateSafeDocId('asset');
  const uploadedBy = auth.currentUser?.uid || '';
  const assetDoc = {
    fileName: clampString(driveFile.fileName, 200),
    fileUrl: clampString(driveFile.webViewLink, 2048),
    storagePath: clampString(`gdrive://${driveFile.fileId}`, 500),
    mimeType: clampString(driveFile.mimeType, 100),
    sizeBytes: Math.max(1, Math.min(10485760, Math.round(driveFile.sizeBytes || processedFile.size))),
    folder: clampString(driveFile.folderName || folder, 80),
    uploadedBy,
    driveFileId: clampString(driveFile.fileId, 160),
    driveFolderId: clampString(driveFile.folderId, 160),
    driveFolderName: clampString(driveFile.folderName, 80),
    downloadUrl: clampString(driveFile.downloadUrl, 2048),
    visibility: driveFile.visibility,
    storageProvider: 'google_drive' as const,
    createdAt: serverTimestamp(),
  };

  try {
    await setDoc(doc(db, 'mediaAssets', assetId), assetDoc);
    await logAdminActivity('upload', 'mediaAssets', `${assetDoc.fileName} (${assetDoc.driveFolderName})`);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `mediaAssets/${assetId}`);
  }

  return {
    id: assetId,
    ...assetDoc,
    createdAt: driveFile.createdTime || new Date().toISOString(),
  };
}

export async function deleteMediaAsset(asset: MediaAssetItem): Promise<void> {
  try {
    const driveId =
      asset.driveFileId ||
      (asset.storagePath?.startsWith('gdrive://') ? asset.storagePath.slice('gdrive://'.length) : '');

    if (driveId) {
      await deleteGoogleDriveFileById(driveId).catch(() => {
        // Proceed with Firestore metadata removal even if file was already removed in Google Drive
      });
    } else if (asset.storagePath) {
      await deleteObject(storageRef(storage, asset.storagePath)).catch(() => {
        // Ignore missing legacy Firebase Storage blob if already removed or bucket inactive
      });
    }

    await deleteDoc(doc(db, 'mediaAssets', asset.id));
    await logAdminActivity('delete', 'mediaAssets', asset.fileName);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `mediaAssets/${asset.id}`);
  }
}

export async function seedInitialPortfolioToFirestore(): Promise<number> {
  const batch = writeBatch(db);
  let count = 0;

  // Profile
  const { id: _pId, createdAt: _pC, updatedAt: _pU, ...profileFields } = INITIAL_PORTFOLIO_DATA.profile;
  batch.set(doc(db, 'profile', 'main'), {
    ...profileFields,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  count++;

  // Dedicated Public Profile Snapshot (publicProfile/osama)
  if (shouldSyncPublicProfile(INITIAL_PORTFOLIO_DATA.profile)) {
    const publicProfilePayload = buildPublicProfilePayload({
      profile: INITIAL_PORTFOLIO_DATA.profile,
      education: INITIAL_PORTFOLIO_DATA.education,
      experiences: INITIAL_PORTFOLIO_DATA.experiences,
      skills: INITIAL_PORTFOLIO_DATA.skills,
    });
    batch.set(doc(db, PUBLIC_PROFILE_COLLECTION, PUBLIC_PROFILE_DOC_ID), {
      ...publicProfilePayload,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    count++;
  }

  // Contacts
  const { id: _cId, createdAt: _cC, updatedAt: _cU, ...contactFields } = INITIAL_PORTFOLIO_DATA.contacts;
  batch.set(doc(db, 'contacts', 'main'), {
    ...contactFields,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  count++;

  // Site Settings
  const { id: _sId, createdAt: _sC, updatedAt: _sU, ...settingsFields } = INITIAL_PORTFOLIO_DATA.siteSettings;
  batch.set(doc(db, 'siteSettings', 'main'), {
    ...settingsFields,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  count++;

  // Admin self-registration for the verified bootstrapped owner
  if (auth.currentUser) {
    batch.set(doc(db, 'admins', auth.currentUser.uid), {
      email: clampString(auth.currentUser.email || BOOTSTRAPPED_ADMIN_EMAIL, 160),
      displayName: clampString(auth.currentUser.displayName || 'Osama Nur Samsil', 120),
      role: 'super_admin',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    count++;
  }

  const collections: Array<{ name: ManagedCollectionName; items: Array<{ id: string } & Record<string, unknown>> }> = [
    { name: 'experiences', items: INITIAL_PORTFOLIO_DATA.experiences as unknown as Array<{ id: string } & Record<string, unknown>> },
    { name: 'organizations', items: INITIAL_PORTFOLIO_DATA.organizations as unknown as Array<{ id: string } & Record<string, unknown>> },
    { name: 'education', items: INITIAL_PORTFOLIO_DATA.education as unknown as Array<{ id: string } & Record<string, unknown>> },
    { name: 'trainings', items: INITIAL_PORTFOLIO_DATA.trainings as unknown as Array<{ id: string } & Record<string, unknown>> },
    { name: 'skills', items: INITIAL_PORTFOLIO_DATA.skills as unknown as Array<{ id: string } & Record<string, unknown>> },
    { name: 'interests', items: INITIAL_PORTFOLIO_DATA.interests as unknown as Array<{ id: string } & Record<string, unknown>> },
    { name: 'projects', items: INITIAL_PORTFOLIO_DATA.projects as unknown as Array<{ id: string } & Record<string, unknown>> },
    { name: 'publications', items: INITIAL_PORTFOLIO_DATA.publications as unknown as Array<{ id: string } & Record<string, unknown>> },
  ];

  for (const col of collections) {
    for (const item of col.items) {
      const sanitized = sanitizeEntityPayload(col.name, item);
      batch.set(doc(db, col.name, item.id), {
        ...sanitized,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      count++;
    }
  }

  try {
    await batch.commit();
    await logAdminActivity('seed', 'system', `Sinkronisasi ${count} data awal portofolio ke Firestore`);
    return count;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'batch/seedInitialPortfolio');
  }
}

export async function checkFirestoreHasData(): Promise<boolean> {
  try {
    const snap = await getDocs(
      query(collection(db, 'profile'), where('status', '==', 'published'), where('isVisible', '==', true))
    );
    return !snap.empty;
  } catch {
    return false;
  }
}
