# Team-Level API Keys & Allowed Domains

> Date: 2026-02-14
> Status: Draft
> Scope: Move public API keys to team-level via Better Auth, add domain filtering

---

## Problem

1. **Public API key is per-organization** — but organizations can have multiple teams (apps). Each app needs its own key.
2. **No domain filtering** — anyone with the public API key can send events from any origin. No protection against casual abuse.
3. **Public API key is disconnected** — stored as a plain text field on `organization` table, not part of Better Auth's API key system. No rate limiting, no metadata, no validation.

---

## Decision: Two Key Systems

### Public Project Key (`cta_pub_`)

Client-side, write-only. Safe to embed in frontend JS.

| Property | Value |
|----------|-------|
| Managed by | Better Auth `apikey` table |
| Prefix | `cta_pub` |
| Tied to | **Team** (one per team, auto-created) |
| Metadata | `{ type: "public", teamId, organizationId, plan }` |
| Capabilities | Event capture + form submission only |
| Rate limited | Yes — FREE: 100/min, LITE: 1k/min, PRO: 10k/min |
| Created | Automatically when a team is created |
| Validated by | `auth.api.verifyApiKey()` in sdk-server |
| Domain filtering | Soft check — `Origin`/`Referer` vs `team.allowedDomains` |
| Regeneratable | By org owner (delete old + create new via Better Auth) |
| Expires | Never |

### Personal API Key (`cta_`)

Server-side, scoped. Must be kept secret.

| Property | Value |
|----------|-------|
| Managed by | Custom `personal_api_key` table |
| Prefix | `cta_` |
| Tied to | **User** (multiple per user) |
| Storage | Hash only (`Bun.password.hash`) — plaintext shown once |
| Capabilities | Granular scopes (15 resources x 3 levels) |
| Org access | All orgs or specific org IDs |
| Rate limited | Via Arcjet at route level |
| Created | Manually in Settings > Personal API Keys |
| Validated by | Custom hash comparison middleware |

---

## Schema Changes

### Team Table — Add `allowedDomains`

Better Auth `additionalFields` on `team`:

```typescript
team: {
   additionalFields: {
      description: {
         defaultValue: "",
         input: true,
         required: false,
         type: "string",
      },
      allowedDomains: {
         defaultValue: [],
         input: true,
         required: false,
         type: "string[]",
         validator: {
            input: z.array(
               z.string().regex(
                  /^(\*\.)?[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z]{2,})+$/
               )
            ),
         },
      },
   },
},
```

Drizzle schema (`packages/database/src/schemas/auth.ts`):

```typescript
export const team = pgTable("team", {
   // ... existing fields ...
   allowedDomains: text("allowed_domains")
      .array()
      .default(sql`'{}'::text[]`),
});
```

### Organization Table — Remove `publicApiKey`

Drop the `publicApiKey` column from `organization`. Public keys move to Better Auth's `apikey` table, associated with teams via metadata.

---

## Public Key Lifecycle

### Creation (on team creation)

When a team is created (via `ensureDefaultProject` or manual creation):

```typescript
const key = await auth.api.createApiKey({
   body: {
      prefix: "cta_pub",
      name: `${team.name} Public Key`,
      userId: ownerUserId,
      metadata: {
         type: "public",
         teamId: team.id,
         organizationId,
         plan: currentPlan,
      },
      ...getRateLimitConfig(currentPlan),
   },
});
```

### Reading (settings UI, onboarding)

Query Better Auth API keys filtered by `metadata.teamId` and `metadata.type === "public"`:

```typescript
const keys = await auth.api.listApiKeys({ headers });
const publicKey = keys.find(
   (k) => k.metadata?.teamId === teamId && k.metadata?.type === "public"
);
```

### Regeneration

Owner-only. Delete old key, create new one:

```typescript
await auth.api.deleteApiKey({ body: { keyId: oldKey.id } });
const newKey = await auth.api.createApiKey({ body: { ... } });
```

---

## SDK Auth Flow — Domain Filtering

### Current Flow

```
Request → resolveApiKey() → auth.api.verifyApiKey()
  → extract organizationId from metadata
  → process request
```

### New Flow

