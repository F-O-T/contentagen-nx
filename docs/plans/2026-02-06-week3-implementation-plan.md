# Week 3: Redis Package, Worker App & Webhook System — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the foundational infrastructure (Redis package, Queue package, Worker app) and the webhook delivery system on top of it.

**Architecture:** Extract Redis into a dedicated package, create BullMQ queue definitions as a separate package, build a plain Bun worker process that consumes queues and runs scheduled jobs (node-cron), then wire up webhook delivery end-to-end.

**Tech Stack:** ioredis 5.8.2, BullMQ 5.58.7, node-cron, Drizzle ORM, oRPC, crypto (HMAC-SHA256)

---

## Task 1: Create `@packages/redis`

**Files:**
- Create: `packages/redis/src/connection.ts`
- Create: `packages/redis/package.json`
- Create: `packages/redis/tsconfig.json`

**Step 1: Create package.json**

File: `packages/redis/package.json`

```json
{
   "name": "@packages/redis",
   "version": "0.1.0",
   "type": "module",
   "private": true,
   "license": "Apache-2.0",
   "exports": {
      "./connection": {
         "default": "./src/connection.ts",
         "types": "./dist/src/connection.d.ts"
      }
   },
   "files": ["dist"],
   "scripts": {
      "build": "tsc --build",
      "check": "biome check --write ./src",
      "typecheck": "tsc"
   },
   "dependencies": {
      "ioredis": "catalog:workers"
   },
   "devDependencies": {
      "@tooling/typescript": "workspace:*",
      "typescript": "catalog:development"
   }
}
```

**Step 2: Create tsconfig.json**

File: `packages/redis/tsconfig.json`

```json
{
   "extends": "@tooling/typescript/internal-package.json",
   "include": ["src/**/*.ts"]
}
```

**Step 3: Create connection.ts**

Move the existing Redis singleton from `packages/authentication/src/redis-connection.ts` into the new package. Keep the same API.

File: `packages/redis/src/connection.ts`

```typescript
import { Redis } from "ioredis";

let redisConnection: Redis | null = null;

/**
 * Create and store the Redis singleton connection.
 * Call once at app startup.
 */
export function createRedisConnection(url: string): Redis {
   if (redisConnection) {
      return redisConnection;
   }

   redisConnection = new Redis(`${url}?family=6`, {
      maxRetriesPerRequest: null,
   });

   redisConnection.on("error", (err) => {
      console.error("[Redis] Connection error:", err.message);
   });

   redisConnection.on("connect", () => {
      console.log("[Redis] Connected successfully");
   });

   return redisConnection;
}

/**
 * Close the Redis connection and clear the singleton.
 */
export async function closeRedisConnection(): Promise<void> {
   if (redisConnection) {
      await redisConnection.quit();
      redisConnection = null;
      console.log("[Redis] Connection closed");
   }
}

/**
 * Get the existing Redis singleton, or null if not initialized.
 */
export function getRedisConnection(): Redis | null {
   return redisConnection;
}

export type { Redis };
```

**Step 4: Install dependencies**

```bash
cd /home/yorizel/Documents/contentta-nx && bun install
```

**Step 5: Typecheck**

```bash
bun run typecheck --projects=redis
```

**Step 6: Commit**

```bash
git add packages/redis
git commit -m "feat(redis): create @packages/redis package

Extract Redis connection singleton into dedicated package.
Provides createRedisConnection, getRedisConnection, closeRedisConnection."
```

---

## Task 2: Migrate consumers from `@packages/authentication/redis-connection` to `@packages/redis/connection`

**Files:**
- Modify: `packages/authentication/package.json` — add `@packages/redis` dependency, remove `ioredis`
- Modify: `packages/authentication/src/redis-connection.ts` — re-export from `@packages/redis`
- Modify: `apps/web/src/integrations/orpc/router/agent.ts` — update import
- Modify: `apps/web/src/integrations/orpc/router/content.ts` — update import
- Modify: `apps/web/package.json` — add `@packages/redis` dependency

**Step 1: Update authentication package to re-export from @packages/redis**

The `@packages/authentication` package currently exports `./redis-connection`. Other packages may import from it. To avoid breaking changes, make it re-export from `@packages/redis`.

File: `packages/authentication/src/redis-connection.ts` — replace contents:

```typescript
export {
   createRedisConnection,
   closeRedisConnection,
   getRedisConnection,
} from "@packages/redis/connection";
export type { Redis } from "@packages/redis/connection";
```

File: `packages/authentication/package.json` — add `@packages/redis` to dependencies:

```json
"@packages/redis": "workspace:*"
```

**Step 2: Update oRPC routers to import from @packages/redis**

File: `apps/web/src/integrations/orpc/router/agent.ts` — change import:

```typescript
// Before:
import { getRedisConnection } from "@packages/authentication/redis-connection";
// After:
import { getRedisConnection } from "@packages/redis/connection";
```

File: `apps/web/src/integrations/orpc/router/content.ts` — same change:

```typescript
// Before:
import { getRedisConnection } from "@packages/authentication/redis-connection";
// After:
import { getRedisConnection } from "@packages/redis/connection";
```

File: `apps/web/package.json` — add `@packages/redis` to dependencies:

```json
"@packages/redis": "workspace:*"
```

**Step 3: Install and typecheck**

```bash
cd /home/yorizel/Documents/contentta-nx && bun install && bun run typecheck
```

**Step 4: Commit**

```bash
git add packages/authentication packages/redis apps/web
git commit -m "refactor: migrate Redis imports to @packages/redis

- Authentication package re-exports from @packages/redis
- oRPC routers import directly from @packages/redis
- No breaking changes for existing consumers"
```

---

## Task 3: Create `@packages/queue`

**Files:**
- Create: `packages/queue/package.json`
- Create: `packages/queue/tsconfig.json`
- Create: `packages/queue/src/connection.ts`
- Create: `packages/queue/src/webhook-delivery.ts`
- Create: `packages/queue/src/scheduled.ts`

