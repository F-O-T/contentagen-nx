import { ORPCError } from "@orpc/server";
import { computeInsightData } from "@packages/analytics/compute-insight";
import type { DatabaseInstance } from "@packages/database/client";
import { DEFAULT_INSIGHTS } from "@packages/database/default-insights";
import { createDefaultInsights } from "@packages/database/repositories/dashboard-repository";
import { getInsightById } from "@packages/database/repositories/insight-repository";
import { organization, team } from "@packages/database/schemas/auth";
import { content } from "@packages/database/schemas/content";
import { dashboards } from "@packages/database/schemas/dashboards";
import { forms } from "@packages/database/schemas/forms";
import { insights } from "@packages/database/schemas/insights";
import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { protectedProcedure } from "../server";

// =============================================================================
// Procedures
// =============================================================================

/**
 * Get the current onboarding status for both organization and project.
 * Used by the post-onboarding checklist on /home to auto-detect completed tasks.
 */
export const getOnboardingStatus = protectedProcedure.handler(
   async ({ context }) => {
      const { db, organizationId, teamId } = context;

      const org = await db.query.organization.findFirst({
         where: (o, { eq }) => eq(o.id, organizationId),
      });

      if (!org) {
         throw new ORPCError("NOT_FOUND", {
            message: "Organization not found",
         });
      }

      const currentTeam = await db.query.team.findFirst({
         where: (t, { eq }) => eq(t.id, teamId),
      });

      if (!currentTeam) {
         throw new ORPCError("NOT_FOUND", {
            message: "Team not found",
         });
      }

      const [
         contentCount,
         publishedContentCount,
         formCount,
         insightCount,
         dashboardCount,
      ] = await Promise.all([
         db
            .select({ count: sql<number>`count(*)` })
            .from(content)
            .where(eq(content.organizationId, organizationId))
            .then((rows) => Number(rows[0]?.count ?? 0)),
         db
            .select({ count: sql<number>`count(*)` })
            .from(content)
            .where(
               and(
                  eq(content.organizationId, organizationId),
                  eq(content.status, "published"),
               ),
            )
            .then((rows) => Number(rows[0]?.count ?? 0)),
         db
            .select({ count: sql<number>`count(*)` })
            .from(forms)
            .where(eq(forms.organizationId, organizationId))
            .then((rows) => Number(rows[0]?.count ?? 0)),
         db
            .select({ count: sql<number>`count(*)` })
            .from(insights)
            .where(eq(insights.organizationId, organizationId))
            .then((rows) => Number(rows[0]?.count ?? 0)),
         db
            .select({ count: sql<number>`count(*)` })
            .from(dashboards)
            .where(eq(dashboards.organizationId, organizationId))
            .then((rows) => Number(rows[0]?.count ?? 0)),
      ]);

      const storedTasks = currentTeam.onboardingTasks ?? {};
      const autoDetected: Record<string, boolean> = {};

      if (contentCount > 0) autoDetected.create_content = true;
      if (publishedContentCount > 0) autoDetected.publish_content = true;
      if (formCount > 0) autoDetected.create_form = true;
      if (insightCount > 0) autoDetected.create_insight = true;
      if (dashboardCount > 0) autoDetected.create_dashboard = true;

      const tasks = { ...storedTasks, ...autoDetected };

      return {
         organization: {
            onboardingCompleted: org.onboardingCompleted ?? false,
            name: org.name,
            slug: org.slug,
         },
         project: {
            onboardingCompleted: currentTeam.onboardingCompleted ?? false,
            onboardingProducts: currentTeam.onboardingProducts ?? null,
            tasks: Object.keys(tasks).length > 0 ? tasks : null,
            name: currentTeam.name,
         },
      };
   },
);

/**
 * Atomically merge a task ID into the team's onboardingTasks jsonb.
 */
async function markTaskDone(
   db: DatabaseInstance,
   teamId: string,
   taskId: string,
) {
   await db
      .update(team)
      .set({
         onboardingTasks: sql`COALESCE(${team.onboardingTasks}, '{}'::jsonb) || ${JSON.stringify({ [taskId]: true })}::jsonb`,
      })
      .where(eq(team.id, teamId));
}

