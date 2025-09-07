import { createInsertSchema, createSelectSchema } from "drizzle-zod";

import {
   pgTable,
   uuid,
   text,
   jsonb,
   timestamp,
   integer,
   index,
   uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { user } from "./auth";
import { content } from "./content";
import z from "zod";
export const VersionMetaSchema = z.object({
   diff: z
      .array(z.tuple([z.number(), z.string()]))
      .nullable()
      .optional(),
   lineDiff: z
      .array(
         z.object({
            type: z.enum(["add", "remove", "context", "modify"]),
            lineNumber: z.number().optional(),
            content: z.string(),
            oldContent: z.string().optional(),
            inlineChanges: z
               .array(
                  z.object({
                     type: z.enum(["add", "remove", "unchanged"]),
                     text: z.string(),
                  }),
               )
               .optional(),
         }),
      )
      .nullable()
      .optional(),
   changedFields: z.array(z.string()).optional(),
});
export const contentVersion = pgTable(
   "content_version",
   {
      id: uuid("id").primaryKey().defaultRandom(),
      contentId: uuid("content_id")
         .notNull()
         .references(() => content.id, { onDelete: "cascade" }),
      userId: text("user_id").references(() => user.id, {
         onDelete: "set null",
      }),
      version: integer("version").notNull(),
      meta: jsonb("meta")
         .$type<z.infer<typeof VersionMetaSchema>>()
         .default({}),
      createdAt: timestamp("created_at")
         .$defaultFn(() => new Date())
         .notNull(),
   },
   (table) => [
      index("content_version_content_id_idx").on(table.contentId),
      uniqueIndex("content_version_content_id_version_uidx").on(
         table.contentId,
         table.version,
      ),
   ],
);

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
