import { parseAffFile, parseDicFile } from "./hunspell-parser.ts";
import type { ParsedAffData, ParsedDicData } from "./schemas.ts";

// ============================================================================
// Types
// ============================================================================

/**
 * Cached dictionary data (parsed and ready to use)
 */
export interface DictionaryData {
   /** Language code */
   language: string;
   /** Parsed AFF data */
   affData: ParsedAffData;
   /** Parsed DIC data */
   dicData: ParsedDicData;
   /** Optional version identifier */
   version?: string;
   /** When this data was cached */
   timestamp: number;
}

/**
 * Raw dictionary file contents
 */
export interface RawDictionaryFiles {
   /** Language code */
   language: string;
   /** AFF file content */
   affContent: string;
   /** DIC file content */
   dicContent: string;
}

/**
 * Storage configuration options
 */
export interface DictionaryStorageOptions {
   /** Prefix for storage keys (default: "spelling") */
   keyPrefix?: string;
   /** TTL in milliseconds for session storage (default: 30 minutes) */
   sessionTTL?: number;
   /** TTL in milliseconds for IndexedDB (default: 7 days) */
   indexedDBTTL?: number;
   /** Cache name for Cache API (default: "spelling-dictionaries") */
   cacheName?: string;
}

/**
 * Dictionary storage interface - functional approach
 */
export interface DictionaryStorage {
   // Session Storage - parsed dictionary data (fastest access)
   getFromSession: (language: string) => DictionaryData | null;
   saveToSession: (data: DictionaryData) => void;
   clearSession: (language?: string) => void;

   // IndexedDB - persisted parsed data (survives browser restart)
   getFromIndexedDB: (language: string) => Promise<DictionaryData | null>;
   saveToIndexedDB: (data: DictionaryData) => Promise<void>;
   clearIndexedDB: (language?: string) => Promise<void>;

   // Cache API - raw dictionary files (network cache)
   getCachedFile: (url: string) => Promise<string | null>;
   cacheFile: (url: string, content: string) => Promise<void>;
   clearFileCache: () => Promise<void>;

   // Environment detection
   readonly isSessionStorageAvailable: boolean;
   readonly isIndexedDBAvailable: boolean;
   readonly isCacheAPIAvailable: boolean;
}

// ============================================================================
// Factory Function
// ============================================================================

/**
 * Create a dictionary storage instance for browser caching
 *
 * @param options - Storage configuration
 * @returns DictionaryStorage object with methods for each storage tier
 *
 * @example
 * ```typescript
 * const storage = createDictionaryStorage({
 *   keyPrefix: "myapp-spelling",
 *   sessionTTL: 60 * 60 * 1000, // 1 hour
 * });
 *
 * // Check session storage first
 * const cached = storage.getFromSession("pt");
 * if (cached) {
 *   // Use cached data
 * }
 * ```
 */
