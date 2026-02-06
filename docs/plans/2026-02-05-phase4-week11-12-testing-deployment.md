# Phase 4: Testing, Deployment & Launch Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Comprehensive testing, deployment setup, and production launch

**Architecture:** Railway deployment with full observability, automated testing, and production monitoring

**Tech Stack:** Vitest, Railway CLI, PostHog, Pino logging, Database migrations

---

## Week 11: Testing & QA

### Task 1: Unit Test Suite

**Files:**
- Create: `packages/events/src/__tests__/emit.test.ts`
- Create: `packages/events/src/__tests__/catalog.test.ts`
- Create: `packages/queue/src/__tests__/webhook-delivery.test.ts`
- Create: `packages/database/src/__tests__/repositories/event-repository.test.ts`
- Modify: `package.json` (add test scripts)

**Step 1: Write event emission unit tests**

Create `packages/events/src/__tests__/emit.test.ts`:

```typescript
import { describe, expect, it, vi, beforeEach } from "vitest";
import { emitEvent } from "../emit";
import type { DatabaseInstance } from "@packages/database/client";
import { PostHogClient } from "@packages/posthog/server";

vi.mock("@packages/database/client");
vi.mock("@packages/posthog/server");
vi.mock("@packages/queue/client");

describe("emitEvent", () => {
	let mockDb: DatabaseInstance;
	let mockPostHog: PostHogClient;

	beforeEach(() => {
		vi.clearAllMocks();
		mockDb = {
			insert: vi.fn().mockReturnValue({
				values: vi.fn().mockReturnValue({
					returning: vi.fn().mockResolvedValue([
						{
							id: "evt-123",
							organizationId: "org-123",
							eventName: "content.page.view",
						},
					]),
				}),
			}),
		} as any;

		mockPostHog = {
			capture: vi.fn().mockResolvedValue(undefined),
		} as any;
	});

	it("should store event in PostgreSQL", async () => {
		await emitEvent({
			organizationId: "org-123",
			eventName: "content.page.view",
			eventCategory: "content",
			properties: { contentId: "post-123" },
		});

		expect(mockDb.insert).toHaveBeenCalledWith(expect.any(Object));
	});

	it("should send event to PostHog", async () => {
		await emitEvent({
			organizationId: "org-123",
			eventName: "content.page.view",
			eventCategory: "content",
			properties: { contentId: "post-123" },
		});

		expect(mockPostHog.capture).toHaveBeenCalledWith({
			distinctId: "org-123",
			event: "content.page.view",
			properties: expect.objectContaining({
				contentId: "post-123",
			}),
		});
	});

	it("should trigger webhook queue for matching subscriptions", async () => {
		const mockQueue = await import("@packages/queue/client");

		await emitEvent({
			organizationId: "org-123",
			eventName: "content.page.published",
			eventCategory: "content",
			properties: { contentId: "post-123" },
		});

		expect(mockQueue.webhookQueue.add).toHaveBeenCalled();
	});

	it("should calculate billable status based on free tier", async () => {
		await emitEvent({
			organizationId: "org-123",
			eventName: "ai.completion",
			eventCategory: "ai",
			properties: { model: "gpt-4" },
		});

		// Verify event stored with correct billable flag
		expect(mockDb.insert).toHaveBeenCalledWith(
			expect.objectContaining({
				isBillable: expect.any(Boolean),
				pricePerEvent: expect.any(String),
			}),
		);
	});
});
```

**Step 2: Run event emission tests**

Run: `bun test packages/events/src/__tests__/emit.test.ts`
Expected: All tests PASS

**Step 3: Write webhook delivery tests**

Create `packages/queue/src/__tests__/webhook-delivery.test.ts`:

```typescript
import { describe, expect, it, vi, beforeEach } from "vitest";
import { deliverWebhook } from "../jobs/webhook-delivery";
import type { WebhookDeliveryJob } from "../types";

describe("deliverWebhook", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		global.fetch = vi.fn();
	});

	it("should generate HMAC signature", async () => {
		const job: WebhookDeliveryJob = {
			deliveryId: "del-123",
			webhookEndpointId: "wh-123",
			url: "https://example.com/webhook",
			eventName: "content.page.published",
			payload: { contentId: "post-123" },
			signingSecret: "secret-key",
		};

		(global.fetch as any).mockResolvedValue({
			ok: true,
			status: 200,
		});

		await deliverWebhook(job);

		expect(global.fetch).toHaveBeenCalledWith(
			job.url,
			expect.objectContaining({
				headers: expect.objectContaining({
					"X-Contentta-Signature": expect.stringMatching(/^t=\d+,v1=.+$/),
					"X-Contentta-Event": "content.page.published",
					"X-Contentta-Delivery-Id": "del-123",
				}),
			}),
		);
	});

	it("should retry with exponential backoff on failure", async () => {
		const job: WebhookDeliveryJob = {
			deliveryId: "del-123",
			webhookEndpointId: "wh-123",
			url: "https://example.com/webhook",
			eventName: "content.page.published",
			payload: { contentId: "post-123" },
			signingSecret: "secret-key",
			attemptNumber: 2,
		};

		(global.fetch as any).mockResolvedValue({
			ok: false,
			status: 500,
		});

		const result = await deliverWebhook(job);

		// 2^2 = 4 minutes
		expect(result.nextRetryAt).toBeGreaterThan(Date.now() + 4 * 60 * 1000 - 1000);
		expect(result.status).toBe("retrying");
	});

	it("should mark as failed after max attempts", async () => {
		const job: WebhookDeliveryJob = {
			deliveryId: "del-123",
			webhookEndpointId: "wh-123",
			url: "https://example.com/webhook",
			eventName: "content.page.published",
			payload: { contentId: "post-123" },
			signingSecret: "secret-key",
			attemptNumber: 5,
			maxAttempts: 5,
		};

		(global.fetch as any).mockResolvedValue({
			ok: false,
			status: 500,
		});

		const result = await deliverWebhook(job);

		expect(result.status).toBe("failed");
		expect(result.attemptNumber).toBe(5);
	});
});
```

**Step 4: Run webhook delivery tests**

Run: `bun test packages/queue/src/__tests__/webhook-delivery.test.ts`
Expected: All tests PASS

