import { Octokit } from "@octokit/rest";
import { env } from "@packages/environment/server";
import type { FeedbackAdapter, FeedbackPayload } from "./schemas";

// =============================================================================
// Adapters (internal)
// =============================================================================

import { discordAdapter } from "./adapters/discord";
import { githubAdapter } from "./adapters/github";
import { posthogAdapter } from "./adapters/posthog";

// =============================================================================
// Sender Config
// =============================================================================

type FeedbackSenderConfig = {
   posthog?: {
      capture: (event: {
         distinctId: string;
         event: string;
         properties?: Record<string, unknown>;
      }) => void;
   };
   userId: string;
};

// =============================================================================
// Factory
// =============================================================================

export function createFeedbackSender(config: FeedbackSenderConfig) {
   const adapters: FeedbackAdapter[] = [];

   if (config.posthog) {
      adapters.push(
         posthogAdapter({ posthog: config.posthog, userId: config.userId }),
      );
   }

   if (env.DISCORD_FEEDBACK_WEBHOOK_URL) {
      adapters.push(
         discordAdapter({ webhookUrl: env.DISCORD_FEEDBACK_WEBHOOK_URL }),
      );
   }

   if (
      env.GITHUB_FEEDBACK_TOKEN &&
      env.GITHUB_FEEDBACK_OWNER &&
      env.GITHUB_FEEDBACK_REPO
   ) {
      adapters.push(
         githubAdapter({
            octokit: new Octokit({ auth: env.GITHUB_FEEDBACK_TOKEN }),
            owner: env.GITHUB_FEEDBACK_OWNER,
            repo: env.GITHUB_FEEDBACK_REPO,
         }),
      );
   }

   return {
      async send(payload: FeedbackPayload): Promise<void> {
         const results = await Promise.allSettled(
            adapters.map((adapter) => adapter.send(payload)),
         );

         for (const [i, result] of results.entries()) {
            if (result.status === "rejected") {
               console.error(
                  `[Feedback] Adapter "${adapters[i]?.name}" failed:`,
                  result.reason,
               );
            }
         }
      },
   };
}
