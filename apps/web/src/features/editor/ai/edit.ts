/**
 * Edit Module
 *
 * Consolidated inline edit (Ctrl+K) functionality including:
 * - Selection handling
 * - Streaming completion
 * - Diff preview
 * - Accept/reject workflow
 */

import type { LexicalEditor } from "lexical";
import { $getSelection, $isRangeSelection } from "lexical";
import { useCallback, useEffect, useRef } from "react";
import type {
   EditChunk,
   EditPosition,
   EditRequest,
   SelectionState,
} from "../schemas";
import { hideDiff, showDiff, updateDiffModified } from "../stores/diff-store";
import {
   appendEditStreamedText,
   cancelEdit,
   clearEdit,
   completeEdit,
   getEditState,
   openEditPrompt,
   setEditError,
   setEditInstruction,
   startEditStreaming,
   useEditContext,
} from "../stores/edit-store";
import { handleStreamError } from "./streaming";

// ============================================================================
// Selection Utilities
// ============================================================================

/**
 * Get the current selection state from the editor
 */
export function getSelectionState(
   editor: LexicalEditor,
): SelectionState | null {
   let selectionState: SelectionState | null = null;

   editor.getEditorState().read(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
         selectionState = {
            anchorKey: selection.anchor.key,
            anchorOffset: selection.anchor.offset,
            focusKey: selection.focus.key,
            focusOffset: selection.focus.offset,
         };
      }
   });

   return selectionState;
}

/**
 * Get the selected text from the editor
 */
export function getSelectedText(editor: LexicalEditor): string {
   let text = "";

   editor.getEditorState().read(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
         text = selection.getTextContent();
      }
   });

   return text;
}

/**
 * Get context around the selection
 */
export function getSelectionContext(
   editor: LexicalEditor,
   maxChars = 500,
): { before: string; after: string } {
   let before = "";
   let after = "";

   editor.getEditorState().read(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return;

      const anchorNode = selection.anchor.getNode();
      const root = anchorNode.getTopLevelElementOrThrow();
      const fullText = root.getTextContent();
      const anchorOffset = selection.anchor.offset;
      const focusOffset = selection.focus.offset;

      // Get text before and after selection
      const startOffset = Math.min(anchorOffset, focusOffset);
      const endOffset = Math.max(anchorOffset, focusOffset);

      before = fullText.slice(Math.max(0, startOffset - maxChars), startOffset);
      after = fullText.slice(endOffset, endOffset + maxChars);
   });

   return { before, after };
}

/**
 * Calculate the position for the edit prompt
 */
export function calculateEditPosition(
   editor: LexicalEditor,
): EditPosition | null {
   const domSelection = window.getSelection();
   if (!domSelection || domSelection.rangeCount === 0) return null;

   const range = domSelection.getRangeAt(0);
   const rect = range.getBoundingClientRect();

   // Get editor root element for relative positioning
   const editorElement = editor.getRootElement();
   if (!editorElement) return null;

   const editorRect = editorElement.getBoundingClientRect();

   return {
      top: rect.bottom - editorRect.top + 8, // 8px below selection
      left: rect.left - editorRect.left,
   };
}

// ============================================================================
// Edit Hooks
// ============================================================================

/**
 * Hook for managing inline edit lifecycle
 */
export function useEditCompletion(editor: LexicalEditor | null) {
   const editState = useEditContext();
   const abortControllerRef = useRef<AbortController | null>(null);

   /**
    * Cancel any in-progress edit
    */
   const cancel = useCallback(() => {
      if (abortControllerRef.current) {
         abortControllerRef.current.abort();
         abortControllerRef.current = null;
      }
      cancelEdit();
      hideDiff();
   }, []);

   /**
    * Open the edit prompt with current selection
    */
   const open = useCallback(() => {
      if (!editor) return;

      const selectedText = getSelectedText(editor);
      if (!selectedText) return;

      const position = calculateEditPosition(editor);
      if (!position) return;

      const selectionState = getSelectionState(editor);
      if (!selectionState) return;

      openEditPrompt({
         selectedText,
         position,
         originalSelection: selectionState,
      });

      // Show diff with original text
      showDiff(selectedText, "");
   }, [editor]);

   /**
    * Submit the edit instruction and start streaming
    */
   const submit = useCallback(
      async (
         instruction: string,
         streamFn: (request: EditRequest) => AsyncIterable<EditChunk>,
      ) => {
         if (!editor) return;

         const state = getEditState();
         if (!state.selectedText) return;

         // Get context
         const { before, after } = getSelectionContext(editor);

         // Create request
         const request: EditRequest = {
            selectedText: state.selectedText,
            instruction,
            contextBefore: before,
            contextAfter: after,
         };

         // Start streaming - capture controller and signal locally
         startEditStreaming();
         const controller = new AbortController();
         abortControllerRef.current = controller;
         const signal = controller.signal; // Capture locally before async iteration

         const chunks: string[] = []; // Use array accumulation instead of string concatenation

         try {
            for await (const chunk of streamFn(request)) {
               if (signal.aborted) return;

               if (chunk.text) {
                  chunks.push(chunk.text);
                  const fullText = chunks.join("");
                  appendEditStreamedText(chunk.text);
                  updateDiffModified(fullText);
               }

               if (chunk.done) {
                  completeEdit();
               }
            }
         } catch (error) {
            if (!handleStreamError(error, "Edit")) {
               setEditError(
                  error instanceof Error ? error : new Error(String(error)),
               );
            }
         }
      },
      [editor],
   );

   /**
    * Accept the edit and apply changes
    */
   const accept = useCallback(() => {
      if (!editor) return;

      const state = getEditState();
      if (!state.streamedResult) return;

      editor.update(() => {
         const selection = $getSelection();
         if ($isRangeSelection(selection)) {
            // Replace selection with streamed result
            selection.insertText(state.streamedResult);
         }
      });

      clearEdit();
      hideDiff();
   }, [editor]);

   /**
    * Reject the edit and restore original
    */
   const reject = useCallback(() => {
      cancel();
   }, [cancel]);

   // Cleanup on unmount
   useEffect(() => {
      return () => {
         cancel();
      };
   }, [cancel]);

   return {
      ...editState,
      open,
      submit,
      accept,
      reject,
      cancel,
      setInstruction: setEditInstruction,
   };
}

// ============================================================================
// Keyboard Shortcuts
// ============================================================================

/**
 * Check if the edit shortcut (Ctrl+K) was pressed
 */
export function isEditShortcut(event: KeyboardEvent): boolean {
   return (event.ctrlKey || event.metaKey) && event.key === "k";
}

/**
 * Check if the accept shortcut (Ctrl+Enter) was pressed
 */
export function isAcceptShortcut(event: KeyboardEvent): boolean {
   return (event.ctrlKey || event.metaKey) && event.key === "Enter";
}

/**
 * Check if the reject shortcut (Escape) was pressed
 */
export function isRejectShortcut(event: KeyboardEvent): boolean {
   return event.key === "Escape";
}

// ============================================================================
// Edit Request Building
// ============================================================================

/**
 * Build an edit request from the current editor state
 */
export function buildEditRequest(
   editor: LexicalEditor,
   instruction: string,
): EditRequest | null {
   const selectedText = getSelectedText(editor);
   if (!selectedText) return null;

   const { before, after } = getSelectionContext(editor);

   return {
      selectedText,
      instruction,
      contextBefore: before,
      contextAfter: after,
   };
}
