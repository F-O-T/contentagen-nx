import { describe, expect, mock, test } from "bun:test";
import type { RequestContext } from "@mastra/core/request-context";
// Mocks for @packages/environment/server, @mastra/pg, and ../utils are provided
// by the global preload in bunfig.toml (workspace-mocks.ts). Only mocks that are
// not already covered by the preload are declared here.

mock.module("../mastra/agents/fim-agent", () => ({
   fimAgent: { name: "FIM Agent" },
}));

mock.module("../mastra/agents/inline-edit-agent", () => ({
   inlineEditAgent: { name: "Inline Edit Agent" },
}));

mock.module("../mastra/agents/unified-content-agent", () => ({
   unifiedContentAgent: { name: "Unified Content Agent" },
}));

// @mastra/core/mastra is also mocked via the preload (workspace-mocks.ts).
// The preload mock runs first; this file relies on it for static imports of ../mastra/index.

import type { CustomRequestContext } from "../mastra/index";
import { createRequestContext } from "../mastra/index";

// Helper to type ctx correctly at call sites
const createCtx = (
   params: CustomRequestContext,
): RequestContext<CustomRequestContext> =>
   // biome-ignore lint/suspicious/noExplicitAny: runtime value is the real RequestContext despite mock cast
   createRequestContext(params) as any as RequestContext<CustomRequestContext>;

// Use .all to read the typed context object and avoid bun:test overload resolution
// issues with RequestContext.get()'s generic return type.
const all = (ctx: RequestContext<CustomRequestContext>): CustomRequestContext =>
   ctx.all as CustomRequestContext;

describe("createRequestContext", () => {
   test("sets userId on the request context", () => {
      const ctx = createCtx({ userId: "user-123" });
      expect(all(ctx).userId).toBe("user-123");
   });

   test("sets writerId when provided", () => {
      const ctx = createCtx({
         userId: "user-123",
         writerId: "writer-xyz",
      });
      expect(all(ctx).writerId).toBe("writer-xyz");
   });

   test("sets model when provided", () => {
      const ctx = createCtx({
         userId: "user-123",
         model: "openrouter/x-ai/grok-4.1-fast",
      });
      expect(all(ctx).model).toBe("openrouter/x-ai/grok-4.1-fast");
   });

   test("does NOT set temperature when not provided", () => {
      const ctx = createCtx({ userId: "user-123" });
      expect(all(ctx).temperature).toBeUndefined();
   });

   test("sets temperature = 0 when explicitly provided (allows falsy zero)", () => {
      const ctx = createCtx({ userId: "user-123", temperature: 0 });
      expect(all(ctx).temperature).toBe(0);
   });

   test("sets temperature = 0.7 when provided", () => {
      const ctx = createCtx({
         userId: "user-123",
         temperature: 0.7,
      });
      expect(all(ctx).temperature).toBe(0.7);
   });

   test("sets topP when provided", () => {
      const ctx = createCtx({ userId: "user-123", topP: 0.95 });
      expect(all(ctx).topP).toBe(0.95);
   });

   test("sets maxTokens when provided", () => {
      const ctx = createCtx({ userId: "user-123", maxTokens: 4096 });
      expect(all(ctx).maxTokens).toBe(4096);
   });

   test("sets frequencyPenalty = 0 when explicitly provided", () => {
      const ctx = createCtx({
         userId: "user-123",
         frequencyPenalty: 0,
      });
      expect(all(ctx).frequencyPenalty).toBe(0);
   });

   test("sets frequencyPenalty = 0.3 when provided", () => {
      const ctx = createCtx({
         userId: "user-123",
         frequencyPenalty: 0.3,
      });
      expect(all(ctx).frequencyPenalty).toBe(0.3);
   });

   test("sets presencePenalty when provided", () => {
      const ctx = createCtx({
         userId: "user-123",
         presencePenalty: 0.1,
      });
      expect(all(ctx).presencePenalty).toBe(0.1);
   });

   test("does NOT set presencePenalty when not provided", () => {
      const ctx = createCtx({ userId: "user-123" });
      expect(all(ctx).presencePenalty).toBeUndefined();
   });

   test("sets language when provided", () => {
      const ctx = createCtx({
         userId: "user-123",
         language: "pt-BR",
      });
      expect(all(ctx).language).toBe("pt-BR");
   });

   test("sets writerInstructions when provided", () => {
      // biome-ignore lint/suspicious/noExplicitAny: test fixture uses minimal shape
      const instructions = [{ id: "1", instruction: "Be concise" }] as any[];
      const ctx = createCtx({
         userId: "user-123",
         writerInstructions: instructions,
      });
      expect(all(ctx).writerInstructions).toEqual(instructions);
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
      const values = all(ctx);
      expect(values.temperature).toBe(0.7);
      expect(values.topP).toBe(0.95);
      expect(values.maxTokens).toBe(8192);
      expect(values.frequencyPenalty).toBe(0.3);
      expect(values.presencePenalty).toBe(0.1);
   });
});
