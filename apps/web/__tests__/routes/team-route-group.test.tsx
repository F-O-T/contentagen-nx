import { describe, expect, it } from "vitest";
import { getRouter } from "@/router";

describe("team route group", () => {
   it("matches /:slug/:teamId routes", () => {
      const router = getRouter();
      const match = router.matchRoute("/$slug/$teamId/_dashboard", {
         slug: "acme",
         teamId: "123",
      });
      expect(match).toBeTruthy();
   });
});
