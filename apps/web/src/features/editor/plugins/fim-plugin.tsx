/**
 * FIM Plugin
 *
 * Lexical plugin for Fill-in-Middle AI completion.
 * Handles ghost text rendering, keyboard shortcuts, and trigger detection.
 */

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
   $getSelection,
   $isRangeSelection,
   COMMAND_PRIORITY_HIGH,
   KEY_ESCAPE_COMMAND,
   KEY_TAB_COMMAND,
} from "lexical";
import { useCallback, useEffect, useRef } from "react";
import { detectTriggerType, getTriggerDelay } from "../ai/fim";
import { handleStreamError } from "../ai/streaming";
import { defaultFIMConfig } from "../core/config";
import {
   $createGhostTextNode,
   $removeAllGhostTextNodes,
} from "../core/ghost-text-node";
import type { FIMChunk, FIMConfig, FIMRequest } from "../schemas";
import { clearFIM, getFIMState, useFIMContext } from "../stores/fim-store";

interface FIMPluginProps {
   /**
    * Function to stream FIM completions
    */
   streamFn?: (request: FIMRequest) => AsyncIterable<FIMChunk>;

   /**
    * FIM configuration overrides
    */
   config?: Partial<FIMConfig>;

   /**
    * Whether FIM is enabled
    */
   enabled?: boolean;
}

/**
 * FIM Plugin Component
 *
 * Provides Fill-in-Middle completion functionality:
 * - Auto-triggers based on typing patterns
 * - Tab to accept ghost text
 * - Escape to dismiss
 * - Ghost text rendering inline
 */
