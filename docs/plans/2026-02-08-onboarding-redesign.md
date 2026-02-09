# Onboarding Redesign

> Date: 2026-02-08
> Status: Draft
> Scope: Onboarding wizard, quick start checklist, magic link fix
> Depends on: [API Key System Redesign](./2026-02-08-api-key-system-design.md)

---

## Overview

Contentta currently has no onboarding flow. After sign-up or magic link login, users land directly on the dashboard with no guidance. Magic link users have no name, which causes workspaces to be created with generic names like "Workspace4x7k".

This redesign adds a PostHog-style activation-focused onboarding with two phases:

1. **Initial Wizard** — Collects user info, selects products, shows SDK setup
2. **Quick Start Checklist** — Persistent in-app task list that guides users to their first meaningful actions

---

## Current Problems

1. **Magic link users have no name** — `user.name` is empty/null, so `createDefaultOrganization` falls back to `"Workspace"` + random suffix
2. **No onboarding flow** — Users land on `/$slug/home` with no guidance
3. **`onboardingCompleted` field exists but is never checked** — The `organization` schema has it but the frontend ignores it
4. **Feature discovery gap** — Users don't know about Forms, Analytics, AI writing, SDK, or API keys

---

## Phase 1: Initial Onboarding Wizard

### Route

`/_authenticated/$slug/onboarding` — a dedicated route outside the `_dashboard` layout. The sidebar is hidden to reduce distraction.

### Guard

The `_dashboard` layout's `beforeLoad` checks `organization.onboardingCompleted`:
- If `false` -> redirect to `/$slug/onboarding`
- If `true` -> proceed normally

The onboarding route's `beforeLoad` checks the opposite:
- If `onboardingCompleted === true` -> redirect to `/$slug/home`

### Step 1: Profile Setup

**Purpose:** Fix the magic link name bug and let users customize their workspace.

**Fields:**
- **Your name** — Pre-filled if sign-up user, empty if magic link user. Required.
- **Workspace name** — Pre-filled with current org name. Editable. Updates `organization.name` and regenerates `organization.slug`.

**Backend mutations:**
- `user.update({ name })` via Better Auth
- `organization.update({ name, slug })` via oRPC

**UI:**
- Clean centered card layout, no sidebar
- Progress indicator (step 1 of 2 or 3)
- "Continue" button (disabled until name is filled)

### Step 2: What do you want to do?

**Purpose:** Goal-based product selection, like PostHog's "What do you want to do with PostHog?"

**Options (multi-select, Content pre-selected):**

| Goal | Label | Products Activated |
|------|-------|--------------------|
| Publish content | "Criar e publicar conteudo" | Content |
| Collect leads | "Coletar leads com formularios" | Forms |
| Track performance | "Acompanhar performance do conteudo" | Analytics |

**Backend:**
- Stores selected products in `organization` metadata or a new `onboarding_products` JSON column
- Determines which Quick Start tasks appear in Phase 2

