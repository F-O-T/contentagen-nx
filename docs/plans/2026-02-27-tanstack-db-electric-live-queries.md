# TanStack DB + ElectricSQL Live Queries Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace HTTP-polling queries in the content editor and content list with TanStack DB + Electric live queries for real-time sync from Postgres CDC — eliminating stale data and enabling instant collaboration.

**Architecture:** An authenticated HTTP proxy route (`/api/electric/$`) validates user sessions and team ownership before proxying shape requests to the Electric Sync Engine with server-injected `where` clauses. TanStack DB `ElectricCollection` instances hold synced data client-side and power live `useQuery` subscriptions. oRPC mutations continue handling all writes (credit enforcement, events, webhooks).

**Tech Stack:** `@tanstack/react-db`, `@tanstack/electric-db-collection`, ElectricSQL Sync Engine (self-hosted or Electric Cloud), TanStack Router API routes, Drizzle ORM for proxy auth validation.

**Rollout:**
- Phase 1 — Content list: lowest risk, highest collaboration value
- Phase 2 — Discussions: real-time comment delivery
- Phase 3 — Editor content row: status/meta live updates

---

## Prerequisite: Electric Sync Engine (Infrastructure)

Before running tasks, verify or set up:

```bash
# Self-hosted Electric (Docker)
docker run -e DATABASE_URL=<your-pg-url> -p 3001:3000 electricsql/electric

# Verify Postgres has logical replication enabled (required for CDC)
psql $DATABASE_URL -c "SHOW wal_level;"  # must return "logical"
# If not: ALTER SYSTEM SET wal_level = logical; then restart Postgres
```

Set in `.env.local`:
```
ELECTRIC_URL=http://localhost:3001
```

---

## Task 1: Install packages and add env var

**Files:**
- Modify: `apps/web/package.json`
- Modify: `packages/environment/src/server.ts`

**Step 1: Check current TanStack DB package names and versions**

```bash
npm info @tanstack/react-db version 2>/dev/null || echo "not found"
npm info @tanstack/electric-db-collection version 2>/dev/null || echo "not found"
```

> If packages don't exist under these names, check https://tanstack.com/db for the correct package names. The issue references `@tanstack/react-db` and `@tanstack/electric-db-collection`.

**Step 2: Install packages in apps/web**

```bash
cd /path/to/contentta-nx/apps/web && bun add @tanstack/react-db @tanstack/electric-db-collection
```

Verify both appear in `apps/web/package.json` under `dependencies`.

**Step 3: Add ELECTRIC_URL to server env vars**

In `packages/environment/src/server.ts`, inside the `server:` object, add after `REDIS_URL`:

```typescript
// Electric Sync Engine (Required for live queries feature)
ELECTRIC_URL: z.url().optional().default("http://localhost:3001"),
```

**Step 4: Add ELECTRIC_URL to .env.local**

In `packages/database/.env.local` (or wherever local env vars are stored), add:
```
ELECTRIC_URL=http://localhost:3001
```

**Step 5: Typecheck env**

```bash
bun run typecheck 2>&1 | grep -E "environment|server\.ts" | head -10
```

Expected: no new errors.

**Step 6: Commit**

```bash
git add apps/web/package.json bun.lock packages/environment/src/server.ts
git commit -m "chore: add tanstack-db + electric packages, add ELECTRIC_URL env var"
```

---

## Task 2: Create Electric proxy route (authenticated, team-scoped)

**Files:**
- Create: `apps/web/src/routes/api/electric/$.ts`

This route is the security boundary. The client **never** controls the `where` clause — only `teamId` (for content) or `contentId` (for discussions) are accepted as scoping params. The server validates ownership and injects the SQL `where` clause.

**Step 1: Create the proxy route**

