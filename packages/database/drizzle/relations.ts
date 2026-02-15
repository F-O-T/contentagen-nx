import { relations } from "drizzle-orm/relations";
import { user, apikey, session, account, twoFactor, content, chatSession, organization, writer, member, team, oauthClient, oauthRefreshToken, oauthConsent, events, oauthAccessToken, personalApiKey, invitation, resourcePermission, webhookEndpoints, forms, formSubmissions, annotations, dashboards, insights, actions, dataSources, propertyDefinitions, teamMember, chatMessage, exportLog, relatedContent, webhookDeliveries } from "./schema";

export const apikeyRelations = relations(apikey, ({one}) => ({
	user: one(user, {
		fields: [apikey.userId],
		references: [user.id]
	}),
}));

export const userRelations = relations(user, ({many}) => ({
	apikeys: many(apikey),
	sessions: many(session),
	accounts: many(account),
	twoFactors: many(twoFactor),
	oauthRefreshTokens: many(oauthRefreshToken),
	oauthConsents: many(oauthConsent),
	oauthClients: many(oauthClient),
	events: many(events),
	oauthAccessTokens: many(oauthAccessToken),
	personalApiKeys: many(personalApiKey),
	invitations: many(invitation),
	members: many(member),
	resourcePermissions: many(resourcePermission),
	annotations: many(annotations),
	dashboards: many(dashboards),
	insights: many(insights),
	actions: many(actions),
	teamMembers: many(teamMember),
}));

export const sessionRelations = relations(session, ({one, many}) => ({
	user: one(user, {
		fields: [session.userId],
		references: [user.id]
	}),
	oauthRefreshTokens: many(oauthRefreshToken),
	oauthAccessTokens: many(oauthAccessToken),
}));

export const accountRelations = relations(account, ({one}) => ({
	user: one(user, {
		fields: [account.userId],
		references: [user.id]
	}),
}));

export const twoFactorRelations = relations(twoFactor, ({one}) => ({
	user: one(user, {
		fields: [twoFactor.userId],
		references: [user.id]
	}),
}));

export const chatSessionRelations = relations(chatSession, ({one, many}) => ({
	content: one(content, {
		fields: [chatSession.contentId],
		references: [content.id]
	}),
	organization: one(organization, {
		fields: [chatSession.organizationId],
		references: [organization.id]
	}),
	chatMessages: many(chatMessage),
}));

export const contentRelations = relations(content, ({one, many}) => ({
	chatSessions: many(chatSession),
	writer: one(writer, {
		fields: [content.writerId],
		references: [writer.id]
	}),
	organization: one(organization, {
		fields: [content.organizationId],
		references: [organization.id]
	}),
	member: one(member, {
		fields: [content.createdByMemberId],
		references: [member.id]
	}),
	team: one(team, {
		fields: [content.teamId],
		references: [team.id]
	}),
	exportLogs: many(exportLog),
	relatedContents_sourceContentId: many(relatedContent, {
		relationName: "relatedContent_sourceContentId_content_id"
	}),
	relatedContents_targetContentId: many(relatedContent, {
		relationName: "relatedContent_targetContentId_content_id"
	}),
}));

export const organizationRelations = relations(organization, ({many}) => ({
	chatSessions: many(chatSession),
	contents: many(content),
	events: many(events),
	invitations: many(invitation),
	teams: many(team),
	members: many(member),
	resourcePermissions: many(resourcePermission),
	writers: many(writer),
	webhookEndpoints: many(webhookEndpoints),
	formSubmissions: many(formSubmissions),
	forms: many(forms),
	annotations: many(annotations),
	dashboards: many(dashboards),
	insights: many(insights),
	actions: many(actions),
	dataSources: many(dataSources),
	propertyDefinitions: many(propertyDefinitions),
}));

export const writerRelations = relations(writer, ({one, many}) => ({
	contents: many(content),
	organization: one(organization, {
		fields: [writer.organizationId],
		references: [organization.id]
	}),
	team: one(team, {
		fields: [writer.teamId],
		references: [team.id]
	}),
}));

