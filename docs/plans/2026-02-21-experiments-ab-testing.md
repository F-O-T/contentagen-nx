# Experiments (A/B Testing) Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a target-agnostic A/B testing system supporting content, form, and cluster experiments with database management, oRPC API, and full UI.

**Architecture:** Two new DB tables (`experiments`, `experiment_variants`). Event schemas made target-agnostic (breaking change: `contentId` → `targetType/targetId`, old `contentId` kept optional for backwards compat). oRPC router for CRUD + lifecycle + results. Feature UI with list/create/detail.

**Tech Stack:** Drizzle ORM + PostgreSQL, oRPC + TanStack Query, React, TanStack Router, BullMQ events

---

## Task 1: Update Experiment Event Schemas (target-agnostic)

**Files:**
- Modify: `packages/events/src/experiments.ts`

**Context:**
Currently `experimentStartedEventSchema` and `experimentConversionEventSchema` both require `contentId: z.uuid()`. We need to replace this with `targetType` + `targetId`, keeping `contentId` optional for backwards compatibility.

**Step 1: Edit the schema file**

Replace the full content of `packages/events/src/experiments.ts`:

```typescript
import { z } from "zod";

import { EVENT_CATEGORIES } from "./catalog";
import { type EmitEventParams, emitEvent } from "./emit";

// ---------------------------------------------------------------------------
// Experiment Event Names
// ---------------------------------------------------------------------------

export const EXPERIMENT_EVENTS = {
   "experiment.started": "experiment.started",
   "experiment.conversion": "experiment.conversion",
} as const;

export type ExperimentEventName =
   (typeof EXPERIMENT_EVENTS)[keyof typeof EXPERIMENT_EVENTS];

export const EXPERIMENT_TARGET_TYPES = ["content", "form", "cluster"] as const;
export type ExperimentTargetType = (typeof EXPERIMENT_TARGET_TYPES)[number];

// ---------------------------------------------------------------------------
// experiment.started
// ---------------------------------------------------------------------------

export const experimentStartedEventSchema = z.object({
   // Target-agnostic fields (preferred)
   targetType: z.enum(EXPERIMENT_TARGET_TYPES).optional(),
   targetId: z.uuid().optional(),
   // Legacy field — maps to targetType="content", kept for backwards compat
   contentId: z.uuid().optional(),
   experimentId: z.uuid(),
   variantId: z.string(),
   sessionId: z.string().optional(),
   visitorId: z.string().optional(),
});
export type ExperimentStartedEvent = z.infer<
   typeof experimentStartedEventSchema
>;

export function emitExperimentStarted(
   ctx: Pick<EmitEventParams, "db" | "posthog" | "organizationId" | "userId">,
   properties: ExperimentStartedEvent,
) {
   return emitEvent({
      ...ctx,
      eventName: EXPERIMENT_EVENTS["experiment.started"],
      eventCategory: EVENT_CATEGORIES.experiment,
      properties,
   });
}

// ---------------------------------------------------------------------------
// experiment.conversion
// ---------------------------------------------------------------------------

export const experimentConversionEventSchema = z.object({
   // Target-agnostic fields (preferred)
   targetType: z.enum(EXPERIMENT_TARGET_TYPES).optional(),
   targetId: z.uuid().optional(),
   // Legacy field — maps to targetType="content", kept for backwards compat
   contentId: z.uuid().optional(),
   experimentId: z.uuid(),
   variantId: z.string(),
   goalName: z.string(),
   goalValue: z.number().nonnegative().optional(),
   sessionId: z.string().optional(),
   visitorId: z.string().optional(),
});
export type ExperimentConversionEvent = z.infer<
   typeof experimentConversionEventSchema
>;

export function emitExperimentConversion(
   ctx: Pick<EmitEventParams, "db" | "posthog" | "organizationId" | "userId">,
   properties: ExperimentConversionEvent,
) {
   return emitEvent({
      ...ctx,
      eventName: EXPERIMENT_EVENTS["experiment.conversion"],
      eventCategory: EVENT_CATEGORIES.experiment,
      properties,
   });
}
```

**Step 2: Verify TypeScript compiles**

```bash
cd /home/yorizel/Documents/contentta-nx && bun run typecheck 2>&1 | head -40
```

Expected: no errors in `packages/events/src/experiments.ts`.

**Step 3: Update SDK server `trackConversion` to accept target-agnostic params**

Modify `libraries/sdk/src/events/server.ts` — update the `trackConversion` method signature to accept `targetType/targetId` alongside legacy `contentId`:

```typescript
async trackConversion(params: {
   contentId?: string;
   targetType?: "content" | "form" | "cluster";
   targetId?: string;
   experimentId: string;
   variantId: string;
   goalName: string;
   goalValue?: number;
}): Promise<void> {
   return this.emitEvent("experiment.conversion", params);
}
```

**Step 4: Typecheck again**

```bash
cd /home/yorizel/Documents/contentta-nx && bun run typecheck 2>&1 | head -40
```

**Step 5: Commit**

