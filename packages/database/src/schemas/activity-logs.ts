import { relations } from "drizzle-orm";
import {
   index,
   jsonb,
   pgTable,
   text,
   timestamp,
   uuid,
} from "drizzle-orm/pg-core";
import { organization, team, user } from "./auth";

export const activityLogs = pgTable(
   "activity_logs",
   {
      id: uuid("id").defaultRandom().primaryKey(),
      organizationId: uuid("organization_id")
         .notNull()
         .references(() => organization.id, { onDelete: "cascade" }),
      teamId: uuid("team_id")
         .notNull()
         .references(() => team.id, { onDelete: "cascade" }),
      userId: uuid("user_id").references(() => user.id, {
         onDelete: "set null",
      }),
      action: text("action").notNull(), // "created", "updated", "deleted", "published"
      resourceType: text("resource_type").notNull(), // "content", "form", "dashboard", "insight"
      resourceId: text("resource_id"),
      resourceName: text("resource_name"),
      metadata: jsonb("metadata").$type<Record<string, unknown>>(),
      ipAddress: text("ip_address"),
      userAgent: text("user_agent"),
      createdAt: timestamp("created_at").defaultNow().notNull(),
   },
   (table) => [
      index("activity_logs_team_idx").on(table.teamId),
      index("activity_logs_user_idx").on(table.userId),
      index("activity_logs_created_idx").on(table.createdAt),
      index("activity_logs_resource_idx").on(
         table.resourceType,
         table.resourceId,
      ),
   ],
);

export const activityLogsRelations = relations(activityLogs, ({ one }) => ({
   organization: one(organization, {
      fields: [activityLogs.organizationId],
      references: [organization.id],
   }),
   team: one(team, {
      fields: [activityLogs.teamId],
      references: [team.id],
   }),
   user: one(user, {
      fields: [activityLogs.userId],
      references: [user.id],
   }),
}));