**Step 1: Create package.json**

File: `packages/queue/package.json`

```json
{
   "name": "@packages/queue",
   "version": "0.1.0",
   "type": "module",
   "private": true,
   "license": "Apache-2.0",
   "exports": {
      "./connection": {
         "default": "./src/connection.ts",
         "types": "./dist/src/connection.d.ts"
      },
      "./webhook-delivery": {
         "default": "./src/webhook-delivery.ts",
         "types": "./dist/src/webhook-delivery.d.ts"
      },
      "./scheduled": {
         "default": "./src/scheduled.ts",
         "types": "./dist/src/scheduled.d.ts"
      }
   },
   "files": ["dist"],
   "scripts": {
      "build": "tsc --build",
      "check": "biome check --write ./src",
      "typecheck": "tsc"
   },
   "dependencies": {
      "bullmq": "catalog:workers",
      "ioredis": "catalog:workers"
   },
   "devDependencies": {
      "@tooling/typescript": "workspace:*",
      "typescript": "catalog:development"
   }
}
```

**Step 2: Create tsconfig.json**

File: `packages/queue/tsconfig.json`

```json
{
   "extends": "@tooling/typescript/internal-package.json",
   "include": ["src/**/*.ts"]
}
```

**Step 3: Create connection.ts**

BullMQ requires its own Redis connection (it manages connections internally). This file provides a factory that creates a BullMQ-compatible IORedis connection options object from a Redis URL.

File: `packages/queue/src/connection.ts`

```typescript
import type { ConnectionOptions } from "bullmq";

/**
 * Create BullMQ-compatible connection options from a Redis URL.
 *
 * BullMQ manages its own connections internally — it needs connection
 * config, not a pre-existing ioredis instance.
 */
export function createQueueConnection(redisUrl: string): ConnectionOptions {
   const url = new URL(redisUrl);

   return {
      host: url.hostname,
      port: Number(url.port) || 6379,
      password: url.password || undefined,
      username: url.username || undefined,
      family: 6,
      maxRetriesPerRequest: null,
   };
}
```

**Step 4: Create webhook-delivery.ts**

Queue definition and job data type for webhook delivery.

File: `packages/queue/src/webhook-delivery.ts`

```typescript
import { Queue } from "bullmq";
import type { ConnectionOptions } from "bullmq";

export const WEBHOOK_DELIVERY_QUEUE = "webhook-delivery";

export interface WebhookDeliveryJobData {
   deliveryId: string;
   webhookEndpointId: string;
   eventId: string;
   url: string;
   payload: Record<string, unknown>;
   signingSecret: string;
   attemptNumber: number;
}

/**
 * Create the webhook delivery queue (producer side).
 * Call this from any app that needs to enqueue webhook deliveries.
 */
export function createWebhookDeliveryQueue(
   connection: ConnectionOptions,
): Queue<WebhookDeliveryJobData> {
   return new Queue<WebhookDeliveryJobData>(WEBHOOK_DELIVERY_QUEUE, {
      connection,
      defaultJobOptions: {
         attempts: 5,
         backoff: {
            type: "exponential",
            delay: 60_000, // 1 minute base delay
         },
         removeOnComplete: { count: 1000 },
         removeOnFail: { count: 5000 },
      },
   });
}
```

**Step 5: Create scheduled.ts**

Job data types for scheduled jobs. No queue needed — these run via node-cron, not BullMQ.

File: `packages/queue/src/scheduled.ts`

```typescript
/**
 * Job data types for scheduled (cron) jobs.
 * These jobs run via node-cron in the worker process,
 * not through BullMQ queues.
 */

export interface RefreshViewsJobData {
   triggeredAt: string;
}

export interface ReconcileCreditsJobData {
   triggeredAt: string;
}
```

**Step 6: Install and typecheck**

```bash
cd /home/yorizel/Documents/contentta-nx && bun install && bun run typecheck --projects=queue
```

**Step 7: Commit**

```bash
git add packages/queue
git commit -m "feat(queue): create @packages/queue package

- BullMQ connection factory from Redis URL
- Webhook delivery queue definition + job data types
- Scheduled job data types for cron jobs"
```

---

## Task 4: Create `apps/worker`

**Files:**
- Create: `apps/worker/package.json`
- Create: `apps/worker/tsconfig.json`
- Create: `apps/worker/src/index.ts`
- Create: `apps/worker/src/scheduler.ts`
- Create: `apps/worker/src/workers/webhook-delivery.ts`
- Create: `apps/worker/src/jobs/deliver-webhook.ts`
- Create: `apps/worker/src/jobs/refresh-views.ts`
- Create: `apps/worker/src/jobs/reconcile-credits.ts`

**Step 1: Create package.json**

File: `apps/worker/package.json`

```json
{
   "name": "worker",
   "version": "0.1.0",
   "type": "module",
   "private": true,
   "scripts": {
      "dev": "bun --watch src/index.ts",
      "start": "bun src/index.ts",
      "typecheck": "tsc"
   },
   "dependencies": {
      "@packages/database": "workspace:*",
      "@packages/environment": "workspace:*",
      "@packages/events": "workspace:*",
      "@packages/logging": "workspace:*",
      "@packages/queue": "workspace:*",
      "@packages/redis": "workspace:*",
      "bullmq": "catalog:workers",
      "ioredis": "catalog:workers",
      "node-cron": "^3.0.3"
   },
   "devDependencies": {
      "@tooling/typescript": "workspace:*",
      "@types/node-cron": "^3.0.11",
      "typescript": "catalog:development"
   }
}
```

**Step 2: Create tsconfig.json**

File: `apps/worker/tsconfig.json`

```json
{
   "compilerOptions": {
      "target": "ES2022",
      "module": "ESNext",
      "moduleResolution": "bundler",
      "lib": ["ES2022"],
      "types": ["bun-types"],
      "strict": true,
      "skipLibCheck": true,
      "noEmit": true,
      "esModuleInterop": true,
      "isolatedModules": true,
      "verbatimModuleSyntax": true,
      "noUnusedLocals": true,
      "noUnusedParameters": true,
      "noUncheckedIndexedAccess": true,
      "tsBuildInfoFile": ".cache/tsbuildinfo.json"
   },
   "include": ["src/**/*.ts"]
}
```