export function createDictionaryStorage(
   options: DictionaryStorageOptions = {},
): DictionaryStorage {
   const {
      keyPrefix = "spelling",
      sessionTTL = 30 * 60 * 1000, // 30 minutes
      indexedDBTTL = 7 * 24 * 60 * 60 * 1000, // 7 days
      cacheName = "spelling-dictionaries",
   } = options;

   // Environment detection - works in both main thread and web workers
   // In workers: window is undefined, but indexedDB and caches are available via self
   // sessionStorage is NOT available in workers (correct behavior)
   const isSessionStorageAvailable = typeof sessionStorage !== "undefined";
   const isIndexedDBAvailable = typeof indexedDB !== "undefined";
   const isCacheAPIAvailable = typeof caches !== "undefined";

   // IndexedDB database name and store
   const DB_NAME = `${keyPrefix}-db`;
   const STORE_NAME = "dictionaries";
   const DB_VERSION = 1;

   /**
    * Open IndexedDB database
    */
   function openDatabase(): Promise<IDBDatabase> {
      return new Promise((resolve, reject) => {
         if (!isIndexedDBAvailable) {
            reject(new Error("IndexedDB is not available"));
            return;
         }

         const request = indexedDB.open(DB_NAME, DB_VERSION);

         request.onerror = () => reject(request.error);
         request.onsuccess = () => resolve(request.result);

         request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
               db.createObjectStore(STORE_NAME, { keyPath: "language" });
            }
         };
      });
   }

   // ============================================================================
   // Session Storage Implementation
   // ============================================================================

   function getFromSession(language: string): DictionaryData | null {
      if (!isSessionStorageAvailable) return null;

      try {
         const key = `${keyPrefix}-${language}`;
         const stored = sessionStorage.getItem(key);
         if (!stored) return null;

         const data = JSON.parse(stored) as DictionaryData & {
            expiry?: number;
         };

         // Check TTL
         if (data.expiry && Date.now() > data.expiry) {
            sessionStorage.removeItem(key);
            return null;
         }

         // Reconstruct Map from array (JSON serialization loses Map type)
         if (data.dicData && Array.isArray(data.dicData.words)) {
            data.dicData.words = new Map(
               data.dicData.words as unknown as [string, string][],
            );
         }

         return data;
      } catch {
         return null;
      }
   }

   function saveToSession(data: DictionaryData): void {
      if (!isSessionStorageAvailable) return;

      try {
         const key = `${keyPrefix}-${data.language}`;

         // Convert Map to array for JSON serialization
         const serializable = {
            ...data,
            dicData: {
               ...data.dicData,
               words: Array.from(data.dicData.words.entries()),
            },
            expiry: Date.now() + sessionTTL,
         };

         sessionStorage.setItem(key, JSON.stringify(serializable));
      } catch {
         // Session storage might be full or disabled
         // Silently fail - caching is best-effort
      }
   }

   function clearSession(language?: string): void {
      if (!isSessionStorageAvailable) return;

      if (language) {
         sessionStorage.removeItem(`${keyPrefix}-${language}`);
      } else {
         // Clear all items with our prefix
         const keysToRemove: string[] = [];
         for (let i = 0; i < sessionStorage.length; i++) {
            const key = sessionStorage.key(i);
            if (key?.startsWith(keyPrefix)) {
               keysToRemove.push(key);
            }
         }
         for (const key of keysToRemove) {
            sessionStorage.removeItem(key);
         }
      }
   }

   // ============================================================================
   // IndexedDB Implementation
   // ============================================================================

   async function getFromIndexedDB(
      language: string,
   ): Promise<DictionaryData | null> {
      if (!isIndexedDBAvailable) return null;

      try {
         const db = await openDatabase();
         return new Promise((resolve, reject) => {
            const transaction = db.transaction(STORE_NAME, "readonly");
            const store = transaction.objectStore(STORE_NAME);
            const request = store.get(language);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
               const data = request.result as
                  | (DictionaryData & { expiry?: number })
                  | undefined;

               if (!data) {
                  resolve(null);
                  return;
               }

               // Check TTL
               if (data.expiry && Date.now() > data.expiry) {
                  // Expired, delete it
                  const deleteTransaction = db.transaction(
                     STORE_NAME,
                     "readwrite",
                  );
                  const deleteStore = deleteTransaction.objectStore(STORE_NAME);
                  deleteStore.delete(language);
                  resolve(null);
                  return;
               }

               // Reconstruct Map from array
               if (data.dicData && Array.isArray(data.dicData.words)) {
                  data.dicData.words = new Map(
                     data.dicData.words as unknown as [string, string][],
                  );
               }

               resolve(data);
            };
         });
      } catch {
         return null;
      }
   }

   async function saveToIndexedDB(data: DictionaryData): Promise<void> {
      if (!isIndexedDBAvailable) return;

      try {
         const db = await openDatabase();
         return new Promise((resolve, reject) => {
            const transaction = db.transaction(STORE_NAME, "readwrite");
            const store = transaction.objectStore(STORE_NAME);

            // Convert Map to array for storage
            const serializable = {
               ...data,
               dicData: {
                  ...data.dicData,
                  words: Array.from(data.dicData.words.entries()),
               },
               expiry: Date.now() + indexedDBTTL,
            };

            const request = store.put(serializable);
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve();
         });
      } catch {
         // Silently fail - caching is best-effort
      }
   }

   async function clearIndexedDB(language?: string): Promise<void> {
      if (!isIndexedDBAvailable) return;

      try {
         const db = await openDatabase();
         return new Promise((resolve, reject) => {
            const transaction = db.transaction(STORE_NAME, "readwrite");
            const store = transaction.objectStore(STORE_NAME);

            let request: IDBRequest;
            if (language) {
               request = store.delete(language);
            } else {
               request = store.clear();
            }

            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve();
         });
      } catch {
         // Silently fail
      }
   }

   // ============================================================================
   // Cache API Implementation
   // ============================================================================

   async function getCachedFile(url: string): Promise<string | null> {
      if (!isCacheAPIAvailable) return null;

      try {
         const cache = await caches.open(cacheName);
         const response = await cache.match(url);
         if (!response) return null;
         return response.text();
      } catch {
         return null;
      }
   }

   async function cacheFile(url: string, content: string): Promise<void> {
      if (!isCacheAPIAvailable) return;

      try {
         const cache = await caches.open(cacheName);
         const response = new Response(content, {
            headers: { "Content-Type": "text/plain" },
         });
         await cache.put(url, response);
      } catch {
         // Silently fail
      }
   }

   async function clearFileCache(): Promise<void> {
      if (!isCacheAPIAvailable) return;

      try {
         await caches.delete(cacheName);
      } catch {
         // Silently fail
      }
   }

   return {
      getFromSession,
      saveToSession,
      clearSession,
      getFromIndexedDB,
      saveToIndexedDB,
      clearIndexedDB,
      getCachedFile,
      cacheFile,
      clearFileCache,
      isSessionStorageAvailable,
      isIndexedDBAvailable,
      isCacheAPIAvailable,
   };
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Load dictionary with multi-tier caching strategy
 *
 * Tries storage tiers in order:
 * 1. Session Storage (fastest, already parsed)
 * 2. IndexedDB (persistent, already parsed)
 * 3. Cache API (raw files from network)
 * 4. Network fetch (slowest, cold load)
 *
 * @param language - Language code (e.g., "pt", "en")
 * @param affUrl - URL to fetch AFF file from
 * @param dicUrl - URL to fetch DIC file from
 * @param storage - Optional pre-created storage instance
 * @returns Parsed dictionary data ready for createSpellChecker
 *
 * @example
 * ```typescript
 * const data = await loadDictionary(
 *   "pt",
 *   "/dictionaries/pt/pt.aff",
 *   "/dictionaries/pt/pt.dic"
 * );
 *
 * const checker = createSpellChecker({
 *   language: "pt",
 *   parsedAffData: data.affData,
 *   parsedDicData: data.dicData,
 * });
 * ```
 */