**Step 5: Write event pattern matching tests**

Create `packages/events/src/__tests__/pattern-matching.test.ts`:

```typescript
import { describe, expect, it } from "vitest";
import { matchesEventPattern } from "../pattern-matching";

describe("matchesEventPattern", () => {
	it("should match exact event names", () => {
		expect(matchesEventPattern("content.page.view", "content.page.view")).toBe(true);
		expect(matchesEventPattern("content.page.view", "content.page.published")).toBe(false);
	});

	it("should match wildcard patterns", () => {
		expect(matchesEventPattern("content.page.view", "content.*")).toBe(true);
		expect(matchesEventPattern("content.page.published", "content.*")).toBe(true);
		expect(matchesEventPattern("ai.completion", "content.*")).toBe(false);
	});

	it("should match category patterns", () => {
		expect(matchesEventPattern("content.page.view", "content.page.*")).toBe(true);
		expect(matchesEventPattern("content.page.published", "content.page.*")).toBe(true);
		expect(matchesEventPattern("content.created", "content.page.*")).toBe(false);
	});

	it("should match multiple patterns", () => {
		const patterns = ["content.*", "ai.completion"];

		expect(matchesEventPattern("content.page.view", patterns)).toBe(true);
		expect(matchesEventPattern("ai.completion", patterns)).toBe(true);
		expect(matchesEventPattern("form.submitted", patterns)).toBe(false);
	});
});
```

**Step 6: Run pattern matching tests**

Run: `bun test packages/events/src/__tests__/pattern-matching.test.ts`
Expected: All tests PASS

**Step 7: Commit unit tests**

```bash
git add packages/events/src/__tests__ packages/queue/src/__tests__
git commit -m "$(cat <<'EOF'
test: add event system unit tests

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: Integration Tests

**Files:**
- Create: `apps/server/src/__tests__/integration/event-flow.test.ts`
- Create: `apps/sdk-server/src/__tests__/integration/sdk-events.test.ts`
- Create: `apps/sdk-server/src/__tests__/integration/mcp-tools.test.ts`

**Step 1: Write end-to-end event flow test**

Create `apps/server/src/__tests__/integration/event-flow.test.ts`:

```typescript
import { describe, expect, it, beforeAll, afterAll } from "vitest";
import { treaty } from "@elysiajs/eden";
import type { App } from "../../index";
import { db } from "@packages/database/client";
import { events, webhookEndpoints, webhookDeliveries } from "@packages/database/schemas";
import { eq } from "drizzle-orm";

describe("Event Flow Integration", () => {
	let client: ReturnType<typeof treaty<App>>;
	let testOrgId: string;
	let testWebhookId: string;

	beforeAll(async () => {
		// Setup test organization and webhook endpoint
		testOrgId = "test-org-123";

		const [webhook] = await db.insert(webhookEndpoints).values({
			organizationId: testOrgId,
			url: "https://webhook.site/test",
			eventPatterns: ["content.*"],
			signingSecret: "test-secret",
			isActive: true,
		}).returning();

		testWebhookId = webhook.id;
	});

	afterAll(async () => {
		// Cleanup
		await db.delete(webhookDeliveries).where(eq(webhookDeliveries.webhookEndpointId, testWebhookId));
		await db.delete(webhookEndpoints).where(eq(webhookEndpoints.id, testWebhookId));
		await db.delete(events).where(eq(events.organizationId, testOrgId));
	});

	it("should emit event, store in DB, send to PostHog, and queue webhook", async () => {
		// Emit event via API
		const response = await client.api.content.create.post({
			title: "Test Post",
			body: "Test content",
		});

		expect(response.status).toBe(201);

		// Verify event stored in PostgreSQL
		const storedEvents = await db.select()
			.from(events)
			.where(eq(events.organizationId, testOrgId))
			.orderBy(events.timestamp);

		expect(storedEvents).toHaveLength(1);
		expect(storedEvents[0].eventName).toBe("content.created");

		// Verify webhook delivery queued
		const deliveries = await db.select()
			.from(webhookDeliveries)
			.where(eq(webhookDeliveries.webhookEndpointId, testWebhookId));

		expect(deliveries).toHaveLength(1);
		expect(deliveries[0].status).toBe("pending");
		expect(deliveries[0].eventName).toBe("content.created");
	});

	it("should not create webhook delivery for non-matching patterns", async () => {
		// Update webhook to only match ai.* events
		await db.update(webhookEndpoints)
			.set({ eventPatterns: ["ai.*"] })
			.where(eq(webhookEndpoints.id, testWebhookId));

		// Emit content event
		await client.api.content.create.post({
			title: "Another Test Post",
			body: "More content",
		});

		// Verify no new webhook deliveries
		const deliveries = await db.select()
			.from(webhookDeliveries)
			.where(eq(webhookDeliveries.webhookEndpointId, testWebhookId));

		expect(deliveries).toHaveLength(1); // Only the first one from previous test
	});
});
```

**Step 2: Run integration tests**

Run: `bun test apps/server/src/__tests__/integration/event-flow.test.ts`
Expected: All tests PASS

**Step 3: Write SDK event ingestion test**

Create `apps/sdk-server/src/__tests__/integration/sdk-events.test.ts`:

```typescript
import { describe, expect, it, beforeAll } from "vitest";
import { treaty } from "@elysiajs/eden";
import type { App } from "../../index";
import { db } from "@packages/database/client";
import { events } from "@packages/database/schemas";
import { eq } from "drizzle-orm";

