import * as accountRouter from "./account";
import * as actionsRouter from "./actions";
import * as agentRouter from "./agent";
import * as analyticsRouter from "./analytics";
import * as annotationsRouter from "./annotations";
import * as apiKeysRouter from "./api-keys";
import * as billingRouter from "./billing";
import * as chatRouter from "./chat";
import * as contentRouter from "./content";
import * as contentAnalyticsRouter from "./content-analytics";
import * as dashboardsRouter from "./dashboards";
import * as dataSourcesRouter from "./data-sources";
import * as eventCatalogRouter from "./event-catalog";
import * as formsRouter from "./forms";
import * as insightsRouter from "./insights";
import * as onboardingRouter from "./onboarding";
import * as organizationRouter from "./organization";
import * as personalApiKeyRouter from "./personal-api-key";
import * as propertyDefinitionsRouter from "./property-definitions";
import * as sdkUsageRouter from "./sdk-usage";
import * as sessionRouter from "./session";
import * as teamRouter from "./team";
import * as usageRouter from "./usage";
import * as webhooksRouter from "./webhooks";

export default {
   account: accountRouter,
   actions: actionsRouter,
   agent: agentRouter,
   analytics: analyticsRouter,
   annotations: annotationsRouter,
   apiKeys: apiKeysRouter,
   billing: billingRouter,
   chat: chatRouter,
   content: contentRouter,
   contentAnalytics: contentAnalyticsRouter,
   dashboards: dashboardsRouter,
   dataSources: dataSourcesRouter,
   eventCatalog: eventCatalogRouter,
   forms: formsRouter,
   insights: insightsRouter,
   onboarding: onboardingRouter,
   personalApiKey: personalApiKeyRouter,
   propertyDefinitions: propertyDefinitionsRouter,
   sdkUsage: sdkUsageRouter,
   session: sessionRouter,
   team: teamRouter,
   organization: organizationRouter,
   usage: usageRouter,
   webhooks: webhooksRouter,
};
