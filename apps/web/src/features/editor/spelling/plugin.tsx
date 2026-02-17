/**
 * Spelling Plugin
 *
 * Lexical plugin for spell checking.
 * Uses Web Worker for dictionary operations, debounced checking.
 */

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { Button } from "@packages/ui/components/button";
import {
   Popover,
   PopoverContent,
   PopoverTrigger,
} from "@packages/ui/components/popover";
import { Spinner } from "@packages/ui/components/spinner";
import {
   $getRoot,
   $isElementNode,
   $isTextNode,
   type LexicalNode,
} from "lexical";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { spellingConfig } from "../core/config";
import type { SpellingError } from "../schemas";
import {
   setCheckingSpelling,
   setSpellingErrors,
} from "../stores/diagnostics-store";
import { getSpellCheckerClient } from "./client";

// ============================================================================
// Types
// ============================================================================

interface SpellingPluginProps {
   /**
    * Whether spell checking is enabled
    */
   enabled?: boolean;

   /**
    * Debounce delay in ms (default: 2000)
    */
   debounceMs?: number;

   /**
    * Callback when errors are updated
    */
   onErrorsUpdate?: (errors: SpellingError[]) => void;
}

type DecorationPosition = {
   top: number;
   left: number;
   width: number;
   height: number;
   error: SpellingError;
};

type TextNodeEntry = {
   key: string;
   text: string;
   startOffset: number;
   endOffset: number;
};

// ============================================================================
// Offset Mapping Utilities
// ============================================================================

/**
 * Build offset map by traversing Lexical's node tree directly.
 * This ensures offsets match exactly with getTextContent().
 * Stores node keys instead of node references for DOM lookup later.
 */
function buildLexicalOffsetMap(
   root: ReturnType<typeof $getRoot>,
): TextNodeEntry[] {
   const entries: TextNodeEntry[] = [];
   let currentOffset = 0;

   function traverse(node: LexicalNode): void {
      if ($isTextNode(node)) {
         const text = node.getTextContent();
         entries.push({
            key: node.getKey(),
            text,
            startOffset: currentOffset,
            endOffset: currentOffset + text.length,
         });
         currentOffset += text.length;
      } else if ($isElementNode(node)) {
         const children = node.getChildren();
         for (const child of children) {
            traverse(child);
         }
      }
   }

   const children = root.getChildren();
   children.forEach((child, idx) => {
      // Add newline between top-level block elements (matching Lexical's getTextContent)
      if (idx > 0) {
         currentOffset += 1;
      }
      traverse(child);
   });

   return entries;
}

/**
 * Get DOM position for a text range using the editor's element lookup
 */
function getPositionFromEntry(
   editor: ReturnType<typeof useLexicalComposerContext>[0],
   entry: TextNodeEntry,
   localStart: number,
   localEnd: number,
): { top: number; left: number; width: number; height: number } | null {
   try {
      // Get the DOM element for this Lexical node
      const domElement = editor.getElementByKey(entry.key);
      if (!domElement) return null;

      // Find the text node child
      const walker = document.createTreeWalker(
         domElement,
         NodeFilter.SHOW_TEXT,
         null,
      );

      const textNode = walker.nextNode();
      if (!textNode || !textNode.textContent) return null;

      // Create range for the error position
      const clampedStart = Math.min(localStart, textNode.textContent.length);
      const clampedEnd = Math.min(localEnd, textNode.textContent.length);

      const range = document.createRange();
      range.setStart(textNode, clampedStart);
      range.setEnd(textNode, clampedEnd);

      const rect = range.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
         return {
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
         };
      }
      return null;
   } catch {
      return null;
   }
}

/**
 * Find position for an error using Lexical offset map (binary search)
 */
function getPositionFromLexicalMap(
   editor: ReturnType<typeof useLexicalComposerContext>[0],
   offsetMap: TextNodeEntry[],
   errorOffset: number,
   errorLength: number,
): { top: number; left: number; width: number; height: number } | null {
   // Binary search for the node containing the error
   let low = 0;
   let high = offsetMap.length - 1;

   while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      const entry = offsetMap[mid];
      if (!entry) break;

      if (errorOffset < entry.startOffset) {
         high = mid - 1;
      } else if (errorOffset >= entry.endOffset) {
         low = mid + 1;
      } else {
         // Found the node containing the error
         const localStart = errorOffset - entry.startOffset;
         const localEnd = Math.min(localStart + errorLength, entry.text.length);

         return getPositionFromEntry(editor, entry, localStart, localEnd);
      }
   }

   return null;
}

