/**
 * Type re-exports for convenience
 *
 * These types are also available from the main entry point,
 * but this module provides a dedicated types-only import path.
 */

export type {
   AffixRule,
   CheckResult,
   ParsedAffData,
   ParsedDicData,
   ReplacementRule,
   SpellCheckerConfig,
   SpellingError,
} from "./schemas.ts";

export type { SpellChecker } from "./spell-checker.ts";
