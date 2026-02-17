# Feedback Package with Adapter System

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Create `@packages/feedback` with an adapter pattern that dispatches feedback submissions to PostHog, Discord, and GitHub in parallel.

**Architecture:** A `FeedbackDispatcher` receives a discriminated union payload (bug/feature-request/feedback) and fans out to all configured adapters via `Promise.allSettled`. Each adapter is a factory function that returns a `send()` method. The oRPC router becomes a thin orchestrator.

**Tech Stack:** Zod (schemas + types), PostHog Node SDK, Discord Webhooks API, @octokit/rest, oRPC

---

### Task 1: Scaffold `@packages/feedback` package

**Files:**
- Create: `packages/feedback/package.json`
- Create: `packages/feedback/tsconfig.json`

**Step 1: Create package.json**

Create `packages/feedback/package.json`:

```json
{
   "name": "@packages/feedback",
   "version": "0.1.0",
   "type": "module",
   "private": true,
   "license": "Apache-2.0",
   "exports": {
      "./schemas": {
         "default": "./src/schemas.ts",
         "types": "./dist/src/schemas.d.ts"
      },
      "./dispatcher": {
         "default": "./src/dispatcher.ts",
         "types": "./dist/src/dispatcher.d.ts"
      },
      "./adapters/posthog": {
         "default": "./src/adapters/posthog.ts",
         "types": "./dist/src/adapters/posthog.d.ts"
      },
      "./adapters/discord": {
         "default": "./src/adapters/discord.ts",
         "types": "./dist/src/adapters/discord.d.ts"
      },
      "./adapters/github": {
         "default": "./src/adapters/github.ts",
         "types": "./dist/src/adapters/github.d.ts"
      }
   },
   "files": ["dist"],
   "scripts": {
      "build": "tsc --build",
      "check": "biome check --write ./src",
      "typecheck": "tsgo"
   },
   "dependencies": {
      "@octokit/rest": "^21.1.1",
      "zod": "catalog:validation"
   },
   "devDependencies": {
      "@tooling/typescript": "workspace:*",
      "typescript": "catalog:development"
   }
}
```

**Step 2: Create tsconfig.json**

Create `packages/feedback/tsconfig.json`:

```json
{
   "extends": "@tooling/typescript/internal-package.json",
   "include": ["src/**/*.ts"]
}
```

**Step 3: Install dependencies**

Run: `bun install`

**Step 4: Commit**

```bash
git add packages/feedback/package.json packages/feedback/tsconfig.json bun.lock
git commit -m "chore(feedback): scaffold @packages/feedback package"
```

---

### Task 2: Create Zod schemas

**Files:**
- Create: `packages/feedback/src/schemas.ts`

**Step 1: Create schemas file**

Create `packages/feedback/src/schemas.ts`:

```typescript
import { z } from "zod";

// =============================================================================
// Individual Feedback Schemas
// =============================================================================

export const bugReportSchema = z.object({
   type: z.literal("bug_report"),
   description: z.string().min(1),
   severity: z.string().optional(),
});

export const featureRequestSchema = z.object({
   type: z.literal("feature_request"),
   feature: z.string().min(1),
   problem: z.string().optional(),
   priority: z.number().min(0).max(5),
});

export const featureFeedbackSchema = z.object({
   type: z.literal("feature_feedback"),
   featureName: z.string().min(1),
   rating: z.number().min(1).max(5),
   improvement: z.string().optional(),
});

// =============================================================================
// Discriminated Union
// =============================================================================

export const feedbackPayloadSchema = z.discriminatedUnion("type", [
   bugReportSchema,
   featureRequestSchema,
   featureFeedbackSchema,
]);

export type BugReport = z.infer<typeof bugReportSchema>;
export type FeatureRequest = z.infer<typeof featureRequestSchema>;
export type FeatureFeedback = z.infer<typeof featureFeedbackSchema>;
export type FeedbackPayload = z.infer<typeof feedbackPayloadSchema>;

// =============================================================================
// Adapter Interface (as schema for config validation)
// =============================================================================

export type FeedbackAdapter = {
   name: string;
   send: (payload: FeedbackPayload) => Promise<void>;
};
```

**Step 2: Commit**

```bash
git add packages/feedback/src/schemas.ts
git commit -m "feat(feedback): add Zod schemas for feedback payloads"
```

---

### Task 3: Create dispatcher

