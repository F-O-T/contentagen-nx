import { pgTable, uuid, text, jsonb, timestamp } from "drizzle-orm/pg-core";
import { content } from "./content";
import { user } from "./auth";
import { Type as T, type Static } from "@sinclair/typebox";

/**
 * ExportLogOptionsSchema defines the structure for the options JSONB field.
 * - format: The export format (e.g., 'json', 'csv', etc.)
 * - [other options can be added as needed]
 */
export const ExportLogOptionsSchema = T.Object({
   format: T.String(),
   fileName: T.Optional(T.String()),
});
export type ExportLogOptions = Static<typeof ExportLogOptionsSchema>;

export const exportLog = pgTable("export_log", {
   id: uuid("id").primaryKey().defaultRandom(),
   contentId: uuid("content_id")
      .notNull()
      .references(() => content.id, { onDelete: "cascade" }),
   userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
   options: jsonb("options").$type<ExportLogOptions>(),
   createdAt: timestamp("created_at")
      .$defaultFn(() => new Date())
      .notNull(),
});

export type ExportLog = typeof exportLog.$inferSelect;
export type ExportLogInsert = typeof exportLog.$inferInsert;

import {
   createInsertSchema,
   createSelectSchema,
   createUpdateSchema,
} from "drizzle-typebox";

export const ExportLogInsertSchema = createInsertSchema(exportLog);
export const ExportLogSelectSchema = createSelectSchema(exportLog);
export const ExportLogUpdateSchema = createUpdateSchema(exportLog);
