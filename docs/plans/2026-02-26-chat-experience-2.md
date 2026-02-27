# Chat Experience 2.0 — PostHog-Style Global AI Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform the Contentta chat into a PostHog-style global AI experience with a module-based mode selector, context injection picker, and a platform-router-agent hierarchy.

**Architecture:** The `content-network-agent` is renamed to `content-agent` and extracted as a domain-level orchestrator. A new `platform-router-agent` sits above it as the top-level entry point for all chat surfaces. The Thread composer gains a module-based mode selector (routing prefix injection) and an `@ Add context` picker. Both the context panel tab and the full `/chat` page share the same `Thread` component.

**Tech Stack:** Mastra agents, `@assistant-ui/react`, `@assistant-ui/react-ai-sdk`, oRPC, TanStack Query, Radix UI (Popover, Select), Zod

---

## Context

### Current state
- `content-network-agent` (`packages/agents/src/mastra/agents/content-network-agent.ts`) orchestrates `research-agent`, `writer-agent`, `seo-auditor-agent`, `reviewer-agent`
- Registered in Mastra as `"contentNetworkAgent"`, used by `/api/chat` route
- Chat tab lives at `apps/web/src/features/context-panel/ui/teco-chat-tab.tsx`
- Thread component at `apps/web/src/features/teco-chat/ui/thread.tsx`
- Runtime hook at `apps/web/src/features/teco-chat/hooks/use-teco-runtime.ts`
- Transport POSTs to `/api/chat` with `{ messages, threadId, teamId }`

### Target state
```
platform-router-agent  ← new top-level (entry point for /api/chat)
└── content-agent      ← renamed from content-network-agent
    ├── research-agent
    ├── writer-agent
    ├── seo-auditor-agent
    └── reviewer-agent
```

Mode selector in composer → injects routing prefix into last user message server-side → LLM parses and routes

---

## Task 1: Rename content-network-agent → content-agent

**Files:**
- Rename: `packages/agents/src/mastra/agents/content-network-agent.ts` → `packages/agents/src/mastra/agents/content-agent.ts`

**Step 1: Copy file with new name**

```bash
cp packages/agents/src/mastra/agents/content-network-agent.ts \
   packages/agents/src/mastra/agents/content-agent.ts
```

**Step 2: Update content-agent.ts internals**

Change the agent definition at the bottom of the file:

```typescript
// Before
export const contentNetworkAgent: Agent = new Agent({
  id: "content-network-agent",
  name: "Content Network Agent",
  description: "Orchestration agent that routes content tasks to specialized agents...",
  // ...
});

// After
export const contentAgent: Agent = new Agent({
  id: "content-agent",
  name: "Content Agent",
  description: "Content domain orchestrator that routes to research, writing, SEO, and review agents.",
  // ...
  // agents config stays the same: research-agent, writer-agent, seo-auditor-agent, reviewer-agent
});
```

Update the router instructions function name and content — add one line at the top of the instructions:

```typescript
// In getRouterInstructions(), add at the start of the returned string:
`# CONTENT AGENT — DOMAIN ROUTER

You are the content domain orchestrator. You receive tasks from the platform router.
When you receive a prefix like "[Usar writer-agent]:", route directly to that agent without your own reasoning.

// ... rest of existing instructions unchanged
```

**Step 3: Delete old file**

```bash
rm packages/agents/src/mastra/agents/content-network-agent.ts
```

**Step 4: Commit**

```bash
git add packages/agents/src/mastra/agents/content-agent.ts
git rm packages/agents/src/mastra/agents/content-network-agent.ts
git commit -m "refactor(agents): rename content-network-agent to content-agent"
```

---

## Task 2: Create platform-router-agent

**Files:**
- Create: `packages/agents/src/mastra/agents/platform-router-agent.ts`

**Step 1: Create the file**

```typescript
// packages/agents/src/mastra/agents/platform-router-agent.ts
import { Agent } from "@mastra/core/agent";
import { Memory } from "@mastra/memory";
import type { InstructionMemoryItem } from "@packages/database/schemas/instruction-memory";
import { DEFAULT_CONTENT_MODEL_ID } from "../../models";
import {
  buildLanguageInstruction,
  compileInstructionMemories,
} from "../../utils";
import { contentAgent } from "./content-agent";