**Files:**
- Create: `packages/feedback/src/dispatcher.ts`

**Step 1: Create dispatcher**

Create `packages/feedback/src/dispatcher.ts`:

```typescript
import type { FeedbackAdapter, FeedbackPayload } from "./schemas";

export function createFeedbackDispatcher(adapters: FeedbackAdapter[]) {
   return {
      async send(payload: FeedbackPayload): Promise<void> {
         const results = await Promise.allSettled(
            adapters.map((adapter) => adapter.send(payload)),
         );

         for (let i = 0; i < results.length; i++) {
            const result = results[i];
            if (result.status === "rejected") {
               console.error(
                  `[Feedback] Adapter "${adapters[i].name}" failed:`,
                  result.reason,
               );
            }
         }
      },
   };
}
```

**Step 2: Commit**

```bash
git add packages/feedback/src/dispatcher.ts
git commit -m "feat(feedback): add dispatcher with Promise.allSettled"
```

---

### Task 4: Create PostHog adapter

**Files:**
- Create: `packages/feedback/src/adapters/posthog.ts`

**Step 1: Create adapter**

Create `packages/feedback/src/adapters/posthog.ts`:

```typescript
import type { FeedbackAdapter, FeedbackPayload } from "../schemas";

const SURVEY_IDS = {
   bug_report: "019c6be5-4893-0000-7270-57dc03529638",
   feature_request: "019c6be5-5783-0000-684e-aceb5002b650",
   feature_feedback: "019c6be5-6296-0000-b0a3-2ab421e77719",
} as const;

type PostHogLike = {
   capture: (event: {
      distinctId: string;
      event: string;
      properties?: Record<string, unknown>;
   }) => void;
};

type PostHogAdapterConfig = {
   posthog: PostHogLike;
   userId: string;
};

function buildSurveyResponses(payload: FeedbackPayload): Record<string, unknown> {
   switch (payload.type) {
      case "bug_report":
         return {
            $survey_response: payload.description,
            $survey_response_1: payload.severity ?? "",
         };
      case "feature_request":
         return {
            $survey_response: payload.feature,
            $survey_response_1: payload.problem ?? "",
            $survey_response_2: payload.priority,
         };
      case "feature_feedback":
         return {
            $survey_response: payload.rating,
            $survey_response_1: payload.improvement ?? "",
            feature_name: payload.featureName,
         };
   }
}

export function posthogAdapter(config: PostHogAdapterConfig): FeedbackAdapter {
   return {
      name: "posthog",
      async send(payload) {
         const surveyId = SURVEY_IDS[payload.type];
         const responses = buildSurveyResponses(payload);

         config.posthog.capture({
            distinctId: config.userId,
            event: "survey sent",
            properties: {
               $survey_id: surveyId,
               ...responses,
            },
         });
      },
   };
}
```

**Step 2: Commit**

```bash
git add packages/feedback/src/adapters/posthog.ts
git commit -m "feat(feedback): add PostHog survey adapter"
```

---

### Task 5: Create Discord adapter

**Files:**
- Create: `packages/feedback/src/adapters/discord.ts`

**Step 1: Create adapter**

Create `packages/feedback/src/adapters/discord.ts`:

