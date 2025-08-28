import { relations } from "drizzle-orm";
import {
   index,
   jsonb,
   pgEnum,
   pgTable,
   text,
   timestamp,
   uuid,
} from "drizzle-orm/pg-core";
import {
   createInsertSchema,
   createSelectSchema,
   createUpdateSchema,
} from "drizzle-zod";
import { z } from "zod";
import { user } from "./auth";

export const preferenceCategoryEnum = pgEnum("preference_category", [
   "global_writing_style", // User-level writing preferences that apply across all agents
   "notification_settings", // User notification preferences
   "productivity", // Workflow and productivity preferences
   "general", // Other user preferences
]);

export type PreferenceCategory =
   (typeof preferenceCategoryEnum.enumValues)[number];

export const PreferenceValueSchema = z.union([
   z.string(),
   z.number(),
   z.boolean(),
   z.array(z.string()),
   z.object({}).catchall(z.any()),
]);

export const userPreference = pgTable(
   "user_preference",
   {
      id: uuid("id").primaryKey().defaultRandom(),
      userId: text("user_id")
         .notNull()
         .references(() => user.id, { onDelete: "cascade" }),
      category: preferenceCategoryEnum("category").notNull(),
      value: jsonb("value").$type<PreferenceValue>().notNull(),
      createdAt: timestamp("created_at")
         .$defaultFn(() => new Date())
         .notNull(),
      updatedAt: timestamp("updated_at")
         .$defaultFn(() => new Date())
         .notNull(),
   },
   (table) => [
      index("user_preference_user_id_idx").on(table.userId),
      index("user_preference_category_idx").on(table.category),
      index("user_preference_user_category_idx").on(
         table.userId,
         table.category,
      ),
   ],
);

export const userPreferenceRelations = relations(userPreference, ({ one }) => ({
   user: one(user, {
      fields: [userPreference.userId],
      references: [user.id],
   }),
}));

export type UserPreferenceSelect = typeof userPreference.$inferSelect;
export type UserPreferenceInsert = typeof userPreference.$inferInsert;

export const UserPreferenceInsertSchema = createInsertSchema(userPreference);
export const UserPreferenceSelectSchema = createSelectSchema(userPreference);
export const UserPreferenceUpdateSchema = createUpdateSchema(userPreference);

export type PreferenceValue = z.infer<typeof PreferenceValueSchema>;