export const memberRelations = relations(member, ({one, many}) => ({
	contents: many(content),
	organization: one(organization, {
		fields: [member.organizationId],
		references: [organization.id]
	}),
	user: one(user, {
		fields: [member.userId],
		references: [user.id]
	}),
	exportLogs: many(exportLog),
}));

export const teamRelations = relations(team, ({one, many}) => ({
	contents: many(content),
	events: many(events),
	organization: one(organization, {
		fields: [team.organizationId],
		references: [organization.id]
	}),
	writers: many(writer),
	formSubmissions: many(formSubmissions),
	forms: many(forms),
	dashboards: many(dashboards),
	insights: many(insights),
	teamMembers: many(teamMember),
}));

export const oauthRefreshTokenRelations = relations(oauthRefreshToken, ({one, many}) => ({
	oauthClient: one(oauthClient, {
		fields: [oauthRefreshToken.clientId],
		references: [oauthClient.clientId]
	}),
	session: one(session, {
		fields: [oauthRefreshToken.sessionId],
		references: [session.id]
	}),
	user: one(user, {
		fields: [oauthRefreshToken.userId],
		references: [user.id]
	}),
	oauthAccessTokens: many(oauthAccessToken),
}));

export const oauthClientRelations = relations(oauthClient, ({one, many}) => ({
	oauthRefreshTokens: many(oauthRefreshToken),
	oauthConsents: many(oauthConsent),
	user: one(user, {
		fields: [oauthClient.userId],
		references: [user.id]
	}),
	oauthAccessTokens: many(oauthAccessToken),
}));

export const oauthConsentRelations = relations(oauthConsent, ({one}) => ({
	oauthClient: one(oauthClient, {
		fields: [oauthConsent.clientId],
		references: [oauthClient.clientId]
	}),
	user: one(user, {
		fields: [oauthConsent.userId],
		references: [user.id]
	}),
}));

export const eventsRelations = relations(events, ({one, many}) => ({
	organization: one(organization, {
		fields: [events.organizationId],
		references: [organization.id]
	}),
	user: one(user, {
		fields: [events.userId],
		references: [user.id]
	}),
	team: one(team, {
		fields: [events.teamId],
		references: [team.id]
	}),
	webhookDeliveries: many(webhookDeliveries),
}));

export const oauthAccessTokenRelations = relations(oauthAccessToken, ({one}) => ({
	oauthClient: one(oauthClient, {
		fields: [oauthAccessToken.clientId],
		references: [oauthClient.clientId]
	}),
	session: one(session, {
		fields: [oauthAccessToken.sessionId],
		references: [session.id]
	}),
	user: one(user, {
		fields: [oauthAccessToken.userId],
		references: [user.id]
	}),
	oauthRefreshToken: one(oauthRefreshToken, {
		fields: [oauthAccessToken.refreshId],
		references: [oauthRefreshToken.id]
	}),
}));

export const personalApiKeyRelations = relations(personalApiKey, ({one}) => ({
	user: one(user, {
		fields: [personalApiKey.userId],
		references: [user.id]
	}),
}));

export const invitationRelations = relations(invitation, ({one}) => ({
	organization: one(organization, {
		fields: [invitation.organizationId],
		references: [organization.id]
	}),
	user: one(user, {
		fields: [invitation.inviterId],
		references: [user.id]
	}),
}));

export const resourcePermissionRelations = relations(resourcePermission, ({one}) => ({
	organization: one(organization, {
		fields: [resourcePermission.organizationId],
		references: [organization.id]
	}),
	user: one(user, {
		fields: [resourcePermission.grantedBy],
		references: [user.id]
	}),
}));

export const webhookEndpointsRelations = relations(webhookEndpoints, ({one, many}) => ({
	organization: one(organization, {
		fields: [webhookEndpoints.organizationId],
		references: [organization.id]
	}),
	webhookDeliveries: many(webhookDeliveries),
}));

