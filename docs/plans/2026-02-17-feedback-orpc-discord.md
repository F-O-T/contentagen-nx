# Feedback oRPC Router + Discord Notifications

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Centralize feedback submissions (bug report, feature request, feature feedback) through oRPC mutations that fan out to PostHog surveys + Discord forum channel in one place.

**Architecture:** Client forms call oRPC mutations instead of PostHog directly. The server handler captures the survey event to PostHog (server-side) and posts a Discord embed to a forum channel webhook. Both senders are failure-tolerant.

**Tech Stack:** oRPC, PostHog Node SDK, Discord Webhooks API, Zod, TanStack Query

---

### Task 1: Add Discord Webhook env var

**Files:**
- Modify: `packages/environment/src/server.ts`

**Step 1: Add env var**

In `packages/environment/src/server.ts`, add inside the `server` object after the `BETTER_STACK_HEARTBEAT_URL` line:

```typescript
// Discord (Optional - feedback notifications)
DISCORD_FEEDBACK_WEBHOOK_URL: z.url().optional(),
```

**Step 2: Add placeholder to .env**

In `packages/database/.env`, add:

```
DISCORD_FEEDBACK_WEBHOOK_URL=
```

**Step 3: Commit**

```bash
git add packages/environment/src/server.ts packages/database/.env
git commit -m "feat(env): add DISCORD_FEEDBACK_WEBHOOK_URL"
```

---

### Task 2: Create the feedback oRPC router

**Files:**
- Create: `apps/web/src/integrations/orpc/router/feedback.ts`
- Modify: `apps/web/src/integrations/orpc/router/index.ts`

**Step 1: Create the router**

Create `apps/web/src/integrations/orpc/router/feedback.ts`:

```typescript
import { env } from "@packages/environment/server";
import { captureServerEvent } from "@packages/posthog/server";
import { z } from "zod";
import { authenticatedProcedure } from "../server";

// =============================================================================
// Constants
// =============================================================================

const SURVEY_IDS = {
   BUG_REPORT: "019c6be5-4893-0000-7270-57dc03529638",
   FEATURE_REQUEST: "019c6be5-5783-0000-684e-aceb5002b650",
   FEATURE_FEEDBACK: "019c6be5-6296-0000-b0a3-2ab421e77719",
} as const;

const EMOJI_RATINGS = ["😡", "😕", "😐", "🙂", "🤩"];

// =============================================================================
// Helpers
// =============================================================================

async function sendDiscordEmbed(embed: {
   title: string;
   color: number;
   fields: { name: string; value: string; inline?: boolean }[];
   threadName: string;
}) {
   const webhookUrl = env.DISCORD_FEEDBACK_WEBHOOK_URL;
   if (!webhookUrl) return;

   try {
      await fetch(`${webhookUrl}?wait=true`, {
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
   } catch (error) {
      console.error("[Feedback] Discord notification failed:", error);
   }
}

function captureSurveyResponse(
   posthog: Parameters<typeof captureServerEvent>[0] | undefined,
   userId: string,
   surveyId: string,
   responses: Record<string, unknown>,
) {
   if (!posthog) return;

   try {
      captureServerEvent(posthog, {
         userId,
         event: "survey sent",
         properties: {
            $survey_id: surveyId,
            ...responses,
         },
      });
   } catch (error) {
      console.error("[Feedback] PostHog survey capture failed:", error);
   }
}

// =============================================================================
// Validation Schemas
// =============================================================================

const bugReportSchema = z.object({
   description: z.string().min(1),
   severity: z.string().optional(),
});

const featureRequestSchema = z.object({
   feature: z.string().min(1),
   problem: z.string().optional(),
   priority: z.number().min(0).max(5),
});

const featureFeedbackSchema = z.object({
   featureName: z.string().min(1),
   rating: z.number().min(1).max(5),
   improvement: z.string().optional(),
});

// =============================================================================
// Procedures
// =============================================================================

export const submitBugReport = authenticatedProcedure
   .input(bugReportSchema)
   .handler(async ({ context, input }) => {
      const { posthog } = context;
      const userId = context.session.user.id;
      const userEmail = context.session.user.email;

      captureSurveyResponse(posthog, userId, SURVEY_IDS.BUG_REPORT, {
         $survey_response: input.description,
         $survey_response_1: input.severity ?? "",
      });

      await sendDiscordEmbed({
         title: "🐛 Bug Report",
         color: 0xef4444,
         threadName: `Bug: ${input.description.slice(0, 80)}`,
         fields: [
            { name: "Descrição", value: input.description },
            ...(input.severity
               ? [{ name: "Gravidade", value: input.severity, inline: true }]
               : []),
            { name: "Usuário", value: userEmail, inline: true },
         ],
      });

      return { success: true };
   });

export const submitFeatureRequest = authenticatedProcedure
   .input(featureRequestSchema)
   .handler(async ({ context, input }) => {
      const { posthog } = context;
      const userId = context.session.user.id;
      const userEmail = context.session.user.email;

      captureSurveyResponse(posthog, userId, SURVEY_IDS.FEATURE_REQUEST, {
         $survey_response: input.feature,
         $survey_response_1: input.problem ?? "",
         $survey_response_2: input.priority,
      });

      const stars = "⭐".repeat(input.priority);

      await sendDiscordEmbed({
         title: "💡 Feature Request",
         color: 0xf59e0b,
         threadName: `Feature: ${input.feature.slice(0, 80)}`,
         fields: [
            { name: "Feature", value: input.feature },
            ...(input.problem
               ? [{ name: "Problema", value: input.problem }]
               : []),
            { name: "Prioridade", value: stars || "Não informada", inline: true },
            { name: "Usuário", value: userEmail, inline: true },
         ],
      });

      return { success: true };
   });

export const submitFeatureFeedback = authenticatedProcedure
   .input(featureFeedbackSchema)
   .handler(async ({ context, input }) => {
      const { posthog } = context;
      const userId = context.session.user.id;
      const userEmail = context.session.user.email;

      captureSurveyResponse(posthog, userId, SURVEY_IDS.FEATURE_FEEDBACK, {
         $survey_response: input.rating,
         $survey_response_1: input.improvement ?? "",
         feature_name: input.featureName,
      });

      const emoji = EMOJI_RATINGS[input.rating - 1] ?? "😐";

      await sendDiscordEmbed({
         title: "💬 Feature Feedback",
         color: 0x3b82f6,
         threadName: `Feedback: ${input.featureName}`,
         fields: [
            { name: "Feature", value: input.featureName, inline: true },
            { name: "Rating", value: `${emoji} (${input.rating}/5)`, inline: true },
            ...(input.improvement
               ? [{ name: "Melhoria", value: input.improvement }]
               : []),
            { name: "Usuário", value: userEmail, inline: true },
         ],
      });

      return { success: true };
   });
```

