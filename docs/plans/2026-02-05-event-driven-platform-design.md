# Contentta Event-Driven Platform - Design Document

**Date:** 2026-02-05
**Status:** Approved
**Duration:** 10 weeks (3 phases)

---

## Executive Summary

Transform Contentta from a traditional SaaS CMS into an event-driven, analytics-first platform modeled after PostHog. The system will feature:

1. **Event-based pricing** - Usage-based billing per event (page views, AI operations, forms, etc.)
2. **Analytics-first platform** - Deep insights into content performance via PostHog integration
3. **Developer-focused APIs** - SDK for content delivery, MCP server for AI tool integration
4. **Blog-focused CMS** - Optimized for blog content creation and delivery

---

## Core Architecture

### Event-Driven Flow

```
┌─────────────────────────────────────────────────────────┐
│                    EVENT SOURCES                         │
│  • Content operations (create, update, publish)          │
│  • AI operations (completions, chat, agents)             │
│  • SDK events (page views, scroll, CTAs)                 │
│  • Form submissions                                      │
│  • SEO analysis                                          │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│                 EVENT EMISSION LAYER                     │
│  • emitEvent() - Central event emitter                   │
│  • Event validation & pricing lookup                     │
└─────────────┬───────────────────────────────────────────┘
              │
              ├─────────────────┬─────────────────┐
              ▼                 ▼                 ▼
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│   PostgreSQL     │  │     PostHog      │  │  Webhook Queue   │
│  (Billing/Audit) │  │   (Analytics)    │  │    (BullMQ)      │
│   30-day retention│  │ Unlimited retention│ │  Async delivery  │
└──────────────────┘  └──────────────────┘  └──────────────────┘
       │                                              │
       ▼                                              ▼
┌──────────────────┐                       ┌──────────────────┐
│ Materialized     │                       │  Customer        │
│ Views (Billing)  │                       │  Webhooks        │
│ Refresh hourly   │                       │  (Retry/Signing) │
└──────────────────┘                       └──────────────────┘
```

### System Boundaries

**Internal (Dashboard Users):**
- Web App (TanStack Start + oRPC)
- For Contentta users managing their CMS

**External (API Consumers):**
- SDK Server (Elysia + MCP)
- For customers fetching content, tracking events
- For AI tools writing to Contentta via MCP

---

## Phase 1: Event System (3 weeks)

### Week 1: Event Catalog & Storage

**Deliverables:**
- Event catalog with TypeScript types
- PostgreSQL event storage schema
- Event catalog metadata table
- Event emission infrastructure

**Event Categories:**
- `content.*` - Content analytics (page.view, page.published, etc.)
- `ai.*` - AI usage (completion, chat_message, agent_action)
- `form.*` - Form interactions (submitted, field_error, impression)
- `seo.*` - SEO operations (analyzed, indexed)
- `experiment.*` - A/B testing (started, conversion)

**Database Schema:**

```typescript
// Event storage
events {
  id: uuid
  organization_id: uuid
  event_name: text
  event_category: text
  properties: jsonb
  user_id: uuid
  is_billable: boolean
  price_per_event: decimal
  timestamp: timestamp
}

// Event definitions
event_catalog {
  id: uuid
  event_name: text (unique)
  category: text
  price_per_event: decimal
  free_tier_limit: integer
  description: text
  is_billable: boolean
  is_active: boolean
}
```

**Materialized Views:**

```typescript
// Daily aggregations
daily_usage_by_event {
  organization_id
  event_name
  event_category
  date
  event_count
  total_cost
}

// Current month usage
current_month_usage_by_event {
  organization_id
  event_name
  event_category
  event_count
  month_to_date_cost
}

// Category totals with projections
current_month_usage_by_category {
  organization_id
  event_category
  event_count
  month_to_date_cost
  projected_cost
}
```

**Event Emission API:**

```typescript
// packages/events/src/emit.ts
export async function emitEvent(event: {
  organizationId: string;
  eventName: string;
  eventCategory: string;
  properties: Record<string, any>;
  userId?: string;
}) {
  // 1. Store in PostgreSQL
  // 2. Send to PostHog
  // 3. Trigger webhooks
}
```

### Week 2: Migrate Existing Operations

**Deliverables:**
- All content operations emit events
- All AI operations emit events
- SDK analytics emit to PostgreSQL (not just PostHog)
- Remove old subscription plan code

