import {
   pgTable,
   uuid,
   text,
   timestamp,
   index,
   pgEnum,
   jsonb,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { organization, user } from "./auth";
import { relations } from "drizzle-orm";
import { competitorFeature } from "./competitor-feature";
import type { CompetitorFeatureSelect } from "./competitor-feature";

export const competitorFeaturesStatusEnum = pgEnum(
   "competitor_features_status",
   ["pending", "crawling", "analyzing", "completed", "failed"],
);

export const competitorAnalysisStatusEnum = pgEnum(
   "competitor_analysis_status",
   ["pending", "analyzing", "chunking", "completed", "failed"],
);

export const competitor = pgTable(
   "competitor",
   {
      id: uuid("id").primaryKey().defaultRandom(),
      websiteUrl: text("website_url").notNull(),
      name: text("name"),
      description: text("description"),
      summary: text("summary"),
      logoPhoto: text("logo_photo"),
      featuresStatus:
         competitorFeaturesStatusEnum("features_status").default("pending"),
      analysisStatus:
         competitorAnalysisStatusEnum("analysis_status").default("pending"),
      userId: text("user_id").references(() => user.id, {
         onDelete: "cascade",
      }),
      organizationId: text("organization_id")
         .references(() => organization.id, { onDelete: "cascade" })
         .notNull(),
      uploadedFiles: jsonb("uploaded_files")
         .$type<{ fileName: string; fileUrl: string; uploadedAt: string }[]>()
         .default([]),
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
export type CompetitorFeaturesStatus =
   (typeof competitorFeaturesStatusEnum.enumValues)[number];
export type CompetitorAnalysisStatus =
   (typeof competitorAnalysisStatusEnum.enumValues)[number];

export type CompetitorWithFeatures = CompetitorSelect & {
   features: CompetitorFeatureSelect[];
};

export const CompetitorInsertSchema = createInsertSchema(competitor);
export const CompetitorSelectSchema = createSelectSchema(competitor);
