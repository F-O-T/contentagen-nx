/**
 * Assistant Runtime Adapter
 *
 * Bridges ORPC chatStream backend to assistant-ui ChatModelAdapter.
 * Converts ORPC ChatChunk events to assistant-ui content parts.
 */

import type {
	ChatModelAdapter,
	TextMessagePart,
	ThreadMessage,
	ToolCallMessagePart,
} from "@assistant-ui/react";
import { client } from "@/integrations/orpc/client";

// =============================================================================
// Tool Categories
// =============================================================================

/**
 * Editor tools that manipulate the Lexical editor content
 */
export const EDITOR_TOOLS = [
	"insertText",
	"replaceText",
	"deleteText",
	"formatText",
	"insertHeading",
	"insertList",
	"insertImage",
	"insertLink",
	"insertTable",
	"insertQuote",
	"insertCode",
] as const;

/**
 * Frontmatter tools that update content metadata
 */
export const FRONTMATTER_TOOLS = [
	"editTitle",
	"editDescription",
	"editSlug",
	"editKeywords",
] as const;

/**
 * Research tools that fetch external data
 */
export const RESEARCH_TOOLS = [
	"webSearch",
	"webCrawl",
	"serpAnalysis",
] as const;

/**
 * SEO tools that analyze and optimize content
 */
export const SEO_TOOLS = ["analyzeSEO", "optimizeKeywords"] as const;

/**
 * All tool names
 */
export const ALL_TOOLS = [
	...EDITOR_TOOLS,
	...FRONTMATTER_TOOLS,
	...RESEARCH_TOOLS,
	...SEO_TOOLS,
] as const;

/**
 * Check if a tool name is an editor tool
 */
export function isEditorTool(name: string): boolean {
	return (EDITOR_TOOLS as readonly string[]).includes(name);
}

/**
 * Check if a tool name is a frontmatter tool
 */
export function isFrontmatterTool(name: string): boolean {
	return (FRONTMATTER_TOOLS as readonly string[]).includes(name);
}

/**
 * Check if a tool name is a research tool
 */
export function isResearchTool(name: string): boolean {
	return (RESEARCH_TOOLS as readonly string[]).includes(name);
}

/**
 * Check if a tool name is an SEO tool
 */
export function isSEOTool(name: string): boolean {
	return (SEO_TOOLS as readonly string[]).includes(name);
}

// =============================================================================
// Runtime Adapter
// =============================================================================

/**
 * Create a ChatModelAdapter that connects to the Contentta ORPC backend
 *
 * @param contentId - Optional content ID for context in agent calls
 * @returns ChatModelAdapter for assistant-ui runtime
 *
 * @example
 * ```tsx
 * const adapter = createContenttaAdapter(contentId);
 * const runtime = useLocalRuntime(adapter);
 * ```
 */
export function createContenttaAdapter(
	contentId?: string,
): ChatModelAdapter {
	return {
		async *run({ messages, abortSignal }) {
			// Get the last user message (use reverse iteration for findLast compatibility)
			const reversedMessages = [...messages].reverse();
			const lastMessage = reversedMessages.find((m) => m.role === "user");
			if (!lastMessage) {
				throw new Error("No user message found");
			}

			// Extract text from message content
			const messageText = extractMessageText(lastMessage);

			// Call ORPC chatStream
			const stream = await client.agent.chatStream({
				message: messageText,
				contentId,
			});

			// Accumulate content parts as we stream
			const contentParts: Array<TextMessagePart | ToolCallMessagePart> = [];

			// Track tool calls by ID for updating with results
			const toolCallIndices = new Map<string, number>();

			try {
				for await (const chunk of stream) {
					// Check for abort signal
					if (abortSignal?.aborted) {
						break;
					}

					// Convert chunk to assistant-ui format and accumulate
					switch (chunk.type) {
						case "text": {
							// Add text part
							contentParts.push({
								type: "text",
								text: chunk.text,
							});
							break;
						}

						case "tool_call_start": {
							const { id, name, args } = chunk.toolCall;
							// Add tool-call part
							const partIndex = contentParts.length;
							contentParts.push({
								type: "tool-call",
								toolCallId: id,
								toolName: name,
								args: args as any, // ORPC args are compatible with ReadonlyJSONObject
							});
							// Track index for later update
							toolCallIndices.set(id, partIndex);
							break;
						}

						case "tool_call_complete": {
							const { toolCallId, result } = chunk;
							// Update the existing tool-call part with result
							const partIndex = toolCallIndices.get(toolCallId);
							if (partIndex !== undefined) {
								const part = contentParts[partIndex] as ToolCallMessagePart;
								// Create updated part with result
								contentParts[partIndex] = {
									...part,
									result,
								};
							}
							break;
						}

						case "step_start":
						case "step_complete":
							// These are for internal tracking, don't yield
							break;

						case "error": {
							throw new Error(chunk.error);
						}

						case "done":
							// Final yield with all content
							yield {
								content: [...contentParts],
							};
							return;
					}

					// Yield current accumulated parts after each chunk
					yield {
						content: [...contentParts],
					};
				}

				// Final yield if stream ended without "done" event
				yield {
					content: [...contentParts],
				};
			} catch (error) {
				// Re-throw errors for assistant-ui to handle
				throw error;
			}
		},
	};
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Extract text content from a ThreadMessage
 */
function extractMessageText(message: ThreadMessage): string {
	if (typeof message.content === "string") {
		return message.content;
	}

	// For array content, concatenate all text parts
	return message.content
		.filter((part: { type: string }) => part.type === "text")
		.map((part: { text?: string }) => part.text ?? "")
		.join("");
}
