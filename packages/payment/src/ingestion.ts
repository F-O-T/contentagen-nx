import type { Polar } from "@polar-sh/sdk";
import type { EventCreateCustomer } from "@polar-sh/sdk/models/components/eventcreatecustomer.js";
import type { MODELS } from "@packages/openrouter/helpers";
export const POLAR_BILLING_EVENTS = {
   CREDIT: "credit",
} as const;

export const USAGE_TYPE = {
   LLM: "llm_usage",
   WEB_SEARCH: "web_search",
} as const;

export const BILLING_CONFIG = {
   webBaseCreditUsd: 0.008,
   margin: 0.1,
};

interface IngestBillingParams {
   externalCustomerId: string;
   metadata: EventCreateCustomer["metadata"];
}
export async function getCustomerState(
   client: Polar,
   externalId: IngestBillingParams["externalCustomerId"],
) {
   return await client.customers.getStateExternal({
      externalId,
   });
}

export async function ingestBilling(
   client: Polar,
   params: IngestBillingParams,
) {
   await client.events.ingest({
      events: [
         {
            name: POLAR_BILLING_EVENTS.CREDIT,
            externalCustomerId: params.externalCustomerId,
            metadata: params.metadata,
         },
      ],
   });
}
export const createAiUsageMetadata = (params: {
   inputTokens: number;
   outputTokens: number;
   effort: keyof typeof MODELS;
}) => {
   const creditsDebited = calculateCreditsDebited(
      params.inputTokens + params.outputTokens,
   );
   return {
      usage_type: USAGE_TYPE.LLM,
      input_tokens: params.inputTokens,
      output_tokens: params.outputTokens,
      effort: params.effort,
      credits_debited: creditsDebited,
   };
};
export const createWebSearchUsageMetadata = (params: {
   method: "crawl" | "search" | "advanced";
}) => {
   let baseAmount = 1;
   if (params.method === "crawl" || params.method === "advanced") {
      baseAmount = 2;
   }
   const creditsDebited = calculateCreditsDebited(baseAmount);
   return {
      usage_type: USAGE_TYPE.WEB_SEARCH,
      method: params.method,
      credits_debited: creditsDebited,
   };
};
function calculateCreditsDebited(amount: number) {
   return Math.ceil(amount * BILLING_CONFIG.margin);
}
