import { relations, sql } from "drizzle-orm";
import { jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { organization, user } from "./auth";

export const insights = pgTable("insights", {
	id: uuid("id").default(sql`pg_catalog.gen_random_uuid()`).primaryKey(),
	organizationId: uuid("organization_id")
		.notNull()
		.references(() => organization.id, { onDelete: "cascade" }),
	createdBy: uuid("created_by")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	name: text("name").notNull(),
	description: text("description"),
	type: text("type").notNull(), // 'trends' | 'funnels' | 'retention'
	config: jsonb("config").$type<Record<string, unknown>>().notNull(),
	defaultSize: text("default_size").notNull().default("md"), // 'sm' | 'md' | 'lg' | 'full'
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at")
		.defaultNow()
		.$onUpdate(() => new Date())
		.notNull(),
});

export const insightsRelations = relations(insights, ({ one }) => ({
	organization: one(organization, {
		fields: [insights.organizationId],
		references: [organization.id],
	}),
	createdByUser: one(user, {
		fields: [insights.createdBy],
		references: [user.id],
	}),
}));

export type Insight = typeof insights.$inferSelect;
export type NewInsight = typeof insights.$inferInsert;
