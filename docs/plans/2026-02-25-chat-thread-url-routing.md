# Chat Thread URL Routing Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make each chat thread addressable by a URL (`/chat/$threadId`) so users can share, bookmark, and navigate directly to a conversation — and so the browser back/forward buttons work correctly within the chat UI.

**Architecture:** Convert the flat `chat.tsx` route into a layout route (`chat.tsx` with `<Outlet />`) with one child route (`chat.$threadId.tsx`). The `ThreadListItemComponent` inside `ThreadList` reads `externalId` from `useAuiState` and wraps the trigger in a TanStack `<Link>` so clicking a thread navigates to its URL. When the `chat.$threadId` route mounts it calls `runtime.threads.switchToThread(threadId)` to activate the correct thread inside the assistant-ui runtime.

**Tech Stack:** TanStack Router (file-based), `@assistant-ui/react` (`useAuiState`, `useAui`), `@tanstack/react-router` (`Link`, `useParams`, `createFileRoute`), Bun

---

### Task 1: Convert `chat.tsx` into a layout route

**Files:**
- Modify: `apps/web/src/routes/_authenticated/$slug/$teamSlug/_dashboard/chat.tsx`

Currently `chat.tsx` renders the full chat page. We need it to become a layout that keeps `<AssistantRuntimeProvider>` alive (so the thread list stays mounted) while the actual thread UI is rendered by a child route via `<Outlet />`.

**Step 1: Read the current file to understand current structure**

```bash
cat apps/web/src/routes/_authenticated/$slug/$teamSlug/_dashboard/chat.tsx
```

**Step 2: Rewrite `chat.tsx` as a layout route**

Replace the entire file content with the following:

```tsx
import { AssistantRuntimeProvider } from "@assistant-ui/react";
import { ThreadList } from "@packages/ui/components/assistant-ui/thread-list";
import { createFileRoute, Outlet } from "@tanstack/react-router";
import { useEffect } from "react";
import { closeContextPanel } from "@/features/context-panel/use-context-panel";
import { useAranduRuntime } from "@/features/context-panel/hooks/use-arandu-runtime";
import { useActiveTeam } from "@/hooks/use-active-team";

export const Route = createFileRoute(
   "/_authenticated/$slug/$teamSlug/_dashboard/chat",
)({
   component: ChatLayoutPage,
});

function ChatLayoutContent({ teamId }: { teamId: string }) {
   const runtime = useAranduRuntime({ teamId });

   return (
      <AssistantRuntimeProvider runtime={runtime}>
         <div className="flex h-full w-full overflow-hidden">
            {/* Thread list sidebar */}
            <div className="hidden w-56 shrink-0 border-r border-border/60 bg-accent md:flex md:flex-col">
               <ThreadList welcomeIconUrl="/arandu.svg" />
            </div>

            {/* Active thread or welcome screen */}
            <div className="flex flex-1 flex-col overflow-hidden bg-background">
               <Outlet />
            </div>
         </div>
      </AssistantRuntimeProvider>
   );
}

function ChatLayoutPage() {
   const { activeTeamId } = useActiveTeam();

   useEffect(() => {
      closeContextPanel();
   }, []);

   if (!activeTeamId) return null;

   return <ChatLayoutContent teamId={activeTeamId} />;
}
```

Key changes:
- Removed `Thread` import (child routes will render it)
- Removed `QUICK_SUGGESTIONS` constant (moved to child routes)
- Replaced the chat area `<Thread />` with `<Outlet />`
- Renamed component to `ChatLayoutPage` / `ChatLayoutContent`

**Step 3: Verify the file compiles without errors**

```bash
cd apps/web && npx tsc --noEmit --project tsconfig.json 2>&1 | grep "chat" | head -20
```

Expected: no TypeScript errors for `chat.tsx`.

**Step 4: Commit**

```bash
git add apps/web/src/routes/_authenticated/\$slug/\$teamSlug/_dashboard/chat.tsx
git commit -m "refactor(chat): convert chat route to layout with Outlet for nested thread routes"
```

---

### Task 2: Create `chat.index.tsx` — the welcome screen (no thread selected)

