import { relations } from "drizzle-orm";
import {
   boolean,
   index,
   jsonb,
   pgTable,
   text,
   timestamp,
   uuid,
} from "drizzle-orm/pg-core";
import { organization } from "./auth";

export const verifiedDomains = pgTable(
   "verified_domains",
   {
      id: uuid("id").defaultRandom().primaryKey(),
      organizationId: uuid("organization_id")
         .notNull()
         .references(() => organization.id, { onDelete: "cascade" }),
      domain: text("domain").notNull(),
      verificationToken: text("verification_token").notNull(),
      verified: boolean("verified").default(false).notNull(),
      verifiedAt: timestamp("verified_at"),
      autoJoinEnabled: boolean("auto_join_enabled").default(false).notNull(),
      createdAt: timestamp("created_at").defaultNow().notNull(),
   },
   (table) => [
      index("verified_domains_org_idx").on(table.organizationId),
      index("verified_domains_domain_idx").on(table.domain),
   ],
);

export const ssoConfigurations = pgTable(
   "sso_configurations",
   {
      id: uuid("id").defaultRandom().primaryKey(),
      organizationId: uuid("organization_id")
         .notNull()
         .references(() => organization.id, { onDelete: "cascade" }),
      provider: text("provider").notNull(), // "saml" | "oidc" | "google" | "okta"
      enabled: boolean("enabled").default(false).notNull(),
      config: jsonb("config").$type<Record<string, unknown>>().notNull(),
      createdAt: timestamp("created_at").defaultNow().notNull(),
      updatedAt: timestamp("updated_at")
         .defaultNow()
         .$onUpdate(() => new Date())
         .notNull(),
   },
   (table) => [index("sso_configurations_org_idx").on(table.organizationId)],
);

export const verifiedDomainsRelations = relations(
   verifiedDomains,
   ({ one }) => ({
      organization: one(organization, {
         fields: [verifiedDomains.organizationId],
         references: [organization.id],
      }),
   }),
);

export const ssoConfigurationsRelations = relations(
   ssoConfigurations,
   ({ one }) => ({
      organization: one(organization, {
         fields: [ssoConfigurations.organizationId],
         references: [organization.id],
      }),
   }),
);
