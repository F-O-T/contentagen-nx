import type {
   EditChunk,
   EditRequest,
} from "@/features/editor/schemas";
import { client } from "@/integrations/orpc/client";

/**
 * Create Edit stream function for the editor
 * Returns an async generator that yields EditChunk objects
 */
export function createEditStreamFn() {
   return async function* editStream(
      request: EditRequest,
   ): AsyncIterable<EditChunk> {
      const result = await client.agent.editStream(request);

      // Handle both direct iteration and array results
      if (Symbol.asyncIterator in result) {
         for await (const chunk of result as AsyncIterable<EditChunk>) {
            yield chunk;
         }
      }
   };
}
