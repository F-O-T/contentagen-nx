# Comment & Suggestion Plugins — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Integrate Plate.js CommentPlugin + SuggestionPlugin with persistent backend storage and Mastra AI tools, replacing the mock in-memory discussion data with real oRPC-backed persistence.

**Architecture:**
The Plate.js `@packages/ui` already ships `comment-kit.tsx`, `suggestion-kit.tsx`, `discussion-kit.tsx`, `comment.tsx`, and `block-discussion.tsx` — all wired with in-memory mock data. The integration work is: (1) creating DB tables + repository + oRPC router for discussions, (2) extending the discussion plugin options with persistence callbacks, (3) wiring `PlateEditor` to load real data and pass mutations, and (4) adding Mastra tools so the AI agent can create comments and propose suggestions.

**Tech Stack:** Drizzle ORM, oRPC (`protectedProcedure`), React hooks (`useSuspenseQuery`/`useMutation`), Plate.js plugin options, Mastra `createTool`

---

## Context Mapping

Before touching code, understand these files:

| File | Role |
|------|------|
| `packages/ui/src/components/editor/plugins/discussion-kit.tsx` | Plate plugin storing `discussions[]`, `users{}`, `currentUserId` — currently hardcoded mock |
| `packages/ui/src/components/comment.tsx` | `CommentCreateForm` + `Comment` — mutate in-memory via `editor.setOption(discussionPlugin, 'discussions', ...)` |
| `packages/ui/src/components/block-discussion.tsx` | Block-level popover UI rendering discussions/suggestions inline |
| `packages/ui/src/components/editor/plugins/comment-kit.tsx` | `CommentKit` — `Mod+Shift+M` to mark draft comment |
| `packages/ui/src/components/editor/plugins/suggestion-kit.tsx` | `SuggestionKit` — track-changes leaf rendering |
| `apps/web/src/features/editor/plate/plate-editor.tsx` | `PlateEditor` — only has BasicBlocksPlugin, BasicMarksPlugin, LinkPlugin, AIKit, CopilotKit currently |

**TDiscussion shape** (from `discussion-kit.tsx`):
```typescript
type TDiscussion = {
  id: string;
  comments: TComment[];
  createdAt: Date;
  isResolved: boolean;
  userId: string;
  documentContent?: string;
};
// TComment (from comment.tsx):
type TComment = {
  id: string;
  contentRich: Value;  // Plate editor Value (rich text JSON)
  createdAt: Date;
  discussionId: string;
  isEdited: boolean;
  userId: string;
};
```

**User shape** (from `discussion-kit.tsx`):
```typescript
{ id: string; avatarUrl: string; name: string; hue?: number }
```

---

## Task 1: DB Schema — discussions + discussion_replies

**Files:**
- Create: `packages/database/src/schemas/discussions.ts`
- Modify: `packages/database/src/schema.ts` (add export)

**Step 1: Write the failing typecheck**

In `packages/database/src/schemas/discussions.ts` write:

```typescript
import { boolean, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { content } from "./content";

export const discussions = pgTable("discussions", {
  id: uuid("id").defaultRandom().primaryKey(),
  contentId: uuid("content_id")
    .notNull()
    .references(() => content.id, { onDelete: "cascade" }),
  blockId: text("block_id").notNull(),
  userId: text("user_id").notNull(),
  documentContent: text("document_content"),
  isResolved: boolean("is_resolved").notNull().default(false),
  isAi: boolean("is_ai").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const discussionReplies = pgTable("discussion_replies", {
  id: uuid("id").defaultRandom().primaryKey(),
  discussionId: uuid("discussion_id")
    .notNull()
    .references(() => discussions.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull(),
  contentRich: jsonb("content_rich").notNull(),
  isEdited: boolean("is_edited").notNull().default(false),
  isAi: boolean("is_ai").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Discussion = typeof discussions.$inferSelect;
export type NewDiscussion = typeof discussions.$inferInsert;
export type DiscussionReply = typeof discussionReplies.$inferSelect;
export type NewDiscussionReply = typeof discussionReplies.$inferInsert;
```

**Step 2: Register in schema.ts**

Add to `packages/database/src/schema.ts` (alphabetical order near `dashboards`):
```typescript
// Discussions
export * from "./schemas/discussions";
```

**Step 3: Run typecheck**

```bash
cd /home/yorizel/Documents/contentta-nx && bun run typecheck 2>&1 | grep -E "discussions|error" | head -20
```
Expected: no errors from discussions.ts

**Step 4: Push schema to DB**

```bash
cd /home/yorizel/Documents/contentta-nx && bun run db:push
```
Expected: "discussions" and "discussion_replies" tables created.

**Step 5: Commit**

```bash
git add packages/database/src/schemas/discussions.ts packages/database/src/schema.ts
git commit -m "feat(db): add discussions and discussion_replies schema"
```

---

## Task 2: Repository — discussion-repository.ts

**Files:**
- Create: `packages/database/src/repositories/discussion-repository.ts`

