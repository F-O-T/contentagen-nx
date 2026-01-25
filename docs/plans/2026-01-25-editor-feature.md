# Editor Feature Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Move the editor from `packages/editor` into `apps/web/src/features/editor`, remove the editor package, and clean up project configuration after migration.

**Architecture:** The editor becomes an app-local feature organized by existing feature conventions. All imports switch to `@/features/editor/...`, and the `packages/editor` project is removed from Nx + TypeScript path references.

**Tech Stack:** Nx, Bun, React, TypeScript, Vite, TanStack.

---

### Task 1: Inventory current editor usage

**Files:**
- Inspect: `packages/editor/**`
- Search usages: `apps/web/**`, `apps/**`, `packages/**`

**Step 1: Find all editor imports**

Use `rg "@packages/editor" apps packages` and collect all import sites.

**Step 2: Verify no non-web consumers**

If any non-`apps/web` consumers exist, stop and ask for direction.

---

### Task 2: Create feature structure in web app

**Files:**
- Create: `apps/web/src/features/editor/ui/`
- Create: `apps/web/src/features/editor/plugins/`
- Create: `apps/web/src/features/editor/core/`
- Create: `apps/web/src/features/editor/ai/`
- Create: `apps/web/src/features/editor/diagnostics/`
- Create: `apps/web/src/features/editor/schemas.ts`
- Create: `apps/web/src/features/editor/utils.ts`

**Step 1: Mirror current package structure**

Create the feature folder structure to match `packages/editor/src/**`.

---

### Task 3: Move editor code into web feature

**Files:**
- Move: `packages/editor/src/**` → `apps/web/src/features/editor/**`

**Step 1: Move code**

Move UI, plugins, core, ai, diagnostics, schemas, and utils.

**Step 2: Fix internal imports**

Update internal imports to `@/features/editor/...` or correct relative paths.

---

### Task 4: Update web app imports

**Files:**
- Modify: all `apps/web/**` files importing `@packages/editor/*`

**Step 1: Replace imports**

Replace all imports with `@/features/editor/...`.

---

### Task 5: Remove editor package

**Files:**
- Remove: `packages/editor/**`

**Step 1: Delete package**

Delete the package directory once no references remain.

---

### Task 6: Clean up Nx and TS config

**Files:**
- Modify: `nx.json` or `workspace.json` if editor is referenced
- Modify: `tsconfig.json` or root config if `@packages/editor` alias exists
- Modify: `package.json` scripts or build config if editor is referenced

**Step 1: Remove Nx references**

Remove editor project references from Nx config.

**Step 2: Remove TS path alias**

Remove any `@packages/editor` path mapping.

**Step 3: Verify no lingering references**

Search again for `packages/editor` and `@packages/editor` references.

---

### Task 7: Verify

**Step 1: Typecheck**

Run `bun run typecheck`.

**Expected:** No missing module or path errors.

**Step 2: Build**

Run `bun run build` or `nx build web`.

**Expected:** Successful build.

---

### Task 8: Cleanup and stop

**Step 1: Review git status**

Ensure only the intended changes exist.

**Step 2: Skip commit**

Do not create a commit (per instruction).
