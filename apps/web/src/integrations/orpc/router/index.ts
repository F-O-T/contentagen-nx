import * as accountRouter from "./account";
import * as actionsRouter from "./actions";
import * as activityLogsRouter from "./activity-logs";
import * as agentRouter from "./agent";
import * as analyticsRouter from "./analytics";
import * as annotationsRouter from "./annotations";
import * as apiKeysRouter from "./api-keys";
import * as assetsRouter from "./assets";
import * as billingRouter from "./billing";
import * as chatRouter from "./chat";
import * as clustersRouter from "./clusters";
import * as contentRouter from "./content";
import * as contentAnalyticsRouter from "./content-analytics";
import * as dashboardsRouter from "./dashboards";
import * as dataSourcesRouter from "./data-sources";
import * as discussionsRouter from "./discussions";
import * as eventCatalogRouter from "./event-catalog";
import * as experimentsRouter from "./experiments";
import * as feedbackRouter from "./feedback";
import * as formsRouter from "./forms";
import * as insightsRouter from "./insights";
import * as onboardingRouter from "./onboarding";
import * as organizationRouter from "./organization";
import * as personalApiKeyRouter from "./personal-api-key";
import * as productSettingsRouter from "./product-settings";
import * as propertyDefinitionsRouter from "./property-definitions";
import * as relatedContentRouter from "./related-content";
import * as rolesRouter from "./roles";
import * as sdkUsageRouter from "./sdk-usage";
import * as sessionRouter from "./session";
import * as ssoRouter from "./sso";
import * as teamRouter from "./team";
import * as usageRouter from "./usage";
import * as webhooksRouter from "./webhooks";
import * as writerRouter from "./writer";

export default {
   account: accountRouter,
   actions: actionsRouter,
   activityLogs: activityLogsRouter,
   agent: agentRouter,
   analytics: analyticsRouter,
   annotations: annotationsRouter,
   apiKeys: apiKeysRouter,
   assets: assetsRouter,
   billing: billingRouter,
   chat: chatRouter,
   clusters: clustersRouter,
   content: contentRouter,
   contentAnalytics: contentAnalyticsRouter,
   dashboards: dashboardsRouter,
   discussions: discussionsRouter,
   dataSources: dataSourcesRouter,
   eventCatalog: eventCatalogRouter,
   experiments: experimentsRouter,
   feedback: feedbackRouter,
   forms: formsRouter,
   insights: insightsRouter,
   onboarding: onboardingRouter,
   personalApiKey: personalApiKeyRouter,
   productSettings: productSettingsRouter,
   propertyDefinitions: propertyDefinitionsRouter,
   relatedContent: relatedContentRouter,
   roles: rolesRouter,
   sdkUsage: sdkUsageRouter,
   session: sessionRouter,
   sso: ssoRouter,
   team: teamRouter,
   organization: organizationRouter,
   usage: usageRouter,
   webhooks: webhooksRouter,
   writer: writerRouter,
};
