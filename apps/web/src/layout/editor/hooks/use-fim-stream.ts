import { client } from "@/integrations/orpc/client";
import type { FIMRequest, FIMChunk, EditRequest, EditChunk, ChatChunk } from "@packages/editor";

/**
 * Create FIM stream function for the editor
 * Returns an async generator that yields FIMChunk objects
 */
export function createFIMStreamFn() {
	return async function* fimStream(request: FIMRequest): AsyncIterable<FIMChunk> {
		// Call ORPC procedure - returns AsyncIterable
		const result = await client.agent.fimStream(request);

		// Handle both direct iteration and array results
		if (Symbol.asyncIterator in result) {
			for await (const chunk of result as AsyncIterable<FIMChunk>) {
				yield chunk;
			}
		}
	};
}

/**
 * Create Edit stream function for the editor
 * Returns an async generator that yields EditChunk objects
 */
export function createEditStreamFn() {
	return async function* editStream(request: EditRequest): AsyncIterable<EditChunk> {
		const result = await client.agent.editStream(request);

		// Handle both direct iteration and array results
		if (Symbol.asyncIterator in result) {
			for await (const chunk of result as AsyncIterable<EditChunk>) {
				yield chunk;
			}
		}
	};
}

/**
 * Create Chat stream function for the ChatSidebar
 * Returns an async generator that yields ChatChunk objects
 */
export function createChatStreamFn(contentId?: string) {
	return async function* chatStream(message: string): AsyncIterable<ChatChunk> {
		const result = await client.agent.chatStream({ message, contentId });

		// Handle both direct iteration and array results
		if (Symbol.asyncIterator in result) {
			for await (const chunk of result as AsyncIterable<ChatChunk>) {
				yield chunk;
			}
		}
	};
}
