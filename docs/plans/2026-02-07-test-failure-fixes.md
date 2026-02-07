# Test Failure Fixes Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Restore a clean test baseline by fixing current failing test suites and aligning expectations with the current APIs.

**Architecture:** Prefer minimal, targeted fixes: restore missing helpers, align PostHog tests with `groups` payloads, restore the SDK streaming method (or adjust tests/docs after verifying actual endpoint), and configure test runners to pass when no tests exist.

**Tech Stack:** Bun, Nx, TypeScript, PostHog Node SDK, Better Auth (no changes here), Vitest

---

### Task 1: Restore `parseEnv` helper for environment tests

**Files:**
- Modify: `packages/environment/src/helpers.ts`
- Test: `packages/environment/__tests__/helpers.test.ts`

**Step 1: Write the failing test (already exists)**

The test suite already asserts `parseEnv` behavior in `packages/environment/__tests__/helpers.test.ts`.

**Step 2: Run test to verify it fails**

Run: `nx run @packages/environment:test`

Expected: FAIL with “Export named 'parseEnv' not found”.

**Step 3: Write minimal implementation**

Add `parseEnv` back to `packages/environment/src/helpers.ts`.

```ts
import { z } from "zod";
import { AppError } from "@packages/utils/errors";

export function parseEnv<T extends z.ZodTypeAny>(
  env: NodeJS.ProcessEnv,
  schema: T,
): z.infer<T> {
  const result = schema.safeParse(env);
  if (!result.success) {
    throw AppError.validation("Invalid environment variables", {
      data: result.error.format(),
    });
  }
  return result.data;
}
```

Keep existing exports (`isProduction`, `isClientProduction`, `getDomain`) intact.

**Step 4: Run test to verify it passes**

Run: `nx run @packages/environment:test`

Expected: PASS.

**Step 5: Commit**

```bash
git add packages/environment/src/helpers.ts
git commit -m "fix(environment): restore parseEnv helper"
```

---

### Task 2: Align PostHog tests with `groups` payloads

**Files:**
- Modify: `packages/posthog/__tests__/server.test.ts`
- Modify: `packages/posthog/src/server.ts`

**Step 1: Write the failing tests (already exist)**

Failures expect `$groups` inside `properties`, but the implementation uses top-level `groups`.

**Step 2: Run test to verify it fails**

Run: `nx run @packages/posthog:test`

Expected: FAIL with diff showing `$groups` vs `groups`.

**Step 3: Update implementation to normalize properties**

In `packages/posthog/src/server.ts`, update `captureServerEvent` to ensure `properties` is an object (not `undefined`) while keeping `groups` top-level:

```ts
const safeProperties = properties ?? {};
posthog.capture({
  distinctId: userId,
  event,
  properties: safeProperties,
  groups,
  timestamp,
});
```

**Step 4: Update tests to expect top-level `groups`**

In `packages/posthog/__tests__/server.test.ts`, replace `$groups` assertions with `groups` and update the “optional params” test to expect `properties: {}` and `groups: undefined`.

**Step 5: Run tests to verify**

Run: `nx run @packages/posthog:test`

Expected: PASS.

**Step 6: Commit**

```bash
git add packages/posthog/src/server.ts packages/posthog/__tests__/server.test.ts
git commit -m "fix(posthog): align tests with groups payload"
```

---

### Task 3: Restore SDK `streamAssistantResponse` or align tests/docs

**Files:**
- Modify: `libraries/sdk/src/index.ts`
- Modify: `libraries/sdk/src/types.ts`
- Modify: `libraries/sdk/__tests__/sdk-client.test.ts`
- Modify (if needed): `libraries/sdk/README.md`

**Step 1: Confirm the intended API endpoint**

Search for the server route that powers streaming assistant responses (e.g. `streamAssistantResponse`). Check:

Run: `rg "assistant" libraries/sdk docs apps packages -g "*.ts" -g "*.md"`

Expected: identify the actual HTTP endpoint and payload shape for streaming.

**Step 2: Write the failing test (already exists)**

`libraries/sdk/__tests__/sdk-client.test.ts` expects `sdk.streamAssistantResponse()` to return an async generator of chunks.

**Step 3: Implement `streamAssistantResponse` in SDK**

In `libraries/sdk/src/types.ts`, add input schema for streaming if missing (ex: `StreamAssistantResponseInputSchema`). In `libraries/sdk/src/index.ts`, add:

```ts
async *streamAssistantResponse(params: StreamAssistantResponseInput) {
  const validated = StreamAssistantResponseInputSchema.parse(params);
  const url = this.buildUrl("/assistant/stream"); // use actual endpoint from Step 1
  const response = await fetch(url, {
    method: "POST",
    headers: {
      ...this.getHeaders(),
      "Content-Type": "application/json",
      Accept: "text/event-stream",
    },
    body: JSON.stringify(validated),
  });

  if (!response.ok || !response.body) {
    const text = await response.text();
    throw new Error(`SDK_E002: API request failed (${response.statusText}) - ${text}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    yield decoder.decode(value);
  }
}
```

If the API no longer streams, update the test and README to reflect the new non-streaming behavior instead of adding the method.

**Step 4: Run tests to verify**

Run: `nx run @f-o-t/contentta-sdk:test`

Expected: PASS.

**Step 5: Commit**

```bash
git add libraries/sdk/src/index.ts libraries/sdk/src/types.ts libraries/sdk/__tests__/sdk-client.test.ts libraries/sdk/README.md
git commit -m "fix(sdk): restore streamAssistantResponse"
```

---

### Task 4: Allow “no tests” packages to pass cleanly

**Files:**
- Modify: `packages/events/package.json`
- Modify: `apps/web/package.json`

**Step 1: Update events test script**

Change `"test": "bun test"` to `"test": "bun test --passWithNoTests"` in `packages/events/package.json`.

**Step 2: Update web test script**

Change `"test": "vitest run"` to `"test": "vitest run --passWithNoTests"` in `apps/web/package.json`.

**Step 3: Run targeted tests**

Run:
- `nx run @packages/events:test`
- `nx run web:test`

Expected: PASS with “no tests found” allowed.

**Step 4: Commit**

```bash
git add packages/events/package.json apps/web/package.json
git commit -m "chore(test): allow no-test packages"
```

---

### Task 5: Re-run full test command to confirm baseline

**Files:** none

**Step 1: Run the full test command**

Run: `bun run test`

Expected: PASS. If any failures remain, capture output and add a follow-up task.

**Step 2: Commit any remaining fixes**

Only if new changes were needed.