```bash
cd /home/yorizel/Documents/contentta-nx && git add packages/events/src/experiments.ts libraries/sdk/src/events/server.ts && git commit -m "feat(experiments): make experiment events target-agnostic (targetType/targetId)"
```

---

## Task 2: Create Database Schema for Experiments

**Files:**
- Create: `packages/database/src/schemas/experiments.ts`
- Modify: `packages/database/src/schema.ts`

**Context:**
Need two tables: `experiments` (metadata + lifecycle) and `experiment_variants` (each variant references either a contentId or formId depending on targetType). Follow the pattern from `packages/database/src/schemas/forms.ts`.

**Step 1: Create the schema file**

Create `packages/database/src/schemas/experiments.ts`:

```typescript
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
      winnerId: uuid("winner_id"), // FK set post-creation → experiment_variants.id
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

export const experimentsRelations = relations(
   experiments,
   ({ one, many }) => ({
      organization: one(organization, {
         fields: [experiments.organizationId],
         references: [organization.id],
      }),
      team: one(team, {
         fields: [experiments.teamId],
         references: [team.id],
      }),
      variants: many(experimentVariants),
   }),
);

export const experimentVariantsRelations = relations(
   experimentVariants,
   ({ one }) => ({
      experiment: one(experiments, {
         fields: [experimentVariants.experimentId],
         references: [experiments.id],
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
```

**Step 2: Register schema in schema.ts**

In `packages/database/src/schema.ts`, add before the `// Webhooks` line:

```typescript
// Experiments
export * from "./schemas/experiments";
```

**Step 3: Typecheck**

```bash
cd /home/yorizel/Documents/contentta-nx && bun run typecheck 2>&1 | head -40
```

Expected: no errors.

**Step 4: Push schema to DB**

```bash
cd /home/yorizel/Documents/contentta-nx && bun run db:push
```

Expected: "Your schema has been updated" or similar. Confirm when prompted.

**Step 5: Commit**

```bash
cd /home/yorizel/Documents/contentta-nx && git add packages/database/src/schemas/experiments.ts packages/database/src/schema.ts && git commit -m "feat(experiments): add experiments and experiment_variants DB schema"
```

---

## Task 3: Add experiment_daily_stats Materialized View

**Files:**
- Modify: `packages/database/src/schemas/event-views.ts`

**Context:**
Add a new materialized view that aggregates experiment.started and experiment.conversion events grouped by experiment, variant, and target. Follow the pattern from `dailyContentAnalytics`.

**Step 1: Append the new view to `event-views.ts`**

Add at the end of `packages/database/src/schemas/event-views.ts`:

```typescript
// ---------------------------------------------------------------------------
// experiment_daily_stats
// ---------------------------------------------------------------------------

export const experimentDailyStats = pgMaterializedView(
   "experiment_daily_stats",
   {
      organizationId: uuid("organization_id").notNull(),
      experimentId: uuid("experiment_id").notNull(),
      variantId: text("variant_id").notNull(),
      targetType: text("target_type").notNull(),
      targetId: uuid("target_id"),
      date: date("date").notNull(),
      impressions: integer("impressions").notNull(),
      conversions: integer("conversions").notNull(),
   },
).as(sql`
   SELECT
      organization_id,
      (properties->>'experimentId')::uuid AS experiment_id,
      properties->>'variantId' AS variant_id,
      COALESCE(properties->>'targetType', 'content') AS target_type,
      COALESCE(
         (properties->>'targetId')::uuid,
         (properties->>'contentId')::uuid
      ) AS target_id,
      DATE(timestamp) AS date,
      COUNT(*) FILTER (WHERE event_name = 'experiment.started')::int AS impressions,
      COUNT(*) FILTER (WHERE event_name = 'experiment.conversion')::int AS conversions
   FROM events
   WHERE event_category = 'experiment'
      AND timestamp >= CURRENT_DATE - INTERVAL '90 days'
   GROUP BY organization_id, experiment_id, variant_id, target_type, target_id, DATE(timestamp)
`);
```

**Step 2: Typecheck and push**

```bash
cd /home/yorizel/Documents/contentta-nx && bun run typecheck 2>&1 | head -20
bun run db:push
```

**Step 3: Commit**

```bash
cd /home/yorizel/Documents/contentta-nx && git add packages/database/src/schemas/event-views.ts && git commit -m "feat(experiments): add experiment_daily_stats materialized view"
```

---

## Task 4: Create Experiments Repository

**Files:**
- Create: `packages/database/src/repositories/experiments-repository.ts`

**Context:**
Follow the pattern from `content-repository.ts`. Use `AppError` + `propagateError` for error handling. Export individual async functions.

**Step 1: Create the repository**

