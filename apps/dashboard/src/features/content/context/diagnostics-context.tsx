import { Store, useStore } from "@tanstack/react-store";
import type {
   CursorPosition,
   DiagnosticsResult,
   EditorMode,
   SpellingGrammarError,
} from "@/features/content/types/diagnostics";

interface DiagnosticsState {
   // Diagnostics results
   spelling: SpellingGrammarError[];
   grammar: SpellingGrammarError[];
   seoScore: number | null;
   readabilityScore: number | null;
   readabilityLevel: string | null;

   // Status flags
   isChecking: boolean;
   lastCheckedAt: Date | null;

   // Cursor position
   cursor: CursorPosition;

   // Word/character counts
   wordCount: number;
   charCount: number;

   // Editor mode
   mode: EditorMode;
}

const initialState: DiagnosticsState = {
   spelling: [],
   grammar: [],
   seoScore: null,
   readabilityScore: null,
   readabilityLevel: null,
   isChecking: false,
   lastCheckedAt: null,
   cursor: { line: 1, column: 1 },
   wordCount: 0,
   charCount: 0,
   mode: "edit",
};

const diagnosticsStore = new Store<DiagnosticsState>(initialState);

/**
 * Update spelling/grammar diagnostics
 */
export const setDiagnostics = (result: DiagnosticsResult) =>
   diagnosticsStore.setState((state) => ({
      ...state,
      spelling: result.spelling,
      grammar: result.grammar,
      seoScore: result.seo?.score ?? null,
      readabilityScore: result.readability?.score ?? null,
      readabilityLevel: result.readability?.level ?? null,
      lastCheckedAt: result.checkedAt,
      isChecking: false,
   }));

/**
 * Set spelling errors
 */
export const setSpellingErrors = (errors: SpellingGrammarError[]) =>
   diagnosticsStore.setState((state) => ({
      ...state,
      spelling: errors,
   }));

/**
 * Set grammar errors
 */
export const setGrammarErrors = (errors: SpellingGrammarError[]) =>
   diagnosticsStore.setState((state) => ({
      ...state,
      grammar: errors,
   }));

/**
 * Set checking status
 */
export const setIsChecking = (isChecking: boolean) =>
   diagnosticsStore.setState((state) => ({
      ...state,
      isChecking,
   }));

/**
 * Update cursor position
 */
export const setCursorPosition = (cursor: CursorPosition) =>
   diagnosticsStore.setState((state) => ({
      ...state,
      cursor,
   }));

/**
 * Update word and character counts
 */
export const setCounts = (wordCount: number, charCount: number) =>
   diagnosticsStore.setState((state) => ({
      ...state,
      wordCount,
      charCount,
   }));

/**
 * Set editor mode
 */
export const setEditorMode = (mode: EditorMode) =>
   diagnosticsStore.setState((state) => ({
      ...state,
      mode,
   }));

/**
 * Clear all diagnostics
 */
export const clearDiagnostics = () =>
   diagnosticsStore.setState(() => ({
      ...initialState,
   }));

/**
 * Hook to access full diagnostics state
 */
export const useDiagnosticsContext = () => {
   const state = useStore(diagnosticsStore);

   return {
      ...state,
      setDiagnostics,
      setSpellingErrors,
      setGrammarErrors,
      setIsChecking,
      setCursorPosition,
      setCounts,
      setEditorMode,
      clearDiagnostics,
   };
};

/**
 * Hook to access just the diagnostics state (read-only)
 */
export const useDiagnosticsState = () => {
   return useStore(diagnosticsStore);
};

/**
 * Selector hooks for specific state slices
 */
export const useSpellingCount = () =>
   useStore(diagnosticsStore, (state) => state.spelling.length);

export const useGrammarCount = () =>
   useStore(diagnosticsStore, (state) => state.grammar.length);

export const useSeoScore = () =>
   useStore(diagnosticsStore, (state) => state.seoScore);

export const useReadabilityInfo = () =>
   useStore(diagnosticsStore, (state) => ({
      score: state.readabilityScore,
      level: state.readabilityLevel,
   }));

export const useCursorPosition = () =>
   useStore(diagnosticsStore, (state) => state.cursor);

export const useWordCount = () =>
   useStore(diagnosticsStore, (state) => state.wordCount);

export const useCharCount = () =>
   useStore(diagnosticsStore, (state) => state.charCount);

export const useIsChecking = () =>
   useStore(diagnosticsStore, (state) => state.isChecking);

export const useSpellingErrors = () =>
   useStore(diagnosticsStore, (state) => state.spelling);

/**
 * Ignore a spelling error by id
 */
export const ignoreSpellingError = (errorId: string) =>
   diagnosticsStore.setState((state) => ({
      ...state,
      spelling: state.spelling.filter((e) => e.id !== errorId),
   }));

/**
 * Get current diagnostics state synchronously (for use outside React)
 */
export const getDiagnosticsState = () => diagnosticsStore.state;
