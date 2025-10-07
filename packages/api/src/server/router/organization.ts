import { protectedProcedure, router } from "../trpc";
import { getTotalAgents } from "@packages/database/repositories/agent-repository";

export const organizationRouter = router({
   getOverviewStats: protectedProcedure.query(async ({ ctx }) => {
      const resolvedCtx = await ctx;
      const organizationId = resolvedCtx.session?.session?.activeOrganizationId;
      const db = resolvedCtx.db;
      if (!organizationId) {
         throw new Error("No active organization found");
      }

      try {
         // Get total agents for organization
         const totalAgents = await getTotalAgents(db, {
            organizationId,
         });

         const org = await resolvedCtx.auth.api.getFullOrganization({
            headers: resolvedCtx.headers,
         });

         return {
            totalAgents,
            totalMembers: org?.members?.length ?? 0,
         };
      } catch (error) {
         console.error("Failed to get organization overview stats:", error);
         throw new Error("Failed to retrieve organization statistics");
      }
   }),
});
