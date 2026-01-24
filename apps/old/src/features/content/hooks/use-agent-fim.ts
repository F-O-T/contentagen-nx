import { clientEnv } from "@packages/environment/client";
import {
   captureFIMAccepted,
   captureFIMRejected,
   captureFIMShown,
} from "@packages/posthog/llm/client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Feature, useFeatureAccess } from "@/hooks/use-feature-access";

export interface AgentFIMRequest {
   prefix: string;
   suffix?: string;
   contextType?: string;
   maxTokens?: number;
   temperature?: number;
   stopSequences?: string[];
}

interface AgentFIMChunk {
   text: string;
   done: boolean;
   error?: string;
   metadata?: {
      latencyMs: number;
      totalLength?: number;
      shouldShow: boolean;
   };
}

export interface AgentFIMMetadata {
   latencyMs: number;
   totalLength?: number;
   shouldShow: boolean;
}

export interface UseAgentFIMOptions {
   onChunk: (text: string) => void;
   onComplete: (fullText: string, metadata?: AgentFIMMetadata) => void;
   onError: (error: Error) => void;
}

export function useAgentFIM({
   onChunk,
   onComplete,
   onError,
}: UseAgentFIMOptions) {
   const { hasFeature } = useFeatureAccess();
   const hasFIMFeature = hasFeature(Feature.FIM);

   const [isLoading, setIsLoading] = useState(false);
   const [error, setError] = useState<Error | null>(null);
   const abortControllerRef = useRef<AbortController | null>(null);

   // Analytics tracking refs
   const suggestionShownTimeRef = useRef<number | null>(null);
   const lastSuggestionRef = useRef<{
      text: string;
      completionLength: number;
   } | null>(null);

   // Use refs for callbacks to avoid recreating requestCompletion
   const onChunkRef = useRef(onChunk);
   const onCompleteRef = useRef(onComplete);
   const onErrorRef = useRef(onError);

   // Keep refs updated
   useEffect(() => {
      onChunkRef.current = onChunk;
      onCompleteRef.current = onComplete;
      onErrorRef.current = onError;
   }, [onChunk, onComplete, onError]);

   const cancelCompletion = useCallback(() => {
      if (abortControllerRef.current) {
         abortControllerRef.current.abort();
         abortControllerRef.current = null;
      }
      setIsLoading(false);
   }, []);

   const requestCompletion = useCallback(
      async (request: AgentFIMRequest) => {
         // Feature gate: silently skip if FIM is not available
         if (!hasFIMFeature) {
            return;
         }

         cancelCompletion();
         abortControllerRef.current = new AbortController();
         const signal = abortControllerRef.current.signal;

         setIsLoading(true);
         setError(null);
         let fullText = "";
         let finalMetadata: AgentFIMMetadata | undefined;

         try {
            // Use native fetch for true streaming
            const response = await fetch(
               `${clientEnv.VITE_SERVER_URL}/api/agent/fim/stream`,
               {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  credentials: "include",
                  body: JSON.stringify(request),
                  signal,
               },
            );

            if (!response.ok) {
               throw new Error(`Agent FIM request failed: ${response.status}`);
            }

            if (!response.body) {
               throw new Error("No response body");
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = "";

            try {
               while (true) {
                  const { done, value } = await reader.read();
                  if (done) break;
                  if (signal.aborted) break;

                  buffer += decoder.decode(value, { stream: true });
                  const lines = buffer.split("\n");
                  buffer = lines.pop() || "";

                  for (const line of lines) {
                     if (!line.trim()) continue;
                     try {
                        const chunk: AgentFIMChunk = JSON.parse(line);

                        if (chunk.error) {
                           throw new Error(chunk.error);
                        }

                        if (chunk.done) {
                           // Final chunk - extract metadata
                           finalMetadata = chunk.metadata;
                        } else if (chunk.text) {
                           fullText += chunk.text;
                           onChunkRef.current(chunk.text);
                        }
                     } catch (parseError) {
                        // Skip invalid JSON lines
                        if (
                           parseError instanceof SyntaxError ||
                           (parseError as Error).name === "SyntaxError"
                        ) {
                           continue;
                        }
                        throw parseError;
                     }
                  }
               }
            } finally {
               reader.releaseLock();
            }

            if (!signal.aborted) {
               // Track suggestion shown for analytics
               if (finalMetadata?.shouldShow && fullText) {
                  suggestionShownTimeRef.current = Date.now();
                  lastSuggestionRef.current = {
                     text: fullText,
                     completionLength: fullText.length,
                  };
                  captureFIMShown({
                     completionLength: fullText.length,
                  });
               }
               onCompleteRef.current(fullText, finalMetadata);
            }
         } catch (err) {
            if (!signal.aborted) {
               const error =
                  err instanceof Error ? err : new Error(String(err));
               setError(error);
               onErrorRef.current(error);
            }
         } finally {
            setIsLoading(false);
            abortControllerRef.current = null;
         }
      },
      [cancelCompletion, hasFIMFeature],
   );

   // Analytics: Track when user accepts a suggestion
   const handleAccept = useCallback(() => {
      if (lastSuggestionRef.current && suggestionShownTimeRef.current) {
         captureFIMAccepted({
            completionLength: lastSuggestionRef.current.completionLength,
            displayDurationMs: Date.now() - suggestionShownTimeRef.current,
         });
         // Reset tracking
         lastSuggestionRef.current = null;
         suggestionShownTimeRef.current = null;
      }
   }, []);

   // Analytics: Track when user rejects a suggestion
   const handleReject = useCallback(() => {
      if (lastSuggestionRef.current && suggestionShownTimeRef.current) {
         captureFIMRejected({
            completionLength: lastSuggestionRef.current.completionLength,
            displayDurationMs: Date.now() - suggestionShownTimeRef.current,
         });
         // Reset tracking
         lastSuggestionRef.current = null;
         suggestionShownTimeRef.current = null;
      }
   }, []);

   return {
      requestCompletion,
      cancelCompletion,
      handleAccept,
      handleReject,
      isLoading,
      error,
      isEnabled: hasFIMFeature,
   };
}
