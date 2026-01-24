/**
 * Edit Plugin
 *
 * Lexical plugin for inline AI editing (Ctrl+K).
 * Handles selection, prompt input, and streamed replacements.
 */

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
   $getSelection,
   $isRangeSelection,
   COMMAND_PRIORITY_HIGH,
   KEY_ESCAPE_COMMAND,
} from "lexical";
import { useCallback, useEffect, useRef } from "react";
import {
   calculateEditPosition,
   getSelectedText,
   getSelectionContext,
   getSelectionState,
   isAcceptShortcut,
   isEditShortcut,
   isRejectShortcut,
} from "../ai/edit";
import { handleStreamError } from "../ai/streaming";
import type { EditChunk, EditRequest } from "../schemas";
import { hideDiff, showDiff, updateDiffModified } from "../stores/diff-store";
import {
   cancelEdit,
   clearEdit,
   getEditState,
   useEditContext,
} from "../stores/edit-store";

interface EditPluginProps {
   /**
    * Function to stream edit completions
    */
   streamFn?: (request: EditRequest) => AsyncIterable<EditChunk>;

   /**
    * Whether edit is enabled
    */
   enabled?: boolean;

   /**
    * Callback when edit prompt opens
    */
   onOpen?: () => void;

   /**
    * Callback when edit is accepted
    */
   onAccept?: (original: string, result: string) => void;

   /**
    * Callback when edit is rejected
    */
   onReject?: () => void;
}

/**
 * Edit Plugin Component
 *
 * Provides inline AI editing:
 * - Ctrl+K to open edit prompt with selection
 * - Type instruction and press Enter to stream
 * - Ctrl+Enter to accept, Escape to reject
 */
export function EditPlugin({
   streamFn,
   enabled = true,
   onOpen,
   onAccept,
   onReject,
}: EditPluginProps): null {
   const [editor] = useLexicalComposerContext();
   const editState = useEditContext();
   const abortControllerRef = useRef<AbortController | null>(null);

   /**
    * Cancel current edit
    */
   const cancel = useCallback(() => {
      if (abortControllerRef.current) {
         abortControllerRef.current.abort();
         abortControllerRef.current = null;
      }
      cancelEdit();
      hideDiff();
      onReject?.();
   }, [onReject]);

   /**
    * Open the edit prompt
    */
   const openPrompt = useCallback(() => {
      if (!enabled) return false;

      const selectedText = getSelectedText(editor);
      if (!selectedText || selectedText.length < 1) {
         console.warn("[EditPlugin] No text selected for Ctrl+K");
         return false;
      }

      const position = calculateEditPosition(editor);
      if (!position) {
         console.warn("[EditPlugin] Could not calculate edit position");
         return false;
      }

      const selectionState = getSelectionState(editor);
      if (!selectionState) {
         console.warn("[EditPlugin] Could not get selection state");
         return false;
      }

      editState.openEditPrompt({
         selectedText,
         position,
         originalSelection: selectionState,
      });

      // Initialize diff view
      showDiff(selectedText, "");

      onOpen?.();
      return true;
   }, [editor, enabled, editState, onOpen]);

   /**
    * Submit the edit instruction
    */
   const submitEdit = useCallback(
      async (instruction: string) => {
         if (!streamFn) return;

         const state = getEditState();
         if (!state.selectedText) return;

         const { before, after } = getSelectionContext(editor);

         const request: EditRequest = {
            selectedText: state.selectedText,
            instruction,
            contextBefore: before,
            contextAfter: after,
         };

         editState.startEditStreaming();
         // Capture controller and signal locally to prevent memory leaks
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
                  editState.appendEditStreamedText(chunk.text);
                  updateDiffModified(fullText);
               }

               if (chunk.done) {
                  editState.completeEdit();
               }
            }
         } catch (error) {
            if (!handleStreamError(error, "EditPlugin")) {
               editState.setEditError(
                  error instanceof Error ? error : new Error(String(error)),
               );
            }
         }
      },
      [editor, streamFn, editState],
   );

   /**
    * Accept the edit
    */
   const acceptEdit = useCallback(() => {
      const state = getEditState();
      if (!state.streamedResult || state.phase !== "complete") return false;

      editor.update(() => {
         const selection = $getSelection();
         if ($isRangeSelection(selection)) {
            selection.insertText(state.streamedResult);
         }
      });

      onAccept?.(state.selectedText, state.streamedResult);
      clearEdit();
      hideDiff();
      return true;
   }, [editor, onAccept]);

   // Register keyboard shortcuts
   useEffect(() => {
      if (!enabled) return;

      const handleKeyDown = (event: KeyboardEvent) => {
         const state = getEditState();

         // Ctrl+K to open - use RAF to ensure DOM selection is reflected in Lexical
         if (isEditShortcut(event) && state.phase === "idle") {
            event.preventDefault();
            // Use requestAnimationFrame to ensure selection state is synced
            requestAnimationFrame(() => {
               openPrompt();
            });
            return;
         }

         // Ctrl+Enter to accept
         if (isAcceptShortcut(event) && state.phase === "complete") {
            event.preventDefault();
            acceptEdit();
            return;
         }

         // Escape to cancel
         if (isRejectShortcut(event) && state.phase !== "idle") {
            event.preventDefault();
            cancel();
            return;
         }
      };

      // Listen on document for global shortcuts
      document.addEventListener("keydown", handleKeyDown);

      return () => {
         document.removeEventListener("keydown", handleKeyDown);
      };
   }, [enabled, openPrompt, acceptEdit, cancel]);

   // Register Escape command in Lexical
   useEffect(() => {
      if (!enabled) return;

      const removeEscapeCommand = editor.registerCommand(
         KEY_ESCAPE_COMMAND,
         () => {
            const state = getEditState();
            if (state.phase !== "idle") {
               cancel();
               return true;
            }
            return false;
         },
         COMMAND_PRIORITY_HIGH,
      );

      return () => {
         removeEscapeCommand();
      };
   }, [editor, enabled, cancel]);

   // Cleanup on unmount
   useEffect(() => {
      return () => {
         cancel();
      };
   }, [cancel]);

   // Export submit function for external use
   useEffect(() => {
      // @ts-expect-error - Attaching to editor for external access
      editor.__editPlugin = {
         submit: submitEdit,
         accept: acceptEdit,
         cancel,
         open: openPrompt,
      };

      return () => {
         // @ts-expect-error - Cleanup
         delete editor.__editPlugin;
      };
   }, [editor, submitEdit, acceptEdit, cancel, openPrompt]);

   return null;
}