**Files:**
- Create: `apps/web/src/routes/_authenticated/$slug/$teamSlug/_dashboard/chat.index.tsx`

TanStack Router requires an explicit index route for the layout when no `$threadId` is present. This shows the welcome/empty state with `Thread` (so users can start a new chat).

**Step 1: Create the file**

```tsx
import { Thread } from "@packages/ui/components/assistant-ui/thread";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute(
   "/_authenticated/$slug/$teamSlug/_dashboard/chat/",
)({
   component: ChatIndexPage,
});

const QUICK_SUGGESTIONS = [
   { label: "Criar artigo", prompt: "Crie um artigo completo sobre " },
   {
      label: "Analisar SEO",
      prompt: "Analise o SEO deste conteúdo e sugira melhorias: ",
   },
   { label: "Pesquisar", prompt: "Pesquise sobre " },
   { label: "Otimizar texto", prompt: "Otimize este texto para SEO: " },
   { label: "Estratégia", prompt: "Crie uma estratégia de conteúdo para " },
];

function ChatIndexPage() {
   return (
      <Thread
         quickSuggestions={QUICK_SUGGESTIONS}
         welcomeIconUrl="/arandu.svg"
         welcomeSubtitle="Seu assistente de conteúdo com IA."
         welcomeTitle="Como posso te ajudar?"
      />
   );
}
```

**Step 2: Verify the file exists**

```bash
ls apps/web/src/routes/_authenticated/\$slug/\$teamSlug/_dashboard/chat.index.tsx
```

Expected: file present.

**Step 3: Commit**

```bash
git add apps/web/src/routes/_authenticated/\$slug/\$teamSlug/_dashboard/chat.index.tsx
git commit -m "feat(chat): add chat index route with welcome Thread UI"
```

---

### Task 3: Create `chat.$threadId.tsx` — the thread-specific route

**Files:**
- Create: `apps/web/src/routes/_authenticated/$slug/$teamSlug/_dashboard/chat.$threadId.tsx`

This route mounts when a user navigates to `/chat/<threadId>`. It calls `runtime.threads.switchToThread(threadId)` to activate that thread inside the assistant-ui runtime, then renders the `Thread` UI.

**Step 1: Understand how to switch threads in assistant-ui**

`useAui()` gives us `api.threads.switchToThread(threadId)`. The `threadId` here is the `externalId` returned by our `MastraThreadListAdapter.initialize()`, which passes through the Mastra thread UUID directly.

**Step 2: Create the file**

```tsx
import { useAui } from "@assistant-ui/react";
import { Thread } from "@packages/ui/components/assistant-ui/thread";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute(
   "/_authenticated/$slug/$teamSlug/_dashboard/chat/$threadId",
)({
   component: ChatThreadPage,
});

const QUICK_SUGGESTIONS = [
   { label: "Criar artigo", prompt: "Crie um artigo completo sobre " },
   {
      label: "Analisar SEO",
      prompt: "Analise o SEO deste conteúdo e sugira melhorias: ",
   },
   { label: "Pesquisar", prompt: "Pesquise sobre " },
   { label: "Otimizar texto", prompt: "Otimize este texto para SEO: " },
   { label: "Estratégia", prompt: "Crie uma estratégia de conteúdo para " },
];

function ChatThreadPage() {
   const { threadId } = Route.useParams();
   const api = useAui();

   useEffect(() => {
      api.threads.switchToThread(threadId);
   }, [api, threadId]);

   return (
      <Thread
         quickSuggestions={QUICK_SUGGESTIONS}
         welcomeIconUrl="/arandu.svg"
         welcomeSubtitle="Seu assistente de conteúdo com IA."
         welcomeTitle="Como posso te ajudar?"
      />
   );
}
```

Key details:
- `Route.useParams()` gives us `threadId` (the dynamic segment)
- `useAui()` is the modern assistant-ui API (non-deprecated)
- `api.threads.switchToThread(threadId)` activates the thread in the runtime
- The effect re-runs when `threadId` changes (user navigates between threads)

**Step 3: Verify the file exists**

```bash
ls apps/web/src/routes/_authenticated/\$slug/\$teamSlug/_dashboard/chat.\$threadId.tsx
```

