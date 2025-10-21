import { organizationProcedure, hasGenerationCredits, router } from "../trpc";
import { contentaSdk } from "@packages/contenta-sdk";
import { z } from "zod";

export const assistantRouter = router({
   sendMessage: organizationProcedure
      .use(hasGenerationCredits)
      .input(
         z.object({
            message: z.string(),
            agentId: z.string(),
         }),
      )
      .mutation(async ({ input }) => {
         try {
            const stream = contentaSdk.streamAssistantResponse({
               message: input.message,
               agentId: input.agentId,
            });

            const response = [];
            for await (const chunk of stream) {
               response.push(chunk);
            }

            return {
               success: true,
               response: response.join(""),
            };
         } catch (error) {
            console.error("Error in sendMessage:", error);
            throw new Error("Failed to process message");
         }
      }),
});
