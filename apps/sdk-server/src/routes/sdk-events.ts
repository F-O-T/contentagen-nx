import {
	type EventCategory,
	getEventCategory,
} from "@packages/events/catalog";
import { emitEventBatch } from "@packages/events/emit";
import { Elysia, t } from "elysia";
import { db } from "../integrations/database";
import { posthog } from "../integrations/posthog";
import { authenticateRequest, checkDomainAllowed } from "../utils/sdk-auth";

export const sdkEventRoutes = new Elysia({
	prefix: "/sdk",
}).post(
	"/events",
	async ({ body, request, set }) => {
		const authResult = await authenticateRequest(request, set);
		if (!authResult.success) {
			return {
				success: false as const,
				error: authResult.error,
			};
		}

		const domainCheck = await checkDomainAllowed(
			request,
			authResult.teamId,
			db,
		);
		if (!domainCheck.allowed) {
			set.status = 403;
			return {
				success: false as const,
				error: domainCheck.reason,
			};
		}

		const { organizationId, userId } = authResult;
		const ipAddress =
			request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
			request.headers.get("x-real-ip") ??
			undefined;
		const userAgent = request.headers.get("user-agent") ?? undefined;

		// Validate events and split into accepted/rejected
		const validEvents: Array<{
			organizationId: string;
			eventName: string;
			eventCategory: EventCategory;
			properties: Record<string, unknown>;
			userId?: string;
			ipAddress?: string;
			userAgent?: string;
		}> = [];
		let eventsRejected = 0;

		for (const event of body.events) {
			const category = getEventCategory(event.eventName);

			if (!category) {
				eventsRejected++;
				continue;
			}

			validEvents.push({
				organizationId,
				eventName: event.eventName,
				eventCategory: category,
				properties: {
					...event.properties,
					...(event.timestamp ? { sdk_timestamp: event.timestamp } : {}),
				},
				userId: userId ?? undefined,
				ipAddress,
				userAgent,
			});
		}

		// Batch-emit all valid events
		if (validEvents.length > 0) {
			await emitEventBatch({
				db,
				posthog,
				events: validEvents,
			});
		}

		return {
			success: true as const,
			eventsProcessed: validEvents.length,
			eventsRejected,
		};
	},
	{
		body: t.Object({
			events: t.Array(
				t.Object({
					eventName: t.String(),
					properties: t.Record(t.String(), t.Unknown()),
					timestamp: t.Optional(t.Number()),
				}),
				{ maxItems: 100 },
			),
		}),
	},
);
