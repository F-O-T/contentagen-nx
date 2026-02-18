/**
 * Editor Configuration
 *
 * Default configuration values and factory functions for the editor.
 */
import type { EditorConfig, EditorFeatures, FIMConfig } from "../schemas";

/**
 * Default editor configuration
 */
export const defaultEditorConfig: EditorConfig = {
   namespace: "contentta-editor",
   initialContent: "",
   placeholder: "Start writing...",
   editable: true,
};

/**
 * Default feature flags
 */
export const defaultEditorFeatures: EditorFeatures = {
   fim: true,
   edit: true,
   chat: true,
   spelling: true,
   diagnostics: true,
};

/**
 * Default FIM configuration with optimized timing
 */
export const defaultFIMConfig: FIMConfig = {
   debounceMs: 500, // Wait for typing pause
   punctuationDelayMs: 150, // Fast after sentence end (. ! ?)
   newlineDelayMs: 100, // Very fast after Enter
   cursorMoveDelayMs: 400, // After selection change
   editPredictionDelayMs: 700, // Intent-based trigger
   confidenceThreshold: 0.7, // Minimum confidence to show
   maxChainDepth: 5, // Max consecutive completions
};

/**
 * Spelling configuration
 */
export const spellingConfig = {
   debounceMs: 2000, // User finished editing
   batchSize: 50, // Errors per batch
   maxCacheSize: 10000, // Word validation cache
   suggestionCacheSize: 1000, // Suggestion cache
   minWordLength: 3, // Ignore short words
   maxSuggestions: 5, // Suggestions to show
   maxVisibleDecorations: 100, // Max decorations to render at once (performance)
};

/**
 * Diagnostics configuration
 */
export const diagnosticsConfig = {
   debounceMs: 150, // Near real-time counts
   wordsPerMinute: 200, // For reading time calculation
};

/**
 * FIM context configuration
 */
export const fimContextConfig = {
   maxPrefixChars: 4000, // Characters before cursor
   maxSuffixChars: 2000, // Characters after cursor
};

/**
 * Create editor configuration with overrides
 */
export function createEditorConfig(
   overrides?: Partial<EditorConfig>,
): EditorConfig {
   return {
      ...defaultEditorConfig,
      ...overrides,
   };
}

/**
 * Create feature flags with overrides
 */
export function createEditorFeatures(
   overrides?: Partial<EditorFeatures>,
): EditorFeatures {
   return {
      ...defaultEditorFeatures,
      ...overrides,
   };
}

/**
 * Create FIM configuration with overrides
 */
export function createFIMConfig(overrides?: Partial<FIMConfig>): FIMConfig {
   return {
      ...defaultFIMConfig,
      ...overrides,
   };
}

/**
 * Timing constants for various operations
 */
export const timingConstants = {
   // Ghost text rendering
   ghostTextRenderMs: 8, // Sub-frame

   // Keystroke target
   keystrokeLatencyMs: 16, // 60fps

   // FIM targets
   fimAppearanceMs: 100, // Feels instant

   // Spell check targets
   spellCheckMs: 100, // For 5k words

   // Dictionary loading
   dictionaryLoadColdMs: 500, // One-time cold load
   dictionaryLoadCachedMs: 50, // From IndexedDB

   // Word count
   wordCountMs: 50, // Debounced worker

   // Markdown conversion
   markdownConversionMs: 350, // Balance reactivity/perf
};

/**
 * Ignored words for spell checking (technical terms, abbreviations)
 */
export const spellCheckIgnoreList = [
   // Common abbreviations
   "etc",
   "vs",
   "ex",
   "ie",
   "eg",
   // Technical terms
   "api",
   "url",
   "html",
   "css",
   "http",
   "https",
   "json",
   "xml",
   "sql",
   "sdk",
   "cli",
   "gui",
   "pdf",
   "png",
   "jpg",
   "gif",
   "svg",
   // Common English words in Portuguese tech context
   "app",
   "web",
   "email",
   "online",
   "offline",
   "software",
   "hardware",
   "download",
   "upload",
   "login",
   "logout",
   "link",
   "links",
   "blog",
   "post",
   "posts",
   "site",
   "sites",
   "home",
];
