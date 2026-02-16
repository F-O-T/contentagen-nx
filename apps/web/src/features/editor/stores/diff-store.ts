/**
 * Diff Store
 *
 * TanStack Store for managing diff view state.
 * Handles original/modified text comparison and display.
 */
import { Store, useStore } from "@tanstack/react-store";
import type { DiffLine, DiffState } from "../schemas";

const initialState: DiffState = {
   isVisible: false,
   original: "",
   modified: "",
   lines: [],
};

const diffStore = new Store<DiffState>(initialState);

// ============================================================================
// Diff Calculation
// ============================================================================

/**
 * Simple line-by-line diff algorithm
 */
function calculateDiff(original: string, modified: string): DiffLine[] {
   const originalLines = original.split("\n");
   const modifiedLines = modified.split("\n");
   const result: DiffLine[] = [];

   let oi = 0;
   let mi = 0;

   while (oi < originalLines.length || mi < modifiedLines.length) {
      const origLine = originalLines[oi];
      const modLine = modifiedLines[mi];

      if (origLine === modLine) {
         // Lines are the same
         result.push({
            type: "unchanged",
            content: origLine ?? "",
            lineNumber: mi + 1,
         });
         oi++;
         mi++;
      } else if (origLine === undefined) {
         // Line was added
         result.push({
            type: "added",
            content: modLine ?? "",
            lineNumber: mi + 1,
         });
         mi++;
      } else if (modLine === undefined) {
         // Line was removed
         result.push({
            type: "removed",
            content: origLine,
         });
         oi++;
      } else {
         // Line was changed - show as removed then added
         result.push({
            type: "removed",
            content: origLine,
         });
         result.push({
            type: "added",
            content: modLine,
            lineNumber: mi + 1,
         });
         oi++;
         mi++;
      }
   }

   return result;
}

// ============================================================================
// Actions
// ============================================================================

/**
 * Show diff with original and modified content
 */
export const showDiff = (original: string, modified: string) =>
   diffStore.setState(() => ({
      isVisible: true,
      original,
      modified,
      lines: calculateDiff(original, modified),
   }));

/**
 * Update the modified content (for streaming)
 */
export const updateDiffModified = (modified: string) =>
   diffStore.setState((state) => ({
      ...state,
      modified,
      lines: calculateDiff(state.original, modified),
   }));

/**
 * Hide the diff view
 */
export const hideDiff = () =>
   diffStore.setState(() => ({
      ...initialState,
   }));

/**
 * Toggle diff visibility
 */
export const toggleDiff = () =>
   diffStore.setState((state) => ({
      ...state,
      isVisible: !state.isVisible,
   }));

/**
 * Clear diff state
 */
export const clearDiff = () =>
   diffStore.setState(() => ({
      ...initialState,
   }));

// ============================================================================
// Hooks
// ============================================================================

/**
 * Hook to access diff state and actions
 */
export const useDiffContext = () => {
   const state = useStore(diffStore);

   return {
      ...state,
      showDiff,
      updateDiffModified,
      hideDiff,
      toggleDiff,
      clearDiff,
   };
};

/**
 * Hook to access just the diff state (for read-only consumers)
 */
export const useDiffState = () => {
   return useStore(diffStore);
};

/**
 * Get current diff state synchronously (for use outside React)
 */
export const getDiffState = () => diffStore.state;

/**
 * Subscribe to diff state changes
 */
export const subscribeDiff = (listener: (state: DiffState) => void) => {
   return diffStore.subscribe(() => listener(diffStore.state));
};

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Count additions in the diff
 */
export function countAdditions(lines: DiffLine[]): number {
   return lines.filter((l) => l.type === "added").length;
}

/**
 * Count removals in the diff
 */
export function countRemovals(lines: DiffLine[]): number {
   return lines.filter((l) => l.type === "removed").length;
}

/**
 * Check if there are any changes
 */
export function hasChanges(lines: DiffLine[]): boolean {
   return lines.some((l) => l.type !== "unchanged");
}
