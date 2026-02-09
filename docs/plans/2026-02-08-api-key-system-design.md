# API Key System Redesign

> Date: 2026-02-08
> Status: Draft
> Scope: Public keys, personal keys, SDK changes, scope system

---

## Overview

Contentta currently uses a single API key type (SDK key) for everything: content fetching, event tracking, and form embedding. This redesign splits it into two distinct key types following PostHog's proven model — a **public project key** for client-side write operations and a **personal API key** for server-side authenticated access.

---

## Key Types

### 1. Public Project Key (`cta_pub_`)

**Security: PUBLIC.** Safe to embed in frontend JavaScript, `<script>` tags, and client-side bundles.

| Property | Value |
|----------|-------|
| Prefix | `cta_pub_` |
| Tied to | Organization (one per org, auto-generated) |
| Access | Write-only |
| Auth method | `X-API-Key` header or request body (`api_key` field) |
| Rate limited | No (or very generous) |
| Scopes | Fixed — event capture + form submission only |
| Created | Automatically when organization is created |
| Visible | Project Settings > General, onboarding wizard |

**Capabilities:**
- Capture custom events (`POST /sdk/events`)
- Submit form responses (`POST /sdk/forms/:formId/submit`)
- Fetch form definitions for embedding (`GET /sdk/forms/:formId`)

**Limitations:**
- Cannot read content, agents, analytics, or any private data
- Cannot perform CRUD operations on any resource
- Cannot be used for SDK content fetching

**Where it is used:**
- `ContenttaEventTracker` (client-side event tracking)
- `ContenttaFormsClient` (form embedding and submission)
- `ContenttaServerClient` (server-side event emission)
- `BlogAnalyticsTracker` tracking scripts (if migrated from PostHog direct capture)

### 2. Personal API Key (`cta_`)

**Security: SECRET.** Must never be exposed in frontend code, client-side bundles, or public repositories.

| Property | Value |
|----------|-------|
| Prefix | `cta_` |
| Tied to | User account |
| Access | Read + Write (scoped) |
| Auth method | `Authorization: Bearer cta_xxxx` header |
| Rate limited | Yes, by plan (FREE=100/min, LITE=1,000/min, PRO=10,000/min) |
| Scopes | Granular per-resource (15 resources, 3 states each) |
| Created | Manually by user in Personal Settings > API Keys |
| Visible | Shown once on creation, then masked |

**Capabilities:**
- Content fetching (`GET /sdk/content/:agentId`, `GET /sdk/content/:agentId/:slug`)
- Full API CRUD access (filtered by scopes)
- Everything the public key can do, plus read access

**Where it is used:**
- `ContentaGenSDK` (content fetching — server-side only)
- CI/CD pipelines, automation scripts
- Next.js `getStaticProps` / `generateStaticParams`
- Third-party integrations (Zapier, custom backends)

---

## Scope System

Personal API keys use resource-level scopes. Each scope resource has three states: **No access**, **Read**, **Write** (write implies read).

### Scope Resources

| Resource | Read | Write |
|----------|------|-------|
| **Content** | List, get by slug/id | Create, update, delete |
| **Agent** | List, get config | Create, update, delete |
| **Brand** | Get brand settings | Update brand settings |
| **Brand document** | List, get | Upload, delete |
| **Form** | List, get | Create, update, delete |
| **Form submission** | List, export | — |
| **Chat** | List, get history | Create, send messages |
| **Insight** | List, get, run | Create, update, delete |
| **Dashboard** | List, get | Create, update, delete |
| **Organization** | Get | Update |
| **Member** | List | Invite, remove, change role |
| **Team** | List, get | Create, update, delete |
| **Webhook** | List, get | Create, update, delete |
| **Event** | List, query | — |
| **Export** | List history | Trigger export |

### Organization Access

Personal keys can be scoped to specific organizations:

- **All access** — Key works across all orgs the user is a member of
- **Specific organizations** — Key only works for selected orgs

### Presets

Common scope configurations available as one-click presets:

