import { pgTable, index, foreignKey, uuid, text, integer, timestamp, boolean, uniqueIndex, unique, jsonb, numeric, pgMaterializedView, date, bigint, pgEnum } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const chatMessageRole = pgEnum("chat_message_role", ['user', 'assistant'])
export const chatMessageType = pgEnum("chat_message_type", ['text', 'plan', 'tool-use', 'execution-separator'])
export const chatMode = pgEnum("chat_mode", ['plan', 'writer'])
export const contentShareStatus = pgEnum("content_share_status", ['private', 'shared'])
export const contentStatus = pgEnum("content_status", ['draft', 'published', 'archived'])
export const draftOrigin = pgEnum("draft_origin", ['manual', 'ai_generated'])
export const exportDestination = pgEnum("export_destination", ['download', 'github', 'notion', 'wordpress', 'custom_api'])
export const exportFormat = pgEnum("export_format", ['md', 'json', 'html'])
export const granteeType = pgEnum("grantee_type", ['user', 'team'])
export const permissionLevel = pgEnum("permission_level", ['view', 'edit', 'manage'])
export const relatedContentType = pgEnum("related_content_type", ['manual', 'ai_suggested'])
export const resourceType = pgEnum("resource_type", ['content', 'agent', 'brand'])


export const apikey = pgTable("apikey", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: text(),
	start: text(),
	prefix: text(),
	key: text().notNull(),
	userId: uuid("user_id").notNull(),
	refillInterval: integer("refill_interval"),
	refillAmount: integer("refill_amount"),
	lastRefillAt: timestamp("last_refill_at", { mode: 'string' }),
	enabled: boolean().default(true),
	rateLimitEnabled: boolean("rate_limit_enabled").default(true),
	rateLimitTimeWindow: integer("rate_limit_time_window").default(60000),
	rateLimitMax: integer("rate_limit_max").default(100),
	requestCount: integer("request_count").default(0),
	remaining: integer(),
	lastRequest: timestamp("last_request", { mode: 'string' }),
	expiresAt: timestamp("expires_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).notNull(),
	permissions: text(),
	metadata: text(),
}, (table) => [
	index("apikey_key_idx").using("btree", table.key.asc().nullsLast().op("text_ops")),
	index("apikey_userId_idx").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "apikey_user_id_user_id_fk"
		}).onDelete("cascade"),
]);

export const organization = pgTable("organization", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: text().notNull(),
	slug: text().notNull(),
	logo: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).notNull(),
	metadata: text(),
	context: text().default('personal'),
	description: text().default('),
	onboardingCompleted: boolean("onboarding_completed").default(false),
	publicApiKey: text("public_api_key"),
}, (table) => [
	uniqueIndex("organization_slug_uidx").using("btree", table.slug.asc().nullsLast().op("text_ops")),
	unique("organization_slug_unique").on(table.slug),
]);

export const session = pgTable("session", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }).notNull(),
	token: text().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).notNull(),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	userId: uuid("user_id").notNull(),
	impersonatedBy: text("impersonated_by"),
	activeOrganizationId: text("active_organization_id"),
	activeTeamId: text("active_team_id"),
}, (table) => [
	index("session_userId_idx").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "session_user_id_user_id_fk"
		}).onDelete("cascade"),
	unique("session_token_unique").on(table.token),
]);

export const account = pgTable("account", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	accountId: text("account_id").notNull(),
	providerId: text("provider_id").notNull(),
	userId: uuid("user_id").notNull(),
	accessToken: text("access_token"),
	refreshToken: text("refresh_token"),
	idToken: text("id_token"),
	accessTokenExpiresAt: timestamp("access_token_expires_at", { mode: 'string' }),
	refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { mode: 'string' }),
	scope: text(),
	password: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).notNull(),
}, (table) => [
	index("account_userId_idx").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "account_user_id_user_id_fk"
		}).onDelete("cascade"),
]);

export const subscription = pgTable("subscription", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	plan: text().notNull(),
	referenceId: text("reference_id").notNull(),
	stripeCustomerId: text("stripe_customer_id"),
	stripeSubscriptionId: text("stripe_subscription_id"),
	status: text().default('incomplete'),
	periodStart: timestamp("period_start", { mode: 'string' }),
	periodEnd: timestamp("period_end", { mode: 'string' }),
	trialStart: timestamp("trial_start", { mode: 'string' }),
	trialEnd: timestamp("trial_end", { mode: 'string' }),
	cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false),
	seats: integer(),
	cancelAt: timestamp("cancel_at", { mode: 'string' }),
	canceledAt: timestamp("canceled_at", { mode: 'string' }),
	endedAt: timestamp("ended_at", { mode: 'string' }),
});

