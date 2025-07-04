import { auth } from "@api/integrations/auth";
import { env } from "@api/config/env";
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
      const isExceeded = await userHasAlreadyExceededLimit(payload.headers);

      if (isExceeded) {
         throw new Error("User has already exceeded the limit");
      }

      await contentGenerationQueue.add("process-content-request", payload);

      await updateUserUsageForContentGeneration(payload.headers);

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
async function userHasAlreadyExceededLimit(headers: Headers) {
   const meters = await auth.api.meters({
      headers,
      query: {
         page: 1,
         limit: 1,
      },
   });

   const usage = meters?.result?.items[0]?.consumedUnits ?? 0;
   const limit = meters?.result?.items[0]?.creditedUnits ?? 0;

   return usage >= limit;
}

async function updateUserUsageForContentGeneration(headers: Headers) {
   const isPremium = await isPremiumUser(headers);

   await auth.api.ingestion({
      headers,
      body: {
         event: "generated-content",
         metadata: {
            productId: isPremium ? env.POLAR_PREMIUM_PLAN : env.POLAR_FREE_PLAN,
            amount: 10,
         },
      },
   });
}

async function isPremiumUser(headers: Headers): Promise<boolean> {
   const subscriptions = await auth.api.subscriptions({
      headers,
      query: {
         active: true,
      },
   });

   const product = subscriptions?.result?.items[0]?.product;

   return product?.id === env.POLAR_PREMIUM_PLAN || false;
}