**Step 2: Register the router**

In `apps/web/src/integrations/orpc/router/index.ts`, add import and entry:

```typescript
import * as feedbackRouter from "./feedback";
```

And in the default export object:

```typescript
feedback: feedbackRouter,
```

**Step 3: Commit**

```bash
git add apps/web/src/integrations/orpc/router/feedback.ts apps/web/src/integrations/orpc/router/index.ts
git commit -m "feat(orpc): add feedback router with PostHog + Discord"
```

---

### Task 3: Update BugReportForm to use oRPC mutation

**Files:**
- Modify: `apps/web/src/features/feedback/ui/bug-report-form.tsx`

**Step 1: Replace PostHog client with mutation**

Replace the full file content. Key changes:
- Remove `useSurveys` import and usage
- Remove `SURVEY_IDS` import
- Add `useMutation` with `orpc.feedback.submitBugReport.mutationOptions()`
- Keep the same UI, just wire `onSubmit` to mutation

```typescript
import { Button } from "@packages/ui/components/button";
import {
	Field,
	FieldError,
	FieldGroup,
	FieldLabel,
} from "@packages/ui/components/field";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@packages/ui/components/select";
import { Textarea } from "@packages/ui/components/textarea";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "@tanstack/react-form";
import { CheckCircle, Loader2 } from "lucide-react";
import { type FormEvent, useCallback, useState } from "react";
import { z } from "zod";
import { orpc } from "@/integrations/orpc/client";

const bugReportSchema = z.object({
	description: z.string().min(1, "Descreva o problema encontrado."),
	severity: z.string().optional(),
});

type BugReportFormProps = {
	onSuccess: () => void;
};

export function BugReportForm({ onSuccess }: BugReportFormProps) {
	const [submitted, setSubmitted] = useState(false);

	const mutation = useMutation(
		orpc.feedback.submitBugReport.mutationOptions({
			onSuccess: () => {
				setSubmitted(true);
				setTimeout(onSuccess, 2000);
			},
		}),
	);

	const form = useForm({
		defaultValues: { description: "", severity: "" },
		onSubmit: ({ value }) => {
			mutation.mutate({
				description: value.description,
				severity: value.severity || undefined,
			});
		},
		validators: { onBlur: bugReportSchema },
	});

	const handleSubmit = useCallback(
		(e: FormEvent) => {
			e.preventDefault();
			e.stopPropagation();
			form.handleSubmit();
		},
		[form],
	);

	if (submitted) {
		return (
			<div className="flex flex-col items-center gap-3 py-8 text-center">
				<CheckCircle className="size-10 text-green-500" />
				<p className="text-sm font-medium">Obrigado pelo relato!</p>
				<p className="text-xs text-muted-foreground">
					Vamos investigar e corrigir o mais rápido possível.
				</p>
			</div>
		);
	}

	return (
		<form className="space-y-4" onSubmit={handleSubmit}>
			<FieldGroup>
				<form.Field name="description">
					{(field) => {
						const isInvalid =
							field.state.meta.isTouched && !field.state.meta.isValid;
						return (
							<Field data-invalid={isInvalid}>
								<FieldLabel htmlFor={field.name}>
									O que aconteceu?
								</FieldLabel>
								<Textarea
									aria-invalid={isInvalid}
									id={field.name}
									name={field.name}
									onBlur={field.handleBlur}
									onChange={(e) => field.handleChange(e.target.value)}
									placeholder="Descreva o problema que você encontrou..."
									rows={4}
									value={field.state.value}
								/>
								{isInvalid && (
									<FieldError errors={field.state.meta.errors} />
								)}
							</Field>
						);
					}}
				</form.Field>

				<form.Field name="severity">
					{(field) => (
						<Field>
							<FieldLabel htmlFor={field.name}>
								Qual a gravidade?
							</FieldLabel>
							<Select
								onValueChange={(value) => field.handleChange(value)}
								value={field.state.value}
							>
								<SelectTrigger className="w-full" id={field.name}>
									<SelectValue placeholder="Selecione..." />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="Bloqueante — não consigo usar">
										Bloqueante — não consigo usar
									</SelectItem>
									<SelectItem value="Importante — atrapalha mas consigo contornar">
										Importante — atrapalha mas consigo contornar
									</SelectItem>
									<SelectItem value="Menor — incômodo pequeno">
										Menor — incômodo pequeno
									</SelectItem>
								</SelectContent>
							</Select>
						</Field>
					)}
				</form.Field>
			</FieldGroup>

			<form.Subscribe selector={(state) => state.canSubmit}>
				{(canSubmit) => (
					<Button
						className="w-full"
						disabled={!canSubmit || mutation.isPending}
						type="submit"
					>
						{mutation.isPending ? (
							<Loader2 className="size-4 animate-spin" />
						) : null}
						Enviar relato
					</Button>
				)}
			</form.Subscribe>
		</form>
	);
}
```

