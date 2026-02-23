import { ORPCError, call } from "@orpc/server";
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
	createNoOrgContext,
	createTestContext,
	createUnauthenticatedContext,
} from "./create-test-context";

describe("oRPC middleware chain", () => {
	it("throws UNAUTHORIZED when session is null", async () => {
		const context = createUnauthenticatedContext();

		await expect(
			call(getOrganizationTeams, undefined, { context }),
		).rejects.toSatisfy((error: ORPCError<string, unknown>) => {
			expect(error.code).toBe("UNAUTHORIZED");
			expect(error.message).toBe(
				"You must be logged in to access this resource",
			);
			return true;
		});
	});

	it("throws FORBIDDEN when activeOrganizationId is missing", async () => {
		const context = createNoOrgContext();

		await expect(
			call(getOrganizationTeams, undefined, { context }),
		).rejects.toSatisfy((error: ORPCError<string, unknown>) => {
			expect(error.code).toBe("FORBIDDEN");
			expect(error.message).toBe("No active organization selected");
			return true;
		});
	});

	it("passes through when session and organization are valid", async () => {
		const teams = [{ id: "team-1", name: "Engineering" }];
		const context = createTestContext({
			auth: {
				api: {
					listOrganizationTeams: async () => teams,
				},
			},
		});

		const result = await call(getOrganizationTeams, undefined, { context });

		expect(result).toEqual(teams);
	});
});
