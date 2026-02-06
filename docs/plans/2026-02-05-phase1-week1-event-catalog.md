# Phase 1 Week 1: Event Catalog & Storage - Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the event catalog foundation with TypeScript types, PostgreSQL schema, and event emission infrastructure.

**Architecture:** Event-driven system with dual-write pattern (PostgreSQL for billing + PostHog for analytics). Events stored with pricing metadata, materialized views for fast billing queries.

**Tech Stack:** Drizzle ORM, PostgreSQL, PostHog, Zod, TypeScript

---

## Task 1: Event Catalog Constants & Types

**Files:**
- Create: `packages/events/package.json`
- Create: `packages/events/src/catalog.ts`
- Create: `packages/events/src/types/content-analytics.ts`
- Create: `packages/events/src/types/ai-usage.ts`
- Create: `packages/events/src/types/forms.ts`
- Create: `packages/events/src/types/seo.ts`
- Create: `packages/events/tsconfig.json`

**Step 1: Create events package structure**

```bash
mkdir -p packages/events/src/types
```

**Step 2: Create package.json**

```json
{
  "name": "@packages/events",
  "type": "module",
  "private": true,
  "exports": {
    ".": {
      "default": "./src/index.ts",
      "types": "./dist/src/index.d.ts"
    },
    "./catalog": {
      "default": "./src/catalog.ts",
      "types": "./dist/src/catalog.d.ts"
    },
    "./emit": {
      "default": "./src/emit.ts",
      "types": "./dist/src/emit.d.ts"
    },
    "./types/*": {
      "default": "./src/types/*.ts",
      "types": "./dist/src/types/*.d.ts"
    }
  },
  "files": ["dist"],
  "scripts": {
    "build": "tsc --build",
    "typecheck": "tsc"
  },
  "dependencies": {
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "@packages/typescript": "workspace:*",
    "typescript": "5.9.3"
  }
}
```

**Step 3: Create tsconfig.json**

```json
{
  "extends": "@packages/typescript/base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"]
}
```

**Step 4: Create event catalog constants**

File: `packages/events/src/catalog.ts`

```typescript
/**
 * Event Catalog
 *
 * Defines all billable events in the system with their categories.
 * Event pricing is stored in the database for runtime flexibility.
 */

export const EVENT_CATEGORIES = {
  CONTENT: 'content',
  AI: 'ai',
  FORM: 'form',
  SEO: 'seo',
  EXPERIMENT: 'experiment',
  WEBHOOK: 'webhook',
  SYSTEM: 'system',
} as const;

export type EventCategory = typeof EVENT_CATEGORIES[keyof typeof EVENT_CATEGORIES];

/**
 * All event names in the system
 */
export const EVENTS = {
  // Content Analytics
  CONTENT_PAGE_VIEW: 'content.page.view',
  CONTENT_PAGE_PUBLISHED: 'content.page.published',
  CONTENT_PAGE_UPDATED: 'content.page.updated',
  CONTENT_CREATED: 'content.created',
  CONTENT_DELETED: 'content.deleted',
  CONTENT_SCROLL_MILESTONE: 'content.scroll.milestone',
  CONTENT_TIME_SPENT: 'content.time.spent',
  CONTENT_CTA_CLICK: 'content.cta.click',
  CONTENT_EXPORTED: 'content.exported',

  // AI Usage
  AI_COMPLETION: 'ai.completion',
  AI_CHAT_MESSAGE: 'ai.chat_message',
  AI_AGENT_ACTION: 'ai.agent_action',

  // Forms
  FORM_IMPRESSION: 'form.impression',
  FORM_SUBMITTED: 'form.submitted',
  FORM_FIELD_ERROR: 'form.field_error',
  FORM_CONVERSION: 'form.conversion',

  // SEO
  SEO_ANALYZED: 'seo.analyzed',
  SEO_INDEXED: 'seo.indexed',

  // Experiments
  EXPERIMENT_STARTED: 'experiment.started',
  EXPERIMENT_CONVERSION: 'experiment.conversion',

  // Automation
  AUTOMATION_TRIGGERED: 'automation.triggered',
} as const;

export type EventName = typeof EVENTS[keyof typeof EVENTS];

/**
 * Get event category from event name
 */
export function getEventCategory(eventName: EventName): EventCategory {
  const category = eventName.split('.')[0];
  return category as EventCategory;
}

/**
 * Check if event name is valid
 */
export function isValidEventName(eventName: string): eventName is EventName {
  return Object.values(EVENTS).includes(eventName as EventName);
}
```

**Step 5: Create content analytics event types**

File: `packages/events/src/types/content-analytics.ts`