**Step 2: Commit**

```bash
git add apps/web/src/features/feedback/ui/bug-report-form.tsx
git commit -m "refactor(feedback): use oRPC mutation for bug report"
```

---

### Task 4: Update FeatureRequestForm to use oRPC mutation

**Files:**
- Modify: `apps/web/src/features/feedback/ui/feature-request-form.tsx`

**Step 1: Replace PostHog client with mutation**

Same pattern as bug report. Key changes:
- Remove `useSurveys`, `SURVEY_IDS`
- Add `useMutation(orpc.feedback.submitFeatureRequest.mutationOptions(...))`
- Add loading state to submit button

```typescript
import { Button } from "@packages/ui/components/button";
import {
	Field,
	FieldError,
	FieldGroup,
	FieldLabel,
} from "@packages/ui/components/field";
import { Textarea } from "@packages/ui/components/textarea";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "@tanstack/react-form";
import { CheckCircle, Loader2, Star } from "lucide-react";
import { type FormEvent, useCallback, useState } from "react";
import { z } from "zod";
import { orpc } from "@/integrations/orpc/client";

const featureRequestSchema = z.object({
	feature: z.string().min(1, "Descreva a funcionalidade desejada."),
	problem: z.string().optional(),
	priority: z.number(),
});

type FeatureRequestFormProps = {
	onSuccess: () => void;
};

export function FeatureRequestForm({ onSuccess }: FeatureRequestFormProps) {
	const [submitted, setSubmitted] = useState(false);

	const mutation = useMutation(
		orpc.feedback.submitFeatureRequest.mutationOptions({
			onSuccess: () => {
				setSubmitted(true);
				setTimeout(onSuccess, 2000);
			},
		}),
	);

	const form = useForm({
		defaultValues: { feature: "", problem: "", priority: 0 },
		onSubmit: ({ value }) => {
			mutation.mutate({
				feature: value.feature,
				problem: value.problem || undefined,
				priority: value.priority,
			});
		},
		validators: { onBlur: featureRequestSchema },
	});

	const handleSubmit = useCallback(
		(e: FormEvent) => {
			e.preventDefault();
			e.stopPropagation();
			form.handleSubmit();
		},
		[form],
	);

	if (submitted) {
		return (
			<div className="flex flex-col items-center gap-3 py-8 text-center">
				<CheckCircle className="size-10 text-green-500" />
				<p className="text-sm font-medium">Obrigado pela sugestão!</p>
				<p className="text-xs text-muted-foreground">
					Sua ideia foi registrada e será avaliada pela equipe.
				</p>
			</div>
		);
	}

	return (
		<form className="space-y-4" onSubmit={handleSubmit}>
			<FieldGroup>
				<form.Field name="feature">
					{(field) => {
						const isInvalid =
							field.state.meta.isTouched && !field.state.meta.isValid;
						return (
							<Field data-invalid={isInvalid}>
								<FieldLabel htmlFor={field.name}>
									Que feature você gostaria?
								</FieldLabel>
								<Textarea
									aria-invalid={isInvalid}
									id={field.name}
									name={field.name}
									onBlur={field.handleBlur}
									onChange={(e) => field.handleChange(e.target.value)}
									placeholder="Descreva a funcionalidade que você precisa..."
									rows={3}
									value={field.state.value}
								/>
								{isInvalid && (
									<FieldError errors={field.state.meta.errors} />
								)}
							</Field>
						);
					}}
				</form.Field>

				<form.Field name="problem">
					{(field) => (
						<Field>
							<FieldLabel htmlFor={field.name}>
								Qual problema ela resolveria?{" "}
								<span className="text-muted-foreground">(opcional)</span>
							</FieldLabel>
							<Textarea
								id={field.name}
								name={field.name}
								onBlur={field.handleBlur}
								onChange={(e) => field.handleChange(e.target.value)}
								placeholder="Nos ajude a entender o contexto..."
								rows={2}
								value={field.state.value}
							/>
						</Field>
					)}
				</form.Field>

				<form.Field name="priority">
					{(field) => (
						<Field>
							<FieldLabel>Qual a prioridade para você?</FieldLabel>
							<div className="flex items-center gap-1">
								{[1, 2, 3, 4, 5].map((value) => (
									<button
										className="rounded-md p-1.5 transition-colors hover:bg-muted"
										key={`priority-${value}`}
										onClick={() => field.handleChange(value)}
										type="button"
									>
										<Star
											className={`size-6 ${
												value <= field.state.value
													? "fill-amber-400 text-amber-400"
													: "text-muted-foreground"
											}`}
										/>
									</button>
								))}
							</div>
							<div className="flex justify-between text-xs text-muted-foreground">
								<span>Seria legal</span>
								<span>Preciso muito</span>
							</div>
						</Field>
					)}
				</form.Field>
			</FieldGroup>

			<form.Subscribe selector={(state) => state.canSubmit}>
				{(canSubmit) => (
					<Button
						className="w-full"
						disabled={!canSubmit || mutation.isPending}
						type="submit"
					>
						{mutation.isPending ? (
							<Loader2 className="size-4 animate-spin" />
						) : null}
						Enviar sugestão
					</Button>
				)}
			</form.Subscribe>
		</form>
	);
}
```

