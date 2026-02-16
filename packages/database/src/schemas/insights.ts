import { relations, sql } from "drizzle-orm";
import {
   index,
   jsonb,
   pgTable,
   text,
   timestamp,
   uuid,
} from "drizzle-orm/pg-core";
import { organization, team, user } from "./auth";

export const insights = pgTable(
   "insights",
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
      type: text("type").notNull(), // 'trends' | 'funnels' | 'retention'
      config: jsonb("config").$type<Record<string, unknown>>().notNull(),
      defaultSize: text("default_size").notNull().default("md"), // 'sm' | 'md' | 'lg' | 'full'
      cachedResults: jsonb("cached_results").$type<Record<string, unknown>>(),
      lastComputedAt: timestamp("last_computed_at", { withTimezone: true }),
      createdAt: timestamp("created_at").defaultNow().notNull(),
      updatedAt: timestamp("updated_at")
         .defaultNow()
         .$onUpdate(() => new Date())
         .notNull(),
   },
   (table) => [index("insights_team_idx").on(table.teamId)],
);

export const insightsRelations = relations(insights, ({ one }) => ({
   organization: one(organization, {
      fields: [insights.organizationId],
      references: [organization.id],
   }),
   team: one(team, {
      fields: [insights.teamId],
      references: [team.id],
   }),
   createdByUser: one(user, {
      fields: [insights.createdBy],
      references: [user.id],
   }),
}));

export type Insight = typeof insights.$inferSelect;
export type NewInsight = typeof insights.$inferInsert;