/**
 * Check if a decoration is within the visible bounds of the container.
 */
function isWithinBounds(
   decoration: { top: number; left: number; width: number; height: number },
   containerRect: DOMRect,
): boolean {
   const decorationBottom = decoration.top + decoration.height;
   const decorationRight = decoration.left + decoration.width;

   return (
      decoration.top >= containerRect.top - 10 &&
      decorationBottom <= containerRect.bottom + 10 &&
      decoration.left >= containerRect.left - 10 &&
      decorationRight <= containerRect.right + 10
   );
}

// ============================================================================
// Spelling Plugin Component
// ============================================================================

/**
 * Spelling Plugin Component
 *
 * Provides real-time spell checking with:
 * - Debounced checking after typing stops
 * - Streaming error results
 * - Error decorations
 */
export function SpellingPlugin({
   enabled = true,
   debounceMs = spellingConfig.debounceMs,
   onErrorsUpdate,
}: SpellingPluginProps): null {
   const [editor] = useLexicalComposerContext();
   const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
   const checkIdRef = useRef<string | null>(null);
   const lastTextRef = useRef<string>("");

   /**
    * Run spell check on the current content
    */
   const checkSpelling = useCallback(async () => {
      if (!enabled) return;

      // Get current text
      let text = "";
      editor.getEditorState().read(() => {
         const root = $getRoot();
         text = root.getTextContent();
      });

      // Skip if same as last check
      if (text === lastTextRef.current) return;
      lastTextRef.current = text;

      // Skip if too short
      if (text.length < 10) {
         onErrorsUpdate?.([]);
         setSpellingErrors([]);
         setCheckingSpelling(false);
         return;
      }

      // Generate check ID
      const checkId = crypto.randomUUID();
      checkIdRef.current = checkId;

      // Signal that spell checking is starting
      setCheckingSpelling(true);

      const client = getSpellCheckerClient();
      const collectedErrors: SpellingError[] = [];

      try {
         await client.checkText(text, (batchErrors, done) => {
            // Verify this is still the current check
            if (checkIdRef.current !== checkId) return;

            collectedErrors.push(...batchErrors);

            if (done) {
               onErrorsUpdate?.(collectedErrors);
               // Update store with full error objects for diagnostics panel
               setSpellingErrors(collectedErrors);
               setCheckingSpelling(false);
            }
         });
      } catch (error) {
         console.error("[SpellingPlugin] Check failed:", error);
         setCheckingSpelling(false);
      }
   }, [editor, enabled, onErrorsUpdate]);

   /**
    * Cancel current check
    */
   const cancelCheck = useCallback(() => {
      if (debounceTimerRef.current) {
         clearTimeout(debounceTimerRef.current);
         debounceTimerRef.current = null;
      }

      if (checkIdRef.current) {
         const client = getSpellCheckerClient();
         client.cancel(checkIdRef.current);
         checkIdRef.current = null;
      }
   }, []);

   /**
    * Schedule a debounced check
    */
   const scheduleCheck = useCallback(() => {
      cancelCheck();

      debounceTimerRef.current = setTimeout(() => {
         checkSpelling();
      }, debounceMs);
   }, [cancelCheck, checkSpelling, debounceMs]);

   // Listen for text changes
   useEffect(() => {
      if (!enabled) return;

      const removeListener = editor.registerTextContentListener(() => {
         scheduleCheck();
      });

      // Initial check
      scheduleCheck();

      return () => {
         removeListener();
         cancelCheck();
      };
   }, [editor, enabled, scheduleCheck, cancelCheck]);

   // Cleanup on unmount
   useEffect(() => {
      return () => {
         cancelCheck();
      };
   }, [cancelCheck]);

   return null;
}

// ============================================================================
// Spelling Suggestion Popover Component
// ============================================================================

