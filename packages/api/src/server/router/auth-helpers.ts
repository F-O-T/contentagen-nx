import { protectedProcedure, publicProcedure, router } from "../trpc";
import {
   getTotalAgents,
   listAgents,
} from "@packages/database/repositories/agent-repository";
import { getContentStatsLast30Days } from "@packages/database/repositories/content-repository";

export const authHelpersRouter = router({
   getApiKeys: protectedProcedure.query(async ({ ctx }) => {
      const resolvedCtx = await ctx;
      const apiKeys = await resolvedCtx.auth.api.listApiKeys({
         headers: resolvedCtx.headers,
      });
      return apiKeys;
   }),
   getDefaultOrganization: protectedProcedure.query(async ({ ctx }) => {
      const resolvedCtx = await ctx;
      const organization = await resolvedCtx.auth.api.getFullOrganization({
         headers: resolvedCtx.headers,
      });
      return organization;
   }),
   getCustomerState: protectedProcedure.query(async ({ ctx }) => {
      const resolvedCtx = await ctx;
      const customer = resolvedCtx.auth.api.state({
         headers: resolvedCtx.headers,
      });
      return customer;
   }),
   getSession: publicProcedure.query(async ({ ctx }) => {
      const resolvedCtx = await ctx;
      return resolvedCtx.session;
   }),
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
