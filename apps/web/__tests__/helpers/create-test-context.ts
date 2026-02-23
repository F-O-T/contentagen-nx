import { vi } from "vitest";
import type { ORPCContextWithAuth } from "@/integrations/orpc/server";

// =============================================================================
// Constants
// =============================================================================

export const TEST_USER_ID = "test-user-00000000-0000-0000-0000-000000000001";
export const TEST_ORG_ID = "test-org-00000000-0000-0000-0000-000000000001";
export const TEST_TEAM_ID = "test-team-00000000-0000-0000-0000-000000000001";

// =============================================================================
// Types
// =============================================================================

type MockContextOverrides = {
	[K in keyof ORPCContextWithAuth]?: unknown;
} & Record<string, unknown>;

// =============================================================================
// Helpers
// =============================================================================

/**
 * Creates a fully authenticated test context with an active organization.
 * Suitable for testing any `protectedProcedure`-based handler.
 *
 * Pass partial overrides to customize specific fields.
 */
export function createTestContext(
	overrides: MockContextOverrides = {},
): ORPCContextWithAuth {
	return {
		auth: { api: {} },
		db: {},
		headers: new Headers({ Authorization: "Bearer test-token" }),
		request: new Request("http://localhost"),
		session: {
			user: { id: TEST_USER_ID },
			session: { activeOrganizationId: TEST_ORG_ID, activeTeamId: TEST_TEAM_ID },
		},
		posthog: {
			capture: vi.fn(),
			identify: vi.fn(),
			groupIdentify: vi.fn(),
			shutdown: vi.fn(),
		},
		...overrides,
	} as unknown as ORPCContextWithAuth;
}

/**
 * Creates an unauthenticated context (session is null).
 * Use this to assert UNAUTHORIZED errors from the `withAuth` middleware.
 */
export function createUnauthenticatedContext(
	overrides: MockContextOverrides = {},
): ORPCContextWithAuth {
	return createTestContext({
		session: null,
		...overrides,
	});
}

/**
 * Creates an authenticated context WITHOUT an active organization.
 * Use this to assert FORBIDDEN errors from the `withOrganization` middleware.
 */
export function createNoOrgContext(
	overrides: MockContextOverrides = {},
): ORPCContextWithAuth {
	return createTestContext({
		session: {
			user: { id: TEST_USER_ID },
			session: { activeOrganizationId: null },
		},
		...overrides,
	});
}
