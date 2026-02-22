---
name: orpc-router
description: Use when writing a new oRPC procedure, adding a handler, creating a router file, or asked to "add endpoint", "write a route", or "new procedure" in the contentta project.
---

# oRPC Router Writing Guide

## Overview

Write oRPC procedures schema-first using drizzle-zod, with early-return guard clauses and a strict top-to-bottom handler structure. Never duplicate field definitions that already exist in a Drizzle table.

---

## 1. Schema First — drizzle-zod

**Rule:** If a field exists in a Drizzle table, derive it. Never rewrite it as `z.string()`.

```typescript
import { createInsertSchema } from "drizzle-zod";
import { content } from "@packages/database/schemas/content";

// ✅ Derive from the table
const createContentSchema = createInsertSchema(content).pick({
   title: true,
   body: true,
   teamId: true,
});

// ✅ Partial for updates
const updateContentSchema = createInsertSchema(content)
   .pick({ title: true, body: true })
   .partial();

// ✅ Extend when input has fields not in the table
const createWithTagsSchema = createInsertSchema(content)
   .pick({ title: true })
   .extend({ tags: z.array(z.string()).optional() });

// ❌ Never redefine table fields manually
const bad = z.object({
   title: z.string().min(1),   // already in the table
   teamId: z.string().uuid(),  // already in the table
});
```

**When manual `z.object()` is fine:**
- Input has no corresponding table (filters, pagination, search params)
- Input composes fields from multiple tables

**Schema location:** Always at the top of the router file, before any exports. Never inline inside `.input()`.

---

## 2. Procedure Type

| Procedure | Use when | Context provides |
|-----------|----------|-----------------|
| `publicProcedure` | No auth needed | `db`, `auth` |
| `authenticatedProcedure` | User logged in, no org scope | + `userId` |
| `protectedProcedure` | Any team/org-scoped resource | + `organizationId`, `teamId` |

**Rule:** Default to `protectedProcedure`. Only reach for the others when the resource truly has no org/team scope.

---

## 3. Handler Structure — Top to Bottom, No Nesting

```typescript
export const update = protectedProcedure
   .input(updateContentSchema.extend({ id: z.string().uuid() }))
   .handler(async ({ context, input }) => {
      // 1. Destructure context
      const { db, organizationId, teamId, userId, posthog } = context;

      // 2. Fetch the resource
      const existing = await getContentById(db, input.id);

      // 3. Guard clauses — throw early, never nest
      if (!existing) {
         throw new ORPCError("NOT_FOUND", { message: "Content not found" });
      }
      if (existing.organizationId !== organizationId) {
         throw new ORPCError("NOT_FOUND", { message: "Content not found" });
      }
      if (existing.teamId !== teamId) {
         throw new ORPCError("NOT_FOUND", { message: "Content not found" });
      }

      // 4. Credit check (if applicable) — after ownership, before work
      try {
         await enforceCreditBudget(db, organizationId, cost);
      } catch {
         throw new ORPCError("FORBIDDEN", { message: "Insufficient credits" });
      }

      // 5. Business logic (happy path)
      const result = await updateContent(db, input.id, input);

      // 6. Non-blocking side effects
      try {
         await emitContentUpdated(
            createEmitFn(db, posthog),
            { organizationId, userId },
            { contentId: result.id },
         );
      } catch { /* never break main flow */ }

      // 7. Return
      return result;
   });
```

**Hard rules:**
- Never `else` after a `throw` — the throw already exits
- Never nest guards inside `if (existing) { ... }` — invert and throw
- `try-catch` only for external APIs (Better Auth, Stripe) and event emission
- Never `try-catch` around the main flow

---

## 4. Error Handling

```typescript
// ✅ Always ORPCError
throw new ORPCError("NOT_FOUND", { message: "Content not found" });
throw new ORPCError("FORBIDDEN", { message: "Insufficient credits" });
throw new ORPCError("UNAUTHORIZED", { message: "Authentication required" });
throw new ORPCError("BAD_REQUEST", { message: "Invalid input" });
throw new ORPCError("INTERNAL_SERVER_ERROR", { message: "Failed to save" });

// ❌ Never
throw new Error("Not found");
throw new AppError("NOT_FOUND", "..."); // AppError is for repositories only
```

