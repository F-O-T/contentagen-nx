import { relations, sql } from "drizzle-orm";
import {
   boolean,
   index,
   jsonb,
   pgTable,
   text,
   timestamp,
   uuid,
} from "drizzle-orm/pg-core";
import { organization, team, user } from "./auth";

export interface DashboardTile {
   insightId: string;
   size: "sm" | "md" | "lg" | "full";
   order: number;
}

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
      createdAt: timestamp("created_at").defaultNow().notNull(),
      updatedAt: timestamp("updated_at")
         .defaultNow()
         .$onUpdate(() => new Date())
         .notNull(),
   },
   (table) => [index("dashboards_team_idx").on(table.teamId)],
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