Expected: file present.

**Step 4: Commit**

```bash
git add "apps/web/src/routes/_authenticated/\$slug/\$teamSlug/_dashboard/chat.\$threadId.tsx"
git commit -m "feat(chat): add chat/\$threadId route that activates thread via assistant-ui runtime"
```

---

### Task 4: Update `ThreadListItemComponent` to navigate via Link

**Files:**
- Modify: `packages/ui/src/components/assistant-ui/thread-list.tsx`

The `ThreadListItemPrimitive.Trigger` currently fires assistant-ui's internal `switchTo` action. We need it to navigate to the thread's URL instead (so the browser URL bar updates and history is maintained). We do this by replacing the inner `<button>` with a TanStack `<Link>` using `asChild`.

**Important:** `externalId` from `useAuiState((s) => s.threadListItem.externalId)` is the Mastra thread UUID (set in `MastraThreadListAdapter.initialize` and `list`). This is what we use as the `$threadId` URL param.

**Step 1: Read the current file**

```bash
cat packages/ui/src/components/assistant-ui/thread-list.tsx
```

**Step 2: Understand the props `ThreadListItemComponent` needs**

The component needs to know `slug` and `teamSlug` to build the correct Link `to` path. Since `ThreadList` is in `@packages/ui` (shared, framework-agnostic), we pass these as props from the app layer. We add `onThreadSelect?: (externalId: string) => void` to `ThreadListProps` and pass it down.

**Why not import `Link` directly:** `@packages/ui` must not depend on `@tanstack/react-router`. The link behavior should be injected from the app via a render prop or callback. We use a `renderTrigger` render prop approach — the consumer provides a function that returns the trigger element given the `externalId`.

**Step 3: Update `ThreadListProps` and `ThreadList`**

Replace the file content with:

```tsx
"use client";

import {
   ThreadListItemPrimitive,
   ThreadListPrimitive,
   useAuiState,
} from "@assistant-ui/react";
import { Button } from "@packages/ui/components/button";
import { cn } from "@packages/ui/lib/utils";
import { MessageSquarePlusIcon, Trash2Icon } from "lucide-react";
import type { FC, ReactNode } from "react";

export interface ThreadListProps {
   welcomeIconUrl?: string;
   className?: string;
   /**
    * Optional render function for thread item trigger.
    * Receives the thread's externalId and title.
    * If not provided, the default button trigger is used.
    *
    * Use this to inject routing (e.g. TanStack Link) from the app layer.
    */
   renderThreadTrigger?: (props: {
      externalId: string | undefined;
      title: string | undefined;
      children: ReactNode;
   }) => ReactNode;
}

export const ThreadList: FC<ThreadListProps> = ({
   welcomeIconUrl,
   className,
   renderThreadTrigger,
}) => {
   return (
      <ThreadListPrimitive.Root
         className={cn(
            "flex h-full flex-col gap-1 overflow-y-auto px-2 py-2",
            className,
         )}
      >
         <ThreadListNew welcomeIconUrl={welcomeIconUrl} />

         <div className="mt-2">
            <p className="mb-1 px-2 text-[11px] font-medium text-muted-foreground/70 uppercase tracking-wide">
               Conversas
            </p>
            <ThreadListPrimitive.Items
               components={{
                  ThreadListItem: (props) => (
                     <ThreadListItemComponent
                        {...props}
                        renderThreadTrigger={renderThreadTrigger}
                     />
                  ),
               }}
            />
         </div>
      </ThreadListPrimitive.Root>
   );
};

const ThreadListNew: FC<{ welcomeIconUrl?: string }> = () => {
   return (
      <ThreadListPrimitive.New asChild>
         <Button
            className="flex w-full items-center justify-start gap-2 rounded-lg px-3 py-2 text-sm font-medium"
            variant="outline"
         >
            Nova conversa
            <MessageSquarePlusIcon className="ml-auto size-4 shrink-0 text-muted-foreground" />
         </Button>
      </ThreadListPrimitive.New>
   );
};

const ThreadListItemComponent: FC<{
   renderThreadTrigger?: ThreadListProps["renderThreadTrigger"];
}> = ({ renderThreadTrigger }) => {
   const title = useAuiState((s) => s.threadListItem.title);
   const externalId = useAuiState((s) => s.threadListItem.externalId);

   const triggerContent = (
      <span className="flex-1 truncate text-foreground/80">
         {title ?? "Nova conversa"}
      </span>
   );

   const trigger = renderThreadTrigger ? (
      renderThreadTrigger({ externalId, title, children: triggerContent })
   ) : (
      <ThreadListItemPrimitive.Trigger asChild>
         <button
            className="flex flex-1 min-w-0 items-center gap-2 text-left"
            type="button"
         >
            {triggerContent}
         </button>
      </ThreadListItemPrimitive.Trigger>
   );

   return (
      <ThreadListItemPrimitive.Root
         className={cn(
            "group flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-accent/60",
            "data-[active=true]:bg-accent/80 data-[active=true]:font-medium",
         )}
      >
         {trigger}

         <ThreadListItemPrimitive.Delete asChild>
            <button
               className="ml-auto shrink-0 rounded p-1 text-muted-foreground/50 opacity-0 transition-all hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
               type="button"
            >
               <Trash2Icon className="size-3.5" />
               <span className="sr-only">Excluir conversa</span>
            </button>
         </ThreadListItemPrimitive.Delete>
      </ThreadListItemPrimitive.Root>
   );
};
```