**Ownership checks — always `NOT_FOUND`, never `FORBIDDEN`** (don't leak existence):
```typescript
if (!existing || existing.organizationId !== organizationId) {
   throw new ORPCError("NOT_FOUND", { message: "Content not found" });
}
```

**Wrapping external API errors:**
```typescript
try {
   return await auth.api.getFullOrganization({ headers, query: { organizationId } });
} catch (error) {
   if (error instanceof ORPCError) throw error;
   throw new ORPCError("INTERNAL_SERVER_ERROR", { message: "Failed to fetch organization" });
}
```

---

## 5. Testing

Use `call()` from `@orpc/server` — no HTTP server needed. `call()` runs the full middleware chain.

```typescript
import { call } from '@orpc/server'
import { ORPCError } from '@orpc/server'
import type { ORPCContextWithAuth } from '@/integrations/orpc/server'
import { describe, expect, it } from 'vitest'
import { getById, update } from '@/integrations/orpc/router/content'

const context = {
   headers: new Headers(),
   request: new Request('http://localhost'),
   db: mockDb,
   auth: { api: {} },
   session: {
      user: { id: 'user-1' },
      session: { activeOrganizationId: 'org-123' },
   },
} as unknown as ORPCContextWithAuth
```

**Test the three guard cases for every mutating procedure:**
```typescript
it('returns data on happy path', async () => {
   const result = await call(getById, { id: ownedId }, { context })
   expect(result.id).toBe(ownedId)
})

it('throws NOT_FOUND when resource is missing', async () => {
   await expect(call(getById, { id: 'nonexistent' }, { context }))
      .rejects.toThrow(ORPCError)
})

it('throws NOT_FOUND when org mismatch', async () => {
   // insert resource under a different org, then call with this context
   await expect(call(getById, { id: otherOrgId }, { context }))
      .rejects.toThrow(ORPCError)
})
```

**Testing streaming handlers:**
```typescript
it('streams content chunks', async () => {
   const chunks = []
   for await (const chunk of call(streamProc, { prompt: 'Hello' }, { context })) {
      chunks.push(chunk)
   }
   expect(chunks.at(-1)).toMatchObject({ done: true })
})
```

**Asserting error codes:**
```typescript
try {
   await call(createContent, { title: 'test' }, { context })
   expect.fail('should have thrown')
} catch (err) {
   expect(err).toBeInstanceOf(ORPCError)
   expect((err as ORPCError).code).toBe('FORBIDDEN')
}
```

**Gotcha — Better Auth tables need explicit `createdAt`:**
```typescript
// member and team have no .defaultNow() — must provide explicitly
await db.insert(member).values({ ...data, createdAt: new Date() });
await db.insert(team).values({ ...data, createdAt: new Date() });
```

**Context requirements:**

| Procedure | Required session fields |
|-----------|------------------------|
| `publicProcedure` | `session` can be `null` |
| `authenticatedProcedure` | `session.user.id` |
| `protectedProcedure` | `session.user.id` + `session.session.activeOrganizationId` |

---

## Quick Reference

| Task | Pattern |
|------|---------|
| Field already in table | `createInsertSchema(table).pick({ field: true })` |
| Optional update input | `.partial()` on picked schema |
| Extra fields not in table | `.extend({ field: z.string() })` |
| Fetch + guard | fetch → `if (!x) throw NOT_FOUND` → `if (x.orgId !== orgId) throw NOT_FOUND` |
| Credit check | `try { await enforceCreditBudget(...) } catch { throw FORBIDDEN }` |
| Event emission | `try { await emitX(...) } catch { /* silent */ }` |
| External API errors | `try { ... } catch { if (e instanceof ORPCError) throw e; throw INTERNAL_SERVER_ERROR }` |
| Test happy path | `call(proc, input, { context })` |
| Test guard | `expect(call(...)).rejects.toThrow(ORPCError)` |

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| `z.object({ title: z.string() })` for a table field | `createInsertSchema(table).pick({ title: true })` |
| `else` after a `throw` | Remove the `else` — throw already exits |
| `if (existing) { ... do stuff ... }` | Invert: `if (!existing) throw; ... do stuff ...` |
| `throw new Error(...)` in a router | `throw new ORPCError(code, { message })` |
| `throw new ORPCError("FORBIDDEN")` for wrong-org | `throw new ORPCError("NOT_FOUND")` — don't leak existence |
| Event emission without try-catch | Wrap in `try { } catch { }` — must never break main flow |
| `try-catch` around main business logic | Remove — only use for external APIs and events |
| Missing `createdAt` in test inserts for `member`/`team` | Add `createdAt: new Date()` explicitly |
