import { pgTable, uuid, text, jsonb, timestamp } from "drizzle-orm/pg-core";
import { content } from "./content";
import { user } from "./auth";
import { z } from "zod";

/**
 * ExportLogOptionsSchema defines the structure for the options JSONB field.
 * - format: The export format (e.g., 'json', 'csv', etc.)
 * - [other options can be added as needed]
 */
export const ExportLogOptionsSchema = z.object({
   format: z.string(),
   fileName: z.string().optional(),
});
export type ExportLogOptions = z.infer<typeof ExportLogOptionsSchema>;
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
} from "drizzle-zod";
export const ExportLogInsertSchema = createInsertSchema(exportLog);
export const ExportLogSelectSchema = createSelectSchema(exportLog);
export const ExportLogUpdateSchema = createUpdateSchema(exportLog);