```typescript
import { z } from 'zod';

/**
 * Content Analytics Event Schemas
 */

export const pageViewEventSchema = z.object({
  contentId: z.string().uuid(),
  contentSlug: z.string(),
  visitorId: z.string(),
  sessionId: z.string(),
  referrer: z.string().optional(),
  referrerDomain: z.string().optional(),
  trafficSource: z.enum(['organic', 'direct', 'referral', 'social', 'paid', 'email']).optional(),
  deviceType: z.enum(['desktop', 'tablet', 'mobile']).optional(),
  url: z.string(),
  utmSource: z.string().optional(),
  utmMedium: z.string().optional(),
  utmCampaign: z.string().optional(),
});

export type PageViewEvent = z.infer<typeof pageViewEventSchema>;

export const contentPublishedEventSchema = z.object({
  contentId: z.string().uuid(),
  title: z.string(),
  slug: z.string(),
  agentId: z.string().uuid().optional(),
});

export type ContentPublishedEvent = z.infer<typeof contentPublishedEventSchema>;

export const contentUpdatedEventSchema = z.object({
  contentId: z.string().uuid(),
  changes: z.array(z.string()),
});

export type ContentUpdatedEvent = z.infer<typeof contentUpdatedEventSchema>;

export const scrollMilestoneEventSchema = z.object({
  contentId: z.string().uuid(),
  visitorId: z.string(),
  sessionId: z.string(),
  scrollDepth: z.enum([25, 50, 75, 100]),
  timeToScrollMs: z.number(),
});

export type ScrollMilestoneEvent = z.infer<typeof scrollMilestoneEventSchema>;

export const timeSpentEventSchema = z.object({
  contentId: z.string().uuid(),
  visitorId: z.string(),
  sessionId: z.string(),
  totalTimeMs: z.number(),
  activeTimeMs: z.number(),
  maxScrollDepth: z.number(),
});

export type TimeSpentEvent = z.infer<typeof timeSpentEventSchema>;

export const ctaClickEventSchema = z.object({
  contentId: z.string().uuid(),
  visitorId: z.string(),
  sessionId: z.string(),
  ctaId: z.string().optional(),
  ctaText: z.string(),
  ctaUrl: z.string(),
  timeOnPageMs: z.number(),
});

export type CtaClickEvent = z.infer<typeof ctaClickEventSchema>;
```

**Step 6: Create AI usage event types**

File: `packages/events/src/types/ai-usage.ts`

```typescript
import { z } from 'zod';

export const aiCompletionEventSchema = z.object({
  agentId: z.string().uuid().optional(),
  contentId: z.string().uuid().optional(),
  model: z.string(),
  promptTokens: z.number(),
  completionTokens: z.number(),
  latencyMs: z.number(),
});

export type AiCompletionEvent = z.infer<typeof aiCompletionEventSchema>;

export const aiChatMessageEventSchema = z.object({
  chatId: z.string().uuid(),
  agentId: z.string().uuid().optional(),
  contentId: z.string().uuid().optional(),
  model: z.string(),
  promptTokens: z.number(),
  completionTokens: z.number(),
  latencyMs: z.number(),
});

export type AiChatMessageEvent = z.infer<typeof aiChatMessageEventSchema>;

export const aiAgentActionEventSchema = z.object({
  agentId: z.string().uuid(),
  contentId: z.string().uuid().optional(),
  actionType: z.string(),
  model: z.string(),
  promptTokens: z.number(),
  completionTokens: z.number(),
  latencyMs: z.number(),
});

export type AiAgentActionEvent = z.infer<typeof aiAgentActionEventSchema>;
```

**Step 7: Create form event types**

File: `packages/events/src/types/forms.ts`

```typescript
import { z } from 'zod';

export const formImpressionEventSchema = z.object({
  formId: z.string().uuid(),
  visitorId: z.string(),
  sessionId: z.string(),
  url: z.string(),
});

export type FormImpressionEvent = z.infer<typeof formImpressionEventSchema>;

export const formSubmittedEventSchema = z.object({
  formId: z.string().uuid(),
  submissionId: z.string().uuid(),
  visitorId: z.string(),
  sessionId: z.string(),
  fieldCount: z.number(),
});

export type FormSubmittedEvent = z.infer<typeof formSubmittedEventSchema>;

export const formFieldErrorEventSchema = z.object({
  formId: z.string().uuid(),
  visitorId: z.string(),
  sessionId: z.string(),
  fieldName: z.string(),
  errorType: z.string(),
});

export type FormFieldErrorEvent = z.infer<typeof formFieldErrorEventSchema>;
```

**Step 8: Create SEO event types**

File: `packages/events/src/types/seo.ts`

```typescript
import { z } from 'zod';

export const seoAnalyzedEventSchema = z.object({
  contentId: z.string().uuid(),
  score: z.number().min(0).max(100),
  recommendations: z.number(),
});

export type SeoAnalyzedEvent = z.infer<typeof seoAnalyzedEventSchema>;

export const seoIndexedEventSchema = z.object({
  contentId: z.string().uuid(),
  searchEngine: z.string(),
  indexed: z.boolean(),
});

export type SeoIndexedEvent = z.infer<typeof seoIndexedEventSchema>;
```

