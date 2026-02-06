# Week 3: Redis Package, Worker App & Webhook System — Design

**Date:** 2026-02-06
**Status:** Approved
**Scope:** Infrastructure foundation (Redis, Queue, Worker) + Webhook delivery system

---

## Context

The credit-based billing system (Week 2) introduced Redis counters for real-time usage tracking and materialized views for hourly reconciliation. However:

- Redis connection lives inside `@packages/authentication` — awkward coupling
- `refreshUsageViews()` and `reconcileCreditCounters()` exist but are never called (no scheduler)
- No BullMQ worker app to process async jobs
- No queue package for job definitions

Week 3 needs these foundations before building the webhook delivery system.

---

## Architecture Overview

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────┐
│  apps/web   │────▶│ @packages/queue  │────▶│ apps/worker  │
│  (producer) │     │ (queue + types)  │     │ (consumer)   │
└──────┬──────┘     └──────────────────┘     └──────┬──────┘
       │                                            │
       │            ┌──────────────────┐            │
       └───────────▶│ @packages/redis  │◀───────────┘
                    │ (connection)     │
                    └──────────────────┘
```

**Producer/consumer split:**
- `@packages/queue` defines queues and job data types (any app can add jobs)
- `apps/worker` runs BullMQ Workers that consume and process jobs
- `@packages/redis` provides the shared connection singleton

---

## 1. `@packages/redis`

Single source of truth for Redis connections across the monorepo.

### Structure

```
packages/redis/src/
└── connection.ts     # createRedisConnection(), getRedisConnection(), initializeRedis()
```

### Exports

```json
{
  "./connection": { "default": "./src/connection.ts" }
}
```

### API

- `initializeRedis(url: string): Redis` — creates and stores the singleton
- `getRedisConnection(): Redis | null` — returns the singleton or null
- `createRedisConnection(url: string): Redis` — factory for fresh connections (used by BullMQ)

### Migration

Move `packages/authentication/src/redis-connection.ts` → `packages/redis/src/connection.ts`. Update all consumers:

- `@packages/authentication` (session cache)
- `@packages/events/credits.ts` (credit tracking)
- `apps/web/src/integrations/orpc/router/agent.ts` (credit checks)
- `apps/web/src/integrations/orpc/router/content.ts` (credit checks)

---

## 2. `@packages/queue`

BullMQ queue definitions and job data type interfaces. Producer-side only.

### Structure

```
packages/queue/src/
├── connection.ts          # createQueueConnection(url) → IORedis config for BullMQ
├── webhook-delivery.ts    # webhookDeliveryQueue + WebhookDeliveryJobData type
└── scheduled.ts           # scheduledQueue + ScheduledJobData types
```

### Exports

```json
{
  "./connection":        { "default": "./src/connection.ts" },
  "./webhook-delivery":  { "default": "./src/webhook-delivery.ts" },
  "./scheduled":         { "default": "./src/scheduled.ts" }
}
```

### Key Types

```typescript
// webhook-delivery.ts
export interface WebhookDeliveryJobData {
  deliveryId: string;
  webhookEndpointId: string;
  eventId: string;
  url: string;
  payload: Record<string, unknown>;
  signingSecret: string;
  attemptNumber: number;
}

// scheduled.ts
export interface RefreshViewsJobData {
  triggeredAt: string;
}

