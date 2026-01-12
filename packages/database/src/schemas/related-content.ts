import { relations, sql } from "drizzle-orm";
import {
   index,
   integer,
   pgEnum,
   pgTable,
   timestamp,
   uuid,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { content } from "./content";

// Relation type enum
export const relatedContentTypeEnum = pgEnum("related_content_type", [
   "manual", // Manually linked by user
   "ai_suggested", // AI-suggested and approved
]);

export const relatedContent = pgTable(
   "related_content",
   {
      id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),
      sourceContentId: uuid("source_content_id")
         .notNull()
         .references(() => content.id, { onDelete: "cascade" }),
      targetContentId: uuid("target_content_id")
         .notNull()
         .references(() => content.id, { onDelete: "cascade" }),
      relationType: relatedContentTypeEnum("relation_type")
         .default("manual")
         .notNull(),
      position: integer("position").default(0).notNull(),
      createdAt: timestamp("created_at").defaultNow().notNull(),
   },
   (table) => [
      index("related_content_source_idx").on(table.sourceContentId),
      index("related_content_target_idx").on(table.targetContentId),
   ],
);

export const relatedContentRelations = relations(relatedContent, ({ one }) => ({
   sourceContent: one(content, {
      fields: [relatedContent.sourceContentId],
      references: [content.id],
      relationName: "relatedFrom",
   }),
   targetContent: one(content, {
      fields: [relatedContent.targetContentId],
      references: [content.id],
      relationName: "relatedTo",
   }),
}));

export type RelatedContent = typeof relatedContent.$inferSelect;
export type RelatedContentInsert = typeof relatedContent.$inferInsert;
export type RelatedContentType =
   (typeof relatedContentTypeEnum.enumValues)[number];

export const RelatedContentInsertSchema = createInsertSchema(relatedContent);
export const RelatedContentSelectSchema = createSelectSchema(relatedContent);