```typescript
// apps/web/src/routes/api/electric/$.ts
import { and, eq } from "drizzle-orm";
import { content } from "@packages/database/schemas/content";
import { team } from "@packages/database/schemas/auth";
import { env } from "@packages/environment/server";
import { createFileRoute } from "@tanstack/react-router";
import { auth, db } from "@/integrations/orpc/server-instances";

const ALLOWED_TABLES = new Set(["content", "discussions"]);

async function handle({
   request,
   params,
}: {
   request: Request;
   params: { _splat: string };
}) {
   // Extract table name from URL path (e.g., /api/electric/content → "content")
   const table = (params._splat ?? "").split("/")[0];
   if (!ALLOWED_TABLES.has(table)) {
      return new Response("Not Found", { status: 404 });
   }

   // Validate authenticated session with active organization
   let session: Awaited<ReturnType<typeof auth.api.getSession>> | null = null;
   try {
      session = await auth.api.getSession({ headers: request.headers });
   } catch {
      session = null;
   }

   if (!session?.session.activeOrganizationId) {
      return new Response("Unauthorized", { status: 401 });
   }

   const url = new URL(request.url);

   // Forward Electric protocol params (cursor, live, offset, shape_handle, columns)
   // but strip our custom scoping params (teamId, contentId)
   const electricParams = new URLSearchParams();
   for (const [key, value] of url.searchParams) {
      if (key !== "teamId" && key !== "contentId") {
         electricParams.set(key, value);
      }
   }
   electricParams.set("table", table);

   if (table === "content") {
      const teamId = url.searchParams.get("teamId");
      if (!teamId) {
         return new Response("teamId query param required", { status: 400 });
      }

      // Verify the teamId belongs to the user's active organization
      const [teamRecord] = await db
         .select({ id: team.id })
         .from(team)
         .where(
            and(
               eq(team.id, teamId),
               eq(team.organizationId, session.session.activeOrganizationId),
            ),
         )
         .limit(1);

      if (!teamRecord) {
         return new Response("Forbidden: team not in your organization", { status: 403 });
      }

      // Server-injected where clause — client cannot override this
      electricParams.set("where", `"team_id" = '${teamId}'`);
   } else if (table === "discussions") {
      const contentId = url.searchParams.get("contentId");
      if (!contentId) {
         return new Response("contentId query param required", { status: 400 });
      }

      // Verify the content belongs to the user's active organization
      const [contentRecord] = await db
         .select({ organizationId: content.organizationId })
         .from(content)
         .where(eq(content.id, contentId))
         .limit(1);

      if (!contentRecord) {
         return new Response("Not Found", { status: 404 });
      }
      if (contentRecord.organizationId !== session.session.activeOrganizationId) {
         return new Response("Forbidden: content not in your organization", { status: 403 });
      }

      electricParams.set("where", `"content_id" = '${contentId}'`);
   }

   // Proxy the request to Electric Sync Engine
   // Pass through the streaming body (SSE / chunked transfer for live mode)
   const electricUrl = `${env.ELECTRIC_URL}/v1/shape?${electricParams}`;
   const electricResponse = await fetch(electricUrl, { cache: "no-store" });

   return new Response(electricResponse.body, {
      status: electricResponse.status,
      headers: electricResponse.headers,
   });
}

export const Route = createFileRoute("/api/electric/$")({
   server: {
      handlers: {
         GET: handle,
         DELETE: handle, // Electric protocol uses DELETE to clean up shape subscriptions
      },
   },
});
```

**Step 2: Typecheck**

```bash
bun run typecheck 2>&1 | grep "electric" | head -20
```

Expected: no errors.

**Step 3: Smoke test — unauthenticated request returns 401**

```bash
# Start dev server first: bun dev
curl -s -o /dev/null -w "%{http_code}" \
  "http://localhost:3000/api/electric/content?teamId=00000000-0000-0000-0000-000000000000"
# Expected: 401
```

**Step 4: Smoke test — invalid table returns 404**

```bash
curl -s -o /dev/null -w "%{http_code}" \
  "http://localhost:3000/api/electric/user"
# Expected: 404
```

**Step 5: Commit**

```bash
git add apps/web/src/routes/api/electric/$.ts
git commit -m "feat(electric): add authenticated Electric proxy route with team/org scoping"
```

---

## Task 3: Create content collection factory

**Files:**
- Create: `apps/web/src/features/content/collections/content-collection.ts`

