import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";

const PRODUCTION_API_URL = "https://api.contentagen.com";

export interface SdkConfig {
	apiKey: string;
	host?: string;
}

/**
 * Create a type-safe SDK client for Contentta API
 *
 * @example
 * ```typescript
 * const sdk = createSdk({ apiKey: "your-api-key" });
 *
 * // List content by agent
 * const { posts, total } = await sdk.content.list({
 *   agentId: "agent-uuid",
 *   limit: "10",
 *   page: "1",
 * });
 *
 * // Get content by slug
 * const content = await sdk.content.get({
 *   agentId: "agent-uuid",
 *   slug: "my-post",
 * });
 *
 * // Track events
 * await sdk.events.track({
 *   eventName: "page_view",
 *   properties: { page: "/blog/my-post" },
 * });
 *
 * // Get form and submit
 * const form = await sdk.forms.get({ formId: "form-uuid" });
 * await sdk.forms.submit({
 *   formId: "form-uuid",
 *   data: { email: "user@example.com" },
 * });
 * ```
 */
/**
 * Create a type-safe SDK client for Contentta API.
 * Returns an oRPC client with methods for content, events, and forms.
 */
export function createSdk(config: SdkConfig) {
	if (!config.apiKey) {
		throw new Error("apiKey is required to initialize the SDK");
	}

	const host = config.host || PRODUCTION_API_URL;
	const baseUrl = `${host.replace(/\/+$/, "")}/sdk`;

	const link = new RPCLink({
		url: baseUrl,
		headers: {
			"sdk-api-key": config.apiKey,
		},
	});

	return createORPCClient(link);
}

export { ContenttaChangelogClient } from "./changelog.ts";
// Re-export types
export type { SdkRouter } from "./types";
