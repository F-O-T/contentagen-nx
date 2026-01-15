import { conditionToRegex, parseFlags } from "./hunspell-parser.ts";
import type { AffixRule, ParsedAffData, ParsedDicData } from "./schemas.ts";

/**
 * Compiled affix rule with pre-compiled regex
 */
interface CompiledAffixRule extends AffixRule {
   compiledCondition: RegExp | null;
}

/**
 * Dictionary interface - functional approach
 */
export interface Dictionary {
   has: (word: string) => boolean;
   addWord: (word: string) => void;
   ignoreWord: (word: string) => void;
   shouldNotSuggest: (word: string) => boolean;
   hasBase: (word: string) => boolean;
   readonly size: number;
}

/**
 * Create a dictionary that stores words and handles affix expansion
 * Optimized with indexed suffix/prefix rules for fast lookup
 *
 * @param affData - Parsed affix file data
 * @param dicData - Parsed dictionary file data
 * @returns Dictionary object with lookup and mutation methods
 */
export function createDictionary(
   affData: ParsedAffData,
   dicData: ParsedDicData,
): Dictionary {
   // Private state via closure
   const wordFlags = dicData.words;
   const customWords = new Set<string>();
   const ignoredWords = new Set<string>();
   const forbiddenFlag = affData.forbiddenFlag;
   const noSuggestFlag = affData.noSuggestFlag;
   const flagType = affData.flagType;

   // Compile and store prefix rules
   const prefixRules = new Map<string, CompiledAffixRule[]>();
   const prefixByStart = new Map<string, CompiledAffixRule[]>();
   const emptyAffixPrefixRules: CompiledAffixRule[] = []; // Rules that strip only (no affix added)
   for (const [flag, rules] of Object.entries(affData.prefixRules)) {
      const compiled = rules.map((rule) => ({
         ...rule,
         compiledCondition: conditionToRegex(rule.condition, "prefix"),
      }));
      prefixRules.set(flag, compiled);

      // Index by first 1-2 chars of affix for fast lookup
      for (const rule of compiled) {
         if (rule.affix.length > 0) {
            const key1 = rule.affix[0]!;
            const key2 = rule.affix.slice(0, 2);

            if (!prefixByStart.has(key1)) {
               prefixByStart.set(key1, []);
            }
            prefixByStart.get(key1)!.push(rule);

            if (key2.length === 2 && key2 !== key1) {
               if (!prefixByStart.has(key2)) {
                  prefixByStart.set(key2, []);
               }
               prefixByStart.get(key2)!.push(rule);
            }
         } else {
            // Rules with empty affix (strip-only rules)
            emptyAffixPrefixRules.push(rule);
         }
      }
   }

   // Compile and store suffix rules with indexing
   const suffixRules = new Map<string, CompiledAffixRule[]>();
   const suffixByEnding = new Map<string, CompiledAffixRule[]>();
   const emptyAffixSuffixRules: CompiledAffixRule[] = []; // Rules that strip only (no affix added)
   for (const [flag, rules] of Object.entries(affData.suffixRules)) {
      const compiled = rules.map((rule) => ({
         ...rule,
         compiledCondition: conditionToRegex(rule.condition, "suffix"),
      }));
      suffixRules.set(flag, compiled);

      // Index by last 1-2 chars of affix for fast lookup
      for (const rule of compiled) {
         if (rule.affix.length > 0) {
            const key1 = rule.affix[rule.affix.length - 1]!;
            const key2 = rule.affix.slice(-2);

            if (!suffixByEnding.has(key1)) {
               suffixByEnding.set(key1, []);
            }
            suffixByEnding.get(key1)!.push(rule);

            if (key2.length === 2 && key2 !== key1) {
               if (!suffixByEnding.has(key2)) {
                  suffixByEnding.set(key2, []);
               }
               suffixByEnding.get(key2)!.push(rule);
            }
         } else {
            // Rules with empty affix (strip-only rules) - must always be checked
            emptyAffixSuffixRules.push(rule);
         }
      }
   }

   /**
    * Check if a word can be formed by stripping a suffix
    * Uses indexed lookup for performance
    */
   function checkWithSuffixStripping(word: string): boolean {
      if (word.length < 2) return false;

      // Get candidate rules by word ending (indexed lookup)
      const lastChar = word[word.length - 1]!;
      const last2Chars = word.slice(-2);

      const candidateRules: CompiledAffixRule[] = [];
      const seenRules = new Set<CompiledAffixRule>();

      // Collect rules that might match by affix ending
      const rules1 = suffixByEnding.get(lastChar);
      if (rules1) {
         for (const rule of rules1) {
            if (!seenRules.has(rule)) {
               seenRules.add(rule);
               candidateRules.push(rule);
            }
         }
      }

      if (last2Chars.length === 2) {
         const rules2 = suffixByEnding.get(last2Chars);
         if (rules2) {
            for (const rule of rules2) {
               if (!seenRules.has(rule)) {
                  seenRules.add(rule);
                  candidateRules.push(rule);
               }
            }
         }
      }

      // Also include empty affix rules (strip-only rules like "funcionar" -> "funciona")
      for (const rule of emptyAffixSuffixRules) {
         if (!seenRules.has(rule)) {
            seenRules.add(rule);
            candidateRules.push(rule);
         }
      }

      // Check candidate rules
      for (const rule of candidateRules) {
         // Check if the word ends with the affix (empty affix matches everything)
         if (rule.affix.length > 0 && !word.endsWith(rule.affix)) {
            continue;
         }

         // Calculate the potential stem
         const stemEnd = word.length - rule.affix.length;
         const stem = word.slice(0, stemEnd) + rule.strip;

         // Check if stem exists with this flag
         if (!wordFlags.has(stem)) {
            continue;
         }

         const stemFlags = wordFlags.get(stem)!;
         const parsedFlags = parseFlags(stemFlags, flagType);

         if (!parsedFlags.includes(rule.flag)) {
            continue;
         }

         // Check condition (must match the STEM, not the derived word)
         if (rule.compiledCondition && !rule.compiledCondition.test(stem)) {
            continue;
         }

         // Found a valid stem
         return true;
      }

      return false;
   }

   /**
    * Check if a word can be formed by stripping a prefix
    * Uses indexed lookup for performance
    */
   function checkWithPrefixStripping(word: string): boolean {
      if (word.length < 2) return false;

      // Get candidate rules by word start (indexed lookup)
      const firstChar = word[0]!;
      const first2Chars = word.slice(0, 2);

      const candidateRules: CompiledAffixRule[] = [];
      const seenRules = new Set<CompiledAffixRule>();

      // Collect rules that might match
      const rules1 = prefixByStart.get(firstChar);
      if (rules1) {
         for (const rule of rules1) {
            if (!seenRules.has(rule)) {
               seenRules.add(rule);
               candidateRules.push(rule);
            }
         }
      }

      if (first2Chars.length === 2) {
         const rules2 = prefixByStart.get(first2Chars);
         if (rules2) {
            for (const rule of rules2) {
               if (!seenRules.has(rule)) {
                  seenRules.add(rule);
                  candidateRules.push(rule);
               }
            }
         }
      }

      // Also include empty affix prefix rules (strip-only rules)
      for (const rule of emptyAffixPrefixRules) {
         if (!seenRules.has(rule)) {
            seenRules.add(rule);
            candidateRules.push(rule);
         }
      }

      // Check candidate rules
      for (const rule of candidateRules) {
         // Check if the word starts with the affix (empty affix matches everything)
         if (rule.affix.length > 0 && !word.startsWith(rule.affix)) {
            continue;
         }

         // Calculate the potential stem
         const stem = rule.strip + word.slice(rule.affix.length);

         // Check if stem exists with this flag
         if (!wordFlags.has(stem)) {
            continue;
         }

         const stemFlags = wordFlags.get(stem)!;
         const parsedFlags = parseFlags(stemFlags, flagType);

         if (!parsedFlags.includes(rule.flag)) {
            continue;
         }

         // Check condition (must match the STEM, not the derived word)
         if (rule.compiledCondition && !rule.compiledCondition.test(stem)) {
            continue;
         }

         // Found a valid stem
         return true;
      }

      return false;
   }

   return {
      /**
       * Check if a word exists in the dictionary (with affix expansion)
       */
      has(word: string): boolean {
         // Check custom words first (fastest path)
         if (customWords.has(word)) {
            return true;
         }

         // Check ignored words
         if (ignoredWords.has(word)) {
            return true;
         }

         // Direct lookup in dictionary
         if (wordFlags.has(word)) {
            const flags = wordFlags.get(word)!;
            // Check if word is forbidden
            if (forbiddenFlag && flags.includes(forbiddenFlag)) {
               return false;
            }
            return true;
         }

         // Try lowercase version
         const lower = word.toLowerCase();
         if (lower !== word && wordFlags.has(lower)) {
            return true;
         }

         // Try suffix stripping (most common in Portuguese)
         if (checkWithSuffixStripping(word)) {
            return true;
         }

         // Try prefix stripping
         if (checkWithPrefixStripping(word)) {
            return true;
         }

         // Try lowercase suffix stripping
         if (lower !== word && checkWithSuffixStripping(lower)) {
            return true;
         }

         return false;
      },

      /**
       * Add a custom word to the dictionary
       */
      addWord(word: string): void {
         customWords.add(word);
         customWords.add(word.toLowerCase());
      },

      /**
       * Add a word to the ignore list (will be treated as correct)
       */
      ignoreWord(word: string): void {
         ignoredWords.add(word);
         ignoredWords.add(word.toLowerCase());
      },

      /**
       * Check if a word should not be suggested (NOSUGGEST flag)
       */
      shouldNotSuggest(word: string): boolean {
         if (!noSuggestFlag) return false;

         const flags = wordFlags.get(word);
         return flags ? flags.includes(noSuggestFlag) : false;
      },

      /**
       * Check if a word exists in base dictionary (for suggestions)
       */
      hasBase(word: string): boolean {
         return wordFlags.has(word);
      },

      /**
       * Get the number of words in the dictionary
       */
      get size(): number {
         return wordFlags.size + customWords.size;
      },
   };
}