export const twoFactor = pgTable("two_factor", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	secret: text().notNull(),
	backupCodes: text("backup_codes").notNull(),
	userId: uuid("user_id").notNull(),
}, (table) => [
	index("twoFactor_secret_idx").using("btree", table.secret.asc().nullsLast().op("text_ops")),
	index("twoFactor_userId_idx").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "two_factor_user_id_user_id_fk"
		}).onDelete("cascade"),
]);

export const verification = pgTable("verification", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	identifier: text().notNull(),
	value: text().notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("verification_identifier_idx").using("btree", table.identifier.asc().nullsLast().op("text_ops")),
]);

export const chatSession = pgTable("chat_session", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	contentId: uuid("content_id").notNull(),
	organizationId: uuid("organization_id").notNull(),
	mode: chatMode().default('plan'),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("chat_session_content_id_idx").using("btree", table.contentId.asc().nullsLast().op("uuid_ops")),
	index("chat_session_organization_id_idx").using("btree", table.organizationId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.contentId],
			foreignColumns: [content.id],
			name: "chat_session_content_id_content_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.organizationId],
			foreignColumns: [organization.id],
			name: "chat_session_organization_id_organization_id_fk"
		}).onDelete("cascade"),
]);

export const content = pgTable("content", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	writerId: uuid("writer_id"),
	organizationId: uuid("organization_id").notNull(),
	createdByMemberId: uuid("created_by_member_id").notNull(),
	body: text().default('),
	imageUrl: text("image_url"),
	status: contentStatus().default('draft').notNull(),
	shareStatus: contentShareStatus("share_status").default('private').notNull(),
	draftOrigin: draftOrigin("draft_origin").default('manual').notNull(),
	meta: jsonb().notNull(),
	request: jsonb(),
	stats: jsonb(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	teamId: uuid("team_id"),
}, (table) => [
	index("content_created_by_member_id_idx").using("btree", table.createdByMemberId.asc().nullsLast().op("uuid_ops")),
	index("content_draft_origin_idx").using("btree", table.draftOrigin.asc().nullsLast().op("enum_ops")),
	index("content_organization_id_idx").using("btree", table.organizationId.asc().nullsLast().op("uuid_ops")),
	index("content_slug_idx").using("btree", table.organizationId.asc().nullsLast().op("uuid_ops")),
	index("content_status_idx").using("btree", table.status.asc().nullsLast().op("enum_ops")),
	index("content_team_id_idx").using("btree", table.teamId.asc().nullsLast().op("uuid_ops")),
	index("content_writer_id_idx").using("btree", table.writerId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.writerId],
			foreignColumns: [writer.id],
			name: "content_writer_id_writer_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.organizationId],
			foreignColumns: [organization.id],
			name: "content_organization_id_organization_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.createdByMemberId],
			foreignColumns: [member.id],
			name: "content_created_by_member_id_member_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.teamId],
			foreignColumns: [team.id],
			name: "content_team_id_team_id_fk"
		}).onDelete("cascade"),
]);

export const user = pgTable("user", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: text().notNull(),
	email: text().notNull(),
	emailVerified: boolean("email_verified").default(false).notNull(),
	image: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	stripeCustomerId: text("stripe_customer_id"),
	role: text(),
	banned: boolean().default(false),
	banReason: text("ban_reason"),
	banExpires: timestamp("ban_expires", { mode: 'string' }),
	twoFactorEnabled: boolean("two_factor_enabled").default(false),
	telemetryConsent: boolean("telemetry_consent").default(false).notNull(),
	contentCreationMode: text("content_creation_mode").default('plan'),
}, (table) => [
	unique("user_email_unique").on(table.email),
]);

export const jwks = pgTable("jwks", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	publicKey: text("public_key").notNull(),
	privateKey: text("private_key").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }),
});

export const oauthRefreshToken = pgTable("oauth_refresh_token", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	token: text().notNull(),
	clientId: text("client_id").notNull(),
	sessionId: uuid("session_id"),
	userId: uuid("user_id").notNull(),
	referenceId: text("reference_id"),
	expiresAt: timestamp("expires_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }),
	revoked: timestamp({ mode: 'string' }),
	scopes: text().array().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.clientId],
			foreignColumns: [oauthClient.clientId],
			name: "oauth_refresh_token_client_id_oauth_client_client_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.sessionId],
			foreignColumns: [session.id],
			name: "oauth_refresh_token_session_id_session_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "oauth_refresh_token_user_id_user_id_fk"
		}).onDelete("cascade"),
]);

