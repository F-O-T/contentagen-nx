# Observability & Evals: PostHog Tracing, Scorers per Skill, CI Eval Suite

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Wire Mastra's native observability exporter to PostHog's `$ai_generation`/`$ai_span` LLM Analytics events, add `createScorer` definitions per skill category, run a CI eval suite with `runEvals()`, and enrich customer analytics events with skill-level metadata.

**Architecture:**
- A `PosthogExporter` class (implements Mastra's `ObservabilityExporter` interface) lives in `packages/posthog/src/llm/posthog-exporter.ts` and translates `SPAN_ENDED` events into PostHog `$ai_generation` / `$ai_span` captures.
- Scorers live in `packages/agents/src/mastra/evals/` — one file per skill category (writing, SEO, research, review, frontmatter), each exporting a `createScorer()` instance registered in `mastra.ts`.
- The CI eval suite lives at `packages/agents/src/mastra/evals/__tests__/eval-suite.test.ts` and uses Mastra's `runEvals()` to run the unified agent against test fixtures, asserting scorer thresholds.

**Tech Stack:** `@mastra/core` v1.7 (`createScorer`, `runEvals`, `ObservabilityExporter`, `SpanType`, `TracingEventType`), `posthog-node`, existing `captureAIGeneration` / `captureAISpan` helpers in `@packages/posthog/llm/ai-generation` and `@packages/posthog/llm/ai-span`.

---

## Background Reading (read before starting any task)

- **Mastra observability types** (already installed): `node_modules/@mastra/core/dist/observability/types/tracing.d.ts`
  - Key interfaces: `ObservabilityExporter`, `TracingEvent`, `TracingEventType`, `AnyExportedSpan`, `SpanType`
  - `exportTracingEvent(event)` receives `SPAN_STARTED | SPAN_UPDATED | SPAN_ENDED` — only act on `SPAN_ENDED`.
  - `exportedSpan.type` is `SpanType.MODEL_GENERATION | SpanType.TOOL_CALL | SpanType.AGENT_RUN | ...`
  - `exportedSpan.traceId` — PostHog `$ai_trace_id`
  - `exportedSpan.id` — PostHog `$ai_span_id` (for spans)
  - `exportedSpan.attributes` — type-specific attributes (model, usage, etc.)
  - `exportedSpan.input` / `exportedSpan.output` — raw input/output data
  - `exportedSpan.startTime` / `exportedSpan.endTime` — used to compute `latencySeconds`
  - `exportedSpan.errorInfo` — present when span failed
- **Existing PostHog helpers**: `packages/posthog/src/llm/ai-generation.ts` (`captureAIGeneration`) and `packages/posthog/src/llm/ai-span.ts` (`captureAISpan`)
- **Mastra scorers** (types): `node_modules/@mastra/core/dist/evals/base.d.ts`
  - `createScorer({ id, description, type: "agent" })` → `.analyze(fn)` → `.generateScore(fn)` → `.generateReason(fn)`
  - `ScorerRunInputForAgent` = `{ inputMessages, rememberedMessages, systemMessages, taggedSystemMessages }`
  - `ScorerRunOutputForAgent` = `MastraDBMessage[]` (array of output messages)
  - The `analyze` step receives `{ run: { input, output, groundTruth } }` and returns a `{ score: number, result: Record }`.
  - The `generateScore` step is called after `analyze` and must return a `number` (0–1 or 0–100).
- **runEvals API**: `node_modules/@mastra/core/dist/evals/run/index.d.ts`
  - `runEvals({ data, scorers, target, onItemComplete?, concurrency? }): Promise<RunEvalsResult>`
  - `data` items: `{ input: string | CoreMessage[], groundTruth?, requestContext?, tracingContext? }`
  - `RunEvalsResult = { scores: Record<string, any>, summary: { totalItems: number } }`
- **Mastra Config**: `packages/agents/src/mastra/index.ts` — `new Mastra({ ..., scorers: { ... } })`
  - `scorers` is `Record<string, { scorer: MastraScorer, sampling?: ScoringSamplingConfig }>`
- **PostHog package exports** are declared in `packages/posthog/package.json` — must add new export path `./llm/posthog-exporter`.

---

## Task 1: PosthogExporter — implement the class

**Files:**
- Create: `packages/posthog/src/llm/posthog-exporter.ts`

**Context:**
The exporter implements the `ObservabilityExporter` interface from `@mastra/core/observability`. It receives span events after each span ends and maps them to PostHog events:
- `SpanType.MODEL_GENERATION` → `captureAIGeneration` (PostHog `$ai_generation`)
- `SpanType.TOOL_CALL` → `captureAISpan` (PostHog `$ai_span`)
- All other span types (AGENT_RUN, WORKFLOW_*, etc.) → ignored (too noisy, low value)

`distinctId` is extracted from `exportedSpan.metadata?.userId` (set via request context) — fall back to `exportedSpan.entityId ?? "anonymous"`.

**Step 1: Write the failing tests**

Create `packages/posthog/src/__tests__/posthog-exporter.test.ts`:

```typescript
import { describe, expect, mock, test } from "bun:test";
import type { CaptureAIGenerationParams } from "../llm/ai-generation";
import type { CaptureAISpanParams } from "../llm/ai-span";

// ── Mocks ──────────────────────────────────────────────────────────────────
const capturedGenerations: CaptureAIGenerationParams[] = [];
const capturedSpans: CaptureAISpanParams[] = [];

mock.module("../llm/ai-generation", () => ({
  captureAIGeneration: (params: CaptureAIGenerationParams) => {
    capturedGenerations.push(params);
  },
}));

mock.module("../llm/ai-span", () => ({
  captureAISpan: (params: CaptureAISpanParams) => {
    capturedSpans.push(params);
  },
}));

// ── Helpers ────────────────────────────────────────────────────────────────
function makePosthog() {
  return {
    capture: mock(() => {}),
  } as any;
}

function makeModelGenerationSpan(overrides: Record<string, unknown> = {}) {
  const now = new Date();
  const then = new Date(now.getTime() - 1200);
  return {
    type: "model_generation",
    id: "span-abc",
    traceId: "trace-xyz",
    name: "model-generation",
    entityId: "unified-content-agent",
    startTime: then,
    endTime: now,
    isRootSpan: false,
    parentSpanId: "parent-1",
    isEvent: false,
    attributes: {
      model: "openrouter/x-ai/grok-4.1-fast",
      provider: "openrouter",
      usage: { inputTokens: 100, outputTokens: 200 },
      streaming: true,
    },
    input: [{ role: "user", content: "Write about TypeScript" }],
    output: { text: "TypeScript is..." },
    metadata: { userId: "user-123" },
    ...overrides,
  } as any;
}

function makeToolCallSpan(overrides: Record<string, unknown> = {}) {
  const now = new Date();
  const then = new Date(now.getTime() - 500);
  return {
    type: "tool_call",
    id: "span-tool-1",
    traceId: "trace-xyz",
    name: "webSearch",
    entityId: "unified-content-agent",
    startTime: then,
    endTime: now,
    isRootSpan: false,
    parentSpanId: "span-abc",
    isEvent: false,
    attributes: { success: true },
    input: { query: "TypeScript generics" },
    output: { results: [] },
    metadata: { userId: "user-123" },
    ...overrides,
  } as any;
}

function makeSpanEndedEvent(exportedSpan: any) {
  return { type: "span_ended" as const, exportedSpan };
}

// ── Tests ──────────────────────────────────────────────────────────────────
import { PosthogExporter } from "../llm/posthog-exporter";

describe("PosthogExporter", () => {
  test("ignores SPAN_STARTED events", async () => {
    capturedGenerations.length = 0;
    const exporter = new PosthogExporter(makePosthog(), "user-fallback");
    await exporter.exportTracingEvent({
      type: "span_started" as any,
      exportedSpan: makeModelGenerationSpan(),
    });
    expect(capturedGenerations.length).toBe(0);
  });

  test("captures $ai_generation for MODEL_GENERATION span", async () => {
    capturedGenerations.length = 0;
    const exporter = new PosthogExporter(makePosthog(), "user-fallback");
    const span = makeModelGenerationSpan();
    await exporter.exportTracingEvent(makeSpanEndedEvent(span));

    expect(capturedGenerations.length).toBe(1);
    const gen = capturedGenerations[0];
    expect(gen.distinctId).toBe("user-123");
    expect(gen.traceId).toBe("trace-xyz");
    expect(gen.model).toBe("openrouter/x-ai/grok-4.1-fast");
    expect(gen.inputTokens).toBe(100);
    expect(gen.outputTokens).toBe(200);
    expect(gen.latencySeconds).toBeGreaterThan(0);
    expect(gen.latencySeconds).toBeLessThan(5);
  });

  test("falls back to entityId when userId not in metadata", async () => {
    capturedGenerations.length = 0;
    const exporter = new PosthogExporter(makePosthog(), "user-fallback");
    const span = makeModelGenerationSpan({ metadata: {} });
    await exporter.exportTracingEvent(makeSpanEndedEvent(span));
    expect(capturedGenerations[0].distinctId).toBe("unified-content-agent");
  });

  test("falls back to constructor fallback when no entityId", async () => {
    capturedGenerations.length = 0;
    const exporter = new PosthogExporter(makePosthog(), "user-fallback");
    const span = makeModelGenerationSpan({ metadata: {}, entityId: undefined });
    await exporter.exportTracingEvent(makeSpanEndedEvent(span));
    expect(capturedGenerations[0].distinctId).toBe("user-fallback");
  });

  test("captures $ai_span for TOOL_CALL span", async () => {
    capturedSpans.length = 0;
    const exporter = new PosthogExporter(makePosthog(), "user-fallback");
    const span = makeToolCallSpan();
    await exporter.exportTracingEvent(makeSpanEndedEvent(span));

    expect(capturedSpans.length).toBe(1);
    const s = capturedSpans[0];
    expect(s.traceId).toBe("trace-xyz");
    expect(s.spanName).toBe("webSearch");
    expect(s.durationSeconds).toBeGreaterThan(0);
    expect(s.isError).toBe(false);
  });

  test("marks span as error when errorInfo present", async () => {
    capturedSpans.length = 0;
    const exporter = new PosthogExporter(makePosthog(), "user-fallback");
    const span = makeToolCallSpan({ errorInfo: { message: "Tool failed" } });
    await exporter.exportTracingEvent(makeSpanEndedEvent(span));

    expect(capturedSpans[0].isError).toBe(true);
    expect(capturedSpans[0].errorMessage).toBe("Tool failed");
  });

  test("ignores AGENT_RUN span type", async () => {
    capturedGenerations.length = 0;
    capturedSpans.length = 0;
    const exporter = new PosthogExporter(makePosthog(), "user-fallback");
    const span = makeModelGenerationSpan({ type: "agent_run" });
    await exporter.exportTracingEvent(makeSpanEndedEvent(span));
    expect(capturedGenerations.length).toBe(0);
    expect(capturedSpans.length).toBe(0);
  });

  test("flush() resolves without error", async () => {
    const exporter = new PosthogExporter(makePosthog(), "user-fallback");
    await expect(exporter.flush()).resolves.toBeUndefined();
  });

  test("shutdown() resolves without error", async () => {
    const exporter = new PosthogExporter(makePosthog(), "user-fallback");
    await expect(exporter.shutdown()).resolves.toBeUndefined();
  });
});
```

**Step 2: Run tests to verify they fail**

```bash
cd /home/yorizel/Documents/contentta-nx
npx vitest run packages/posthog/src/__tests__/posthog-exporter.test.ts --reporter=verbose 2>&1 | tail -20
```

Expected: FAIL with "Cannot find module ../llm/posthog-exporter"

**Step 3: Implement `PosthogExporter`**

Create `packages/posthog/src/llm/posthog-exporter.ts`:

```typescript
/**
 * PosthogExporter
 *
 * Implements Mastra's ObservabilityExporter interface to forward agent traces
 * to PostHog's LLM Analytics via $ai_generation and $ai_span events.
 *
 * Only SPAN_ENDED events are exported — SPAN_STARTED and SPAN_UPDATED are ignored.
 * Only MODEL_GENERATION and TOOL_CALL span types are captured — all others are skipped.
 */
import type { PostHog } from "posthog-node";
import type {
  ObservabilityExporter,
  TracingEvent,
} from "@mastra/core/observability";
import { captureAIGeneration } from "./ai-generation";
import { captureAISpan } from "./ai-span";

export class PosthogExporter implements ObservabilityExporter {
  readonly name = "posthog";

  constructor(
    private readonly posthog: PostHog,
    /** Fallback distinctId when span metadata has no userId and entityId is absent */
    private readonly fallbackDistinctId: string,
  ) {}

  async exportTracingEvent(event: TracingEvent): Promise<void> {
    if (event.type !== "span_ended") return;

    const span = event.exportedSpan;
    const distinctId =
      (span.metadata?.userId as string | undefined) ??
      span.entityId ??
      this.fallbackDistinctId;

    const durationSeconds =
      span.endTime && span.startTime
        ? (span.endTime.getTime() - span.startTime.getTime()) / 1000
        : 0;

    if (span.type === "model_generation") {
      const attrs = span.attributes as
        | {
            model?: string;
            provider?: string;
            usage?: { inputTokens?: number; outputTokens?: number };
            streaming?: boolean;
          }
        | undefined;

      const inputMessages = Array.isArray(span.input)
        ? (span.input as Array<{ role: string; content: string }>)
        : [];

      const outputContent =
        typeof span.output === "string"
          ? span.output
          : (span.output as { text?: string })?.text ?? "";

      captureAIGeneration({
        posthog: this.posthog,
        distinctId,
        traceId: span.traceId,
        model: attrs?.model ?? "unknown",
        provider: attrs?.provider ?? "openrouter",
        input: inputMessages,
        outputChoices: [{ role: "assistant", content: outputContent }],
        inputTokens: attrs?.usage?.inputTokens ?? 0,
        outputTokens: attrs?.usage?.outputTokens ?? 0,
        latencySeconds: durationSeconds,
        isError: !!span.errorInfo,
        agentId: span.entityId,
      });
      return;
    }

    if (span.type === "tool_call") {
      captureAISpan({
        posthog: this.posthog,
        distinctId,
        traceId: span.traceId,
        spanName: span.name,
        spanKind: "tool_execution",
        input: span.input as Record<string, unknown> | undefined,
        output: span.output,
        durationSeconds,
        isError: !!span.errorInfo,
        errorMessage:
          (span.errorInfo as { message?: string } | undefined)?.message,
      });
    }

    // All other span types (AGENT_RUN, WORKFLOW_*, MODEL_STEP, MODEL_CHUNK, etc.)
    // are intentionally ignored — too noisy, low analytics value.
  }

  async flush(): Promise<void> {
    // posthog-node flushes on its own schedule; nothing to do here.
  }

  async shutdown(): Promise<void> {
    // Shutdown is managed by the top-level posthog instance, not per-exporter.
  }
}
```

**Step 4: Add export path to `packages/posthog/package.json`**

Add to `"exports"` block (before the closing `}`):

```json
"./llm/posthog-exporter": {
  "default": "./src/llm/posthog-exporter.ts",
  "types": "./dist/src/llm/posthog-exporter.d.ts"
}
```

**Step 5: Run tests to verify they pass**

```bash
cd /home/yorizel/Documents/contentta-nx
npx vitest run packages/posthog/src/__tests__/posthog-exporter.test.ts --reporter=verbose 2>&1 | tail -20
```

Expected: All 8 tests PASS.

**Step 6: Commit**

```bash
cd /home/yorizel/Documents/contentta-nx
git add packages/posthog/src/llm/posthog-exporter.ts packages/posthog/src/__tests__/posthog-exporter.test.ts packages/posthog/package.json
git commit -m "feat(posthog): add PosthogExporter implementing Mastra ObservabilityExporter"
```

---

## Task 2: Wire PosthogExporter into Mastra observability

**Files:**
- Modify: `packages/agents/src/mastra/index.ts`
- Modify: `packages/agents/package.json` (add `@packages/posthog` dependency)

**Context:**
`@mastra/observability` (the full observability package) is NOT installed — only `@mastra/core` is. The `Mastra` constructor accepts an `observability` option typed as `ObservabilityEntrypoint`. However, since `@mastra/observability` is not installed we cannot use it to create a full `Observability` instance.

Instead, we'll use a simpler approach: pass the `PosthogExporter` directly to the storage-based `ObservabilityEntrypoint` through the no-op observability (`NoOpObservability`) by registering the exporter. Looking at the Mastra source — the exporter is registered on an `ObservabilityInstance`. But since full observability package is absent, we'll use the approach of attaching the exporter directly.

Actually — the correct approach given the constraints: Mastra's `telemetry` key was removed in v1. The `observability` key in `Config` takes an `ObservabilityEntrypoint`. Rather than pulling in `@mastra/observability`, we register our `PosthogExporter` differently: we create a thin adapter using `NoOpObservability` from `@mastra/core/observability` and register our exporter on the default instance after construction.

**Check if `@mastra/observability` is needed or if NoOpObservability suffices:**

```bash
cat /home/yorizel/Documents/contentta-nx/node_modules/@mastra/core/dist/observability/no-op.d.ts
```

`NoOpObservability` implements `ObservabilityEntrypoint` but does nothing — spans never reach exporters. The only way to get spans to a custom exporter without `@mastra/observability` is to install it or create a custom implementation.

**Decision:** Install `@mastra/observability` as a dev/peer dependency since it implements the full `ObservabilityEntrypoint` with real span lifecycle management. Check if it's available:

```bash
cat /home/yorizel/Documents/contentta-nx/bun.lockb | strings | grep "@mastra/observability" 2>/dev/null | head -3 || echo "not found"
cat /home/yorizel/Documents/contentta-nx/package.json | grep -A3 "catalog\|mastra" | head -20
```

If the `catalog:mastra` entry does not include `@mastra/observability`, add it to the workspace catalog before installing.

**Step 1: Check what's in the mastra catalog**

```bash
cat /home/yorizel/Documents/contentta-nx/package.json | python3 -c "import json,sys; d=json.load(sys.stdin); print(json.dumps(d.get('pnpm',{}).get('catalog',{}), indent=2))" 2>/dev/null || cat /home/yorizel/Documents/contentta-nx/package.json | grep -A 30 '"catalog"'
```

**Step 2: Add `@mastra/observability` to the workspace catalog if not present**

In `package.json`, under `pnpm.catalog` or `bun.workspaces.catalog` (check which format is used), add:

```json
"@mastra/observability": "^1.7.0"
```

Match the version to the installed `@mastra/core` version (1.7.0).

**Step 3: Add dependency to agents package**

In `packages/agents/package.json`, add to `"dependencies"`:

```json
"@mastra/observability": "catalog:mastra",
"@packages/posthog": "workspace:*"
```

**Step 4: Install**

```bash
cd /home/yorizel/Documents/contentta-nx
bun install
```

Verify:
```bash
ls node_modules/@mastra/observability 2>/dev/null && echo "installed" || echo "not installed"
```

**Step 5: Write failing test for mastra observability wiring**

Add to `packages/agents/src/__tests__/workspace-mocks.ts` an additional mock for `@mastra/observability`:

```typescript
mock.module("@mastra/observability", () => ({
  Observability: class {
    constructor() {}
  },
}));
```

Then create `packages/agents/src/__tests__/observability-wiring.test.ts`:

```typescript
import { describe, expect, mock, test } from "bun:test";

// Preload handles: @packages/environment/server, @mastra/pg, ../utils, @mastra/core/mastra
// We additionally mock agents and posthog exporter
mock.module("../mastra/agents/fim-agent", () => ({ fimAgent: {} }));
mock.module("../mastra/agents/inline-edit-agent", () => ({ inlineEditAgent: {} }));
mock.module("../mastra/agents/unified-content-agent", () => ({ unifiedContentAgent: {} }));
mock.module("@packages/posthog/llm/posthog-exporter", () => ({
  PosthogExporter: class {
    constructor() {}
    name = "posthog";
  },
}));
mock.module("@packages/posthog/server", () => ({
  getElysiaPosthogConfig: () => ({ capture: mock(() => {}) }),
}));
mock.module("@mastra/observability", () => ({
  Observability: class {
    constructor(public config: unknown) {}
  },
}));

import { mastra } from "../mastra/index";

describe("Mastra observability wiring", () => {
  test("mastra instance is defined", () => {
    expect(mastra).toBeDefined();
  });
});
```

**Step 6: Run failing test**

```bash
cd /home/yorizel/Documents/contentta-nx
npx vitest run packages/agents/src/__tests__/observability-wiring.test.ts --reporter=verbose 2>&1 | tail -20
```

**Step 7: Modify `packages/agents/src/mastra/index.ts` to wire PosthogExporter**

Add imports and observability config at the top:

```typescript
import { Observability } from "@mastra/observability";
import { PosthogExporter } from "@packages/posthog/llm/posthog-exporter";
import { getElysiaPosthogConfig } from "@packages/posthog/server";
```

Create the posthog instance and exporter:

```typescript
const posthogInstance = getElysiaPosthogConfig({
  POSTHOG_HOST: serverEnv.POSTHOG_HOST,
  POSTHOG_KEY: serverEnv.POSTHOG_KEY,
});

const mastraObservability = new Observability({
  configs: {
    default: {
      serviceName: "contentta-agents",
      exporters: [new PosthogExporter(posthogInstance, "anonymous")],
    },
  },
});
```

Add `observability: mastraObservability` to the `Mastra` constructor config.

Full updated constructor call:

```typescript
export const mastra: Mastra = new Mastra({
  agents: {
    unifiedContent: unifiedContentAgent,
    fimAgent,
    inlineEditAgent,
  },
  vectors: { pgVector: pgVectorStore },
  storage: mastraStorage,
  workspace,
  observability: mastraObservability,
});
```

**Step 8: Run tests**

```bash
cd /home/yorizel/Documents/contentta-nx
npx vitest run packages/agents/src/__tests__/observability-wiring.test.ts --reporter=verbose 2>&1 | tail -20
```

Also run all agents tests to make sure nothing broke:

```bash
cd /home/yorizel/Documents/contentta-nx
npx vitest run packages/agents --reporter=verbose 2>&1 | tail -30
```

Expected: All pass.

**Step 9: Commit**

```bash
cd /home/yorizel/Documents/contentta-nx
git add packages/agents/src/mastra/index.ts packages/agents/package.json packages/agents/src/__tests__/workspace-mocks.ts packages/agents/src/__tests__/observability-wiring.test.ts
git commit -m "feat(agents): wire PosthogExporter into Mastra observability"
```

---

## Task 3: Scorers — writing quality scorer

**Files:**
- Create: `packages/agents/src/mastra/evals/writing-quality-scorer.ts`
- Create: `packages/agents/src/mastra/evals/__tests__/writing-quality-scorer.test.ts`

**Context:**
Scorers use `createScorer` with `type: "agent"` to receive `ScorerRunInputForAgent` (the conversation messages) and `ScorerRunOutputForAgent` (the agent's output messages). The `analyze` step examines the output and returns a `{ score: number, result: Record }`. The `generateScore` step then extracts the final 0–1 number.

Writing quality scorer checks:
- Output contains YAML frontmatter (has `---` at top): +0.25
- Output length ≥ 400 characters: +0.25 (full content, not stub)
- Contains at least one markdown heading (`##` or `###`): +0.25
- Does not contain AI-sounding filler phrases ("It's important to note", "In conclusion", "As we can see"): +0.25

Score range: 0.0 – 1.0 (4 binary checks, each worth 0.25)

**Step 1: Write the failing test**

Create `packages/agents/src/mastra/evals/__tests__/writing-quality-scorer.test.ts`:

```typescript
import { describe, expect, test } from "bun:test";
import { writingQualityScorer } from "../writing-quality-scorer";
import type { ScorerRunInputForAgent, ScorerRunOutputForAgent } from "@mastra/core/evals";

function makeAgentInput(): ScorerRunInputForAgent {
  return {
    inputMessages: [{ role: "user", content: "Write an article about TypeScript generics", id: "1", threadId: "t1", resourceId: "r1", createdAt: new Date(), type: "text" }],
    rememberedMessages: [],
    systemMessages: [],
    taggedSystemMessages: {},
  } as any;
}

function makeOutput(text: string): ScorerRunOutputForAgent {
  return [{ role: "assistant", content: text, id: "2", threadId: "t1", resourceId: "r1", createdAt: new Date(), type: "text" }] as any;
}

const GOOD_ARTICLE = `---
title: "Understanding TypeScript Generics"
description: "A deep dive into TypeScript generics"
slug: "typescript-generics"
keywords: ["typescript", "generics"]
---

## What are TypeScript Generics?

TypeScript generics allow you to write flexible, reusable code that works with any type.
They are one of the most powerful features in the TypeScript type system.

### Basic Generic Functions

Generic functions are defined with angle bracket syntax: \`function identity<T>(arg: T): T\`

This enables type-safe operations across many different data types without code duplication.

## Advanced Generic Patterns

Constraints, conditional types, and mapped types extend generics into extremely powerful patterns.
`.repeat(3);

const POOR_ARTICLE = `It's important to note that generics are useful. In conclusion, as we can see, they help.`;

describe("writingQualityScorer", () => {
  test("scorer has correct id", () => {
    expect(writingQualityScorer.id).toBe("writing-quality");
  });

  test("scores high-quality article near 1.0", async () => {
    const result = await writingQualityScorer.run({
      input: makeAgentInput(),
      output: makeOutput(GOOD_ARTICLE),
    });
    expect(result.score).toBeGreaterThanOrEqual(0.75);
  });

  test("scores poor article near 0.0", async () => {
    const result = await writingQualityScorer.run({
      input: makeAgentInput(),
      output: makeOutput(POOR_ARTICLE),
    });
    expect(result.score).toBeLessThanOrEqual(0.5);
  });

  test("empty output gets score 0", async () => {
    const result = await writingQualityScorer.run({
      input: makeAgentInput(),
      output: makeOutput(""),
    });
    expect(result.score).toBe(0);
  });
});
```

**Step 2: Run test to verify failure**

```bash
cd /home/yorizel/Documents/contentta-nx
npx vitest run packages/agents/src/mastra/evals/__tests__/writing-quality-scorer.test.ts --reporter=verbose 2>&1 | tail -20
```

Expected: FAIL — cannot find module.

**Step 3: Implement scorer**

Create `packages/agents/src/mastra/evals/writing-quality-scorer.ts`:

```typescript
import { createScorer } from "@mastra/core/evals";
import type {
  ScorerRunInputForAgent,
  ScorerRunOutputForAgent,
} from "@mastra/core/evals";

/**
 * Writing Quality Scorer
 *
 * Evaluates the structural quality of content output on 4 criteria:
 *   1. Has YAML frontmatter (starts with "---")
 *   2. Minimum length (≥ 400 characters)
 *   3. Contains markdown headings (## or ###)
 *   4. Avoids AI-sounding filler phrases
 *
 * Score: 0.0 – 1.0 (each criterion worth 0.25)
 */

const AI_FILLER_PATTERNS = [
  /it'?s important to note/i,
  /in conclusion/i,
  /as we can see/i,
  /it is worth noting/i,
  /needless to say/i,
  /at the end of the day/i,
  /when all is said and done/i,
  /to summarize/i,
];

export const writingQualityScorer = createScorer<
  "writing-quality",
  ScorerRunInputForAgent,
  ScorerRunOutputForAgent
>({
  id: "writing-quality",
  description:
    "Evaluates writing quality: frontmatter, length, headings, and absence of AI filler",
  type: "agent",
})
  .analyze(({ run }) => {
    const outputMessages = run.output;
    const text = outputMessages
      .map((m) =>
        typeof m.content === "string"
          ? m.content
          : Array.isArray(m.content)
            ? m.content
                .filter((c: { type: string }) => c.type === "text")
                .map((c: { text: string }) => c.text)
                .join("")
            : "",
      )
      .join("\n");

    const hasFrontmatter = text.trimStart().startsWith("---");
    const hasMinLength = text.length >= 400;
    const hasHeadings = /^#{2,3}\s/m.test(text);
    const hasFillerPhrases = AI_FILLER_PATTERNS.some((re) => re.test(text));

    return {
      score: 0, // overridden in generateScore
      result: {
        hasFrontmatter,
        hasMinLength,
        hasHeadings,
        hasFillerPhrases,
        textLength: text.length,
      },
    };
  })
  .generateScore(({ results }) => {
    const r = results.analyzeStepResult as {
      hasFrontmatter: boolean;
      hasMinLength: boolean;
      hasHeadings: boolean;
      hasFillerPhrases: boolean;
    };
    if (!r) return 0;

    let score = 0;
    if (r.hasFrontmatter) score += 0.25;
    if (r.hasMinLength) score += 0.25;
    if (r.hasHeadings) score += 0.25;
    if (!r.hasFillerPhrases) score += 0.25;
    return score;
  });
```

**Step 4: Run tests**

```bash
cd /home/yorizel/Documents/contentta-nx
npx vitest run packages/agents/src/mastra/evals/__tests__/writing-quality-scorer.test.ts --reporter=verbose 2>&1 | tail -20
```

Expected: All 4 tests PASS.

**Step 5: Commit**

```bash
cd /home/yorizel/Documents/contentta-nx
git add packages/agents/src/mastra/evals/writing-quality-scorer.ts packages/agents/src/mastra/evals/__tests__/writing-quality-scorer.test.ts
git commit -m "feat(agents): add writing quality scorer"
```

---

## Task 4: Scorers — SEO quality scorer

**Files:**
- Create: `packages/agents/src/mastra/evals/seo-quality-scorer.ts`
- Create: `packages/agents/src/mastra/evals/__tests__/seo-quality-scorer.test.ts`

**Context:**
SEO scorer checks: title present in frontmatter, description present, slug present, keywords array present and non-empty, keywords mentioned in body text. Each check worth 0.2.

**Step 1: Write the failing test**

Create `packages/agents/src/mastra/evals/__tests__/seo-quality-scorer.test.ts`:

```typescript
import { describe, expect, test } from "bun:test";
import { seoQualityScorer } from "../seo-quality-scorer";

function makeOutput(text: string) {
  return [{ role: "assistant", content: text, id: "1", threadId: "t1", resourceId: "r1", createdAt: new Date(), type: "text" }] as any;
}

const GOOD_SEO = `---
title: "TypeScript Generics Guide"
description: "Learn TypeScript generics from scratch"
slug: "typescript-generics-guide"
keywords: ["typescript", "generics", "types"]
---

## TypeScript generics are powerful

The typescript keyword and generics system are central to type safety.
`;

const POOR_SEO = `Just some text without any frontmatter or SEO optimization at all.`;

describe("seoQualityScorer", () => {
  test("scorer has correct id", () => {
    expect(seoQualityScorer.id).toBe("seo-quality");
  });

  test("scores well-structured SEO content near 1.0", async () => {
    const result = await seoQualityScorer.run({
      input: {} as any,
      output: makeOutput(GOOD_SEO),
    });
    expect(result.score).toBeGreaterThanOrEqual(0.8);
  });

  test("scores poor SEO content near 0.0", async () => {
    const result = await seoQualityScorer.run({
      input: {} as any,
      output: makeOutput(POOR_SEO),
    });
    expect(result.score).toBeLessThanOrEqual(0.2);
  });
});
```

**Step 2: Run test to verify failure**

```bash
cd /home/yorizel/Documents/contentta-nx
npx vitest run packages/agents/src/mastra/evals/__tests__/seo-quality-scorer.test.ts --reporter=verbose 2>&1 | tail -10
```

**Step 3: Implement scorer**

Create `packages/agents/src/mastra/evals/seo-quality-scorer.ts`:

```typescript
import { createScorer } from "@mastra/core/evals";
import type {
  ScorerRunInputForAgent,
  ScorerRunOutputForAgent,
} from "@mastra/core/evals";

/**
 * SEO Quality Scorer
 *
 * Evaluates SEO metadata completeness on 5 criteria:
 *   1. Has frontmatter `title:`
 *   2. Has frontmatter `description:`
 *   3. Has frontmatter `slug:` (lowercase hyphenated)
 *   4. Has frontmatter `keywords:` array (at least 1 keyword)
 *   5. At least one keyword appears in the body text
 *
 * Score: 0.0 – 1.0 (each criterion worth 0.2)
 */

function extractText(output: ScorerRunOutputForAgent): string {
  return output
    .map((m) =>
      typeof m.content === "string"
        ? m.content
        : Array.isArray(m.content)
          ? m.content
              .filter((c: { type: string }) => c.type === "text")
              .map((c: { text: string }) => c.text)
              .join("")
          : "",
    )
    .join("\n");
}

function extractFrontmatter(text: string): Record<string, string> | null {
  const match = text.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return null;
  const block = match[1];
  const result: Record<string, string> = {};
  for (const line of block.split("\n")) {
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    result[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
  }
  return result;
}

export const seoQualityScorer = createScorer<
  "seo-quality",
  ScorerRunInputForAgent,
  ScorerRunOutputForAgent
>({
  id: "seo-quality",
  description:
    "Evaluates SEO metadata completeness: title, description, slug, keywords, and keyword usage",
  type: "agent",
})
  .analyze(({ run }) => {
    const text = extractText(run.output);
    const fm = extractFrontmatter(text);

    const hasTitle = !!fm?.title && fm.title.length > 0;
    const hasDescription = !!fm?.description && fm.description.length > 0;
    const hasSlug =
      !!fm?.slug && /^[a-z0-9-]+$/.test(fm.slug.replace(/^"(.*)"$/, "$1"));
    const keywordsRaw = fm?.keywords ?? "";
    const keywords = keywordsRaw
      .replace(/[\[\]"]/g, "")
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean);
    const hasKeywords = keywords.length > 0;

    const bodyText = text.replace(/^---[\s\S]*?---/, "").toLowerCase();
    const keywordsInBody =
      hasKeywords &&
      keywords.some((kw) => bodyText.includes(kw.toLowerCase()));

    return {
      score: 0,
      result: { hasTitle, hasDescription, hasSlug, hasKeywords, keywordsInBody },
    };
  })
  .generateScore(({ results }) => {
    const r = results.analyzeStepResult as {
      hasTitle: boolean;
      hasDescription: boolean;
      hasSlug: boolean;
      hasKeywords: boolean;
      keywordsInBody: boolean;
    };
    if (!r) return 0;

    let score = 0;
    if (r.hasTitle) score += 0.2;
    if (r.hasDescription) score += 0.2;
    if (r.hasSlug) score += 0.2;
    if (r.hasKeywords) score += 0.2;
    if (r.keywordsInBody) score += 0.2;
    return score;
  });
```

**Step 4: Run tests**

```bash
cd /home/yorizel/Documents/contentta-nx
npx vitest run packages/agents/src/mastra/evals/__tests__/seo-quality-scorer.test.ts --reporter=verbose 2>&1 | tail -10
```

Expected: All 3 tests PASS.

**Step 5: Commit**

```bash
cd /home/yorizel/Documents/contentta-nx
git add packages/agents/src/mastra/evals/seo-quality-scorer.ts packages/agents/src/mastra/evals/__tests__/seo-quality-scorer.test.ts
git commit -m "feat(agents): add SEO quality scorer"
```

---

## Task 5: Scorers — research completeness scorer

**Files:**
- Create: `packages/agents/src/mastra/evals/research-completeness-scorer.ts`
- Create: `packages/agents/src/mastra/evals/__tests__/research-completeness-scorer.test.ts`

**Context:**
Research completeness scorer examines whether the agent actually invoked research tools during its run. It checks the `inputMessages` for tool-call/tool-result traces OR checks the output text for research-indicating patterns (URLs, statistics like "X%", named sources, comparative statements).

Checks (each 0.2):
1. Output text contains at least one external URL reference
2. Output contains at least one statistic (number followed by % or "million"/"billion")
3. Output references at least one named source/organization
4. Output mentions competitors or alternatives (pattern: "vs", "compared to", "alternative")
5. Output length ≥ 600 chars (research should be substantive)

**Step 1: Write the failing test**

```typescript
// packages/agents/src/mastra/evals/__tests__/research-completeness-scorer.test.ts
import { describe, expect, test } from "bun:test";
import { researchCompletenessScorer } from "../research-completeness-scorer";

function makeOutput(text: string) {
  return [{ role: "assistant", content: text, id: "1", threadId: "t1", resourceId: "r1", createdAt: new Date(), type: "text" }] as any;
}

const GOOD_RESEARCH = `
## Research Summary

According to a study by Google (https://research.google.com/study), TypeScript adoption
has grown by 47% in the last year. Microsoft and JetBrains both report strong developer
satisfaction scores compared to plain JavaScript alternatives. This is a major shift vs
the 2019 landscape.

Stack Overflow's 2024 survey shows 78% of developers prefer TypeScript.
Research by ThoughtWorks confirms these findings.

TypeScript vs JavaScript: the comparison shows TypeScript wins on maintainability.
The alternative solutions include Flow and JSDoc, which are compared to TypeScript
in terms of type safety. The data represents over 90,000 developers surveyed globally.
`.repeat(2);

const POOR_RESEARCH = `TypeScript is good for large projects.`;

describe("researchCompletenessScorer", () => {
  test("scorer has correct id", () => {
    expect(researchCompletenessScorer.id).toBe("research-completeness");
  });

  test("scores thorough research near 1.0", async () => {
    const result = await researchCompletenessScorer.run({
      input: {} as any,
      output: makeOutput(GOOD_RESEARCH),
    });
    expect(result.score).toBeGreaterThanOrEqual(0.8);
  });

  test("scores thin research near 0.0", async () => {
    const result = await researchCompletenessScorer.run({
      input: {} as any,
      output: makeOutput(POOR_RESEARCH),
    });
    expect(result.score).toBeLessThanOrEqual(0.2);
  });
});
```

**Step 2: Run test to verify failure**

```bash
cd /home/yorizel/Documents/contentta-nx
npx vitest run packages/agents/src/mastra/evals/__tests__/research-completeness-scorer.test.ts --reporter=verbose 2>&1 | tail -10
```

**Step 3: Implement scorer**

```typescript
// packages/agents/src/mastra/evals/research-completeness-scorer.ts
import { createScorer } from "@mastra/core/evals";
import type {
  ScorerRunInputForAgent,
  ScorerRunOutputForAgent,
} from "@mastra/core/evals";

function extractText(output: ScorerRunOutputForAgent): string {
  return output
    .map((m) =>
      typeof m.content === "string"
        ? m.content
        : Array.isArray(m.content)
          ? m.content
              .filter((c: { type: string }) => c.type === "text")
              .map((c: { text: string }) => c.text)
              .join("")
          : "",
    )
    .join("\n");
}

export const researchCompletenessScorer = createScorer<
  "research-completeness",
  ScorerRunInputForAgent,
  ScorerRunOutputForAgent
>({
  id: "research-completeness",
  description:
    "Evaluates research quality: URL citations, statistics, named sources, comparisons, and depth",
  type: "agent",
})
  .analyze(({ run }) => {
    const text = extractText(run.output);

    const hasUrls = /https?:\/\/\S+/.test(text);
    const hasStats = /\d+\s*%|\d+\s*(million|billion|thousand)/i.test(text);
    const hasNamedSources =
      /according to|report by|study by|survey by|research by/i.test(text);
    const hasComparisons = /\bvs\.?\b|compared to|alternative|versus/i.test(text);
    const isSubstantive = text.length >= 600;

    return {
      score: 0,
      result: { hasUrls, hasStats, hasNamedSources, hasComparisons, isSubstantive },
    };
  })
  .generateScore(({ results }) => {
    const r = results.analyzeStepResult as {
      hasUrls: boolean;
      hasStats: boolean;
      hasNamedSources: boolean;
      hasComparisons: boolean;
      isSubstantive: boolean;
    };
    if (!r) return 0;

    let score = 0;
    if (r.hasUrls) score += 0.2;
    if (r.hasStats) score += 0.2;
    if (r.hasNamedSources) score += 0.2;
    if (r.hasComparisons) score += 0.2;
    if (r.isSubstantive) score += 0.2;
    return score;
  });
```

**Step 4: Run tests**

```bash
cd /home/yorizel/Documents/contentta-nx
npx vitest run packages/agents/src/mastra/evals/__tests__/research-completeness-scorer.test.ts --reporter=verbose 2>&1 | tail -10
```

Expected: All 3 tests PASS.

**Step 5: Commit**

```bash
cd /home/yorizel/Documents/contentta-nx
git add packages/agents/src/mastra/evals/research-completeness-scorer.ts packages/agents/src/mastra/evals/__tests__/research-completeness-scorer.test.ts
git commit -m "feat(agents): add research completeness scorer"
```

---

## Task 6: Register scorers in Mastra

**Files:**
- Create: `packages/agents/src/mastra/evals/index.ts`
- Modify: `packages/agents/src/mastra/index.ts`

**Context:**
Mastra's `Config.scorers` is `Record<string, { scorer: MastraScorer, sampling?: ScoringSamplingConfig }>`. We register all three scorers with `sampling: { type: "ratio", rate: 0.1 }` — 10% sampling in production to avoid PostHog event spam.

**Step 1: Create evals index**

Create `packages/agents/src/mastra/evals/index.ts`:

```typescript
export { writingQualityScorer } from "./writing-quality-scorer";
export { seoQualityScorer } from "./seo-quality-scorer";
export { researchCompletenessScorer } from "./research-completeness-scorer";
```

**Step 2: Write test for scorer registration**

Add to `packages/agents/src/__tests__/observability-wiring.test.ts` (within the existing describe):

```typescript
test("mastra agents are accessible", () => {
  // If scorers weren't registered, mastra construction would still succeed
  // — just verify the instance shape is intact.
  expect(typeof mastra.getAgent).toBe("function");
});
```

**Step 3: Modify `packages/agents/src/mastra/index.ts` to register scorers**

Add imports:

```typescript
import { writingQualityScorer } from "./evals/writing-quality-scorer";
import { seoQualityScorer } from "./evals/seo-quality-scorer";
import { researchCompletenessScorer } from "./evals/research-completeness-scorer";
```

Add to `Mastra` constructor:

```typescript
scorers: {
  writingQuality: {
    scorer: writingQualityScorer,
    sampling: { type: "ratio", rate: 0.1 },
  },
  seoQuality: {
    scorer: seoQualityScorer,
    sampling: { type: "ratio", rate: 0.1 },
  },
  researchCompleteness: {
    scorer: researchCompletenessScorer,
    sampling: { type: "ratio", rate: 0.1 },
  },
},
```

**Step 4: Run all agents tests**

```bash
cd /home/yorizel/Documents/contentta-nx
npx vitest run packages/agents --reporter=verbose 2>&1 | tail -30
```

Expected: All pass.

**Step 5: Typecheck**

```bash
cd /home/yorizel/Documents/contentta-nx
bun run typecheck 2>&1 | grep "packages/agents" | head -20
```

**Step 6: Commit**

```bash
cd /home/yorizel/Documents/contentta-nx
git add packages/agents/src/mastra/evals/index.ts packages/agents/src/mastra/index.ts
git commit -m "feat(agents): register writing, SEO, and research scorers in Mastra"
```

---

## Task 7: CI eval suite

**Files:**
- Create: `packages/agents/src/mastra/evals/__tests__/eval-suite.test.ts`

**Context:**
The CI eval suite uses `runEvals()` from `@mastra/core/evals/run` to run the unified agent against a small set of test fixtures. Since agent generation is expensive (real LLM calls), this suite is designed for:
- Local development: run manually (`bun run evals`)
- CI: skip unless `ENABLE_EVALS=true` env var is set

The suite runs 2 fixtures per workflow category and asserts minimum scorer thresholds.

**Important:** `runEvals` calls `agent.generate()` internally — the agent needs a real Mastra instance with working credentials. In CI, this requires `OPENROUTER_API_KEY`, `PG_VECTOR_URL`, `POSTHOG_KEY`, and `POSTHOG_HOST` to be set. Guard the test with env-check skip.

**Step 1: Create the eval suite**

Create `packages/agents/src/mastra/evals/__tests__/eval-suite.test.ts`:

```typescript
/**
 * CI Eval Suite for Unified Content Agent
 *
 * Guards: ENABLE_EVALS=true must be set (skips otherwise to keep CI fast).
 * Requires: OPENROUTER_API_KEY, PG_VECTOR_URL, POSTHOG_KEY, POSTHOG_HOST
 *
 * Run locally:
 *   ENABLE_EVALS=true bun test packages/agents/src/mastra/evals/__tests__/eval-suite.test.ts
 *
 * Run in CI (add to GitHub Actions):
 *   env:
 *     ENABLE_EVALS: "true"
 *     OPENROUTER_API_KEY: ${{ secrets.OPENROUTER_API_KEY }}
 *     PG_VECTOR_URL: ${{ secrets.PG_VECTOR_URL }}
 *     POSTHOG_KEY: ${{ secrets.POSTHOG_KEY }}
 *     POSTHOG_HOST: ${{ secrets.POSTHOG_HOST }}
 */
import { describe, expect, test } from "bun:test";

const EVALS_ENABLED = process.env.ENABLE_EVALS === "true";

// ─── Fixtures ────────────────────────────────────────────────────────────────

const WRITING_FIXTURES = [
  {
    input:
      "Escreva um artigo sobre TypeScript generics com frontmatter YAML, pelo menos 2 seções H2, e sem frases de IA como 'In conclusion'.",
    minWritingScore: 0.75,
    minSeoScore: 0.6,
  },
  {
    input:
      "Write a 600+ word technical blog post about React Server Components. Include YAML frontmatter with title, description, slug, and keywords.",
    minWritingScore: 0.75,
    minSeoScore: 0.6,
  },
];

const RESEARCH_FIXTURES = [
  {
    input:
      "Research the current state of AI-powered content creation tools. Include statistics, named sources, and comparisons between tools.",
    minResearchScore: 0.6,
  },
];

// ─── Suite ───────────────────────────────────────────────────────────────────

describe("CI Eval Suite — Unified Content Agent", () => {
  if (!EVALS_ENABLED) {
    test.skip("skipped: ENABLE_EVALS not set", () => {});
    return;
  }

  // Dynamic imports to avoid loading full Mastra on non-eval runs
  let runEvals: typeof import("@mastra/core/evals/run").runEvals;
  let mastra: typeof import("../../index").mastra;
  let writingQualityScorer: typeof import("../writing-quality-scorer").writingQualityScorer;
  let seoQualityScorer: typeof import("../seo-quality-scorer").seoQualityScorer;
  let researchCompletenessScorer: typeof import("../research-completeness-scorer").researchCompletenessScorer;

  test("imports resolve", async () => {
    ({ runEvals } = await import("@mastra/core/evals/run"));
    ({ mastra } = await import("../../index"));
    ({ writingQualityScorer } = await import("../writing-quality-scorer"));
    ({ seoQualityScorer } = await import("../seo-quality-scorer"));
    ({ researchCompletenessScorer } = await import(
      "../research-completeness-scorer"
    ));
    expect(runEvals).toBeDefined();
    expect(mastra).toBeDefined();
  });

  for (const fixture of WRITING_FIXTURES) {
    test(
      `writing fixture: "${fixture.input.slice(0, 60)}..."`,
      async () => {
        const agent = mastra.getAgent("unifiedContent");
        const results = await runEvals({
          target: agent,
          data: [{ input: fixture.input }],
          scorers: [writingQualityScorer, seoQualityScorer],
          concurrency: 1,
        });

        const writingScores = results.scores["writing-quality"] ?? {};
        const seoScores = results.scores["seo-quality"] ?? {};

        // Each scorer returns scores keyed by run index
        const writingScore = Object.values(writingScores)[0] as number | undefined;
        const seoScore = Object.values(seoScores)[0] as number | undefined;

        console.log(`Writing score: ${writingScore}, SEO score: ${seoScore}`);
        expect(writingScore ?? 0).toBeGreaterThanOrEqual(fixture.minWritingScore);
        expect(seoScore ?? 0).toBeGreaterThanOrEqual(fixture.minSeoScore);
      },
      120_000, // 2 minute timeout per fixture
    );
  }

  for (const fixture of RESEARCH_FIXTURES) {
    test(
      `research fixture: "${fixture.input.slice(0, 60)}..."`,
      async () => {
        const agent = mastra.getAgent("unifiedContent");
        const results = await runEvals({
          target: agent,
          data: [{ input: fixture.input }],
          scorers: [researchCompletenessScorer],
          concurrency: 1,
        });

        const researchScores = results.scores["research-completeness"] ?? {};
        const researchScore = Object.values(researchScores)[0] as number | undefined;

        console.log(`Research score: ${researchScore}`);
        expect(researchScore ?? 0).toBeGreaterThanOrEqual(
          fixture.minResearchScore,
        );
      },
      120_000,
    );
  }
});
```

**Step 2: Add `evals` script to `packages/agents/package.json`**

In `"scripts"`, add:

```json
"evals": "ENABLE_EVALS=true dotenv -e .env -- bun test src/mastra/evals/__tests__/eval-suite.test.ts"
```

**Step 3: Verify the guard works (without ENABLE_EVALS)**

```bash
cd /home/yorizel/Documents/contentta-nx
npx vitest run packages/agents/src/mastra/evals/__tests__/eval-suite.test.ts --reporter=verbose 2>&1 | tail -10
```

Expected: 1 test SKIPPED (the `test.skip` guard fires), no other tests run.

**Step 4: Commit**

```bash
cd /home/yorizel/Documents/contentta-nx
git add packages/agents/src/mastra/evals/__tests__/eval-suite.test.ts packages/agents/package.json
git commit -m "feat(agents): add CI eval suite with writing, SEO, and research fixtures"
```

---

## Task 8: Customer analytics enrichment — `skillName` on PostHog AI events

**Files:**
- Modify: `packages/posthog/src/llm/server.ts`
- Modify: `packages/posthog/src/llm/types.ts`
- Modify: `packages/posthog/src/__tests__/posthog-exporter.test.ts` (add skill enrichment test)

**Context:**
Currently when `captureChatResponseComplete` and `captureChatToolExecuted` are called, they emit `llm_chat_response_complete` and `llm_chat_tool_executed` events. These events don't carry skill-level attribution. Skill attribution is "which category of work was the agent doing?" derived from tool names.

We add a `skillName` property to `LLMChatToolEvent` (and consequently to the capture functions) so callers can pass the inferred skill. The inference logic maps tool names → skill category:

- `webSearch`, `serpAnalysis`, `webCrawl`, `factFinder`, `competitorContent`, `contentGap`, `relatedKeywords`, `researchCompleteness` → `"research"`
- `seoScore`, `readability`, `keywordDensity`, `contentStructure`, `badPatterns`, `titleMeta`, `quickAnswerAnalysis`, `imageSeo`, `linkDensity`, `duplicateContent`, `toneAnalysis`, `citation`, `originality` → `"seo-analysis"`
- `insertText`, `replaceText`, `deleteText`, `formatText`, `insertHeading`, `insertList`, `insertCodeBlock`, `insertTable`, `insertImage`, `improveReadability`, `injectKeywords`, `addInternalLinks`, `addExternalLinks`, `generateQuickAnswer`, `suggestImages`, `optimizeTitle`, `optimizeMeta`, `addEditorComment`, `proposeSuggestion` → `"editing"`
- `editTitle`, `editDescription`, `editKeywords`, `editSlug` → `"frontmatter"`
- `getInstructionMemories`, `searchPreviousContent`, `graphSearch` → `"rag"`
- Everything else → `"general"`

This function lives in `packages/posthog/src/llm/server.ts` as `inferSkillFromToolName(toolName: string): SkillName`.

**Step 1: Write failing tests**

Add to `packages/posthog/src/__tests__/llm-server.test.ts` (create new file):

```typescript
import { describe, expect, test } from "bun:test";
import { inferSkillFromToolName } from "../llm/server";

describe("inferSkillFromToolName", () => {
  test("maps webSearch to research", () => {
    expect(inferSkillFromToolName("webSearch")).toBe("research");
  });
  test("maps serpAnalysis to research", () => {
    expect(inferSkillFromToolName("serpAnalysis")).toBe("research");
  });
  test("maps seoScore to seo-analysis", () => {
    expect(inferSkillFromToolName("seoScore")).toBe("seo-analysis");
  });
  test("maps readability to seo-analysis", () => {
    expect(inferSkillFromToolName("readability")).toBe("seo-analysis");
  });
  test("maps insertText to editing", () => {
    expect(inferSkillFromToolName("insertText")).toBe("editing");
  });
  test("maps improveReadability to editing", () => {
    expect(inferSkillFromToolName("improveReadability")).toBe("editing");
  });
  test("maps editTitle to frontmatter", () => {
    expect(inferSkillFromToolName("editTitle")).toBe("frontmatter");
  });
  test("maps searchPreviousContent to rag", () => {
    expect(inferSkillFromToolName("searchPreviousContent")).toBe("rag");
  });
  test("maps unknown tool to general", () => {
    expect(inferSkillFromToolName("someUnknownTool")).toBe("general");
  });
});
```

**Step 2: Run to verify failure**

```bash
cd /home/yorizel/Documents/contentta-nx
npx vitest run packages/posthog/src/__tests__/llm-server.test.ts --reporter=verbose 2>&1 | tail -10
```

Expected: FAIL — `inferSkillFromToolName` not exported.

**Step 3: Add `inferSkillFromToolName` and `SkillName` to `packages/posthog/src/llm/server.ts`**

Add after the imports, before `captureFIMGenerated`:

```typescript
export type SkillName =
  | "research"
  | "seo-analysis"
  | "editing"
  | "frontmatter"
  | "rag"
  | "general";

const TOOL_SKILL_MAP: Record<string, SkillName> = {
  // Research
  webSearch: "research",
  serpAnalysis: "research",
  webCrawl: "research",
  factFinder: "research",
  competitorContent: "research",
  contentGap: "research",
  relatedKeywords: "research",
  researchCompleteness: "research",
  // SEO Analysis
  seoScore: "seo-analysis",
  readability: "seo-analysis",
  keywordDensity: "seo-analysis",
  contentStructure: "seo-analysis",
  badPatterns: "seo-analysis",
  titleMeta: "seo-analysis",
  quickAnswerAnalysis: "seo-analysis",
  imageSeo: "seo-analysis",
  linkDensity: "seo-analysis",
  duplicateContent: "seo-analysis",
  toneAnalysis: "seo-analysis",
  citation: "seo-analysis",
  originality: "seo-analysis",
  // Editing
  insertText: "editing",
  replaceText: "editing",
  deleteText: "editing",
  formatText: "editing",
  insertHeading: "editing",
  insertList: "editing",
  insertCodeBlock: "editing",
  insertTable: "editing",
  insertImage: "editing",
  improveReadability: "editing",
  injectKeywords: "editing",
  addInternalLinks: "editing",
  addExternalLinks: "editing",
  generateQuickAnswer: "editing",
  suggestImages: "editing",
  optimizeTitle: "editing",
  optimizeMeta: "editing",
  addEditorComment: "editing",
  proposeSuggestion: "editing",
  // Frontmatter
  editTitle: "frontmatter",
  editDescription: "frontmatter",
  editKeywords: "frontmatter",
  editSlug: "frontmatter",
  // RAG
  getInstructionMemories: "rag",
  searchPreviousContent: "rag",
  graphSearch: "rag",
};

/**
 * Infer the skill category from a Mastra tool name.
 * Used to enrich PostHog analytics with skill-level attribution.
 */
export function inferSkillFromToolName(toolName: string): SkillName {
  return TOOL_SKILL_MAP[toolName] ?? "general";
}
```

**Step 4: Add `skillName` to `LLMChatToolEvent` in `types.ts`**

In `packages/posthog/src/llm/types.ts`, in the `LLMChatToolEvent` interface, add:

```typescript
/** Skill category inferred from tool name */
skillName?: string;
```

**Step 5: Run tests**

```bash
cd /home/yorizel/Documents/contentta-nx
npx vitest run packages/posthog/src/__tests__/llm-server.test.ts --reporter=verbose 2>&1 | tail -10
```

Expected: All 9 tests PASS.

**Step 6: Run full posthog package tests**

```bash
cd /home/yorizel/Documents/contentta-nx
npx vitest run packages/posthog --reporter=verbose 2>&1 | tail -20
```

**Step 7: Typecheck**

```bash
cd /home/yorizel/Documents/contentta-nx
bun run typecheck 2>&1 | grep "packages/posthog\|packages/agents" | head -20
```

**Step 8: Commit**

```bash
cd /home/yorizel/Documents/contentta-nx
git add packages/posthog/src/llm/server.ts packages/posthog/src/llm/types.ts packages/posthog/src/__tests__/llm-server.test.ts
git commit -m "feat(posthog): add inferSkillFromToolName for customer analytics skill enrichment"
```

---

## Task 9: PosthogExporter — enrich spans with skillName

**Files:**
- Modify: `packages/posthog/src/llm/posthog-exporter.ts`
- Modify: `packages/posthog/src/__tests__/posthog-exporter.test.ts`

**Context:**
For `TOOL_CALL` spans, look up the `skillName` from `inferSkillFromToolName(span.name)` and include it as a custom property on the `$ai_span` event. Since `captureAISpan` maps directly to the PostHog `$ai_span` event (which has fixed schema), include `skillName` in the span's `input` metadata instead.

Actually — the cleanest approach is to add `skillName` as a top-level extra property on the PostHog event. Look at `captureAISpan`'s implementation: it calls `posthog.capture` directly with specific `$ai_span_*` properties. The span event accepts no extra fields in the existing `CaptureAISpanParams` interface.

Decision: extend `CaptureAISpanParams` with an optional `skillName` property, then include it as `$ai_skill_name` in the PostHog capture.

**Step 1: Add failing test to posthog-exporter tests**

In `packages/posthog/src/__tests__/posthog-exporter.test.ts`, add to the `describe` block:

```typescript
test("includes skillName on tool call span for known tools", async () => {
  capturedSpans.length = 0;
  const exporter = new PosthogExporter(makePosthog(), "user-fallback");
  const span = makeToolCallSpan({ name: "webSearch" });
  await exporter.exportTracingEvent(makeSpanEndedEvent(span));

  expect(capturedSpans[0].skillName).toBe("research");
});

test("includes skillName 'general' for unknown tool names", async () => {
  capturedSpans.length = 0;
  const exporter = new PosthogExporter(makePosthog(), "user-fallback");
  const span = makeToolCallSpan({ name: "unknownTool" });
  await exporter.exportTracingEvent(makeSpanEndedEvent(span));

  expect(capturedSpans[0].skillName).toBe("general");
});
```

**Step 2: Run to verify failure**

```bash
cd /home/yorizel/Documents/contentta-nx
npx vitest run packages/posthog/src/__tests__/posthog-exporter.test.ts --reporter=verbose 2>&1 | tail -15
```

Expected: 2 new tests FAIL — `skillName` is undefined on the captured span.

**Step 3: Update `CaptureAISpanParams` to accept `skillName`**

In `packages/posthog/src/llm/ai-span.ts`, add to `CaptureAISpanParams`:

```typescript
/** Skill category that used this tool */
skillName?: string;
```

And in the `posthog.capture` call, add:

```typescript
$ai_skill_name: skillName,
```

**Step 4: Update `PosthogExporter` to pass `skillName`**

In `packages/posthog/src/llm/posthog-exporter.ts`:

1. Import `inferSkillFromToolName` from `@packages/posthog/llm/server`.

   Wait — this creates a circular import since `posthog-exporter.ts` is in the same `llm/` directory as `server.ts`. Since both are in `packages/posthog/src/llm/`, use a relative import:

   ```typescript
   import { inferSkillFromToolName } from "./server";
   ```

2. In the `TOOL_CALL` branch, add:

   ```typescript
   const skillName = inferSkillFromToolName(span.name);
   captureAISpan({
     ...existingParams,
     skillName,
   });
   ```

**Step 5: Run tests**

```bash
cd /home/yorizel/Documents/contentta-nx
npx vitest run packages/posthog/src/__tests__/posthog-exporter.test.ts --reporter=verbose 2>&1 | tail -15
```

Expected: All 10 tests PASS (8 original + 2 new).

**Step 6: Commit**

```bash
cd /home/yorizel/Documents/contentta-nx
git add packages/posthog/src/llm/posthog-exporter.ts packages/posthog/src/llm/ai-span.ts packages/posthog/src/__tests__/posthog-exporter.test.ts
git commit -m "feat(posthog): enrich $ai_span events with skill name attribution"
```

---

## Task 10: Final integration check

**Step 1: Run all affected package tests**

```bash
cd /home/yorizel/Documents/contentta-nx
npx vitest run packages/posthog packages/agents --reporter=verbose 2>&1 | tail -40
```

Expected: All unit tests pass. Eval suite shows 1 skipped test.

**Step 2: Full typecheck**

```bash
cd /home/yorizel/Documents/contentta-nx
bun run typecheck 2>&1 | grep -E "error TS|packages/posthog|packages/agents" | head -30
```

Expected: No TypeScript errors.

**Step 3: Biome check**

```bash
cd /home/yorizel/Documents/contentta-nx
bun run check 2>&1 | grep -E "packages/posthog|packages/agents" | head -20
```

Fix any biome warnings (unused imports, formatting). Re-run until clean.

**Step 4: Run full test suite**

```bash
cd /home/yorizel/Documents/contentta-nx
bun run test 2>&1 | tail -20
```

Expected: All tests pass.

**Step 5: Final commit if any fixes were needed**

```bash
cd /home/yorizel/Documents/contentta-nx
git add -p  # Review changes interactively
git commit -m "fix(observability): address biome and typecheck issues"
```

---

## Summary of New Files

| File | Purpose |
|------|---------|
| `packages/posthog/src/llm/posthog-exporter.ts` | `PosthogExporter` class implementing Mastra `ObservabilityExporter` |
| `packages/posthog/src/__tests__/posthog-exporter.test.ts` | Unit tests for `PosthogExporter` |
| `packages/posthog/src/__tests__/llm-server.test.ts` | Tests for `inferSkillFromToolName` |
| `packages/agents/src/mastra/evals/writing-quality-scorer.ts` | Writing quality scorer (frontmatter, length, headings, no filler) |
| `packages/agents/src/mastra/evals/seo-quality-scorer.ts` | SEO quality scorer (title, description, slug, keywords, body usage) |
| `packages/agents/src/mastra/evals/research-completeness-scorer.ts` | Research completeness scorer (URLs, stats, sources, comparisons, depth) |
| `packages/agents/src/mastra/evals/index.ts` | Barrel-free re-export of scorers (for Mastra registration) |
| `packages/agents/src/mastra/evals/__tests__/writing-quality-scorer.test.ts` | Scorer unit tests |
| `packages/agents/src/mastra/evals/__tests__/seo-quality-scorer.test.ts` | Scorer unit tests |
| `packages/agents/src/mastra/evals/__tests__/research-completeness-scorer.test.ts` | Scorer unit tests |
| `packages/agents/src/mastra/evals/__tests__/eval-suite.test.ts` | CI eval suite (guarded by `ENABLE_EVALS=true`) |

## Summary of Modified Files

| File | Change |
|------|--------|
| `packages/posthog/package.json` | Add `./llm/posthog-exporter` export path |
| `packages/posthog/src/llm/types.ts` | Add `skillName?: string` to `LLMChatToolEvent` |
| `packages/posthog/src/llm/server.ts` | Add `SkillName` type, `TOOL_SKILL_MAP`, `inferSkillFromToolName()` |
| `packages/posthog/src/llm/ai-span.ts` | Add `skillName?: string` to `CaptureAISpanParams`, emit `$ai_skill_name` |
| `packages/agents/package.json` | Add `@mastra/observability` and `@packages/posthog` deps, add `evals` script |
| `packages/agents/src/mastra/index.ts` | Wire `PosthogExporter` via `Observability`, register 3 scorers |
| `packages/agents/src/__tests__/workspace-mocks.ts` | Add mock for `@mastra/observability` |
