import { describe, expect, mock, test } from "bun:test";
import type { RequestContext } from "@mastra/core/request-context";
import type { CustomRequestContext } from "../mastra/index";

// Mock environment and heavy Mastra dependencies before any import
mock.module("@packages/environment/server", () => ({
   env: { PG_VECTOR_URL: "postgresql://localhost/test" },
}));

mock.module("@mastra/pg", () => ({
   PostgresStore: class {
      constructor() {}
   },
}));

mock.module("../mastra/agents/fim-agent", () => ({
   fimAgent: { name: "FIM Agent" },
}));

mock.module("../mastra/agents/inline-edit-agent", () => ({
   inlineEditAgent: { name: "Inline Edit Agent" },
}));

mock.module("../mastra/agents/unified-content-agent", () => ({
   unifiedContentAgent: { name: "Unified Content Agent" },
}));

mock.module("../utils", () => ({
   pgVectorStore: {},
}));

mock.module("@mastra/core/mastra", () => ({
   Mastra: class {
      constructor() {}
   },
}));

// Now import after mocking — cast to the real type for type-safe test assertions
const module = (await import(
   "../mastra/index"
)) as unknown as typeof import("../mastra/index");
// Helper to type ctx correctly at call sites
const createCtx = (
   params: CustomRequestContext,
): RequestContext<CustomRequestContext> =>
   // biome-ignore lint/suspicious/noExplicitAny: runtime value is the real RequestContext despite mock cast
   module.createRequestContext(
      params,
   ) as any as RequestContext<CustomRequestContext>;

describe("createRequestContext", () => {
   test("sets userId on the request context", () => {
      const ctx = createCtx({ userId: "user-123" });
      expect(ctx.get("userId")).toBe("user-123");
   });

   test("does NOT set brandId when not provided", () => {
      const ctx = createCtx({ userId: "user-123" });
      expect(ctx.get("brandId")).toBeUndefined();
   });

   test("sets brandId when provided", () => {
      const ctx = createCtx({
         userId: "user-123",
         brandId: "brand-abc",
      });
      expect(ctx.get("brandId")).toBe("brand-abc");
   });

   test("sets writerId when provided", () => {
      const ctx = createCtx({
         userId: "user-123",
         writerId: "writer-xyz",
      });
      expect(ctx.get("writerId")).toBe("writer-xyz");
   });

   test("sets model when provided", () => {
      const ctx = createCtx({
         userId: "user-123",
         model: "openrouter/x-ai/grok-4.1-fast",
      });
      expect(ctx.get("model")).toBe("openrouter/x-ai/grok-4.1-fast");
   });

   test("does NOT set temperature when not provided", () => {
      const ctx = createCtx({ userId: "user-123" });
      expect(ctx.get("temperature")).toBeUndefined();
   });

   test("sets temperature = 0 when explicitly provided (allows falsy zero)", () => {
      const ctx = createCtx({ userId: "user-123", temperature: 0 });
      expect(ctx.get("temperature")).toBe(0);
   });

   test("sets temperature = 0.7 when provided", () => {
      const ctx = createCtx({
         userId: "user-123",
         temperature: 0.7,
      });
      expect(ctx.get("temperature")).toBe(0.7);
   });

   test("sets topP when provided", () => {
      const ctx = createCtx({ userId: "user-123", topP: 0.95 });
      expect(ctx.get("topP")).toBe(0.95);
   });

   test("sets maxTokens when provided", () => {
      const ctx = createCtx({ userId: "user-123", maxTokens: 4096 });
      expect(ctx.get("maxTokens")).toBe(4096);
   });

   test("sets frequencyPenalty = 0 when explicitly provided", () => {
      const ctx = createCtx({
         userId: "user-123",
         frequencyPenalty: 0,
      });
      expect(ctx.get("frequencyPenalty")).toBe(0);
   });

   test("sets frequencyPenalty = 0.3 when provided", () => {
      const ctx = createCtx({
         userId: "user-123",
         frequencyPenalty: 0.3,
      });
      expect(ctx.get("frequencyPenalty")).toBe(0.3);
   });

   test("sets presencePenalty when provided", () => {
      const ctx = createCtx({
         userId: "user-123",
         presencePenalty: 0.1,
      });
      expect(ctx.get("presencePenalty")).toBe(0.1);
   });

   test("does NOT set presencePenalty when not provided", () => {
      const ctx = createCtx({ userId: "user-123" });
      expect(ctx.get("presencePenalty")).toBeUndefined();
   });

   test("sets language when provided", () => {
      const ctx = createCtx({
         userId: "user-123",
         language: "pt-BR",
      });
      expect(ctx.get("language")).toBe("pt-BR");
   });

   test("sets writerInstructions when provided", () => {
      // biome-ignore lint/suspicious/noExplicitAny: test fixture uses minimal shape
      const instructions = [{ id: "1", instruction: "Be concise" }] as any[];
      const ctx = createCtx({
         userId: "user-123",
         writerInstructions: instructions,
      });
      expect(ctx.get("writerInstructions")).toEqual(instructions);
   });

   test("sets all generation params at once from a model preset", () => {
      const ctx = createCtx({
         userId: "user-123",
         model: "openrouter/x-ai/grok-4.1-fast",
         temperature: 0.7,
         topP: 0.95,
         maxTokens: 8192,
         frequencyPenalty: 0.3,
         presencePenalty: 0.1,
      });
      expect(ctx.get("temperature")).toBe(0.7);
      expect(ctx.get("topP")).toBe(0.95);
      expect(ctx.get("maxTokens")).toBe(8192);
      expect(ctx.get("frequencyPenalty")).toBe(0.3);
      expect(ctx.get("presencePenalty")).toBe(0.1);
   });
});
