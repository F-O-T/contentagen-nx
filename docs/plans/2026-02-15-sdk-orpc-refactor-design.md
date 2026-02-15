# SDK oRPC Contract-First Refactor

**Date:** 2026-02-15
**Status:** Approved
**Migration Strategy:** Big bang replacement (v2.0.0)

---

## Overview

Refactor the Contentta SDK library from a manual REST-based implementation to an oRPC contract-first architecture. This provides type-safe client generation, reduced boilerplate, and a single source of truth for API contracts.

### Current Architecture

- **Client SDK** (`libraries/sdk`): Manual fetch-based implementation with Zod schemas
- **Server** (`apps/sdk-server`): Elysia REST endpoints with custom auth macro
- **Issues**: Type duplication, manual synchronization, boilerplate

### Target Architecture

- **Single oRPC contract** defines all SDK operations
- **Elysia HTTP layer** handles server concerns (CORS, rate limiting)
- **oRPC layer** handles type safety, serialization, procedures
- **Clear separation**: Pure API (oRPC) vs browser features (separate clients)
- **Security model**: Private keys for server-side, public keys for browser

---

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Server Architecture** | Keep Elysia as HTTP layer | Preserve existing middleware and plugins |
| **Migration Strategy** | Big bang replacement | Cleaner final state, simpler architecture |
| **Auth Pattern** | oRPC middleware (`sdkProcedure`) | Matches existing `protectedProcedure` pattern in web app |
| **Contract Organization** | Single unified SDK router | Simpler API surface for SDK consumers |
| **Client API** | Functional client (`createSdk()`) | Modern, tree-shakeable, matches oRPC conventions |
| **Browser Features** | Separate from oRPC client | Security (public vs private keys), clear separation |
| **Package Name** | `@contentta/sdk` | Cleaner, more professional branding |
| **Event Tracking** | Full oRPC contracts | Consistency and type safety across all operations |

---

## Architecture Layers

```
┌─────────────────────────────────────────────────────┐
│  SDK Package (@contentta/sdk)                       │
├─────────────────────────────────────────────────────┤
│  • Main export: createSdk() → oRPC client           │
│  • Browser export: createFormsClient(), tracker     │
│  • Uses PRIVATE API keys (server-side/build-time)   │
│  • Browser clients use PUBLIC API keys              │
└─────────────────────────────────────────────────────┘
                         ↓
         HTTP requests with API key header
                         ↓
┌─────────────────────────────────────────────────────┐
│  SDK Server (apps/sdk-server)                       │
├─────────────────────────────────────────────────────┤
│  • Elysia HTTP server                               │
│  • POST /sdk/orpc → oRPC handler                    │
│  • oRPC router with middleware                      │
│  • Contract definition (single source of truth)     │
└─────────────────────────────────────────────────────┘
```

---

## Contract Structure

### SDK Router (`apps/sdk-server/src/orpc/router/sdk.ts`)

```typescript
import { z } from 'zod';
import { sdkProcedure, router } from '../server';

export const sdkRouter = router({
  // Content namespace
  content: router({
    list: sdkProcedure
      .input(z.object({
        agentId: z.string(),
        limit: z.number().min(1).max(100).optional(),
        page: z.number().min(1).optional(),
        status: z.array(z.enum(['draft', 'published', 'archived'])).optional(),
      }))
      .handler(async ({ input, context }) => {
        // Implementation
      }),

    get: sdkProcedure
      .input(z.object({
        agentId: z.string(),
        slug: z.string(),
      }))
      .handler(async ({ input, context }) => {
        // Implementation
      }),

    getImage: sdkProcedure
      .input(z.object({
        contentId: z.string(),
      }))
      .handler(async ({ input, context }) => {
        // Implementation
      }),
  }),

  // Forms namespace
  forms: router({
    get: sdkProcedure
      .input(z.object({
        formId: z.string().uuid(),
      }))
      .handler(async ({ input, context }) => {
        // Fetch form definition
      }),

    submit: sdkProcedure
      .input(z.object({
        formId: z.string().uuid(),
        data: z.record(z.unknown()),
        metadata: z.object({
          visitorId: z.string().optional(),
          sessionId: z.string().optional(),
          referrer: z.string().optional(),
          url: z.string().optional(),
        }).optional(),
      }))
      .handler(async ({ input, context }) => {
        // Validate and store submission
      }),
  }),

  // Events namespace
  events: router({
    track: sdkProcedure
      .input(z.object({
        eventName: z.string(),
        properties: z.record(z.unknown()).optional(),
        visitorId: z.string().optional(),
        sessionId: z.string().optional(),
      }))
      .handler(async ({ input, context }) => {
        // Track event via PostHog
      }),

    batch: sdkProcedure
      .input(z.object({
        events: z.array(z.object({
          eventName: z.string(),
          properties: z.record(z.unknown()).optional(),
          timestamp: z.string().datetime().optional(),
        })),
        visitorId: z.string().optional(),
        sessionId: z.string().optional(),
      }))
      .handler(async ({ input, context }) => {
        // Batch track multiple events
      }),
  }),
});

export type SdkRouter = typeof sdkRouter;
```

