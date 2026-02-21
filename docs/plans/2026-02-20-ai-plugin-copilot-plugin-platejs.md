# AI Plugin + Copilot Plugin (Plate.js) Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Integrate Plate.js AIPlugin (Cmd+J floating command menu) and CopilotPlugin (inline ghost text) with the existing Mastra unifiedContent agent, replacing the 800+ line manual Lexical FIM plugin.

**Architecture:** Two TanStack Start API routes (`/api/ai/command` and `/api/ai/copilot`) bridge Plate.js plugins to Mastra agents. CopilotPlugin replaces the Lexical FIMPlugin with Plate.js's native ghost text system. AIPlugin adds a new Cmd+J contextual command menu with insert/chat/edit modes. Both coexist with the existing chat sidebar (sidebar for long conversations; inline plugin for quick edits).

**Tech Stack:** `@platejs/ai`, `@ai-sdk/react`, `ai` (Vercel AI SDK v4), Mastra, TanStack Start API routes (`createAPIFileRoute`)

---

## Prerequisites (Must Be Complete Before Starting)

- ✅ Issue #592 (base Plate.js migration) is complete — editor renders with `PlateEditor` + `BaseEditorKit`
- ✅ `@platejs/*` packages are installed (check `apps/web/package.json`)
- ✅ `apps/web/src/routes/api/rpc/$.ts` oRPC route works (confirms API route pattern)
- ✅ `mastra.getAgent("unifiedContent")` and `mastra.getAgent("fim")` export from `@packages/agents`

If #592 is not complete — **stop here and complete it first.**

---

### Task 1: Install Dependencies

**Files:**
- Modify: `apps/web/package.json` (via `bun add`)

**Step 1: Install Plate.js AI packages and Vercel AI SDK**

```bash
bun add @platejs/ai @ai-sdk/react ai --filter apps/web
```

**Step 2: Verify installed versions align with other `@platejs/*` packages**

```bash
cat apps/web/package.json | grep '"@platejs'
# All @platejs/* versions should match (e.g., all 44.x.x)
```

If there is a version mismatch, pin `@platejs/ai` to match the others:
```bash
bun add @platejs/ai@<same-version> --filter apps/web
```

**Step 3: Scaffold Plate.js UI components via shadcn CLI**

```bash
cd apps/web
bunx shadcn@latest add https://platejs.org/r/ai-kit
bunx shadcn@latest add https://platejs.org/r/copilot-kit
```

Note the exact paths of generated files — they typically appear in `src/components/plate-ui/`. We'll relocate them in Task 6.

**Step 4: Commit**

```bash
git add apps/web/package.json bun.lockb
git commit -m "feat(editor): install @platejs/ai and Vercel AI SDK for AI plugin integration"
```

---

### Task 2: Create AI Command API Route

Called by AIChatPlugin (`useChat`) for all AI commands (insert, chat, edit modes). Bridges to the Mastra `unifiedContent` agent and returns an AI SDK compatible data stream.

**Files:**
- Create: `apps/web/src/routes/api/ai/command.ts`

**Step 1: Find where `createRequestContext` is exported from `@packages/agents`**

```bash
grep -r "export.*createRequestContext\|export.*function createRequestContext" packages/agents/src/ --include="*.ts" -l
```

Note the exact export path — if it's not exported from the package root, check `packages/agents/package.json` exports and use the correct sub-path.

**Step 2: Create the route file**