**Step 3: Create job processors**

These are thin wrappers calling existing functions from `@packages/events`.

File: `apps/worker/src/jobs/refresh-views.ts`

```typescript
import type { DatabaseInstance } from "@packages/database/client";
import { refreshUsageViews } from "@packages/events/refresh-views";

export async function runRefreshViews(db: DatabaseInstance): Promise<void> {
   const startTime = Date.now();
   console.log("[Worker] Starting materialized view refresh...");

   await refreshUsageViews(db);

   const duration = Date.now() - startTime;
   console.log(`[Worker] Materialized views refreshed in ${duration}ms`);
}
```

File: `apps/worker/src/jobs/reconcile-credits.ts`

```typescript
import type { DatabaseInstance } from "@packages/database/client";
import { reconcileCreditCounters } from "@packages/events/reconcile";
import type { Redis } from "ioredis";

export async function runReconcileCredits(
   db: DatabaseInstance,
   redis: Redis,
): Promise<void> {
   const startTime = Date.now();
   console.log("[Worker] Starting credit counter reconciliation...");

   await reconcileCreditCounters(db, redis);

   const duration = Date.now() - startTime;
   console.log(`[Worker] Credit counters reconciled in ${duration}ms`);
}
```

File: `apps/worker/src/jobs/deliver-webhook.ts`

```typescript
import { createHmac } from "node:crypto";
import type { DatabaseInstance } from "@packages/database/client";
import type { WebhookDeliveryJobData } from "@packages/queue/webhook-delivery";

/**
 * Generate HMAC-SHA256 signature for webhook payload.
 * Format: t={timestamp},v1={hmac}
 */
function generateSignature(
   payload: string,
   secret: string,
   timestamp: number,
): string {
   const signaturePayload = `${timestamp}.${payload}`;
   return createHmac("sha256", secret)
      .update(signaturePayload)
      .digest("hex");
}

/**
 * Deliver a webhook to the customer's endpoint.
 *
 * This function is called by the BullMQ worker for each job.
 * It signs the payload, POSTs it, and returns the result.
 * Throwing an error signals BullMQ to retry with exponential backoff.
 */
export async function deliverWebhook(
   _db: DatabaseInstance,
   job: WebhookDeliveryJobData,
): Promise<void> {
   const {
      deliveryId,
      url,
      payload,
      signingSecret,
      attemptNumber,
   } = job;

   const timestamp = Date.now();
   const payloadString = JSON.stringify(payload);
   const signature = generateSignature(payloadString, signingSecret, timestamp);

   const response = await fetch(url, {
      method: "POST",
      headers: {
         "Content-Type": "application/json",
         "X-Contentta-Signature": `t=${timestamp},v1=${signature}`,
         "X-Contentta-Event": String(payload.event ?? ""),
         "X-Contentta-Delivery-Id": deliveryId,
         "X-Contentta-Attempt": attemptNumber.toString(),
         "User-Agent": "Contentta-Webhooks/1.0",
      },
      body: payloadString,
      signal: AbortSignal.timeout(30_000),
   });

   if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new Error(
         `Webhook delivery failed: HTTP ${response.status} — ${body.slice(0, 500)}`,
      );
   }

   console.log(
      `[Worker] Webhook delivered to ${url} (attempt ${attemptNumber})`,
   );
}
```

**Step 4: Create webhook delivery worker**

File: `apps/worker/src/workers/webhook-delivery.ts`

```typescript
import { Worker } from "bullmq";
import type { ConnectionOptions } from "bullmq";
import type { DatabaseInstance } from "@packages/database/client";
import {
   WEBHOOK_DELIVERY_QUEUE,
   type WebhookDeliveryJobData,
} from "@packages/queue/webhook-delivery";
import { deliverWebhook } from "../jobs/deliver-webhook";

/**
 * Start the webhook delivery BullMQ worker.
 * Returns the worker instance for graceful shutdown.
 */
export function startWebhookDeliveryWorker(
   connection: ConnectionOptions,
   db: DatabaseInstance,
): Worker<WebhookDeliveryJobData> {
   const worker = new Worker<WebhookDeliveryJobData>(
      WEBHOOK_DELIVERY_QUEUE,
      async (job) => {
         await deliverWebhook(db, job.data);
      },
      {
         connection,
         concurrency: 10,
      },
   );

   worker.on("completed", (job) => {
      console.log(`[Worker] Webhook job ${job.id} completed`);
   });

   worker.on("failed", (job, err) => {
      console.error(
         `[Worker] Webhook job ${job?.id} failed (attempt ${job?.attemptsMade}/${job?.opts.attempts}):`,
         err.message,
      );
   });

   console.log("[Worker] Webhook delivery worker started");
   return worker;
}
```

**Step 5: Create scheduler**

File: `apps/worker/src/scheduler.ts`

```typescript
import cron from "node-cron";
import type { DatabaseInstance } from "@packages/database/client";
import type { Redis } from "ioredis";
import { runRefreshViews } from "./jobs/refresh-views";
import { runReconcileCredits } from "./jobs/reconcile-credits";

/**
 * Start all scheduled (cron) jobs.
 * Returns the cron tasks for graceful shutdown.
 */
export function startScheduler(
   db: DatabaseInstance,
   redis: Redis,
): cron.ScheduledTask[] {
   const tasks: cron.ScheduledTask[] = [];

   // Hourly: refresh materialized views, then reconcile credit counters
   const hourlyTask = cron.schedule("0 * * * *", async () => {
      console.log("[Scheduler] Running hourly billing reconciliation...");
      try {
         await runRefreshViews(db);
         await runReconcileCredits(db, redis);
         console.log("[Scheduler] Hourly billing reconciliation complete");
      } catch (error) {
         console.error("[Scheduler] Hourly job failed:", error);
      }
   });

   tasks.push(hourlyTask);
   console.log("[Scheduler] Cron jobs registered (hourly billing reconciliation)");

   return tasks;
}
```