**UI:**
- Three cards with icons, title, and short description
- Checkbox-style multi-select
- Content is pre-checked by default (it's a CMS first)
- "Continue" button

### Step 3: Install the SDK (conditional)

**Shown only if** the user selected Forms or Analytics (these require client-side SDK).

**Content:**
- Shows the auto-generated public API key (`cta_pub_xxxx`) with copy button
- Installation snippet:
  ```bash
  npm install @f-o-t/contentta-sdk
  ```
- Initialization code:
  ```typescript
  import { createEventTracker } from "@f-o-t/contentta-sdk/events/client";

  const tracker = createEventTracker({
    apiKey: "cta_pub_xxxx",
    organizationId: "org_xxxx",
  });

  tracker.autoTrackPageViews("content-id", "content-slug");
  ```
- Framework-specific tabs (Next.js, plain HTML, React)
- "Skip for now" link at bottom
- "Verify installation" button (optional — checks if events are arriving)

**If only Content was selected:** This step is skipped entirely, the wizard goes from Step 2 to completion.

### Completion

After the last step:
1. Sets `organization.onboardingCompleted = true`
2. Redirects to `/$slug/home`
3. Quick Start checklist is visible on the home page

---

## Phase 2: Quick Start Checklist

### Location

A card/section on the `/$slug/home` page. Not a floating panel or sidebar widget — it lives in the main content area as a prominent component.

### Task Structure

Each task has:
- `id` — Unique identifier
- `title` — User-facing text
- `description` — Brief explanation
- `type` — `setup` | `onboarding` | `explore`
- `product` — `content` | `forms` | `analytics`
- `dependsOn` — Task IDs that must complete first
- `autoDetect` — Whether the system can detect completion automatically
- `route` — Where to navigate when the user clicks the task

### Task Definitions

#### Content Tasks

| Type | Task | Auto-detected | Depends on | Route |
|------|------|--------------|------------|-------|
| onboarding | Create your first content | Yes — content count > 0 | — | `/$slug/content` |
| onboarding | Publish your first content | Yes — content with status `published` exists | Create first content | `/$slug/content` |
| explore | Set up brand guidelines | Yes — brand record exists | — | `/$slug/settings` (brand section) |
| explore | Configure a writer with AI instructions | Yes — agent with custom instructions exists | — | `/$slug/content` (writer config) |

#### Forms Tasks

| Type | Task | Auto-detected | Depends on | Route |
|------|------|--------------|------------|-------|
| setup | Install the SDK | Manual (checkbox) | — | `/$slug/settings/project/api-keys` |
| onboarding | Create your first form | Yes — form count > 0 | — | `/$slug/forms` |
| explore | Embed a form on your site | Manual (checkbox) | Create first form | Docs link |
| explore | View your first submission | Yes — submission count > 0 | Create first form | `/$slug/forms/:formId/submissions` |

#### Analytics Tasks

| Type | Task | Auto-detected | Depends on | Route |
|------|------|--------------|------------|-------|
| setup | Install the SDK | Manual (checkbox) | — | `/$slug/settings/project/api-keys` |
| setup | Verify first event received | Yes — event count > 0 in org | Install SDK | `/$slug/analytics/data-management` |
| onboarding | Create your first insight | Yes — insight count > 0 | Verify first event | `/$slug/analytics/insights` |
| explore | Create a dashboard | Yes — dashboard count > 0 | Create first insight | `/$slug/analytics/dashboards` |

### Completion Tracking

- Tasks are tracked in a new `onboarding_task` table or a JSON column on `organization`
- Auto-detected tasks are checked on each home page load (or via a lightweight query)
- Manual tasks require the user to click a checkbox
- Completed tasks show a checkmark and are visually muted
- Skipped tasks can be marked as "dismissed"

### Visibility Rules

- The checklist is visible on the home page until all `setup` + `onboarding` tasks are completed
- Once core tasks are done, it collapses to a "Continue exploring" section showing only `explore` tasks
- Users can dismiss the entire checklist with a "Hide" button
- A "Setup guide" link in settings can re-show it

---

## Implementation Considerations

### Database Changes

1. **`organization` table** — Add `public_api_key` column (auto-generated on org creation)
2. **`organization` table** — Add `onboarding_products` JSON column (stores selected products from Step 2)
3. **`onboarding_task` table** (or JSON on organization) — Tracks task completion state
4. **`personal_api_key` table** — New table for user-scoped API keys with:
   - `id`, `userId`, `label`, `keyHash`, `keyPrefix` (first 8 chars for display)
   - `scopes` (JSON — `{ content: "read", agent: "write", ... }`)
   - `organizationAccess` (JSON — `"all"` or `["org_id_1", "org_id_2"]`)
   - `lastUsedAt`, `createdAt`, `expiresAt` (optional)

### Route Changes

1. New route: `/_authenticated/$slug/onboarding` (outside `_dashboard` layout)
2. Modified: `/_authenticated/$slug/_dashboard` `beforeLoad` — check `onboardingCompleted`
3. Modified: `/auth/callback` — no changes needed (already redirects to `/$slug/home`, which will redirect to onboarding if needed)

### Backend Changes (oRPC)

1. **New router: `onboarding`**
   - `getOnboardingStatus` — Returns onboarding step + task completion state
   - `completeOnboardingStep` — Marks a wizard step as done
   - `completeOnboardingTask` — Marks a checklist task as done
   - `skipOnboardingTask` — Marks a task as dismissed
   - `resetOnboarding` — Re-shows the checklist (for settings)

2. **Modified: `organization` router**
   - `updateOrganization` — Support updating `name`, `slug`, `onboardingProducts`
   - `getPublicApiKey` — Returns the org's public API key

3. **New router: `personal-api-key`**
   - `create` — Creates a key, returns plaintext once
   - `list` — Lists keys (masked, showing prefix + last 4 chars)
   - `revoke` — Deletes a key
   - `getScopes` — Returns available scope definitions

### Component Architecture

```
features/onboarding/
  hooks/
    use-onboarding-status.ts     — Query for wizard/checklist state
    use-complete-task.ts         — Mutation to mark task done
  ui/
    onboarding-wizard.tsx        — Full-page wizard container
    profile-setup-step.tsx       — Step 1: name + workspace
    product-selection-step.tsx   — Step 2: goal cards
    sdk-install-step.tsx         — Step 3: SDK code snippets
    quick-start-checklist.tsx    — Home page checklist card
    quick-start-task.tsx         — Individual task row
```

---

## Design Principles

1. **CMS first, AI second** — Content creation is the default path. AI writer configuration is an explore task, not a prerequisite.
2. **Activation before monetization** — Get users to experience value before showing billing.
3. **Skip-friendly** — Every step can be skipped. Power users shouldn't be blocked.
4. **Auto-detect where possible** — Minimize manual checkboxes. If we can query whether a resource exists, do it automatically.
5. **Progressive disclosure** — Setup tasks first, then onboarding, then explore. Don't overwhelm.
6. **Sidebar hidden during wizard** — Reduces distraction and decision fatigue.
