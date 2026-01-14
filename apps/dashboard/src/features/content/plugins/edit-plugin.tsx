"use client";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
   $convertFromMarkdownString,
   $convertToMarkdownString,
} from "@lexical/markdown";
import {
   $getRoot,
   $getSelection,
   $isRangeSelection,
   $isTextNode,
   COMMAND_PRIORITY_HIGH,
   KEY_ESCAPE_COMMAND,
   type LexicalNode,
   type RangeSelection,
} from "lexical";
import { useCallback, useEffect, useRef } from "react";
import {
   appendEditStreamedText,
   cancelEdit,
   clearEdit,
   completeEdit,
   openEditPrompt,
   startEditStreaming,
   useEditContext,
} from "../context/edit-context";
import { showDiff } from "../context/diff-context";
import { useEditCompletion } from "../hooks/use-edit-completion";
import { $isGhostTextNode } from "../nodes/ghost-text-node";
import { EXTENDED_TRANSFORMERS } from "../ui/content-editor";
import { EditPromptPanel } from "../ui/edit-prompt-panel";

interface EditPluginProps {
   containerRef: React.RefObject<HTMLDivElement | null>;
}

/**
 * Edit Plugin for Ctrl+K agentic text editing with diff preview.
 *
 * Flow:
 * 1. User selects text and presses Ctrl+K
 * 2. Floating prompt appears for edit instruction
 * 3. User enters instruction and presses Enter
 * 4. AI generates edited text (streamed but collected)
 * 5. Diff view shows original vs suggested
 * 6. User accepts (apply changes) or rejects (keep original)
 *
 * Controls:
 * - Ctrl+K: Open edit prompt (with selection)
 * - Enter: Submit instruction
 * - Escape: Cancel/dismiss
 * - In Diff: Ctrl+Enter to accept, Escape to reject
 */
