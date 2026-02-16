import { relations, sql } from "drizzle-orm";
import {
   boolean,
   index,
   integer,
   jsonb,
   pgTable,
   text,
   timestamp,
   uniqueIndex,
   uuid,
} from "drizzle-orm/pg-core";

export const user = pgTable("user", {
   id: uuid("id").default(sql`pg_catalog.gen_random_uuid()`).primaryKey(),
   name: text("name").notNull(),
   email: text("email").notNull().unique(),
   emailVerified: boolean("email_verified").default(false).notNull(),
   image: text("image"),
   createdAt: timestamp("created_at").defaultNow().notNull(),
   updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
   role: text("role"),
   banned: boolean("banned").default(false),
   banReason: text("ban_reason"),
   banExpires: timestamp("ban_expires"),
   twoFactorEnabled: boolean("two_factor_enabled").default(false),
   stripeCustomerId: text("stripe_customer_id"),
   telemetryConsent: boolean("telemetry_consent").default(false).notNull(),
   contentCreationMode: text("content_creation_mode").default("plan"),
});

export const session = pgTable(
   "session",
   {
      id: uuid("id").default(sql`pg_catalog.gen_random_uuid()`).primaryKey(),
      expiresAt: timestamp("expires_at").notNull(),
      token: text("token").notNull().unique(),
      createdAt: timestamp("created_at").defaultNow().notNull(),
      updatedAt: timestamp("updated_at")
         .$onUpdate(() => /* @__PURE__ */ new Date())
         .notNull(),
      ipAddress: text("ip_address"),
      userAgent: text("user_agent"),
      userId: uuid("user_id")
         .notNull()
         .references(() => user.id, { onDelete: "cascade" }),
      impersonatedBy: text("impersonated_by"),
      activeOrganizationId: text("active_organization_id"),
      activeTeamId: text("active_team_id"),
   },
   (table) => [index("session_userId_idx").on(table.userId)],
);

export const account = pgTable(
   "account",
   {
      id: uuid("id").default(sql`pg_catalog.gen_random_uuid()`).primaryKey(),
      accountId: text("account_id").notNull(),
      providerId: text("provider_id").notNull(),
      userId: uuid("user_id")
         .notNull()
         .references(() => user.id, { onDelete: "cascade" }),
      accessToken: text("access_token"),
      refreshToken: text("refresh_token"),
      idToken: text("id_token"),
      accessTokenExpiresAt: timestamp("access_token_expires_at"),
      refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
      scope: text("scope"),
      password: text("password"),
      createdAt: timestamp("created_at").defaultNow().notNull(),
      updatedAt: timestamp("updated_at")
         .$onUpdate(() => /* @__PURE__ */ new Date())
         .notNull(),
   },
   (table) => [index("account_userId_idx").on(table.userId)],
);

export const verification = pgTable(
   "verification",
   {
      id: uuid("id").default(sql`pg_catalog.gen_random_uuid()`).primaryKey(),
      identifier: text("identifier").notNull(),
      value: text("value").notNull(),
      expiresAt: timestamp("expires_at").notNull(),
      createdAt: timestamp("created_at").defaultNow().notNull(),
      updatedAt: timestamp("updated_at")
         .defaultNow()
         .$onUpdate(() => /* @__PURE__ */ new Date())
         .notNull(),
   },
   (table) => [index("verification_identifier_idx").on(table.identifier)],
);

export const organization = pgTable(
   "organization",
   {
      id: uuid("id").default(sql`pg_catalog.gen_random_uuid()`).primaryKey(),
      name: text("name").notNull(),
      slug: text("slug").notNull().unique(),
      logo: text("logo"),
      createdAt: timestamp("created_at").notNull(),
      metadata: text("metadata"),
      context: text("context").default("personal"),
      description: text("description").default(""),
      onboardingCompleted: boolean("onboarding_completed").default(false),
   },
   (table) => [uniqueIndex("organization_slug_uidx").on(table.slug)],
);

