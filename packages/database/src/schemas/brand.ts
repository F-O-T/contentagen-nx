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
import { organization } from "./auth";
import { relations } from "drizzle-orm";
import { brandFeature } from "./brand-features";

export const brandKnowledgeStatusEnum = pgEnum("brand_knowledge_status", [
   "failed",
   "analyzing",
   "completed",
]);

export const brand = pgTable(
   "brand",
   {
      id: uuid("id").primaryKey().defaultRandom(),
      name: text("name").notNull(),
      websiteUrl: text("website_url"),
      description: text("description"),
      logoUrl: text("logo_url"),
      industry: text("industry"),
      status: brandKnowledgeStatusEnum("status").default("analyzing"),
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
   (table) => [index("brand_organization_id_idx").on(table.organizationId)],
);

export const brandRelations = relations(brand, ({ many, one }) => ({
   organization: one(organization),
   features: many(brandFeature),
}));

export type BrandSelect = typeof brand.$inferSelect;
export type BrandInsert = typeof brand.$inferInsert;
export type BrandKnowledgeStatus =
   (typeof brandKnowledgeStatusEnum.enumValues)[number];

export const BrandInsertSchema = createInsertSchema(brand);
export const BrandSelectSchema = createSelectSchema(brand);