interface SpellingSuggestionPopoverProps {
   error: SpellingError;
   onApplySuggestion: (suggestion: string) => void;
   onIgnore: () => void;
   isOpen: boolean;
   onOpenChange: (open: boolean) => void;
   suggestions?: string[];
   isLoading?: boolean;
}

/**
 * Popover component that displays spelling suggestions for a misspelled word.
 * Extracted from SpellingErrorDecorator for reusability.
 */
export function SpellingSuggestionPopover({
   error,
   onApplySuggestion,
   onIgnore,
   suggestions = [],
   isLoading = false,
}: Omit<
   SpellingSuggestionPopoverProps,
   "isOpen" | "onOpenChange"
>): React.JSX.Element {
   return (
      <PopoverContent
         align="start"
         className="w-72 p-0 shadow-lg"
         side="bottom"
         sideOffset={8}
      >
         <div className="p-3 border-b bg-muted/30">
            <div className="flex items-center gap-2">
               <span className="size-2 rounded-full bg-red-500 shrink-0" />
               <span className="font-medium text-sm text-red-600 dark:text-red-400">
                  {error.original}
               </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1 ml-4">
               Palavra não encontrada no dicionário
            </p>
         </div>

         <div className="p-3">
            <p className="text-xs font-medium text-muted-foreground mb-2">
               Sugestões
            </p>

            {isLoading && suggestions.length === 0 ? (
               <div className="flex items-center justify-center py-4 gap-2 text-muted-foreground">
                  <Spinner className="size-4" />
                  <span className="text-sm">Carregando...</span>
               </div>
            ) : suggestions.length > 0 ? (
               <div className="flex flex-col gap-1">
                  {suggestions.map((suggestion) => (
                     <Button
                        className="justify-start h-8 text-sm font-normal"
                        key={suggestion}
                        onClick={() => onApplySuggestion(suggestion)}
                        size="sm"
                        variant="ghost"
                     >
                        {suggestion}
                     </Button>
                  ))}
               </div>
            ) : (
               <p className="text-sm text-muted-foreground py-2 text-center">
                  Nenhuma sugestão encontrada
               </p>
            )}
         </div>

         <div className="p-2 border-t bg-muted/30">
            <Button
               className="w-full h-8 text-xs"
               onClick={onIgnore}
               size="sm"
               variant="outline"
            >
               Ignorar esta palavra
            </Button>
         </div>
      </PopoverContent>
   );
}

// ============================================================================
// Spelling Error Decorator Component
// ============================================================================

interface SpellingErrorDecoratorProps {
   errors: SpellingError[];
   containerRef: React.RefObject<HTMLDivElement | null>;
   onIgnore?: (errorId: string) => void;
}

/**
 * Decorator component that renders spelling error underlines and suggestion popovers.
 * Uses fixed positioning via portal but clips to container bounds.
 * Shows suggestions on click with lazy loading.
 */