```typescript
import { AppError, propagateError } from "@packages/utils/errors";
import { and, desc, eq } from "drizzle-orm";
import type { DatabaseInstance } from "../client";
import {
   type Experiment,
   type ExperimentVariant,
   type NewExperiment,
   type NewExperimentVariant,
   experimentVariants,
   experiments,
} from "../schemas/experiments";

export async function createExperiment(
   db: DatabaseInstance,
   data: NewExperiment,
): Promise<Experiment> {
   try {
      const [result] = await db.insert(experiments).values(data).returning();
      if (!result) throw new Error("No result returned");
      return result;
   } catch (err) {
      propagateError(err);
      throw AppError.database(`Failed to create experiment: ${(err as Error).message}`);
   }
}

export async function getExperimentById(
   db: DatabaseInstance,
   id: string,
): Promise<Experiment | undefined> {
   try {
      return db.query.experiments.findFirst({
         where: (e, { eq }) => eq(e.id, id),
         with: { variants: true },
      });
   } catch (err) {
      propagateError(err);
      throw AppError.database(`Failed to get experiment: ${(err as Error).message}`);
   }
}

export async function listExperimentsByTeam(
   db: DatabaseInstance,
   teamId: string,
): Promise<Experiment[]> {
   try {
      return db.query.experiments.findMany({
         where: (e, { eq }) => eq(e.teamId, teamId),
         with: { variants: true },
         orderBy: (e) => [desc(e.createdAt)],
      });
   } catch (err) {
      propagateError(err);
      throw AppError.database(`Failed to list experiments: ${(err as Error).message}`);
   }
}

export async function updateExperiment(
   db: DatabaseInstance,
   id: string,
   data: Partial<Pick<Experiment, "name" | "hypothesis" | "goal" | "status" | "startedAt" | "concludedAt" | "winnerId">>,
): Promise<Experiment> {
   try {
      const [result] = await db
         .update(experiments)
         .set({ ...data, updatedAt: new Date() })
         .where(eq(experiments.id, id))
         .returning();
      if (!result) throw new Error("Experiment not found");
      return result;
   } catch (err) {
      propagateError(err);
      throw AppError.database(`Failed to update experiment: ${(err as Error).message}`);
   }
}

export async function deleteExperiment(
   db: DatabaseInstance,
   id: string,
): Promise<void> {
   try {
      await db.delete(experiments).where(eq(experiments.id, id));
   } catch (err) {
      propagateError(err);
      throw AppError.database(`Failed to delete experiment: ${(err as Error).message}`);
   }
}

export async function addVariant(
   db: DatabaseInstance,
   data: NewExperimentVariant,
): Promise<ExperimentVariant> {
   try {
      const [result] = await db
         .insert(experimentVariants)
         .values(data)
         .returning();
      if (!result) throw new Error("No result returned");
      return result;
   } catch (err) {
      propagateError(err);
      throw AppError.database(`Failed to add variant: ${(err as Error).message}`);
   }
}

export async function removeVariant(
   db: DatabaseInstance,
   variantId: string,
): Promise<void> {
   try {
      await db.delete(experimentVariants).where(eq(experimentVariants.id, variantId));
   } catch (err) {
      propagateError(err);
      throw AppError.database(`Failed to remove variant: ${(err as Error).message}`);
   }
}

export async function getVariantsByExperiment(
   db: DatabaseInstance,
   experimentId: string,
): Promise<ExperimentVariant[]> {
   try {
      return db
         .select()
         .from(experimentVariants)
         .where(eq(experimentVariants.experimentId, experimentId));
   } catch (err) {
      propagateError(err);
      throw AppError.database(`Failed to get variants: ${(err as Error).message}`);
   }
}
```

**Step 2: Typecheck**

```bash
cd /home/yorizel/Documents/contentta-nx && bun run typecheck 2>&1 | head -40
```

**Step 3: Commit**

```bash
cd /home/yorizel/Documents/contentta-nx && git add packages/database/src/repositories/experiments-repository.ts && git commit -m "feat(experiments): add experiments repository"
```

---

## Task 5: Add Experiment Support to SDK Server Forms Submit

**Files:**
- Modify: `apps/sdk-server/src/orpc/router/forms.ts`

**Context:**
The `submit` handler (lines 121-234) needs to optionally accept `experimentId` and `variantId` in the input. After storing the submission, if both are present, emit `experiment.conversion` with `targetType="form"`.

**Step 1: Update the submit input schema**

Find the input object in `submit` (around line 122) and add:
```typescript
experimentId: z.string().uuid().optional(),
variantId: z.string().optional(),
```

**Step 2: Import experiment emitter**

At the top of the file, add:
```typescript
import {
   emitExperimentConversion,
} from "@packages/events/experiments";
```

**Step 3: After emitting `form.submitted` (after line ~222), add experiment conversion**

```typescript
// Emit experiment.conversion if this form is part of an A/B test
if (input.experimentId && input.variantId) {
   emitExperimentConversion({
      db: context.db,
      posthog: context.posthog,
      organizationId: context.organizationId,
      userId: context.userId ?? undefined,
   }, {
      targetType: "form",
      targetId: form.id,
      experimentId: input.experimentId,
      variantId: input.variantId,
      goalName: "form.submit",
   });
}
```

**Step 4: Typecheck**

```bash
cd /home/yorizel/Documents/contentta-nx && bun run typecheck 2>&1 | head -40
```

