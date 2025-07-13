import { handleContentGenerationInsgestion } from "@api/modules/billing/billing-service";
import { contentGenerationQueue } from "../workers/content-generation-worker";

export interface EnqueueContentRequestPayload {
   requestId: string;
   approved: boolean;
   isCompleted: boolean;
   headers: Headers;
   options?: {
      useTavilyWebSearch?: boolean;
      tavilyMaxResults?: number;
      // add other options as needed
   };
}

export async function enqueueContentRequest(
   payload: EnqueueContentRequestPayload,
): Promise<void> {
   try {
      await handleContentGenerationInsgestion(payload.headers);
      // Wrap options if not already present
      const jobPayload = {
         ...payload,
         options: {
            ...(payload.options || {}),
            useTavilyWebSearch: payload.options?.useTavilyWebSearch,
            tavilyMaxResults: payload.options?.tavilyMaxResults,
            // add other options as needed
         },
      };
      await contentGenerationQueue.add("process-content-request", jobPayload);

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
