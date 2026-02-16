import { AppError, propagateError } from "@packages/utils/errors";
import { and, desc, eq, inArray } from "drizzle-orm";
import type { DatabaseInstance } from "../client";
import { insights, type NewInsight } from "../schemas/insights";

export async function createInsight(db: DatabaseInstance, data: NewInsight) {
   try {
      const [insight] = await db.insert(insights).values(data).returning();
      return insight;
   } catch (err) {
      propagateError(err);
      throw AppError.database("Failed to create insight");
   }
}

export async function listInsights(
   db: DatabaseInstance,
   organizationId: string,
   type?: string,
) {
   try {
      const conditions = [eq(insights.organizationId, organizationId)];
      if (type) {
         conditions.push(eq(insights.type, type));
      }

      return await db
         .select()
         .from(insights)
         .where(and(...conditions))
         .orderBy(desc(insights.updatedAt));
   } catch (err) {
      propagateError(err);
      throw AppError.database("Failed to list insights");
   }
}

export async function listInsightsByTeam(
   db: DatabaseInstance,
   teamId: string,
   type?: string,
) {
   try {
      const conditions = [eq(insights.teamId, teamId)];
      if (type) {
         conditions.push(eq(insights.type, type));
      }

      return await db
         .select()
         .from(insights)
         .where(and(...conditions))
         .orderBy(desc(insights.updatedAt));
   } catch (err) {
      propagateError(err);
      throw AppError.database("Failed to list insights by team");
   }
}

export async function getInsightById(db: DatabaseInstance, insightId: string) {
   try {
      const [insight] = await db
         .select()
         .from(insights)
         .where(eq(insights.id, insightId));
      return insight ?? null;
   } catch (err) {
      propagateError(err);
      throw AppError.database("Failed to get insight");
   }
}

export async function getInsightsByIds(
   db: DatabaseInstance,
   insightIds: string[],
) {
   if (insightIds.length === 0) {
      return [];
   }

   try {
      return await db
         .select()
         .from(insights)
         .where(inArray(insights.id, insightIds));
   } catch (err) {
      propagateError(err);
      throw AppError.database("Failed to get insights by IDs");
   }
}

export async function updateInsight(
   db: DatabaseInstance,
   insightId: string,
   data: Partial<
      Pick<NewInsight, "name" | "description" | "config" | "defaultSize">
   >,
) {
   try {
      const [updated] = await db
         .update(insights)
         .set(data)
         .where(eq(insights.id, insightId))
         .returning();
      return updated;
   } catch (err) {
      propagateError(err);
      throw AppError.database("Failed to update insight");
   }
}

export async function deleteInsight(db: DatabaseInstance, insightId: string) {
   try {
      await db.delete(insights).where(eq(insights.id, insightId));
   } catch (err) {
      propagateError(err);
      throw AppError.database("Failed to delete insight");
   }
}