export function SpellingErrorDecorator({
   errors,
   containerRef,
   onIgnore,
}: SpellingErrorDecoratorProps): React.JSX.Element | null {
   const [editor] = useLexicalComposerContext();
   const [decorations, setDecorations] = useState<DecorationPosition[]>([]);
   const [activeErrorId, setActiveErrorId] = useState<string | null>(null);
   const [loadingSuggestions, setLoadingSuggestions] = useState<string | null>(
      null,
   );
   const [ignoredErrors, setIgnoredErrors] = useState<Set<string>>(new Set());
   const updateTimeoutRef = useRef<number | null>(null);
   const rafIdRef = useRef<number | null>(null);
   const suggestionsCache = useRef<Map<string, string[]>>(new Map());
   const scrollTimeoutRef = useRef<number | null>(null);
   // Cache visible text range to filter errors before position calculation
   const visibleRangeRef = useRef<{ start: number; end: number } | null>(null);

   // Filter out ignored errors
   const filteredErrors = errors.filter((e) => !ignoredErrors.has(e.id));

   // Lazy load suggestions when opening popover
   const loadSuggestionsForWord = useCallback(
      async (errorId: string, word: string) => {
         if (suggestionsCache.current.has(word)) {
            return suggestionsCache.current.get(word)!;
         }

         setLoadingSuggestions(errorId);
         try {
            const client = getSpellCheckerClient();
            const suggestions = await client.suggest(word);
            const limitedSuggestions = suggestions.slice(0, 5);
            suggestionsCache.current.set(word, limitedSuggestions);
            return limitedSuggestions;
         } finally {
            setLoadingSuggestions(null);
         }
      },
      [],
   );

   // Handle popover open - load suggestions lazily
   const handlePopoverOpen = useCallback(
      (open: boolean, errorId: string, word: string) => {
         if (open) {
            setActiveErrorId(errorId);
            loadSuggestionsForWord(errorId, word);
         } else {
            setActiveErrorId(null);
         }
      },
      [loadSuggestionsForWord],
   );

   // Calculate positions of spelling errors using optimized offset map
   // Uses RAF to batch layout reads and visible range filtering for performance
   // OPTIMIZED: Only processes errors in visible viewport + limits max decorations
   const updateDecorationPositions = useCallback(() => {
      // Cancel any pending RAF
      if (rafIdRef.current !== null) {
         cancelAnimationFrame(rafIdRef.current);
      }

      if (!containerRef.current || filteredErrors.length === 0) {
         setDecorations([]);
         return;
      }

      // Batch layout reads in RAF to avoid layout thrashing
      rafIdRef.current = requestAnimationFrame(() => {
         rafIdRef.current = null;

         const container = containerRef.current;
         if (!container) return;

         const editorElement = container.querySelector(
            '[contenteditable="true"]',
         );
         if (!editorElement) return;

         const containerRect = container.getBoundingClientRect();

         editor.getEditorState().read(() => {
            // Build offset map once for all errors
            const root = $getRoot();
            const offsetMap = buildLexicalOffsetMap(root);

            // Estimate visible text range based on scroll position and viewport
            // This allows us to skip errors that are definitely outside the viewport
            const totalTextLength =
               offsetMap.length > 0
                  ? (offsetMap[offsetMap.length - 1]?.endOffset ?? 0)
                  : 0;

            if (totalTextLength > 0) {
               const scrollRatio =
                  container.scrollTop / (container.scrollHeight || 1);
               const viewportRatio =
                  containerRect.height / (container.scrollHeight || 1);
               const estimatedStart = Math.floor(scrollRatio * totalTextLength);
               const estimatedEnd = Math.ceil(
                  (scrollRatio + viewportRatio) * totalTextLength,
               );
               // Add buffer for errors near the edge
               const buffer = Math.ceil(totalTextLength * 0.15);
               visibleRangeRef.current = {
                  start: Math.max(0, estimatedStart - buffer),
                  end: Math.min(totalTextLength, estimatedEnd + buffer),
               };
            }

            const newDecorations: DecorationPosition[] = [];
            const visibleRange = visibleRangeRef.current;

            // OPTIMIZATION: Pre-filter errors by visible range BEFORE position calculation
            const candidateErrors = visibleRange
               ? filteredErrors.filter((error) => {
                    const errorEnd = error.offset + error.length;
                    return (
                       errorEnd >= visibleRange.start &&
                       error.offset <= visibleRange.end
                    );
                 })
               : filteredErrors;

            // OPTIMIZATION: Limit max decorations to prevent performance issues
            const errorsToProcess = candidateErrors.slice(
               0,
               spellingConfig.maxVisibleDecorations,
            );

            // O(n log m) instead of O(n * m)
            for (const error of errorsToProcess) {
               const position = getPositionFromLexicalMap(
                  editor,
                  offsetMap,
                  error.offset,
                  error.length,
               );
               if (position && isWithinBounds(position, containerRect)) {
                  newDecorations.push({
                     ...position,
                     error,
                  });
               }
            }

            setDecorations(newDecorations);
         });
      });
   }, [editor, containerRef, filteredErrors]);

   // Cleanup RAF on unmount
   useEffect(() => {
      return () => {
         if (rafIdRef.current !== null) {
            cancelAnimationFrame(rafIdRef.current);
         }
      };
   }, []);

   // Debounced position update - increased delay for better performance
   useEffect(() => {
      if (updateTimeoutRef.current) {
         window.clearTimeout(updateTimeoutRef.current);
      }

      updateTimeoutRef.current = window.setTimeout(() => {
         updateDecorationPositions();
      }, 200);

      return () => {
         if (updateTimeoutRef.current) {
            window.clearTimeout(updateTimeoutRef.current);
         }
      };
   }, [updateDecorationPositions]);

   // Update on editor changes and scroll - optimized with longer debounce
   useEffect(() => {
      // Throttled scroll handler to reduce layout thrashing
      let isScrolling = false;

      const handleScroll = () => {
         if (isScrolling) return; // Throttle during scroll

         isScrolling = true;

         if (scrollTimeoutRef.current) {
            window.clearTimeout(scrollTimeoutRef.current);
         }
         scrollTimeoutRef.current = window.setTimeout(() => {
            // Invalidate visible range cache on scroll
            visibleRangeRef.current = null;
            updateDecorationPositions();
            isScrolling = false;
         }, 150); // Increased debounce for better performance
      };

      const unregister = editor.registerUpdateListener(() => {
         if (updateTimeoutRef.current) {
            window.clearTimeout(updateTimeoutRef.current);
         }
         updateTimeoutRef.current = window.setTimeout(() => {
            updateDecorationPositions();
         }, 300); // Increased delay for editor updates
      });

      // Listen to scroll events on the editor container
      const container = containerRef.current;
      if (container) {
         container.addEventListener("scroll", handleScroll, { passive: true });
      }
      window.addEventListener("scroll", handleScroll, { passive: true });
      window.addEventListener("resize", handleScroll, { passive: true });

      return () => {
         unregister();
         if (scrollTimeoutRef.current) {
            window.clearTimeout(scrollTimeoutRef.current);
         }
         if (container) {
            container.removeEventListener("scroll", handleScroll);
         }
         window.removeEventListener("scroll", handleScroll);
         window.removeEventListener("resize", handleScroll);
      };
   }, [editor, updateDecorationPositions, containerRef]);

   // Handle ignore
   const handleIgnore = useCallback(
      (errorId: string) => {
         setIgnoredErrors((prev) => new Set(prev).add(errorId));
         setActiveErrorId(null);
         onIgnore?.(errorId);
      },
      [onIgnore],
   );

   // Handle apply suggestion - replaces the misspelled word with the suggestion
   const handleApplySuggestion = useCallback(
      (error: SpellingError, suggestion: string) => {
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
                     const found = traverse(
                        child as ReturnType<typeof $getRoot>,
                     );
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

         // Remove the error from the ignored list (it's fixed now)
         handleIgnore(error.id);
      },
      [editor, handleIgnore],
   );

   if (decorations.length === 0) {
      return null;
   }

   // Render via portal for proper stacking
   return createPortal(
      decorations.map((decoration) => {
         const cachedSuggestions =
            suggestionsCache.current.get(decoration.error.original) || [];
         const isLoading = loadingSuggestions === decoration.error.id;
         const isActive = activeErrorId === decoration.error.id;

         return (
            <Popover
               key={decoration.error.id}
               onOpenChange={(open) =>
                  handlePopoverOpen(
                     open,
                     decoration.error.id,
                     decoration.error.original,
                  )
               }
               open={isActive}
            >
               <PopoverTrigger asChild>
                  <button
                     aria-label={`Erro de ortografia: ${decoration.error.original}`}
                     className="cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-1 rounded-sm"
                     style={{
                        position: "fixed",
                        top: decoration.top + decoration.height - 3,
                        left: decoration.left,
                        width: Math.max(decoration.width, 8),
                        height: 3,
                        zIndex: 50,
                        background:
                           "linear-gradient(90deg, #ef4444 50%, transparent 50%)",
                        backgroundSize: "6px 2px",
                        backgroundRepeat: "repeat-x",
                        backgroundPosition: "bottom",
                        border: "none",
                        padding: 0,
                     }}
                     type="button"
                  />
               </PopoverTrigger>
               <SpellingSuggestionPopover
                  error={decoration.error}
                  isLoading={isLoading}
                  onApplySuggestion={(suggestion) =>
                     handleApplySuggestion(decoration.error, suggestion)
                  }
                  onIgnore={() => handleIgnore(decoration.error.id)}
                  suggestions={cachedSuggestions}
               />
            </Popover>
         );
      }),
      document.body,
   );
}