const memory = new Memory({
  options: {
    lastMessages: 30,
    generateTitle: {
      model: "openrouter/google/gemini-2.5-flash-lite",
    },
  },
});

const getPlatformRouterInstructions = (
  language: string,
  writerInstructions?: InstructionMemoryItem[],
): string => {
  const compiledMemories = compileInstructionMemories(writerInstructions ?? []);
  const languageInstruction = buildLanguageInstruction(language);

  return `
${languageInstruction}

${compiledMemories}

# PLATFORM ROUTER

You are the top-level orchestrator for the Contentta platform.
Your job: understand what the user wants and route to the right domain agent, or answer directly.

## YOUR AGENTS

**content-agent** — Content Domain Agent
Use when: anything related to content creation, writing, research, SEO, review, editing, planning articles

## ROUTING RULES

1. **Content-related request** → content-agent (pass the full message including any routing prefixes)
2. **Platform question** (how to use the platform, navigation, features) → answer directly
3. **Prefixed request** (e.g., "[Usar writer-agent]: ...") → content-agent (it will handle the prefix)

## IMPORTANT

- You DO NOT have tools yourself — content-agent and its specialists do
- For simple questions (definitions, how-to platform help), answer directly without routing
- Always include the agent's full output in your final response
- Pass routing prefixes (e.g., "[Usar writer-agent]:") unchanged to content-agent

Respond in the same language as the user request.
`;
};

export const platformRouterAgent: Agent = new Agent({
  id: "platform-router-agent",
  name: "Platform Router Agent",
  description:
    "Top-level platform orchestrator. Routes content tasks to content-agent and answers platform questions directly.",

  model: ({ requestContext }) => {
    const maybeModel = requestContext?.get("model");
    return typeof maybeModel === "string" && maybeModel.length > 0
      ? maybeModel
      : DEFAULT_CONTENT_MODEL_ID;
  },

  instructions: ({ requestContext }) => {
    const writerInstructions = requestContext?.get("writerInstructions") as
      | InstructionMemoryItem[]
      | undefined;
    const language = (requestContext?.get("language") as string) ?? "pt-BR";
    return getPlatformRouterInstructions(language, writerInstructions);
  },

  memory,

  agents: {
    "content-agent": contentAgent,
  },

  tools: {},
});
```

**Step 2: Verify the file was created**

```bash
cat packages/agents/src/mastra/agents/platform-router-agent.ts | head -20
```

Expected: Shows the import and agent creation.

**Step 3: Commit**

```bash
git add packages/agents/src/mastra/agents/platform-router-agent.ts
git commit -m "feat(agents): add platform-router-agent as top-level orchestrator"
```

---

## Task 3: Update Mastra registration

**Files:**
- Modify: `packages/agents/src/mastra/index.ts`

**Step 1: Update imports and registration**

Replace the `contentNetworkAgent` import with the new exports:

```typescript
// Remove:
import { contentNetworkAgent } from "./agents/content-network-agent";

// Add:
import { platformRouterAgent } from "./agents/platform-router-agent";
import { contentAgent } from "./agents/content-agent";
```

In the Mastra instance agents config, replace `contentNetworkAgent` with both new agents:

```typescript
// Before
agents: {
  contentNetworkAgent,
  researchAgent,
  writerAgent,
  seoAuditorAgent,
  reviewerAgent,
  fimAgent,
  inlineEditAgent,
}

// After
agents: {
  platformRouterAgent,
  contentAgent,
  researchAgent,
  writerAgent,
  seoAuditorAgent,
  reviewerAgent,
  fimAgent,
  inlineEditAgent,
}
```

**Step 2: Update createRequestContext exports if referenced**

Check if `createRequestContext` or any re-exports reference `contentNetworkAgent` by name:

```bash
grep -r "contentNetworkAgent" packages/agents/src/
```

Fix any remaining references.

**Step 3: Verify TypeScript compiles**

```bash
bun run typecheck
```

Expected: No errors in `packages/agents/`.

**Step 4: Commit**

```bash
git add packages/agents/src/mastra/index.ts
git commit -m "refactor(agents): register platformRouterAgent, replace contentNetworkAgent"
```

---

## Task 4: Update /api/chat route to use platformRouterAgent + accept mode param

**Files:**
- Modify: `apps/web/src/routes/api/chat/$.ts`

**Step 1: Update agent ID**

Find the `handleChatStream` call and change the agent ID:

```typescript
// Before
await handleChatStream({
  agentId: "contentNetworkAgent",
  // ...
});

