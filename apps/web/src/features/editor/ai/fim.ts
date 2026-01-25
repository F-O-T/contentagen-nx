/**
 * FIM (Fill-in-Middle) Module
 *
 * Consolidated FIM functionality including:
 * - Trigger detection and timing
 * - Edit intent classification
 * - Confidence scoring
 * - Context building
 * - Completion hooks
 */

import type { LexicalEditor } from "lexical";
import { $getSelection, $isRangeSelection } from "lexical";
import { useCallback, useEffect, useRef } from "react";
import { defaultFIMConfig } from "../core/config";
import { buildFIMContext } from "../core/transformers";
import type {
   CursorContext,
   EditContext,
   EditIntentType,
   FIMChunk,
   FIMConfidenceFactors,
   FIMConfig,
   FIMDiffSuggestion,
   FIMRequest,
   FIMTriggerType,
} from "../schemas";
import {
   appendGhostText,
   clearFIM,
   completeFIMSession,
   getFIMState,
   incrementChainDepth,
   resetChain,
   setConfidence,
   setDiffSuggestion,
   setFIMLoading,
   setFIMMetrics,
   setGhostText,
   setPrefetchedSuggestion,
   startFIMSession,
   startPreFetching,
   useFIMContext,
} from "../stores/fim-store";
import { handleStreamError } from "./streaming";

// ============================================================================
// Trigger Detection
// ============================================================================

/**
 * Detect what type of trigger caused the FIM request
 */
export function detectTriggerType(
   text: string,
   cursorPosition: number,
): FIMTriggerType {
   // Check the character before cursor
   const charBefore = text[cursorPosition - 1];
   const charTwoBefore = text[cursorPosition - 2];

   // Newline trigger
   if (charBefore === "\n") {
      return "newline";
   }

   // Punctuation trigger (sentence end)
   if (charBefore === "." || charBefore === "!" || charBefore === "?") {
      // Make sure it's sentence-ending, not abbreviation
      if (charTwoBefore && /[a-zA-Z]/.test(charTwoBefore)) {
         return "punctuation";
      }
   }

   // Default to debounce
   return "debounce";
}

/**
 * Get the appropriate delay for a trigger type
 */
export function getTriggerDelay(
   triggerType: FIMTriggerType,
   config: FIMConfig = defaultFIMConfig,
): number {
   switch (triggerType) {
      case "newline":
         return config.newlineDelayMs;
      case "punctuation":
         return config.punctuationDelayMs;
      case "cursor-move":
         return config.cursorMoveDelayMs;
      case "edit-prediction":
         return config.editPredictionDelayMs;
      case "chain":
         return 0; // Immediate
      case "manual":
         return 0; // Immediate
      default:
         return config.debounceMs;
   }
}

// ============================================================================
// Edit Intent Detection
// ============================================================================

/**
 * Detect the user's edit intent based on cursor position and text patterns
 */
export function detectEditIntent(
   text: string,
   cursorPosition: number,
): EditContext {
   const distanceFromEnd = text.length - cursorPosition;
   const textBefore = text.slice(0, cursorPosition);
   const textAfter = text.slice(cursorPosition);

   // Check for patterns
   const isInEditingMode = distanceFromEnd < text.length * 0.1; // Near end
   const hasSentencePattern = /[.!?]\s*$/.test(textBefore);
   const isAfterIncomplete =
      /[,;:]\s*$/.test(textBefore) || /\w\s*$/.test(textBefore);

   // Classify intent
   let intent: EditIntentType = "continuation";

   if (distanceFromEnd === 0 || distanceFromEnd < 10) {
      // At or very near end
      intent = "continuation";
   } else if (textAfter.trim().length === 0) {
      // Only whitespace after cursor
      intent = "continuation";
   } else if (isAfterIncomplete) {
      // After incomplete sentence
      intent = "completion";
   } else if (!hasSentencePattern && distanceFromEnd > 50) {
      // Middle of document, no sentence end
      intent = "insertion";
   } else {
      // Default to completion
      intent = "completion";
   }

   return {
      intent,
      cursorDistanceFromEnd: distanceFromEnd,
      isInEditingMode,
      isAfterIncomplete,
      hasSentencePattern,
   };
}

/**
 * Build cursor context for FIM request
 */