export function EditPlugin({ containerRef }: EditPluginProps) {
   const [editor] = useLexicalComposerContext();
   const { phase, position, selectedText, originalSelection } =
      useEditContext();

   const fullTextRef = useRef("");
   const selectionRef = useRef<RangeSelection | null>(null);

   // Calculate position relative to container
   const getSelectionPosition = useCallback(() => {
      const container = containerRef.current;
      if (!container) return null;

      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return null;

      const range = selection.getRangeAt(0);
      const containerRect = container.getBoundingClientRect();
      const rangeRect = range.getBoundingClientRect();

      return {
         top: rangeRect.top - containerRect.top,
         left: rangeRect.left - containerRect.left,
      };
   }, [containerRef]);

   // Get full document text for context
   const getDocumentContext = useCallback(() => {
      let fullText = "";
      let selectionStart = 0;
      let selectionEnd = 0;

      editor.getEditorState().read(() => {
         const root = $getRoot();
         const selection = $getSelection();

         // Get all text content
         const getTextWithoutGhost = (node: LexicalNode): string => {
            if ($isGhostTextNode(node)) return "";
            if ($isTextNode(node)) return node.getTextContent();
            if ("getChildren" in node) {
               const children = (
                  node as { getChildren: () => LexicalNode[] }
               ).getChildren();
               return children.map(getTextWithoutGhost).join("");
            }
            return "";
         };
         fullText = getTextWithoutGhost(root);

         // Calculate selection offsets
         if ($isRangeSelection(selection)) {
            let currentOffset = 0;
            let foundStart = false;
            let foundEnd = false;

            const walkNode = (node: LexicalNode) => {
               if (foundStart && foundEnd) return;
               if ($isGhostTextNode(node)) return;

               if ($isTextNode(node)) {
                  const nodeKey = node.getKey();
                  const textLength = node.getTextContentSize();

                  if (nodeKey === selection.anchor.key && !foundStart) {
                     selectionStart = currentOffset + selection.anchor.offset;
                     foundStart = true;
                  }
                  if (nodeKey === selection.focus.key && !foundEnd) {
                     selectionEnd = currentOffset + selection.focus.offset;
                     foundEnd = true;
                  }

                  currentOffset += textLength;
               }

               if ("getChildren" in node) {
                  const children = (
                     node as { getChildren: () => LexicalNode[] }
                  ).getChildren();
                  for (const child of children) {
                     walkNode(child);
                  }
               }
            };

            walkNode(root);

            // Ensure start < end
            if (selectionStart > selectionEnd) {
               [selectionStart, selectionEnd] = [selectionEnd, selectionStart];
            }
         }
      });

      return {
         fullText,
         contextBefore: fullText.slice(0, selectionStart),
         contextAfter: fullText.slice(selectionEnd),
      };
   }, [editor]);

   // Handle streaming chunk - just collect, don't modify document
   const handleChunk = useCallback((chunk: string) => {
      appendEditStreamedText(chunk);
      fullTextRef.current += chunk;
   }, []);

   // Handle streaming complete - show diff view
   const handleComplete = useCallback(
      (_fullText: string) => {
         const suggestedText = fullTextRef.current.trim();
         const originalText = selectedText;

         // Show diff view for user to accept or reject
         showDiff({
            originalText,
            suggestedText,
            originalTitle: "Original",
            suggestedTitle: "Sugerido pela IA",
            source: "ai-edit",
            onAccept: () => {
               // Apply the edit to the document
               editor.update(
                  () => {
                     // Restore selection if we have it
                     if (originalSelection) {
                        // Get full document markdown, replace selection, re-render
                        const root = $getRoot();
                        const markdown = $convertToMarkdownString(
                           EXTENDED_TRANSFORMERS,
                        );

                        // Replace the original text with suggested text in markdown
                        const newMarkdown = markdown.replace(
                           originalText,
                           suggestedText,
                        );

                        root.clear();
                        $convertFromMarkdownString(
                           newMarkdown,
                           EXTENDED_TRANSFORMERS,
                        );
                     }
                  },
                  { tag: "edit-apply" },
               );

               completeEdit();
               setTimeout(() => clearEdit(), 100);
            },
            onReject: () => {
               // Just clear the edit state, document unchanged
               cancelEdit();
            },
         });

         // Move to complete phase while diff is shown
         completeEdit();
      },
      [editor, selectedText, originalSelection],
   );

   // Handle error
   const handleError = useCallback((error: Error) => {
      console.error("Edit error:", error);
      clearEdit();
   }, []);

   const { requestEdit, cancelEdit: cancelEditRequest } = useEditCompletion({
      onChunk: handleChunk,
      onComplete: handleComplete,
      onError: handleError,
   });

   // Handle submit instruction
   const handleSubmit = useCallback(
      (instruction: string) => {
         if (!selectedText) return;

         // Reset streaming state
         fullTextRef.current = "";

         // Store current selection for later restoration
         editor.getEditorState().read(() => {
            const selection = $getSelection();
            if ($isRangeSelection(selection)) {
               selectionRef.current = selection.clone();
            }
         });

         startEditStreaming();

         // Get context for the edit
         const { contextBefore, contextAfter } = getDocumentContext();

         // Request the edit
         requestEdit({
            selectedText,
            instruction,
            contextBefore: contextBefore.slice(-500), // Limit context size
            contextAfter: contextAfter.slice(0, 200),
            maxTokens: 512,
            temperature: 0.3,
         });
      },
      [selectedText, getDocumentContext, requestEdit, editor],
   );

   // Handle cancel
   const handleCancel = useCallback(() => {
      cancelEditRequest();
      cancelEdit();
   }, [cancelEditRequest]);

   // Ctrl+K handler
   useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
         if (e.ctrlKey && e.key === "k") {
            e.preventDefault();

            // Don't open if already in edit mode
            if (phase !== "idle") return;

            editor.getEditorState().read(() => {
               const selection = $getSelection();

               // Only proceed if there's a text selection (not collapsed)
               if (!$isRangeSelection(selection) || selection.isCollapsed()) {
                  return;
               }

               const selectedText = selection.getTextContent();

               // Don't proceed if selection is too short
               if (selectedText.trim().length < 1) {
                  return;
               }

               // Check selection length limit
               if (selectedText.length > 4000) {
                  console.warn("Selection too long for edit");
                  return;
               }

               const pos = getSelectionPosition();
               if (!pos) return;

               // Capture selection state
               const originalSelection = {
                  anchorKey: selection.anchor.key,
                  anchorOffset: selection.anchor.offset,
                  focusKey: selection.focus.key,
                  focusOffset: selection.focus.offset,
               };

               openEditPrompt({
                  selectedText,
                  position: pos,
                  originalSelection,
               });
            });
         }
      };

      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
   }, [editor, phase, getSelectionPosition]);

   // Escape handler
   useEffect(() => {
      return editor.registerCommand(
         KEY_ESCAPE_COMMAND,
         () => {
            if (phase !== "idle" && phase !== "complete") {
               handleCancel();
               return true;
            }
            return false;
         },
         COMMAND_PRIORITY_HIGH,
      );
   }, [editor, phase, handleCancel]);

   // Update listener to cancel edit if user types during prompting
   useEffect(() => {
      return editor.registerUpdateListener(({ tags, dirtyElements }) => {
         // Skip our own updates
         if (tags.has("edit-streaming")) return;
         if (tags.has("edit-apply")) return;
         if (tags.has("history-merge")) return;

         // If user is typing while in prompting phase, cancel
         if (phase === "prompting" && dirtyElements.size > 0) {
            handleCancel();
         }
      });
   }, [editor, phase, handleCancel]);

   // Render the prompt panel when in prompting or streaming phase
   if ((phase === "prompting" || phase === "streaming") && position) {
      return (
         <EditPromptPanel
            containerRef={containerRef}
            isStreaming={phase === "streaming"}
            onCancel={handleCancel}
            onSubmit={handleSubmit}
            position={position}
         />
      );
   }

   return null;
}
