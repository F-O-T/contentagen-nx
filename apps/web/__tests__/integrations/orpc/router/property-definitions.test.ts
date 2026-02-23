import { ORPCError, call } from "@orpc/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	TEST_ORG_ID,
	createTestContext,
} from "../../../helpers/create-test-context";
import {
	PROP_DEF_ID,
	makePropertyDefinition,
} from "../../../helpers/mock-factories";

// ---------------------------------------------------------------------------
// Mocks — must be declared before any import that touches the modules
// ---------------------------------------------------------------------------

vi.mock("@packages/database/repositories/property-definition-repository");

import {
	createPropertyDefinition,
	deletePropertyDefinition,
	getPropertyDefinition,
	listPropertyDefinitions,
	updatePropertyDefinition,
} from "@packages/database/repositories/property-definition-repository";

import * as propertyDefinitionsRouter from "@/integrations/orpc/router/property-definitions";

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
	vi.clearAllMocks();
});

// =============================================================================
// create
// =============================================================================

describe("create", () => {
	const input = {
		name: "page_url",
		type: "string" as const,
		description: "URL of the page",
	};

	it("creates property definition successfully", async () => {
		const propertyDefinition = makePropertyDefinition();
		vi.mocked(createPropertyDefinition).mockResolvedValueOnce(propertyDefinition);

		const ctx = createTestContext();
		const result = await call(propertyDefinitionsRouter.create, input, { context: ctx });

		expect(createPropertyDefinition).toHaveBeenCalledWith(
			expect.anything(),
			expect.objectContaining({
				organizationId: TEST_ORG_ID,
				name: input.name,
				type: input.type,
				description: input.description,
			}),
		);
		expect(result).toEqual(propertyDefinition);
	});
});

// =============================================================================
// list
// =============================================================================

describe("list", () => {
	it("returns property definitions list", async () => {
		const propertyDefinitions = [
			makePropertyDefinition(),
			makePropertyDefinition({ id: "prop-def-2", name: "session_duration" }),
		];
		vi.mocked(listPropertyDefinitions).mockResolvedValueOnce(propertyDefinitions);

		const ctx = createTestContext();
		const result = await call(propertyDefinitionsRouter.list, undefined, { context: ctx });

		expect(listPropertyDefinitions).toHaveBeenCalledWith(
			expect.anything(),
			TEST_ORG_ID,
		);
		expect(result).toHaveLength(2);
	});

	it("returns empty array when no property definitions", async () => {
		vi.mocked(listPropertyDefinitions).mockResolvedValueOnce([]);

		const ctx = createTestContext();
		const result = await call(propertyDefinitionsRouter.list, undefined, { context: ctx });

		expect(result).toEqual([]);
	});
});

// =============================================================================
// getById
// =============================================================================

describe("getById", () => {
	it("returns property definition", async () => {
		const propertyDefinition = makePropertyDefinition();
		vi.mocked(getPropertyDefinition).mockResolvedValueOnce(propertyDefinition);

		const ctx = createTestContext();
		const result = await call(
			propertyDefinitionsRouter.getById,
			{ id: PROP_DEF_ID },
			{ context: ctx },
		);

		expect(getPropertyDefinition).toHaveBeenCalledWith(
			expect.anything(),
			PROP_DEF_ID,
		);
		expect(result).toEqual(propertyDefinition);
	});

	it("throws NOT_FOUND when property definition does not exist", async () => {
		vi.mocked(getPropertyDefinition).mockResolvedValueOnce(null as any);

		const ctx = createTestContext();
		await expect(
			call(propertyDefinitionsRouter.getById, { id: PROP_DEF_ID }, { context: ctx }),
		).rejects.toSatisfy((e: ORPCError<string, unknown>) => e.code === "NOT_FOUND");
	});

	it("throws NOT_FOUND when property definition belongs to different org", async () => {
		const propertyDefinition = makePropertyDefinition({ organizationId: "other-org-id" });
		vi.mocked(getPropertyDefinition).mockResolvedValueOnce(propertyDefinition);

		const ctx = createTestContext();
		await expect(
			call(propertyDefinitionsRouter.getById, { id: PROP_DEF_ID }, { context: ctx }),
		).rejects.toSatisfy((e: ORPCError<string, unknown>) => e.code === "NOT_FOUND");
	});
});

// =============================================================================
// update
// =============================================================================

describe("update", () => {
	const input = {
		id: PROP_DEF_ID,
		name: "updated_property" as const,
		description: "Updated description" as const,
	};

	it("updates property definition successfully", async () => {
		vi.mocked(getPropertyDefinition).mockResolvedValueOnce(makePropertyDefinition());
		const updated = makePropertyDefinition({
			name: "updated_property",
			description: "Updated description",
		});
		vi.mocked(updatePropertyDefinition).mockResolvedValueOnce(updated);

		const ctx = createTestContext();
		const result = await call(propertyDefinitionsRouter.update, input, { context: ctx });

		expect(updatePropertyDefinition).toHaveBeenCalledWith(
			expect.anything(),
			PROP_DEF_ID,
			expect.objectContaining({
				name: "updated_property",
				description: "Updated description",
			}),
		);
		expect(result).toEqual(updated);
	});

	it("throws NOT_FOUND for different org", async () => {
		vi.mocked(getPropertyDefinition).mockResolvedValueOnce(
			makePropertyDefinition({ organizationId: "other-org" }),
		);

		const ctx = createTestContext();
		await expect(
			call(propertyDefinitionsRouter.update, input, { context: ctx }),
		).rejects.toSatisfy((e: ORPCError<string, unknown>) => e.code === "NOT_FOUND");
	});
});

// =============================================================================
// remove
// =============================================================================

describe("remove", () => {
	it("deletes property definition successfully", async () => {
		vi.mocked(getPropertyDefinition).mockResolvedValueOnce(makePropertyDefinition());
		vi.mocked(deletePropertyDefinition).mockResolvedValueOnce(undefined);

		const ctx = createTestContext();
		const result = await call(
			propertyDefinitionsRouter.remove,
			{ id: PROP_DEF_ID },
			{ context: ctx },
		);

		expect(deletePropertyDefinition).toHaveBeenCalledWith(
			expect.anything(),
			PROP_DEF_ID,
		);
		expect(result).toEqual({ success: true });
	});

	it("throws NOT_FOUND for different org", async () => {
		vi.mocked(getPropertyDefinition).mockResolvedValueOnce(
			makePropertyDefinition({ organizationId: "other-org" }),
		);

		const ctx = createTestContext();
		await expect(
			call(propertyDefinitionsRouter.remove, { id: PROP_DEF_ID }, { context: ctx }),
		).rejects.toSatisfy((e: ORPCError<string, unknown>) => e.code === "NOT_FOUND");
	});
});