**Step 9: Create index file**

File: `packages/events/src/index.ts`

```typescript
export * from './catalog';
export * from './types/content-analytics';
export * from './types/ai-usage';
export * from './types/forms';
export * from './types/seo';
```

**Step 10: Commit**

```bash
git add packages/events
git commit -m "feat(events): add event catalog with TypeScript types

- Add event categories and constants
- Add Zod schemas for all event types
- Support content, AI, form, and SEO events"
```

---

## Task 2: Database Event Schema

**Files:**
- Create: `packages/database/src/schemas/events.ts`
- Create: `packages/database/src/schemas/event-catalog.ts`
- Create: `packages/database/src/schemas/event-views.ts`
- Modify: `packages/database/src/schema.ts`

**Step 1: Create events table schema**

File: `packages/database/src/schemas/events.ts`

```typescript
import { pgTable, uuid, text, jsonb, boolean, decimal, timestamp, index } from 'drizzle-orm/pg-core';
import { organization } from './organization';
import { user } from './user';

/**
 * Events table - stores all events for 30 days
 *
 * After 30 days, events are archived to S3/MinIO and deleted from PostgreSQL.
 * Events remain in PostHog indefinitely for analytics.
 */
export const events = pgTable('events', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').notNull()
    .references(() => organization.id, { onDelete: 'cascade' }),

  // Event identification
  eventName: text('event_name').notNull(),
  eventCategory: text('event_category').notNull(),

  // Event data
  properties: jsonb('properties').$type<Record<string, any>>().notNull(),

  // Attribution
  userId: uuid('user_id')
    .references(() => user.id, { onDelete: 'set null' }),

  // Billing
  isBillable: boolean('is_billable').default(true).notNull(),
  pricePerEvent: decimal('price_per_event', { precision: 10, scale: 6 }),

  // Metadata
  timestamp: timestamp('timestamp').defaultNow().notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),

  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  // Optimize for billing queries
  orgTimeIdx: index('events_org_time_idx').on(table.organizationId, table.timestamp),
  eventNameIdx: index('events_name_idx').on(table.eventName),
  categoryIdx: index('events_category_idx').on(table.eventCategory),
  timestampIdx: index('events_timestamp_idx').on(table.timestamp),
}));

export type Event = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;
```

**Step 2: Create event catalog table**

File: `packages/database/src/schemas/event-catalog.ts`

```typescript
import { pgTable, uuid, text, decimal, integer, boolean, timestamp } from 'drizzle-orm/pg-core';

/**
 * Event Catalog table - stores event metadata and pricing
 *
 * This table defines available events, their pricing, and free tier limits.
 * Pricing is stored here for runtime flexibility (no code changes needed).
 */
export const eventCatalog = pgTable('event_catalog', {
  id: uuid('id').primaryKey().defaultRandom(),

  // Event identification
  eventName: text('event_name').unique().notNull(),
  category: text('category').notNull(),

  // Pricing
  pricePerEvent: decimal('price_per_event', { precision: 10, scale: 6 }).notNull(),
  freeTierLimit: integer('free_tier_limit').default(0).notNull(),

  // Metadata
  displayName: text('display_name').notNull(),
  description: text('description'),

  // Status
  isBillable: boolean('is_billable').default(true).notNull(),
  isActive: boolean('is_active').default(true).notNull(),

  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
    .$onUpdate(() => new Date()),
});

export type EventCatalogEntry = typeof eventCatalog.$inferSelect;
export type NewEventCatalogEntry = typeof eventCatalog.$inferInsert;
```

**Step 3: Create materialized views**

File: `packages/database/src/schemas/event-views.ts`

