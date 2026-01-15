/**
 * Cache interface - functional approach using closures
 */
export interface Cache<K, V> {
   get: (key: K) => V | undefined;
   has: (key: K) => boolean;
   set: (key: K, value: V) => void;
   delete: (key: K) => boolean;
   clear: () => void;
   readonly size: number;
}

/**
 * Create a simple LRU (Least Recently Used) cache
 * Optimized for spell checking hot paths
 *
 * @param maxSize - Maximum number of entries to store
 * @returns Cache object with get/set/delete/clear methods
 */
export function createCache<K, V>(maxSize: number): Cache<K, V> {
   const cache = new Map<K, V>();

   return {
      /**
       * Get a value from cache, moving it to most recently used
       */
      get(key: K): V | undefined {
         const value = cache.get(key);
         if (value !== undefined) {
            // Move to end (most recently used)
            cache.delete(key);
            cache.set(key, value);
         }
         return value;
      },

      /**
       * Check if key exists without affecting LRU order
       */
      has(key: K): boolean {
         return cache.has(key);
      },

      /**
       * Set a value, evicting least recently used if at capacity
       */
      set(key: K, value: V): void {
         // If key exists, delete first to update position
         if (cache.has(key)) {
            cache.delete(key);
         } else if (cache.size >= maxSize) {
            // Evict least recently used (first item in Map)
            const firstKey = cache.keys().next().value;
            if (firstKey !== undefined) {
               cache.delete(firstKey);
            }
         }
         cache.set(key, value);
      },

      /**
       * Delete a key from cache
       */
      delete(key: K): boolean {
         return cache.delete(key);
      },

      /**
       * Clear all entries
       */
      clear(): void {
         cache.clear();
      },

      /**
       * Get current cache size
       */
      get size(): number {
         return cache.size;
      },
   };
}
