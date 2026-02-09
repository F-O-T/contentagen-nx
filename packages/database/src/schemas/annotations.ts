import { relations, sql } from "drizzle-orm";
import { jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { organization, user } from "./auth";

export const annotations = pgTable("annotations", {
   id: uuid("id").default(sql`pg_catalog.gen_random_uuid()`).primaryKey(),
   organizationId: uuid("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
   createdBy: uuid("created_by").references(() => user.id, {
      onDelete: "set null",
   }),
   type: text("type").notNull().default("manual"), // 'manual' | 'auto'
   title: text("title").notNull(),
   description: text("description"),
   date: timestamp("date").notNull(),
   scope: text("scope").notNull().default("global"), // 'global' | 'content' | 'forms' | 'ai'
   metadata: jsonb("metadata").$type<Record<string, unknown>>(),
   createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const annotationsRelations = relations(annotations, ({ one }) => ({
   organization: one(organization, {
      fields: [annotations.organizationId],
      references: [organization.id],
   }),
   createdByUser: one(user, {
      fields: [annotations.createdBy],
      references: [user.id],
   }),
}));

export type Annotation = typeof annotations.$inferSelect;
export type NewAnnotation = typeof annotations.$inferInsert;