/**
 * Mark a specific onboarding task as completed.
 */
export const completeTask = protectedProcedure
   .input(z.object({ taskId: z.string().min(1).max(100) }))
   .handler(async ({ context, input }) => {
      await markTaskDone(context.db, context.teamId, input.taskId);
      return { success: true };
   });

/**
 * Skip a specific onboarding task.
 */
export const skipTask = protectedProcedure
   .input(z.object({ taskId: z.string().min(1).max(100) }))
   .handler(async ({ context, input }) => {
      await markTaskDone(context.db, context.teamId, input.taskId);
      return { success: true };
   });

/**
 * Complete onboarding — sets selected products and marks both org and team as completed.
 * Uses DB directly to avoid Better Auth team membership check issues.
 */
export const completeOnboarding = protectedProcedure
   .input(
      z.object({
         products: z.array(z.enum(["content", "forms", "analytics"])),
      }),
   )
   .handler(async ({ context, input }) => {
      const { db, organizationId, teamId, userId } = context;

      console.log("[Onboarding] Starting completeOnboarding:", {
         organizationId,
         teamId,
         userId,
         products: input.products,
      });

      await db.transaction(async (tx) => {
         // Update team: set products and mark completed
         await tx
            .update(team)
            .set({
               onboardingProducts: input.products,
               onboardingCompleted: true,
            })
            .where(eq(team.id, teamId));

         console.log("[Onboarding] Team updated:", teamId);

         // Update org: mark completed
         await tx
            .update(organization)
            .set({ onboardingCompleted: true })
            .where(eq(organization.id, organizationId));

         console.log("[Onboarding] Organization updated:", organizationId);

         // Create default insights for the team
         const insightIds = await createDefaultInsights(
            tx,
            organizationId,
            teamId,
            userId,
         );

         console.log("[Onboarding] Created insights:", insightIds.length);

         // Compute initial cached data for each insight synchronously
         for (const insightId of insightIds) {
            try {
               const insight = await getInsightById(tx, insightId);
               if (!insight) continue;

               const freshData = await computeInsightData(tx, insight);

               await tx
                  .update(insights)
                  .set({
                     cachedResults: freshData,
                     lastComputedAt: new Date(),
                  })
                  .where(eq(insights.id, insightId));
            } catch (error) {
               // Log but don't fail onboarding if insight computation fails
               console.error(
                  `[Onboarding] Failed to compute insight ${insightId}:`,
                  error,
               );
            }
         }

         // Build tiles array from insight IDs
         const tiles = insightIds.map((insightId, index) => ({
            insightId,
            size: DEFAULT_INSIGHTS[index].defaultSize,
            order: index,
         }));

         console.log("[Onboarding] Creating dashboard with:", {
            organizationId,
            teamId,
            tilesCount: tiles.length,
         });

         // Get team name for dashboard
         const teamRecord = await tx.query.team.findFirst({
            where: (t, { eq }) => eq(t.id, teamId),
            columns: { name: true },
         });

         // Create default dashboard with tiles
         const [createdDashboard] = await tx
            .insert(dashboards)
            .values({
               organizationId,
               teamId,
               createdBy: userId,
               name: teamRecord?.name
                  ? `Dashboard ${teamRecord.name}`
                  : "Dashboard",
               description: null,
               isDefault: true,
               tiles,
            })
            .returning({ id: dashboards.id });

         console.log("[Onboarding] Dashboard created:", createdDashboard);
      });

      // Verify dashboard was created (outside transaction)
      const verifyDashboard = await db
         .select()
         .from(dashboards)
         .where(
            and(
               eq(dashboards.organizationId, organizationId),
               eq(dashboards.teamId, teamId),
               eq(dashboards.isDefault, true),
            ),
         )
         .limit(1);

      console.log("[Onboarding] Dashboard verification:", {
         found: verifyDashboard.length > 0,
         dashboard: verifyDashboard[0],
      });

      // Fetch org slug for navigation (outside transaction)
      const org = await db.query.organization.findFirst({
         where: (o, { eq }) => eq(o.id, organizationId),
         columns: { slug: true },
      });

      return { slug: org?.slug ?? "", teamId };
   });