export const oauthConsent = pgTable("oauth_consent", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	clientId: text("client_id").notNull(),
	userId: uuid("user_id"),
	referenceId: text("reference_id"),
	scopes: text().array().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.clientId],
			foreignColumns: [oauthClient.clientId],
			name: "oauth_consent_client_id_oauth_client_client_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "oauth_consent_user_id_user_id_fk"
		}).onDelete("cascade"),
]);

export const eventCatalog = pgTable("event_catalog", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	eventName: text("event_name").notNull(),
	category: text().notNull(),
	pricePerEvent: numeric("price_per_event", { precision: 10, scale:  6 }).notNull(),
	freeTierLimit: integer("free_tier_limit").default(0).notNull(),
	displayName: text("display_name").notNull(),
	description: text(),
	isBillable: boolean("is_billable").default(true).notNull(),
	isActive: boolean("is_active").default(true).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("event_catalog_event_name_unique").on(table.eventName),
]);

export const oauthClient = pgTable("oauth_client", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	clientId: text("client_id").notNull(),
	clientSecret: text("client_secret"),
	disabled: boolean().default(false),
	skipConsent: boolean("skip_consent"),
	enableEndSession: boolean("enable_end_session"),
	scopes: text().array(),
	userId: uuid("user_id"),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
	name: text(),
	uri: text(),
	icon: text(),
	contacts: text().array(),
	tos: text(),
	policy: text(),
	softwareId: text("software_id"),
	softwareVersion: text("software_version"),
	softwareStatement: text("software_statement"),
	redirectUris: text("redirect_uris").array().notNull(),
	postLogoutRedirectUris: text("post_logout_redirect_uris").array(),
	tokenEndpointAuthMethod: text("token_endpoint_auth_method"),
	grantTypes: text("grant_types").array(),
	responseTypes: text("response_types").array(),
	public: boolean(),
	type: text(),
	referenceId: text("reference_id"),
	metadata: jsonb(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "oauth_client_user_id_user_id_fk"
		}).onDelete("cascade"),
	unique("oauth_client_client_id_unique").on(table.clientId),
]);

export const events = pgTable("events", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	organizationId: uuid("organization_id").notNull(),
	eventName: text("event_name").notNull(),
	eventCategory: text("event_category").notNull(),
	properties: jsonb().notNull(),
	userId: uuid("user_id"),
	isBillable: boolean("is_billable").default(true).notNull(),
	pricePerEvent: numeric("price_per_event", { precision: 10, scale:  6 }),
	timestamp: timestamp({ mode: 'string' }).defaultNow().notNull(),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	teamId: uuid("team_id").notNull(),
}, (table) => [
	index("events_category_idx").using("btree", table.eventCategory.asc().nullsLast().op("text_ops")),
	index("events_name_idx").using("btree", table.eventName.asc().nullsLast().op("text_ops")),
	index("events_org_time_idx").using("btree", table.organizationId.asc().nullsLast().op("timestamp_ops"), table.timestamp.asc().nullsLast().op("timestamp_ops")),
	index("events_team_time_idx").using("btree", table.teamId.asc().nullsLast().op("timestamp_ops"), table.timestamp.asc().nullsLast().op("timestamp_ops")),
	index("events_timestamp_idx").using("btree", table.timestamp.asc().nullsLast().op("timestamp_ops")),
	foreignKey({
			columns: [table.organizationId],
			foreignColumns: [organization.id],
			name: "events_organization_id_organization_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "events_user_id_user_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.teamId],
			foreignColumns: [team.id],
			name: "events_team_id_team_id_fk"
		}).onDelete("cascade"),
]);

export const oauthAccessToken = pgTable("oauth_access_token", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	token: text(),
	clientId: text("client_id").notNull(),
	sessionId: uuid("session_id"),
	userId: uuid("user_id"),
	referenceId: text("reference_id"),
	refreshId: uuid("refresh_id"),
	expiresAt: timestamp("expires_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }),
	scopes: text().array().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.clientId],
			foreignColumns: [oauthClient.clientId],
			name: "oauth_access_token_client_id_oauth_client_client_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.sessionId],
			foreignColumns: [session.id],
			name: "oauth_access_token_session_id_session_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "oauth_access_token_user_id_user_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.refreshId],
			foreignColumns: [oauthRefreshToken.id],
			name: "oauth_access_token_refresh_id_oauth_refresh_token_id_fk"
		}).onDelete("cascade"),
	unique("oauth_access_token_token_unique").on(table.token),
]);

