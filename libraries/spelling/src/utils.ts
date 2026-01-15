/**
 * Unicode-aware word boundary pattern
 * Matches word characters including accented letters
 */
export const WORD_PATTERN = /[\p{L}\p{M}]+/gu;

/**
 * Create a fresh regex instance to avoid shared state issues
 */
export function createWordRegex(): RegExp {
   return new RegExp(WORD_PATTERN.source, "gu");
}

/**
 * Generator-based word extraction for memory efficiency on large documents
 * Yields words one at a time instead of building full array
 */
export function* extractWordsIterator(
   text: string,
): Generator<{ word: string; offset: number }> {
   const regex = createWordRegex();
   for (const match of text.matchAll(regex)) {
      yield { word: match[0], offset: match.index };
   }
}

/**
 * Extract words from text with their positions
 * Uses matchAll() to avoid global regex state issues
 */
export function extractWords(
   text: string,
): Array<{ word: string; offset: number }> {
   // Use generator internally for consistency
   return Array.from(extractWordsIterator(text));
}

/**
 * Generate a unique ID for a spelling error
 */
export function generateErrorId(word: string, offset: number): string {
   return `spelling-${offset}-${word.slice(0, 10)}`;
}

/**
 * Check if a word should be ignored (common technical terms, etc.)
 */
export function shouldIgnoreWord(
   word: string,
   options: {
      ignoreCapitalized?: boolean;
      minWordLength?: number;
      ignoreList?: Set<string>;
   } = {},
): boolean {
   const { ignoreCapitalized = true, minWordLength = 3, ignoreList } = options;

   // Ignore very short words
   if (word.length < minWordLength) {
      return true;
   }

   // Ignore words in the ignore list
   if (ignoreList?.has(word.toLowerCase())) {
      return true;
   }

   // Ignore words that are all caps (likely acronyms)
   if (word === word.toUpperCase() && word.length <= 5) {
      return true;
   }

   // Ignore words starting with uppercase (likely proper nouns)
   if (ignoreCapitalized) {
      const firstChar = word[0];
      if (
         firstChar &&
         firstChar === firstChar.toUpperCase() &&
         word.slice(1) === word.slice(1).toLowerCase()
      ) {
         return true;
      }
   }

   // Ignore words with numbers
   if (/\d/.test(word)) {
      return true;
   }

   return false;
}

/**
 * Get the current time in milliseconds
 */
export function now(): number {
   return performance.now();
}
