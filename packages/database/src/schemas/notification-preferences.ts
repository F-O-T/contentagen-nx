import { pgTable, uuid, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { user } from "./auth";

export const notificationPreferences = pgTable("notification_preferences", {
   id: uuid("id").primaryKey().defaultRandom(),
   userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
   type: text("type").notNull(), // e.g., "push", "email", "sms"
   enabled: boolean("enabled").default(true),
   createdAt: timestamp("created_at")
      .$defaultFn(() => new Date())
      .notNull(),
   updatedAt: timestamp("updated_at")
      .$defaultFn(() => new Date())
      .notNull(),
});

export type NotificationPreferences =
   typeof notificationPreferences.$inferSelect;
export type NotificationPreferencesInsert =
   typeof notificationPreferences.$inferInsert;

import {
   createInsertSchema,
   createSelectSchema,
   createUpdateSchema,
} from "drizzle-typebox";

export const NotificationPreferencesInsertSchema = createInsertSchema(
   notificationPreferences,
);
export const NotificationPreferencesSelectSchema = createSelectSchema(
   notificationPreferences,
);
export const NotificationPreferencesUpdateSchema = createUpdateSchema(
   notificationPreferences,
);