> **Important:** Electric syncs raw Postgres column names (snake_case). The `ContentRow` type must use snake_case to match actual DB column names, not Drizzle's camelCase field names.

**Step 1: Create the content collection file**

```typescript
// apps/web/src/features/content/collections/content-collection.ts
import { electricCollectionOptions } from "@tanstack/electric-db-collection";
import { createCollection } from "@tanstack/react-db";

// Raw Postgres column names (snake_case) — NOT Drizzle camelCase field names
export type ContentRow = {
   id: string;
   team_id: string;
   organization_id: string;
   writer_id: string | null;
   created_by_member_id: string | null;
   status: "draft" | "published" | "archived";
   meta: Record<string, unknown> | null; // { title, description, slug, keywords }
   body: string | null;
   created_at: string;
   updated_at: string;
};

/**
 * Creates (or reuses) an Electric collection for team-scoped content.
 * TanStack DB deduplicates by id — safe to call multiple times with the same teamId.
 */
export function createContentCollection(teamId: string) {
   return createCollection(
      electricCollectionOptions<ContentRow>({
         id: `content-${teamId}`,
         shapeOptions: {
            url: "/api/electric/content",
            params: { teamId },
         },
         getKey: (item) => item.id,
      }),
   );
}
```

> **Note on API:** If the `electricCollectionOptions` API differs from above (check the installed package's TypeScript types or README), adapt accordingly. The key shape is: `{ id, shapeOptions: { url, params }, getKey }`.

**Step 2: Typecheck**

```bash
bun run typecheck 2>&1 | grep "content-collection" | head -10
```

Expected: no errors.

**Step 3: Commit**

```bash
git add apps/web/src/features/content/collections/content-collection.ts
git commit -m "feat(electric): add content ElectricCollection factory"
```

---

## Task 4: Create discussions collection factory

**Files:**
- Create: `apps/web/src/features/editor/collections/discussions-collection.ts`

**Step 1: Create the discussions collection file**

```typescript
// apps/web/src/features/editor/collections/discussions-collection.ts
import { electricCollectionOptions } from "@tanstack/electric-db-collection";
import { createCollection } from "@tanstack/react-db";

// Raw Postgres column names from the discussions table
export type DiscussionRow = {
   id: string;
   content_id: string;
   block_id: string | null;
   user_id: string;
   document_content: unknown;
   is_resolved: boolean;
   is_ai: boolean;
   created_at: string;
   updated_at: string;
};

/**
 * Creates (or reuses) an Electric collection for discussions scoped to a content item.
 * TanStack DB deduplicates by id — safe to call multiple times with the same contentId.
 */
export function createDiscussionsCollection(contentId: string) {
   return createCollection(
      electricCollectionOptions<DiscussionRow>({
         id: `discussions-${contentId}`,
         shapeOptions: {
            url: "/api/electric/discussions",
            params: { contentId },
         },
         getKey: (item) => item.id,
      }),
   );
}
```

**Step 2: Typecheck**

```bash
bun run typecheck 2>&1 | grep "discussions-collection" | head -10
```

Expected: no errors.

**Step 3: Commit**

```bash
git add apps/web/src/features/editor/collections/discussions-collection.ts
git commit -m "feat(electric): add discussions ElectricCollection factory"
```

---

## Task 5: Phase 1 — Migrate content list to live query

**Files:**
- Modify: `apps/web/src/features/content/ui/content-list-section.tsx`

**Current behavior:** `useSuspenseQuery(orpc.content.listAllContent)` with server-side pagination.
**New behavior:** Electric collection with client-side filtering and pagination. All team content is streamed progressively — real-time updates when collaborators create/archive content.

> **Trade-off:** Server-side pagination is removed in favor of client-side. For large teams (1000+ content items), Electric streams data progressively and filtering happens locally. Stats (total/draft/published/archived) are computed from the locally synced dataset.

**Step 1: Find where teamId is available in this component**

The component uses `useParams` to get `slug` and `teamSlug`. We need the actual team UUID (`teamId`) for the collection. Check what's available:

```bash
# Check the session/team procedures to find how to get active teamId
grep -r "activeTeamId\|getActiveTeam\|teamId" \
  apps/web/src/integrations/orpc/router/session.ts \
  apps/web/src/integrations/orpc/router/team.ts 2>/dev/null | head -20
```

Also check if `teamId` is in the route params or context:

```bash
grep -r "teamId\|activeTeamId" \
  apps/web/src/routes/_authenticated 2>/dev/null | head -10
```

Use whichever source provides the UUID `teamId`. Likely options:
- `session.session.activeTeamId` via a session query
- Route context if passed down from a layout route

**Step 2: Modify content-list-section.tsx**

Add imports at top (after existing imports):

```typescript
import { useQuery as useElectricQuery } from "@tanstack/react-db";
import { createContentCollection } from "../collections/content-collection";
```

Replace the `useSuspenseQuery` for content list with an Electric collection. Find and replace this block:

```typescript
// REMOVE this block:
const queryInput = useMemo(() => { ... }, [pageSize, currentPage, statusFilter]);
const queryOptions = useMemo(
   () => orpc.content.listAllContent.queryOptions({ input: queryInput }),
   [queryInput],
);
const { data, refetch } = useSuspenseQuery(queryOptions);
```

Replace with:

```typescript
// Get teamId — replace this with the actual source in your codebase
// Option A: from a separate session query (keeps one HTTP call)
const { data: sessionData } = useSuspenseQuery(
   orpc.session.getActiveTeam.queryOptions({}),
);
const teamId = sessionData.teamId; // adjust field name as needed

// Option B: pass teamId as a prop from the parent route if available

// Create Electric collection (deduped by teamId)
const collection = useMemo(() => createContentCollection(teamId), [teamId]);

// Live query — updates in real-time when Electric streams changes
const allItems = useElectricQuery(
   collection,
   (q) => statusFilter !== "all" ? q.where("status", "=", statusFilter) : q,
) ?? [];
```

Update `filteredContent` to work on `allItems` (array instead of `data.items`):

```typescript
const filteredContent = useMemo(() => {
   let items = allItems;
   if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter(
         (item) =>
            (item.meta as { title?: string; description?: string } | null)?.title
               ?.toLowerCase()
               .includes(q) ||
            (item.meta as { title?: string; description?: string } | null)?.description
               ?.toLowerCase()
               .includes(q),
      );
   }
   return items;
}, [allItems, searchQuery]);
```

Add client-side pagination:

```typescript
const pageStart = (currentPage - 1) * pageSize;
const paginatedContent = filteredContent.slice(pageStart, pageStart + pageSize);
const totalCount = filteredContent.length;
const totalPages = Math.ceil(totalCount / pageSize);
```

Update stats computation (remove reference to `data.total`):

```typescript
const stats = {
   total: allItems.length,
   draft: allItems.filter((item) => item.status === "draft").length,
   published: allItems.filter((item) => item.status === "published").length,
   archived: allItems.filter((item) => item.status === "archived").length,
};
```

Update DataTable to use `paginatedContent` and computed pagination:

```typescript
<DataTable
   columns={columns}
   data={paginatedContent}  // was: filteredContent
   ...
   pagination={{
      currentPage,
      onPageChange: setCurrentPage,
      onPageSizeChange: setPageSize,
      pageSize,
      totalCount,      // was: data.total
      totalPages,      // was: data.totalPages
   }}
   ...
/>
```

Remove `refetch()` calls from mutation `onSuccess` callbacks — Electric will sync updates automatically. Keep the `toast` calls.

**Step 3: Update the `ContentItem` type if needed**

The DataTable expects `ContentItem` type. Check `content-table-columns.tsx` for the current type definition and ensure `ContentRow` (snake_case) is compatible or adapt the column accessors.

```bash
cat apps/web/src/features/content/ui/content-table-columns.tsx | head -30
```

If `ContentItem` uses camelCase (from oRPC response), you may need to map `ContentRow` (snake_case from Electric) to camelCase for the table. Add a mapper:

```typescript
function mapContentRow(row: ContentRow): ContentItem {
   return {
      id: row.id,
      teamId: row.team_id,
      status: row.status,
      meta: (row.meta as ContentItem["meta"]) ?? { title: "", description: "", slug: "" },
      // add other fields as needed by ContentItem
   };
}
```

Then: `const allItems = (rawItems ?? []).map(mapContentRow);`

**Step 4: Typecheck**

```bash
bun run typecheck 2>&1 | grep "content-list\|ContentItem\|ContentRow" | head -20
```

Fix type errors iteratively.

**Step 5: Manual test**

1. Start dev server (`bun dev`)
2. Open content list in browser tab A
3. Open content list in browser tab B
4. In tab B: create a new content item
5. Verify it appears in tab A **without any manual refresh**

**Step 6: Commit**

```bash
git add apps/web/src/features/content/ui/content-list-section.tsx
git commit -m "feat(electric): migrate content list to Electric live query (Phase 1)"
```

---

## Task 6: Phase 2 — Migrate discussions to live query

**Files:**
- Modify: `apps/web/src/features/editor/hooks/use-editor-discussions.ts`

**Current behavior:** `useQuery` with 30s staleTime — collaborators' comments appear after up to 30 seconds.
**New behavior:** Electric live subscription — new discussions appear instantly.

> **Hybrid approach:** Electric handles the `discussions` table rows (creation, resolution status). User data (`users` map) is still fetched via the existing oRPC query for initial load — Electric does not sync the `user` table. The discussion *replies* are not in the `discussions` table; they are in `discussion_replies`. Phase 2 handles the top-level discussions only; replies continue via oRPC (or can be added as a third Electric collection in a follow-up).

**Step 1: Understand the users dependency**

The current hook returns `data?.users` — a map of `userId → user info`. Components displaying discussion threads use this for avatars/names.

```bash
grep -rn "\.users\b\|users\[" apps/web/src/features/editor/ --include="*.tsx" | head -10
```

After checking, if `users` is needed for rendering, keep the existing oRPC query **only for user data**. The Electric collection replaces the discussion list.

**Step 2: Modify use-editor-discussions.ts**

```typescript
// apps/web/src/features/editor/hooks/use-editor-discussions.ts
import { useMutation, useQuery } from "@tanstack/react-query";
import { useQuery as useElectricQuery } from "@tanstack/react-db";
import { useMemo } from "react";
import { orpc } from "@/integrations/orpc/client";
import { createDiscussionsCollection } from "../collections/discussions-collection";

export function useEditorDiscussions(contentId: string | undefined) {
   // Electric collection for live discussion rows
   const collection = useMemo(
      () => (contentId ? createDiscussionsCollection(contentId) : null),
      [contentId],
   );

   // Live query over Electric — updates instantly when collaborators add/resolve discussions
   // Returns [] when collection is null (contentId undefined) or still loading initial sync
   // biome-ignore lint/style/noNonNullAssertion: guarded by collection null check
   const liveDiscussionRows = collection
      ? useElectricQuery(collection, (q) => q.orderBy("created_at", "asc"))
      : [];

   // Keep oRPC query for user data only (Electric doesn't sync the user table)
   // staleTime: Infinity since users don't change frequently in a session
   const { data } = useQuery({
      ...orpc.discussions.getByContent.queryOptions({
         input: { contentId: contentId as string },
         staleTime: Number.POSITIVE_INFINITY, // only refetch when invalidated
      }),
      enabled: !!contentId,
   });

   const createMutation = useMutation(
      orpc.discussions.create.mutationOptions(),
   );
   const addReplyMutation = useMutation(
      orpc.discussions.addReply.mutationOptions(),
   );
   const resolveMutation = useMutation(
      orpc.discussions.resolve.mutationOptions(),
   );
   const removeMutation = useMutation(
      orpc.discussions.remove.mutationOptions(),
   );
   const updateReplyMutation = useMutation(
      orpc.discussions.updateReply.mutationOptions(),
   );
   const removeReplyMutation = useMutation(
      orpc.discussions.removeReply.mutationOptions(),
   );

   return {
      // Use Electric rows as source of truth for discussion list
      // Fall back to oRPC data if Electric hasn't synced yet
      discussions:
         (liveDiscussionRows ?? []).length > 0
            ? liveDiscussionRows ?? []
            : data?.discussions ?? [],
      users: data?.users ?? {}, // Still from oRPC — user data isn't in Electric
      mutations: {
         create: createMutation,
         addReply: addReplyMutation,
         resolve: resolveMutation,
         remove: removeMutation,
         updateReply: updateReplyMutation,
         removeReply: removeReplyMutation,
      },
   };
}
```

> **Note on `useElectricQuery` in conditional:** The `collection ? useElectricQuery(...)` pattern above violates React's Rules of Hooks (hooks can't be called conditionally). Fix this by either:
> 1. Always calling `useElectricQuery` with a stable dummy collection when `contentId` is undefined
> 2. Or extracting the hook call to always run and pass an empty query when not enabled
>
> Check `@tanstack/react-db`'s `useQuery` API for an `enabled` option. If it exists, use:
> ```typescript
> const liveRows = useElectricQuery(
>   collection ?? dummyCollection,
>   (q) => q,
>   { enabled: !!collection }
> );
> ```
> If no `enabled` option exists, create a module-level no-op collection as fallback.

