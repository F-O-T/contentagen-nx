import { z } from "zod";
import { protectedProcedure, router } from "../trpc";
import { enqueueCreateBrandKnowledgeWorkflowJob } from "@packages/workers/queues/create-brand-knowledge-workflow-queue";

const OrganizationBrandKnowledgeInput = z.object({
   organizationId: z.string(),
   websiteUrl: z.url(),
});

export const organizationBrandKnowledgeRouter = router({
   generateBrandKnowledge: protectedProcedure
      .input(OrganizationBrandKnowledgeInput)
      .mutation(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;
         const userId = resolvedCtx.session?.user.id;
         
         if (!userId) {
            throw new Error("User not authenticated");
         }
         
         if (!input.organizationId || !input.websiteUrl) {
            throw new Error("Missing required fields: organizationId or websiteUrl");
         }
         
         // For organizations, we'll use the organizationId as the targetId
         await enqueueCreateBrandKnowledgeWorkflowJob({
            id: input.organizationId,
            userId: userId,
            websiteUrl: input.websiteUrl,
            target: "organization",
         });
         
         return { success: true };
      }),
});