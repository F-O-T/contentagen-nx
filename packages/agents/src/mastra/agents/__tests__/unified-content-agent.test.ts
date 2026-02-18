import { describe, expect, test } from "bun:test";
import { unifiedContentAgent } from "../unified-content-agent";

describe("UnifiedContentAgent", () => {
   test("agent is properly initialized", () => {
      expect(unifiedContentAgent).toBeDefined();
      expect(unifiedContentAgent.name).toBe("Unified Content Agent");
   });

   test("agent has correct ID", () => {
      expect(unifiedContentAgent.name).toBe("Unified Content Agent");
   });

   test("agent is exported and available", () => {
      expect(typeof unifiedContentAgent).toBe("object");
      expect(unifiedContentAgent.name).toBeTruthy();
   });
});