```typescript
// apps/web/src/routes/api/ai/command.ts
import { createAPIFileRoute } from "@tanstack/start/api";
import { auth } from "@packages/authentication/server";
import { mastra, createRequestContext } from "@packages/agents";

// POST /api/ai/command
// Called by Plate.js AIChatPlugin with { messages, data }
// Returns AI SDK DataStreamResponse compatible with useChat
export const APIRoute = createAPIFileRoute("/api/ai/command")({
  POST: async ({ request }) => {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return new Response("Unauthorized", { status: 401 });
    }

    const body = await request.json();
    const { messages, data } = body as {
      messages: Array<{ role: "user" | "assistant" | "system"; content: string }>;
      data?: {
        model?: string;
        contentId?: string;
        writerId?: string;
        language?: string;
      };
    };

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response("Invalid request body", { status: 400 });
    }

    // Last user message is the actual prompt
    const lastUserMessage = [...messages].reverse().find((m) => m.role === "user");
    if (!lastUserMessage) {
      return new Response("No user message found", { status: 400 });
    }

    // System messages (editor context, selection, etc.) become agent instructions
    const systemContent = messages
      .filter((m) => m.role === "system")
      .map((m) => m.content)
      .join("\n");

    const agent = mastra.getAgent("unifiedContent");
    const context = createRequestContext({
      userId: session.user.id,
      contentId: data?.contentId ?? "inline-edit",
      writerId: data?.writerId,
      model: data?.model ?? "openrouter/moonshotai/kimi-k2.5",
      language: data?.language ?? "pt-BR",
    });

    const result = await agent.stream(lastUserMessage.content, {
      requestContext: context,
      ...(systemContent ? { instructions: systemContent } : {}),
    });

    // toDataStreamResponse() returns a Response with text/event-stream
    // that is directly compatible with @ai-sdk/react useChat
    return result.toDataStreamResponse();
  },
});
```

**Step 3: If `agent.stream().toDataStreamResponse()` doesn't exist in your Mastra version**

Check available methods:
```bash
grep -r "toDataStreamResponse\|toAIStream\|toReadableStream" node_modules/mastra/dist/ --include="*.d.ts" -l 2>/dev/null | head -5
```

If not available, use the Vercel AI SDK's `streamText` directly with OpenRouter and skip Mastra for this route. Ask the user before making this architectural decision.

**Step 4: Commit**

```bash
git add apps/web/src/routes/api/ai/command.ts
git commit -m "feat(editor): add AI command API route bridging Plate.js AIPlugin to Mastra"
```

---

### Task 3: Create Copilot API Route

Lightweight endpoint for inline ghost text completions. Uses the existing `fimAgent` from Mastra for low-latency single-completion responses.

**Files:**
- Create: `apps/web/src/routes/api/ai/copilot.ts`

**Step 1: Create the route file**

```typescript
// apps/web/src/routes/api/ai/copilot.ts
import { createAPIFileRoute } from "@tanstack/start/api";
import { auth } from "@packages/authentication/server";
import { mastra } from "@packages/agents";

// POST /api/ai/copilot
// Called by Plate.js CopilotPlugin with { prompt, data: { prefix, suffix } }
// Returns a short completion as a streaming response
export const APIRoute = createAPIFileRoute("/api/ai/copilot")({
  POST: async ({ request }) => {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return new Response("Unauthorized", { status: 401 });
    }

    const body = await request.json();
    const { prompt, data } = body as {
      prompt: string;
      data?: {
        prefix?: string;
        suffix?: string;
      };
    };

    if (!prompt) {
      return new Response("Missing prompt", { status: 400 });
    }

    const agent = mastra.getAgent("fim");

    // Build FIM prompt with surrounding context for better completions
    const fimPrompt = data?.prefix
      ? `Continue this text naturally:\n\nBefore cursor:\n${data.prefix.slice(-2000)}\n\nAfter cursor:\n${(data.suffix ?? "").slice(0, 500)}\n\nWrite ONLY the completion text (no explanations):`
      : prompt;

    const result = await agent.stream(fimPrompt, {});
    return result.toDataStreamResponse();
  },
});
```

**Step 2: Verify `mastra.getAgent("fim")` exists**

```bash
grep -r '"fim"\|id.*fim\|fimAgent' packages/agents/src/ --include="*.ts" -l
```

If the FIM agent ID is different (e.g., `"fim-agent"`), update the `getAgent()` call accordingly.

**Step 3: Commit**

```bash
git add apps/web/src/routes/api/ai/copilot.ts
git commit -m "feat(editor): add Copilot API route for Plate.js CopilotPlugin ghost text"
```

---

### Task 4: Configure CopilotKit Plugin

Creates the `CopilotPlugin` config that replaces the Lexical FIMPlugin. The plugin handles debouncing, ghost text rendering, and keyboard shortcuts (Tab, Ctrl+Space) natively.