export const team = pgTable(
   "team",
   {
      id: uuid("id").default(sql`pg_catalog.gen_random_uuid()`).primaryKey(),
      name: text("name").notNull(),
      organizationId: uuid("organization_id")
         .notNull()
         .references(() => organization.id, { onDelete: "cascade" }),
      createdAt: timestamp("created_at").notNull(),
      updatedAt: timestamp("updated_at").$onUpdate(
         () => /* @__PURE__ */ new Date(),
      ),
      slug: text("slug").notNull(),
      description: text("description").default(""),
      allowedDomains: text("allowed_domains").array(),
      publicApiKey: text("public_api_key").unique(),
      onboardingCompleted: boolean("onboarding_completed").default(false),
      onboardingProducts: jsonb("onboarding_products"),
      onboardingTasks: jsonb("onboarding_tasks"),
   },
   (table) => [index("team_organizationId_idx").on(table.organizationId)],
);

export const teamMember = pgTable(
   "team_member",
   {
      id: uuid("id").default(sql`pg_catalog.gen_random_uuid()`).primaryKey(),
      teamId: uuid("team_id")
         .notNull()
         .references(() => team.id, { onDelete: "cascade" }),
      userId: uuid("user_id")
         .notNull()
         .references(() => user.id, { onDelete: "cascade" }),
      createdAt: timestamp("created_at"),
   },
   (table) => [
      index("teamMember_teamId_idx").on(table.teamId),
      index("teamMember_userId_idx").on(table.userId),
   ],
);

export const member = pgTable(
   "member",
   {
      id: uuid("id").default(sql`pg_catalog.gen_random_uuid()`).primaryKey(),
      organizationId: uuid("organization_id")
         .notNull()
         .references(() => organization.id, { onDelete: "cascade" }),
      userId: uuid("user_id")
         .notNull()
         .references(() => user.id, { onDelete: "cascade" }),
      role: text("role").default("member").notNull(),
      createdAt: timestamp("created_at").notNull(),
   },
   (table) => [
      index("member_organizationId_idx").on(table.organizationId),
      index("member_userId_idx").on(table.userId),
   ],
);

export const invitation = pgTable(
   "invitation",
   {
      id: uuid("id").default(sql`pg_catalog.gen_random_uuid()`).primaryKey(),
      organizationId: uuid("organization_id")
         .notNull()
         .references(() => organization.id, { onDelete: "cascade" }),
      email: text("email").notNull(),
      role: text("role"),
      teamId: text("team_id"),
      status: text("status").default("pending").notNull(),
      expiresAt: timestamp("expires_at").notNull(),
      createdAt: timestamp("created_at").defaultNow().notNull(),
      inviterId: uuid("inviter_id")
         .notNull()
         .references(() => user.id, { onDelete: "cascade" }),
   },
   (table) => [
      index("invitation_organizationId_idx").on(table.organizationId),
      index("invitation_email_idx").on(table.email),
   ],
);

export const twoFactor = pgTable(
   "two_factor",
   {
      id: uuid("id").default(sql`pg_catalog.gen_random_uuid()`).primaryKey(),
      secret: text("secret").notNull(),
      backupCodes: text("backup_codes").notNull(),
      userId: uuid("user_id")
         .notNull()
         .references(() => user.id, { onDelete: "cascade" }),
   },
   (table) => [
      index("twoFactor_secret_idx").on(table.secret),
      index("twoFactor_userId_idx").on(table.userId),
   ],
);

export const apikey = pgTable(
   "apikey",
   {
      id: uuid("id").default(sql`pg_catalog.gen_random_uuid()`).primaryKey(),
      name: text("name"),
      start: text("start"),
      prefix: text("prefix"),
      key: text("key").notNull(),
      userId: uuid("user_id")
         .notNull()
         .references(() => user.id, { onDelete: "cascade" }),
      refillInterval: integer("refill_interval"),
      refillAmount: integer("refill_amount"),
      lastRefillAt: timestamp("last_refill_at"),
      enabled: boolean("enabled").default(true),
      rateLimitEnabled: boolean("rate_limit_enabled").default(true),
      rateLimitTimeWindow: integer("rate_limit_time_window").default(60000),
      rateLimitMax: integer("rate_limit_max").default(100),
      requestCount: integer("request_count").default(0),
      remaining: integer("remaining"),
      lastRequest: timestamp("last_request"),
      expiresAt: timestamp("expires_at"),
      createdAt: timestamp("created_at").notNull(),
      updatedAt: timestamp("updated_at").notNull(),
      permissions: text("permissions"),
      metadata: text("metadata"),
   },
   (table) => [
      index("apikey_key_idx").on(table.key),
      index("apikey_userId_idx").on(table.userId),
   ],
);