**Step 5: Commit**

```bash
cd /home/yorizel/Documents/contentta-nx && git add apps/sdk-server/src/orpc/router/forms.ts && git commit -m "feat(experiments): emit experiment.conversion on form submit when experimentId provided"
```

---

## Task 6: Update SDK Client Forms to Support Experiment Tracking

**Files:**
- Modify: `libraries/sdk/src/forms.ts`

**Context:**
`embedForm(formId, containerId)` needs to accept an optional `options` object with `experimentId` and `variantId`. When `experimentId` is provided:
1. Emit `experiment.started` with `targetType="form"` and `targetId=formId` after rendering
2. Pass `experimentId` and `variantId` in the submit payload

**Step 1: Find the `embedForm` signature (around line 204)**

Change:
```typescript
async embedForm(formId: string, containerId: string): Promise<void> {
```
To:
```typescript
async embedForm(
   formId: string,
   containerId: string,
   options?: {
      experimentId?: string;
      variantId?: string;
   },
): Promise<void> {
```

**Step 2: After the `form.impression` track call (around line 243-248), add experiment tracking**

```typescript
// Track experiment impression if this form is part of an A/B test
if (options?.experimentId) {
   this.tracker.track("experiment.started", {
      targetType: "form",
      targetId: formId,
      experimentId: options.experimentId,
      variantId: options.variantId ?? "control",
      visitorId: this.tracker.getVisitorId(),
      sessionId: this.tracker.getSessionId(),
   });
}
```

**Step 3: Update `setupFormHandler` to pass experiment data in submit payload**

The submit call around line 411-420 builds `submissionData`. Find where `this.sdk.forms.submit(submissionData)` is called and update `submissionData` to include:
```typescript
experimentId: options?.experimentId,
variantId: options?.variantId,
```

Note: `options` needs to be passed into `setupFormHandler`. Update the call at line 250:
```typescript
this.setupFormHandler(formId, container, options);
```
And update the `private setupFormHandler` method signature to accept it.

**Step 4: Typecheck**

```bash
cd /home/yorizel/Documents/contentta-nx && bun run typecheck 2>&1 | head -40
```

**Step 5: Commit**

```bash
cd /home/yorizel/Documents/contentta-nx && git add libraries/sdk/src/forms.ts && git commit -m "feat(experiments): extend SDK embedForm to track experiment.started and pass experimentId on submit"
```

---

## Task 7: Create oRPC Experiments Router

**Files:**
- Create: `apps/web/src/integrations/orpc/router/experiments.ts`
- Modify: `apps/web/src/integrations/orpc/router/index.ts`

**Context:**
Follow the pattern from `apps/web/src/integrations/orpc/router/forms.ts`. Use `protectedProcedure` with `context.teamId` for team scoping. The `getResults` procedure queries the `experimentDailyStats` materialized view.

**Step 1: Create the router file**

