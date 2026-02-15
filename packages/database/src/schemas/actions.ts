import { relations, sql } from "drizzle-orm";
import { boolean, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { organization, user } from "./auth";

export const actions = pgTable("actions", {
   id: uuid("id").default(sql`pg_catalog.gen_random_uuid()`).primaryKey(),
   organizationId: uuid("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
   name: text("name").notNull(),
   description: text("description"),
   eventPatterns: text("event_patterns").array().notNull().$type<string[]>(),
   matchType: text("match_type").notNull().default("any"),
   isActive: boolean("is_active").default(true).notNull(),
   createdBy: uuid("created_by").references(() => user.id, {
      onDelete: "set null",
   }),
   createdAt: timestamp("created_at").defaultNow().notNull(),
   updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
});

export const actionsRelations = relations(actions, ({ one }) => ({
   organization: one(organization, {
      fields: [actions.organizationId],
      references: [organization.id],
   }),
   createdByUser: one(user, {
      fields: [actions.createdBy],
      references: [user.id],
   }),
}));

export type Action = typeof actions.$inferSelect;
export type NewAction = typeof actions.$inferInsert;