**Operations to Migrate:**

1. **Content Operations (oRPC routers):**
   - `content.create` → emit `content.created`
   - `content.update` → emit `content.updated`
   - `content.delete` → emit `content.deleted`
   - `content.publish` → emit `content.published`

2. **AI Operations:**
   - FIM completion → emit `ai.completion`
   - Chat message → emit `ai.chat_message`
   - Agent action → emit `ai.agent_action`

3. **SDK Analytics:**
   - Page view (client) → SDK API → emit `content.page.view`
   - Scroll milestone → emit `content.scroll.milestone`
   - Time spent → emit `content.time.spent`
   - CTA click → emit `content.cta.click`

4. **Remove Old Code:**
   - Delete FREE/LITE/PRO plan constants
   - Remove plan-based limits from Stripe integration
   - Remove seat-based pricing logic

### Week 3: Webhook System

**Deliverables:**
- Webhook endpoint management (CRUD)
- Pattern-based event subscriptions
- BullMQ webhook delivery queue
- Retry logic with exponential backoff
- HMAC webhook signing
- Delivery logs and monitoring

**Database Schema:**

```typescript
webhook_endpoints {
  id: uuid
  organization_id: uuid
  url: text
  description: text
  event_patterns: jsonb  // ['content.*', 'ai.completion']
  filters: jsonb         // Optional property filters
  signing_secret: text
  is_active: boolean
  failure_count: integer
  last_success_at: timestamp
  last_failure_at: timestamp
}

webhook_deliveries {
  id: uuid
  webhook_endpoint_id: uuid
  event_id: uuid
  url: text
  event_name: text
  payload: jsonb
  status: text  // pending, success, failed, retrying
  http_status_code: integer
  response_body: text
  error_message: text
  attempt_number: integer
  max_attempts: integer (default: 5)
  next_retry_at: timestamp
  delivered_at: timestamp
}
```

**Webhook Delivery Flow:**

1. Event emitted → check matching webhooks
2. Create delivery record (status: pending)
3. Queue delivery job in BullMQ
4. Attempt delivery with HMAC signature
5. On failure: retry with exponential backoff (2^attempt minutes)
6. After 5 failures: mark as failed, increment endpoint failure count
7. Auto-disable endpoint after 10 consecutive failures

**BullMQ Job:**

```typescript
// packages/queue/src/jobs/webhook-delivery.ts
export async function deliverWebhook(job: WebhookDeliveryJob) {
  // Generate HMAC signature
  // POST to customer endpoint with headers:
  //   X-Contentta-Signature: t=timestamp,v1=signature
  //   X-Contentta-Event: event_name
  //   X-Contentta-Delivery-Id: delivery_id
  // Handle retry logic
}
```

**Refresh Job:**

```typescript
// packages/queue/src/jobs/refresh-usage-views.ts
// Cron: 0 * * * * (every hour)
export async function refreshUsageViews() {
  await db.execute(sql`REFRESH MATERIALIZED VIEW CONCURRENTLY daily_usage_by_event`);
  await db.execute(sql`REFRESH MATERIALIZED VIEW CONCURRENTLY current_month_usage_by_event`);
  await db.execute(sql`REFRESH MATERIALIZED VIEW CONCURRENTLY current_month_usage_by_category`);
}
```

---

## Phase 2: SDK Enhancement (3 weeks)

### Week 4-5: SDK v2

**Deliverables:**
- Client-side event tracker with batching
- Server-side SDK event API
- Event ingestion endpoint in SDK server
- Forms SDK integration (basic)

**SDK Client (Enhanced):**

```typescript
// libraries/sdk/src/events/client.ts
export class ContenttaEventTracker {
  private eventQueue: Event[] = [];

  track(eventName: string, properties: any) {
    this.eventQueue.push({ eventName, properties, timestamp: Date.now() });
    if (this.eventQueue.length >= batchSize) this.flush();
  }

  async flush() {
    await fetch(`${apiUrl}/sdk/events`, {
      method: 'POST',
      headers: { 'X-API-Key': apiKey },
      body: JSON.stringify({ events: this.eventQueue }),
    });
    this.eventQueue = [];
  }

  autoTrackPageViews(contentId: string) {
    this.track('content.page.view', { contentId });
    this.setupScrollTracking(contentId);
    this.setupTimeTracking(contentId);
    this.setupCtaTracking(contentId);
  }
}
```

