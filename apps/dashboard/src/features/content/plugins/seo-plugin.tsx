import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $getRoot } from "lexical";
import { useCallback, useEffect, useRef, startTransition } from "react";
import {
   analyzeContent,
   type ContentAnalysisResult,
} from "@f-o-t/content-analysis";
import { useDebouncedCallback } from "@/hooks/use-debounced-callback";

type SeoPluginProps = {
   /** Content title for SEO analysis */
   title?: string;
   /** Meta description for SEO analysis */
   description?: string;
   /** Target keywords for SEO analysis */
   targetKeywords?: string[];
   /** Callback when analysis completes */
   onAnalysisComplete?: (result: ContentAnalysisResult) => void;
};

/**
 * Plugin that runs SEO and readability analysis on editor content.
 * Updates the diagnostics context with results.
 * Uses startTransition to avoid blocking the UI during analysis.
 */
export function SeoPlugin({
   title,
   description,
   targetKeywords,
   onAnalysisComplete,
}: SeoPluginProps) {
   const [editor] = useLexicalComposerContext();
   const lastTextRef = useRef<string>("");
   const lastMetaRef = useRef({ title, description, targetKeywords });
   const isFirstRender = useRef(true);

   const runAnalysis = useCallback(
      (content: string) => {
         // Don't analyze very short content
         if (content.length < 50) return;

         // Use startTransition to prevent blocking UI
         startTransition(() => {
            const result = analyzeContent({
               content,
               title,
               description,
               targetKeywords,
            });

            onAnalysisComplete?.(result);
         });
      },
      [title, description, targetKeywords, onAnalysisComplete],
   );

   // Debounce analysis to avoid running on every keystroke
   const { call: debouncedAnalysis } = useDebouncedCallback(runAnalysis, 2000);

   // Listen for editor changes
   useEffect(() => {
      const unregister = editor.registerUpdateListener(
         ({ editorState, tags }) => {
            // Skip updates from certain operations
            if (
               tags.has("history-merge") ||
               tags.has("edit-streaming") ||
               tags.has("fim-streaming")
            ) {
               return;
            }

            editorState.read(() => {
               const root = $getRoot();
               const text = root.getTextContent();

               // Only analyze if text has meaningfully changed
               if (text !== lastTextRef.current) {
                  lastTextRef.current = text;
                  
                  // Defer initial analysis to allow UI to render first
                  if (isFirstRender.current) {
                     isFirstRender.current = false;
                     setTimeout(() => debouncedAnalysis(text), 500);
                  } else {
                     debouncedAnalysis(text);
                  }
               }
            });
         },
      );

      return () => {
         unregister();
      };
   }, [editor, debouncedAnalysis]);

   // Re-run analysis when metadata changes
   useEffect(() => {
      const metaChanged =
         lastMetaRef.current.title !== title ||
         lastMetaRef.current.description !== description ||
         JSON.stringify(lastMetaRef.current.targetKeywords) !==
            JSON.stringify(targetKeywords);

      if (metaChanged && lastTextRef.current) {
         lastMetaRef.current = { title, description, targetKeywords };
         runAnalysis(lastTextRef.current);
      }
   }, [title, description, targetKeywords, runAnalysis]);

   return null;
}