**Step 6: Create entry point**

File: `apps/worker/src/index.ts`

```typescript
import { createDb } from "@packages/database/client";
import { env } from "@packages/environment/worker";
import { createQueueConnection } from "@packages/queue/connection";
import { createRedisConnection } from "@packages/redis/connection";
import { startScheduler } from "./scheduler";
import { startWebhookDeliveryWorker } from "./workers/webhook-delivery";

async function main(): Promise<void> {
   console.log("[Worker] Starting Contentta Worker...");

   // 1. Initialize Redis
   const redis = createRedisConnection(env.REDIS_URL);

   // 2. Initialize Database
   const db = createDb({ databaseUrl: env.DATABASE_URL });

   // 3. Create BullMQ connection
   const queueConnection = createQueueConnection(env.REDIS_URL);

   // 4. Start BullMQ workers
   const webhookWorker = startWebhookDeliveryWorker(queueConnection, db);

   // 5. Start scheduled jobs
   const scheduledTasks = startScheduler(db, redis);

   console.log("[Worker] All systems running");

   // Graceful shutdown
   const shutdown = async (signal: string) => {
      console.log(`[Worker] Received ${signal}, shutting down...`);

      // Stop accepting new cron jobs
      for (const task of scheduledTasks) {
         task.stop();
      }

      // Close BullMQ workers (drains in-progress jobs)
      await webhookWorker.close();

      // Close Redis
      await redis.quit();

      console.log("[Worker] Shutdown complete");
      process.exit(0);
   };

   process.on("SIGTERM", () => shutdown("SIGTERM"));
   process.on("SIGINT", () => shutdown("SIGINT"));
}

main().catch((error) => {
   console.error("[Worker] Fatal error:", error);
   process.exit(1);
});
```

**Step 7: Install dependencies and typecheck**

```bash
cd /home/yorizel/Documents/contentta-nx && bun install && bun run typecheck --projects=worker
```

**Step 8: Add dev:worker script to root package.json**

Add to the `"scripts"` section of the root `package.json`:

```json
"dev:worker": "nx run worker:dev"
```

**Step 9: Commit**

```bash
git add apps/worker package.json
git commit -m "feat(worker): create worker app with BullMQ + cron scheduler

- Plain Bun process entry point with graceful shutdown
- Webhook delivery BullMQ worker (concurrency 10)
- Hourly cron: refresh materialized views + reconcile credits
- Job processors for webhook delivery, view refresh, credit reconciliation"
```

---

## Task 5: Webhook Database Schema

**Files:**
- Create: `packages/database/src/schemas/webhooks.ts`
- Modify: `packages/database/src/schema.ts`

**Step 1: Create webhook tables**

File: `packages/database/src/schemas/webhooks.ts`

```typescript
import { relations, sql } from "drizzle-orm";
import {
   boolean,
   index,
   integer,
   jsonb,
   pgTable,
   text,
   timestamp,
   uuid,
} from "drizzle-orm/pg-core";
import { organization } from "./auth";
import { events } from "./events";

/**
 * Webhook Endpoints — organization webhook configurations.
 * Each endpoint subscribes to event patterns (e.g. "content.*", "ai.*").
 */
export const webhookEndpoints = pgTable(
   "webhook_endpoints",
   {
      id: uuid("id").default(sql`pg_catalog.gen_random_uuid()`).primaryKey(),
      organizationId: uuid("organization_id")
         .notNull()
         .references(() => organization.id, { onDelete: "cascade" }),
      url: text("url").notNull(),
      description: text("description"),
      eventPatterns: jsonb("event_patterns").$type<string[]>().notNull(),
      signingSecret: text("signing_secret").notNull(),
      isActive: boolean("is_active").default(true).notNull(),
      failureCount: integer("failure_count").default(0).notNull(),
      lastSuccessAt: timestamp("last_success_at"),
      lastFailureAt: timestamp("last_failure_at"),
      createdAt: timestamp("created_at").defaultNow().notNull(),
      updatedAt: timestamp("updated_at")
         .defaultNow()
         .$onUpdate(() => new Date())
         .notNull(),
   },
   (table) => [
      index("webhook_endpoints_org_idx").on(table.organizationId),
      index("webhook_endpoints_active_idx").on(table.isActive),
   ],
);

/**
 * Webhook Deliveries — delivery attempts and logs.
 */
export const webhookDeliveries = pgTable(
   "webhook_deliveries",
   {
      id: uuid("id").default(sql`pg_catalog.gen_random_uuid()`).primaryKey(),
      webhookEndpointId: uuid("webhook_endpoint_id")
         .notNull()
         .references(() => webhookEndpoints.id, { onDelete: "cascade" }),
      eventId: uuid("event_id")
         .notNull()
         .references(() => events.id, { onDelete: "cascade" }),
      url: text("url").notNull(),
      eventName: text("event_name").notNull(),
      payload: jsonb("payload").$type<Record<string, unknown>>().notNull(),
      status: text("status").notNull(), // pending | success | failed | retrying
      httpStatusCode: integer("http_status_code"),
      responseBody: text("response_body"),
      errorMessage: text("error_message"),
      attemptNumber: integer("attempt_number").default(1).notNull(),
      maxAttempts: integer("max_attempts").default(5).notNull(),
      nextRetryAt: timestamp("next_retry_at"),
      createdAt: timestamp("created_at").defaultNow().notNull(),
      deliveredAt: timestamp("delivered_at"),
   },
   (table) => [
      index("webhook_deliveries_webhook_idx").on(table.webhookEndpointId),
      index("webhook_deliveries_status_idx").on(table.status),
      index("webhook_deliveries_event_idx").on(table.eventId),
   ],
);

export const webhookEndpointsRelations = relations(
   webhookEndpoints,
   ({ one, many }) => ({
      organization: one(organization, {
         fields: [webhookEndpoints.organizationId],
         references: [organization.id],
      }),
      deliveries: many(webhookDeliveries),
   }),
);

export const webhookDeliveriesRelations = relations(
   webhookDeliveries,
   ({ one }) => ({
      webhookEndpoint: one(webhookEndpoints, {
         fields: [webhookDeliveries.webhookEndpointId],
         references: [webhookEndpoints.id],
      }),
      event: one(events, {
         fields: [webhookDeliveries.eventId],
         references: [events.id],
      }),
   }),
);

export type WebhookEndpoint = typeof webhookEndpoints.$inferSelect;
export type NewWebhookEndpoint = typeof webhookEndpoints.$inferInsert;
export type WebhookDelivery = typeof webhookDeliveries.$inferSelect;
export type NewWebhookDelivery = typeof webhookDeliveries.$inferInsert;
```

