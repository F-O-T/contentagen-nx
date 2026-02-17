# Feedback System (PostHog Surveys) Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a FAB with bug report, feature request, and docs/help options — plus feature feedback banners for beta features — all powered by PostHog API surveys.

**Architecture:** Custom UI forms submit responses to PostHog via `captureSurveySent()`. A client-side error tracker counts API errors and auto-opens the bug report form at 3+ errors in 5 minutes. Beta feature feedback reuses the `EarlyAccessBanner` pattern with a linked survey form.

**Tech Stack:** React, PostHog JS SDK (`useSurveys`, `captureSurveySent`), Radix Popover, TanStack Store, Lucide icons

---

## PostHog Survey IDs (Contentta project 287022)

```
BUG_REPORT    = "019c6be5-4893-0000-7270-57dc03529638"
FEATURE_REQUEST = "019c6be5-5783-0000-684e-aceb5002b650"
FEATURE_FEEDBACK = "019c6be5-6296-0000-b0a3-2ab421e77719"
```

---

### Task 1: Survey ID constants

**Files:**
- Create: `apps/web/src/features/feedback/constants.ts`

**Step 1: Create the constants file**

```typescript
export const SURVEY_IDS = {
   BUG_REPORT: "019c6be5-4893-0000-7270-57dc03529638",
   FEATURE_REQUEST: "019c6be5-5783-0000-684e-aceb5002b650",
   FEATURE_FEEDBACK: "019c6be5-6296-0000-b0a3-2ab421e77719",
} as const;

export const API_ERROR_THRESHOLD = 3;
export const API_ERROR_WINDOW_MS = 5 * 60 * 1000; // 5 minutes
```

**Step 2: Commit**

```bash
git add apps/web/src/features/feedback/constants.ts
git commit -m "feat(feedback): add PostHog survey ID constants"
```

---

### Task 2: API error tracker hook

**Files:**
- Create: `apps/web/src/features/feedback/hooks/use-api-error-tracker.ts`

**Step 1: Create the hook**

This hook listens to failed queries/mutations via TanStack Query's global `queryCache` and `mutationCache` callbacks. When 3+ API errors (4xx/5xx) occur within 5 minutes, it sets `shouldShowBugReport` to `true`.

```typescript
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import { API_ERROR_THRESHOLD, API_ERROR_WINDOW_MS } from "../constants";

export function useApiErrorTracker() {
   const queryClient = useQueryClient();
   const errorsRef = useRef<number[]>([]);
   const [shouldShowBugReport, setShouldShowBugReport] = useState(false);
   const dismissedRef = useRef(false);

   const trackError = useCallback(() => {
      if (dismissedRef.current) return;

      const now = Date.now();
      errorsRef.current.push(now);

      // Remove errors outside the window
      errorsRef.current = errorsRef.current.filter(
         (t) => now - t < API_ERROR_WINDOW_MS,
      );

      if (errorsRef.current.length >= API_ERROR_THRESHOLD) {
         setShouldShowBugReport(true);
      }
   }, []);

   useEffect(() => {
      const queryCache = queryClient.getQueryCache();
      const mutationCache = queryClient.getMutationCache();

      const unsubQuery = queryCache.subscribe((event) => {
         if (event.type === "updated" && event.query.state.status === "error") {
            trackError();
         }
      });

      const unsubMutation = mutationCache.subscribe((event) => {
         if (
            event.type === "updated" &&
            event.mutation?.state.status === "error"
         ) {
            trackError();
         }
      });

      return () => {
         unsubQuery();
         unsubMutation();
      };
   }, [queryClient, trackError]);

   const dismiss = useCallback(() => {
      dismissedRef.current = true;
      setShouldShowBugReport(false);
      errorsRef.current = [];
   }, []);

   const reset = useCallback(() => {
      dismissedRef.current = false;
      errorsRef.current = [];
      setShouldShowBugReport(false);
   }, []);

   return { shouldShowBugReport, dismiss, reset };
}
```

