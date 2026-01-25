/**
 * useContenttaRuntime Hook
 *
 * Creates an assistant-ui LocalRuntime connected to the Contentta backend.
 * Provides a runtime that streams text and tool calls from the writerAgent.
 * Loads chat history from database and restores messages on mount.
 */
import { useMemo } from "react";
import { useLocalRuntime } from "@assistant-ui/react";
import type { ThreadMessage } from "@assistant-ui/react";
import { createContenttaAdapter } from "@/features/content/lib/assistant-runtime-adapter";
import { orpc } from "@/integrations/orpc/client";
import { useQuery } from "@tanstack/react-query";

/**
 * Options for the Contentta runtime
 */
interface UseContenttaRuntimeOptions {
	/**
	 * Content ID for context in agent calls
	 */
	contentId?: string;
}

/**
 * Creates an assistant-ui LocalRuntime connected to the Contentta ORPC backend.
 * Automatically loads chat history from database when contentId is provided.
 *
 * @example
 * ```tsx
 * function ChatSidebar({ contentId }: { contentId: string }) {
 *   const runtime = useContenttaRuntime({ contentId });
 *
 *   return (
 *     <AssistantRuntimeProvider runtime={runtime}>
 *       <Thread />
 *       <Composer />
 *     </AssistantRuntimeProvider>
 *   );
 * }
 * ```
 */
export function useContenttaRuntime(options: UseContenttaRuntimeOptions = {}) {
	const { contentId } = options;

	// Load chat history from database
	const { data: chatHistory, isLoading } = useQuery(
		orpc.chat.getChatHistory.queryOptions({
			input: {
				contentId: contentId || "",
			},
			enabled: !!contentId,
			staleTime: 5 * 60 * 1000, // Cache for 5 minutes
		}),
	);
	// Create adapter with memoization
	const adapter = useMemo(
		() => createContenttaAdapter(contentId),
		[contentId],
	);

	// Create LocalRuntime with the adapter and initial messages
	const runtime = useLocalRuntime(adapter, {
		initialMessages: chatHistory?.messages as ThreadMessage[] | undefined,
	});

	return runtime;
}
