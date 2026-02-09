# Sign-In UI Refresh Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Update the sign-in page to stack the two sign-in methods vertically with Magic Link as the visually primary option.

**Architecture:** Keep existing auth routing and business logic intact; only adjust layout and visual hierarchy in the sign-in page component. Focus on semantic structure and Tailwind utility changes to emphasize Magic Link while preserving both methods.

**Tech Stack:** React 19, TanStack Router, Tailwind CSS, UI components from `@packages/ui`.

---

### Task 1: Update sign-in layout and hierarchy

**Files:**
- Modify: `apps/web/src/routes/auth/sign-in/index.tsx`

**Step 1: Write the failing test**

```tsx
import { render } from "@testing-library/react";
import SignInPage from "./index";

test("renders magic link as primary option", () => {
  const { getByText } = render(<SignInPage />);
  expect(getByText("Link Magico")).toBeInTheDocument();
});
```

**Step 2: Run test to verify it fails**

Run: `bun run test --sign-in-ui`
Expected: FAIL because the test file or export is missing

**Step 3: Write minimal implementation**

```tsx
// Update the method selector from 2-column grid to vertical stack
// Adjust classes to make Magic Link card larger and visually primary
```

**Step 4: Run test to verify it passes**

Run: `bun run test --sign-in-ui`
Expected: PASS

**Step 5: Commit**

```bash
git add apps/web/src/routes/auth/sign-in/index.tsx
git commit -m "feat(auth): emphasize magic link sign-in"
```
