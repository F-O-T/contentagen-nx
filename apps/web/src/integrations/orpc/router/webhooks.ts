import { ORPCError } from "@orpc/server";
import {
	createWebhookEndpoint,
	deleteWebhookEndpoint,
	getWebhookDeliveries,
	getWebhookEndpoint,
	listWebhookEndpoints,
	updateWebhookEndpoint,
} from "@packages/database/repositories/webhook-repository";
import { z } from "zod";
import { protectedProcedure } from "../server";

// =============================================================================
// Validation Schemas
// =============================================================================

const createWebhookSchema = z.object({
	url: z.string().url(),
	description: z.string().optional(),
	eventPatterns: z.array(z.string()).min(1),
});

const updateWebhookSchema = z.object({
	id: z.string().uuid(),
	url: z.string().url().optional(),
	description: z.string().optional(),
	eventPatterns: z.array(z.string()).min(1).optional(),
	isActive: z.boolean().optional(),
});

// =============================================================================
// Webhook Procedures
// =============================================================================

/**
 * Create a new webhook endpoint
 */
export const create = protectedProcedure
	.input(createWebhookSchema)
	.handler(async ({ context, input }) => {
		const { organizationId, db } = context;

		const endpoint = await createWebhookEndpoint(db, {
			organizationId,
			url: input.url,
			description: input.description,
			eventPatterns: input.eventPatterns,
		});

		return endpoint;
	});

/**
 * List all webhook endpoints for the organization
 */
export const list = protectedProcedure.handler(async ({ context }) => {
	const { organizationId, db } = context;

	const endpoints = await listWebhookEndpoints(db, organizationId);

	// Mask signing secrets in responses
	return endpoints.map((e) => ({
		...e,
		signingSecret: `${e.signingSecret.slice(0, 8)}...`,
	}));
});

/**
 * Get webhook endpoint details
 */
export const getById = protectedProcedure
	.input(z.object({ id: z.string().uuid() }))
	.handler(async ({ context, input }) => {
		const { organizationId, db } = context;

		const endpoint = await getWebhookEndpoint(db, input.id);

		if (!endpoint || endpoint.organizationId !== organizationId) {
			throw new ORPCError("NOT_FOUND", {
				message: "Webhook endpoint não encontrado.",
			});
		}

		return {
			...endpoint,
			signingSecret: `${endpoint.signingSecret.slice(0, 8)}...`,
		};
	});

/**
 * Update webhook endpoint
 */
export const update = protectedProcedure
	.input(updateWebhookSchema)
	.handler(async ({ context, input }) => {
		const { organizationId, db } = context;

		const endpoint = await getWebhookEndpoint(db, input.id);

		if (!endpoint || endpoint.organizationId !== organizationId) {
			throw new ORPCError("NOT_FOUND", {
				message: "Webhook endpoint não encontrado.",
			});
		}

		const { id: _id, ...updateData } = input;
		const updated = await updateWebhookEndpoint(db, input.id, updateData);
		return updated;
	});

/**
 * Delete webhook endpoint
 */
export const remove = protectedProcedure
	.input(z.object({ id: z.string().uuid() }))
	.handler(async ({ context, input }) => {
		const { organizationId, db } = context;

		const endpoint = await getWebhookEndpoint(db, input.id);

		if (!endpoint || endpoint.organizationId !== organizationId) {
			throw new ORPCError("NOT_FOUND", {
				message: "Webhook endpoint não encontrado.",
			});
		}

		await deleteWebhookEndpoint(db, input.id);
		return { success: true };
	});

/**
 * List deliveries for a webhook endpoint
 */
export const deliveries = protectedProcedure
	.input(
		z.object({
			webhookId: z.string().uuid(),
			page: z.number().min(1).optional().default(1),
			limit: z.number().min(1).max(100).optional().default(50),
		}),
	)
	.handler(async ({ context, input }) => {
		const { organizationId, db } = context;

		const endpoint = await getWebhookEndpoint(db, input.webhookId);

		if (!endpoint || endpoint.organizationId !== organizationId) {
			throw new ORPCError("NOT_FOUND", {
				message: "Webhook endpoint não encontrado.",
			});
		}

		const items = await getWebhookDeliveries(db, input.webhookId, {
			offset: (input.page - 1) * input.limit,
			limit: input.limit,
		});

		return { items, page: input.page, limit: input.limit };
	});