export function buildCursorContext(
   text: string,
   cursorPosition: number,
): CursorContext {
   const charBefore = text[cursorPosition - 1] ?? "";
   const textBefore = text.slice(
      Math.max(0, cursorPosition - 100),
      cursorPosition,
   );

   return {
      isEndOfParagraph: charBefore === "\n" || cursorPosition === text.length,
      isEndOfSentence: /[.!?]\s*$/.test(textBefore),
      isAfterPunctuation: /[.,;:!?]\s*$/.test(textBefore),
   };
}

// ============================================================================
// Confidence Scoring
// ============================================================================

/**
 * Calculate confidence score for a completion
 */
export function calculateConfidence(
   completion: string,
   request: FIMRequest,
   metadata?: { latencyMs?: number; stopReason?: string },
): { score: number; factors: FIMConfidenceFactors; shouldShow: boolean } {
   const factors: FIMConfidenceFactors = {
      length: 0,
      prefixSimilarity: 0,
      stopReason: 0,
      latency: 0,
      repetition: 0,
   };

   // Length factor (prefer reasonable lengths)
   const idealLength = 50;
   const lengthRatio = completion.length / idealLength;
   factors.length = lengthRatio > 1 ? 1 / lengthRatio : lengthRatio;
   factors.length = Math.max(0.1, Math.min(1, factors.length));

   // Prefix similarity (check if completion continues naturally)
   const prefix = request.prefix.slice(-50);
   if (prefix && completion) {
      // Simple check: does completion start with expected patterns?
      const startsNaturally =
         /^[a-z,.\s]/.test(completion) || // Continues sentence
         /^\s*[A-Z]/.test(completion); // New sentence
      factors.prefixSimilarity = startsNaturally ? 0.8 : 0.4;
   } else {
      factors.prefixSimilarity = 0.5;
   }

   // Stop reason factor
   if (metadata?.stopReason === "natural") {
      factors.stopReason = 1.0;
   } else if (metadata?.stopReason === "stop_sequence") {
      factors.stopReason = 0.9;
   } else {
      factors.stopReason = 0.6;
   }

   // Latency factor (faster = better, but too fast might be cached/bad)
   if (metadata?.latencyMs) {
      if (metadata.latencyMs < 100) {
         factors.latency = 0.7; // Suspiciously fast
      } else if (metadata.latencyMs < 500) {
         factors.latency = 1.0; // Ideal
      } else if (metadata.latencyMs < 2000) {
         factors.latency = 0.8; // Acceptable
      } else {
         factors.latency = 0.5; // Slow
      }
   } else {
      factors.latency = 0.7;
   }

   // Repetition factor (check for repeated words/phrases)
   const words = completion.toLowerCase().split(/\s+/);
   const uniqueWords = new Set(words);
   const repetitionRatio = uniqueWords.size / Math.max(words.length, 1);
   factors.repetition = Math.max(0.3, repetitionRatio);

   // Calculate overall score (weighted average)
   const weights = {
      length: 0.15,
      prefixSimilarity: 0.25,
      stopReason: 0.2,
      latency: 0.15,
      repetition: 0.25,
   };

   const score =
      factors.length * weights.length +
      factors.prefixSimilarity * weights.prefixSimilarity +
      factors.stopReason * weights.stopReason +
      factors.latency * weights.latency +
      factors.repetition * weights.repetition;

   // Determine if we should show
   const shouldShow = score >= (defaultFIMConfig.confidenceThreshold ?? 0.7);

   return { score, factors, shouldShow };
}

// ============================================================================
// FIM Hooks
// ============================================================================

/**
 * Hook for managing FIM completion lifecycle
 */