**Files:**
- Create: `apps/web/src/features/editor/plate/plugins/copilot-kit.tsx`

**Step 1: Check the exact CopilotPlugin API from the scaffolded code**

```bash
# Find what shadcn generated for copilot-kit
find apps/web/src -name "*copilot*" -type f
```

Read the generated file to understand the exact `CopilotPlugin.configure()` options.

**Step 2: Create the plugin config**

```typescript
// apps/web/src/features/editor/plate/plugins/copilot-kit.tsx
import { CopilotPlugin } from "@platejs/ai/react";
import { GhostText } from "../ui/ghost-text";

export const copilotKit = CopilotPlugin.configure({
  render: {
    // Render ghost text inline after cursor
    afterEditable: GhostText,
  },
  options: {
    completeOptions: {
      api: "/api/ai/copilot",
      // Pass prefix/suffix context with each request
      body: {
        data: {},
      },
      onError: (error) => {
        // Silent failure — don't break the editor if copilot fails
        console.error("[CopilotPlugin] completion error:", error);
      },
    },
    // 500ms debounce matches the existing FIM behavior (DEFAULT_FIM_CONFIG.debounceMs)
    debounceDelay: 500,
    // Build the prompt from editor context at cursor position
    getPrompt({ editor }) {
      const contextBefore = editor.api.string([], { before: true }) ?? "";
      const contextAfter = editor.api.string([], { after: true }) ?? "";
      return JSON.stringify({
        prompt: `Continue writing from cursor position`,
        data: {
          prefix: contextBefore.slice(-4000), // max 4000 chars before cursor
          suffix: contextAfter.slice(0, 2000), // max 2000 chars after cursor
        },
      });
    },
  },
});
```

**Step 3: Verify the GhostText component path**

The `GhostText` import assumes Task 6 (move components) is complete. If working in order, create a placeholder export first:
```typescript
// Temporary placeholder until Task 6
export function GhostText() { return null; }
```

**Step 4: Commit**

```bash
git add apps/web/src/features/editor/plate/plugins/copilot-kit.tsx
git commit -m "feat(editor): configure CopilotPlugin (replaces Lexical FIMPlugin)"
```

---

### Task 5: Configure AIKit Plugin

New AIPlugin + AIChatPlugin configuration that adds the Cmd+J floating command menu.

**Files:**
- Create: `apps/web/src/features/editor/plate/plugins/ai-kit.tsx`

**Step 1: Check scaffolded ai-kit code for the correct plugin API**

```bash
find apps/web/src -name "*ai-kit*" -o -name "*ai-menu*" -type f | head -10
```

Read the generated file to understand `AIPlugin` + `AIChatPlugin` config options.

**Step 2: Create the plugin config**

```typescript
// apps/web/src/features/editor/plate/plugins/ai-kit.tsx
import { AIPlugin, AIChatPlugin } from "@platejs/ai/react";
import { AIMenu } from "../ui/ai-menu";
import { AILeaf, AIAnchorElement } from "../ui/ai-node";

export const aiKit = [
  AIPlugin,
  AIChatPlugin.configure({
    options: {
      chat: {
        api: "/api/ai/command",
        // model, contentId, writerId injected dynamically via useEditorAIChat hook
        body: {
          data: {},
        },
      },
    },
    render: {
      // Floating menu that appears on Cmd+J or space in empty block
      afterEditable: () => <AIMenu />,
      // AILeaf renders AI-streamed text with streaming animation
      [AIPlugin.key]: AILeaf,
    },
  }),
];
```

**Step 3: Commit**

```bash
git add apps/web/src/features/editor/plate/plugins/ai-kit.tsx
git commit -m "feat(editor): configure AIPlugin + AIChatPlugin for Cmd+J command menu"
```

---

### Task 6: Move and Customize Scaffolded UI Components

Move shadcn-generated components to the correct feature directory and customize styling to match the project's design system.

**Files:**
- Create dir: `apps/web/src/features/editor/plate/ui/`
- Move: `ai-menu.tsx`, `ai-node.tsx`, `ghost-text.tsx` from scaffolded location

**Step 1: Find where shadcn generated the files**

