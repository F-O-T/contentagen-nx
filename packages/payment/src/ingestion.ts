import type { Polar } from "@polar-sh/sdk";
import type { EventCreateCustomer } from "@polar-sh/sdk/models/components/eventcreatecustomer.js";
import type { MODELS } from "@packages/openrouter/helpers";
export const POLAR_BILLING_EVENTS = {
   RAG: "rag",
   WEB_SEARCH: "web_search",
   LLM: "llm_usage",
} as const;

interface IngestBillingParams {
   event: keyof typeof POLAR_BILLING_EVENTS;
   externalCustomerId: string;
   metadata: EventCreateCustomer["metadata"];
}
export async function ingestBilling(
   client: Polar,
   params: IngestBillingParams,
) {
   await client.events.ingest({
      events: [
         {
            name: POLAR_BILLING_EVENTS[params.event],
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
   return {
      input_tokens: params.inputTokens,
      output_tokens: params.outputTokens,
      effort: params.effort,
      total_tokens: params.inputTokens + params.outputTokens,
   };
};
export const createWebSearchUsageMetadata = (params: {
   method: "crawl" | "search";
}) => {
   return {
      method: params.method,
   };
};
