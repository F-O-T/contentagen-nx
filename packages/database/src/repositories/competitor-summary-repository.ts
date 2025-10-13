import { eq, and, desc } from "drizzle-orm";
import { type DB, type DBType } from "../client";
import {
   competitorSummary,
   type CompetitorSummaryInsert,
   type CompetitorSummarySelect,
   type CompetitorSummaryStatus,
} from "../schema";

export async function getCompetitorSummaryByOrganization(
   db: DB,
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
   db: DB,
   data: Omit<CompetitorSummaryInsert, "id" | "createdAt" | "updatedAt">,
): Promise<CompetitorSummarySelect> {
   const [result] = await db
      .insert(competitorSummary)
      .values(data)
      .returning();

   return result;
}

export async function updateCompetitorSummary(
   db: DB,
   id: string,
   data: Partial<Pick<CompetitorSummaryInsert, "summary" | "status" | "errorMessage" | "lastGeneratedAt">>,
): Promise<CompetitorSummarySelect> {
   const [result] = await db
      .update(competitorSummary)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(competitorSummary.id, id))
      .returning();

   return result;
}

export async function getOrCreateCompetitorSummary(
   db: DB,
   organizationId: string,
   userId: string,
): Promise<CompetitorSummarySelect> {
   // Try to get existing summary first
   const existing = await getCompetitorSummaryByOrganization(db, organizationId);
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