**Step 2: Add to schema.ts**

File: `packages/database/src/schema.ts` — add this line at the end:

```typescript
export * from "./schemas/webhooks";
```

**Step 3: Push schema to database**

```bash
cd /home/yorizel/Documents/contentta-nx && bun run db:push:local
```

**Step 4: Typecheck**

```bash
bun run typecheck --projects=database
```

**Step 5: Commit**

```bash
git add packages/database
git commit -m "feat(database): add webhook tables schema

- webhook_endpoints: org webhook configs with event patterns
- webhook_deliveries: delivery log with status tracking
- Relations and indexes for query performance"
```

---

## Task 6: Webhook Repository

**Files:**
- Create: `packages/database/src/repositories/webhook-repository.ts`

**Step 1: Create the repository**

File: `packages/database/src/repositories/webhook-repository.ts`

```typescript
import { randomBytes } from "node:crypto";
import { AppError, propagateError } from "@packages/utils/errors";
import { and, desc, eq, sql } from "drizzle-orm";
import type { DatabaseInstance } from "../client";
import {
   type NewWebhookDelivery,
   type NewWebhookEndpoint,
   webhookDeliveries,
   webhookEndpoints,
} from "../schemas/webhooks";

/**
 * Generate a 32-byte hex signing secret for webhook endpoints.
 */
export function generateWebhookSecret(): string {
   return randomBytes(32).toString("hex");
}

// ---------------------------------------------------------------------------
// Webhook Endpoints
// ---------------------------------------------------------------------------

export async function createWebhookEndpoint(
   db: DatabaseInstance,
   data: Omit<NewWebhookEndpoint, "signingSecret">,
) {
   try {
      const [endpoint] = await db
         .insert(webhookEndpoints)
         .values({
            ...data,
            signingSecret: generateWebhookSecret(),
         })
         .returning();

      return endpoint;
   } catch (err) {
      propagateError(err);
      throw AppError.database("Failed to create webhook endpoint");
   }
}

export async function listWebhookEndpoints(
   db: DatabaseInstance,
   organizationId: string,
) {
   try {
      return await db
         .select()
         .from(webhookEndpoints)
         .where(eq(webhookEndpoints.organizationId, organizationId))
         .orderBy(desc(webhookEndpoints.createdAt));
   } catch (err) {
      propagateError(err);
      throw AppError.database("Failed to list webhook endpoints");
   }
}

export async function getWebhookEndpoint(
   db: DatabaseInstance,
   webhookId: string,
) {
   try {
      const [endpoint] = await db
         .select()
         .from(webhookEndpoints)
         .where(eq(webhookEndpoints.id, webhookId))
         .limit(1);

      return endpoint ?? null;
   } catch (err) {
      propagateError(err);
      throw AppError.database("Failed to get webhook endpoint");
   }
}

export async function updateWebhookEndpoint(
   db: DatabaseInstance,
   webhookId: string,
   data: Partial<Pick<NewWebhookEndpoint, "url" | "description" | "eventPatterns" | "isActive">>,
) {
   try {
      const [updated] = await db
         .update(webhookEndpoints)
         .set(data)
         .where(eq(webhookEndpoints.id, webhookId))
         .returning();

      return updated;
   } catch (err) {
      propagateError(err);
      throw AppError.database("Failed to update webhook endpoint");
   }
}

export async function deleteWebhookEndpoint(
   db: DatabaseInstance,
   webhookId: string,
) {
   try {
      await db
         .delete(webhookEndpoints)
         .where(eq(webhookEndpoints.id, webhookId));
   } catch (err) {
      propagateError(err);
      throw AppError.database("Failed to delete webhook endpoint");
   }
}

export async function updateWebhookLastSuccess(
   db: DatabaseInstance,
   webhookId: string,
) {
   try {
      await db
         .update(webhookEndpoints)
         .set({
            lastSuccessAt: new Date(),
            failureCount: 0,
         })
         .where(eq(webhookEndpoints.id, webhookId));
   } catch (err) {
      propagateError(err);
      throw AppError.database("Failed to update webhook success");
   }
}

export async function incrementWebhookFailureCount(
   db: DatabaseInstance,
   webhookId: string,
) {
   try {
      await db
         .update(webhookEndpoints)
         .set({
            failureCount: sql`${webhookEndpoints.failureCount} + 1`,
            lastFailureAt: new Date(),
         })
         .where(eq(webhookEndpoints.id, webhookId));
   } catch (err) {
      propagateError(err);
      throw AppError.database("Failed to increment failure count");
   }
}

/**
 * Find all active webhook endpoints for an organization
 * whose event patterns match the given event name.
 */
export async function findMatchingWebhooks(
   db: DatabaseInstance,
   organizationId: string,
   eventName: string,
) {
   try {
      const endpoints = await db
         .select()
         .from(webhookEndpoints)
         .where(
            and(
               eq(webhookEndpoints.organizationId, organizationId),
               eq(webhookEndpoints.isActive, true),
            ),
         );

      return endpoints.filter((endpoint) =>
         endpoint.eventPatterns.some((pattern) =>
            matchesPattern(eventName, pattern),
         ),
      );
   } catch (err) {
      propagateError(err);
      throw AppError.database("Failed to find matching webhooks");
   }
}

/**
 * Check if an event name matches a subscription pattern.
 * Supports wildcard suffix: "content.*" matches "content.page.published"
 * Supports exact match: "form.submitted" matches "form.submitted"
 */
function matchesPattern(eventName: string, pattern: string): boolean {
   if (pattern.endsWith(".*")) {
      const prefix = pattern.slice(0, -2);
      return eventName.startsWith(`${prefix}.`);
   }
   return eventName === pattern;
}

// ---------------------------------------------------------------------------
// Webhook Deliveries
// ---------------------------------------------------------------------------

export async function createWebhookDelivery(
   db: DatabaseInstance,
   data: NewWebhookDelivery,
) {
   try {
      const [delivery] = await db
         .insert(webhookDeliveries)
         .values(data)
         .returning();

      return delivery;
   } catch (err) {
      propagateError(err);
      throw AppError.database("Failed to create webhook delivery");
   }
}

export async function updateWebhookDeliveryStatus(
   db: DatabaseInstance,
   deliveryId: string,
   data: {
      status: string;
      httpStatusCode?: number;
      responseBody?: string;
      errorMessage?: string;
      attemptNumber?: number;
      nextRetryAt?: Date;
      deliveredAt?: Date;
   },
) {
   try {
      const [updated] = await db
         .update(webhookDeliveries)
         .set(data)
         .where(eq(webhookDeliveries.id, deliveryId))
         .returning();

      return updated;
   } catch (err) {
      propagateError(err);
      throw AppError.database("Failed to update webhook delivery");
   }
}

export async function getWebhookDeliveries(
   db: DatabaseInstance,
   webhookId: string,
   options: { offset?: number; limit?: number } = {},
) {
   try {
      const { offset = 0, limit = 50 } = options;

      return await db
         .select()
         .from(webhookDeliveries)
         .where(eq(webhookDeliveries.webhookEndpointId, webhookId))
         .orderBy(desc(webhookDeliveries.createdAt))
         .offset(offset)
         .limit(limit);
   } catch (err) {
      propagateError(err);
      throw AppError.database("Failed to get webhook deliveries");
   }
}
```