**Step 2: Commit**

```bash
git add apps/web/src/features/feedback/hooks/use-api-error-tracker.ts
git commit -m "feat(feedback): add API error tracker hook for auto-trigger bug report"
```

---

### Task 3: Survey form components (Bug Report + Feature Request)

**Files:**
- Create: `apps/web/src/features/feedback/ui/bug-report-form.tsx`
- Create: `apps/web/src/features/feedback/ui/feature-request-form.tsx`

These are inline forms rendered inside the sheet. They use `captureSurveySent()` to send responses to PostHog.

**Step 1: Create bug report form**

```tsx
import { useSurveys } from "@packages/posthog/client";
import { Button } from "@packages/ui/components/button";
import { Label } from "@packages/ui/components/label";
import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
} from "@packages/ui/components/select";
import { Textarea } from "@packages/ui/components/textarea";
import { CheckCircle } from "lucide-react";
import { useState } from "react";
import { SURVEY_IDS } from "../constants";

type BugReportFormProps = {
   onSuccess: () => void;
};

export function BugReportForm({ onSuccess }: BugReportFormProps) {
   const { captureSurveySent, captureSurveyShown } = useSurveys();
   const [description, setDescription] = useState("");
   const [severity, setSeverity] = useState("");
   const [submitted, setSubmitted] = useState(false);

   useState(() => {
      captureSurveyShown(SURVEY_IDS.BUG_REPORT);
   });

   const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!description.trim()) return;

      captureSurveySent(SURVEY_IDS.BUG_REPORT, {
         $survey_response: description,
         $survey_response_1: severity,
      });

      setSubmitted(true);
      setTimeout(onSuccess, 2000);
   };

   if (submitted) {
      return (
         <div className="flex flex-col items-center gap-3 py-8 text-center">
            <CheckCircle className="size-10 text-green-500" />
            <p className="text-sm font-medium">Obrigado pelo relato!</p>
            <p className="text-xs text-muted-foreground">
               Vamos investigar e corrigir o mais rapido possivel.
            </p>
         </div>
      );
   }

   return (
      <form className="space-y-4" onSubmit={handleSubmit}>
         <div className="space-y-2">
            <Label htmlFor="bug-description">O que aconteceu?</Label>
            <Textarea
               id="bug-description"
               onChange={(e) => setDescription(e.target.value)}
               placeholder="Descreva o problema que voce encontrou..."
               rows={4}
               value={description}
            />
         </div>

         <div className="space-y-2">
            <Label htmlFor="bug-severity">Qual a gravidade?</Label>
            <Select onValueChange={setSeverity} value={severity}>
               <SelectTrigger id="bug-severity">
                  <SelectValue placeholder="Selecione..." />
               </SelectTrigger>
               <SelectContent>
                  <SelectItem value="Bloqueante — nao consigo usar">
                     Bloqueante — nao consigo usar
                  </SelectItem>
                  <SelectItem value="Importante — atrapalha mas consigo contornar">
                     Importante — atrapalha mas consigo contornar
                  </SelectItem>
                  <SelectItem value="Menor — incomodo pequeno">
                     Menor — incomodo pequeno
                  </SelectItem>
               </SelectContent>
            </Select>
         </div>

         <Button
            className="w-full"
            disabled={!description.trim()}
            type="submit"
         >
            Enviar relato
         </Button>
      </form>
   );
}
```

**Step 2: Create feature request form**

