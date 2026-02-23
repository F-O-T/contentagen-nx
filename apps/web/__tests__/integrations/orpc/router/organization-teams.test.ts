import { call } from "@orpc/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@packages/environment/server", () => ({
	env: {
		MINIO_ENDPOINT: "http://localhost:9000",
		MINIO_ACCESS_KEY: "test",
		MINIO_SECRET_KEY: "test",
	},
}));
vi.mock("@packages/files/client", () => ({
	getMinioClient: vi.fn(),
	generatePresignedPutUrl: vi.fn(),
}));
vi.mock("@packages/database/repositories/auth-repository");

import { getOrganizationTeams } from "@/integrations/orpc/router/organization";
import {
	TEST_ORG_ID,
	createTestContext,
} from "../../../helpers/create-test-context";

describe("getOrganizationTeams", () => {
   it("calls Better Auth listOrganizationTeams with organizationId", async () => {
      const teams = [{ id: "team-1", name: "Alpha", slug: "alpha" }];
      const listOrganizationTeams = vi.fn().mockResolvedValue(teams);

      const context = createTestContext({
         auth: { api: { listOrganizationTeams } },
      });

      const result = await call(getOrganizationTeams, undefined, { context });

      expect(listOrganizationTeams).toHaveBeenCalledWith({
         headers: context.headers,
         query: { organizationId: TEST_ORG_ID },
      });
      expect(result).toEqual([{ id: "team-1", name: "Alpha", slug: "alpha" }]);
   });
});