export const personalApiKey = pgTable("personal_api_key", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	label: text().notNull(),
	keyHash: text("key_hash").notNull(),
	keyPrefix: text("key_prefix").notNull(),
	scopes: jsonb().notNull(),
	organizationAccess: jsonb("organization_access").notNull(),
	lastUsedAt: timestamp("last_used_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }),
}, (table) => [
	uniqueIndex("personal_api_key_key_prefix_uidx").using("btree", table.keyPrefix.asc().nullsLast().op("text_ops")),
	index("personal_api_key_user_id_idx").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "personal_api_key_user_id_user_id_fk"
		}).onDelete("cascade"),
]);

export const invitation = pgTable("invitation", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	organizationId: uuid("organization_id").notNull(),
	email: text().notNull(),
	role: text(),
	teamId: text("team_id"),
	status: text().default('pending').notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	inviterId: uuid("inviter_id").notNull(),
}, (table) => [
	index("invitation_email_idx").using("btree", table.email.asc().nullsLast().op("text_ops")),
	index("invitation_organizationId_idx").using("btree", table.organizationId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.organizationId],
			foreignColumns: [organization.id],
			name: "invitation_organization_id_organization_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.inviterId],
			foreignColumns: [user.id],
			name: "invitation_inviter_id_user_id_fk"
		}).onDelete("cascade"),
]);

export const team = pgTable("team", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: text().notNull(),
	organizationId: uuid("organization_id").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
	description: text().default('),
	allowedDomains: text("allowed_domains").array(),
	onboardingCompleted: boolean("onboarding_completed").default(false),
	onboardingProducts: jsonb("onboarding_products"),
	onboardingTasks: jsonb("onboarding_tasks"),
	publicApiKey: text("public_api_key"),
}, (table) => [
	index("team_organizationId_idx").using("btree", table.organizationId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.organizationId],
			foreignColumns: [organization.id],
			name: "team_organization_id_organization_id_fk"
		}).onDelete("cascade"),
]);

export const member = pgTable("member", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	organizationId: uuid("organization_id").notNull(),
	userId: uuid("user_id").notNull(),
	role: text().default('member').notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).notNull(),
}, (table) => [
	index("member_organizationId_idx").using("btree", table.organizationId.asc().nullsLast().op("uuid_ops")),
	index("member_userId_idx").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.organizationId],
			foreignColumns: [organization.id],
			name: "member_organization_id_organization_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "member_user_id_user_id_fk"
		}).onDelete("cascade"),
]);

export const resourcePermission = pgTable("resource_permission", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	organizationId: uuid("organization_id").notNull(),
	resourceType: resourceType("resource_type").notNull(),
	resourceId: uuid("resource_id").notNull(),
	granteeType: granteeType("grantee_type").notNull(),
	granteeId: uuid("grantee_id").notNull(),
	permission: permissionLevel().notNull(),
	grantedBy: uuid("granted_by").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("resource_permission_grantee_idx").using("btree", table.granteeType.asc().nullsLast().op("uuid_ops"), table.granteeId.asc().nullsLast().op("enum_ops")),
	index("resource_permission_organization_idx").using("btree", table.organizationId.asc().nullsLast().op("uuid_ops")),
	index("resource_permission_resource_idx").using("btree", table.resourceType.asc().nullsLast().op("uuid_ops"), table.resourceId.asc().nullsLast().op("enum_ops")),
	foreignKey({
			columns: [table.organizationId],
			foreignColumns: [organization.id],
			name: "resource_permission_organization_id_organization_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.grantedBy],
			foreignColumns: [user.id],
			name: "resource_permission_granted_by_user_id_fk"
		}).onDelete("cascade"),
	unique("resource_permission_unique").on(table.resourceType, table.resourceId, table.granteeType, table.granteeId),
]);

export const writer = pgTable("writer", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	organizationId: uuid("organization_id").notNull(),
	personaConfig: jsonb("persona_config").notNull(),
	profilePhotoUrl: text("profile_photo_url"),
	instructionMemories: jsonb("instruction_memories").default([]),
	lastGeneratedAt: timestamp("last_generated_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	teamId: uuid("team_id").notNull(),
}, (table) => [
	index("writer_organization_id_idx").using("btree", table.organizationId.asc().nullsLast().op("uuid_ops")),
	index("writer_team_idx").using("btree", table.teamId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.organizationId],
			foreignColumns: [organization.id],
			name: "writer_organization_id_organization_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.teamId],
			foreignColumns: [team.id],
			name: "writer_team_id_team_id_fk"
		}).onDelete("cascade"),
]);

