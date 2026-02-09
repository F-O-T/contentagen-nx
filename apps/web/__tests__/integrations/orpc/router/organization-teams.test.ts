import { call } from "@orpc/server";
import { describe, expect, it, vi } from "vitest";
import { getOrganizationTeams } from "@/integrations/orpc/router/organization";
import {
	TEST_ORG_ID,
	createTestContext,
} from "../../../helpers/create-test-context";

describe("getOrganizationTeams", () => {
   it("calls Better Auth listOrganizationTeams with organizationId", async () => {
      const teams = [{ id: "team-1", name: "Alpha" }];
      const listOrganizationTeams = vi.fn().mockResolvedValue(teams);

      const context = createTestContext({
         auth: { api: { listOrganizationTeams } },
      });

      const result = await call(getOrganizationTeams, undefined, { context });

      expect(listOrganizationTeams).toHaveBeenCalledWith({
         headers: context.headers,
         query: { organizationId: TEST_ORG_ID },
      });
      expect(result).toBe(teams);
   });
});
