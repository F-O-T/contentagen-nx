import type { Action } from "@packages/database/schemas/actions";
import type { Annotation } from "@packages/database/schemas/annotations";
import type { Content } from "@packages/database/schemas/content";
import type { Dashboard } from "@packages/database/schemas/dashboards";
import type { DataSource } from "@packages/database/schemas/data-sources";
import type { EventCatalogEntry } from "@packages/database/schemas/event-catalog";
import type { Form } from "@packages/database/schemas/forms";
import type { Insight } from "@packages/database/schemas/insights";
import type { PersonalApiKey } from "@packages/database/schemas/personal-api-key";
import type { PropertyDefinition } from "@packages/database/schemas/property-definitions";
import type { WebhookEndpoint } from "@packages/database/schemas/webhooks";
import { TEST_ORG_ID, TEST_TEAM_ID, TEST_USER_ID } from "./create-test-context";

// =============================================================================
// Shared Constants
// =============================================================================

export const CONTENT_ID = "a0a0a0a0-b1b1-4c2c-9d3d-e4e4e4e4e4e4";
export const ENDPOINT_ID = "a0a0a0a0-b1b1-4c2c-9d3d-e4e4e4e4e4e4";
export const FORM_ID = "a0a0a0a0-b1b1-4c2c-9d3d-e4e4e4e4e4e4";
export const DASHBOARD_ID = "d0d0d0d0-e1e1-4f2f-a3a3-b4b4b4b4b4b4";
export const INSIGHT_ID = "a0a0a0a0-b1b1-4c2c-a3a3-d4d4d4d4d4d4";
export const KEY_ID = "a0a0a0a0-b1b1-4c2c-9d3d-e4e4e4e4e4e4";
export const ACTION_ID = "a0a0a0a0-b1b1-4c2c-9d3d-f5f5f5f5f5f5";
export const PROP_DEF_ID = "b1b1b1b1-c2c2-4d3d-a4a4-e5e5e5e5e5e5";
export const DATA_SOURCE_ID = "c2c2c2c2-d3d3-4e4e-b5b5-f6f6f6f6f6f6";
export const ANNOTATION_ID = "d3d3d3d3-e4e4-4f5f-a6c6-a7a7a7a7a7a7";
export const EVENT_CATALOG_ID = "e4e4e4e4-f5f5-4a6a-a7d7-b8b8b8b8b8b8";

// =============================================================================
// Factory Functions
// =============================================================================

export function makeContent(overrides: Partial<Content> = {}): Content {
	return {
		id: CONTENT_ID,
		organizationId: TEST_ORG_ID,
		teamId: TEST_TEAM_ID,
		createdByMemberId: "member-1",
		body: "Hello world",
		status: "draft",
		shareStatus: "private",
		draftOrigin: "manual",
		meta: { title: "Test", description: "Desc", slug: "test" },
		request: null,
		stats: null,
		writerId: null,
		imageUrl: null,
		clusterConfig: overrides?.clusterConfig ?? {},
		createdAt: new Date("2026-01-01"),
		updatedAt: new Date("2026-01-01"),
		...overrides,
	};
}

export function makeWebhookEndpoint(
	overrides: Partial<WebhookEndpoint> = {},
): WebhookEndpoint {
	return {
		id: ENDPOINT_ID,
		organizationId: TEST_ORG_ID,
		teamId: TEST_TEAM_ID,
		url: "https://example.com/webhook",
		signingSecret: "whsec_1234567890abcdef",
		apiKeyId: null,
		eventPatterns: ["content.page.published"],
		description: "Test webhook",
		isActive: true,
		failureCount: 0,
		lastSuccessAt: null,
		lastFailureAt: null,
		createdAt: new Date("2026-01-01"),
		updatedAt: new Date("2026-01-01"),
		...overrides,
	};
}

export function makeForm(overrides: Partial<Form> = {}): Form {
	return {
		id: FORM_ID,
		organizationId: TEST_ORG_ID,
		teamId: TEST_TEAM_ID,
		name: "Contact Form",
		description: null,
		fields: [{ id: "f1", type: "text", label: "Name", required: true }],
		settings: {},
		isActive: true,
		title: null,
		subtitle: null,
		icon: null,
		buttonText: "Enviar",
		layout: "card",
		createdAt: new Date("2026-01-01"),
		updatedAt: new Date("2026-01-01"),
		...overrides,
	};
}

