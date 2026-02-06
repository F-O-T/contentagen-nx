import { captureSDKAuthFailed } from "@packages/posthog/sdk/server";
import { auth } from "../integrations/auth";
import { posthog } from "../integrations/posthog";

/**
 * Resolves an API key from the request, checking multiple sources:
 * 1. `X-API-Key` header (preferred by SDK clients)
 * 2. `sdk-api-key` header (legacy SDK clients)
 * 3. `apiKey` query parameter (sendBeacon fallback)
 */
export function resolveApiKey(request: Request): string | null {
	const xApiKey = request.headers.get("X-API-Key");
	if (xApiKey) return xApiKey;

	const sdkApiKey = request.headers.get("sdk-api-key");
	if (sdkApiKey) return sdkApiKey;

	const url = new URL(request.url);
	const queryApiKey = url.searchParams.get("apiKey");
	if (queryApiKey) return queryApiKey;

	return null;
}

/**
 * Authenticates the request using the API key and returns the organizationId
 * and userId. Sets the appropriate error status on failure.
 */
export async function authenticateRequest(
	request: Request,
	set: { status?: number | string },
): Promise<
	| { success: true; organizationId: string; userId: string | undefined }
	| { success: false; error: string }
> {
	const endpoint = new URL(request.url).pathname;
	const apiKeyValue = resolveApiKey(request);

	if (!apiKeyValue) {
		captureSDKAuthFailed(posthog, {
			reason: "missing_api_key",
			endpoint,
		});
		set.status = 401;
		return { success: false, error: "Missing API Key." };
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
				success: false,
				error: "Rate limit exceeded. Please try again later.",
			};
		}

		set.status = 401;
		return { success: false, error: "Invalid API Key." };
	}

	const { organizationId } = result.key.metadata ?? {};

	if (!organizationId || typeof organizationId !== "string") {
		set.status = 403;
		return {
			success: false,
			error: "API key has no associated organization.",
		};
	}

	return {
		success: true,
		organizationId,
		userId: result.key.userId ?? undefined,
	};
}