describe("SDK Event Ingestion", () => {
	let client: ReturnType<typeof treaty<App>>;
	let testApiKey: string;
	let testOrgId: string;

	beforeAll(async () => {
		// Create test API key
		testApiKey = "sk_test_123456";
		testOrgId = "org-123";
	});

	it("should ingest batch of events from SDK", async () => {
		const response = await client.api.sdk.events.post(
			{
				events: [
					{
						eventName: "content.page.view",
						properties: { contentId: "post-123", path: "/blog/test" },
						timestamp: Date.now(),
					},
					{
						eventName: "content.scroll.milestone",
						properties: { contentId: "post-123", milestone: 25 },
						timestamp: Date.now(),
					},
				],
			},
			{
				headers: {
					"X-API-Key": testApiKey,
				},
			},
		);

		expect(response.status).toBe(200);
		expect(response.data?.eventsProcessed).toBe(2);

		// Verify events stored
		const storedEvents = await db.select()
			.from(events)
			.where(eq(events.organizationId, testOrgId))
			.orderBy(events.timestamp);

		expect(storedEvents.length).toBeGreaterThanOrEqual(2);
	});

	it("should reject requests with invalid API key", async () => {
		const response = await client.api.sdk.events.post(
			{
				events: [
					{
						eventName: "content.page.view",
						properties: { contentId: "post-123" },
						timestamp: Date.now(),
					},
				],
			},
			{
				headers: {
					"X-API-Key": "invalid-key",
				},
			},
		);

		expect(response.status).toBe(401);
	});
});
```

**Step 4: Run SDK integration tests**

Run: `bun test apps/sdk-server/src/__tests__/integration/sdk-events.test.ts`
Expected: All tests PASS

**Step 5: Write MCP tools integration test**

Create `apps/sdk-server/src/__tests__/integration/mcp-tools.test.ts`:

```typescript
import { describe, expect, it, beforeAll } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";

describe("MCP Tools Integration", () => {
	let client: Client;
	let testApiKey: string;

	beforeAll(async () => {
		testApiKey = "sk_test_123456";

		const transport = new SSEClientTransport(
			new URL("http://localhost:3001/mcp"),
			{
				headers: {
					Authorization: `Bearer ${testApiKey}`,
				},
			},
		);

		client = new Client(
			{
				name: "test-client",
				version: "1.0.0",
			},
			{
				capabilities: {},
			},
		);

		await client.connect(transport);
	});

	it("should list available tools", async () => {
		const tools = await client.listTools();

		expect(tools.tools).toHaveLength(6);
		expect(tools.tools.map(t => t.name)).toEqual([
			"create_content",
			"update_content",
			"publish_content",
			"list_content",
			"get_brand_guidelines",
			"get_agent",
		]);
	});

	it("should create content via MCP", async () => {
		const result = await client.callTool({
			name: "create_content",
			arguments: {
				title: "Test Post via MCP",
				body: "This was created by an AI tool",
				status: "draft",
			},
		});

		expect(result.content).toBeDefined();
		expect(result.content[0].text).toContain("post-");
	});

	it("should list content via MCP", async () => {
		const result = await client.callTool({
			name: "list_content",
			arguments: {},
		});

		expect(result.content).toBeDefined();
		expect(result.content[0].text).toContain("Test Post via MCP");
	});
});
```

**Step 6: Run MCP integration tests**

Run: `bun test apps/sdk-server/src/__tests__/integration/mcp-tools.test.ts`
Expected: All tests PASS

**Step 7: Commit integration tests**

```bash
git add apps/server/src/__tests__/integration apps/sdk-server/src/__tests__/integration
git commit -m "$(cat <<'EOF'
test: add integration tests for event flow, SDK, and MCP

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: Load Testing

**Files:**
- Create: `scripts/load-test.ts`
- Create: `scripts/load-test-webhooks.ts`
- Create: `scripts/load-test-views.ts`

**Step 1: Write event ingestion load test**

Create `scripts/load-test.ts`:

```typescript
import { emitEvent } from "@packages/events/emit";

async function loadTestEventIngestion() {
	const startTime = Date.now();
	const targetEvents = 10000;
	const batchSize = 100;
	const batches = targetEvents / batchSize;

	console.log(`Starting load test: ${targetEvents} events in ${batches} batches`);

	const promises: Promise<void>[] = [];

	for (let i = 0; i < batches; i++) {
		const batchPromises = Array.from({ length: batchSize }, (_, j) =>
			emitEvent({
				organizationId: "load-test-org",
				eventName: "content.page.view",
				eventCategory: "content",
				properties: {
					contentId: `post-${(i * batchSize + j) % 100}`,
					timestamp: Date.now(),
				},
			}),
		);

		promises.push(...batchPromises);

		// Batch every 100 events
		if (promises.length >= 1000) {
			await Promise.all(promises.splice(0, 1000));
		}
	}

	// Wait for remaining events
	await Promise.all(promises);

	const endTime = Date.now();
	const duration = (endTime - startTime) / 1000;
	const eventsPerSecond = targetEvents / duration;

	console.log(`\nLoad Test Results:`);
	console.log(`  Total events: ${targetEvents}`);
	console.log(`  Duration: ${duration.toFixed(2)}s`);
	console.log(`  Events/second: ${eventsPerSecond.toFixed(0)}`);
	console.log(`  Target: 10,000 events/second`);
	console.log(`  Status: ${eventsPerSecond >= 10000 ? "✅ PASS" : "❌ FAIL"}`);

	process.exit(eventsPerSecond >= 10000 ? 0 : 1);
}

loadTestEventIngestion();
```

**Step 2: Run event ingestion load test**

Run: `bun scripts/load-test.ts`
Expected: Events/second >= 10,000

**Step 3: Write webhook delivery load test**

Create `scripts/load-test-webhooks.ts`:

```typescript
import { webhookQueue } from "@packages/queue/client";
import type { WebhookDeliveryJob } from "@packages/queue/types";

async function loadTestWebhooks() {
	const startTime = Date.now();
	const targetJobs = 1000;

	console.log(`Starting webhook load test: ${targetJobs} deliveries`);

	// Create test webhook server
	const testServer = Bun.serve({
		port: 9999,
		fetch(req) {
			return new Response("OK", { status: 200 });
		},
	});

	// Queue webhook deliveries
	const jobs: WebhookDeliveryJob[] = Array.from({ length: targetJobs }, (_, i) => ({
		deliveryId: `load-test-${i}`,
		webhookEndpointId: "test-endpoint",
		url: "http://localhost:9999/webhook",
		eventName: "content.page.view",
		payload: { contentId: `post-${i}` },
		signingSecret: "test-secret",
	}));

	await Promise.all(jobs.map(job => webhookQueue.add("deliver-webhook", job)));

	// Wait for all jobs to complete
	let completed = 0;
	while (completed < targetJobs) {
		await new Promise(resolve => setTimeout(resolve, 1000));
		const counts = await webhookQueue.getJobCounts();
		completed = counts.completed;
		console.log(`  Progress: ${completed}/${targetJobs}`);
	}

	const endTime = Date.now();
	const duration = (endTime - startTime) / 1000;
	const deliveriesPerSecond = targetJobs / duration;

	testServer.stop();

	console.log(`\nWebhook Load Test Results:`);
	console.log(`  Total deliveries: ${targetJobs}`);
	console.log(`  Duration: ${duration.toFixed(2)}s`);
	console.log(`  Deliveries/second: ${deliveriesPerSecond.toFixed(0)}`);
	console.log(`  Target: > 100 deliveries/second`);
	console.log(`  Status: ${deliveriesPerSecond >= 100 ? "✅ PASS" : "❌ FAIL"}`);

	process.exit(deliveriesPerSecond >= 100 ? 0 : 1);
}

loadTestWebhooks();
```