```typescript
import { ORPCError } from "@orpc/server";
import {
   addVariant,
   createExperiment,
   deleteExperiment,
   getExperimentById,
   getVariantsByExperiment,
   listExperimentsByTeam,
   removeVariant,
   updateExperiment,
} from "@packages/database/repositories/experiments-repository";
import {
   experimentDailyStats,
} from "@packages/database/schemas/event-views";
import {
   EXPERIMENT_TARGET_TYPES,
} from "@packages/events/experiments";
import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { protectedProcedure } from "../server";

// =============================================================================
// Schemas
// =============================================================================

const createExperimentSchema = z.object({
   name: z.string().min(1),
   hypothesis: z.string().optional(),
   targetType: z.enum(EXPERIMENT_TARGET_TYPES),
   goal: z.enum(["conversion", "ctr", "time_on_page", "form_submit"]),
});

const updateExperimentSchema = z.object({
   id: z.string().uuid(),
   name: z.string().min(1).optional(),
   hypothesis: z.string().optional(),
   goal: z.enum(["conversion", "ctr", "time_on_page", "form_submit"]).optional(),
});

const addVariantSchema = z.object({
   experimentId: z.string().uuid(),
   name: z.string().min(1),
   isControl: z.boolean().default(false),
   contentId: z.string().uuid().optional(),
   formId: z.string().uuid().optional(),
});

// =============================================================================
// Procedures
// =============================================================================

export const list = protectedProcedure
   .input(z.object({}))
   .handler(async ({ context }) => {
      const { db, teamId } = context;
      if (!teamId) throw new ORPCError("BAD_REQUEST", { message: "teamId required" });
      return listExperimentsByTeam(db, teamId);
   });

export const getById = protectedProcedure
   .input(z.object({ id: z.string().uuid() }))
   .handler(async ({ context, input }) => {
      const { db, organizationId } = context;
      const experiment = await getExperimentById(db, input.id);
      if (!experiment || experiment.organizationId !== organizationId) {
         throw new ORPCError("NOT_FOUND", { message: "Experiment not found" });
      }
      return experiment;
   });

export const create = protectedProcedure
   .input(createExperimentSchema)
   .handler(async ({ context, input }) => {
      const { db, organizationId, teamId } = context;
      if (!teamId) throw new ORPCError("BAD_REQUEST", { message: "teamId required" });
      return createExperiment(db, {
         ...input,
         organizationId,
         teamId,
      });
   });

export const update = protectedProcedure
   .input(updateExperimentSchema)
   .handler(async ({ context, input }) => {
      const { db, organizationId } = context;
      const existing = await getExperimentById(db, input.id);
      if (!existing || existing.organizationId !== organizationId) {
         throw new ORPCError("NOT_FOUND", { message: "Experiment not found" });
      }
      const { id, ...data } = input;
      return updateExperiment(db, id, data);
   });

export const remove = protectedProcedure
   .input(z.object({ id: z.string().uuid() }))
   .handler(async ({ context, input }) => {
      const { db, organizationId } = context;
      const existing = await getExperimentById(db, input.id);
      if (!existing || existing.organizationId !== organizationId) {
         throw new ORPCError("NOT_FOUND", { message: "Experiment not found" });
      }
      if (existing.status === "running") {
         throw new ORPCError("FORBIDDEN", { message: "Cannot delete a running experiment. Pause it first." });
      }
      await deleteExperiment(db, input.id);
      return { success: true };
   });

export const start = protectedProcedure
   .input(z.object({ id: z.string().uuid() }))
   .handler(async ({ context, input }) => {
      const { db, organizationId } = context;
      const existing = await getExperimentById(db, input.id);
      if (!existing || existing.organizationId !== organizationId) {
         throw new ORPCError("NOT_FOUND", { message: "Experiment not found" });
      }
      if (existing.status !== "draft" && existing.status !== "paused") {
         throw new ORPCError("FORBIDDEN", { message: "Only draft or paused experiments can be started" });
      }
      return updateExperiment(db, input.id, {
         status: "running",
         startedAt: existing.startedAt ?? new Date(),
      });
   });

export const pause = protectedProcedure
   .input(z.object({ id: z.string().uuid() }))
   .handler(async ({ context, input }) => {
      const { db, organizationId } = context;
      const existing = await getExperimentById(db, input.id);
      if (!existing || existing.organizationId !== organizationId) {
         throw new ORPCError("NOT_FOUND", { message: "Experiment not found" });
      }
      if (existing.status !== "running") {
         throw new ORPCError("FORBIDDEN", { message: "Only running experiments can be paused" });
      }
      return updateExperiment(db, input.id, { status: "paused" });
   });

export const conclude = protectedProcedure
   .input(z.object({ id: z.string().uuid(), winnerId: z.string().uuid().optional() }))
   .handler(async ({ context, input }) => {
      const { db, organizationId } = context;
      const existing = await getExperimentById(db, input.id);
      if (!existing || existing.organizationId !== organizationId) {
         throw new ORPCError("NOT_FOUND", { message: "Experiment not found" });
      }
      return updateExperiment(db, input.id, {
         status: "concluded",
         concludedAt: new Date(),
         winnerId: input.winnerId,
      });
   });

export const addVariantToExperiment = protectedProcedure
   .input(addVariantSchema)
   .handler(async ({ context, input }) => {
      const { db, organizationId } = context;
      const experiment = await getExperimentById(db, input.experimentId);
      if (!experiment || experiment.organizationId !== organizationId) {
         throw new ORPCError("NOT_FOUND", { message: "Experiment not found" });
      }
      if (experiment.status === "running") {
         throw new ORPCError("FORBIDDEN", { message: "Cannot add variants to a running experiment" });
      }
      return addVariant(db, input);
   });

export const removeVariantFromExperiment = protectedProcedure
   .input(z.object({ variantId: z.string().uuid() }))
   .handler(async ({ context, input }) => {
      const { db } = context;
      await removeVariant(db, input.variantId);
      return { success: true };
   });

export const getResults = protectedProcedure
   .input(z.object({ experimentId: z.string().uuid() }))
   .handler(async ({ context, input }) => {
      const { db, organizationId } = context;
      const experiment = await getExperimentById(db, input.experimentId);
      if (!experiment || experiment.organizationId !== organizationId) {
         throw new ORPCError("NOT_FOUND", { message: "Experiment not found" });
      }
      const variants = await getVariantsByExperiment(db, input.experimentId);

      const stats = await db
         .select()
         .from(experimentDailyStats)
         .where(
            and(
               eq(experimentDailyStats.organizationId, organizationId),
               eq(experimentDailyStats.experimentId, input.experimentId),
            ),
         );

      // Aggregate by variantId
      const byVariant = variants.map((v) => {
         const variantStats = stats.filter((s) => s.variantId === v.id);
         const totalImpressions = variantStats.reduce(
            (sum, s) => sum + s.impressions,
            0,
         );
         const totalConversions = variantStats.reduce(
            (sum, s) => sum + s.conversions,
            0,
         );
         const conversionRate =
            totalImpressions > 0
               ? totalConversions / totalImpressions
               : 0;

         return {
            variant: v,
            totalImpressions,
            totalConversions,
            conversionRate,
            isWinner: experiment.winnerId === v.id,
            dailyStats: variantStats,
         };
      });

      return {
         experiment,
         variants: byVariant,
      };
   });
```

