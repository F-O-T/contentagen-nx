/**
 * Diagnostics Store
 *
 * TanStack Store for managing content diagnostics state.
 * Handles word count, character count, reading time, spelling errors, etc.
 */
import { Store, useStore } from "@tanstack/react-store";
import type { DiagnosticsState, SpellingError } from "../schemas";

const initialState: DiagnosticsState = {
   wordCount: 0,
   charCount: 0,
   readingTimeMinutes: 0,
   paragraphCount: 0,
   sentenceCount: 0,
   isCalculating: false,
   spellingErrors: [],
   grammarErrors: [],
   isCheckingSpelling: false,
};

const diagnosticsStore = new Store<DiagnosticsState>(initialState);

// ============================================================================
// Update Actions
// ============================================================================

/**
 * Set word and character counts
 */
export const setDiagnosticsCounts = (wordCount: number, charCount: number) =>
   diagnosticsStore.setState((state) => ({
      ...state,
      wordCount,
      charCount,
      readingTimeMinutes: Math.ceil(wordCount / 200), // 200 WPM
   }));

/**
 * Set all diagnostics at once
 */
export const setDiagnostics = (diagnostics: Partial<DiagnosticsState>) =>
   diagnosticsStore.setState((state) => ({
      ...state,
      ...diagnostics,
   }));

/**
 * Set paragraph count
 */
export const setParagraphCount = (paragraphCount: number) =>
   diagnosticsStore.setState((state) => ({
      ...state,
      paragraphCount,
   }));

/**
 * Set sentence count
 */
export const setSentenceCount = (sentenceCount: number) =>
   diagnosticsStore.setState((state) => ({
      ...state,
      sentenceCount,
   }));

/**
 * Set calculating state
 */
export const setDiagnosticsCalculating = (isCalculating: boolean) =>
   diagnosticsStore.setState((state) => ({
      ...state,
      isCalculating,
   }));

/**
 * Set spelling errors
 */
export const setSpellingErrors = (spellingErrors: SpellingError[]) =>
   diagnosticsStore.setState((state) => ({
      ...state,
      spellingErrors,
   }));

/**
 * Set grammar errors
 */
export const setGrammarErrors = (grammarErrors: string[]) =>
   diagnosticsStore.setState((state) => ({
      ...state,
      grammarErrors,
   }));

/**
 * Set checking spelling state
 */
export const setCheckingSpelling = (isCheckingSpelling: boolean) =>
   diagnosticsStore.setState((state) => ({
      ...state,
      isCheckingSpelling,
   }));

/**
 * Reset diagnostics to initial state
 */
export const resetDiagnostics = () =>
   diagnosticsStore.setState(() => ({
      ...initialState,
   }));

// ============================================================================
// Hooks
// ============================================================================

/**
 * Hook to access diagnostics state and actions
 */
export const useDiagnosticsContext = () => {
   const state = useStore(diagnosticsStore);

   return {
      ...state,
      setDiagnosticsCounts,
      setDiagnostics,
      setParagraphCount,
      setSentenceCount,
      setDiagnosticsCalculating,
      setSpellingErrors,
      setGrammarErrors,
      setCheckingSpelling,
      resetDiagnostics,
   };
};

/**
 * Hook to access just the diagnostics state (for read-only consumers)
 */
export const useDiagnosticsState = () => {
   return useStore(diagnosticsStore);
};

/**
 * Hook to access spelling error count
 */
export const useSpellingCount = () => {
   return useStore(diagnosticsStore, (state) => state.spellingErrors.length);
};

/**
 * Hook to access grammar error count
 */
export const useGrammarCount = () => {
   return useStore(diagnosticsStore, (state) => state.grammarErrors.length);
};

/**
 * Hook to check if spelling is being checked
 */
export const useIsCheckingSpelling = () => {
   return useStore(diagnosticsStore, (state) => state.isCheckingSpelling);
};

/**
 * Get current diagnostics state synchronously (for use outside React)
 */
export const getDiagnosticsState = () => diagnosticsStore.state;

/**
 * Subscribe to diagnostics state changes
 */
export const subscribeDiagnostics = (
   listener: (state: DiagnosticsState) => void,
) => {
   return diagnosticsStore.subscribe(() => listener(diagnosticsStore.state));
};
