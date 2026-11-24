import { getStore } from '@netlify/blobs';
import {
  decryptJsonPayload,
  encryptJsonPayload,
  parseEncryptionKey,
  type EncryptedBlob,
} from './cryptoVault.mts';

const VAULT_STORE_NAME = 'portfolio-gdrive-vault';
const TOKEN_RECORD_KEY = 'oauth-token-v1';
const FOLDER_MAP_KEY = 'folder-map-v1';
const OAUTH_STATE_PREFIX = 'oauth-state/';

export interface StoredDriveCredentials {
  refreshToken: string;
  connectedEmail: string;
  connectedAt: string;
  scope: string;
  cachedAccessToken?: string;
  cachedAccessTokenExpiresAt?: number;
}

export interface StoredFolderMap {
  rootFolderId: string;
  rootFolderName: string;
  subfolders: Record<string, string>;
  updatedAt: string;
}

interface KeyValueStore {
  getJson<T>(key: string): Promise<T | null>;
  setJson(key: string, value: unknown): Promise<void>;
  deleteKey(key: string): Promise<void>;
}

let customTestStore: KeyValueStore | null = null;

/**
 * Allows unit tests to inject an isolated in-memory store without touching Netlify Blobs.
 */
export function __setVaultStoreForTests(store: KeyValueStore | null): void {
  customTestStore = store;
}

function getVaultStore(): KeyValueStore {
  if (customTestStore) {
    return customTestStore;
  }

  try {
    const store = getStore({ name: VAULT_STORE_NAME, consistency: 'strong' });
    return {
      async getJson<T>(key: string): Promise<T | null> {
        const result = await store.get(key, { type: 'json' });
        return (result as T | null) ?? null;
      },
      async setJson(key: string, value: unknown): Promise<void> {
        await store.setJSON(key, value);
      },
      async deleteKey(key: string): Promise<void> {
        await store.delete(key);
      },
    };
  } catch (err) {
    throw new Error(
      `Penyimpanan server Netlify Blobs belum tersedia pada lingkungan ini (${err instanceof Error ? err.message : 'unknown error'}). Pastikan aplikasi berjalan di Netlify Functions.`
    );
  }
}

function getEncryptionKey(): Buffer {
  return parseEncryptionKey(process.env.GDRIVE_TOKEN_ENCRYPTION_KEY);
}

export async function saveEncryptedDriveCredentials(creds: StoredDriveCredentials): Promise<void> {
  const key = getEncryptionKey();
  const encrypted = encryptJsonPayload(creds, key);
  const store = getVaultStore();
  await store.setJson(TOKEN_RECORD_KEY, encrypted);
}

export async function loadEncryptedDriveCredentials(): Promise<StoredDriveCredentials | null> {
  const store = getVaultStore();
  const raw = await store.getJson<EncryptedBlob>(TOKEN_RECORD_KEY);
  if (!raw) return null;
  const key = getEncryptionKey();
  return decryptJsonPayload<StoredDriveCredentials>(raw, key);
}

export async function deleteDriveCredentials(): Promise<void> {
  const store = getVaultStore();
  await store.deleteKey(TOKEN_RECORD_KEY);
}

export async function saveFolderMap(map: StoredFolderMap): Promise<void> {
  const store = getVaultStore();
  await store.setJson(FOLDER_MAP_KEY, map);
}

export async function loadFolderMap(): Promise<StoredFolderMap | null> {
  const store = getVaultStore();
  return store.getJson<StoredFolderMap>(FOLDER_MAP_KEY);
}

export async function deleteFolderMap(): Promise<void> {
  const store = getVaultStore();
  await store.deleteKey(FOLDER_MAP_KEY);
}

interface OAuthStateNonceRecord {
  uid: string;
  email: string;
  exp: number;
}

export async function saveOAuthStateNonce(nonce: string, record: OAuthStateNonceRecord): Promise<void> {
  const store = getVaultStore();
  await store.setJson(`${OAUTH_STATE_PREFIX}${nonce}`, record);
}

export async function consumeOAuthStateNonce(nonce: string): Promise<OAuthStateNonceRecord | null> {
  const store = getVaultStore();
  const key = `${OAUTH_STATE_PREFIX}${nonce}`;
  const existing = await store.getJson<OAuthStateNonceRecord>(key);
  if (!existing) return null;
  await store.deleteKey(key);
  return existing;
}
