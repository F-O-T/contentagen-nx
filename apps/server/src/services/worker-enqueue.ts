import { handleContentGenerationInsgestion } from "@api/modules/billing/billing-service";
import { contentGenerationQueue } from "../workers/content-generation-worker";

export interface EnqueueContentRequestPayload {
   requestId: string;
   approved: boolean;
   isCompleted: boolean;
   headers: Headers;
}

export async function enqueueContentRequest(
   payload: EnqueueContentRequestPayload,
): Promise<void> {
   try {
      await handleContentGenerationInsgestion(payload.headers);
      await contentGenerationQueue.add("process-content-request", payload);

      console.log(
         `Successfully enqueued content request: ${payload.requestId}`,
      );
   } catch (error) {
      console.error(
         `Failed to enqueue content request ${payload.requestId}:`,
         error,
      );
      throw error;
   }
}
