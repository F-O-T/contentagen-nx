# Phase 2 Week 4-5: SDK v2 Enhancement - Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Enhance SDK with client-side event tracker, server-side SDK client, event ingestion API, and forms SDK integration.

**Architecture:** SDK batches events client-side and sends to SDK server API. Server validates API key, emits events to system. Forms can be embedded via SDK with automatic event tracking.

**Tech Stack:** TypeScript, Elysia (SDK server), Fetch API, localStorage

**Duration:** 2 weeks

---

## Week 4: Client & Server SDK Event Tracking

### Task 1: Client-Side Event Tracker

**Files:**
- Create: `libraries/sdk/src/events/client.ts`
- Create: `libraries/sdk/src/events/types.ts`
- Modify: `libraries/sdk/src/index.ts`

**Step 1: Create event types**

File: `libraries/sdk/src/events/types.ts`

```typescript
export interface ContenttaSdkConfig {
  apiKey: string;
  apiUrl?: string;
  organizationId: string;

  // Event tracking config
  enableAnalytics?: boolean;
  batchSize?: number;        // Default: 10
  flushInterval?: number;    // Default: 30000ms (30s)
  debug?: boolean;
}

export interface TrackedEvent {
  eventName: string;
  properties: Record<string, any>;
  timestamp: number;
}

export interface EventBatch {
  events: TrackedEvent[];
}
```

**Step 2: Create client tracker**

File: `libraries/sdk/src/events/client.ts`

