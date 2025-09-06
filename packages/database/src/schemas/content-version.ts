import { createInsertSchema, createSelectSchema } from "drizzle-zod";

import {
  pgTable,
  uuid,
  text,
  jsonb,
  timestamp,
  integer,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { user } from "./auth";
import { content, type ContentMeta } from "./content";
type Diff = [number, string][]; // Tuple of position and text
export const contentVersion = pgTable("content_version", {
  id: uuid("id").primaryKey().defaultRandom(),
  contentId: uuid("content_id")
    .notNull()
    .references(() => content.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "set null" }),
  version: integer("version").notNull(),
  body: text("body").notNull(),
  meta: jsonb("meta").$type<ContentMeta>().notNull(),
  diff: jsonb("diff").$type<Diff>(), // Store diff from previous version
  createdAt: timestamp("created_at")
    .$defaultFn(() => new Date())
    .notNull(),
});

export const contentVersionRelations = relations(contentVersion, ({ one }) => ({
  content: one(content, {
    fields: [contentVersion.contentId],
    references: [content.id],
  }),
  user: one(user, {
    fields: [contentVersion.userId],
    references: [user.id],
  }),
}));

export type ContentVersionSelect = typeof contentVersion.$inferSelect;
export type ContentVersionInsert = typeof contentVersion.$inferInsert;
export const ContentVersionInsertSchema = createInsertSchema(contentVersion);
export const ContentVersionSelectSchema = createSelectSchema(contentVersion);
