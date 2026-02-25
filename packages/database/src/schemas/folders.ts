import { relations } from "drizzle-orm";
import {
   index,
   integer,
   pgTable,
   text,
   timestamp,
   uuid,
} from "drizzle-orm/pg-core";
import type { AnyPgColumn } from "drizzle-orm/pg-core";
import { organization, team, user } from "./auth";

export const folders = pgTable(
   "folders",
   {
      id: uuid("id").defaultRandom().primaryKey(),
      organizationId: uuid("organization_id")
         .notNull()
         .references(() => organization.id, { onDelete: "cascade" }),
      teamId: uuid("team_id").notNull().references(() => team.id, { onDelete: "cascade" }),
      name: text("name").notNull(),
      description: text("description"),
      parentId: uuid("parent_id").references(
         (): AnyPgColumn => folders.id,
         { onDelete: "cascade" },
      ),
      order: integer("order").notNull().default(0),
      color: text("color"),
      createdBy: uuid("created_by").references(() => user.id, {
         onDelete: "set null",
      }),
      createdAt: timestamp("created_at").defaultNow().notNull(),
      updatedAt: timestamp("updated_at")
         .defaultNow()
         .$onUpdate(() => new Date())
         .notNull(),
   },
   (table) => [
      index("folders_team_idx").on(table.teamId),
      index("folders_parent_idx").on(table.parentId),
   ],
);

export const foldersRelations = relations(folders, ({ one, many }) => ({
   organization: one(organization, {
      fields: [folders.organizationId],
      references: [organization.id],
   }),
   team: one(team, {
      fields: [folders.teamId],
      references: [team.id],
   }),
   parent: one(folders, {
      fields: [folders.parentId],
      references: [folders.id],
      relationName: "folderChildren",
   }),
   children: many(folders, {
      relationName: "folderChildren",
   }),
   createdByUser: one(user, {
      fields: [folders.createdBy],
      references: [user.id],
   }),
}));

export type Folder = typeof folders.$inferSelect;
export type NewFolder = typeof folders.$inferInsert;
