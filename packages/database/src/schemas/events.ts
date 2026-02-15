import { relations, sql } from "drizzle-orm";
import {
   boolean,
   decimal,
   index,
   jsonb,
   pgTable,
   text,
   timestamp,
   uuid,
} from "drizzle-orm/pg-core";
import { organization, team, user } from "./auth";

export const events = pgTable(
   "events",
   {
      id: uuid("id").default(sql`pg_catalog.gen_random_uuid()`).primaryKey(),
      organizationId: uuid("organization_id")
         .notNull()
         .references(() => organization.id, { onDelete: "cascade" }),
      eventName: text("event_name").notNull(),
      eventCategory: text("event_category").notNull(),
      properties: jsonb("properties")
         .$type<Record<string, unknown>>()
         .notNull(),
      userId: uuid("user_id").references(() => user.id, {
         onDelete: "set null",
      }),
      teamId: uuid("team_id")
         .notNull()
         .references(() => team.id, {
            onDelete: "cascade",
         }),
      isBillable: boolean("is_billable").default(true).notNull(),
      pricePerEvent: decimal("price_per_event", {
         precision: 10,
         scale: 6,
      }),
      timestamp: timestamp("timestamp").defaultNow().notNull(),
      ipAddress: text("ip_address"),
      userAgent: text("user_agent"),
      createdAt: timestamp("created_at").defaultNow().notNull(),
   },
   (table) => [
      index("events_org_time_idx").on(table.organizationId, table.timestamp),
      index("events_name_idx").on(table.eventName),
      index("events_category_idx").on(table.eventCategory),
      index("events_timestamp_idx").on(table.timestamp),
      index("events_team_time_idx").on(table.teamId, table.timestamp),
   ],
);

export const eventsRelations = relations(events, ({ one }) => ({
   organization: one(organization, {
      fields: [events.organizationId],
      references: [organization.id],
   }),
   user: one(user, {
      fields: [events.userId],
      references: [user.id],
   }),
   team: one(team, {
      fields: [events.teamId],
      references: [team.id],
   }),
}));

export type Event = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;