export const webhookEndpoints = pgTable("webhook_endpoints", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	organizationId: uuid("organization_id").notNull(),
	url: text().notNull(),
	description: text(),
	eventPatterns: jsonb("event_patterns").notNull(),
	signingSecret: text("signing_secret").notNull(),
	isActive: boolean("is_active").default(true).notNull(),
	failureCount: integer("failure_count").default(0).notNull(),
	lastSuccessAt: timestamp("last_success_at", { mode: 'string' }),
	lastFailureAt: timestamp("last_failure_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("webhook_endpoints_active_idx").using("btree", table.isActive.asc().nullsLast().op("bool_ops")),
	index("webhook_endpoints_org_idx").using("btree", table.organizationId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.organizationId],
			foreignColumns: [organization.id],
			name: "webhook_endpoints_organization_id_organization_id_fk"
		}).onDelete("cascade"),
]);

export const formSubmissions = pgTable("form_submissions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	formId: uuid("form_id").notNull(),
	organizationId: uuid("organization_id").notNull(),
	data: jsonb().notNull(),
	metadata: jsonb(),
	submittedAt: timestamp("submitted_at", { mode: 'string' }).defaultNow().notNull(),
	teamId: uuid("team_id").notNull(),
}, (table) => [
	index("form_submissions_form_idx").using("btree", table.formId.asc().nullsLast().op("uuid_ops")),
	index("form_submissions_org_idx").using("btree", table.organizationId.asc().nullsLast().op("uuid_ops")),
	index("form_submissions_team_idx").using("btree", table.teamId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.formId],
			foreignColumns: [forms.id],
			name: "form_submissions_form_id_forms_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.organizationId],
			foreignColumns: [organization.id],
			name: "form_submissions_organization_id_organization_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.teamId],
			foreignColumns: [team.id],
			name: "form_submissions_team_id_team_id_fk"
		}).onDelete("cascade"),
]);

export const forms = pgTable("forms", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	organizationId: uuid("organization_id").notNull(),
	name: text().notNull(),
	description: text(),
	fields: jsonb().notNull(),
	settings: jsonb().default({}).notNull(),
	isActive: boolean("is_active").default(true).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	teamId: uuid("team_id").notNull(),
}, (table) => [
	index("forms_org_idx").using("btree", table.organizationId.asc().nullsLast().op("uuid_ops")),
	index("forms_team_idx").using("btree", table.teamId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.organizationId],
			foreignColumns: [organization.id],
			name: "forms_organization_id_organization_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.teamId],
			foreignColumns: [team.id],
			name: "forms_team_id_team_id_fk"
		}).onDelete("cascade"),
]);

export const annotations = pgTable("annotations", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	organizationId: uuid("organization_id").notNull(),
	createdBy: uuid("created_by"),
	type: text().default('manual').notNull(),
	title: text().notNull(),
	description: text(),
	date: timestamp({ mode: 'string' }).notNull(),
	scope: text().default('global').notNull(),
	metadata: jsonb(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.organizationId],
			foreignColumns: [organization.id],
			name: "annotations_organization_id_organization_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [user.id],
			name: "annotations_created_by_user_id_fk"
		}).onDelete("set null"),
]);

export const dashboards = pgTable("dashboards", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	organizationId: uuid("organization_id").notNull(),
	createdBy: uuid("created_by").notNull(),
	name: text().notNull(),
	description: text(),
	tiles: jsonb().default([]).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	isDefault: boolean("is_default").default(false).notNull(),
	teamId: uuid("team_id").notNull(),
}, (table) => [
	index("dashboards_team_idx").using("btree", table.teamId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.organizationId],
			foreignColumns: [organization.id],
			name: "dashboards_organization_id_organization_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [user.id],
			name: "dashboards_created_by_user_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.teamId],
			foreignColumns: [team.id],
			name: "dashboards_team_id_team_id_fk"
		}).onDelete("cascade"),
]);

export const insights = pgTable("insights", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	organizationId: uuid("organization_id").notNull(),
	createdBy: uuid("created_by").notNull(),
	name: text().notNull(),
	description: text(),
	type: text().notNull(),
	config: jsonb().notNull(),
	defaultSize: text("default_size").default('md').notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	teamId: uuid("team_id").notNull(),
}, (table) => [
	index("insights_team_idx").using("btree", table.teamId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.organizationId],
			foreignColumns: [organization.id],
			name: "insights_organization_id_organization_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [user.id],
			name: "insights_created_by_user_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.teamId],
			foreignColumns: [team.id],
			name: "insights_team_id_team_id_fk"
		}).onDelete("cascade"),
]);

export const actions = pgTable("actions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	organizationId: uuid("organization_id").notNull(),
	name: text().notNull(),
	description: text(),
	eventPatterns: text("event_patterns").array().notNull(),
	matchType: text("match_type").default('any').notNull(),
	isActive: boolean("is_active").default(true).notNull(),
	createdBy: uuid("created_by"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.organizationId],
			foreignColumns: [organization.id],
			name: "actions_organization_id_organization_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [user.id],
			name: "actions_created_by_user_id_fk"
		}).onDelete("set null"),
]);