export const formSubmissionsRelations = relations(formSubmissions, ({one}) => ({
	form: one(forms, {
		fields: [formSubmissions.formId],
		references: [forms.id]
	}),
	organization: one(organization, {
		fields: [formSubmissions.organizationId],
		references: [organization.id]
	}),
	team: one(team, {
		fields: [formSubmissions.teamId],
		references: [team.id]
	}),
}));

export const formsRelations = relations(forms, ({one, many}) => ({
	formSubmissions: many(formSubmissions),
	organization: one(organization, {
		fields: [forms.organizationId],
		references: [organization.id]
	}),
	team: one(team, {
		fields: [forms.teamId],
		references: [team.id]
	}),
}));

export const annotationsRelations = relations(annotations, ({one}) => ({
	organization: one(organization, {
		fields: [annotations.organizationId],
		references: [organization.id]
	}),
	user: one(user, {
		fields: [annotations.createdBy],
		references: [user.id]
	}),
}));

export const dashboardsRelations = relations(dashboards, ({one}) => ({
	organization: one(organization, {
		fields: [dashboards.organizationId],
		references: [organization.id]
	}),
	user: one(user, {
		fields: [dashboards.createdBy],
		references: [user.id]
	}),
	team: one(team, {
		fields: [dashboards.teamId],
		references: [team.id]
	}),
}));

export const insightsRelations = relations(insights, ({one}) => ({
	organization: one(organization, {
		fields: [insights.organizationId],
		references: [organization.id]
	}),
	user: one(user, {
		fields: [insights.createdBy],
		references: [user.id]
	}),
	team: one(team, {
		fields: [insights.teamId],
		references: [team.id]
	}),
}));

export const actionsRelations = relations(actions, ({one}) => ({
	organization: one(organization, {
		fields: [actions.organizationId],
		references: [organization.id]
	}),
	user: one(user, {
		fields: [actions.createdBy],
		references: [user.id]
	}),
}));

export const dataSourcesRelations = relations(dataSources, ({one}) => ({
	organization: one(organization, {
		fields: [dataSources.organizationId],
		references: [organization.id]
	}),
}));

export const propertyDefinitionsRelations = relations(propertyDefinitions, ({one}) => ({
	organization: one(organization, {
		fields: [propertyDefinitions.organizationId],
		references: [organization.id]
	}),
}));

export const teamMemberRelations = relations(teamMember, ({one}) => ({
	team: one(team, {
		fields: [teamMember.teamId],
		references: [team.id]
	}),
	user: one(user, {
		fields: [teamMember.userId],
		references: [user.id]
	}),
}));

export const chatMessageRelations = relations(chatMessage, ({one}) => ({
	chatSession: one(chatSession, {
		fields: [chatMessage.sessionId],
		references: [chatSession.id]
	}),
}));

export const exportLogRelations = relations(exportLog, ({one}) => ({
	content: one(content, {
		fields: [exportLog.contentId],
		references: [content.id]
	}),
	member: one(member, {
		fields: [exportLog.memberId],
		references: [member.id]
	}),
}));

export const relatedContentRelations = relations(relatedContent, ({one}) => ({
	content_sourceContentId: one(content, {
		fields: [relatedContent.sourceContentId],
		references: [content.id],
		relationName: "relatedContent_sourceContentId_content_id"
	}),
	content_targetContentId: one(content, {
		fields: [relatedContent.targetContentId],
		references: [content.id],
		relationName: "relatedContent_targetContentId_content_id"
	}),
}));

export const webhookDeliveriesRelations = relations(webhookDeliveries, ({one}) => ({
	webhookEndpoint: one(webhookEndpoints, {
		fields: [webhookDeliveries.webhookEndpointId],
		references: [webhookEndpoints.id]
	}),
	event: one(events, {
		fields: [webhookDeliveries.eventId],
		references: [events.id]
	}),
}));