/**
 * Type re-exports for convenience
 *
 * These types are also available from the main entry point,
 * but this module provides a dedicated types-only import path.
 */

export type {
	SpellCheckerConfig,
	SpellingError,
	CheckResult,
	AffixRule,
	ReplacementRule,
	ParsedAffData,
	ParsedDicData,
} from "./schemas.ts";

export type { SpellChecker } from "./spell-checker.ts";
