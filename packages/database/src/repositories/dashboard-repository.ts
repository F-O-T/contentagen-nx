import { AppError, propagateError } from "@packages/utils/errors";
import { and, desc, eq } from "drizzle-orm";
import type { DatabaseInstance } from "../client";
import { DEFAULT_INSIGHTS } from "../default-insights";
import {
   type Dashboard,
   type DashboardTile,
   dashboards,
   type NewDashboard,
} from "../schemas/dashboards";
import { insights } from "../schemas/insights";

export async function createDashboard(
   db: DatabaseInstance,
   data: NewDashboard,
) {
   try {
      const [dashboard] = await db.insert(dashboards).values(data).returning();
      return dashboard;
   } catch (err) {
      propagateError(err);
      throw AppError.database("Failed to create dashboard");
   }
}

export async function listDashboards(
   db: DatabaseInstance,
   organizationId: string,
) {
   try {
      return await db
         .select()
         .from(dashboards)
         .where(eq(dashboards.organizationId, organizationId))
         .orderBy(desc(dashboards.updatedAt));
   } catch (err) {
      propagateError(err);
      throw AppError.database("Failed to list dashboards");
   }
}

export async function listDashboardsByTeam(
   db: DatabaseInstance,
   teamId: string,
) {
   try {
      return await db
         .select()
         .from(dashboards)
         .where(eq(dashboards.teamId, teamId))
         .orderBy(desc(dashboards.updatedAt));
   } catch (err) {
      propagateError(err);
      throw AppError.database("Failed to list dashboards by team");
   }
}

export async function getDashboardById(
   db: DatabaseInstance,
   dashboardId: string,
) {
   try {
      const [dashboard] = await db
         .select()
         .from(dashboards)
         .where(eq(dashboards.id, dashboardId));
      return dashboard ?? null;
   } catch (err) {
      propagateError(err);
      throw AppError.database("Failed to get dashboard");
   }
}

export async function updateDashboard(
   db: DatabaseInstance,
   dashboardId: string,
   data: Partial<Pick<NewDashboard, "name" | "description">>,
) {
   try {
      const [updated] = await db
         .update(dashboards)
         .set(data)
         .where(eq(dashboards.id, dashboardId))
         .returning();
      return updated;
   } catch (err) {
      propagateError(err);
      throw AppError.database("Failed to update dashboard");
   }
}

export async function updateDashboardTiles(
   db: DatabaseInstance,
   dashboardId: string,
   tiles: DashboardTile[],
) {
   try {
      const [updated] = await db
         .update(dashboards)
         .set({ tiles })
         .where(eq(dashboards.id, dashboardId))
         .returning();
      return updated;
   } catch (err) {
      propagateError(err);
      throw AppError.database("Failed to update dashboard tiles");
   }
}

export async function deleteDashboard(
   db: DatabaseInstance,
   dashboardId: string,
) {
   try {
      await db.delete(dashboards).where(eq(dashboards.id, dashboardId));
   } catch (err) {
      propagateError(err);
      throw AppError.database("Failed to delete dashboard");
   }
}

/**
 * Create default insights for a new organization
 */
async function createDefaultInsights(
   db: DatabaseInstance,
   organizationId: string,
   teamId: string,
   userId: string,
): Promise<string[]> {
   try {
      const insightRecords = DEFAULT_INSIGHTS.map((def) => ({
         organizationId,
         teamId,
         createdBy: userId,
         name: def.name,
         description: def.description,
         type: def.type,
         config: def.config as Record<string, unknown>,
         defaultSize: def.defaultSize,
      }));

      const created = await db
         .insert(insights)
         .values(insightRecords)
         .returning({ id: insights.id });

      return created.map((r) => r.id);
   } catch (err) {
      propagateError(err);
      throw AppError.database("Failed to create default insights");
   }
}

export async function getDefaultDashboard(
   db: DatabaseInstance,
   organizationId: string,
   teamId: string,
   userId: string,
): Promise<Dashboard> {
   try {
      const result = await db
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

      // If default dashboard exists, return it
      if (result[0]) {
         return result[0];
      }

      // Create default insights first
      const insightIds = await createDefaultInsights(
         db,
         organizationId,
         teamId,
         userId,
      );

      // Build tiles from insights (using their default sizes and order)
      const tiles: DashboardTile[] = insightIds.map((insightId, index) => {
         const defaultInsight = DEFAULT_INSIGHTS[index];
         if (!defaultInsight) {
            throw AppError.internal("Mismatch between insights and definitions");
         }
         return {
            insightId,
            size: defaultInsight.defaultSize,
            order: index,
         };
      });

      // Create the default dashboard with tiles
      const [newDashboard] = await db
         .insert(dashboards)
         .values({
            organizationId,
            teamId,
            createdBy: userId,
            name: "Dashboard Principal",
            description: "Seu painel de análise principal",
            isDefault: true,
            tiles,
         })
         .returning();

      if (!newDashboard) {
         throw AppError.database("Failed to create default dashboard");
      }

      return newDashboard;
   } catch (err) {
      propagateError(err);
      throw AppError.database("Failed to get or create default dashboard");
   }
}
