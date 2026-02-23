import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Verifies that the team route group exists by checking the file system
 * for the expected route file structure. This avoids importing the full
 * router which pulls in the entire app dependency graph (CSS, agents, auth, etc.).
 */
describe("team route group", () => {
   it("has /$slug/$teamSlug/_dashboard route directory", () => {
      const routeDir = resolve(
         __dirname,
         "../../src/routes/_authenticated/$slug/$teamSlug/_dashboard",
      );
      expect(existsSync(routeDir)).toBe(true);
   });

   it("has required route files", () => {
      const baseDir = resolve(
         __dirname,
         "../../src/routes/_authenticated/$slug/$teamSlug",
      );

      // The _dashboard layout route should exist
      const dashboardDir = resolve(baseDir, "_dashboard");
      expect(existsSync(dashboardDir)).toBe(true);
   });
});