```
Request → resolveApiKey() → auth.api.verifyApiKey()
  → extract { teamId, organizationId, type } from metadata
  → if type === "public":
      → lookup team.allowedDomains from DB (cacheable)
      → if allowedDomains is non-empty:
          → extract Origin or Referer header
          → match against domain patterns
          → mismatch → 403 Forbidden
          → match → continue
      → if allowedDomains is empty:
          → allow all (opt-in behavior)
  → process request
```

### Domain Matching Algorithm

```typescript
function matchesDomain(origin: string, patterns: string[]): boolean {
   const hostname = new URL(origin).hostname;
   return patterns.some((pattern) => {
      if (pattern.startsWith("*.")) {
         const suffix = pattern.slice(2); // "example.com"
         return hostname === suffix || hostname.endsWith(`.${suffix}`);
      }
      return hostname === pattern;
   });
}
```

Pattern examples:
- `example.com` — matches only `example.com`
- `*.example.com` — matches `app.example.com`, `sub.app.example.com`, also `example.com` itself
- `localhost` — matches `localhost` (useful for development)

### Soft Filtering Note

This is a **soft check**. `Origin`/`Referer` headers can be spoofed by determined actors. This protects against:
- Casual abuse (someone copying the key from page source)
- Scrapers and automated tools
- Accidental misuse (key used on wrong site)

It does NOT protect against targeted attacks from server-side code that sets arbitrary headers.

---

## Settings UI — Mock Data Removal

### 1. Organization General (`settings/organization/general.tsx`)

**Current**: `mockOrganization` with hardcoded name, slug, logo, domain, memberCount.

**Data source**: `useActiveOrganization()` hook (already exists, returns org with subscription info).

| Mock Field | Replacement | Source |
|------------|-------------|--------|
| `name` | `activeOrganization.name` | `useActiveOrganization()` |
| `slug` | `activeOrganization.slug` | `useActiveOrganization()` |
| `logo` | `activeOrganization.logo` | `useActiveOrganization()` |
| `domain` | **Remove entirely** | Domains are per-team now, not per-org |
| `memberCount` | `activeOrganization.members.length` | `getFullOrganization` returns members array |

**Actions**:
- Delete `mockOrganization` constant
- Add `useSuspenseQuery(orpc.organization.getActiveOrganization.queryOptions({}))`
- Wire edit buttons to real mutations (org name update via Better Auth)
- Add `Suspense`/`ErrorBoundary` wrapper like project/general already has

### 2. Organization Members (`settings/organization/members.tsx`)

**Current**: `MOCK_MEMBERS` array with 3 hardcoded members (João, Maria, Pedro).

**Data source**: New `organization.getMembers` oRPC procedure.

| Mock Field | Replacement | Source |
|------------|-------------|--------|
| `name` | `member.user.name` | `getOrganizationMembers()` from auth-repository |
| `email` | `member.user.email` | Same |
| `role` | `member.role` | Same |
| `image` | `member.user.image` | Same |

**Actions**:
- Delete `MOCK_MEMBERS` constant
- Create `organization.getMembers` procedure (wraps existing `getOrganizationMembers()` DB function)
- Add `useSuspenseQuery(orpc.organization.getMembers.queryOptions({}))`
- Wire "Convidar" button to real invite flow (Better Auth org invitations)
- Add loading/error states

### 3. Project General (`settings/project/general.tsx`)

**Current**: `MOCK_PROJECT` with hardcoded id, name, slug, timezone, currency, publicApiKey, createdAt, status. Three `setTimeout` fake saves.

**Data sources**:
- Team data from route params + `getOrganizationTeams`
- Public API key from new `team.getPublicApiKey` procedure
- Allowed domains from team's `allowedDomains` field

| Mock Field | Replacement | Source |
|------------|-------------|--------|
| `id` | `team.id` | Route params `$teamId` |
| `name` | `team.name` | `getOrganizationTeams()` or new `team.get` |
| `slug` | `team.id` or `team.name` slugified | Team data |
| `timezone` | **Remove** | Not in schema, not needed |
| `currency` | **Remove** | Not in schema, not needed |
| `publicApiKey` | Real key from Better Auth | New `team.getPublicApiKey` procedure |
| `createdAt` | `team.createdAt` | Team data |
| `status` | **Remove** | Not a team field |

**New section — Allowed Domains**:
- Display current `team.allowedDomains` as a list of chips/badges
- Add domain: text input with regex validation + add button
- Remove domain: click X on chip
- Empty state: "Todos os domínios permitidos" (all domains allowed)
- Save via `team.updateAllowedDomains` mutation

