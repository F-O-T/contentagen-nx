import { auth, polarClient } from "@api/integrations/auth";
import {
   POLAR_BILLING_EVENTS,
   handleContentMonthlyLimit,
   getPolarPlanBasedOnValue,
} from "@packages/billing-limits";

async function getUserState(headers: Headers) {
   const user = await auth.api.state({
      headers,
      query: { page: 1, limit: 1 },
   });
   if (!user) {
      throw new Error("User not found");
   }
   const plan = getPolarPlanBasedOnValue(Number(user.acttiveSubscription[0].amount || 0));
   return { user, plan };
}

export async function handleContentGenerationInsgestion(headers: Headers) {
   const hasFreeLimit = await userHasFreeGenerationLimit(headers);
   if (hasFreeLimit) {
      return;
   }
   const { plan } = await getUserState(headers);
   const meters = await auth.api.meters({
      headers,
      query: { page: 1, limit: 1 },
   });
   const usage = meters?.result?.items[0]?.consumedUnits ?? 0;
   handleContentMonthlyLimit(usage, plan);
   await auth.api.ingestion({
      headers,
      body: {
         event: POLAR_BILLING_EVENTS.GENERATE_CONTENT,
         metadata: {
            amount: 1,
         },
      },
   });
   return;
}

async function userHasFreeGenerationLimit(headers: Headers) {
   const { user, plan } = await getUserState(headers);
   const generated = Number(user?.metadata?.generated) || 0;
   try {
      handleContentMonthlyLimit(generated, plan);
   } catch {
      return false;
   }
   await polarClient.customers.update({
      id: user.id,
      customerUpdate: {
         metadata: {
            generated: generated + 1,
         },
      },
   });
   return true;
}