**Step 2: Register the router in `apps/web/src/integrations/orpc/router/index.ts`**

Add import:
```typescript
import * as experimentsRouter from "./experiments";
```

Add to the export object:
```typescript
experiments: experimentsRouter,
```

**Step 3: Typecheck**

```bash
cd /home/yorizel/Documents/contentta-nx && bun run typecheck 2>&1 | head -40
```

**Step 4: Commit**

```bash
cd /home/yorizel/Documents/contentta-nx && git add apps/web/src/integrations/orpc/router/experiments.ts apps/web/src/integrations/orpc/router/index.ts && git commit -m "feat(experiments): add experiments oRPC router"
```

---

## Task 8: Create Experiments Feature UI

**Files:**
- Create: `apps/web/src/features/experiments/ui/experiments-list-section.tsx`
- Create: `apps/web/src/features/experiments/ui/create-experiment-sheet.tsx`
- Create: `apps/web/src/features/experiments/ui/experiment-status-badge.tsx`

**Context:**
Follow the pattern from `apps/web/src/features/forms/ui/forms-list.tsx` and `apps/web/src/features/content/ui/content-list-section.tsx`. Use `useSuspenseQuery` + `orpc`. Use `useSheet` for create actions. Use `useAlertDialog` for destructive confirmations.

**Step 1: Create status badge component**

Create `apps/web/src/features/experiments/ui/experiment-status-badge.tsx`:

```tsx
import { Badge } from "@packages/ui/components/badge";

type ExperimentStatus = "draft" | "running" | "paused" | "concluded";

const STATUS_CONFIG: Record<ExperimentStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
   draft: { label: "Rascunho", variant: "outline" },
   running: { label: "Em execução", variant: "default" },
   paused: { label: "Pausado", variant: "secondary" },
   concluded: { label: "Concluído", variant: "secondary" },
};

export function ExperimentStatusBadge({ status }: { status: ExperimentStatus }) {
   const config = STATUS_CONFIG[status];
   return <Badge variant={config.variant}>{config.label}</Badge>;
}
```

**Step 2: Create the create experiment sheet**

Create `apps/web/src/features/experiments/ui/create-experiment-sheet.tsx`:

```tsx
import { Button } from "@packages/ui/components/button";
import { Input } from "@packages/ui/components/input";
import { Label } from "@packages/ui/components/label";
import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
} from "@packages/ui/components/select";
import { Textarea } from "@packages/ui/components/textarea";
import { useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { orpc } from "@/integrations/orpc/client";

interface CreateExperimentSheetProps {
   onSuccess: () => void;
}

export function CreateExperimentSheet({ onSuccess }: CreateExperimentSheetProps) {
   const [name, setName] = useState("");
   const [hypothesis, setHypothesis] = useState("");
   const [targetType, setTargetType] = useState<"content" | "form" | "cluster">("content");
   const [goal, setGoal] = useState<"conversion" | "ctr" | "time_on_page" | "form_submit">("conversion");

   const createMutation = useMutation(
      orpc.experiments.create.mutationOptions({
         onSuccess: () => {
            toast.success("Experimento criado!");
            onSuccess();
         },
         onError: (error) => {
            toast.error(error.message ?? "Erro ao criar experimento");
         },
      }),
   );

   const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      createMutation.mutate({ name, hypothesis: hypothesis || undefined, targetType, goal });
   };

   return (
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-4">
         <div className="flex flex-col gap-2">
            <Label htmlFor="exp-name">Nome do experimento</Label>
            <Input
               id="exp-name"
               placeholder="Ex: Título A vs Título B"
               value={name}
               onChange={(e) => setName(e.target.value)}
               required
            />
         </div>
         <div className="flex flex-col gap-2">
            <Label htmlFor="exp-hypothesis">Hipótese (opcional)</Label>
            <Textarea
               id="exp-hypothesis"
               placeholder="O que você espera aprender?"
               value={hypothesis}
               onChange={(e) => setHypothesis(e.target.value)}
               rows={3}
            />
         </div>
         <div className="flex flex-col gap-2">
            <Label htmlFor="exp-target">Tipo de alvo</Label>
            <Select value={targetType} onValueChange={(v) => setTargetType(v as typeof targetType)}>
               <SelectTrigger id="exp-target">
                  <SelectValue />
               </SelectTrigger>
               <SelectContent>
                  <SelectItem value="content">Conteúdo</SelectItem>
                  <SelectItem value="form">Formulário</SelectItem>
                  <SelectItem value="cluster">Cluster</SelectItem>
               </SelectContent>
            </Select>
         </div>
         <div className="flex flex-col gap-2">
            <Label htmlFor="exp-goal">Métrica principal</Label>
            <Select value={goal} onValueChange={(v) => setGoal(v as typeof goal)}>
               <SelectTrigger id="exp-goal">
                  <SelectValue />
               </SelectTrigger>
               <SelectContent>
                  <SelectItem value="conversion">Conversão</SelectItem>
                  <SelectItem value="ctr">CTR</SelectItem>
                  <SelectItem value="time_on_page">Tempo na página</SelectItem>
                  <SelectItem value="form_submit">Envio de formulário</SelectItem>
               </SelectContent>
            </Select>
         </div>
         <Button type="submit" disabled={!name || createMutation.isPending}>
            {createMutation.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
            Criar experimento
         </Button>
      </form>
   );
}
```

