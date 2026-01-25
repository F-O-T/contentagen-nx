/**
 * Markdown Paste Plugin
 *
 * Lexical plugin for smart markdown paste handling.
 * Converts pasted markdown content into rich text nodes.
 */

import {
   $convertFromMarkdownString,
   $convertToMarkdownString,
} from "@lexical/markdown";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
   $getRoot,
   $getSelection,
   $isRangeSelection,
   COMMAND_PRIORITY_HIGH,
   PASTE_COMMAND,
} from "lexical";
import { useEffect } from "react";
import { EXTENDED_TRANSFORMERS } from "../core/transformers";

interface MarkdownPastePluginProps {
   /**
    * Whether markdown paste is enabled
    */
   enabled?: boolean;

   /**
    * Custom markdown detection function
    */
   detectMarkdown?: (text: string) => boolean;
}

/**
 * Default markdown detection
 * Checks for common markdown patterns
 */
function defaultDetectMarkdown(text: string): boolean {
   // Check for common markdown patterns
   const patterns = [
      /^#{1,6}\s/, // Headings
      /^\s*[-*+]\s/, // Unordered lists
      /^\s*\d+\.\s/, // Ordered lists
      /\*\*[^*]+\*\*/, // Bold
      /\*[^*]+\*/, // Italic
      /`[^`]+`/, // Inline code
      /```[\s\S]*```/, // Code blocks
      /\[.+\]\(.+\)/, // Links
      /!\[.+\]\(.+\)/, // Images
      /^>\s/, // Blockquotes
      /^\|.+\|$/, // Tables
   ];

   return patterns.some((pattern) => pattern.test(text));
}

/**
 * Markdown Paste Plugin Component
 *
 * Intercepts paste events and converts markdown to rich text.
 */
export function MarkdownPastePlugin({
   enabled = true,
   detectMarkdown = defaultDetectMarkdown,
}: MarkdownPastePluginProps): null {
   const [editor] = useLexicalComposerContext();

   useEffect(() => {
      if (!enabled) return;

      const removeListener = editor.registerCommand(
         PASTE_COMMAND,
         (event: ClipboardEvent) => {
            const clipboardData = event.clipboardData;
            if (!clipboardData) return false;

            // Get plain text
            const text = clipboardData.getData("text/plain");
            if (!text) return false;

            // Check if it looks like markdown
            if (!detectMarkdown(text)) {
               return false; // Let default paste handle it
            }

            // Prevent default paste
            event.preventDefault();

            editor.update(() => {
               const selection = $getSelection();

               // Remove selected content if there's a non-collapsed selection
               if ($isRangeSelection(selection) && !selection.isCollapsed()) {
                  selection.removeText();
               }

               // Get current markdown and combine with pasted content
               const root = $getRoot();
               const existingMarkdown = $convertToMarkdownString(
                  EXTENDED_TRANSFORMERS,
               );

               // Clear and rebuild with inserted content
               root.clear();

               // Combine existing content with pasted markdown
               const combinedMarkdown = existingMarkdown
                  ? `${existingMarkdown}\n\n${text}`
                  : text;

               $convertFromMarkdownString(
                  combinedMarkdown,
                  EXTENDED_TRANSFORMERS,
               );
            });

            return true; // Command handled
         },
         COMMAND_PRIORITY_HIGH,
      );

      return () => {
         removeListener();
      };
   }, [editor, enabled, detectMarkdown]);

   return null;
}

/**
 * Utility to convert markdown string to editor content
 */
export function convertMarkdownToEditor(
   editor: ReturnType<typeof useLexicalComposerContext>[0],
   markdown: string,
): void {
   editor.update(() => {
      const root = $getRoot();
      root.clear();
      $convertFromMarkdownString(markdown, EXTENDED_TRANSFORMERS);
   });
}

/**
 * Utility to get editor content as markdown
 */
export function convertEditorToMarkdown(
   editor: ReturnType<typeof useLexicalComposerContext>[0],
): string {
   let markdown = "";

   editor.getEditorState().read(() => {
      markdown = $convertToMarkdownString(EXTENDED_TRANSFORMERS);
   });

   return markdown;
}
