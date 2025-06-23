import { randomUUID } from "node:crypto";
import { pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const leadTypeEnum = pgEnum("lead_type", [
  "individual blogger",
  "marketing team",
  "freelance writer",
  "business owner",
  "other",
]);

export const waitlist = pgTable("waitlist", {
  createdAt: timestamp("created_at").notNull().defaultNow(),
  email: text("email").notNull(),
  id: text("id")
    .primaryKey()
    .$defaultFn(() => randomUUID()),
  leadType: leadTypeEnum("lead_type").notNull(),
});