```bash
find apps/web/src -name "ai-menu.tsx" -o -name "ghost-text.tsx" -o -name "ai-node.tsx" 2>/dev/null
```

**Step 2: Move files to the feature directory**

```bash
mkdir -p apps/web/src/features/editor/plate/ui
# Adjust source paths based on what Step 1 found:
mv apps/web/src/components/plate-ui/ai-menu.tsx apps/web/src/features/editor/plate/ui/ai-menu.tsx
mv apps/web/src/components/plate-ui/ai-node.tsx apps/web/src/features/editor/plate/ui/ai-node.tsx
mv apps/web/src/components/plate-ui/ghost-text.tsx apps/web/src/features/editor/plate/ui/ghost-text.tsx
```

**Step 3: Fix imports in moved files**

In each moved file, update import paths:
- `from "@/components/ui/button"` → `from "@packages/ui/components/button"`
- `from "@/components/ui/..."` → `from "@packages/ui/components/..."`
- `from "@/lib/utils"` → find the cn utility in this project:
  ```bash
  grep -r "export.*function cn\|export.*cn " packages/utils/src/ --include="*.ts" -l
  ```
  Then use the correct import path.

**Step 4: Customize `ghost-text.tsx` styling**

The ghost text should match the existing Lexical `GhostTextNode` visual style. Find the styling in the existing node:
```bash
cat apps/web/src/features/editor/core/ghost-text-node.ts | grep -A5 "style\|className"
```

Apply matching styles in the Plate.js `GhostText` component:
- `color: var(--muted-foreground)` or `text-muted-foreground`
- `opacity: 0.5`
- `pointer-events: none`
- `user-select: none`

**Step 5: Run typecheck to verify imports**

```bash
bun run typecheck --filter apps/web 2>&1 | grep "plate/ui"
# Fix any import errors
```

**Step 6: Commit**

```bash
git add apps/web/src/features/editor/plate/ui/
git commit -m "feat(editor): add AI menu, AI node, ghost text components (Plate.js)"
```

---

### Task 7: Create `useEditorAIChat` Hook

This hook dynamically injects content metadata (contentId, writerId, model) into AIChatPlugin requests. It must be called inside the `PlateController` context (i.e., inside the editor component that wraps `Plate`).

**Files:**
- Create: `apps/web/src/features/editor/plate/hooks/use-editor-ai-chat.ts`

**Step 1: Create the hook**

```typescript
// apps/web/src/features/editor/plate/hooks/use-editor-ai-chat.ts
import { useEffect } from "react";
import { useEditorPlugin } from "@platejs/core/react";
import { AIChatPlugin } from "@platejs/ai/react";

interface EditorAIChatOptions {
  contentId?: string;
  writerId?: string;
  model?: string;
  language?: string;
}

// Call inside a component that is a descendant of <Plate>
// Updates AIChatPlugin's request body with content context
export function useEditorAIChat({
  contentId,
  writerId,
  model,
  language,
}: EditorAIChatOptions) {
  const { setOptions } = useEditorPlugin(AIChatPlugin);

  useEffect(() => {
    setOptions({
      chat: {
        api: "/api/ai/command",
        body: {
          data: {
            contentId,
            writerId,
            model: model ?? "openrouter/moonshotai/kimi-k2.5",
            language: language ?? "pt-BR",
          },
        },
      },
    });
  }, [contentId, writerId, model, language, setOptions]);
}
```

**Step 2: Commit**

```bash
git add apps/web/src/features/editor/plate/hooks/use-editor-ai-chat.ts
git commit -m "feat(editor): add useEditorAIChat hook to inject content context into AI requests"
```

---

### Task 8: Integrate Plugins into the Plate Editor

Wire AIKit and CopilotKit into the main Plate editor plugin chain.

