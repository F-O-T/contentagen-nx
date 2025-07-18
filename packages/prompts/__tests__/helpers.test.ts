import { describe, it, expect } from "vitest";
import { getPromptStagesByType, chunkText } from "../src/helpers";
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
   it("splits text into correct chunk sizes", () => {
      const text = "abcdefghij";
      const chunks = chunkText(text, 3);
      expect(chunks).toEqual(["abc", "def", "ghi", "j"]);
   });

   it("returns whole text if chunkSize is larger than text", () => {
      const text = "abc";
      const chunks = chunkText(text, 10);
      expect(chunks).toEqual(["abc"]);
   });

   it("throws error for non-positive chunkSize", () => {
      expect(() => chunkText("abc", 0)).toThrow();
      expect(() => chunkText("abc", -5)).toThrow();
   });
});