**Step 2: Typecheck**

```bash
bun run typecheck --projects=database
```

**Step 3: Commit**

```bash
git add packages/database/src/repositories/webhook-repository.ts
git commit -m "feat(database): add webhook repository

- Webhook endpoint CRUD with signing secret generation
- Pattern-based event matching (wildcard + exact)
- Delivery log creation and status updates
- Failure count tracking with reset on success"
```

---

## Task 7: Integrate Webhook Triggers into Event Emission

**Files:**
- Modify: `packages/events/src/emit.ts`
- Modify: `packages/events/package.json` — add `@packages/queue` and `bullmq` dependencies

**Step 1: Update events package.json**

Add to `packages/events/package.json` dependencies:

```json
"@packages/queue": "workspace:*",
"bullmq": "catalog:workers"
```

**Step 2: Add webhook trigger to emitEvent**

The `emitEvent` function needs to:
1. Store the event (existing)
2. Capture to PostHog (existing)
3. **New:** Find matching webhooks, create delivery records, enqueue jobs

The webhook queue must be lazily initialized — it needs a Redis URL which isn't available at import time.

File: `packages/events/src/emit.ts` — add webhook integration:

Add these imports at the top:

```typescript
import type { Queue } from "bullmq";
import { createQueueConnection } from "@packages/queue/connection";
import {
   type WebhookDeliveryJobData,
   createWebhookDeliveryQueue,
} from "@packages/queue/webhook-delivery";
import {
   createWebhookDelivery,
   findMatchingWebhooks,
} from "@packages/database/repositories/webhook-repository";
```

Add a lazy queue initializer and the webhook payload builder:

```typescript
// ---------------------------------------------------------------------------
// Webhook Queue (lazy-initialized)
// ---------------------------------------------------------------------------

let webhookQueue: Queue<WebhookDeliveryJobData> | null = null;

/**
 * Initialize the webhook delivery queue.
 * Must be called once at app startup (web or worker).
 */
export function initializeWebhookQueue(redisUrl: string): void {
   if (webhookQueue) return;
   const connection = createQueueConnection(redisUrl);
   webhookQueue = createWebhookDeliveryQueue(connection);
}

/**
 * Build the webhook payload from a stored event.
 */
function buildWebhookPayload(
   eventId: string,
   eventName: string,
   organizationId: string,
   properties: Record<string, unknown>,
): Record<string, unknown> {
   return {
      id: eventId,
      event: eventName,
      data: properties,
      created_at: new Date().toISOString(),
      organization_id: organizationId,
   };
}
```

Then modify the `emitEvent` function: after the PostHog capture block, add webhook triggering. The `db.insert(events).values(...).returning()` call needs to return the inserted row so we have the event ID. Change the insert to use `.returning()`:

```typescript
// Inside emitEvent, replace the existing db.insert with:

// 1. Store in PostgreSQL (billing source of truth)
const [storedEvent] = await db.insert(events).values({
   organizationId,
   eventName,
   eventCategory,
   properties,
   userId,
   isBillable: true,
   pricePerEvent: toMajorUnitsString(price),
   ipAddress,
   userAgent,
}).returning();

// ... existing PostHog block ...

// 3. Trigger webhooks (failure-tolerant)
if (webhookQueue && storedEvent) {
   try {
      const matchingWebhooks = await findMatchingWebhooks(
         db,
         organizationId,
         eventName,
      );

      for (const webhook of matchingWebhooks) {
         const payload = buildWebhookPayload(
            storedEvent.id,
            eventName,
            organizationId,
            properties,
         );

         const delivery = await createWebhookDelivery(db, {
            webhookEndpointId: webhook.id,
            eventId: storedEvent.id,
            url: webhook.url,
            eventName,
            payload,
            status: "pending",
            attemptNumber: 1,
            maxAttempts: 5,
         });

         await webhookQueue.add("deliver", {
            deliveryId: delivery.id,
            webhookEndpointId: webhook.id,
            eventId: storedEvent.id,
            url: webhook.url,
            payload,
            signingSecret: webhook.signingSecret,
            attemptNumber: 1,
         });
      }
   } catch (error) {
      console.error("[Events] Failed to trigger webhooks:", error);
      // Don't throw — webhooks should not block events
   }
}
```

