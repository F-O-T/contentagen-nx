import { eq, desc } from "drizzle-orm";
import type { DatabaseInstance } from "../client";
import {
   competitorSummary,
   type CompetitorSummaryInsert,
   type CompetitorSummarySelect,
} from "../schema";

export async function getCompetitorSummaryByOrganization(
   db: DatabaseInstance,
   organizationId: string,
): Promise<CompetitorSummarySelect | null> {
   const result = await db
      .select()
      .from(competitorSummary)
      .where(eq(competitorSummary.organizationId, organizationId))
      .orderBy(desc(competitorSummary.createdAt))
      .limit(1);

   return result[0] || null;
}

export async function createCompetitorSummary(
   db: DatabaseInstance,
   data: Omit<CompetitorSummaryInsert, "id" | "createdAt" | "updatedAt">,
) {
   const [result] = await db.insert(competitorSummary).values(data).returning();

   return result;
}

export async function updateCompetitorSummary(
   db: DatabaseInstance,
   id: string,
   data: Partial<
      Pick<
         CompetitorSummaryInsert,
         "summary" | "status" | "errorMessage" | "lastGeneratedAt"
      >
   >,
) {
   const [result] = await db
      .update(competitorSummary)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(competitorSummary.id, id))
      .returning();

   return result;
}

export async function getOrCreateCompetitorSummary(
   db: DatabaseInstance,
   organizationId: string,
   userId: string,
) {
   // Try to get existing summary first
   const existing = await getCompetitorSummaryByOrganization(
      db,
      organizationId,
   );
   if (existing) {
      return existing;
   }

   // Create new one if none exists
   return createCompetitorSummary(db, {
      organizationId,
      userId,
      status: "pending",
   });
}
