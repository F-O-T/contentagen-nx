import { Condition } from "@f-o-t/condition-evaluator";
import { relations, sql } from "drizzle-orm";
import {
   boolean,
   index,
   jsonb,
   pgTable,
   text,
   timestamp,
   uniqueIndex,
   uuid,
} from "drizzle-orm/pg-core";
import { z } from "zod";
import { organization, team, user } from "./auth";

export interface DashboardTile {
   insightId: string;
   size: "sm" | "md" | "lg" | "full";
   order: number;
}

// Dashboard date range schema for JSONB
export const DashboardDateRangeSchema = z.object({
   type: z.enum(["relative", "absolute"]),
   value: z.string(), // "7d" | "30d" | "2024-01-01,2024-01-31"
});

export type DashboardDateRange = z.infer<typeof DashboardDateRangeSchema>;

// Dashboard filter schema for JSONB — uses @f-o-t/condition-evaluator Condition type
// Supports string, number, boolean, date, and array conditions with full operator sets.
export const DashboardFilterSchema = Condition;

export type DashboardFilter = z.infer<typeof DashboardFilterSchema>;

export const dashboards = pgTable(
   "dashboards",
   {
      id: uuid("id").default(sql`pg_catalog.gen_random_uuid()`).primaryKey(),
      organizationId: uuid("organization_id")
         .notNull()
         .references(() => organization.id, { onDelete: "cascade" }),
      teamId: uuid("team_id")
         .notNull()
         .references(() => team.id, { onDelete: "cascade" }),
      createdBy: uuid("created_by")
         .notNull()
         .references(() => user.id, { onDelete: "cascade" }),
      name: text("name").notNull(),
      description: text("description"),
      isDefault: boolean("is_default").default(false).notNull(),
      tiles: jsonb("tiles").$type<DashboardTile[]>().notNull().default([]),
      globalDateRange: jsonb("global_date_range").$type<DashboardDateRange>(),
      globalFilters: jsonb("global_filters")
         .$type<DashboardFilter[]>()
         .default([]),
      createdAt: timestamp("created_at").defaultNow().notNull(),
      updatedAt: timestamp("updated_at")
         .defaultNow()
         .$onUpdate(() => new Date())
         .notNull(),
   },
   (table) => [
      index("dashboards_team_idx").on(table.teamId),
      uniqueIndex("dashboards_team_default_idx")
         .on(table.teamId)
         .where(sql`${table.isDefault} = true`),
   ],
);

export const dashboardsRelations = relations(dashboards, ({ one }) => ({
   organization: one(organization, {
      fields: [dashboards.organizationId],
      references: [organization.id],
   }),
   team: one(team, {
      fields: [dashboards.teamId],
      references: [team.id],
   }),
   createdByUser: one(user, {
      fields: [dashboards.createdBy],
      references: [user.id],
   }),
}));

export type Dashboard = typeof dashboards.$inferSelect;
export type NewDashboard = typeof dashboards.$inferInsert;