**Step 4: Verify the file compiles**

```bash
cd packages/ui && npx tsc --noEmit 2>&1 | grep "thread-list" | head -10
```

Expected: no errors.

**Step 5: Commit**

```bash
git add packages/ui/src/components/assistant-ui/thread-list.tsx
git commit -m "feat(thread-list): add renderThreadTrigger prop for URL-based thread navigation"
```

---

### Task 5: Wire up `renderThreadTrigger` with TanStack `Link` in `chat.tsx`

**Files:**
- Modify: `apps/web/src/routes/_authenticated/$slug/$teamSlug/_dashboard/chat.tsx`

Now we connect the `renderThreadTrigger` prop in `ThreadList` to TanStack Router's `Link`, so clicking a thread item navigates to `/chat/$threadId`.

**Step 1: Update `ChatLayoutContent` in `chat.tsx`**

Add a `renderThreadTrigger` implementation using `useParams` and `Link`:

```tsx
import { AssistantRuntimeProvider } from "@assistant-ui/react";
import { ThreadList } from "@packages/ui/components/assistant-ui/thread-list";
import { createFileRoute, Link, Outlet, useParams } from "@tanstack/react-router";
import { useEffect } from "react";
import { closeContextPanel } from "@/features/context-panel/use-context-panel";
import { useAranduRuntime } from "@/features/context-panel/hooks/use-arandu-runtime";
import { useActiveTeam } from "@/hooks/use-active-team";

export const Route = createFileRoute(
   "/_authenticated/$slug/$teamSlug/_dashboard/chat",
)({
   component: ChatLayoutPage,
});

function ChatLayoutContent({ teamId }: { teamId: string }) {
   const runtime = useAranduRuntime({ teamId });
   const { slug, teamSlug } = useParams({
      from: "/_authenticated/$slug/$teamSlug/_dashboard",
   });

   return (
      <AssistantRuntimeProvider runtime={runtime}>
         <div className="flex h-full w-full overflow-hidden">
            {/* Thread list sidebar */}
            <div className="hidden w-56 shrink-0 border-r border-border/60 bg-accent md:flex md:flex-col">
               <ThreadList
                  welcomeIconUrl="/arandu.svg"
                  renderThreadTrigger={({ externalId, children }) => {
                     if (!externalId) {
                        return (
                           <button
                              className="flex flex-1 min-w-0 items-center gap-2 text-left"
                              type="button"
                           >
                              {children}
                           </button>
                        );
                     }
                     return (
                        <Link
                           className="flex flex-1 min-w-0 items-center gap-2 text-left"
                           params={{ slug, teamSlug, threadId: externalId }}
                           to="/$slug/$teamSlug/chat/$threadId"
                        >
                           {children}
                        </Link>
                     );
                  }}
               />
            </div>

            {/* Active thread or welcome screen */}
            <div className="flex flex-1 flex-col overflow-hidden bg-background">
               <Outlet />
            </div>
         </div>
      </AssistantRuntimeProvider>
   );
}

function ChatLayoutPage() {
   const { activeTeamId } = useActiveTeam();

   useEffect(() => {
      closeContextPanel();
   }, []);

   if (!activeTeamId) return null;

   return <ChatLayoutContent teamId={activeTeamId} />;
}
```

