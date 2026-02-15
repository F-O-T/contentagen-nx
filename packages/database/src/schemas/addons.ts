import { relations } from "drizzle-orm";
import {
   boolean,
   index,
   pgTable,
   text,
   timestamp,
   uuid,
} from "drizzle-orm/pg-core";
import { organization } from "./auth";

export const organizationAddons = pgTable(
   "organization_addons",
   {
      id: uuid("id").defaultRandom().primaryKey(),
      organizationId: uuid("organization_id")
         .notNull()
         .references(() => organization.id, { onDelete: "cascade" }),
      addonId: text("addon_id").notNull(), // "boost" | "scale" | "enterprise"
      activatedAt: timestamp("activated_at").defaultNow().notNull(),
      expiresAt: timestamp("expires_at"),
      autoRenew: boolean("auto_renew").default(true).notNull(),
      stripeSubscriptionItemId: text("stripe_subscription_item_id"),
   },
   (table) => [
      index("organization_addons_org_idx").on(table.organizationId),
      index("organization_addons_addon_idx").on(table.addonId),
   ],
);

export const organizationAddonsRelations = relations(
   organizationAddons,
   ({ one }) => ({
      organization: one(organization, {
         fields: [organizationAddons.organizationId],
         references: [organization.id],
      }),
   }),
);
