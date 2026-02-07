import { sql } from "drizzle-orm";
import {
   boolean,
   decimal,
   integer,
   pgTable,
   text,
   timestamp,
   uuid,
} from "drizzle-orm/pg-core";

export const eventCatalog = pgTable("event_catalog", {
   id: uuid("id").default(sql`pg_catalog.gen_random_uuid()`).primaryKey(),
   eventName: text("event_name").unique().notNull(),
   category: text("category").notNull(),
   pricePerEvent: decimal("price_per_event", {
      precision: 10,
      scale: 6,
   }).notNull(),
   freeTierLimit: integer("free_tier_limit").default(0).notNull(),
   displayName: text("display_name").notNull(),
   description: text("description"),
   isBillable: boolean("is_billable").default(true).notNull(),
   isActive: boolean("is_active").default(true).notNull(),
   createdAt: timestamp("created_at").defaultNow().notNull(),
   updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
});

export type EventCatalogEntry = typeof eventCatalog.$inferSelect;
export type NewEventCatalogEntry = typeof eventCatalog.$inferInsert;