**Step 1: Write the file**

```typescript
import { AppError, propagateError } from "@packages/utils/errors";
import { and, asc, desc, eq } from "drizzle-orm";
import type { DatabaseInstance } from "../client";
import {
  type NewDiscussion,
  type NewDiscussionReply,
  discussionReplies,
  discussions,
} from "../schemas/discussions";

// ─── Discussions ─────────────────────────────────────────────────────────────

export async function createDiscussion(
  db: DatabaseInstance,
  data: Omit<NewDiscussion, "id" | "createdAt">,
) {
  try {
    const [discussion] = await db.insert(discussions).values(data).returning();
    return discussion;
  } catch (err) {
    propagateError(err);
    throw AppError.database("Failed to create discussion");
  }
}

export async function getDiscussionsByContent(
  db: DatabaseInstance,
  contentId: string,
) {
  try {
    const rows = await db
      .select()
      .from(discussions)
      .where(and(eq(discussions.contentId, contentId), eq(discussions.isResolved, false)))
      .orderBy(asc(discussions.createdAt));

    if (rows.length === 0) return [];

    const discussionIds = rows.map((d) => d.id);
    const replies = await db
      .select()
      .from(discussionReplies)
      .where(
        discussionIds.length === 1
          ? eq(discussionReplies.discussionId, discussionIds[0])
          : // biome-ignore lint/suspicious/noExplicitAny: drizzle inList workaround
            (discussionReplies.discussionId as any).in(discussionIds),
      )
      .orderBy(asc(discussionReplies.createdAt));

    return rows.map((d) => ({
      ...d,
      comments: replies.filter((r) => r.discussionId === d.id),
    }));
  } catch (err) {
    propagateError(err);
    throw AppError.database("Failed to get discussions by content");
  }
}

export async function getDiscussion(db: DatabaseInstance, id: string) {
  try {
    const [discussion] = await db
      .select()
      .from(discussions)
      .where(eq(discussions.id, id))
      .limit(1);
    return discussion ?? null;
  } catch (err) {
    propagateError(err);
    throw AppError.database("Failed to get discussion");
  }
}

export async function resolveDiscussion(db: DatabaseInstance, id: string) {
  try {
    const [updated] = await db
      .update(discussions)
      .set({ isResolved: true })
      .where(eq(discussions.id, id))
      .returning();
    return updated;
  } catch (err) {
    propagateError(err);
    throw AppError.database("Failed to resolve discussion");
  }
}

export async function deleteDiscussion(db: DatabaseInstance, id: string) {
  try {
    await db.delete(discussions).where(eq(discussions.id, id));
  } catch (err) {
    propagateError(err);
    throw AppError.database("Failed to delete discussion");
  }
}

// ─── Replies ─────────────────────────────────────────────────────────────────

export async function addDiscussionReply(
  db: DatabaseInstance,
  data: Omit<NewDiscussionReply, "id" | "createdAt">,
) {
  try {
    const [reply] = await db
      .insert(discussionReplies)
      .values(data)
      .returning();
    return reply;
  } catch (err) {
    propagateError(err);
    throw AppError.database("Failed to add discussion reply");
  }
}

export async function updateDiscussionReply(
  db: DatabaseInstance,
  id: string,
  contentRich: unknown,
) {
  try {
    const [updated] = await db
      .update(discussionReplies)
      .set({ contentRich, isEdited: true })
      .where(eq(discussionReplies.id, id))
      .returning();
    return updated;
  } catch (err) {
    propagateError(err);
    throw AppError.database("Failed to update discussion reply");
  }
}

export async function deleteDiscussionReply(db: DatabaseInstance, id: string) {
  try {
    await db.delete(discussionReplies).where(eq(discussionReplies.id, id));
  } catch (err) {
    propagateError(err);
    throw AppError.database("Failed to delete discussion reply");
  }
}

export async function getDiscussionReply(db: DatabaseInstance, id: string) {
  try {
    const [reply] = await db
      .select()
      .from(discussionReplies)
      .where(eq(discussionReplies.id, id))
      .limit(1);
    return reply ?? null;
  } catch (err) {
    propagateError(err);
    throw AppError.database("Failed to get discussion reply");
  }
}
```

**Note on `inList`:** The `getDiscussionsByContent` uses a workaround for multiple IDs because Drizzle's `inArray` import: use `import { inArray } from "drizzle-orm"` and replace the ternary with `inArray(discussionReplies.discussionId, discussionIds)`.

**Corrected version of getDiscussionsByContent (use this)**:
```typescript
import { and, asc, eq, inArray } from "drizzle-orm";

// Inside getDiscussionsByContent:
const replies = await db
  .select()
  .from(discussionReplies)
  .where(inArray(discussionReplies.discussionId, discussionIds))
  .orderBy(asc(discussionReplies.createdAt));
```

**Step 2: Run typecheck**

