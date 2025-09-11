import {
   pgTable,
   uuid,
   text,
   timestamp,
   jsonb,
   index,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { competitor } from "./competitor";
import { relations } from "drizzle-orm";

export const competitorFeature = pgTable(
   "competitor_feature",
   {
      id: uuid("id").primaryKey().defaultRandom(),
      competitorId: uuid("competitor_id")
         .notNull()
         .references(() => competitor.id, { onDelete: "cascade" }),
      featureName: text("feature_name").notNull(),
      summary: text("summary").notNull(),
      rawContent: text("raw_content").notNull(),
      sourceUrl: text("source_url"),
      extractedAt: timestamp("extracted_at").defaultNow().notNull(),
      meta: jsonb("meta").$type<Record<string, unknown>>().default({}),
   },
   (table) => [
      index("competitor_feature_competitor_id_feature_name_idx").on(
         table.competitorId,
         table.featureName,
      ),
   ],
);

export const competitorFeatureRelations = relations(
   competitorFeature,
   ({ one }) => ({
      competitor: one(competitor, {
         fields: [competitorFeature.competitorId],
         references: [competitor.id],
      }),
   }),
);

export type CompetitorFeatureSelect = typeof competitorFeature.$inferSelect;
export type CompetitorFeatureInsert = typeof competitorFeature.$inferInsert;

export const CompetitorFeatureInsertSchema =
   createInsertSchema(competitorFeature);
export const CompetitorFeatureSelectSchema =
   createSelectSchema(competitorFeature);