**SDK Server Event Ingestion:**

```typescript
// apps/sdk-server/src/routes/sdk-events.ts
export const sdkEventsRoute = new Elysia({ prefix: '/sdk' })
  .post('/events', async ({ body, request }) => {
    const apiKey = request.headers.get('X-API-Key');
    const session = await validateApiKey(apiKey);

    const { events } = body as { events: Event[] };

    for (const event of events) {
      await emitEvent({
        organizationId: session.organizationId,
        eventName: event.eventName,
        eventCategory: event.eventName.split('.')[0],
        properties: event.properties,
        userId: session.userId,
      });
    }

    return { success: true, eventsProcessed: events.length };
  });
```

### Week 6: MCP Server

**Deliverables:**
- MCP server integrated into SDK server
- Content creation/update/publish tools
- Brand/Agent context tools
- MCP authentication via API keys

**MCP Tools:**

```typescript
// apps/sdk-server/src/mcp/tools.ts

// Available tools:
- create_content: Create new blog post
- update_content: Update existing post
- publish_content: Publish draft
- list_content: List all posts
- get_brand_guidelines: Get brand context
- get_agent: Get agent configuration

// All tools:
- Use database repositories directly (not oRPC)
- Emit events for billing
- Validate organization ownership
```

**MCP Authentication:**

```typescript
// API Key in environment or config
// apps/sdk-server validates API key from headers
// MCP server uses SSE transport over HTTP
```

---

## Phase 3: Platform Features (4 weeks)

### Week 7-8: Billing & Analytics UI (PostHog-style)

**Deliverables:**
- Billing page with Overview/Usage/Spend tabs
- Product cards (Content Analytics, AI Usage, Forms, SEO)
- Usage progress bars and projections
- Billing limit warnings
- Custom dashboard system

**Billing Page Structure:**

```typescript
// apps/web/src/routes/$slug/_dashboard/billing.tsx

<Tabs value={tab}>
  <TabsList>
    <TabsTrigger value="overview">Overview</TabsTrigger>
    <TabsTrigger value="usage">Usage</TabsTrigger>
    <TabsTrigger value="spend">Spend</TabsTrigger>
  </TabsList>

  <TabsContent value="overview">
    <BillingOverview>
      <CurrentBillTotal amount={totalCost} />
      <BillingPeriod start={periodStart} end={periodEnd} />
      <PlatformAddons />
    </BillingOverview>
  </TabsContent>

  <TabsContent value="usage">
    <ProductsList>
      <ProductCard
        name="Content Analytics"
        description="Track page views, engagement, scroll depth"
        currentUsage={576000}
        freeLimit={1000000}
        monthToDate={12.50}
        projected={25.00}
      />

      <ProductCard
        name="AI Usage"
        icon={<SparklesIcon />}
        expandable
      >
        <SubProduct name="Completions (FIM)" current={78} limit={100} />
        <SubProduct name="Chat Messages" current={45} limit={100} />
        <SubProduct name="Agent Actions" current={12} limit={100} />
      </ProductCard>

      <ProductCard name="Forms & Conversions" />
      <ProductCard name="SEO & Optimization" />
    </ProductsList>
  </TabsContent>
</Tabs>
```

**oRPC Endpoints:**

```typescript
// packages/api/src/server/routers/billing.ts
export const billingRouter = router({
  getCurrentUsage: protectedProcedure
    .query(async ({ ctx }) => {
      // Query current_month_usage_by_category materialized view
      return usageByCategory;
    }),

  getProductUsage: protectedProcedure
    .input(z.object({ category: z.string() }))
    .query(async ({ ctx, input }) => {
      // Query current_month_usage_by_event for specific category
      return eventBreakdown;
    }),

  setBillingLimit: protectedProcedure
    .input(z.object({ limit: z.number() }))
    .mutation(async ({ ctx, input }) => {
      // Update organization.billing_limit
    }),
});
```

**UI Components (PostHog-inspired):**