**Step 3: Typecheck**

```bash
bun run typecheck 2>&1 | grep "use-editor-discussions" | head -20
```

Fix any type mismatches between `DiscussionRow` (snake_case from Electric) and the `discussion` type consumed by rendering components.

**Step 4: Manual test**

1. Open the editor for a content item in two browser tabs
2. In tab A: add a discussion comment
3. Verify the comment appears in tab B **without any refresh**

**Step 5: Commit**

```bash
git add apps/web/src/features/editor/hooks/use-editor-discussions.ts
git commit -m "feat(electric): migrate discussions to Electric live query (Phase 2)"
```

---

## Task 7: Phase 3 — Migrate editor content row to live query

**Files:**
- Modify: `apps/web/src/features/editor/ui/editor-page.tsx`
- Modify: `apps/web/src/routes/_authenticated/$slug/$teamSlug/_dashboard/$contentId.tsx`

**Current behavior:** `useSuspenseQuery` loads content once. Status/meta changes from other users only appear after manual refresh.
**New behavior:** Electric live subscription updates status and meta fields in real-time.

> **Design decision:** The editor body (`content.body`) is managed locally by PlateJS via `editorValueRef`. Body sync is NOT real-time (full collaborative editing is out of scope). The live query is used for:
> - Status changes (draft/published/archived) from collaborators or background jobs
> - Meta changes (title, slug, description) from other sessions
> - Initial load fallback: HTTP query is kept as fallback until Electric syncs