**Step 3: Initialize webhook queue in web app startup**

The web app needs to call `initializeWebhookQueue` at startup so that emitEvent can enqueue webhook jobs.

File: Find where Redis is initialized in the web app (likely `apps/web/src/integrations/orpc/server.ts` or the main server entry) and add:

```typescript
import { initializeWebhookQueue } from "@packages/events/emit";
// After Redis is created:
initializeWebhookQueue(env.REDIS_URL);
```

**Step 4: Install and typecheck**

```bash
cd /home/yorizel/Documents/contentta-nx && bun install && bun run typecheck
```

**Step 5: Commit**

```bash
git add packages/events apps/web
git commit -m "feat(events): integrate webhook triggers into event emission

- Lazy-initialize webhook delivery queue
- Find matching webhooks after event storage
- Create delivery records and enqueue BullMQ jobs
- Failure-tolerant: webhook errors don't block events"
```

---

## Task 8: Webhook Management oRPC Router

**Files:**
- Create: `apps/web/src/integrations/orpc/router/webhooks.ts`
- Modify: `apps/web/src/integrations/orpc/router/index.ts` (or wherever routers are mounted)

**Step 1: Create webhooks router**

File: `apps/web/src/integrations/orpc/router/webhooks.ts`

```typescript
import { ORPCError } from "@orpc/server";
import {
   createWebhookEndpoint,
   deleteWebhookEndpoint,
   getWebhookDeliveries,
   getWebhookEndpoint,
   listWebhookEndpoints,
   updateWebhookEndpoint,
} from "@packages/database/repositories/webhook-repository";
import { z } from "zod";
import { protectedProcedure } from "../server";

// =============================================================================
// Validation Schemas
// =============================================================================

const createWebhookSchema = z.object({
   url: z.string().url(),
   description: z.string().optional(),
   eventPatterns: z.array(z.string()).min(1),
});

const updateWebhookSchema = z.object({
   id: z.string().uuid(),
   url: z.string().url().optional(),
   description: z.string().optional(),
   eventPatterns: z.array(z.string()).min(1).optional(),
   isActive: z.boolean().optional(),
});

// =============================================================================
// Webhook Procedures
// =============================================================================

/**
 * Create a new webhook endpoint
 */
export const create = protectedProcedure
   .input(createWebhookSchema)
   .handler(async ({ context, input }) => {
      const { organizationId, db } = context;

      const endpoint = await createWebhookEndpoint(db, {
         organizationId,
         url: input.url,
         description: input.description,
         eventPatterns: input.eventPatterns,
      });

      return endpoint;
   });

/**
 * List all webhook endpoints for the organization
 */
export const list = protectedProcedure.handler(async ({ context }) => {
   const { organizationId, db } = context;

   const endpoints = await listWebhookEndpoints(db, organizationId);

   // Mask signing secrets in responses
   return endpoints.map((e) => ({
      ...e,
      signingSecret: `${e.signingSecret.slice(0, 8)}...`,
   }));
});

/**
 * Get webhook endpoint details
 */
export const getById = protectedProcedure
   .input(z.object({ id: z.string().uuid() }))
   .handler(async ({ context, input }) => {
      const { organizationId, db } = context;

      const endpoint = await getWebhookEndpoint(db, input.id);

      if (!endpoint || endpoint.organizationId !== organizationId) {
         throw new ORPCError("NOT_FOUND", {
            message: "Webhook endpoint não encontrado.",
         });
      }

      return {
         ...endpoint,
         signingSecret: `${endpoint.signingSecret.slice(0, 8)}...`,
      };
   });

/**
 * Update webhook endpoint
 */
export const update = protectedProcedure
   .input(updateWebhookSchema)
   .handler(async ({ context, input }) => {
      const { organizationId, db } = context;

      const endpoint = await getWebhookEndpoint(db, input.id);

      if (!endpoint || endpoint.organizationId !== organizationId) {
         throw new ORPCError("NOT_FOUND", {
            message: "Webhook endpoint não encontrado.",
         });
      }

      const { id: _id, ...updateData } = input;
      const updated = await updateWebhookEndpoint(db, input.id, updateData);
      return updated;
   });

/**
 * Delete webhook endpoint
 */
export const remove = protectedProcedure
   .input(z.object({ id: z.string().uuid() }))
   .handler(async ({ context, input }) => {
      const { organizationId, db } = context;

      const endpoint = await getWebhookEndpoint(db, input.id);

      if (!endpoint || endpoint.organizationId !== organizationId) {
         throw new ORPCError("NOT_FOUND", {
            message: "Webhook endpoint não encontrado.",
         });
      }

      await deleteWebhookEndpoint(db, input.id);
      return { success: true };
   });

/**
 * List deliveries for a webhook endpoint
 */
export const deliveries = protectedProcedure
   .input(
      z.object({
         webhookId: z.string().uuid(),
         page: z.number().min(1).optional().default(1),
         limit: z.number().min(1).max(100).optional().default(50),
      }),
   )
   .handler(async ({ context, input }) => {
      const { organizationId, db } = context;

      const endpoint = await getWebhookEndpoint(db, input.webhookId);

      if (!endpoint || endpoint.organizationId !== organizationId) {
         throw new ORPCError("NOT_FOUND", {
            message: "Webhook endpoint não encontrado.",
         });
      }

      const items = await getWebhookDeliveries(db, input.webhookId, {
         offset: (input.page - 1) * input.limit,
         limit: input.limit,
      });

      return { items, page: input.page, limit: input.limit };
   });
```

