"use client";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { Button } from "@packages/ui/components/button";
import {
   Tooltip,
   TooltipContent,
   TooltipTrigger,
} from "@packages/ui/components/tooltip";
import { $getRoot, $isTextNode } from "lexical";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
   ignoreSpellingError,
   useSpellingErrors,
} from "../context/diagnostics-context";
import { suggestWord } from "../lib/spell-checker";
import type { SpellingGrammarError } from "../types/diagnostics";

type SpellingErrorDecoratorProps = {
   containerRef: React.RefObject<HTMLDivElement | null>;
};

type DecorationPosition = {
   top: number;
   left: number;
   width: number;
   error: SpellingGrammarError;
   suggestions: string[];
};

/**
 * Decorator component that renders spelling error underlines and suggestion tooltips.
 * Uses fixed positioning via portal for reliable placement.
 * Shows suggestions on hover.
 */
export function SpellingErrorDecorator({
   containerRef,
}: SpellingErrorDecoratorProps) {
   const [editor] = useLexicalComposerContext();
   const spellingErrors = useSpellingErrors();
   const [decorations, setDecorations] = useState<DecorationPosition[]>([]);
   const updateTimeoutRef = useRef<number | null>(null);
   const suggestionsCache = useRef<Map<string, string[]>>(new Map());

   // Preload suggestions for all errors
   useEffect(() => {
      const loadSuggestions = async () => {
         for (const error of spellingErrors) {
            if (!suggestionsCache.current.has(error.original)) {
               const suggestions = await suggestWord(error.original);
               suggestionsCache.current.set(error.original, suggestions.slice(0, 5));
            }
         }
         // Trigger re-render with suggestions
         updateDecorationPositions();
      };
      loadSuggestions();
   }, [spellingErrors]);

   // Calculate positions of spelling errors in the editor
   const updateDecorationPositions = useCallback(() => {
      if (!containerRef.current || spellingErrors.length === 0) {
         setDecorations([]);
         return;
      }

      const container = containerRef.current;
      const editorElement = container.querySelector('[contenteditable="true"]');
      if (!editorElement) return;

      editor.getEditorState().read(() => {
         const newDecorations: DecorationPosition[] = [];

         for (const error of spellingErrors) {
            // Find the text node and position in the DOM
            const range = document.createRange();
            const walker = document.createTreeWalker(
               editorElement,
               NodeFilter.SHOW_TEXT,
               null,
            );

            let currentOffset = 0;
            let node = walker.nextNode();
            let found = false;

            while (node && !found) {
               const nodeLength = node.textContent?.length || 0;
               if (currentOffset + nodeLength > error.offset) {
                  // Found the node containing the error
                  const startOffset = error.offset - currentOffset;
                  const endOffset = Math.min(startOffset + error.length, nodeLength);

                  try {
                     range.setStart(node, startOffset);
                     range.setEnd(node, endOffset);
                     const rect = range.getBoundingClientRect();

                     // Use fixed positioning (viewport coordinates)
                     newDecorations.push({
                        top: rect.bottom - 2,
                        left: rect.left,
                        width: rect.width,
                        error,
                        suggestions: suggestionsCache.current.get(error.original) || [],
                     });
                     found = true;
                  } catch {
                     // Range setting failed, skip this error
                  }
               }
               currentOffset += nodeLength;
               node = walker.nextNode();
            }
         }

         setDecorations(newDecorations);
      });
   }, [editor, containerRef, spellingErrors]);

   // Debounced position update
   useEffect(() => {
      if (updateTimeoutRef.current) {
         window.clearTimeout(updateTimeoutRef.current);
      }

      updateTimeoutRef.current = window.setTimeout(() => {
         updateDecorationPositions();
      }, 100);

      return () => {
         if (updateTimeoutRef.current) {
            window.clearTimeout(updateTimeoutRef.current);
         }
      };
   }, [updateDecorationPositions]);

   // Update on editor changes and scroll
   useEffect(() => {
      const handleScroll = () => {
         updateDecorationPositions();
      };

      const unregister = editor.registerUpdateListener(() => {
         if (updateTimeoutRef.current) {
            window.clearTimeout(updateTimeoutRef.current);
         }
         updateTimeoutRef.current = window.setTimeout(() => {
            updateDecorationPositions();
         }, 200);
      });

      // Listen to scroll events on the editor container
      const container = containerRef.current;
      if (container) {
         container.addEventListener("scroll", handleScroll, true);
      }
      window.addEventListener("scroll", handleScroll, true);
      window.addEventListener("resize", handleScroll);

      return () => {
         unregister();
         if (container) {
            container.removeEventListener("scroll", handleScroll, true);
         }
         window.removeEventListener("scroll", handleScroll, true);
         window.removeEventListener("resize", handleScroll);
      };
   }, [editor, updateDecorationPositions, containerRef]);

   // Handle ignore
   const handleIgnore = useCallback((errorId: string) => {
      ignoreSpellingError(errorId);
   }, []);

   // Handle apply suggestion - replaces the misspelled word with the suggestion
   const handleApplySuggestion = useCallback(
      (error: SpellingGrammarError, suggestion: string) => {
         editor.update(() => {
            const root = $getRoot();

            // Find the position of the misspelled word
            const startOffset = error.offset;
            const endOffset = error.offset + error.length;

            // Walk through all text nodes to find the one containing the error
            const traverse = (node: ReturnType<typeof $getRoot>): boolean => {
               const children = node.getChildren();
               let currentOffset = 0;

               for (const child of children) {
                  if ($isTextNode(child)) {
                     const nodeText = child.getTextContent();
                     const nodeStart = currentOffset;
                     const nodeEnd = currentOffset + nodeText.length;

                     // Check if this node contains the error
                     if (nodeStart <= startOffset && nodeEnd >= endOffset) {
                        const localStart = startOffset - nodeStart;
                        const localEnd = endOffset - nodeStart;

                        // Replace the text in this node
                        const before = nodeText.slice(0, localStart);
                        const after = nodeText.slice(localEnd);
                        const newText = before + suggestion + after;

                        // Update the text node
                        child.setTextContent(newText);
                        return true;
                     }
                     currentOffset += nodeText.length;
                  } else if ("getChildren" in child) {
                     // Recursively search child nodes
                     const found = traverse(child as ReturnType<typeof $getRoot>);
                     if (found) return true;
                     // Add text content length for non-text nodes
                     currentOffset += child.getTextContent().length;
                  } else {
                     currentOffset += child.getTextContent().length;
                  }
               }
               return false;
            };

            traverse(root);
         });

         // Remove the error from the list
         ignoreSpellingError(error.id);
      },
      [editor],
   );

   if (decorations.length === 0) {
      return null;
   }

   // Render via portal for proper stacking
   return createPortal(
      <>
         {decorations.map((decoration) => (
            <Tooltip key={decoration.error.id}>
               <TooltipTrigger asChild>
                  <div
                     className="cursor-pointer pointer-events-auto"
                     style={{
                        position: "fixed",
                        top: decoration.top,
                        left: decoration.left,
                        width: Math.max(decoration.width, 4),
                        height: 4,
                        zIndex: 1000,
                        borderBottom: "2px dotted #ef4444",
                     }}
                  />
               </TooltipTrigger>
               <TooltipContent
                  className="w-64 p-2 z-[1001]"
                  side="bottom"
                  align="start"
                  sideOffset={4}
               >
                  <div className="space-y-2">
                     <div className="text-xs">
                        <span className="font-medium text-red-400">
                           {decoration.error.original}
                        </span>{" "}
                        <span className="text-muted-foreground">
                           - Sugestão: {decoration.error.suggestion}
                        </span>
                     </div>
                     {decoration.suggestions.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                           {decoration.suggestions.map((suggestion) => (
                              <Button
                                 className="h-6 text-xs px-2"
                                 key={suggestion}
                                 onClick={() => handleApplySuggestion(decoration.error, suggestion)}
                                 size="sm"
                                 variant="secondary"
                              >
                                 {suggestion}
                              </Button>
                           ))}
                        </div>
                     )}
                     <Button
                        className="w-full h-6 text-xs"
                        onClick={() => handleIgnore(decoration.error.id)}
                        size="sm"
                        variant="ghost"
                     >
                        Ignorar
                     </Button>
                  </div>
               </TooltipContent>
            </Tooltip>
         ))}
      </>,
      document.body,
   );
}
