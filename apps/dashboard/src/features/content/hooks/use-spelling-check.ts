import { clientEnv } from "@packages/environment/client";
import { useCallback, useRef, useState } from "react";
import { useDebouncedCallback } from "@/hooks/use-debounced-callback";
import type { SpellingGrammarError } from "../types/diagnostics";

type UseSpellingCheckOptions = {
   debounceMs?: number;
   onError?: (error: Error) => void;
};

type SpellingCheckResponse = {
   errors: SpellingGrammarError[];
   latencyMs: number;
   error?: string;
};

export function useSpellingCheck(options: UseSpellingCheckOptions = {}) {
   const { debounceMs = 1500, onError } = options;

   const [errors, setErrors] = useState<SpellingGrammarError[]>([]);
   const [isChecking, setIsChecking] = useState(false);
   const abortControllerRef = useRef<AbortController | null>(null);

   const checkSpelling = useCallback(
      async (text: string) => {
         // Cancel previous request
         if (abortControllerRef.current) {
            abortControllerRef.current.abort();
         }

         // Don't check empty or very short text
         if (text.trim().length < 20) {
            setErrors([]);
            return;
         }

         abortControllerRef.current = new AbortController();
         setIsChecking(true);

         try {
            const response = await fetch(
               `${clientEnv.VITE_SERVER_URL}/api/agent/spelling/check`,
               {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  credentials: "include",
                  body: JSON.stringify({ text }),
                  signal: abortControllerRef.current.signal,
               },
            );

            if (!response.ok) {
               throw new Error("Spelling check failed");
            }

            const data: SpellingCheckResponse = await response.json();

            if (data.error) {
               throw new Error(data.error);
            }

            setErrors(data.errors || []);
         } catch (error) {
            if ((error as Error).name !== "AbortError") {
               onError?.(error as Error);
               console.error("Spelling check error:", error);
            }
         } finally {
            setIsChecking(false);
         }
      },
      [onError],
   );

   const { call: debouncedCheck, cancel: cancelCheck } = useDebouncedCallback(
      checkSpelling,
      debounceMs,
   );

   const applyFix = useCallback(
      (errorId: string): SpellingGrammarError | undefined => {
         const error = errors.find((e) => e.id === errorId);
         setErrors((prev) => prev.filter((e) => e.id !== errorId));
         return error;
      },
      [errors],
   );

   const ignoreFix = useCallback((errorId: string) => {
      setErrors((prev) =>
         prev.map((e) => (e.id === errorId ? { ...e, ignored: true } : e)),
      );
   }, []);

   const clearErrors = useCallback(() => {
      setErrors([]);
   }, []);

   const cancelPending = useCallback(() => {
      cancelCheck();
      if (abortControllerRef.current) {
         abortControllerRef.current.abort();
      }
   }, [cancelCheck]);

   return {
      errors: errors.filter((e) => !e.ignored),
      allErrors: errors,
      isChecking,
      checkSpelling: debouncedCheck,
      applyFix,
      ignoreFix,
      clearErrors,
      cancelPending,
   };
}
