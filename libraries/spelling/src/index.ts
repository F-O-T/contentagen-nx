/**
 * @f-o-t/spelling
 *
 * A Hunspell-compatible spell checking library with Zod schemas.
 * Designed to replace typo-js with better type safety and performance.
 * Uses a fully functional approach (no classes, pure functions with closures).
 *
 * @packageDocumentation
 */

// Main API
export { createSpellChecker, type SpellChecker } from "./spell-checker.ts";

// Schemas and types
export {
	// Configuration
	spellCheckerConfigSchema,
	type SpellCheckerConfig,
	// Results
	spellingErrorSchema,
	type SpellingError,
	checkResultSchema,
	type CheckResult,
	// Parsed data (for browser caching)
	parsedAffDataSchema,
	type ParsedAffData,
	parsedDicDataSchema,
	type ParsedDicData,
} from "./schemas.ts";

// Utilities (for advanced usage)
export {
	WORD_PATTERN,
	createWordRegex,
	extractWords,
	extractWordsIterator,
	generateErrorId,
	shouldIgnoreWord,
} from "./utils.ts";

// Hunspell parser (for advanced usage)
export { parseAffFile, parseDicFile, parseFlags } from "./hunspell-parser.ts";

// Internal factories (for advanced usage and customization)
export { createCache, type Cache } from "./lru-cache.ts";
export { createDictionary, type Dictionary } from "./dictionary.ts";
export { createSuggester, type Suggester } from "./suggester.ts";
