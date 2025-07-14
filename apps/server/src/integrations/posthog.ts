import { Elysia } from "elysia";
import { getElysiaPosthogConfig } from "@packages/posthog";
const posthog = getElysiaPosthogConfig();
export const posthogPlugin = new Elysia({
  name: "posthog-plugin",
})
  .derive(() => ({
    posthog,
  }))
  .onStop(async () => {
    await posthog.shutdown();
    console.info("PostHog client shut down.");
  });
