import { boolean, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const user = pgTable("user", {
   createdAt: timestamp("created_at")
      .$defaultFn(() => /* @__PURE__ */ new Date())
      .notNull(),
   email: text("email").notNull().unique(),
   emailVerified: boolean("email_verified")
      .$defaultFn(() => false)
      .notNull(),
   id: text("id").primaryKey(),
   image: text("image"),
   name: text("name").notNull(),
   updatedAt: timestamp("updated_at")
      .$defaultFn(() => /* @__PURE__ */ new Date())
      .notNull(),
});

export const session = pgTable("session", {
   createdAt: timestamp("created_at").notNull(),
   expiresAt: timestamp("expires_at").notNull(),
   id: text("id").primaryKey(),
   ipAddress: text("ip_address"),
   token: text("token").notNull().unique(),
   updatedAt: timestamp("updated_at").notNull(),
   userAgent: text("user_agent"),
   userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
   accessToken: text("access_token"),
   accessTokenExpiresAt: timestamp("access_token_expires_at"),
   accountId: text("account_id").notNull(),
   createdAt: timestamp("created_at").notNull(),
   id: text("id").primaryKey(),
   idToken: text("id_token"),
   password: text("password"),
   providerId: text("provider_id").notNull(),
   refreshToken: text("refresh_token"),
   refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
   scope: text("scope"),
   updatedAt: timestamp("updated_at").notNull(),
   userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
});

export const verification = pgTable("verification", {
   createdAt: timestamp("created_at").$defaultFn(
      () => /* @__PURE__ */ new Date(),
   ),
   expiresAt: timestamp("expires_at").notNull(),
   id: text("id").primaryKey(),
   identifier: text("identifier").notNull(),
   updatedAt: timestamp("updated_at").$defaultFn(
      () => /* @__PURE__ */ new Date(),
   ),
   value: text("value").notNull(),
});
