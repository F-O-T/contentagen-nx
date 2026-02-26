# Arandu Chat Centralization

**Date:** 2026-02-26
**Branch:** 609-chat-ui-implementar-assistantsidebar-global-e-threadlist-com-histórico-de-conversas

## Goal

Centralize all Arandu chat logic under `features/arandu-chat/`. Route files and the context panel tab become thin compositors. Fully replace the low-level Mastra storage calls with the proper Memory API via oRPC procedures.

---

## Principles

- `features/arandu-chat/` is the single source of truth for all chat logic
- Route files own zero logic — they wire hooks + components
- Context panel tab reuses the same hooks as the full-page route
- `useSuspenseQuery` replaces `useQuery` — no conditional checks, no `enabled`
- Recent thread items are TanStack Router `<Link>` components — router is source of truth for active thread
- oRPC mutations are called via `useMutation` at the hook level, never via direct client calls inside class methods

---

## Feature Folder (target state)

```
features/arandu-chat/
├── hooks/
│   ├── use-arandu-runtime.ts    # moved from features/context-panel/hooks/
│   └── use-thread-list.ts       # NEW: useSuspenseQuery wrapper
├── ui/
│   ├── thread.tsx               # modify: recentThreads → recentThreadsSlot
│   └── thread-list.tsx          # untouched
```

---

## Step 1 — oRPC Chat Router

Replace the single `getRecentThreads` procedure with four procedures using `agent.getMemory()`.

**File:** `apps/web/src/integrations/orpc/router/chat.ts`

```typescript
import { ORPCError } from "@orpc/server";
import { mastra } from "@packages/agents";
import { z } from "zod";
import { protectedProcedure } from "../server";

const getMemory = async () => {
  const memory = await mastra.getAgent("unifiedContent").getMemory();
  if (!memory) throw new ORPCError("INTERNAL_SERVER_ERROR", { message: "Memory not configured" });
  return memory;
};

export const listThreads = protectedProcedure
  .input(z.object({
    teamId: z.uuid(),
    page: z.number().int().min(0).default(0),
    perPage: z.number().int().min(1).max(50).default(20),
  }))
  .handler(async ({ context, input }) => {
    const memory = await getMemory();
    const result = await memory.listThreads({
      filter: { resourceId: `${input.teamId}:${context.userId}` },
      page: input.page,
      perPage: input.perPage,
      orderBy: { field: "updatedAt", direction: "DESC" },
    });
    return {
      threads: result.threads.map((t) => ({
        id: t.id,
        title: t.title ?? "Nova conversa",
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
      })),
      total: result.total,
      hasMore: result.hasMore,
    };
  });

export const createThread = protectedProcedure
  .input(z.object({
    teamId: z.uuid(),
    title: z.string().optional(),
    metadata: z.record(z.unknown()).optional(),
  }))
  .handler(async ({ context, input }) => {
    const memory = await getMemory();
    const thread = await memory.createThread({
      resourceId: `${input.teamId}:${context.userId}`,
      title: input.title,
      metadata: input.metadata,
    });
    return { id: thread.id, title: thread.title ?? "Nova conversa", createdAt: thread.createdAt };
  });

export const getThread = protectedProcedure
  .input(z.object({ threadId: z.string() }))
  .handler(async ({ _context, input }) => {
    const memory = await getMemory();
    const thread = await memory.getThreadById({ threadId: input.threadId });
    if (!thread) throw new ORPCError("NOT_FOUND", { message: "Thread not found" });
    return {
      id: thread.id,
      title: thread.title ?? "Nova conversa",
      createdAt: thread.createdAt,
      updatedAt: thread.updatedAt,
      resourceId: thread.resourceId,
    };
  });

export const cloneThread = protectedProcedure
  .input(z.object({
    sourceThreadId: z.string(),
    teamId: z.uuid(),
    title: z.string().optional(),
    messageLimit: z.number().int().min(1).optional(),
  }))
  .handler(async ({ context, input }) => {
    const memory = await getMemory();
    const { thread } = await memory.cloneThread({
      sourceThreadId: input.sourceThreadId,
      resourceId: `${input.teamId}:${context.userId}`,
      title: input.title,
      options: input.messageLimit ? { messageLimit: input.messageLimit } : undefined,
    });
    return { id: thread.id, title: thread.title ?? "Nova conversa", createdAt: thread.createdAt };
  });
```

Register all four in the chat router export.

---

## Step 2 — `use-thread-list.ts` (new hook)

**File:** `features/arandu-chat/hooks/use-thread-list.ts`

```typescript
import { useSuspenseQuery } from "@tanstack/react-query";
import { orpc } from "@/integrations/orpc/client";

export function useThreadList({ teamId, perPage = 20 }: { teamId: string; perPage?: number }) {
  const { data } = useSuspenseQuery(
    orpc.chat.listThreads.queryOptions({
      input: { teamId, page: 0, perPage },
    }),
  );
  return data.threads;
}
```

---

## Step 3 — `use-arandu-runtime.ts` (move + fix)

Move from `features/context-panel/hooks/` → `features/arandu-chat/hooks/`.

Key changes:
- `initialize()` uses injected `onCreate` callback (no direct client calls inside class)
- `list()` calls `orpc.chat.listThreads` client directly (non-React context, valid)
- Hook owns the `useMutation` and passes `mutateAsync` to the adapter

