import { serverEnv } from "@packages/environment/server";
import { getPaymentClient } from "@packages/payment/client";
import {
   createAiUsageMetadata,
   ingestBilling,
} from "@packages/payment/ingestion";

export type MastraLLMUsage = {
   inputTokens: number;
   outputTokens: number;
   totalTokens: number;
   reasoningTokens?: number | null;
   cachedInputTokens?: number | null;
};

export async function ingestUsage(usage: MastraLLMUsage, userId: string) {
   const paymentClient = getPaymentClient(serverEnv.POLAR_ACCESS_TOKEN);
   const usageMetadata = createAiUsageMetadata({
      effort: "grok-4-fast",
      inputTokens: usage.inputTokens,
      outputTokens: usage.outputTokens,
   });
   await ingestBilling(paymentClient, {
      externalCustomerId: userId,
      metadata: usageMetadata,
   });
}
export function createToolSystemPrompt(toolInstructions: string[]): string {
   if (!toolInstructions.length) {
      return "No tools available.";
   }

   const header = "You have access to the following tools: \n\n";
   const footer =
      "\n Use these tools as needed to accomplish the user's request.";

   const formattedInstructions = toolInstructions
      .filter((instruction) => instruction?.trim())
      .map((instruction) => instruction.trim())
      .join("\n\n");

   return header + formattedInstructions + footer;
}