export const dataSources = pgTable("data_sources", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	organizationId: uuid("organization_id").notNull(),
	name: text().notNull(),
	type: text().notNull(),
	description: text(),
	config: jsonb(),
	isActive: boolean("is_active").default(true).notNull(),
	lastEventAt: timestamp("last_event_at", { mode: 'string' }),
	eventCount: integer("event_count").default(0).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.organizationId],
			foreignColumns: [organization.id],
			name: "data_sources_organization_id_organization_id_fk"
		}).onDelete("cascade"),
]);

export const propertyDefinitions = pgTable("property_definitions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	organizationId: uuid("organization_id").notNull(),
	name: text().notNull(),
	type: text().notNull(),
	description: text(),
	eventNames: text("event_names").array(),
	isNumerical: boolean("is_numerical").default(false).notNull(),
	tags: text().array(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.organizationId],
			foreignColumns: [organization.id],
			name: "property_definitions_organization_id_organization_id_fk"
		}).onDelete("cascade"),
	unique("uq_prop_def_org_name").on(table.organizationId, table.name),
]);

export const teamMember = pgTable("team_member", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	teamId: uuid("team_id").notNull(),
	userId: uuid("user_id").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }),
}, (table) => [
	index("teamMember_teamId_idx").using("btree", table.teamId.asc().nullsLast().op("uuid_ops")),
	index("teamMember_userId_idx").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.teamId],
			foreignColumns: [team.id],
			name: "team_member_team_id_team_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "team_member_user_id_user_id_fk"
		}).onDelete("cascade"),
]);

export const chatMessage = pgTable("chat_message", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	sessionId: uuid("session_id").notNull(),
	role: chatMessageRole().notNull(),
	content: text().notNull(),
	messageType: chatMessageType("message_type").default('text'),
	sourceMode: chatMode("source_mode"),
	selectionContext: jsonb("selection_context"),
	toolCalls: jsonb("tool_calls"),
	planSteps: jsonb("plan_steps"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("chat_message_created_at_idx").using("btree", table.createdAt.asc().nullsLast().op("timestamp_ops")),
	index("chat_message_session_id_idx").using("btree", table.sessionId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.sessionId],
			foreignColumns: [chatSession.id],
			name: "chat_message_session_id_chat_session_id_fk"
		}).onDelete("cascade"),
]);

export const exportLog = pgTable("export_log", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	contentId: uuid("content_id").notNull(),
	memberId: uuid("member_id").notNull(),
	format: exportFormat().notNull(),
	destination: exportDestination().default('download').notNull(),
	options: jsonb().default({}).notNull(),
	downloadCount: integer("download_count").default(1).notNull(),
	lastDownloadedAt: timestamp("last_downloaded_at", { mode: 'string' }).defaultNow().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("export_log_content_id_idx").using("btree", table.contentId.asc().nullsLast().op("uuid_ops")),
	index("export_log_destination_idx").using("btree", table.destination.asc().nullsLast().op("enum_ops")),
	index("export_log_format_idx").using("btree", table.format.asc().nullsLast().op("enum_ops")),
	index("export_log_member_id_idx").using("btree", table.memberId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.contentId],
			foreignColumns: [content.id],
			name: "export_log_content_id_content_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.memberId],
			foreignColumns: [member.id],
			name: "export_log_member_id_member_id_fk"
		}).onDelete("cascade"),
]);

export const relatedContent = pgTable("related_content", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	sourceContentId: uuid("source_content_id").notNull(),
	targetContentId: uuid("target_content_id").notNull(),
	relationType: relatedContentType("relation_type").default('manual').notNull(),
	position: integer().default(0).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("related_content_source_idx").using("btree", table.sourceContentId.asc().nullsLast().op("uuid_ops")),
	index("related_content_target_idx").using("btree", table.targetContentId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.sourceContentId],
			foreignColumns: [content.id],
			name: "related_content_source_content_id_content_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.targetContentId],
			foreignColumns: [content.id],
			name: "related_content_target_content_id_content_id_fk"
		}).onDelete("cascade"),
]);

