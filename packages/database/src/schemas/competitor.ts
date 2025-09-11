import { pgTable, uuid, text, timestamp, index } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { organization, user } from "./auth";
import { relations } from "drizzle-orm";
import { competitorFeature } from "./competitor-feature";
import type { CompetitorFeatureSelect } from "./competitor-feature";

export const competitor = pgTable(
   "competitor",
   {
      id: uuid("id").primaryKey().defaultRandom(),
      name: text("name").notNull(),
      websiteUrl: text("website_url").notNull(),
      changelogUrl: text("changelog_url"),
      userId: text("user_id").references(() => user.id, {
         onDelete: "cascade",
      }),
      organizationId: text("organization_id")
         .references(() => organization.id, { onDelete: "cascade" })
         .notNull(),
      createdAt: timestamp("created_at").defaultNow().notNull(),
      updatedAt: timestamp("updated_at")
         .defaultNow()
         .$onUpdate(() => new Date())
         .notNull(),
   },
   (table) => [
      index("competitor_organization_id_idx").on(table.organizationId),
      index("competitor_user_id_idx").on(table.userId),
   ],
);

export const competitorRelations = relations(competitor, ({ many }) => ({
   features: many(competitorFeature),
}));

export type CompetitorSelect = typeof competitor.$inferSelect;
export type CompetitorInsert = typeof competitor.$inferInsert;

export type CompetitorWithFeatures = CompetitorSelect & {
   features: CompetitorFeatureSelect[];
};

export const CompetitorInsertSchema = createInsertSchema(competitor);
export const CompetitorSelectSchema = createSelectSchema(competitor);
