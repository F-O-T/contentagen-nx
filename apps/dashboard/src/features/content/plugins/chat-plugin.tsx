"use client";

import { $convertToMarkdownString } from "@lexical/markdown";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
   $getRoot,
   $getSelection,
   $isRangeSelection,
   $isTextNode,
   type LexicalNode,
} from "lexical";
import { useCallback, useEffect } from "react";
import { Feature, useFeatureAccess } from "@/hooks/use-feature-access";
import {
   openChatSidebar,
   setDocumentContent,
   setEditor,
   setSelectionContext,
   useChatState,
} from "../context/chat-context";
import { $isGhostTextNode } from "../nodes/ghost-text-node";
import { EXTENDED_TRANSFORMERS } from "../ui/content-editor";

/**
 * Chat Plugin for Ctrl+L sidebar chat.
 *
 * Flow:
 * 1. User presses Ctrl+L (with optional selection)
 * 2. Chat sidebar opens
 * 3. If text was selected, it's added as context
 *
 * Controls:
 * - Ctrl+L: Toggle chat sidebar / send selection to chat
 */
export function ChatPlugin() {
   const [editor] = useLexicalComposerContext();
   const { isOpen } = useChatState();
   const { hasFeature } = useFeatureAccess();
   const hasChatFeature = hasFeature(Feature.CHAT);

   // Register editor reference for tool execution
   useEffect(() => {
      setEditor(editor);
      return () => setEditor(null);
   }, [editor]);

   // Get text content without ghost nodes (for selection context)
   const getTextWithoutGhost = useCallback((node: LexicalNode): string => {
      if ($isGhostTextNode(node)) return "";
      if ($isTextNode(node)) return node.getTextContent();
      if ("getChildren" in node) {
         const children = (
            node as { getChildren: () => LexicalNode[] }
         ).getChildren();
         return children.map(getTextWithoutGhost).join("");
      }
      return "";
   }, []);

   // Sync document content to chat state on every change (as markdown for analysis)
   useEffect(() => {
      return editor.registerUpdateListener(({ editorState }) => {
         editorState.read(() => {
            const markdown = $convertToMarkdownString(EXTENDED_TRANSFORMERS);
            setDocumentContent(markdown);
         });
      });
   }, [editor]);

   // Get document text and selection context
   const getDocumentContext = useCallback(() => {
      let fullText = "";
      let selectionStart = 0;
      let selectionEnd = 0;
      let selectedText = "";

      editor.getEditorState().read(() => {
         const root = $getRoot();
         const selection = $getSelection();

         fullText = getTextWithoutGhost(root);

         // Get selected text if any
         if ($isRangeSelection(selection) && !selection.isCollapsed()) {
            selectedText = selection.getTextContent();

            // Calculate offsets for context
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
         selectedText,
         contextBefore: fullText.slice(0, selectionStart),
         contextAfter: fullText.slice(selectionEnd),
      };
   }, [editor, getTextWithoutGhost]);

   // Ctrl+L handler - toggle sidebar and send selection to chat
   // Only enabled if user has CHAT feature
   useEffect(() => {
      if (!hasChatFeature) return;

      const handleKeyDown = (e: KeyboardEvent) => {
         if (e.ctrlKey && e.key === "l") {
            e.preventDefault();

            const { selectedText, contextBefore, contextAfter } =
               getDocumentContext();

            // If there's selected text, set it as context
            if (selectedText.trim()) {
               setSelectionContext({
                  text: selectedText,
                  contextBefore: contextBefore.slice(-500), // Limit context size
                  contextAfter: contextAfter.slice(0, 500),
               });
            }

            // Open sidebar if not open, or just add the selection if already open
            if (!isOpen) {
               openChatSidebar();
            }
         }
      };

      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
   }, [isOpen, getDocumentContext, hasChatFeature]);

   // Plugin only handles keyboard events, renders nothing
   return null;
}
