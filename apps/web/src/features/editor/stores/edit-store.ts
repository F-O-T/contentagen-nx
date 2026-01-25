/**
 * Edit Store
 *
 * TanStack Store for managing inline edit (Ctrl+K) state.
 * Handles selection, instruction input, streaming, and diff preview.
 */
import { Store, useStore } from "@tanstack/react-store";
import type {
   EditPhase,
   EditPosition,
   EditState,
   SelectionState,
} from "../schemas";

const initialState: EditState = {
   phase: "idle",
   position: null,
   selectedText: "",
   instruction: "",
   streamedResult: "",
   originalSelection: null,
   placeholderNodeKey: null,
   editId: null,
   error: null,
};

const editStore = new Store<EditState>(initialState);

// ============================================================================
// Prompt Actions
// ============================================================================

/**
 * Open the edit prompt with selection info
 */
export const openEditPrompt = (params: {
   selectedText: string;
   position: EditPosition;
   originalSelection: SelectionState;
}) =>
   editStore.setState((state) => ({
      ...state,
      phase: "prompting",
      selectedText: params.selectedText,
      position: params.position,
      originalSelection: params.originalSelection,
      editId: crypto.randomUUID(),
      instruction: "",
      streamedResult: "",
      error: null,
   }));

/**
 * Set the instruction text
 */
export const setEditInstruction = (instruction: string) =>
   editStore.setState((state) => ({
      ...state,
      instruction,
   }));

// ============================================================================
// Streaming Actions
// ============================================================================

/**
 * Start streaming the edit result
 */
export const startEditStreaming = () =>
   editStore.setState((state) => ({
      ...state,
      phase: "streaming",
      streamedResult: "",
   }));

/**
 * Append text to the streamed result
 */
export const appendEditStreamedText = (chunk: string) =>
   editStore.setState((state) => ({
      ...state,
      streamedResult: state.streamedResult + chunk,
   }));

/**
 * Set the placeholder node key for streaming updates
 */
export const setEditPlaceholderNodeKey = (key: string | null) =>
   editStore.setState((state) => ({
      ...state,
      placeholderNodeKey: key,
   }));

// ============================================================================
// Completion Actions
// ============================================================================

/**
 * Complete the edit operation
 */
export const completeEdit = () =>
   editStore.setState((state) => ({
      ...state,
      phase: "complete",
   }));

/**
 * Accept the edit and apply changes
 */
export const acceptEdit = () =>
   editStore.setState(() => ({
      ...initialState,
   }));

/**
 * Cancel the edit operation
 */
export const cancelEdit = () =>
   editStore.setState(() => ({
      ...initialState,
   }));

/**
 * Set error state
 */
export const setEditError = (error: Error | null) =>
   editStore.setState((state) => ({
      ...state,
      error,
      phase: error ? "idle" : state.phase,
   }));

/**
 * Clear all edit state
 */
export const clearEdit = () =>
   editStore.setState(() => ({
      ...initialState,
   }));

// ============================================================================
// Hooks
// ============================================================================

/**
 * Hook to access edit state and actions
 */
export const useEditContext = () => {
   const state = useStore(editStore);

   return {
      ...state,
      openEditPrompt,
      setEditInstruction,
      startEditStreaming,
      appendEditStreamedText,
      setEditPlaceholderNodeKey,
      completeEdit,
      acceptEdit,
      cancelEdit,
      setEditError,
      clearEdit,
   };
};

/**
 * Hook to access just the edit state (for read-only consumers)
 */
export const useEditState = () => {
   return useStore(editStore);
};

/**
 * Get current edit state synchronously (for use outside React)
 */
export const getEditState = () => editStore.state;

/**
 * Subscribe to edit state changes
 */
export const subscribeEdit = (listener: (state: EditState) => void) => {
   return editStore.subscribe(() => listener(editStore.state));
};