```typescript
import { pgMaterializedView } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { events } from './events';

/**
 * Daily usage aggregation by event
 *
 * Pre-computed daily totals for billing charts.
 * Refresh: Every hour via BullMQ job
 */
export const dailyUsageByEvent = pgMaterializedView('daily_usage_by_event').as((qb) =>
  qb
    .select({
      organizationId: events.organizationId,
      eventName: events.eventName,
      eventCategory: events.eventCategory,
      date: sql<string>`DATE(${events.timestamp})`.as('date'),
      eventCount: sql<number>`COUNT(*)`.as('event_count'),
      totalCost: sql<string>`COALESCE(SUM(${events.pricePerEvent}), 0)`.as('total_cost'),
    })
    .from(events)
    .where(sql`${events.isBillable} = true`)
    .groupBy(
      events.organizationId,
      events.eventName,
      events.eventCategory,
      sql`DATE(${events.timestamp})`
    )
);

/**
 * Current month usage by event
 *
 * Used for billing dashboard product cards.
 * Refresh: Every hour via BullMQ job
 */
export const currentMonthUsageByEvent = pgMaterializedView('current_month_usage_by_event').as((qb) =>
  qb
    .select({
      organizationId: events.organizationId,
      eventName: events.eventName,
      eventCategory: events.eventCategory,
      eventCount: sql<number>`COUNT(*)`.as('event_count'),
      monthToDateCost: sql<string>`COALESCE(SUM(${events.pricePerEvent}), 0)`.as('month_to_date_cost'),
    })
    .from(events)
    .where(sql`${events.timestamp} >= DATE_TRUNC('month', CURRENT_DATE) AND ${events.isBillable} = true`)
    .groupBy(
      events.organizationId,
      events.eventName,
      events.eventCategory
    )
);

/**
 * Current month usage by category
 *
 * Used for billing overview (Content Analytics, AI Usage, Forms, etc.).
 * Includes projected cost based on current usage rate.
 * Refresh: Every hour via BullMQ job
 */
export const currentMonthUsageByCategory = pgMaterializedView('current_month_usage_by_category').as((qb) =>
  qb
    .select({
      organizationId: events.organizationId,
      eventCategory: events.eventCategory,
      eventCount: sql<number>`COUNT(*)`.as('event_count'),
      monthToDateCost: sql<string>`COALESCE(SUM(${events.pricePerEvent}), 0)`.as('month_to_date_cost'),
      projectedCost: sql<string>`
        CASE
          WHEN EXTRACT(DAY FROM CURRENT_DATE) > 0 THEN
            (COALESCE(SUM(${events.pricePerEvent}), 0) / EXTRACT(DAY FROM CURRENT_DATE)) *
            EXTRACT(DAY FROM DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day')
          ELSE 0
        END
      `.as('projected_cost'),
    })
    .from(events)
    .where(sql`${events.timestamp} >= DATE_TRUNC('month', CURRENT_DATE) AND ${events.isBillable} = true`)
    .groupBy(
      events.organizationId,
      events.eventCategory
    )
);

/**
 * Type-safe query results
 */
export type DailyUsageByEvent = typeof dailyUsageByEvent.$inferSelect;
export type CurrentMonthUsageByEvent = typeof currentMonthUsageByEvent.$inferSelect;
export type CurrentMonthUsageByCategory = typeof currentMonthUsageByCategory.$inferSelect;
```

**Step 4: Update schema index**

File: `packages/database/src/schema.ts`

Add exports:

```typescript
// Existing exports...

// Events
export * from './schemas/events';
export * from './schemas/event-catalog';
export * from './schemas/event-views';
```

**Step 5: Generate migration**

```bash
cd packages/database
bun run drizzle-kit generate
```

Expected: New migration file created in `drizzle/` directory

**Step 6: Run migration**

```bash
bun run db:push
```

Expected: Tables and materialized views created in PostgreSQL

**Step 7: Commit**

```bash
git add packages/database
git commit -m "feat(database): add event storage schema

- Add events table with 30-day retention
- Add event_catalog for pricing metadata
- Add materialized views for billing queries
- Add indexes for performance"
```

---

## Task 3: Event Catalog Seed Data

**Files:**
- Create: `packages/database/src/seed/event-catalog-seed.ts`
- Create: `packages/database/scripts/seed-event-catalog.ts`

**Step 1: Create seed data**

File: `packages/database/src/seed/event-catalog-seed.ts`

```typescript
import { EVENTS, EVENT_CATEGORIES } from '@packages/events/catalog';
import type { NewEventCatalogEntry } from '../schemas/event-catalog';

/**
 * Event catalog seed data
 *
 * Defines pricing and free tier limits for all events.
 * Run: bun run packages/database/scripts/seed-event-catalog.ts
 */
export const eventCatalogSeedData: NewEventCatalogEntry[] = [
  // Content Analytics
  {
    eventName: EVENTS.CONTENT_PAGE_VIEW,
    category: EVENT_CATEGORIES.CONTENT,
    pricePerEvent: '0.00002',
    freeTierLimit: 50000,
    displayName: 'Page View',
    description: 'Blog post page view tracked via SDK',
    isBillable: true,
    isActive: true,
  },
  {
    eventName: EVENTS.CONTENT_PAGE_PUBLISHED,
    category: EVENT_CATEGORIES.CONTENT,
    pricePerEvent: '0.001',
    freeTierLimit: 0,
    displayName: 'Content Published',
    description: 'Content published to live',
    isBillable: true,
    isActive: true,
  },
  {
    eventName: EVENTS.CONTENT_PAGE_UPDATED,
    category: EVENT_CATEGORIES.CONTENT,
    pricePerEvent: '0.0005',
    freeTierLimit: 0,
    displayName: 'Content Updated',
    description: 'Published content updated',
    isBillable: true,
    isActive: true,
  },
  {
    eventName: EVENTS.CONTENT_CREATED,
    category: EVENT_CATEGORIES.CONTENT,
    pricePerEvent: '0',
    freeTierLimit: 0,
    displayName: 'Content Created',
    description: 'New content created (not billable)',
    isBillable: false,
    isActive: true,
  },
  {
    eventName: EVENTS.CONTENT_DELETED,
    category: EVENT_CATEGORIES.CONTENT,
    pricePerEvent: '0',
    freeTierLimit: 0,
    displayName: 'Content Deleted',
    description: 'Content deleted (not billable)',
    isBillable: false,
    isActive: true,
  },
  {
    eventName: EVENTS.CONTENT_SCROLL_MILESTONE,
    category: EVENT_CATEGORIES.CONTENT,
    pricePerEvent: '0',
    freeTierLimit: 0,
    displayName: 'Scroll Milestone',
    description: 'User scrolled to 25/50/75/100% (not billable)',
    isBillable: false,
    isActive: true,
  },
  {
    eventName: EVENTS.CONTENT_TIME_SPENT,
    category: EVENT_CATEGORIES.CONTENT,
    pricePerEvent: '0',
    freeTierLimit: 0,
    displayName: 'Time Spent',
    description: 'Time spent on page (not billable)',
    isBillable: false,
    isActive: true,
  },
  {
    eventName: EVENTS.CONTENT_CTA_CLICK,
    category: EVENT_CATEGORIES.CONTENT,
    pricePerEvent: '0',
    freeTierLimit: 0,
    displayName: 'CTA Click',
    description: 'Call-to-action clicked (not billable)',
    isBillable: false,
    isActive: true,
  },
  {
    eventName: EVENTS.CONTENT_EXPORTED,
    category: EVENT_CATEGORIES.CONTENT,
    pricePerEvent: '0.001',
    freeTierLimit: 0,
    displayName: 'Content Exported',
    description: 'Content exported to external platform',
    isBillable: true,
    isActive: true,
  },

  // AI Usage
  {
    eventName: EVENTS.AI_COMPLETION,
    category: EVENT_CATEGORIES.AI,
    pricePerEvent: '0.001',
    freeTierLimit: 100,
    displayName: 'AI Completion (FIM)',
    description: 'Fill-in-the-middle completion generated',
    isBillable: true,
    isActive: true,
  },
  {
    eventName: EVENTS.AI_CHAT_MESSAGE,
    category: EVENT_CATEGORIES.AI,
    pricePerEvent: '0.002',
    freeTierLimit: 100,
    displayName: 'AI Chat Message',
    description: 'Chat assistant message generated',
    isBillable: true,
    isActive: true,
  },
  {
    eventName: EVENTS.AI_AGENT_ACTION,
    category: EVENT_CATEGORIES.AI,
    pricePerEvent: '0.005',
    freeTierLimit: 100,
    displayName: 'AI Agent Action',
    description: 'Mastra agent action executed',
    isBillable: true,
    isActive: true,
  },

  // Forms
  {
    eventName: EVENTS.FORM_IMPRESSION,
    category: EVENT_CATEGORIES.FORM,
    pricePerEvent: '0',
    freeTierLimit: 0,
    displayName: 'Form Impression',
    description: 'Form became visible (not billable)',
    isBillable: false,
    isActive: true,
  },
  {
    eventName: EVENTS.FORM_SUBMITTED,
    category: EVENT_CATEGORIES.FORM,
    pricePerEvent: '0.002',
    freeTierLimit: 1000,
    displayName: 'Form Submitted',
    description: 'Form successfully submitted',
    isBillable: true,
    isActive: true,
  },
  {
    eventName: EVENTS.FORM_FIELD_ERROR,
    category: EVENT_CATEGORIES.FORM,
    pricePerEvent: '0.0001',
    freeTierLimit: 0,
    displayName: 'Form Field Error',
    description: 'Form validation error occurred',
    isBillable: true,
    isActive: true,
  },
  {
    eventName: EVENTS.FORM_CONVERSION,
    category: EVENT_CATEGORIES.FORM,
    pricePerEvent: '0.0001',
    freeTierLimit: 0,
    displayName: 'Form Conversion',
    description: 'Form submission converted to goal',
    isBillable: true,
    isActive: true,
  },

  // SEO
  {
    eventName: EVENTS.SEO_ANALYZED,
    category: EVENT_CATEGORIES.SEO,
    pricePerEvent: '0.001',
    freeTierLimit: 0,
    displayName: 'SEO Analysis',
    description: 'SEO analysis performed on content',
    isBillable: true,
    isActive: true,
  },
  {
    eventName: EVENTS.SEO_INDEXED,
    category: EVENT_CATEGORIES.SEO,
    pricePerEvent: '0.0001',
    freeTierLimit: 0,
    displayName: 'SEO Indexed',
    description: 'Content indexed by search engine',
    isBillable: true,
    isActive: true,
  },

  // Experiments
  {
    eventName: EVENTS.EXPERIMENT_STARTED,
    category: EVENT_CATEGORIES.EXPERIMENT,
    pricePerEvent: '0.001',
    freeTierLimit: 0,
    displayName: 'Experiment Started',
    description: 'A/B test experiment started',
    isBillable: true,
    isActive: true,
  },
  {
    eventName: EVENTS.EXPERIMENT_CONVERSION,
    category: EVENT_CATEGORIES.EXPERIMENT,
    pricePerEvent: '0.0001',
    freeTierLimit: 0,
    displayName: 'Experiment Conversion',
    description: 'A/B test variant conversion',
    isBillable: true,
    isActive: true,
  },

  // Automation
  {
    eventName: EVENTS.AUTOMATION_TRIGGERED,
    category: EVENT_CATEGORIES.SYSTEM,
    pricePerEvent: '0.0005',
    freeTierLimit: 0,
    displayName: 'Automation Triggered',
    description: 'Workflow automation executed',
    isBillable: true,
    isActive: true,
  },
];
```

**Step 2: Create seed script**

File: `packages/database/scripts/seed-event-catalog.ts`

```typescript
import { db } from '../src/client';
import { eventCatalog } from '../src/schemas/event-catalog';
import { eventCatalogSeedData } from '../src/seed/event-catalog-seed';

async function seedEventCatalog() {
  console.log('Seeding event catalog...');

  try {
    // Clear existing catalog
    await db.delete(eventCatalog);

    // Insert seed data
    const inserted = await db.insert(eventCatalog)
      .values(eventCatalogSeedData)
      .returning();

    console.log(`✓ Seeded ${inserted.length} event catalog entries`);

    // Show summary
    const billable = inserted.filter(e => e.isBillable);
    const totalFreeTierValue = billable.reduce((sum, e) => {
      return sum + (e.freeTierLimit * parseFloat(e.pricePerEvent));
    }, 0);

    console.log(`  - ${billable.length} billable events`);
    console.log(`  - Free tier value: $${totalFreeTierValue.toFixed(2)}/month`);
  } catch (error) {
    console.error('Error seeding event catalog:', error);
    throw error;
  } finally {
    process.exit(0);
  }
}

seedEventCatalog();
```

**Step 3: Add seed script to package.json**

File: `packages/database/package.json`

Add to scripts:

```json
{
  "scripts": {
    "seed:events": "bun run scripts/seed-event-catalog.ts"
  }
}
```

**Step 4: Run seed script**

```bash
cd packages/database
bun run seed:events
```

Expected output:
```
Seeding event catalog...
✓ Seeded 20 event catalog entries
  - 12 billable events
  - Free tier value: $X.XX/month
```

**Step 5: Verify in database**

```bash
bun run db:studio
```

Check: `event_catalog` table has 20 rows

**Step 6: Commit**

```bash
git add packages/database
git commit -m "feat(database): add event catalog seed data

- Seed pricing for all 20 event types
- Set free tier limits (50K page views, 100 AI ops, 1K forms)
- Mark non-billable events (scroll, time, impressions)"
```

---

## Task 4: Event Emission Infrastructure

**Files:**
- Create: `packages/events/src/emit.ts`
- Create: `packages/events/src/utils.ts`
- Modify: `packages/events/package.json` (add dependencies)

**Step 1: Add dependencies to events package**

File: `packages/events/package.json`

```json
{
  "dependencies": {
    "zod": "^3.23.8",
    "@packages/database": "workspace:*",
    "@packages/posthog": "workspace:*"
  }
}
```

**Step 2: Create utility functions**

File: `packages/events/src/utils.ts`

```typescript
import { db } from '@packages/database/client';
import { eventCatalog } from '@packages/database/schemas/event-catalog';
import { eq } from 'drizzle-orm';
import type { EventName } from './catalog';

/**
 * Get event pricing from catalog
 */
export async function getEventPrice(eventName: EventName): Promise<string> {
  const [catalogEntry] = await db
    .select({ pricePerEvent: eventCatalog.pricePerEvent })
    .from(eventCatalog)
    .where(eq(eventCatalog.eventName, eventName))
    .limit(1);

  if (!catalogEntry) {
    console.warn(`Event not found in catalog: ${eventName}, defaulting to $0`);
    return '0';
  }

  return catalogEntry.pricePerEvent;
}

/**
 * Get event metadata from catalog
 */
export async function getEventMetadata(eventName: EventName) {
  const [catalogEntry] = await db
    .select()
    .from(eventCatalog)
    .where(eq(eventCatalog.eventName, eventName))
    .limit(1);

  return catalogEntry || null;
}
```

**Step 3: Create event emitter**

File: `packages/events/src/emit.ts`

```typescript
import { db } from '@packages/database/client';
import { events } from '@packages/database/schemas/events';
import { posthog } from '@packages/posthog/server';
import { getEventPrice } from './utils';
import type { EventName, EventCategory } from './catalog';

export interface EmitEventParams {
  organizationId: string;
  eventName: EventName;
  eventCategory: EventCategory;
  properties: Record<string, any>;
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Central event emitter
 *
 * Emits events to:
 * 1. PostgreSQL (for billing/audit)
 * 2. PostHog (for analytics)
 * 3. Webhook queue (Phase 1 Week 3)
 *
 * @example
 * await emitEvent({
 *   organizationId: '...',
 *   eventName: EVENTS.CONTENT_PAGE_VIEW,
 *   eventCategory: EVENT_CATEGORIES.CONTENT,
 *   properties: { contentId: '...', slug: '...' },
 *   userId: '...',
 * });
 */
export async function emitEvent(params: EmitEventParams): Promise<void> {
  const {
    organizationId,
    eventName,
    eventCategory,
    properties,
    userId,
    ipAddress,
    userAgent,
  } = params;

  try {
    // Get pricing from catalog
    const pricePerEvent = await getEventPrice(eventName);

    // 1. Store in PostgreSQL
    const [storedEvent] = await db.insert(events).values({
      organizationId,
      eventName,
      eventCategory,
      properties,
      userId,
      isBillable: true,
      pricePerEvent,
      ipAddress,
      userAgent,
    }).returning();

    console.log(`[Events] Emitted ${eventName} for org ${organizationId}`);

    // 2. Send to PostHog for analytics
    posthog.capture({
      distinctId: userId || organizationId,
      event: eventName,
      properties: {
        ...properties,
        $groups: {
          organization: organizationId,
        },
      },
      groups: {
        organization: organizationId,
      },
    });

    // 3. TODO (Week 3): Trigger webhooks
    // await triggerWebhooks(storedEvent);

  } catch (error) {
    console.error(`[Events] Failed to emit ${eventName}:`, error);
    // Don't throw - events should not block main flow
  }
}

/**
 * Batch emit multiple events
 *
 * More efficient than individual emits for SDK ingestion.
 */
export async function emitEventBatch(
  organizationId: string,
  userId: string | undefined,
  eventBatch: Array<{
    eventName: EventName;
    eventCategory: EventCategory;
    properties: Record<string, any>;
  }>
): Promise<void> {
  try {
    // Get all prices in one query (optimization for Week 5)
    const prices = new Map<EventName, string>();

    for (const event of eventBatch) {
      if (!prices.has(event.eventName)) {
        prices.set(event.eventName, await getEventPrice(event.eventName));
      }
    }

    // Insert all events at once
    const eventsToInsert = eventBatch.map(event => ({
      organizationId,
      eventName: event.eventName,
      eventCategory: event.eventCategory,
      properties: event.properties,
      userId,
      isBillable: true,
      pricePerEvent: prices.get(event.eventName)!,
    }));

    await db.insert(events).values(eventsToInsert);

    // Send to PostHog (batch)
    posthog.capture(eventBatch.map(event => ({
      distinctId: userId || organizationId,
      event: event.eventName,
      properties: {
        ...event.properties,
        $groups: {
          organization: organizationId,
        },
      },
      groups: {
        organization: organizationId,
      },
    })));

    console.log(`[Events] Batch emitted ${eventBatch.length} events for org ${organizationId}`);

  } catch (error) {
    console.error('[Events] Failed to emit batch:', error);
  }
}
```

**Step 4: Update events package index**

File: `packages/events/src/index.ts`

```typescript
export * from './catalog';
export * from './emit';
export * from './utils';
export * from './types/content-analytics';
export * from './types/ai-usage';
export * from './types/forms';
export * from './types/seo';
```

**Step 5: Test event emission manually**

Create test file: `packages/events/test-emit.ts`

```typescript
import { emitEvent } from './src/emit';
import { EVENTS, EVENT_CATEGORIES } from './src/catalog';

async function test() {
  await emitEvent({
    organizationId: 'test-org-id',
    eventName: EVENTS.CONTENT_PAGE_VIEW,
    eventCategory: EVENT_CATEGORIES.CONTENT,
    properties: {
      contentId: 'test-content-id',
      slug: 'test-slug',
      visitorId: 'test-visitor',
      sessionId: 'test-session',
    },
    userId: 'test-user-id',
  });

  console.log('✓ Event emitted successfully');
  process.exit(0);
}

test();
```

**Step 6: Run test**

```bash
cd packages/events
bun run test-emit.ts
```

Expected output:
```
[Events] Emitted content.page.view for org test-org-id
✓ Event emitted successfully
```

**Step 7: Verify in database**

```bash
cd packages/database
bun run db:studio
```

Check: `events` table has 1 row with test data

**Step 8: Clean up test**

```bash
rm packages/events/test-emit.ts
```

**Step 9: Commit**

```bash
git add packages/events
git commit -m "feat(events): add event emission infrastructure

- Implement emitEvent() with dual-write pattern
- Store events in PostgreSQL for billing
- Send events to PostHog for analytics
- Add batch emission for SDK optimization"
```

---

## Task 5: BullMQ Refresh Job for Materialized Views

**Files:**
- Create: `packages/queue/src/jobs/refresh-usage-views.ts`
- Modify: `packages/queue/src/index.ts`
- Modify: `apps/worker/src/index.ts`

**Step 1: Create refresh job**

File: `packages/queue/src/jobs/refresh-usage-views.ts`

```typescript
import { db } from '@packages/database/client';
import { sql } from 'drizzle-orm';

/**
 * Refresh materialized views for billing queries
 *
 * Runs every hour to update:
 * - daily_usage_by_event
 * - current_month_usage_by_event
 * - current_month_usage_by_category
 *
 * Uses CONCURRENTLY to avoid blocking reads.
 */
export async function refreshUsageViews(): Promise<void> {
  const startTime = Date.now();

  try {
    console.log('[RefreshViews] Starting materialized view refresh...');

    // Refresh all views concurrently (non-blocking)
    await Promise.all([
      db.execute(sql`REFRESH MATERIALIZED VIEW CONCURRENTLY daily_usage_by_event`),
      db.execute(sql`REFRESH MATERIALIZED VIEW CONCURRENTLY current_month_usage_by_event`),
      db.execute(sql`REFRESH MATERIALIZED VIEW CONCURRENTLY current_month_usage_by_category`),
    ]);

    const duration = Date.now() - startTime;
    console.log(`[RefreshViews] ✓ Completed in ${duration}ms`);

  } catch (error) {
    console.error('[RefreshViews] Failed to refresh views:', error);
    throw error;
  }
}
```

**Step 2: Export job from queue package**

File: `packages/queue/src/index.ts`

Add export:

```typescript
export * from './jobs/refresh-usage-views';
```

**Step 3: Add cron schedule to worker**

File: `apps/worker/src/index.ts`

Find the worker setup and add:

```typescript
import { Queue, Worker } from 'bullmq';
import { refreshUsageViews } from '@packages/queue';

// ... existing queues ...

// Create refresh queue
export const refreshQueue = new Queue('refresh-views', {
  connection: redis,
});

// Schedule hourly refresh (cron: every hour at :00)
await refreshQueue.add(
  'refresh',
  {},
  {
    repeat: {
      pattern: '0 * * * *', // Every hour
    },
  }
);

// Create worker for refresh queue
const refreshWorker = new Worker(
  'refresh-views',
  async (job) => {
    await refreshUsageViews();
  },
  {
    connection: redis,
  }
);

refreshWorker.on('completed', (job) => {
  console.log(`[Worker] Refresh job ${job.id} completed`);
});

refreshWorker.on('failed', (job, err) => {
  console.error(`[Worker] Refresh job ${job?.id} failed:`, err);
});
```

**Step 4: Test refresh job manually**

Create test script: `packages/database/scripts/test-refresh-views.ts`

```typescript
import { refreshUsageViews } from '@packages/queue';

async function test() {
  console.log('Testing materialized view refresh...');
  await refreshUsageViews();
  console.log('✓ Refresh completed');
  process.exit(0);
}

test();
```

**Step 5: Run test**

```bash
cd packages/database
bun run scripts/test-refresh-views.ts
```

Expected output:
```
Testing materialized view refresh...
[RefreshViews] Starting materialized view refresh...
[RefreshViews] ✓ Completed in 150ms
✓ Refresh completed
```

**Step 6: Verify views have data**

```bash
bun run db:studio
```

Check materialized views exist (may be empty if no events yet)

**Step 7: Clean up test**

```bash
rm packages/database/scripts/test-refresh-views.ts
```

**Step 8: Commit**

```bash
git add packages/queue apps/worker
git commit -m "feat(queue): add materialized view refresh job

- Refresh billing views every hour
- Use CONCURRENTLY to avoid blocking reads
- Schedule via BullMQ cron pattern"
```

---

## Week 1 Checklist

- [x] Event catalog with TypeScript types
- [x] PostgreSQL event storage schema
- [x] Event catalog metadata table with pricing
- [x] Materialized views for billing queries
- [x] Event catalog seed data (20 event types)
- [x] Event emission infrastructure (dual-write)
- [x] BullMQ refresh job for views

**Week 1 Complete!**

Continue to [Phase 1 Week 2: Migrate Existing Operations](./2026-02-05-phase1-week2-migration.md)