export function useFIMCompletion(
   editor: LexicalEditor | null,
   config: FIMConfig = defaultFIMConfig,
) {
   const fimState = useFIMContext();
   const abortControllerRef = useRef<AbortController | null>(null);
   const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

   /**
    * Cancel any in-progress completion
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
      clearFIM();
   }, []);

   /**
    * Accept the current ghost text
    */
   const accept = useCallback(() => {
      if (!editor || !fimState.ghostText) return;

      const state = getFIMState();
      const ghostText = state.ghostText;

      editor.update(() => {
         const selection = $getSelection();
         if ($isRangeSelection(selection)) {
            selection.insertText(ghostText);
            const cursorPosition = selection.anchor.offset;
            incrementChainDepth(cursorPosition);
         }
      });

      // Clear ghost text but keep chain state
      setGhostText("");
      setFIMLoading(false);
   }, [editor, fimState.ghostText]);

   /**
    * Reject the current suggestion
    */
   const reject = useCallback(() => {
      clearFIM();
      resetChain();
   }, []);

   /**
    * Trigger a FIM completion
    */
   const trigger = useCallback(
      async (
         triggerType: FIMTriggerType = "debounce",
         streamFn: (request: FIMRequest) => AsyncIterable<FIMChunk>,
      ) => {
         if (!editor) return;

         // Cancel previous
         cancel();

         // Get current editor state
         let text = "";
         let cursorPosition = 0;

         editor.getEditorState().read(() => {
            const selection = $getSelection();
            if ($isRangeSelection(selection)) {
               const root = selection.anchor.getNode().getTopLevelElement();
               if (root) {
                  text = root.getTextContent();
                  cursorPosition = selection.anchor.offset;
               }
            }
         });

         if (!text) return;

         // Build context
         const { prefix, suffix } = buildFIMContext(text, cursorPosition);
         const cursorContext = buildCursorContext(text, cursorPosition);
         const editContext = detectEditIntent(text, cursorPosition);

         // Create request
         const request: FIMRequest = {
            prefix,
            suffix,
            triggerType,
            cursorContext,
            editContext,
         };

         // Calculate delay
         const delay = getTriggerDelay(triggerType, config);

         // Start session
         const completionId = crypto.randomUUID();
         startFIMSession(completionId, triggerType);

         // Debounce if needed
         if (delay > 0) {
            debounceTimerRef.current = setTimeout(async () => {
               await executeCompletion(request, completionId, streamFn);
            }, delay);
         } else {
            await executeCompletion(request, completionId, streamFn);
         }
      },
      [editor, cancel, config],
   );

   /**
    * Execute the actual completion
    */
   const executeCompletion = async (
      request: FIMRequest,
      completionId: string,
      streamFn: (request: FIMRequest) => AsyncIterable<FIMChunk>,
   ) => {
      // Create abort controller - capture locally to prevent memory leaks
      const controller = new AbortController();
      abortControllerRef.current = controller;
      const signal = controller.signal; // Capture locally before async iteration

      const startTime = performance.now();
      const chunks: string[] = []; // Use array accumulation instead of string concatenation

      try {
         setFIMLoading(true);

         for await (const chunk of streamFn(request)) {
            if (signal.aborted) return;

            // Check if still the current completion
            if (getFIMState().completionId !== completionId) return;

            if (chunk.text) {
               chunks.push(chunk.text);
               appendGhostText(chunk.text);
            }

            if (chunk.done) {
               const fullText = chunks.join("");
               const latencyMs = performance.now() - startTime;
               setFIMMetrics(
                  latencyMs,
                  chunk.metadata?.stopReason ?? "natural",
               );

               // Calculate confidence
               const { score, factors, shouldShow } = calculateConfidence(
                  fullText,
                  request,
                  { latencyMs, stopReason: chunk.metadata?.stopReason },
               );

               setConfidence(score, factors, shouldShow);

               if (!shouldShow) {
                  clearFIM();
               }
            }
         }

         completeFIMSession();
      } catch (error) {
         handleStreamError(error, "FIM");
         clearFIM();
      }
   };

   // Cleanup on unmount
   useEffect(() => {
      return () => {
         cancel();
      };
   }, [cancel]);

   return {
      ...fimState,
      trigger,
      accept,
      reject,
      cancel,
   };
}

// ============================================================================
// Diff Mode Utilities
// ============================================================================

/**
 * Create a diff suggestion for replacement mode
 */
export function createDiffSuggestion(
   original: string,
   suggestion: string,
   replaceRange?: { start: number; end: number },
): FIMDiffSuggestion {
   if (original && replaceRange) {
      return {
         type: "replace",
         original,
         suggestion,
         replaceRange,
      };
   }
   return {
      type: "insert",
      suggestion,
   };
}

/**
 * Apply a diff suggestion to the editor
 */
export function applyDiffSuggestion(
   editor: LexicalEditor,
   diff: FIMDiffSuggestion,
): void {
   editor.update(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return;

      if (diff.type === "replace" && diff.replaceRange) {
         // TODO: Implement range-based replacement
         selection.insertText(diff.suggestion);
      } else {
         selection.insertText(diff.suggestion);
      }
   });

   setDiffSuggestion(null);
}