```bash
cd /home/yorizel/Documents/contentta-nx && bun run typecheck 2>&1 | grep "discussion-repository" | head -20
```
Expected: no errors.

**Step 3: Commit**

```bash
git add packages/database/src/repositories/discussion-repository.ts
git commit -m "feat(db): add discussion repository"
```

---

## Task 3: oRPC Router — discussions.ts

**Files:**
- Create: `apps/web/src/integrations/orpc/router/discussions.ts`
- Modify: `apps/web/src/integrations/orpc/router/index.ts`

**Step 1: Write the router**

The router needs to:
- `getByContent({ contentId })` — verify content belongs to org, return discussions + users map fetched from auth
- `create({ contentId, blockId, contentRich, documentContent? })` — create discussion + first reply
- `addReply({ discussionId, contentRich })` — add reply to existing discussion
- `resolve({ discussionId })` — mark resolved (verify ownership)
- `updateReply({ replyId, contentRich })` — edit a reply (verify ownership)
- `deleteReply({ replyId })` — delete a reply (verify ownership)
- `deleteDiscussion({ discussionId })` — delete entire discussion (verify ownership)

```typescript
import { ORPCError } from "@orpc/server";
import {
  addDiscussionReply,
  createDiscussion,
  deleteDiscussion,
  deleteDiscussionReply,
  getDiscussion,
  getDiscussionReply,
  getDiscussionsByContent,
  resolveDiscussion,
  updateDiscussionReply,
} from "@packages/database/repositories/discussion-repository";
import { getContentById } from "@packages/database/repositories/content-repository";
import { z } from "zod";
import { protectedProcedure } from "../server";

const contentRichSchema = z.array(z.record(z.string(), z.unknown()));

// ─────────────────────────────────────────────────────────────────────────────

export const getByContent = protectedProcedure
  .input(z.object({ contentId: z.string().uuid() }))
  .handler(async ({ context, input }) => {
    const { db, organizationId } = context;

    const content = await getContentById(db, input.contentId);
    if (!content || content.organizationId !== organizationId) {
      throw new ORPCError("NOT_FOUND", { message: "Conteúdo não encontrado." });
    }

    const rows = await getDiscussionsByContent(db, input.contentId);

    // Collect unique userIds to build users map
    const userIds = [...new Set(rows.flatMap((d) => [
      d.userId,
      ...d.comments.map((c) => c.userId),
    ]))];

    // Fetch user info from Better Auth via db
    const userRows = userIds.length > 0
      ? await db
          .select({ id: db._.fullSchema.user.id, name: db._.fullSchema.user.name, image: db._.fullSchema.user.image })
          .from(db._.fullSchema.user)
          .where(
            userIds.length === 1
              ? eq(db._.fullSchema.user.id, userIds[0])
              : inArray(db._.fullSchema.user.id, userIds),
          )
      : [];

    const users = Object.fromEntries(
      userRows.map((u) => [
        u.id,
        {
          id: u.id,
          name: u.name ?? "Unknown",
          avatarUrl: u.image ?? `https://api.dicebear.com/9.x/glass/svg?seed=${u.id}`,
        },
      ]),
    );

    return { discussions: rows, users };
  });

export const create = protectedProcedure
  .input(
    z.object({
      contentId: z.string().uuid(),
      blockId: z.string(),
      contentRich: contentRichSchema,
      documentContent: z.string().optional(),
    }),
  )
  .handler(async ({ context, input }) => {
    const { db, organizationId, userId } = context;

    const content = await getContentById(db, input.contentId);
    if (!content || content.organizationId !== organizationId) {
      throw new ORPCError("NOT_FOUND", { message: "Conteúdo não encontrado." });
    }

    const discussion = await createDiscussion(db, {
      contentId: input.contentId,
      blockId: input.blockId,
      userId,
      documentContent: input.documentContent,
    });

    const reply = await addDiscussionReply(db, {
      discussionId: discussion.id,
      userId,
      contentRich: input.contentRich,
    });

    return { discussion, reply };
  });

export const addReply = protectedProcedure
  .input(
    z.object({
      discussionId: z.string().uuid(),
      contentRich: contentRichSchema,
    }),
  )
  .handler(async ({ context, input }) => {
    const { db, userId } = context;

    const discussion = await getDiscussion(db, input.discussionId);
    if (!discussion) {
      throw new ORPCError("NOT_FOUND", { message: "Discussão não encontrada." });
    }

    const reply = await addDiscussionReply(db, {
      discussionId: input.discussionId,
      userId,
      contentRich: input.contentRich,
    });

    return reply;
  });

export const resolve = protectedProcedure
  .input(z.object({ discussionId: z.string().uuid() }))
  .handler(async ({ context, input }) => {
    const { db, userId } = context;

    const discussion = await getDiscussion(db, input.discussionId);
    if (!discussion) {
      throw new ORPCError("NOT_FOUND", { message: "Discussão não encontrada." });
    }
    if (discussion.userId !== userId) {
      throw new ORPCError("FORBIDDEN", { message: "Apenas o autor pode resolver a discussão." });
    }

    const updated = await resolveDiscussion(db, input.discussionId);
    return updated;
  });

