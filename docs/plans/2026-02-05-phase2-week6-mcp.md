# Phase 2 Week 6: MCP Server Integration (Revised) - Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** Integrate Model Context Protocol (MCP) server into SDK server, allowing AI tools (Claude Desktop, Cursor) to create/edit/publish content in Contentta. Uses Better Auth OAuth Provider plugin for standards-compliant OAuth 2.1 authentication.

**Architecture:**

```
┌─────────────────────┐         ┌──────────────────────┐
│   Claude Desktop    │         │   apps/web           │
│   (MCP Client)      │         │   (Auth Server)      │
│                     │         │                      │
│  1. Discover OAuth  │────────▸│  /.well-known/       │
│  2. Browser login   │────────▸│  /sign-in            │
│  3. Consent         │────────▸│  /oauth/consent      │
│  4. Get token       │────────▸│  /api/auth/oauth2/*  │
│                     │         │  /api/auth/jwks      │
└────────┬────────────┘         └──────────┬───────────┘
         │                                 │
         │ 5. MCP calls with Bearer JWT    │ JWKS (token verify)
         ▼                                 ▼
┌──────────────────────────────────────────────────────┐
│   apps/sdk-server (Resource Server + MCP Server)     │
│                                                      │
│   GET  /mcp  → SSE transport (MCP protocol)          │
│   POST /mcp  → MCP messages                          │
│   DEL  /mcp  → Cleanup                               │
│                                                      │
│   /.well-known/oauth-protected-resource              │
│                                                      │
│   Tools: create_content, update_content,             │
│          publish_content, list_content,               │
│          get_writer, list_writers                     │
└──────────────────────────────────────────────────────┘
```

**Tech Stack:**
- `@better-auth/oauth-provider` — OAuth 2.1 provider plugin (includes MCP support)
- `mcp-handler` — MCP protocol handler (wraps `@modelcontextprotocol/sdk`)
- Better Auth JWT plugin — Token signing/verification via JWKS
- Elysia — SDK server framework

---

## Task 1: Add Dependencies

**Files:**
- Modify: `package.json` (root — Bun catalog)
- Modify: `packages/authentication/package.json`
- Modify: `apps/sdk-server/package.json`

**Steps:**

1. Add `@better-auth/oauth-provider` to `@packages/authentication` dependencies
2. Add `mcp-handler` to `apps/sdk-server` dependencies
3. Run `bun install` from repo root
4. Run typecheck on both packages
5. Commit

---

## Task 2: Add OAuth Provider Plugin to Better Auth Config

**Files:**
- Modify: `packages/authentication/src/server.ts`

**Context:**
- Better Auth config is shared between `apps/web` and `apps/sdk-server`
- `apps/web` serves auth routes at `/api/auth/$` (TanStack Router catch-all)
- Adding oauthProvider here makes OAuth endpoints available on the web app automatically

**Steps:**

1. Import `jwt` from `better-auth/plugins` and `oauthProvider` from `@better-auth/oauth-provider`
2. Add `jwt()` plugin to the plugins array (required by oauthProvider for token signing)
3. Add `oauthProvider()` plugin with config:
   ```typescript
   oauthProvider({
     loginPage: "/sign-in",
     consentPage: "/oauth/consent",
     enableMcp: true,
     allowDynamicClientRegistration: true,
     allowUnauthenticatedClientRegistration: true, // MCP clients register dynamically
     scopes: [
       "openid",
       "profile",
       "email",
       "offline_access",
       "content:read",
       "content:write",
       "content:publish",
       "writer:read",
     ],
     accessTokenExpiresIn: "1h",
     refreshTokenExpiresIn: "30d",
     postLogin: {
       page: "/oauth/select-organization",
       shouldRedirect: async ({ session, headers }) => {
         // If user has multiple orgs, redirect to select one
         // This sets activeOrganizationId for scoped consent
         return false; // Start simple — skip for now
       },
       consentReferenceId: ({ session }) => {
         return session?.activeOrganizationId ?? undefined;
       },
     },
   })
   ```
4. Run database migration: `bunx @better-auth/cli migrate --config packages/authentication/src/cli-config.ts`
5. Generate updated auth schema: `bun run --filter @packages/authentication auth-schema-generate`
6. Typecheck
7. Commit

---

## Task 3: Add OAuth Provider Client Plugin

**Files:**
- Modify: `packages/authentication/src/client.ts`

**Steps:**

1. Import `oauthProviderClient` from `@better-auth/oauth-provider/client`
2. Add `oauthProviderClient()` to the client plugins array
3. Typecheck
4. Commit

---

## Task 4: OAuth Well-Known Routes (Web App)

**Files:**
- Create: `apps/web/src/routes/.well-known/oauth-authorization-server/$.ts`
- Create: `apps/web/src/routes/.well-known/openid-configuration.ts`