export const subscription = pgTable("subscription", {
   id: uuid("id").default(sql`pg_catalog.gen_random_uuid()`).primaryKey(),
   plan: text("plan").notNull(),
   referenceId: text("reference_id").notNull(),
   stripeCustomerId: text("stripe_customer_id"),
   stripeSubscriptionId: text("stripe_subscription_id"),
   status: text("status").default("incomplete"),
   periodStart: timestamp("period_start"),
   periodEnd: timestamp("period_end"),
   trialStart: timestamp("trial_start"),
   trialEnd: timestamp("trial_end"),
   cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false),
   cancelAt: timestamp("cancel_at"),
   canceledAt: timestamp("canceled_at"),
   endedAt: timestamp("ended_at"),
   seats: integer("seats"),
});

export const jwks = pgTable("jwks", {
   id: uuid("id").default(sql`pg_catalog.gen_random_uuid()`).primaryKey(),
   publicKey: text("public_key").notNull(),
   privateKey: text("private_key").notNull(),
   createdAt: timestamp("created_at").notNull(),
   expiresAt: timestamp("expires_at"),
});

export const oauthClient = pgTable("oauth_client", {
   id: uuid("id").default(sql`pg_catalog.gen_random_uuid()`).primaryKey(),
   clientId: text("client_id").notNull().unique(),
   clientSecret: text("client_secret"),
   disabled: boolean("disabled").default(false),
   skipConsent: boolean("skip_consent"),
   enableEndSession: boolean("enable_end_session"),
   scopes: text("scopes").array(),
   userId: uuid("user_id").references(() => user.id, { onDelete: "cascade" }),
   createdAt: timestamp("created_at"),
   updatedAt: timestamp("updated_at"),
   name: text("name"),
   uri: text("uri"),
   icon: text("icon"),
   contacts: text("contacts").array(),
   tos: text("tos"),
   policy: text("policy"),
   softwareId: text("software_id"),
   softwareVersion: text("software_version"),
   softwareStatement: text("software_statement"),
   redirectUris: text("redirect_uris").array().notNull(),
   postLogoutRedirectUris: text("post_logout_redirect_uris").array(),
   tokenEndpointAuthMethod: text("token_endpoint_auth_method"),
   grantTypes: text("grant_types").array(),
   responseTypes: text("response_types").array(),
   public: boolean("public"),
   type: text("type"),
   referenceId: text("reference_id"),
   metadata: jsonb("metadata"),
});