**Step 3: Create the experiments list section**

Create `apps/web/src/features/experiments/ui/experiments-list-section.tsx`:

```tsx
import { Button } from "@packages/ui/components/button";
import { DataTable } from "@packages/ui/components/data-table";
import {
   Empty,
   EmptyContent,
   EmptyDescription,
   EmptyMedia,
   EmptyTitle,
} from "@packages/ui/components/empty";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { FlaskConical, Plus } from "lucide-react";
import { toast } from "sonner";
import { useSheet } from "@/hooks/use-sheet";
import { orpc } from "@/integrations/orpc/client";
import { CreateExperimentSheet } from "./create-experiment-sheet";
import { ExperimentStatusBadge } from "./experiment-status-badge";

type ExperimentRow = {
   id: string;
   name: string;
   targetType: string;
   goal: string;
   status: "draft" | "running" | "paused" | "concluded";
   createdAt: Date;
};

function useExperimentColumns(): ColumnDef<ExperimentRow>[] {
   const navigate = useNavigate();
   const { slug, teamSlug } = useParams({ strict: false }) as {
      slug?: string;
      teamSlug?: string;
   };

   return [
      {
         accessorKey: "name",
         header: "Nome",
      },
      {
         accessorKey: "targetType",
         header: "Alvo",
         cell: ({ row }) => {
            const labels: Record<string, string> = {
               content: "Conteúdo",
               form: "Formulário",
               cluster: "Cluster",
            };
            return labels[row.original.targetType] ?? row.original.targetType;
         },
      },
      {
         accessorKey: "goal",
         header: "Métrica",
         cell: ({ row }) => {
            const labels: Record<string, string> = {
               conversion: "Conversão",
               ctr: "CTR",
               time_on_page: "Tempo na página",
               form_submit: "Envio de formulário",
            };
            return labels[row.original.goal] ?? row.original.goal;
         },
      },
      {
         accessorKey: "status",
         header: "Status",
         cell: ({ row }) => <ExperimentStatusBadge status={row.original.status} />,
      },
      {
         accessorKey: "createdAt",
         header: "Criado em",
         cell: ({ row }) =>
            new Date(row.original.createdAt).toLocaleDateString("pt-BR"),
      },
   ];
}

export function ExperimentsListSection() {
   const { openSheet, closeSheet } = useSheet();
   const { data: experiments } = useSuspenseQuery(
      orpc.experiments.list.queryOptions({}),
   );

   const columns = useExperimentColumns();

   if (!experiments.length) {
      return (
         <Empty>
            <EmptyMedia>
               <FlaskConical className="size-10 text-muted-foreground" />
            </EmptyMedia>
            <EmptyContent>
               <EmptyTitle>Nenhum experimento ainda</EmptyTitle>
               <EmptyDescription>
                  Crie seu primeiro experimento A/B para comparar variantes de conteúdo ou formulários.
               </EmptyDescription>
               <Button
                  onClick={() =>
                     openSheet({
                        children: <CreateExperimentSheet onSuccess={closeSheet} />,
                        title: "Novo experimento",
                     })
                  }
               >
                  <Plus className="mr-2 size-4" />
                  Criar experimento
               </Button>
            </EmptyContent>
         </Empty>
      );
   }

   return (
      <div className="flex flex-col gap-4">
         <div className="flex items-center justify-between">
            <div />
            <Button
               size="sm"
               onClick={() =>
                  openSheet({
                     children: <CreateExperimentSheet onSuccess={closeSheet} />,
                     title: "Novo experimento",
                  })
               }
            >
               <Plus className="mr-2 size-4" />
               Novo experimento
            </Button>
         </div>
         <DataTable columns={columns} data={experiments} />
      </div>
   );
}
```

**Step 4: Typecheck**

```bash
cd /home/yorizel/Documents/contentta-nx && bun run typecheck 2>&1 | head -40
```

**Step 5: Commit**

```bash
cd /home/yorizel/Documents/contentta-nx && git add apps/web/src/features/experiments/ && git commit -m "feat(experiments): add experiments feature UI components"
```

---

## Task 9: Create Experiments Route and Add to Sidebar

**Files:**
- Create: `apps/web/src/routes/_authenticated/$slug/$teamSlug/_dashboard/experiments/index.tsx`
- Modify: `apps/web/src/layout/dashboard/ui/sidebar-nav-items.ts`