**Actions**:
- Delete `MOCK_PROJECT` constant
- Delete `TIMEZONE_OPTIONS`, `CURRENCY_OPTIONS` constants
- Delete `ChangeTimezoneSheetContent`, `ChangeCurrencySheetContent` components
- Delete `getTimezoneLabel`, `getCurrencyLabel` helpers
- Keep `ChangeNameSheetContent` but wire to real mutation (`team.updateName`)
- Replace fake `setTimeout` saves with real oRPC mutations
- Add allowed domains management UI
- Add public API key display with copy + regenerate

---

## Migration Plan

### Database Migration

1. Add `allowed_domains` column to `team` table (`text[]`, default `'{}'`)
2. For each organization with a `publicApiKey`:
   - Find the default team
   - Create a Better Auth API key with `prefix: "cta_pub"` and `metadata.teamId`
3. Drop `publicApiKey` column from `organization` table
4. Update Better Auth config (`additionalFields`) to remove `publicApiKey` from organization, add `allowedDomains` to team

### Code Migration

1. Update `ensureDefaultProject()` to also create a public API key via Better Auth
2. Update `createDefaultOrganization()` — stop setting `publicApiKey` on org
3. Update onboarding to read public key from Better Auth instead of `organization.publicApiKey`
4. Update sdk-server auth to extract `teamId` from metadata and check domains
5. Update settings pages to use real data
6. Remove `getPublicApiKey` / `regeneratePublicApiKey` from auth-repository
7. Remove `generatePublicApiKey()` from crypto utils

---

## New oRPC Procedures

### `team.getPublicApiKey`

Read the public API key for a team.

```typescript
export const getPublicApiKey = protectedProcedure
   .input(z.object({ teamId: z.string().uuid() }))
   .handler(async ({ context, input }) => {
      const keys = await context.auth.api.listApiKeys({ headers: context.headers });
      const publicKey = keys.find(
         (k) => k.metadata?.teamId === input.teamId && k.metadata?.type === "public"
      );
      return { publicApiKey: publicKey?.start ? `${publicKey.prefix}_${publicKey.start}...` : null };
   });
```

### `team.regeneratePublicApiKey`

Regenerate the public API key (owner only).

### `team.updateAllowedDomains`

Set the allowed domains for a team.

```typescript
export const updateAllowedDomains = protectedProcedure
   .input(z.object({
      teamId: z.string().uuid(),
      allowedDomains: z.array(z.string()),
   }))
   .handler(async ({ context, input }) => {
      // validate domain patterns
      // update team.allowedDomains via Drizzle
   });
```

### `organization.getMembers`

List org members (wraps existing `getOrganizationMembers()`).

---

## Files to Modify

| File | Change |
|------|--------|
| `packages/authentication/src/server.ts` | Remove `publicApiKey` from org `additionalFields`, add `allowedDomains` to team |
| `packages/database/src/schemas/auth.ts` | Add `allowedDomains` to `team`, remove `publicApiKey` from `organization` |
| `packages/database/src/repositories/auth-repository.ts` | Update `createDefaultOrganization` (remove publicApiKey), update `ensureDefaultProject` (create BA key), remove `getPublicApiKey`/`regeneratePublicApiKey` |
| `packages/utils/src/crypto.ts` | Remove `generatePublicApiKey()` |
| `apps/sdk-server/src/utils/sdk-auth.ts` | Add domain checking after key validation |
| `apps/sdk-server/src/routes/sdk-events.ts` | Pass origin to auth, handle 403 |
| `apps/sdk-server/src/routes/sdk.ts` | Same domain checking for SDK macro |
| `apps/web/src/integrations/orpc/router/organization.ts` | Remove `getPublicApiKey`/`regeneratePublicApiKey`, add `getMembers` |
| `apps/web/src/integrations/orpc/router/team.ts` | New — `getPublicApiKey`, `regeneratePublicApiKey`, `updateAllowedDomains` |
| `apps/web/src/routes/.../settings/project/general.tsx` | Replace mocks with real data |
| `apps/web/src/routes/.../settings/organization/general.tsx` | Replace mocks with `useActiveOrganization()` |
| `apps/web/src/routes/.../settings/organization/members.tsx` | Replace mocks with real member data |
| `apps/web/src/features/onboarding/ui/sdk-install-step.tsx` | Read public key from Better Auth instead of org field |