export const remove = protectedProcedure
  .input(z.object({ discussionId: z.string().uuid() }))
  .handler(async ({ context, input }) => {
    const { db, userId } = context;

    const discussion = await getDiscussion(db, input.discussionId);
    if (!discussion) {
      throw new ORPCError("NOT_FOUND", { message: "Discussão não encontrada." });
    }
    if (discussion.userId !== userId) {
      throw new ORPCError("FORBIDDEN", { message: "Sem permissão." });
    }

    await deleteDiscussion(db, input.discussionId);
    return { success: true };
  });

export const updateReply = protectedProcedure
  .input(
    z.object({
      replyId: z.string().uuid(),
      contentRich: contentRichSchema,
    }),
  )
  .handler(async ({ context, input }) => {
    const { db, userId } = context;

    const reply = await getDiscussionReply(db, input.replyId);
    if (!reply) {
      throw new ORPCError("NOT_FOUND", { message: "Resposta não encontrada." });
    }
    if (reply.userId !== userId) {
      throw new ORPCError("FORBIDDEN", { message: "Sem permissão." });
    }

    return await updateDiscussionReply(db, input.replyId, input.contentRich);
  });

export const removeReply = protectedProcedure
  .input(z.object({ replyId: z.string().uuid() }))
  .handler(async ({ context, input }) => {
    const { db, userId } = context;

    const reply = await getDiscussionReply(db, input.replyId);
    if (!reply) {
      throw new ORPCError("NOT_FOUND", { message: "Resposta não encontrada." });
    }
    if (reply.userId !== userId) {
      throw new ORPCError("FORBIDDEN", { message: "Sem permissão." });
    }

    await deleteDiscussionReply(db, input.replyId);
    return { success: true };
  });
```

**Important note on `db._.fullSchema`:** Accessing Better Auth user table via Drizzle requires importing it. Check how other routers access the `user` table. Look at `auth-repository.ts` — it likely imports from `@packages/database/schemas/auth`. Use that pattern instead of `db._.fullSchema`. If the `user` table is exported from auth schema, do:

```typescript
import { user } from "@packages/database/schemas/auth";
// then: db.select(...).from(user).where(...)
```

**Step 2: Register in router index**

In `apps/web/src/integrations/orpc/router/index.ts`, add:
```typescript
import * as discussionsRouter from "./discussions";
// In export default:
discussions: discussionsRouter,
```

**Step 3: Run typecheck**

```bash
cd /home/yorizel/Documents/contentta-nx && bun run typecheck 2>&1 | grep -E "discussions|error TS" | head -30
```
Expected: no errors.

**Step 4: Commit**

```bash
git add apps/web/src/integrations/orpc/router/discussions.ts apps/web/src/integrations/orpc/router/index.ts
git commit -m "feat(api): add discussions oRPC router"
```

---

## Task 4: Extend discussionPlugin with persistence callbacks

**Files:**
- Modify: `packages/ui/src/components/editor/plugins/discussion-kit.tsx`

**Goal:** Add optional callback hooks to the plugin options. The `comment.tsx` will call these after in-memory updates so the app layer can persist to the backend.

**Step 1: Read the current file first, then modify**

Replace the hardcoded mock data with empty defaults and add callback types:

```typescript
'use client';

import type { Value } from 'platejs';
import type { TComment } from '@packages/ui/components/comment';

import { createPlatePlugin } from 'platejs/react';

import { BlockDiscussion } from '@packages/ui/components/block-discussion';

export type TDiscussion = {
  id: string;
  comments: TComment[];
  createdAt: Date;
  isResolved: boolean;
  userId: string;
  documentContent?: string;
};

export type DiscussionUser = {
  id: string;
  avatarUrl: string;
  name: string;
  hue?: number;
};

export type DiscussionCallbacks = {
  onCreateDiscussion?: (discussion: TDiscussion) => Promise<void>;
  onAddReply?: (discussionId: string, reply: TComment) => Promise<void>;
  onResolveDiscussion?: (discussionId: string) => Promise<void>;
  onRemoveDiscussion?: (discussionId: string) => Promise<void>;
  onUpdateComment?: (commentId: string, contentRich: Value) => Promise<void>;
  onDeleteComment?: (commentId: string, discussionId: string) => Promise<void>;
};

export const discussionPlugin = createPlatePlugin({
  key: 'discussion',
  options: {
    currentUserId: '' as string,
    discussions: [] as TDiscussion[],
    users: {} as Record<string, DiscussionUser>,
    // Persistence callbacks — injected by the app layer
    callbacks: {} as DiscussionCallbacks,
  },
})
  .configure({
    render: { aboveNodes: BlockDiscussion },
  })
  .extendSelectors(({ getOption }) => ({
    currentUser: () => getOption('users')[getOption('currentUserId')],
    user: (id: string) => getOption('users')[id],
  }));

