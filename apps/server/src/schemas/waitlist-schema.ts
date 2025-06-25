import { pgEnum, pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";

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
  id: uuid("id").primaryKey().defaultRandom(),
  leadType: leadTypeEnum("lead_type").notNull(),
});
