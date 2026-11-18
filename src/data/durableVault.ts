import { DurableStorageStatus } from './types';
import {
  normalizeStoreShape,
  PersistedStore,
  saveStore,
  STORAGE_KEY,
} from './storage';

const IDB_NAME = 'GambleAwareVaultDB';
const IDB_STORE = 'snapshots';
const IDB_KEY = 'primary_vault';
const CACHE_NAME = 'gambleaware-vault-v1';
const CACHE_URL = '/__gambleaware_vault_backup.json';

function fnv1aHex(input: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

function utf8ToBase64Url(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function base64UrlToUtf8(b64url: string): string {
  const b64 = b64url.replace(/-/g, '+').replace(/_/g, '/');
  const pad = b64.length % 4 === 0 ? '' : '='.repeat(4 - (b64.length % 4));
  const binary = atob(b64 + pad);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

/**
 * Computes a deterministic score so recovery prefers snapshots that contain
 * user-created data (goals, custom rules, urges, PIN, lock) over fresh defaults.
 */
export function scoreStoreRichness(store: PersistedStore): number {
  const contentScore =
    store.goals.length * 100 +
    store.domains.length * 25 +
    store.blockedApps.length * 25 +
    store.urgeLogs.length * 15 +
    store.events.length * 5 +
    (store.preferredName ? 40 : 0) +
    (store.settings.pinHash ? 60 : 0) +
    (store.settings.lockUntilEpochMs > Date.now() ? 80 : 0);

  return contentScore * 1_000_000_000_000 + (store.updatedAtMs ?? 0);
}

/**
 * Encodes a complete, portable, zero-account Recovery Key (`GA1.<payload>.<checksum>`)
 * so a user can restore 100% of their streak, goals, PIN, lock timer, and rules even
 * after wiping all browser data or switching devices.
 */
export function encodeRecoveryKey(store: PersistedStore): string {
  const payloadObj: PersistedStore = {
    ...store,
    schemaVersion: 4,
    updatedAtMs: store.updatedAtMs || Date.now(),
    events: store.events.slice(0, 60),
    urgeLogs: store.urgeLogs.slice(0, 60),
  };
  const encoded = utf8ToBase64Url(JSON.stringify(payloadObj));
  const checksum = fnv1aHex(`ga1:${encoded}`);
  return `GA1.${encoded}.${checksum}`;
}

export function decodeRecoveryKey(rawKey: string): PersistedStore | null {
  const trimmed = rawKey.trim();
  const parts = trimmed.split('.');
  if (parts.length !== 3 || parts[0] !== 'GA1' || !parts[1] || !parts[2]) {
    return null;
  }
  const expectedChecksum = fnv1aHex(`ga1:${parts[1]}`);
  if (expectedChecksum !== parts[2].toLowerCase()) {
    return null;
  }
  try {
    const json = base64UrlToUtf8(parts[1]);
    const parsed = JSON.parse(json) as Partial<PersistedStore>;
    return normalizeStoreShape(parsed);
  } catch {
    return null;
  }
}

export function serializeBackupFile(store: PersistedStore): string {
  const recoveryKey = encodeRecoveryKey(store);
  return JSON.stringify(
    {
      format: 'gambleaware-recovery-vault-v1',
      origin: 'https://gbb.sidihost.sbs',
      exportedAt: new Date().toISOString(),
      recoveryKey,
      snapshot: store,
    },
    null,
    2,
  );
}

export function parseBackupInput(rawInput: string): PersistedStore | null {
  const trimmed = rawInput.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith('GA1.')) {
    return decodeRecoveryKey(trimmed);
  }

  try {
    const parsed = JSON.parse(trimmed) as {
      format?: string;
      recoveryKey?: string;
      snapshot?: Partial<PersistedStore>;
      settings?: PersistedStore['settings'];
    };
    if (typeof parsed.recoveryKey === 'string') {
      const viaKey = decodeRecoveryKey(parsed.recoveryKey);
      if (viaKey) return viaKey;
    }
    if (parsed.snapshot && typeof parsed.snapshot === 'object') {
      return normalizeStoreShape(parsed.snapshot);
    }
    if (parsed.settings && typeof parsed.settings === 'object') {
      return normalizeStoreShape(parsed as Partial<PersistedStore>);
    }
  } catch {
    return null;
  }
  return null;
}

function openVaultDb(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === 'undefined') return Promise.resolve(null);
  return new Promise((resolve) => {
    try {
      const req = indexedDB.open(IDB_NAME, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(IDB_STORE)) {
          db.createObjectStore(IDB_STORE);
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

async function writeIndexedDb(store: PersistedStore): Promise<boolean> {
  const db = await openVaultDb();
  if (!db) return false;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      tx.objectStore(IDB_STORE).put(store, IDB_KEY);
      tx.oncomplete = () => {
        db.close();
        resolve(true);
      };
      tx.onerror = () => {
        db.close();
        resolve(false);
      };
    } catch {
      db.close();
      resolve(false);
    }
  });
}

async function readIndexedDb(): Promise<PersistedStore | null> {
  const db = await openVaultDb();
  if (!db) return null;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const req = tx.objectStore(IDB_STORE).get(IDB_KEY);
      req.onsuccess = () => {
        db.close();
        if (req.result && typeof req.result === 'object') {
          resolve(normalizeStoreShape(req.result as Partial<PersistedStore>));
        } else {
          resolve(null);
        }
      };
      req.onerror = () => {
        db.close();
        resolve(null);
      };
    } catch {
      db.close();
      resolve(null);
    }
  });
}

