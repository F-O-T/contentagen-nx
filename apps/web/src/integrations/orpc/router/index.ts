import * as accountRouter from "./account";
import * as agentRouter from "./agent";
import * as apiKeysRouter from "./api-keys";
import * as billingRouter from "./billing";
import * as chatRouter from "./chat";
import * as contentAnalyticsRouter from "./content-analytics";
import * as contentRouter from "./content";
import * as dashboardsRouter from "./dashboards";
import * as formsRouter from "./forms";
import * as insightsRouter from "./insights";
import * as organizationRouter from "./organization";
import * as sdkUsageRouter from "./sdk-usage";
import * as sessionRouter from "./session";
import * as usageRouter from "./usage";
import * as webhooksRouter from "./webhooks";

export default {
  account: accountRouter,
  agent: agentRouter,
  apiKeys: apiKeysRouter,
  billing: billingRouter,
  chat: chatRouter,
  content: contentRouter,
  contentAnalytics: contentAnalyticsRouter,
  dashboards: dashboardsRouter,
  forms: formsRouter,
  insights: insightsRouter,
  sdkUsage: sdkUsageRouter,
  session: sessionRouter,
  organization: organizationRouter,
  usage: usageRouter,
  webhooks: webhooksRouter,
};