**Step 2: Verify TypeScript**

```bash
cd apps/web && npx tsc --noEmit 2>&1 | grep "chat" | head -20
```

Expected: no errors.

**Step 3: Commit**

```bash
git add apps/web/src/routes/_authenticated/\$slug/\$teamSlug/_dashboard/chat.tsx
git commit -m "feat(chat): wire ThreadList renderThreadTrigger to TanStack Link for URL routing"
```

---

### Task 6: Run dev server and verify routing works end-to-end

**Step 1: Start the dev server**

```bash
bun dev
```

**Step 2: Manual verification checklist**

Navigate to the chat page in a browser:

1. Go to `/<slug>/<teamSlug>/chat` — should show the welcome Thread UI (empty state with quick suggestions).
2. Start a new conversation by typing a message and sending. The runtime creates a new thread.
3. After the first message is processed, the thread should appear in the left sidebar.
4. Click the thread in the sidebar — verify the URL changes to `/<slug>/<teamSlug>/chat/<uuid>`.
5. Navigate to a different page (e.g. home), then click Back — verify you return to the thread URL and the conversation loads.
6. Create another new conversation (`Nova conversa` button). Verify a second item appears in the thread list.
7. Click each thread — verify switching works, URL changes accordingly.
8. Refresh the page on a thread URL — verify the conversation loads (thread switching happens on mount via `useEffect`).

**Step 3: Check the route tree was regenerated**

TanStack Router auto-generates `routeTree.gen.ts`. After adding the new routes, confirm it includes the new entries:

```bash
grep -n "ChatThread\|chat\.\$threadId\|chat\.index" apps/web/src/routeTree.gen.ts | head -10
```

Expected: lines referencing the new `chat.$threadId` and `chat.index` route imports.

**Step 4: Commit if any auto-generated files changed**

```bash
git add apps/web/src/routeTree.gen.ts
git commit -m "chore: regenerate routeTree with chat nested routes"
```

---

### Task 7: (Optional) Update `isChatPage` detection in `dashboard-layout.tsx`

**Files:**
- Modify: `apps/web/src/layout/dashboard/ui/dashboard-layout.tsx`

Currently `isChatPage` uses `pathname.includes("/chat")`. This still works after the refactor, but verify it still gives the correct layout (no padding, `overflow-hidden`) for both `/chat` and `/chat/$threadId`.

**Step 1: Read the relevant section**

```bash
grep -n "isChatPage\|chat" apps/web/src/layout/dashboard/ui/dashboard-layout.tsx
```

Expected output (current):
```
81:   const isChatPage = pathname.includes("/chat");
...
195:           isEditorPage || isChatPage
196:              ? "overflow-hidden p-0"
```

The `pathname.includes("/chat")` check matches both `/chat` and `/chat/<uuid>`, so no change is needed. This task is a verification step only.

**Step 2: Confirm no change needed**

If the output matches the pattern above, no modification required. Skip to next task.

---

## Summary of Files Changed

| File | Action |
|------|--------|
| `apps/web/src/routes/_authenticated/$slug/$teamSlug/_dashboard/chat.tsx` | Modified — layout route with `<Outlet />` and `renderThreadTrigger` wired to `Link` |
| `apps/web/src/routes/_authenticated/$slug/$teamSlug/_dashboard/chat.index.tsx` | Created — index route with welcome Thread UI |
| `apps/web/src/routes/_authenticated/$slug/$teamSlug/_dashboard/chat.$threadId.tsx` | Created — thread route that calls `switchToThread` on mount |
| `packages/ui/src/components/assistant-ui/thread-list.tsx` | Modified — added `renderThreadTrigger` render prop |
| `apps/web/src/routeTree.gen.ts` | Auto-generated — updated by TanStack Router CLI |