```typescript
import type { FeedbackAdapter, FeedbackPayload } from "../schemas";

const EMOJI_RATINGS = ["😡", "😕", "😐", "🙂", "🤩"];

type DiscordAdapterConfig = {
   webhookUrl: string;
};

type DiscordEmbed = {
   title: string;
   color: number;
   fields: { name: string; value: string; inline?: boolean }[];
   threadName: string;
};

function buildEmbed(payload: FeedbackPayload): DiscordEmbed {
   switch (payload.type) {
      case "bug_report":
         return {
            title: "🐛 Bug Report",
            color: 0xef4444,
            threadName: `Bug: ${payload.description.slice(0, 80)}`,
            fields: [
               { name: "Descrição", value: payload.description },
               ...(payload.severity
                  ? [{ name: "Gravidade", value: payload.severity, inline: true }]
                  : []),
            ],
         };
      case "feature_request": {
         const stars = "⭐".repeat(payload.priority);
         return {
            title: "💡 Feature Request",
            color: 0xf59e0b,
            threadName: `Feature: ${payload.feature.slice(0, 80)}`,
            fields: [
               { name: "Feature", value: payload.feature },
               ...(payload.problem
                  ? [{ name: "Problema", value: payload.problem }]
                  : []),
               { name: "Prioridade", value: stars || "Não informada", inline: true },
            ],
         };
      }
      case "feature_feedback": {
         const emoji = EMOJI_RATINGS[payload.rating - 1] ?? "😐";
         return {
            title: "💬 Feature Feedback",
            color: 0x3b82f6,
            threadName: `Feedback: ${payload.featureName}`,
            fields: [
               { name: "Feature", value: payload.featureName, inline: true },
               { name: "Rating", value: `${emoji} (${payload.rating}/5)`, inline: true },
               ...(payload.improvement
                  ? [{ name: "Melhoria", value: payload.improvement }]
                  : []),
            ],
         };
      }
   }
}

export function discordAdapter(config: DiscordAdapterConfig): FeedbackAdapter {
   return {
      name: "discord",
      async send(payload) {
         const embed = buildEmbed(payload);

         await fetch(`${config.webhookUrl}?wait=true`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
               thread_name: embed.threadName,
               embeds: [
                  {
                     title: embed.title,
                     color: embed.color,
                     fields: embed.fields,
                     timestamp: new Date().toISOString(),
                  },
               ],
            }),
         });
      },
   };
}
```

**Step 2: Commit**

```bash
git add packages/feedback/src/adapters/discord.ts
git commit -m "feat(feedback): add Discord webhook adapter"
```

---

### Task 6: Create GitHub adapter

**Files:**
- Create: `packages/feedback/src/adapters/github.ts`

**Step 1: Create adapter**

Create `packages/feedback/src/adapters/github.ts`:

```typescript
import type { Octokit } from "@octokit/rest";
import type { FeedbackAdapter, FeedbackPayload } from "../schemas";

const EMOJI_RATINGS = ["😡", "😕", "😐", "🙂", "🤩"];

type GitHubAdapterConfig = {
   octokit: Octokit;
   owner: string;
   repo: string;
};

type IssueData = {
   title: string;
   body: string;
   labels: string[];
};

function buildIssue(payload: FeedbackPayload): IssueData {
   switch (payload.type) {
      case "bug_report":
         return {
            title: `[Bug] ${payload.description.slice(0, 80)}`,
            labels: ["bug", "triage"],
            body: [
               "## Bug Report",
               "",
               "### Descrição",
               payload.description,
               ...(payload.severity
                  ? ["", "### Gravidade", payload.severity]
                  : []),
            ].join("\n"),
         };
      case "feature_request": {
         const stars = "⭐".repeat(payload.priority);
         return {
            title: `[Feature] ${payload.feature.slice(0, 80)}`,
            labels: ["feature-request", "triage"],
            body: [
               "## Feature Request",
               "",
               "### Funcionalidade",
               payload.feature,
               ...(payload.problem
                  ? ["", "### Problema que resolve", payload.problem]
                  : []),
               "",
               `### Prioridade: ${stars || "Não informada"}`,
            ].join("\n"),
         };
      }
      case "feature_feedback": {
         const emoji = EMOJI_RATINGS[payload.rating - 1] ?? "😐";
         return {
            title: `[Feedback] ${payload.featureName}`,
            labels: ["feedback", "triage"],
            body: [
               "## Feature Feedback",
               "",
               `### Feature: ${payload.featureName}`,
               `### Rating: ${emoji} (${payload.rating}/5)`,
               ...(payload.improvement
                  ? ["", "### Sugestão de melhoria", payload.improvement]
                  : []),
            ].join("\n"),
         };
      }
   }
}

