import { useMutation } from "@tanstack/react-query";
import { orpc } from "@/integrations/orpc/client";

/**
 * Hook for executing the unified content agent.
 *
 * The unified agent combines planning, research, writing, SEO auditing,
 * and review workflows into a single agent with direct access to 40+ tools.
 *
 * @example
 * ```tsx
 * const unifiedAgent = useUnifiedAgent();
 *
 * unifiedAgent.mutate({
 *    teamId: "...",
 *    contentId: "...",
 *    prompt: "Write an article about TypeScript generics",
 *    writerId: "...",
 *    model: "openrouter/moonshotai/kimi-k2.5",
 * });
 * ```
 */
export function useUnifiedAgent() {
   return useMutation(
      orpc.agent.executeUnifiedAgent.mutationOptions({
         onSuccess: (data) => {
            // Log success for debugging
            console.log("[Unified Agent] Completed:", {
               textLength: data.text.length,
               toolCallsCount: data.toolCalls?.length ?? 0,
               usage: data.usage,
            });
         },
         onError: (error) => {
            // Log error for debugging
            console.error("[Unified Agent] Failed:", error);
         },
      }),
   );
}