**Context:**
- `apps/web` uses TanStack Router with file-based routing
- These routes serve OAuth discovery metadata for MCP clients
- MCP clients (Claude Desktop) discover the auth server via these endpoints

**Steps:**

1. Create OAuth authorization server metadata route:
   ```typescript
   // apps/web/src/routes/.well-known/oauth-authorization-server/$.ts
   import { createFileRoute } from '@tanstack/react-router'
   import { oauthProviderAuthServerMetadata } from '@better-auth/oauth-provider'
   import { getAuth } from '@/integrations/better-auth/auth-server'

   export const Route = createFileRoute('/.well-known/oauth-authorization-server/$')({
     server: {
       handlers: {
         GET: () => oauthProviderAuthServerMetadata(getAuth()),
       },
     },
   })
   ```

2. Create OpenID configuration route:
   ```typescript
   // apps/web/src/routes/.well-known/openid-configuration.ts
   import { createFileRoute } from '@tanstack/react-router'
   import { oauthProviderOpenIdConfigMetadata } from '@better-auth/oauth-provider'
   import { getAuth } from '@/integrations/better-auth/auth-server'

   export const Route = createFileRoute('/.well-known/openid-configuration')({
     server: {
       handlers: {
         GET: () => oauthProviderOpenIdConfigMetadata(getAuth()),
       },
     },
   })
   ```

3. Typecheck
4. Commit

**Note:** The exact TanStack Router server route patterns may need adjustment — verify against existing patterns like `apps/web/src/routes/api/auth/$.ts`.

---

## Task 5: OAuth Consent Page (Web App)

**Files:**
- Create: `apps/web/src/routes/oauth/consent.tsx`

**Context:**
- When MCP clients (Claude Desktop) connect, users are redirected to sign in, then to consent
- Consent page shows the requesting app name and requested scopes
- User can approve or deny

**Steps:**

1. Create a consent page at `/oauth/consent` that:
   - Reads `client_id` and `scope` from query params
   - Fetches public client info via `authClient.oauth2.publicClient({ client_id })`
   - Shows app name, requested scopes in readable format
   - Has "Allow" and "Deny" buttons
   - Calls `authClient.oauth2.consent({ accept: true/false })` on action
2. Style with existing Tailwind/Radix patterns from the codebase
3. Commit

---

## Task 6: MCP Handler + Tools (SDK Server)

**Files:**
- Create: `apps/sdk-server/src/mcp/handler.ts`
- Create: `apps/sdk-server/src/mcp/tools.ts`
- Modify: `apps/sdk-server/src/index.ts`

**Context — Codebase facts (DO NOT use plan assumptions, use these):**
- `db` exported from `../integrations/database` (named export, type `DatabaseInstance`)
- **"Agent" = "Writer"** in the codebase. The table is `writer`, repository is `writer-repository`
- Repository functions:
  - `createContent(db, data: ContentInsert)` — requires `writerId`, `organizationId`, `createdByMemberId`, `meta` (jsonb: `{ title, description, slug }`)
  - `updateContent(db, contentId, data: Partial<ContentInsert>)`
  - `getContentById(db, contentId)` → `Content | undefined`
  - `publishContent(db, contentId)` → `Content`
  - `listContentsByOrganization(db, organizationId, options?)` → `Content[]`
  - `getWriterById(db, writerId)` → `Writer | undefined`
  - `getWritersByOrganizationId(db, organizationId)` → `Writer[]`
- **No brand repository** — brand guidelines are in `writer.personaConfig`
- `emitEvent()` requires `db` parameter: `emitEvent({ db, organizationId, eventName, eventCategory, properties, userId })`
- Events: use `CONTENT_EVENTS` from `@packages/events/content` and `EVENT_CATEGORIES` from `@packages/events/catalog`
- Content schema: `content.meta` is jsonb containing `{ title, description, slug, keywords?, sources? }`
- Content schema: `content.status` is `"draft" | "published" | "archived"`
- Content schema: `content.request` is jsonb containing `{ description, layout }`
- Writer config: `writer.personaConfig` contains tone, voice, writingGuidelines, brandTerms, etc.

**Steps:**

