import { describe, it, expect } from "vitest";
import { getPromptStagesByType } from "../src/helpers";
import { chunkText } from "../src/helpers/knowledge-distillation";
import type { PromptType } from "../src/helpers";

describe("getPromptStagesByType", () => {
   it("returns all types as object when no type is provided", () => {
      const result = getPromptStagesByType();
      expect(result).toBeTypeOf("object");
      if (
         typeof result === "object" &&
         !Array.isArray(result) &&
         "low" in result &&
         "medium" in result &&
         "high" in result
      ) {
         (["low", "medium", "high"] as PromptType[]).forEach((type) => {
            const stages = result[type];
            expect(Array.isArray(stages)).toBe(true);
            if (Array.isArray(stages)) {
               expect(stages.length).toBeGreaterThan(0);
            }
         });
      }
   });

   it("returns array of stages for each type", () => {
      (["low", "medium", "high"] as PromptType[]).forEach((type) => {
         const stages = getPromptStagesByType(type);
         expect(Array.isArray(stages)).toBe(true);
         if (Array.isArray(stages)) {
            expect(stages.length).toBeGreaterThan(0);
            stages.forEach((stage: string) =>
               expect(typeof stage).toBe("string"),
            );
         }
      });
   });
});

describe("chunkText", () => {
   it("splits text into correct chunk sizes using LLM", async () => {
      const text = "This is a test. Here is another sentence. And a third one.";
      const apiKey = process.env.OPENROUTER_API_KEY;
      expect(apiKey).toBeDefined();
      const chunks = await chunkText(text, 20, apiKey);
      expect(Array.isArray(chunks)).toBe(true);
      expect(chunks.length).toBeGreaterThan(0);
      chunks.forEach((chunk) => {
         expect(typeof chunk).toBe("string");
         expect(chunk.length).toBeGreaterThan(0);
      });
   });

   it("returns whole text if chunkSize is larger than text", async () => {
      const text = "abc";
      const apiKey = process.env.OPENROUTER_API_KEY;
      const chunks = await chunkText(text, 10, apiKey);
      expect(chunks).toEqual(["abc"]);
   });

   it("throws error for non-positive chunkSize", async () => {
      const apiKey = process.env.OPENROUTER_API_KEY;
      await expect(chunkText("abc", 0, apiKey)).rejects.toThrow();
      await expect(chunkText("abc", -5, apiKey)).rejects.toThrow();
   });

   it("throws error if API key is missing", async () => {
      await expect(chunkText("abc", 10)).rejects.toThrow();
   });
});