export const DiscussionKit = [discussionPlugin];
```

**Step 2: Run typecheck**

```bash
cd /home/yorizel/Documents/contentta-nx && bun run typecheck 2>&1 | grep "discussion-kit\|TDiscussion\|DiscussionUser" | head -20
```
Expected: no errors.

**Step 3: Commit**

```bash
git add packages/ui/src/components/editor/plugins/discussion-kit.tsx
git commit -m "feat(ui): extend discussionPlugin with persistence callbacks + empty defaults"
```

---

## Task 5: Wire callbacks in comment.tsx

**Files:**
- Modify: `packages/ui/src/components/comment.tsx`

**Goal:** After each in-memory mutation, call the corresponding callback from `discussionPlugin.options.callbacks` (if set). This keeps the UI layer decoupled from any specific API.

**Step 1: Read the file, then apply these targeted changes**

In `Comment` component, modify the `resolveDiscussion` function:
```typescript
const resolveDiscussion = async (id: string) => {
  const updatedDiscussions = editor
    .getOption(discussionPlugin, 'discussions')
    .map((discussion) => {
      if (discussion.id === id) {
        return { ...discussion, isResolved: true };
      }
      return discussion;
    });
  editor.setOption(discussionPlugin, 'discussions', updatedDiscussions);
  // Persist
  const callbacks = editor.getOption(discussionPlugin, 'callbacks');
  await callbacks.onResolveDiscussion?.(id);
};
```

Modify `removeDiscussion`:
```typescript
const removeDiscussion = async (id: string) => {
  const updatedDiscussions = editor
    .getOption(discussionPlugin, 'discussions')
    .filter((discussion) => discussion.id !== id);
  editor.setOption(discussionPlugin, 'discussions', updatedDiscussions);
  // Persist
  const callbacks = editor.getOption(discussionPlugin, 'callbacks');
  await callbacks.onRemoveDiscussion?.(id);
};
```

Modify `updateComment`:
```typescript
const updateComment = async (input: {
  id: string;
  contentRich: Value;
  discussionId: string;
  isEdited: boolean;
}) => {
  const updatedDiscussions = editor
    .getOption(discussionPlugin, 'discussions')
    .map((discussion) => {
      if (discussion.id === input.discussionId) {
        const updatedComments = discussion.comments.map((comment) => {
          if (comment.id === input.id) {
            return {
              ...comment,
              contentRich: input.contentRich,
              isEdited: true,
            };
          }
          return comment;
        });
        return { ...discussion, comments: updatedComments };
      }
      return discussion;
    });
  editor.setOption(discussionPlugin, 'discussions', updatedDiscussions);
  // Persist
  const callbacks = editor.getOption(discussionPlugin, 'callbacks');
  await callbacks.onUpdateComment?.(input.id, input.contentRich);
};
```

In `CommentMoreDropdown.onDeleteComment`:
```typescript
const onDeleteComment = React.useCallback(() => {
  if (!comment.id)
    return alert('You are operating too quickly, please try again later.');

  const updatedDiscussions = editor
    .getOption(discussionPlugin, 'discussions')
    .map((discussion) => {
      if (discussion.id !== comment.discussionId) {
        return discussion;
      }
      const commentIndex = discussion.comments.findIndex(
        (c) => c.id === comment.id
      );
      if (commentIndex === -1) return discussion;
      return {
        ...discussion,
        comments: [
          ...discussion.comments.slice(0, commentIndex),
          ...discussion.comments.slice(commentIndex + 1),
        ],
      };
    });

  editor.setOption(discussionPlugin, 'discussions', updatedDiscussions);
  onRemoveComment?.();

  // Persist
  const callbacks = editor.getOption(discussionPlugin, 'callbacks');
  void callbacks.onDeleteComment?.(comment.id, comment.discussionId);
}, [comment.discussionId, comment.id, editor, onRemoveComment]);
```

In `CommentCreateForm.onAddComment`, after the `editor.setOption(discussionPlugin, 'discussions', ...)` calls, add the callbacks. There are three branches:

1. **New discussion (no discussionIdProp)** — after `editor.setOption(...)` and marking nodes:
```typescript
const callbacks = editor.getOption(discussionPlugin, 'callbacks');
await callbacks.onCreateDiscussion?.(newDiscussion);
```

2. **Adding reply to existing** — after `editor.setOption(...)`:
```typescript
const callbacks = editor.getOption(discussionPlugin, 'callbacks');
await callbacks.onAddReply?.(discussionId, comment);
```

3. **First comment on suggestion (discussion not found)** — after `editor.setOption(...)`:
```typescript
const callbacks = editor.getOption(discussionPlugin, 'callbacks');
await callbacks.onCreateDiscussion?.(newDiscussion);
```

**Step 2: Run typecheck**

```bash
cd /home/yorizel/Documents/contentta-nx && bun run typecheck 2>&1 | grep "comment.tsx" | head -20
```

**Step 3: Commit**

```bash
git add packages/ui/src/components/comment.tsx
git commit -m "feat(ui): wire discussion persistence callbacks in comment.tsx"
```

---

## Task 6: Frontend hook — use-editor-discussions.ts

**Files:**
- Create: `apps/web/src/features/editor/hooks/use-editor-discussions.ts`

**Goal:** Fetch discussions for a content item + provide mutation functions for all operations.

```typescript
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { orpc } from "@/integrations/orpc/client";