| Preset | Scopes |
|--------|--------|
| **Full access** | All resources -> Write |
| **Read only** | All resources -> Read |
| **Content SDK** | Content:read, Agent:read, Brand:read, Export:read |
| **Analytics** | Insight:read, Dashboard:read, Event:read |
| **Form management** | Form:write, Form submission:read |

---

## SDK Changes

### Before (current)

One key type used everywhere:

```typescript
// Client-side (event tracking) — uses SDK key
const tracker = new ContenttaEventTracker({
  apiKey: "contentta_xxxx",  // SDK key (has read+write access)
  organizationId: "org_123",
});

// Server-side (content fetching) — same SDK key
const sdk = new ContentaGenSDK({
  apiKey: "contentta_xxxx",  // Same key, also reads content
});
```

### After (new model)

Two key types, clean separation:

```typescript
// Client-side (event tracking) — public key, safe to expose
const tracker = new ContenttaEventTracker({
  apiKey: "cta_pub_xxxx",  // Public key (write-only)
  organizationId: "org_123",
});

// Client-side (form embedding) — public key
const forms = new ContenttaFormsClient({
  apiKey: "cta_pub_xxxx",  // Public key (write-only)
  organizationId: "org_123",
});

// Server-side (content fetching) — personal key, keep secret
const sdk = new ContentaGenSDK({
  apiKey: "cta_xxxx",  // Personal key (scoped read access)
});
```

### SDK Class -> Key Type Mapping

| SDK Class | Key Type | Environment | Purpose |
|-----------|----------|-------------|---------|
| `ContenttaEventTracker` | Public key | Client-side | Event capture |
| `ContenttaFormsClient` | Public key | Client-side | Form embed + submit |
| `ContenttaServerClient` | Public key | Server-side | Server event emission |
| `ContentaGenSDK` | Personal key | Server-side | Content fetching |

### Auth Header Changes

| Key Type | Current | New |
|----------|---------|-----|
| Public key | `sdk-api-key: contentta_xxxx` | `X-API-Key: cta_pub_xxxx` |
| Personal key | N/A | `Authorization: Bearer cta_xxxx` |

The `sdk-api-key` header is kept as a fallback for backward compatibility during migration.

---

## Server-Side Routing Changes

### Public Endpoints (public key auth)

These endpoints accept the public key via `X-API-Key` header:

```
POST /sdk/events              — Event batch capture
GET  /sdk/forms/:formId       — Fetch form definition (for embedding)
POST /sdk/forms/:formId/submit — Submit form response
```

### Private Endpoints (personal key auth)

These endpoints require `Authorization: Bearer cta_xxxx` and enforce scopes:

```
GET  /sdk/content/:agentId              — List content by agent (scope: content:read)
GET  /sdk/content/:agentId/:slug        — Get content by slug (scope: content:read)
GET  /sdk/content/image/:contentId      — Get content image (scope: content:read)
```

Future private endpoints (API v2) will follow the same pattern for all resources.

---

## Public Key Lifecycle

1. **Auto-generated** when an organization is created (`createDefaultOrganization`)
2. **Stored** in a new `public_api_key` column on the `organization` table (or a dedicated table)
3. **Shown** in Project Settings > General and during onboarding
4. **Regeneratable** by org owner/admin (invalidates the old key)
5. **Never expires** (but can be regenerated)

Format: `cta_pub_` + 32 random alphanumeric characters.

---

## Personal Key Lifecycle

1. **Created** by user in Personal Settings > API Keys
2. **Shown once** on creation — user must copy it immediately
3. **Stored** as a hash (never stored in plaintext after creation)
4. **Revocable** at any time by the user
5. **Auto-deleted** when user account is deleted
6. **Multiple keys** per user allowed (each with different scopes/labels)

Format: `cta_` + 40 random alphanumeric characters.

---

## Migration Path

1. Existing SDK keys (`contentta_xxxx`) continue to work with both read and write access
2. New public keys (`cta_pub_xxxx`) are generated for all existing organizations
3. SDK v2 documentation guides users to migrate to the two-key model
4. Deprecation warning added to old key format
5. Old keys sunset after SDK v3 release
