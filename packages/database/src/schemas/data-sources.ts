import { relations, sql } from "drizzle-orm";
import {
   boolean,
   integer,
   jsonb,
   pgTable,
   text,
   timestamp,
   uuid,
} from "drizzle-orm/pg-core";
import { organization } from "./auth";

export const dataSources = pgTable("data_sources", {
   id: uuid("id").default(sql`pg_catalog.gen_random_uuid()`).primaryKey(),
   organizationId: uuid("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
   name: text("name").notNull(),
   type: text("type").notNull(),
   description: text("description"),
   config: jsonb("config").$type<Record<string, unknown>>(),
   isActive: boolean("is_active").default(true).notNull(),
   lastEventAt: timestamp("last_event_at"),
   eventCount: integer("event_count").default(0).notNull(),
   createdAt: timestamp("created_at").defaultNow().notNull(),
   updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
});

export const dataSourcesRelations = relations(dataSources, ({ one }) => ({
   organization: one(organization, {
      fields: [dataSources.organizationId],
      references: [organization.id],
   }),
}));

export type DataSource = typeof dataSources.$inferSelect;
export type NewDataSource = typeof dataSources.$inferInsert;