export function FIMPlugin({
   streamFn,
   config: configOverrides,
   enabled = true,
}: FIMPluginProps): null {
   const [editor] = useLexicalComposerContext();
   const fimState = useFIMContext();
   const config = { ...defaultFIMConfig, ...configOverrides };

   // Refs for debouncing and abort control
   const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
   const abortControllerRef = useRef<AbortController | null>(null);
   const lastTextRef = useRef<string>("");
   const _lastCursorRef = useRef<number>(0);

   /**
    * Cancel current completion
    */
   const cancel = useCallback(() => {
      if (debounceTimerRef.current) {
         clearTimeout(debounceTimerRef.current);
         debounceTimerRef.current = null;
      }
      if (abortControllerRef.current) {
         abortControllerRef.current.abort();
         abortControllerRef.current = null;
      }

      // Remove ghost text nodes
      editor.update(() => {
         const selection = $getSelection();
         if ($isRangeSelection(selection)) {
            $removeAllGhostTextNodes(
               selection.anchor.getNode().getTopLevelElementOrThrow(),
            );
         }
      });

      clearFIM();
   }, [editor]);

   /**
    * Accept the ghost text
    */
   const accept = useCallback(() => {
      const state = getFIMState();
      if (!state.ghostText || !state.isVisible) return false;

      editor.update(() => {
         const selection = $getSelection();
         if (!$isRangeSelection(selection)) return;

         // Remove ghost text nodes first
         const root = selection.anchor.getNode().getTopLevelElementOrThrow();
         if (root) {
            $removeAllGhostTextNodes(root);
         }

         // Insert the accepted text
         selection.insertText(state.ghostText);
      });

      clearFIM();
      return true;
   }, [editor]);

   /**
    * Trigger FIM completion
    */
   const triggerCompletion = useCallback(async () => {
      if (!enabled || !streamFn) return;

      // Get current state
      let text = "";
      let cursorPosition = 0;

      editor.getEditorState().read(() => {
         const selection = $getSelection();
         if (!$isRangeSelection(selection)) return;

         const root = selection.anchor.getNode().getTopLevelElementOrThrow();
         if (root) {
            text = root.getTextContent();
            // Calculate cursor position
            let pos = 0;
            const anchorKey = selection.anchor.key;
            const children = root.getChildren();
            for (const child of children) {
               if (child.getKey() === anchorKey) {
                  pos += selection.anchor.offset;
                  break;
               }
               pos += child.getTextContentSize();
            }
            cursorPosition = pos;
         }
      });

      if (!text) return;

      // Build request
      const prefix = text.slice(0, cursorPosition);
      const suffix = text.slice(cursorPosition);
      const triggerType = detectTriggerType(text, cursorPosition);

      const request: FIMRequest = {
         prefix,
         suffix,
         triggerType,
      };

      // Start completion - capture controller and signal locally to prevent memory leaks
      const controller = new AbortController();
      abortControllerRef.current = controller;
      const signal = controller.signal; // Capture locally before async iteration
      const completionId = crypto.randomUUID();

      fimState.startFIMSession(completionId, triggerType);
      // Set mode to cursor-tab so the panel shows Tab hint
      fimState.setFIMMode("cursor-tab");

      try {
         const chunks: string[] = []; // Use array accumulation instead of string concatenation

         for await (const chunk of streamFn(request)) {
            if (signal.aborted) return;
            if (getFIMState().completionId !== completionId) return;

            if (chunk.text) {
               chunks.push(chunk.text);
               const fullText = chunks.join("");
               fimState.appendGhostText(chunk.text);

               // Update ghost text node
               editor.update(
                  () => {
                     const selection = $getSelection();
                     if (!$isRangeSelection(selection)) return;

                     // Remove existing ghost nodes
                     const root = selection.anchor
                        .getNode()
                        .getTopLevelElementOrThrow();
                     if (root) {
                        $removeAllGhostTextNodes(root);
                     }

                     // Insert new ghost text node
                     const ghostNode = $createGhostTextNode(
                        fullText,
                        completionId,
                     );
                     selection.insertNodes([ghostNode]);
                  },
                  {
                     tag: "ghost-text-update",
                     discrete: true, // Prevents batching with other updates
                  },
               );
            }

            if (chunk.done) {
               fimState.completeFIMSession();
            }
         }
      } catch (error) {
         if (!handleStreamError(error, "FIMPlugin")) {
            cancel();
         }
      }
   }, [editor, enabled, streamFn, fimState, cancel]);

   // Register keyboard commands
   useEffect(() => {
      if (!enabled) return;

      // Tab to accept
      const removeTabCommand = editor.registerCommand(
         KEY_TAB_COMMAND,
         (event) => {
            const state = getFIMState();
            if (state.isVisible && state.ghostText) {
               event.preventDefault();
               return accept();
            }
            return false;
         },
         COMMAND_PRIORITY_HIGH,
      );

      // Escape to dismiss
      const removeEscapeCommand = editor.registerCommand(
         KEY_ESCAPE_COMMAND,
         () => {
            const state = getFIMState();
            if (state.isVisible) {
               cancel();
               return true;
            }
            return false;
         },
         COMMAND_PRIORITY_HIGH,
      );

      return () => {
         removeTabCommand();
         removeEscapeCommand();
      };
   }, [editor, enabled, accept, cancel]);

   // Listen for text changes to trigger completions
   useEffect(() => {
      if (!enabled || !streamFn) return;

      const removeListener = editor.registerTextContentListener((text) => {
         // Cancel previous
         if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
         }

         // Skip if same text
         if (text === lastTextRef.current) return;
         lastTextRef.current = text;

         // Get cursor position
         let cursorPosition = 0;
         editor.getEditorState().read(() => {
            const selection = $getSelection();
            if ($isRangeSelection(selection)) {
               cursorPosition = selection.anchor.offset;
            }
         });

         // Detect trigger type
         const triggerType = detectTriggerType(text, cursorPosition);
         const delay = getTriggerDelay(triggerType, config);

         // Schedule completion
         debounceTimerRef.current = setTimeout(() => {
            triggerCompletion();
         }, delay);
      });

      return () => {
         removeListener();
         if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
         }
      };
   }, [editor, enabled, streamFn, config, triggerCompletion]);

   // Cleanup on unmount
   useEffect(() => {
      return () => {
         cancel();
      };
   }, [cancel]);

   return null;
}
