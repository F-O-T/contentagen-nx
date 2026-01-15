import { z } from "zod";

// ============================================================================
// Configuration Schemas
// ============================================================================

/**
 * Configuration for creating a spell checker instance
 *
 * You can provide either:
 * - Raw AFF/DIC data strings (affData + dicData) - will be parsed on creation
 * - Pre-parsed data (parsedAffData + parsedDicData) - skips parsing, faster initialization
 */
export const spellCheckerConfigSchema = z
   .object({
      /** Language code (e.g., 'pt', 'en') */
      language: z.string().min(2).max(10),
      /** AFF file content (raw string) */
      affData: z.string().optional(),
      /** DIC file content (raw string) */
      dicData: z.string().optional(),
      /** Pre-parsed AFF data (for faster initialization from cache) */
      parsedAffData: z.lazy(() => parsedAffDataSchema).optional(),
      /** Pre-parsed DIC data (for faster initialization from cache) */
      parsedDicData: z.lazy(() => parsedDicDataSchema).optional(),
      /** Custom words to add to dictionary */
      customWords: z.array(z.string()).optional(),
      /** Words to ignore during checking */
      ignoreList: z.array(z.string()).optional(),
      /** Whether to ignore words starting with uppercase (proper nouns) */
      ignoreCapitalized: z.boolean().optional().default(true),
      /** Minimum word length to check */
      minWordLength: z.number().int().min(1).optional().default(3),
      /** Maximum suggestions to return */
      maxSuggestions: z.number().int().min(1).max(20).optional().default(8),
   })
   .refine(
      (data) =>
         (data.affData !== undefined && data.dicData !== undefined) ||
         (data.parsedAffData !== undefined && data.parsedDicData !== undefined),
      {
         message:
            "Must provide either raw data (affData + dicData) or pre-parsed data (parsedAffData + parsedDicData)",
      },
   );

// ============================================================================
// Result Schemas
// ============================================================================

/**
 * A single spelling error found in text
 */
export const spellingErrorSchema = z.object({
   /** Unique identifier for this error */
   id: z.string(),
   /** The misspelled word */
   word: z.string(),
   /** Character offset in original text */
   offset: z.number().int().min(0),
   /** Length of the misspelled word */
   length: z.number().int().min(1),
   /** Suggested corrections */
   suggestions: z.array(z.string()),
   /** Error message for display */
   message: z.string().optional(),
});

/**
 * Result of checking text for spelling errors
 */
export const checkResultSchema = z.object({
   /** Array of spelling errors found */
   errors: z.array(spellingErrorSchema),
   /** Number of words checked */
   wordCount: z.number().int().min(0),
   /** Time taken to check (ms) */
   checkTimeMs: z.number().min(0),
   /** Whether the text has any errors */
   hasErrors: z.boolean(),
});

// ============================================================================
// Internal Schemas (for Hunspell parsing)
// ============================================================================

/**
 * An affix rule (prefix or suffix)
 */
export const affixRuleSchema = z.object({
   /** Flag character(s) that trigger this rule */
   flag: z.string(),
   /** Whether this affix can combine with other affixes */
   crossProduct: z.boolean(),
   /** Characters to strip from the word before applying affix */
   strip: z.string(),
   /** Characters to add as affix */
   affix: z.string(),
   /** Condition pattern (regex) for when to apply */
   condition: z.string().nullable(),
});

/**
 * A replacement suggestion rule
 */
export const replacementRuleSchema = z.object({
   /** Pattern to match */
   from: z.string(),
   /** Replacement string */
   to: z.string(),
});

/**
 * Parsed AFF file data
 */
export const parsedAffDataSchema = z.object({
   /** Character encoding */
   encoding: z.string().default("UTF-8"),
   /** Flag type (how flags are represented) */
   flagType: z.enum(["ASCII", "UTF-8", "long", "num"]).default("UTF-8"),
   /** Characters to try first when suggesting (priority order) */
   tryChars: z.string(),
   /** Character similarity maps for suggestions */
   characterMaps: z.array(z.array(z.string())),
   /** Replacement rules for common typos */
   replacements: z.array(replacementRuleSchema),
   /** Prefix rules indexed by flag */
   prefixRules: z.record(z.string(), z.array(affixRuleSchema)),
   /** Suffix rules indexed by flag */
   suffixRules: z.record(z.string(), z.array(affixRuleSchema)),
   /** Flag for forbidden words */
   forbiddenFlag: z.string().optional(),
   /** Flag for words not to suggest */
   noSuggestFlag: z.string().optional(),
   /** Word break patterns */
   breakPatterns: z.array(z.string()),
});

/**
 * Parsed DIC file data
 */
export const parsedDicDataSchema = z.object({
   /** Total word count */
   wordCount: z.number().int().min(0),
   /** Map of word to its affix flags */
   words: z.map(z.string(), z.string()),
});

// ============================================================================
// Type Exports
// ============================================================================

export type SpellCheckerConfig = z.infer<typeof spellCheckerConfigSchema>;
export type SpellingError = z.infer<typeof spellingErrorSchema>;
export type CheckResult = z.infer<typeof checkResultSchema>;
export type AffixRule = z.infer<typeof affixRuleSchema>;
export type ReplacementRule = z.infer<typeof replacementRuleSchema>;
export type ParsedAffData = z.infer<typeof parsedAffDataSchema>;
export type ParsedDicData = z.infer<typeof parsedDicDataSchema>;