```tsx
import { useSurveys } from "@packages/posthog/client";
import { Button } from "@packages/ui/components/button";
import { Label } from "@packages/ui/components/label";
import { Textarea } from "@packages/ui/components/textarea";
import { CheckCircle, Star } from "lucide-react";
import { useState } from "react";
import { SURVEY_IDS } from "../constants";

type FeatureRequestFormProps = {
   onSuccess: () => void;
};

export function FeatureRequestForm({ onSuccess }: FeatureRequestFormProps) {
   const { captureSurveySent, captureSurveyShown } = useSurveys();
   const [feature, setFeature] = useState("");
   const [problem, setProblem] = useState("");
   const [priority, setPriority] = useState(0);
   const [submitted, setSubmitted] = useState(false);

   useState(() => {
      captureSurveyShown(SURVEY_IDS.FEATURE_REQUEST);
   });

   const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!feature.trim()) return;

      captureSurveySent(SURVEY_IDS.FEATURE_REQUEST, {
         $survey_response: feature,
         $survey_response_1: problem,
         $survey_response_2: priority,
      });

      setSubmitted(true);
      setTimeout(onSuccess, 2000);
   };

   if (submitted) {
      return (
         <div className="flex flex-col items-center gap-3 py-8 text-center">
            <CheckCircle className="size-10 text-green-500" />
            <p className="text-sm font-medium">Obrigado pela sugestao!</p>
            <p className="text-xs text-muted-foreground">
               Sua ideia foi registrada e sera avaliada pela equipe.
            </p>
         </div>
      );
   }

   return (
      <form className="space-y-4" onSubmit={handleSubmit}>
         <div className="space-y-2">
            <Label htmlFor="feature-description">
               Que feature voce gostaria?
            </Label>
            <Textarea
               id="feature-description"
               onChange={(e) => setFeature(e.target.value)}
               placeholder="Descreva a funcionalidade que voce precisa..."
               rows={3}
               value={feature}
            />
         </div>

         <div className="space-y-2">
            <Label htmlFor="feature-problem">
               Qual problema ela resolveria?{" "}
               <span className="text-muted-foreground">(opcional)</span>
            </Label>
            <Textarea
               id="feature-problem"
               onChange={(e) => setProblem(e.target.value)}
               placeholder="Nos ajude a entender o contexto..."
               rows={2}
               value={problem}
            />
         </div>

         <div className="space-y-2">
            <Label>Qual a prioridade para voce?</Label>
            <div className="flex items-center gap-1">
               {[1, 2, 3, 4, 5].map((value) => (
                  <button
                     className="rounded-md p-1.5 transition-colors hover:bg-muted"
                     key={`priority-${value}`}
                     onClick={() => setPriority(value)}
                     type="button"
                  >
                     <Star
                        className={`size-6 ${
                           value <= priority
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
         </div>

         <Button
            className="w-full"
            disabled={!feature.trim()}
            type="submit"
         >
            Enviar sugestao
         </Button>
      </form>
   );
}
```

**Step 3: Commit**

```bash
git add apps/web/src/features/feedback/ui/bug-report-form.tsx apps/web/src/features/feedback/ui/feature-request-form.tsx
git commit -m "feat(feedback): add bug report and feature request form components"
```

---

### Task 4: Feature feedback form (for beta features)

**Files:**
- Create: `apps/web/src/features/feedback/ui/feature-feedback-form.tsx`

**Step 1: Create feature feedback form**

```tsx
import { useSurveys } from "@packages/posthog/client";
import { Button } from "@packages/ui/components/button";
import { Label } from "@packages/ui/components/label";
import { Textarea } from "@packages/ui/components/textarea";
import { CheckCircle } from "lucide-react";
import { useState } from "react";
import { SURVEY_IDS } from "../constants";

const EMOJI_SCALE = ["😡", "😕", "😐", "🙂", "🤩"];

type FeatureFeedbackFormProps = {
   featureName: string;
   onSuccess: () => void;
};

