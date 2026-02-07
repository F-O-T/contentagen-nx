import { describe, expect, it, vi } from "vitest";
import type { ORPCContextWithOrganization } from "../../server";
import { getOrganizationTeams } from "../organization";

describe("getOrganizationTeams", () => {
   it("calls Better Auth listOrganizationTeams with organizationId", async () => {
      const headers = new Headers({ Authorization: "Bearer test" });
      const teams = [{ id: "team-1", name: "Alpha" }];
      const listOrganizationTeams = vi.fn().mockResolvedValue(teams);
      const context = ({
         auth: {
            api: {
               listOrganizationTeams,
            },
         },
         headers,
         organizationId: "org-123",
      } as unknown) as ORPCContextWithOrganization;

      const procedure = (getOrganizationTeams as unknown) as {
         "~orpc": {
            handler: (options: Record<string, unknown>) => Promise<unknown>;
         };
      };

      const result = await procedure["~orpc"].handler({
         context,
         input: undefined,
         path: "organization.getOrganizationTeams",
         procedure: getOrganizationTeams,
      });

      expect(listOrganizationTeams).toHaveBeenCalledWith({
         headers,
         query: { organizationId: "org-123" },
      });
      expect(result).toBe(teams);
   });
});
