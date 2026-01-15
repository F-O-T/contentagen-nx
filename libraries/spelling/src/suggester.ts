import type { Dictionary } from "./dictionary.ts";
import type { ParsedAffData, ReplacementRule } from "./schemas.ts";

interface ScoredSuggestion {
   word: string;
   score: number;
}

/**
 * Suggester interface - functional approach
 */
export interface Suggester {
   suggest: (word: string, limit?: number) => string[];
}

/**
 * Create a suggestion engine for generating spelling corrections
 * Optimized with string operations and early termination
 *
 * @param dictionary - Dictionary for word lookup
 * @param affData - Parsed affix file data
 * @returns Suggester object with suggest method
 */
export function createSuggester(
   dictionary: Dictionary,
   affData: ParsedAffData,
): Suggester {
   // Private state via closure
   const replacements: ReplacementRule[] = affData.replacements;
   const tryChars: string =
      affData.tryChars || "abcdefghijklmnopqrstuvwxyzáéíóúãõâêôç";

   // Build character map lookup
   const characterMaps = new Map<string, string[]>();
   for (const mapGroup of affData.characterMaps) {
      for (const char of mapGroup) {
         characterMaps.set(char, mapGroup);
      }
   }

   /**
    * Apply REP (replacement) rules to generate candidates
    */
   function* applyReplacements(word: string): Generator<string> {
      for (const rule of replacements) {
         if (rule.from && word.includes(rule.from)) {
            // Replace first occurrence
            const firstReplaced = word.replace(rule.from, rule.to);
            if (firstReplaced !== word) {
               yield firstReplaced;
            }

            // Replace all occurrences (if different)
            const allReplaced = word.split(rule.from).join(rule.to);
            if (allReplaced !== word && allReplaced !== firstReplaced) {
               yield allReplaced;
            }
         }
      }
   }

   /**
    * Apply character MAP substitutions
    * Optimized with string operations
    */
   function* applyCharacterMaps(word: string): Generator<string> {
      for (let i = 0; i < word.length; i++) {
         const char = word[i]!;
         const similarChars = characterMaps.get(char);
         if (!similarChars) continue;

         for (const replacement of similarChars) {
            if (replacement === char) continue;
            // Use string operations instead of array spread
            yield word.slice(0, i) + replacement + word.slice(i + 1);
         }
      }
   }

   /**
    * Generate all edits at distance 1
    * Optimized with direct string operations (no array copies)
    */
   function* generateEdits1(word: string): Generator<string> {
      const len = word.length;

      // Deletions - O(n)
      for (let i = 0; i < len; i++) {
         yield word.slice(0, i) + word.slice(i + 1);
      }

      // Transpositions - O(n)
      for (let i = 0; i < len - 1; i++) {
         yield word.slice(0, i) + word[i + 1] + word[i] + word.slice(i + 2);
      }

      // Replacements - O(n * |tryChars|)
      for (let i = 0; i < len; i++) {
         const char = word[i];
         for (let j = 0; j < tryChars.length; j++) {
            const c = tryChars[j]!;
            if (c !== char) {
               yield word.slice(0, i) + c + word.slice(i + 1);
            }
         }
      }

      // Insertions - O((n+1) * |tryChars|)
      for (let i = 0; i <= len; i++) {
         for (let j = 0; j < tryChars.length; j++) {
            const c = tryChars[j]!;
            yield word.slice(0, i) + c + word.slice(i);
         }
      }
   }

   /**
    * Generate edits at distance 2 lazily (on-demand)
    * Does NOT pre-collect all edit-1 results
    */
   function* generateEdits2Lazy(
      word: string,
      alreadySeen: Set<string>,
   ): Generator<string> {
      const seenEdit1 = new Set<string>();
      let edit1Count = 0;
      const maxEdit1 = 100; // Limit edit-1 iterations for performance

      // Generate edit-2 candidates lazily
      for (const edit1 of generateEdits1(word)) {
         // Skip if we've processed too many edit-1 candidates
         if (edit1Count++ > maxEdit1) break;

         // Skip if already seen (from strategies 1-3)
         if (alreadySeen.has(edit1)) continue;
         if (seenEdit1.has(edit1)) continue;
         seenEdit1.add(edit1);

         // Generate edit-2 from this edit-1
         for (const edit2 of generateEdits1Short(edit1)) {
            if (!alreadySeen.has(edit2) && !seenEdit1.has(edit2)) {
               yield edit2;
            }
         }
      }
   }

   /**
    * Shortened edit-1 generation for edit-2 (fewer operations)
    * Only does deletions, transpositions, and common replacements
    */
   function* generateEdits1Short(word: string): Generator<string> {
      const len = word.length;

      // Only deletions and transpositions for speed
      for (let i = 0; i < len; i++) {
         yield word.slice(0, i) + word.slice(i + 1);
      }

      for (let i = 0; i < len - 1; i++) {
         yield word.slice(0, i) + word[i + 1] + word[i] + word.slice(i + 2);
      }

      // Limited replacements with most common chars
      const commonChars = "aeiou";
      for (let i = 0; i < len; i++) {
         for (let j = 0; j < commonChars.length; j++) {
            const c = commonChars[j]!;
            if (c !== word[i]) {
               yield word.slice(0, i) + c + word.slice(i + 1);
            }
         }
      }
   }

   return {
      /**
       * Generate suggestions for a misspelled word
       * Uses early termination and optimized string operations
       */
      suggest(word: string, limit = 8): string[] {
         const candidates: ScoredSuggestion[] = [];
         const seen = new Set<string>();
         const lower = word.toLowerCase();
         const targetCount = limit * 2; // Collect extra to allow filtering

         // Strategy 1: REP rules (highest priority - common typos)
         for (const suggestion of applyReplacements(lower)) {
            if (candidates.length >= targetCount) break;
            if (!seen.has(suggestion) && dictionary.has(suggestion)) {
               seen.add(suggestion);
               candidates.push({ word: suggestion, score: 100 });
            }
         }

         // Strategy 2: Character MAP substitution
         if (candidates.length < targetCount) {
            for (const suggestion of applyCharacterMaps(lower)) {
               if (candidates.length >= targetCount) break;
               if (!seen.has(suggestion) && dictionary.has(suggestion)) {
                  seen.add(suggestion);
                  candidates.push({ word: suggestion, score: 90 });
               }
            }
         }

         // Strategy 3: Edit distance 1 (optimized)
         if (candidates.length < targetCount) {
            for (const suggestion of generateEdits1(lower)) {
               if (candidates.length >= targetCount) break;
               if (!seen.has(suggestion) && dictionary.has(suggestion)) {
                  seen.add(suggestion);
                  candidates.push({ word: suggestion, score: 80 });
               }
            }
         }

         // Strategy 4: Edit distance 2 (lazy generation, only if needed)
         if (candidates.length < limit) {
            for (const suggestion of generateEdits2Lazy(lower, seen)) {
               if (candidates.length >= targetCount) break;
               if (!seen.has(suggestion) && dictionary.has(suggestion)) {
                  seen.add(suggestion);
                  candidates.push({ word: suggestion, score: 60 });
               }
            }
         }

         // Sort by score (descending) and take top results
         candidates.sort((a, b) => b.score - a.score);

         // Filter out words that shouldn't be suggested
         return candidates
            .filter((c) => !dictionary.shouldNotSuggest(c.word))
            .slice(0, limit)
            .map((c) => c.word);
      },
   };
}
