/**
 * Browser-specific SDK entry point
 *
 * Provides Forms and Event Tracking clients for browser environments.
 * Use this when you need client-side analytics and form handling.
 *
 * @example
 * ```typescript
 * import { createBrowserSdk } from "@contentta/sdk/browser";
 *
 * const sdk = createBrowserSdk({
 *   apiKey: "your-api-key",
 *   organizationId: "org-uuid",
 * });
 *
 * // Track events
 * sdk.tracker.track("page_view", { page: "/blog" });
 * sdk.tracker.autoTrackPageViews("content-id", "content-slug");
 *
 * // Embed forms
 * await sdk.forms.embedForm("form-id", "container-id");
 * ```
 */

// ── Re-exports from Forms ───────────────────────────────────────

export type { FormDefinition, FormField } from "./forms.ts";
export {
	ContenttaFormsClient,
	createFormsClient,
} from "./forms.ts";

// ── Re-exports from Event Tracker ──────────────────────────────

export {
	ContenttaEventTracker,
	createEventTracker,
	createEventTracker as createTracker,
} from "./events/client.ts";

export type {
	ContenttaSdkConfig,
	EventBatch,
	TrackedEvent,
} from "./events/types.ts";

// ── Browser SDK Factory ─────────────────────────────────────────

import { createEventTracker } from "./events/client.ts";
import type { ContenttaSdkConfig } from "./events/types.ts";
import { createFormsClient } from "./forms.ts";

export interface BrowserSdk {
	tracker: ReturnType<typeof createEventTracker>;
	forms: ReturnType<typeof createFormsClient>;
}

/**
 * Create a unified browser SDK with both event tracking and forms
 *
 * @param config - SDK configuration (apiKey, organizationId, etc.)
 * @returns Object with tracker and forms clients
 *
 * @example
 * ```typescript
 * const sdk = createBrowserSdk({
 *   apiKey: "your-api-key",
 *   organizationId: "org-uuid",
 *   debug: true,
 * });
 *
 * // Track events
 * sdk.tracker.track("page_view", { page: "/blog" });
 *
 * // Embed forms
 * await sdk.forms.embedForm("form-id", "container-id");
 * ```
 */
export function createBrowserSdk(config: ContenttaSdkConfig): BrowserSdk {
	const tracker = createEventTracker(config);
	const forms = createFormsClient(config, tracker);

	return { tracker, forms };
}
