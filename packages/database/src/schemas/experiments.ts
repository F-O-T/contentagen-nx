import { relations, sql } from "drizzle-orm";
import {
   boolean,
   index,
   pgEnum,
   pgTable,
   text,
   timestamp,
   uuid,
} from "drizzle-orm/pg-core";
import { organization, team } from "./auth";
import { content } from "./content";
import { forms } from "./forms";

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export const experimentTargetTypeEnum = pgEnum("experiment_target_type", [
   "content",
   "form",
   "cluster",
]);

export const experimentGoalEnum = pgEnum("experiment_goal", [
   "conversion",
   "ctr",
   "time_on_page",
   "form_submit",
]);

export const experimentStatusEnum = pgEnum("experiment_status", [
   "draft",
   "running",
   "paused",
   "concluded",
]);

// ---------------------------------------------------------------------------
// experiments
// ---------------------------------------------------------------------------

export const experiments = pgTable(
   "experiments",
   {
      id: uuid("id").default(sql`pg_catalog.gen_random_uuid()`).primaryKey(),
      organizationId: uuid("organization_id")
         .notNull()
         .references(() => organization.id, { onDelete: "cascade" }),
      teamId: uuid("team_id")
         .notNull()
         .references(() => team.id, { onDelete: "cascade" }),
      name: text("name").notNull(),
      hypothesis: text("hypothesis"),
      targetType: experimentTargetTypeEnum("target_type").notNull(),
      goal: experimentGoalEnum("goal").notNull(),
      status: experimentStatusEnum("status").default("draft").notNull(),
      startedAt: timestamp("started_at"),
      concludedAt: timestamp("concluded_at"),
      winnerId: uuid("winner_id"), // No DB FK (circular dep with experiment_variants) — enforced at application level
      createdAt: timestamp("created_at").defaultNow().notNull(),
      updatedAt: timestamp("updated_at")
         .defaultNow()
         .$onUpdate(() => new Date())
         .notNull(),
   },
   (table) => [
      index("experiments_org_idx").on(table.organizationId),
      index("experiments_team_idx").on(table.teamId),
      index("experiments_status_idx").on(table.status),
   ],
);

// ---------------------------------------------------------------------------
// experiment_variants
// ---------------------------------------------------------------------------

export const experimentVariants = pgTable(
   "experiment_variants",
   {
      id: uuid("id").default(sql`pg_catalog.gen_random_uuid()`).primaryKey(),
      experimentId: uuid("experiment_id")
         .notNull()
         .references(() => experiments.id, { onDelete: "cascade" }),
      // nullable — populated when targetType = "content" | "cluster"
      contentId: uuid("content_id").references(() => content.id, {
         onDelete: "set null",
      }),
      // nullable — populated when targetType = "form"
      formId: uuid("form_id").references(() => forms.id, {
         onDelete: "set null",
      }),
      name: text("name").notNull(),
      isControl: boolean("is_control").default(false).notNull(),
      createdAt: timestamp("created_at").defaultNow().notNull(),
   },
   (table) => [
      index("experiment_variants_experiment_idx").on(table.experimentId),
   ],
);

// ---------------------------------------------------------------------------
// Relations
// ---------------------------------------------------------------------------

export const experimentsRelations = relations(experiments, ({ one, many }) => ({
   organization: one(organization, {
      fields: [experiments.organizationId],
      references: [organization.id],
   }),
   team: one(team, {
      fields: [experiments.teamId],
      references: [team.id],
   }),
   variants: many(experimentVariants, { relationName: "experimentVariants" }),
   winner: one(experimentVariants, {
      fields: [experiments.winnerId],
      references: [experimentVariants.id],
      relationName: "experimentWinner",
   }),
}));

export const experimentVariantsRelations = relations(
   experimentVariants,
   ({ one }) => ({
      experiment: one(experiments, {
         fields: [experimentVariants.experimentId],
         references: [experiments.id],
         relationName: "experimentVariants",
      }),
      content: one(content, {
         fields: [experimentVariants.contentId],
         references: [content.id],
      }),
      form: one(forms, {
         fields: [experimentVariants.formId],
         references: [forms.id],
      }),
   }),
);

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type Experiment = typeof experiments.$inferSelect;
export type NewExperiment = typeof experiments.$inferInsert;
export type ExperimentVariant = typeof experimentVariants.$inferSelect;
export type NewExperimentVariant = typeof experimentVariants.$inferInsert;
