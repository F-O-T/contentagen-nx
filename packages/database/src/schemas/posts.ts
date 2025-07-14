import { pgTable } from "drizzle-orm/pg-core";
import { user } from "./auth";

export const post = pgTable("post", (t) => ({
   id: t.uuid().primaryKey().defaultRandom(),
   title: t.varchar({ length: 256 }).notNull(),
   content: t.text().notNull(),
   createdAt: t.timestamp().notNull().defaultNow(),
   createdBy: t
      .text()
      .references(() => user.id)
      .notNull(),
}));
