import {
  pgTable,
  uuid,
  text,
  jsonb,
  boolean,
  timestamp,
} from "drizzle-orm/pg-core";
import { user } from "./auth";

export const notification = pgTable("notification", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // e.g., "push", "email", "sms"
  title: text("title").notNull(),
  message: text("message").notNull(),
  data: jsonb("data").default({}),
  read: boolean("read").default(false),
  createdAt: timestamp("created_at")
    .$defaultFn(() => new Date())
    .notNull(),
  sentAt: timestamp("sent_at"),
  error: text("error"),
});

export type Notification = typeof notification.$inferSelect;
export type NotificationInsert = typeof notification.$inferInsert;