```typescript
// packages/ui/src/components/billing/product-card.tsx
export function ProductCard({
  name,
  description,
  icon,
  currentUsage,
  freeLimit,
  monthToDate,
  projected,
  children,
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          {icon}
          <CardTitle>{name}</CardTitle>
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>

      <CardContent>
        {freeLimit && (
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>Current: {currentUsage.toLocaleString()}</span>
              <span>Free tier limit: {freeLimit.toLocaleString()}</span>
            </div>
            <Progress value={(currentUsage / freeLimit) * 100} />
          </div>
        )}

        <div className="flex justify-between mt-4">
          <div>
            <div className="text-2xl font-bold">${monthToDate.toFixed(2)}</div>
            <div className="text-sm text-muted-foreground">Month-to-date</div>
          </div>
          <div>
            <div className="text-2xl font-bold">${projected.toFixed(2)}</div>
            <div className="text-sm text-muted-foreground">Projected</div>
          </div>
        </div>

        {children}
      </CardContent>
    </Card>
  );
}
```

### Week 9-10: Forms Feature

**Deliverables:**
- Form builder UI (drag-and-drop fields)
- Form management (list, create, edit, delete)
- Form embedding via SDK
- Form submissions inbox
- Form analytics dashboard

**Database Schema:**

```typescript
forms {
  id: uuid
  organization_id: uuid
  name: text
  description: text
  fields: jsonb  // Array of field definitions
  settings: jsonb  // Success message, redirect URL, etc.
  is_active: boolean
  created_at: timestamp
  updated_at: timestamp
}

form_submissions {
  id: uuid
  form_id: uuid
  organization_id: uuid
  data: jsonb  // Submitted field values
  metadata: jsonb  // IP, user agent, referrer
  submitted_at: timestamp
}
```

**Form Builder UI:**

```typescript
// apps/web/src/routes/$slug/_dashboard/forms/index.tsx
<FormsList>
  <Button onClick={openFormBuilder}>Create Form</Button>
  <DataTable data={forms} />
</FormsList>

// apps/web/src/routes/$slug/_dashboard/forms/$formId.tsx
<FormBuilder>
  <FieldPalette>
    <FieldType type="text" />
    <FieldType type="email" />
    <FieldType type="textarea" />
    <FieldType type="checkbox" />
    <FieldType type="select" />
  </FieldPalette>

  <FormCanvas>
    {fields.map(field => (
      <FormField
        key={field.id}
        {...field}
        onEdit={editField}
        onDelete={deleteField}
      />
    ))}
  </FormCanvas>

  <FormSettings>
    <Input label="Success Message" />
    <Input label="Redirect URL" />
    <Switch label="Send Email Notification" />
  </FormSettings>
</FormBuilder>
```

**Form Embedding (SDK):**

```typescript
// libraries/sdk/src/forms.ts
export class ContenttaFormsClient {
  embedForm(formId: string, containerId: string) {
    // Fetch form definition
    // Render form HTML
    // Setup submission handler
    // Track form.impression event

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      // Submit to SDK server
      await fetch(`${apiUrl}/sdk/forms/${formId}/submit`, {
        method: 'POST',
        headers: { 'X-API-Key': apiKey },
        body: JSON.stringify(formData),
      });

      // Track form.submitted event
      tracker.track('form.submitted', { formId });
    });
  }
}
```

**Form Submissions Inbox:**

```typescript
// apps/web/src/routes/$slug/_dashboard/forms/$formId/submissions.tsx
<SubmissionsTable>
  <Filters>
    <DateRangePicker />
    <Search placeholder="Search submissions..." />
  </Filters>

  <DataTable
    data={submissions}
    columns={[
      'Submitted At',
      ...formFields,
      'Source',
      'Actions'
    ]}
    onRowClick={viewSubmission}
  />
</SubmissionsTable>
```

---

## Pricing Model

### Free Tier (Monthly Reset)

- **Content Analytics**: 50,000 page views
- **AI Usage**: 100 operations (completions + chat + agents)
- **Forms**: 1,000 submissions
- **SEO**: Included in free tier

### Event Pricing (After Free Tier)

| Event | Price | Description |
|-------|-------|-------------|
| `content.page.view` | $0.00002 | Page view |
| `content.page.published` | $0.001 | Content published |
| `content.page.updated` | $0.0005 | Content updated |
| `form.submitted` | $0.002 | Form submission |
| `form.field_error` | $0.0001 | Validation error |
| `experiment.started` | $0.001 | A/B test started |
| `experiment.conversion` | $0.0001 | Conversion |
| `seo.analyzed` | $0.001 | SEO analysis |
| `seo.indexed` | $0.0001 | Page indexed |
| `ai.completion` | $0.001 | FIM completion |
| `ai.chat_message` | $0.002 | Chat message |
| `ai.agent_action` | $0.005 | Agent action |
| `content.exported` | $0.001 | Content export |
| `automation.triggered` | $0.0005 | Workflow run |