**Context:**
Follow the route pattern from `apps/web/src/routes/_authenticated/$slug/$teamSlug/_dashboard/forms/index.tsx`. Add experiments to the "main" nav group in sidebar, guarded by an early access feature flag.

**Step 1: Create the route file**

```tsx
import { createErrorFallback } from "@packages/ui/components/error-fallback";
import { Skeleton } from "@packages/ui/components/skeleton";
import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";
import { ErrorBoundary, type FallbackProps } from "react-error-boundary";
import { ExperimentsListSection } from "@/features/experiments/ui/experiments-list-section";

export const Route = createFileRoute(
   "/_authenticated/$slug/$teamSlug/_dashboard/experiments/",
)({
   component: ExperimentsPage,
});

function ExperimentsPageErrorFallback(props: FallbackProps) {
   return createErrorFallback({
      errorDescription: "Não foi possível carregar os experimentos",
      errorTitle: "Erro ao carregar experimentos",
      retryText: "Tentar novamente",
   })(props);
}

function ExperimentsPageSkeleton() {
   return (
      <main className="flex flex-col gap-4">
         <div className="flex flex-col gap-2">
            <Skeleton className="h-9 w-48" />
            <Skeleton className="h-5 w-80" />
         </div>
         <Skeleton className="h-[300px]" />
      </main>
   );
}

function ExperimentsPageContent() {
   return (
      <main className="flex flex-col gap-4">
         <div className="flex flex-col gap-2">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight font-serif leading-tight">
               Experimentos
            </h1>
            <p className="text-base md:text-lg text-muted-foreground font-sans leading-relaxed">
               Compare variantes de conteúdos e formulários com testes A/B
            </p>
         </div>
         <ExperimentsListSection />
      </main>
   );
}

function ExperimentsPage() {
   return (
      <ErrorBoundary FallbackComponent={ExperimentsPageErrorFallback}>
         <Suspense fallback={<ExperimentsPageSkeleton />}>
            <ExperimentsPageContent />
         </Suspense>
      </ErrorBoundary>
   );
}
```

**Step 2: Add experiments to sidebar nav**

In `apps/web/src/layout/dashboard/ui/sidebar-nav-items.ts`, add `FlaskConical` to the import from lucide-react, then add the nav item to the "main" group:

```typescript
{
   id: "experiments",
   label: "Experimentos",
   icon: FlaskConical,
   route: "/$slug/$teamSlug/experiments",
   quickAction: { type: "create", target: "sheet" },
   earlyAccessFlag: "experiments-beta",
   earlyAccessStage: "beta" as const,
},
```

Place it after the `assets` item.

**Step 3: Typecheck**

```bash
cd /home/yorizel/Documents/contentta-nx && bun run typecheck 2>&1 | head -40
```

**Step 4: Commit**

```bash
cd /home/yorizel/Documents/contentta-nx && git add apps/web/src/routes/_authenticated/$slug/$teamSlug/_dashboard/experiments/ apps/web/src/layout/dashboard/ui/sidebar-nav-items.ts && git commit -m "feat(experiments): add experiments route page and sidebar nav item"
```

---

## Task 10: Final Verification

**Step 1: Full typecheck**

```bash
cd /home/yorizel/Documents/contentta-nx && bun run typecheck 2>&1 | tail -20
```

Expected: exit 0, no errors.

**Step 2: Lint check**

```bash
cd /home/yorizel/Documents/contentta-nx && bun run check 2>&1 | tail -20
```

Fix any lint errors reported.

**Step 3: Run tests**

```bash
cd /home/yorizel/Documents/contentta-nx && bun run test 2>&1 | tail -40
```

Expected: all tests pass (no regressions from event schema changes).

**Step 4: Final commit if any fixes**

```bash
cd /home/yorizel/Documents/contentta-nx && git add -p && git commit -m "fix(experiments): address typecheck and lint issues"
```

---

## Summary of Changes

| Layer | Files Changed |
|-------|--------------|
| Events | `packages/events/src/experiments.ts` — target-agnostic schemas |
| SDK Server | `libraries/sdk/src/events/server.ts` — updated `trackConversion` |
| SDK Client | `libraries/sdk/src/forms.ts` — `embedForm` with `experimentId` option |
| SDK Server Forms | `apps/sdk-server/src/orpc/router/forms.ts` — emit experiment.conversion |
| Database Schema | `packages/database/src/schemas/experiments.ts` (new) |
| Database Schema | `packages/database/src/schema.ts` — re-export experiments |
| Database View | `packages/database/src/schemas/event-views.ts` — experiment_daily_stats |
| Repository | `packages/database/src/repositories/experiments-repository.ts` (new) |
| API Router | `apps/web/src/integrations/orpc/router/experiments.ts` (new) |
| API Index | `apps/web/src/integrations/orpc/router/index.ts` — register router |
| Feature UI | `apps/web/src/features/experiments/ui/` (3 new files) |
| Route | `apps/web/src/routes/.../experiments/index.tsx` (new) |
| Sidebar | `apps/web/src/layout/dashboard/ui/sidebar-nav-items.ts` |
