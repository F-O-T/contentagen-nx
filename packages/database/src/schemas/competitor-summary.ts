import {
   pgTable,
   uuid,
   text,
   timestamp,
   index,
   pgEnum,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { organization, user } from "./auth";

export const competitorSummaryStatusEnum = pgEnum("competitor_summary_status", [
   "pending",
   "generating",
   "completed",
   "failed",
]);

export const competitorSummary = pgTable(
   "competitor_summary",
   {
      id: uuid("id").primaryKey().defaultRandom(),
      organizationId: text("organization_id")
         .references(() => organization.id, { onDelete: "cascade" })
         .notNull(),
      userId: text("user_id")
         .references(() => user.id, {
            onDelete: "cascade",
         })
         .notNull(),
      summary: text("summary"), // The markdown summary content
      status: competitorSummaryStatusEnum("status").default("pending"),
      errorMessage: text("error_message"), // Store error messages if generation fails
      lastGeneratedAt: timestamp("last_generated_at"),
      createdAt: timestamp("created_at").defaultNow().notNull(),
      updatedAt: timestamp("updated_at")
         .defaultNow()
         .$onUpdate(() => new Date())
         .notNull(),
   },
   (table) => [
      index("competitor_summary_organization_id_idx").on(table.organizationId),
      index("competitor_summary_user_id_idx").on(table.userId),
      index("competitor_summary_status_idx").on(table.status),
   ],
);

export type CompetitorSummarySelect = typeof competitorSummary.$inferSelect;
export type CompetitorSummaryInsert = typeof competitorSummary.$inferInsert;
export type CompetitorSummaryStatus =
   (typeof competitorSummaryStatusEnum.enumValues)[number];

export const CompetitorSummaryInsertSchema =
   createInsertSchema(competitorSummary);
export const CompetitorSummarySelectSchema =
   createSelectSchema(competitorSummary);