### Optional Add-ons

- **Advanced AI**: Planning mode, SERP research, multi-agent
- **Webhook Delivery**: Event streaming with retry
- **Brand Knowledge Base**: Unlimited documents
- **Priority Support**: SLA guarantees
- **Higher Rate Limits**: API burst capacity

---

## Migration Strategy

### Clean Implementation (No Production Users)

**Advantages:**
- No backward compatibility needed
- No data migration
- No feature flags for customers
- Build it right from the start

**Approach:**

1. **Phase 1**: Build event system infrastructure
2. **Phase 2**: Add event emission to all operations
3. **Phase 3**: Remove old plan-based code
4. **Launch**: With usage-based pricing only

**Code Removal:**

```typescript
// Delete these:
- packages/stripe/plans.ts (FREE/LITE/PRO constants)
- Plan-based limits in Stripe integration
- Seat-based pricing logic
- organization.subscription_plan field
```

---

## Testing Strategy

### Unit Tests

- Event emission logic
- Webhook delivery with retries
- Event pattern matching
- Materialized view refresh
- Form validation

### Integration Tests

- End-to-end event flow (emit → store → webhook)
- SDK event ingestion
- MCP tool execution
- Form submissions

### Load Tests

- 10,000 events/second ingestion
- Webhook delivery under load
- Materialized view refresh performance

---

## Deployment Architecture (Railway)

```
Railway Project: contentta
├── Services
│   ├── web              (TanStack Start)      ~$10-15/mo
│   ├── server           (oRPC API)            ~$20-30/mo
│   ├── sdk-server       (Elysia + MCP)        ~$15-25/mo
│   └── worker           (BullMQ)              ~$15-20/mo
├── Databases
│   ├── postgres                               ~$20-30/mo
│   └── redis                                  ~$10-15/mo
└── Storage
    └── minio / R2                             ~$10/mo

Total Estimated: $100-145/mo
```

---

## Success Metrics

### Technical Metrics

- Event ingestion latency < 100ms (p95)
- Webhook delivery success rate > 98%
- Materialized view refresh < 5 minutes
- API response time < 200ms (p95)

### Business Metrics

- Usage-based revenue per organization
- Event volume growth month-over-month
- SDK adoption (active API keys)
- Webhook adoption (active endpoints)

---

## Future Enhancements (Post-Launch)

- Multi-site/multi-blog support
- A/B testing UI
- Advanced form logic (conditional fields, multi-step)
- Real-time analytics (current day, no 1-hour delay)
- Event replay for debugging
- Custom event definitions (user-defined events)
- GraphQL API option
- Zapier/Make.com integrations

---

## Appendix: Key Files

### Phase 1 (Event System)

```
packages/events/
  src/
    catalog.ts              # Event definitions & types
    emit.ts                 # Central event emitter
    types/
      content-analytics.ts
      ai-usage.ts
      forms.ts

packages/database/
  src/
    schemas/
      events.ts             # Events table
      event-catalog.ts      # Event metadata
      event-views.ts        # Materialized views
      webhooks.ts           # Webhook tables

packages/queue/
  src/
    jobs/
      webhook-delivery.ts   # Webhook job
      refresh-usage-views.ts # View refresh job
```

### Phase 2 (SDK Enhancement)

```
libraries/sdk/
  src/
    events/
      client.ts            # Client-side tracker
      server.ts            # Server-side client
    forms.ts               # Forms SDK

apps/sdk-server/
  src/
    routes/
      sdk-events.ts        # Event ingestion
      sdk-forms.ts         # Form APIs
    mcp/
      tools.ts             # MCP tool handlers
      auth.ts              # MCP authentication
```

### Phase 3 (Platform Features)

```
apps/web/
  src/
    routes/
      $slug/
        _dashboard/
          billing.tsx           # Billing page
          forms/
            index.tsx           # Forms list
            $formId.tsx         # Form builder
            $formId/
              submissions.tsx   # Submissions inbox
              analytics.tsx     # Form analytics

packages/ui/
  src/
    components/
      billing/
        product-card.tsx
        usage-chart.tsx
        billing-limit.tsx
      forms/
        form-builder.tsx
        field-palette.tsx
        form-canvas.tsx
```

---

**End of Design Document**