### Context Shape

```typescript
interface SdkContext {
  // Database & services
  db: DatabaseInstance;
  posthog: PostHog;

  // Auth & organization
  organizationId: string;
  teamId?: string;
  userId?: string;

  // API key metadata
  plan: PlanName;
  sdkMode: 'static' | 'ssr';
  remaining: number | null;
  apiKeyType: 'public' | 'private';
}
```

---

## Server Implementation

### oRPC Server Setup (`apps/sdk-server/src/orpc/server.ts`)

```typescript
import { ORPCError, createServer } from '@orpc/server';
import { auth } from '../integrations/auth';
import { db } from '../integrations/database';
import { posthog } from '../integrations/posthog';
import { checkDomainAllowed } from '../utils/sdk-auth';
import type { PlanName } from '@packages/stripe/constants';

interface BaseContext {
  db: typeof db;
  posthog: typeof posthog;
}

interface SdkContext extends BaseContext {
  organizationId: string;
  teamId?: string;
  plan: PlanName;
  sdkMode: 'static' | 'ssr';
  remaining: number | null;
  userId?: string;
  apiKeyType: 'public' | 'private';
}

export const orpc = createServer<BaseContext>({
  context: async () => ({ db, posthog }),
});

export const sdkProcedure = orpc.middleware(async ({ context, meta }) => {
  const request = meta?.request as Request;
  if (!request) {
    throw new ORPCError('UNAUTHORIZED', { message: 'Missing request context' });
  }

  const apiKeyHeader = request.headers.get('sdk-api-key');
  if (!apiKeyHeader) {
    throw new ORPCError('UNAUTHORIZED', { message: 'Missing API Key' });
  }

  // Verify API key via Better Auth
  const result = await auth.api.verifyApiKey({
    body: { key: apiKeyHeader },
  });

  if (!result.valid || !result.key) {
    const isRateLimited = result.error?.code === 'RATE_LIMITED';
    throw new ORPCError(
      isRateLimited ? 'TOO_MANY_REQUESTS' : 'UNAUTHORIZED',
      { message: isRateLimited ? 'Rate limit exceeded' : 'Invalid API Key' }
    );
  }

  const { plan, organizationId, sdkMode, teamId, apiKeyType } = result.key.metadata ?? {};

  // Check domain allowlist
  const resolvedTeamId = typeof teamId === 'string' ? teamId : undefined;
  const domainCheck = await checkDomainAllowed(request, resolvedTeamId, db);
  if (!domainCheck.allowed) {
    throw new ORPCError('FORBIDDEN', { message: 'Origin not allowed' });
  }

  return {
    ...context,
    organizationId: organizationId as string,
    teamId: resolvedTeamId,
    plan: (plan as PlanName) ?? 'FREE',
    sdkMode: (sdkMode as 'static' | 'ssr') ?? 'static',
    remaining: result.key.remaining,
    userId: result.key.userId,
    apiKeyType: (apiKeyType as 'public' | 'private') ?? 'private',
  };
});

export const router = orpc.router;
```

### Elysia Integration (`apps/sdk-server/src/index.ts`)

```typescript
import { Elysia } from 'elysia';
import { createElysiaHandler } from '@orpc/server/elysia';
import { sdkRouter } from './orpc/router/sdk';

const app = new Elysia()
  // Replace all /sdk/* REST routes with single oRPC endpoint
  .post('/sdk/orpc', createElysiaHandler(sdkRouter))
  .listen(3001);
```