// After
await handleChatStream({
  agentId: "platformRouterAgent",
  // ...
});
```

**Step 2: Accept and apply the `mode` parameter**

Add mode-to-prefix mapping and inject prefix into last user message:

```typescript
const MODE_ROUTING_PREFIX: Record<string, string> = {
  auto: "",
  content: "[Usar writer-agent]:",
  research: "[Usar research-agent]:",
  seo: "[Usar seo-auditor-agent]:",
  review: "[Usar reviewer-agent]:",
};

// In the request handler, after extracting messages:
const body = await request.json();
const { messages, threadId, teamId, mode = "auto" } = body;

// Inject prefix into the last user message
const prefix = MODE_ROUTING_PREFIX[mode] ?? "";
const processedMessages = prefix
  ? messages.map((msg: CoreMessage, idx: number) => {
      if (idx === messages.length - 1 && msg.role === "user") {
        const content =
          typeof msg.content === "string"
            ? `${prefix} ${msg.content}`
            : msg.content;
        return { ...msg, content };
      }
      return msg;
    })
  : messages;
```

**Step 3: Verify TypeScript compiles**

```bash
bun run typecheck
```

Expected: No type errors in `apps/web/src/routes/api/chat/$.ts`.

**Step 4: Commit**

```bash
git add apps/web/src/routes/api/chat/$.ts
git commit -m "feat(chat): route to platformRouterAgent, inject mode prefix into messages"
```

---

## Task 5: Update useTecoRuntime to pass mode

**Files:**
- Modify: `apps/web/src/features/teco-chat/hooks/use-teco-runtime.ts`

**Step 1: Accept mode as parameter**

Update the hook signature to accept an optional `mode` parameter:

```typescript
interface UseTecoRuntimeOptions {
  teamId: string;
  mode?: string; // "auto" | "content" | "research" | "seo" | "review"
}

