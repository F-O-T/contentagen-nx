/**
 * @f-o-t/spelling
 *
 * A Hunspell-compatible spell checking library with Zod schemas.
 * Designed to replace typo-js with better type safety and performance.
 * Uses a fully functional approach (no classes, pure functions with closures).
 *
 * @packageDocumentation
 */

export { createDictionary, type Dictionary } from "./dictionary.ts";
// Hunspell parser (for advanced usage)
export { parseAffFile, parseDicFile, parseFlags } from "./hunspell-parser.ts";
// Internal factories (for advanced usage and customization)
export { type Cache, createCache } from "./lru-cache.ts";
// Schemas and types
export {
   type CheckResult,
   checkResultSchema,
   type ParsedAffData,
   type ParsedDicData,
   // Parsed data (for browser caching)
   parsedAffDataSchema,
   parsedDicDataSchema,
   type SpellCheckerConfig,
   type SpellingError,
   // Configuration
   spellCheckerConfigSchema,
   // Results
   spellingErrorSchema,
} from "./schemas.ts";
// Main API
export { createSpellChecker, type SpellChecker } from "./spell-checker.ts";
export { createSuggester, type Suggester } from "./suggester.ts";
// Utilities (for advanced usage)
export {
   createWordRegex,
   extractWords,
   extractWordsIterator,
   generateErrorId,
   shouldIgnoreWord,
   WORD_PATTERN,
} from "./utils.ts";
