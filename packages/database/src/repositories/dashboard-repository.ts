import { AppError, propagateError } from "@packages/utils/errors";
import { and, desc, eq } from "drizzle-orm";
import type { DatabaseInstance } from "../client";
import {
   type Dashboard,
   type DashboardTile,
   dashboards,
   type NewDashboard,
} from "../schemas/dashboards";

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

export async function getDefaultDashboard(
   db: DatabaseInstance,
   organizationId: string,
): Promise<Dashboard | null> {
   try {
      const result = await db
         .select()
         .from(dashboards)
         .where(
            and(
               eq(dashboards.organizationId, organizationId),
               eq(dashboards.isDefault, true),
            ),
         )
         .limit(1);
      return result[0] ?? null;
   } catch (err) {
      propagateError(err);
      throw AppError.database("Failed to get default dashboard");
   }
}