**Step 4: Run webhook load test**

Run: `bun scripts/load-test-webhooks.ts`
Expected: Deliveries/second >= 100

**Step 5: Write materialized view refresh load test**

Create `scripts/load-test-views.ts`:

```typescript
import { db } from "@packages/database/client";
import { sql } from "drizzle-orm";

async function loadTestViewRefresh() {
	console.log("Starting materialized view refresh test...");

	const startTime = Date.now();

	// Refresh all views concurrently
	await Promise.all([
		db.execute(sql`REFRESH MATERIALIZED VIEW CONCURRENTLY daily_usage_by_event`),
		db.execute(sql`REFRESH MATERIALIZED VIEW CONCURRENTLY current_month_usage_by_event`),
		db.execute(sql`REFRESH MATERIALIZED VIEW CONCURRENTLY current_month_usage_by_category`),
	]);

	const endTime = Date.now();
	const duration = (endTime - startTime) / 1000;

	console.log(`\nMaterialized View Refresh Results:`);
	console.log(`  Duration: ${duration.toFixed(2)}s`);
	console.log(`  Target: < 5 minutes (300s)`);
	console.log(`  Status: ${duration < 300 ? "✅ PASS" : "❌ FAIL"}`);

	process.exit(duration < 300 ? 0 : 1);
}

loadTestViewRefresh();
```

**Step 6: Run view refresh load test**

Run: `bun scripts/load-test-views.ts`
Expected: Duration < 300 seconds

**Step 7: Commit load testing scripts**

```bash
git add scripts/load-test*.ts
git commit -m "$(cat <<'EOF'
test: add load testing scripts for events, webhooks, and views

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Week 12: Deployment & Launch

### Task 4: Railway Configuration

**Files:**
- Create: `railway.toml`
- Create: `.railway/deploy.sh`
- Modify: `package.json` (add deploy scripts)

**Step 1: Create Railway configuration**

Create `railway.toml`:

```toml
[build]
builder = "NIXPACKS"
buildCommand = "bun install && bun run build"

[deploy]
numReplicas = 1
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 10

[services.web]
startCommand = "cd apps/dashboard && bun run start"
healthcheckPath = "/"
healthcheckTimeout = 30

[services.server]
startCommand = "cd apps/server && bun run start"
healthcheckPath = "/health"
healthcheckTimeout = 30

[services.sdk-server]
startCommand = "cd apps/sdk-server && bun run start"
healthcheckPath = "/health"
healthcheckTimeout = 30

[services.worker]
startCommand = "cd apps/worker && bun run start"
# No healthcheck for worker

[[services.web.domains]]
type = "CUSTOM"

[[services.server.domains]]
type = "CUSTOM"

[[services.sdk-server.domains]]
type = "CUSTOM"
```

**Step 2: Run Railway config validation**

Run: `railway config validate`
Expected: "Configuration is valid"

**Step 3: Create deployment script**

Create `.railway/deploy.sh`:

```bash
#!/bin/bash

set -e

echo "🚀 Starting Railway deployment..."

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found. Install it first:"
    echo "   npm i -g @railway/cli"
    exit 1
fi

# Check if logged in
if ! railway whoami &> /dev/null; then
    echo "❌ Not logged into Railway. Run: railway login"
    exit 1
fi

# Run database migrations
echo "📦 Running database migrations..."
railway run --service server bun run db:push

# Seed event catalog
echo "🌱 Seeding event catalog..."
railway run --service server bun run db:seed

# Deploy all services
echo "🚢 Deploying services..."
railway up --service web
railway up --service server
railway up --service sdk-server
railway up --service worker

# Verify deployments
echo "✅ Verifying deployments..."
railway status --service web
railway status --service server
railway status --service sdk-server
railway status --service worker

echo "✨ Deployment complete!"
```

**Step 4: Make deployment script executable**

Run: `chmod +x .railway/deploy.sh`
Expected: Script is executable

**Step 5: Add deploy scripts to package.json**

Edit `package.json`:

```json
{
	"scripts": {
		"deploy": "./.railway/deploy.sh",
		"deploy:web": "railway up --service web",
		"deploy:server": "railway up --service server",
		"deploy:sdk-server": "railway up --service sdk-server",
		"deploy:worker": "railway up --service worker",
		"railway:status": "railway status"
	}
}
```

**Step 6: Test deployment to Railway staging**

Run: `bun run deploy`
Expected: All services deploy successfully

**Step 7: Commit Railway configuration**

```bash
git add railway.toml .railway/deploy.sh package.json
git commit -m "$(cat <<'EOF'
chore: add Railway deployment configuration

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 5: Database Migrations & Seeding

**Files:**
- Create: `packages/database/src/seeds/event-catalog.ts`
- Create: `packages/database/src/migrations/001_event_catalog.sql`
- Modify: `package.json` (add seed script)

**Step 1: Create event catalog seed data**

Create `packages/database/src/seeds/event-catalog.ts`:

