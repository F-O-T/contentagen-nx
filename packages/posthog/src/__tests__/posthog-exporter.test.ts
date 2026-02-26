import { describe, expect, mock, test } from "bun:test";
import type { CaptureAIGenerationParams } from "../llm/ai-generation";
import type { CaptureAISpanParams } from "../llm/ai-span";

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

function makePosthog() {
  return { capture: mock(() => {}) } as any;
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
