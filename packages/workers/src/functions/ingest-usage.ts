import { serverEnv } from "@packages/environment/server";
import { getPaymentClient } from "@packages/payment/client";
import {
   ingestBilling,
   createAiUsageMetadata,
} from "@packages/payment/ingestion";
const polar = getPaymentClient(serverEnv.POLAR_ACCESS_TOKEN);

export async function runIngestBilling(payload: {
   params: Parameters<typeof ingestBilling>[1];
}) {
   const { params } = payload;
   try {
      const ingest = await ingestBilling(polar, params);
      return ingest;
   } catch (error) {
      console.error("Error on polar billing ingestions", error);
      throw error;
   }
}

export async function ingestLlmBilling({
   inputTokens,
   outputTokens,
   effort,
   userId,
}: {
   inputTokens?: number;
   outputTokens?: number;
   effort: Parameters<typeof createAiUsageMetadata>[0]["effort"];
   userId: string;
}) {
   if (!inputTokens || !outputTokens) {
      console.error("No tokens to ingest for LLM billing");
      throw new Error("No tokens to ingest for LLM billing");
   }
   return runIngestBilling({
      params: {
         metadata: createAiUsageMetadata({ effort, inputTokens, outputTokens }),
         event: "LLM",
         externalCustomerId: userId,
      },
   });
}