async function writeCacheVault(store: PersistedStore): Promise<boolean> {
  if (typeof caches === 'undefined') return false;
  try {
    const cache = await caches.open(CACHE_NAME);
    const response = new Response(JSON.stringify(store), {
      headers: { 'Content-Type': 'application/json' },
    });
    await cache.put(CACHE_URL, response);
    return true;
  } catch {
    return false;
  }
}

async function readCacheVault(): Promise<PersistedStore | null> {
  if (typeof caches === 'undefined') return null;
  try {
    const cache = await caches.open(CACHE_NAME);
    const match = await cache.match(CACHE_URL);
    if (!match) return null;
    const parsed = (await match.json()) as Partial<PersistedStore>;
    return normalizeStoreShape(parsed);
  } catch {
    return null;
  }
}

export async function requestPersistentStorage(): Promise<boolean | null> {
  if (typeof navigator === 'undefined' || !navigator.storage?.persist) {
    return null;
  }
  try {
    const already = await navigator.storage.persisted?.();
    if (already) return true;
    return await navigator.storage.persist();
  } catch {
    return null;
  }
}

export async function persistToAllLayers(
  store: PersistedStore,
  persistentGranted: boolean | null = null,
): Promise<DurableStorageStatus> {
  const stamped: PersistedStore = {
    ...store,
    updatedAtMs: store.updatedAtMs || Date.now(),
  };
  saveStore(stamped);
  let localSaved = false;
  try {
    localSaved = Boolean(localStorage.getItem(STORAGE_KEY));
  } catch {
    localSaved = false;
  }

  const [indexedDbSaved, cacheVaultSaved] = await Promise.all([
    writeIndexedDb(stamped),
    writeCacheVault(stamped),
  ]);

  return {
    localSaved,
    indexedDbSaved,
    cacheVaultSaved,
    persistentGranted,
    lastSavedAtMs: stamped.updatedAtMs ?? Date.now(),
  };
}

/**
 * Self-heals across LocalStorage, IndexedDB, and CacheStorage on startup.
 * If browser cache or one storage layer was wiped, automatically restores
 * from any surviving layer and mirrors back across all three.
 */
export async function hydrateFromDurableLayers(
  currentLocal: PersistedStore,
): Promise<{
  restoredStore: PersistedStore | null;
  restoredFromLayer: 'indexeddb' | 'cache' | null;
  status: DurableStorageStatus;
}> {
  const [persistentGranted, idbStore, cacheStore] = await Promise.all([
    requestPersistentStorage(),
    readIndexedDb(),
    readCacheVault(),
  ]);

  let hasLocalRaw = false;
  try {
    hasLocalRaw = Boolean(localStorage.getItem(STORAGE_KEY));
  } catch {
    hasLocalRaw = false;
  }

  const candidates: Array<{ source: 'local' | 'indexeddb' | 'cache'; store: PersistedStore }> = [];
  if (hasLocalRaw) {
    candidates.push({ source: 'local', store: currentLocal });
  }
  if (idbStore) {
    candidates.push({ source: 'indexeddb', store: idbStore });
  }
  if (cacheStore) {
    candidates.push({ source: 'cache', store: cacheStore });
  }

  if (candidates.length === 0) {
    const status = await persistToAllLayers(currentLocal, persistentGranted);
    return { restoredStore: null, restoredFromLayer: null, status };
  }

  candidates.sort((a, b) => scoreStoreRichness(b.store) - scoreStoreRichness(a.store));
  const best = candidates[0];

  if (best.source !== 'local') {
    const status = await persistToAllLayers(best.store, persistentGranted);
    return {
      restoredStore: best.store,
      restoredFromLayer: best.source,
      status,
    };
  }

  const status = await persistToAllLayers(currentLocal, persistentGranted);
  return { restoredStore: null, restoredFromLayer: null, status };
}