export async function loadDictionary(
   language: string,
   affUrl: string,
   dicUrl: string,
   storage?: DictionaryStorage,
): Promise<DictionaryData> {
   const store = storage ?? createDictionaryStorage();

   // Tier 1: Try session storage (fastest, already parsed)
   if (store.isSessionStorageAvailable) {
      const sessionData = store.getFromSession(language);
      if (sessionData) {
         return sessionData;
      }
   }

   // Tier 2: Try IndexedDB (persisted, already parsed)
   if (store.isIndexedDBAvailable) {
      const dbData = await store.getFromIndexedDB(language);
      if (dbData) {
         // Promote to session storage for faster subsequent access
         if (store.isSessionStorageAvailable) {
            store.saveToSession(dbData);
         }
         return dbData;
      }
   }

   // Tier 3: Try Cache API for raw files, then parse
   let affContent: string | null = null;
   let dicContent: string | null = null;

   if (store.isCacheAPIAvailable) {
      [affContent, dicContent] = await Promise.all([
         store.getCachedFile(affUrl),
         store.getCachedFile(dicUrl),
      ]);
   }

   // Tier 4: Fetch from network if not cached
   if (!affContent || !dicContent) {
      const [affResponse, dicResponse] = await Promise.all([
         fetch(affUrl),
         fetch(dicUrl),
      ]);

      if (!affResponse.ok || !dicResponse.ok) {
         throw new Error(`Failed to load dictionary files for ${language}`);
      }

      affContent = await affResponse.text();
      dicContent = await dicResponse.text();

      // Cache raw files for next time
      if (store.isCacheAPIAvailable) {
         await Promise.all([
            store.cacheFile(affUrl, affContent),
            store.cacheFile(dicUrl, dicContent),
         ]);
      }
   }

   // Parse dictionary files
   const affData = parseAffFile(affContent);
   const dicData = parseDicFile(dicContent);

   const dictionaryData: DictionaryData = {
      language,
      affData,
      dicData,
      timestamp: Date.now(),
   };

   // Save parsed data to caches
   if (store.isIndexedDBAvailable) {
      await store.saveToIndexedDB(dictionaryData);
   }
   if (store.isSessionStorageAvailable) {
      store.saveToSession(dictionaryData);
   }

   return dictionaryData;
}

/**
 * Load dictionary from cache only (no network fetch)
 *
 * @param language - Language code
 * @param storage - Optional pre-created storage instance
 * @returns Cached dictionary data, or null if not cached
 *
 * @example
 * ```typescript
 * const cached = await loadDictionaryFromCache("pt");
 * if (cached) {
 *   // Use cached data - fast path
 * } else {
 *   // Need to fetch from network
 * }
 * ```
 */
export async function loadDictionaryFromCache(
   language: string,
   storage?: DictionaryStorage,
): Promise<DictionaryData | null> {
   const store = storage ?? createDictionaryStorage();

   // Try session storage first
   if (store.isSessionStorageAvailable) {
      const sessionData = store.getFromSession(language);
      if (sessionData) return sessionData;
   }

   // Try IndexedDB
   if (store.isIndexedDBAvailable) {
      const dbData = await store.getFromIndexedDB(language);
      if (dbData) {
         if (store.isSessionStorageAvailable) {
            store.saveToSession(dbData);
         }
         return dbData;
      }
   }

   return null;
}

/**
 * Save dictionary data to cache
 *
 * @param data - Dictionary data to cache
 * @param storage - Optional pre-created storage instance
 *
 * @example
 * ```typescript
 * const data = { language: "pt", affData, dicData, timestamp: Date.now() };
 * await saveDictionaryToCache(data);
 * ```
 */
export async function saveDictionaryToCache(
   data: DictionaryData,
   storage?: DictionaryStorage,
): Promise<void> {
   const store = storage ?? createDictionaryStorage();

   if (store.isSessionStorageAvailable) {
      store.saveToSession(data);
   }
   if (store.isIndexedDBAvailable) {
      await store.saveToIndexedDB(data);
   }
}

/**
 * Clear all cached dictionary data
 *
 * @param language - Optional specific language to clear, or all if not provided
 * @param storage - Optional pre-created storage instance
 */
export async function clearDictionaryCache(
   language?: string,
   storage?: DictionaryStorage,
): Promise<void> {
   const store = storage ?? createDictionaryStorage();

   store.clearSession(language);
   await store.clearIndexedDB(language);
   if (!language) {
      await store.clearFileCache();
   }
}
