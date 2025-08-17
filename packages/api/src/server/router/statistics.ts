import { protectedProcedure, router } from "../trpc";
import {
   getTotalAgents,
   listAgents,
} from "@packages/database/repositories/agent-repository";
import { getContentStatsLast30Days } from "@packages/database/repositories/content-repository";

export const statisticsRouter = router({
   getHomeStats: protectedProcedure.query(async ({ ctx }) => {
      const resolvedCtx = await ctx;
      const db = resolvedCtx.db;
      const userId = resolvedCtx.session?.user.id;
      const organizationId = resolvedCtx.session?.session?.activeOrganizationId;
      // Get agents for user/org
      const totalAgents = await getTotalAgents(db, {
         userId,
         organizationId: organizationId ?? "",
      });
      const agents = await listAgents(db, {
         userId,
         organizationId: organizationId ?? "",
      });
      const agentIds = agents.map((a) => a.id);
      // Get content stats for last 30 days
      const contentStats = await getContentStatsLast30Days(db, agentIds, [
         "approved",
         "draft",
         "generating",
      ]);
      return {
         totalAgents,
         wordCount30d: contentStats.wordsCount,
         contentGenerated: contentStats.count,
      };
   }),
});
