import { relations, sql } from "drizzle-orm";
import {
   boolean,
   pgTable,
   text,
   timestamp,
   unique,
   uuid,
} from "drizzle-orm/pg-core";
import { organization } from "./auth";

export const propertyDefinitions = pgTable(
   "property_definitions",
   {
      id: uuid("id").default(sql`pg_catalog.gen_random_uuid()`).primaryKey(),
      organizationId: uuid("organization_id")
         .notNull()
         .references(() => organization.id, { onDelete: "cascade" }),
      name: text("name").notNull(),
      type: text("type").notNull(),
      description: text("description"),
      eventNames: text("event_names").array().$type<string[]>(),
      isNumerical: boolean("is_numerical").default(false).notNull(),
      tags: text("tags").array().$type<string[]>(),
      createdAt: timestamp("created_at").defaultNow().notNull(),
      updatedAt: timestamp("updated_at")
         .defaultNow()
         .$onUpdate(() => new Date())
         .notNull(),
   },
   (table) => [
      unique("uq_prop_def_org_name").on(table.organizationId, table.name),
   ],
);

export const propertyDefinitionsRelations = relations(
   propertyDefinitions,
   ({ one }) => ({
      organization: one(organization, {
         fields: [propertyDefinitions.organizationId],
         references: [organization.id],
      }),
   }),
);

export type PropertyDefinition = typeof propertyDefinitions.$inferSelect;
export type NewPropertyDefinition = typeof propertyDefinitions.$inferInsert;