```typescript
import type { ContenttaSdkConfig, TrackedEvent } from './types';

export class ContenttaEventTracker {
  private config: ContenttaSdkConfig;
  private eventQueue: TrackedEvent[] = [];
  private flushTimer: NodeJS.Timeout | null = null;

  constructor(config: ContenttaSdkConfig) {
    this.config = {
      batchSize: 10,
      flushInterval: 30000,
      enableAnalytics: true,
      apiUrl: 'https://sdk.contentta.com',
      ...config,
    };

    if (this.config.enableAnalytics) {
      this.startAutoFlush();
      this.setupUnloadHandler();
    }
  }

  /**
   * Track custom event
   */
  track(eventName: string, properties: Record<string, any> = {}): void {
    if (!this.config.enableAnalytics) return;

    const event: TrackedEvent = {
      eventName,
      properties: {
        ...properties,
        timestamp: Date.now(),
        url: typeof window !== 'undefined' ? window.location.href : undefined,
        referrer: typeof document !== 'undefined' ? document.referrer : undefined,
      },
      timestamp: Date.now(),
    };

    this.eventQueue.push(event);

    if (this.config.debug) {
      console.log('[Contentta] Tracked event:', event);
    }

    if (this.eventQueue.length >= (this.config.batchSize || 10)) {
      this.flush();
    }
  }

  /**
   * Flush events to server
   */
  async flush(): Promise<void> {
    if (this.eventQueue.length === 0) return;

    const events = [...this.eventQueue];
    this.eventQueue = [];

    try {
      const response = await fetch(`${this.config.apiUrl}/sdk/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.config.apiKey,
        },
        body: JSON.stringify({ events }),
      });

      if (!response.ok) {
        throw new Error(`Failed to send events: ${response.statusText}`);
      }

      if (this.config.debug) {
        console.log(`[Contentta] Flushed ${events.length} events`);
      }
    } catch (error) {
      console.error('[Contentta] Failed to flush events:', error);
      // Put events back in queue to retry
      this.eventQueue.unshift(...events);
    }
  }

  /**
   * Start auto-flush timer
   */
  private startAutoFlush(): void {
    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.config.flushInterval || 30000);
  }

  /**
   * Setup page unload handler
   */
  private setupUnloadHandler(): void {
    if (typeof window === 'undefined') return;

    window.addEventListener('beforeunload', () => {
      // Use synchronous beacon API for unload
      if (this.eventQueue.length > 0) {
        const events = [...this.eventQueue];
        this.eventQueue = [];

        navigator.sendBeacon(
          `${this.config.apiUrl}/sdk/events`,
          JSON.stringify({ events })
        );
      }
    });
  }

  /**
   * Auto-track page views
   */
  autoTrackPageViews(contentId: string, contentSlug: string): void {
    this.track('content.page.view', {
      contentId,
      contentSlug,
      visitorId: this.getVisitorId(),
      sessionId: this.getSessionId(),
    });

    this.setupScrollTracking(contentId);
    this.setupTimeTracking(contentId);
    this.setupCtaTracking(contentId);
  }

  /**
   * Setup scroll tracking
   */
  private setupScrollTracking(contentId: string): void {
    if (typeof window === 'undefined') return;

    const milestones = [25, 50, 75, 100];
    const reached = new Set<number>();
    const startTime = Date.now();

    const handleScroll = () => {
      const scrolled = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;

      for (const milestone of milestones) {
        if (scrolled >= milestone && !reached.has(milestone)) {
          reached.add(milestone);

          this.track('content.scroll.milestone', {
            contentId,
            visitorId: this.getVisitorId(),
            sessionId: this.getSessionId(),
            scrollDepth: milestone,
            timeToScrollMs: Date.now() - startTime,
          });
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
  }

  /**
   * Setup time tracking
   */
  private setupTimeTracking(contentId: string): void {
    if (typeof window === 'undefined') return;

    const startTime = Date.now();
    let activeTime = 0;
    let lastActiveTime = Date.now();
    let isActive = true;
    let maxScrollDepth = 0;

    // Track active time
    const updateActiveTime = () => {
      if (isActive) {
        activeTime += Date.now() - lastActiveTime;
      }
      lastActiveTime = Date.now();
    };

    window.addEventListener('blur', () => {
      updateActiveTime();
      isActive = false;
    });

    window.addEventListener('focus', () => {
      isActive = true;
      lastActiveTime = Date.now();
    });

    window.addEventListener('scroll', () => {
      const scrolled = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
      maxScrollDepth = Math.max(maxScrollDepth, scrolled);
    });

    // Send on unload
    window.addEventListener('beforeunload', () => {
      updateActiveTime();

      this.track('content.time.spent', {
        contentId,
        visitorId: this.getVisitorId(),
        sessionId: this.getSessionId(),
        totalTimeMs: Date.now() - startTime,
        activeTimeMs: activeTime,
        maxScrollDepth,
      });
    });
  }

  /**
   * Setup CTA tracking
   */
  private setupCtaTracking(contentId: string): void {
    if (typeof document === 'undefined') return;

    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a[data-cta]');

      if (link) {
        this.track('content.cta.click', {
          contentId,
          visitorId: this.getVisitorId(),
          sessionId: this.getSessionId(),
          ctaId: link.getAttribute('data-cta-id'),
          ctaText: link.textContent,
          ctaUrl: (link as HTMLAnchorElement).href,
          timeOnPageMs: Date.now() - performance.timing.navigationStart,
        });
      }
    });
  }

  /**
   * Get or create visitor ID
   */
  private getVisitorId(): string {
    if (typeof localStorage === 'undefined') return 'unknown';

    let visitorId = localStorage.getItem('contentta_visitor_id');

    if (!visitorId) {
      visitorId = `visitor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('contentta_visitor_id', visitorId);
    }

    return visitorId;
  }

  /**
   * Get or create session ID
   */
  private getSessionId(): string {
    if (typeof sessionStorage === 'undefined') return 'unknown';

    let sessionId = sessionStorage.getItem('contentta_session_id');

    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('contentta_session_id', sessionId);
    }

    return sessionId;
  }

  /**
   * Destroy tracker
   */
  destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    this.flush();
  }
}
```

**Step 3: Export from SDK**

File: `libraries/sdk/src/index.ts`

```typescript
export * from './events/client';
export * from './events/types';
```

**Step 4: Update package.json**

File: `libraries/sdk/package.json`

```json
{
  "name": "@f-o-t/contentta-sdk",
  "version": "2.0.0",
  "exports": {
    ".": {
      "default": "./src/index.ts"
    },
    "./analytics": {
      "default": "./src/analytics.ts"
    },
    "./events": {
      "default": "./src/events/client.ts"
    }
  }
}
```

**Step 5: Test client tracker**

Create: `libraries/sdk/test-client.html`

```html
<!DOCTYPE html>
<html>
<head>
  <title>SDK Test</title>
</head>
<body>
  <h1>Test Content</h1>
  <p>Scroll down to test tracking...</p>
  <div style="height: 3000px">
    <a href="#" data-cta data-cta-id="test-cta">Click Me</a>
  </div>

  <script type="module">
    import { ContenttaEventTracker } from './src/events/client.ts';

    const tracker = new ContenttaEventTracker({
      apiKey: 'test-key',
      apiUrl: 'http://localhost:3000',
      organizationId: 'test-org',
      debug: true,
    });

    tracker.autoTrackPageViews('test-content-id', 'test-slug');
  </script>
</body>
</html>
```

**Step 6: Commit**

```bash
git add libraries/sdk
git commit -m "feat(sdk): add client-side event tracker

- Batch events for efficiency
- Auto-track page views, scroll, time, CTAs
- Use localStorage for visitor ID
- Use sessionStorage for session ID"
```

---

### Task 2: Server-Side SDK Client

**Files:**
- Create: `libraries/sdk/src/events/server.ts`

**Step 1: Create server client**

File: `libraries/sdk/src/events/server.ts`

```typescript
import type { ContenttaSdkConfig } from './types';

export class ContenttaServerClient {
  private apiKey: string;
  private apiUrl: string;

  constructor(config: Pick<ContenttaSdkConfig, 'apiKey' | 'apiUrl'>) {
    this.apiKey = config.apiKey;
    this.apiUrl = config.apiUrl || 'https://sdk.contentta.com';
  }

  /**
   * Emit single event
   */
  async emitEvent(eventName: string, properties: Record<string, any> = {}): Promise<void> {
    try {
      const response = await fetch(`${this.apiUrl}/sdk/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.apiKey,
        },
        body: JSON.stringify({
          events: [{
            eventName,
            properties,
            timestamp: Date.now(),
          }],
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to emit event: ${response.statusText}`);
      }
    } catch (error) {
      console.error('[Contentta] Failed to emit event:', error);
      throw error;
    }
  }

  /**
   * Track form submission
   */
  async trackFormSubmission(formId: string, data: Record<string, any>): Promise<void> {
    return this.emitEvent('form.submitted', {
      formId,
      formData: data,
      fieldCount: Object.keys(data).length,
    });
  }

  /**
   * Track conversion
   */
  async trackConversion(conversionType: string, value?: number): Promise<void> {
    return this.emitEvent('experiment.conversion', {
      conversionType,
      value,
    });
  }

  /**
   * Track SEO analysis
   */
  async trackSeoAnalysis(contentId: string, score: number, recommendations: number): Promise<void> {
    return this.emitEvent('seo.analyzed', {
      contentId,
      score,
      recommendations,
    });
  }
}
```

**Step 2: Export from SDK**

File: `libraries/sdk/src/index.ts`

```typescript
export * from './events/server';
```

**Step 3: Test server client**

Create: `libraries/sdk/test-server.ts`

```typescript
import { ContenttaServerClient } from './src/events/server';

async function test() {
  const client = new ContenttaServerClient({
    apiKey: 'test-key',
    apiUrl: 'http://localhost:3000',
  });

  await client.emitEvent('form.submitted', {
    formId: 'test-form',
    formData: { email: 'test@example.com' },
  });

  console.log('✓ Event emitted');
}

test();
```

**Step 4: Commit**

```bash
git add libraries/sdk
git commit -m "feat(sdk): add server-side SDK client

- Emit events from backend
- Track forms, conversions, SEO"
```

---

### Task 3: Update SDK Server Event Ingestion

**Files:**
- Modify: `apps/sdk-server/src/routes/sdk-events.ts` (created in Week 2)
- Improve authentication and validation

**Step 1: Enhance event ingestion endpoint**

File: `apps/sdk-server/src/routes/sdk-events.ts`

```typescript
import { Elysia, t } from 'elysia';
import { emitEventBatch, getEventCategory, isValidEventName } from '@packages/events';
import { db } from '../integrations/database';
import { apiKeys } from '@packages/database/schemas';
import { eq } from 'drizzle-orm';

async function validateApiKey(apiKey: string | null) {
  if (!apiKey) return null;

  const [key] = await db.select()
    .from(apiKeys)
    .where(eq(apiKeys.key, apiKey))
    .limit(1);

  if (!key || !key.isActive) {
    return null;
  }

  return {
    organizationId: key.organizationId,
    userId: key.userId,
  };
}

export const sdkEventsRoute = new Elysia({ prefix: '/sdk' })
  .post('/events', async ({ body, request, set }) => {
    // Validate API key
    const apiKey = request.headers.get('x-api-key');
    const session = await validateApiKey(apiKey);

    if (!session) {
      set.status = 401;
      return { error: 'Unauthorized', message: 'Invalid API key' };
    }

    const { events } = body as {
      events: Array<{
        eventName: string;
        properties: Record<string, any>;
        timestamp?: number;
      }>;
    };

    // Validate events
    const validEvents = events.filter(e => isValidEventName(e.eventName));

    if (validEvents.length === 0) {
      set.status = 400;
      return { error: 'Bad Request', message: 'No valid events provided' };
    }

    // Emit events in batch
    await emitEventBatch(
      session.organizationId,
      session.userId,
      validEvents.map(e => ({
        eventName: e.eventName as any,
        eventCategory: getEventCategory(e.eventName as any),
        properties: e.properties,
      }))
    );

    return {
      success: true,
      eventsProcessed: validEvents.length,
      eventsRejected: events.length - validEvents.length,
    };
  }, {
    body: t.Object({
      events: t.Array(t.Object({
        eventName: t.String(),
        properties: t.Record(t.String(), t.Any()),
        timestamp: t.Optional(t.Number()),
      })),
    }),
  });
```

**Step 2: Test event ingestion**

```bash
curl -X POST http://localhost:3000/sdk/events \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_API_KEY" \
  -d '{
    "events": [
      {
        "eventName": "content.page.view",
        "properties": {
          "contentId": "test",
          "slug": "test"
        }
      }
    ]
  }'
```

Expected: `{ "success": true, "eventsProcessed": 1, "eventsRejected": 0 }`

**Step 3: Commit**

```bash
git add apps/sdk-server
git commit -m "feat(sdk-server): enhance event ingestion

- Validate API keys from database
- Filter invalid event names
- Return detailed response"
```

---

## Week 5: Forms SDK Integration

### Task 4: Forms Database Schema

**Files:**
- Create: `packages/database/src/schemas/forms.ts`
- Modify: `packages/database/src/schema.ts`

**Step 1: Create forms tables**

File: `packages/database/src/schemas/forms.ts`

```typescript
import { pgTable, uuid, text, jsonb, boolean, timestamp, index } from 'drizzle-orm/pg-core';
import { organization } from './organization';

export const forms = pgTable('forms', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').notNull()
    .references(() => organization.id, { onDelete: 'cascade' }),

  // Form config
  name: text('name').notNull(),
  description: text('description'),

  // Form fields definition
  fields: jsonb('fields').$type<Array<{
    id: string;
    type: 'text' | 'email' | 'textarea' | 'checkbox' | 'select';
    label: string;
    placeholder?: string;
    required: boolean;
    options?: string[]; // For select fields
  }>>().notNull(),

  // Settings
  settings: jsonb('settings').$type<{
    successMessage?: string;
    redirectUrl?: string;
    sendEmailNotification?: boolean;
    emailRecipients?: string[];
  }>().default({}).notNull(),

  // Status
  isActive: boolean('is_active').default(true).notNull(),

  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
    .$onUpdate(() => new Date()),
}, (table) => ({
  orgIdx: index('forms_org_idx').on(table.organizationId),
}));

export const formSubmissions = pgTable('form_submissions', {
  id: uuid('id').primaryKey().defaultRandom(),
  formId: uuid('form_id').notNull()
    .references(() => forms.id, { onDelete: 'cascade' }),
  organizationId: uuid('organization_id').notNull()
    .references(() => organization.id, { onDelete: 'cascade' }),

  // Submission data
  data: jsonb('data').$type<Record<string, any>>().notNull(),

  // Metadata
  metadata: jsonb('metadata').$type<{
    ipAddress?: string;
    userAgent?: string;
    referrer?: string;
    visitorId?: string;
    sessionId?: string;
  }>(),

  // Timestamp
  submittedAt: timestamp('submitted_at').defaultNow().notNull(),
}, (table) => ({
  formIdx: index('form_submissions_form_idx').on(table.formId),
  orgIdx: index('form_submissions_org_idx').on(table.organizationId),
}));

export type Form = typeof forms.$inferSelect;
export type NewForm = typeof forms.$inferInsert;
export type FormSubmission = typeof formSubmissions.$inferSelect;
export type NewFormSubmission = typeof formSubmissions.$inferInsert;
```

**Step 2: Generate and run migration**

```bash
cd packages/database
bun run drizzle-kit generate
bun run db:push
```

**Step 3: Commit**

```bash
git add packages/database
git commit -m "feat(database): add forms schema

- Add forms table for form definitions
- Add form_submissions for submission data
- Support field types and settings"
```

---

### Task 5: Forms SDK Client

**Files:**
- Create: `libraries/sdk/src/forms.ts`

**Step 1: Create forms client**

File: `libraries/sdk/src/forms.ts`

```typescript
import type { ContenttaEventTracker } from './events/client';
import type { ContenttaSdkConfig } from './events/types';

export class ContenttaFormsClient {
  private config: ContenttaSdkConfig;
  private tracker: ContenttaEventTracker;

  constructor(config: ContenttaSdkConfig, tracker: ContenttaEventTracker) {
    this.config = config;
    this.tracker = tracker;
  }

  /**
   * Embed form on page
   */
  async embedForm(formId: string, containerId: string): Promise<void> {
    const container = document.getElementById(containerId);

    if (!container) {
      console.error(`Container #${containerId} not found`);
      return;
    }

    try {
      // Fetch form definition
      const response = await fetch(`${this.config.apiUrl}/sdk/forms/${formId}`, {
        headers: {
          'X-API-Key': this.config.apiKey,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch form');
      }

      const form = await response.json();

      // Render form
      container.innerHTML = this.renderForm(form);

      // Track impression
      this.tracker.track('form.impression', {
        formId,
        visitorId: this.tracker['getVisitorId'](),
        sessionId: this.tracker['getSessionId'](),
        url: window.location.href,
      });

      // Setup submission handler
      this.setupFormHandler(formId, container);

    } catch (error) {
      console.error('Failed to embed form:', error);
      container.innerHTML = '<p>Failed to load form</p>';
    }
  }

  /**
   * Render form HTML
   */
  private renderForm(form: any): string {
    return `
      <form id="contentta-form-${form.id}" class="contentta-form">
        <h3>${form.name}</h3>
        ${form.description ? `<p>${form.description}</p>` : ''}

        ${form.fields.map((field: any) => this.renderField(field)).join('')}

        <button type="submit">Submit</button>
      </form>

      <style>
        .contentta-form {
          max-width: 500px;
          margin: 0 auto;
          padding: 20px;
        }
        .contentta-field {
          margin-bottom: 15px;
        }
        .contentta-field label {
          display: block;
          margin-bottom: 5px;
          font-weight: 500;
        }
        .contentta-field input,
        .contentta-field textarea,
        .contentta-field select {
          width: 100%;
          padding: 8px;
          border: 1px solid #ccc;
          border-radius: 4px;
        }
        .contentta-field-error {
          color: red;
          font-size: 12px;
          margin-top: 5px;
        }
        .contentta-form button {
          background: #0070f3;
          color: white;
          padding: 10px 20px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }
        .contentta-form-success {
          padding: 15px;
          background: #d4edda;
          border: 1px solid #c3e6cb;
          border-radius: 4px;
          color: #155724;
        }
      </style>
    `;
  }

  /**
   * Render form field
   */
  private renderField(field: any): string {
    const required = field.required ? 'required' : '';

    let input = '';

    switch (field.type) {
      case 'textarea':
        input = `<textarea name="${field.id}" placeholder="${field.placeholder || ''}" ${required}></textarea>`;
        break;
      case 'select':
        input = `
          <select name="${field.id}" ${required}>
            <option value="">Select...</option>
            ${field.options?.map((opt: string) => `<option value="${opt}">${opt}</option>`).join('')}
          </select>
        `;
        break;
      case 'checkbox':
        input = `<input type="checkbox" name="${field.id}" ${required} />`;
        break;
      default:
        input = `<input type="${field.type}" name="${field.id}" placeholder="${field.placeholder || ''}" ${required} />`;
    }

    return `
      <div class="contentta-field">
        <label for="${field.id}">${field.label}${field.required ? ' *' : ''}</label>
        ${input}
        <div class="contentta-field-error" id="error-${field.id}"></div>
      </div>
    `;
  }

  /**
   * Setup form submission handler
   */
  private setupFormHandler(formId: string, container: HTMLElement): void {
    const form = container.querySelector('form');

    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const formData = new FormData(form);
      const data = Object.fromEntries(formData.entries());

      try {
        // Submit to API
        const response = await fetch(`${this.config.apiUrl}/sdk/forms/${formId}/submit`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': this.config.apiKey,
          },
          body: JSON.stringify({
            data,
            metadata: {
              visitorId: this.tracker['getVisitorId'](),
              sessionId: this.tracker['getSessionId'](),
              referrer: document.referrer,
              url: window.location.href,
            },
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          this.showErrors(form, error.errors || {});
          return;
        }

        // Track submission
        this.tracker.track('form.submitted', {
          formId,
          fieldCount: Object.keys(data).length,
        });

        // Show success
        this.showSuccess(container, 'Thank you for your submission!');

      } catch (error) {
        console.error('Form submission failed:', error);
        alert('Failed to submit form. Please try again.');
      }
    });
  }

  /**
   * Show validation errors
   */
  private showErrors(form: HTMLFormElement, errors: Record<string, string>): void {
    // Clear previous errors
    form.querySelectorAll('.contentta-field-error').forEach(el => {
      el.textContent = '';
    });

    // Show new errors
    Object.entries(errors).forEach(([fieldId, message]) => {
      const errorEl = form.querySelector(`#error-${fieldId}`);
      if (errorEl) {
        errorEl.textContent = message;

        // Track field error
        this.tracker.track('form.field_error', {
          formId: form.id,
          fieldName: fieldId,
          errorType: 'validation',
        });
      }
    });
  }

  /**
   * Show success message
   */
  private showSuccess(container: HTMLElement, message: string): void {
    container.innerHTML = `
      <div class="contentta-form-success">
        ${message}
      </div>
    `;
  }
}
```

**Step 2: Export from SDK**

File: `libraries/sdk/src/index.ts`

```typescript
export * from './forms';
```

**Step 3: Test forms client**

Create: `libraries/sdk/test-forms.html`

```html
<!DOCTYPE html>
<html>
<head>
  <title>Forms Test</title>
</head>
<body>
  <h1>Test Form Embedding</h1>
  <div id="form-container"></div>

  <script type="module">
    import { ContenttaEventTracker } from './src/events/client.ts';
    import { ContenttaFormsClient } from './src/forms.ts';

    const tracker = new ContenttaEventTracker({
      apiKey: 'test-key',
      apiUrl: 'http://localhost:3000',
      organizationId: 'test-org',
      debug: true,
    });

    const forms = new ContenttaFormsClient(
      { apiKey: 'test-key', apiUrl: 'http://localhost:3000', organizationId: 'test-org' },
      tracker
    );

    forms.embedForm('test-form-id', 'form-container');
  </script>
</body>
</html>
```

**Step 4: Commit**

```bash
git add libraries/sdk
git commit -m "feat(sdk): add forms client

- Embed forms on any page
- Auto-track impressions and submissions
- Handle validation errors
- Show success messages"
```

---

### Task 6: SDK Server Forms API

**Files:**
- Create: `apps/sdk-server/src/routes/sdk-forms.ts`
- Modify: `apps/sdk-server/src/index.ts`

**Step 1: Create forms API routes**

File: `apps/sdk-server/src/routes/sdk-forms.ts`

```typescript
import { Elysia, t } from 'elysia';
import { db } from '../integrations/database';
import { forms, formSubmissions } from '@packages/database/schemas/forms';
import { eq, and } from 'drizzle-orm';
import { emitEvent, EVENTS, EVENT_CATEGORIES } from '@packages/events';

async function validateApiKey(apiKey: string | null) {
  // Same as sdk-events route
  // ... (reuse from Task 3)
}

export const sdkFormsRoute = new Elysia({ prefix: '/sdk/forms' })
  // Get form definition
  .get('/:formId', async ({ params, request, set }) => {
    const apiKey = request.headers.get('x-api-key');
    const session = await validateApiKey(apiKey);

    if (!session) {
      set.status = 401;
      return { error: 'Unauthorized' };
    }

    const [form] = await db.select()
      .from(forms)
      .where(
        and(
          eq(forms.id, params.formId),
          eq(forms.organizationId, session.organizationId),
          eq(forms.isActive, true)
        )
      )
      .limit(1);

    if (!form) {
      set.status = 404;
      return { error: 'Form not found' };
    }

    return form;
  })

  // Submit form
  .post('/:formId/submit', async ({ params, body, request, set }) => {
    const apiKey = request.headers.get('x-api-key');
    const session = await validateApiKey(apiKey);

    if (!session) {
      set.status = 401;
      return { error: 'Unauthorized' };
    }

    const { data, metadata } = body as {
      data: Record<string, any>;
      metadata?: Record<string, any>;
    };

    // Get form
    const [form] = await db.select()
      .from(forms)
      .where(
        and(
          eq(forms.id, params.formId),
          eq(forms.organizationId, session.organizationId),
          eq(forms.isActive, true)
        )
      )
      .limit(1);

    if (!form) {
      set.status = 404;
      return { error: 'Form not found' };
    }

    // Validate submission
    const errors: Record<string, string> = {};

    for (const field of form.fields) {
      if (field.required && !data[field.id]) {
        errors[field.id] = `${field.label} is required`;
      }

      // Email validation
      if (field.type === 'email' && data[field.id]) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(data[field.id])) {
          errors[field.id] = 'Invalid email address';
        }
      }
    }

    if (Object.keys(errors).length > 0) {
      set.status = 400;
      return { error: 'Validation failed', errors };
    }

    // Store submission
    const [submission] = await db.insert(formSubmissions)
      .values({
        formId: params.formId,
        organizationId: session.organizationId,
        data,
        metadata,
      })
      .returning();

    // Emit event
    await emitEvent({
      organizationId: session.organizationId,
      eventName: EVENTS.FORM_SUBMITTED,
      eventCategory: EVENT_CATEGORIES.FORM,
      properties: {
        formId: params.formId,
        submissionId: submission.id,
        visitorId: metadata?.visitorId,
        sessionId: metadata?.sessionId,
        fieldCount: Object.keys(data).length,
      },
      userId: session.userId,
    });

    return {
      success: true,
      submissionId: submission.id,
      message: form.settings?.successMessage || 'Thank you for your submission!',
      redirectUrl: form.settings?.redirectUrl,
    };
  }, {
    body: t.Object({
      data: t.Record(t.String(), t.Any()),
      metadata: t.Optional(t.Record(t.String(), t.Any())),
    }),
  });