```typescript
import { db } from "../client";
import { eventCatalog } from "../schemas/event-catalog";

export async function seedEventCatalog() {
	console.log("🌱 Seeding event catalog...");

	const events = [
		// Content Analytics
		{
			eventName: "content.page.view",
			category: "content",
			pricePerEvent: "0.00002",
			freeTierLimit: 50000,
			description: "Page view tracked via SDK",
			isBillable: true,
			isActive: true,
		},
		{
			eventName: "content.page.published",
			category: "content",
			pricePerEvent: "0.001",
			freeTierLimit: 0,
			description: "Content published to live site",
			isBillable: true,
			isActive: true,
		},
		{
			eventName: "content.page.updated",
			category: "content",
			pricePerEvent: "0.0005",
			freeTierLimit: 0,
			description: "Content updated",
			isBillable: true,
			isActive: true,
		},
		{
			eventName: "content.created",
			category: "content",
			pricePerEvent: "0",
			freeTierLimit: null,
			description: "Content created in draft",
			isBillable: false,
			isActive: true,
		},
		{
			eventName: "content.deleted",
			category: "content",
			pricePerEvent: "0",
			freeTierLimit: null,
			description: "Content deleted",
			isBillable: false,
			isActive: true,
		},
		{
			eventName: "content.scroll.milestone",
			category: "content",
			pricePerEvent: "0.00001",
			freeTierLimit: 100000,
			description: "User scrolled to milestone (25%, 50%, 75%, 100%)",
			isBillable: true,
			isActive: true,
		},
		{
			eventName: "content.time.spent",
			category: "content",
			pricePerEvent: "0.00001",
			freeTierLimit: 100000,
			description: "Time spent on page tracked",
			isBillable: true,
			isActive: true,
		},
		{
			eventName: "content.cta.click",
			category: "content",
			pricePerEvent: "0.0001",
			freeTierLimit: 10000,
			description: "CTA button clicked",
			isBillable: true,
			isActive: true,
		},
		{
			eventName: "content.exported",
			category: "content",
			pricePerEvent: "0.001",
			freeTierLimit: 100,
			description: "Content exported to external format",
			isBillable: true,
			isActive: true,
		},

		// AI Usage
		{
			eventName: "ai.completion",
			category: "ai",
			pricePerEvent: "0.001",
			freeTierLimit: 100,
			description: "AI completion (FIM)",
			isBillable: true,
			isActive: true,
		},
		{
			eventName: "ai.chat_message",
			category: "ai",
			pricePerEvent: "0.002",
			freeTierLimit: 100,
			description: "AI chat message",
			isBillable: true,
			isActive: true,
		},
		{
			eventName: "ai.agent_action",
			category: "ai",
			pricePerEvent: "0.005",
			freeTierLimit: 100,
			description: "AI agent action (planning, research, editing)",
			isBillable: true,
			isActive: true,
		},

		// Forms
		{
			eventName: "form.submitted",
			category: "form",
			pricePerEvent: "0.002",
			freeTierLimit: 1000,
			description: "Form submission",
			isBillable: true,
			isActive: true,
		},
		{
			eventName: "form.impression",
			category: "form",
			pricePerEvent: "0",
			freeTierLimit: null,
			description: "Form viewed",
			isBillable: false,
			isActive: true,
		},
		{
			eventName: "form.field_error",
			category: "form",
			pricePerEvent: "0.0001",
			freeTierLimit: 10000,
			description: "Form validation error",
			isBillable: true,
			isActive: true,
		},

		// SEO
		{
			eventName: "seo.analyzed",
			category: "seo",
			pricePerEvent: "0.001",
			freeTierLimit: 100,
			description: "SEO analysis performed",
			isBillable: true,
			isActive: true,
		},
		{
			eventName: "seo.indexed",
			category: "seo",
			pricePerEvent: "0.0001",
			freeTierLimit: 1000,
			description: "Page indexed",
			isBillable: true,
			isActive: true,
		},

		// Experiments (A/B testing)
		{
			eventName: "experiment.started",
			category: "experiment",
			pricePerEvent: "0.001",
			freeTierLimit: 10,
			description: "A/B test started",
			isBillable: true,
			isActive: true,
		},
		{
			eventName: "experiment.conversion",
			category: "experiment",
			pricePerEvent: "0.0001",
			freeTierLimit: 1000,
			description: "A/B test conversion",
			isBillable: true,
			isActive: true,
		},

		// Automation
		{
			eventName: "automation.triggered",
			category: "automation",
			pricePerEvent: "0.0005",
			freeTierLimit: 1000,
			description: "Workflow triggered",
			isBillable: true,
			isActive: true,
		},
	];

	await db.insert(eventCatalog).values(events).onConflictDoNothing();

	console.log(`✅ Seeded ${events.length} event definitions`);
}
```

**Step 2: Run seed locally**

Run: `bun packages/database/src/seeds/event-catalog.ts`
Expected: "✅ Seeded 20 event definitions"

**Step 3: Create migration for materialized views**

Create `packages/database/src/migrations/001_event_catalog.sql`:

```sql
-- Daily usage aggregation
CREATE MATERIALIZED VIEW IF NOT EXISTS daily_usage_by_event AS
SELECT
    organization_id,
    event_name,
    event_category,
    DATE(timestamp) as date,
    COUNT(*) as event_count,
    SUM(CAST(price_per_event AS DECIMAL(10,6))) as total_cost
FROM events
WHERE is_billable = true
GROUP BY organization_id, event_name, event_category, DATE(timestamp);

CREATE UNIQUE INDEX ON daily_usage_by_event (organization_id, event_name, date);

-- Current month usage by event
CREATE MATERIALIZED VIEW IF NOT EXISTS current_month_usage_by_event AS
SELECT
    organization_id,
    event_name,
    event_category,
    COUNT(*) as event_count,
    SUM(CAST(price_per_event AS DECIMAL(10,6))) as month_to_date_cost
FROM events
WHERE
    is_billable = true
    AND timestamp >= DATE_TRUNC('month', CURRENT_DATE)
    AND timestamp < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
GROUP BY organization_id, event_name, event_category;

CREATE UNIQUE INDEX ON current_month_usage_by_event (organization_id, event_name);

-- Current month usage by category with projections
CREATE MATERIALIZED VIEW IF NOT EXISTS current_month_usage_by_category AS
SELECT
    organization_id,
    event_category,
    COUNT(*) as event_count,
    SUM(CAST(price_per_event AS DECIMAL(10,6))) as month_to_date_cost,
    -- Projected cost based on days elapsed vs days remaining
    CASE
        WHEN EXTRACT(DAY FROM CURRENT_DATE) > 0 THEN
            SUM(CAST(price_per_event AS DECIMAL(10,6))) *
            (EXTRACT(DAY FROM DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day') /
             EXTRACT(DAY FROM CURRENT_DATE))
        ELSE 0
    END as projected_cost
FROM events
WHERE
    is_billable = true
    AND timestamp >= DATE_TRUNC('month', CURRENT_DATE)
    AND timestamp < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
GROUP BY organization_id, event_category;

CREATE UNIQUE INDEX ON current_month_usage_by_category (organization_id, event_category);
```