export function useEditorDiscussions(contentId: string | undefined) {
  const { data } = useSuspenseQuery(
    contentId
      ? orpc.discussions.getByContent.queryOptions({
          input: { contentId },
          staleTime: 30_000,
        })
      : { queryKey: ["discussions-empty"], queryFn: () => ({ discussions: [], users: {} }) },
  );

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
    discussions: data?.discussions ?? [],
    users: data?.users ?? {},
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

**Important:** Use `useSuspenseQuery` as per CLAUDE.md convention. Wrap the parent component in `<Suspense>`.

**Step 2: Run typecheck**

```bash
cd /home/yorizel/Documents/contentta-nx && bun run typecheck 2>&1 | grep "use-editor-discussions" | head -10
```

**Step 3: Commit**

```bash
git add apps/web/src/features/editor/hooks/use-editor-discussions.ts
git commit -m "feat(editor): add use-editor-discussions hook"
```

---

## Task 7: Wire PlateEditor with CommentKit + SuggestionKit + DiscussionKit

**Files:**
- Modify: `apps/web/src/features/editor/plate/plate-editor.tsx`

**Goal:** Add the three kits to plugins, feed real discussions/users/currentUserId + callbacks via the plugin's options, and synchronize when data changes.

**Step 1: Read the current plate-editor.tsx**

The current file just has `BasicBlocksPlugin, BasicMarksPlugin, LinkPlugin, ...AIKit, ...CopilotKit`.

**Step 2: Modify plate-editor.tsx**

```typescript
'use client';

import {
  BasicBlocksPlugin,
  BasicMarksPlugin,
} from "@platejs/basic-nodes/react";
import { LinkPlugin } from "@platejs/link/react";
import type { Value } from "platejs";
import { Plate, PlateContent, usePlateEditor } from "platejs/react";
import { useEffect } from "react";
import { cn } from "@packages/ui/lib/utils";
import { CommentKit } from "@packages/ui/components/editor/plugins/comment-kit";
import { SuggestionKit } from "@packages/ui/components/editor/plugins/suggestion-kit";
import { DiscussionKit, discussionPlugin } from "@packages/ui/components/editor/plugins/discussion-kit";

import { AIKit } from "./plugins/ai-kit";
import { CopilotKit } from "./plugins/copilot-kit";
import { useEditorAIChat } from "./hooks/use-editor-ai-chat";
import { useEditorDiscussions } from "../hooks/use-editor-discussions";
import { useSession } from "@/hooks/use-session"; // or wherever the auth session is accessed

export interface PlateEditorProps {
  initialValue?: Value;
  onChange?: (value: Value) => void;
  placeholder?: string;
  editable?: boolean;
  className?: string;
  contentId?: string;
  writerId?: string;
  model?: string;
  language?: string;
}

export function PlateEditor({
  initialValue,
  onChange,
  placeholder = "Start writing…",
  editable = true,
  className,
  contentId,
  writerId,
  model,
  language,
}: PlateEditorProps) {
  useEditorAIChat({ contentId, writerId, model, language });

  const editor = usePlateEditor({
    plugins: [
      BasicBlocksPlugin,
      BasicMarksPlugin,
      LinkPlugin,
      ...CommentKit,
      ...SuggestionKit,
      ...DiscussionKit,
      ...AIKit,
      ...CopilotKit,
    ],
    value: initialValue,
  });

  // Wire real discussion data into the plugin
  useEditorDiscussionsSync(editor, contentId);

  return (
    <Plate
      editor={editor}
      onValueChange={onChange ? ({ value }) => onChange(value) : undefined}
      readOnly={!editable}
    >
      <PlateContent
        className={cn(
          "min-h-[200px] w-full cursor-text rounded-md border border-input bg-background px-4 py-3 text-sm ring-offset-background",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "prose prose-sm max-w-none dark:prose-invert",
          "[&_h1]:text-3xl [&_h1]:font-bold",
          "[&_h2]:text-2xl [&_h2]:font-semibold",
          "[&_h3]:text-xl [&_h3]:font-medium",
          "aria-disabled:cursor-not-allowed aria-disabled:opacity-50",
          className,
        )}
        placeholder={placeholder}
        disableDefaultStyles
      />
    </Plate>
  );
}
```

Create a `useEditorDiscussionsSync` helper (can be inline or separate file) that wires discussions into the plugin:

```typescript
function useEditorDiscussionsSync(editor: any, contentId: string | undefined) {
  // Get current user session
  const session = useSession(); // adapt to project's auth hook
  const currentUserId = session?.user?.id ?? '';

  const { discussions, users, mutations } = useEditorDiscussions(contentId);

  useEffect(() => {
    editor.setOption(discussionPlugin, 'currentUserId', currentUserId);
  }, [editor, currentUserId]);

  useEffect(() => {
    // Map DB rows to TDiscussion shape
    const mapped = discussions.map((d) => ({
      id: d.id,
      comments: d.comments.map((r) => ({
        id: r.id,
        contentRich: r.contentRich as Value,
        createdAt: new Date(r.createdAt),
        discussionId: r.discussionId,
        isEdited: r.isEdited,
        userId: r.userId,
      })),
      createdAt: new Date(d.createdAt),
      isResolved: d.isResolved,
      userId: d.userId,
      documentContent: d.documentContent ?? undefined,
    }));
    editor.setOption(discussionPlugin, 'discussions', mapped);
  }, [editor, discussions]);

  useEffect(() => {
    editor.setOption(discussionPlugin, 'users', users);
  }, [editor, users]);

  useEffect(() => {
    if (!contentId) return;

    editor.setOption(discussionPlugin, 'callbacks', {
      onCreateDiscussion: async (discussion) => {
        await mutations.create.mutateAsync({
          contentId,
          blockId: discussion.id, // discussion.id IS the Plate comment node ID
          contentRich: discussion.comments[0].contentRich as any,
          documentContent: discussion.documentContent,
        });
      },
      onAddReply: async (discussionId, reply) => {
        await mutations.addReply.mutateAsync({
          discussionId,
          contentRich: reply.contentRich as any,
        });
      },
      onResolveDiscussion: async (discussionId) => {
        await mutations.resolve.mutateAsync({ discussionId });
      },
      onRemoveDiscussion: async (discussionId) => {
        await mutations.remove.mutateAsync({ discussionId });
      },
      onUpdateComment: async (commentId, contentRich) => {
        await mutations.updateReply.mutateAsync({
          replyId: commentId,
          contentRich: contentRich as any,
        });
      },
      onDeleteComment: async (commentId) => {
        await mutations.removeReply.mutateAsync({ replyId: commentId });
      },
    });
  }, [editor, contentId, mutations]);
}
```

**Note on session hook:** Find the correct way to get the current user session in this app. Look for `useSession` from `@packages/authentication` or the `authClient` hook. Check how other components access `session.user.id`.

**Step 3: Run typecheck**

```bash
cd /home/yorizel/Documents/contentta-nx && bun run typecheck 2>&1 | grep -E "plate-editor|useEditorDiscussions" | head -20
```

**Step 4: Verify in browser**
- Open the editor for a content item
- Press `Cmd+Shift+M` on selected text → comment draft should appear
- Type a comment → save it → check DB via Drizzle Studio

**Step 5: Commit**

```bash
git add apps/web/src/features/editor/plate/plate-editor.tsx apps/web/src/features/editor/hooks/use-editor-discussions.ts
git commit -m "feat(editor): integrate CommentKit + SuggestionKit + DiscussionKit with real data"
```

---

## Task 8: Mastra Tool — add-editor-comment-tool.ts

**Files:**
- Create: `packages/agents/src/mastra/tools/editor/add-editor-comment-tool.ts`

**Goal:** Tool that the AI agent calls to annotate a specific block with a comment. Returns data that the streaming bridge can display inline.

```typescript
import { createTool } from "@mastra/core/tools";
import { z } from "zod";

export const addEditorCommentTool = createTool({
  id: "add-editor-comment",
  description:
    "Add a comment annotation to a specific block in the editor. Use during SEO Audit or Review to explain why a section could be improved.",
  inputSchema: z.object({
    blockId: z
      .string()
      .describe("The block ID (Plate node ID) to comment on. Use 'general' if unsure."),
    content: z
      .string()
      .min(1)
      .describe("The comment text explaining the issue or suggestion."),
    textRange: z
      .string()
      .optional()
      .describe("The specific quoted text being annotated (optional, for context)."),
    category: z
      .enum(["seo", "readability", "structure", "tone", "general"])
      .default("general")
      .describe("Category of the comment for visual grouping."),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    commentId: z.string(),
    blockId: z.string(),
    content: z.string(),
    category: z.string(),
  }),
  execute: async ({ context, input }) => {
    const commentId = crypto.randomUUID();
    return {
      success: true,
      commentId,
      blockId: input.blockId,
      content: input.content,
      category: input.category,
    };
  },
});
```

**Step 2: Commit**

```bash
git add packages/agents/src/mastra/tools/editor/add-editor-comment-tool.ts
git commit -m "feat(agents): add add-editor-comment Mastra tool"
```

---

## Task 9: Mastra Tool — propose-suggestion-tool.ts

**Files:**
- Create: `packages/agents/src/mastra/tools/editor/propose-suggestion-tool.ts`

**Goal:** Tool that the AI agent calls to propose a text change as a suggestion (track change). Returns the original and suggested text so the editor streaming bridge can apply it as a `SuggestionNode`.

```typescript
import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { normalizeMarkdownEmphasis } from "@f-o-t/markdown";

export const proposeSuggestionTool = createTool({
  id: "propose-suggestion",
  description:
    "Propose a text change as a track-change suggestion. The user can accept or reject it. Use when you want to rewrite or improve a specific passage.",
  inputSchema: z.object({
    blockId: z
      .string()
      .describe("The block ID (Plate node ID) containing the text to change."),
    originalText: z
      .string()
      .describe("The exact current text to be replaced (verbatim from the document)."),
    suggestedText: z
      .string()
      .describe("The proposed replacement text."),
    reason: z
      .string()
      .describe("Brief explanation of why this change improves the content."),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    suggestionId: z.string(),
    blockId: z.string(),
    originalText: z.string(),
    suggestedText: z.string(),
    reason: z.string(),
  }),
  execute: async ({ context, input }) => {
    const normalizedSuggestion = normalizeMarkdownEmphasis(input.suggestedText);
    return {
      success: true,
      suggestionId: crypto.randomUUID(),
      blockId: input.blockId,
      originalText: input.originalText,
      suggestedText: normalizedSuggestion,
      reason: input.reason,
    };
  },
});
```

**Step 2: Commit**

```bash
git add packages/agents/src/mastra/tools/editor/propose-suggestion-tool.ts
git commit -m "feat(agents): add propose-suggestion Mastra tool"
```

---

## Task 10: Register tools in unified-content-agent.ts

**Files:**
- Modify: `packages/agents/src/mastra/agents/unified-content-agent.ts`

**Step 1: Read the current file's tool import section (lines 1-60)**

Add imports after the existing editor tool imports:
```typescript
import { addEditorCommentTool } from "../tools/editor/add-editor-comment-tool";
import { proposeSuggestionTool } from "../tools/editor/propose-suggestion-tool";
```

**Step 2: Find the `tools:` array in the Agent constructor and add the two new tools**

Look for the `tools: {` section and add:
```typescript
addEditorComment: addEditorCommentTool,
proposeSuggestion: proposeSuggestionTool,
```

**Step 3: Run typecheck**

```bash
cd /home/yorizel/Documents/contentta-nx && bun run typecheck 2>&1 | grep "unified-content" | head -10
```

**Step 4: Commit**

```bash
git add packages/agents/src/mastra/agents/unified-content-agent.ts
git commit -m "feat(agents): register addEditorComment and proposeSuggestion tools in unified agent"
```

---

## Task 11: Verify end-to-end

**Step 1: Run full typecheck**

```bash
cd /home/yorizel/Documents/contentta-nx && bun run typecheck 2>&1 | grep -c "error TS"
```
Expected: 0

**Step 2: Run tests (if any discussion tests exist)**

```bash
cd /home/yorizel/Documents/contentta-nx && bun run test -- --grep "discussion" 2>&1 | tail -20
```

**Step 3: Manual verification checklist**

- [ ] `Mod+Shift+M` on selected text opens comment draft
- [ ] Submitting a comment creates a DB row in `discussions` + `discussion_replies`
- [ ] Resolving a comment marks `discussions.is_resolved = true`
- [ ] Comment icon appears next to the block
- [ ] Suggestion plugin renders track-changes UI (test by having AI call `proposeSuggestion`)
- [ ] AI agent's `addEditorComment` tool appears in `tool_call_complete` events in the streaming inspector

---

## Post-Implementation Notes

### `getDiscussionsByContent` inArray fix
The repository uses `inArray` from drizzle-orm. If `discussionIds` is empty, skip the replies query:
```typescript
if (rows.length === 0) return [];
const replies = discussionIds.length > 0
  ? await db.select().from(discussionReplies)
      .where(inArray(discussionReplies.discussionId, discussionIds))
      .orderBy(asc(discussionReplies.createdAt))
  : [];
```

### Session access in PlateEditor
Find the session hook by checking how `EditorPage` or other components access the current user. Common patterns:
- `import { useSession } from "@packages/authentication/client"` if auth exports a React hook
- `const session = useSuspenseQuery(orpc.session.get.queryOptions({}))`

### Suggestion + AI streaming (future work)
The `proposeSuggestion` tool currently returns data but doesn't auto-apply to the editor. For full streaming integration, `ai-kit.tsx` needs to handle `toolName === 'propose-suggestion'` in `onToolCallComplete` and call `editor.tf.suggestion.setSuggestionNodes(...)`. This is a follow-up task (depends on the AIChatPlugin's tool handling API).

### blockId mapping
When `onCreateDiscussion` is called, `discussion.id` is the Plate `nanoid()` generated comment ID (set by `getDraftCommentKey`). This is stored as `blockId` in the DB. On reload, discussions are loaded and matched to blocks via the Plate comment plugin's `api.comment.has({ id })`.
