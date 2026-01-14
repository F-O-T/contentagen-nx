import { Store, useStore } from "@tanstack/react-store";
import { createLineDiff, type LineDiff } from "@packages/utils/diff";

export type DiffSource = "ai-edit" | "version-compare";

interface DiffState {
   isOpen: boolean;
   originalText: string;
   suggestedText: string;
   originalTitle: string;
   suggestedTitle: string;
   diff: LineDiff;
   source: DiffSource;
   onAccept: (() => void) | null;
   onReject: (() => void) | null;
}

const initialState: DiffState = {
   isOpen: false,
   originalText: "",
   suggestedText: "",
   originalTitle: "Original",
   suggestedTitle: "Sugerido",
   diff: [],
   source: "ai-edit",
   onAccept: null,
   onReject: null,
};

const diffStore = new Store<DiffState>(initialState);

/**
 * Show the diff view with original and suggested text
 */
export function showDiff(params: {
   originalText: string;
   suggestedText: string;
   originalTitle?: string;
   suggestedTitle?: string;
   source: DiffSource;
   onAccept: () => void;
   onReject: () => void;
}) {
   const diff = createLineDiff(params.originalText, params.suggestedText);

   diffStore.setState((state) => ({
      ...state,
      isOpen: true,
      originalText: params.originalText,
      suggestedText: params.suggestedText,
      originalTitle: params.originalTitle ?? "Original",
      suggestedTitle: params.suggestedTitle ?? "Sugerido",
      diff,
      source: params.source,
      onAccept: params.onAccept,
      onReject: params.onReject,
   }));
}

/**
 * Close the diff view without accepting or rejecting
 */
export function closeDiff() {
   diffStore.setState(() => initialState);
}

/**
 * Accept the diff changes and close
 */
export function acceptDiff() {
   const state = diffStore.state;
   state.onAccept?.();
   closeDiff();
}

/**
 * Reject the diff changes and close
 */
export function rejectDiff() {
   const state = diffStore.state;
   state.onReject?.();
   closeDiff();
}

/**
 * Hook to access diff state
 */
export function useDiffContext() {
   const state = useStore(diffStore);

   return {
      ...state,
      showDiff,
      closeDiff,
      acceptDiff,
      rejectDiff,
   };
}

/**
 * Hook to access just the diff state (for read-only consumers)
 */
export function useDiffState() {
   return useStore(diffStore);
}

/**
 * Get current diff state synchronously (for use outside React)
 */
export function getDiffState() {
   return diffStore.state;
}