export const webhookDeliveries = pgTable("webhook_deliveries", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	webhookEndpointId: uuid("webhook_endpoint_id").notNull(),
	eventId: uuid("event_id").notNull(),
	url: text().notNull(),
	eventName: text("event_name").notNull(),
	payload: jsonb().notNull(),
	status: text().notNull(),
	httpStatusCode: integer("http_status_code"),
	responseBody: text("response_body"),
	errorMessage: text("error_message"),
	attemptNumber: integer("attempt_number").default(1).notNull(),
	maxAttempts: integer("max_attempts").default(5).notNull(),
	nextRetryAt: timestamp("next_retry_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	deliveredAt: timestamp("delivered_at", { mode: 'string' }),
}, (table) => [
	index("webhook_deliveries_event_idx").using("btree", table.eventId.asc().nullsLast().op("uuid_ops")),
	index("webhook_deliveries_status_idx").using("btree", table.status.asc().nullsLast().op("text_ops")),
	index("webhook_deliveries_webhook_idx").using("btree", table.webhookEndpointId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.webhookEndpointId],
			foreignColumns: [webhookEndpoints.id],
			name: "webhook_deliveries_webhook_endpoint_id_webhook_endpoints_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.eventId],
			foreignColumns: [events.id],
			name: "webhook_deliveries_event_id_events_id_fk"
		}).onDelete("cascade"),
]);
export const currentMonthUsageByCategory = pgMaterializedView("current_month_usage_by_category", {	organizationId: uuid("organization_id"),
	eventCategory: text("event_category"),
	eventCount: integer("event_count"),
	monthToDateCost: numeric("month_to_date_cost"),
	projectedCost: numeric("projected_cost"),
}).as(sql`SELECT events.organization_id, events.event_category, count(*)::integer AS event_count, COALESCE(sum(events.price_per_event::numeric), 0::numeric) AS month_to_date_cost, CASE WHEN EXTRACT(day FROM CURRENT_DATE) > 0::numeric THEN COALESCE(sum(events.price_per_event::numeric), 0::numeric) / EXTRACT(day FROM CURRENT_DATE) * EXTRACT(day FROM date_trunc('month'::text, CURRENT_DATE::timestamp with time zone) + '1 mon'::interval - '1 day'::interval) ELSE 0::numeric END AS projected_cost FROM events WHERE events."timestamp" >= date_trunc('month'::text, CURRENT_DATE::timestamp with time zone) AND events.is_billable = true GROUP BY events.organization_id, events.event_category`);

export const currentMonthUsageByEvent = pgMaterializedView("current_month_usage_by_event", {	organizationId: uuid("organization_id"),
	eventName: text("event_name"),
	eventCategory: text("event_category"),
	eventCount: integer("event_count"),
	monthToDateCost: numeric("month_to_date_cost"),
}).as(sql`SELECT events.organization_id, events.event_name, events.event_category, count(*)::integer AS event_count, COALESCE(sum(events.price_per_event::numeric), 0::numeric) AS month_to_date_cost FROM events WHERE events."timestamp" >= date_trunc('month'::text, CURRENT_DATE::timestamp with time zone) AND events.is_billable = true GROUP BY events.organization_id, events.event_name, events.event_category`);

export const dailyUsageByEvent = pgMaterializedView("daily_usage_by_event", {	organizationId: uuid("organization_id"),
	eventName: text("event_name"),
	eventCategory: text("event_category"),
	date: date(),
	eventCount: integer("event_count"),
	totalCost: numeric("total_cost"),
}).as(sql`SELECT events.organization_id, events.event_name, events.event_category, date(events."timestamp") AS date, count(*)::integer AS event_count, COALESCE(sum(events.price_per_event::numeric), 0::numeric) AS total_cost FROM events WHERE events.is_billable = true GROUP BY events.organization_id, events.event_name, events.event_category, (date(events."timestamp"))`);

export const dailyEventCounts = pgMaterializedView("daily_event_counts", {	organizationId: uuid("organization_id"),
	eventName: text("event_name"),
	eventCategory: text("event_category"),
	date: date(),
	eventCount: integer("event_count"),
	uniqueUsers: integer("unique_users"),
}).as(sql`SELECT events.organization_id, events.event_name, events.event_category, date(events."timestamp") AS date, count(*)::integer AS event_count, count(DISTINCT events.user_id)::integer AS unique_users FROM events WHERE events."timestamp" >= (CURRENT_DATE - '90 days'::interval) GROUP BY events.organization_id, events.event_name, events.event_category, (date(events."timestamp"))`);