**Step 1: Update EditorPage to accept teamId prop**

The content collection needs `teamId`. The route currently prefetches `getById` which returns `teamId`. Pass it through:

In `apps/web/src/routes/_authenticated/$slug/$teamSlug/_dashboard/$contentId.tsx`:

```typescript
// The route component already prefetches content.
// Read teamId from the prefetched data and pass to EditorPage:
function EditorRoute() {
   const { contentId } = Route.useParams();
   const queryClient = Route.useRouteContext({ select: (c) => c.queryClient });

   // Get teamId from the already-prefetched content (no extra HTTP call)
   const prefetchedContent = queryClient.getQueryData(
      orpc.content.getById.queryOptions({ input: { id: contentId } }).queryKey,
   );
   const teamId = (prefetchedContent as { teamId?: string } | undefined)?.teamId ?? "";

   return (
      <ErrorBoundary FallbackComponent={EditorErrorFallback}>
         <Suspense fallback={<EditorSkeleton />}>
            <EditorPage contentId={contentId} teamId={teamId} />
         </Suspense>
      </ErrorBoundary>
   );
}
```

> **Alternative:** If accessing the query cache from the route is awkward, pass `teamId` as a route search param or use TanStack Router's `context` to provide it. The simplest approach that matches the codebase patterns is preferred.

