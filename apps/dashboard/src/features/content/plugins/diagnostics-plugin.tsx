import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
   $getRoot,
   $getSelection,
   $isRangeSelection,
   type ElementNode,
   type LexicalNode,
   type TextNode,
} from "lexical";
import { useEffect } from "react";
import {
   setCounts,
   setCursorPosition,
} from "@/features/content/context/diagnostics-context";

/**
 * Plugin that tracks editor state and updates diagnostics context.
 * Handles cursor position and word/character counts.
 */
export function DiagnosticsPlugin() {
   const [editor] = useLexicalComposerContext();

   useEffect(() => {
      // Update on selection change
      const unregisterSelectionListener = editor.registerUpdateListener(
         ({ editorState }) => {
            editorState.read(() => {
               // Get cursor position
               const selection = $getSelection();
               if ($isRangeSelection(selection)) {
                  const anchor = selection.anchor;
                  const anchorNode = anchor.getNode();

                  // Calculate line and column
                  // This is a simplified calculation - line numbers in Lexical are tricky
                  const offset = anchor.offset;

                  // For a more accurate line count, traverse the document
                  const root = $getRoot();
                  const allText = root.getTextContent();
                  const textBeforeCursor = allText.slice(
                     0,
                     getAbsoluteOffset(root, anchorNode, offset),
                  );

                  const lines = textBeforeCursor.split("\n");
                  const line = lines.length;
                  const column = (lines[lines.length - 1]?.length ?? 0) + 1;

                  setCursorPosition({ line, column });
               }

               // Get word and character counts
               const root = $getRoot();
               const text = root.getTextContent();
               const charCount = text.length;
               const wordCount = countWords(text);

               setCounts(wordCount, charCount);
            });
         },
      );

      return () => {
         unregisterSelectionListener();
      };
   }, [editor]);

   return null;
}

/**
 * Calculate absolute offset in the document for a given node and offset
 */
function getAbsoluteOffset(
   root: ElementNode,
   targetNode: ElementNode | TextNode,
   offset: number,
): number {
   let absoluteOffset = 0;
   let found = false;

   const traverse = (node: LexicalNode): void => {
      if (found) return;

      if (node === targetNode) {
         absoluteOffset += offset;
         found = true;
         return;
      }

      // Check if this is an element node with children
      if ("getChildren" in node && typeof node.getChildren === "function") {
         for (const child of node.getChildren() as LexicalNode[]) {
            traverse(child);
            if (found) return;
         }
      } else {
         // Text node - add its content length
         absoluteOffset += node.getTextContentSize();
      }
   };

   for (const child of root.getChildren()) {
      traverse(child);
      if (found) break;
      // Add newline between top-level nodes
      absoluteOffset += 1;
   }

   return absoluteOffset;
}

/**
 * Count words in a text string
 */
function countWords(text: string): number {
   if (!text || !text.trim()) return 0;

   // Split by whitespace and filter empty strings
   const words = text
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0);

   return words.length;
}
