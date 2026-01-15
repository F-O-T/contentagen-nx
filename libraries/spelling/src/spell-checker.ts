import { createDictionary } from "./dictionary.ts";
import { parseAffFile, parseDicFile } from "./hunspell-parser.ts";
import { createCache } from "./lru-cache.ts";
import type {
   CheckResult,
   ParsedAffData,
   ParsedDicData,
   SpellCheckerConfig,
   SpellingError,
} from "./schemas.ts";
import { spellCheckerConfigSchema } from "./schemas.ts";
import { createSuggester } from "./suggester.ts";
import {
   createWordRegex,
   extractWords,
   extractWordsIterator,
   generateErrorId,
   now,
   shouldIgnoreWord,
} from "./utils.ts";

/**
 * SpellChecker interface
 */
export interface SpellChecker {
   /** Check if a word is spelled correctly */
   check(word: string): boolean;

   /** Get suggestions for a misspelled word */
   suggest(word: string, limit?: number): string[];

   /** Check entire text and return errors with positions */
   checkText(text: string): CheckResult;

   /** Stream errors as they're found (for real-time UI) */
   checkTextStream(text: string): AsyncGenerator<SpellingError>;

   /** Only recheck the changed portion of text */
   checkTextIncremental(
      text: string,
      changeStart: number,
      changeEnd: number,
   ): CheckResult;

   /** Add a word to custom dictionary */
   addWord(word: string): void;

   /** Ignore a word during this session */
   ignoreWord(word: string): void;

   /** Clear all caches (call when dictionary changes) */
   clearCache(): void;

   /** Check if ready (dictionary loaded) */
   readonly isReady: boolean;

   /** Get the number of words in dictionary */
   readonly dictionarySize: number;

   /** Get cache statistics */
   readonly cacheStats: {
      checkHits: number;
      checkMisses: number;
      suggestHits: number;
      suggestMisses: number;
   };
}

/**
 * Create a new spell checker instance
 *
 * @param config - Configuration with language, AFF data, DIC data, and options
 * @returns A SpellChecker instance ready to use
 *
 * @example
 * ```typescript
 * import { createSpellChecker } from "@f-o-t/spelling";
 *
 * const checker = createSpellChecker({
 *   language: "pt",
 *   affData: affFileContent,
 *   dicData: dicFileContent,
 *   ignoreCapitalized: true,
 *   minWordLength: 3,
 *   maxSuggestions: 8,
 * });
 *
 * checker.check("palavra");      // true
 * checker.check("palavrra");     // false
 * checker.suggest("palavrra");   // ["palavra", ...]
 *
 * // Streaming API for real-time UI
 * for await (const error of checker.checkTextStream(text)) {
 *   console.log(error);
 * }
 * ```
 */