---

## SDK Client Package

### Main Client (`libraries/sdk/src/index.ts`)

```typescript
import { createClient } from '@orpc/client';
import type { SdkRouter } from '../../apps/sdk-server/src/orpc/router/sdk';

const PRODUCTION_API_URL = 'https://api.contentagen.com';

export interface SdkConfig {
  apiKey: string;
  host?: string;
}

export function createSdk(config: SdkConfig) {
  const baseUrl = (config.host || PRODUCTION_API_URL).replace(/\/+$/, '');

  const client = createClient<SdkRouter>({
    baseURL: `${baseUrl}/sdk/orpc`,
    headers: {
      'sdk-api-key': config.apiKey,
    },
  });

  return client;
}

// Re-export types
export type { SdkRouter } from '../../apps/sdk-server/src/orpc/router/sdk';
```

### Browser Exports (`libraries/sdk/src/browser.ts`)

```typescript
import { createSdk } from './index';
import type { SdkConfig } from './index';

// Re-export forms client (refactored to use oRPC internally)
export { createFormsClient } from './forms';
export type { FormField, FormDefinition } from './forms';

// Re-export event tracker (refactored to use oRPC internally)
export { createTracker } from './events/client';
export type { ContenttaEventTracker, ContenttaSdkConfig } from './events/types';

// Browser-optimized SDK client
export function createBrowserSdk(config: SdkConfig) {
  return createSdk(config);
}
```

### Package Exports (`libraries/sdk/package.json`)

```json
{
  "name": "@contentta/sdk",
  "version": "2.0.0",
  "exports": {
    ".": {
      "bun": "./src/index.ts",
      "import": "./dist/index.js",
      "types": "./dist/index.d.ts"
    },
    "./browser": {
      "bun": "./src/browser.ts",
      "import": "./dist/browser.js",
      "types": "./dist/browser.d.ts"
    },
    "./analytics": {
      "bun": "./src/analytics.ts",
      "import": "./dist/analytics.js",
      "types": "./dist/analytics.d.ts"
    }
  }
}
```

---

## Usage Examples

### Server-Side (Private API Key)

```typescript
import { createSdk } from '@contentta/sdk';

const sdk = createSdk({
  apiKey: process.env.CONTENTTA_PRIVATE_KEY
});

// Fetch content
const { posts, total } = await sdk.content.list({
  agentId: 'agent-123',
  limit: 10,
  page: 1,
  status: ['published']
});

// Get single content
const content = await sdk.content.get({
  agentId: 'agent-123',
  slug: 'my-post'
});

// Get content image
const image = await sdk.content.getImage({
  contentId: 'content-456'
});
```

### Browser (Public API Key)

```typescript
import { createTracker, createFormsClient } from '@contentta/sdk/browser';

// Event tracking
const tracker = createTracker({
  apiKey: 'pk_live_xxx'
});

tracker.track('page.view', {
  path: '/blog/my-post',
  title: 'My Post'
});

// Forms
const forms = createFormsClient({
  apiKey: 'pk_live_xxx'
}, tracker);

await forms.embedForm('form-789', 'container-id');
```

---

## Migration Plan

### Phase 1: Server-Side Contract & Infrastructure

**Tasks:**
1. Install oRPC dependencies
   ```bash
   cd apps/sdk-server
   bun add @orpc/server
   cd ../../libraries/sdk
   bun add @orpc/client
   ```

2. Create oRPC server infrastructure
   - `apps/sdk-server/src/orpc/server.ts` - Base server + `sdkProcedure`
   - `apps/sdk-server/src/orpc/router/sdk.ts` - Unified SDK router

3. Migrate content endpoints
   - `content.list` - Port from `/content/:agentId`
   - `content.get` - Port from `/content/:agentId/:slug`
   - `content.getImage` - Port from `/content/image/:contentId`

4. Migrate forms endpoints
   - `forms.get` - Port from `/forms/:formId`
   - `forms.submit` - Port from `/forms/:formId/submit`

5. Migrate events endpoints
   - `events.track` - Port from `/events/track`
   - `events.batch` - New batch tracking endpoint

6. Update Elysia integration
   - Replace REST routes with `POST /sdk/orpc`
   - Remove old route files (`routes/sdk.ts`, `routes/sdk-forms.ts`, `routes/sdk-events.ts`)

