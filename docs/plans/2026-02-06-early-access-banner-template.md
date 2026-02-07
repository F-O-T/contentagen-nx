# Early Access Banner Template + Survey CTA Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Date:** 2026-02-06
**Status:** Proposed
**Owner:** Dashboard Web

**Goal:** Make the Early Access banner template-driven via component props and replace the mailto CTA with a PostHog survey CTA that is disabled when no survey is available. Keep the banner ready to later swap to the Forms feature CTA.

**Scope:** Billing dashboard banner only (`/_authenticated/$slug/_dashboard/billing`). No CMS storage in this phase.

**Out of Scope:** PostHog survey creation, Forms feature wiring, CMS-backed copy management.

---

## Summary

- Convert `EarlyAccessBanner` to accept a structured template prop (badge label, message, CTA label, bullets, optional surveyId).
- Update billing route to pass template data instead of hardcoded strings.
- Replace “Fale com a gente” mailto with a PostHog survey CTA using `useSurveys()` from `@packages/posthog/client`.
- Disable the CTA button when no active survey is found or surveys are not loaded.
- Keep the action wiring localized so it can be swapped to a Forms CTA later.

---

## Architecture

### Component Contract

Create a template type co-located with the component:

```ts
type EarlyAccessBannerTemplate = {
   badgeLabel: string;
   message: string;
   ctaLabel: string;
   bullets: string[];
   surveyId?: string;
};
```

`EarlyAccessBanner` accepts:

```ts
type EarlyAccessBannerProps = {
   template: EarlyAccessBannerTemplate;
};
```

### CTA Behavior

- Use `useSurveys()` to access `activeSurveys`.
- Determine `targetSurveyId`:
  - Use `template.surveyId` if present.
  - Else use `activeSurveys[0]?.id` if available.
- CTA is disabled if no `targetSurveyId` or surveys not loaded.
- On click, trigger PostHog survey open for the resolved ID (exact method confirmed at implementation time).

### Future Forms Alignment

When Forms ships, the route can pass a new `onCtaClick` or swap the CTA handler to open a Forms sheet/modal without changing the banner layout or template shape.

---

## Implementation Steps

### Task 1: Update `EarlyAccessBanner`

**File:** `apps/web/src/features/billing/ui/early-access-banner.tsx`

Steps:
1. Add `EarlyAccessBannerTemplate` and `EarlyAccessBannerProps` types.
2. Convert hardcoded strings into `template` prop usage.
3. Replace mailto link with a `<Button>` CTA.
4. Use `useSurveys()` to resolve `targetSurveyId`.
5. Disable the CTA when there is no active survey.

Notes:
- Keep layout and visuals unchanged.
- Keep message as plain text; no HTML parsing.

### Task 2: Pass template from billing route

**File:** `apps/web/src/routes/_authenticated/$slug/_dashboard/billing.tsx`

Steps:
1. Create a `const earlyAccessTemplate` in the route.
2. Pass `template={earlyAccessTemplate}` into `EarlyAccessBanner`.
3. Optionally leave `surveyId` undefined until PostHog survey is configured.

---

## Data Flow

1. Billing route defines `earlyAccessTemplate`.
2. `EarlyAccessBanner` renders badge, message, bullets, CTA from template.
3. CTA uses `useSurveys()` to find a survey; disabled if none.
4. Click triggers PostHog survey open when a target survey exists.

---

## Error Handling

- If surveys are not loaded or empty, CTA is disabled.
- No errors are surfaced to users; optional dev-only warning can be added later.

---

## Testing

If UI testing exists for `apps/web`:
- CTA disabled when no survey is available.
- CTA enabled when a matching survey exists.

If no tests exist, validate manually in billing page:
- Banner renders same layout.
- CTA disabled state when no surveys.

---

## Rollout

- Safe, localized change to the billing page.
- PostHog survey not required for deploy; CTA remains disabled until configured.

---

## Open Questions

- Confirm the exact PostHog client method to open a survey (to be checked at implementation).
- Decide whether to add optional `onCtaClick` override when Forms is ready.
