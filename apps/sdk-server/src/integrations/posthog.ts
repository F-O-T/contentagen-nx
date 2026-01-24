import { env } from "@packages/environment/server";
import { getElysiaPosthogConfig } from "@packages/posthog/server";

export const posthog = getElysiaPosthogConfig({
   POSTHOG_HOST: env.POSTHOG_HOST,
   POSTHOG_KEY: env.POSTHOG_KEY,
});