**Step 2: Modify editor-page.tsx**

Add imports:

```typescript
import { useQuery as useElectricQuery } from "@tanstack/react-db";
import { createContentCollection } from "@/features/content/collections/content-collection";
```

Update the component signature to accept `teamId`:

```typescript
interface EditorPageProps {
   contentId: string;
   teamId: string;
}

export function EditorPage({ contentId, teamId }: EditorPageProps) {
```

Add Electric collection and live query (after the component function opens):

```typescript
// Electric collection for the team's content (shared with content list if open)
const collection = useMemo(
   () => (teamId ? createContentCollection(teamId) : null),
   [teamId],
);

// Live query for this specific content row — updates on status/meta changes
const liveContent = collection
   ? useElectricQuery(collection, (q) => q.where("id", "=", contentId).first())
   : null;

// HTTP fallback — keep until Electric initial sync is complete
// (Suspense boundary above handles the loading state)
const { data: httpContent } = useSuspenseQuery(
   orpc.content.getById.queryOptions({ input: { id: contentId } }),
);

// Prefer live Electric data; fall back to HTTP data during initial sync
const content = liveContent ?? httpContent;
```

> **Hook ordering issue:** Same as Task 6 — `collection ? useElectricQuery(...)` is conditional. Resolve with an `enabled` option or a stable fallback collection. Check `@tanstack/react-db` API first.