**Files:**
- Modify: the main Plate editor plugin config (created by #592 — find it first)
- Modify: the main Plate editor component (where `useEditorAIChat` is called)

**Step 1: Find the Plate editor plugin config and main component**

```bash
grep -r "usePlateEditor\|createPlatePlugin\|BaseEditorKit" apps/web/src/features/editor/ --include="*.tsx" --include="*.ts" -l
grep -r "PlateEditor\|<Plate " apps/web/src/features/editor/ --include="*.tsx" -l
```

**Step 2: Add plugins to the plugin array**

In the plugin config file (e.g., `editor-kit.tsx` or similar):

```typescript
import { aiKit } from "./plugins/ai-kit";
import { copilotKit } from "./plugins/copilot-kit";

const plugins = [
  ...corePlugins,        // existing text formatting, history, etc.
  ...aiKit,             // [AIPlugin, AIChatPlugin] — Cmd+J menu
  copilotKit,           // CopilotPlugin — inline ghost text
];
```

**Step 3: Register AI leaf component in the component registry**

```typescript
import { AILeaf, AIAnchorElement } from "./plate/ui/ai-node";
import { AIPlugin } from "@platejs/ai/react";

const components = {
  // ... existing components
  [AIPlugin.key]: AILeaf,
  // GhostText is rendered by CopilotPlugin.render.afterEditable, no registry needed
};
```

**Step 4: Add `useEditorAIChat` inside the editor component**

Find the component where `contentId` and `writerId` props are available (likely the outer editor component that has these as props), and add:

```typescript
import { useEditorAIChat } from "./plate/hooks/use-editor-ai-chat";

// Inside the component body (must be inside <Plate> context):
useEditorAIChat({
  contentId: props.contentId,
  writerId: props.writerId,
  model: props.model,
  language: props.language,
});
```

**Step 5: Run typecheck**

```bash
bun run typecheck --filter apps/web 2>&1 | head -30
# Fix any type errors before continuing
```

**Step 6: Start dev server and manual smoke test**

```bash
bun dev
```

Open the editor. Verify:
- [ ] Cmd+J opens the AI floating menu
- [ ] Typing in the AI menu and pressing Enter triggers streaming (watch network tab for `/api/ai/command` call)
- [ ] After 500ms pause while typing, ghost text appears
- [ ] Tab accepts ghost text

**Step 7: Commit**

```bash
git add apps/web/src/features/editor/
git commit -m "feat(editor): integrate AIPlugin and CopilotPlugin into Plate editor"
```

---

### Task 9: Remove Old Lexical FIM Plugin

Only execute after Task 8 smoke test passes. This removes 800+ lines of manual FIM implementation.

**Files to DELETE:**
- `apps/web/src/features/editor/ai/fim.ts`
- `apps/web/src/features/editor/plugins/fim-plugin.tsx`
- `apps/web/src/features/editor/stores/fim-store.ts`
- `apps/web/src/features/editor/core/ghost-text-node.ts`

**Files to MODIFY (remove FIM references):**
- `apps/web/src/features/editor/schemas.ts`
- `apps/web/src/features/editor/ui/content-editor.tsx`
- `apps/web/src/features/editor/core/config.ts`
- `apps/web/src/features/editor/core/transformers.ts`
- `apps/web/src/integrations/orpc/router/agent.ts`

**Step 1: Find all FIM imports across the codebase**

```bash
grep -r "fim\|FIM\|GhostTextNode\|fimStore\|useFIM" apps/web/src/ --include="*.ts" --include="*.tsx" -l
```

This tells you every file that needs updating.

**Step 2: Remove imports and usage from content-editor.tsx**

Read the file first, then remove:
- `import { FIMPlugin } from "../plugins/fim-plugin"`
- `import { GhostTextNode } from "../core/ghost-text-node"`
- `<FIMPlugin ... />` JSX
- `GhostTextNode` from the Lexical nodes array

**Step 3: Remove `fimStream` from the oRPC agent router**

Open `apps/web/src/integrations/orpc/router/agent.ts` and remove the `fimStream` export entirely. This procedure is now replaced by `/api/ai/copilot`. Keep `editStream` and `chatStream`.

Also remove `fimStream` from the router export object at the bottom of the file.

**Step 4: Clean up schemas.ts**

First check what imports the FIM schemas:
```bash
grep -r "FIMMode\|FIMTrigger\|FIMRequest\|FIMState\|FIMConfig\|FIMChunk" apps/web/src/ --include="*.ts" --include="*.tsx" -l
```

Remove schemas only if nothing else imports them. If they're imported by test files, delete those test files too (the FIM tests are no longer needed).

**Step 5: Remove FIM config from config.ts**

Remove `DEFAULT_FIM_CONFIG` and `FIMConfig` type.

**Step 6: Remove `buildFIMContext` from transformers.ts**

This function built `prefix/suffix` context for the old FIM API. The new Copilot route reads context directly from the Plate editor API. Remove the export.

**Step 7: Delete the FIM files**

```bash
git rm apps/web/src/features/editor/ai/fim.ts
git rm apps/web/src/features/editor/plugins/fim-plugin.tsx
git rm apps/web/src/features/editor/stores/fim-store.ts
git rm apps/web/src/features/editor/core/ghost-text-node.ts
```

**Step 8: Run typecheck — fix ALL errors**

```bash
bun run typecheck --filter apps/web 2>&1
# Must be zero errors before committing
```

**Step 9: Commit**

```bash
git add -A
git commit -m "refactor(editor): remove Lexical FIM plugin — replaced by Plate.js CopilotPlugin"
```

---

### Task 10: Final Verification

**Step 1: Run full typecheck across the monorepo**

```bash
bun run typecheck
```

Expected: zero errors.

**Step 2: Run tests**

```bash
bun run test --filter apps/web
```

Expected: no test regressions (there may be no tests for this feature yet).

**Step 3: Full end-to-end smoke test**

```bash
bun dev
```

| Feature | Expected Behavior |
|---------|-------------------|
| Ghost text appears | After 500ms pause while typing |
| Tab accepts ghost text | Cursor moves past inserted text |
| Ctrl+Space forces suggestion | Immediate ghost text |
| Cmd+J opens AI menu | Floating menu appears near cursor |
| AI insert mode | Text streams below current block |
| AI edit mode | Propose rewrite (suggestion/tracked change) |
| AI undo | Ctrl+Z undoes entire AI insertion as one step |
| Chat sidebar | Still works independently (no regression) |
| Edit plugin (Ctrl+K) | Still works (uses separate `editStream` oRPC proc) |

**Step 4: Commit any final fixes**

```bash
git add -A
git commit -m "fix(editor): final smoke test fixes for AI + Copilot plugins"
```

---

## Gotchas & Decisions

### 1. `agent.stream().toDataStreamResponse()` availability

Mastra's streaming API may differ between versions. The method must convert Mastra's output to the Vercel AI SDK `data:` stream protocol that `useChat` expects. If it doesn't exist:

```bash
# Check Mastra's exported types
grep -r "toDataStreamResponse" node_modules/mastra/dist/ --include="*.d.ts" | head -5
```

If not available, use the Vercel AI SDK's `streamText` with the same model configuration as the Mastra agent instead of routing through Mastra.

### 2. CopilotPlugin `getPrompt` API

The exact `getPrompt` function signature differs across Plate.js versions. Read the scaffolded `copilot-kit` file from Task 1 carefully — the shadcn-generated code reflects the current version's API.

### 3. Plugin order

In Plate.js, plugin order in the array matters for transforms and normalizers. AI plugins should come after all content plugins (heading, paragraph, list, etc.) and after `TrailingBlockPlugin` if used.

### 4. No `index.ts` barrel files

Per project convention: do NOT create `apps/web/src/features/editor/plate/plugins/index.ts`. Import each plugin directly:
```typescript
import { aiKit } from "@/features/editor/plate/plugins/ai-kit";
import { copilotKit } from "@/features/editor/plate/plugins/copilot-kit";
```

### 5. Auth in TanStack Start API routes

The `auth.api.getSession({ headers })` call requires `@packages/authentication/server`. Verify this import works in the API route context. The existing `apps/web/src/routes/api/rpc/$.ts` uses the exact same pattern — if it works there, it will work here.

### 6. `@platejs/ai` version pinning

If the shadcn CLI installs a different version than other `@platejs/*` packages, there will be runtime peer dependency conflicts. Pin versions explicitly in `apps/web/package.json`.

### 7. Mastra `fimAgent` ID

The FIM agent in `packages/agents/src/mastra/agents/fim-agent.ts` has `id: "fim-agent"` — verify the exact ID string used in `mastra.getAgent()`. Using the wrong ID causes a runtime error.