**Step 4: Run migration**

Run: `bun run db:push`
Expected: "Migration successful"

**Step 5: Verify materialized views created**

Run: `psql $DATABASE_URL -c "\dm"`
Expected: Lists 3 materialized views

**Step 6: Add seed script to package.json**

Edit `package.json`:

```json
{
	"scripts": {
		"db:seed": "bun packages/database/src/seeds/event-catalog.ts"
	}
}
```

**Step 7: Commit migrations and seeds**

```bash
git add packages/database/src/seeds packages/database/src/migrations package.json
git commit -m "$(cat <<'EOF'
feat: add event catalog seed data and materialized view migrations

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 6: Production Monitoring

**Files:**
- Create: `packages/logging/src/monitors/event-monitor.ts`
- Create: `packages/logging/src/monitors/webhook-monitor.ts`
- Modify: `apps/worker/src/index.ts` (add monitoring)

**Step 1: Create event monitoring**

Create `packages/logging/src/monitors/event-monitor.ts`:

```typescript
import { logger } from "../logger";
import { db } from "@packages/database/client";
import { events } from "@packages/database/schemas";
import { sql, gt } from "drizzle-orm";

export async function monitorEventIngestion() {
	const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

	const [result] = await db
		.select({
			count: sql<number>`COUNT(*)`,
			avgLatency: sql<number>`AVG(EXTRACT(EPOCH FROM (created_at - timestamp)))`,
		})
		.from(events)
		.where(gt(events.timestamp, fiveMinutesAgo));

	const eventsPerSecond = result.count / 300; // 5 minutes = 300 seconds
	const avgLatency = result.avgLatency * 1000; // Convert to milliseconds

	if (eventsPerSecond < 1) {
		logger.warn("Event ingestion rate is low", {
			eventsPerSecond,
			threshold: 1,
		});
	}

	if (avgLatency > 100) {
		logger.warn("Event ingestion latency is high", {
			avgLatency,
			threshold: 100,
			unit: "ms",
		});
	}

	logger.info("Event ingestion metrics", {
		eventsPerSecond,
		avgLatency,
	});

	return { eventsPerSecond, avgLatency };
}
```

**Step 2: Run event monitoring test**

Run: `bun packages/logging/src/monitors/event-monitor.ts`
Expected: Logs event ingestion metrics

**Step 3: Create webhook monitoring**

Create `packages/logging/src/monitors/webhook-monitor.ts`:

```typescript
import { logger } from "../logger";
import { db } from "@packages/database/client";
import { webhookDeliveries, webhookEndpoints } from "@packages/database/schemas";
import { sql, eq, gt } from "drizzle-orm";

export async function monitorWebhookDeliveries() {
	const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

	// Get delivery success rate
	const [stats] = await db
		.select({
			total: sql<number>`COUNT(*)`,
			successful: sql<number>`COUNT(*) FILTER (WHERE status = 'success')`,
			failed: sql<number>`COUNT(*) FILTER (WHERE status = 'failed')`,
			pending: sql<number>`COUNT(*) FILTER (WHERE status = 'pending')`,
		})
		.from(webhookDeliveries)
		.where(gt(webhookDeliveries.createdAt, oneHourAgo));

	const successRate = (stats.successful / stats.total) * 100;

	if (successRate < 98) {
		logger.error("Webhook delivery success rate below threshold", {
			successRate,
			threshold: 98,
			total: stats.total,
			successful: stats.successful,
			failed: stats.failed,
		});
	}

	// Check for disabled endpoints
	const disabledEndpoints = await db
		.select()
		.from(webhookEndpoints)
		.where(eq(webhookEndpoints.isActive, false));

	if (disabledEndpoints.length > 0) {
		logger.warn("Webhook endpoints have been auto-disabled", {
			count: disabledEndpoints.length,
			endpoints: disabledEndpoints.map(e => ({
				id: e.id,
				url: e.url,
				failureCount: e.failureCount,
			})),
		});
	}

	logger.info("Webhook delivery metrics", {
		successRate,
		total: stats.total,
		successful: stats.successful,
		failed: stats.failed,
		pending: stats.pending,
	});

	return { successRate, stats };
}
```

**Step 4: Run webhook monitoring test**

Run: `bun packages/logging/src/monitors/webhook-monitor.ts`
Expected: Logs webhook delivery metrics

**Step 5: Add monitoring to worker**

Edit `apps/worker/src/index.ts`:

```typescript
import { CronJob } from "cron";
import { monitorEventIngestion } from "@packages/logging/monitors/event-monitor";
import { monitorWebhookDeliveries } from "@packages/logging/monitors/webhook-monitor";
import { logger } from "@packages/logging/logger";

// Event monitoring - every 5 minutes
const eventMonitorJob = new CronJob("*/5 * * * *", async () => {
	try {
		await monitorEventIngestion();
	} catch (error) {
		logger.error("Event monitoring failed", { error });
	}
});

// Webhook monitoring - every 5 minutes
const webhookMonitorJob = new CronJob("*/5 * * * *", async () => {
	try {
		await monitorWebhookDeliveries();
	} catch (error) {
		logger.error("Webhook monitoring failed", { error });
	}
});

eventMonitorJob.start();
webhookMonitorJob.start();

logger.info("Monitoring jobs started");
```

**Step 6: Run worker with monitoring**

Run: `bun apps/worker/src/index.ts`
Expected: "Monitoring jobs started"

**Step 7: Commit monitoring**

```bash
git add packages/logging/src/monitors apps/worker/src/index.ts
git commit -m "$(cat <<'EOF'
feat: add production monitoring for events and webhooks

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 7: Launch Checklist & Documentation