1. Create `apps/sdk-server/src/mcp/tools.ts` — tool registration function:
   ```typescript
   import type { Server } from '@modelcontextprotocol/sdk/server/index.js';
   // ... repository imports

   export function registerTools(server: Server, organizationId: string, userId: string) {
     server.tool("create_content", "Create a new blog post", { ... }, async (args) => { ... });
     server.tool("update_content", "Update an existing blog post", { ... }, async (args) => { ... });
     server.tool("publish_content", "Publish a draft blog post", { ... }, async (args) => { ... });
     server.tool("list_content", "List blog posts", { ... }, async (args) => { ... });
     server.tool("get_writer", "Get AI writer configuration", { ... }, async (args) => { ... });
     server.tool("list_writers", "List available AI writers", { ... }, async (args) => { ... });
   }
   ```

   Tools:
   - **create_content** — `{ title, body, writerId?, seoTitle?, seoDescription? }` → creates content with status "draft"
   - **update_content** — `{ contentId, title?, body?, seoTitle?, seoDescription? }` → verifies org ownership, updates
   - **publish_content** — `{ contentId }` → verifies org ownership, publishes via `publishContent()`
   - **list_content** — `{ status?, limit? }` → uses `listContentsByOrganization()`
   - **get_writer** — `{ writerId }` → returns writer config (tone, voice, guidelines)
   - **list_writers** — `{}` → returns all writers for the org

2. Create `apps/sdk-server/src/mcp/handler.ts` — MCP request handler:
   ```typescript
   import { mcpHandler } from '@better-auth/oauth-provider';
   import { createMcpHandler } from 'mcp-handler';
   import { registerTools } from './tools';

   // The auth server URL (apps/web) for JWKS verification
   const AUTH_SERVER_URL = env.BETTER_AUTH_URL; // e.g. "https://app.contentta.co"

   export const mcpRequestHandler = mcpHandler({
     jwksUrl: `${AUTH_SERVER_URL}/api/auth/jwks`,
     verifyOptions: {
       issuer: AUTH_SERVER_URL,
       audience: env.SDK_SERVER_URL, // e.g. "https://sdk.contentta.com"
     },
   }, (req, jwt) => {
     return createMcpHandler(
       (server) => {
         const organizationId = jwt?.referenceId ?? jwt?.activeOrganizationId;
         const userId = jwt?.sub;
         if (organizationId && userId) {
           registerTools(server, organizationId, userId);
         }
       },
       {
         serverInfo: { name: 'contentta-mcp', version: '1.0.0' },
       },
       {
         basePath: '/mcp',
         verboseLogs: process.env.NODE_ENV !== 'production',
       },
     )(req);
   });
   ```

3. Mount in `apps/sdk-server/src/index.ts`:
   ```typescript
   import { mcpRequestHandler } from './mcp/handler';

   // Mount MCP endpoint (needs GET, POST, DELETE)
   app.all('/mcp', ({ request }) => mcpRequestHandler(request));
   app.all('/mcp/*', ({ request }) => mcpRequestHandler(request));
   ```

   Also add `Authorization` to CORS allowed headers.

4. Add protected resource metadata route:
   ```typescript
   app.get('/.well-known/oauth-protected-resource', () => ({
     resource: env.SDK_SERVER_URL,
     authorization_servers: [env.BETTER_AUTH_URL],
     scopes_supported: ["content:read", "content:write", "content:publish", "writer:read"],
   }));
   ```

5. Typecheck
6. Commit

---

## Task 7: Environment Variables

**Files:**
- Modify: `packages/environment/src/server.ts`

**Steps:**

1. Add new env vars to the server schema:
   - `BETTER_AUTH_URL` — The public URL of the auth server (apps/web), e.g. `https://app.contentta.co`
   - `SDK_SERVER_URL` — The public URL of the SDK server, e.g. `https://sdk.contentta.com`
   (These may already exist — check first)
2. Typecheck
3. Commit

---

## Task 8: End-to-End Testing

**Steps:**

1. Start both `apps/web` and `apps/sdk-server` locally
2. Verify well-known endpoints respond:
   - `GET /.well-known/oauth-authorization-server` (web app)
   - `GET /.well-known/oauth-protected-resource` (SDK server)
3. Create a test MCP client script (`apps/sdk-server/scripts/test-mcp-client.ts`) that:
   - Connects to `http://localhost:9877/mcp`
   - Follows OAuth flow (or uses a pre-created token for testing)
   - Lists tools
   - Calls `list_content`
4. Test in Claude Desktop:
   - Configure `~/.config/claude/mcp.json` with SDK server URL
   - Verify OAuth flow triggers (browser opens, user signs in, consents)
   - Verify tools appear and work
5. Document results
6. Commit

---

## Week 6 Checklist

- [ ] Dependencies installed (`@better-auth/oauth-provider`, `mcp-handler`)
- [ ] OAuth Provider plugin added to Better Auth config
- [ ] OAuth Provider client plugin added to auth client
- [ ] Database migrated (OAuth tables)
- [ ] Well-known OAuth routes on web app
- [ ] Consent page on web app
- [ ] MCP handler + 6 tools on SDK server
- [ ] Protected resource metadata on SDK server
- [ ] Environment variables added
- [ ] End-to-end testing verified