export function FeatureFeedbackForm({
   featureName,
   onSuccess,
}: FeatureFeedbackFormProps) {
   const { captureSurveySent, captureSurveyShown } = useSurveys();
   const [rating, setRating] = useState(0);
   const [improvement, setImprovement] = useState("");
   const [submitted, setSubmitted] = useState(false);

   useState(() => {
      captureSurveyShown(SURVEY_IDS.FEATURE_FEEDBACK);
   });

   const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (rating === 0) return;

      captureSurveySent(SURVEY_IDS.FEATURE_FEEDBACK, {
         $survey_response: rating,
         $survey_response_1: improvement,
         feature_name: featureName,
      });

      setSubmitted(true);
      setTimeout(onSuccess, 2000);
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
            <Label>Como esta sendo a experiencia?</Label>
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
               <span>Pessima</span>
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
            disabled={rating === 0}
            type="submit"
         >
            Enviar feedback
         </Button>
      </form>
   );
}
```

**Step 2: Commit**

```bash
git add apps/web/src/features/feedback/ui/feature-feedback-form.tsx
git commit -m "feat(feedback): add feature feedback form for beta features"
```

---

### Task 5: Feedback FAB component

**Files:**
- Create: `apps/web/src/features/feedback/ui/feedback-fab.tsx`

**Step 1: Create the FAB**

The FAB is a floating button at the bottom-right that opens a `Popover` with 3 options: Bug Report, Feature Request, Docs/Help. Clicking Bug Report or Feature Request opens a `Sheet` with the respective form. The error tracker auto-opens the bug report sheet.

```tsx
import {
   Popover,
   PopoverContent,
   PopoverTrigger,
} from "@packages/ui/components/popover";
import {
   Bug,
   ExternalLink,
   Lightbulb,
   MessageSquarePlus,
} from "lucide-react";
import { useState } from "react";
import { useSheet } from "@/hooks/use-sheet";
import { useApiErrorTracker } from "../hooks/use-api-error-tracker";
import { BugReportForm } from "./bug-report-form";
import { FeatureRequestForm } from "./feature-request-form";

const DOCS_URL = "https://docs.contentta.com";

export function FeedbackFab() {
   const [open, setOpen] = useState(false);
   const { openSheet, closeSheet } = useSheet();
   const { shouldShowBugReport, dismiss } = useApiErrorTracker();

   const openBugReport = () => {
      setOpen(false);
      openSheet({
         children: (
            <div className="space-y-4">
               <div>
                  <h3 className="text-lg font-semibold">Reportar Bug</h3>
                  <p className="text-sm text-muted-foreground">
                     Nos ajude a melhorar reportando problemas.
                  </p>
               </div>
               <BugReportForm
                  onSuccess={() => {
                     dismiss();
                     closeSheet();
                  }}
               />
            </div>
         ),
      });
   };

   const openFeatureRequest = () => {
      setOpen(false);
      openSheet({
         children: (
            <div className="space-y-4">
               <div>
                  <h3 className="text-lg font-semibold">Sugerir Feature</h3>
                  <p className="text-sm text-muted-foreground">
                     Compartilhe suas ideias para novas funcionalidades.
                  </p>
               </div>
               <FeatureRequestForm onSuccess={closeSheet} />
            </div>
         ),
      });
   };

   // Auto-trigger bug report on too many API errors
   useState(() => {
      if (shouldShowBugReport) {
         openBugReport();
      }
   });

   return (
      <div className="fixed bottom-6 right-6 z-50">
         <Popover onOpenChange={setOpen} open={open}>
            <PopoverTrigger asChild>
               <button
                  className="flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105 active:scale-95"
                  type="button"
               >
                  <MessageSquarePlus className="size-5" />
               </button>
            </PopoverTrigger>
            <PopoverContent
               align="end"
               className="w-56 p-2"
               side="top"
               sideOffset={8}
            >
               <div className="flex flex-col gap-1">
                  <button
                     className="flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-muted text-left"
                     onClick={openBugReport}
                     type="button"
                  >
                     <Bug className="size-4 text-red-500" />
                     <span>Reportar Bug</span>
                  </button>
                  <button
                     className="flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-muted text-left"
                     onClick={openFeatureRequest}
                     type="button"
                  >
                     <Lightbulb className="size-4 text-amber-500" />
                     <span>Sugerir Feature</span>
                  </button>
                  <a
                     className="flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-muted"
                     href={DOCS_URL}
                     rel="noopener noreferrer"
                     target="_blank"
                  >
                     <ExternalLink className="size-4 text-blue-500" />
                     <span>Documentacao</span>
                  </a>
               </div>
            </PopoverContent>
         </Popover>
      </div>
   );
}
```

**Step 2: Commit**

```bash
git add apps/web/src/features/feedback/ui/feedback-fab.tsx
git commit -m "feat(feedback): add feedback FAB with popover menu"
```

---

### Task 6: Mount FAB in Dashboard Layout

**Files:**
- Modify: `apps/web/src/layout/dashboard/ui/dashboard-layout.tsx`

**Step 1: Add the FAB import and render it**

Add import at top:
```typescript
import { FeedbackFab } from "@/features/feedback/ui/feedback-fab";
```

Add `<FeedbackFab />` right after the closing `</main>` tag (inside `<SidebarInset>`):

```tsx
<main className={cn(...)}>
   {children}
