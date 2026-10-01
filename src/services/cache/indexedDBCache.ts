/**
 * Tiered Cache Service: In-Memory L1 + IndexedDB L2
 * Implements Section 19 of the architecture specification.
 * 
 * Provides TTL-based caching for API responses, taxonomies, and creature records.
 * Gracefully degrades to purely in-memory cache if IndexedDB is not supported or blocked.
 */

export interface CacheEntry<T> {
  value: T;
  cachedAt: number;
  ttlMs: number;
}

export const CACHE_TTLS = {
  TAXONOMY: 14 * 24 * 60 * 60 * 1000,       // 14 days
  SPECIES_METADATA: 7 * 24 * 60 * 60 * 1000, // 7 days
  OCCURRENCE_COUNTS: 6 * 60 * 60 * 1000,     // 6 hours
  RECENT_OBSERVATIONS: 30 * 60 * 1000,       // 30 minutes
  WIKIDATA: 14 * 24 * 60 * 60 * 1000,        // 14 days
  PBDB_FOSSILS: 14 * 24 * 60 * 60 * 1000,    // 14 days
  PERSISTENT: 30 * 24 * 60 * 60 * 1000       // 30 days
} as const;

const DB_NAME = 'interesting_cool_creatures_db';
const STORE_NAME = 'creature_cache';
const DB_VERSION = 1;

class IndexedDBCache {
  private memoryCache = new Map<string, CacheEntry<any>>();
  private dbPromise: Promise<IDBDatabase | null> | null = null;

  constructor() {
    this.initDB();
  }

  private initDB(): Promise<IDBDatabase | null> {
    if (this.dbPromise) return this.dbPromise;

    if (typeof window === 'undefined' || !window.indexedDB) {
      this.dbPromise = Promise.resolve(null);
      return this.dbPromise;
    }

    this.dbPromise = new Promise((resolve) => {
      try {
        const request = window.indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            db.createObjectStore(STORE_NAME, { keyPath: 'key' });
          }
        };

        request.onsuccess = () => {
          resolve(request.result);
        };

        request.onerror = () => {
          console.warn('IndexedDB unavailable, falling back to in-memory caching.');
          resolve(null);
        };
      } catch (err) {
        console.warn('Failed to open IndexedDB:', err);
        resolve(null);
      }
    });

    return this.dbPromise;
  }

  async get<T>(key: string): Promise<T | null> {
    const now = Date.now();

    // 1. Check L1 Memory Cache
    const memItem = this.memoryCache.get(key);
    if (memItem) {
      if (now - memItem.cachedAt < memItem.ttlMs) {
        return memItem.value as T;
      }
      this.memoryCache.delete(key);
    }

    // 2. Check L2 IndexedDB
    try {
      const db = await this.initDB();
      if (!db) return null;

      return await new Promise<T | null>((resolve) => {
        const transaction = db.transaction(STORE_NAME, 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const req = store.get(key);

        req.onsuccess = () => {
          const record = req.result;
          if (!record) {
            resolve(null);
            return;
          }

          if (now - record.cachedAt < record.ttlMs) {
            // Repopulate memory cache
            this.memoryCache.set(key, {
              value: record.value,
              cachedAt: record.cachedAt,
              ttlMs: record.ttlMs
            });
            resolve(record.value as T);
          } else {
            // Evict expired
            this.delete(key);
            resolve(null);
          }
        };

        req.onerror = () => {
          resolve(null);
        };
      });
    } catch {
      return null;
    }
  }

  async set<T>(key: string, value: T, ttlMs: number = CACHE_TTLS.SPECIES_METADATA): Promise<void> {
    const now = Date.now();
    const entry: CacheEntry<T> = { value, cachedAt: now, ttlMs };

    // 1. Write to L1 Memory Cache
    this.memoryCache.set(key, entry);

    // 2. Write to L2 IndexedDB
    try {
      const db = await this.initDB();
      if (!db) return;

      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      store.put({ key, ...entry });
    } catch (err) {
      console.warn(`IndexedDB write failed for key "${key}":`, err);
    }
  }

  async delete(key: string): Promise<void> {
    this.memoryCache.delete(key);
    try {
      const db = await this.initDB();
      if (!db) return;
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      store.delete(key);
    } catch {
      // Ignore deletion errors
    }
  }

  async clear(): Promise<void> {
    this.memoryCache.clear();
    try {
      const db = await this.initDB();
      if (!db) return;
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      store.clear();
    } catch {
      // Ignore clear errors
    }
  }
}

export const creatureCache = new IndexedDBCache();