**Step 2: Mount the webhooks router**

Find where routers are registered (e.g. `apps/web/src/integrations/orpc/router/index.ts` or similar) and add:

```typescript
import * as webhooks from "./webhooks";

// In the router definition, add:
webhooks,
```

**Step 3: Typecheck**

```bash
bun run typecheck
```

**Step 4: Commit**

```bash
git add apps/web/src/integrations/orpc/router/webhooks.ts apps/web/src/integrations/orpc/router/index.ts
git commit -m "feat(web): add webhook management oRPC router

- CRUD for webhook endpoints
- Delivery log with pagination
- Signing secrets masked in responses
- Organization ownership verification"
```

---

## Task 9: Update Worker with Webhook Delivery Status Tracking

**Files:**
- Modify: `apps/worker/src/jobs/deliver-webhook.ts`
- Modify: `apps/worker/src/workers/webhook-delivery.ts`

Now that the repository exists, update the worker to track delivery status in the database.

**Step 1: Update deliver-webhook.ts to use repository**

File: `apps/worker/src/jobs/deliver-webhook.ts` — update to track status:

```typescript
import { createHmac } from "node:crypto";
import type { DatabaseInstance } from "@packages/database/client";
import {
   incrementWebhookFailureCount,
   updateWebhookDeliveryStatus,
   updateWebhookLastSuccess,
} from "@packages/database/repositories/webhook-repository";
import type { WebhookDeliveryJobData } from "@packages/queue/webhook-delivery";

function generateSignature(
   payload: string,
   secret: string,
   timestamp: number,
): string {
   const signaturePayload = `${timestamp}.${payload}`;
   return createHmac("sha256", secret)
      .update(signaturePayload)
      .digest("hex");
}

export async function deliverWebhook(
   db: DatabaseInstance,
   job: WebhookDeliveryJobData,
): Promise<void> {
   const {
      deliveryId,
      webhookEndpointId,
      url,
      payload,
      signingSecret,
      attemptNumber,
   } = job;

   const timestamp = Date.now();
   const payloadString = JSON.stringify(payload);
   const signature = generateSignature(payloadString, signingSecret, timestamp);

   try {
      const response = await fetch(url, {
         method: "POST",
         headers: {
            "Content-Type": "application/json",
            "X-Contentta-Signature": `t=${timestamp},v1=${signature}`,
            "X-Contentta-Event": String(payload.event ?? ""),
            "X-Contentta-Delivery-Id": deliveryId,
            "X-Contentta-Attempt": attemptNumber.toString(),
            "User-Agent": "Contentta-Webhooks/1.0",
         },
         body: payloadString,
         signal: AbortSignal.timeout(30_000),
      });

      const responseBody = await response.text().catch(() => "");

      if (response.ok) {
         await updateWebhookDeliveryStatus(db, deliveryId, {
            status: "success",
            httpStatusCode: response.status,
            responseBody: responseBody.slice(0, 1000),
            deliveredAt: new Date(),
         });

         await updateWebhookLastSuccess(db, webhookEndpointId);
         console.log(`[Worker] Webhook delivered to ${url} (attempt ${attemptNumber})`);
      } else {
         throw new Error(`HTTP ${response.status}: ${responseBody.slice(0, 500)}`);
      }
   } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";

      // Update delivery status — BullMQ handles retry scheduling
      await updateWebhookDeliveryStatus(db, deliveryId, {
         status: "retrying",
         errorMessage,
         attemptNumber,
      }).catch((e) => console.error("[Worker] Failed to update delivery status:", e));

      // If this was the last attempt, mark as failed
      if (attemptNumber >= 5) {
         await updateWebhookDeliveryStatus(db, deliveryId, {
            status: "failed",
            errorMessage: `Max attempts reached: ${errorMessage}`,
         }).catch((e) => console.error("[Worker] Failed to mark delivery as failed:", e));

         await incrementWebhookFailureCount(db, webhookEndpointId).catch((e) =>
            console.error("[Worker] Failed to increment failure count:", e),
         );
      }

      // Re-throw so BullMQ retries
      throw error;
   }
}
```

**Step 2: Typecheck**

```bash
bun run typecheck --projects=worker
```

**Step 3: Commit**

```bash
git add apps/worker/src/jobs/deliver-webhook.ts
git commit -m "feat(worker): add delivery status tracking to webhook job

- Update delivery record on success/failure
- Track HTTP status codes and response bodies
- Increment endpoint failure count after max attempts
- Reset failure count on success"
```

---

## Task 10: Full Typecheck & Verification

**Step 1: Install all dependencies**

```bash
cd /home/yorizel/Documents/contentta-nx && bun install
```

**Step 2: Run full typecheck**

```bash
bun run typecheck
```

Fix any errors that arise. Common issues to check:
- `@packages/redis` imports resolve correctly
- `@packages/queue` imports resolve correctly
- `apps/worker` can import from all packages
- `packages/events/src/emit.ts` can import from `@packages/queue` and `@packages/database`

**Step 3: Verify worker starts**

```bash
bun run dev:worker
```

The worker should:
- Connect to Redis
- Start the webhook delivery BullMQ worker
- Register the hourly cron job
- Print startup messages

**Step 4: Commit any fixes**

```bash
git add -A
git commit -m "fix: resolve typecheck errors from Week 3 integration"
```

---

## Checklist

- [ ] `@packages/redis` created with connection singleton
- [ ] All consumers migrated from `@packages/authentication/redis-connection`
- [ ] `@packages/queue` created with BullMQ connection factory + queue definitions
- [ ] `apps/worker` created with entry point, graceful shutdown
- [ ] Webhook delivery BullMQ worker running
- [ ] Hourly cron: materialized view refresh + credit reconciliation
- [ ] Webhook database schema (endpoints + deliveries)
- [ ] Webhook repository (CRUD + pattern matching)
- [ ] Webhook triggers integrated into `emitEvent()`
- [ ] Webhook management oRPC router
- [ ] Delivery status tracking in worker
- [ ] Full typecheck passes