export const oauthRefreshToken = pgTable("oauth_refresh_token", {
   id: uuid("id").default(sql`pg_catalog.gen_random_uuid()`).primaryKey(),
   token: text("token").notNull(),
   clientId: text("client_id")
      .notNull()
      .references(() => oauthClient.clientId, { onDelete: "cascade" }),
   sessionId: uuid("session_id").references(() => session.id, {
      onDelete: "set null",
   }),
   userId: uuid("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
   referenceId: text("reference_id"),
   expiresAt: timestamp("expires_at"),
   createdAt: timestamp("created_at"),
   revoked: timestamp("revoked"),
   scopes: text("scopes").array().notNull(),
});

export const oauthAccessToken = pgTable("oauth_access_token", {
   id: uuid("id").default(sql`pg_catalog.gen_random_uuid()`).primaryKey(),
   token: text("token").unique(),
   clientId: text("client_id")
      .notNull()
      .references(() => oauthClient.clientId, { onDelete: "cascade" }),
   sessionId: uuid("session_id").references(() => session.id, {
      onDelete: "set null",
   }),
   userId: uuid("user_id").references(() => user.id, { onDelete: "cascade" }),
   referenceId: text("reference_id"),
   refreshId: uuid("refresh_id").references(() => oauthRefreshToken.id, {
      onDelete: "cascade",
   }),
   expiresAt: timestamp("expires_at"),
   createdAt: timestamp("created_at"),
   scopes: text("scopes").array().notNull(),
});

export const oauthConsent = pgTable("oauth_consent", {
   id: uuid("id").default(sql`pg_catalog.gen_random_uuid()`).primaryKey(),
   clientId: text("client_id")
      .notNull()
      .references(() => oauthClient.clientId, { onDelete: "cascade" }),
   userId: uuid("user_id").references(() => user.id, { onDelete: "cascade" }),
   referenceId: text("reference_id"),
   scopes: text("scopes").array().notNull(),
   createdAt: timestamp("created_at"),
   updatedAt: timestamp("updated_at"),
});

export const userRelations = relations(user, ({ many }) => ({
   sessions: many(session),
   accounts: many(account),
   teamMembers: many(teamMember),
   members: many(member),
   invitations: many(invitation),
   twoFactors: many(twoFactor),
   apikeys: many(apikey),
   oauthClients: many(oauthClient),
   oauthRefreshTokens: many(oauthRefreshToken),
   oauthAccessTokens: many(oauthAccessToken),
   oauthConsents: many(oauthConsent),
}));

export const sessionRelations = relations(session, ({ one, many }) => ({
   user: one(user, {
      fields: [session.userId],
      references: [user.id],
   }),
   oauthRefreshTokens: many(oauthRefreshToken),
   oauthAccessTokens: many(oauthAccessToken),
}));

export const accountRelations = relations(account, ({ one }) => ({
   user: one(user, {
      fields: [account.userId],
      references: [user.id],
   }),
}));

export const organizationRelations = relations(organization, ({ many }) => ({
   teams: many(team),
   members: many(member),
   invitations: many(invitation),
}));

export const teamRelations = relations(team, ({ one, many }) => ({
   organization: one(organization, {
      fields: [team.organizationId],
      references: [organization.id],
   }),
   teamMembers: many(teamMember),
}));

export const teamMemberRelations = relations(teamMember, ({ one }) => ({
   team: one(team, {
      fields: [teamMember.teamId],
      references: [team.id],
   }),
   user: one(user, {
      fields: [teamMember.userId],
      references: [user.id],
   }),
}));

export const memberRelations = relations(member, ({ one }) => ({
   organization: one(organization, {
      fields: [member.organizationId],
      references: [organization.id],
   }),
   user: one(user, {
      fields: [member.userId],
      references: [user.id],
   }),
}));

export const invitationRelations = relations(invitation, ({ one }) => ({
   organization: one(organization, {
      fields: [invitation.organizationId],
      references: [organization.id],
   }),
   user: one(user, {
      fields: [invitation.inviterId],
      references: [user.id],
   }),
}));

export const twoFactorRelations = relations(twoFactor, ({ one }) => ({
   user: one(user, {
      fields: [twoFactor.userId],
      references: [user.id],
   }),
}));

export const apikeyRelations = relations(apikey, ({ one }) => ({
   user: one(user, {
      fields: [apikey.userId],
      references: [user.id],
   }),
}));

export const oauthClientRelations = relations(oauthClient, ({ one, many }) => ({
   user: one(user, {
      fields: [oauthClient.userId],
      references: [user.id],
   }),
   oauthRefreshTokens: many(oauthRefreshToken),
   oauthAccessTokens: many(oauthAccessToken),
   oauthConsents: many(oauthConsent),
}));

export const oauthRefreshTokenRelations = relations(
   oauthRefreshToken,
   ({ one, many }) => ({
      oauthClient: one(oauthClient, {
         fields: [oauthRefreshToken.clientId],
         references: [oauthClient.clientId],
      }),
      session: one(session, {
         fields: [oauthRefreshToken.sessionId],
         references: [session.id],
      }),
      user: one(user, {
         fields: [oauthRefreshToken.userId],
         references: [user.id],
      }),
      oauthAccessTokens: many(oauthAccessToken),
   }),
);

export const oauthAccessTokenRelations = relations(
   oauthAccessToken,
   ({ one }) => ({
      oauthClient: one(oauthClient, {
         fields: [oauthAccessToken.clientId],
         references: [oauthClient.clientId],
      }),
      session: one(session, {
         fields: [oauthAccessToken.sessionId],
         references: [session.id],
      }),
      user: one(user, {
         fields: [oauthAccessToken.userId],
         references: [user.id],
      }),
      oauthRefreshToken: one(oauthRefreshToken, {
         fields: [oauthAccessToken.refreshId],
         references: [oauthRefreshToken.id],
      }),
   }),
);

export const oauthConsentRelations = relations(oauthConsent, ({ one }) => ({
   oauthClient: one(oauthClient, {
      fields: [oauthConsent.clientId],
      references: [oauthClient.clientId],
   }),
   user: one(user, {
      fields: [oauthConsent.userId],
      references: [user.id],
   }),
}));