```typescript
class MastraThreadListAdapter implements RemoteThreadListAdapter {
  constructor(
    private teamId: string,
    private onCreate: (input: { teamId: string }) => Promise<{ id: string }>,
  ) {}

  async list(): Promise<RemoteThreadListResponse> {
    const result = await client.chat.listThreads({ teamId: this.teamId, perPage: 20 });
    return {
      threads: result.threads.map((t) => ({
        status: "regular" as const,
        remoteId: t.id,
        externalId: t.id,
        title: t.title ?? undefined,
      })),
    };
  }

  async initialize(_threadId: string): Promise<RemoteThreadInitializeResponse> {
    const thread = await this.onCreate({ teamId: this.teamId });
    return { remoteId: thread.id, externalId: thread.id };
  }

  async rename(): Promise<void> {}
  async archive(): Promise<void> {}
  async delete(): Promise<void> {}
  async generateTitle(): Promise<ReadableStream> { /* existing impl */ }
  async fetch(threadId: string) { /* existing impl */ }
}

export function useAranduRuntime({ teamId }: { teamId: string }) {
  const createThread = useMutation(orpc.chat.createThread.mutationOptions({}));

  const adapter = useMemo(
    () => new MastraThreadListAdapter(teamId, (input) => createThread.mutateAsync(input)),
    [teamId, createThread.mutateAsync],
  );

  const transport = useMemo(
    () => new AssistantChatTransport({ api: "/api/chat", body: { teamId } }),
    [teamId],
  );

  return unstable_useRemoteThreadListRuntime({
    runtimeHook: function RuntimeHook() {
      return useChatRuntime({ transport });
    },
    adapter,
    allowNesting: true,
  });
}
```

---

## Step 4 — `Thread` component

**File:** `features/arandu-chat/ui/thread.tsx`

Replace `recentThreads?: RecentThread[]` with `recentThreadsSlot?: ReactNode`.
Remove `RecentThread` interface (no longer needed — items are TanStack Router `<Link>` components owned by callers).

In `ThreadWelcome`, render `recentThreadsSlot` directly instead of mapping `recentThreads`.

---

## Step 5 — Full-page route files (thin compositors)

**`chat.tsx` (layout):**
```typescript
export function ChatLayout() {
  const { teamSlug } = Route.useParams();
  // teamId resolved from teamSlug via existing pattern
  const runtime = useAranduRuntime({ teamId });

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <div className="flex h-full">
        <Suspense fallback={<ThreadListSkeleton />}>
          <ChatSidebar teamId={teamId} />
        </Suspense>
        <Outlet />
      </div>
    </AssistantRuntimeProvider>
  );
}
```

**`ChatSidebar`** (new small component, co-located in route or `features/arandu-chat/ui/`):
- Calls `useThreadList({ teamId, perPage: 20 })`
- Renders `ThreadList` with `renderThreadTrigger` wrapping each item in a `<Link to="/chat/$threadId">`

**`chat/$threadId.tsx`:**
```typescript
export function ChatThreadPage() {
  const { threadId } = Route.useParams();
  const { data: thread } = useSuspenseQuery(
    orpc.chat.getThread.queryOptions({ input: { threadId } }),
  );
  const runtime = useAssistantRuntime();

  useEffect(() => {
    runtime.threads.switchToThread(threadId);
  }, [runtime, threadId]);

  return <Thread />;
}
```

---

## Step 6 — Context panel tab (thin consumer)

**File:** `features/context-panel/ui/arandu-chat-tab.tsx`

```typescript
export function AranduChatTab() {
  const { activeTeamId } = useActiveTeam();
  const runtime = useAranduRuntime({ teamId: activeTeamId });

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <AranduChatTabInner teamId={activeTeamId} />
    </AssistantRuntimeProvider>
  );
}

function AranduChatTabInner({ teamId }: { teamId: string }) {
  return (
    <Thread
      welcomeIconUrl="/arandu.svg"
      recentThreadsSlot={
        <Suspense fallback={<RecentThreadsSkeleton />}>
          <RecentThreadsList teamId={teamId} />
        </Suspense>
      }
    />
  );
}

function RecentThreadsList({ teamId }: { teamId: string }) {
  const threads = useThreadList({ teamId, perPage: 5 });
  const { slug, teamSlug } = Route.useParams();

  return (
    <>
      {threads.map((t) => (
        <Link
          key={t.id}
          to="/$slug/$teamSlug/chat/$threadId"
          params={{ slug, teamSlug, threadId: t.id }}
        >
          {t.title}
        </Link>
      ))}
    </>
  );
}
```

---

## Files to Delete / Clean Up

| File | Action |
|------|--------|
| `features/context-panel/hooks/use-arandu-runtime.ts` | Delete (moved to `features/arandu-chat/hooks/`) |
| `getRecentThreads` export in `orpc/router/chat.ts` | Delete (replaced by `listThreads`) |
| `RecentThread` interface in `thread.tsx` | Delete (no longer needed) |
| `onClick` on thread items | Delete (replaced by `<Link>`) |

---

## Summary

| Concern | Owner |
|---------|-------|
| Thread list data | `use-thread-list.ts` (`useSuspenseQuery`) |
| Runtime + thread switching | `use-arandu-runtime.ts` (`useMutation` for create) |
| Thread metadata (route) | `chat/$threadId.tsx` (`useSuspenseQuery`) |
| Navigation | TanStack Router `<Link>` |
| UI primitives | `features/arandu-chat/ui/` |
| Mastra Memory API | oRPC `chat` router (4 procedures) |