**Step 2: Commit**

```bash
git add apps/web/src/features/feedback/ui/feature-request-form.tsx
git commit -m "refactor(feedback): use oRPC mutation for feature request"
```

---

### Task 5: Update FeatureFeedbackForm to use oRPC mutation

**Files:**
- Modify: `apps/web/src/features/feedback/ui/feature-feedback-form.tsx`

**Step 1: Replace PostHog client with mutation**

```typescript
import { Button } from "@packages/ui/components/button";
import { Label } from "@packages/ui/components/label";
import { Textarea } from "@packages/ui/components/textarea";
import { useMutation } from "@tanstack/react-query";
import { CheckCircle, Loader2 } from "lucide-react";
import { useState } from "react";
import { orpc } from "@/integrations/orpc/client";

const EMOJI_SCALE = ["😡", "😕", "😐", "🙂", "🤩"];

type FeatureFeedbackFormProps = {
	featureName: string;
	onSuccess: () => void;
};

export function FeatureFeedbackForm({
	featureName,
	onSuccess,
}: FeatureFeedbackFormProps) {
	const [rating, setRating] = useState(0);
	const [improvement, setImprovement] = useState("");
	const [submitted, setSubmitted] = useState(false);

	const mutation = useMutation(
		orpc.feedback.submitFeatureFeedback.mutationOptions({
			onSuccess: () => {
				setSubmitted(true);
				setTimeout(onSuccess, 2000);
			},
		}),
	);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (rating === 0) return;

		mutation.mutate({
			featureName,
			rating,
			improvement: improvement || undefined,
		});
	};

	if (submitted) {
		return (
			<div className="flex flex-col items-center gap-3 py-6 text-center">
				<CheckCircle className="size-8 text-green-500" />
				<p className="text-sm font-medium">Obrigado pelo feedback!</p>
				<p className="text-xs text-muted-foreground">
					Seu retorno nos ajuda a melhorar essa funcionalidade.
				</p>
			</div>
		);
	}

	return (
		<form className="space-y-4" onSubmit={handleSubmit}>
			<div className="space-y-2">
				<Label>Como está sendo a experiência?</Label>
				<div className="flex items-center justify-between gap-1">
					{EMOJI_SCALE.map((emoji, index) => (
						<button
							className={`rounded-lg p-2 text-2xl transition-all ${
								rating === index + 1
									? "bg-muted ring-2 ring-primary scale-110"
									: "hover:bg-muted/50"
							}`}
							key={`emoji-${index + 1}`}
							onClick={() => setRating(index + 1)}
							type="button"
						>
							{emoji}
						</button>
					))}
				</div>
				<div className="flex justify-between text-xs text-muted-foreground">
					<span>Péssima</span>
					<span>Excelente</span>
				</div>
			</div>

			<div className="space-y-2">
				<Label htmlFor="feature-improvement">
					O que poderia melhorar?{" "}
					<span className="text-muted-foreground">(opcional)</span>
				</Label>
				<Textarea
					id="feature-improvement"
					onChange={(e) => setImprovement(e.target.value)}
					placeholder="Conte o que falta ou o que te incomoda..."
					rows={3}
					value={improvement}
				/>
			</div>

			<Button
				className="w-full"
				disabled={rating === 0 || mutation.isPending}
				type="submit"
			>
				{mutation.isPending ? (
					<Loader2 className="size-4 animate-spin" />
				) : null}
				Enviar feedback
			</Button>
		</form>
	);
}
```