**Step 3: Handle status and meta reactivity**

The `meta` state is initialized from `content` in a `useState`. With live content, meta updates from other users won't be reflected until the user refreshes. To handle this, sync incoming status changes:

```typescript
// Sync status from live content changes (other users publishing/archiving)
// This is a read-only sync — local edits still go through mutations
const liveStatus = (liveContent?.status ?? httpContent.status) as ContentStatus;
```

Pass `liveStatus` to `PlateEditor` instead of `content.status`:

```typescript
<PlateEditor
   ...
   editable={liveStatus !== "archived"}   // was: content.status !== "archived"
   status={liveStatus}                    // was: content.status as ContentStatus
   ...
/>
```

**Step 4: Typecheck**

```bash
bun run typecheck 2>&1 | grep "editor-page\|EditorPage" | head -20
```

Fix any type errors (most likely: `teamId` prop missing in call sites, or `ContentRow` field access).

**Step 5: Manual test**

1. Open editor in two tabs for the same content
2. In tab A: publish the content (via the status dropdown)
3. Verify tab B's toolbar status indicator updates to "Published" **without a refresh**
4. Test: archive from tab A → verify tab B shows the archived state and editor becomes non-editable

**Step 6: Commit**

```bash
git add \
  apps/web/src/features/editor/ui/editor-page.tsx \
  apps/web/src/routes/_authenticated/\$slug/\$teamSlug/_dashboard/\$contentId.tsx
git commit -m "feat(electric): migrate editor content row to Electric live query (Phase 3)"
```

---

## Final Verification

```bash
# TypeScript (all packages)
bun run typecheck

# Lint
bun run check

# Tests
bun run test
```

---

## Known Limitations & Follow-up Work

1. **Body conflicts:** Two users editing the body simultaneously see last-write-wins on save. Full collaborative body editing (CRDT/OT) is out of scope for this issue.

2. **Discussion replies:** The `discussion_replies` table is NOT synced via Electric in Phase 2. Replies still come from oRPC. A follow-up can add a 4th Electric collection for replies (needs `content_id` denormalized on the replies table for efficient where-clause scoping, or proxy filtering via a JOIN).

3. **Users map in discussions:** `useEditorDiscussions` still fetches user data via oRPC. A follow-up can add a user info cache keyed by userId.

4. **Offline/persistence:** Electric collections are ephemeral (in-memory). On page reload, Electric re-syncs from scratch. Persistence via IndexedDB requires additional Electric client config.

5. **Electric infra:** Requires a separate Electric Sync Engine process and Postgres with `wal_level = logical`. Coordinate infra setup with ops team for production deployment.

6. **Collection hook rules:** The `useElectricQuery` conditional call (guarded by `collection !== null`) violates React's Rules of Hooks. Resolve by checking the `@tanstack/react-db` API for an `enabled` option or by always creating a dummy collection when `contentId`/`teamId` is empty.