export interface ReconcileCreditsJobData {
  triggeredAt: string;
}
```

### Dependencies

```json
{
  "bullmq": "catalog:workers",
  "ioredis": "catalog:workers"
}
```

---

## 3. `apps/worker`

Plain Bun process. Starts BullMQ workers + node-cron scheduled jobs. No HTTP server.

### Structure

```
apps/worker/
├── src/
│   ├── index.ts                    # Entry point — boots everything
│   ├── workers/
│   │   └── webhook-delivery.ts     # BullMQ Worker for webhook queue
│   ├── jobs/
│   │   ├── deliver-webhook.ts      # HMAC signing, HTTP POST, retry logic
│   │   ├── refresh-views.ts        # Calls refreshUsageViews()
│   │   └── reconcile-credits.ts    # Calls reconcileCreditCounters()
│   └── scheduler.ts                # node-cron hourly jobs
├── package.json
├── tsconfig.json
└── project.json                    # Nx config
```

### Entry Point Flow

1. Initialize Redis via `@packages/redis`
2. Initialize database via `@packages/database`
3. Register BullMQ workers (webhook delivery)
4. Start node-cron scheduler:
   - `0 * * * *` → refresh materialized views, then reconcile credit counters
5. Graceful shutdown on SIGTERM/SIGINT (close workers, drain queues)

### Job Processors

**deliver-webhook.ts:**
- HMAC-SHA256 signing: `t={timestamp},v1={hmac(timestamp.payload, secret)}`
- HTTP POST with 30s timeout
- Headers: `X-Contentta-Signature`, `X-Contentta-Event`, `X-Contentta-Delivery-Id`
- On success: update delivery status, reset endpoint failure count
- On failure: update delivery status with error, let BullMQ handle retry via backoff config

**refresh-views.ts / reconcile-credits.ts:**
- Thin wrappers calling existing functions from `@packages/events`

### Dependencies

```json
{
  "@packages/redis": "workspace:*",
  "@packages/queue": "workspace:*",
  "@packages/database": "workspace:*",
  "@packages/events": "workspace:*",
  "@packages/environment": "workspace:*",
  "@packages/logging": "workspace:*",
  "bullmq": "catalog:workers",
  "ioredis": "catalog:workers",
  "node-cron": "^3.0.0"
}
```

### Nx Integration

- `project.json` with `dev` target (bun --watch) and `build` target
- Root `package.json` gets `dev:worker` script
- Added to `dev:all` if it exists

---

## 4. Webhook System

### Database Schema

**`webhook_endpoints`** — Organization webhook configurations

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| organization_id | uuid FK → organization | cascade delete |
| url | text | HTTPS endpoint |
| description | text | optional |
| event_patterns | jsonb (string[]) | e.g. `["content.*", "ai.*"]` |
| signing_secret | text | auto-generated, 32 bytes hex |
| is_active | boolean | default true |
| failure_count | integer | default 0, reset on success |
| last_success_at | timestamp | |
| last_failure_at | timestamp | |
| created_at | timestamp | |
| updated_at | timestamp | |

**`webhook_deliveries`** — Delivery attempts log

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| webhook_endpoint_id | uuid FK → webhook_endpoints | cascade delete |
| event_id | uuid FK → events | cascade delete |
| url | text | snapshot of endpoint URL at delivery time |
| event_name | text | |
| payload | jsonb | full webhook payload |
| status | text | pending / success / failed / retrying |
| http_status_code | integer | |
| response_body | text | first 1KB |
| error_message | text | |
| attempt_number | integer | default 1 |
| max_attempts | integer | default 5 |
| next_retry_at | timestamp | |
| created_at | timestamp | |
| delivered_at | timestamp | |

### Event Flow

```
emitEvent() → store in PostgreSQL → capture to PostHog
                                  → find matching webhook endpoints
                                  → create webhook_deliveries rows
                                  → add jobs to webhookDeliveryQueue

Worker picks up job → HMAC sign → POST to URL → update delivery status
```

Webhook trigger is failure-tolerant: if queuing fails, the event still succeeds.

### Pattern Matching

Simple in-memory glob matching after fetching active endpoints for the org:

- `content.*` matches `content.page.published`, `content.page.created`
- `ai.*` matches `ai.completion`, `ai.chat_message`
- Exact match: `form.submitted` matches only `form.submitted`

### Retry Strategy

BullMQ exponential backoff:
- Attempt 1: immediate
- Attempt 2: 1 min
- Attempt 3: 2 min
- Attempt 4: 4 min
- Attempt 5: 8 min

After 5 failed attempts: mark delivery as `failed`, increment endpoint `failure_count`.

### oRPC Router

`apps/web/src/integrations/orpc/router/webhooks.ts`:

- `create` — create endpoint with URL + event patterns
- `list` — list org's endpoints (signing secrets masked)
- `getById` — endpoint details
- `update` — modify URL, patterns, active status
- `remove` — delete endpoint
- `deliveries` — paginated delivery log for an endpoint

---

## Implementation Order

1. Create `@packages/redis` — extract from auth, update all consumers
2. Create `@packages/queue` — queue definitions + connection factory
3. Create `apps/worker` — entry point, scheduler, graceful shutdown
4. Add webhook database schema + repository
5. Add webhook delivery job processor in worker
6. Integrate webhook triggers into `emitEvent()`
7. Add webhook management oRPC router
8. Typecheck + verify
