import { ORPCError } from "@orpc/server";
import type { DatabaseInstance } from "@packages/database/client";
import { organization, user } from "@packages/database/schemas/auth";
import { content } from "@packages/database/schemas/content";
import { dashboards } from "@packages/database/schemas/dashboards";
import { forms } from "@packages/database/schemas/forms";
import { insights } from "@packages/database/schemas/insights";
import { createSlug } from "@packages/utils/text";
import { and, eq, ne, sql } from "drizzle-orm";
import { z } from "zod";
import { protectedProcedure } from "../server";

// =============================================================================
// Procedures
// =============================================================================

/**
 * Get the current onboarding status for the active organization.
 * Also runs auto-detection queries to determine which tasks should be
 * auto-completed based on existing data.
 */
export const getOnboardingStatus = protectedProcedure.handler(
   async ({ context }) => {
      const { db, organizationId } = context;

      const org = await db.query.organization.findFirst({
         where: (o, { eq }) => eq(o.id, organizationId),
      });

      if (!org) {
         throw new ORPCError("NOT_FOUND", {
            message: "Organization not found",
         });
      }

      // Run auto-detection queries in parallel to count existing resources
      const [contentCount, publishedContentCount, formCount, insightCount, dashboardCount] =
         await Promise.all([
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

      // Merge stored tasks with auto-detected completions
      const storedTasks = org.onboardingTasks ?? {};
      const autoDetected: Record<string, boolean> = {};

      if (contentCount > 0) {
         autoDetected["create_content"] = true;
      }
      if (publishedContentCount > 0) {
         autoDetected["publish_content"] = true;
      }
      if (formCount > 0) {
         autoDetected["create_form"] = true;
      }
      if (insightCount > 0) {
         autoDetected["create_insight"] = true;
      }
      if (dashboardCount > 0) {
         autoDetected["create_dashboard"] = true;
      }

      const tasks = { ...storedTasks, ...autoDetected };

      return {
         onboardingCompleted: org.onboardingCompleted ?? false,
         onboardingProducts: org.onboardingProducts ?? null,
         tasks: Object.keys(tasks).length > 0 ? tasks : null,
         publicApiKey: org.publicApiKey ?? null,
      };
   },
);

/**
 * Complete the profile setup step: update user name and organization
 * name + slug.
 */
export const completeProfileSetup = protectedProcedure
   .input(
      z.object({
         userName: z.string().min(1).max(255),
         workspaceName: z.string().min(1).max(255),
      }),
   )
   .handler(async ({ context, input }) => {
      const { db, userId, organizationId } = context;

      const newSlug = createSlug(input.workspaceName);

      if (!newSlug) {
         throw new ORPCError("BAD_REQUEST", {
            message: "Invalid workspace name: cannot generate a valid slug",
         });
      }

      // Check if slug is already taken by another organization
      const existingOrg = await db
         .select({ id: organization.id })
         .from(organization)
         .where(
            and(
               eq(organization.slug, newSlug),
               ne(organization.id, organizationId),
            ),
         )
         .limit(1);

      if (existingOrg.length > 0) {
         throw new ORPCError("CONFLICT", {
            message:
               "An organization with this slug already exists. Please choose a different name.",
         });
      }

      // Update user name and organization name/slug in parallel
      await Promise.all([
         db
            .update(user)
            .set({ name: input.userName })
            .where(eq(user.id, userId)),
         db
            .update(organization)
            .set({ name: input.workspaceName, slug: newSlug })
            .where(eq(organization.id, organizationId)),
      ]);

      return { success: true, slug: newSlug };
   });

/**
 * Select products during onboarding. Stores the selected product
 * identifiers in the organization's onboardingProducts jsonb column.
 */
export const selectProducts = protectedProcedure
   .input(
      z.object({
         products: z
            .array(z.enum(["content", "forms", "analytics"]))
            .min(1, "At least one product must be selected"),
      }),
   )
   .handler(async ({ context, input }) => {
      const { db, organizationId } = context;

      await db
         .update(organization)
         .set({ onboardingProducts: input.products })
         .where(eq(organization.id, organizationId));

      return { success: true };
   });

/**
 * Mark onboarding as completed for the organization.
 */
export const completeOnboarding = protectedProcedure.handler(
   async ({ context }) => {
      const { db, organizationId } = context;

      await db
         .update(organization)
         .set({ onboardingCompleted: true })
         .where(eq(organization.id, organizationId));

      return { success: true };
   },
);

/**
 * Atomically merge a task ID into the organization's onboardingTasks jsonb.
 * Uses PostgreSQL's `||` operator to avoid read-modify-write race conditions.
 */
async function markTaskDone(
   db: DatabaseInstance,
   organizationId: string,
   taskId: string,
) {
   await db
      .update(organization)
      .set({
         onboardingTasks: sql`COALESCE(${organization.onboardingTasks}, '{}'::jsonb) || ${JSON.stringify({ [taskId]: true })}::jsonb`,
      })
      .where(eq(organization.id, organizationId));
}

/**
 * Mark a specific onboarding task as completed.
 * Atomically merges { [taskId]: true } into the organization's onboardingTasks jsonb.
 */
export const completeTask = protectedProcedure
   .input(
      z.object({
         taskId: z.string().min(1).max(100),
      }),
   )
   .handler(async ({ context, input }) => {
      const { db, organizationId } = context;
      await markTaskDone(db, organizationId, input.taskId);
      return { success: true };
   });

/**
 * Skip (dismiss) a specific onboarding task.
 * Functionally identical to completeTask: marks it as done so it
 * no longer appears as pending.
 */
export const skipTask = protectedProcedure
   .input(
      z.object({
         taskId: z.string().min(1).max(100),
      }),
   )
   .handler(async ({ context, input }) => {
      const { db, organizationId } = context;
      await markTaskDone(db, organizationId, input.taskId);
      return { success: true };
   });
