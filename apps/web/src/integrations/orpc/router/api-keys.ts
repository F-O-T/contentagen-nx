import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { protectedProcedure } from "../server";

/**
 * List all API keys for the current organization
 */
export const list = protectedProcedure.handler(async ({ context }) => {
	const { auth, headers, organizationId } = context;

	const keys = await auth.api.listApiKeys({
		headers,
	});

	// Filter to show only keys for current organization
	return keys.filter(
		(key) => key.metadata?.organizationId === organizationId,
	);
});

/**
 * Get a specific API key by ID
 */
export const get = protectedProcedure
	.input(
		z.object({
			keyId: z.string(),
		}),
	)
	.handler(async ({ context, input }) => {
		const { auth, headers, organizationId } = context;

		const key = await auth.api.getApiKey({
			query: { keyId: input.keyId },
			headers,
		});

		if (key?.metadata?.organizationId !== organizationId) {
			throw new ORPCError("FORBIDDEN", {
				message: "API key not found",
			});
		}

		return key;
	});
