import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $getRoot } from "lexical";
import { useEffect, useRef } from "react";
import {
   setGrammarErrors,
   setIsChecking,
   setSpellingErrors,
} from "@/features/content/context/diagnostics-context";
import { useSpellingCheck } from "@/features/content/hooks/use-spelling-check";

/**
 * Plugin that runs spelling/grammar checks on editor content.
 * Uses the typo-js spelling check hook and updates the diagnostics context.
 * Defers initial check to avoid blocking UI on page load.
 */
export function SpellingPlugin() {
   const [editor] = useLexicalComposerContext();
   const lastTextRef = useRef<string>("");
   const isFirstCheck = useRef(true);

   const { checkSpelling, isChecking, errors, cancelPending } =
      useSpellingCheck({
         debounceMs: 2000, // Check 2 seconds after user stops typing
         onError: (error) => {
            console.error("Spelling check error:", error);
         },
      });

   // Update diagnostics context when checking status changes
   useEffect(() => {
      setIsChecking(isChecking);
   }, [isChecking]);

   // Update diagnostics context when errors change
   useEffect(() => {
      // Separate spelling and grammar errors
      const spellingErrors = errors.filter((e) => e.type === "spelling");
      const grammarErrors = errors.filter((e) => e.type === "grammar");

      setSpellingErrors(spellingErrors);
      setGrammarErrors(grammarErrors);
   }, [errors]);

   // Listen for editor changes and trigger spelling check
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

               // Only check if text has meaningfully changed
               if (text !== lastTextRef.current && text.length > 20) {
                  lastTextRef.current = text;

                  // Defer first spell check to allow UI to render
                  if (isFirstCheck.current) {
                     isFirstCheck.current = false;
                     setTimeout(() => checkSpelling(text), 1000);
                  } else {
                     checkSpelling(text);
                  }
               }
            });
         },
      );

      return () => {
         unregister();
         cancelPending();
      };
   }, [editor, checkSpelling, cancelPending]);

   return null;
}
