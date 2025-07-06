import { auth, polarClient } from "@api/integrations/auth";
import { BILLING_EVENTS } from "./billing-constants";

export async function handleContentGenerationInsgestion(headers: Headers) {
   const hasFreeLimit = await userHasFreeGenerationLimit(headers);
   if (hasFreeLimit) {
      return;
   }
   const hasExceededLimit = await userHasAlreadyExceededLimit(headers);
   if (hasExceededLimit) {
      throw new Error(
         "You have exceeded your content generation limit for this month.",
      );
   }
   await auth.api.ingestion({
      headers,
      body: {
         event: BILLING_EVENTS.GENERATE_CONTENT,
         metadata: {
            amount: 1,
         },
      },
   });
   return;
}

async function userHasFreeGenerationLimit(headers: Headers) {
   const user = await auth.api.state({
      headers,
      query: {
         page: 1,
         limit: 1,
      },
   });
   if (user?.metadata?.freeGenerationLimit >= 1) {
      await polarClient.customers.update({
         id: user.id,
         customerUpdate: {
            metadata: {
               freeGenerationLimit: user.metadata.freeGenerationLimit - 1,
            },
         },
      });
      return true;
   }
   return false;
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
