import { pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const leadTypeEnum = pgEnum("lead_type", [
   "individual blogger",
   "marketing team",
   "freelance writer",
   "business owner",
   "other",
]);

export const waitlist = pgTable("waitlist", {
   id: uuid("id").primaryKey().defaultRandom(),
   createdAt: timestamp("created_at").notNull().defaultNow(),
   email: text("email").notNull(),
   name: text("name"),
   leadType: leadTypeEnum("lead_type").notNull(),
   status: pgEnum("waitlist_status", [
      "pending",
      "contacted",
      "joined",
      "rejected",
   ])("waitlist_status")
      .notNull()
      .default("pending"),
   notes: text("notes"),
   referralSource: text("referral_source"),
});
