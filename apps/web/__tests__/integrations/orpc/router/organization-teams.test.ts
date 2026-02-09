import { call } from "@orpc/server";
import { describe, expect, it, vi } from "vitest";
import type { ORPCContextWithAuth } from "@/integrations/orpc/server";
import { getOrganizationTeams } from "@/integrations/orpc/router/organization";

describe("getOrganizationTeams", () => {
   it("calls Better Auth listOrganizationTeams with organizationId", async () => {
      const headers = new Headers({ Authorization: "Bearer test" });
      const teams = [{ id: "team-1", name: "Alpha" }];
      const listOrganizationTeams = vi.fn().mockResolvedValue(teams);

      const context = {
         auth: {
            api: {
               listOrganizationTeams,
            },
         },
         headers,
         request: new Request("http://localhost"),
         db: {},
         session: {
            user: { id: "user-1" },
            session: { activeOrganizationId: "org-123" },
         },
      } as unknown as ORPCContextWithAuth;

      const result = await call(getOrganizationTeams, undefined, { context });

      expect(listOrganizationTeams).toHaveBeenCalledWith({
         headers,
         query: { organizationId: "org-123" },
      });
      expect(result).toBe(teams);
   });
});