export const dailyContentAnalytics = pgMaterializedView("daily_content_analytics", {	organizationId: uuid("organization_id"),
	contentId: text("content_id"),
	date: date(),
	views: integer(),
	uniqueVisitors: integer("unique_visitors"),
	avgTimeSpentSeconds: numeric("avg_time_spent_seconds"),
	ctaClicks: integer("cta_clicks"),
	scrollCompletions: integer("scroll_completions"),
	ctaConversions: integer("cta_conversions"),
}).as(sql`SELECT events.organization_id, events.properties ->> 'contentId'::text AS content_id, date(events."timestamp") AS date, count(*) FILTER (WHERE events.event_name = 'content.page.view'::text)::integer AS views, count(DISTINCT CASE WHEN events.event_name = 'content.page.view'::text THEN events.properties ->> 'visitorId'::text ELSE NULL::text END)::integer AS unique_visitors, avg((events.properties ->> 'durationSeconds'::text)::numeric) FILTER (WHERE events.event_name = 'content.time.spent'::text) AS avg_time_spent_seconds, count(*) FILTER (WHERE events.event_name = 'content.cta.click'::text)::integer AS cta_clicks, count(*) FILTER (WHERE events.event_name = 'content.scroll.milestone'::text AND (events.properties ->> 'depth'::text) = '100'::text)::integer AS scroll_completions, count(*) FILTER (WHERE events.event_name = 'form.conversion'::text)::integer AS cta_conversions FROM events WHERE (events.event_category = ANY (ARRAY['content'::text, 'form'::text])) AND events."timestamp" >= (CURRENT_DATE - '90 days'::interval) GROUP BY events.organization_id, (events.properties ->> 'contentId'::text), (date(events."timestamp"))`);

export const contentTrafficSources = pgMaterializedView("content_traffic_sources", {	organizationId: uuid("organization_id"),
	contentId: text("content_id"),
	source: text(),
	medium: text(),
	views: integer(),
	uniqueVisitors: integer("unique_visitors"),
}).as(sql`SELECT events.organization_id, events.properties ->> 'contentId'::text AS content_id, COALESCE(events.properties ->> 'referrerSource'::text, 'direct'::text) AS source, events.properties ->> 'referrerMedium'::text AS medium, count(*)::integer AS views, count(DISTINCT events.properties ->> 'visitorId'::text)::integer AS unique_visitors FROM events WHERE events.event_name = 'content.page.view'::text AND events."timestamp" >= (CURRENT_DATE - '90 days'::interval) GROUP BY events.organization_id, (events.properties ->> 'contentId'::text), (COALESCE(events.properties ->> 'referrerSource'::text, 'direct'::text)), (events.properties ->> 'referrerMedium'::text)`);

export const monthlySdkUsage = pgMaterializedView("monthly_sdk_usage", {	organizationId: uuid("organization_id"),
	month: date(),
	authorRequests: integer("author_requests"),
	listRequests: integer("list_requests"),
	contentRequests: integer("content_requests"),
	imageRequests: integer("image_requests"),
	totalRequests: integer("total_requests"),
	errors: integer(),
}).as(sql`SELECT events.organization_id, date_trunc('month'::text, events."timestamp")::date AS month, count(*) FILTER (WHERE events.event_name = 'sdk.author.fetched'::text)::integer AS author_requests, count(*) FILTER (WHERE events.event_name = 'sdk.content.listed'::text)::integer AS list_requests, count(*) FILTER (WHERE events.event_name = 'sdk.content.fetched'::text)::integer AS content_requests, count(*) FILTER (WHERE events.event_name = 'sdk.image.fetched'::text)::integer AS image_requests, count(*)::integer AS total_requests, count(*) FILTER (WHERE events.event_name = ANY (ARRAY['sdk.auth.failed'::text, 'sdk.error'::text]))::integer AS errors FROM events WHERE events.event_category = 'sdk'::text GROUP BY events.organization_id, (date_trunc('month'::text, events."timestamp"))`);

export const monthlyAiUsage = pgMaterializedView("monthly_ai_usage", {	organizationId: uuid("organization_id"),
	month: date(),
	completions: integer(),
	chatMessages: integer("chat_messages"),
	agentActions: integer("agent_actions"),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	totalTokens: bigint("total_tokens", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	promptTokens: bigint("prompt_tokens", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	completionTokens: bigint("completion_tokens", { mode: "number" }),
	avgLatencyMs: numeric("avg_latency_ms"),
}).as(sql`SELECT events.organization_id, date_trunc('month'::text, events."timestamp")::date AS month, count(*) FILTER (WHERE events.event_name = 'ai.completion'::text)::integer AS completions, count(*) FILTER (WHERE events.event_name = 'ai.chat_message'::text)::integer AS chat_messages, count(*) FILTER (WHERE events.event_name = 'ai.agent_action'::text)::integer AS agent_actions, sum((events.properties ->> 'totalTokens'::text)::integer) AS total_tokens, sum((events.properties ->> 'promptTokens'::text)::integer) AS prompt_tokens, sum((events.properties ->> 'completionTokens'::text)::integer) AS completion_tokens, avg((events.properties ->> 'latencyMs'::text)::numeric) AS avg_latency_ms FROM events WHERE events.event_category = 'ai'::text GROUP BY events.organization_id, (date_trunc('month'::text, events."timestamp"))`);