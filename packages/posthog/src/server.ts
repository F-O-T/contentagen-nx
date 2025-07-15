import { PostHog } from "posthog-node";
import { posthogPublicKey, posthogHost } from "./shared-posthog-config";

export function getElysiaPosthogConfig() {
   const internalPosthog = new PostHog(posthogPublicKey, {
      host: posthogHost,
   });
   return internalPosthog;
}