export function useTecoRuntime({ teamId, mode = "auto" }: UseTecoRuntimeOptions) {
```

**Step 2: Pass mode in transport body**

Find where `AssistantChatTransport` is created and add `mode` to the body:

```typescript
new AssistantChatTransport({
  api: "/api/chat",
  body: { teamId, threadId: threadIdRef.current, mode },
})
```

Since `mode` can change, it needs to be read reactively. Check how `threadId` is currently handled (via ref) and apply the same pattern for `mode`:

```typescript
const modeRef = useRef(mode);
useEffect(() => { modeRef.current = mode; }, [mode]);

// In transport body:
body: { teamId, threadId: threadIdRef.current, mode: modeRef.current },
```

**Step 3: Verify TypeScript compiles**

```bash
bun run typecheck
```

**Step 4: Commit**

```bash
git add apps/web/src/features/teco-chat/hooks/use-teco-runtime.ts
git commit -m "feat(chat): pass mode to /api/chat transport for agent routing"
```

---

## Task 6: Add mode selector to Thread composer

**Files:**
- Modify: `apps/web/src/features/teco-chat/ui/thread.tsx`

**Step 1: Add mode state and constants**

At the top of `thread.tsx`, add:

```typescript
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@packages/ui/components/select";

const MODES = [
  { value: "auto", label: "Auto", icon: "⚡" },
  { value: "content", label: "Conteúdo", icon: "✍️" },
  { value: "research", label: "Pesquisa", icon: "🔍" },
  { value: "seo", label: "SEO", icon: "📊" },
  { value: "review", label: "Revisão", icon: "✅" },
] as const;

type Mode = (typeof MODES)[number]["value"];
```

**Step 2: Thread component accepts onModeChange**

Update the `Thread` component props:

```typescript
interface ThreadProps {
  suggestions?: { label: string; prompt: string }[];
  onModeChange?: (mode: Mode) => void;
  defaultMode?: Mode;
}

export function Thread({ suggestions = [], onModeChange, defaultMode = "auto" }: ThreadProps) {
  const [mode, setMode] = useState<Mode>(defaultMode);

  const handleModeChange = (value: Mode) => {
    setMode(value);
    onModeChange?.(value);
  };
  // ...
}
```

**Step 3: Add mode selector to Composer**

Inside the `Composer` section (below the `ComposerPrimitive.Input`), add the mode selector in the composer footer row:

```tsx
<div className="flex items-center gap-2 px-3 pb-2">
  <Select value={mode} onValueChange={handleModeChange}>
    <SelectTrigger className="h-7 w-auto gap-1 border-none bg-transparent px-2 text-xs text-muted-foreground shadow-none hover:bg-accent">
      <SelectValue />
    </SelectTrigger>
    <SelectContent align="start">
      {MODES.map((m) => (
        <SelectItem key={m.value} value={m.value} className="text-xs">
          {m.label}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
</div>
```

**Step 4: Visually verify**

Run the dev server and open the context panel chat tab. Confirm the mode selector appears below the composer input.

```bash
bun dev
```

**Step 5: Commit**

```bash
git add apps/web/src/features/teco-chat/ui/thread.tsx
git commit -m "feat(chat): add module mode selector to Thread composer"
```

---

## Task 7: Connect mode selector to useTecoRuntime

**Files:**
- Modify: `apps/web/src/features/context-panel/ui/teco-chat-tab.tsx`
- Modify: `apps/web/src/routes/_authenticated/$slug/$teamSlug/_dashboard/chat.tsx`

**Step 1: Add mode state in TecoChatTab**

```typescript
// In teco-chat-tab.tsx
const [mode, setMode] = useState<string>("auto");
const runtime = useTecoRuntime({ teamId, mode });

// Pass to Thread:
<Thread suggestions={QUICK_SUGGESTIONS} onModeChange={setMode} />
```

**Step 2: Same pattern in full chat page**

```typescript
// In chat.tsx (layout level)
const [mode, setMode] = useState<string>("auto");
const runtime = useTecoRuntime({ teamId, mode });

// Pass down to Thread via Outlet context or prop
```

**Step 3: Verify mode changes update the transport**

Send a message in "Pesquisa" mode, check the network tab in browser DevTools — the POST body to `/api/chat` should include `"mode": "research"`.

**Step 4: Commit**

```bash
git add apps/web/src/features/context-panel/ui/teco-chat-tab.tsx
git add apps/web/src/routes/_authenticated/$slug/$teamSlug/_dashboard/chat.tsx
git commit -m "feat(chat): wire mode state to useTecoRuntime in both chat surfaces"
```

---

## Task 8: Add @ Add context picker to Thread composer

**Files:**
- Create: `apps/web/src/features/teco-chat/ui/context-picker.tsx`
- Modify: `apps/web/src/features/teco-chat/ui/thread.tsx`

**Step 1: Create ContextPicker component**

```typescript
// apps/web/src/features/teco-chat/ui/context-picker.tsx
import { useState } from "react";
import { AtSign, FileText, Search } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@packages/ui/components/popover";
import { Button } from "@packages/ui/components/button";
import { Input } from "@packages/ui/components/input";
import { useSuspenseQuery } from "@tanstack/react-query";
import { orpc } from "@/integrations/orpc/client";

interface ContextItem {
  type: "content" | "current-document";
  id: string;
  label: string;
  preview: string; // short excerpt or description
}

interface ContextPickerProps {
  teamId: string;
  onSelect: (item: ContextItem) => void;
  currentDocumentId?: string; // present when in editor
}

export function ContextPicker({ teamId, onSelect, currentDocumentId }: ContextPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const { data: contents } = useSuspenseQuery(
    orpc.content.getAll.queryOptions({ input: { teamId } }),
  );

  const filtered = contents?.filter((c) =>
    c.title?.toLowerCase().includes(search.toLowerCase()),
  );

  const handleSelect = (item: ContextItem) => {
    onSelect(item);
    setOpen(false);
    setSearch("");
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 gap-1 px-2 text-xs text-muted-foreground"
        >
          <AtSign className="size-3" />
          Adicionar contexto
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80 p-0" side="top">
        <div className="border-b p-2">
          <div className="relative">
            <Search className="absolute left-2 top-2 size-3.5 text-muted-foreground" />
            <Input
              className="h-8 pl-7 text-xs"
              placeholder="Pesquisar conteúdos..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
          </div>
        </div>

        <div className="max-h-64 overflow-y-auto">
          {currentDocumentId && (
            <div className="border-b">
              <p className="px-3 py-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Documento atual
              </p>
              <button
                type="button"
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs hover:bg-accent"
                onClick={() =>
                  handleSelect({
                    type: "current-document",
                    id: currentDocumentId,
                    label: "Documento atual",
                    preview: "",
                  })
                }
              >
                <FileText className="size-3.5 shrink-0 text-muted-foreground" />
                <span>Usar documento aberto</span>
              </button>
            </div>
          )}

          <p className="px-3 py-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Conteúdos
          </p>
          {filtered?.map((content) => (
            <button
              type="button"
              key={content.id}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs hover:bg-accent"
              onClick={() =>
                handleSelect({
                  type: "content",
                  id: content.id,
                  label: content.title ?? "Sem título",
                  preview: content.description ?? "",
                })
              }
            >
              <FileText className="size-3.5 shrink-0 text-muted-foreground" />
              <span className="truncate">{content.title ?? "Sem título"}</span>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
```

**Step 2: Add context items state to Thread**

In `thread.tsx`, add state for selected context items and append them to the message on send:

```typescript
interface ContextItem {
  type: "content" | "current-document";
  id: string;
  label: string;
  preview: string;
}

// In Thread component:
const [contextItems, setContextItems] = useState<ContextItem[]>([]);

const handleContextSelect = (item: ContextItem) => {
  setContextItems((prev) => [...prev, item]);
};

// Show selected context chips above the composer input:
{contextItems.length > 0 && (
  <div className="flex flex-wrap gap-1 px-3 pt-2">
    {contextItems.map((item) => (
      <span
        key={item.id}
        className="flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-xs"
      >
        @{item.label}
        <button
          type="button"
          onClick={() => setContextItems((prev) => prev.filter((i) => i.id !== item.id))}
          className="text-muted-foreground hover:text-foreground"
        >
          ×
        </button>
      </span>
    ))}
  </div>
)}
```

**Step 3: Append context to message before send**

Wrap the composer submit to append context block. Since `@assistant-ui/react` uses `ComposerPrimitive.Send`, intercept via `onBeforeSubmit` or by using `useComposer`:

```typescript
// Context is passed via additional body in the transport
// Simpler: serialize context items and append to message text

// In the Composer, override the send button to prepend context:
const handleSendWithContext = () => {
  if (contextItems.length === 0) return; // let default send handle it
  const contextBlock = contextItems
    .map((item) => `[Contexto: ${item.label}]`)
    .join("\n");
  // Programmatically append to current composer value before submit
  // Implementation depends on @assistant-ui/react API — check useComposer hook
  setContextItems([]);
};
```

> **Note:** Check the `@assistant-ui/react` docs for `useComposer` to get/set the composer value programmatically. The exact API may be `useComposer().setValue(...)` or similar.

**Step 4: Add ContextPicker to composer footer**

```tsx
// In the composer footer row next to the mode selector:
<ContextPicker
  teamId={teamId}
  onSelect={handleContextSelect}
  currentDocumentId={currentDocumentId}
/>
```

**Step 5: Commit**

```bash
git add apps/web/src/features/teco-chat/ui/context-picker.tsx
git add apps/web/src/features/teco-chat/ui/thread.tsx
git commit -m "feat(chat): add @ context picker to Thread composer"
```

---

## Task 9: PostHog-style empty state for full /chat page

**Files:**
- Modify: `apps/web/src/features/teco-chat/ui/thread.tsx` (welcome/empty state section)

The current empty state shows a simple welcome. Update it to PostHog-style: centered, prominent composer, suggestion chips in a grid below.

**Step 1: Update empty thread state**

Find the empty/welcome state section in `thread.tsx` and update:

```tsx
// Empty thread welcome state
<div className="flex flex-1 flex-col items-center justify-center gap-6 p-8">
  <div className="flex flex-col items-center gap-2 text-center">
    <div className="text-4xl font-semibold tracking-tight">
      O que você quer criar?
    </div>
    <p className="text-sm text-muted-foreground">
      Pesquise, escreva, audite SEO ou revise conteúdos.
    </p>
  </div>

  {/* Suggestion chips */}
  {suggestions.length > 0 && (
    <div className="flex flex-wrap justify-center gap-2">
      {suggestions.map((s) => (
        <button
          type="button"
          key={s.label}
          className="rounded-full border border-border bg-background px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
          onClick={() => {/* pre-fill composer */}}
        >
          {s.label}
        </button>
      ))}
    </div>
  )}
</div>
```

**Step 2: Wire suggestion chip click to pre-fill composer**

Use `@assistant-ui/react`'s `useComposer` hook to set the value:

```typescript
import { useComposer } from "@assistant-ui/react";

// Inside Composer context:
const composer = useComposer();
// On chip click:
composer.setValue(s.prompt);
composer.focus();
```

**Step 3: Commit**

```bash
git add apps/web/src/features/teco-chat/ui/thread.tsx
git commit -m "feat(chat): PostHog-style empty state with centered composer and suggestion chips"
```

---

## Task 10: Update AgentNetworkStatus display names

**Files:**
- Modify: `apps/web/src/features/teco-chat/ui/thread.tsx` (or wherever `AGENT_DISPLAY_NAMES` lives)

**Step 1: Update agent display names**

```typescript
const AGENT_DISPLAY_NAMES: Record<string, string> = {
  "platform-router-agent": "Plataforma",
  "content-agent": "Conteúdo",
  "research-agent": "Pesquisa",
  "writer-agent": "Redação",
  "seo-auditor-agent": "SEO",
  "reviewer-agent": "Revisão",
  "fim-agent": "Autocomplete",
  "inline-edit-agent": "Edição",
};
```

**Step 2: Commit**

```bash
git add apps/web/src/features/teco-chat/ui/thread.tsx
git commit -m "chore(chat): update agent display names for new network hierarchy"
```

---

## Task 11: Update CLAUDE.md agent references

**Files:**
- Modify: `/home/yorizel/Documents/contentta-nx/CLAUDE.md`

**Step 1: Update the AI Agents section**

Replace references to `unifiedContent` / `contentNetworkAgent` with the new names:

```markdown
**Usage in routers:**
```typescript
const agent = mastra.getAgent("platformRouterAgent");
```

Update the agent hierarchy description to reflect:
- `platform-router-agent` (top-level)
- `content-agent` (content domain orchestrator)
- Sub-agents: research, writer, seo-auditor, reviewer
```

**Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: update CLAUDE.md with new agent network hierarchy"
```

---

## Checklist

- [ ] Task 1: content-network-agent → content-agent (file rename + internals)
- [ ] Task 2: platform-router-agent created
- [ ] Task 3: Mastra registration updated
- [ ] Task 4: /api/chat uses platformRouterAgent + mode prefix injection
- [ ] Task 5: useTecoRuntime accepts and passes mode
- [ ] Task 6: Thread composer has mode selector
- [ ] Task 7: Mode selector wired to useTecoRuntime in both surfaces
- [ ] Task 8: @ Add context picker
- [ ] Task 9: PostHog-style empty state
- [ ] Task 10: Agent display names updated
- [ ] Task 11: CLAUDE.md updated

---

## Testing

After all tasks, test these scenarios manually:

1. **Auto mode** — send "escreva um artigo sobre TypeScript" — should route through content-agent → writer-agent
2. **Research mode** — select "Pesquisa", send "pesquise sobre SEO em 2026" — body should show `mode: "research"`, prefix `[Usar research-agent]:` injected
3. **Context panel vs full chat** — both surfaces show mode selector, both pass mode to /api/chat
4. **@ context picker** — open picker, select a content, see `@Title` chip in composer
5. **Empty state** — new thread shows welcome state with suggestion chips; clicking chip pre-fills composer
6. **AgentNetworkStatus** — correct display names shown while agents run

---

## Related Issues

- #606 — Chat Experience 2.0 (this plan)
- #613 — Agent Networks migration
- #616 — Platform Agent + Onboarding Agent
- #695 — Context Panel Global (completed)
- #696 — Context Panel tabs (completed)