**Files:**
- Create: `docs/LAUNCH_CHECKLIST.md`
- Create: `docs/RUNBOOK.md`
- Create: `docs/API_QUICKSTART.md`

**Step 1: Create launch checklist**

Create `docs/LAUNCH_CHECKLIST.md`:

```markdown
# Production Launch Checklist

## Pre-Launch (Complete Before Deploy)

### Infrastructure
- [ ] Railway project configured with all services
- [ ] PostgreSQL database provisioned
- [ ] Redis instance provisioned
- [ ] MinIO/R2 storage configured
- [ ] Custom domains configured and verified
- [ ] SSL certificates provisioned

### Database
- [ ] All migrations run successfully
- [ ] Event catalog seeded with pricing
- [ ] Materialized views created
- [ ] Database indexes created
- [ ] Backup strategy configured

### Environment Variables
- [ ] All production secrets configured in Railway
- [ ] API keys rotated from development values
- [ ] Stripe webhook secret configured
- [ ] PostHog API key configured
- [ ] Better Auth secret generated
- [ ] Database connection strings configured

### Testing
- [ ] All unit tests passing
- [ ] All integration tests passing
- [ ] Load tests passing (10K events/sec)
- [ ] Webhook delivery tests passing
- [ ] MCP tools tests passing

### Monitoring
- [ ] PostHog analytics configured
- [ ] Error tracking configured
- [ ] Log aggregation configured
- [ ] Monitoring cron jobs deployed

## Launch Day

### Deploy
- [ ] Deploy database migrations
- [ ] Seed event catalog
- [ ] Deploy all services in order:
  - [ ] Server
  - [ ] SDK Server
  - [ ] Worker
  - [ ] Web
- [ ] Verify all services healthy
- [ ] Smoke test critical paths:
  - [ ] User signup/login
  - [ ] Content creation
  - [ ] AI operations
  - [ ] Form creation
  - [ ] Webhook delivery

### Verification
- [ ] Create test organization
- [ ] Create test content
- [ ] Verify events emitted to PostgreSQL
- [ ] Verify events sent to PostHog
- [ ] Create test webhook endpoint
- [ ] Verify webhook delivery
- [ ] Check billing dashboard
- [ ] Verify SDK event ingestion
- [ ] Test MCP server with Claude Desktop

## Post-Launch (First 24 Hours)

### Monitoring
- [ ] Monitor event ingestion rate
- [ ] Monitor webhook success rate
- [ ] Monitor API response times
- [ ] Monitor error rates
- [ ] Check materialized view refresh

### Performance
- [ ] Verify p95 latency < 200ms
- [ ] Verify event ingestion < 100ms
- [ ] Verify webhook success rate > 98%

### User Support
- [ ] Monitor user signups
- [ ] Watch for support tickets
- [ ] Check error logs for user issues

## Known Issues

Document any known issues or limitations:

1. Materialized views refresh every hour (1-hour delay in billing data)
2. Webhook retries use exponential backoff (max 32 minutes)
3. Free tier limits reset monthly

## Rollback Plan

If critical issues occur:

1. Stop all deployments: `railway down`
2. Roll back database migrations if needed
3. Restore previous Railway deployment
4. Notify users of downtime
5. Debug in staging environment

## Success Metrics

Track these in first week:

- User signups
- Event volume
- Webhook adoption
- API usage
- Error rates
- Response times
```

**Step 2: Create production runbook**

Create `docs/RUNBOOK.md`:

```markdown
# Production Runbook

## Common Operations

### Restart Services

```bash
railway restart --service web
railway restart --service server
railway restart --service sdk-server
railway restart --service worker
```

### View Logs

```bash
railway logs --service server
railway logs --service worker --follow
```

### Database Operations

```bash
# Run migrations
railway run --service server bun run db:push

# Seed event catalog
railway run --service server bun run db:seed

# Open database studio
railway run --service server bun run db:studio

# Refresh materialized views manually
railway run --service server bun scripts/refresh-views.ts
```

### Check Service Status

```bash
railway status
```

## Troubleshooting

### Events Not Being Emitted

1. Check server logs: `railway logs --service server`
2. Verify database connection
3. Check PostHog API key
4. Verify event catalog seeded

### Webhooks Not Delivering

1. Check worker logs: `railway logs --service worker`
2. Verify Redis connection
3. Check webhook delivery queue:
   ```bash
   railway run --service worker bun scripts/check-queue.ts
   ```
4. Check webhook endpoint status in database

### High Latency

1. Check database query performance
2. Verify materialized views refreshing
3. Check Redis connection
4. Monitor PostHog API rate limits

### Billing Data Incorrect

1. Check materialized views refreshed:
   ```sql
   SELECT last_refresh FROM pg_stat_user_tables WHERE relname LIKE '%usage%';
   ```
2. Manually refresh views if needed
3. Verify event catalog pricing

### MCP Server Not Responding

1. Check sdk-server logs
2. Verify API key authentication
3. Test with curl:
   ```bash
   curl https://sdk.contentta.com/mcp/sse \
     -H "Authorization: Bearer sk_xxx"
   ```

## Emergency Procedures

### Database Down

1. Check Railway database status
2. Verify connection string in environment
3. Contact Railway support if needed

### Redis Down

1. Webhooks will fail (retry later)
2. Check Railway Redis status
3. Restart worker service after Redis recovers

### High Error Rate

1. Check error logs: `railway logs --service server --follow`
2. Identify error pattern
3. Roll back if recent deployment caused it
4. Apply hotfix if critical

## Performance Tuning

### Optimize Event Ingestion

1. Batch events from SDK (already implemented)
2. Increase database connection pool
3. Add database read replicas if needed

### Optimize Webhook Delivery

1. Increase worker concurrency
2. Tune BullMQ settings
3. Monitor Redis memory usage

### Optimize Billing Queries

1. Ensure materialized views indexed
2. Refresh more frequently if needed
3. Add database indexes for common queries

## Backup and Recovery

### Database Backup

Railway automatically backs up PostgreSQL. To restore:

```bash
railway backup restore <backup-id> --service postgres
```

### Manual Backup

```bash
railway run --service server pg_dump > backup.sql
```

## Monitoring Dashboards

- PostHog: https://posthog.com/project/<project-id>
- Railway: https://railway.app/project/<project-id>
- Database Studio: `bun run db:studio`

## Contact Information

- Railway Support: support@railway.app
- PostHog Support: support@posthog.com
```