export function githubAdapter(config: GitHubAdapterConfig): FeedbackAdapter {
   return {
      name: "github",
      async send(payload) {
         const issue = buildIssue(payload);

         await config.octokit.issues.create({
            owner: config.owner,
            repo: config.repo,
            title: issue.title,
            body: issue.body,
            labels: issue.labels,
         });
      },
   };
}
```

**Step 2: Commit**

```bash
git add packages/feedback/src/adapters/github.ts
git commit -m "feat(feedback): add GitHub issues adapter"
```

---

### Task 7: Add env vars for GitHub

**Files:**
- Modify: `packages/environment/src/server.ts`

**Step 1: Add env vars**

In `packages/environment/src/server.ts`, add after `DISCORD_FEEDBACK_WEBHOOK_URL`:

```typescript
// GitHub (Optional - feedback issue creation)
GITHUB_FEEDBACK_TOKEN: z.string().optional(),
GITHUB_FEEDBACK_OWNER: z.string().optional(),
GITHUB_FEEDBACK_REPO: z.string().optional(),
```

**Step 2: Commit**

```bash
git add packages/environment/src/server.ts
git commit -m "feat(env): add GitHub feedback env vars"
```

---

### Task 8: Refactor oRPC router to use dispatcher

**Files:**
- Modify: `apps/web/src/integrations/orpc/router/feedback.ts`
- Modify: `apps/web/package.json` (add `@packages/feedback` dependency)

**Step 1: Add dependency**

In `apps/web/package.json`, add to dependencies:

```json
"@packages/feedback": "workspace:*",
```

Run: `bun install`

**Step 2: Rewrite the router**

Replace `apps/web/src/integrations/orpc/router/feedback.ts` with:

```typescript
import { Octokit } from "@octokit/rest";
import { env } from "@packages/environment/server";
import { discordAdapter } from "@packages/feedback/adapters/discord";
import { githubAdapter } from "@packages/feedback/adapters/github";
import { posthogAdapter } from "@packages/feedback/adapters/posthog";
import { createFeedbackDispatcher } from "@packages/feedback/dispatcher";
import {
   type FeedbackAdapter,
   bugReportSchema,
   featureFeedbackSchema,
   featureRequestSchema,
} from "@packages/feedback/schemas";
import { z } from "zod";
import { authenticatedProcedure } from "../server";

// =============================================================================
// Dispatcher Factory
// =============================================================================

function buildAdapters(posthog: unknown, userId: string): FeedbackAdapter[] {
   const adapters: FeedbackAdapter[] = [];

   if (posthog) {
      adapters.push(
         posthogAdapter({
            posthog: posthog as { capture: (e: { distinctId: string; event: string; properties?: Record<string, unknown> }) => void },
            userId,
         }),
      );
   }

   if (env.DISCORD_FEEDBACK_WEBHOOK_URL) {
      adapters.push(discordAdapter({ webhookUrl: env.DISCORD_FEEDBACK_WEBHOOK_URL }));
   }

   if (env.GITHUB_FEEDBACK_TOKEN && env.GITHUB_FEEDBACK_OWNER && env.GITHUB_FEEDBACK_REPO) {
      adapters.push(
         githubAdapter({
            octokit: new Octokit({ auth: env.GITHUB_FEEDBACK_TOKEN }),
            owner: env.GITHUB_FEEDBACK_OWNER,
            repo: env.GITHUB_FEEDBACK_REPO,
         }),
      );
   }

   return adapters;
}

// =============================================================================
// Procedures
// =============================================================================

export const submitBugReport = authenticatedProcedure
   .input(bugReportSchema.omit({ type: true }))
   .handler(async ({ context, input }) => {
      const adapters = buildAdapters(context.posthog, context.userId);
      const dispatcher = createFeedbackDispatcher(adapters);
      await dispatcher.send({ type: "bug_report", ...input });
      return { success: true };
   });

export const submitFeatureRequest = authenticatedProcedure
   .input(featureRequestSchema.omit({ type: true }))
   .handler(async ({ context, input }) => {
      const adapters = buildAdapters(context.posthog, context.userId);
      const dispatcher = createFeedbackDispatcher(adapters);
      await dispatcher.send({ type: "feature_request", ...input });
      return { success: true };
   });

export const submitFeatureFeedback = authenticatedProcedure
   .input(featureFeedbackSchema.omit({ type: true }))
   .handler(async ({ context, input }) => {
      const adapters = buildAdapters(context.posthog, context.userId);
      const dispatcher = createFeedbackDispatcher(adapters);
      await dispatcher.send({ type: "feature_feedback", ...input });
      return { success: true };
   });
```

**Step 3: Commit**

```bash
git add apps/web/src/integrations/orpc/router/feedback.ts apps/web/package.json bun.lock
git commit -m "refactor(feedback): use @packages/feedback dispatcher in oRPC router"
```

---

### Task 9: Verify everything

**Step 1:** Run `bun run typecheck` — all 22+ projects pass

**Step 2:** Run `bun run check` — Biome passes

**Step 3:** Verify client forms still work (they import from `orpc.feedback.*` which hasn't changed its public API — same input shapes minus the `type` discriminator which is added by the router)
