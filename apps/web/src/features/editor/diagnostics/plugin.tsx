/**
 * Diagnostics Plugin
 *
 * Lexical plugin for content diagnostics (word count, etc).
 * Uses Web Worker for calculations, debounced updates.
 */

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $getRoot } from "lexical";
import { useCallback, useEffect, useRef } from "react";
import { diagnosticsConfig } from "../core/config";
import {
   setDiagnostics,
   setDiagnosticsCalculating,
   useDiagnosticsState,
} from "../stores/diagnostics-store";
import {
   calculateReadingTime,
   countParagraphs,
   countSentences,
   getDiagnosticsClient,
} from "./client";

interface DiagnosticsPluginProps {
   /**
    * Whether diagnostics are enabled
    */
   enabled?: boolean;

   /**
    * Debounce delay in ms (default: 150)
    */
   debounceMs?: number;

   /**
    * Callback when diagnostics are updated
    */
   onUpdate?: (diagnostics: {
      wordCount: number;
      charCount: number;
      readingTimeMinutes: number;
      paragraphCount: number;
      sentenceCount: number;
   }) => void;
}

/**
 * Diagnostics Plugin Component
 *
 * Provides real-time content statistics:
 * - Word count
 * - Character count
 * - Reading time
 * - Paragraph count
 * - Sentence count
 */
export function DiagnosticsPlugin({
   enabled = true,
   debounceMs = diagnosticsConfig.debounceMs,
   onUpdate,
}: DiagnosticsPluginProps): null {
   const [editor] = useLexicalComposerContext();
   const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
   const lastTextRef = useRef<string>("");

   /**
    * Calculate diagnostics for the current content
    */
   const calculateDiagnostics = useCallback(async () => {
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

      setDiagnosticsCalculating(true);

      try {
         const client = getDiagnosticsClient();
         const { wordCount, charCount } = await client.count(text);

         // Calculate additional metrics (sync, fast)
         const readingTimeMinutes = calculateReadingTime(wordCount);
         const paragraphCount = countParagraphs(text);
         const sentenceCount = countSentences(text);

         const diagnostics = {
            wordCount,
            charCount,
            readingTimeMinutes,
            paragraphCount,
            sentenceCount,
            isCalculating: false,
         };

         setDiagnostics(diagnostics);
         onUpdate?.(diagnostics);
      } catch (error) {
         console.error("[DiagnosticsPlugin] Calculation failed:", error);
         setDiagnosticsCalculating(false);
      }
   }, [editor, enabled, onUpdate]);

   /**
    * Cancel current calculation
    */
   const cancelCalculation = useCallback(() => {
      if (debounceTimerRef.current) {
         clearTimeout(debounceTimerRef.current);
         debounceTimerRef.current = null;
      }
   }, []);

   /**
    * Schedule a debounced calculation
    */
   const scheduleCalculation = useCallback(() => {
      cancelCalculation();

      debounceTimerRef.current = setTimeout(() => {
         calculateDiagnostics();
      }, debounceMs);
   }, [cancelCalculation, calculateDiagnostics, debounceMs]);

   // Listen for text changes
   useEffect(() => {
      if (!enabled) return;

      const removeListener = editor.registerTextContentListener(() => {
         scheduleCalculation();
      });

      // Initial calculation
      scheduleCalculation();

      return () => {
         removeListener();
         cancelCalculation();
      };
   }, [editor, enabled, scheduleCalculation, cancelCalculation]);

   // Cleanup on unmount
   useEffect(() => {
      return () => {
         cancelCalculation();
      };
   }, [cancelCalculation]);

   return null;
}

/**
 * Hook to access diagnostics with the plugin
 */
export function useDiagnostics() {
   const state = useDiagnosticsState();

   return {
      wordCount: state.wordCount,
      charCount: state.charCount,
      readingTimeMinutes: state.readingTimeMinutes,
      paragraphCount: state.paragraphCount,
      sentenceCount: state.sentenceCount,
      isCalculating: state.isCalculating,
   };
}

/**
 * Format reading time for display
 */
export function formatReadingTime(minutes: number): string {
   if (minutes === 0) return "< 1 min";
   if (minutes === 1) return "1 min";
   return `${minutes} min`;
}

/**
 * Format word count for display
 */
export function formatWordCount(count: number): string {
   if (count === 0) return "0 palavras";
   if (count === 1) return "1 palavra";
   return `${count.toLocaleString()} palavras`;
}

/**
 * Format character count for display
 */
export function formatCharCount(count: number): string {
   if (count === 0) return "0 caracteres";
   if (count === 1) return "1 caractere";
   return `${count.toLocaleString()} caracteres`;
}