export function createSpellChecker(config: SpellCheckerConfig): SpellChecker {
   // Validate config
   const validatedConfig = spellCheckerConfigSchema.parse(config);

   // Parse AFF and DIC data (or use pre-parsed if available)
   const affData: ParsedAffData =
      validatedConfig.parsedAffData ?? parseAffFile(validatedConfig.affData!);
   const dicData: ParsedDicData =
      validatedConfig.parsedDicData ?? parseDicFile(validatedConfig.dicData!);

   // Create dependencies using functional factories
   const dictionary = createDictionary(affData, dicData);
   const suggester = createSuggester(dictionary, affData);

   // Initialize caches
   const checkCache = createCache<string, boolean>(10000); // 10k word checks
   const suggestCache = createCache<string, string[]>(1000); // 1k suggestions

   // Build ignore list
   const ignoreList = new Set(
      (validatedConfig.ignoreList ?? []).map((w) => w.toLowerCase()),
   );

   // Add custom words
   if (validatedConfig.customWords) {
      for (const word of validatedConfig.customWords) {
         dictionary.addWord(word);
      }
   }

   // Private state for cache statistics
   let checkHits = 0;
   let checkMisses = 0;
   let suggestHits = 0;
   let suggestMisses = 0;

   // Return the SpellChecker object
   return {
      check(word: string): boolean {
         // Check if word should be ignored first (fast path)
         if (
            shouldIgnoreWord(word, {
               ignoreCapitalized: validatedConfig.ignoreCapitalized,
               minWordLength: validatedConfig.minWordLength,
               ignoreList: ignoreList,
            })
         ) {
            return true;
         }

         // Check cache
         const cacheKey = word.toLowerCase();
         const cached = checkCache.get(cacheKey);
         if (cached !== undefined) {
            checkHits++;
            return cached;
         }

         // Dictionary lookup
         checkMisses++;
         const result = dictionary.has(word);
         checkCache.set(cacheKey, result);
         return result;
      },

      suggest(word: string, limit?: number): string[] {
         const maxSuggestions = limit ?? validatedConfig.maxSuggestions ?? 8;
         const cacheKey = `${word.toLowerCase()}:${maxSuggestions}`;

         // Check cache
         const cached = suggestCache.get(cacheKey);
         if (cached !== undefined) {
            suggestHits++;
            return cached;
         }

         // Generate suggestions
         suggestMisses++;
         const result = suggester.suggest(word, maxSuggestions);
         suggestCache.set(cacheKey, result);
         return result;
      },

      checkText(text: string): CheckResult {
         const startTime = now();
         const words = extractWords(text);
         const errors: SpellingError[] = [];

         for (const { word, offset } of words) {
            // Skip ignored words
            if (
               shouldIgnoreWord(word, {
                  ignoreCapitalized: validatedConfig.ignoreCapitalized,
                  minWordLength: validatedConfig.minWordLength,
                  ignoreList: ignoreList,
               })
            ) {
               continue;
            }

            // Check spelling (uses cache internally)
            if (!this.check(word)) {
               const suggestions = this.suggest(word);
               const firstSuggestion = suggestions[0] ?? word;

               errors.push({
                  id: generateErrorId(word, offset),
                  word,
                  offset,
                  length: word.length,
                  suggestions,
                  message:
                     suggestions.length > 0
                        ? `Sugestão: ${firstSuggestion}`
                        : "Palavra não encontrada no dicionário",
               });
            }
         }

         const endTime = now();

         return {
            errors,
            wordCount: words.length,
            checkTimeMs: endTime - startTime,
            hasErrors: errors.length > 0,
         };
      },

      async *checkTextStream(text: string): AsyncGenerator<SpellingError> {
         const YIELD_EVERY = 50;
         let wordCount = 0;

         // Use generator for memory efficiency - no upfront array allocation
         for (const { word, offset } of extractWordsIterator(text)) {
            // Skip ignored words
            if (
               shouldIgnoreWord(word, {
                  ignoreCapitalized: validatedConfig.ignoreCapitalized,
                  minWordLength: validatedConfig.minWordLength,
                  ignoreList: ignoreList,
               })
            ) {
               wordCount++;
               continue;
            }

            // Check spelling only - suggestions are loaded on demand
            if (!this.check(word)) {
               yield {
                  id: generateErrorId(word, offset),
                  word,
                  offset,
                  length: word.length,
                  suggestions: [], // Deferred - loaded on demand for performance
                  message: "Palavra não encontrada no dicionário",
               };
            }
            wordCount++;

            // Yield to main thread periodically
            if (wordCount % YIELD_EVERY === 0) {
               await new Promise<void>((resolve) => {
                  if (typeof requestIdleCallback !== "undefined") {
                     requestIdleCallback(() => resolve(), { timeout: 50 });
                  } else {
                     setTimeout(resolve, 0);
                  }
               });
            }
         }
      },

      checkTextIncremental(
         text: string,
         changeStart: number,
         changeEnd: number,
      ): CheckResult {
         const startTime = now();

         // Extend range to word boundaries
         // Find word start before changeStart
         let regionStart = changeStart;
         while (
            regionStart > 0 &&
            /[\p{L}\p{M}]/u.test(text[regionStart - 1] ?? "")
         ) {
            regionStart--;
         }

         // Find word end after changeEnd
         let regionEnd = changeEnd;
         while (
            regionEnd < text.length &&
            /[\p{L}\p{M}]/u.test(text[regionEnd] ?? "")
         ) {
            regionEnd++;
         }

         // Add some buffer for context (check words around the change)
         const bufferWords = 50; // characters of buffer
         regionStart = Math.max(0, regionStart - bufferWords);
         regionEnd = Math.min(text.length, regionEnd + bufferWords);

         // Extend to word boundaries again
         while (
            regionStart > 0 &&
            /[\p{L}\p{M}]/u.test(text[regionStart - 1] ?? "")
         ) {
            regionStart--;
         }
         while (
            regionEnd < text.length &&
            /[\p{L}\p{M}]/u.test(text[regionEnd] ?? "")
         ) {
            regionEnd++;
         }

         // Extract and check the region
         const regionText = text.slice(regionStart, regionEnd);
         const words = extractWords(regionText);
         const errors: SpellingError[] = [];

         for (const { word, offset: localOffset } of words) {
            const globalOffset = regionStart + localOffset;

            // Skip ignored words
            if (
               shouldIgnoreWord(word, {
                  ignoreCapitalized: validatedConfig.ignoreCapitalized,
                  minWordLength: validatedConfig.minWordLength,
                  ignoreList: ignoreList,
               })
            ) {
               continue;
            }

            // Check spelling
            if (!this.check(word)) {
               const suggestions = this.suggest(word);
               const firstSuggestion = suggestions[0] ?? word;

               errors.push({
                  id: generateErrorId(word, globalOffset),
                  word,
                  offset: globalOffset,
                  length: word.length,
                  suggestions,
                  message:
                     suggestions.length > 0
                        ? `Sugestão: ${firstSuggestion}`
                        : "Palavra não encontrada no dicionário",
               });
            }
         }

         const endTime = now();

         return {
            errors,
            wordCount: words.length,
            checkTimeMs: endTime - startTime,
            hasErrors: errors.length > 0,
         };
      },

      addWord(word: string): void {
         dictionary.addWord(word);
         // Invalidate cache for this word
         checkCache.delete(word.toLowerCase());
      },

      ignoreWord(word: string): void {
         dictionary.ignoreWord(word);
         // Invalidate cache for this word
         checkCache.delete(word.toLowerCase());
      },

      clearCache(): void {
         checkCache.clear();
         suggestCache.clear();
         checkHits = 0;
         checkMisses = 0;
         suggestHits = 0;
         suggestMisses = 0;
      },

      get isReady(): boolean {
         return true;
      },

      get dictionarySize(): number {
         return dictionary.size;
      },

      get cacheStats() {
         return {
            checkHits,
            checkMisses,
            suggestHits,
            suggestMisses,
         };
      },
   };
}