**Estimated: 4-6 hours**

---

### Phase 2: SDK Client Package

**Tasks:**
1. Update package metadata
   - Rename: `@f-o-t/contentta-sdk` → `@contentta/sdk`
   - Bump version: `2.0.0`
   - Update package.json exports

2. Replace class-based API
   - Remove `ContentaGenSDK` class from `src/index.ts`
   - Implement `createSdk()` functional client
   - Re-export `SdkRouter` type from server

3. Refactor event tracker (`src/events/client.ts`)
   - Update to call `sdk.events.track()` internally
   - Keep same public API (`tracker.track()`)
   - Add batch support using `sdk.events.batch()`

4. Refactor forms client (`src/forms.ts`)
   - Update to call `sdk.forms.get()` and `sdk.forms.submit()`
   - Keep DOM manipulation logic unchanged
   - Update error handling for ORPCError

5. Create browser entry (`src/browser.ts`)
   - Export `createTracker`, `createFormsClient`
   - Export `createBrowserSdk` for direct oRPC usage

**Estimated: 3-4 hours**

---

### Phase 3: Breaking Changes & Version Bump

**Tasks:**
1. Document breaking changes
   - Package name change
   - API surface change (class → functional)
   - Import path changes
   - Method name changes

2. Write migration guide
   - Update README.md
   - Add MIGRATION.md with code examples
   - Document new vs old API side-by-side

3. Update TypeScript types
   - Ensure all types are properly exported
   - Remove old schemas/types that are now generated

**Estimated: 1-2 hours**

---

### Phase 4: Testing & Rollout

**Tasks:**
1. Update SDK tests
   - Rewrite `__tests__/sdk-client.test.ts` for new API
   - Add tests for `content.*`, `forms.*`, `events.*`
   - Test error handling (ORPCError)

2. Update internal usage
   - Search codebase for `@f-o-t/contentta-sdk` imports
   - Update to new package name and API
   - Test in development environment

3. Publish to npm
   - Build: `bun run build`
   - Publish: `bun run release` (bumpp handles git tag + npm publish)
   - Verify on npmjs.com

4. Update documentation
   - Update API docs website (if exists)
   - Update code examples in marketing site
   - Notify users via changelog/blog post

**Estimated: 2-3 hours**

---

## Breaking Changes Summary

| Old API | New API | Notes |
|---------|---------|-------|
| `@f-o-t/contentta-sdk` | `@contentta/sdk` | Package renamed |
| `new ContentaGenSDK({ ... })` | `createSdk({ ... })` | Functional API |
| `sdk.listContentByAgent({ ... })` | `sdk.content.list({ ... })` | Namespaced |
| `sdk.getContentBySlug({ ... })` | `sdk.content.get({ ... })` | Namespaced |
| `sdk.getContentImage({ ... })` | `sdk.content.getImage({ ... })` | Namespaced |
| `import { ... } from '@f-o-t/contentta-sdk/events'` | `import { ... } from '@contentta/sdk/browser'` | Path changed |
| `import { ... } from '@f-o-t/contentta-sdk/forms'` | `import { ... } from '@contentta/sdk/browser'` | Path changed |

---

## Estimated Effort

- **Phase 1** (Server): ~4-6 hours
- **Phase 2** (Client): ~3-4 hours
- **Phase 3** (Breaking changes): ~1-2 hours
- **Phase 4** (Testing): ~2-3 hours
- **Total: ~10-15 hours**

---

## Success Criteria

- ✅ All SDK operations use oRPC contracts
- ✅ Single source of truth for API types
- ✅ Reduced code duplication between client/server
- ✅ Type-safe client generation working
- ✅ Browser clients (forms + events) using oRPC internally
- ✅ All existing SDK functionality preserved
- ✅ Tests passing
- ✅ Published to npm as `@contentta/sdk@2.0.0`

---

## Future Enhancements

After v2.0.0 ships, consider:

1. **Streaming support** - oRPC supports streaming responses for large content lists
2. **React hooks** - Generate `useSdk()` hooks for React apps
3. **Webhook verification** - Add SDK helper for webhook signature validation
4. **SDK telemetry** - Track SDK usage patterns via PostHog
5. **Better errors** - Rich error types with retry logic