</main>
<FeedbackFab />
```

**Step 2: Commit**

```bash
git add apps/web/src/layout/dashboard/ui/dashboard-layout.tsx
git commit -m "feat(feedback): mount feedback FAB in dashboard layout"
```

---

### Task 7: Update EarlyAccessBanner to open feature feedback form

**Files:**
- Modify: `apps/web/src/features/billing/ui/early-access-banner.tsx`

**Step 1: Update the banner CTA to open the feature feedback sheet**

The existing `handleCtaClick` only logs. Update it to open a sheet with the `FeatureFeedbackForm`:

```tsx
import { useSheet } from "@/hooks/use-sheet";
import { FeatureFeedbackForm } from "@/features/feedback/ui/feature-feedback-form";
```

Add to the component body:
```tsx
const { openSheet, closeSheet } = useSheet();

const handleCtaClick = () => {
   openSheet({
      children: (
         <div className="space-y-4">
            <div>
               <h3 className="text-lg font-semibold">Feedback</h3>
               <p className="text-sm text-muted-foreground">
                  {template.message}
               </p>
            </div>
            <FeatureFeedbackForm
               featureName={template.badgeLabel}
               onSuccess={closeSheet}
            />
         </div>
      ),
   });
};
```

Remove the old `handleCtaClick` and the `useSurveys()` import/usage since we now go through the sheet form directly.

**Step 2: Commit**

```bash
git add apps/web/src/features/billing/ui/early-access-banner.tsx
git commit -m "feat(feedback): connect early access banner to feature feedback form"
```

---

### Task 8: Launch surveys in PostHog

Once the app code is deployed and tested, set `start_date` on each survey via PostHog MCP to activate them:

```
mcp__posthog__survey-update(surveyId, { start_date: "2026-02-17T..." })
```

This is done manually after verifying the forms work correctly in dev.

---

## Summary

| Component | Location | Purpose |
|-----------|----------|---------|
| `constants.ts` | `features/feedback/` | Survey IDs + error thresholds |
| `useApiErrorTracker` | `features/feedback/hooks/` | Counts API errors, auto-triggers bug report |
| `BugReportForm` | `features/feedback/ui/` | Bug report form → PostHog survey |
| `FeatureRequestForm` | `features/feedback/ui/` | Feature request form → PostHog survey |
| `FeatureFeedbackForm` | `features/feedback/ui/` | Beta feature feedback → PostHog survey |
| `FeedbackFab` | `features/feedback/ui/` | FAB + popover menu + error auto-trigger |
| `DashboardLayout` | `layout/dashboard/ui/` | Mounts the FAB |
| `EarlyAccessBanner` | `features/billing/ui/` | Updated CTA to open feedback sheet |
