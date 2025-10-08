import {
   pgTable,
   uuid,
   text,
   timestamp,
   jsonb,
   index,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { brand } from "./brand";
import { relations } from "drizzle-orm";
import z from "zod";

export const BrandFeatureMetaSchema = z.object({
   category: z
      .string()
      .describe(
         "Type of feature (e.g., 'User Interface', 'Analytics', 'Integration', etc.)",
      )
      .optional(),
   confidence: z
      .number()
      .min(0)
      .max(1)
      .describe("Confidence level that this is a real feature (0-1)")
      .optional(),
   tags: z
      .array(z.string())
      .optional()
      .describe("Relevant keywords or tags for this feature"),
});
export type BrandFeatureMeta = z.infer<typeof BrandFeatureMetaSchema>;

export const brandFeature = pgTable(
   "brand_feature",
   {
      id: uuid("id").primaryKey().defaultRandom(),
      brandId: uuid("brand_id")
         .notNull()
         .references(() => brand.id, { onDelete: "cascade" }),
      featureName: text("feature_name").notNull(),
      summary: text("summary").notNull(),
      rawContent: text("raw_content").notNull(),
      sourceUrl: text("source_url"),
      extractedAt: timestamp("extracted_at").defaultNow().notNull(),
      meta: jsonb("meta").$type<BrandFeatureMeta>().default({}),
   },
   (table) => [
      index("brand_feature_brand_id_feature_name_idx").on(
         table.brandId,
         table.featureName,
      ),
   ],
);

export const brandFeatureRelations = relations(brandFeature, ({ one }) => ({
   brand: one(brand, {
      fields: [brandFeature.brandId],
      references: [brand.id],
   }),
}));

export type BrandFeatureSelect = typeof brandFeature.$inferSelect;
export type BrandFeatureInsert = typeof brandFeature.$inferInsert;

export const BrandFeatureInsertSchema = createInsertSchema(brandFeature);
export const BrandFeatureSelectSchema = createSelectSchema(brandFeature);
