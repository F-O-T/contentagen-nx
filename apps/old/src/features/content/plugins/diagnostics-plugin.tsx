import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
   $getRoot,
   $getSelection,
   $isRangeSelection,
   type ElementNode,
   type LexicalNode,
   type TextNode,
} from "lexical";
import { useCallback, useEffect, useRef } from "react";
import {
   setCounts,
   setCursorPosition,
} from "@/features/content/context/diagnostics-context";
import { useDebouncedCallback } from "@/hooks/use-debounced-callback";
import { cancelOperation, countText } from "../lib/editor-worker-client";

/**
 * Plugin that tracks editor state and updates diagnostics context.
 * Cursor position runs on main thread (needs DOM access).
 * Word/character counts are offloaded to a web worker.
 */
export function DiagnosticsPlugin() {
   const [editor] = useLexicalComposerContext();
   const lastOperationIdRef = useRef<string | null>(null);

   // Debounced worker call for counting - 150ms delay
   const countInWorker = useCallback(async (text: string) => {
      // Generate a new operation ID
      const operationId = `count-${Date.now()}-${Math.random().toString(36).slice(2)}`;

      // Cancel previous operation if still pending
      if (lastOperationIdRef.current) {
         cancelOperation(lastOperationIdRef.current);
      }
      lastOperationIdRef.current = operationId;

      try {
         const result = await countText(text);
         setCounts(result.wordCount, result.charCount);
      } catch {
         // Ignore errors from cancelled operations
      }
   }, []);

   const { call: debouncedCount, cancel: cancelDebounce } =
      useDebouncedCallback(countInWorker, 150);

   useEffect(() => {
      const unregisterUpdateListener = editor.registerUpdateListener(
         ({ editorState }) => {
            editorState.read(() => {
               // Cursor position - keep on main thread (fast, needs DOM)
               const selection = $getSelection();
               if ($isRangeSelection(selection)) {
                  const anchor = selection.anchor;
                  const anchorNode = anchor.getNode();
                  const offset = anchor.offset;

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

               // Word/char count - offload to worker with debouncing
               const root = $getRoot();
               const text = root.getTextContent();
               debouncedCount(text);
            });
         },
      );

      return () => {
         unregisterUpdateListener();
         cancelDebounce();
         if (lastOperationIdRef.current) {
            cancelOperation(lastOperationIdRef.current);
         }
      };
   }, [editor, debouncedCount, cancelDebounce]);

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
