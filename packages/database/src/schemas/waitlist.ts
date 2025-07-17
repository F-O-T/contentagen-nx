import { pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import {
   createInsertSchema,
   createSelectSchema,
   createUpdateSchema,
} from "drizzle-typebox";

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

export const WaitlistInsertSchema = createInsertSchema(waitlist);
export const WaitlistSelectSchema = createSelectSchema(waitlist);
export const WaitlistUpdateSchema = createUpdateSchema(waitlist);
