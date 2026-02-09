import { relations, sql } from "drizzle-orm";
import {
   index,
   jsonb,
   pgTable,
   text,
   timestamp,
   uniqueIndex,
   uuid,
} from "drizzle-orm/pg-core";
import { user } from "./auth";

/**
 * Scope access levels for personal API keys.
 * Each scope resource maps to "none" | "read" | "write".
 */
export type ScopeAccess = "none" | "read" | "write";

export type PersonalApiKeyScopes = Record<string, ScopeAccess>;

/**
 * Organization access for personal API keys.
 * Either "all" (access all orgs the user belongs to) or an array of org IDs.
 */
export type OrganizationAccess = "all" | string[];

export const personalApiKey = pgTable(
   "personal_api_key",
   {
      id: uuid("id").default(sql`pg_catalog.gen_random_uuid()`).primaryKey(),
      userId: uuid("user_id")
         .notNull()
         .references(() => user.id, { onDelete: "cascade" }),
      label: text("label").notNull(),
      keyHash: text("key_hash").notNull(),
      keyPrefix: text("key_prefix").notNull(),
      scopes: jsonb("scopes").$type<PersonalApiKeyScopes>().notNull(),
      organizationAccess: jsonb("organization_access")
         .$type<OrganizationAccess>()
         .notNull(),
      lastUsedAt: timestamp("last_used_at"),
      createdAt: timestamp("created_at").defaultNow().notNull(),
      expiresAt: timestamp("expires_at"),
   },
   (table) => [
      index("personal_api_key_user_id_idx").on(table.userId),
      uniqueIndex("personal_api_key_key_prefix_uidx").on(table.keyPrefix),
   ],
);

export type PersonalApiKey = typeof personalApiKey.$inferSelect;
export type NewPersonalApiKey = typeof personalApiKey.$inferInsert;

export const personalApiKeyRelations = relations(personalApiKey, ({ one }) => ({
   user: one(user, {
      fields: [personalApiKey.userId],
      references: [user.id],
   }),
}));
