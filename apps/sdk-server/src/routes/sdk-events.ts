import {
	type EventCategory,
	getEventCategory,
} from "@packages/events/catalog";
import { emitEventBatch } from "@packages/events/emit";
import { captureSDKAuthFailed } from "@packages/posthog/sdk/server";

import { Elysia, t } from "elysia";
import { auth } from "../integrations/auth";
import { db } from "../integrations/database";
import { posthog } from "../integrations/posthog";

/**
 * Resolves an API key from the request, checking multiple sources:
 * 1. `X-API-Key` header (preferred by SDK event tracker)
 * 2. `sdk-api-key` header (legacy SDK clients)
 * 3. `apiKey` query parameter (sendBeacon fallback)
 */
function resolveApiKey(request: Request): string | null {
	const xApiKey = request.headers.get("X-API-Key");
	if (xApiKey) return xApiKey;

	const sdkApiKey = request.headers.get("sdk-api-key");
	if (sdkApiKey) return sdkApiKey;

	const url = new URL(request.url);
	const queryApiKey = url.searchParams.get("apiKey");
	if (queryApiKey) return queryApiKey;

	return null;
}

export const sdkEventRoutes = new Elysia({
	prefix: "/sdk",
}).post(
	"/events",
	async ({ body, request, set }) => {
		const endpoint = new URL(request.url).pathname;
		const apiKeyValue = resolveApiKey(request);

		if (!apiKeyValue) {
			captureSDKAuthFailed(posthog, {
				reason: "missing_api_key",
				endpoint,
			});
			set.status = 401;
			return {
				success: false as const,
				error: "Missing API Key.",
			};
		}

		const result = await auth.api.verifyApiKey({
			body: { key: apiKeyValue },
		});

		if (!result.valid || !result.key) {
			const isRateLimited = result.error?.code === "RATE_LIMITED";
			const reason = isRateLimited ? "rate_limited" : "invalid_key";

			captureSDKAuthFailed(posthog, {
				reason,
				endpoint,
				organizationId: result.key?.metadata?.organizationId as
					| string
					| undefined,
				plan: result.key?.metadata?.plan as string | undefined,
				remaining: result.key?.remaining ?? undefined,
			});

			if (isRateLimited) {
				set.status = 429;
				return {
					success: false as const,
					error: "Rate limit exceeded. Please try again later.",
				};
			}

			set.status = 401;
			return {
				success: false as const,
				error: "Invalid API Key.",
			};
		}

		const { organizationId } = result.key.metadata ?? {};

		if (!organizationId || typeof organizationId !== "string") {
			set.status = 403;
			return {
				success: false as const,
				error: "API key has no associated organization.",
			};
		}

		const userId = result.key.userId;
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