**Step 3: Create API quickstart guide**

Create `docs/API_QUICKSTART.md`:

```markdown
# Contentta API Quickstart

## Getting Started

### 1. Create API Key

```typescript
// In dashboard: Settings → API Keys → Create Key
const apiKey = "sk_live_...";
```

### 2. Install SDK

```bash
bun add @contentta/sdk
```

### 3. Initialize Client

```typescript
import { ContenttaClient } from "@contentta/sdk";

const client = new ContenttaClient({
	apiKey: "sk_live_...",
	baseUrl: "https://sdk.contentta.com",
});
```

## Content API

### List Content

```typescript
const posts = await client.content.list();
```

### Get Single Post

```typescript
const post = await client.content.get("post-id");
```

### Create Content (MCP Only)

Use Claude Desktop with MCP:

```json
{
	"mcpServers": {
		"contentta": {
			"command": "bun",
			"args": ["run", "@contentta/mcp"],
			"env": {
				"CONTENTTA_API_KEY": "sk_live_..."
			}
		}
	}
}
```

## Event Tracking

### Track Page Views

```html
<script src="https://cdn.contentta.com/tracker.js"></script>
<script>
	contentta.init("your-api-key");
	contentta.autoTrackPageViews("post-id");
</script>
```

### Track Custom Events

```typescript
import { ContenttaEventTracker } from "@contentta/sdk/events";

const tracker = new ContenttaEventTracker({
	apiKey: "sk_live_...",
});

tracker.track("content.cta.click", {
	contentId: "post-123",
	ctaId: "subscribe-button",
});
```

## Forms

### Embed Form

```html
<div id="contentta-form"></div>

<script src="https://cdn.contentta.com/forms.js"></script>
<script>
	ContenttaForms.embed("form-id", "contentta-form", {
		apiKey: "your-api-key",
	});
</script>
```

## Webhooks

### Subscribe to Events

1. Go to Settings → Webhooks
2. Click "Create Webhook"
3. Enter your endpoint URL
4. Select event patterns: `content.*`, `form.submitted`, etc.
5. Save signing secret

### Verify Webhook Signature

```typescript
import { verifyWebhookSignature } from "@contentta/sdk/webhooks";

const signature = request.headers.get("X-Contentta-Signature");
const payload = await request.text();

const isValid = verifyWebhookSignature(payload, signature, signingSecret);

if (!isValid) {
	return new Response("Invalid signature", { status: 401 });
}
```

## Rate Limits

- SDK API: 1000 requests/minute
- Event ingestion: 10,000 events/second
- Webhook delivery: Best effort with 5 retries

## Pricing

See [Billing Dashboard](https://app.contentta.com/billing) for current usage and pricing.

Free tier:
- 50,000 page views/month
- 100 AI operations/month
- 1,000 form submissions/month

## Support

- Documentation: https://docs.contentta.com
- Email: support@contentta.com
- GitHub Issues: https://github.com/contentta/contentta/issues
```

**Step 4: Verify all documentation**

Run: `cat docs/LAUNCH_CHECKLIST.md docs/RUNBOOK.md docs/API_QUICKSTART.md | wc -l`
Expected: > 400 lines of documentation

**Step 5: Create documentation index**

Create `docs/README.md`:

```markdown
# Contentta Documentation

## Getting Started

- [API Quickstart](./API_QUICKSTART.md) - Start using the Contentta API
- [Launch Checklist](./LAUNCH_CHECKLIST.md) - Production launch guide
- [Production Runbook](./RUNBOOK.md) - Operations and troubleshooting

## Implementation Plans

### Phase 1: Event System
- [Week 1: Event Catalog](./plans/2026-02-05-phase1-week1-event-catalog.md)
- [Week 2: Migration](./plans/2026-02-05-phase1-week2-migration.md)
- [Week 3: Webhooks](./plans/2026-02-05-phase1-week3-webhooks.md)

### Phase 2: SDK Enhancement
- [Weeks 4-5: SDK v2](./plans/2026-02-05-phase2-week4-5-sdk.md)
- [Week 6: MCP Server](./plans/2026-02-05-phase2-week6-mcp.md)

### Phase 3: Platform Features
- [Weeks 7-8: Billing UI](./plans/2026-02-05-phase3-week7-8-billing-ui.md)
- [Weeks 9-10: Forms](./plans/2026-02-05-phase3-week9-10-forms.md)

### Phase 4: Testing & Deployment
- [Weeks 11-12: Testing & Launch](./plans/2026-02-05-phase4-week11-12-testing-deployment.md)

## Architecture

- [Platform Design](./plans/2026-02-05-event-driven-platform-design.md) - Complete system architecture
```

**Step 6: Review documentation for completeness**

Run: `ls -la docs/`
Expected: All documentation files present

**Step 7: Commit documentation**

```bash
git add docs/
git commit -m "$(cat <<'EOF'
docs: add launch checklist, runbook, and API quickstart

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Summary

**Phase 4 Complete!** You now have:

✅ **Week 11: Testing & QA**
- Unit test suite (event emission, webhooks, pattern matching)
- Integration tests (event flow, SDK, MCP)
- Load tests (10K events/sec, webhook delivery, view refresh)

✅ **Week 12: Deployment & Launch**
- Railway configuration and deployment scripts
- Database migrations and event catalog seeding
- Production monitoring (event ingestion, webhook delivery)
- Launch checklist, runbook, and API documentation

**Ready for Production!** Use the launch checklist to deploy to Railway and go live.

---

**Total Implementation: 12 Weeks**
- Phase 1: Event System (3 weeks)
- Phase 2: SDK Enhancement (3 weeks)
- Phase 3: Platform Features (4 weeks)
- Phase 4: Testing & Deployment (2 weeks)

**Next Steps:**
1. Review launch checklist
2. Deploy to Railway staging
3. Run full test suite
4. Deploy to production
5. Monitor metrics for first 24 hours

---

**End of Final Plan**