export function makeDashboard(
	overrides: Partial<Dashboard> = {},
): Dashboard {
	return {
		id: DASHBOARD_ID,
		organizationId: TEST_ORG_ID,
		teamId: TEST_TEAM_ID,
		createdBy: TEST_USER_ID,
		name: "My Dashboard",
		description: "Test dashboard",
		isDefault: false,
		tiles: [],
		globalDateRange: null,
		globalFilters: null,
		createdAt: new Date("2026-01-01"),
		updatedAt: new Date("2026-01-01"),
		...overrides,
	};
}

export function makeInsight(overrides: Partial<Insight> = {}): Insight {
	return {
		id: INSIGHT_ID,
		organizationId: TEST_ORG_ID,
		teamId: TEST_TEAM_ID,
		createdBy: TEST_USER_ID,
		name: "My Insight",
		description: "Test insight",
		type: "trends",
		config: { metric: "pageViews" },
		defaultSize: "md",
		cachedResults: null,
		lastComputedAt: null,
		createdAt: new Date("2026-01-01"),
		updatedAt: new Date("2026-01-01"),
		...overrides,
	};
}

export function makePersonalApiKey(
	overrides: Partial<PersonalApiKey> = {},
): PersonalApiKey {
	return {
		id: KEY_ID,
		userId: TEST_USER_ID,
		label: "My API Key",
		keyHash: "hashed_key_value",
		keyPrefix: "AbCdEfGh",
		scopes: { content: "write", agent: "read" },
		organizationAccess: "all",
		lastUsedAt: null,
		createdAt: new Date("2026-01-15"),
		expiresAt: null,
		...overrides,
	};
}

export function makeAction(overrides: Partial<Action> = {}): Action {
	return {
		id: ACTION_ID,
		organizationId: TEST_ORG_ID,
		name: "Page View + Scroll",
		description: "Compound action for engaged views",
		eventPatterns: ["content.page.viewed", "content.page.scrolled"],
		matchType: "all",
		isActive: true,
		createdBy: TEST_USER_ID,
		createdAt: new Date("2026-01-01"),
		updatedAt: new Date("2026-01-01"),
		...overrides,
	};
}

export function makePropertyDefinition(
	overrides: Partial<PropertyDefinition> = {},
): PropertyDefinition {
	return {
		id: PROP_DEF_ID,
		organizationId: TEST_ORG_ID,
		name: "page_url",
		type: "string",
		description: "URL of the page",
		eventNames: ["content.page.viewed"],
		isNumerical: false,
		tags: ["web"],
		createdAt: new Date("2026-01-01"),
		updatedAt: new Date("2026-01-01"),
		...overrides,
	};
}

export function makeDataSource(
	overrides: Partial<DataSource> = {},
): DataSource {
	return {
		id: DATA_SOURCE_ID,
		organizationId: TEST_ORG_ID,
		name: "Website SDK",
		type: "sdk",
		description: "JavaScript SDK integration",
		config: { domain: "example.com" },
		isActive: true,
		lastEventAt: null,
		eventCount: 0,
		createdAt: new Date("2026-01-01"),
		updatedAt: new Date("2026-01-01"),
		...overrides,
	};
}

export function makeAnnotation(
	overrides: Partial<Annotation> = {},
): Annotation {
	return {
		id: ANNOTATION_ID,
		organizationId: TEST_ORG_ID,
		createdBy: TEST_USER_ID,
		type: "manual",
		title: "Marketing campaign launched",
		description: "Q1 campaign start",
		date: new Date("2026-02-01"),
		scope: "global",
		metadata: null,
		createdAt: new Date("2026-01-01"),
		...overrides,
	};
}

export function makeEventCatalogEntry(
	overrides: Partial<EventCatalogEntry> = {},
): EventCatalogEntry {
	return {
		id: EVENT_CATALOG_ID,
		eventName: "content.page.viewed",
		category: "content",
		pricePerEvent: "0.000100",
		freeTierLimit: 1000,
		displayName: "Page View",
		description: "Fired when a page is viewed",
		isBillable: true,
		isActive: true,
		createdAt: new Date("2026-01-01"),
		updatedAt: new Date("2026-01-01"),
		...overrides,
	};
}