```

**Step 2: Mount forms route**

File: `apps/sdk-server/src/index.ts`

```typescript
import { sdkFormsRoute } from './routes/sdk-forms';

app.use(sdkFormsRoute);
```

**Step 3: Test forms API**

```bash
# Get form
curl http://localhost:3000/sdk/forms/test-form-id \
  -H "X-API-Key: YOUR_KEY"

# Submit form
curl -X POST http://localhost:3000/sdk/forms/test-form-id/submit \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_KEY" \
  -d '{"data": {"email": "test@example.com"}, "metadata": {}}'
```

**Step 4: Commit**

```bash
git add apps/sdk-server
git commit -m "feat(sdk-server): add forms API

- Get form definition endpoint
- Submit form endpoint with validation
- Emit form.submitted events
- Return success message and redirect"
```

---

## Week 4-5 Checklist

### Week 4
- [x] Client-side event tracker with batching
- [x] Auto-track page views, scroll, time, CTAs
- [x] Server-side SDK client
- [x] Enhanced event ingestion API

### Week 5
- [x] Forms database schema
- [x] Forms SDK client
- [x] Forms API routes
- [x] End-to-end forms flow

**Phase 2 Weeks 4-5 Complete!**

Continue to [Phase 2 Week 6: MCP Server](./2026-02-05-phase2-week6-mcp.md)