**Step 2: Commit**

```bash
git add apps/web/src/features/feedback/ui/feature-feedback-form.tsx
git commit -m "refactor(feedback): use oRPC mutation for feature feedback"
```

---

### Task 6: Clean up constants and unused imports

**Files:**
- Modify: `apps/web/src/features/feedback/constants.ts`
- Modify: `apps/web/src/features/feedback/ui/feedback-fab.tsx`

**Step 1: Remove SURVEY_IDS from constants**

Update `constants.ts` to only keep error tracking constants:

```typescript
export const API_ERROR_THRESHOLD = 3;
export const API_ERROR_WINDOW_MS = 5 * 60 * 1000; // 5 minutes
```

**Step 2: Remove unused imports from feedback-fab.tsx**

The FAB doesn't import `SURVEY_IDS` directly (forms do), so just verify no dead imports remain after form changes.

**Step 3: Commit**

```bash
git add apps/web/src/features/feedback/constants.ts
git commit -m "chore(feedback): remove client-side survey IDs (now server-side)"
```

---

### Task 7: Verify end-to-end

**Step 1:** Run `bun run typecheck` — ensure no type errors

**Step 2:** Run `bun run check` — ensure Biome lint passes

**Step 3:** Start dev server with `bun dev` and test:
- Click FAB → Report Bug → fill & submit → check PostHog survey results + Discord
- Click FAB → Suggest Feature → fill & submit → check PostHog survey results + Discord
- Test without `DISCORD_FEEDBACK_WEBHOOK_URL` set → should not error

**Step 4:** Check PostHog survey stats:
```
Survey ID: 019c6be5-4893-0000-7270-57dc03529638 (Bug Report)
Survey ID: 019c6be5-5783-0000-684e-aceb5002b650 (Feature Request)
Survey ID: 019c6be5-6296-0000-b0a3-2ab421e77719 (Feature Feedback)
```
