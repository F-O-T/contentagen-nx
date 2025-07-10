import { auth, polarClient } from "@api/integrations/auth";
import { propagateError } from "@api/shared/errors";
import {
   POLAR_BILLING_EVENTS,
   handleContentMonthlyLimit,
   getPolarPlanBasedOnValue,
   handleAgentSlotsLimit,
} from "@packages/polar-billing";

async function getUserState(headers: Headers) {
   const state = await auth.api.state({
      headers,
      query: { page: 1, limit: 1 },
   });
   if (!state) {
      throw new Error("User not found");
   }
   const plan = getPolarPlanBasedOnValue(
      Number(state?.activeSubscriptions[0]?.amount || 0),
   );
   return { state, plan };
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
   const { state, plan } = await getUserState(headers);
   const generated = Number(state?.metadata?.generated) || 0;
   try {
      handleContentMonthlyLimit(generated, plan);
   } catch {
      return false;
   }
   await polarClient.customers.update({
      id: state.id,
      customerUpdate: {
         metadata: {
            generated: generated + 1,
         },
      },
   });
   return true;
}

export async function handleAgentSlots(headers: Headers) {
   const { state, plan } = await getUserState(headers);

   const agentSlots = state?.metadata?.agents || 0;

   handleAgentSlotsLimit(agentSlots, plan);

   await polarClient.customers.update({
      id: state.id,
      customerUpdate: {
         metadata: {
            agents: agentSlots + 1,
         },
      },
   });
}
